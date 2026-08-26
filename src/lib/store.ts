import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Activity,
  FileMap,
  Host,
  HostGroup,
  HostRuntimeState,
  Identity,
  KnownHost,
  OpenFile,
  Session,
  Settings,
  Snippet,
  Tunnel,
  VaultData,
  WorkspaceMode,
} from "./types";
import { nid } from "./id";
import { parseSshConfig } from "./ssh-config";

const VAULT_KEY = "geassline-vault-v2";
const LEGACY_VAULT_KEY = "fathom-vault-v2";

function vaultStorage(): Storage {
  return {
    get length() {
      return localStorage.length;
    },
    clear() {
      localStorage.clear();
    },
    key(index: number) {
      return localStorage.key(index);
    },
    getItem(key: string) {
      const fresh = localStorage.getItem(key);
      if (fresh != null) return fresh;
      const legacy = localStorage.getItem(LEGACY_VAULT_KEY);
      if (legacy != null) {
        localStorage.setItem(key, legacy);
        return legacy;
      }
      return null;
    },
    setItem(key: string, value: string) {
      localStorage.setItem(key, value);
    },
    removeItem(key: string) {
      localStorage.removeItem(key);
    },
  };
}

const defaultSettings: Settings = {
  terminalTheme: "geassline-ink",
  fontSize: 13,
  fontFamily: '"IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace',
  cursorStyle: "bar",
  cursorBlink: true,
  copyOnSelect: true,
  bell: false,
  scrollback: 4000,
  vaultLock: false,
  ligatures: false,
  wordWrap: false,
  syncSshConfig: true,
  sshConfigPath: "",
  starredAliases: [],
};

export const LAB_IDS = {
  lab: "g-lab",
  prod: "g-prod",
  windows: "g-win",
  personal: "g-personal",
  sshconfig: "g-ssh-config",
} as const;

function seedGroups(): HostGroup[] {
  return [{ id: LAB_IDS.personal, name: "Personal", collapsed: false }];
}

function makeHost(
  partial: Partial<Host> &
    Pick<Host, "id" | "name" | "hostname" | "groupId" | "username" | "os" | "address">,
): Host {
  return {
    protocol: "ssh",
    port: 22,
    tags: [],
    jumpHostId: null,
    proxyJump: "",
    startupCommand: "",
    keepalive: 30,
    compression: false,
    agentForward: false,
    starred: false,
    notes: "",
    encoding: "utf-8",
    fido2Required: false,
    envText: "",
    isLab: false,
    identityId: null,
    latencyMs: 0,
    ...partial,
  };
}

const emptyVault = (): VaultData => ({
  groups: seedGroups(),
  hosts: [],
  identities: [],
  snippets: [],
  tunnels: [],
  knownHosts: [],
  sessions: [],
  activeSessionId: null,
  openFiles: [],
  activeFileId: null,
  overlays: {},
  hostState: {},
  settings: defaultSettings,
  activity: "hosts",
  workspaceMode: "terminal",
  locked: false,
  fido2CredentialId: "",
  vaultPassEnabled: false,
});

type VaultActions = {
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  setActivity: (a: Activity) => void;
  setWorkspaceMode: (m: WorkspaceMode) => void;
  upsertHost: (h: Host) => void;
  removeHost: (id: string) => void;
  toggleStar: (id: string) => void;
  toggleGroup: (id: string) => void;
  upsertIdentity: (i: Identity) => void;
  removeIdentity: (id: string) => void;
  upsertSnippet: (s: Snippet) => void;
  removeSnippet: (id: string) => void;
  upsertTunnel: (t: Tunnel) => void;
  removeTunnel: (id: string) => void;
  toggleTunnel: (id: string) => void;
  patchTunnel: (id: string, patch: Partial<Tunnel>) => void;
  resetHostTunnels: (hostId: string) => void;
  bumpTunnelBytes: (id: string, inn: number, out: number) => void;
  addKnownHost: (k: KnownHost) => void;
  openSession: (hostId: string, forceNew?: boolean) => string;
  closeSession: (id: string) => void;
  setActiveSession: (id: string | null) => void;
  markConnected: (id: string, connected: boolean) => void;
  touchHost: (id: string) => void;
  setOverlay: (hostId: string, overlay: FileMap) => void;
  setHostState: (hostId: string, state: HostRuntimeState) => void;
  openFile: (file: OpenFile) => void;
  updateFile: (id: string, content: string) => void;
  closeFile: (id: string) => void;
  setActiveFile: (id: string | null) => void;
  patchSettings: (s: Partial<Settings>) => void;
  importConfig: (text: string, keys?: { name: string; path: string }[]) => number;
  setLocked: (v: boolean) => void;
  setFido2Credential: (id: string) => void;
  resetVault: () => void;
};

