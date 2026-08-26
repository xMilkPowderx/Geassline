import { useEffect, useMemo, useState } from "react";
import { Command } from "cmdk";
import { useVault } from "@/lib/store";

export function CommandPalette({
  open,
  onOpenChange,
  onConnect,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConnect: (hostId: string) => void;
}) {
  const hosts = useVault((s) => s.hosts);
  const setActivity = useVault((s) => s.setActivity);
  const setWorkspaceMode = useVault((s) => s.setWorkspaceMode);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const filteredHosts = useMemo(() => {
    const s = q.toLowerCase();
    return hosts.filter((h) =>
      [h.name, h.hostname, h.username, ...h.tags].join(" ").toLowerCase().includes(s),
    );
  }, [hosts, q]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/70 pt-[12vh] px-3"
      onClick={() => onOpenChange(false)}
    >
      <Command
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-popover shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <Command.Input
          value={q}
          onValueChange={setQ}
          placeholder="Connect or run a command…"
          className="h-12 w-full border-b border-border bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground"
        />
        <Command.List className="max-h-80 overflow-auto p-2 geassline-scroll">
          <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
            Nothing matches
          </Command.Empty>
          <Command.Group heading="Hosts" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground">
            {filteredHosts.map((h) => (
              <Command.Item
                key={h.id}
                value={`${h.name} ${h.hostname}`}
                onSelect={() => {
                  onConnect(h.id);
                  onOpenChange(false);
                }}
                className="flex cursor-pointer items-center justify-between rounded-md px-2 py-2 text-sm data-[selected=true]:bg-surface-2"
              >
                <span>
                  {h.name}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {h.username}@{h.hostname}
                  </span>
                </span>
              </Command.Item>
            ))}
          </Command.Group>
          <Command.Group heading="Go" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground">
            {(
              [
                ["Terminal", () => setWorkspaceMode("terminal")],
                ["Files", () => setWorkspaceMode("files")],
                ["Editor", () => setWorkspaceMode("code")],
                ["Tunnels", () => { setWorkspaceMode("tunnels"); setActivity("tunnels"); }],
                ["Identities", () => setActivity("keys")],
                ["Settings", () => setActivity("settings")],
              ] as [string, () => void][]
            ).map(([label, fn]) => (
              <Command.Item
                key={label as string}
                value={label as string}
                onSelect={() => {
                  (fn as () => void)();
                  onOpenChange(false);
                }}
                className="cursor-pointer rounded-md px-2 py-2 text-sm data-[selected=true]:bg-surface-2"
              >
                {label as string}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
