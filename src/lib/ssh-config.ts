export type SshForwardKind = "local" | "remote" | "dynamic";

export type SshForward = {
  kind: SshForwardKind;
  listenHost: string;
  listen: number;
  destHost: string;
  destPort: number;
};

export type SshConfigHost = {
  alias: string;
  hostname: string;
  user: string;
  port: number;
  identityFile: string;
  proxyJump: string;
  forwardAgent: boolean;
  compression: boolean;
  forwards: SshForward[];
  localForwards: SshForward[];
  requestTty: string;
  serverAliveInterval: number;
};

const KW: Record<string, string> = {
  hostname: "hostname",
  host: "hostname",
  user: "user",
  port: "port",
  identityfile: "identityFile",
  proxyjump: "proxyJump",
  proxycommand: "proxyJump",
  forwardagent: "forwardAgent",
  compression: "compression",
  localforward: "localForward",
  remoteforward: "remoteForward",
  dynamicforward: "dynamicForward",
  requesttty: "requestTty",
  serveraliveinterval: "serverAliveInterval",
};

const MANAGED_KEYS =
  /^(hostname|user|port|identityfile|proxyjump|forwardagent|compression|serveraliveinterval|localforward|remoteforward|dynamicforward)$/i;

function blank(alias: string): SshConfigHost {
  return {
    alias,
    hostname: alias,
    user: "",
    port: 22,
    identityFile: "",
    proxyJump: "",
    forwardAgent: false,
    compression: false,
    forwards: [],
    localForwards: [],
    requestTty: "",
    serverAliveInterval: 0,
  };
}

function parseHostPort(spec: string, defaultHost: string): { host: string; port: number } | null {
  const raw = spec.trim();
  if (!raw) return null;
  const bracket = raw.match(/^\[([^\]]+)\]:(\d+)$/);
  if (bracket) return { host: bracket[1]!, port: Number(bracket[2]) };
  if (/^\d+$/.test(raw)) return { host: defaultHost, port: Number(raw) };
  const colon = raw.lastIndexOf(":");
  if (colon <= 0) return null;
  const port = Number(raw.slice(colon + 1));
  if (!Number.isFinite(port) || port <= 0) return null;
  return { host: raw.slice(0, colon) || defaultHost, port };
}

function parsePairForward(kind: "local" | "remote", value: string): SshForward | null {
  const parts = value.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const listen = parseHostPort(parts[0]!, "127.0.0.1");
  const dest = parseHostPort(parts[1]!, "127.0.0.1");
  if (!listen || !dest) return null;
  return {
    kind,
    listenHost: listen.host,
    listen: listen.port,
    destHost: dest.host,
    destPort: dest.port,
  };
}

function parseDynamicForward(value: string): SshForward | null {
  const listen = parseHostPort(value.trim().split(/\s+/)[0] || "", "127.0.0.1");
  if (!listen) return null;
  return {
    kind: "dynamic",
    listenHost: listen.host,
    listen: listen.port,
    destHost: "",
    destPort: 0,
  };
}

function mergeForwards(base: SshForward[], over: SshForward[]): SshForward[] {
  const out = [...base];
  for (const fw of over) {
    if (out.some((x) => x.kind === fw.kind && x.listenHost === fw.listenHost && x.listen === fw.listen)) continue;
    out.push(fw);
  }
  return out;
}

function applyKeyword(current: SshConfigHost, mapped: string, value: string) {
  if (mapped === "port" || mapped === "serverAliveInterval") {
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    if (mapped === "port") current.port = n;
    else current.serverAliveInterval = n;
    return;
  }
  if (mapped === "forwardAgent" || mapped === "compression") {
    current[mapped] = /^(yes|true|1)$/i.test(value);
    return;
  }
  if (mapped === "localForward") {
    const fw = parsePairForward("local", value);
    if (fw) current.forwards.push(fw);
    return;
  }
  if (mapped === "remoteForward") {
    const fw = parsePairForward("remote", value);
    if (fw) current.forwards.push(fw);
    return;
  }
  if (mapped === "dynamicForward") {
    const fw = parseDynamicForward(value);
    if (fw) current.forwards.push(fw);
    return;
  }
  if (mapped === "hostname") current.hostname = value;
  else if (mapped === "user") current.user = value;
  else if (mapped === "identityFile") current.identityFile = value;
  else if (mapped === "proxyJump") current.proxyJump = value;
  else if (mapped === "requestTty") current.requestTty = value;
}

function mergeHost(base: SshConfigHost, over: SshConfigHost): SshConfigHost {
  const forwards = mergeForwards(base.forwards, over.forwards);
  return {
    alias: over.alias,
    hostname: over.hostname !== over.alias ? over.hostname : base.hostname !== base.alias ? base.hostname : over.hostname,
    user: over.user || base.user,
    port: over.port !== 22 ? over.port : base.port,
    identityFile: over.identityFile || base.identityFile,
    proxyJump: over.proxyJump || base.proxyJump,
    forwardAgent: over.forwardAgent || base.forwardAgent,
    compression: over.compression || base.compression,
    forwards,
    localForwards: forwards.filter((f) => f.kind === "local"),
    requestTty: over.requestTty || base.requestTty,
    serverAliveInterval: over.serverAliveInterval || base.serverAliveInterval,
  };
}

