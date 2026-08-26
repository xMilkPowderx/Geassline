const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const sessions = new Map();
const pools = new Map();

function winSshDir() {
  return path.join(process.env.SystemRoot || "C:\\Windows", "System32", "OpenSSH");
}

function pickSsh() {
  const win = path.join(winSshDir(), "ssh.exe");
  if (fs.existsSync(win)) return win;
  throw new Error(
    "Windows OpenSSH not found at C:\\Windows\\System32\\OpenSSH\\ssh.exe. Install Optional Feature: OpenSSH Client.",
  );
}

function isFido2Opts(opts) {
  if (opts?.fido2) return true;
  if (opts?.algorithm && /^sk-/i.test(opts.algorithm)) return true;
  if (opts?.privateKeyPath && /_sk(?:$|\.|[\\/])/i.test(opts.privateKeyPath)) return true;
  if (opts?.jump && isFido2Opts(opts.jump)) return true;
  return false;
}

function usesPassword(opts) {
  return !!(opts?.password && !opts?.privateKeyPath);
}

function askpassPath() {
  const { app } = require("electron");
  const dest = path.join(app.getPath("userData"), "askpass.cmd");
  const src = path.join(__dirname, "askpass.cmd");
  try {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  } catch {
    return src;
  }
  return dest;
}

function writeAskpassFile(sessionId, password) {
  const file = path.join(os.tmpdir(), `geassline-ask-${String(sessionId).replace(/[^A-Za-z0-9_-]/g, "")}.txt`);
  fs.writeFileSync(file, String(password ?? ""), { encoding: "utf8" });
  return file;
}

function clearAskpassFile(file) {
  if (!file) return;
  try {
    fs.unlinkSync(file);
  } catch {
    /* ignore */
  }
}

function spawnEnv(opts) {
  const home = os.homedir();
  const env = { ...process.env, TERM: "xterm-256color", COLORTERM: "truecolor" };
  delete env.GIT_SSH;
  delete env.GIT_SSH_COMMAND;
  delete env.SSH_SK_HELPER;
  env.USERPROFILE = process.env.USERPROFILE || home;
  env.HOME = home;
  env.SSH_USE_CONPTY = "1";
  const sshDir = winSshDir();
  const rest = String(process.env.PATH || "")
    .split(path.delimiter)
    .filter((p) => p && !/[\\/]Git[\\/]usr[\\/]bin/i.test(p));
  env.PATH = [sshDir, ...rest].join(path.delimiter);
  if (usesPassword(opts) && opts.askpassFile) {
    env.SSH_ASKPASS = askpassPath();
    env.SSH_ASKPASS_REQUIRE = "force";
    env.DISPLAY = env.DISPLAY || "1";
    env.GEASSLINE_ASKPASS_FILE = opts.askpassFile;
  } else {
    delete env.SSH_ASKPASS;
    delete env.SSH_ASKPASS_REQUIRE;
  }
  return env;
}

function parseJumpSpec(spec, fallbackUser) {
  const first = String(spec || "")
    .split(",")[0]
    .trim();
  if (!first) return null;
  const m = first.match(/^(?:([^@]+)@)?([^:]+)(?::(\d+))?$/);
  if (!m) return { host: first, port: 22, username: fallbackUser };
  return {
    username: m[1] || fallbackUser,
    host: m[2],
    port: Number(m[3] || 22),
  };
}

function jumpFromOpts(opts) {
  if (opts.jump && opts.jump.host) return opts.jump;
  return parseJumpSpec(opts.proxyJump, opts.username);
}

function hostKey(opts) {
  const dest = `${opts.username || ""}@${opts.alias || opts.host}:${opts.port || 22}`;
  const jump = opts.proxyJump || opts.jump?.alias || opts.jump?.host || "";
  return `${dest}|${jump}`;
}

function b64(buf) {
  return Buffer.from(buf).toString("base64");
}

function sendChunk(sender, sessionId, chunk) {
  try {
    sender.send("ssh:data", { sessionId, data: b64(chunk) });
  } catch {
    /* window gone */
  }
}

function shQuote(p) {
  return JSON.stringify(String(p));
}

