const { app, BrowserWindow, ipcMain, session, shell, dialog, Menu, clipboard } = require("electron");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const ssh = require("./ssh.cjs");
const sshConfigFile = require("./ssh-config.cjs");

// Windows OpenSSH (ssh.exe) can AllocConsole when starting a TTY. That console
// attach blanks Chromium's GPU surface in a frameless Electron window.
app.disableHardwareAcceleration();
app.commandLine.appendSwitch("disable-gpu-sandbox");
app.commandLine.appendSwitch("in-process-gpu");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".json": "application/json",
  ".map": "application/json",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
};

function expandHome(value, home) {
  let out = String(value || "").trim().replace(/^"|"$/g, "");
  if (!out) return out;
  if (out === "~") return home;
  if (out.startsWith("~/") || out.startsWith("~\\")) return path.join(home, out.slice(2));
  out = out.replace(/%USERPROFILE%/gi, home);
  out = out.replace(/%HOME%/gi, home);
  return out;
}

function readIncluded(file, home, seen) {
  const resolved = path.resolve(expandHome(file, home));
  if (seen.has(resolved)) return "";
  seen.add(resolved);
  let text = "";
  try {
    text = fs.readFileSync(resolved, "utf8");
  } catch {
    return "";
  }
  const dir = path.dirname(resolved);
  const out = [];
  for (const raw of text.split(/\r?\n/)) {
    const trimmed = raw.replace(/#.*$/, "").trim();
    const inc = trimmed.match(/^Include\s+(.+)$/i);
    if (inc) {
      let pattern = expandHome(inc[1], home);
      if (!path.isAbsolute(pattern)) pattern = path.join(dir, pattern);
      let matches = [];
      try {
        matches = fs.globSync(pattern, { windowsPathsNoEscape: true });
      } catch {
        matches = [];
      }
      if (!matches.length && !/[?*\[]/.test(pattern)) matches = [pattern];
      for (const nested of matches.sort()) out.push(readIncluded(nested, home, seen));
      continue;
    }
    const ident = raw.match(/^(\s*IdentityFile\s+)(.+)$/i);
    if (ident) {
      out.push(ident[1] + expandHome(ident[2], home));
      continue;
    }
    out.push(raw);
  }
  return out.join("\n");
}

function listKeyFiles(home) {
  const dir = path.join(home, ".ssh");
  const keys = [];
  try {
    for (const name of fs.readdirSync(dir)) {
      if (name.endsWith(".pub")) continue;
      if (!/^id_[A-Za-z0-9._-]+$/.test(name) && !name.endsWith("_sk")) continue;
      const full = path.join(dir, name);
      let stat;
      try {
        stat = fs.statSync(full);
      } catch {
        continue;
      }
      if (!stat.isFile()) continue;
      keys.push({ name, path: full });
    }
  } catch {
    /* no .ssh dir */
  }
  return keys;
}

function defaultConfigPath() {
  return path.join(app.getPath("home"), ".ssh", "config");
}

function resolveConfigPath(requested) {
  const home = app.getPath("home");
  const raw = String(requested || "").trim();
  if (!raw) return defaultConfigPath();
  return path.resolve(expandHome(raw, home));
}

function readSshConfig(requested) {
  const home = app.getPath("home");
  const configPath = resolveConfigPath(requested);
  const missing = !fs.existsSync(configPath);
  const text = missing ? "" : readIncluded(configPath, home, new Set());
  return {
    ok: true,
    path: configPath,
    text,
    missing,
    keys: listKeyFiles(home),
    home,
  };
}

function ensureSshDir() {
  const dir = path.join(app.getPath("home"), ".ssh");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function readRawConfig(configPath) {
  try {
    return fs.readFileSync(configPath, "utf8");
  } catch {
    return "";
  }
}

function writeRawConfig(configPath, text) {
  ensureSshDir();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, text.endsWith("\n") ? text : `${text}\n`, "utf8");
}

function upsertHostFile(payload) {
  const configPath = resolveConfigPath(payload?.path);
  const next = sshConfigFile.upsertSshHostBlock(readRawConfig(configPath), payload?.host || {});
  writeRawConfig(configPath, next);
  return readSshConfig(configPath);
}

function removeHostFile(payload) {
  const configPath = resolveConfigPath(payload?.path);
  const next = sshConfigFile.removeSshHostBlock(readRawConfig(configPath), payload?.alias || "");
  writeRawConfig(configPath, next);
  return readSshConfig(configPath);
}

async function pickConfig(win) {
  const picked = await dialog.showOpenDialog(win, {
    title: "SSH config file",
    defaultPath: defaultConfigPath(),
    properties: ["openFile"],
    filters: [
      { name: "Config", extensions: ["config", "*"] },
      { name: "All files", extensions: ["*"] },
    ],
  });
  if (picked.canceled || !picked.filePaths[0]) return { cancelled: true };
  const configPath = picked.filePaths[0];
  return { ...readSshConfig(configPath), cancelled: false };
}

function winKeygen() {
  return path.join(process.env.SystemRoot || "C:\\Windows", "System32", "OpenSSH", "ssh-keygen.exe");
}

function generateKey(requestedName) {
  const dir = ensureSshDir();
  let base = String(requestedName || "id_ed25519").replace(/[^A-Za-z0-9._-]+/g, "_");
  if (!base) base = "id_ed25519";
  let dest = path.join(dir, base);
  if (fs.existsSync(dest)) dest = path.join(dir, `${base}_geassline`);
  const bin = winKeygen();
  if (!fs.existsSync(bin)) throw new Error("Windows OpenSSH ssh-keygen.exe not found");
  const result = spawnSync(bin, ["-t", "ed25519", "-f", dest, "-N", "", "-C", "geassline"], {
    windowsHide: true,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "ssh-keygen failed").trim());
  }
  return { name: path.basename(dest), path: dest };
}

async function importKey(win) {
  const dir = ensureSshDir();
  const picked = await dialog.showOpenDialog(win, {
    title: "Import private key",
    defaultPath: dir,
    properties: ["openFile"],
  });
  if (picked.canceled || !picked.filePaths[0]) return { cancelled: true };
  const src = picked.filePaths[0];
  const name = path.basename(src);
  const dest = path.join(dir, name);
  if (path.resolve(src) !== path.resolve(dest)) fs.copyFileSync(src, dest);
  const pub = `${src}.pub`;
  if (fs.existsSync(pub) && path.resolve(pub) !== path.resolve(`${dest}.pub`)) {
    try {
      fs.copyFileSync(pub, `${dest}.pub`);
    } catch {
      /* ignore */
    }
  }
  return { cancelled: false, name, path: dest };
}

function startUiServer(uiRoot) {
  const root = path.resolve(uiRoot);
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || "/", "http://127.0.0.1");
      let rel = decodeURIComponent(url.pathname);
      if (rel === "/") rel = "/index.html";
      const file = path.resolve(root, `.${rel}`);
      if (!file.startsWith(root)) {
        res.writeHead(403);
        res.end();
        return;
      }
      fs.readFile(file, (err, data) => {
        if (err) {
          if (path.extname(rel) === "") {
            fs.readFile(path.join(root, "index.html"), (e2, html) => {
              if (e2) {
                res.writeHead(404);
                res.end("Geassline UI missing");
                return;
              }
              res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
              res.end(html);
            });
            return;
          }
          res.writeHead(404);
          res.end();
          return;
        }
        const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
        res.writeHead(200, { "content-type": type });
        res.end(data);
      });
    });
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function attachWindow(win) {
  ipcMain.removeHandler("ssh:readConfig");
  ipcMain.removeHandler("ssh:upsertHost");
  ipcMain.removeHandler("ssh:removeHost");
  ipcMain.removeHandler("ssh:pickConfig");
  ipcMain.removeHandler("ssh:generateKey");
  ipcMain.removeHandler("ssh:importKey");
  ipcMain.handle("ssh:readConfig", (_e, requested) => readSshConfig(requested));
  ipcMain.handle("ssh:upsertHost", (_e, payload) => upsertHostFile(payload));
  ipcMain.handle("ssh:removeHost", (_e, payload) => removeHostFile(payload));
  ipcMain.handle("ssh:pickConfig", () => pickConfig(win));
  ipcMain.handle("ssh:generateKey", (_e, name) => generateKey(name));
  ipcMain.handle("ssh:importKey", () => importKey(win));
  ipcMain.removeHandler("term:context-menu");
  ipcMain.handle("term:context-menu", (e, payload) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    const selection = String(payload?.selection || "");
    return new Promise((resolve) => {
      let action = "dismiss";
      const menu = Menu.buildFromTemplate([
        {
          label: "Copy",
          enabled: selection.length > 0,
          click: () => {
            clipboard.writeText(selection);
            action = "copy";
          },
        },
        {
          label: "Paste",
          click: () => {
            action = "paste";
          },
        },
      ]);
      menu.popup({
        window: win || undefined,
        callback: () => resolve({ action, text: clipboard.readText() }),
      });
    });
  });
  ssh.detach(ipcMain);
  ssh.attach(ipcMain);
  ipcMain.removeAllListeners("win:minimize");
  ipcMain.removeAllListeners("win:maximize");
  ipcMain.removeAllListeners("win:close");
  ipcMain.on("win:minimize", () => win.minimize());
  ipcMain.on("win:maximize", () => {
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });
  ipcMain.on("win:close", () => win.close());
}

