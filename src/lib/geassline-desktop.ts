export type SshDiskKey = {
  name: string;
  path: string;
};

export type SshDiskConfig = {
  ok: boolean;
  path: string;
  text: string;
  missing?: boolean;
  keys?: SshDiskKey[];
  home?: string;
  cancelled?: boolean;
};

export type SshHostWritePayload = {
  alias: string;
  hostname: string;
  user: string;
  port: number;
  identityFile: string;
  proxyJump: string;
  forwardAgent: boolean;
  compression: boolean;
  keepalive: number;
  forwards: Array<{
    kind: "local" | "remote" | "dynamic";
    listenHost: string;
    listen: number;
    destHost: string;
    destPort: number;
  }>;
  localForwards?: Array<{ listenHost: string; listen: number; destHost: string; destPort: number }>;
};

export type LiveSshOpts = {
  sessionId: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  privateKeyPath?: string;
  passphrase?: string;
  keepalive?: number;
  compression?: boolean;
  agentForward?: boolean;
  fido2?: boolean;
  algorithm?: string;
  alias?: string;
  proxyJump?: string;
  cols?: number;
  rows?: number;
  localForwards?: Array<{
    kind?: "local" | "remote" | "dynamic";
    listenHost?: string;
    listenPort: number;
    destHost?: string;
    destPort?: number;
    fromConfig?: boolean;
  }>;
  jump?: {
    host: string;
    port: number;
    username: string;
    password?: string;
    privateKey?: string;
    privateKeyPath?: string;
    passphrase?: string;
    fido2?: boolean;
    algorithm?: string;
    alias?: string;
  };
};

export type SftpEntry = {
  name: string;
  path: string;
  type: "file" | "dir" | "link";
  target?: string;
  size: number;
  mtime: number;
  mode: string;
};

export type IpcResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

export type GeasslineSsh = {
  connect: (opts: LiveSshOpts) => Promise<IpcResult<{ banner?: string; reused?: boolean }>>;
  status: (sessionId: string) => Promise<IpcResult<{ connected: boolean; hasSftp: boolean }>>;
  write: (sessionId: string, data: string) => Promise<IpcResult>;
  resize: (sessionId: string, cols: number, rows: number) => Promise<IpcResult>;
  disconnect: (sessionId: string) => Promise<IpcResult>;
  list: (sessionId: string, dir: string) => Promise<IpcResult<SftpEntry[]>>;
  read: (sessionId: string, filePath: string) => Promise<IpcResult<string>>;
  writeFile: (sessionId: string, filePath: string, content: string) => Promise<IpcResult>;
  mkdir: (sessionId: string, dirPath: string) => Promise<IpcResult>;
  remove: (sessionId: string, filePath: string, recursive?: boolean) => Promise<IpcResult>;
  sudo: (sessionId: string, password?: string) => Promise<IpcResult<{ asRoot?: boolean }>>;
  unsudo: (sessionId: string) => Promise<IpcResult<{ asRoot?: boolean }>>;
  download: (sessionId: string, remotePath: string, isDir?: boolean) => Promise<IpcResult<{ path?: string; cancelled?: boolean }>>;
  forwardLocal: (
    sessionId: string,
    tun: {
      kind?: "local" | "remote" | "dynamic";
      listenHost: string;
      listenPort: number;
      destHost?: string;
      destPort?: number;
    },
  ) => Promise<IpcResult>;
  stopForward: (sessionId: string, listenPort: number) => Promise<IpcResult>;
  onData: (cb: (payload: { sessionId: string; data: string }) => void) => () => void;
  onClose: (cb: (payload: { sessionId: string }) => void) => () => void;
};

export type GeasslineDesktop = {
  offline?: boolean;
  liveSsh?: boolean;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  readSshConfig?: (configPath?: string) => Promise<SshDiskConfig>;
  upsertSshHost?: (payload: { path?: string; host: SshHostWritePayload }) => Promise<SshDiskConfig>;
  removeSshHost?: (payload: { path?: string; alias: string }) => Promise<SshDiskConfig>;
  pickSshConfig?: () => Promise<SshDiskConfig>;
  generateSshKey?: (name?: string) => Promise<{ name: string; path: string }>;
  importSshKey?: () => Promise<{ cancelled?: boolean; name?: string; path?: string }>;
  clipboardRead?: () => string;
  clipboardWrite?: (text: string) => void;
  termContextMenu?: (payload: { selection?: string }) => Promise<{ action: "copy" | "paste" | "dismiss"; text?: string }>;
  ssh?: GeasslineSsh;
};

export function desktopBridge(): GeasslineDesktop | null {
  if (typeof window === "undefined") return null;
  const bridge = (window as Window & { geasslineDesktop?: GeasslineDesktop }).geasslineDesktop;
  return bridge ?? null;
}

export const WINDOWS_DESKTOP_ZIP = "/download/windows-zip";
