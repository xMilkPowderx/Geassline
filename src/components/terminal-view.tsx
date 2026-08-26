import { useEffect, useMemo, useRef, useState } from "react";
import type { Host, Identity, Settings } from "@/lib/types";
import { getTheme } from "@/lib/themes";
import { useVault } from "@/lib/store";
import { desktopBridge } from "@/lib/geassline-desktop";
import { liveSsh, needsPasswordPrompt, sshConnectOpts } from "@/lib/live-ssh";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/notice";

type Props = {
  sessionId: string;
  host: Host;
  identity?: Identity;
  settings: Settings;
  active?: boolean;
  onJump: (hostname: string) => void;
};

async function readClipboard(): Promise<string> {
  const desktop = desktopBridge();
  if (desktop?.clipboardRead) return desktop.clipboardRead() || "";
  try {
    return await navigator.clipboard.readText();
  } catch {
    return "";
  }
}

function writeClipboard(text: string) {
  if (!text) return;
  const desktop = desktopBridge();
  if (desktop?.clipboardWrite) {
    desktop.clipboardWrite(text);
    return;
  }
  void navigator.clipboard.writeText(text).catch(() => undefined);
}

export function TerminalView({ sessionId, host, identity, settings, active = true }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<import("@xterm/xterm").Terminal | undefined>(undefined);
  const fitRef = useRef<import("@xterm/addon-fit").FitAddon | undefined>(undefined);
  const activeRef = useRef(active);
  activeRef.current = active;
  const markConnected = useVault((s) => s.markConnected);
  const touchHost = useVault((s) => s.touchHost);
  const patchTunnel = useVault((s) => s.patchTunnel);
  const resetHostTunnels = useVault((s) => s.resetHostTunnels);
  const hosts = useVault((s) => s.hosts);
  const identities = useVault((s) => s.identities);
  const allTunnels = useVault((s) => s.tunnels);
  const tunnels = useMemo(
    () => allTunnels.filter((t) => t.hostId === host.id && t.kind === "local"),
    [allTunnels, host.id],
  );
  const askPass = needsPasswordPrompt(identity);
  const [password, setPassword] = useState(identity?.kind === "password" ? identity.password : "");
  const [authed, setAuthed] = useState(!askPass);

  useEffect(() => {
    if (!active) return;
    fitRef.current?.fit();
    const term = termRef.current;
    if (term) void liveSsh()?.resize(sessionId, term.cols, term.rows);
  }, [active, sessionId]);

  useEffect(() => {
    if (!authed) return;
    const el = wrapRef.current;
    if (!el) return;
    let disposed = false;
    let term: import("@xterm/xterm").Terminal | undefined;
    let fit: import("@xterm/addon-fit").FitAddon | undefined;
    const ro = new ResizeObserver(() => {
      fit?.fit();
      if (term) void liveSsh()?.resize(sessionId, term.cols, term.rows);
    });
    const unsubs: Array<() => void> = [];

    (async () => {
      const [{ Terminal }, { FitAddon }, { WebLinksAddon }] = await Promise.all([
        import("@xterm/xterm"),
        import("@xterm/addon-fit"),
        import("@xterm/addon-web-links"),
        import("@xterm/xterm/css/xterm.css"),
      ]);
      if (disposed || !wrapRef.current) return;
      const theme = getTheme(settings.terminalTheme);
      term = new Terminal({
        theme,
        fontFamily: settings.fontFamily,
        fontSize: settings.fontSize,
        cursorStyle: settings.cursorStyle,
        cursorBlink: settings.cursorBlink,
        scrollback: settings.scrollback,
        allowProposedApi: true,
        convertEol: false,
        rightClickSelectsWord: false,
      });
      fit = new FitAddon();
      term.loadAddon(fit);
      term.loadAddon(new WebLinksAddon());
      term.open(wrapRef.current);
      fit.fit();
      ro.observe(wrapRef.current);
      termRef.current = term;
      fitRef.current = fit;

      const lastSel = { current: "" };

      const sendPaste = (raw: string) => {
        if (!raw || disposed) return;
        const normalized = raw.replace(/\r\n/g, "\n").replace(/\n/g, "\r");
        void liveSsh()?.write(sessionId, normalized);
      };

      const snapshotSel = () => {
        const live = term!.hasSelection() ? term!.getSelection() : "";
        if (live) lastSel.current = live;
        return lastSel.current;
      };

      term.onSelectionChange(() => {
        if (term!.hasSelection()) lastSel.current = term!.getSelection();
      });

      if (settings.copyOnSelect) {
        term.onSelectionChange(() => {
          if (term!.hasSelection()) writeClipboard(term!.getSelection());
        });
      }

      term.attachCustomKeyEventHandler((ev) => {
        if (ev.type !== "keydown" || !activeRef.current) return true;
        const ctrl = ev.ctrlKey || ev.metaKey;
        if (ctrl && ev.code === "KeyC" && !ev.altKey && !ev.shiftKey) {
          return !(term!.hasSelection() || lastSel.current);
        }
        if (ctrl && ev.code === "KeyV" && !ev.altKey) {
          ev.preventDefault();
          void readClipboard().then(sendPaste);
          return false;
        }
        return true;
      });

      const onCopy = (ev: ClipboardEvent) => {
        if (!activeRef.current) return;
        if (term!.hasSelection() || lastSel.current) {
          const sel = snapshotSel();
          if (sel && ev.clipboardData) ev.clipboardData.setData("text/plain", sel);
          writeClipboard(sel);
          ev.preventDefault();
          requestAnimationFrame(() => {
            term!.clearSelection();
            lastSel.current = "";
          });
        } else {
          ev.preventDefault();
        }
      };
      wrapRef.current.addEventListener("copy", onCopy);
      unsubs.push(() => wrapRef.current?.removeEventListener("copy", onCopy));

      const onPointerDown = (e: PointerEvent) => {
        if (!activeRef.current) return;
        if (e.button === 2) snapshotSel();
      };
      const onContext = (e: MouseEvent) => {
        if (!activeRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        const selection = snapshotSel();
        const desktop = desktopBridge();
        if (!desktop?.termContextMenu) return;
        void desktop.termContextMenu({ selection }).then((result) => {
          if (result.action === "paste") sendPaste(result.text || "");
        });
      };
      wrapRef.current.addEventListener("pointerdown", onPointerDown, true);
      wrapRef.current.addEventListener("contextmenu", onContext, true);
      unsubs.push(() => {
        wrapRef.current?.removeEventListener("pointerdown", onPointerDown, true);
        wrapRef.current?.removeEventListener("contextmenu", onContext, true);
      });

      const ssh = liveSsh();
      const desktop = desktopBridge();
      if (!ssh || !desktop?.liveSsh) {
        term.writeln("\x1b[33mSSH runs in the Geassline desktop app.\x1b[0m");
        markConnected(sessionId, false);
        return;
      }

      const jump = host.jumpHostId ? hosts.find((h) => h.id === host.jumpHostId) : undefined;
      const jumpIdentity = jump ? identities.find((i) => i.id === jump.identityId) : undefined;

      const unData = ssh.onData((payload) => {
        if (payload.sessionId !== sessionId || disposed) return;
        const bytes = Uint8Array.from(atob(payload.data), (c) => c.charCodeAt(0));
        term!.write(bytes);
      });
      const unClose = ssh.onClose((payload) => {
        if (payload.sessionId !== sessionId || disposed) return;
        term!.writeln("\r\n\x1b[90mConnection closed.\x1b[0m");
        markConnected(sessionId, false);
        const left = useVault
          .getState()
          .sessions.some((s) => s.hostId === host.id && s.id !== sessionId && s.connected);
        if (!left) resetHostTunnels(host.id);
      });
      unsubs.push(unData, unClose);

      term.onData((data) => {
        void ssh.write(sessionId, data);
      });

      const st = await ssh.status(sessionId);
      if (disposed) return;
      if (st.ok && st.data?.connected) {
        markConnected(sessionId, true);
        return;
      }

      term.writeln(`\x1b[90mConnecting ${host.username}@${host.name || host.hostname}…\x1b[0m`);
      const result = await ssh.connect(
        sshConnectOpts(
          sessionId,
          host,
          identity,
          jump,
          jumpIdentity,
          { cols: term.cols, rows: term.rows },
          { password, localForwards: tunnels },
        ),
      );
      if (disposed) return;
      if (!result.ok) {
        term.writeln(`\x1b[31m${result.error}\x1b[0m`);
        markConnected(sessionId, false);
        toast.error(result.error);
        return;
      }
      markConnected(sessionId, true);
      touchHost(host.id);
      if (!result.data?.reused) {
        const others = useVault
          .getState()
          .sessions.some((s) => s.hostId === host.id && s.id !== sessionId && s.connected);
        if (!others) {
          for (const t of tunnels) {
            if (!t.listenPort) continue;
            if (t.kind !== "dynamic" && !t.destPort) continue;
            if (t.source === "config" || t.active) patchTunnel(t.id, { active: true, bound: true });
          }
        }
      }
      if (host.startupCommand && !result.data?.reused) void ssh.write(sessionId, `${host.startupCommand}\n`);
    })().catch((err) => {
      const message = err instanceof Error ? err.message : String(err);
      term?.writeln(`\x1b[31m${message}\x1b[0m`);
      markConnected(sessionId, false);
      toast.error(message);
    });

    return () => {
      disposed = true;
      ro.disconnect();
      for (const off of unsubs) off();
      termRef.current = undefined;
      fitRef.current = undefined;
      term?.dispose();
    };
    // Keep the PTY alive in the main process. Only the xterm view unmounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, authed, settings.terminalTheme, settings.fontSize, settings.cursorStyle, settings.cursorBlink, settings.copyOnSelect]);

  if (!authed) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 p-6">
        <form
          className="w-full max-w-sm rounded-xl border border-white/15 bg-[#16181b] p-5 text-[#ececea] shadow-2xl"
          onSubmit={(e) => {
            e.preventDefault();
            if (!password) {
              toast.error("Enter the SSH password");
              return;
            }
            setAuthed(true);
          }}
        >
          <p className="text-sm font-medium">Password for {host.username}@{host.hostname}</p>
          <p className="mt-1 text-xs text-white/55">Optional if this host uses a key or FIDO2. Leave empty and use the button below.</p>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="mt-3"
            placeholder="SSH password"
          />
          <Button type="submit" className="mt-3 w-full">
            Connect
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="mt-1 w-full"
            onClick={() => {
              setPassword("");
              setAuthed(true);
            }}
          >
            Use key / FIDO instead
          </Button>
        </form>
      </div>
    );
  }

  return <div ref={wrapRef} className="absolute inset-0 bg-background px-3 py-2" />;
}