function forwardFlag(f) {
  const kind = f.kind || "local";
  const bind = `${f.listenHost || "127.0.0.1"}:${f.listenPort || f.listen}`;
  if (kind === "dynamic") return ["-D", bind];
  const dest = `${f.destHost || "127.0.0.1"}:${f.destPort}`;
  return [kind === "remote" ? "-R" : "-L", `${bind}:${dest}`];
}

function sshArgs(opts, { tty = false, command, extra = false, files = false, forwardOnly = false } = {}) {
  const args = [
    "-o",
    "StrictHostKeyChecking=accept-new",
    "-o",
    `ServerAliveInterval=${opts.keepalive || 30}`,
    "-o",
    "IdentityAgent=none",
    "-o",
    "ControlMaster=no",
    "-o",
    "ControlPath=none",
  ];
  // Extra shells / Files must not inherit LocalForward. ClearAllForwardings also
  // drops command-line -L, so it is never used on the first session or on ssh -N.
  if ((extra || files) && !forwardOnly) {
    args.push("-o", "ClearAllForwardings=yes");
  }
  if (opts.privateKeyPath) {
    args.push(
      "-i",
      opts.privateKeyPath,
      "-o",
      "IdentitiesOnly=yes",
      "-o",
      "PreferredAuthentications=publickey",
    );
  } else if (usesPassword(opts)) {
    args.push(
      "-o",
      "PubkeyAuthentication=no",
      "-o",
      "PreferredAuthentications=password,keyboard-interactive",
      "-o",
      "NumberOfPasswordPrompts=1",
    );
  } else {
    args.push("-o", "PreferredAuthentications=publickey,keyboard-interactive,password");
  }
  if (tty) args.unshift("-tt");
  if (opts.agentForward) args.push("-A");
  if (opts.compression) args.push("-C");
  if (opts.username) args.push("-l", opts.username);
  if (opts.port) args.push("-p", String(opts.port || 22));

  if (forwardOnly && opts.oneForward) {
    args.push("-N", ...forwardFlag(opts.oneForward));
  } else if (!extra && !files && Array.isArray(opts.localForwards)) {
    const aliasAppliesConfig = !!(opts.alias && !usesPassword(opts));
    for (const f of opts.localForwards) {
      if (!f || !f.listenPort) continue;
      if (f.kind !== "dynamic" && !f.destPort) continue;
      if (aliasAppliesConfig && f.fromConfig) continue;
      args.push(...forwardFlag(f));
    }
  }

  const useAlias = !!(opts.alias && !usesPassword(opts) && !forwardOnly);
  if (useAlias) {
    args.push(opts.alias);
  } else {
    const jump = jumpFromOpts(opts);
    if (opts.proxyJump) args.push("-J", opts.proxyJump);
    else if (jump && jump.host) {
      const spec = `${jump.username ? `${jump.username}@` : ""}${jump.host}${
        jump.port && jump.port !== 22 ? `:${jump.port}` : ""
      }`;
      args.push("-J", spec);
    }
    args.push(opts.host);
  }
  if (command) args.push(command);
  return args;
}

function poolFor(opts) {
  const key = hostKey(opts);
  let pool = pools.get(key);
  if (!pool) {
    pool = { kind: "openssh", shells: new Set(), opts, forwards: [] };
    pools.set(key, pool);
  }
  pool.opts = { ...pool.opts, ...opts };
  return pool;
}

function spawnSsh(opts, args) {
  const bin = pickSsh();
  return spawn(bin, args, {
    env: spawnEnv(opts),
    cwd: os.homedir(),
    windowsHide: true,
    detached: false,
    shell: false,
    stdio: ["pipe", "pipe", "pipe"],
  });
}

