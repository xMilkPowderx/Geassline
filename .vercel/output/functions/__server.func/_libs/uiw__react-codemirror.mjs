import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "./@floating-ui/react-dom+[...].mjs";
import { n as require_jsx_runtime } from "./radix-ui__react-context+react.mjs";
import { n as require_extends, t as require_objectWithoutPropertiesLoose } from "./babel__runtime.mjs";
import { Tt as EditorState, bt as Annotation, et as EditorView, ft as keymap, kt as StateEffect, mt as placeholder } from "./@codemirror/autocomplete+[...].mjs";
import { i as indentWithTab } from "./codemirror__commands.mjs";
import { t as basicSetup } from "./@uiw/codemirror-extensions-basic-setup+[...].mjs";
import { t as oneDark } from "./codemirror__theme-one-dark.mjs";
//#region node_modules/@uiw/react-codemirror/esm/theme/light.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_extends = /* @__PURE__ */ __toESM(require_extends());
var import_objectWithoutPropertiesLoose = /* @__PURE__ */ __toESM(require_objectWithoutPropertiesLoose());
var defaultLightThemeOption = EditorView.theme({ "&": { backgroundColor: "#fff" } }, { dark: false });
//#endregion
//#region node_modules/@uiw/react-codemirror/esm/getDefaultExtensions.js
var getDefaultExtensions = function getDefaultExtensions(optios) {
	if (optios === void 0) optios = {};
	var _optios = optios, _optios$indentWithTab = _optios.indentWithTab, defaultIndentWithTab = _optios$indentWithTab === void 0 ? true : _optios$indentWithTab, _optios$editable = _optios.editable, editable = _optios$editable === void 0 ? true : _optios$editable, _optios$readOnly = _optios.readOnly, readOnly = _optios$readOnly === void 0 ? false : _optios$readOnly, _optios$theme = _optios.theme, theme = _optios$theme === void 0 ? "light" : _optios$theme, _optios$placeholder = _optios.placeholder, placeholderStr = _optios$placeholder === void 0 ? "" : _optios$placeholder, _optios$basicSetup = _optios.basicSetup, defaultBasicSetup = _optios$basicSetup === void 0 ? true : _optios$basicSetup;
	var getExtensions = [];
	if (defaultIndentWithTab) getExtensions.unshift(keymap.of([indentWithTab]));
	if (defaultBasicSetup) {
		if (typeof defaultBasicSetup === "boolean") getExtensions.unshift(basicSetup());
		else getExtensions.unshift(basicSetup(defaultBasicSetup));
	}
	if (placeholderStr) getExtensions.unshift(placeholder(placeholderStr));
	switch (theme) {
		case "light":
			getExtensions.push(defaultLightThemeOption);
			break;
		case "dark":
			getExtensions.push(oneDark);
			break;
		case "none": break;
		default: getExtensions.push(theme);
	}
	if (editable === false) getExtensions.push(EditorView.editable.of(false));
	if (readOnly) getExtensions.push(EditorState.readOnly.of(true));
	return [...getExtensions];
};
//#endregion
//#region node_modules/@uiw/react-codemirror/esm/utils.js
var getStatistics = (view) => {
	return {
		line: view.state.doc.lineAt(view.state.selection.main.from),
		lineCount: view.state.doc.lines,
		lineBreak: view.state.lineBreak,
		length: view.state.doc.length,
		readOnly: view.state.readOnly,
		tabSize: view.state.tabSize,
		selection: view.state.selection,
		selectionAsSingle: view.state.selection.asSingle().main,
		ranges: view.state.selection.ranges,
		selectionCode: view.state.sliceDoc(view.state.selection.main.from, view.state.selection.main.to),
		selections: view.state.selection.ranges.map((r) => view.state.sliceDoc(r.from, r.to)),
		selectedText: view.state.selection.ranges.some((r) => !r.empty)
	};
};
//#endregion
//#region node_modules/@uiw/react-codemirror/esm/timeoutLatch.js
var TimeoutLatch = class {
	constructor(callback, timeoutMS) {
		this.timeLeftMS = void 0;
		this.timeoutMS = void 0;
		this.isCancelled = false;
		this.isTimeExhausted = false;
		this.callbacks = [];
		this.timeLeftMS = timeoutMS;
		this.timeoutMS = timeoutMS;
		this.callbacks.push(callback);
	}
	tick() {
		if (!this.isCancelled && !this.isTimeExhausted) {
			this.timeLeftMS--;
			if (this.timeLeftMS <= 0) {
				this.isTimeExhausted = true;
				var callbacks = this.callbacks.slice();
				this.callbacks.length = 0;
				callbacks.forEach((callback) => {
					try {
						callback();
					} catch (error) {
						console.error("TimeoutLatch callback error:", error);
					}
				});
			}
		}
	}
	cancel() {
		this.isCancelled = true;
		this.callbacks.length = 0;
	}
	reset() {
		this.timeLeftMS = this.timeoutMS;
		this.isCancelled = false;
		this.isTimeExhausted = false;
	}
	get isDone() {
		return this.isCancelled || this.isTimeExhausted;
	}
};
var Scheduler = class {
	constructor() {
		this.interval = null;
		this.latches = /* @__PURE__ */ new Set();
	}
	add(latch) {
		this.latches.add(latch);
		this.start();
	}
	remove(latch) {
		this.latches.delete(latch);
		if (this.latches.size === 0) this.stop();
	}
	start() {
		if (this.interval === null) this.interval = setInterval(() => {
			this.latches.forEach((latch) => {
				latch.tick();
				if (latch.isDone) this.remove(latch);
			});
		}, 1);
	}
	stop() {
		if (this.interval !== null) {
			clearInterval(this.interval);
			this.interval = null;
		}
	}
};
var globalScheduler = null;
var getScheduler = () => {
	if (typeof window === "undefined") return new Scheduler();
	if (!globalScheduler) globalScheduler = new Scheduler();
	return globalScheduler;
};
//#endregion
//#region node_modules/@uiw/react-codemirror/esm/theme/dimensionTheme.js
var scrollerTheme = EditorView.theme({ "& .cm-scroller": { height: "100% !important" } });
var lastDimensionKey = null;
var lastDimensionTheme = null;
function getDimensionTheme(height, minHeight, maxHeight, width, minWidth, maxWidth) {
	if (!height && !minHeight && !maxHeight && !width && !minWidth && !maxWidth) return null;
	var cacheKey = JSON.stringify({
		height,
		minHeight,
		maxHeight,
		width,
		minWidth,
		maxWidth
	});
	if (cacheKey === lastDimensionKey) return lastDimensionTheme;
	lastDimensionKey = cacheKey;
	lastDimensionTheme = EditorView.theme({ "&": {
		height,
		minHeight,
		maxHeight,
		width,
		minWidth,
		maxWidth
	} });
	return lastDimensionTheme;
}
//#endregion
//#region node_modules/@uiw/react-codemirror/esm/useCodeMirror.js
var ExternalChange = Annotation.define();
var TYPING_TIMOUT = 200;
var emptyExtensions = [];
function useCodeMirror(props) {
	var value = props.value, selection = props.selection, onChange = props.onChange, onStatistics = props.onStatistics, onCreateEditor = props.onCreateEditor, onUpdate = props.onUpdate, _props$extensions = props.extensions, extensions = _props$extensions === void 0 ? emptyExtensions : _props$extensions, autoFocus = props.autoFocus, _props$theme = props.theme, theme = _props$theme === void 0 ? "light" : _props$theme, _props$height = props.height, height = _props$height === void 0 ? null : _props$height, _props$minHeight = props.minHeight, minHeight = _props$minHeight === void 0 ? null : _props$minHeight, _props$maxHeight = props.maxHeight, maxHeight = _props$maxHeight === void 0 ? null : _props$maxHeight, _props$width = props.width, width = _props$width === void 0 ? null : _props$width, _props$minWidth = props.minWidth, minWidth = _props$minWidth === void 0 ? null : _props$minWidth, _props$maxWidth = props.maxWidth, maxWidth = _props$maxWidth === void 0 ? null : _props$maxWidth, _props$placeholder = props.placeholder, placeholderStr = _props$placeholder === void 0 ? "" : _props$placeholder, _props$editable = props.editable, editable = _props$editable === void 0 ? true : _props$editable, _props$readOnly = props.readOnly, readOnly = _props$readOnly === void 0 ? false : _props$readOnly, _props$indentWithTab = props.indentWithTab, defaultIndentWithTab = _props$indentWithTab === void 0 ? true : _props$indentWithTab, _props$basicSetup = props.basicSetup, defaultBasicSetup = _props$basicSetup === void 0 ? true : _props$basicSetup, root = props.root, initialState = props.initialState;
	var _useState = (0, import_react.useState)(), container = _useState[0], setContainer = _useState[1];
	var _useState2 = (0, import_react.useState)(), view = _useState2[0], setView = _useState2[1];
	var _useState3 = (0, import_react.useState)(), state = _useState3[0], setState = _useState3[1];
	var typingLatch = (0, import_react.useState)(() => ({ current: null }))[0];
	var pendingUpdate = (0, import_react.useState)(() => ({ current: null }))[0];
	var defaultThemeOption = getDimensionTheme(height, minHeight, maxHeight, width, minWidth, maxWidth);
	var updateListener = EditorView.updateListener.of((vu) => {
		if (vu.docChanged && typeof onChange === "function" && !vu.transactions.some((tr) => tr.annotation(ExternalChange))) {
			if (typingLatch.current) typingLatch.current.reset();
			else {
				typingLatch.current = new TimeoutLatch(() => {
					if (pendingUpdate.current) {
						var forceUpdate = pendingUpdate.current;
						pendingUpdate.current = null;
						forceUpdate();
					}
					typingLatch.current = null;
				}, TYPING_TIMOUT);
				getScheduler().add(typingLatch.current);
			}
			onChange(vu.state.doc.toString(), vu);
		}
		onStatistics && onStatistics(getStatistics(vu));
	});
	var defaultExtensions = getDefaultExtensions({
		theme,
		editable,
		readOnly,
		placeholder: placeholderStr,
		indentWithTab: defaultIndentWithTab,
		basicSetup: defaultBasicSetup
	});
	var getExtensions = [
		updateListener,
		...defaultThemeOption ? [defaultThemeOption] : [],
		scrollerTheme,
		...defaultExtensions
	];
	if (onUpdate && typeof onUpdate === "function") getExtensions.push(EditorView.updateListener.of(onUpdate));
	getExtensions = getExtensions.concat(extensions);
	(0, import_react.useLayoutEffect)(() => {
		if (container && !state) {
			var config = {
				doc: value,
				selection,
				extensions: getExtensions
			};
			var stateCurrent = initialState ? EditorState.fromJSON(initialState.json, config, initialState.fields) : EditorState.create(config);
			setState(stateCurrent);
			if (!view) {
				var viewCurrent = new EditorView({
					state: stateCurrent,
					parent: container,
					root
				});
				setView(viewCurrent);
				onCreateEditor && onCreateEditor(viewCurrent, stateCurrent);
			}
		}
		return () => {
			if (view) {
				setState(void 0);
				setView(void 0);
			}
		};
	}, [container, state]);
	(0, import_react.useEffect)(() => {
		if (props.container) setContainer(props.container);
	}, [props.container]);
	(0, import_react.useEffect)(() => () => {
		if (view) {
			view.destroy();
			setView(void 0);
		}
		if (typingLatch.current) {
			typingLatch.current.cancel();
			typingLatch.current = null;
		}
	}, [view]);
	(0, import_react.useEffect)(() => {
		if (autoFocus && view) view.focus();
	}, [autoFocus, view]);
	(0, import_react.useEffect)(() => {
		if (view) view.dispatch({ effects: StateEffect.reconfigure.of(getExtensions) });
	}, [
		theme,
		extensions,
		height,
		minHeight,
		maxHeight,
		width,
		minWidth,
		maxWidth,
		placeholderStr,
		editable,
		readOnly,
		defaultIndentWithTab,
		defaultBasicSetup,
		onChange,
		onUpdate
	]);
	(0, import_react.useEffect)(() => {
		if (value === void 0) return;
		var currentValue = view ? view.state.doc.toString() : "";
		if (view && value !== currentValue) {
			var isTyping = typingLatch.current && !typingLatch.current.isDone;
			var forceUpdate = () => {
				if (view && value !== view.state.doc.toString()) view.dispatch({
					changes: {
						from: 0,
						to: view.state.doc.toString().length,
						insert: value || ""
					},
					annotations: [ExternalChange.of(true)]
				});
			};
			if (!isTyping) forceUpdate();
			else pendingUpdate.current = forceUpdate;
		}
	}, [value, view]);
	return {
		state,
		setState,
		view,
		setView,
		container,
		setContainer
	};
}
//#endregion
//#region node_modules/@uiw/react-codemirror/esm/index.js
var import_jsx_runtime = require_jsx_runtime();
var _excluded = [
	"className",
	"value",
	"selection",
	"extensions",
	"onChange",
	"onStatistics",
	"onCreateEditor",
	"onUpdate",
	"autoFocus",
	"theme",
	"height",
	"minHeight",
	"maxHeight",
	"width",
	"minWidth",
	"maxWidth",
	"basicSetup",
	"placeholder",
	"indentWithTab",
	"editable",
	"readOnly",
	"root",
	"initialState"
];
var ReactCodeMirror = /*#__PURE__*/ (0, import_react.forwardRef)((props, ref) => {
	var className = props.className, _props$value = props.value, value = _props$value === void 0 ? "" : _props$value, selection = props.selection, _props$extensions = props.extensions, extensions = _props$extensions === void 0 ? [] : _props$extensions, onChange = props.onChange, onStatistics = props.onStatistics, onCreateEditor = props.onCreateEditor, onUpdate = props.onUpdate, autoFocus = props.autoFocus, _props$theme = props.theme, theme = _props$theme === void 0 ? "light" : _props$theme, height = props.height, minHeight = props.minHeight, maxHeight = props.maxHeight, width = props.width, minWidth = props.minWidth, maxWidth = props.maxWidth, basicSetup = props.basicSetup, placeholder = props.placeholder, indentWithTab = props.indentWithTab, editable = props.editable, readOnly = props.readOnly, root = props.root, initialState = props.initialState, other = (0, import_objectWithoutPropertiesLoose.default)(props, _excluded);
	var editor = (0, import_react.useRef)(null);
	var _useCodeMirror = useCodeMirror({
		root,
		value,
		autoFocus,
		theme,
		height,
		minHeight,
		maxHeight,
		width,
		minWidth,
		maxWidth,
		basicSetup,
		placeholder,
		indentWithTab,
		editable,
		readOnly,
		selection,
		onChange,
		onStatistics,
		onCreateEditor,
		onUpdate,
		extensions,
		initialState
	}), state = _useCodeMirror.state, view = _useCodeMirror.view, container = _useCodeMirror.container, setContainer = _useCodeMirror.setContainer;
	(0, import_react.useImperativeHandle)(ref, () => ({
		editor: editor.current,
		state,
		view
	}), [
		editor,
		container,
		state,
		view
	]);
	var setEditorRef = (0, import_react.useCallback)((el) => {
		editor.current = el;
		setContainer(el);
	}, [setContainer]);
	if (typeof value !== "string") throw new Error("value must be typeof string but got " + typeof value);
	var defaultClassNames = typeof theme === "string" ? "cm-theme-" + theme : "cm-theme";
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)("div", (0, import_extends.default)({
		ref: setEditorRef,
		className: "" + defaultClassNames + (className ? " " + className : "")
	}, other));
});
ReactCodeMirror.displayName = "CodeMirror";
//#endregion
export { ReactCodeMirror as t };