async function createWindow() {
  const uiRoot = path.join(__dirname, "ui");
  if (!fs.existsSync(path.join(uiRoot, "index.html"))) {
    throw new Error("Geassline UI is missing from this package");
  }

  const server = await startUiServer(uiRoot);
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  const origin = `http://127.0.0.1:${port}`;

  const iconFile = [path.join(process.resourcesPath || __dirname, "icon.ico"), path.join(__dirname, "icon.ico")].find((p) =>
    fs.existsSync(p),
  );
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 880,
    minHeight: 560,
    backgroundColor: "#090a0b",
    autoHideMenuBar: true,
    show: false,
    frame: false,
    icon: fs.existsSync(iconFile) ? iconFile : undefined,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: false,
    },
  });

  attachWindow(win);
  win.once("ready-to-show", () => win.show());
  win.webContents.on("render-process-gone", (_event, details) => {
    console.error("renderer gone", details);
    if (!win.isDestroyed()) win.reload();
  });
  app.on("child-process-gone", (_event, details) => {
    console.error("child process gone", details);
  });
  win.on("closed", () => {
    server.close();
    ipcMain.removeAllListeners("win:minimize");
    ipcMain.removeAllListeners("win:maximize");
    ipcMain.removeAllListeners("win:close");
    ipcMain.removeHandler("ssh:readConfig");
    ipcMain.removeHandler("ssh:upsertHost");
    ipcMain.removeHandler("ssh:removeHost");
    ipcMain.removeHandler("ssh:pickConfig");
    ipcMain.removeHandler("ssh:generateKey");
    ipcMain.removeHandler("ssh:importKey");
    ipcMain.removeHandler("term:context-menu");
    void ssh.detach(ipcMain);
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(origin)) return { action: "allow" };
    void shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(origin) && !url.startsWith("devtools:")) event.preventDefault();
  });

  session.defaultSession.webRequest.onBeforeRequest({ urls: ["*://*/*"] }, (details, cb) => {
    const url = details.url;
    if (
      url.startsWith(origin) ||
      url.startsWith("devtools:") ||
      url.startsWith("data:") ||
      url.startsWith("blob:") ||
      url.startsWith("ws://127.0.0.1")
    ) {
      cb({});
      return;
    }
    cb({ cancel: true });
  });

  await win.loadURL(`${origin}/`);
}

app.setName("Geassline");
app.setAppUserModelId("com.geassline.app");
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  return createWindow();
}).catch((err) => {
  console.error(err);
  app.quit();
});
app.on("window-all-closed", () => app.quit());