function ensureFileShell(pool) {
  if (!pool) return Promise.reject(new Error("Not connected"));
  if (pool.fileClient && pool.fileChild && pool.fileChild.exitCode == null) return Promise.resolve(pool.fileClient);
  if (pool.fileStarting) return pool.fileStarting;
  pool.fileStarting = new Promise((resolve, reject) => {
    const opts = pool.opts;
    const child = spawnSsh(opts, sshArgs(opts, { tty: false, command: "sh -s", files: true }));
    pool.fileChild = child;
    let buf = Buffer.alloc(0);
    let errText = "";
    let waiter = null;
    let ready = false;
    const pump = () => {
      if (!waiter) return;
      const idx = buf.indexOf(waiter.mark);
      if (idx === -1) return;
      const out = Buffer.from(buf.subarray(0, idx));
      buf = Buffer.from(buf.subarray(idx + waiter.mark.length));
      const res = waiter.resolve;
      waiter = null;
      res(out);
    };
    child.stdout.on("data", (d) => {
      buf = Buffer.concat([buf, d]);
      pump();
    });
    child.stderr.on("data", (d) => {
      errText += d.toString("utf8");
    });
    child.on("error", (err) => {
      pool.fileClient = null;
      pool.fileStarting = null;
      reject(err);
    });
    child.on("close", () => {
      pool.fileClient = null;
      pool.fileChild = null;
      pool.fileStarting = null;
      if (!ready) reject(new Error("File session ended (key cancelled or login failed)"));
    });
    const enqueue = (cmd, timeoutMs, asText) => {
      const run = () =>
        new Promise((res, rej) => {
          const mark = `__GEASSLINE_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}__`;
          const t = setTimeout(() => rej(new Error("File command timed out")), timeoutMs);
          errText = "";
          waiter = {
            mark: Buffer.from(mark, "utf8"),
            resolve: (out) => {
              clearTimeout(t);
              if (asText) {
                const text = out.toString("utf8");
                res(errText ? `${errText}${text}` : text);
              } else if (!out.length && /no such file|permission denied|error/i.test(errText)) {
                rej(new Error(errText.trim()));
              } else res(out);
            },
          };
          try {
            child.stdin.write(`${cmd}\nprintf '%s' '${mark}'\n`);
          } catch (err) {
            clearTimeout(t);
            rej(err);
          }
        });
      client.queue = client.queue.then(run, run);
      return client.queue;
    };
    const client = {
      queue: Promise.resolve(),
      request(cmd, timeoutMs = 60000) {
        return enqueue(cmd, timeoutMs, true);
      },
      requestRaw(cmd, timeoutMs = 600000) {
        return enqueue(cmd, timeoutMs, false);
      },
    };
    const probe = () => {
      client
        .request("true")
        .then(() => {
          ready = true;
          pool.fileClient = client;
          pool.fileStarting = null;
          resolve(client);
        })
        .catch((err) => {
          if (child.exitCode == null) setTimeout(probe, 400);
          else reject(err);
        });
    };
    setTimeout(probe, 800);
    setTimeout(() => {
      if (!ready) reject(new Error("Timed out waiting for file session"));
    }, 90000);
  });
  return pool.fileStarting;
}

function connectOpenSsh(opts, sender, { extra = false } = {}) {
  return new Promise((resolve, reject) => {
    let askpassFile = "";
    if (usesPassword(opts)) {
      askpassFile = writeAskpassFile(opts.sessionId, opts.password);
      opts.askpassFile = askpassFile;
    }
    const args = sshArgs(opts, { tty: true, extra });
    const child = spawnSsh(opts, args);
    let started = false;
    let errLog = "";
    const failTimer = setTimeout(() => {
      if (started) return;
      child.kill();
      clearAskpassFile(askpassFile);
      reject(new Error("OpenSSH timed out"));
    }, 90000);

    const sendOut = (chunk) => {
      if (!started) {
        started = true;
        clearTimeout(failTimer);
        sessions.set(opts.sessionId, {
          kind: "openssh",
          child,
          sender,
          opts,
          askpassFile,
          tunnels: [],
        });
        resolve({
          ok: true,
          banner: `${opts.username || os.userInfo().username}@${opts.alias || opts.host}:${opts.port || 22}`,
          backend: "windows-openssh",
        });
      }
      sendChunk(sender, opts.sessionId, chunk);
    };

    child.stdout.on("data", sendOut);
    child.stderr.on("data", (chunk) => {
      errLog += chunk.toString();
      sendChunk(sender, opts.sessionId, chunk);
    });
    child.once("error", (err) => {
      clearTimeout(failTimer);
      clearAskpassFile(askpassFile);
      if (!started) reject(err);
    });
    child.once("close", () => {
      clearTimeout(failTimer);
      clearAskpassFile(askpassFile);
      sessions.delete(opts.sessionId);
      if (!started) {
        reject(new Error((errLog || "OpenSSH exited before login completed").trim()));
        return;
      }
      try {
        sender.send("ssh:close", { sessionId: opts.sessionId });
      } catch {
        /* ignore */
      }
    });
  });
}

