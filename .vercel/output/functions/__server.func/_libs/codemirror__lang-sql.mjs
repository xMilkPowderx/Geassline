import { D as foldNodeProp, H as tags, V as styleTags, a as completeFromList, d as LRLanguage, j as indentNodeProp, m as LanguageSupport, s as ifNotIn, y as continuedIndent, z as syntaxTree } from "./@codemirror/autocomplete+[...].mjs";
import { i as LRParser, r as ExternalTokenizer } from "./@codemirror/lang-cpp+[...].mjs";
//#region node_modules/@codemirror/lang-sql/dist/index.js
var whitespace = 36;
var LineComment = 1;
var BlockComment = 2;
var String$1 = 3;
var Number = 4;
var Bool = 5;
var Null = 6;
var ParenL = 7;
var ParenR = 8;
var BraceL = 9;
var BraceR = 10;
var BracketL = 11;
var BracketR = 12;
var Semi = 13;
var Dot = 14;
var Operator = 15;
var Punctuation = 16;
var SpecialVar = 17;
var Identifier = 18;
var QuotedIdentifier = 19;
var Keyword = 20;
var Type = 21;
var Bits = 22;
var Bytes = 23;
var Builtin = 24;
function isAlpha(ch) {
	return ch >= 65 && ch <= 90 || ch >= 97 && ch <= 122 || ch >= 48 && ch <= 57;
}
function isHexDigit(ch) {
	return ch >= 48 && ch <= 57 || ch >= 97 && ch <= 102 || ch >= 65 && ch <= 70;
}
function readLiteral(input, endQuote, backslashEscapes) {
	for (let escaped = false;;) {
		if (input.next < 0) return;
		if (input.next == endQuote && !escaped) {
			input.advance();
			return;
		}
		escaped = backslashEscapes && !escaped && input.next == 92;
		input.advance();
	}
}
function readDoubleDollarLiteral(input, tag) {
	scan: for (;;) {
		if (input.next < 0) return;
		if (input.next == 36) {
			input.advance();
			for (let i = 0; i < tag.length; i++) {
				if (input.next != tag.charCodeAt(i)) continue scan;
				input.advance();
			}
			if (input.next == 36) {
				input.advance();
				return;
			}
		} else input.advance();
	}
}
function readPLSQLQuotedLiteral(input, openDelim) {
	let matchingDelim = "[{<(".indexOf(String.fromCharCode(openDelim));
	let closeDelim = matchingDelim < 0 ? openDelim : "]}>)".charCodeAt(matchingDelim);
	for (;;) {
		if (input.next < 0) return;
		if (input.next == closeDelim && input.peek(1) == 39) {
			input.advance(2);
			return;
		}
		input.advance();
	}
}
function readWord(input, result) {
	for (;;) {
		if (input.next != 95 && !isAlpha(input.next)) break;
		if (result != null) result += String.fromCharCode(input.next);
		input.advance();
	}
	return result;
}
function readWordOrQuoted(input) {
	if (input.next == 39 || input.next == 34 || input.next == 96) {
		let quote = input.next;
		input.advance();
		readLiteral(input, quote, false);
	} else readWord(input);
}
function readBits(input, endQuote) {
	while (input.next == 48 || input.next == 49) input.advance();
	if (endQuote && input.next == endQuote) input.advance();
}
function readNumber(input, sawDot) {
	for (;;) {
		if (input.next == 46) {
			if (sawDot) break;
			sawDot = true;
		} else if (input.next < 48 || input.next > 57) break;
		input.advance();
	}
	if (input.next == 69 || input.next == 101) {
		input.advance();
		if (input.next == 43 || input.next == 45) input.advance();
		while (input.next >= 48 && input.next <= 57) input.advance();
	}
}
function eol(input) {
	while (!(input.next < 0 || input.next == 10)) input.advance();
}
function inString(ch, str) {
	for (let i = 0; i < str.length; i++) if (str.charCodeAt(i) == ch) return true;
	return false;
}
var Space = " 	\r\n";
function keywords(keywords, types, builtin) {
	let result = Object.create(null);
	result["true"] = result["false"] = Bool;
	result["null"] = result["unknown"] = Null;
	for (let kw of keywords.split(" ")) if (kw) result[kw] = Keyword;
	for (let tp of types.split(" ")) if (tp) result[tp] = Type;
	for (let kw of (builtin || "").split(" ")) if (kw) result[kw] = Builtin;
	return result;
}
var SQLTypes = "array binary bit boolean char character clob date decimal double float int integer interval large national nchar nclob numeric object precision real smallint time timestamp varchar varying ";
var SQLKeywords = "absolute action add after all allocate alter and any are as asc assertion at authorization before begin between both breadth by call cascade cascaded case cast catalog check close collate collation column commit condition connect connection constraint constraints constructor continue corresponding count create cross cube current current_date current_default_transform_group current_transform_group_for_type current_path current_role current_time current_timestamp current_user cursor cycle data day deallocate declare default deferrable deferred delete depth deref desc describe descriptor deterministic diagnostics disconnect distinct do domain drop dynamic each else elseif end end-exec equals escape except exception exec execute exists exit external fetch first for foreign found from free full function general get global go goto grant group grouping handle having hold hour identity if immediate in indicator initially inner inout input insert intersect into is isolation join key language last lateral leading leave left level like limit local localtime localtimestamp locator loop map match method minute modifies module month names natural nesting new next no none not of old on only open option or order ordinality out outer output overlaps pad parameter partial path prepare preserve primary prior privileges procedure public read reads recursive redo ref references referencing relative release repeat resignal restrict result return returns revoke right role rollback rollup routine row rows savepoint schema scroll search second section select session session_user set sets signal similar size some space specific specifictype sql sqlexception sqlstate sqlwarning start state static system_user table temporary then timezone_hour timezone_minute to trailing transaction translation treat trigger under undo union unique unnest until update usage user using value values view when whenever where while with without work write year zone ";
var defaults = {
	backslashEscapes: false,
	hashComments: false,
	spaceAfterDashes: false,
	slashComments: false,
	doubleQuotedStrings: false,
	doubleDollarQuotedStrings: false,
	unquotedBitLiterals: false,
	treatBitsAsBytes: false,
	charSetCasts: false,
	plsqlQuotingMechanism: false,
	operatorChars: "*+-%<>!=&|~^/",
	specialVar: "?",
	identifierQuotes: "\"",
	caseInsensitiveIdentifiers: false,
	words: /*@__PURE__*/ keywords(SQLKeywords, SQLTypes)
};
function dialect(spec, kws, types, builtin) {
	let dialect = {};
	for (let prop in defaults) dialect[prop] = (spec.hasOwnProperty(prop) ? spec : defaults)[prop];
	if (kws) dialect.words = keywords(kws, types || "", builtin);
	return dialect;
}
function tokensFor(d) {
	return new ExternalTokenizer((input) => {
		var _a;
		let { next } = input;
		input.advance();
		if (inString(next, Space)) {
			while (inString(input.next, Space)) input.advance();
			input.acceptToken(whitespace);
		} else if (next == 36 && d.doubleDollarQuotedStrings) {
			let tag = readWord(input, "");
			if (input.next == 36) {
				input.advance();
				readDoubleDollarLiteral(input, tag);
				input.acceptToken(String$1);
			}
		} else if (next == 39 || next == 34 && d.doubleQuotedStrings) {
			readLiteral(input, next, d.backslashEscapes);
			input.acceptToken(String$1);
		} else if (next == 35 && d.hashComments || next == 47 && input.next == 47 && d.slashComments) {
			eol(input);
			input.acceptToken(LineComment);
		} else if (next == 45 && input.next == 45 && (!d.spaceAfterDashes || input.peek(1) == 32)) {
			eol(input);
			input.acceptToken(LineComment);
		} else if (next == 47 && input.next == 42) {
			input.advance();
			for (let depth = 1;;) {
				let cur = input.next;
				if (input.next < 0) break;
				input.advance();
				if (cur == 42 && input.next == 47) {
					depth--;
					input.advance();
					if (!depth) break;
				} else if (cur == 47 && input.next == 42) {
					depth++;
					input.advance();
				}
			}
			input.acceptToken(BlockComment);
		} else if ((next == 101 || next == 69) && input.next == 39) {
			input.advance();
			readLiteral(input, 39, true);
			input.acceptToken(String$1);
		} else if ((next == 110 || next == 78) && input.next == 39 && d.charSetCasts) {
			input.advance();
			readLiteral(input, 39, d.backslashEscapes);
			input.acceptToken(String$1);
		} else if (next == 95 && d.charSetCasts) for (let i = 0;; i++) {
			if (input.next == 39 && i > 1) {
				input.advance();
				readLiteral(input, 39, d.backslashEscapes);
				input.acceptToken(String$1);
				break;
			}
			if (!isAlpha(input.next)) break;
			input.advance();
		}
		else if (d.plsqlQuotingMechanism && (next == 113 || next == 81) && input.next == 39 && input.peek(1) > 0 && !inString(input.peek(1), Space)) {
			let openDelim = input.peek(1);
			input.advance(2);
			readPLSQLQuotedLiteral(input, openDelim);
			input.acceptToken(String$1);
		} else if (inString(next, d.identifierQuotes)) {
			readLiteral(input, next == 91 ? 93 : next, false);
			input.acceptToken(QuotedIdentifier);
		} else if (next == 40) input.acceptToken(ParenL);
		else if (next == 41) input.acceptToken(ParenR);
		else if (next == 123) input.acceptToken(BraceL);
		else if (next == 125) input.acceptToken(BraceR);
		else if (next == 91) input.acceptToken(BracketL);
		else if (next == 93) input.acceptToken(BracketR);
		else if (next == 59) input.acceptToken(Semi);
		else if (d.unquotedBitLiterals && next == 48 && input.next == 98) {
			input.advance();
			readBits(input);
			input.acceptToken(Bits);
		} else if ((next == 98 || next == 66) && (input.next == 39 || input.next == 34)) {
			const quoteStyle = input.next;
			input.advance();
			if (d.treatBitsAsBytes) {
				readLiteral(input, quoteStyle, d.backslashEscapes);
				input.acceptToken(Bytes);
			} else {
				readBits(input, quoteStyle);
				input.acceptToken(Bits);
			}
		} else if (next == 48 && (input.next == 120 || input.next == 88) || (next == 120 || next == 88) && input.next == 39) {
			let quoted = input.next == 39;
			input.advance();
			while (isHexDigit(input.next)) input.advance();
			if (quoted && input.next == 39) input.advance();
			input.acceptToken(Number);
		} else if (next == 46 && input.next >= 48 && input.next <= 57) {
			readNumber(input, true);
			input.acceptToken(Number);
		} else if (next == 46) input.acceptToken(Dot);
		else if (next >= 48 && next <= 57) {
			readNumber(input, false);
			input.acceptToken(Number);
		} else if (inString(next, d.operatorChars)) {
			while (inString(input.next, d.operatorChars)) input.advance();
			input.acceptToken(Operator);
		} else if (inString(next, d.specialVar)) {
			if (input.next == next) input.advance();
			readWordOrQuoted(input);
			input.acceptToken(SpecialVar);
		} else if (next == 58 || next == 44) input.acceptToken(Punctuation);
		else if (isAlpha(next)) {
			let word = readWord(input, String.fromCharCode(next));
			input.acceptToken(input.next == 46 || input.peek(-word.length - 1) == 46 ? Identifier : (_a = d.words[word.toLowerCase()]) !== null && _a !== void 0 ? _a : Identifier);
		}
	});
}
var tokens = /*@__PURE__*/ tokensFor(defaults);
var parser$1 = /*@__PURE__*/ LRParser.deserialize({
	version: 14,
	states: "%vQ]QQOOO#wQRO'#DSO$OQQO'#CwO%eQQO'#CxO%lQQO'#CyO%sQQO'#CzOOQQ'#DS'#DSOOQQ'#C}'#C}O'UQRO'#C{OOQQ'#Cv'#CvOOQQ'#C|'#C|Q]QQOOQOQQOOO'`QQO'#DOO(xQRO,59cO)PQQO,59cO)UQQO'#DSOOQQ,59d,59dO)cQQO,59dOOQQ,59e,59eO)jQQO,59eOOQQ,59f,59fO)qQQO,59fOOQQ-E6{-E6{OOQQ,59b,59bOOQQ-E6z-E6zOOQQ,59j,59jOOQQ-E6|-E6|O+VQRO1G.}O+^QQO,59cOOQQ1G/O1G/OOOQQ1G/P1G/POOQQ1G/Q1G/QP+kQQO'#C}O+rQQO1G.}O)PQQO,59cO,PQQO'#Cw",
	stateData: ",[~OtOSPOSQOS~ORUOSUOTUOUUOVROXSOZTO]XO^QO_UO`UOaPObPOcPOdUOeUOfUOgUOhUO~O^]ORvXSvXTvXUvXVvXXvXZvX]vX_vX`vXavXbvXcvXdvXevXfvXgvXhvX~OsvX~P!jOa_Ob_Oc_O~ORUOSUOTUOUUOVROXSOZTO^tO_UO`UOa`Ob`Oc`OdUOeUOfUOgUOhUO~OWaO~P$ZOYcO~P$ZO[eO~P$ZORUOSUOTUOUUOVROXSOZTO^QO_UO`UOaPObPOcPOdUOeUOfUOgUOhUO~O]hOsoX~P%zOajObjOcjO~O^]ORkaSkaTkaUkaVkaXkaZka]ka_ka`kaakabkackadkaekafkagkahka~Oska~P'kO^]O~OWvXYvX[vX~P!jOWnO~P$ZOYoO~P$ZO[pO~P$ZO^]ORkiSkiTkiUkiVkiXkiZki]ki_ki`kiakibkickidkiekifkigkihki~Oski~P)xOWkaYka[ka~P'kO]hO~P$ZOWkiYki[ki~P)xOasObsOcsO~O",
	goto: "#hwPPPPPPPPPPPPPPPPPPPPPPPPPPx||||!Y!^!d!xPPP#[TYOZeUORSTWZbdfqT[OZQZORiZSWOZQbRQdSQfTZgWbdfqQ^PWk^lmrQl_Qm`RrseVORSTWZbdfq",
	nodeNames: "⚠ LineComment BlockComment String Number Bool Null ( ) { } [ ] ; . Operator Punctuation SpecialVar Identifier QuotedIdentifier Keyword Type Bits Bytes Builtin Script Statement CompositeIdentifier Parens Braces Brackets Statement",
	maxTerm: 38,
	nodeProps: [[
		"isolate",
		-4,
		1,
		2,
		3,
		19,
		""
	]],
	skippedNodes: [
		0,
		1,
		2
	],
	repeatNodeCount: 3,
	tokenData: "RORO",
	tokenizers: [0, tokens],
	topRules: { "Script": [0, 25] },
	tokenPrec: 0
});
function tokenBefore(tree) {
	let cursor = tree.cursor().moveTo(tree.from, -1);
	while (/Comment/.test(cursor.name)) cursor.moveTo(cursor.from, -1);
	return cursor.node;
}
function idName(doc, node) {
	let text = doc.sliceString(node.from, node.to);
	let quoted = /^([`'"\[])(.*)([`'"\]])$/.exec(text);
	return quoted ? quoted[2] : text;
}
function plainID(node) {
	return node && (node.name == "Identifier" || node.name == "QuotedIdentifier");
}
function pathFor(doc, id) {
	if (id.name == "CompositeIdentifier") {
		let path = [];
		for (let ch = id.firstChild; ch; ch = ch.nextSibling) if (plainID(ch)) path.push(idName(doc, ch));
		return path;
	}
	return [idName(doc, id)];
}
function parentsFor(doc, node) {
	for (let path = [];;) {
		if (!node || node.name != ".") return path;
		let name = tokenBefore(node);
		if (!plainID(name)) return path;
		path.unshift(idName(doc, name));
		node = tokenBefore(name);
	}
}
function sourceContext(state, startPos) {
	let pos = syntaxTree(state).resolveInner(startPos, -1);
	let aliases = getAliases(state.doc, pos);
	if (pos.name == "Identifier" || pos.name == "QuotedIdentifier" || pos.name == "Keyword") return {
		from: pos.from,
		quoted: pos.name == "QuotedIdentifier" ? state.doc.sliceString(pos.from, pos.from + 1) : null,
		parents: parentsFor(state.doc, tokenBefore(pos)),
		aliases
	};
	if (pos.name == ".") return {
		from: startPos,
		quoted: null,
		parents: parentsFor(state.doc, pos),
		aliases
	};
	else return {
		from: startPos,
		quoted: null,
		parents: [],
		empty: true,
		aliases
	};
}
var EndFrom = /*@__PURE__*/ new Set(/*@__PURE__*/ "where group having order union intersect except all distinct limit offset fetch for".split(" "));
function getAliases(doc, at) {
	let statement;
	for (let parent = at; !statement; parent = parent.parent) {
		if (!parent) return null;
		if (parent.name == "Statement") statement = parent;
	}
	let aliases = null;
	for (let scan = statement.firstChild, sawFrom = false, prevID = null; scan; scan = scan.nextSibling) {
		let kw = scan.name == "Keyword" ? doc.sliceString(scan.from, scan.to).toLowerCase() : null;
		let alias = null;
		if (!sawFrom) sawFrom = kw == "from";
		else if (kw == "as" && prevID && plainID(scan.nextSibling)) alias = idName(doc, scan.nextSibling);
		else if (kw && EndFrom.has(kw)) break;
		else if (prevID && plainID(scan)) alias = idName(doc, scan);
		if (alias) {
			if (!aliases) aliases = Object.create(null);
			aliases[alias] = pathFor(doc, prevID);
		}
		prevID = /Identifier$/.test(scan.name) ? scan : null;
	}
	return aliases;
}
function maybeQuoteCompletions(openingQuote, closingQuote, completions) {
	return completions.map((c) => ({
		...c,
		label: c.label[0] == openingQuote ? c.label : openingQuote + c.label + closingQuote,
		apply: void 0
	}));
}
var Span = /^\w*$/;
var QuotedSpan = /^[`'"\[]?\w*[`'"\]]?$/;
function isSelfTag(namespace) {
	return namespace.self && typeof namespace.self.label == "string";
}
var CompletionLevel = class CompletionLevel {
	constructor(idQuote, idCaseInsensitive) {
		this.idQuote = idQuote;
		this.idCaseInsensitive = idCaseInsensitive;
		this.list = [];
		this.children = void 0;
	}
	child(name) {
		let children = this.children || (this.children = Object.create(null));
		let found = children[name];
		if (found) return found;
		if (name && !this.list.some((c) => c.label == name)) this.list.push(nameCompletion(name, "type", this.idQuote, this.idCaseInsensitive));
		return children[name] = new CompletionLevel(this.idQuote, this.idCaseInsensitive);
	}
	maybeChild(name) {
		return this.children ? this.children[name] : null;
	}
	addCompletion(option) {
		let found = this.list.findIndex((o) => o.label == option.label);
		if (found > -1) this.list[found] = option;
		else this.list.push(option);
	}
	addCompletions(completions) {
		for (let option of completions) this.addCompletion(typeof option == "string" ? nameCompletion(option, "property", this.idQuote, this.idCaseInsensitive) : option);
	}
	addNamespace(namespace) {
		if (Array.isArray(namespace)) this.addCompletions(namespace);
		else if (isSelfTag(namespace)) this.addNamespace(namespace.children);
		else this.addNamespaceObject(namespace);
	}
	addNamespaceObject(namespace) {
		for (let name of Object.keys(namespace)) {
			let children = namespace[name], self = null;
			let parts = name.replace(/\\?\./g, (p) => p == "." ? "\0" : p).split("\0");
			let scope = this;
			if (isSelfTag(children)) {
				self = children.self;
				children = children.children;
			}
			for (let i = 0; i < parts.length; i++) {
				if (self && i == parts.length - 1) scope.addCompletion(self);
				scope = scope.child(parts[i].replace(/\\\./g, "."));
			}
			scope.addNamespace(children);
		}
	}
};
function nameCompletion(label, type, idQuote, idCaseInsensitive) {
	if (new RegExp("^[a-z_][a-z_\\d]*$", idCaseInsensitive ? "i" : "").test(label)) return {
		label,
		type
	};
	return {
		label,
		type,
		apply: idQuote + label + getClosingQuote(idQuote)
	};
}
function getClosingQuote(openingQuote) {
	return openingQuote === "[" ? "]" : openingQuote;
}
function completeFromSchema(schema, tables, schemas, defaultTableName, defaultSchemaName, dialect) {
	var _a;
	let top = new CompletionLevel(((_a = dialect === null || dialect === void 0 ? void 0 : dialect.spec.identifierQuotes) === null || _a === void 0 ? void 0 : _a[0]) || "\"", !!(dialect === null || dialect === void 0 ? void 0 : dialect.spec.caseInsensitiveIdentifiers));
	let defaultSchema = defaultSchemaName ? top.child(defaultSchemaName) : null;
	top.addNamespace(schema);
	if (tables) (defaultSchema || top).addCompletions(tables);
	if (schemas) top.addCompletions(schemas);
	if (defaultSchema) top.addCompletions(defaultSchema.list);
	if (defaultTableName) top.addCompletions((defaultSchema || top).child(defaultTableName).list);
	return (context) => {
		let { parents, from, quoted, empty, aliases } = sourceContext(context.state, context.pos);
		if (empty && !context.explicit) return null;
		if (aliases && parents.length == 1) parents = aliases[parents[0]] || parents;
		let level = top;
		for (let name of parents) {
			while (!level.children || !level.children[name]) if (level == top && defaultSchema) level = defaultSchema;
			else if (level == defaultSchema && defaultTableName) level = level.child(defaultTableName);
			else return null;
			let next = level.maybeChild(name);
			if (!next) return null;
			level = next;
		}
		let options = level.list;
		if (level == top && aliases) options = options.concat(Object.keys(aliases).map((name) => ({
			label: name,
			type: "constant"
		})));
		if (quoted) {
			let openingQuote = quoted[0];
			let closingQuote = getClosingQuote(openingQuote);
			return {
				from,
				to: context.state.sliceDoc(context.pos, context.pos + 1) == closingQuote ? context.pos + 1 : void 0,
				options: maybeQuoteCompletions(openingQuote, closingQuote, options),
				validFor: QuotedSpan
			};
		} else return {
			from,
			options,
			validFor: Span
		};
	};
}
function completionType(tokenType) {
	return tokenType == Type ? "type" : tokenType == Keyword ? "keyword" : "variable";
}
function completeKeywords(keywords, upperCase, build) {
	let completions = Object.keys(keywords).map((keyword) => build(upperCase ? keyword.toUpperCase() : keyword, completionType(keywords[keyword])));
	return ifNotIn([
		"QuotedIdentifier",
		"String",
		"LineComment",
		"BlockComment",
		"."
	], completeFromList(completions));
}
var parser = /*@__PURE__*/ parser$1.configure({ props: [
	/*@__PURE__*/ indentNodeProp.add({ Statement: /*@__PURE__*/ continuedIndent() }),
	/*@__PURE__*/ foldNodeProp.add({
		Statement(tree, state) {
			return {
				from: Math.min(tree.from + 100, state.doc.lineAt(tree.from).to),
				to: tree.to
			};
		},
		BlockComment(tree) {
			return {
				from: tree.from + 2,
				to: tree.to - 2
			};
		}
	}),
	/*@__PURE__*/ styleTags({
		Keyword: tags.keyword,
		Type: tags.typeName,
		Builtin: /*@__PURE__*/ tags.standard(tags.name),
		Bits: tags.number,
		Bytes: tags.string,
		Bool: tags.bool,
		Null: tags.null,
		Number: tags.number,
		String: tags.string,
		Identifier: tags.name,
		QuotedIdentifier: /*@__PURE__*/ tags.special(tags.string),
		SpecialVar: /*@__PURE__*/ tags.special(tags.name),
		LineComment: tags.lineComment,
		BlockComment: tags.blockComment,
		Operator: tags.operator,
		"Semi Punctuation": tags.punctuation,
		"( )": tags.paren,
		"{ }": tags.brace,
		"[ ]": tags.squareBracket
	})
] });
/**
Represents an SQL dialect.
*/
var SQLDialect = class SQLDialect {
	constructor(dialect, language, spec) {
		this.dialect = dialect;
		this.language = language;
		this.spec = spec;
	}
	/**
	Returns the language for this dialect as an extension.
	*/
	get extension() {
		return this.language.extension;
	}
	/**
	Reconfigure the parser used by this dialect. Returns a new
	dialect object.
	*/
	configureLanguage(options, name) {
		return new SQLDialect(this.dialect, this.language.configure(options, name), this.spec);
	}
	/**
	Define a new dialect.
	*/
	static define(spec) {
		let d = dialect(spec, spec.keywords, spec.types, spec.builtin);
		let language = LRLanguage.define({
			name: "sql",
			parser: parser.configure({ tokenizers: [{
				from: tokens,
				to: tokensFor(d)
			}] }),
			languageData: {
				commentTokens: {
					line: "--",
					block: {
						open: "/*",
						close: "*/"
					}
				},
				closeBrackets: { brackets: [
					"(",
					"[",
					"{",
					"'",
					"\"",
					"`"
				] }
			}
		});
		return new SQLDialect(d, language, spec);
	}
};
function defaultKeyword(label, type) {
	return {
		label,
		type,
		boost: -1
	};
}
/**
Returns a completion source that provides keyword completion for
the given SQL dialect.
*/
function keywordCompletionSource(dialect, upperCase = false, build) {
	return completeKeywords(dialect.dialect.words, upperCase, build || defaultKeyword);
}
/**
Returns a completion sources that provides schema-based completion
for the given configuration.
*/
function schemaCompletionSource(config) {
	return config.schema ? completeFromSchema(config.schema, config.tables, config.schemas, config.defaultTable, config.defaultSchema, config.dialect || StandardSQL) : () => null;
}
function schemaCompletion(config) {
	return config.schema ? (config.dialect || StandardSQL).language.data.of({ autocomplete: schemaCompletionSource(config) }) : [];
}
/**
SQL language support for the given SQL dialect, with keyword
completion, and, if provided, schema-based completion as extra
extensions.
*/
function sql(config = {}) {
	let lang = config.dialect || StandardSQL;
	return new LanguageSupport(lang.language, [schemaCompletion(config), lang.language.data.of({ autocomplete: keywordCompletionSource(lang, config.upperCaseKeywords, config.keywordCompletion) })]);
}
/**
The standard SQL dialect.
*/
var StandardSQL = /*@__PURE__*/ SQLDialect.define({});
SQLKeywords + "", SQLTypes + "";
var MySQLKeywords = "accessible algorithm analyze asensitive authors auto_increment autocommit avg avg_row_length binlog btree cache catalog_name chain change changed checkpoint checksum class_origin client_statistics coalesce code collations columns comment committed completion concurrent consistent contains contributors convert database databases day_hour day_microsecond day_minute day_second delay_key_write delayed delimiter des_key_file dev_pop dev_samp deviance directory disable discard distinctrow div dual dumpfile enable enclosed ends engine engines enum errors escaped even event events every explain extended fast field fields flush force found_rows fulltext grants handler hash high_priority hosts hour_microsecond hour_minute hour_second ignore ignore_server_ids import index index_statistics infile innodb insensitive insert_method install invoker iterate keys kill linear lines list load lock logs low_priority master master_heartbeat_period master_ssl_verify_server_cert masters max max_rows maxvalue message_text middleint migrate min min_rows minute_microsecond minute_second mod mode modify mutex mysql_errno no_write_to_binlog offline offset one online optimize optionally outfile pack_keys parser partition partitions password phase plugin plugins prev processlist profile profiles purge query quick range read_write rebuild recover regexp relaylog remove rename reorganize repair repeatable replace require resume rlike row_format rtree schedule schema_name schemas second_microsecond security sensitive separator serializable server share show slave slow snapshot soname spatial sql_big_result sql_buffer_result sql_cache sql_calc_found_rows sql_no_cache sql_small_result ssl starting starts std stddev stddev_pop stddev_samp storage straight_join subclass_origin sum suspend table_name table_statistics tables tablespace terminated triggers truncate uncommitted uninstall unlock upgrade use use_frm user_resources user_statistics utc_date utc_time utc_timestamp variables views warnings xa xor year_month zerofill";
SQLTypes + "";
SQLKeywords + "" + MySQLKeywords;
SQLKeywords + "" + MySQLKeywords;
SQLKeywords + "", SQLTypes + "";
SQLKeywords + "", SQLTypes + "";
/**
Dialect for [Cassandra](https://cassandra.apache.org/)'s SQL-ish query language.
*/
var Cassandra = /*@__PURE__*/ SQLDialect.define({
	keywords: "add all allow alter and any apply as asc authorize batch begin by clustering columnfamily compact consistency count create custom delete desc distinct drop each_quorum exists filtering from grant if in index insert into key keyspace keyspaces level limit local_one local_quorum modify nan norecursive nosuperuser not of on one order password permission permissions primary quorum rename revoke schema select set storage superuser table three to token truncate ttl two type unlogged update use user users using values where with writetime infinity NaN",
	types: SQLTypes + "ascii bigint blob counter frozen inet list map static text timeuuid tuple uuid varint",
	slashComments: true
});
/**
[PL/SQL](https://en.wikipedia.org/wiki/PL/SQL) dialect.
*/
var PLSQL = /*@__PURE__*/ SQLDialect.define({
	keywords: SQLKeywords + "abort accept access add all alter and any arraylen as asc assert assign at attributes audit authorization avg base_table begin between binary_integer body by case cast char_base check close cluster clusters colauth column comment commit compress connected constant constraint crash create current currval cursor data_base database dba deallocate debugoff debugon declare default definition delay delete desc digits dispose distinct do drop else elseif elsif enable end entry exception exception_init exchange exclusive exists external fast fetch file for force form from function generic goto grant group having identified if immediate in increment index indexes indicator initial initrans insert interface intersect into is key level library like limited local lock log logging loop master maxextents maxtrans member minextents minus mislabel mode modify multiset new next no noaudit nocompress nologging noparallel not nowait number_base of off offline on online only option or order out package parallel partition pctfree pctincrease pctused pls_integer positive positiven pragma primary prior private privileges procedure public raise range raw rebuild record ref references refresh rename replace resource restrict return returning returns reverse revoke rollback row rowid rowlabel rownum rows run savepoint schema segment select separate set share snapshot some space split sql start statement storage subtype successful synonym tabauth table tables tablespace task terminate then to trigger truncate type union unique unlimited unrecoverable unusable update use using validate value values variable view views when whenever where while with work",
	builtin: "appinfo arraysize autocommit autoprint autorecovery autotrace blockterminator break btitle cmdsep colsep compatibility compute concat copycommit copytypecheck define echo editfile embedded feedback flagger flush heading headsep instance linesize lno loboffset logsource longchunksize markup native newpage numformat numwidth pagesize pause pno recsep recsepchar repfooter repheader serveroutput shiftinout show showmode spool sqlblanklines sqlcase sqlcode sqlcontinue sqlnumber sqlpluscompatibility sqlprefix sqlprompt sqlterminator suffix tab term termout timing trimout trimspool ttitle underline verify version wrap",
	types: SQLTypes + "ascii bfile bfilename bigserial bit blob dec long number nvarchar nvarchar2 serial smallint string text uid varchar2 xml",
	operatorChars: "*/+-%<>!=~",
	doubleQuotedStrings: true,
	charSetCasts: true,
	plsqlQuotingMechanism: true
});
//#endregion
export { sql as i, PLSQL as n, StandardSQL as r, Cassandra as t };
