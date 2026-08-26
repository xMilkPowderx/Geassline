import type { Host, Identity, Tunnel } from "./types";
import { desktopBridge, type LiveSshOpts } from "./geassline-desktop";

export function liveSsh() {
  return desktopBridge()?.ssh ?? null;
}

export function keyPathOf(identity?: Identity) {
  if (!identity) return "";
  if (identity.comment && /[\\/]/.test(identity.comment)) return identity.comment;
  return "";
}

export function needsPasswordPrompt(identity?: Identity) {
  if (keyPathOf(identity)) return false;
  if (identity?.kind === "fido2" || identity?.kind === "key" || identity?.kind === "agent") return false;
  if (identity?.kind === "password") return !identity.password;
  return true;
}

export function sshAuth(host: Host, identity?: Identity, password?: string) {
  const username = identity?.username || host.username;
  const path = keyPathOf(identity);
  const fido2 =
    identity?.kind === "fido2" ||
    host.fido2Required ||
    /sk-/i.test(identity?.algorithm || "") ||
    /_sk(?:$|\.)/i.test(path);
  const pass = password || (identity?.kind === "password" ? identity.password : "");
  return {
    username,
    password: fido2 || path ? "" : pass,
    passphrase: identity?.kind === "key" || identity?.kind === "fido2" ? identity.password : "",
    privateKey: fido2 ? "" : identity?.privateKey || "",
    privateKeyPath: path,
    keepalive: host.keepalive,
    compression: host.compression,
    agentForward: host.agentForward || identity?.kind === "agent",
    fido2,
    algorithm: identity?.algorithm || "",
  };
}

export function sshConnectOpts(
  sessionId: string,
  host: Host,
  identity: Identity | undefined,
  jump: Host | undefined,
  jumpIdentity: Identity | undefined,
  size: { cols: number; rows: number },
  extra?: { password?: string; localForwards?: Tunnel[] },
): LiveSshOpts {
  const forwards = (extra?.localForwards || [])
    .filter((t) => t.listenPort && (t.kind === "dynamic" || t.destPort) && (t.source === "config" || t.active || t.bound))
    .map((t) => ({
      kind: t.kind,
      listenHost: t.listenHost || "127.0.0.1",
      listenPort: t.listenPort,
      destHost: t.destHost || "127.0.0.1",
      destPort: t.destPort,
      fromConfig: t.source === "config",
    }));
  return {
    sessionId,
    host: host.address || host.hostname,
    port: host.port || 22,
    cols: size.cols,
    rows: size.rows,
    alias: host.name || host.hostname,
    proxyJump: host.proxyJump || "",
    localForwards: forwards,
    ...sshAuth(host, identity, extra?.password),
    jump: jump
      ? {
          host: jump.address || jump.hostname,
          port: jump.port || 22,
          alias: jump.name || jump.hostname,
          ...sshAuth(jump, jumpIdentity),
        }
      : undefined,
  };
}