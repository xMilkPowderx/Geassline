import { useEffect, useRef, useState, type ReactNode } from "react";
import { Search, Square, Minus, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVault } from "@/lib/store";
import { cn } from "@/lib/utils";
import { desktopBridge } from "@/lib/geassline-desktop";

type MenuItem = {
  label: string;
  shortcut?: string;
  onSelect: () => void;
};

export function Titlebar({
  quick,
  onQuickChange,
  onQuickConnect,
  onCommandPalette,
  onNewHost,
  onToggleSplit,
}: {
  quick: string;
  onQuickChange: (v: string) => void;
  onQuickConnect: () => void;
  onCommandPalette: () => void;
  onNewHost: () => void;
  onToggleSplit: () => void;
}) {
  const vault = useVault();
  const session = vault.sessions.find((s) => s.id === vault.activeSessionId);
  const host = session ? vault.hosts.find((h) => h.id === session.hostId) : undefined;
  const desktop = desktopBridge();

  const maximize = () => desktop?.maximize();
  const minimize = () => desktop?.minimize();
  const close = () => desktop?.close();

  return (
    <header className="titlebar-drag flex h-12 shrink-0 select-none items-center border-b border-border bg-sidebar">
      <div className="titlebar-no-drag flex items-center gap-1 pl-2.5 pr-1">
        <Logo className="size-4" />
        <span className="hidden text-sm font-medium tracking-tight sm:inline">Geassline</span>
      </div>

      <div className="titlebar-no-drag hidden items-center md:flex">
        <BarMenu
          label="File"
          items={[
            { label: "New host", onSelect: onNewHost },
            { label: "Command palette", shortcut: "Ctrl+Shift+P", onSelect: onCommandPalette },
            { label: "Close window", onSelect: close },
          ]}
        />
        <BarMenu
          label="View"
          items={[
            { label: "Terminal", onSelect: () => vault.setWorkspaceMode("terminal") },
            { label: "Files", onSelect: () => vault.setWorkspaceMode("files") },
            { label: "Editor", onSelect: () => vault.setWorkspaceMode("code") },
            { label: "Tunnels", onSelect: () => vault.setWorkspaceMode("tunnels") },
            { label: "New terminal", onSelect: onToggleSplit },
          ]}
        />
        <BarMenu
          label="Host"
          items={[
            { label: "Identities", onSelect: () => vault.setActivity("keys") },
            { label: "Settings", onSelect: () => vault.setActivity("settings") },
          ]}
        />
      </div>

      <div className="titlebar-no-drag hidden min-w-0 flex-1 items-center gap-2 px-2 md:flex">
        <div className="relative mx-auto w-full max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={quick}
            onChange={(e) => onQuickChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onQuickConnect()}
            placeholder="user@host[:port]"
            className="h-8 pl-8 font-mono text-xs"
          />
        </div>
      </div>

      <div className="titlebar-drag min-w-0 flex-1 truncate px-3 text-center text-[11px] text-muted-foreground md:hidden">
        {host ? host.name : "Geassline"}
      </div>

      <div className="titlebar-no-drag ml-auto flex items-center">
        <Button size="sm" variant="ghost" onClick={onCommandPalette} className="hidden h-8 sm:inline-flex">
          Command
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">Ctrl+Shift+P</kbd>
        </Button>
        <div className="ml-1 hidden h-12 items-stretch md:flex">
          <WinBtn label="Minimize" onClick={minimize}>
            <Minus className="size-3.5" />
          </WinBtn>
          <WinBtn label="Maximize" onClick={maximize}>
            <Square className="size-3" />
          </WinBtn>
          <WinBtn label="Close" onClick={close} close>
            <X className="size-3.5" />
          </WinBtn>
        </div>
      </div>
    </header>
  );
}

function WinBtn({
  label,
  onClick,
  close,
  children,
}: {
  label: string;
  onClick: () => void;
  close?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex w-11 items-center justify-center text-muted-foreground transition-colors duration-150",
        close ? "hover:bg-destructive hover:text-foreground" : "hover:bg-surface-2 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function BarMenu({ label, items }: { label: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={cn(
          "h-8 rounded-sm px-2 text-xs text-muted-foreground transition-colors duration-150 hover:bg-surface-2 hover:text-foreground",
          open && "bg-surface-2 text-foreground",
        )}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-40 mt-1 min-w-52 rounded-md border border-border bg-popover py-1 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              className="flex w-full items-center justify-between gap-6 px-3 py-1.5 text-left text-xs hover:bg-surface-2"
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
            >
              <span>{item.label}</span>
              {item.shortcut ? (
                <span className="text-[10px] text-muted-foreground">{item.shortcut}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
