import { useEffect, useState, type ReactNode, lazy, Suspense } from "react";
import {
  KeyRound,
  PanelLeft,
  Plus,
  Server,
  Settings as SettingsIcon,
  ShieldCheck,
  Star,
  Trash2,
  Unplug,
  Upload,
  X,
} from "lucide-react";
import { Toaster } from "sonner";
import { toast } from "@/lib/notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { SftpPanel } from "@/components/sftp-panel";
import { CommandPalette } from "@/components/command-palette";
import { TerminalView } from "@/components/terminal-view";
import { ErrorBoundary } from "@/components/error-boundary";
import { Titlebar } from "@/components/titlebar";
import { AppLogButton, AppLogPanel } from "@/components/app-log-panel";
import { useVault } from "@/lib/store";
import { nid } from "@/lib/id";
import { TERMINAL_THEMES } from "@/lib/themes";
import { desktopBridge } from "@/lib/geassline-desktop";
import { liveSsh } from "@/lib/live-ssh";
import { reloadSshConfig, removeHostFromConfig, syncHostToConfig } from "@/lib/config-sync";
import type { Activity, Host, Tunnel, TunnelKind } from "@/lib/types";
import { formatAgo, formatBytes } from "@/lib/utils";
import { cn } from "@/lib/utils";

const EditorPanel = lazy(() => import("@/components/editor-panel").then((m) => ({ default: m.EditorPanel })));

