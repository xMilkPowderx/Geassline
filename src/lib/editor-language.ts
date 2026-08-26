import { StreamLanguage } from "@codemirror/language";
import { loadLanguage, langs, type LanguageName } from "@uiw/codemirror-extensions-langs";
import { nginx } from "@codemirror/legacy-modes/mode/nginx";
import { dockerFile } from "@codemirror/legacy-modes/mode/dockerfile";
import { http as httpMode } from "@codemirror/legacy-modes/mode/http";
import { hcl } from "codemirror-lang-hcl";
import { graphql } from "cm6-graphql";
import { Decoration, EditorView, MatchDecorator, ViewPlugin, type ViewUpdate, type DecorationSet } from "@codemirror/view";
import type { Extension } from "@codemirror/state";

const C_IDS = new Set(["c", "h", "cpp", "cc", "cxx", "hpp", "hh", "hxx", "h++", "c++", "ino"]);

const LABELS: Record<string, string> = {
  c: "C",
  h: "C",
  cpp: "C++",
  cc: "C++",
  cxx: "C++",
  hpp: "C++",
  nginx: "Nginx",
  dockerfile: "Dockerfile",
  makefile: "Makefile",
  hcl: "HCL",
  graphql: "GraphQL",
  ini: "Config",
  bash: "Shell",
  sh: "Shell",
  ksh: "Shell",
  py: "Python",
  python: "Python",
  rs: "Rust",
  go: "Go",
  js: "JavaScript",
  ts: "TypeScript",
  tsx: "TSX",
  jsx: "JSX",
  json: "JSON",
  yml: "YAML",
  yaml: "YAML",
  toml: "TOML",
  md: "Markdown",
  markdown: "Markdown",
  html: "HTML",
  xml: "XML",
  css: "CSS",
  sql: "SQL",
  php: "PHP",
  rb: "Ruby",
  java: "Java",
  kt: "Kotlin",
  proto: "Protobuf",
  ps1: "PowerShell",
  http: "HTTP",
};

const FILES: Record<string, string> = {
  makefile: "makefile",
  gnumakefile: "makefile",
  dockerfile: "dockerfile",
  containerfile: "dockerfile",
  jenkinsfile: "groovy",
  vagrantfile: "rb",
  "cmakelists.txt": "cmake",
  ".bashrc": "bash",
  ".zshrc": "bash",
  ".profile": "bash",
  ".bash_profile": "bash",
  ".zprofile": "bash",
  ".env": "ini",
  ".gitconfig": "ini",
  ".gitignore": "gitignore",
  ssh_config: "ini",
  sshd_config: "ini",
  config: "ini",
  fstab: "ini",
  hosts: "ini",
  "nginx.conf": "nginx",
  "mime.types": "nginx",
};

const EXTS: Record<string, string> = {
  service: "ini",
  socket: "ini",
  timer: "ini",
  mount: "ini",
  automount: "ini",
  path: "ini",
  slice: "ini",
  target: "ini",
  conf: "ini",
  cnf: "ini",
  env: "ini",
  tf: "hcl",
  tfvars: "hcl",
  hcl: "hcl",
  nomad: "hcl",
  graphql: "graphql",
  gql: "graphql",
  nginx: "nginx",
};

const makefile = StreamLanguage.define({
  name: "makefile",
  token(stream) {
    if (stream.eatSpace()) return null;
    if (stream.match("#")) {
      stream.skipToEnd();
      return "comment";
    }
    if (stream.match(/\$[\(\{][\w.-]+[\)\}]/) || stream.match(/\$[@<^?%*+-]/)) return "variableName";
    if (stream.sol() && stream.match(/^[A-Za-z_][\w.-]*\s*[:+?]?=/)) return "definitionKeyword";
    if (stream.sol() && stream.match(/^[\w./%-]+\s*:/)) return "keyword";
    stream.next();
    return null;
  },
});

const gitignore = StreamLanguage.define({
  name: "gitignore",
  token(stream) {
    if (stream.eatSpace()) return null;
    if (stream.match("#")) {
      stream.skipToEnd();
      return "comment";
    }
    if (stream.match("!")) return "operator";
    stream.skipToEnd();
    return "string";
  },
});

const C_WORD =
  /\b(?:[A-Z][A-Z0-9_]{2,}|u(?:8|16|32|64)|s(?:8|16|32|64)|__le(?:16|32|64)|__be(?:16|32|64)|__u(?:8|16|32|64)|__s(?:8|16|32|64)|u?int(?:8|16|32|64)_t|size_t|ssize_t|uintptr_t|ptrdiff_t|off_t)\b/g;

const cMacroMark = Decoration.mark({ class: "cm-c-macro" });
const cTypeMark = Decoration.mark({ class: "cm-c-type" });
const cDecorator = new MatchDecorator({
  regexp: C_WORD,
  decoration: (m) => (/[a-z]/.test(m[0]!) || m[0]!.includes("int") || m[0]!.endsWith("_t") ? cTypeMark : cMacroMark),
});

const cExtras: Extension = [
  ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = cDecorator.createDeco(view);
      }
      update(u: ViewUpdate) {
        this.decorations = cDecorator.updateDeco(u, this.decorations);
      }
    },
    { decorations: (v) => v.decorations },
  ),
  EditorView.theme({
    ".cm-c-macro": { color: "#c586c0" },
    ".cm-c-type": { color: "#4ec9b0" },
  }),
];

function detect(path: string): string {
  const base = (path.split(/[\\/]/).pop() || "").toLowerCase();
  if (FILES[base]) return FILES[base]!;
  if (base.endsWith(".conf") && /nginx|sites-/.test(path.toLowerCase())) return "nginx";
  const ext = base.includes(".") ? base.slice(base.lastIndexOf(".") + 1) : "";
  if (ext && EXTS[ext]) return EXTS[ext]!;
  if (ext && ext in langs) return ext;
  if (base in langs) return base;
  return ext || base;
}

function load(id: string): Extension | undefined {
  if (id === "nginx") return StreamLanguage.define(nginx);
  if (id === "dockerfile") return StreamLanguage.define(dockerFile);
  if (id === "http") return StreamLanguage.define(httpMode);
  if (id === "hcl") return hcl();
  if (id === "graphql") return graphql();
  if (id === "makefile") return makefile;
  if (id === "gitignore") return gitignore;
  if (id in langs) return loadLanguage(id as LanguageName) ?? undefined;
  return undefined;
}

export function languageFor(path: string): { name: string; extensions: Extension[] } {
  const id = detect(path);
  const lang = load(id);
  const extras = C_IDS.has(id) ? [cExtras] : [];
  return {
    name: LABELS[id] || (id ? id : "Plain text"),
    extensions: lang ? [lang, ...extras] : extras,
  };
}