async function connect(opts, sender) {
  const existing = sessions.get(opts.sessionId);
  if (existing) return { ok: true, reused: true, banner: `${opts.username}@${opts.host}` };

  const pool = poolFor(opts);
  pool.sender = sender;
  const extra = pool.shells.size > 0;
  pool.shells.add(opts.sessionId);
  try {
    return await connectOpenSsh(opts, sender, { extra });
  } catch (err) {
    pool.shells.delete(opts.sessionId);
    throw err;
  }
}

function parseLs(text, dir) {
  const base = String(dir || ".").replace(/\/$/, "") || ".";
  return text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line && !/^total\s/i.test(line))
    .map((line) => {
      const parts = line.split(/\s+/);
      if (parts.length < 6) return null;
      const perm = parts[0] || "";
      if (!/^[dlbcps-]/.test(perm)) return null;
      let name = parts.slice(8).join(" ") || parts[parts.length - 1];
      let target = "";
      const arrow = name.indexOf(" -> ");
      if (arrow !== -1) {
        target = name.slice(arrow + 4);
        name = name.slice(0, arrow);
      }
      if (!name || name === "." || name === "..") return null;
      const isLink = perm.startsWith("l");
      const isDir = perm.startsWith("d");
      return {
        name,
        path: `${base}/${name}`.replace(/^\.\//, ""),
        type: isDir ? "dir" : isLink ? "link" : "file",
        target,
        size: Number(parts[4]) || 0,
        mtime: 0,
        mode: perm.slice(1, 10) || perm,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const ad = a.type === "dir" || a.type === "link" ? 0 : 1;
      const bd = b.type === "dir" || b.type === "link" ? 0 : 1;
      return ad === bd ? a.name.localeCompare(b.name) : ad - bd;
    });
}

function status(sessionId) {
  const s = sessions.get(sessionId);
  const pool = s?.opts ? pools.get(hostKey(s.opts)) : null;
  return { connected: !!s, hasSftp: !!pool?.fileClient, asRoot: !!pool?.asRoot };
}

function write(sessionId, data) {
  const s = sessions.get(sessionId);
  if (!s) return { ok: false, error: "Not connected" };
  try {
    s.child.stdin.write(data);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function resize() {
  return { ok: true };
}

async function disconnect(sessionId) {
  const s = sessions.get(sessionId);
  if (!s) return { ok: true };
  const key = s.opts ? hostKey(s.opts) : "";
  const pool = key ? pools.get(key) : null;
  if (pool) pool.shells.delete(sessionId);
  const last = !pool || pool.shells.size === 0;
  try {
    s.child?.kill();
  } catch {
    /* ignore */
  }
  clearAskpassFile(s.askpassFile);
  if (last) {
    try {
      pool?.fileChild?.kill();
    } catch {
      /* ignore */
    }
    for (const fwd of pool?.forwards || []) {
      try {
        fwd.child?.kill();
      } catch {
        /* ignore */
      }
    }
    if (key) pools.delete(key);
  }
  sessions.delete(sessionId);
  return { ok: true };
}

function sudoWrap(pool, cmd) {
  if (!pool?.asRoot) return cmd;
  const inner = `sh -c ${JSON.stringify(cmd)}`;
  if (pool.sudoPassword) {
    return `unset SUDO_ASKPASS; printf '%s\\n' ${JSON.stringify(pool.sudoPassword)} | sudo -S -p '' -- ${inner}`;
  }
  return `sudo -n -- ${inner}`;
}

function fileExec(s, command, stdinText) {
  const pool = s.pool || (s.opts ? pools.get(hostKey(s.opts)) : null) || poolFor(s.opts);
  const wrapped =
    stdinText != null
      ? sudoWrap(
          pool,
          `printf '%s' ${JSON.stringify(Buffer.from(String(stdinText)).toString("base64"))} | base64 -d | (${command})`,
        )
      : sudoWrap(pool, command);
  const go = (client) => client.request(wrapped);
  if (pool?.fileClient) return go(pool.fileClient);
  return ensureFileShell(pool).then(go);
}

async function setSudo(sessionId, password) {
  const s = await ensureFiles(sessionId);
  const pool = s.pool;
  const prev = { asRoot: pool.asRoot, sudoPassword: pool.sudoPassword };
  pool.asRoot = true;
  pool.sudoPassword = password ? String(password) : "";
  try {
    await fileExec(s, "id -u");
  } catch (err) {
    pool.asRoot = prev.asRoot;
    pool.sudoPassword = prev.sudoPassword;
    throw new Error(`sudo failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  return { asRoot: true };
}

function clearSudo(sessionId) {
  const s = sessions.get(sessionId);
  const pool = s?.opts ? pools.get(hostKey(s.opts)) : null;
  if (pool) {
    pool.asRoot = false;
    pool.sudoPassword = "";
  }
  return { asRoot: false };
}

async function ensureFiles(sessionId) {
  const s = sessions.get(sessionId);
  if (!s) throw new Error("Not connected");
  const pool = poolFor(s.opts);
  s.pool = pool;
  await ensureFileShell(pool);
  return s;
}

function list(sessionId, dir) {
  return ensureFiles(sessionId).then((s) => {
    const target = dir && dir !== "." ? dir : ".";
    return fileExec(s, `ls -la ${shQuote(target)}`).then((text) => parseLs(text, target));
  });
}

function readFile(sessionId, filePath) {
  return ensureFiles(sessionId).then((s) => fileExec(s, `cat ${shQuote(filePath)}`));
}

function writeFile(sessionId, filePath, content) {
  return ensureFiles(sessionId).then((s) => fileExec(s, `cat > ${shQuote(filePath)}`, content));
}

function mkdir(sessionId, dirPath) {
  return ensureFiles(sessionId).then((s) => fileExec(s, `mkdir -p ${shQuote(dirPath)}`));
}

function remove(sessionId, filePath, recursive) {
  return ensureFiles(sessionId).then((s) =>
    fileExec(s, recursive ? `rm -rf ${shQuote(filePath)}` : `rm -f ${shQuote(filePath)}`),
  );
}

async function downloadRemote(sessionId, remotePath, isDir) {
  const { dialog, BrowserWindow } = require("electron");
  const s = await ensureFiles(sessionId);
  const pool = s.pool;
  const remote = String(remotePath);
  const base = path.posix.basename(remote.replace(/\/$/, "") || "download");
  const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  const picked = await dialog.showSaveDialog(win, {
    defaultPath: isDir ? `${base}.tar.gz` : base,
    title: isDir ? "Save folder archive" : "Save file",
  });
  if (picked.canceled || !picked.filePath) return { cancelled: true };
  const cmd = isDir
    ? `tar -C ${shQuote(path.posix.dirname(remote) || "/")} -czf - ${shQuote(path.posix.basename(remote))}`
    : `cat ${shQuote(remote)}`;
  const data = await pool.fileClient.requestRaw(sudoWrap(pool, cmd), 600000);
  fs.writeFileSync(picked.filePath, data);
  return { path: picked.filePath };
}

function startLocalForward(sessionId, tun) {
  const s = sessions.get(sessionId);
  if (!s) throw new Error("Connect a host first");
  const pool = poolFor(s.opts);
  const port = Number(tun.listenPort);
  const kind = tun.kind || "local";
  if ((pool.forwards || []).some((f) => f.listenPort === port && f.kind === kind)) return { ok: true, already: true };
  const opts = { ...s.opts, oneForward: { ...tun, kind }, sessionId: `${sessionId}-fwd-${kind}-${tun.listenPort}` };
  if (usesPassword(s.opts) && s.opts.password) {
    opts.askpassFile = writeAskpassFile(opts.sessionId, s.opts.password);
  }
  const child = spawnSsh(opts, sshArgs(opts, { tty: false, forwardOnly: true }));
  const rec = { child, listenPort: port, listenHost: tun.listenHost || "127.0.0.1", kind };
  pool.forwards = pool.forwards || [];
  pool.forwards.push(rec);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve({ ok: true }), 1500);
    child.stderr.on("data", (d) => {
      const t = d.toString("utf8");
      if (/Address already in use|Could not request .*forward/i.test(t)) {
        clearTimeout(timer);
        pool.forwards = pool.forwards.filter((f) => f !== rec);
        try {
          child.kill();
        } catch {
          /* ignore */
        }
        reject(new Error(t.trim()));
      }
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      pool.forwards = pool.forwards.filter((f) => f !== rec);
      reject(err);
    });
    child.on("close", () => {
      pool.forwards = (pool.forwards || []).filter((f) => f !== rec);
    });
  });
}

function stopLocalForward(sessionId, listenPort) {
  const s = sessions.get(sessionId);
  if (!s) return { ok: true };
  const pool = s.opts ? pools.get(hostKey(s.opts)) : null;
  if (!pool) return { ok: true };
  const port = Number(listenPort);
  const rec = (pool.forwards || []).find((f) => f.listenPort === port);
  if (!rec) return { ok: true };
  try {
    rec.child.kill();
  } catch {
    /* ignore */
  }
  pool.forwards = pool.forwards.filter((f) => f !== rec);
  return { ok: true };
}

function attach(ipcMain) {
  const wrap = (fn) => async (_e, ...args) => {
    try {
      return { ok: true, data: await fn(...args) };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  };

  ipcMain.handle("ssh:connect", async (e, opts) => {
    try {
      return { ok: true, data: await connect(opts, e.sender) };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  });
  ipcMain.handle("ssh:status", (_e, sessionId) => ({ ok: true, data: status(sessionId) }));
  ipcMain.handle("ssh:write", (_e, sessionId, data) => write(sessionId, data));
  ipcMain.handle("ssh:resize", (_e, sessionId, cols, rows) => resize(sessionId, cols, rows));
  ipcMain.handle("ssh:disconnect", (_e, sessionId) => disconnect(sessionId));
  ipcMain.handle("ssh:list", wrap((sessionId, dir) => list(sessionId, dir)));
  ipcMain.handle("ssh:read", wrap((sessionId, filePath) => readFile(sessionId, filePath)));
  ipcMain.handle("ssh:writeFile", wrap((sessionId, filePath, content) => writeFile(sessionId, filePath, content)));
  ipcMain.handle("ssh:mkdir", wrap((sessionId, dirPath) => mkdir(sessionId, dirPath)));
  ipcMain.handle("ssh:remove", wrap((sessionId, filePath, recursive) => remove(sessionId, filePath, recursive)));
  ipcMain.handle("ssh:sudo", wrap((sessionId, password) => setSudo(sessionId, password)));
  ipcMain.handle("ssh:unsudo", wrap((sessionId) => clearSudo(sessionId)));
  ipcMain.handle("ssh:download", wrap((sessionId, remotePath, isDir) => downloadRemote(sessionId, remotePath, !!isDir)));
  ipcMain.handle("ssh:forwardLocal", wrap((sessionId, tun) => startLocalForward(sessionId, tun)));
  ipcMain.handle("ssh:stopForward", wrap((sessionId, listenPort) => stopLocalForward(sessionId, listenPort)));
}

function disconnectAll() {
  return Promise.all([...sessions.keys()].map((id) => disconnect(id)));
}

const HANDLERS = [
  "ssh:connect",
  "ssh:status",
  "ssh:write",
  "ssh:resize",
  "ssh:disconnect",
  "ssh:list",
  "ssh:read",
  "ssh:writeFile",
  "ssh:mkdir",
  "ssh:remove",
  "ssh:sudo",
  "ssh:unsudo",
  "ssh:download",
  "ssh:forwardLocal",
  "ssh:stopForward",
];

function detach(ipcMain) {
  for (const name of HANDLERS) {
    try {
      ipcMain.removeHandler(name);
    } catch {
      /* ignore */
    }
  }
  return disconnectAll();
}

module.exports = { attach, detach, disconnectAll };
