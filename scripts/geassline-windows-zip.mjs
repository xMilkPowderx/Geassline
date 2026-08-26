import { createReadStream, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
export const WINDOWS_ZIP_PATH = join(root, "desktop/dist/Geassline-windows-x64.zip");

export function windowsZipAvailable() {
  return existsSync(WINDOWS_ZIP_PATH);
}

export function sendWindowsZip(req, res) {
  if (!windowsZipAvailable()) {
    res.statusCode = 404;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end("Geassline Desktop package is not built yet.");
    return;
  }
  const { size } = statSync(WINDOWS_ZIP_PATH);
  res.statusCode = 200;
  res.setHeader("content-type", "application/zip");
  res.setHeader("content-disposition", 'attachment; filename="Geassline-windows-x64.zip"');
  res.setHeader("content-length", String(size));
  res.setHeader("cache-control", "no-store");
  createReadStream(WINDOWS_ZIP_PATH).pipe(res);
}
