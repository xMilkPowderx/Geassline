const { contextBridge, ipcRenderer, clipboard } = require("electron");

contextBridge.exposeInMainWorld("geasslineDesktop", {
  offline: true,
  liveSsh: true,
  minimize: () => ipcRenderer.send("win:minimize"),
  maximize: () => ipcRenderer.send("win:maximize"),
  close: () => ipcRenderer.send("win:close"),
  readSshConfig: (configPath) => ipcRenderer.invoke("ssh:readConfig", configPath || ""),
  upsertSshHost: (payload) => ipcRenderer.invoke("ssh:upsertHost", payload),
  removeSshHost: (payload) => ipcRenderer.invoke("ssh:removeHost", payload),
  pickSshConfig: () => ipcRenderer.invoke("ssh:pickConfig"),
  generateSshKey: (name) => ipcRenderer.invoke("ssh:generateKey", name || ""),
  importSshKey: () => ipcRenderer.invoke("ssh:importKey"),
  clipboardRead: () => clipboard.readText(),
  clipboardWrite: (text) => clipboard.writeText(String(text || "")),
  termContextMenu: (payload) => ipcRenderer.invoke("term:context-menu", payload || {}),
  ssh: {
    connect: (opts) => ipcRenderer.invoke("ssh:connect", opts),
    status: (sessionId) => ipcRenderer.invoke("ssh:status", sessionId),
    write: (sessionId, data) => ipcRenderer.invoke("ssh:write", sessionId, data),
    resize: (sessionId, cols, rows) => ipcRenderer.invoke("ssh:resize", sessionId, cols, rows),
    disconnect: (sessionId) => ipcRenderer.invoke("ssh:disconnect", sessionId),
    list: (sessionId, dir) => ipcRenderer.invoke("ssh:list", sessionId, dir),
    read: (sessionId, filePath) => ipcRenderer.invoke("ssh:read", sessionId, filePath),
    writeFile: (sessionId, filePath, content) => ipcRenderer.invoke("ssh:writeFile", sessionId, filePath, content),
    mkdir: (sessionId, dirPath) => ipcRenderer.invoke("ssh:mkdir", sessionId, dirPath),
    remove: (sessionId, filePath, recursive) => ipcRenderer.invoke("ssh:remove", sessionId, filePath, recursive),
    sudo: (sessionId, password) => ipcRenderer.invoke("ssh:sudo", sessionId, password || ""),
    unsudo: (sessionId) => ipcRenderer.invoke("ssh:unsudo", sessionId),
    download: (sessionId, remotePath, isDir) => ipcRenderer.invoke("ssh:download", sessionId, remotePath, !!isDir),
    forwardLocal: (sessionId, tun) => ipcRenderer.invoke("ssh:forwardLocal", sessionId, tun),
    stopForward: (sessionId, listenPort) => ipcRenderer.invoke("ssh:stopForward", sessionId, listenPort),
    onData: (cb) => {
      const listener = (_e, payload) => cb(payload);
      ipcRenderer.on("ssh:data", listener);
      return () => ipcRenderer.removeListener("ssh:data", listener);
    },
    onClose: (cb) => {
      const listener = (_e, payload) => cb(payload);
      ipcRenderer.on("ssh:close", listener);
      return () => ipcRenderer.removeListener("ssh:close", listener);
    },
  },
});
