import { useCallback, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { keymap, EditorView } from "@codemirror/view";
import { search, searchKeymap } from "@codemirror/search";
import { indentWithTab } from "@codemirror/commands";
import { FileCode, X } from "lucide-react";
import { useVault } from "@/lib/store";
import { liveSsh } from "@/lib/live-ssh";
import { languageFor } from "@/lib/editor-language";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/notice";
import { cn } from "@/lib/utils";

const fillParent = EditorView.theme({
  "&": { height: "100%" },
  ".cm-scroller": { overflow: "auto" },
  ".cm-content": { fontFamily: '"IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace' },
});

export function EditorPanel({ sessionId }: { sessionId: string }) {
  const openFiles = useVault((s) => s.openFiles);
  const activeFileId = useVault((s) => s.activeFileId);
  const setActiveFile = useVault((s) => s.setActiveFile);
  const updateFile = useVault((s) => s.updateFile);
  const closeFile = useVault((s) => s.closeFile);
  const file = openFiles.find((f) => f.id === activeFileId) ?? openFiles[0];

  const save = useCallback(async () => {
    const current = useVault.getState().openFiles.find((f) => f.id === (useVault.getState().activeFileId || file?.id));
    const target = current ?? file;
    if (!target) return;
    const ssh = liveSsh();
    if (!ssh) {
      toast.error("Connect from the desktop app to save");
      return;
    }
    const res = await ssh.writeFile(sessionId, target.path, target.content);
    if (!res.ok) {
      toast.error(res.error || "Save failed");
      return;
    }
    useVault.setState({
      openFiles: useVault.getState().openFiles.map((f) => (f.id === target.id ? { ...f, original: f.content } : f)),
    });
    toast.success("Saved");
  }, [file, sessionId]);

  const lang = useMemo(() => (file ? languageFor(file.path) : { name: "", extensions: [] }), [file]);
  const extensions = useMemo(
    () => [
      fillParent,
      search(),
      keymap.of([
        ...searchKeymap,
        indentWithTab,
        {
          key: "Mod-s",
          preventDefault: true,
          run: () => {
            void save();
            return true;
          },
        },
      ]),
      ...lang.extensions,
    ],
    [lang, save],
  );

  if (!file) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
        <FileCode className="size-6" />
        Open a file from the Files tab.
      </div>
    );
  }

  const dirty = file.content !== file.original;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#1e1e1e]">
      <div className="flex h-9 shrink-0 items-center gap-1 border-b border-white/10 px-1">
        <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
          {openFiles.map((f) => {
            const on = f.id === file.id;
            const changed = f.content !== f.original;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFile(f.id)}
                className={cn(
                  "inline-flex h-7 max-w-48 items-center gap-1.5 rounded-md px-2 text-xs",
                  on ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/5 hover:text-white",
                )}
              >
                <span className="truncate">{f.path.split("/").pop()}</span>
                {changed ? <span className="size-1.5 rounded-full bg-amber-400" /> : null}
                <span
                  role="button"
                  className="rounded p-0.5 hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeFile(f.id);
                  }}
                >
                  <X className="size-3" />
                </span>
              </button>
            );
          })}
        </div>
        <Button size="sm" variant="ghost" className="h-7 text-xs text-white/80 hover:text-white" onClick={() => void save()}>
          Save{dirty ? " •" : ""}
        </Button>
      </div>
      <p className="flex shrink-0 items-center justify-between gap-3 truncate border-b border-white/10 px-3 py-1 font-mono text-[11px] text-white/45">
        <span className="truncate">{file.path}</span>
        <span className="shrink-0 text-white/35">{lang.name}</span>
      </p>
      <div className="min-h-0 flex-1 overflow-hidden">
        <CodeMirror
          value={file.content}
          height="100%"
          style={{ height: "100%" }}
          className="h-full overflow-hidden"
          theme={vscodeDark}
          basicSetup={{ foldGutter: true, lineNumbers: true, highlightActiveLine: true }}
          extensions={extensions}
          onChange={(value) => updateFile(file.id, value)}
        />
      </div>
    </div>
  );
}
