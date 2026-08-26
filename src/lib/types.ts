export type Protocol = "ssh" | "mosh" | "telnet" | "serial";
export type HostOS = "linux" | "windows" | "darwin" | "network";
export type IdentityKind = "password" | "key" | "fido2" | "certificate" | "agent";
export type TunnelKind = "local" | "remote" | "dynamic";
export type WorkspaceMode = "terminal" | "files" | "code" | "tunnels";
export type CursorStyle = "block" | "underline" | "bar";
export type Activity =
  | "hosts"
  | "files"
  | "code"
  | "tunnels"
  | "snippets"
  | "keys"
  | "settings";

export type HostGroup = {
  id: string;
  name: string;
  collapsed: boolean;
};

export type Host = {
  id: string;
  name: string;
  hostname: string;
  port: number;
  protocol: Protocol;
  groupId: string;
  identityId: string | null;
  username: string;
  tags: string[];
  jumpHostId: string | null;
  proxyJump: string;
  startupCommand: string;
  keepalive: number;
  compression: boolean;
  agentForward: boolean;
  isLab: boolean;
  os: HostOS;
  starred: boolean;
  lastConnectedAt?: number;
  notes: string;
  encoding: string;
  fido2Required: boolean;
  envText: string;
  address: string;
  latencyMs: number;
};

export type Identity = {
  id: string;
  name: string;
  kind: IdentityKind;
  username: string;
  password: string;
  privateKey: string;
  publicKey: string;
  fingerprint: string;
  comment: string;
  algorithm: string;
  fido2CredentialId: string;
  createdAt: number;
};

export type Snippet = {
  id: string;
  name: string;
  body: string;
  tags: string[];
};

export type Tunnel = {
  id: string;
  name: string;
  kind: TunnelKind;
  hostId: string | null;
  listenHost: string;
  listenPort: number;
  destHost: string;
  destPort: number;
  active: boolean;
  bound?: boolean;
  source?: "config" | "user";
  persist?: boolean;
  bytesIn: number;
  bytesOut: number;
};

export type KnownHost = {
  id: string;
  host: string;
  port: number;
  keyType: string;
  fingerprint: string;
  firstSeen: number;
};

export type Session = {
  id: string;
  hostId: string;
  title: string;
  createdAt: number;
  connected: boolean;
};

export type OpenFile = {
  id: string;
  hostId: string;
  path: string;
  content: string;
  original: string;
};

export type LiveNode = {
  type: "file" | "dir";
  mode: string;
  owner: string;
  group: string;
  mtime: number;
  content?: string;
};

export type OverlayNode = { deleted: true } | LiveNode;

export type FileMap = Record<string, OverlayNode>;

export type HostRuntimeState = {
  cwd: string;
  env: Record<string, string>;
  history: string[];
};

export type Settings = {
  terminalTheme: string;
  fontSize: number;
  fontFamily: string;
  cursorStyle: CursorStyle;
  cursorBlink: boolean;
  copyOnSelect: boolean;
  bell: boolean;
  scrollback: number;
  vaultLock: boolean;
  ligatures: boolean;
  wordWrap: boolean;
  syncSshConfig: boolean;
  sshConfigPath: string;
  starredAliases: string[];
};

export type VaultData = {
  groups: HostGroup[];
  hosts: Host[];
  identities: Identity[];
  snippets: Snippet[];
  tunnels: Tunnel[];
  knownHosts: KnownHost[];
  sessions: Session[];
  activeSessionId: string | null;
  openFiles: OpenFile[];
  activeFileId: string | null;
  overlays: Record<string, FileMap>;
  hostState: Record<string, HostRuntimeState>;
  settings: Settings;
  activity: Activity;
  workspaceMode: WorkspaceMode;
  locked: boolean;
  fido2CredentialId: string;
  vaultPassEnabled: boolean;
};
