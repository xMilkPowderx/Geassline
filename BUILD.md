# Build Geassline locally

Produces `desktop/dist/Geassline/electron.exe` and `desktop/dist/Geassline-windows-x64.zip`.

## Requirements

- Node.js 22 or newer (`node -v`)
- npm (comes with Node)
- Python 3 (`python3` or `py -3`) — used only to write the zip
- On Linux/macOS: `unzip`
- On Windows: `tar` (included with Windows 10+)
- Network once, to download Electron 32.3.3 if it is not cached (~100 MB)

The app **runs** on Windows. You can **pack** the zip from Windows, Linux, or macOS.

To use SSH and FIDO2 when you run the app:

- Windows Optional Feature **OpenSSH Client**
- FIDO2 keys as files such as `id_ed25519_sk` (`ssh-keygen -t ed25519-sk`)

## Install

```bash
git clone <your-repo-url> geassline
cd geassline
npm install
```

## Pack

```bash
npm run pack:windows
```

This will:

1. Build the desktop UI with Vite
2. Download Electron `v32.3.3` win32-x64 into `desktop/.cache/` (skipped if already present)
3. Pack `desktop/electron/*.cjs` and the UI into `resources/app.asar`
4. Copy the official GitHub-signed `electron.exe` (do not rename it)
5. Zip `desktop/dist/Geassline-windows-x64.zip`

Extract the zip on a Windows PC and run `electron.exe`. The window title is Geassline.

### Offline Electron

If GitHub downloads are blocked, put this file in place first:

`desktop/.cache/electron-v32.3.3-win32-x64.zip`

from [Electron 32.3.3 win32-x64](https://github.com/electron/electron/releases/download/v32.3.3/electron-v32.3.3-win32-x64.zip)

## Check types

```bash
npm run typecheck
```

## Layout

| Path | Role |
| --- | --- |
| `src/` | UI (React). Desktop entry is `src/desktop-entry.tsx` |
| `desktop/electron/main.cjs` | Electron main process |
| `desktop/electron/preload.cjs` | IPC bridge |
| `desktop/electron/ssh.cjs` | Windows OpenSSH sessions, files, tunnels |
| `desktop/electron/ssh-config.cjs` | Read/write SSH config host blocks |
| `scripts/pack-electron-windows.mjs` | Packer |
| `scripts/geassline-icon.py` | App icon PNG/ICO |
| `vite.desktop.config.ts` | Desktop UI build |

The running window uses `desktop/electron/icon.ico`. Do not run `scripts/embed-windows-icon.mjs` on `electron.exe` unless you re-sign with your own Authenticode certificate afterward.

## Git ignore

`desktop/dist/`, `desktop/.cache/`, `desktop/electron/ui/`, and `node_modules/` are generated. Do not commit them.