export function parseSshConfig(text: string): SshConfigHost[] {
  const blocks: SshConfigHost[] = [];
  let current: SshConfigHost | null = null;

  const flush = () => {
    if (current) {
      current.localForwards = current.forwards.filter((f) => f.kind === "local");
      blocks.push(current);
    }
    current = null;
  };

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const m = line.match(/^(\S+)\s+(.+)$/);
    if (!m) continue;
    const key = m[1]!.toLowerCase();
    const value = m[2]!.trim().replace(/^"|"$/g, "");
    if (key === "host") {
      flush();
      const alias = value.split(/\s+/)[0] ?? value;
      current = blank(alias);
      continue;
    }
    if (key === "include") continue;
    if (!current) continue;
    const mapped = KW[key];
    if (!mapped) continue;
    applyKeyword(current, mapped, value);
  }
  flush();

  const star = blocks.filter((h) => h.alias === "*").reduce((acc, h) => mergeHost(acc, h), blank("*"));
  return blocks.filter((h) => h.alias !== "*" && !h.alias.includes("*") && !h.alias.includes("?")).map((h) => mergeHost(star, h));
}

function isHostLine(line: string) {
  return /^\s*Host\s+\S/i.test(line) && !/^\s*HostName\b/i.test(line);
}

function findHostBlock(lines: string[], alias: string): { start: number; end: number } {
  for (let i = 0; i < lines.length; i += 1) {
    if (!isHostLine(lines[i]!)) continue;
    const names = lines[i]!.replace(/^\s*Host\s+/i, "").replace(/#.*$/, "").trim().split(/\s+/);
    if (names.length !== 1 || names[0] !== alias) continue;
    let end = lines.length;
    for (let j = i + 1; j < lines.length; j += 1) {
      if (isHostLine(lines[j]!)) {
        end = j;
        break;
      }
    }
    return { start: i, end };
  }
  return { start: -1, end: -1 };
}

export type SshHostWrite = {
  alias: string;
  hostname: string;
  user: string;
  port: number;
  identityFile: string;
  proxyJump: string;
  forwardAgent: boolean;
  compression: boolean;
  keepalive: number;
  forwards: SshForward[];
  localForwards?: SshForward[];
};

function listenSpec(fw: SshForward) {
  return !fw.listenHost || fw.listenHost === "127.0.0.1" ? String(fw.listen) : `${fw.listenHost}:${fw.listen}`;
}

function managedLines(host: SshHostWrite): string[] {
  const lines = [`  HostName ${host.hostname || host.alias}`];
  if (host.user) lines.push(`  User ${host.user}`);
  if (host.port && host.port !== 22) lines.push(`  Port ${host.port}`);
  if (host.identityFile) lines.push(`  IdentityFile ${host.identityFile}`);
  if (host.proxyJump) lines.push(`  ProxyJump ${host.proxyJump}`);
  if (host.forwardAgent) lines.push("  ForwardAgent yes");
  if (host.compression) lines.push("  Compression yes");
  if (host.keepalive && host.keepalive !== 30) lines.push(`  ServerAliveInterval ${host.keepalive}`);
  const forwards = host.forwards?.length ? host.forwards : host.localForwards || [];
  for (const fw of forwards) {
    if (!fw.listen) continue;
    if (fw.kind === "dynamic") {
      lines.push(`  DynamicForward ${listenSpec(fw)}`);
      continue;
    }
    if (!fw.destPort) continue;
    const dest = `${fw.destHost || "127.0.0.1"}:${fw.destPort}`;
    lines.push(`  ${fw.kind === "remote" ? "RemoteForward" : "LocalForward"} ${listenSpec(fw)} ${dest}`);
  }
  return lines;
}

export function upsertSshHostBlock(text: string, host: SshHostWrite): string {
  const alias = host.alias.trim();
  if (!alias) return text;
  const lines = text.split(/\r?\n/);
  const { start, end } = findHostBlock(lines, alias);
  const managed = managedLines(host);
  if (start === -1) {
    const body = [`Host ${alias}`, ...managed, ""].join("\n");
    const base = text.replace(/\s*$/, "");
    return base ? `${base}\n\n${body}` : `${body}\n`;
  }
  const kept: string[] = [];
  for (let i = start + 1; i < end; i += 1) {
    const raw = lines[i] ?? "";
    const trimmed = raw.replace(/#.*$/, "").trim();
    if (!trimmed) {
      if (raw.trim().startsWith("#")) kept.push(raw);
      continue;
    }
    if (raw.trim().startsWith("#")) {
      kept.push(raw);
      continue;
    }
    const key = trimmed.split(/\s+/)[0] || "";
    if (MANAGED_KEYS.test(key)) continue;
    kept.push(raw);
  }
  const block = [`Host ${alias}`, ...managed, ...kept];
  const next = [...lines.slice(0, start), ...block, ...lines.slice(end)];
  return next.join("\n").replace(/\n{3,}/g, "\n\n");
}

export function removeSshHostBlock(text: string, alias: string): string {
  const lines = text.split(/\r?\n/);
  const { start, end } = findHostBlock(lines, alias.trim());
  if (start === -1) return text;
  const next = [...lines.slice(0, start), ...lines.slice(end)];
  return next.join("\n").replace(/\n{3,}/g, "\n\n").replace(/^\n+/, "");
}