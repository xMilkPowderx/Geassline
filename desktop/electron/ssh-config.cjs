function isHostLine(line) {
  return /^\s*Host\s+\S/i.test(line) && !/^\s*HostName\b/i.test(line);
}

function findHostBlock(lines, alias) {
  for (let i = 0; i < lines.length; i += 1) {
    if (!isHostLine(lines[i])) continue;
    const names = lines[i]
      .replace(/^\s*Host\s+/i, "")
      .replace(/#.*$/, "")
      .trim()
      .split(/\s+/);
    if (names.length !== 1 || names[0] !== alias) continue;
    let end = lines.length;
    for (let j = i + 1; j < lines.length; j += 1) {
      if (isHostLine(lines[j])) {
        end = j;
        break;
      }
    }
    return { start: i, end };
  }
  return { start: -1, end: -1 };
}

const MANAGED = /^(hostname|user|port|identityfile|proxyjump|forwardagent|compression|serveraliveinterval|localforward|remoteforward|dynamicforward)$/i;

function listenSpec(fw) {
  return !fw.listenHost || fw.listenHost === "127.0.0.1" ? String(fw.listen) : `${fw.listenHost}:${fw.listen}`;
}

function managedLines(host) {
  const lines = [`  HostName ${host.hostname || host.alias}`];
  if (host.user) lines.push(`  User ${host.user}`);
  if (host.port && Number(host.port) !== 22) lines.push(`  Port ${host.port}`);
  if (host.identityFile) lines.push(`  IdentityFile ${host.identityFile}`);
  if (host.proxyJump) lines.push(`  ProxyJump ${host.proxyJump}`);
  if (host.forwardAgent) lines.push("  ForwardAgent yes");
  if (host.compression) lines.push("  Compression yes");
  if (host.keepalive && Number(host.keepalive) !== 30) lines.push(`  ServerAliveInterval ${host.keepalive}`);
  const forwards = host.forwards?.length
    ? host.forwards
    : (host.localForwards || []).map((fw) => ({ ...fw, kind: fw.kind || "local" }));
  for (const fw of forwards) {
    if (!fw.listen) continue;
    const kind = fw.kind || "local";
    if (kind === "dynamic") {
      lines.push(`  DynamicForward ${listenSpec(fw)}`);
      continue;
    }
    if (!fw.destPort) continue;
    const dest = `${fw.destHost || "127.0.0.1"}:${fw.destPort}`;
    lines.push(`  ${kind === "remote" ? "RemoteForward" : "LocalForward"} ${listenSpec(fw)} ${dest}`);
  }
  return lines;
}

function upsertSshHostBlock(text, host) {
  const alias = String(host.alias || "").trim();
  if (!alias) return text;
  const lines = String(text || "").split(/\r?\n/);
  const { start, end } = findHostBlock(lines, alias);
  const managed = managedLines(host);
  if (start === -1) {
    const body = [`Host ${alias}`, ...managed, ""].join("\n");
    const base = String(text || "").replace(/\s*$/, "");
    return base ? `${base}\n\n${body}` : `${body}\n`;
  }
  const kept = [];
  for (let i = start + 1; i < end; i += 1) {
    const raw = lines[i] ?? "";
    const trimmed = raw.replace(/#.*$/, "").trim();
    if (!trimmed) continue;
    if (raw.trim().startsWith("#")) {
      kept.push(raw);
      continue;
    }
    const key = trimmed.split(/\s+/)[0] || "";
    if (MANAGED.test(key)) continue;
    kept.push(raw);
  }
  const block = [`Host ${alias}`, ...managed, ...kept];
  return [...lines.slice(0, start), ...block, ...lines.slice(end)].join("\n").replace(/\n{3,}/g, "\n\n");
}

function removeSshHostBlock(text, alias) {
  const lines = String(text || "").split(/\r?\n/);
  const { start, end } = findHostBlock(lines, String(alias || "").trim());
  if (start === -1) return text;
  return [...lines.slice(0, start), ...lines.slice(end)].join("\n").replace(/\n{3,}/g, "\n\n").replace(/^\n+/, "");
}

module.exports = { upsertSshHostBlock, removeSshHostBlock };
