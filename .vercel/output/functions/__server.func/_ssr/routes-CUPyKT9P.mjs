import { i as __toESM, n as __exportAll } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { C as FolderPlus, D as ChevronRight, E as Download, O as AppWindow, S as Folder, T as FileCode, _ as PanelLeft, a as Trash2, b as Link2, c as SquareTerminal, d as Settings, f as Server, g as Pencil, h as Pin, l as Shield, m as Plus, n as Upload, o as Star, p as Search, r as Unplug, s as Square, t as X, u as ShieldCheck, v as Minus, w as File, x as KeyRound, y as Lock } from "../_libs/lucide-react.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { a as DialogPortal, h as Slot, i as DialogOverlay, n as DialogClose, o as DialogTitle, r as DialogContent$1, t as Dialog$1 } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { n as SwitchThumb, t as Switch$1 } from "../_libs/radix-ui__react-switch.mjs";
import { a as Trigger, i as Root3, n as Portal, r as Provider, t as Content2 } from "../_libs/@radix-ui/react-tooltip+[...].mjs";
import { n as persist, r as create, t as createJSONStorage } from "../_libs/zustand.mjs";
import { ft as keymap } from "../_libs/@codemirror/autocomplete+[...].mjs";
import { i as indentWithTab } from "../_libs/codemirror__commands.mjs";
import { n as search, r as searchKeymap } from "../_libs/codemirror__search.mjs";
import { t as ReactCodeMirror } from "../_libs/uiw__react-codemirror.mjs";
import { t as vscodeDark } from "../_libs/@uiw/codemirror-theme-vscode+[...].mjs";
import { t as loadLanguage } from "../_libs/@uiw/codemirror-extensions-langs+[...].mjs";
import { t as _e } from "../_libs/cmdk.mjs";
import { t as keygenAsync } from "../_libs/noble__ed25519.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CUPyKT9P.js
var routes_CUPyKT9P_exports = /* @__PURE__ */ __exportAll({
	component: () => Home,
	n: () => registerFido2,
	r: () => webauthnAvailable,
	t: () => assertFido2
});
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function bufToB64(buf) {
	const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
	let s = "";
	for (let i = 0; i < bytes.length; i += 1) s += String.fromCharCode(bytes[i]);
	return btoa(s);
}
function b64ToBuf(s) {
	const bin = atob(s);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
	return out;
}
function webauthnAvailable() {
	return typeof window !== "undefined" && typeof window.PublicKeyCredential === "function";
}
async function registerFido2(name = "Geassline") {
	if (!webauthnAvailable()) throw new Error("WebAuthn is not available in this browser.");
	const challenge = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(32));
	const userId = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(16));
	const cred = await navigator.credentials.create({ publicKey: {
		challenge,
		rp: {
			name,
			id: window.location.hostname
		},
		user: {
			id: userId,
			name: "geassline-ops",
			displayName: "Geassline operator"
		},
		pubKeyCredParams: [
			{
				type: "public-key",
				alg: -8
			},
			{
				type: "public-key",
				alg: -7
			},
			{
				type: "public-key",
				alg: -257
			}
		],
		timeout: 6e4,
		authenticatorSelection: {
			userVerification: "preferred",
			residentKey: "preferred"
		},
		attestation: "none"
	} });
	if (!cred) throw new Error("Security key registration was cancelled.");
	return bufToB64(cred.rawId);
}
async function assertFido2(credentialId) {
	if (!webauthnAvailable()) throw new Error("WebAuthn is not available in this browser.");
	if (!credentialId) throw new Error("No security key is registered in this vault.");
	const challenge = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(32));
	const allow = [{
		type: "public-key",
		id: b64ToBuf(credentialId).buffer
	}];
	const cred = await navigator.credentials.get({ publicKey: {
		challenge,
		timeout: 6e4,
		userVerification: "preferred",
		allowCredentials: allow,
		rpId: window.location.hostname
	} });
	return Boolean(cred);
}
function Logo({ className = "size-5" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 24 24",
		className,
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M12 3v18M7 7h10M8 12h8M9 17h6",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: "1.6",
			strokeLinecap: "round"
		})
	});
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function formatBytes(n) {
	if (!Number.isFinite(n)) return "—";
	const units = [
		"B",
		"KB",
		"MB",
		"GB",
		"TB"
	];
	let v = Math.max(0, n);
	let i = 0;
	while (v >= 1024 && i < units.length - 1) {
		v /= 1024;
		i += 1;
	}
	const digits = i === 0 ? 0 : v < 10 ? 1 : 0;
	return `${v.toFixed(digits)} ${units[i]}`;
}
function formatAgo(ts) {
	if (!ts) return "never";
	const s = Math.max(0, Math.floor((Date.now() - ts) / 1e3));
	if (s < 45) return "just now";
	if (s < 3600) return `${Math.floor(s / 60)}m ago`;
	if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
	if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
	return new Date(ts).toLocaleDateString();
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,background-color,opacity,transform,box-shadow] duration-150 ease-out disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:not-disabled:scale-[0.96]", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:opacity-90",
			secondary: "bg-secondary text-secondary-foreground hover:bg-surface-2",
			ghost: "hover:bg-surface-2 text-foreground",
			outline: "border border-border bg-transparent hover:bg-surface-2",
			destructive: "bg-destructive text-foreground hover:opacity-90",
			link: "text-foreground underline-offset-4 hover:underline"
		},
		size: {
			default: "h-10 px-4",
			sm: "h-8 rounded-sm px-3 text-xs",
			lg: "h-11 px-5",
			icon: "size-10",
			"icon-sm": "size-8"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		...props
	});
}
function Input({ className, type, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		className: cn("flex h-10 w-full rounded-md border border-border bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground transition-[box-shadow,border-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50", className),
		...props
	});
}
function Textarea({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn("flex min-h-24 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50", className),
		...props
	});
}
function Badge({ className, tone = "muted", children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums", tone === "muted" && "bg-surface-2 text-muted-foreground", tone === "ok" && "bg-ok/15 text-ok", tone === "warn" && "bg-warn/15 text-warn", tone === "danger" && "bg-destructive/15 text-destructive", className),
		children
	});
}
function Switch({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch$1, {
		className: cn("peer inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border border-border bg-input transition-colors data-[state=checked]:bg-primary", className),
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchThumb, { className: "pointer-events-none block size-5 translate-x-0.5 rounded-full bg-foreground shadow-sm transition-transform data-[state=checked]:translate-x-4 data-[state=checked]:bg-primary-foreground" })
	});
}
var Dialog = Dialog$1;
function DialogContent({ className, children, title }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, { className: "fixed inset-0 z-50 bg-background/70" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
		className: cn("fixed left-1/2 top-1/2 z-50 w-[min(560px,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]", className),
		children: [
			title ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
				className: "mb-4 text-base font-medium tracking-tight",
				children: title
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
				className: "sr-only",
				children: "Dialog"
			}),
			children,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
				className: "absolute right-3 top-3 rounded-md p-2 text-muted-foreground hover:bg-surface-2 hover:text-foreground",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
			})
		]
	})] });
}
function ScrollArea({ className, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("overflow-auto geassline-scroll", className),
		children
	});
}
function Separator({ className, vertical }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		role: "separator",
		className: cn(vertical ? "w-px self-stretch bg-border" : "h-px w-full bg-border", className)
	});
}
var TooltipProvider = Provider;
function Tooltip({ children, label, side = "right" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Root3, {
		delayDuration: 250,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger, {
			asChild: true,
			children
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
			side,
			sideOffset: 8,
			className: cn("z-50 rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-sm"),
			children: label
		}) })]
	});
}
function nid() {
	if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
	return `id_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
var KW = {
	hostname: "hostname",
	host: "hostname",
	user: "user",
	port: "port",
	identityfile: "identityFile",
	proxyjump: "proxyJump",
	proxycommand: "proxyJump",
	forwardagent: "forwardAgent",
	compression: "compression",
	localforward: "localForward",
	requesttty: "requestTty",
	serveraliveinterval: "serverAliveInterval"
};
function blank(alias) {
	return {
		alias,
		hostname: alias,
		user: "",
		port: 22,
		identityFile: "",
		proxyJump: "",
		forwardAgent: false,
		compression: false,
		localForwards: [],
		requestTty: "",
		serverAliveInterval: 0
	};
}
function applyKeyword(current, mapped, value) {
	if (mapped === "port" || mapped === "serverAliveInterval") {
		const n = Number(value);
		if (!Number.isFinite(n)) return;
		if (mapped === "port") current.port = n;
		else current.serverAliveInterval = n;
		return;
	}
	if (mapped === "forwardAgent" || mapped === "compression") {
		current[mapped] = /^(yes|true|1)$/i.test(value);
		return;
	}
	if (mapped === "localForward") {
		const parts = value.split(/\s+/);
		const listen = Number(parts[0]);
		const dest = (parts[1] ?? "").split(":");
		if (Number.isFinite(listen) && dest.length >= 2) current.localForwards.push({
			listen,
			destHost: dest[0] || "127.0.0.1",
			destPort: Number(dest[1]) || 0
		});
		return;
	}
	if (mapped === "hostname") current.hostname = value;
	else if (mapped === "user") current.user = value;
	else if (mapped === "identityFile") current.identityFile = value;
	else if (mapped === "proxyJump") current.proxyJump = value;
	else if (mapped === "requestTty") current.requestTty = value;
}
function mergeHost(base, over) {
	return {
		alias: over.alias,
		hostname: over.hostname !== over.alias ? over.hostname : base.hostname !== base.alias ? base.hostname : over.hostname,
		user: over.user || base.user,
		port: over.port !== 22 ? over.port : base.port,
		identityFile: over.identityFile || base.identityFile,
		proxyJump: over.proxyJump || base.proxyJump,
		forwardAgent: over.forwardAgent || base.forwardAgent,
		compression: over.compression || base.compression,
		localForwards: over.localForwards.length ? over.localForwards : base.localForwards,
		requestTty: over.requestTty || base.requestTty,
		serverAliveInterval: over.serverAliveInterval || base.serverAliveInterval
	};
}
function parseSshConfig(text) {
	const blocks = [];
	let current = null;
	const flush = () => {
		if (current) blocks.push(current);
		current = null;
	};
	for (const raw of text.split(/\r?\n/)) {
		const line = raw.replace(/#.*$/, "").trim();
		if (!line) continue;
		const m = line.match(/^(\S+)\s+(.+)$/);
		if (!m) continue;
		const key = m[1].toLowerCase();
		const value = m[2].trim().replace(/^"|"$/g, "");
		if (key === "host") {
			flush();
			current = blank(value.split(/\s+/)[0] ?? value);
			continue;
		}
		if (key === "include") continue;
		if (!current) continue;
		const mapped = KW[key];
		if (!mapped) continue;
		applyKeyword(current, mapped, value);
	}
	flush();
	const star = blocks.filter((h) => h.alias === "*").reduce((acc, h) => mergeHost(acc, h), blank("*"));
	return blocks.filter((h) => h.alias !== "*" && !h.alias.includes("*") && !h.alias.includes("?")).map((h) => mergeHost(star, h));
}
var defaultSettings = {
	terminalTheme: "geassline-ink",
	fontSize: 13,
	fontFamily: "\"IBM Plex Mono\", ui-monospace, Menlo, Consolas, monospace",
	cursorStyle: "bar",
	cursorBlink: true,
	copyOnSelect: true,
	bell: false,
	scrollback: 4e3,
	vaultLock: false,
	ligatures: false,
	wordWrap: false,
	syncSshConfig: true
};
var LAB_IDS = {
	lab: "g-lab",
	prod: "g-prod",
	windows: "g-win",
	personal: "g-personal",
	sshconfig: "g-ssh-config"
};
function seedGroups() {
	return [{
		id: LAB_IDS.personal,
		name: "Personal",
		collapsed: false
	}];
}
function makeHost(partial) {
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
		...partial
	};
}
var emptyVault = () => ({
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
	vaultPassEnabled: false
});
var useVault = create()(persist((set, get) => ({
	...emptyVault(),
	hydrated: false,
	setHydrated: (v) => set({ hydrated: v }),
	setActivity: (activity) => set({ activity }),
	setWorkspaceMode: (workspaceMode) => set({ workspaceMode }),
	upsertHost: (h) => set({ hosts: get().hosts.some((x) => x.id === h.id) ? get().hosts.map((x) => x.id === h.id ? h : x) : [...get().hosts, h] }),
	removeHost: (id) => set({ hosts: get().hosts.filter((h) => h.id !== id) }),
	toggleStar: (id) => set({ hosts: get().hosts.map((h) => h.id === id ? {
		...h,
		starred: !h.starred
	} : h) }),
	toggleGroup: (id) => set({ groups: get().groups.map((g) => g.id === id ? {
		...g,
		collapsed: !g.collapsed
	} : g) }),
	upsertIdentity: (i) => set({ identities: get().identities.some((x) => x.id === i.id) ? get().identities.map((x) => x.id === i.id ? i : x) : [...get().identities, i] }),
	removeIdentity: (id) => set({ identities: get().identities.filter((i) => i.id !== id) }),
	upsertSnippet: (s) => set({ snippets: get().snippets.some((x) => x.id === s.id) ? get().snippets.map((x) => x.id === s.id ? s : x) : [...get().snippets, s] }),
	removeSnippet: (id) => set({ snippets: get().snippets.filter((s) => s.id !== id) }),
	upsertTunnel: (t) => set({ tunnels: get().tunnels.some((x) => x.id === t.id) ? get().tunnels.map((x) => x.id === t.id ? t : x) : [...get().tunnels, t] }),
	removeTunnel: (id) => set({ tunnels: get().tunnels.filter((t) => t.id !== id) }),
	toggleTunnel: (id) => set({ tunnels: get().tunnels.map((t) => t.id === id ? {
		...t,
		active: !t.active
	} : t) }),
	bumpTunnelBytes: (id, inn, out) => set({ tunnels: get().tunnels.map((t) => t.id === id ? {
		...t,
		bytesIn: t.bytesIn + inn,
		bytesOut: t.bytesOut + out
	} : t) }),
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
		const session = {
			id,
			hostId,
			title: `${host?.name || host?.hostname || "session"}${n ? ` (${n + 1})` : ""}`,
			createdAt: Date.now(),
			connected: false
		};
		set({
			sessions: [...get().sessions, session],
			activeSessionId: id
		});
		return id;
	},
	closeSession: (id) => {
		const sessions = get().sessions.filter((s) => s.id !== id);
		set({
			sessions,
			activeSessionId: get().activeSessionId === id ? sessions[sessions.length - 1]?.id ?? null : get().activeSessionId
		});
	},
	setActiveSession: (id) => set({ activeSessionId: id }),
	markConnected: (id, connected) => set({ sessions: get().sessions.map((s) => s.id === id ? {
		...s,
		connected
	} : s) }),
	touchHost: (id) => set({ hosts: get().hosts.map((h) => h.id === id ? {
		...h,
		lastConnectedAt: Date.now()
	} : h) }),
	setOverlay: (hostId, overlay) => set({ overlays: {
		...get().overlays,
		[hostId]: overlay
	} }),
	setHostState: (hostId, state) => set({ hostState: {
		...get().hostState,
		[hostId]: state
	} }),
	openFile: (file) => {
		const existing = get().openFiles.find((f) => f.hostId === file.hostId && f.path === file.path);
		if (existing) {
			set({
				activeFileId: existing.id,
				workspaceMode: "code"
			});
			return;
		}
		set({
			openFiles: [...get().openFiles, file],
			activeFileId: file.id,
			workspaceMode: "code"
		});
	},
	updateFile: (id, content) => set({ openFiles: get().openFiles.map((f) => f.id === id ? {
		...f,
		content
	} : f) }),
	closeFile: (id) => {
		const openFiles = get().openFiles.filter((f) => f.id !== id);
		set({
			openFiles,
			activeFileId: get().activeFileId === id ? openFiles[openFiles.length - 1]?.id ?? null : get().activeFileId
		});
	},
	setActiveFile: (id) => set({ activeFileId: id }),
	patchSettings: (s) => set({ settings: {
		...get().settings,
		...s
	} }),
	importConfig: (text) => {
		const parsed = parseSshConfig(text);
		if (!parsed.length) return 0;
		const { hosts, groups, identities, tunnels } = get();
		let n = 0;
		const nextHosts = [...hosts];
		const nextIdentities = [...identities];
		const nextTunnels = [...tunnels];
		const groupId = LAB_IDS.sshconfig;
		const ensureIdentity = (filePath) => {
			if (!filePath) return null;
			const existing = nextIdentities.find((i) => i.comment === filePath || i.name === filePath.split(/[\\/]/).pop());
			if (existing) return existing.id;
			const base = filePath.split(/[\\/]/).pop() || "key";
			const sk = /_sk(?:$|\.)/i.test(base) || /sk-/i.test(base);
			const id = `id-file-${base.replace(/[^A-Za-z0-9._-]+/g, "-")}`;
			const already = nextIdentities.find((i) => i.id === id);
			if (already) return already.id;
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
				algorithm: sk ? "sk-ssh-ed25519@openssh.com" : base.includes("ed25519") ? "ed25519" : base.includes("ecdsa") ? "ecdsa" : "rsa",
				fido2CredentialId: "",
				createdAt: Date.now()
			});
			return id;
		};
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
				latencyMs: 30,
				isLab: false,
				compression: h.compression,
				agentForward: h.forwardAgent,
				keepalive: h.serverAliveInterval || 30,
				identityId,
				tags: ["ssh-config"],
				notes: "From ~/.ssh/config",
				jumpHostId: null,
				proxyJump: h.proxyJump,
				fido2Required: /_sk/i.test(h.identityFile)
			});
			const addForwards = () => {
				for (const fw of h.localForwards) {
					const tid = `tun-${id}-${fw.listen}`;
					if (nextTunnels.some((t) => t.id === tid)) continue;
					nextTunnels.push({
						id: tid,
						name: `${h.alias} :${fw.listen}`,
						kind: "local",
						hostId: id,
						listenHost: "127.0.0.1",
						listenPort: fw.listen,
						destHost: fw.destHost,
						destPort: fw.destPort,
						active: false,
						bytesIn: 0,
						bytesOut: 0
					});
				}
			};
			const existing = nextHosts.find((x) => x.id === id);
			if (existing) {
				Object.assign(existing, {
					hostname: next.hostname,
					username: next.username,
					port: next.port,
					address: next.address,
					compression: next.compression,
					agentForward: next.agentForward,
					keepalive: next.keepalive,
					identityId: next.identityId,
					os: next.os,
					proxyJump: next.proxyJump
				});
				addForwards();
				continue;
			}
			nextHosts.push(next);
			n += 1;
			addForwards();
		}
		for (const host of nextHosts) {
			const spec = (host.proxyJump || "").split(",")[0]?.trim() || "";
			if (!spec) continue;
			const name = spec.replace(/^[^@]+@/, "").replace(/:\d+$/, "");
			const found = nextHosts.find((x) => x.id !== host.id && (x.name === name || x.hostname === name || x.name === spec));
			if (found) host.jumpHostId = found.id;
		}
		set({
			hosts: nextHosts,
			groups: groups.some((g) => g.id === groupId) ? groups : [{
				id: groupId,
				name: "~/.ssh/config",
				collapsed: false
			}, ...groups],
			identities: nextIdentities,
			tunnels: nextTunnels
		});
		return n;
	},
	setLocked: (locked) => set({ locked }),
	setFido2Credential: (fido2CredentialId) => set({ fido2CredentialId }),
	resetVault: () => set({
		...emptyVault(),
		hydrated: true,
		locked: false
	})
}), {
	name: "geassline-vault-v2",
	storage: createJSONStorage(() => localStorage),
	skipHydration: true,
	partialize: (s) => ({
		groups: s.groups,
		hosts: s.hosts,
		identities: s.identities,
		snippets: s.snippets,
		tunnels: s.tunnels,
		knownHosts: s.knownHosts,
		sessions: s.sessions,
		activeSessionId: s.activeSessionId,
		openFiles: s.openFiles,
		activeFileId: s.activeFileId,
		overlays: s.overlays,
		hostState: s.hostState,
		settings: s.settings,
		activity: s.activity,
		workspaceMode: s.workspaceMode,
		locked: s.locked,
		fido2CredentialId: s.fido2CredentialId,
		vaultPassEnabled: s.vaultPassEnabled
	})
}));
function desktopBridge() {
	if (typeof window === "undefined") return null;
	return window.geasslineDesktop ?? null;
}
var WINDOWS_DESKTOP_ZIP = "/download/windows-zip";
function liveSsh() {
	return desktopBridge()?.ssh ?? null;
}
function keyPathOf(identity) {
	if (!identity) return "";
	if (identity.comment && /[\\/]/.test(identity.comment)) return identity.comment;
	return "";
}
function needsPasswordPrompt(identity) {
	if (!identity) return true;
	if (identity.kind === "password") return !identity.password;
	if (identity.kind === "fido2" || identity.kind === "key" || identity.kind === "certificate") return !keyPathOf(identity) && !identity.privateKey;
	return false;
}
function sshAuth(host, identity, password) {
	const username = identity?.username || host.username;
	const path = keyPathOf(identity);
	const fido2 = identity?.kind === "fido2" || host.fido2Required || /sk-/i.test(identity?.algorithm || "") || /_sk(?:$|\.)/i.test(path);
	const pass = password || (identity?.kind === "password" ? identity.password : "");
	return {
		username,
		password: fido2 || path ? "" : pass,
		passphrase: identity?.kind === "key" || identity?.kind === "fido2" ? identity.password : "",
		privateKey: fido2 ? "" : identity?.privateKey || "",
		privateKeyPath: path,
		keepalive: host.keepalive,
		compression: host.compression,
		agentForward: host.agentForward || identity?.kind === "agent",
		fido2,
		algorithm: identity?.algorithm || ""
	};
}
function sshConnectOpts(sessionId, host, identity, jump, jumpIdentity, size, extra) {
	const forwards = (extra?.localForwards || []).filter((t) => t.kind === "local" && t.listenPort && t.destPort).map((t) => ({
		listenHost: t.listenHost || "127.0.0.1",
		listenPort: t.listenPort,
		destHost: t.destHost || "127.0.0.1",
		destPort: t.destPort
	}));
	return {
		sessionId,
		host: host.address || host.hostname,
		port: host.port || 22,
		cols: size.cols,
		rows: size.rows,
		alias: host.name || host.hostname,
		proxyJump: host.proxyJump || "",
		localForwards: forwards,
		...sshAuth(host, identity, extra?.password),
		jump: jump ? {
			host: jump.address || jump.hostname,
			port: jump.port || 22,
			alias: jump.name || jump.hostname,
			...sshAuth(jump, jumpIdentity)
		} : void 0
	};
}
function normalizeRemote(dir) {
	const raw = dir.trim() || ".";
	if (raw === "~") return ".";
	if (raw === "/") return "/";
	return raw.replace(/\\/g, "/").replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
}
function SftpPanel({ sessionId, host, active }) {
	const openFile = useVault((s) => s.openFile);
	const session = useVault((s) => s.sessions.find((x) => x.id === sessionId));
	const ssh = liveSsh();
	const [cwd, setCwd] = (0, import_react.useState)(".");
	const [pathEdit, setPathEdit] = (0, import_react.useState)(".");
	const [sel, setSel] = (0, import_react.useState)(null);
	const [query, setQuery] = (0, import_react.useState)("");
	const [items, setItems] = (0, import_react.useState)([]);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [asRoot, setAsRoot] = (0, import_react.useState)(false);
	const [sudoOpen, setSudoOpen] = (0, import_react.useState)(false);
	const [sudoPw, setSudoPw] = (0, import_react.useState)("");
	const [sudoBusy, setSudoBusy] = (0, import_react.useState)(false);
	const fileRef = (0, import_react.useRef)(null);
	const loadedFor = (0, import_react.useRef)("");
	const load = (0, import_react.useCallback)(async (dir) => {
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
	}, [sessionId, ssh]);
	(0, import_react.useEffect)(() => {
		if (!active) return;
		if (!session?.connected) return;
		if (loadedFor.current === sessionId && items.length) return;
		loadedFor.current = sessionId;
		load(cwd || ".");
	}, [
		active,
		session?.connected,
		sessionId,
		load,
		cwd,
		items.length
	]);
	const visible = (0, import_react.useMemo)(() => {
		if (!query.trim()) return items;
		const q = query.toLowerCase();
		return items.filter((i) => i.name.toLowerCase().includes(q));
	}, [items, query]);
	const crumbs = (0, import_react.useMemo)(() => {
		if (cwd === "." || cwd === "") return [{
			label: "~",
			path: "."
		}];
		if (cwd === "/") return [{
			label: "/",
			path: "/"
		}];
		const parts = cwd.replace(/\\/g, "/").split("/").filter(Boolean);
		const acc = cwd.startsWith("/") ? [{
			label: "/",
			path: "/"
		}] : [{
			label: "~",
			path: "."
		}];
		let p = cwd.startsWith("/") ? "" : ".";
		for (const part of parts) {
			p = p === "/" || p === "" ? `/${part}` : `${p}/${part}`.replace(/^\.\//, "");
			if (!p.startsWith("/") && p !== ".") p = p.replace(/^\./, "");
			acc.push({
				label: part,
				path: p
			});
		}
		return acc;
	}, [cwd]);
	const parent = () => {
		if (cwd === ".") return;
		if (cwd === "/") return;
		const next = cwd.replace(/\\/g, "/").replace(/\/$/, "").split("/").slice(0, -1).join("/") || (cwd.startsWith("/") ? "/" : ".");
		load(next);
	};
	const goPath = () => void load(pathEdit);
	const applyRoot = async (password) => {
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
		load(cwd);
	};
	const toggleRoot = async () => {
		if (!ssh) return;
		if (asRoot) {
			await ssh.unsudo(sessionId);
			setAsRoot(false);
			setSudoOpen(false);
			toast.message("Back to SSH user");
			load(cwd);
			return;
		}
		setSudoOpen(true);
	};
	const saveLocal = async (item) => {
		if (!ssh) return;
		const res = await ssh.download(sessionId, item.path, item.type === "dir");
		if (!res.ok) {
			toast.error(res.error);
			return;
		}
		if (res.data && "cancelled" in res.data && res.data.cancelled) return;
		toast.success(item.type === "dir" ? `Saved ${item.name}.tar.gz` : `Saved ${item.name}`);
	};
	if (!ssh) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground",
		children: "SFTP is available in the desktop app."
	});
	if (!session?.connected) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground",
		children: "Connect first, then open Files."
	});
	const openRemote = async (remotePath) => {
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
			original: res.data ?? ""
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2 border-b border-border px-3 py-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "flex min-w-0 flex-1 items-center gap-2",
						onSubmit: (e) => {
							e.preventDefault();
							goPath();
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: pathEdit,
							onChange: (e) => setPathEdit(e.target.value),
							placeholder: "/etc or ~/src",
							className: "h-8 min-w-0 flex-1 font-mono text-xs",
							spellCheck: false
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							size: "sm",
							variant: "outline",
							children: "Go"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: asRoot ? "default" : "outline",
						onClick: () => void toggleRoot(),
						title: "Edit files as root",
						disabled: sudoBusy,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "size-3.5" }), asRoot ? "Root" : "User"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: query,
						onChange: (e) => setQuery(e.target.value),
						placeholder: "Filter",
						className: "h-8 w-28"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: "outline",
						onClick: async () => {
							const name = window.prompt("Folder name");
							if (!name) return;
							const res = await ssh.mkdir(sessionId, `${cwd.replace(/\/$/, "")}/${name}`);
							if (!res.ok) toast.error(res.error);
							else load(cwd);
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderPlus, { className: "size-3.5" }), "New"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: "outline",
						onClick: () => fileRef.current?.click(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-3.5" }), "Upload"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: fileRef,
						type: "file",
						className: "hidden",
						multiple: true,
						onChange: (e) => {
							Array.from(e.target.files ?? []).forEach((file) => {
								const reader = new FileReader();
								reader.onload = async () => {
									const res = await ssh.writeFile(sessionId, `${cwd.replace(/\/$/, "")}/${file.name}`, String(reader.result ?? ""));
									if (!res.ok) toast.error(res.error);
									else load(cwd);
								};
								reader.readAsText(file);
							});
							e.target.value = "";
						}
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				className: "flex min-w-0 flex-wrap items-center gap-1 border-b border-border px-3 py-1.5 text-xs",
				children: [crumbs.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					className: "inline-flex items-center gap-1 text-muted-foreground hover:text-foreground",
					onClick: () => void load(c.path),
					children: [i > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-3" }) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "max-w-28 truncate",
						children: c.label
					})]
				}, `${c.path}-${i}`)), busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-2 text-muted-foreground",
					children: "Loading…"
				}) : null]
			}),
			sudoOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "flex items-center gap-2 border-b border-border px-3 py-2",
				onSubmit: (e) => {
					e.preventDefault();
					applyRoot(sudoPw);
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-muted-foreground",
						children: "sudo password"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "password",
						value: sudoPw,
						onChange: (e) => setSudoPw(e.target.value),
						autoFocus: true,
						className: "h-8 max-w-xs font-mono text-xs",
						placeholder: "Required for root"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						size: "sm",
						disabled: sudoBusy,
						children: sudoPw ? "Unlock" : "Passwordless"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						size: "sm",
						variant: "ghost",
						onClick: () => {
							setSudoOpen(false);
							setSudoPw("");
						},
						children: "Cancel"
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollArea, {
				className: "min-h-0 flex-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-left text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "sticky top-0 bg-surface text-xs text-muted-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium",
								children: "Name"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium",
								children: "Size"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "hidden px-3 py-2 font-medium sm:table-cell",
								children: "Mode"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "hidden px-3 py-2 font-medium md:table-cell",
								children: "Modified"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-3 py-2 font-medium",
								children: " "
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
						className: "cursor-pointer border-t border-border/60 hover:bg-surface-2",
						onClick: parent,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-3 py-2 text-muted-foreground",
							colSpan: 5,
							children: ".."
						})
					}), visible.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: `border-t border-border/60 hover:bg-surface-2 ${sel === item.path ? "bg-surface-2" : ""}`,
						onClick: () => setSel(item.path),
						onDoubleClick: () => {
							if (item.type === "dir") load(item.path);
							else if (item.type === "link") (async () => {
								if ((await ssh.list(sessionId, item.path)).ok) load(item.path);
								else openRemote(item.path);
							})();
							else openRemote(item.path);
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-2",
									children: [
										item.type === "dir" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Folder, { className: "size-4 text-muted-foreground" }) : item.type === "link" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "size-4 text-muted-foreground" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(File, { className: "size-4 text-muted-foreground" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium",
											children: item.name
										}),
										item.type === "link" && item.target ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-mono text-[11px] text-muted-foreground",
											children: ["→ ", item.target]
										}) : null
									]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2 tabular-nums text-muted-foreground",
								children: item.type === "dir" ? "—" : formatBytes(item.size)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "hidden px-3 py-2 font-mono text-xs text-muted-foreground sm:table-cell",
								children: item.mode
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "hidden px-3 py-2 text-xs text-muted-foreground md:table-cell",
								children: item.mtime ? new Date(item.mtime).toLocaleString() : "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-3 py-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-end gap-1",
									children: [
										item.type === "file" || item.type === "link" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "icon-sm",
											variant: "ghost",
											onClick: () => void openRemote(item.path),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-3.5" })
										}) : null,
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "icon-sm",
											variant: "ghost",
											title: item.type === "dir" ? "Download folder as .tar.gz" : "Download",
											onClick: () => void saveLocal(item),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-3.5" })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "icon-sm",
											variant: "ghost",
											onClick: async () => {
												const res = await ssh.remove(sessionId, item.path, item.type === "dir");
												if (!res.ok) toast.error(res.error);
												else load(cwd);
											},
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
										})
									]
								})
							})
						]
					}, item.path))] })]
				})
			})
		]
	});
}
var EXT_ALIAS = {
	mjs: "js",
	cjs: "js",
	sh: "bash",
	zsh: "bash",
	ksh: "bash",
	yml: "yaml",
	md: "markdown",
	htm: "html",
	cc: "cpp",
	cxx: "cpp",
	hpp: "cpp"
};
function languageFor(path) {
	const base = (path.split("/").pop() || "").toLowerCase();
	let key = base === "dockerfile" || base.startsWith("dockerfile.") ? "dockerfile" : base.includes(".") ? base.split(".").pop() || "" : base;
	key = EXT_ALIAS[key] || key;
	if (!key) return void 0;
	try {
		return loadLanguage(key);
	} catch {
		return;
	}
}
function EditorPanel({ sessionId }) {
	const openFiles = useVault((s) => s.openFiles);
	const activeFileId = useVault((s) => s.activeFileId);
	const setActiveFile = useVault((s) => s.setActiveFile);
	const updateFile = useVault((s) => s.updateFile);
	const closeFile = useVault((s) => s.closeFile);
	const file = openFiles.find((f) => f.id === activeFileId) ?? openFiles[0];
	const save = (0, import_react.useCallback)(async () => {
		const target = useVault.getState().openFiles.find((f) => f.id === (useVault.getState().activeFileId || file?.id)) ?? file;
		if (!target) return;
		const ssh = liveSsh();
		if (!ssh) {
			toast.error("Connect from the desktop app to save");
			return;
		}
		const res = await ssh.writeFile(sessionId, target.path, target.content);
		if (!res.ok) {
			toast.error(res.error);
			return;
		}
		useVault.setState({ openFiles: useVault.getState().openFiles.map((f) => f.id === target.id ? {
			...f,
			original: f.content
		} : f) });
		toast.success("Saved");
	}, [file, sessionId]);
	const extensions = (0, import_react.useMemo)(() => {
		const lang = file ? languageFor(file.path) : void 0;
		return [
			search(),
			keymap.of([
				...searchKeymap,
				indentWithTab,
				{
					key: "Mod-s",
					preventDefault: true,
					run: () => {
						save();
						return true;
					}
				}
			]),
			...lang ? [lang] : []
		];
	}, [file?.path, save]);
	if (!file) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground",
		children: "Open a file from Files."
	});
	const dirty = file.content !== file.original;
	const lines = file.content.split("\n").length;
	const crumbs = file.path.replace(/\\/g, "/").split("/").filter(Boolean);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex h-10 shrink-0 items-center gap-1 overflow-x-auto border-b border-border bg-surface px-1",
				children: [openFiles.map((f) => {
					const on = f.id === file.id;
					const dirtyTab = f.content !== f.original;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setActiveFile(f.id),
						className: `group inline-flex h-8 items-center gap-2 rounded-md px-2.5 text-xs transition-colors ${on ? "bg-background text-foreground" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileCode, { className: "size-3.5 opacity-70" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "max-w-40 truncate",
								children: f.path.split("/").pop()
							}),
							dirtyTab ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-warn" }) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								role: "button",
								className: "rounded p-0.5 opacity-0 hover:bg-background group-hover:opacity-70",
								onClick: (e) => {
									e.stopPropagation();
									closeFile(f.id);
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3" })
							})
						]
					}, f.id);
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "ml-auto px-1",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: dirty ? "default" : "ghost",
						onClick: () => void save(),
						children: "Save"
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex h-8 shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-3 text-[11px] text-muted-foreground",
				children: crumbs.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "inline-flex items-center gap-1",
					children: [i > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "opacity-40",
						children: "/"
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: i === crumbs.length - 1 ? "text-foreground" : "",
						children: c
					})]
				}, `${c}-${i}`))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "min-h-0 flex-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReactCodeMirror, {
					value: file.content,
					height: "100%",
					theme: vscodeDark,
					extensions,
					basicSetup: {
						lineNumbers: true,
						foldGutter: true,
						highlightActiveLine: true,
						autocompletion: true,
						searchKeymap: false,
						bracketMatching: true
					},
					onChange: (value) => updateFile(file.id, value),
					className: "h-full text-[13px] [&_.cm-editor]:h-full [&_.cm-editor]:outline-none [&_.cm-gutters]:border-none [&_.cm-scroller]:font-mono"
				}, file.id)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex h-7 shrink-0 items-center justify-between border-t border-border px-3 text-[11px] text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [lines, " lines"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Ctrl+S save · Ctrl+F find" })]
			})
		]
	});
}
function CommandPalette({ open, onOpenChange, onConnect, onWindowsApp }) {
	const hosts = useVault((s) => s.hosts);
	const snippets = useVault((s) => s.snippets);
	const setActivity = useVault((s) => s.setActivity);
	const setWorkspaceMode = useVault((s) => s.setWorkspaceMode);
	const [q, setQ] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if (!open) setQ("");
	}, [open]);
	const filteredHosts = (0, import_react.useMemo)(() => {
		const s = q.toLowerCase();
		return hosts.filter((h) => [
			h.name,
			h.hostname,
			h.username,
			...h.tags
		].join(" ").toLowerCase().includes(s));
	}, [hosts, q]);
	if (!open) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-start justify-center bg-background/70 pt-[12vh] px-3",
		onClick: () => onOpenChange(false),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(_e, {
			className: "w-full max-w-lg overflow-hidden rounded-xl border border-border bg-popover shadow-lg",
			onClick: (e) => e.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Input, {
				value: q,
				onValueChange: setQ,
				placeholder: "Connect or run a command…",
				className: "h-12 w-full border-b border-border bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(_e.List, {
				className: "max-h-80 overflow-auto p-2 geassline-scroll",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Empty, {
						className: "px-3 py-6 text-center text-sm text-muted-foreground",
						children: "Nothing matches"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Group, {
						heading: "Hosts",
						className: "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground",
						children: filteredHosts.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Item, {
							value: `${h.name} ${h.hostname}`,
							onSelect: () => {
								onConnect(h.id);
								onOpenChange(false);
							},
							className: "flex cursor-pointer items-center justify-between rounded-md px-2 py-2 text-sm data-[selected=true]:bg-surface-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [h.name, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "ml-2 text-xs text-muted-foreground",
								children: [
									h.username,
									"@",
									h.hostname
								]
							})] })
						}, h.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Group, {
						heading: "Go",
						className: "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground",
						children: [
							["Terminal", () => setWorkspaceMode("terminal")],
							["Files", () => setWorkspaceMode("files")],
							["Editor", () => setWorkspaceMode("code")],
							["Tunnels", () => {
								setWorkspaceMode("tunnels");
								setActivity("tunnels");
							}],
							["Identities", () => setActivity("keys")],
							["Snippets", () => setActivity("snippets")],
							["Settings", () => setActivity("settings")],
							...desktopBridge()?.offline ? [] : [["Download for Windows", onWindowsApp]]
						].map(([label, fn]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Item, {
							value: label,
							onSelect: () => {
								fn();
								onOpenChange(false);
							},
							className: "cursor-pointer rounded-md px-2 py-2 text-sm data-[selected=true]:bg-surface-2",
							children: label
						}, label))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(_e.Group, {
						heading: "Snippets",
						className: "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground",
						children: snippets.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(_e.Item, {
							value: s.name,
							onSelect: () => {
								navigator.clipboard.writeText(s.body);
								onOpenChange(false);
							},
							className: "cursor-pointer rounded-md px-2 py-2 text-sm data-[selected=true]:bg-surface-2",
							children: [
								"Copy “",
								s.name,
								"”"
							]
						}, s.id))
					})
				]
			})]
		})
	});
}
var TERMINAL_THEMES = [
	{
		id: "geassline-ink",
		name: "Geassline Ink",
		background: "#090a0b",
		foreground: "#ececea",
		cursor: "#c5c9ce",
		cursorAccent: "#090a0b",
		selectionBackground: "#2a3138",
		black: "#121416",
		red: "#c45c4a",
		green: "#7d9a8a",
		yellow: "#c4a574",
		blue: "#8a9aab",
		magenta: "#9a8a96",
		cyan: "#7f9aa0",
		white: "#d5d5d0",
		brightBlack: "#5c615e",
		brightRed: "#d97a6a",
		brightGreen: "#9bb5a6",
		brightYellow: "#d4bc90",
		brightBlue: "#a8b6c4",
		brightMagenta: "#b5a6b0",
		brightCyan: "#9db8bc",
		brightWhite: "#f4f4f1"
	},
	{
		id: "phosphor",
		name: "Phosphor",
		background: "#07120c",
		foreground: "#cfe7d4",
		cursor: "#b6e0c0",
		cursorAccent: "#07120c",
		selectionBackground: "#1a3324",
		black: "#0b1810",
		red: "#c45c4a",
		green: "#7d9a8a",
		yellow: "#c4a574",
		blue: "#8a9aab",
		magenta: "#9a8a96",
		cyan: "#7f9aa0",
		white: "#cfe7d4",
		brightBlack: "#3d5a46",
		brightRed: "#d97a6a",
		brightGreen: "#b6e0c0",
		brightYellow: "#d4bc90",
		brightBlue: "#a8b6c4",
		brightMagenta: "#b5a6b0",
		brightCyan: "#9db8bc",
		brightWhite: "#eef6f0"
	},
	{
		id: "nord",
		name: "Nord",
		background: "#2e3440",
		foreground: "#d8dee9",
		cursor: "#d8dee9",
		cursorAccent: "#2e3440",
		selectionBackground: "#434c5e",
		black: "#3b4252",
		red: "#bf616a",
		green: "#a3be8c",
		yellow: "#ebcb8b",
		blue: "#81a1c1",
		magenta: "#b48ead",
		cyan: "#88c0d0",
		white: "#e5e9f0",
		brightBlack: "#4c566a",
		brightRed: "#bf616a",
		brightGreen: "#a3be8c",
		brightYellow: "#ebcb8b",
		brightBlue: "#81a1c1",
		brightMagenta: "#b48ead",
		brightCyan: "#8fbcbb",
		brightWhite: "#eceff4"
	},
	{
		id: "one-dark",
		name: "One Dark",
		background: "#21252b",
		foreground: "#abb2bf",
		cursor: "#abb2bf",
		cursorAccent: "#21252b",
		selectionBackground: "#3e4451",
		black: "#21252b",
		red: "#e06c75",
		green: "#98c379",
		yellow: "#e5c07b",
		blue: "#61afef",
		magenta: "#c678dd",
		cyan: "#56b6c2",
		white: "#abb2bf",
		brightBlack: "#5c6370",
		brightRed: "#e06c75",
		brightGreen: "#98c379",
		brightYellow: "#e5c07b",
		brightBlue: "#61afef",
		brightMagenta: "#c678dd",
		brightCyan: "#56b6c2",
		brightWhite: "#ffffff"
	},
	{
		id: "solarized-dark",
		name: "Solarized Dark",
		background: "#002b36",
		foreground: "#839496",
		cursor: "#93a1a1",
		cursorAccent: "#002b36",
		selectionBackground: "#073642",
		black: "#073642",
		red: "#dc322f",
		green: "#859900",
		yellow: "#b58900",
		blue: "#268bd2",
		magenta: "#d33682",
		cyan: "#2aa198",
		white: "#eee8d5",
		brightBlack: "#002b36",
		brightRed: "#cb4b16",
		brightGreen: "#586e75",
		brightYellow: "#657b83",
		brightBlue: "#839496",
		brightMagenta: "#6c71c4",
		brightCyan: "#93a1a1",
		brightWhite: "#fdf6e3"
	},
	{
		id: "gruvbox",
		name: "Gruvbox Dark",
		background: "#1d2021",
		foreground: "#ebdbb2",
		cursor: "#ebdbb2",
		cursorAccent: "#1d2021",
		selectionBackground: "#3c3836",
		black: "#1d2021",
		red: "#cc241d",
		green: "#98971a",
		yellow: "#d79921",
		blue: "#458588",
		magenta: "#b16286",
		cyan: "#689d6a",
		white: "#a89984",
		brightBlack: "#928374",
		brightRed: "#fb4934",
		brightGreen: "#b8bb26",
		brightYellow: "#fabd2f",
		brightBlue: "#83a598",
		brightMagenta: "#d3869b",
		brightCyan: "#8ec07c",
		brightWhite: "#ebdbb2"
	},
	{
		id: "high-contrast",
		name: "High Contrast",
		background: "#000000",
		foreground: "#ffffff",
		cursor: "#ffffff",
		cursorAccent: "#000000",
		selectionBackground: "#444444",
		black: "#000000",
		red: "#ff6b6b",
		green: "#b6e0c0",
		yellow: "#ffe08a",
		blue: "#9bb7d4",
		magenta: "#d4b0c4",
		cyan: "#9fd4d0",
		white: "#eeeeee",
		brightBlack: "#888888",
		brightRed: "#ff8a8a",
		brightGreen: "#d4f0da",
		brightYellow: "#fff3c0",
		brightBlue: "#c5d8ea",
		brightMagenta: "#ead0de",
		brightCyan: "#c8ecea",
		brightWhite: "#ffffff"
	},
	{
		id: "paper",
		name: "Paper",
		background: "#f4f1ea",
		foreground: "#1c1917",
		cursor: "#1c1917",
		cursorAccent: "#f4f1ea",
		selectionBackground: "#d6d0c4",
		black: "#1c1917",
		red: "#9b3b2e",
		green: "#3f6b54",
		yellow: "#8a6a32",
		blue: "#3d5873",
		magenta: "#6b4d5e",
		cyan: "#3d6568",
		white: "#e7e2d8",
		brightBlack: "#6b6560",
		brightRed: "#c45c4a",
		brightGreen: "#5d8f72",
		brightYellow: "#b08944",
		brightBlue: "#5a7a96",
		brightMagenta: "#8a6a7c",
		brightCyan: "#5a8589",
		brightWhite: "#1c1917"
	}
];
function getTheme(id) {
	return TERMINAL_THEMES.find((t) => t.id === id) ?? TERMINAL_THEMES[0];
}
async function readClipboard() {
	const desktop = desktopBridge();
	if (desktop?.clipboardRead) return desktop.clipboardRead() || "";
	try {
		return await navigator.clipboard.readText();
	} catch {
		return "";
	}
}
function writeClipboard(text) {
	if (!text) return;
	const desktop = desktopBridge();
	if (desktop?.clipboardWrite) {
		desktop.clipboardWrite(text);
		return;
	}
	navigator.clipboard.writeText(text).catch(() => void 0);
}
function TerminalView({ sessionId, host, identity, settings, active = true }) {
	const wrapRef = (0, import_react.useRef)(null);
	const termRef = (0, import_react.useRef)(void 0);
	const fitRef = (0, import_react.useRef)(void 0);
	const markConnected = useVault((s) => s.markConnected);
	const touchHost = useVault((s) => s.touchHost);
	const hosts = useVault((s) => s.hosts);
	const identities = useVault((s) => s.identities);
	const tunnels = useVault((s) => s.tunnels.filter((t) => t.hostId === host.id && t.kind === "local"));
	const askPass = needsPasswordPrompt(identity);
	const [password, setPassword] = (0, import_react.useState)(identity?.kind === "password" ? identity.password : "");
	const [authed, setAuthed] = (0, import_react.useState)(!askPass);
	(0, import_react.useEffect)(() => {
		if (!active) return;
		fitRef.current?.fit();
		const term = termRef.current;
		if (term) liveSsh()?.resize(sessionId, term.cols, term.rows);
	}, [active, sessionId]);
	(0, import_react.useEffect)(() => {
		if (!authed) return;
		if (!wrapRef.current) return;
		let disposed = false;
		let term;
		let fit;
		const ro = new ResizeObserver(() => {
			fit?.fit();
			if (term) liveSsh()?.resize(sessionId, term.cols, term.rows);
		});
		const unsubs = [];
		(async () => {
			const [{ Terminal }, { FitAddon }, { WebLinksAddon }] = await Promise.all([
				import("../_libs/xterm__xterm.mjs").then((n) => n.t),
				import("../_libs/xterm__addon-fit.mjs").then((n) => n.t),
				import("../_libs/xterm__addon-web-links.mjs").then((n) => n.t),
				Promise.resolve({})
			]);
			if (disposed || !wrapRef.current) return;
			term = new Terminal({
				theme: getTheme(settings.terminalTheme),
				fontFamily: settings.fontFamily,
				fontSize: settings.fontSize,
				cursorStyle: settings.cursorStyle,
				cursorBlink: settings.cursorBlink,
				scrollback: settings.scrollback,
				allowProposedApi: true,
				convertEol: false,
				rightClickSelectsWord: false
			});
			fit = new FitAddon();
			term.loadAddon(fit);
			term.loadAddon(new WebLinksAddon());
			term.open(wrapRef.current);
			fit.fit();
			ro.observe(wrapRef.current);
			termRef.current = term;
			fitRef.current = fit;
			const pasteText = async () => {
				const text = await readClipboard();
				if (!text || disposed) return;
				const normalized = text.replace(/\r\n/g, "\n").replace(/\n/g, "\r");
				term.paste(normalized);
			};
			const copySel = () => {
				const sel = term.getSelection();
				if (sel) writeClipboard(sel);
				return !!sel;
			};
			term.attachCustomKeyEventHandler((ev) => {
				if (ev.type !== "keydown") return true;
				const ctrl = ev.ctrlKey || ev.metaKey;
				if (ctrl && ev.code === "KeyC" && !ev.altKey && !ev.shiftKey) {
					if (term.hasSelection()) {
						copySel();
						term.clearSelection();
						return false;
					}
					return true;
				}
				if (ctrl && ev.shiftKey && ev.code === "KeyC") {
					copySel();
					return false;
				}
				if (ctrl && ev.code === "KeyV" && !ev.altKey || ctrl && ev.shiftKey && ev.code === "KeyV") {
					pasteText();
					return false;
				}
				if (ev.shiftKey && ev.code === "Insert" && !ctrl) {
					pasteText();
					return false;
				}
				if (ctrl && ev.code === "Insert") {
					copySel();
					return false;
				}
				return true;
			});
			if (settings.copyOnSelect) term.onSelectionChange(() => {
				if (term.hasSelection()) copySel();
			});
			const onContext = (e) => {
				e.preventDefault();
				if (term.hasSelection()) copySel();
				else pasteText();
			};
			wrapRef.current.addEventListener("contextmenu", onContext);
			unsubs.push(() => wrapRef.current?.removeEventListener("contextmenu", onContext));
			const ssh = liveSsh();
			const desktop = desktopBridge();
			if (!ssh || !desktop?.liveSsh) {
				term.writeln("\x1B[33mSSH runs in the Geassline desktop app.\x1B[0m");
				markConnected(sessionId, false);
				return;
			}
			const jump = host.jumpHostId ? hosts.find((h) => h.id === host.jumpHostId) : void 0;
			const jumpIdentity = jump ? identities.find((i) => i.id === jump.identityId) : void 0;
			const unData = ssh.onData((payload) => {
				if (payload.sessionId !== sessionId || disposed) return;
				const bytes = Uint8Array.from(atob(payload.data), (c) => c.charCodeAt(0));
				term.write(bytes);
			});
			const unClose = ssh.onClose((payload) => {
				if (payload.sessionId !== sessionId || disposed) return;
				term.writeln("\r\n\x1B[90mConnection closed.\x1B[0m");
				markConnected(sessionId, false);
			});
			unsubs.push(unData, unClose);
			term.onData((data) => {
				ssh.write(sessionId, data);
			});
			const st = await ssh.status(sessionId);
			if (disposed) return;
			if (st.ok && st.data?.connected) {
				markConnected(sessionId, true);
				return;
			}
			term.writeln(`\x1b[90mConnecting ${host.username}@${host.name || host.hostname}…\x1b[0m`);
			const result = await ssh.connect(sshConnectOpts(sessionId, host, identity, jump, jumpIdentity, {
				cols: term.cols,
				rows: term.rows
			}, {
				password,
				localForwards: tunnels
			}));
			if (disposed) return;
			if (!result.ok) {
				term.writeln(`\x1b[31m${result.error}\x1b[0m`);
				markConnected(sessionId, false);
				toast.error(result.error);
				return;
			}
			markConnected(sessionId, true);
			touchHost(host.id);
			if (host.startupCommand && !result.data?.reused) ssh.write(sessionId, `${host.startupCommand}\n`);
		})();
		return () => {
			disposed = true;
			ro.disconnect();
			for (const off of unsubs) off();
			termRef.current = void 0;
			fitRef.current = void 0;
			term?.dispose();
		};
	}, [
		sessionId,
		authed,
		settings.terminalTheme,
		settings.fontSize,
		settings.cursorStyle,
		settings.cursorBlink,
		settings.copyOnSelect
	]);
	if (!authed) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 flex items-center justify-center bg-background p-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "w-full max-w-sm rounded-xl border border-border bg-surface p-5",
			onSubmit: (e) => {
				e.preventDefault();
				if (!password) {
					toast.error("Enter the SSH password");
					return;
				}
				setAuthed(true);
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm font-medium",
					children: [
						"Password for ",
						host.username,
						"@",
						host.hostname
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted-foreground",
					children: "Sent through Windows OpenSSH. Not typed into the terminal."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					type: "password",
					value: password,
					onChange: (e) => setPassword(e.target.value),
					autoFocus: true,
					className: "mt-3",
					placeholder: "SSH password"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					className: "mt-3 w-full",
					children: "Connect"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "ghost",
					className: "mt-1 w-full",
					onClick: () => {
						setPassword("");
						setAuthed(true);
					},
					children: "Use key / FIDO instead"
				})
			]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: wrapRef,
		className: "absolute inset-0 bg-background px-3 py-2"
	});
}
var deferred = null;
var listening = false;
function isPrompt(x) {
	return !!x && typeof x === "object" && "prompt" in x && "userChoice" in x;
}
function watchInstallPrompt() {
	if (listening || typeof window === "undefined") return;
	listening = true;
	window.addEventListener("beforeinstallprompt", (event) => {
		event.preventDefault();
		if (isPrompt(event)) deferred = event;
	});
}
function canInstallPwa() {
	return deferred !== null;
}
function isStandaloneApp() {
	if (typeof window === "undefined") return false;
	const standalone = window.matchMedia("(display-mode: standalone)").matches || window.matchMedia("(display-mode: minimal-ui)").matches || window.matchMedia("(display-mode: window-controls-overlay)").matches;
	const flag = new URLSearchParams(window.location.search).get("desktop") === "1";
	return standalone || flag;
}
async function promptInstallPwa() {
	if (!deferred) return "unavailable";
	const event = deferred;
	deferred = null;
	await event.prompt();
	const { outcome } = await event.userChoice;
	return outcome;
}
function Titlebar({ quick, onQuickChange, onQuickConnect, onCommandPalette, onNewHost, onToggleSplit, onWindowsApp }) {
	const vault = useVault();
	const session = vault.sessions.find((s) => s.id === vault.activeSessionId);
	const host = session ? vault.hosts.find((h) => h.id === session.hostId) : void 0;
	const canLock = !!(vault.settings.vaultLock || vault.fido2CredentialId);
	const desktop = desktopBridge();
	const maximize = () => {
		const desktop = desktopBridge();
		if (desktop) {
			desktop.maximize();
			return;
		}
		const root = document.documentElement;
		if (document.fullscreenElement) document.exitFullscreen();
		else root.requestFullscreen().catch(() => toast.message("Fullscreen is blocked in this frame"));
	};
	const minimize = () => {
		const desktop = desktopBridge();
		if (desktop) {
			desktop.minimize();
			return;
		}
		if (isStandaloneApp()) {
			window.blur();
			return;
		}
		toast.message("Minimize is available in the desktop window");
	};
	const close = () => {
		const desktop = desktopBridge();
		if (desktop) {
			desktop.close();
			return;
		}
		window.close();
		window.setTimeout(() => {
			if (!window.closed) onWindowsApp();
		}, 200);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "titlebar-drag flex h-12 shrink-0 select-none items-center border-b border-border bg-sidebar",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "titlebar-no-drag flex items-center gap-1 pl-2.5 pr-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "hidden text-sm font-medium tracking-tight sm:inline",
					children: "Geassline"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "titlebar-no-drag hidden items-center md:flex",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BarMenu, {
						label: "File",
						items: [
							{
								label: "New host",
								onSelect: onNewHost
							},
							{
								label: "Command palette",
								shortcut: "Ctrl+Shift+P",
								onSelect: onCommandPalette
							},
							...desktop?.offline ? [] : [{
								label: "Download for Windows",
								onSelect: onWindowsApp
							}],
							...canLock ? [{
								label: "Lock",
								onSelect: () => vault.setLocked(true)
							}] : [],
							{
								label: "Close window",
								onSelect: close
							}
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BarMenu, {
						label: "View",
						items: [
							{
								label: "Terminal",
								onSelect: () => vault.setWorkspaceMode("terminal")
							},
							{
								label: "Files",
								onSelect: () => vault.setWorkspaceMode("files")
							},
							{
								label: "Editor",
								onSelect: () => vault.setWorkspaceMode("code")
							},
							{
								label: "Tunnels",
								onSelect: () => vault.setWorkspaceMode("tunnels")
							},
							{
								label: "New terminal",
								onSelect: onToggleSplit
							}
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BarMenu, {
						label: "Host",
						items: [{
							label: "Identities",
							onSelect: () => vault.setActivity("keys")
						}, {
							label: "Settings",
							onSelect: () => vault.setActivity("settings")
						}]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "titlebar-no-drag hidden min-w-0 flex-1 items-center gap-2 px-2 md:flex",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative mx-auto w-full max-w-md",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: quick,
						onChange: (e) => onQuickChange(e.target.value),
						onKeyDown: (e) => e.key === "Enter" && onQuickConnect(),
						placeholder: "user@host[:port]",
						className: "h-8 pl-8 font-mono text-xs"
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "titlebar-drag min-w-0 flex-1 truncate px-3 text-center text-[11px] text-muted-foreground md:hidden",
				children: host ? host.name : "Geassline"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "titlebar-no-drag ml-auto flex items-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: "ghost",
						onClick: onCommandPalette,
						className: "hidden h-8 sm:inline-flex",
						children: ["Command", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
							className: "rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground",
							children: "Ctrl+Shift+P"
						})]
					}),
					canLock ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "icon-sm",
						variant: "ghost",
						onClick: () => vault.setLocked(true),
						"aria-label": "Lock vault",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "size-4" })
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ml-1 hidden h-12 items-stretch md:flex",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WinBtn, {
								label: "Minimize",
								onClick: minimize,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-3.5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WinBtn, {
								label: "Maximize",
								onClick: maximize,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { className: "size-3" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WinBtn, {
								label: "Close",
								onClick: close,
								close: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" })
							})
						]
					})
				]
			})
		]
	});
}
function WinBtn({ label, onClick, close, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-label": label,
		onClick,
		className: cn("flex w-11 items-center justify-center text-muted-foreground transition-colors duration-150", close ? "hover:bg-destructive hover:text-foreground" : "hover:bg-surface-2 hover:text-foreground"),
		children
	});
}
function BarMenu({ label, items }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const onDoc = (e) => {
			if (!ref.current?.contains(e.target)) setOpen(false);
		};
		const onKey = (e) => {
			if (e.key === "Escape") setOpen(false);
		};
		document.addEventListener("mousedown", onDoc);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDoc);
			document.removeEventListener("keydown", onKey);
		};
	}, [open]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative",
		ref,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: cn("h-8 rounded-sm px-2 text-xs text-muted-foreground transition-colors duration-150 hover:bg-surface-2 hover:text-foreground", open && "bg-surface-2 text-foreground"),
			onClick: () => setOpen((v) => !v),
			children: label
		}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute left-0 top-full z-40 mt-1 min-w-52 rounded-md border border-border bg-popover py-1 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]",
			children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "flex w-full items-center justify-between gap-6 px-3 py-1.5 text-left text-xs hover:bg-surface-2",
				onClick: () => {
					setOpen(false);
					item.onSelect();
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.label }), item.shortcut ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[10px] text-muted-foreground",
					children: item.shortcut
				}) : null]
			}, item.label))
		}) : null]
	});
}
function WindowsAppDialog({ open, onOpenChange }) {
	const [standalone, setStandalone] = (0, import_react.useState)(false);
	const [installable, setInstallable] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		watchInstallPrompt();
		setStandalone(isStandaloneApp());
		setInstallable(canInstallPwa());
	}, [open]);
	const install = async () => {
		const result = await promptInstallPwa();
		if (result === "accepted") {
			toast.success("Geassline is installed");
			onOpenChange(false);
			return;
		}
		if (result === "dismissed") return;
		toast.message("Use the browser install menu", { description: "Edge or Chrome → Apps → Install Geassline. Then pin it to the taskbar." });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			title: "Geassline Desktop",
			className: "max-w-lg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm leading-relaxed text-muted-foreground text-pretty",
					children: "An offline Windows SSH client. Geassline.exe opens real TCP sessions to your hosts — not a simulated terminal. ~/.ssh/config is read on launch. No Grok login."
				}),
				standalone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 rounded-md border border-border bg-surface-2 px-3 py-2 text-xs text-ok",
					children: "Already running as a desktop window. Pin this to the taskbar from the icon."
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 grid gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						className: "h-11 justify-start",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: WINDOWS_DESKTOP_ZIP,
							download: "Geassline-windows-x64.zip",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), "Download Geassline for Windows"]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						className: "h-11 justify-start",
						onClick: () => void install(),
						disabled: standalone,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pin, { className: "size-4" }), installable ? "Install to Start Menu" : "Install as a Windows app"]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-5 grid gap-3 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Li, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-3.5" }),
							title: "Offline package",
							children: "About 100 MB zip. Extract, then double-click Geassline.exe. Works without internet. First SmartScreen prompt: More info → Run anyway."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Li, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppWindow, { className: "size-3.5" }),
							title: "Own window",
							children: "Native desktop frame. Hosts from ~/.ssh/config appear in the sidebar on launch."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Li, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pin, { className: "size-3.5" }),
							title: "Taskbar",
							children: "Right-click the running icon → Pin to taskbar."
						})
					]
				})
			]
		})
	});
}
function Li({ icon, title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "flex gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-2 text-foreground",
			children: icon
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-medium",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mt-0.5 block text-xs leading-relaxed text-muted-foreground",
			children
		})] })]
	});
}
function u32be(n) {
	const b = /* @__PURE__ */ new Uint8Array(4);
	new DataView(b.buffer).setUint32(0, n);
	return b;
}
function sshBuf(data) {
	const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
	const out = new Uint8Array(4 + bytes.length);
	out.set(u32be(bytes.length), 0);
	out.set(bytes, 4);
	return out;
}
function concat(parts) {
	const len = parts.reduce((n, p) => n + p.length, 0);
	const out = new Uint8Array(len);
	let o = 0;
	for (const p of parts) {
		out.set(p, o);
		o += p.length;
	}
	return out;
}
function b64(bytes) {
	let s = "";
	for (let i = 0; i < bytes.length; i += 1) s += String.fromCharCode(bytes[i]);
	return btoa(s);
}
function wrap64(s, n = 70) {
	const lines = [];
	for (let i = 0; i < s.length; i += n) lines.push(s.slice(i, i + n));
	return lines.join("\n");
}
async function sha256(bytes) {
	const buf = await crypto.subtle.digest("SHA-256", bytes.slice().buffer);
	return new Uint8Array(buf);
}
function publicBlobEd25519(pub) {
	return concat([sshBuf("ssh-ed25519"), sshBuf(pub)]);
}
async function fingerprintSha256(blob) {
	return `SHA256:${b64(await sha256(blob)).replace(/=+$/, "")}`;
}
async function generateEd25519(comment = "geassline") {
	const pair = await keygenAsync();
	const secret = pair.secretKey;
	const pub = pair.publicKey;
	const blob = publicBlobEd25519(pub);
	const publicKey = `ssh-ed25519 ${b64(blob)} ${comment}`;
	const check = crypto.getRandomValues(/* @__PURE__ */ new Uint32Array(1))[0];
	const privInner = concat([
		u32be(check),
		u32be(check),
		sshBuf("ssh-ed25519"),
		sshBuf(pub),
		sshBuf(concat([secret, pub])),
		sshBuf(comment)
	]);
	const padNeed = (8 - privInner.length % 8) % 8;
	const pad = new Uint8Array(padNeed);
	for (let i = 0; i < padNeed; i += 1) pad[i] = i + 1;
	const privSection = concat([privInner, pad]);
	return {
		privateKey: `-----BEGIN OPENSSH PRIVATE KEY-----\n${wrap64(b64(concat([
			new TextEncoder().encode("openssh-key-v1\0"),
			sshBuf("none"),
			sshBuf("none"),
			sshBuf(/* @__PURE__ */ new Uint8Array(0)),
			u32be(1),
			sshBuf(blob),
			sshBuf(privSection)
		])))}\n-----END OPENSSH PRIVATE KEY-----\n`,
		publicKey,
		fingerprint: await fingerprintSha256(blob),
		algorithm: "ssh-ed25519"
	};
}
function b64join(lines) {
	return lines.join("").replace(/\s+/g, "");
}
function parsePpk(text) {
	const lines = text.replace(/\r\n/g, "\n").split("\n");
	const typeMatch = (lines[0] ?? "").match(/PuTTY-User-Key-File-[23]:\s+(\S+)/i);
	if (!typeMatch) throw new Error("Not a PuTTY .ppk key file.");
	const algorithm = typeMatch[1];
	let encryption = "none";
	let comment = "";
	let pubLines = 0;
	let privLines = 0;
	const pub = [];
	const priv = [];
	let mode = "none";
	for (let i = 1; i < lines.length; i += 1) {
		const line = lines[i] ?? "";
		if (line.startsWith("Encryption:")) encryption = line.slice(11).trim();
		else if (line.startsWith("Comment:")) comment = line.slice(8).trim();
		else if (line.startsWith("Public-Lines:")) {
			pubLines = Number(line.slice(13).trim()) || 0;
			mode = "pub";
		} else if (line.startsWith("Private-Lines:")) {
			privLines = Number(line.slice(14).trim()) || 0;
			mode = "priv";
		} else if (line.startsWith("Private-MAC:")) mode = "none";
		else if (mode === "pub" && pub.length < pubLines) pub.push(line.trim());
		else if (mode === "priv" && priv.length < privLines) priv.push(line.trim());
	}
	const encrypted = encryption !== "none";
	return {
		publicKey: `${algorithm} ${b64join(pub)} ${comment || "ppk-import"}`,
		privateKey: encrypted ? "" : `-----BEGIN PUTTY PRIVATE KEY-----\n${b64join(priv)}\n-----END PUTTY PRIVATE KEY-----\n`,
		comment,
		algorithm,
		encrypted
	};
}
var shells = /* @__PURE__ */ new Map();
function dropShell(sessionId) {
	shells.delete(sessionId);
}
var ACTIVITIES = [
	{
		id: "hosts",
		label: "Hosts",
		icon: Server
	},
	{
		id: "tunnels",
		label: "Tunnels",
		icon: Unplug
	},
	{
		id: "snippets",
		label: "Snippets",
		icon: SquareTerminal
	},
	{
		id: "keys",
		label: "Keys",
		icon: KeyRound
	},
	{
		id: "settings",
		label: "Settings",
		icon: Settings
	}
];
function emptyHost() {
	return {
		id: nid(),
		name: "",
		hostname: "",
		port: 22,
		protocol: "ssh",
		groupId: "g-personal",
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
		latencyMs: 0
	};
}
function Workstation() {
	const vault = useVault();
	const [palette, setPalette] = (0, import_react.useState)(false);
	const [hostOpen, setHostOpen] = (0, import_react.useState)(false);
	const [editingHost, setEditingHost] = (0, import_react.useState)(null);
	const [quick, setQuick] = (0, import_react.useState)("");
	const [hostFilter, setHostFilter] = (0, import_react.useState)("");
	const [winAppOpen, setWinAppOpen] = (0, import_react.useState)(false);
	const [termPanes, setTermPanes] = (0, import_react.useState)([]);
	const [termSplit, setTermSplit] = (0, import_react.useState)("horizontal");
	const [sideOn, setSideOn] = (0, import_react.useState)(true);
	const [sideW, setSideW] = (0, import_react.useState)(280);
	(0, import_react.useEffect)(() => {
		watchInstallPrompt();
		(async () => {
			try {
				await Promise.resolve(useVault.persist.rehydrate());
				const desktop = desktopBridge();
				if (desktop?.readSshConfig && useVault.getState().settings.syncSshConfig !== false) {
					const disk = await desktop.readSshConfig();
					if (disk?.ok && disk.text) {
						const added = useVault.getState().importConfig(disk.text);
						if (added > 0) toast.success(`Loaded ${added} host${added === 1 ? "" : "s"} from ~/.ssh/config`);
					}
					for (const key of disk?.keys ?? []) {
						const v = useVault.getState();
						if (v.identities.some((i) => i.comment === key.path || i.name === key.name)) continue;
						v.upsertIdentity({
							id: `id-file-${key.name.replace(/[^A-Za-z0-9._-]+/g, "-")}`,
							name: key.name,
							kind: /_sk/i.test(key.name) ? "fido2" : "key",
							username: "",
							password: "",
							privateKey: "",
							publicKey: "",
							fingerprint: "",
							comment: key.path,
							algorithm: /_sk/i.test(key.name) ? "sk-ssh-ed25519@openssh.com" : key.name.includes("ed25519") ? "ed25519" : key.name.includes("ecdsa") ? "ecdsa" : "rsa",
							fido2CredentialId: "",
							createdAt: Date.now()
						});
					}
				}
			} finally {
				useVault.getState().setHydrated(true);
			}
		})();
	}, []);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "p") {
				e.preventDefault();
				setPalette(true);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	const session = vault.sessions.find((s) => s.id === vault.activeSessionId);
	const activeHost = session ? vault.hosts.find((h) => h.id === session.hostId) : void 0;
	const identity = activeHost ? vault.identities.find((i) => i.id === activeHost.identityId) : void 0;
	(0, import_react.useEffect)(() => {
		if (!vault.activeSessionId) return;
		setTermPanes((prev) => {
			if (prev.includes(vault.activeSessionId)) return prev;
			return prev.length > 1 ? [...prev.slice(0, -1), vault.activeSessionId] : [vault.activeSessionId];
		});
	}, [vault.activeSessionId]);
	const connect = (hostId, forceNew = false) => {
		const id = vault.openSession(hostId, forceNew);
		setTermPanes((prev) => {
			if (forceNew) return prev.length > 1 ? [...prev.slice(0, -1), id] : [id];
			if (prev.includes(id)) return prev;
			return prev.length > 1 ? [...prev.slice(0, -1), id] : [id];
		});
		vault.setWorkspaceMode(forceNew ? "terminal" : vault.activity === "files" ? "files" : vault.activity === "code" ? "code" : vault.activity === "tunnels" ? "tunnels" : "terminal");
		vault.setActivity("hosts");
		return id;
	};
	const closeTerm = (id) => {
		dropShell(id);
		liveSsh()?.disconnect(id);
		vault.closeSession(id);
		setTermPanes((prev) => prev.filter((x) => x !== id));
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
	const connectJump = (hostname) => {
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
		host.hostname = m[2];
		host.name = m[2];
		host.port = Number(m[3] || 22);
		host.address = m[2];
		host.identityId = null;
		vault.upsertHost(host);
		connect(host.id);
		setQuick("");
	};
	if (!vault.hydrated) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-dvh items-center justify-center bg-background text-muted-foreground",
		children: "Loading…"
	});
	if (vault.locked) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockScreen, { onUnlock: async () => {
		if (vault.fido2CredentialId) try {
			const { assertFido2 } = await import("./webauthn-DjJBIkPi.mjs");
			await assertFido2(vault.fido2CredentialId);
		} catch {
			toast.error("Touch the security key to unlock");
			return;
		}
		vault.setLocked(false);
	} });
	const side = vault.activity === "snippets" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SnippetsPanel, {}) : vault.activity === "keys" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeysPanel, {}) : vault.activity === "settings" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsPanel, { onWindowsApp: () => setWinAppOpen(true) }) : vault.activity === "tunnels" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TunnelsPanel, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HostTree, {
		filter: hostFilter,
		onFilter: setHostFilter,
		onConnect: connect,
		onEdit: (h) => {
			setEditingHost(h);
			setHostOpen(true);
		},
		onAdd: () => {
			setEditingHost(emptyHost());
			setHostOpen(true);
		}
	});
	const work = !session || !activeHost ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Welcome, {
		quick,
		setQuick,
		onQuick: quickConnect,
		onConnect: connect,
		onAdd: () => {
			setEditingHost(emptyHost());
			setHostOpen(true);
		},
		onWindowsApp: () => setWinAppOpen(true)
	}) : null;
	const dragSide = (e) => {
		e.preventDefault();
		const start = e.clientX;
		const startW = sideW;
		const move = (ev) => setSideW(Math.max(180, Math.min(460, startW + ev.clientX - start)));
		const up = () => {
			window.removeEventListener("mousemove", move);
			window.removeEventListener("mouseup", up);
		};
		window.addEventListener("mousemove", move);
		window.addEventListener("mouseup", up);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipProvider, {
		delayDuration: 200,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex h-dvh min-h-0 flex-col bg-background text-foreground",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Titlebar, {
					quick,
					onQuickChange: setQuick,
					onQuickConnect: quickConnect,
					onCommandPalette: () => setPalette(true),
					onNewHost: () => {
						setEditingHost(emptyHost());
						setHostOpen(true);
					},
					onToggleSplit: splitTerminal,
					onWindowsApp: () => setWinAppOpen(true)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-h-0 flex-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
							className: "hidden w-12 shrink-0 flex-col items-center gap-1 border-r border-border bg-sidebar py-2 md:flex",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
								label: sideOn ? "Hide hosts" : "Show hosts",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setSideOn((v) => !v),
									className: "flex size-10 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground",
									"aria-label": "Toggle host panel",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelLeft, { className: "size-4" })
								})
							}), ACTIVITIES.map((a) => {
								const Icon = a.icon;
								const on = vault.activity === a.id;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
									label: a.label,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: () => {
											vault.setActivity(a.id);
											setSideOn(true);
										},
										className: cn("relative flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-surface-2 hover:text-foreground", on && "bg-surface-2 text-foreground"),
										"aria-label": a.label,
										children: [on ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute left-0 h-5 w-px bg-foreground" }) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" })]
									})
								}, a.id);
							})]
						}),
						sideOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
							className: "relative hidden h-full min-h-0 shrink-0 flex-col border-r border-border bg-surface md:flex",
							style: { width: sideW },
							children: [side, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "absolute right-0 top-0 z-10 h-full w-1 cursor-col-resize hover:bg-foreground/30",
								onMouseDown: dragSide
							})]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
							className: "flex min-w-0 flex-1 flex-col",
							children: [vault.sessions.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex h-9 shrink-0 items-center gap-1 border-b border-border px-1",
								children: [
									vault.sessions.map((s) => {
										const h = vault.hosts.find((x) => x.id === s.hostId);
										const on = s.id === vault.activeSessionId;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											onClick: () => vault.setActiveSession(s.id),
											className: cn("inline-flex h-7 max-w-40 items-center gap-1.5 rounded-md px-2 text-xs", on ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground"),
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-1.5 rounded-full", s.connected ? "bg-ok" : "bg-muted") }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "truncate",
													children: s.title || h?.name
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													role: "button",
													className: "rounded p-0.5 hover:bg-background",
													onClick: (e) => {
														e.stopPropagation();
														closeTerm(s.id);
													},
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3" })
												})
											]
										}, s.id);
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										className: "inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-surface-2 hover:text-foreground",
										title: "New terminal on this host",
										onClick: newTerminal,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" }), "Terminal"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "ml-auto flex items-center gap-1 px-1",
										children: [
											"terminal",
											"files",
											"code",
											"tunnels"
										].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => vault.setWorkspaceMode(m),
											className: cn("hidden h-7 rounded-md px-2 text-[11px] capitalize sm:inline-flex sm:items-center", vault.workspaceMode === m ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground"),
											children: m
										}, m))
									})
								]
							}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "relative min-h-0 flex-1",
								children: !session || !activeHost ? work : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									vault.sessions.map((s) => {
										const h = vault.hosts.find((x) => x.id === s.hostId);
										if (!h) return null;
										const ident = vault.identities.find((i) => i.id === h.identityId);
										const inSplit = termPanes.length > 1 && termPanes.includes(s.id);
										const show = vault.workspaceMode === "terminal" && (inSplit || termPanes.length <= 1 && s.id === session.id);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: show && termPanes.length <= 1 ? "absolute inset-0 z-10" : "pointer-events-none invisible absolute inset-0 z-0",
											"aria-hidden": !show || termPanes.length > 1,
											children: termPanes.length <= 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TerminalView, {
												sessionId: s.id,
												host: h,
												identity: ident,
												settings: vault.settings,
												active: show,
												onJump: connectJump
											}) : null
										}, s.id);
									}),
									termPanes.length > 1 && vault.workspaceMode === "terminal" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: cn("absolute inset-0 z-10 flex", termSplit === "vertical" ? "flex-col" : "flex-row"),
										children: termPanes.map((id) => {
											const s = vault.sessions.find((x) => x.id === id);
											const h = s ? vault.hosts.find((x) => x.id === s.hostId) : void 0;
											if (!s || !h) return null;
											const ident = vault.identities.find((i) => i.id === h.identityId);
											return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "relative min-h-0 min-w-0 flex-1 border-border even:border-l even:border-t-0",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TerminalView, {
													sessionId: s.id,
													host: h,
													identity: ident,
													settings: vault.settings,
													active: true,
													onJump: connectJump
												})
											}, id);
										})
									}) : null,
									vault.sessions.map((s) => s.hostId).filter((id, i, arr) => arr.indexOf(id) === i).map((hostId) => {
										const h = vault.hosts.find((x) => x.id === hostId);
										const sess = vault.sessions.find((s) => s.hostId === hostId && s.connected) || vault.sessions.find((s) => s.hostId === hostId);
										if (!h || !sess) return null;
										const show = vault.workspaceMode === "files" && activeHost?.id === hostId;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: show ? "absolute inset-0 z-20 bg-background" : "pointer-events-none invisible absolute inset-0 z-0",
											"aria-hidden": !show,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SftpPanel, {
												sessionId: sess.id,
												host: h,
												active: show
											})
										}, `files-${hostId}`);
									}),
									vault.workspaceMode === "files" ? null : vault.workspaceMode === "code" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "absolute inset-0 z-20 bg-background",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditorPanel, { sessionId: session.id })
									}) : null,
									vault.workspaceMode === "tunnels" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "absolute inset-0 z-20 bg-background",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TunnelsPanel, {})
									}) : null
								] })
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
					className: "flex h-8 shrink-0 items-center justify-between border-t border-border px-3 text-[11px] text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex min-w-0 items-center gap-3 truncate",
						children: activeHost ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-1.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-ok" }),
									activeHost.username,
									"@",
									activeHost.hostname,
									":",
									activeHost.port
								]
							}),
							activeHost.proxyJump ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "hidden md:inline",
								children: ["via ", activeHost.proxyJump]
							}) : null,
							identity?.kind === "fido2" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-3" }), " FIDO2"]
							}) : null
						] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [vault.hosts.length, " hosts"] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden sm:inline",
							children: "UTF-8"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "tabular-nums",
							children: [vault.settings.fontSize, "px"]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "flex h-14 shrink-0 items-center justify-around border-t border-border bg-sidebar md:hidden",
					children: ACTIVITIES.filter((a) => [
						"hosts",
						"keys",
						"settings"
					].includes(a.id)).map((a) => {
						const Icon = a.icon;
						const on = vault.activity === a.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => {
								vault.setActivity(a.id);
							},
							className: cn("flex min-w-11 flex-col items-center gap-0.5 text-[10px]", on ? "text-foreground" : "text-muted-foreground"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), a.label]
						}, a.id);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandPalette, {
					open: palette,
					onOpenChange: setPalette,
					onConnect: connect,
					onWindowsApp: () => setWinAppOpen(true)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WindowsAppDialog, {
					open: winAppOpen,
					onOpenChange: setWinAppOpen
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HostDialog, {
					open: hostOpen,
					host: editingHost,
					onOpenChange: setHostOpen,
					onSave: (h) => {
						vault.upsertHost(h);
						setHostOpen(false);
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
					position: "bottom-right",
					theme: "dark"
				})
			]
		})
	});
}
function Welcome({ quick, setQuick, onQuick, onConnect, onAdd, onWindowsApp }) {
	const hosts = useVault((s) => s.hosts);
	const starred = hosts.filter((h) => h.starred);
	const desktop = desktopBridge();
	const sshHosts = hosts.filter((h) => h.groupId === "g-ssh-config");
	const pinned = starred.length ? starred : hosts.slice(0, 4);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-full overflow-auto geassline-scroll px-6 py-8 md:px-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-3xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs uppercase tracking-[0.18em] text-muted-foreground",
					children: "SSH client"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-3 text-3xl font-medium tracking-tight md:text-4xl",
					children: "Connect to a host"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground text-pretty",
					children: desktop?.liveSsh ? "Uses Windows OpenSSH on this PC. Hosts load from ~/.ssh/config. Files start a separate session when you open that tab." : "Download Geassline for Windows to open real SSH sessions. This browser view is a preview."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: quick,
							onChange: (e) => setQuick(e.target.value),
							onKeyDown: (e) => e.key === "Enter" && onQuick(),
							placeholder: "user@host[:port]",
							className: "font-mono"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: onQuick,
							className: "h-10",
							children: "Connect"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							onClick: onAdd,
							className: "h-10",
							children: "Add host"
						}),
						desktop?.offline ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "flex h-10 items-center text-xs text-muted-foreground",
							children: sshHosts.length ? `${sshHosts.length} from ~/.ssh/config` : "Reads ~/.ssh/config"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							onClick: onWindowsApp,
							className: "h-10",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), "Windows"]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xs font-medium uppercase tracking-wide text-muted-foreground",
						children: starred.length ? "Pinned" : "Hosts"
					}), pinned.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 grid gap-2 sm:grid-cols-2",
						children: pinned.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => onConnect(h.id),
							className: "rounded-lg border border-border bg-surface p-4 text-left hover:bg-surface-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex items-center justify-between",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-medium",
										children: h.name
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 font-mono text-xs text-muted-foreground",
									children: [
										h.username,
										"@",
										h.hostname
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-[11px] text-muted-foreground",
									children: formatAgo(h.lastConnectedAt)
								})
							]
						}, h.id))
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted-foreground",
						children: "No hosts yet. Add one, or open the desktop app to load ~/.ssh/config."
					})]
				})
			]
		})
	});
}
function HostTree({ filter, onFilter, onConnect, onEdit, onAdd }) {
	const hosts = useVault((s) => s.hosts);
	const groups = useVault((s) => s.groups);
	const toggleStar = useVault((s) => s.toggleStar);
	const toggleGroup = useVault((s) => s.toggleGroup);
	const removeHost = useVault((s) => s.removeHost);
	const q = filter.toLowerCase();
	const visible = q ? hosts.filter((h) => [
		h.name,
		h.hostname,
		h.username,
		...h.tags
	].join(" ").toLowerCase().includes(q)) : hosts;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 flex-col",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 border-b border-border p-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				value: filter,
				onChange: (e) => onFilter(e.target.value),
				placeholder: "Filter hosts",
				className: "h-8"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				variant: "outline",
				onClick: onAdd,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" })
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollArea, {
			className: "min-h-0 flex-1",
			children: groups.map((g) => {
				const list = visible.filter((h) => h.groupId === g.id);
				if (!list.length && q) return null;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "px-1 py-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => toggleGroup(g.id),
						className: "flex w-full items-center justify-between px-2 py-1 text-[11px] uppercase tracking-wide text-muted-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							g.name,
							" ",
							list.length
						] })
					}), g.collapsed ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: list.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "group flex items-start",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => onConnect(h.id),
								className: "min-w-0 flex-1 px-2 py-1.5 text-left hover:bg-surface-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-ok" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "truncate text-sm",
										children: h.name
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "truncate pl-3.5 font-mono text-[11px] text-muted-foreground",
									children: [
										h.username,
										"@",
										h.hostname
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "p-2 text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100",
								onClick: () => toggleStar(h.id),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: cn("size-3.5", h.starred && "fill-foreground text-foreground opacity-100") })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "p-2 text-muted-foreground hover:text-foreground",
								onClick: () => onEdit(h),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "size-3.5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "p-2 text-muted-foreground hover:text-destructive",
								onClick: () => removeHost(h.id),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
							})
						]
					}, h.id)) })]
				}, g.id);
			})
		})]
	});
}
function HostDialog({ open, host, onOpenChange, onSave }) {
	const groups = useVault((s) => s.groups);
	const identities = useVault((s) => s.identities);
	const [draft, setDraft] = (0, import_react.useState)(host);
	(0, import_react.useEffect)(() => setDraft(host), [host, open]);
	if (!draft) return null;
	const set = (k, v) => setDraft({
		...draft,
		[k]: v
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			title: "Host",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid max-h-[70vh] gap-3 overflow-auto pr-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Name",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: draft.name,
							onChange: (e) => set("name", e.target.value)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Host / IP",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: draft.hostname,
							onChange: (e) => {
								const v = e.target.value;
								setDraft({
									...draft,
									hostname: v,
									address: v
								});
							},
							className: "font-mono",
							autoComplete: "off"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Port",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								value: draft.port,
								onChange: (e) => set("port", Number(e.target.value) || 22)
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "User",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: draft.username,
								onChange: (e) => set("username", e.target.value)
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Group",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							className: "h-10 w-full rounded-md border border-border bg-input px-3 text-sm",
							value: draft.groupId,
							onChange: (e) => set("groupId", e.target.value),
							children: groups.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: g.id,
								children: g.name
							}, g.id))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Identity",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "h-10 w-full rounded-md border border-border bg-input px-3 text-sm",
							value: draft.identityId ?? "",
							onChange: (e) => set("identityId", e.target.value || null),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "None — password in terminal"
							}), identities.map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: i.id,
								children: i.name
							}, i.id))]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "ProxyJump",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: draft.proxyJump,
							onChange: (e) => set("proxyJump", e.target.value),
							placeholder: "user@jump.example.com",
							className: "font-mono"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center justify-between text-sm",
						children: ["Forward agent", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: draft.agentForward,
							onCheckedChange: (v) => set("agentForward", v)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center justify-between text-sm",
						children: ["Compression", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							checked: draft.compression,
							onCheckedChange: (v) => set("compression", v)
						})]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex justify-end gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: () => onOpenChange(false),
					children: "Cancel"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => onSave({
						...draft,
						address: draft.address || draft.hostname
					}),
					children: "Save"
				})]
			})]
		})
	});
}
function KeysPanel() {
	const identities = useVault((s) => s.identities);
	const upsert = useVault((s) => s.upsertIdentity);
	const remove = useVault((s) => s.removeIdentity);
	const setFido = useVault((s) => s.setFido2Credential);
	const fido = useVault((s) => s.fido2CredentialId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 flex-col p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-medium",
				children: "Keys"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "outline",
						onClick: async () => {
							const k = await generateEd25519();
							upsert({
								id: nid(),
								name: "ed25519",
								kind: "key",
								username: "",
								password: "",
								privateKey: k.privateKey,
								publicKey: k.publicKey,
								fingerprint: k.fingerprint,
								comment: "",
								algorithm: "ed25519",
								fido2CredentialId: "",
								createdAt: Date.now()
							});
						},
						children: "Generate"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "outline",
						onClick: async () => {
							if (!webauthnAvailable()) {
								toast.error("Security keys are not available");
								return;
							}
							try {
								const cred = await registerFido2();
								setFido(cred);
								toast.success("Security key registered");
							} catch {
								toast.error("Could not register the security key");
							}
						},
						children: "Register FIDO2"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-border px-2 text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-3.5" }),
							" Import",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "file",
								className: "hidden",
								onChange: async (e) => {
									const file = e.target.files?.[0];
									if (!file) return;
									const text = await file.text();
									if (file.name.endsWith(".ppk")) {
										const ppk = parsePpk(text);
										upsert({
											id: nid(),
											name: file.name,
											kind: "key",
											username: "",
											password: "",
											privateKey: ppk.privateKey,
											publicKey: ppk.publicKey,
											fingerprint: "",
											comment: file.name,
											algorithm: ppk.algorithm,
											fido2CredentialId: "",
											createdAt: Date.now()
										});
									} else upsert({
										id: nid(),
										name: file.name,
										kind: "key",
										username: "",
										password: "",
										privateKey: text,
										publicKey: "",
										fingerprint: "",
										comment: file.name,
										algorithm: "",
										fido2CredentialId: "",
										createdAt: Date.now()
									});
									e.target.value = "";
								}
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollArea, {
				className: "mt-3 min-h-0 flex-1",
				children: identities.map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-2 rounded-md border border-border p-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm",
							children: i.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "p-1 text-muted-foreground hover:text-destructive",
							onClick: () => remove(i.id),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-mono text-[11px] text-muted-foreground",
						children: [
							i.kind,
							" · ",
							i.algorithm || i.comment
						]
					})]
				}, i.id))
			}),
			fido ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-[11px] text-ok",
				children: "Security key registered."
			}) : null
		]
	});
}
function SnippetsPanel() {
	const snippets = useVault((s) => s.snippets);
	const upsert = useVault((s) => s.upsertSnippet);
	const remove = useVault((s) => s.removeSnippet);
	const [name, setName] = (0, import_react.useState)("Snippet");
	const [body, setBody] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 flex-col p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-medium",
				children: "Snippets"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollArea, {
				className: "mt-2 min-h-0 flex-1",
				children: snippets.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-2 rounded-md border border-border p-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm",
							children: s.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "p-1 text-muted-foreground hover:text-destructive",
							onClick: () => remove(s.id),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "mt-1 overflow-auto font-mono text-[11px] text-muted-foreground",
						children: s.body
					})]
				}, s.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				value: name,
				onChange: (e) => setName(e.target.value),
				className: "mt-2 h-8"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
				value: body,
				onChange: (e) => setBody(e.target.value),
				className: "mt-2 h-20 font-mono text-xs"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				className: "mt-2",
				onClick: () => {
					upsert({
						id: nid(),
						name,
						body,
						tags: []
					});
					setBody("");
				},
				children: "Add"
			})
		]
	});
}
function TunnelsPanel() {
	const tunnels = useVault((s) => s.tunnels);
	const hosts = useVault((s) => s.hosts);
	const sessions = useVault((s) => s.sessions);
	const activeSessionId = useVault((s) => s.activeSessionId);
	const toggle = useVault((s) => s.toggleTunnel);
	const upsert = useVault((s) => s.upsertTunnel);
	const remove = useVault((s) => s.removeTunnel);
	const [name, setName] = (0, import_react.useState)("Local forward");
	const [listen, setListen] = (0, import_react.useState)(18080);
	const [dest, setDest] = (0, import_react.useState)(80);
	const activeHostId = sessions.find((s) => s.id === activeSessionId)?.hostId ?? hosts[0]?.id ?? null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 flex-col p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-sm font-medium",
				children: "Tunnels"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-muted-foreground",
				children: "Local forwards from ~/.ssh/config start with the first terminal. New ones can be added while connected."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollArea, {
				className: "mt-3 min-h-0 flex-1",
				children: tunnels.length ? tunnels.map((t) => {
					const host = hosts.find((h) => h.id === t.hostId);
					const live = sessions.some((s) => s.hostId === t.hostId && s.connected);
					const on = t.active || live;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-2 rounded-md border border-border p-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm",
									children: t.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									tone: on ? "ok" : "muted",
									children: on ? "up" : "down"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 font-mono text-[11px] text-muted-foreground",
								children: [
									host?.name || "host",
									" · ",
									t.listenHost,
									":",
									t.listenPort,
									" → ",
									t.destHost || "127.0.0.1",
									":",
									t.destPort
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
									checked: on,
									onCheckedChange: (want) => {
										(async () => {
											if (!want) {
												if (t.active) toggle(t.id);
												return;
											}
											const ssh = liveSsh();
											const sess = sessions.find((s) => s.hostId === t.hostId && s.connected);
											if (!ssh || !sess) {
												toast.error("Connect the host first");
												return;
											}
											if (live && !t.active) {
												toggle(t.id);
												return;
											}
											if (t.kind !== "local") {
												toast.error("Only local forwards are supported");
												return;
											}
											const res = await ssh.forwardLocal(sess.id, {
												listenHost: t.listenHost,
												listenPort: t.listenPort,
												destHost: t.destHost || "127.0.0.1",
												destPort: t.destPort
											});
											if (!res.ok && !/already in use/i.test(res.error || "")) {
												toast.error(res.error);
												return;
											}
											if (!t.active) toggle(t.id);
										})();
									}
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "p-2 text-muted-foreground hover:text-destructive",
									onClick: () => remove(t.id),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
								})]
							})]
						})
					}, t.id);
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-1 text-xs text-muted-foreground",
					children: "No tunnels. LocalForward in ~/.ssh/config is imported on launch."
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, { className: "my-3" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: name,
						onChange: (e) => setName(e.target.value),
						className: "col-span-2 h-8",
						placeholder: "Name"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "number",
						value: listen,
						onChange: (e) => setListen(Number(e.target.value)),
						className: "h-8"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "number",
						value: dest,
						onChange: (e) => setDest(Number(e.target.value)),
						className: "h-8"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "sm",
				className: "mt-2",
				onClick: () => upsert({
					id: nid(),
					name,
					kind: "local",
					hostId: activeHostId,
					listenHost: "127.0.0.1",
					listenPort: listen,
					destHost: "127.0.0.1",
					destPort: dest,
					active: false,
					bytesIn: 0,
					bytesOut: 0
				}),
				children: "Add"
			})
		]
	});
}
function SettingsPanel({ onWindowsApp }) {
	const settings = useVault((s) => s.settings);
	const patch = useVault((s) => s.patchSettings);
	const resetVault = useVault((s) => s.resetVault);
	const setFido = useVault((s) => s.setFido2Credential);
	const desktop = desktopBridge();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 flex-col overflow-auto p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-sm font-medium",
			children: "Settings"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 flex flex-col gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Theme",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						className: "h-10 w-full rounded-md border border-border bg-input px-3 text-sm",
						value: settings.terminalTheme,
						onChange: (e) => patch({ terminalTheme: e.target.value }),
						children: TERMINAL_THEMES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: t.id,
							children: t.name
						}, t.id))
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Font size",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "number",
						value: settings.fontSize,
						onChange: (e) => patch({ fontSize: Number(e.target.value) || 13 })
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex items-center justify-between text-sm",
					children: ["Blink cursor", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
						checked: settings.cursorBlink,
						onCheckedChange: (v) => patch({ cursorBlink: v })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex items-center justify-between text-sm",
					children: ["Copy on select", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
						checked: settings.copyOnSelect,
						onCheckedChange: (v) => patch({ copyOnSelect: v })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] leading-relaxed text-muted-foreground",
					children: "Ctrl+C copies a selection and clears it; with no selection it interrupts. Ctrl+V pastes."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex items-center justify-between text-sm",
					children: ["Sync ~/.ssh/config", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
						checked: settings.syncSshConfig !== false,
						onCheckedChange: (v) => patch({ syncSshConfig: v })
					})]
				}),
				!desktop?.offline ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					size: "sm",
					onClick: onWindowsApp,
					children: "Download for Windows"
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					size: "sm",
					onClick: () => resetVault(),
					children: "Reset local data"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "sm",
					onClick: () => {
						setFido("");
						toast.success("Security key cleared");
					},
					children: "Clear security key"
				})
			]
		})]
	});
}
function LockScreen({ onUnlock }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-dvh flex-col items-center justify-center gap-4 bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, { className: "size-8" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Locked"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				onClick: () => void onUnlock(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "size-4" }), " Unlock"]
			})
		]
	});
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block text-xs text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mb-1.5 block",
			children: label
		}), children]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Workstation, {});
}
//#endregion
export { Home as component, routes_CUPyKT9P_exports as i, registerFido2 as n, webauthnAvailable as r, assertFido2 as t };
