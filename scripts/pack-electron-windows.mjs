#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { createPackage } from "@electron/asar";

const ELECTRON_VERSION = "32.3.3";
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const electronDir = join(root, "desktop/electron");
const uiDir = join(electronDir, "ui");
const distDir = join(root, "desktop/dist/Geassline");
const zipPath = join(root, "desktop/dist/Geassline-windows-x64.zip");
const cacheDir = join(root, "desktop/.cache");
const cachedZip = join(cacheDir, `electron-v${ELECTRON_VERSION}-win32-x64.zip`);
const sandboxZip = "/tmp/electron-dl/electron-win32-x64.zip";
const electronUrl = `https://github.com/electron/electron/releases/download/v${ELECTRON_VERSION}/electron-v${ELECTRON_VERSION}-win32-x64.zip`;
const viteBin = join(root, "node_modules/vite/bin/vite.js");

async function ensureElectronZip() {
  if (existsSync(cachedZip)) return cachedZip;
  if (existsSync(sandboxZip)) return sandboxZip;
  mkdirSync(cacheDir, { recursive: true });
  console.log("Downloading Electron", ELECTRON_VERSION);
  const res = await fetch(electronUrl, { redirect: "follow" });
  if (!res.ok || !res.body) {
    throw new Error(`Could not download Electron (${res.status}). Get ${electronUrl} and save it as ${cachedZip}`);
  }
  await pipeline(Readable.fromWeb(res.body), createWriteStream(cachedZip));
  return cachedZip;
}

function pythonBin() {
  for (const bin of ["python3", "python"]) {
    try {
      execFileSync(bin, ["-c", "import zipfile"], { stdio: "ignore" });
      return bin;
    } catch {
      /* try next */
    }
  }
  throw new Error("Python 3 is required to write the zip (python3 or python on PATH)");
}

function unzip(zip, dest) {
  mkdirSync(dest, { recursive: true });
  if (process.platform === "win32") {
    execFileSync("tar", ["-xf", zip, "-C", dest], { stdio: "inherit" });
    return;
  }
  execFileSync("unzip", ["-q", "-o", zip, "-d", dest], { stdio: "inherit" });
}

execFileSync(pythonBin(), [join(root, "scripts/geassline-icon.py")], {
  cwd: root,
  stdio: "inherit",
});
execFileSync(process.execPath, [viteBin, "build", "--config", join(root, "vite.desktop.config.ts")], {
  cwd: root,
  stdio: "inherit",
});

if (!existsSync(join(uiDir, "index.html"))) {
  console.error("Desktop UI build did not produce index.html");
  process.exit(1);
}

const electronExtract = join(cacheDir, "electron-win32-x64");
if (!existsSync(join(electronExtract, "electron.exe"))) {
  const electronZip = await ensureElectronZip();
  unzip(electronZip, electronExtract);
}
mkdirSync(distDir, { recursive: true });
if (!existsSync(join(distDir, "electron.exe")) || !existsSync(join(distDir, "chrome_100_percent.pak"))) {
  cpSync(electronExtract, distDir, { recursive: true });
}
copyFileSync(join(electronExtract, "electron.exe"), join(distDir, "electron.exe"));
if (existsSync(join(distDir, "Geassline.exe"))) rmSync(join(distDir, "Geassline.exe"));
const defaultAsar = join(distDir, "resources/default_app.asar");
if (existsSync(defaultAsar)) rmSync(defaultAsar);
const locales = join(distDir, "locales");
if (existsSync(locales)) {
  for (const name of readdirSync(locales)) {
    if (name !== "en-US.pak") rmSync(join(locales, name));
  }
}

const appDir = join(distDir, "resources/app");
mkdirSync(appDir, { recursive: true });
for (const name of ["package.json", "main.cjs", "preload.cjs", "ssh.cjs", "ssh-config.cjs", "icon.ico", "icon.png", "askpass.cmd"]) {
  const src = join(electronDir, name);
  if (existsSync(src)) copyFileSync(src, join(appDir, name));
}
rmSync(join(appDir, "node_modules"), { recursive: true, force: true });
rmSync(join(appDir, "ui"), { recursive: true, force: true });
cpSync(uiDir, join(appDir, "ui"), { recursive: true });
rmSync(join(appDir, "ui", "__grok"), { recursive: true, force: true });
if (existsSync(join(appDir, "config.json"))) rmSync(join(appDir, "config.json"));

const asarPath = join(distDir, "resources/app.asar");
if (existsSync(asarPath)) rmSync(asarPath);
await createPackage(appDir, asarPath);
rmSync(appDir, { recursive: true, force: true });

writeFileSync(
  join(distDir, "README.txt"),
  [
    "Geassline Desktop for Windows",
    "================================",
    "",
    "Standalone offline SSH workstation. No internet required to start.",
    "",
    "1. Unzip this folder anywhere.",
    "2. Double-click electron.exe. The window title is Geassline.",
    "3. Hosts in %USERPROFILE%\\.ssh\\config appear automatically.",
    "",
    "The launcher is the official Electron binary (GitHub-signed).",
    "Requires Windows OpenSSH Client (Optional Features).",
    "If SmartScreen appears: More info → Run anyway.",
    "",
  ].join("\r\n"),
);

execFileSync(
  pythonBin(),
  [
    "-c",
    `
import zipfile, os
src = ${JSON.stringify(distDir)}
out = ${JSON.stringify(zipPath)}
os.makedirs(os.path.dirname(out), exist_ok=True)
with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for root, dirs, files in os.walk(src):
        for f in files:
            path = os.path.join(root, f)
            rel = os.path.join("Geassline", os.path.relpath(path, src)).replace("\\\\", "/")
            z.write(path, rel)
print("wrote", out, os.path.getsize(out))
`,
  ],
  { stdio: "inherit" },
);

console.log("packed", distDir);
console.log("zip", zipPath);