export const useVault = create<VaultData & VaultActions>()(
  persist(
    (set, get) => ({
      ...emptyVault(),
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),
      setActivity: (activity) => set({ activity: activity === "snippets" ? "hosts" : activity }),
      setWorkspaceMode: (workspaceMode) => set({ workspaceMode }),
      upsertHost: (h) =>
        set({
          hosts: get().hosts.some((x) => x.id === h.id)
            ? get().hosts.map((x) => (x.id === h.id ? h : x))
            : [...get().hosts, h],
        }),
      removeHost: (id) => set({ hosts: get().hosts.filter((h) => h.id !== id) }),
      toggleStar: (id) => {
        const host = get().hosts.find((h) => h.id === id);
        const nextStar = !host?.starred;
        const alias = host?.name || "";
        const starredAliases = new Set(get().settings.starredAliases || []);
        if (alias) {
          if (nextStar) starredAliases.add(alias);
          else starredAliases.delete(alias);
        }
        set({
          hosts: get().hosts.map((h) => (h.id === id ? { ...h, starred: nextStar } : h)),
          settings: { ...get().settings, starredAliases: [...starredAliases] },
        });
      },
      toggleGroup: (id) =>
        set({
          groups: get().groups.map((g) => (g.id === id ? { ...g, collapsed: !g.collapsed } : g)),
        }),
      upsertIdentity: (i) =>
        set({
          identities: get().identities.some((x) => x.id === i.id)
            ? get().identities.map((x) => (x.id === i.id ? i : x))
            : [...get().identities, i],
        }),
      removeIdentity: (id) => set({ identities: get().identities.filter((i) => i.id !== id) }),
      upsertSnippet: (s) =>
        set({
          snippets: get().snippets.some((x) => x.id === s.id)
            ? get().snippets.map((x) => (x.id === s.id ? s : x))
            : [...get().snippets, s],
        }),
      removeSnippet: (id) => set({ snippets: get().snippets.filter((s) => s.id !== id) }),
      upsertTunnel: (t) =>
        set({
          tunnels: get().tunnels.some((x) => x.id === t.id)
            ? get().tunnels.map((x) => (x.id === t.id ? t : x))
            : [...get().tunnels, t],
        }),
      removeTunnel: (id) => set({ tunnels: get().tunnels.filter((t) => t.id !== id) }),
      toggleTunnel: (id) =>
        set({
          tunnels: get().tunnels.map((t) => (t.id === id ? { ...t, active: !t.active } : t)),
        }),
      patchTunnel: (id, patch) =>
        set({
          tunnels: get().tunnels.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }),
      resetHostTunnels: (hostId) =>
        set({
          tunnels: get().tunnels.map((t) =>
            t.hostId === hostId ? { ...t, active: false, bound: false } : t,
          ),
        }),
      bumpTunnelBytes: (id, inn, out) =>
        set({
          tunnels: get().tunnels.map((t) =>
            t.id === id ? { ...t, bytesIn: t.bytesIn + inn, bytesOut: t.bytesOut + out } : t,
          ),
        }),
      addKnownHost: (k) => {
        if (get().knownHosts.some((x) => x.host === k.host && x.port === k.port)) return;
        set({ knownHosts: [...get().knownHosts, k] });
      },
      openSession: (hostId, forceNew) => {
        const host = get().hosts.find((h) => h.id === hostId);
        if (!forceNew) {
          const live = get().sessions.find((s) => s.hostId === hostId && s.connected);
          if (live) {
            set({ activeSessionId: live.id });
            return live.id;
          }
        }
        const n = get().sessions.filter((s) => s.hostId === hostId).length;
        const id = nid();
        const session: Session = {
          id,
          hostId,
          title: `${host?.name || host?.hostname || "session"}${n ? ` (${n + 1})` : ""}`,
          createdAt: Date.now(),
          connected: false,
        };
        set({ sessions: [...get().sessions, session], activeSessionId: id });
        return id;
      },
      closeSession: (id) => {
        const sessions = get().sessions.filter((s) => s.id !== id);
        const activeSessionId =
          get().activeSessionId === id ? (sessions[sessions.length - 1]?.id ?? null) : get().activeSessionId;
        set({ sessions, activeSessionId });
      },
      setActiveSession: (id) => set({ activeSessionId: id }),
      markConnected: (id, connected) => {
        const cur = get().sessions.find((s) => s.id === id);
        if (!cur || cur.connected === connected) return;
        set({ sessions: get().sessions.map((s) => (s.id === id ? { ...s, connected } : s)) });
      },
      touchHost: (id) =>
        set({
          hosts: get().hosts.map((h) => (h.id === id ? { ...h, lastConnectedAt: Date.now() } : h)),
        }),
      setOverlay: (hostId, overlay) =>
        set({ overlays: { ...get().overlays, [hostId]: overlay } }),
      setHostState: (hostId, state) =>
        set({ hostState: { ...get().hostState, [hostId]: state } }),
      openFile: (file) => {
        const existing = get().openFiles.find((f) => f.hostId === file.hostId && f.path === file.path);
        if (existing) {
          set({ activeFileId: existing.id, workspaceMode: "code" });
          return;
        }
        set({
          openFiles: [...get().openFiles, file],
          activeFileId: file.id,
          workspaceMode: "code",
        });
      },
      updateFile: (id, content) =>
        set({ openFiles: get().openFiles.map((f) => (f.id === id ? { ...f, content } : f)) }),
      closeFile: (id) => {
        const openFiles = get().openFiles.filter((f) => f.id !== id);
        const activeFileId =
          get().activeFileId === id ? (openFiles[openFiles.length - 1]?.id ?? null) : get().activeFileId;
        set({ openFiles, activeFileId });
      },
      setActiveFile: (id) => set({ activeFileId: id }),
      patchSettings: (s) => set({ settings: { ...get().settings, ...s } }),
      importConfig: (text, keys = []) => {
        const parsed = parseSshConfig(text);
        const starred = new Set(get().settings.starredAliases || []);
        const nextIdentities: Identity[] = [];
        const ensureIdentity = (filePath: string) => {
          if (!filePath) return null;
          const existing = nextIdentities.find((i) => i.comment === filePath || i.name === filePath.split(/[\\/]/).pop());
          if (existing) return existing.id;
          const base = filePath.split(/[\\/]/).pop() || "key";
          const sk = /_sk(?:$|\.)/i.test(base) || /sk-/i.test(base);
          const id = `id-file-${base.replace(/[^A-Za-z0-9._-]+/g, "-")}`;
          const already = nextIdentities.find((i) => i.id === id);
          if (already) {
            if (filePath && !already.comment.includes("/") && !already.comment.includes("\\")) already.comment = filePath;
            return already.id;
          }
          nextIdentities.push({
            id,
            name: base,
            kind: sk ? "fido2" : "key",
            username: "",
            password: "",
            privateKey: "",
            publicKey: "",
            fingerprint: "",
            comment: filePath,
            algorithm: sk
              ? "sk-ssh-ed25519@openssh.com"
              : base.includes("ed25519")
                ? "ed25519"
                : base.includes("ecdsa")
                  ? "ecdsa"
                  : "rsa",
            fido2CredentialId: "",
            createdAt: Date.now(),
          });
          return id;
        };
        for (const key of keys) ensureIdentity(key.path);
        const nextTunnels: Tunnel[] = [];
        const nextHosts: Host[] = [];
        const groupId = LAB_IDS.sshconfig;
        for (const h of parsed) {
          const id = `sshcfg-${h.alias.replace(/[^A-Za-z0-9._-]+/g, "-").slice(0, 60) || "host"}`;
          const identityId = ensureIdentity(h.identityFile);
          const next = makeHost({
            id,
            name: h.alias,
            hostname: h.hostname,
            groupId,
            username: h.user,
            os: "linux",
            port: h.port || 22,
            address: h.hostname,
            isLab: false,
            compression: h.compression,
            agentForward: h.forwardAgent,
            keepalive: h.serverAliveInterval || 30,
            identityId,
            tags: ["ssh-config"],
            notes: "",
            jumpHostId: null,
            proxyJump: h.proxyJump,
            fido2Required: /_sk/i.test(h.identityFile),
            starred: starred.has(h.alias),
          });
          for (const fw of h.forwards?.length ? h.forwards : h.localForwards || []) {
            nextTunnels.push({
              id: `tun-${id}-${fw.kind || "local"}-${fw.listen}`,
              name: `${h.alias} :${fw.listen}`,
              kind: fw.kind || "local",
              hostId: id,
              listenHost: fw.listenHost || "127.0.0.1",
              listenPort: fw.listen,
              destHost: fw.destHost || "127.0.0.1",
              destPort: fw.destPort || 0,
              active: false,
              bound: false,
              source: "config",
              bytesIn: 0,
              bytesOut: 0,
            });
          }
          nextHosts.push(next);
        }
        for (const host of nextHosts) {
          const spec = (host.proxyJump || "").split(",")[0]?.trim() || "";
          if (!spec) continue;
          const name = spec.replace(/^[^@]+@/, "").replace(/:\d+$/, "");
          const found = nextHosts.find(
            (x) => x.id !== host.id && (x.name === name || x.hostname === name || x.name === spec),
          );
          if (found) host.jumpHostId = found.id;
        }
        const groups = get().groups.some((g) => g.id === groupId)
          ? get().groups.map((g) => (g.id === groupId ? { ...g, name: "SSH config" } : g))
          : [{ id: groupId, name: "SSH config", collapsed: false }, ...get().groups];
        const userTunnels = get().tunnels.filter((t) => t.source === "user");
        set({ hosts: nextHosts, groups, identities: nextIdentities, tunnels: [...nextTunnels, ...userTunnels] });
        return parsed.length;
      },
      setLocked: (locked) => set({ locked }),
      setFido2Credential: (fido2CredentialId) => set({ fido2CredentialId }),
      resetVault: () => set({ ...emptyVault(), hydrated: true, locked: false }),
    }),
    {
      name: VAULT_KEY,
      storage: createJSONStorage(() => vaultStorage()),
      skipHydration: true,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Record<string, unknown>;
        const settings = { ...current.settings, ...((p.settings as Settings | undefined) ?? {}) };
        if (settings.terminalTheme === "fathom-ink") settings.terminalTheme = "geassline-ink";
        if (!Array.isArray(settings.starredAliases)) settings.starredAliases = [];
        if (typeof settings.sshConfigPath !== "string") settings.sshConfigPath = "";
        const userTunnels = Array.isArray(p.tunnels)
          ? (p.tunnels as Tunnel[]).filter((t) => t && t.source === "user")
          : [];
        return { ...current, settings, tunnels: userTunnels };
      },
      partialize: (s) => ({
        settings: s.settings,
        tunnels: s.tunnels.filter((t) => t.source === "user"),
      }),
    },
  ),
);
