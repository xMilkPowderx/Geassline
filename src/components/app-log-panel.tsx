import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAppLog } from "@/lib/app-log";
import { cn } from "@/lib/utils";

export function AppLogButton() {
  const unread = useAppLog((s) => s.unread);
  const open = useAppLog((s) => s.open);
  const setOpen = useAppLog((s) => s.setOpen);
  return (
    <button
      type="button"
      className="relative inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-surface-2 hover:text-foreground"
      onClick={() => setOpen(!open)}
    >
      Log
      <span className="inline-flex h-4 min-w-5 items-center justify-center">
        {unread ? (
          <span className="rounded bg-foreground px-1 text-[10px] leading-4 text-background">{unread > 99 ? "99+" : unread}</span>
        ) : (
          <span className="invisible text-[10px] leading-4">0</span>
        )}
      </span>
    </button>
  );
}

export function AppLogPanel() {
  const open = useAppLog((s) => s.open);
  const entries = useAppLog((s) => s.entries);
  const clear = useAppLog((s) => s.clear);
  const setOpen = useAppLog((s) => s.setOpen);
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      const el = panelRef.current;
      const t = e.target as Node | null;
      if (!el || !t) return;
      if (el.contains(t)) return;
      if (t instanceof Element && t.closest("button")?.textContent?.trim().startsWith("Log")) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [open, setOpen]);

  if (!open || !mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panelRef}
      className="fixed z-[80] flex w-[min(420px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-md border border-border bg-surface shadow-lg"
      style={{ right: 12, bottom: 44 }}
    >
      <div className="flex h-8 items-center justify-between border-b border-border px-2">
        <span className="text-xs font-medium text-foreground">Session log</span>
        <div className="flex items-center gap-2">
          <button type="button" className="text-[11px] text-muted-foreground hover:text-foreground" onClick={clear}>
            Clear
          </button>
          <button type="button" className="text-[11px] text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
      </div>
      <div className="geassline-scroll max-h-56 overflow-auto p-2">
        {entries.length ? (
          entries.map((e) => (
            <div key={e.id} className="mb-1.5 last:mb-0">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[10px] text-muted-foreground">
                  {new Date(e.at).toLocaleTimeString()}
                </span>
                <span
                  className={cn(
                    "text-[10px] uppercase",
                    e.level === "error" ? "text-destructive" : e.level === "success" ? "text-ok" : "text-muted-foreground",
                  )}
                >
                  {e.level}
                </span>
              </div>
              <p className="whitespace-pre-wrap break-words text-xs text-foreground">{e.text}</p>
            </div>
          ))
        ) : (
          <p className="px-1 py-4 text-center text-xs text-muted-foreground">No messages yet</p>
        )}
      </div>
    </div>,
    document.body,
  );
}