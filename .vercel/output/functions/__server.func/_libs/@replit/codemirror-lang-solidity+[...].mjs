import { B as Tag, g as StreamLanguage, m as LanguageSupport } from "../@codemirror/autocomplete+[...].mjs";
//#region node_modules/@replit/codemirror-lang-solidity/dist/index.js
/**
* Wrapper around the legacy CM5 Solidity language mode
* See: https://github.com/alincode/codemirror-solidity
*/
var keywords = {
	pragma: true,
	solidity: true,
	import: true,
	as: true,
	from: true,
	contract: true,
	constructor: true,
	is: true,
	function: true,
	modifier: true,
	pure: true,
	view: true,
	payable: true,
	constant: true,
	anonymous: true,
	indexed: true,
	returns: true,
	return: true,
	event: true,
	struct: true,
	mapping: true,
	interface: true,
	using: true,
	library: true,
	storage: true,
	memory: true,
	calldata: true,
	public: true,
	private: true,
	external: true,
	internal: true,
	emit: true,
	assembly: true,
	abstract: true,
	after: true,
	catch: true,
	final: true,
	in: true,
	inline: true,
	let: true,
	match: true,
	null: true,
	of: true,
	relocatable: true,
	static: true,
	try: true,
	typeof: true,
	var: true
};
var keywordsSpecial = {
	pragma: true,
	returns: true,
	address: true,
	contract: true,
	function: true,
	struct: true
};
var keywordsEtherUnit = {
	wei: true,
	szabo: true,
	finney: true,
	ether: true
};
var keywordsTimeUnit = {
	seconds: true,
	minutes: true,
	hours: true,
	days: true,
	weeks: true
};
var keywordsBlockAndTransactionProperties = {
	block: [
		"coinbase",
		"difficulty",
		"gaslimit",
		"number",
		"timestamp"
	],
	msg: [
		"data",
		"sender",
		"sig",
		"value"
	],
	tx: ["gasprice", "origin"]
};
var keywordsMoreBlockAndTransactionProperties = {
	now: true,
	gasleft: true,
	blockhash: true
};
var keywordsErrorHandling = {
	assert: true,
	require: true,
	revert: true,
	throw: true
};
var keywordsMathematicalAndCryptographicFuctions = {
	addmod: true,
	mulmod: true,
	keccak256: true,
	sha256: true,
	ripemd160: true,
	ecrecover: true
};
var keywordsContractRelated = {
	this: true,
	selfdestruct: true,
	super: true
};
var keywordsTypeInformation = { type: true };
var keywordsContractList = {};
var keywordsControlStructures = {
	if: true,
	else: true,
	while: true,
	do: true,
	for: true,
	break: true,
	continue: true,
	switch: true,
	case: true,
	default: true
};
var keywordsValueTypes = {
	bool: true,
	byte: true,
	string: true,
	enum: true,
	address: true
};
var keywordsV0505NewReserve = {
	alias: true,
	apply: true,
	auto: true,
	copyof: true,
	define: true,
	immutable: true,
	implements: true,
	macro: true,
	mutable: true,
	override: true,
	partial: true,
	promise: true,
	reference: true,
	sealed: true,
	sizeof: true,
	supports: true,
	typedef: true,
	unchecked: true
};
var keywordsAbiEncodeDecodeFunctions = { abi: [
	"decode",
	"encodePacked",
	"encodeWithSelector",
	"encodeWithSignature",
	"encode"
] };
var keywordsMembersOfAddressType = [
	"transfer",
	"send",
	"balance",
	"call",
	"delegatecall",
	"staticcall"
];
var natSpecTags = [
	"title",
	"author",
	"notice",
	"dev",
	"param",
	"return"
];
var atoms = {
	delete: true,
	new: true,
	true: true,
	false: true
};
var isOperatorChar = /[+\-*&^%:=<>!|/~]/;
var isNegativeChar = /[-]/;
var curPunc;
function tokenBase(stream, state) {
	let ch = stream.next();
	if (ch === "\"" || ch === "'" || ch === "`") {
		state.tokenize = tokenString(ch);
		return state.tokenize(stream, state);
	}
	if (isVersion(stream, state)) return "version";
	if (ch === "." && keywordsMembersOfAddressType.some(function(item) {
		return stream.match(`${item}`);
	})) return "addressFunction";
	if (typeof ch === "string" && isNumber(ch, stream)) return "number";
	if (typeof ch === "string" && /[[\]{}(),;:.]/.test(ch)) return updateGarmmer(ch, state);
	if (ch === "/") {
		if (stream.eat("*")) {
			state.tokenize = tokenComment;
			return tokenComment(stream, state);
		}
		if (stream.match(/\/{2}/)) {
			ch = stream.next();
			while (ch) {
				if (ch === "@") {
					stream.backUp(1);
					state.grammar = "doc";
					break;
				}
				ch = stream.next();
			}
			return "doc";
		}
		if (stream.eat("/")) {
			stream.skipToEnd();
			return "comment";
		}
	}
	if (typeof ch === "string" && isNegativeChar.test(ch)) {
		const peeked = stream.peek();
		if (typeof peeked === "string" && isNumber(peeked, stream)) return "number";
		return "operator";
	}
	if (typeof ch === "string" && isOperatorChar.test(ch)) {
		stream.eatWhile(isOperatorChar);
		return "operator";
	}
	stream.eatWhile(/[\w$_\xa1-\uffff]/);
	const cur = stream.current();
	if (state.grammar === "doc") {
		if (natSpecTags.some(function(item) {
			return cur === `@${item}`;
		})) return "docReserve";
		return "doc";
	}
	if (cur === "solidity" && state.lastToken === "pragma") state.lastToken = state.lastToken + " " + cur;
	if (Object.prototype.propertyIsEnumerable.call(keywords, cur)) {
		if (cur === "case" || cur === "default") curPunc = "case";
		if (Object.prototype.propertyIsEnumerable.call(keywordsSpecial, cur)) state.lastToken = cur;
		return "keyword";
	}
	if (Object.prototype.propertyIsEnumerable.call(keywordsEtherUnit, cur)) return "etherUnit";
	if (Object.prototype.propertyIsEnumerable.call(keywordsContractRelated, cur)) return "contractRelated";
	if (Object.prototype.propertyIsEnumerable.call(keywordsControlStructures, cur) || Object.prototype.propertyIsEnumerable.call(keywordsTypeInformation, cur) || Object.prototype.propertyIsEnumerable.call(keywordsV0505NewReserve, cur)) return "keyword";
	if (Object.prototype.propertyIsEnumerable.call(keywordsValueTypes, cur) || Object.prototype.propertyIsEnumerable.call(keywordsTimeUnit, cur) || isValidInteger(cur) || isValidBytes(cur) || isValidFixed(cur)) {
		state.lastToken += "variable";
		return "keyword";
	}
	if (Object.prototype.propertyIsEnumerable.call(atoms, cur)) return "atom";
	if (Object.prototype.propertyIsEnumerable.call(keywordsErrorHandling, cur)) return "errorHandling";
	if (Object.prototype.propertyIsEnumerable.call(keywordsMathematicalAndCryptographicFuctions, cur)) return "mathematicalAndCryptographic";
	if (Object.prototype.propertyIsEnumerable.call(keywordsMoreBlockAndTransactionProperties, cur) || Object.prototype.propertyIsEnumerable.call(keywordsBlockAndTransactionProperties, cur) && keywordsBlockAndTransactionProperties[cur].some(function(item) {
		return stream.match(`.${item}`);
	})) return "variable-2";
	if (cur === "abi" && keywordsAbiEncodeDecodeFunctions[cur].some(function(item) {
		return stream.match(`.${item}`);
	})) return "abi";
	const style = updateHexLiterals(cur, stream);
	if (style != null) return style;
	if ((state.lastToken === "functionName(" || state.lastToken === "returns(") && Object.prototype.propertyIsEnumerable.call(keywordsContractList, cur)) {
		state.lastToken += "variable";
		return "variable";
	}
	if (state.lastToken === "function") {
		state.lastToken = "functionName";
		if (state.para == null) {
			state.grammar = "function";
			state.para = "";
		}
		state.para += "functionName";
		return "functionName";
	}
	if (state.lastToken === "functionName(variable") {
		state.lastToken = "functionName(";
		return "parameterValue";
	}
	if (state.lastToken === "returns(variable") {
		state.lastToken = "returns(";
		return "parameterValue";
	}
	if (state.lastToken === "address" && cur === "payable") state.lastToken = "address payable";
	if (state.lastToken === "contract" || state.lastToken === "struct") {
		keywordsContractList[cur] = true;
		state.lastToken = null;
	}
	if (state.grammar === "function") return "parameterValue";
	return "variable";
}
function tokenString(quote) {
	return function(stream, state) {
		let escaped = false;
		let next;
		let end = false;
		next = stream.next();
		while (next != null) {
			if (next === quote && !escaped) {
				end = true;
				break;
			}
			escaped = !escaped && quote !== "`" && next === "\\";
			next = stream.next();
		}
		if (end || !(escaped || quote === "`")) state.tokenize = tokenBase;
		return "string";
	};
}
function tokenComment(stream, state) {
	let maybeEnd = false;
	let ch = stream.next();
	while (ch) {
		if (ch === "/" && maybeEnd) {
			state.tokenize = tokenBase;
			break;
		}
		maybeEnd = ch === "*";
		ch = stream.next();
	}
	return "comment";
}
function isVersion(stream, state) {
	if (state.lastToken === "pragma solidity") {
		state.lastToken = null;
		return !state.startOfLine && (stream.match(/[\^{0}][0-9.]+/) || stream.match(/[>=]+?[\s]*[0-9.]+[\s]*[<]?[\s]*[0-9.]+/));
	}
}
function isNumber(ch, stream) {
	if (/[\d.]/.test(ch)) {
		if (ch === ".") stream.match(/^[0-9]+([eE][-+]?[0-9]+)?/);
		else if (ch === "0") {
			if (!stream.match(/^[xX][0-9a-fA-F]+/)) stream.match(/^0[0-7]+/);
		} else stream.match(/^[0-9]*\.?[0-9]*([eE][-+]?[0-9]+)?/);
		return true;
	}
}
function isValidInteger(token) {
	if (token.match(/^[u]?int/)) {
		if (token.indexOf("t") + 1 === token.length) return true;
		const numberPart = Number(token.substr(token.indexOf("t") + 1, token.length));
		return numberPart % 8 === 0 && numberPart <= 256;
	}
}
function isValidBytes(token) {
	if (token.match(/^bytes/)) {
		if (token.indexOf("s") + 1 === token.length) return true;
		const bytesPart = token.substr(token.indexOf("s") + 1, token.length);
		return Number(bytesPart) <= 32;
	}
}
function isValidFixed(token) {
	if (token.match(/^[u]?fixed([0-9]+x[0-9]+)?/)) {
		if (token.indexOf("d") + 1 === token.length) return true;
		const numberPart = token.substr(token.indexOf("d") + 1, token.length).split("x").map(Number);
		return numberPart[0] % 8 === 0 && numberPart[0] <= 256 && numberPart[1] <= 80;
	}
}
function updateHexLiterals(token, stream) {
	if (token.match(/^hex/) && stream.peek() === "\"") {
		let maybeEnd = false;
		let ch;
		let hexValue = "";
		let stringAfterHex = "";
		ch = stream.next();
		while (ch) {
			stringAfterHex += ch;
			if (ch === "\"" && maybeEnd) {
				hexValue = stringAfterHex.substring(1, stringAfterHex.length - 1);
				if (hexValue.match(/^[0-9a-fA-F]+$/)) return "number";
				stream.backUp(stringAfterHex.length);
				break;
			}
			maybeEnd = maybeEnd || ch === "\"";
			ch = stream.next();
		}
	}
}
function updateGarmmer(ch, state) {
	if (ch === "," && state.para === "functionName(variable") state.para = "functionName(";
	if (state.para != null && state.para.startsWith("functionName")) {
		if (ch === ")") {
			if (state.para.endsWith("(")) {
				state.para = state.para.substr(0, state.para.length - 1);
				if (state.para === "functionName") state.grammar = "";
			}
		} else if (ch === "(") state.para += ch;
	}
	if (ch === "(" && state.lastToken === "functionName") state.lastToken += ch;
	else if (ch === ")" && state.lastToken === "functionName(") state.lastToken = null;
	else if (ch === "(" && state.lastToken === "returns") state.lastToken += ch;
	else if (ch === ")" && (state.lastToken === "returns(" || state.lastToken === "returns(variable")) state.lastToken = null;
	if (ch === "(" && state.lastToken === "address") state.lastToken += ch;
	curPunc = ch;
	return null;
}
var Context = class {
	constructor(indented, column, type, align, prev) {
		this.indented = indented;
		this.column = column;
		this.type = type;
		this.align = align;
		this.prev = prev;
	}
};
function pushContext(state, col, type) {
	state.context = new Context(state.indented, col, type, null, state.context);
	return state.context;
}
function popContext(state) {
	if (!state.context.prev) return;
	const t = state.context.type;
	if (t === ")" || t === "]" || t === "}") state.indented = state.context.indented;
	return state.context = state.context.prev;
}
var parser = {
	startState(indentUnit) {
		return {
			tokenize: null,
			context: new Context(0 - indentUnit, 0, "top", false, null),
			indented: 0,
			startOfLine: true,
			grammar: null,
			lastToken: null,
			para: null
		};
	},
	token(stream, state) {
		const ctx = state.context;
		if (stream.sol()) {
			if (ctx.align == null) ctx.align = false;
			state.indented = stream.indentation();
			state.startOfLine = true;
			if (ctx.type === "case") ctx.type = "}";
			if (state.grammar === "doc") state.grammar = null;
		}
		if (stream.eatSpace()) return null;
		curPunc = null;
		const style = (state.tokenize || tokenBase)(stream, state);
		if (style === "comment") return style;
		if (ctx.align == null) ctx.align = true;
		if (curPunc === "{") pushContext(state, stream.column(), "}");
		else if (curPunc === "[") pushContext(state, stream.column(), "]");
		else if (curPunc === "(") pushContext(state, stream.column(), ")");
		else if (curPunc === "case") ctx.type = "case";
		else if (curPunc === "}" && ctx.type === "}") popContext(state);
		else if (curPunc === ctx.type) popContext(state);
		state.startOfLine = false;
		return style;
	},
	indent(state, textAfter, indentContext) {
		if (state.tokenize !== tokenBase && state.tokenize != null) return null;
		const ctx = state.context;
		const firstChar = textAfter && textAfter.charAt(0);
		if (ctx.type === "case" && /^(?:case|default)\b/.test(textAfter)) {
			state.context.type = "}";
			return ctx.indented;
		}
		const closing = firstChar === ctx.type;
		if (ctx.align) return ctx.column + (closing ? 0 : 1);
		return ctx.indented + (closing ? 0 : indentContext.unit);
	},
	electricChars: "{}):",
	closeBrackets: "()[]{}''\"\"``",
	fold: "brace",
	blockCommentStart: "/*",
	blockCommentEnd: "*/",
	lineComment: "//",
	tokenTable: {
		functionName: /*@__PURE__*/ Tag.define(),
		parameterValue: /*@__PURE__*/ Tag.define(),
		addressFunction: /*@__PURE__*/ Tag.define(),
		errorHandling: /*@__PURE__*/ Tag.define(),
		contractRelated: /*@__PURE__*/ Tag.define(),
		version: /*@__PURE__*/ Tag.define(),
		etherUnit: /*@__PURE__*/ Tag.define(),
		doc: /*@__PURE__*/ Tag.define(),
		mathematicalAndCryptographic: /*@__PURE__*/ Tag.define(),
		abi: /*@__PURE__*/ Tag.define()
	}
};
var solidity = /*@__PURE__*/ new LanguageSupport(/*@__PURE__*/ StreamLanguage.define(parser));
//#endregion
export { solidity as t };