const ACTIVITIES: { id: Activity; label: string; icon: typeof Server }[] = [
  { id: "hosts", label: "Hosts", icon: Server },
  { id: "tunnels", label: "Tunnels", icon: Unplug },
  { id: "keys", label: "Keys", icon: KeyRound },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

function emptyHost(): Host {
  return {
    id: nid(),
    name: "",
    hostname: "",
    port: 22,
    protocol: "ssh",
    groupId: "g-ssh-config",
    identityId: null,
    username: "",
    tags: [],
    jumpHostId: null,
    proxyJump: "",
    startupCommand: "",
    keepalive: 30,
    compression: false,
    agentForward: false,
    isLab: false,
    os: "linux",
    starred: false,
    notes: "",
    encoding: "utf-8",
    fido2Required: false,
    envText: "",
    address: "",
    latencyMs: 0,
  };
}

export function Workstation() {
  const vault = useVault();
  const [palette, setPalette] = useState(false);
  const [hostOpen, setHostOpen] = useState(false);
  const [editingHost, setEditingHost] = useState<Host | null>(null);
  const [quick, setQuick] = useState("");
  const [hostFilter, setHostFilter] = useState("");
  const [termPanes, setTermPanes] = useState<string[]>([]);
  const [termSplit, setTermSplit] = useState<"horizontal" | "vertical">("horizontal");
  const [sideOn, setSideOn] = useState(true);
  const [sideW, setSideW] = useState(280);

  useEffect(() => {
    useVault.getState().setHydrated(true);
    void (async () => {
      try {
        await Promise.resolve(useVault.persist.rehydrate());
        const desktop = desktopBridge();
        if (desktop?.readSshConfig && useVault.getState().settings.syncSshConfig !== false) {
          const n = await reloadSshConfig();
          const path = useVault.getState().settings.sshConfigPath || "SSH config";
          if (n > 0) toast.success(`Loaded ${n} host${n === 1 ? "" : "s"} from ${path.split(/[\\/]/).pop()}`);
        }
      } finally {
        useVault.getState().setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setPalette(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const session = vault.sessions.find((s) => s.id === vault.activeSessionId);
  const activeHost = session ? vault.hosts.find((h) => h.id === session.hostId) : undefined;
  const identity = activeHost ? vault.identities.find((i) => i.id === activeHost.identityId) : undefined;

  useEffect(() => {
    if (!vault.activeSessionId) return;
    setTermPanes((prev) => {
      if (prev.includes(vault.activeSessionId!)) return prev;
      return prev.length > 1 ? [...prev.slice(0, -1), vault.activeSessionId!] : [vault.activeSessionId!];
    });
  }, [vault.activeSessionId]);

  const connect = (hostId: string, forceNew = false) => {
    const id = vault.openSession(hostId, forceNew);
    setTermPanes((prev) => {
      if (forceNew) return prev.length > 1 ? [...prev.slice(0, -1), id] : [id];
      if (prev.includes(id)) return prev;
      return prev.length > 1 ? [...prev.slice(0, -1), id] : [id];
    });
    vault.setWorkspaceMode(
      forceNew
        ? "terminal"
        : vault.activity === "files"
          ? "files"
          : vault.activity === "code"
            ? "code"
            : vault.activity === "tunnels"
              ? "tunnels"
              : "terminal",
    );
    vault.setActivity("hosts");
    return id;
  };

  const closeTerm = (id: string) => {
    const sess = vault.sessions.find((s) => s.id === id);
    void liveSsh()?.disconnect(id);
    vault.closeSession(id);
    setTermPanes((prev) => prev.filter((x) => x !== id));
    if (sess) {
      const left = useVault
        .getState()
        .sessions.some((s) => s.hostId === sess.hostId && s.id !== id && s.connected);
      if (!left) vault.resetHostTunnels(sess.hostId);
    }
  };

  const newTerminal = () => {
    if (!activeHost) {
      toast.message("Connect a host first");
      return;
    }
    vault.setActivity("hosts");
    vault.setWorkspaceMode("terminal");
    connect(activeHost.id, true);
  };

  const splitTerminal = () => {
    if (!activeHost) return;
    const id = connect(activeHost.id, true);
    setTermPanes((prev) => {
      const base = prev.length ? prev : session ? [session.id] : [];
      if (base.includes(id)) return base;
      return [...base.slice(0, 1), id].slice(0, 2);
    });
  };

  const connectJump = (hostname: string) => {
    const host = vault.hosts.find((h) => h.hostname === hostname || h.name === hostname);
    if (host) connect(host.id);
    else toast.error(`No host named ${hostname}`);
  };

  const quickConnect = () => {
    const raw = quick.trim();
    if (!raw) return;
    const m = raw.match(/^(?:([^@]+)@)?([^:]+)(?::(\d+))?$/);
    if (!m) {
      toast.error("Use user@host or user@host:port");
      return;
    }
    const existing = vault.hosts.find((h) => h.hostname === m[2] && h.username === (m[1] || h.username));
    if (existing) {
      connect(existing.id);
      setQuick("");
      return;
    }
    const host = emptyHost();
    host.username = m[1] || "";
    host.hostname = m[2]!;
    host.name = m[2]!;
    host.port = Number(m[3] || 22);
    host.address = m[2]!;
    host.identityId = null;
    vault.upsertHost(host);
    connect(host.id);
    setQuick("");
  };

  const side =
    vault.activity === "keys" ? (
      <KeysPanel />
    ) : vault.activity === "settings" ? (
      <SettingsPanel />
    ) : vault.activity === "tunnels" ? (
      <TunnelsPanel />
    ) : (
      <HostTree
        filter={hostFilter}
        onFilter={setHostFilter}
        onConnect={connect}
        onEdit={(h) => {
          setEditingHost(h);
          setHostOpen(true);
        }}
        onAdd={() => {
          setEditingHost(emptyHost());
          setHostOpen(true);
        }}
      />
    );

  const work = !session || !activeHost ? (
    <Welcome
      quick={quick}
      setQuick={setQuick}
      onQuick={quickConnect}
      onConnect={connect}
      onAdd={() => {
        setEditingHost(emptyHost());
        setHostOpen(true);
      }}
    />
  ) : null;

  const dragSide = (e: { preventDefault: () => void; clientX: number }) => {
    e.preventDefault();
    const start = e.clientX;
    const startW = sideW;
    const move = (ev: MouseEvent) => setSideW(Math.max(180, Math.min(460, startW + ev.clientX - start)));
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground">
        <Titlebar
          quick={quick}
          onQuickChange={setQuick}
          onQuickConnect={quickConnect}
          onCommandPalette={() => setPalette(true)}
          onNewHost={() => {
            setEditingHost(emptyHost());
            setHostOpen(true);
          }}
          onToggleSplit={splitTerminal}
        />

        <div className="flex min-h-0 flex-1">
          <nav className="hidden w-12 shrink-0 flex-col items-center gap-1 border-r border-border bg-sidebar py-2 md:flex">
            <Tooltip label={sideOn ? "Hide hosts" : "Show hosts"}>
              <button
                onClick={() => setSideOn((v) => !v)}
                className="flex size-10 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                aria-label="Toggle host panel"
              >
                <PanelLeft className="size-4" />
              </button>
            </Tooltip>
            {ACTIVITIES.map((a) => {
              const Icon = a.icon;
              const on = vault.activity === a.id;
              return (
                <Tooltip key={a.id} label={a.label}>
                  <button
                    onClick={() => {
                      vault.setActivity(a.id);
                      setSideOn(true);
                    }}
                    className={cn(
                      "relative flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-surface-2 hover:text-foreground",
                      on && "bg-surface-2 text-foreground",
                    )}
                    aria-label={a.label}
                  >
                    {on ? <span className="absolute left-0 h-5 w-px bg-foreground" /> : null}
                    <Icon className="size-4" />
                  </button>
                </Tooltip>
              );
            })}
          </nav>

          {sideOn ? (
            <aside
              className="relative hidden h-full min-h-0 shrink-0 flex-col border-r border-border bg-surface md:flex"
              style={{ width: sideW }}
            >
              {side}
              <div
                className="absolute right-0 top-0 z-10 h-full w-1 cursor-col-resize hover:bg-foreground/30"
                onMouseDown={dragSide}
              />
            </aside>
          ) : null}

          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {vault.sessions.length ? (
              <div className="flex h-9 shrink-0 items-center gap-1 border-b border-border px-1">
                {vault.sessions.map((s) => {
                  const h = vault.hosts.find((x) => x.id === s.hostId);
                  const on = s.id === vault.activeSessionId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => vault.setActiveSession(s.id)}
                      className={cn(
                        "inline-flex h-7 max-w-40 items-center gap-1.5 rounded-md px-2 text-xs",
                        on ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span className={cn("size-1.5 rounded-full", s.connected ? "bg-ok" : "bg-muted")} />
                      <span className="truncate">{s.title || h?.name}</span>
                      <span
                        role="button"
                        className="rounded p-0.5 hover:bg-background"
                        onClick={(e) => {
                          e.stopPropagation();
                          closeTerm(s.id);
                        }}
                      >
                        <X className="size-3" />
                      </span>
                    </button>
                  );
                })}
                <button
                  className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                  title="New terminal on this host"
                  onClick={newTerminal}
                >
                  <Plus className="size-3.5" />
                  Terminal
                </button>
                <div className="ml-auto flex items-center gap-1 px-1">
                  {(["terminal", "files", "code", "tunnels"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => vault.setWorkspaceMode(m)}
                      className={cn(
                        "hidden h-7 rounded-md px-2 text-[11px] capitalize sm:inline-flex sm:items-center",
                        vault.workspaceMode === m ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="relative min-h-0 flex-1 overflow-hidden">
              {!session || !activeHost ? (
                work
              ) : (
                <>
                  {vault.sessions.map((s) => {
                    const h = vault.hosts.find((x) => x.id === s.hostId);
                    if (!h) return null;
                    const ident = vault.identities.find((i) => i.id === h.identityId);
                    const inSplit = termPanes.length > 1 && termPanes.includes(s.id);
                    const show = vault.workspaceMode === "terminal" && (inSplit || (termPanes.length <= 1 && s.id === session.id));
                    return (
                      <div
                        key={s.id}
                        className={
                          show && termPanes.length <= 1
                            ? "absolute inset-0 z-10"
                            : "pointer-events-none invisible absolute inset-0 z-0"
                        }
                        aria-hidden={!show || termPanes.length > 1}
                      >
                        {termPanes.length <= 1 ? (
                          <ErrorBoundary>
                            <TerminalView
                              sessionId={s.id}
                              host={h}
                              identity={ident}
                              settings={vault.settings}
                              active={show}
                              onJump={connectJump}
                            />
                          </ErrorBoundary>
                        ) : null}
                      </div>
                    );
                  })}
                  {termPanes.length > 1 && vault.workspaceMode === "terminal" ? (
                    <div
                      className={cn(
                        "absolute inset-0 z-10 flex",
                        termSplit === "vertical" ? "flex-col" : "flex-row",
                      )}
                    >
                      {termPanes.map((id) => {
                        const s = vault.sessions.find((x) => x.id === id);
                        const h = s ? vault.hosts.find((x) => x.id === s.hostId) : undefined;
                        if (!s || !h) return null;
                        const ident = vault.identities.find((i) => i.id === h.identityId);
                        return (
                          <div key={id} className="relative min-h-0 min-w-0 flex-1 border-border even:border-l even:border-t-0">
                            <ErrorBoundary>
                              <TerminalView
                                sessionId={s.id}
                                host={h}
                                identity={ident}
                                settings={vault.settings}
                                active
                                onJump={connectJump}
                              />
                            </ErrorBoundary>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                  {vault.sessions
                    .map((s) => s.hostId)
                    .filter((id, i, arr) => arr.indexOf(id) === i)
                    .map((hostId) => {
                      const h = vault.hosts.find((x) => x.id === hostId);
                      const sess =
                        vault.sessions.find((s) => s.hostId === hostId && s.connected) ||
                        vault.sessions.find((s) => s.hostId === hostId);
                      if (!h || !sess) return null;
                      const show = vault.workspaceMode === "files" && activeHost?.id === hostId;
                      return (
                        <div
                          key={`files-${hostId}`}
                          className={
                            show ? "absolute inset-0 z-20 bg-background" : "pointer-events-none invisible absolute inset-0 z-0"
                          }
                          aria-hidden={!show}
                        >
                          <SftpPanel sessionId={sess.id} host={h} active={show} />
                        </div>
                      );
                    })}
                  {vault.workspaceMode === "files" ? null : vault.workspaceMode === "code" ? (
                    <div className="absolute inset-0 z-20 overflow-hidden bg-background">
                      <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Opening editor…</div>}>
                        <EditorPanel sessionId={session.id} />
                      </Suspense>
                    </div>
                  ) : null}
                  {vault.workspaceMode === "tunnels" ? (
                    <div className="absolute inset-0 z-20 bg-background">
                      <TunnelsPanel />
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </main>
        </div>

        <footer className="flex h-8 shrink-0 items-center justify-between border-t border-border px-3 text-[11px] text-muted-foreground">
          <div className="flex min-w-0 items-center gap-3 truncate">
            {activeHost ? (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-ok" />
                  {activeHost.username}@{activeHost.hostname}:{activeHost.port}
                </span>
                {activeHost.proxyJump ? <span className="hidden md:inline">via {activeHost.proxyJump}</span> : null}
                {identity?.kind === "fido2" ? (
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="size-3" /> FIDO2
                  </span>
                ) : null}
              </>
            ) : (
              <span>{vault.hosts.length} hosts</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">UTF-8</span>
            <span className="tabular-nums">{vault.settings.fontSize}px</span>
            <AppLogButton />
          </div>
        </footer>
        <AppLogPanel />

        <nav className="flex h-14 shrink-0 items-center justify-around border-t border-border bg-sidebar md:hidden">
          {ACTIVITIES.filter((a) => ["hosts", "keys", "settings"].includes(a.id)).map((a) => {
            const Icon = a.icon;
            const on = vault.activity === a.id;
            return (
              <button
                key={a.id}
                onClick={() => {
                  vault.setActivity(a.id);
                }}
                className={cn(
                  "flex min-w-11 flex-col items-center gap-0.5 text-[10px]",
                  on ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
                {a.label}
              </button>
            );
          })}
        </nav>

        <CommandPalette open={palette} onOpenChange={setPalette} onConnect={connect} />
        <HostDialog
          open={hostOpen}
          host={editingHost}
          onOpenChange={setHostOpen}
          onSave={(h) => {
            const prev = editingHost?.name;
            void (async () => {
              const ok = await syncHostToConfig(
                { ...h, name: h.name || h.hostname, address: h.address || h.hostname },
                prev && prev !== h.name ? prev : undefined,
              );
              if (ok) {
                toast.success("Saved to SSH config");
                setHostOpen(false);
              }
            })();
          }}
        />
        <Toaster position="bottom-right" theme="dark" />
      </div>
    </TooltipProvider>
  );
}

function Welcome({
  quick,
  setQuick,
  onQuick,
  onConnect,
  onAdd,
}: {
  quick: string;
  setQuick: (v: string) => void;
  onQuick: () => void;
  onConnect: (id: string) => void;
  onAdd: () => void;
}) {
  const hosts = useVault((s) => s.hosts);
  const toggleStar = useVault((s) => s.toggleStar);
  const sshHosts = hosts.filter((h) => h.groupId === "g-ssh-config");
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const match = (h: Host) =>
    !query || [h.name, h.hostname, h.username, h.proxyJump, ...h.tags].join(" ").toLowerCase().includes(query);
  const visible = hosts.filter(match);
  const pinned = visible.filter((h) => h.starred);
  const recent = visible
    .filter((h) => !h.starred && h.lastConnectedAt)
    .sort((a, b) => (b.lastConnectedAt || 0) - (a.lastConnectedAt || 0))
    .slice(0, 8);
  const rest = visible.filter((h) => !h.starred && !recent.some((r) => r.id === h.id));

  const Row = ({ h }: { h: Host }) => (
    <div className="group flex items-center border-b border-border/60 last:border-0">
      <button onClick={() => onConnect(h.id)} className="min-w-0 flex-1 px-3 py-2 text-left hover:bg-surface-2">
        <div className="flex items-center gap-2">
          <span className="size-1.5 shrink-0 rounded-full bg-ok" />
          <span className="truncate text-sm">{h.name}</span>
          {h.proxyJump ? <span className="truncate text-[11px] text-muted-foreground">via {h.proxyJump}</span> : null}
        </div>
        <p className="truncate pl-3.5 font-mono text-[11px] text-muted-foreground">
          {h.username}@{h.hostname}
          {h.lastConnectedAt ? ` · ${formatAgo(h.lastConnectedAt)}` : ""}
        </p>
      </button>
      <button
        className={cn("p-2 hover:text-foreground", h.starred ? "text-foreground" : "text-muted-foreground opacity-0 group-hover:opacity-100")}
        onClick={() => toggleStar(h.id)}
        title={h.starred ? "Unpin" : "Pin"}
      >
        <Star className={cn("size-3.5", h.starred && "fill-foreground")} />
      </button>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden px-6 py-8 md:px-10">
      <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">SSH client</p>
        <h1 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">Connect to a host</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground text-pretty">
          Uses Windows OpenSSH. Hosts load from your SSH config.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Input
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onQuick()}
            placeholder="user@host[:port]"
            className="font-mono"
          />
          <Button onClick={onQuick} className="h-10">
            Connect
          </Button>
          <Button variant="outline" onClick={onAdd} className="h-10">
            Add host
          </Button>
          <p className="flex h-10 items-center text-xs text-muted-foreground">
            {sshHosts.length ? `${sshHosts.length} from SSH config` : "Reads SSH config"}
          </p>
        </div>
        <div className="mt-6 shrink-0">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search hosts" className="h-9" />
        </div>
        <div className="mt-4 min-h-0 flex-1 overflow-auto geassline-scroll rounded-lg border border-border bg-surface">
          {!hosts.length ? (
            <p className="p-4 text-sm text-muted-foreground">No hosts yet. Add one, or load ~/.ssh/config.</p>
          ) : !visible.length ? (
            <p className="p-4 text-sm text-muted-foreground">No hosts match.</p>
          ) : (
            <>
              {pinned.length ? (
                <section>
                  <h2 className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Pinned</h2>
                  {pinned.map((h) => (
                    <Row key={h.id} h={h} />
                  ))}
                </section>
              ) : null}
              {recent.length && !query ? (
                <section>
                  <h2 className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Recent</h2>
                  {recent.map((h) => (
                    <Row key={h.id} h={h} />
                  ))}
                </section>
              ) : null}
              {rest.length ? (
                <section>
                  <h2 className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {query || pinned.length || recent.length ? "All" : "Hosts"}
                  </h2>
                  {rest.map((h) => (
                    <Row key={h.id} h={h} />
                  ))}
                </section>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function HostTree({
  filter,
  onFilter,
  onConnect,
  onEdit,
  onAdd,
}: {
  filter: string;
  onFilter: (v: string) => void;
  onConnect: (id: string) => void;
  onEdit: (h: Host) => void;
  onAdd: () => void;
}) {
  const hosts = useVault((s) => s.hosts);
  const groups = useVault((s) => s.groups);
  const toggleStar = useVault((s) => s.toggleStar);
  const toggleGroup = useVault((s) => s.toggleGroup);
  const removeHost = useVault((s) => s.removeHost);
  const q = filter.toLowerCase();
  const visible = q
    ? hosts.filter((h) => [h.name, h.hostname, h.username, ...h.tags].join(" ").toLowerCase().includes(q))
    : hosts;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-border p-2">
        <Input value={filter} onChange={(e) => onFilter(e.target.value)} placeholder="Filter hosts" className="h-8" />
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus className="size-3.5" />
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        {groups.map((g) => {
          const list = visible.filter((h) => h.groupId === g.id);
          if (!list.length && q) return null;
          return (
            <div key={g.id} className="px-1 py-1">
              <button
                onClick={() => toggleGroup(g.id)}
                className="flex w-full items-center justify-between px-2 py-1 text-[11px] uppercase tracking-wide text-muted-foreground"
              >
                <span>
                  {g.name} {list.length}
                </span>
              </button>
              {g.collapsed ? null : (
                <div>
                  {list.map((h) => (
                    <div key={h.id} className="group flex items-start">
                      <button onClick={() => onConnect(h.id)} className="min-w-0 flex-1 px-2 py-1.5 text-left hover:bg-surface-2">
                        <div className="flex items-center gap-2">
                          <span className="size-1.5 rounded-full bg-ok" />
                          <span className="truncate text-sm">{h.name}</span>
                        </div>
                        <div className="truncate pl-3.5 font-mono text-[11px] text-muted-foreground">
                          {h.username}@{h.hostname}
                        </div>
                      </button>
                      <button
                        className={cn(
                          "p-2 hover:text-foreground",
                          h.starred ? "text-foreground opacity-100" : "text-muted-foreground opacity-0 group-hover:opacity-100",
                        )}
                        onClick={() => toggleStar(h.id)}
                        title={h.starred ? "Unpin" : "Pin"}
                      >
                        <Star className={cn("size-3.5", h.starred && "fill-foreground")} />
                      </button>
                      <button className="p-2 text-muted-foreground hover:text-foreground" onClick={() => onEdit(h)}>
                        <SettingsIcon className="size-3.5" />
                      </button>
                      <button
                        className="p-2 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          void removeHostFromConfig(h.name);
                          removeHost(h.id);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </ScrollArea>
    </div>
  );
}

function HostDialog({
  open,
  host,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  host: Host | null;
  onOpenChange: (v: boolean) => void;
  onSave: (h: Host) => void;
}) {
  const groups = useVault((s) => s.groups);
  const identities = useVault((s) => s.identities);
  const [draft, setDraft] = useState<Host | null>(host);
  useEffect(() => setDraft(host), [host, open]);
  if (!draft) return null;
  const set = <K extends keyof Host>(k: K, v: Host[K]) => setDraft({ ...draft, [k]: v });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Host">
        <div className="grid max-h-[70vh] gap-3 overflow-auto pr-1">
          <Field label="Name">
            <Input value={draft.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Host / IP">
            <Input
              value={draft.hostname}
              onChange={(e) => {
                const v = e.target.value;
                setDraft({ ...draft, hostname: v, address: v });
              }}
              className="font-mono"
              autoComplete="off"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Port">
              <Input type="number" value={draft.port} onChange={(e) => set("port", Number(e.target.value) || 22)} />
            </Field>
            <Field label="User">
              <Input value={draft.username} onChange={(e) => set("username", e.target.value)} />
            </Field>
          </div>
          <Field label="Group">
            <select className="h-10 w-full rounded-md border border-border bg-input px-3 text-sm" value={draft.groupId} onChange={(e) => set("groupId", e.target.value)}>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Identity">
            <select className="h-10 w-full rounded-md border border-border bg-input px-3 text-sm" value={draft.identityId ?? ""} onChange={(e) => set("identityId", e.target.value || null)}>
              <option value="">None — password in terminal</option>
              {identities.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                  {i.kind === "fido2" ? " (FIDO2)" : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ProxyJump">
            <Input value={draft.proxyJump} onChange={(e) => set("proxyJump", e.target.value)} placeholder="user@jump.example.com" className="font-mono" />
          </Field>
          <label className="flex items-center justify-between text-sm">
            Forward agent
            <Switch checked={draft.agentForward} onCheckedChange={(v) => set("agentForward", v)} />
          </label>
          <label className="flex items-center justify-between text-sm">
            Compression
            <Switch checked={draft.compression} onCheckedChange={(v) => set("compression", v)} />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => {
              const name = draft.name.trim() || draft.hostname.trim();
              if (!name) {
                toast.error("Name or host is required");
                return;
              }
              onSave({ ...draft, name, address: draft.address || draft.hostname });
            }}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function KeysPanel() {
  const identities = useVault((s) => s.identities);
  return (
    <div className="flex h-full min-h-0 flex-col p-3">
      <h2 className="text-sm font-medium">Keys</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Files in ~/.ssh. FIDO2 keys are the *_sk files from ssh-keygen -t ed25519-sk.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            const desktop = desktopBridge();
            if (!desktop?.importSshKey) {
              toast.error("Import keys in the desktop app");
              return;
            }
            const res = await desktop.importSshKey();
            if (res?.cancelled) return;
            await reloadSshConfig();
            toast.success(`Imported ${res?.name || "key"}`);
          }}
        >
          <Upload className="size-3.5" /> Import file
        </Button>
      </div>
      <ScrollArea className="mt-3 min-h-0 flex-1">
        {identities.length ? (
          identities.map((i) => (
            <div key={i.id} className="mb-2 rounded-md border border-border p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm">{i.name}</span>
                {i.kind === "fido2" ? <Badge tone="ok">FIDO2</Badge> : null}
              </div>
              <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{i.comment || i.algorithm}</p>
            </div>
          ))
        ) : (
          <p className="px-1 text-xs text-muted-foreground">No keys in ~/.ssh yet.</p>
        )}
      </ScrollArea>
    </div>
  );
}

function tunnelPreview(t: Pick<Tunnel, "kind" | "listenHost" | "listenPort" | "destHost" | "destPort">) {
  const bind = `${t.listenHost || "127.0.0.1"}:${t.listenPort || "—"}`;
  if (t.kind === "dynamic") return `SOCKS5 on this PC ${bind}`;
  const dest = `${t.destHost || "127.0.0.1"}:${t.destPort || "—"}`;
  if (t.kind === "remote") return `host ${bind} → this PC ${dest}`;
  return `this PC ${bind} → host ${dest}`;
}

function TunnelsPanel() {
  const tunnels = useVault((s) => s.tunnels);
  const hosts = useVault((s) => s.hosts);
  const sessions = useVault((s) => s.sessions);
  const activeSessionId = useVault((s) => s.activeSessionId);
  const patchTunnel = useVault((s) => s.patchTunnel);
  const upsert = useVault((s) => s.upsertTunnel);
  const remove = useVault((s) => s.removeTunnel);
  const [kind, setKind] = useState<TunnelKind>("local");
  const [name, setName] = useState("");
  const [hostId, setHostId] = useState("");
  const [listenHost, setListenHost] = useState("127.0.0.1");
  const [listenPort, setListenPort] = useState("");
  const [destHost, setDestHost] = useState("127.0.0.1");
  const [destPort, setDestPort] = useState("");
  const [persist, setPersist] = useState(false);
  const fallbackHostId = sessions.find((s) => s.id === activeSessionId)?.hostId ?? hosts[0]?.id ?? "";
  const selectedHostId = hostId || fallbackHostId;

  const setForward = async (t: Tunnel, want: boolean) => {
    const ssh = liveSsh();
    const sess = sessions.find((s) => s.hostId === t.hostId && s.connected);
    if (want) {
      if (t.active) return;
      if (!ssh || !sess) {
        toast.error("Connect the host first");
        return;
      }
      if (t.bound) {
        patchTunnel(t.id, { active: true });
        return;
      }
      const res = await ssh.forwardLocal(sess.id, {
        kind: t.kind,
        listenHost: t.listenHost || "127.0.0.1",
        listenPort: t.listenPort,
        destHost: t.destHost || "127.0.0.1",
        destPort: t.destPort,
      });
      if (!res.ok && !/already in use/i.test(res.error || "")) {
        toast.error(res.error || "Could not start forward");
        return;
      }
      patchTunnel(t.id, { active: true, bound: false });
      return;
    }
    if (t.bound) {
      toast.message("This forward is on the host session. Close the host to drop it.");
      return;
    }
    if (ssh && sess) void ssh.stopForward?.(sess.id, t.listenPort);
    patchTunnel(t.id, { active: false });
  };

  const saveToConfig = async (t: Tunnel) => {
    const host = hosts.find((h) => h.id === t.hostId);
    if (!host) {
      toast.error("Pick a host");
      return;
    }
    patchTunnel(t.id, { persist: true, source: "config" });
    const ok = await syncHostToConfig(host);
    if (ok) toast.success("Written to SSH config");
  };

  const addTunnel = async () => {
    const host = hosts.find((h) => h.id === selectedHostId);
    if (!host) {
      toast.error("Select a host");
      return;
    }
    const listen = Number(listenPort);
    const dest = Number(destPort);
    if (!listen) {
      toast.error(kind === "dynamic" ? "SOCKS port is required" : "Listen port is required");
      return;
    }
    if (kind !== "dynamic" && !dest) {
      toast.error(kind === "remote" ? "Local port is required" : "Remote port is required");
      return;
    }
    const t: Tunnel = {
      id: nid(),
      name: name.trim() || `${kind} :${listen}`,
      kind,
      hostId: host.id,
      listenHost: listenHost.trim() || "127.0.0.1",
      listenPort: listen,
      destHost: kind === "dynamic" ? "" : destHost.trim() || "127.0.0.1",
      destPort: kind === "dynamic" ? 0 : dest,
      active: false,
      bound: false,
      source: persist ? "config" : "user",
      persist,
      bytesIn: 0,
      bytesOut: 0,
    };
    upsert(t);
    if (persist) {
      const ok = await syncHostToConfig(host);
      if (ok) toast.success("Written to SSH config");
    } else {
      toast.success("Tunnel added for this session");
    }
    setName("");
    setListenPort("");
    setDestPort("");
  };

  const kindHelp =
    kind === "remote"
      ? "Listen on the server and send traffic to this PC."
      : kind === "dynamic"
        ? "SOCKS5 proxy on this PC through the SSH host."
        : "Listen on this PC and send traffic to a host on the server.";

  return (
    <div className="flex h-full min-h-0 flex-col p-3">
      <h2 className="text-sm font-medium">Tunnels</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Config forwards start with the first terminal. Extra ones need Enable after you connect.
      </p>
      <ScrollArea className="mt-3 min-h-0 flex-1">
        {tunnels.length ? (
          tunnels.map((t) => {
            const host = hosts.find((h) => h.id === t.hostId);
            const on = !!t.active;
            return (
              <div key={t.id} className="mb-2 rounded-md border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm">{t.name}</span>
                      <Badge tone="muted">{t.kind}</Badge>
                      <Badge tone={on ? "ok" : "muted"}>{on ? "up" : "down"}</Badge>
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                      {host?.name || "host"} · {tunnelPreview(t)}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {t.bound
                        ? "On the host session. Close the host to drop."
                        : t.source === "config"
                          ? "In SSH config"
                          : "Ad-hoc — not in SSH config"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch checked={on} disabled={!!t.bound} onCheckedChange={(want) => void setForward(t, want)} />
                    {t.source !== "config" ? (
                      <button
                        className="px-1 text-[10px] text-muted-foreground hover:text-foreground"
                        onClick={() => void saveToConfig(t)}
                        title="Write this forward to SSH config"
                      >
                        Save
                      </button>
                    ) : null}
                    <button
                      className="p-2 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        remove(t.id);
                        const host = hosts.find((h) => h.id === t.hostId);
                        if (host && (t.source === "config" || t.persist)) void syncHostToConfig(host);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="px-1 text-xs text-muted-foreground">No tunnels. Forwards in SSH config are imported on launch.</p>
        )}
      </ScrollArea>
      <Separator className="my-3" />
      <div className="flex gap-1">
        {(["local", "remote", "dynamic"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={cn(
              "h-7 rounded-md px-2 text-[11px] capitalize",
              kind === k ? "bg-foreground text-background" : "bg-surface-2 text-muted-foreground",
            )}
          >
            {k}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{kindHelp}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label="Host">
          <select
            className="h-8 w-full rounded-md border border-border bg-input px-2 text-sm"
            value={selectedHostId}
            onChange={(e) => setHostId(e.target.value)}
          >
            {!hosts.length ? <option value="">No hosts</option> : null}
            {hosts.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8" placeholder="Optional" />
        </Field>
        <Field label={kind === "remote" ? "Bind on server" : "Bind on this PC"}>
          <Input value={listenHost} onChange={(e) => setListenHost(e.target.value)} className="h-8 font-mono" placeholder="127.0.0.1" />
        </Field>
        <Field label={kind === "dynamic" ? "SOCKS port" : kind === "remote" ? "Remote port" : "Local port"}>
          <Input value={listenPort} onChange={(e) => setListenPort(e.target.value)} className="h-8 font-mono" placeholder="port" />
        </Field>
        {kind !== "dynamic" ? (
          <>
            <Field label={kind === "remote" ? "Host on this PC" : "Host on the server"}>
              <Input value={destHost} onChange={(e) => setDestHost(e.target.value)} className="h-8 font-mono" placeholder="127.0.0.1" />
            </Field>
            <Field label={kind === "remote" ? "Local port" : "Remote port"}>
              <Input value={destPort} onChange={(e) => setDestPort(e.target.value)} className="h-8 font-mono" placeholder="port" />
            </Field>
          </>
        ) : null}
      </div>
      <p className="mt-2 font-mono text-[11px] text-muted-foreground">
        {tunnelPreview({
          kind,
          listenHost,
          listenPort: Number(listenPort) || 0,
          destHost,
          destPort: Number(destPort) || 0,
        })}
      </p>
      <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <input type="checkbox" checked={persist} onChange={(e) => setPersist(e.target.checked)} />
        Write to SSH config
      </label>
      <Button size="sm" className="mt-2" onClick={() => void addTunnel()}>
        Add
      </Button>
    </div>
  );
}

function SettingsPanel() {
  const settings = useVault((s) => s.settings);
  const patch = useVault((s) => s.patchSettings);
  const resetVault = useVault((s) => s.resetVault);
  const desktop = desktopBridge();
  const configLabel = settings.sshConfigPath || "%USERPROFILE%\\.ssh\\config";
  return (
    <div className="flex h-full min-h-0 flex-col overflow-auto p-3">
      <h2 className="text-sm font-medium">Settings</h2>
      <div className="mt-3 flex flex-col gap-3">
        <Field label="Theme">
          <select className="h-10 w-full rounded-md border border-border bg-input px-3 text-sm" value={settings.terminalTheme} onChange={(e) => patch({ terminalTheme: e.target.value })}>
            {TERMINAL_THEMES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
        <Field label="Font size">
          <Input type="number" value={settings.fontSize} onChange={(e) => patch({ fontSize: Number(e.target.value) || 13 })} />
        </Field>
        <label className="flex items-center justify-between text-sm">
          Blink cursor
          <Switch checked={settings.cursorBlink} onCheckedChange={(v) => patch({ cursorBlink: v })} />
        </label>
        <label className="flex items-center justify-between text-sm">
          Copy on select
          <Switch checked={settings.copyOnSelect} onCheckedChange={(v) => patch({ copyOnSelect: v })} />
        </label>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Ctrl+C copies and clears a selection, or interrupts. Ctrl+V pastes. Right-click Copy / Paste.
        </p>
        <Field label="SSH config file">
          <p className="mb-2 break-all font-mono text-[11px] text-foreground">{configLabel}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!desktop?.pickSshConfig) {
                  toast.error("Choose a config file in the desktop app");
                  return;
                }
                const picked = await desktop.pickSshConfig();
                if (picked?.cancelled || !picked?.path) return;
                patch({ sshConfigPath: picked.path });
                const n = useVault.getState().importConfig(picked.text || "", picked.keys || []);
                toast.success(`Using ${picked.path.split(/[\\/]/).pop()} (${n} hosts)`);
              }}
            >
              Choose file
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                patch({ sshConfigPath: "" });
                const n = await reloadSshConfig();
                toast.success(`Default config (${n} hosts)`);
              }}
            >
              Use default
            </Button>
          </div>
        </Field>
        <Button variant="outline" size="sm" onClick={() => resetVault()}>Reset local data</Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs text-muted-foreground">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
