import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  Download,
  File as FileIcon,
  Folder,
  FolderPlus,
  Link2,
  Pencil,
  Shield,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Host } from "@/lib/types";
import { useVault } from "@/lib/store";
import { liveSsh } from "@/lib/live-ssh";
import type { SftpEntry } from "@/lib/geassline-desktop";
import { formatBytes } from "@/lib/utils";
import { nid } from "@/lib/id";
import { toast } from "@/lib/notice";

function normalizeRemote(dir: string) {
  const raw = dir.trim() || ".";
  if (raw === "~") return ".";
  if (raw === "/") return "/";
  return raw.replace(/\\/g, "/").replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
}

export function SftpPanel({ sessionId, host, active }: { sessionId: string; host: Host; active: boolean }) {
  const openFile = useVault((s) => s.openFile);
  const session = useVault((s) => s.sessions.find((x) => x.id === sessionId));
  const ssh = liveSsh();
  const [cwd, setCwd] = useState(".");
  const [pathEdit, setPathEdit] = useState(".");
  const [sel, setSel] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SftpEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [asRoot, setAsRoot] = useState(false);
  const [sudoOpen, setSudoOpen] = useState(false);
  const [sudoPw, setSudoPw] = useState("");
  const [sudoBusy, setSudoBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const loadedFor = useRef<string>("");

  const load = useCallback(
    async (dir: string) => {
      if (!ssh) return;
      const target = normalizeRemote(dir);
      setBusy(true);
      const res = await ssh.list(sessionId, target);
      setBusy(false);
      if (!res.ok) {
        if (/not available|not started|did not start/i.test(res.error || "")) {
          window.setTimeout(() => void load(target), 800);
          return;
        }
        toast.error(res.error);
        return;
      }
      setItems(res.data ?? []);
      setCwd(target);
      setPathEdit(target);
    },
    [sessionId, ssh],
  );

  useEffect(() => {
    if (!active) return;
    if (!session?.connected) return;
    if (loadedFor.current === sessionId && items.length) return;
    loadedFor.current = sessionId;
    void load(cwd || ".");
  }, [active, session?.connected, sessionId, load, cwd, items.length]);

  const visible = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, query]);

  const crumbs = useMemo(() => {
    if (cwd === "." || cwd === "") return [{ label: "~", path: "." }];
    if (cwd === "/") return [{ label: "/", path: "/" }];
    const parts = cwd.replace(/\\/g, "/").split("/").filter(Boolean);
    const acc: { label: string; path: string }[] = cwd.startsWith("/")
      ? [{ label: "/", path: "/" }]
      : [{ label: "~", path: "." }];
    let p = cwd.startsWith("/") ? "" : ".";
    for (const part of parts) {
      p = p === "/" || p === "" ? `/${part}` : `${p}/${part}`.replace(/^\.\//, "");
      if (!p.startsWith("/") && p !== ".") p = p.replace(/^\./, "");
      acc.push({ label: part, path: p });
    }
    return acc;
  }, [cwd]);

  const parent = () => {
    if (cwd === ".") return;
    if (cwd === "/") return;
    const next =
      cwd.replace(/\\/g, "/").replace(/\/$/, "").split("/").slice(0, -1).join("/") || (cwd.startsWith("/") ? "/" : ".");
    void load(next);
  };

  const goPath = () => void load(pathEdit);

  const applyRoot = async (password?: string) => {
    if (!ssh) return;
    setSudoBusy(true);
    const res = await ssh.sudo(sessionId, password || "");
    setSudoBusy(false);
    if (!res.ok) {
      if (!password) {
        setSudoOpen(true);
        return;
      }
      toast.error(res.error || "sudo failed");
      return;
    }
    setAsRoot(true);
    setSudoOpen(false);
    setSudoPw("");
    toast.success("Root access enabled");
    void load(cwd);
  };

  const toggleRoot = async () => {
    if (!ssh) return;
    if (asRoot) {
      await ssh.unsudo(sessionId);
      setAsRoot(false);
      setSudoOpen(false);
      toast.message("Back to SSH user");
      void load(cwd);
      return;
    }
    setSudoOpen(true);
  };

  const saveLocal = async (item: SftpEntry) => {
    if (!ssh) return;
    const res = await ssh.download(sessionId, item.path, item.type === "dir");
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    if (res.data && "cancelled" in res.data && res.data.cancelled) return;
    toast.success(item.type === "dir" ? `Saved ${item.name}.tar.gz` : `Saved ${item.name}`);
  };

  if (!ssh) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
        SFTP is available in the desktop app.
      </div>
    );
  }

  if (!session?.connected) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
        Connect first, then open Files.
      </div>
    );
  }

  const openRemote = async (remotePath: string) => {
    const res = await ssh.read(sessionId, remotePath);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    openFile({
      id: nid(),
      hostId: host.id,
      path: remotePath,
      content: res.data ?? "",
      original: res.data ?? "",
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        <form
          className="flex min-w-0 flex-1 items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            goPath();
          }}
        >
          <Input
            value={pathEdit}
            onChange={(e) => setPathEdit(e.target.value)}
            placeholder="/etc or ~/src"
            className="h-8 min-w-0 flex-1 font-mono text-xs"
            spellCheck={false}
          />
          <Button type="submit" size="sm" variant="outline">
            Go
          </Button>
        </form>
        <Button
          size="sm"
          variant={asRoot ? "default" : "outline"}
          onClick={() => void toggleRoot()}
          title="Edit files as root"
          disabled={sudoBusy}
        >
          <Shield className="size-3.5" />
          {asRoot ? "Root" : "User"}
        </Button>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter" className="h-8 w-28" />
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            const name = window.prompt("Folder name");
            if (!name) return;
            const res = await ssh.mkdir(sessionId, `${cwd.replace(/\/$/, "")}/${name}`);
            if (!res.ok) toast.error(res.error);
            else void load(cwd);
          }}
        >
          <FolderPlus className="size-3.5" />
          New
        </Button>
        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload className="size-3.5" />
          Upload
        </Button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            files.forEach((file) => {
              const reader = new FileReader();
              reader.onload = async () => {
                const res = await ssh.writeFile(sessionId, `${cwd.replace(/\/$/, "")}/${file.name}`, String(reader.result ?? ""));
                if (!res.ok) toast.error(res.error);
                else void load(cwd);
              };
              reader.readAsText(file);
            });
            e.target.value = "";
          }}
        />
      </div>
      <nav className="flex min-w-0 flex-wrap items-center gap-1 border-b border-border px-3 py-1.5 text-xs">
        {crumbs.map((c, i) => (
          <button
            key={`${c.path}-${i}`}
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            onClick={() => void load(c.path)}
          >
            {i > 0 ? <ChevronRight className="size-3" /> : null}
            <span className="max-w-28 truncate">{c.label}</span>
          </button>
        ))}
        {busy ? <span className="ml-2 text-muted-foreground">Loading…</span> : null}
      </nav>
      {sudoOpen ? (
        <form
          className="flex items-center gap-2 border-b border-border px-3 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            void applyRoot(sudoPw);
          }}
        >
          <span className="text-xs text-muted-foreground">sudo password</span>
          <Input
            type="password"
            value={sudoPw}
            onChange={(e) => setSudoPw(e.target.value)}
            autoFocus
            className="h-8 max-w-xs font-mono text-xs"
            placeholder="Required for root"
          />
          <Button type="submit" size="sm" disabled={sudoBusy}>
            {sudoPw ? "Unlock" : "Passwordless"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setSudoOpen(false);
              setSudoPw("");
            }}
          >
            Cancel
          </Button>
        </form>
      ) : null}
      <ScrollArea className="min-h-0 flex-1">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-surface text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Size</th>
              <th className="hidden px-3 py-2 font-medium sm:table-cell">Mode</th>
              <th className="hidden px-3 py-2 font-medium md:table-cell">Modified</th>
              <th className="px-3 py-2 font-medium"> </th>
            </tr>
          </thead>
          <tbody>
            <tr className="cursor-pointer border-t border-border/60 hover:bg-surface-2" onClick={parent}>
              <td className="px-3 py-2 text-muted-foreground" colSpan={5}>
                ..
              </td>
            </tr>
            {visible.map((item) => (
              <tr
                key={item.path}
                className={`border-t border-border/60 hover:bg-surface-2 ${sel === item.path ? "bg-surface-2" : ""}`}
                onClick={() => setSel(item.path)}
                onDoubleClick={() => {
                  if (item.type === "dir") void load(item.path);
                  else if (item.type === "link") {
                    void (async () => {
                      const res = await ssh.list(sessionId, item.path);
                      if (res.ok) void load(item.path);
                      else void openRemote(item.path);
                    })();
                  } else void openRemote(item.path);
                }}
              >
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-2">
                    {item.type === "dir" ? (
                      <Folder className="size-4 text-muted-foreground" />
                    ) : item.type === "link" ? (
                      <Link2 className="size-4 text-muted-foreground" />
                    ) : (
                      <FileIcon className="size-4 text-muted-foreground" />
                    )}
                    <span className="font-medium">{item.name}</span>
                    {item.type === "link" && item.target ? (
                      <span className="font-mono text-[11px] text-muted-foreground">→ {item.target}</span>
                    ) : null}
                  </span>
                </td>
                <td className="px-3 py-2 tabular-nums text-muted-foreground">
                  {item.type === "dir" ? "—" : formatBytes(item.size)}
                </td>
                <td className="hidden px-3 py-2 font-mono text-xs text-muted-foreground sm:table-cell">{item.mode}</td>
                <td className="hidden px-3 py-2 text-xs text-muted-foreground md:table-cell">
                  {item.mtime ? new Date(item.mtime).toLocaleString() : "—"}
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    {item.type === "file" || item.type === "link" ? (
                      <Button size="icon-sm" variant="ghost" onClick={() => void openRemote(item.path)}>
                        <Pencil className="size-3.5" />
                      </Button>
                    ) : null}
                    <Button size="icon-sm" variant="ghost" title={item.type === "dir" ? "Download folder as .tar.gz" : "Download"} onClick={() => void saveLocal(item)}>
                      <Download className="size-3.5" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={async () => {
                        const res = await ssh.remove(sessionId, item.path, item.type === "dir");
                        if (!res.ok) toast.error(res.error);
                        else void load(cwd);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
}
