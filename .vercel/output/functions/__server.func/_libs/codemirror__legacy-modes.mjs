//#region node_modules/@codemirror/legacy-modes/mode/apl.js
var builtInFuncs = {
	"+": ["conjugate", "add"],
	"−": ["negate", "subtract"],
	"×": ["signOf", "multiply"],
	"÷": ["reciprocal", "divide"],
	"⌈": ["ceiling", "greaterOf"],
	"⌊": ["floor", "lesserOf"],
	"∣": ["absolute", "residue"],
	"⍳": ["indexGenerate", "indexOf"],
	"?": ["roll", "deal"],
	"⋆": ["exponentiate", "toThePowerOf"],
	"⍟": ["naturalLog", "logToTheBase"],
	"○": ["piTimes", "circularFuncs"],
	"!": ["factorial", "binomial"],
	"⌹": ["matrixInverse", "matrixDivide"],
	"<": [null, "lessThan"],
	"≤": [null, "lessThanOrEqual"],
	"=": [null, "equals"],
	">": [null, "greaterThan"],
	"≥": [null, "greaterThanOrEqual"],
	"≠": [null, "notEqual"],
	"≡": ["depth", "match"],
	"≢": [null, "notMatch"],
	"∈": ["enlist", "membership"],
	"⍷": [null, "find"],
	"∪": ["unique", "union"],
	"∩": [null, "intersection"],
	"∼": ["not", "without"],
	"∨": [null, "or"],
	"∧": [null, "and"],
	"⍱": [null, "nor"],
	"⍲": [null, "nand"],
	"⍴": ["shapeOf", "reshape"],
	",": ["ravel", "catenate"],
	"⍪": [null, "firstAxisCatenate"],
	"⌽": ["reverse", "rotate"],
	"⊖": ["axis1Reverse", "axis1Rotate"],
	"⍉": ["transpose", null],
	"↑": ["first", "take"],
	"↓": [null, "drop"],
	"⊂": ["enclose", "partitionWithAxis"],
	"⊃": ["diclose", "pick"],
	"⌷": [null, "index"],
	"⍋": ["gradeUp", null],
	"⍒": ["gradeDown", null],
	"⊤": ["encode", null],
	"⊥": ["decode", null],
	"⍕": ["format", "formatByExample"],
	"⍎": ["execute", null],
	"⊣": ["stop", "left"],
	"⊢": ["pass", "right"]
};
var isOperator = /[\.\/⌿⍀¨⍣]/;
var isNiladic = /⍬/;
var isFunction = /[\+−×÷⌈⌊∣⍳\?⋆⍟○!⌹<≤=>≥≠≡≢∈⍷∪∩∼∨∧⍱⍲⍴,⍪⌽⊖⍉↑↓⊂⊃⌷⍋⍒⊤⊥⍕⍎⊣⊢]/;
var isArrow = /←/;
var isComment = /[⍝#].*$/;
var stringEater = function(type) {
	var prev = false;
	return function(c) {
		prev = c;
		if (c === type) return prev === "\\";
		return true;
	};
};
var apl = {
	name: "apl",
	startState: function() {
		return {
			prev: false,
			func: false,
			op: false,
			string: false,
			escape: false
		};
	},
	token: function(stream, state) {
		var ch;
		if (stream.eatSpace()) return null;
		ch = stream.next();
		if (ch === "\"" || ch === "'") {
			stream.eatWhile(stringEater(ch));
			stream.next();
			state.prev = true;
			return "string";
		}
		if (/[\[{\(]/.test(ch)) {
			state.prev = false;
			return null;
		}
		if (/[\]}\)]/.test(ch)) {
			state.prev = true;
			return null;
		}
		if (isNiladic.test(ch)) {
			state.prev = false;
			return "atom";
		}
		if (/[¯\d]/.test(ch)) {
			if (state.func) {
				state.func = false;
				state.prev = false;
			} else state.prev = true;
			stream.eatWhile(/[\w\.]/);
			return "number";
		}
		if (isOperator.test(ch)) return "operator";
		if (isArrow.test(ch)) return "operator";
		if (isFunction.test(ch)) {
			state.func = true;
			state.prev = false;
			return builtInFuncs[ch] ? "variableName.function.standard" : "variableName.function";
		}
		if (isComment.test(ch)) {
			stream.skipToEnd();
			return "comment";
		}
		if (ch === "∘" && stream.peek() === ".") {
			stream.next();
			return "variableName.function";
		}
		stream.eatWhile(/[\w\$_]/);
		state.prev = true;
		return "keyword";
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/asciiarmor.js
function errorIfNotEmpty(stream) {
	var nonWS = stream.match(/^\s*\S/);
	stream.skipToEnd();
	return nonWS ? "error" : null;
}
var asciiArmor = {
	name: "asciiarmor",
	token: function(stream, state) {
		var m;
		if (state.state == "top") {
			if (stream.sol() && (m = stream.match(/^-----BEGIN (.*)?-----\s*$/))) {
				state.state = "headers";
				state.type = m[1];
				return "tag";
			}
			return errorIfNotEmpty(stream);
		} else if (state.state == "headers") {
			if (stream.sol() && stream.match(/^\w+:/)) {
				state.state = "header";
				return "atom";
			} else {
				var result = errorIfNotEmpty(stream);
				if (result) state.state = "body";
				return result;
			}
		} else if (state.state == "header") {
			stream.skipToEnd();
			state.state = "headers";
			return "string";
		} else if (state.state == "body") {
			if (stream.sol() && (m = stream.match(/^-----END (.*)?-----\s*$/))) {
				if (m[1] != state.type) return "error";
				state.state = "end";
				return "tag";
			} else if (stream.eatWhile(/[A-Za-z0-9+\/=]/)) return null;
			else {
				stream.next();
				return "error";
			}
		} else if (state.state == "end") return errorIfNotEmpty(stream);
	},
	blankLine: function(state) {
		if (state.state == "headers") state.state = "body";
	},
	startState: function() {
		return {
			state: "top",
			type: null
		};
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/asn1.js
function words$19(str) {
	var obj = {}, words = str.split(" ");
	for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
	return obj;
}
var defaults$1 = {
	keywords: words$19("DEFINITIONS OBJECTS IF DERIVED INFORMATION ACTION REPLY ANY NAMED CHARACTERIZED BEHAVIOUR REGISTERED WITH AS IDENTIFIED CONSTRAINED BY PRESENT BEGIN IMPORTS FROM UNITS SYNTAX MIN-ACCESS MAX-ACCESS MINACCESS MAXACCESS REVISION STATUS DESCRIPTION SEQUENCE SET COMPONENTS OF CHOICE DistinguishedName ENUMERATED SIZE MODULE END INDEX AUGMENTS EXTENSIBILITY IMPLIED EXPORTS"),
	cmipVerbs: words$19("ACTIONS ADD GET NOTIFICATIONS REPLACE REMOVE"),
	compareTypes: words$19("OPTIONAL DEFAULT MANAGED MODULE-TYPE MODULE_IDENTITY MODULE-COMPLIANCE OBJECT-TYPE OBJECT-IDENTITY OBJECT-COMPLIANCE MODE CONFIRMED CONDITIONAL SUBORDINATE SUPERIOR CLASS TRUE FALSE NULL TEXTUAL-CONVENTION"),
	status: words$19("current deprecated mandatory obsolete"),
	tags: words$19("APPLICATION AUTOMATIC EXPLICIT IMPLICIT PRIVATE TAGS UNIVERSAL"),
	storage: words$19("BOOLEAN INTEGER OBJECT IDENTIFIER BIT OCTET STRING UTCTime InterfaceIndex IANAifType CMIP-Attribute REAL PACKAGE PACKAGES IpAddress PhysAddress NetworkAddress BITS BMPString TimeStamp TimeTicks TruthValue RowStatus DisplayString GeneralString GraphicString IA5String NumericString PrintableString SnmpAdminString TeletexString UTF8String VideotexString VisibleString StringStore ISO646String T61String UniversalString Unsigned32 Integer32 Gauge Gauge32 Counter Counter32 Counter64"),
	modifier: words$19("ATTRIBUTE ATTRIBUTES MANDATORY-GROUP MANDATORY-GROUPS GROUP GROUPS ELEMENTS EQUALITY ORDERING SUBSTRINGS DEFINED"),
	accessTypes: words$19("not-accessible accessible-for-notify read-only read-create read-write"),
	multiLineStrings: true
};
function asn1(parserConfig) {
	var keywords = parserConfig.keywords || defaults$1.keywords, cmipVerbs = parserConfig.cmipVerbs || defaults$1.cmipVerbs, compareTypes = parserConfig.compareTypes || defaults$1.compareTypes, status = parserConfig.status || defaults$1.status, tags = parserConfig.tags || defaults$1.tags, storage = parserConfig.storage || defaults$1.storage, modifier = parserConfig.modifier || defaults$1.modifier, accessTypes = parserConfig.accessTypes || defaults$1.accessTypes, multiLineStrings = parserConfig.multiLineStrings || defaults$1.multiLineStrings, indentStatements = parserConfig.indentStatements !== false;
	var isOperatorChar = /[\|\^]/;
	var curPunc;
	function tokenBase(stream, state) {
		var ch = stream.next();
		if (ch == "\"" || ch == "'") {
			state.tokenize = tokenString(ch);
			return state.tokenize(stream, state);
		}
		if (/[\[\]\(\){}:=,;]/.test(ch)) {
			curPunc = ch;
			return "punctuation";
		}
		if (ch == "-") {
			if (stream.eat("-")) {
				stream.skipToEnd();
				return "comment";
			}
		}
		if (/\d/.test(ch)) {
			stream.eatWhile(/[\w\.]/);
			return "number";
		}
		if (isOperatorChar.test(ch)) {
			stream.eatWhile(isOperatorChar);
			return "operator";
		}
		stream.eatWhile(/[\w\-]/);
		var cur = stream.current();
		if (keywords.propertyIsEnumerable(cur)) return "keyword";
		if (cmipVerbs.propertyIsEnumerable(cur)) return "variableName";
		if (compareTypes.propertyIsEnumerable(cur)) return "atom";
		if (status.propertyIsEnumerable(cur)) return "comment";
		if (tags.propertyIsEnumerable(cur)) return "typeName";
		if (storage.propertyIsEnumerable(cur)) return "modifier";
		if (modifier.propertyIsEnumerable(cur)) return "modifier";
		if (accessTypes.propertyIsEnumerable(cur)) return "modifier";
		return "variableName";
	}
	function tokenString(quote) {
		return function(stream, state) {
			var escaped = false, next, end = false;
			while ((next = stream.next()) != null) {
				if (next == quote && !escaped) {
					var afterNext = stream.peek();
					if (afterNext) {
						afterNext = afterNext.toLowerCase();
						if (afterNext == "b" || afterNext == "h" || afterNext == "o") stream.next();
					}
					end = true;
					break;
				}
				escaped = !escaped && next == "\\";
			}
			if (end || !(escaped || multiLineStrings)) state.tokenize = null;
			return "string";
		};
	}
	function Context(indented, column, type, align, prev) {
		this.indented = indented;
		this.column = column;
		this.type = type;
		this.align = align;
		this.prev = prev;
	}
	function pushContext(state, col, type) {
		var indent = state.indented;
		if (state.context && state.context.type == "statement") indent = state.context.indented;
		return state.context = new Context(indent, col, type, null, state.context);
	}
	function popContext(state) {
		var t = state.context.type;
		if (t == ")" || t == "]" || t == "}") state.indented = state.context.indented;
		return state.context = state.context.prev;
	}
	return {
		name: "asn1",
		startState: function() {
			return {
				tokenize: null,
				context: new Context(-2, 0, "top", false),
				indented: 0,
				startOfLine: true
			};
		},
		token: function(stream, state) {
			var ctx = state.context;
			if (stream.sol()) {
				if (ctx.align == null) ctx.align = false;
				state.indented = stream.indentation();
				state.startOfLine = true;
			}
			if (stream.eatSpace()) return null;
			curPunc = null;
			var style = (state.tokenize || tokenBase)(stream, state);
			if (style == "comment") return style;
			if (ctx.align == null) ctx.align = true;
			if ((curPunc == ";" || curPunc == ":" || curPunc == ",") && ctx.type == "statement") popContext(state);
			else if (curPunc == "{") pushContext(state, stream.column(), "}");
			else if (curPunc == "[") pushContext(state, stream.column(), "]");
			else if (curPunc == "(") pushContext(state, stream.column(), ")");
			else if (curPunc == "}") {
				while (ctx.type == "statement") ctx = popContext(state);
				if (ctx.type == "}") ctx = popContext(state);
				while (ctx.type == "statement") ctx = popContext(state);
			} else if (curPunc == ctx.type) popContext(state);
			else if (indentStatements && ((ctx.type == "}" || ctx.type == "top") && curPunc != ";" || ctx.type == "statement" && curPunc == "newstatement")) pushContext(state, stream.column(), "statement");
			state.startOfLine = false;
			return style;
		},
		languageData: {
			indentOnInput: /^\s*[{}]$/,
			commentTokens: { line: "--" }
		}
	};
}
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/brainfuck.js
var reserve = "><+-.,[]".split("");
var brainfuck = {
	name: "brainfuck",
	startState: function() {
		return {
			commentLine: false,
			left: 0,
			right: 0,
			commentLoop: false
		};
	},
	token: function(stream, state) {
		if (stream.eatSpace()) return null;
		if (stream.sol()) state.commentLine = false;
		var ch = stream.next().toString();
		if (reserve.indexOf(ch) !== -1) {
			if (state.commentLine === true) {
				if (stream.eol()) state.commentLine = false;
				return "comment";
			}
			if (ch === "]" || ch === "[") {
				if (ch === "[") state.left++;
				else state.right++;
				return "bracket";
			} else if (ch === "+" || ch === "-") return "keyword";
			else if (ch === "<" || ch === ">") return "atom";
			else if (ch === "." || ch === ",") return "def";
		} else {
			state.commentLine = true;
			if (stream.eol()) state.commentLine = false;
			return "comment";
		}
		if (stream.eol()) state.commentLine = false;
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/cobol.js
var BUILTIN$1 = "builtin";
var COMMENT$1 = "comment";
var STRING$1 = "string";
var ATOM$1 = "atom";
var NUMBER$1 = "number";
var KEYWORD = "keyword";
var MODTAG = "header";
var COBOLLINENUM = "def";
var PERIOD = "link";
function makeKeywords$1(str) {
	var obj = {}, words = str.split(" ");
	for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
	return obj;
}
var atoms$12 = makeKeywords$1("TRUE FALSE ZEROES ZEROS ZERO SPACES SPACE LOW-VALUE LOW-VALUES ");
var keywords$34 = makeKeywords$1("ACCEPT ACCESS ACQUIRE ADD ADDRESS ADVANCING AFTER ALIAS ALL ALPHABET ALPHABETIC ALPHABETIC-LOWER ALPHABETIC-UPPER ALPHANUMERIC ALPHANUMERIC-EDITED ALSO ALTER ALTERNATE AND ANY ARE AREA AREAS ARITHMETIC ASCENDING ASSIGN AT ATTRIBUTE AUTHOR AUTO AUTO-SKIP AUTOMATIC B-AND B-EXOR B-LESS B-NOT B-OR BACKGROUND-COLOR BACKGROUND-COLOUR BEEP BEFORE BELL BINARY BIT BITS BLANK BLINK BLOCK BOOLEAN BOTTOM BY CALL CANCEL CD CF CH CHARACTER CHARACTERS CLASS CLOCK-UNITS CLOSE COBOL CODE CODE-SET COL COLLATING COLUMN COMMA COMMIT COMMITMENT COMMON COMMUNICATION COMP COMP-0 COMP-1 COMP-2 COMP-3 COMP-4 COMP-5 COMP-6 COMP-7 COMP-8 COMP-9 COMPUTATIONAL COMPUTATIONAL-0 COMPUTATIONAL-1 COMPUTATIONAL-2 COMPUTATIONAL-3 COMPUTATIONAL-4 COMPUTATIONAL-5 COMPUTATIONAL-6 COMPUTATIONAL-7 COMPUTATIONAL-8 COMPUTATIONAL-9 COMPUTE CONFIGURATION CONNECT CONSOLE CONTAINED CONTAINS CONTENT CONTINUE CONTROL CONTROL-AREA CONTROLS CONVERTING COPY CORR CORRESPONDING COUNT CRT CRT-UNDER CURRENCY CURRENT CURSOR DATA DATE DATE-COMPILED DATE-WRITTEN DAY DAY-OF-WEEK DB DB-ACCESS-CONTROL-KEY DB-DATA-NAME DB-EXCEPTION DB-FORMAT-NAME DB-RECORD-NAME DB-SET-NAME DB-STATUS DBCS DBCS-EDITED DE DEBUG-CONTENTS DEBUG-ITEM DEBUG-LINE DEBUG-NAME DEBUG-SUB-1 DEBUG-SUB-2 DEBUG-SUB-3 DEBUGGING DECIMAL-POINT DECLARATIVES DEFAULT DELETE DELIMITED DELIMITER DEPENDING DESCENDING DESCRIBED DESTINATION DETAIL DISABLE DISCONNECT DISPLAY DISPLAY-1 DISPLAY-2 DISPLAY-3 DISPLAY-4 DISPLAY-5 DISPLAY-6 DISPLAY-7 DISPLAY-8 DISPLAY-9 DIVIDE DIVISION DOWN DROP DUPLICATE DUPLICATES DYNAMIC EBCDIC EGI EJECT ELSE EMI EMPTY EMPTY-CHECK ENABLE END END. END-ACCEPT END-ACCEPT. END-ADD END-CALL END-COMPUTE END-DELETE END-DISPLAY END-DIVIDE END-EVALUATE END-IF END-INVOKE END-MULTIPLY END-OF-PAGE END-PERFORM END-READ END-RECEIVE END-RETURN END-REWRITE END-SEARCH END-START END-STRING END-SUBTRACT END-UNSTRING END-WRITE END-XML ENTER ENTRY ENVIRONMENT EOP EQUAL EQUALS ERASE ERROR ESI EVALUATE EVERY EXCEEDS EXCEPTION EXCLUSIVE EXIT EXTEND EXTERNAL EXTERNALLY-DESCRIBED-KEY FD FETCH FILE FILE-CONTROL FILE-STREAM FILES FILLER FINAL FIND FINISH FIRST FOOTING FOR FOREGROUND-COLOR FOREGROUND-COLOUR FORMAT FREE FROM FULL FUNCTION GENERATE GET GIVING GLOBAL GO GOBACK GREATER GROUP HEADING HIGH-VALUE HIGH-VALUES HIGHLIGHT I-O I-O-CONTROL ID IDENTIFICATION IF IN INDEX INDEX-1 INDEX-2 INDEX-3 INDEX-4 INDEX-5 INDEX-6 INDEX-7 INDEX-8 INDEX-9 INDEXED INDIC INDICATE INDICATOR INDICATORS INITIAL INITIALIZE INITIATE INPUT INPUT-OUTPUT INSPECT INSTALLATION INTO INVALID INVOKE IS JUST JUSTIFIED KANJI KEEP KEY LABEL LAST LD LEADING LEFT LEFT-JUSTIFY LENGTH LENGTH-CHECK LESS LIBRARY LIKE LIMIT LIMITS LINAGE LINAGE-COUNTER LINE LINE-COUNTER LINES LINKAGE LOCAL-STORAGE LOCALE LOCALLY LOCK MEMBER MEMORY MERGE MESSAGE METACLASS MODE MODIFIED MODIFY MODULES MOVE MULTIPLE MULTIPLY NATIONAL NATIVE NEGATIVE NEXT NO NO-ECHO NONE NOT NULL NULL-KEY-MAP NULL-MAP NULLS NUMBER NUMERIC NUMERIC-EDITED OBJECT OBJECT-COMPUTER OCCURS OF OFF OMITTED ON ONLY OPEN OPTIONAL OR ORDER ORGANIZATION OTHER OUTPUT OVERFLOW OWNER PACKED-DECIMAL PADDING PAGE PAGE-COUNTER PARSE PERFORM PF PH PIC PICTURE PLUS POINTER POSITION POSITIVE PREFIX PRESENT PRINTING PRIOR PROCEDURE PROCEDURE-POINTER PROCEDURES PROCEED PROCESS PROCESSING PROGRAM PROGRAM-ID PROMPT PROTECTED PURGE QUEUE QUOTE QUOTES RANDOM RD READ READY REALM RECEIVE RECONNECT RECORD RECORD-NAME RECORDS RECURSIVE REDEFINES REEL REFERENCE REFERENCE-MONITOR REFERENCES RELATION RELATIVE RELEASE REMAINDER REMOVAL RENAMES REPEATED REPLACE REPLACING REPORT REPORTING REPORTS REPOSITORY REQUIRED RERUN RESERVE RESET RETAINING RETRIEVAL RETURN RETURN-CODE RETURNING REVERSE-VIDEO REVERSED REWIND REWRITE RF RH RIGHT RIGHT-JUSTIFY ROLLBACK ROLLING ROUNDED RUN SAME SCREEN SD SEARCH SECTION SECURE SECURITY SEGMENT SEGMENT-LIMIT SELECT SEND SENTENCE SEPARATE SEQUENCE SEQUENTIAL SET SHARED SIGN SIZE SKIP1 SKIP2 SKIP3 SORT SORT-MERGE SORT-RETURN SOURCE SOURCE-COMPUTER SPACE-FILL SPECIAL-NAMES STANDARD STANDARD-1 STANDARD-2 START STARTING STATUS STOP STORE STRING SUB-QUEUE-1 SUB-QUEUE-2 SUB-QUEUE-3 SUB-SCHEMA SUBFILE SUBSTITUTE SUBTRACT SUM SUPPRESS SYMBOLIC SYNC SYNCHRONIZED SYSIN SYSOUT TABLE TALLYING TAPE TENANT TERMINAL TERMINATE TEST TEXT THAN THEN THROUGH THRU TIME TIMES TITLE TO TOP TRAILING TRAILING-SIGN TRANSACTION TYPE TYPEDEF UNDERLINE UNEQUAL UNIT UNSTRING UNTIL UP UPDATE UPON USAGE USAGE-MODE USE USING VALID VALIDATE VALUE VALUES VARYING VLR WAIT WHEN WHEN-COMPILED WITH WITHIN WORDS WORKING-STORAGE WRITE XML XML-CODE XML-EVENT XML-NTEXT XML-TEXT ZERO ZERO-FILL ");
var builtins$8 = makeKeywords$1("- * ** / + < <= = > >= ");
var tests = {
	digit: /\d/,
	digit_or_colon: /[\d:]/,
	hex: /[0-9a-f]/i,
	sign: /[+-]/,
	exponent: /e/i,
	keyword_char: /[^\s\(\[\;\)\]]/,
	symbol: /[\w*+\-]/
};
function isNumber(ch, stream) {
	if (ch === "0" && stream.eat(/x/i)) {
		stream.eatWhile(tests.hex);
		return true;
	}
	if ((ch == "+" || ch == "-") && tests.digit.test(stream.peek())) {
		stream.eat(tests.sign);
		ch = stream.next();
	}
	if (tests.digit.test(ch)) {
		stream.eat(ch);
		stream.eatWhile(tests.digit);
		if ("." == stream.peek()) {
			stream.eat(".");
			stream.eatWhile(tests.digit);
		}
		if (stream.eat(tests.exponent)) {
			stream.eat(tests.sign);
			stream.eatWhile(tests.digit);
		}
		return true;
	}
	return false;
}
var cobol = {
	name: "cobol",
	startState: function() {
		return {
			indentStack: null,
			indentation: 0,
			mode: false
		};
	},
	token: function(stream, state) {
		if (state.indentStack == null && stream.sol()) state.indentation = 6;
		if (stream.eatSpace()) return null;
		var returnType = null;
		switch (state.mode) {
			case "string":
				var next = false;
				while ((next = stream.next()) != null) if ((next == "\"" || next == "'") && !stream.match(/['"]/, false)) {
					state.mode = false;
					break;
				}
				returnType = STRING$1;
				break;
			default:
				var ch = stream.next();
				var col = stream.column();
				if (col >= 0 && col <= 5) returnType = COBOLLINENUM;
				else if (col >= 72 && col <= 79) {
					stream.skipToEnd();
					returnType = MODTAG;
				} else if (ch == "*" && col == 6) {
					stream.skipToEnd();
					returnType = COMMENT$1;
				} else if (ch == "\"" || ch == "'") {
					state.mode = "string";
					returnType = STRING$1;
				} else if (ch == "'" && !tests.digit_or_colon.test(stream.peek())) returnType = ATOM$1;
				else if (ch == ".") returnType = PERIOD;
				else if (isNumber(ch, stream)) returnType = NUMBER$1;
				else {
					if (stream.current().match(tests.symbol)) while (col < 71) if (stream.eat(tests.symbol) === void 0) break;
					else col++;
					if (keywords$34 && keywords$34.propertyIsEnumerable(stream.current().toUpperCase())) returnType = KEYWORD;
					else if (builtins$8 && builtins$8.propertyIsEnumerable(stream.current().toUpperCase())) returnType = BUILTIN$1;
					else if (atoms$12 && atoms$12.propertyIsEnumerable(stream.current().toUpperCase())) returnType = ATOM$1;
					else returnType = null;
				}
		}
		return returnType;
	},
	indent: function(state) {
		if (state.indentStack == null) return state.indentation;
		return state.indentStack.indent;
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/clike.js
function Context$9(indented, column, type, info, align, prev) {
	this.indented = indented;
	this.column = column;
	this.type = type;
	this.info = info;
	this.align = align;
	this.prev = prev;
}
function pushContext$12(state, col, type, info) {
	var indent = state.indented;
	if (state.context && state.context.type == "statement" && type != "statement") indent = state.context.indented;
	return state.context = new Context$9(indent, col, type, info, null, state.context);
}
function popContext$12(state) {
	var t = state.context.type;
	if (t == ")" || t == "]" || t == "}") state.indented = state.context.indented;
	return state.context = state.context.prev;
}
function typeBefore(stream, state, pos) {
	if (state.prevToken == "variable" || state.prevToken == "type") return true;
	if (/\S(?:[^- ]>|[*\]])\s*$|\*$/.test(stream.string.slice(0, pos))) return true;
	if (state.typeAtEndOfLine && stream.column() == stream.indentation()) return true;
}
function isTopScope(context) {
	for (;;) {
		if (!context || context.type == "top") return true;
		if (context.type == "}" && context.prev.info != "namespace") return false;
		context = context.prev;
	}
}
function clike(parserConfig) {
	var statementIndentUnit = parserConfig.statementIndentUnit, dontAlignCalls = parserConfig.dontAlignCalls, keywords = parserConfig.keywords || {}, types = parserConfig.types || {}, builtin = parserConfig.builtin || {}, blockKeywords = parserConfig.blockKeywords || {}, defKeywords = parserConfig.defKeywords || {}, atoms = parserConfig.atoms || {}, hooks = parserConfig.hooks || {}, multiLineStrings = parserConfig.multiLineStrings, indentStatements = parserConfig.indentStatements !== false, indentSwitch = parserConfig.indentSwitch !== false, namespaceSeparator = parserConfig.namespaceSeparator, isPunctuationChar = parserConfig.isPunctuationChar || /[\[\]{}\(\),;\:\.]/, numberStart = parserConfig.numberStart || /[\d\.]/, number = parserConfig.number || /^(?:0x[a-f\d]+|0b[01]+|(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)(u|ll?|l|f)?/i, isOperatorChar = parserConfig.isOperatorChar || /[+\-*&%=<>!?|\/]/, isIdentifierChar = parserConfig.isIdentifierChar || /[\w\$_\xa1-\uffff]/, isReservedIdentifier = parserConfig.isReservedIdentifier || false;
	var curPunc, isDefKeyword;
	function tokenBase(stream, state) {
		var ch = stream.next();
		if (hooks[ch]) {
			var result = hooks[ch](stream, state);
			if (result !== false) return result;
		}
		if (ch == "\"" || ch == "'") {
			state.tokenize = tokenString(ch);
			return state.tokenize(stream, state);
		}
		if (numberStart.test(ch)) {
			stream.backUp(1);
			if (stream.match(number)) return "number";
			stream.next();
		}
		if (isPunctuationChar.test(ch)) {
			curPunc = ch;
			return null;
		}
		if (ch == "/") {
			if (stream.eat("*")) {
				state.tokenize = tokenComment;
				return tokenComment(stream, state);
			}
			if (stream.eat("/")) {
				stream.skipToEnd();
				return "comment";
			}
		}
		if (isOperatorChar.test(ch)) {
			while (!stream.match(/^\/[\/*]/, false) && stream.eat(isOperatorChar));
			return "operator";
		}
		stream.eatWhile(isIdentifierChar);
		if (namespaceSeparator) while (stream.match(namespaceSeparator)) stream.eatWhile(isIdentifierChar);
		var cur = stream.current();
		if (contains(keywords, cur)) {
			if (contains(blockKeywords, cur)) curPunc = "newstatement";
			if (contains(defKeywords, cur)) isDefKeyword = true;
			return "keyword";
		}
		if (contains(types, cur)) return "type";
		if (contains(builtin, cur) || isReservedIdentifier && isReservedIdentifier(cur)) {
			if (contains(blockKeywords, cur)) curPunc = "newstatement";
			return "builtin";
		}
		if (contains(atoms, cur)) return "atom";
		return "variable";
	}
	function tokenString(quote) {
		return function(stream, state) {
			var escaped = false, next, end = false;
			while ((next = stream.next()) != null) {
				if (next == quote && !escaped) {
					end = true;
					break;
				}
				escaped = !escaped && next == "\\";
			}
			if (end || !(escaped || multiLineStrings)) state.tokenize = null;
			return "string";
		};
	}
	function tokenComment(stream, state) {
		var maybeEnd = false, ch;
		while (ch = stream.next()) {
			if (ch == "/" && maybeEnd) {
				state.tokenize = null;
				break;
			}
			maybeEnd = ch == "*";
		}
		return "comment";
	}
	function maybeEOL(stream, state) {
		if (parserConfig.typeFirstDefinitions && stream.eol() && isTopScope(state.context)) state.typeAtEndOfLine = typeBefore(stream, state, stream.pos);
	}
	return {
		name: parserConfig.name,
		startState: function(indentUnit) {
			return {
				tokenize: null,
				context: new Context$9(-indentUnit, 0, "top", null, false),
				indented: 0,
				startOfLine: true,
				prevToken: null
			};
		},
		token: function(stream, state) {
			var ctx = state.context;
			if (stream.sol()) {
				if (ctx.align == null) ctx.align = false;
				state.indented = stream.indentation();
				state.startOfLine = true;
			}
			if (stream.eatSpace()) {
				maybeEOL(stream, state);
				return null;
			}
			curPunc = isDefKeyword = null;
			var style = (state.tokenize || tokenBase)(stream, state);
			if (style == "comment" || style == "meta") return style;
			if (ctx.align == null) ctx.align = true;
			if (curPunc == ";" || curPunc == ":" || curPunc == "," && stream.match(/^\s*(?:\/\/.*)?$/, false)) while (state.context.type == "statement") popContext$12(state);
			else if (curPunc == "{") pushContext$12(state, stream.column(), "}");
			else if (curPunc == "[") pushContext$12(state, stream.column(), "]");
			else if (curPunc == "(") pushContext$12(state, stream.column(), ")");
			else if (curPunc == "}") {
				while (ctx.type == "statement") ctx = popContext$12(state);
				if (ctx.type == "}") ctx = popContext$12(state);
				while (ctx.type == "statement") ctx = popContext$12(state);
			} else if (curPunc == ctx.type) popContext$12(state);
			else if (indentStatements && ((ctx.type == "}" || ctx.type == "top") && curPunc != ";" || ctx.type == "statement" && curPunc == "newstatement")) pushContext$12(state, stream.column(), "statement", stream.current());
			if (style == "variable" && (state.prevToken == "def" || parserConfig.typeFirstDefinitions && typeBefore(stream, state, stream.start) && isTopScope(state.context) && stream.match(/^\s*\(/, false))) style = "def";
			if (hooks.token) {
				var result = hooks.token(stream, state, style);
				if (result !== void 0) style = result;
			}
			if (style == "def" && parserConfig.styleDefs === false) style = "variable";
			state.startOfLine = false;
			state.prevToken = isDefKeyword ? "def" : style || curPunc;
			maybeEOL(stream, state);
			return style;
		},
		indent: function(state, textAfter, context) {
			if (state.tokenize != tokenBase && state.tokenize != null || state.typeAtEndOfLine && isTopScope(state.context)) return null;
			var ctx = state.context, firstChar = textAfter && textAfter.charAt(0);
			var closing = firstChar == ctx.type;
			if (ctx.type == "statement" && firstChar == "}") ctx = ctx.prev;
			if (parserConfig.dontIndentStatements) while (ctx.type == "statement" && parserConfig.dontIndentStatements.test(ctx.info)) ctx = ctx.prev;
			if (hooks.indent) {
				var hook = hooks.indent(state, ctx, textAfter, context.unit);
				if (typeof hook == "number") return hook;
			}
			var switchBlock = ctx.prev && ctx.prev.info == "switch";
			if (parserConfig.allmanIndentation && /[{(]/.test(firstChar)) {
				while (ctx.type != "top" && ctx.type != "}") ctx = ctx.prev;
				return ctx.indented;
			}
			if (ctx.type == "statement") return ctx.indented + (firstChar == "{" ? 0 : statementIndentUnit || context.unit);
			if (ctx.align && (!dontAlignCalls || ctx.type != ")")) return ctx.column + (closing ? 0 : 1);
			if (ctx.type == ")" && !closing) return ctx.indented + (statementIndentUnit || context.unit);
			return ctx.indented + (closing ? 0 : context.unit) + (!closing && switchBlock && !/^(?:case|default)\b/.test(textAfter) ? context.unit : 0);
		},
		languageData: {
			indentOnInput: indentSwitch ? /^\s*(?:case .*?:|default:|\{\}?|\})$/ : /^\s*[{}]$/,
			commentTokens: {
				line: "//",
				block: {
					open: "/*",
					close: "*/"
				}
			},
			autocomplete: Object.keys(keywords).concat(Object.keys(types)).concat(Object.keys(builtin)).concat(Object.keys(atoms)),
			...parserConfig.languageData
		}
	};
}
function words$18(str) {
	var obj = {}, words = str.split(" ");
	for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
	return obj;
}
function contains(words, word) {
	if (typeof words === "function") return words(word);
	else return words.propertyIsEnumerable(word);
}
var cKeywords = "auto if break case register continue return default do sizeof static else struct switch extern typedef union for goto while enum const volatile inline restrict asm fortran";
var cppKeywords = "alignas alignof and and_eq audit axiom bitand bitor catch class compl concept constexpr const_cast decltype delete dynamic_cast explicit export final friend import module mutable namespace new noexcept not not_eq operator or or_eq override private protected public reinterpret_cast requires static_assert static_cast template this thread_local throw try typeid typename using virtual xor xor_eq";
var objCKeywords = "bycopy byref in inout oneway out self super atomic nonatomic retain copy readwrite readonly strong weak assign typeof nullable nonnull null_resettable _cmd @interface @implementation @end @protocol @encode @property @synthesize @dynamic @class @public @package @private @protected @required @optional @try @catch @finally @import @selector @encode @defs @synchronized @autoreleasepool @compatibility_alias @available";
var objCBuiltins = "FOUNDATION_EXPORT FOUNDATION_EXTERN NS_INLINE NS_FORMAT_FUNCTION  NS_RETURNS_RETAINEDNS_ERROR_ENUM NS_RETURNS_NOT_RETAINED NS_RETURNS_INNER_POINTER NS_DESIGNATED_INITIALIZER NS_ENUM NS_OPTIONS NS_REQUIRES_NIL_TERMINATION NS_ASSUME_NONNULL_BEGIN NS_ASSUME_NONNULL_END NS_SWIFT_NAME NS_REFINED_FOR_SWIFT";
var basicCTypes = words$18("int long char short double float unsigned signed void bool");
var basicObjCTypes = words$18("SEL instancetype id Class Protocol BOOL");
function cTypes(identifier) {
	return contains(basicCTypes, identifier) || /.+_t$/.test(identifier);
}
function objCTypes(identifier) {
	return cTypes(identifier) || contains(basicObjCTypes, identifier);
}
var cBlockKeywords = "case do else for if switch while struct enum union";
var cDefKeywords = "struct enum union";
function cppHook(stream, state) {
	if (!state.startOfLine) return false;
	for (var ch, next = null; ch = stream.peek();) {
		if (ch == "\\" && stream.match(/^.$/)) {
			next = cppHook;
			break;
		} else if (ch == "/" && stream.match(/^\/[\/\*]/, false)) break;
		stream.next();
	}
	state.tokenize = next;
	return "meta";
}
function pointerHook(_stream, state) {
	if (state.prevToken == "type") return "type";
	return false;
}
function cIsReservedIdentifier(token) {
	if (!token || token.length < 2) return false;
	if (token[0] != "_") return false;
	return token[1] == "_" || token[1] !== token[1].toLowerCase();
}
function cpp14Literal(stream) {
	stream.eatWhile(/[\w\.']/);
	return "number";
}
function cpp11StringHook(stream, state) {
	stream.backUp(1);
	if (stream.match(/^(?:R|u8R|uR|UR|LR)/)) {
		var match = stream.match(/^"([^\s\\()]{0,16})\(/);
		if (!match) return false;
		state.cpp11RawStringDelim = match[1];
		state.tokenize = tokenRawString;
		return tokenRawString(stream, state);
	}
	if (stream.match(/^(?:u8|u|U|L)/)) {
		if (stream.match(/^["']/, false)) return "string";
		return false;
	}
	stream.next();
	return false;
}
function cppLooksLikeConstructor(word) {
	var lastTwo = /(\w+)::~?(\w+)$/.exec(word);
	return lastTwo && lastTwo[1] == lastTwo[2];
}
function tokenAtString(stream, state) {
	var next;
	while ((next = stream.next()) != null) if (next == "\"" && !stream.eat("\"")) {
		state.tokenize = null;
		break;
	}
	return "string";
}
function tokenRawString(stream, state) {
	var delim = state.cpp11RawStringDelim.replace(/[^\w\s]/g, "\\$&");
	if (stream.match(new RegExp(".*?\\)" + delim + "\""))) state.tokenize = null;
	else stream.skipToEnd();
	return "string";
}
clike({
	name: "c",
	keywords: words$18(cKeywords),
	types: cTypes,
	blockKeywords: words$18(cBlockKeywords),
	defKeywords: words$18(cDefKeywords),
	typeFirstDefinitions: true,
	atoms: words$18("NULL true false"),
	isReservedIdentifier: cIsReservedIdentifier,
	hooks: {
		"#": cppHook,
		"*": pointerHook
	}
});
clike({
	name: "cpp",
	keywords: words$18(cKeywords + " " + cppKeywords),
	types: cTypes,
	blockKeywords: words$18(cBlockKeywords + " class try catch"),
	defKeywords: words$18(cDefKeywords + " class namespace"),
	typeFirstDefinitions: true,
	atoms: words$18("true false NULL nullptr"),
	dontIndentStatements: /^template$/,
	isIdentifierChar: /[\w\$_~\xa1-\uffff]/,
	isReservedIdentifier: cIsReservedIdentifier,
	hooks: {
		"#": cppHook,
		"*": pointerHook,
		"u": cpp11StringHook,
		"U": cpp11StringHook,
		"L": cpp11StringHook,
		"R": cpp11StringHook,
		"0": cpp14Literal,
		"1": cpp14Literal,
		"2": cpp14Literal,
		"3": cpp14Literal,
		"4": cpp14Literal,
		"5": cpp14Literal,
		"6": cpp14Literal,
		"7": cpp14Literal,
		"8": cpp14Literal,
		"9": cpp14Literal,
		token: function(stream, state, style) {
			if (style == "variable" && stream.peek() == "(" && (state.prevToken == ";" || state.prevToken == null || state.prevToken == "}") && cppLooksLikeConstructor(stream.current())) return "def";
		}
	},
	namespaceSeparator: "::"
});
clike({
	name: "java",
	keywords: words$18("abstract assert break case catch class const continue default do else enum extends final finally for goto if implements import instanceof interface native new package private protected public return static strictfp super switch synchronized this throw throws transient try volatile while @interface"),
	types: words$18("var byte short int long float double boolean char void Boolean Byte Character Double Float Integer Long Number Object Short String StringBuffer StringBuilder Void"),
	blockKeywords: words$18("catch class do else finally for if switch try while"),
	defKeywords: words$18("class interface enum @interface"),
	typeFirstDefinitions: true,
	atoms: words$18("true false null"),
	number: /^(?:0x[a-f\d_]+|0b[01_]+|(?:[\d_]+\.?\d*|\.\d+)(?:e[-+]?[\d_]+)?)(u|ll?|l|f)?/i,
	hooks: {
		"@": function(stream) {
			if (stream.match("interface", false)) return false;
			stream.eatWhile(/[\w\$_]/);
			return "meta";
		},
		"\"": function(stream, state) {
			if (!stream.match(/""$/)) return false;
			state.tokenize = tokenTripleString;
			return state.tokenize(stream, state);
		}
	}
});
var csharp = clike({
	name: "csharp",
	keywords: words$18("abstract as async await base break case catch checked class const continue default delegate do else enum event explicit extern finally fixed for foreach goto if implicit in init interface internal is lock namespace new operator out override params private protected public readonly record ref required return sealed sizeof stackalloc static struct switch this throw try typeof unchecked unsafe using virtual void volatile while add alias ascending descending dynamic from get global group into join let orderby partial remove select set value var yield"),
	types: words$18("Action Boolean Byte Char DateTime DateTimeOffset Decimal Double Func Guid Int16 Int32 Int64 Object SByte Single String Task TimeSpan UInt16 UInt32 UInt64 bool byte char decimal double short int long object sbyte float string ushort uint ulong"),
	blockKeywords: words$18("catch class do else finally for foreach if struct switch try while"),
	defKeywords: words$18("class interface namespace record struct var"),
	typeFirstDefinitions: true,
	atoms: words$18("true false null"),
	hooks: { "@": function(stream, state) {
		if (stream.eat("\"")) {
			state.tokenize = tokenAtString;
			return tokenAtString(stream, state);
		}
		stream.eatWhile(/[\w\$_]/);
		return "meta";
	} }
});
function tokenTripleString(stream, state) {
	var escaped = false;
	while (!stream.eol()) {
		if (!escaped && stream.match("\"\"\"")) {
			state.tokenize = null;
			break;
		}
		escaped = stream.next() == "\\" && !escaped;
	}
	return "string";
}
function tokenNestedComment$1(depth) {
	return function(stream, state) {
		var ch;
		while (ch = stream.next()) if (ch == "*" && stream.eat("/")) {
			if (depth == 1) {
				state.tokenize = null;
				break;
			} else {
				state.tokenize = tokenNestedComment$1(depth - 1);
				return state.tokenize(stream, state);
			}
		} else if (ch == "/" && stream.eat("*")) {
			state.tokenize = tokenNestedComment$1(depth + 1);
			return state.tokenize(stream, state);
		}
		return "comment";
	};
}
var scala = clike({
	name: "scala",
	keywords: words$18("abstract case catch class def do else extends final finally for forSome if implicit import lazy match new null object override package private protected return sealed super this throw trait try type val var while with yield _ assert assume require print println printf readLine readBoolean readByte readShort readChar readInt readLong readFloat readDouble"),
	types: words$18("AnyVal App Application Array BufferedIterator BigDecimal BigInt Char Console Either Enumeration Equiv Error Exception Fractional Function IndexedSeq Int Integral Iterable Iterator List Map Numeric Nil NotNull Option Ordered Ordering PartialFunction PartialOrdering Product Proxy Range Responder Seq Serializable Set Specializable Stream StringBuilder StringContext Symbol Throwable Traversable TraversableOnce Tuple Unit Vector Boolean Byte Character CharSequence Class ClassLoader Cloneable Comparable Compiler Double Exception Float Integer Long Math Number Object Package Pair Process Runtime Runnable SecurityManager Short StackTraceElement StrictMath String StringBuffer System Thread ThreadGroup ThreadLocal Throwable Triple Void"),
	multiLineStrings: true,
	blockKeywords: words$18("catch class enum do else finally for forSome if match switch try while"),
	defKeywords: words$18("class enum def object package trait type val var"),
	atoms: words$18("true false null"),
	indentStatements: false,
	indentSwitch: false,
	isOperatorChar: /[+\-*&%=<>!?|\/#:@]/,
	hooks: {
		"@": function(stream) {
			stream.eatWhile(/[\w\$_]/);
			return "meta";
		},
		"\"": function(stream, state) {
			if (!stream.match("\"\"")) return false;
			state.tokenize = tokenTripleString;
			return state.tokenize(stream, state);
		},
		"'": function(stream) {
			if (stream.match(/^(\\[^'\s]+|[^\\'])'/)) return "character";
			stream.eatWhile(/[\w\$_\xa1-\uffff]/);
			return "atom";
		},
		"=": function(stream, state) {
			var cx = state.context;
			if (cx.type == "}" && cx.align && stream.eat(">")) {
				state.context = new Context$9(cx.indented, cx.column, cx.type, cx.info, null, cx.prev);
				return "operator";
			} else return false;
		},
		"/": function(stream, state) {
			if (!stream.eat("*")) return false;
			state.tokenize = tokenNestedComment$1(1);
			return state.tokenize(stream, state);
		}
	},
	languageData: { closeBrackets: { brackets: [
		"(",
		"[",
		"{",
		"'",
		"\"",
		"\"\"\""
	] } }
});
function tokenKotlinString(tripleString) {
	return function(stream, state) {
		var escaped = false, next, end = false;
		while (!stream.eol()) {
			if (!tripleString && !escaped && stream.match("\"")) {
				end = true;
				break;
			}
			if (tripleString && stream.match("\"\"\"")) {
				end = true;
				break;
			}
			next = stream.next();
			if (!escaped && next == "$" && stream.match("{")) stream.skipTo("}");
			escaped = !escaped && next == "\\" && !tripleString;
		}
		if (end || !tripleString) state.tokenize = null;
		return "string";
	};
}
var kotlin = clike({
	name: "kotlin",
	keywords: words$18("package as typealias class interface this super val operator var fun for is in This throw return annotation break continue object if else while do try when !in !is as? file import where by get set abstract enum open inner override private public internal protected catch finally out final vararg reified dynamic companion constructor init sealed field property receiver param sparam lateinit data inline noinline tailrec external annotation crossinline const operator infix suspend actual expect setparam"),
	types: words$18("Boolean Byte Character CharSequence Class ClassLoader Cloneable Comparable Compiler Double Exception Float Integer Long Math Number Object Package Pair Process Runtime Runnable SecurityManager Short StackTraceElement StrictMath String StringBuffer System Thread ThreadGroup ThreadLocal Throwable Triple Void Annotation Any BooleanArray ByteArray Char CharArray DeprecationLevel DoubleArray Enum FloatArray Function Int IntArray Lazy LazyThreadSafetyMode LongArray Nothing ShortArray Unit"),
	intendSwitch: false,
	indentStatements: false,
	multiLineStrings: true,
	number: /^(?:0x[a-f\d_]+|0b[01_]+|(?:[\d_]+(\.\d+)?|\.\d+)(?:e[-+]?[\d_]+)?)(ul?|l|f)?/i,
	blockKeywords: words$18("catch class do else finally for if where try while enum"),
	defKeywords: words$18("class val var object interface fun"),
	atoms: words$18("true false null this"),
	hooks: {
		"@": function(stream) {
			stream.eatWhile(/[\w\$_]/);
			return "meta";
		},
		"*": function(_stream, state) {
			return state.prevToken == "." ? "variable" : "operator";
		},
		"\"": function(stream, state) {
			state.tokenize = tokenKotlinString(stream.match("\"\""));
			return state.tokenize(stream, state);
		},
		"/": function(stream, state) {
			if (!stream.eat("*")) return false;
			state.tokenize = tokenNestedComment$1(1);
			return state.tokenize(stream, state);
		},
		indent: function(state, ctx, textAfter, indentUnit) {
			var firstChar = textAfter && textAfter.charAt(0);
			if ((state.prevToken == "}" || state.prevToken == ")") && textAfter == "") return state.indented;
			if (state.prevToken == "operator" && textAfter != "}" && state.context.type != "}" || state.prevToken == "variable" && firstChar == "." || (state.prevToken == "}" || state.prevToken == ")") && firstChar == ".") return indentUnit * 2 + ctx.indented;
			if (ctx.align && ctx.type == "}") return ctx.indented + (state.context.type == (textAfter || "").charAt(0) ? 0 : indentUnit);
		}
	},
	languageData: { closeBrackets: { brackets: [
		"(",
		"[",
		"{",
		"'",
		"\"",
		"\"\"\""
	] } }
});
clike({
	name: "shader",
	keywords: words$18("sampler1D sampler2D sampler3D samplerCube sampler1DShadow sampler2DShadow const attribute uniform varying break continue discard return for while do if else struct in out inout"),
	types: words$18("float int bool void vec2 vec3 vec4 ivec2 ivec3 ivec4 bvec2 bvec3 bvec4 mat2 mat3 mat4"),
	blockKeywords: words$18("for while do if else struct"),
	builtin: words$18("radians degrees sin cos tan asin acos atan pow exp log exp2 sqrt inversesqrt abs sign floor ceil fract mod min max clamp mix step smoothstep length distance dot cross normalize ftransform faceforward reflect refract matrixCompMult lessThan lessThanEqual greaterThan greaterThanEqual equal notEqual any all not texture1D texture1DProj texture1DLod texture1DProjLod texture2D texture2DProj texture2DLod texture2DProjLod texture3D texture3DProj texture3DLod texture3DProjLod textureCube textureCubeLod shadow1D shadow2D shadow1DProj shadow2DProj shadow1DLod shadow2DLod shadow1DProjLod shadow2DProjLod dFdx dFdy fwidth noise1 noise2 noise3 noise4"),
	atoms: words$18("true false gl_FragColor gl_SecondaryColor gl_Normal gl_Vertex gl_MultiTexCoord0 gl_MultiTexCoord1 gl_MultiTexCoord2 gl_MultiTexCoord3 gl_MultiTexCoord4 gl_MultiTexCoord5 gl_MultiTexCoord6 gl_MultiTexCoord7 gl_FogCoord gl_PointCoord gl_Position gl_PointSize gl_ClipVertex gl_FrontColor gl_BackColor gl_FrontSecondaryColor gl_BackSecondaryColor gl_TexCoord gl_FogFragCoord gl_FragCoord gl_FrontFacing gl_FragData gl_FragDepth gl_ModelViewMatrix gl_ProjectionMatrix gl_ModelViewProjectionMatrix gl_TextureMatrix gl_NormalMatrix gl_ModelViewMatrixInverse gl_ProjectionMatrixInverse gl_ModelViewProjectionMatrixInverse gl_TextureMatrixTranspose gl_ModelViewMatrixInverseTranspose gl_ProjectionMatrixInverseTranspose gl_ModelViewProjectionMatrixInverseTranspose gl_TextureMatrixInverseTranspose gl_NormalScale gl_DepthRange gl_ClipPlane gl_Point gl_FrontMaterial gl_BackMaterial gl_LightSource gl_LightModel gl_FrontLightModelProduct gl_BackLightModelProduct gl_TextureColor gl_EyePlaneS gl_EyePlaneT gl_EyePlaneR gl_EyePlaneQ gl_FogParameters gl_MaxLights gl_MaxClipPlanes gl_MaxTextureUnits gl_MaxTextureCoords gl_MaxVertexAttribs gl_MaxVertexUniformComponents gl_MaxVaryingFloats gl_MaxVertexTextureImageUnits gl_MaxTextureImageUnits gl_MaxFragmentUniformComponents gl_MaxCombineTextureImageUnits gl_MaxDrawBuffers"),
	indentSwitch: false,
	hooks: { "#": cppHook }
});
clike({
	name: "nesc",
	keywords: words$18(cKeywords + " as atomic async call command component components configuration event generic implementation includes interface module new norace nx_struct nx_union post provides signal task uses abstract extends"),
	types: cTypes,
	blockKeywords: words$18(cBlockKeywords),
	atoms: words$18("null true false"),
	hooks: { "#": cppHook }
});
clike({
	name: "objectivec",
	keywords: words$18(cKeywords + " " + objCKeywords),
	types: objCTypes,
	builtin: words$18(objCBuiltins),
	blockKeywords: words$18(cBlockKeywords + " @synthesize @try @catch @finally @autoreleasepool @synchronized"),
	defKeywords: words$18(cDefKeywords + " @interface @implementation @protocol @class"),
	dontIndentStatements: /^@.*$/,
	typeFirstDefinitions: true,
	atoms: words$18("YES NO NULL Nil nil true false nullptr"),
	isReservedIdentifier: cIsReservedIdentifier,
	hooks: {
		"#": cppHook,
		"*": pointerHook
	}
});
var objectiveCpp = clike({
	name: "objectivecpp",
	keywords: words$18(cKeywords + " " + objCKeywords + " " + cppKeywords),
	types: objCTypes,
	builtin: words$18(objCBuiltins),
	blockKeywords: words$18(cBlockKeywords + " @synthesize @try @catch @finally @autoreleasepool @synchronized class try catch"),
	defKeywords: words$18(cDefKeywords + " @interface @implementation @protocol @class class namespace"),
	dontIndentStatements: /^@.*$|^template$/,
	typeFirstDefinitions: true,
	atoms: words$18("YES NO NULL Nil nil true false nullptr"),
	isReservedIdentifier: cIsReservedIdentifier,
	hooks: {
		"#": cppHook,
		"*": pointerHook,
		"u": cpp11StringHook,
		"U": cpp11StringHook,
		"L": cpp11StringHook,
		"R": cpp11StringHook,
		"0": cpp14Literal,
		"1": cpp14Literal,
		"2": cpp14Literal,
		"3": cpp14Literal,
		"4": cpp14Literal,
		"5": cpp14Literal,
		"6": cpp14Literal,
		"7": cpp14Literal,
		"8": cpp14Literal,
		"9": cpp14Literal,
		token: function(stream, state, style) {
			if (style == "variable" && stream.peek() == "(" && (state.prevToken == ";" || state.prevToken == null || state.prevToken == "}") && cppLooksLikeConstructor(stream.current())) return "def";
		}
	},
	namespaceSeparator: "::"
});
var squirrel = clike({
	name: "squirrel",
	keywords: words$18("base break clone continue const default delete enum extends function in class foreach local resume return this throw typeof yield constructor instanceof static"),
	types: cTypes,
	blockKeywords: words$18("case catch class else for foreach if switch try while"),
	defKeywords: words$18("function local class"),
	typeFirstDefinitions: true,
	atoms: words$18("true false null"),
	hooks: { "#": cppHook }
});
var stringTokenizer = null;
function tokenCeylonString(type) {
	return function(stream, state) {
		var escaped = false, next, end = false;
		while (!stream.eol()) {
			if (!escaped && stream.match("\"") && (type == "single" || stream.match("\"\""))) {
				end = true;
				break;
			}
			if (!escaped && stream.match("``")) {
				stringTokenizer = tokenCeylonString(type);
				end = true;
				break;
			}
			next = stream.next();
			escaped = type == "single" && !escaped && next == "\\";
		}
		if (end) state.tokenize = null;
		return "string";
	};
}
clike({
	name: "ceylon",
	keywords: words$18("abstracts alias assembly assert assign break case catch class continue dynamic else exists extends finally for function given if import in interface is let module new nonempty object of out outer package return satisfies super switch then this throw try value void while"),
	types: function(word) {
		var first = word.charAt(0);
		return first === first.toUpperCase() && first !== first.toLowerCase();
	},
	blockKeywords: words$18("case catch class dynamic else finally for function if interface module new object switch try while"),
	defKeywords: words$18("class dynamic function interface module object package value"),
	builtin: words$18("abstract actual aliased annotation by default deprecated doc final formal late license native optional sealed see serializable shared suppressWarnings tagged throws variable"),
	isPunctuationChar: /[\[\]{}\(\),;\:\.`]/,
	isOperatorChar: /[+\-*&%=<>!?|^~:\/]/,
	numberStart: /[\d#$]/,
	number: /^(?:#[\da-fA-F_]+|\$[01_]+|[\d_]+[kMGTPmunpf]?|[\d_]+\.[\d_]+(?:[eE][-+]?\d+|[kMGTPmunpf]|)|)/i,
	multiLineStrings: true,
	typeFirstDefinitions: true,
	atoms: words$18("true false null larger smaller equal empty finished"),
	indentSwitch: false,
	styleDefs: false,
	hooks: {
		"@": function(stream) {
			stream.eatWhile(/[\w\$_]/);
			return "meta";
		},
		"\"": function(stream, state) {
			state.tokenize = tokenCeylonString(stream.match("\"\"") ? "triple" : "single");
			return state.tokenize(stream, state);
		},
		"`": function(stream, state) {
			if (!stringTokenizer || !stream.match("`")) return false;
			state.tokenize = stringTokenizer;
			stringTokenizer = null;
			return state.tokenize(stream, state);
		},
		"'": function(stream) {
			if (stream.match(/^(\\[^'\s]+|[^\\'])'/)) return "string.special";
			stream.eatWhile(/[\w\$_\xa1-\uffff]/);
			return "atom";
		},
		token: function(_stream, state, style) {
			if ((style == "variable" || style == "type") && state.prevToken == ".") return "variableName.special";
		}
	},
	languageData: { closeBrackets: { brackets: [
		"(",
		"[",
		"{",
		"'",
		"\"",
		"\"\"\""
	] } }
});
function pushInterpolationStack(state) {
	(state.interpolationStack || (state.interpolationStack = [])).push(state.tokenize);
}
function popInterpolationStack(state) {
	return (state.interpolationStack || (state.interpolationStack = [])).pop();
}
function sizeInterpolationStack(state) {
	return state.interpolationStack ? state.interpolationStack.length : 0;
}
function tokenDartString(quote, stream, state, raw) {
	var tripleQuoted = false;
	if (stream.eat(quote)) {
		if (stream.eat(quote)) tripleQuoted = true;
		else return "string";
	}
	function tokenStringHelper(stream, state) {
		var escaped = false;
		while (!stream.eol()) {
			if (!raw && !escaped && stream.peek() == "$") {
				pushInterpolationStack(state);
				state.tokenize = tokenInterpolation$1;
				return "string";
			}
			var next = stream.next();
			if (next == quote && !escaped && (!tripleQuoted || stream.match(quote + quote))) {
				state.tokenize = null;
				break;
			}
			escaped = !raw && !escaped && next == "\\";
		}
		return "string";
	}
	state.tokenize = tokenStringHelper;
	return tokenStringHelper(stream, state);
}
function tokenInterpolation$1(stream, state) {
	stream.eat("$");
	if (stream.eat("{")) state.tokenize = null;
	else state.tokenize = tokenInterpolationIdentifier;
	return null;
}
function tokenInterpolationIdentifier(stream, state) {
	stream.eatWhile(/[\w_]/);
	state.tokenize = popInterpolationStack(state);
	return "variable";
}
var dart = clike({
	name: "dart",
	keywords: words$18("this super static final const abstract class extends external factory implements mixin get native set typedef with enum throw rethrow assert break case continue default in return new deferred async await covariant try catch finally do else for if switch while import library export part of show hide is as extension on yield late required sealed base interface when inline"),
	blockKeywords: words$18("try catch finally do else for if switch while"),
	builtin: words$18("void bool num int double dynamic var String Null Never"),
	atoms: words$18("true false null"),
	number: /^(?:0x[a-f\d_]+|(?:[\d_]+\.?[\d_]*|\.[\d_]+)(?:e[-+]?[\d_]+)?)/i,
	hooks: {
		"@": function(stream) {
			stream.eatWhile(/[\w\$_\.]/);
			return "meta";
		},
		"'": function(stream, state) {
			return tokenDartString("'", stream, state, false);
		},
		"\"": function(stream, state) {
			return tokenDartString("\"", stream, state, false);
		},
		"r": function(stream, state) {
			var peek = stream.peek();
			if (peek == "'" || peek == "\"") return tokenDartString(stream.next(), stream, state, true);
			return false;
		},
		"}": function(_stream, state) {
			if (sizeInterpolationStack(state) > 0) {
				state.tokenize = popInterpolationStack(state);
				return null;
			}
			return false;
		},
		"/": function(stream, state) {
			if (!stream.eat("*")) return false;
			state.tokenize = tokenNestedComment$1(1);
			return state.tokenize(stream, state);
		},
		token: function(stream, _, style) {
			if (style == "variable") {
				if (RegExp("^[_$]*[A-Z][a-zA-Z0-9_$]*$", "g").test(stream.current())) return "type";
			}
		}
	}
});
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/clojure.js
var atoms$11 = [
	"false",
	"nil",
	"true"
];
var specialForms = [
	".",
	"catch",
	"def",
	"do",
	"if",
	"monitor-enter",
	"monitor-exit",
	"new",
	"quote",
	"recur",
	"set!",
	"throw",
	"try",
	"var"
];
var coreSymbols = [
	"*",
	"*'",
	"*1",
	"*2",
	"*3",
	"*agent*",
	"*allow-unresolved-vars*",
	"*assert*",
	"*clojure-version*",
	"*command-line-args*",
	"*compile-files*",
	"*compile-path*",
	"*compiler-options*",
	"*data-readers*",
	"*default-data-reader-fn*",
	"*e",
	"*err*",
	"*file*",
	"*flush-on-newline*",
	"*fn-loader*",
	"*in*",
	"*math-context*",
	"*ns*",
	"*out*",
	"*print-dup*",
	"*print-length*",
	"*print-level*",
	"*print-meta*",
	"*print-namespace-maps*",
	"*print-readably*",
	"*read-eval*",
	"*reader-resolver*",
	"*source-path*",
	"*suppress-read*",
	"*unchecked-math*",
	"*use-context-classloader*",
	"*verbose-defrecords*",
	"*warn-on-reflection*",
	"+",
	"+'",
	"-",
	"-'",
	"->",
	"->>",
	"->ArrayChunk",
	"->Eduction",
	"->Vec",
	"->VecNode",
	"->VecSeq",
	"-cache-protocol-fn",
	"-reset-methods",
	"..",
	"/",
	"<",
	"<=",
	"=",
	"==",
	">",
	">=",
	"EMPTY-NODE",
	"Inst",
	"StackTraceElement->vec",
	"Throwable->map",
	"accessor",
	"aclone",
	"add-classpath",
	"add-watch",
	"agent",
	"agent-error",
	"agent-errors",
	"aget",
	"alength",
	"alias",
	"all-ns",
	"alter",
	"alter-meta!",
	"alter-var-root",
	"amap",
	"ancestors",
	"and",
	"any?",
	"apply",
	"areduce",
	"array-map",
	"as->",
	"aset",
	"aset-boolean",
	"aset-byte",
	"aset-char",
	"aset-double",
	"aset-float",
	"aset-int",
	"aset-long",
	"aset-short",
	"assert",
	"assoc",
	"assoc!",
	"assoc-in",
	"associative?",
	"atom",
	"await",
	"await-for",
	"await1",
	"bases",
	"bean",
	"bigdec",
	"bigint",
	"biginteger",
	"binding",
	"bit-and",
	"bit-and-not",
	"bit-clear",
	"bit-flip",
	"bit-not",
	"bit-or",
	"bit-set",
	"bit-shift-left",
	"bit-shift-right",
	"bit-test",
	"bit-xor",
	"boolean",
	"boolean-array",
	"boolean?",
	"booleans",
	"bound-fn",
	"bound-fn*",
	"bound?",
	"bounded-count",
	"butlast",
	"byte",
	"byte-array",
	"bytes",
	"bytes?",
	"case",
	"cast",
	"cat",
	"char",
	"char-array",
	"char-escape-string",
	"char-name-string",
	"char?",
	"chars",
	"chunk",
	"chunk-append",
	"chunk-buffer",
	"chunk-cons",
	"chunk-first",
	"chunk-next",
	"chunk-rest",
	"chunked-seq?",
	"class",
	"class?",
	"clear-agent-errors",
	"clojure-version",
	"coll?",
	"comment",
	"commute",
	"comp",
	"comparator",
	"compare",
	"compare-and-set!",
	"compile",
	"complement",
	"completing",
	"concat",
	"cond",
	"cond->",
	"cond->>",
	"condp",
	"conj",
	"conj!",
	"cons",
	"constantly",
	"construct-proxy",
	"contains?",
	"count",
	"counted?",
	"create-ns",
	"create-struct",
	"cycle",
	"dec",
	"dec'",
	"decimal?",
	"declare",
	"dedupe",
	"default-data-readers",
	"definline",
	"definterface",
	"defmacro",
	"defmethod",
	"defmulti",
	"defn",
	"defn-",
	"defonce",
	"defprotocol",
	"defrecord",
	"defstruct",
	"deftype",
	"delay",
	"delay?",
	"deliver",
	"denominator",
	"deref",
	"derive",
	"descendants",
	"destructure",
	"disj",
	"disj!",
	"dissoc",
	"dissoc!",
	"distinct",
	"distinct?",
	"doall",
	"dorun",
	"doseq",
	"dosync",
	"dotimes",
	"doto",
	"double",
	"double-array",
	"double?",
	"doubles",
	"drop",
	"drop-last",
	"drop-while",
	"eduction",
	"empty",
	"empty?",
	"ensure",
	"ensure-reduced",
	"enumeration-seq",
	"error-handler",
	"error-mode",
	"eval",
	"even?",
	"every-pred",
	"every?",
	"ex-data",
	"ex-info",
	"extend",
	"extend-protocol",
	"extend-type",
	"extenders",
	"extends?",
	"false?",
	"ffirst",
	"file-seq",
	"filter",
	"filterv",
	"find",
	"find-keyword",
	"find-ns",
	"find-protocol-impl",
	"find-protocol-method",
	"find-var",
	"first",
	"flatten",
	"float",
	"float-array",
	"float?",
	"floats",
	"flush",
	"fn",
	"fn?",
	"fnext",
	"fnil",
	"for",
	"force",
	"format",
	"frequencies",
	"future",
	"future-call",
	"future-cancel",
	"future-cancelled?",
	"future-done?",
	"future?",
	"gen-class",
	"gen-interface",
	"gensym",
	"get",
	"get-in",
	"get-method",
	"get-proxy-class",
	"get-thread-bindings",
	"get-validator",
	"group-by",
	"halt-when",
	"hash",
	"hash-combine",
	"hash-map",
	"hash-ordered-coll",
	"hash-set",
	"hash-unordered-coll",
	"ident?",
	"identical?",
	"identity",
	"if-let",
	"if-not",
	"if-some",
	"ifn?",
	"import",
	"in-ns",
	"inc",
	"inc'",
	"indexed?",
	"init-proxy",
	"inst-ms",
	"inst-ms*",
	"inst?",
	"instance?",
	"int",
	"int-array",
	"int?",
	"integer?",
	"interleave",
	"intern",
	"interpose",
	"into",
	"into-array",
	"ints",
	"io!",
	"isa?",
	"iterate",
	"iterator-seq",
	"juxt",
	"keep",
	"keep-indexed",
	"key",
	"keys",
	"keyword",
	"keyword?",
	"last",
	"lazy-cat",
	"lazy-seq",
	"let",
	"letfn",
	"line-seq",
	"list",
	"list*",
	"list?",
	"load",
	"load-file",
	"load-reader",
	"load-string",
	"loaded-libs",
	"locking",
	"long",
	"long-array",
	"longs",
	"loop",
	"macroexpand",
	"macroexpand-1",
	"make-array",
	"make-hierarchy",
	"map",
	"map-entry?",
	"map-indexed",
	"map?",
	"mapcat",
	"mapv",
	"max",
	"max-key",
	"memfn",
	"memoize",
	"merge",
	"merge-with",
	"meta",
	"method-sig",
	"methods",
	"min",
	"min-key",
	"mix-collection-hash",
	"mod",
	"munge",
	"name",
	"namespace",
	"namespace-munge",
	"nat-int?",
	"neg-int?",
	"neg?",
	"newline",
	"next",
	"nfirst",
	"nil?",
	"nnext",
	"not",
	"not-any?",
	"not-empty",
	"not-every?",
	"not=",
	"ns",
	"ns-aliases",
	"ns-imports",
	"ns-interns",
	"ns-map",
	"ns-name",
	"ns-publics",
	"ns-refers",
	"ns-resolve",
	"ns-unalias",
	"ns-unmap",
	"nth",
	"nthnext",
	"nthrest",
	"num",
	"number?",
	"numerator",
	"object-array",
	"odd?",
	"or",
	"parents",
	"partial",
	"partition",
	"partition-all",
	"partition-by",
	"pcalls",
	"peek",
	"persistent!",
	"pmap",
	"pop",
	"pop!",
	"pop-thread-bindings",
	"pos-int?",
	"pos?",
	"pr",
	"pr-str",
	"prefer-method",
	"prefers",
	"primitives-classnames",
	"print",
	"print-ctor",
	"print-dup",
	"print-method",
	"print-simple",
	"print-str",
	"printf",
	"println",
	"println-str",
	"prn",
	"prn-str",
	"promise",
	"proxy",
	"proxy-call-with-super",
	"proxy-mappings",
	"proxy-name",
	"proxy-super",
	"push-thread-bindings",
	"pvalues",
	"qualified-ident?",
	"qualified-keyword?",
	"qualified-symbol?",
	"quot",
	"rand",
	"rand-int",
	"rand-nth",
	"random-sample",
	"range",
	"ratio?",
	"rational?",
	"rationalize",
	"re-find",
	"re-groups",
	"re-matcher",
	"re-matches",
	"re-pattern",
	"re-seq",
	"read",
	"read-line",
	"read-string",
	"reader-conditional",
	"reader-conditional?",
	"realized?",
	"record?",
	"reduce",
	"reduce-kv",
	"reduced",
	"reduced?",
	"reductions",
	"ref",
	"ref-history-count",
	"ref-max-history",
	"ref-min-history",
	"ref-set",
	"refer",
	"refer-clojure",
	"reify",
	"release-pending-sends",
	"rem",
	"remove",
	"remove-all-methods",
	"remove-method",
	"remove-ns",
	"remove-watch",
	"repeat",
	"repeatedly",
	"replace",
	"replicate",
	"require",
	"reset!",
	"reset-meta!",
	"reset-vals!",
	"resolve",
	"rest",
	"restart-agent",
	"resultset-seq",
	"reverse",
	"reversible?",
	"rseq",
	"rsubseq",
	"run!",
	"satisfies?",
	"second",
	"select-keys",
	"send",
	"send-off",
	"send-via",
	"seq",
	"seq?",
	"seqable?",
	"seque",
	"sequence",
	"sequential?",
	"set",
	"set-agent-send-executor!",
	"set-agent-send-off-executor!",
	"set-error-handler!",
	"set-error-mode!",
	"set-validator!",
	"set?",
	"short",
	"short-array",
	"shorts",
	"shuffle",
	"shutdown-agents",
	"simple-ident?",
	"simple-keyword?",
	"simple-symbol?",
	"slurp",
	"some",
	"some->",
	"some->>",
	"some-fn",
	"some?",
	"sort",
	"sort-by",
	"sorted-map",
	"sorted-map-by",
	"sorted-set",
	"sorted-set-by",
	"sorted?",
	"special-symbol?",
	"spit",
	"split-at",
	"split-with",
	"str",
	"string?",
	"struct",
	"struct-map",
	"subs",
	"subseq",
	"subvec",
	"supers",
	"swap!",
	"swap-vals!",
	"symbol",
	"symbol?",
	"sync",
	"tagged-literal",
	"tagged-literal?",
	"take",
	"take-last",
	"take-nth",
	"take-while",
	"test",
	"the-ns",
	"thread-bound?",
	"time",
	"to-array",
	"to-array-2d",
	"trampoline",
	"transduce",
	"transient",
	"tree-seq",
	"true?",
	"type",
	"unchecked-add",
	"unchecked-add-int",
	"unchecked-byte",
	"unchecked-char",
	"unchecked-dec",
	"unchecked-dec-int",
	"unchecked-divide-int",
	"unchecked-double",
	"unchecked-float",
	"unchecked-inc",
	"unchecked-inc-int",
	"unchecked-int",
	"unchecked-long",
	"unchecked-multiply",
	"unchecked-multiply-int",
	"unchecked-negate",
	"unchecked-negate-int",
	"unchecked-remainder-int",
	"unchecked-short",
	"unchecked-subtract",
	"unchecked-subtract-int",
	"underive",
	"unquote",
	"unquote-splicing",
	"unreduced",
	"unsigned-bit-shift-right",
	"update",
	"update-in",
	"update-proxy",
	"uri?",
	"use",
	"uuid?",
	"val",
	"vals",
	"var-get",
	"var-set",
	"var?",
	"vary-meta",
	"vec",
	"vector",
	"vector-of",
	"vector?",
	"volatile!",
	"volatile?",
	"vreset!",
	"vswap!",
	"when",
	"when-first",
	"when-let",
	"when-not",
	"when-some",
	"while",
	"with-bindings",
	"with-bindings*",
	"with-in-str",
	"with-loading-context",
	"with-local-vars",
	"with-meta",
	"with-open",
	"with-out-str",
	"with-precision",
	"with-redefs",
	"with-redefs-fn",
	"xml-seq",
	"zero?",
	"zipmap"
];
var haveBodyParameter = [
	"->",
	"->>",
	"as->",
	"binding",
	"bound-fn",
	"case",
	"catch",
	"comment",
	"cond",
	"cond->",
	"cond->>",
	"condp",
	"def",
	"definterface",
	"defmethod",
	"defn",
	"defmacro",
	"defprotocol",
	"defrecord",
	"defstruct",
	"deftype",
	"do",
	"doseq",
	"dotimes",
	"doto",
	"extend",
	"extend-protocol",
	"extend-type",
	"fn",
	"for",
	"future",
	"if",
	"if-let",
	"if-not",
	"if-some",
	"let",
	"letfn",
	"locking",
	"loop",
	"ns",
	"proxy",
	"reify",
	"struct-map",
	"some->",
	"some->>",
	"try",
	"when",
	"when-first",
	"when-let",
	"when-not",
	"when-some",
	"while",
	"with-bindings",
	"with-bindings*",
	"with-in-str",
	"with-loading-context",
	"with-local-vars",
	"with-meta",
	"with-open",
	"with-out-str",
	"with-precision",
	"with-redefs",
	"with-redefs-fn"
];
var atom$1 = createLookupMap(atoms$11);
var specialForm$1 = createLookupMap(specialForms);
var coreSymbol = createLookupMap(coreSymbols);
var hasBodyParameter = createLookupMap(haveBodyParameter);
var delimiter = /^(?:[\\\[\]\s"(),;@^`{}~]|$)/;
var numberLiteral = /^(?:[+\-]?\d+(?:(?:N|(?:[eE][+\-]?\d+))|(?:\.?\d*(?:M|(?:[eE][+\-]?\d+))?)|\/\d+|[xX][0-9a-fA-F]+|r[0-9a-zA-Z]+)?(?=[\\\[\]\s"#'(),;@^`{}~]|$))/;
var characterLiteral = /^(?:\\(?:backspace|formfeed|newline|return|space|tab|o[0-7]{3}|u[0-9A-Fa-f]{4}|x[0-9A-Fa-f]{4}|.)?(?=[\\\[\]\s"(),;@^`{}~]|$))/;
var qualifiedSymbol = /^(?:(?:[^\\\/\[\]\d\s"#'(),;@^`{}~.][^\\\[\]\s"(),;@^`{}~.\/]*(?:\.[^\\\/\[\]\d\s"#'(),;@^`{}~.][^\\\[\]\s"(),;@^`{}~.\/]*)*\/)?(?:\/|[^\\\/\[\]\d\s"#'(),;@^`{}~][^\\\[\]\s"(),;@^`{}~]*)*(?=[\\\[\]\s"(),;@^`{}~]|$))/;
function base$1(stream, state) {
	if (stream.eatSpace() || stream.eat(",")) return ["space", null];
	if (stream.match(numberLiteral)) return [null, "number"];
	if (stream.match(characterLiteral)) return [null, "string.special"];
	if (stream.eat(/^"/)) return (state.tokenize = inString$1)(stream, state);
	if (stream.eat(/^[(\[{]/)) return ["open", "bracket"];
	if (stream.eat(/^[)\]}]/)) return ["close", "bracket"];
	if (stream.eat(/^;/)) {
		stream.skipToEnd();
		return ["space", "comment"];
	}
	if (stream.eat(/^[#'@^`~]/)) return [null, "meta"];
	var matches = stream.match(qualifiedSymbol);
	var symbol = matches && matches[0];
	if (!symbol) {
		stream.next();
		stream.eatWhile(function(c) {
			return !is(c, delimiter);
		});
		return [null, "error"];
	}
	if (symbol === "comment" && state.lastToken === "(") return (state.tokenize = inComment$1)(stream, state);
	if (is(symbol, atom$1) || symbol.charAt(0) === ":") return ["symbol", "atom"];
	if (is(symbol, specialForm$1) || is(symbol, coreSymbol)) return ["symbol", "keyword"];
	if (state.lastToken === "(") return ["symbol", "builtin"];
	return ["symbol", "variable"];
}
function inString$1(stream, state) {
	var escaped = false, next;
	while (next = stream.next()) {
		if (next === "\"" && !escaped) {
			state.tokenize = base$1;
			break;
		}
		escaped = !escaped && next === "\\";
	}
	return [null, "string"];
}
function inComment$1(stream, state) {
	var parenthesisCount = 1;
	var next;
	while (next = stream.next()) {
		if (next === ")") parenthesisCount--;
		if (next === "(") parenthesisCount++;
		if (parenthesisCount === 0) {
			stream.backUp(1);
			state.tokenize = base$1;
			break;
		}
	}
	return ["space", "comment"];
}
function createLookupMap(words) {
	var obj = {};
	for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
	return obj;
}
function is(value, test) {
	if (test instanceof RegExp) return test.test(value);
	if (test instanceof Object) return test.propertyIsEnumerable(value);
}
var clojure = {
	name: "clojure",
	startState: function() {
		return {
			ctx: {
				prev: null,
				start: 0,
				indentTo: 0
			},
			lastToken: null,
			tokenize: base$1
		};
	},
	token: function(stream, state) {
		if (stream.sol() && typeof state.ctx.indentTo !== "number") state.ctx.indentTo = state.ctx.start + 1;
		var typeStylePair = state.tokenize(stream, state);
		var type = typeStylePair[0];
		var style = typeStylePair[1];
		var current = stream.current();
		if (type !== "space") {
			if (state.lastToken === "(" && state.ctx.indentTo === null) {
				if (type === "symbol" && is(current, hasBodyParameter)) state.ctx.indentTo = state.ctx.start + stream.indentUnit;
				else state.ctx.indentTo = "next";
			} else if (state.ctx.indentTo === "next") state.ctx.indentTo = stream.column();
			state.lastToken = current;
		}
		if (type === "open") state.ctx = {
			prev: state.ctx,
			start: stream.column(),
			indentTo: null
		};
		else if (type === "close") state.ctx = state.ctx.prev || state.ctx;
		return style;
	},
	indent: function(state) {
		var i = state.ctx.indentTo;
		return typeof i === "number" ? i : state.ctx.start + 1;
	},
	languageData: {
		closeBrackets: { brackets: [
			"(",
			"[",
			"{",
			"\""
		] },
		commentTokens: { line: ";;" },
		autocomplete: [].concat(atoms$11, specialForms, coreSymbols)
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/css.js
function mkCSS(parserConfig) {
	parserConfig = {
		...defaults,
		...parserConfig
	};
	var inline = parserConfig.inline;
	var tokenHooks = parserConfig.tokenHooks, documentTypes = parserConfig.documentTypes || {}, mediaTypes = parserConfig.mediaTypes || {}, mediaFeatures = parserConfig.mediaFeatures || {}, mediaValueKeywords = parserConfig.mediaValueKeywords || {}, propertyKeywords = parserConfig.propertyKeywords || {}, nonStandardPropertyKeywords = parserConfig.nonStandardPropertyKeywords || {}, fontProperties = parserConfig.fontProperties || {}, counterDescriptors = parserConfig.counterDescriptors || {}, colorKeywords = parserConfig.colorKeywords || {}, valueKeywords = parserConfig.valueKeywords || {}, allowNested = parserConfig.allowNested, lineComment = parserConfig.lineComment, supportsAtComponent = parserConfig.supportsAtComponent === true, highlightNonStandardPropertyKeywords = parserConfig.highlightNonStandardPropertyKeywords !== false;
	var type, override;
	function ret(style, tp) {
		type = tp;
		return style;
	}
	function tokenBase(stream, state) {
		var ch = stream.next();
		if (tokenHooks[ch]) {
			var result = tokenHooks[ch](stream, state);
			if (result !== false) return result;
		}
		if (ch == "@") {
			stream.eatWhile(/[\w\\\-]/);
			return ret("def", stream.current());
		} else if (ch == "=" || (ch == "~" || ch == "|") && stream.eat("=")) return ret(null, "compare");
		else if (ch == "\"" || ch == "'") {
			state.tokenize = tokenString(ch);
			return state.tokenize(stream, state);
		} else if (ch == "#") {
			stream.eatWhile(/[\w\\\-]/);
			return ret("atom", "hash");
		} else if (ch == "!") {
			stream.match(/^\s*\w*/);
			return ret("keyword", "important");
		} else if (/\d/.test(ch) || ch == "." && stream.eat(/\d/)) {
			stream.eatWhile(/[\w.%]/);
			return ret("number", "unit");
		} else if (ch === "-") {
			if (/[\d.]/.test(stream.peek())) {
				stream.eatWhile(/[\w.%]/);
				return ret("number", "unit");
			} else if (stream.match(/^-[\w\\\-]*/)) {
				stream.eatWhile(/[\w\\\-]/);
				if (stream.match(/^\s*:/, false)) return ret("def", "variable-definition");
				return ret("variableName", "variable");
			} else if (stream.match(/^\w+-/)) return ret("meta", "meta");
		} else if (/[,+>*\/]/.test(ch)) return ret(null, "select-op");
		else if (ch == "." && stream.match(/^-?[_a-z][_a-z0-9-]*/i)) return ret("qualifier", "qualifier");
		else if (/[:;{}\[\]\(\)]/.test(ch)) return ret(null, ch);
		else if (stream.match(/^[\w-.]+(?=\()/)) {
			if (/^(url(-prefix)?|domain|regexp)$/i.test(stream.current())) state.tokenize = tokenParenthesized;
			return ret("variableName.function", "variable");
		} else if (/[\w\\\-]/.test(ch)) {
			stream.eatWhile(/[\w\\\-]/);
			return ret("property", "word");
		} else return ret(null, null);
	}
	function tokenString(quote) {
		return function(stream, state) {
			var escaped = false, ch;
			while ((ch = stream.next()) != null) {
				if (ch == quote && !escaped) {
					if (quote == ")") stream.backUp(1);
					break;
				}
				escaped = !escaped && ch == "\\";
			}
			if (ch == quote || !escaped && quote != ")") state.tokenize = null;
			return ret("string", "string");
		};
	}
	function tokenParenthesized(stream, state) {
		stream.next();
		if (!stream.match(/^\s*[\"\')]/, false)) state.tokenize = tokenString(")");
		else state.tokenize = null;
		return ret(null, "(");
	}
	function Context(type, indent, prev) {
		this.type = type;
		this.indent = indent;
		this.prev = prev;
	}
	function pushContext(state, stream, type, indent) {
		state.context = new Context(type, stream.indentation() + (indent === false ? 0 : stream.indentUnit), state.context);
		return type;
	}
	function popContext(state) {
		if (state.context.prev) state.context = state.context.prev;
		return state.context.type;
	}
	function pass(type, stream, state) {
		return states[state.context.type](type, stream, state);
	}
	function popAndPass(type, stream, state, n) {
		for (var i = n || 1; i > 0; i--) state.context = state.context.prev;
		return pass(type, stream, state);
	}
	function wordAsValue(stream) {
		var word = stream.current().toLowerCase();
		if (valueKeywords.hasOwnProperty(word)) override = "atom";
		else if (colorKeywords.hasOwnProperty(word)) override = "keyword";
		else override = "variable";
	}
	var states = {};
	states.top = function(type, stream, state) {
		if (type == "{") return pushContext(state, stream, "block");
		else if (type == "}" && state.context.prev) return popContext(state);
		else if (supportsAtComponent && /@component/i.test(type)) return pushContext(state, stream, "atComponentBlock");
		else if (/^@(-moz-)?document$/i.test(type)) return pushContext(state, stream, "documentTypes");
		else if (/^@(media|supports|(-moz-)?document|import)$/i.test(type)) return pushContext(state, stream, "atBlock");
		else if (/^@(font-face|counter-style)/i.test(type)) {
			state.stateArg = type;
			return "restricted_atBlock_before";
		} else if (/^@(-(moz|ms|o|webkit)-)?keyframes$/i.test(type)) return "keyframes";
		else if (type && type.charAt(0) == "@") return pushContext(state, stream, "at");
		else if (type == "hash") override = "builtin";
		else if (type == "word") override = "tag";
		else if (type == "variable-definition") return "maybeprop";
		else if (type == "interpolation") return pushContext(state, stream, "interpolation");
		else if (type == ":") return "pseudo";
		else if (allowNested && type == "(") return pushContext(state, stream, "parens");
		return state.context.type;
	};
	states.block = function(type, stream, state) {
		if (type == "word") {
			var word = stream.current().toLowerCase();
			if (propertyKeywords.hasOwnProperty(word)) {
				override = "property";
				return "maybeprop";
			} else if (nonStandardPropertyKeywords.hasOwnProperty(word)) {
				override = highlightNonStandardPropertyKeywords ? "string.special" : "property";
				return "maybeprop";
			} else if (allowNested) {
				override = stream.match(/^\s*:(?:\s|$)/, false) ? "property" : "tag";
				return "block";
			} else {
				override = "error";
				return "maybeprop";
			}
		} else if (type == "meta") return "block";
		else if (!allowNested && (type == "hash" || type == "qualifier")) {
			override = "error";
			return "block";
		} else return states.top(type, stream, state);
	};
	states.maybeprop = function(type, stream, state) {
		if (type == ":") return pushContext(state, stream, "prop");
		return pass(type, stream, state);
	};
	states.prop = function(type, stream, state) {
		if (type == ";") return popContext(state);
		if (type == "{" && allowNested) return pushContext(state, stream, "propBlock");
		if (type == "}" || type == "{") return popAndPass(type, stream, state);
		if (type == "(") return pushContext(state, stream, "parens");
		if (type == "hash" && !/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(stream.current())) override = "error";
		else if (type == "word") wordAsValue(stream);
		else if (type == "interpolation") return pushContext(state, stream, "interpolation");
		return "prop";
	};
	states.propBlock = function(type, _stream, state) {
		if (type == "}") return popContext(state);
		if (type == "word") {
			override = "property";
			return "maybeprop";
		}
		return state.context.type;
	};
	states.parens = function(type, stream, state) {
		if (type == "{" || type == "}") return popAndPass(type, stream, state);
		if (type == ")") return popContext(state);
		if (type == "(") return pushContext(state, stream, "parens");
		if (type == "interpolation") return pushContext(state, stream, "interpolation");
		if (type == "word") wordAsValue(stream);
		return "parens";
	};
	states.pseudo = function(type, stream, state) {
		if (type == "meta") return "pseudo";
		if (type == "word") {
			override = "variableName.constant";
			return state.context.type;
		}
		return pass(type, stream, state);
	};
	states.documentTypes = function(type, stream, state) {
		if (type == "word" && documentTypes.hasOwnProperty(stream.current())) {
			override = "tag";
			return state.context.type;
		} else return states.atBlock(type, stream, state);
	};
	states.atBlock = function(type, stream, state) {
		if (type == "(") return pushContext(state, stream, "atBlock_parens");
		if (type == "}" || type == ";") return popAndPass(type, stream, state);
		if (type == "{") return popContext(state) && pushContext(state, stream, allowNested ? "block" : "top");
		if (type == "interpolation") return pushContext(state, stream, "interpolation");
		if (type == "word") {
			var word = stream.current().toLowerCase();
			if (word == "only" || word == "not" || word == "and" || word == "or") override = "keyword";
			else if (mediaTypes.hasOwnProperty(word)) override = "attribute";
			else if (mediaFeatures.hasOwnProperty(word)) override = "property";
			else if (mediaValueKeywords.hasOwnProperty(word)) override = "keyword";
			else if (propertyKeywords.hasOwnProperty(word)) override = "property";
			else if (nonStandardPropertyKeywords.hasOwnProperty(word)) override = highlightNonStandardPropertyKeywords ? "string.special" : "property";
			else if (valueKeywords.hasOwnProperty(word)) override = "atom";
			else if (colorKeywords.hasOwnProperty(word)) override = "keyword";
			else override = "error";
		}
		return state.context.type;
	};
	states.atComponentBlock = function(type, stream, state) {
		if (type == "}") return popAndPass(type, stream, state);
		if (type == "{") return popContext(state) && pushContext(state, stream, allowNested ? "block" : "top", false);
		if (type == "word") override = "error";
		return state.context.type;
	};
	states.atBlock_parens = function(type, stream, state) {
		if (type == ")") return popContext(state);
		if (type == "{" || type == "}") return popAndPass(type, stream, state, 2);
		return states.atBlock(type, stream, state);
	};
	states.restricted_atBlock_before = function(type, stream, state) {
		if (type == "{") return pushContext(state, stream, "restricted_atBlock");
		if (type == "word" && state.stateArg == "@counter-style") {
			override = "variable";
			return "restricted_atBlock_before";
		}
		return pass(type, stream, state);
	};
	states.restricted_atBlock = function(type, stream, state) {
		if (type == "}") {
			state.stateArg = null;
			return popContext(state);
		}
		if (type == "word") {
			if (state.stateArg == "@font-face" && !fontProperties.hasOwnProperty(stream.current().toLowerCase()) || state.stateArg == "@counter-style" && !counterDescriptors.hasOwnProperty(stream.current().toLowerCase())) override = "error";
			else override = "property";
			return "maybeprop";
		}
		return "restricted_atBlock";
	};
	states.keyframes = function(type, stream, state) {
		if (type == "word") {
			override = "variable";
			return "keyframes";
		}
		if (type == "{") return pushContext(state, stream, "top");
		return pass(type, stream, state);
	};
	states.at = function(type, stream, state) {
		if (type == ";") return popContext(state);
		if (type == "{" || type == "}") return popAndPass(type, stream, state);
		if (type == "word") override = "tag";
		else if (type == "hash") override = "builtin";
		return "at";
	};
	states.interpolation = function(type, stream, state) {
		if (type == "}") return popContext(state);
		if (type == "{" || type == ";") return popAndPass(type, stream, state);
		if (type == "word") override = "variable";
		else if (type != "variable" && type != "(" && type != ")") override = "error";
		return "interpolation";
	};
	return {
		name: parserConfig.name,
		startState: function() {
			return {
				tokenize: null,
				state: inline ? "block" : "top",
				stateArg: null,
				context: new Context(inline ? "block" : "top", 0, null)
			};
		},
		token: function(stream, state) {
			if (!state.tokenize && stream.eatSpace()) return null;
			var style = (state.tokenize || tokenBase)(stream, state);
			if (style && typeof style == "object") {
				type = style[1];
				style = style[0];
			}
			override = style;
			if (type != "comment") state.state = states[state.state](type, stream, state);
			return override;
		},
		indent: function(state, textAfter, iCx) {
			var cx = state.context, ch = textAfter && textAfter.charAt(0);
			var indent = cx.indent;
			if (cx.type == "prop" && (ch == "}" || ch == ")")) cx = cx.prev;
			if (cx.prev) {
				if (ch == "}" && (cx.type == "block" || cx.type == "top" || cx.type == "interpolation" || cx.type == "restricted_atBlock")) {
					cx = cx.prev;
					indent = cx.indent;
				} else if (ch == ")" && (cx.type == "parens" || cx.type == "atBlock_parens") || ch == "{" && (cx.type == "at" || cx.type == "atBlock")) indent = Math.max(0, cx.indent - iCx.unit);
			}
			return indent;
		},
		languageData: {
			indentOnInput: /^\s*\}$/,
			commentTokens: {
				line: lineComment,
				block: {
					open: "/*",
					close: "*/"
				}
			},
			autocomplete: allWords
		}
	};
}
function keySet$1(array) {
	var keys = {};
	for (var i = 0; i < array.length; ++i) keys[array[i].toLowerCase()] = true;
	return keys;
}
var documentTypes_$1 = [
	"domain",
	"regexp",
	"url",
	"url-prefix"
];
var documentTypes$1 = keySet$1(documentTypes_$1);
var mediaTypes_$1 = [
	"all",
	"aural",
	"braille",
	"handheld",
	"print",
	"projection",
	"screen",
	"tty",
	"tv",
	"embossed"
];
var mediaTypes$1 = keySet$1(mediaTypes_$1);
var mediaFeatures_$1 = [
	"width",
	"min-width",
	"max-width",
	"height",
	"min-height",
	"max-height",
	"device-width",
	"min-device-width",
	"max-device-width",
	"device-height",
	"min-device-height",
	"max-device-height",
	"aspect-ratio",
	"min-aspect-ratio",
	"max-aspect-ratio",
	"device-aspect-ratio",
	"min-device-aspect-ratio",
	"max-device-aspect-ratio",
	"color",
	"min-color",
	"max-color",
	"color-index",
	"min-color-index",
	"max-color-index",
	"monochrome",
	"min-monochrome",
	"max-monochrome",
	"resolution",
	"min-resolution",
	"max-resolution",
	"scan",
	"grid",
	"orientation",
	"device-pixel-ratio",
	"min-device-pixel-ratio",
	"max-device-pixel-ratio",
	"pointer",
	"any-pointer",
	"hover",
	"any-hover",
	"prefers-color-scheme",
	"dynamic-range",
	"video-dynamic-range"
];
var mediaFeatures$1 = keySet$1(mediaFeatures_$1);
var mediaValueKeywords_ = [
	"landscape",
	"portrait",
	"none",
	"coarse",
	"fine",
	"on-demand",
	"hover",
	"interlace",
	"progressive",
	"dark",
	"light",
	"standard",
	"high"
];
var mediaValueKeywords = keySet$1(mediaValueKeywords_);
var propertyKeywords_$1 = [
	"align-content",
	"align-items",
	"align-self",
	"alignment-adjust",
	"alignment-baseline",
	"all",
	"anchor-point",
	"animation",
	"animation-delay",
	"animation-direction",
	"animation-duration",
	"animation-fill-mode",
	"animation-iteration-count",
	"animation-name",
	"animation-play-state",
	"animation-timing-function",
	"appearance",
	"azimuth",
	"backdrop-filter",
	"backface-visibility",
	"background",
	"background-attachment",
	"background-blend-mode",
	"background-clip",
	"background-color",
	"background-image",
	"background-origin",
	"background-position",
	"background-position-x",
	"background-position-y",
	"background-repeat",
	"background-size",
	"baseline-shift",
	"binding",
	"bleed",
	"block-size",
	"bookmark-label",
	"bookmark-level",
	"bookmark-state",
	"bookmark-target",
	"border",
	"border-bottom",
	"border-bottom-color",
	"border-bottom-left-radius",
	"border-bottom-right-radius",
	"border-bottom-style",
	"border-bottom-width",
	"border-collapse",
	"border-color",
	"border-image",
	"border-image-outset",
	"border-image-repeat",
	"border-image-slice",
	"border-image-source",
	"border-image-width",
	"border-left",
	"border-left-color",
	"border-left-style",
	"border-left-width",
	"border-radius",
	"border-right",
	"border-right-color",
	"border-right-style",
	"border-right-width",
	"border-spacing",
	"border-style",
	"border-top",
	"border-top-color",
	"border-top-left-radius",
	"border-top-right-radius",
	"border-top-style",
	"border-top-width",
	"border-width",
	"bottom",
	"box-decoration-break",
	"box-shadow",
	"box-sizing",
	"break-after",
	"break-before",
	"break-inside",
	"caption-side",
	"caret-color",
	"clear",
	"clip",
	"color",
	"color-profile",
	"column-count",
	"column-fill",
	"column-gap",
	"column-rule",
	"column-rule-color",
	"column-rule-style",
	"column-rule-width",
	"column-span",
	"column-width",
	"columns",
	"contain",
	"content",
	"counter-increment",
	"counter-reset",
	"crop",
	"cue",
	"cue-after",
	"cue-before",
	"cursor",
	"direction",
	"display",
	"dominant-baseline",
	"drop-initial-after-adjust",
	"drop-initial-after-align",
	"drop-initial-before-adjust",
	"drop-initial-before-align",
	"drop-initial-size",
	"drop-initial-value",
	"elevation",
	"empty-cells",
	"fit",
	"fit-content",
	"fit-position",
	"flex",
	"flex-basis",
	"flex-direction",
	"flex-flow",
	"flex-grow",
	"flex-shrink",
	"flex-wrap",
	"float",
	"float-offset",
	"flow-from",
	"flow-into",
	"font",
	"font-family",
	"font-feature-settings",
	"font-kerning",
	"font-language-override",
	"font-optical-sizing",
	"font-size",
	"font-size-adjust",
	"font-stretch",
	"font-style",
	"font-synthesis",
	"font-variant",
	"font-variant-alternates",
	"font-variant-caps",
	"font-variant-east-asian",
	"font-variant-ligatures",
	"font-variant-numeric",
	"font-variant-position",
	"font-variation-settings",
	"font-weight",
	"gap",
	"grid",
	"grid-area",
	"grid-auto-columns",
	"grid-auto-flow",
	"grid-auto-rows",
	"grid-column",
	"grid-column-end",
	"grid-column-gap",
	"grid-column-start",
	"grid-gap",
	"grid-row",
	"grid-row-end",
	"grid-row-gap",
	"grid-row-start",
	"grid-template",
	"grid-template-areas",
	"grid-template-columns",
	"grid-template-rows",
	"hanging-punctuation",
	"height",
	"hyphens",
	"icon",
	"image-orientation",
	"image-rendering",
	"image-resolution",
	"inline-box-align",
	"inset",
	"inset-block",
	"inset-block-end",
	"inset-block-start",
	"inset-inline",
	"inset-inline-end",
	"inset-inline-start",
	"isolation",
	"justify-content",
	"justify-items",
	"justify-self",
	"left",
	"letter-spacing",
	"line-break",
	"line-height",
	"line-height-step",
	"line-stacking",
	"line-stacking-ruby",
	"line-stacking-shift",
	"line-stacking-strategy",
	"list-style",
	"list-style-image",
	"list-style-position",
	"list-style-type",
	"margin",
	"margin-bottom",
	"margin-left",
	"margin-right",
	"margin-top",
	"marks",
	"marquee-direction",
	"marquee-loop",
	"marquee-play-count",
	"marquee-speed",
	"marquee-style",
	"mask-clip",
	"mask-composite",
	"mask-image",
	"mask-mode",
	"mask-origin",
	"mask-position",
	"mask-repeat",
	"mask-size",
	"mask-type",
	"max-block-size",
	"max-height",
	"max-inline-size",
	"max-width",
	"min-block-size",
	"min-height",
	"min-inline-size",
	"min-width",
	"mix-blend-mode",
	"move-to",
	"nav-down",
	"nav-index",
	"nav-left",
	"nav-right",
	"nav-up",
	"object-fit",
	"object-position",
	"offset",
	"offset-anchor",
	"offset-distance",
	"offset-path",
	"offset-position",
	"offset-rotate",
	"opacity",
	"order",
	"orphans",
	"outline",
	"outline-color",
	"outline-offset",
	"outline-style",
	"outline-width",
	"overflow",
	"overflow-style",
	"overflow-wrap",
	"overflow-x",
	"overflow-y",
	"padding",
	"padding-bottom",
	"padding-left",
	"padding-right",
	"padding-top",
	"page",
	"page-break-after",
	"page-break-before",
	"page-break-inside",
	"page-policy",
	"pause",
	"pause-after",
	"pause-before",
	"perspective",
	"perspective-origin",
	"pitch",
	"pitch-range",
	"place-content",
	"place-items",
	"place-self",
	"play-during",
	"position",
	"presentation-level",
	"punctuation-trim",
	"quotes",
	"region-break-after",
	"region-break-before",
	"region-break-inside",
	"region-fragment",
	"rendering-intent",
	"resize",
	"rest",
	"rest-after",
	"rest-before",
	"richness",
	"right",
	"rotate",
	"rotation",
	"rotation-point",
	"row-gap",
	"ruby-align",
	"ruby-overhang",
	"ruby-position",
	"ruby-span",
	"scale",
	"scroll-behavior",
	"scroll-margin",
	"scroll-margin-block",
	"scroll-margin-block-end",
	"scroll-margin-block-start",
	"scroll-margin-bottom",
	"scroll-margin-inline",
	"scroll-margin-inline-end",
	"scroll-margin-inline-start",
	"scroll-margin-left",
	"scroll-margin-right",
	"scroll-margin-top",
	"scroll-padding",
	"scroll-padding-block",
	"scroll-padding-block-end",
	"scroll-padding-block-start",
	"scroll-padding-bottom",
	"scroll-padding-inline",
	"scroll-padding-inline-end",
	"scroll-padding-inline-start",
	"scroll-padding-left",
	"scroll-padding-right",
	"scroll-padding-top",
	"scroll-snap-align",
	"scroll-snap-type",
	"shape-image-threshold",
	"shape-inside",
	"shape-margin",
	"shape-outside",
	"size",
	"speak",
	"speak-as",
	"speak-header",
	"speak-numeral",
	"speak-punctuation",
	"speech-rate",
	"stress",
	"string-set",
	"tab-size",
	"table-layout",
	"target",
	"target-name",
	"target-new",
	"target-position",
	"text-align",
	"text-align-last",
	"text-combine-upright",
	"text-decoration",
	"text-decoration-color",
	"text-decoration-line",
	"text-decoration-skip",
	"text-decoration-skip-ink",
	"text-decoration-style",
	"text-emphasis",
	"text-emphasis-color",
	"text-emphasis-position",
	"text-emphasis-style",
	"text-height",
	"text-indent",
	"text-justify",
	"text-orientation",
	"text-outline",
	"text-overflow",
	"text-rendering",
	"text-shadow",
	"text-size-adjust",
	"text-space-collapse",
	"text-transform",
	"text-underline-position",
	"text-wrap",
	"top",
	"touch-action",
	"transform",
	"transform-origin",
	"transform-style",
	"transition",
	"transition-delay",
	"transition-duration",
	"transition-property",
	"transition-timing-function",
	"translate",
	"unicode-bidi",
	"user-select",
	"vertical-align",
	"visibility",
	"voice-balance",
	"voice-duration",
	"voice-family",
	"voice-pitch",
	"voice-range",
	"voice-rate",
	"voice-stress",
	"voice-volume",
	"volume",
	"white-space",
	"widows",
	"width",
	"will-change",
	"word-break",
	"word-spacing",
	"word-wrap",
	"writing-mode",
	"z-index",
	"clip-path",
	"clip-rule",
	"mask",
	"enable-background",
	"filter",
	"flood-color",
	"flood-opacity",
	"lighting-color",
	"stop-color",
	"stop-opacity",
	"pointer-events",
	"color-interpolation",
	"color-interpolation-filters",
	"color-rendering",
	"fill",
	"fill-opacity",
	"fill-rule",
	"image-rendering",
	"marker",
	"marker-end",
	"marker-mid",
	"marker-start",
	"paint-order",
	"shape-rendering",
	"stroke",
	"stroke-dasharray",
	"stroke-dashoffset",
	"stroke-linecap",
	"stroke-linejoin",
	"stroke-miterlimit",
	"stroke-opacity",
	"stroke-width",
	"text-rendering",
	"baseline-shift",
	"dominant-baseline",
	"glyph-orientation-horizontal",
	"glyph-orientation-vertical",
	"text-anchor",
	"writing-mode"
];
var propertyKeywords$1 = keySet$1(propertyKeywords_$1);
var nonStandardPropertyKeywords_$1 = [
	"accent-color",
	"aspect-ratio",
	"border-block",
	"border-block-color",
	"border-block-end",
	"border-block-end-color",
	"border-block-end-style",
	"border-block-end-width",
	"border-block-start",
	"border-block-start-color",
	"border-block-start-style",
	"border-block-start-width",
	"border-block-style",
	"border-block-width",
	"border-inline",
	"border-inline-color",
	"border-inline-end",
	"border-inline-end-color",
	"border-inline-end-style",
	"border-inline-end-width",
	"border-inline-start",
	"border-inline-start-color",
	"border-inline-start-style",
	"border-inline-start-width",
	"border-inline-style",
	"border-inline-width",
	"content-visibility",
	"margin-block",
	"margin-block-end",
	"margin-block-start",
	"margin-inline",
	"margin-inline-end",
	"margin-inline-start",
	"overflow-anchor",
	"overscroll-behavior",
	"padding-block",
	"padding-block-end",
	"padding-block-start",
	"padding-inline",
	"padding-inline-end",
	"padding-inline-start",
	"scroll-snap-stop",
	"scrollbar-3d-light-color",
	"scrollbar-arrow-color",
	"scrollbar-base-color",
	"scrollbar-dark-shadow-color",
	"scrollbar-face-color",
	"scrollbar-highlight-color",
	"scrollbar-shadow-color",
	"scrollbar-track-color",
	"searchfield-cancel-button",
	"searchfield-decoration",
	"searchfield-results-button",
	"searchfield-results-decoration",
	"shape-inside",
	"zoom"
];
var nonStandardPropertyKeywords$1 = keySet$1(nonStandardPropertyKeywords_$1);
var fontProperties$1 = keySet$1([
	"font-display",
	"font-family",
	"src",
	"unicode-range",
	"font-variant",
	"font-feature-settings",
	"font-stretch",
	"font-weight",
	"font-style"
]);
var counterDescriptors = keySet$1([
	"additive-symbols",
	"fallback",
	"negative",
	"pad",
	"prefix",
	"range",
	"speak-as",
	"suffix",
	"symbols",
	"system"
]);
var colorKeywords_$1 = [
	"aliceblue",
	"antiquewhite",
	"aqua",
	"aquamarine",
	"azure",
	"beige",
	"bisque",
	"black",
	"blanchedalmond",
	"blue",
	"blueviolet",
	"brown",
	"burlywood",
	"cadetblue",
	"chartreuse",
	"chocolate",
	"coral",
	"cornflowerblue",
	"cornsilk",
	"crimson",
	"cyan",
	"darkblue",
	"darkcyan",
	"darkgoldenrod",
	"darkgray",
	"darkgreen",
	"darkgrey",
	"darkkhaki",
	"darkmagenta",
	"darkolivegreen",
	"darkorange",
	"darkorchid",
	"darkred",
	"darksalmon",
	"darkseagreen",
	"darkslateblue",
	"darkslategray",
	"darkslategrey",
	"darkturquoise",
	"darkviolet",
	"deeppink",
	"deepskyblue",
	"dimgray",
	"dimgrey",
	"dodgerblue",
	"firebrick",
	"floralwhite",
	"forestgreen",
	"fuchsia",
	"gainsboro",
	"ghostwhite",
	"gold",
	"goldenrod",
	"gray",
	"grey",
	"green",
	"greenyellow",
	"honeydew",
	"hotpink",
	"indianred",
	"indigo",
	"ivory",
	"khaki",
	"lavender",
	"lavenderblush",
	"lawngreen",
	"lemonchiffon",
	"lightblue",
	"lightcoral",
	"lightcyan",
	"lightgoldenrodyellow",
	"lightgray",
	"lightgreen",
	"lightgrey",
	"lightpink",
	"lightsalmon",
	"lightseagreen",
	"lightskyblue",
	"lightslategray",
	"lightslategrey",
	"lightsteelblue",
	"lightyellow",
	"lime",
	"limegreen",
	"linen",
	"magenta",
	"maroon",
	"mediumaquamarine",
	"mediumblue",
	"mediumorchid",
	"mediumpurple",
	"mediumseagreen",
	"mediumslateblue",
	"mediumspringgreen",
	"mediumturquoise",
	"mediumvioletred",
	"midnightblue",
	"mintcream",
	"mistyrose",
	"moccasin",
	"navajowhite",
	"navy",
	"oldlace",
	"olive",
	"olivedrab",
	"orange",
	"orangered",
	"orchid",
	"palegoldenrod",
	"palegreen",
	"paleturquoise",
	"palevioletred",
	"papayawhip",
	"peachpuff",
	"peru",
	"pink",
	"plum",
	"powderblue",
	"purple",
	"rebeccapurple",
	"red",
	"rosybrown",
	"royalblue",
	"saddlebrown",
	"salmon",
	"sandybrown",
	"seagreen",
	"seashell",
	"sienna",
	"silver",
	"skyblue",
	"slateblue",
	"slategray",
	"slategrey",
	"snow",
	"springgreen",
	"steelblue",
	"tan",
	"teal",
	"thistle",
	"tomato",
	"turquoise",
	"violet",
	"wheat",
	"white",
	"whitesmoke",
	"yellow",
	"yellowgreen"
];
var colorKeywords$1 = keySet$1(colorKeywords_$1);
var valueKeywords_$1 = [
	"above",
	"absolute",
	"activeborder",
	"additive",
	"activecaption",
	"afar",
	"after-white-space",
	"ahead",
	"alias",
	"all",
	"all-scroll",
	"alphabetic",
	"alternate",
	"always",
	"amharic",
	"amharic-abegede",
	"antialiased",
	"appworkspace",
	"arabic-indic",
	"armenian",
	"asterisks",
	"attr",
	"auto",
	"auto-flow",
	"avoid",
	"avoid-column",
	"avoid-page",
	"avoid-region",
	"axis-pan",
	"background",
	"backwards",
	"baseline",
	"below",
	"bidi-override",
	"binary",
	"bengali",
	"blink",
	"block",
	"block-axis",
	"blur",
	"bold",
	"bolder",
	"border",
	"border-box",
	"both",
	"bottom",
	"break",
	"break-all",
	"break-word",
	"brightness",
	"bullets",
	"button",
	"buttonface",
	"buttonhighlight",
	"buttonshadow",
	"buttontext",
	"calc",
	"cambodian",
	"capitalize",
	"caps-lock-indicator",
	"caption",
	"captiontext",
	"caret",
	"cell",
	"center",
	"checkbox",
	"circle",
	"cjk-decimal",
	"cjk-earthly-branch",
	"cjk-heavenly-stem",
	"cjk-ideographic",
	"clear",
	"clip",
	"close-quote",
	"col-resize",
	"collapse",
	"color",
	"color-burn",
	"color-dodge",
	"column",
	"column-reverse",
	"compact",
	"condensed",
	"conic-gradient",
	"contain",
	"content",
	"contents",
	"content-box",
	"context-menu",
	"continuous",
	"contrast",
	"copy",
	"counter",
	"counters",
	"cover",
	"crop",
	"cross",
	"crosshair",
	"cubic-bezier",
	"currentcolor",
	"cursive",
	"cyclic",
	"darken",
	"dashed",
	"decimal",
	"decimal-leading-zero",
	"default",
	"default-button",
	"dense",
	"destination-atop",
	"destination-in",
	"destination-out",
	"destination-over",
	"devanagari",
	"difference",
	"disc",
	"discard",
	"disclosure-closed",
	"disclosure-open",
	"document",
	"dot-dash",
	"dot-dot-dash",
	"dotted",
	"double",
	"down",
	"drop-shadow",
	"e-resize",
	"ease",
	"ease-in",
	"ease-in-out",
	"ease-out",
	"element",
	"ellipse",
	"ellipsis",
	"embed",
	"end",
	"ethiopic",
	"ethiopic-abegede",
	"ethiopic-abegede-am-et",
	"ethiopic-abegede-gez",
	"ethiopic-abegede-ti-er",
	"ethiopic-abegede-ti-et",
	"ethiopic-halehame-aa-er",
	"ethiopic-halehame-aa-et",
	"ethiopic-halehame-am-et",
	"ethiopic-halehame-gez",
	"ethiopic-halehame-om-et",
	"ethiopic-halehame-sid-et",
	"ethiopic-halehame-so-et",
	"ethiopic-halehame-ti-er",
	"ethiopic-halehame-ti-et",
	"ethiopic-halehame-tig",
	"ethiopic-numeric",
	"ew-resize",
	"exclusion",
	"expanded",
	"extends",
	"extra-condensed",
	"extra-expanded",
	"fantasy",
	"fast",
	"fill",
	"fill-box",
	"fixed",
	"flat",
	"flex",
	"flex-end",
	"flex-start",
	"footnotes",
	"forwards",
	"from",
	"geometricPrecision",
	"georgian",
	"grayscale",
	"graytext",
	"grid",
	"groove",
	"gujarati",
	"gurmukhi",
	"hand",
	"hangul",
	"hangul-consonant",
	"hard-light",
	"hebrew",
	"help",
	"hidden",
	"hide",
	"higher",
	"highlight",
	"highlighttext",
	"hiragana",
	"hiragana-iroha",
	"horizontal",
	"hsl",
	"hsla",
	"hue",
	"hue-rotate",
	"icon",
	"ignore",
	"inactiveborder",
	"inactivecaption",
	"inactivecaptiontext",
	"infinite",
	"infobackground",
	"infotext",
	"inherit",
	"initial",
	"inline",
	"inline-axis",
	"inline-block",
	"inline-flex",
	"inline-grid",
	"inline-table",
	"inset",
	"inside",
	"intrinsic",
	"invert",
	"italic",
	"japanese-formal",
	"japanese-informal",
	"justify",
	"kannada",
	"katakana",
	"katakana-iroha",
	"keep-all",
	"khmer",
	"korean-hangul-formal",
	"korean-hanja-formal",
	"korean-hanja-informal",
	"landscape",
	"lao",
	"large",
	"larger",
	"left",
	"level",
	"lighter",
	"lighten",
	"line-through",
	"linear",
	"linear-gradient",
	"lines",
	"list-item",
	"listbox",
	"listitem",
	"local",
	"logical",
	"loud",
	"lower",
	"lower-alpha",
	"lower-armenian",
	"lower-greek",
	"lower-hexadecimal",
	"lower-latin",
	"lower-norwegian",
	"lower-roman",
	"lowercase",
	"ltr",
	"luminosity",
	"malayalam",
	"manipulation",
	"match",
	"matrix",
	"matrix3d",
	"media-play-button",
	"media-slider",
	"media-sliderthumb",
	"media-volume-slider",
	"media-volume-sliderthumb",
	"medium",
	"menu",
	"menulist",
	"menulist-button",
	"menutext",
	"message-box",
	"middle",
	"min-intrinsic",
	"mix",
	"mongolian",
	"monospace",
	"move",
	"multiple",
	"multiple_mask_images",
	"multiply",
	"myanmar",
	"n-resize",
	"narrower",
	"ne-resize",
	"nesw-resize",
	"no-close-quote",
	"no-drop",
	"no-open-quote",
	"no-repeat",
	"none",
	"normal",
	"not-allowed",
	"nowrap",
	"ns-resize",
	"numbers",
	"numeric",
	"nw-resize",
	"nwse-resize",
	"oblique",
	"octal",
	"opacity",
	"open-quote",
	"optimizeLegibility",
	"optimizeSpeed",
	"oriya",
	"oromo",
	"outset",
	"outside",
	"outside-shape",
	"overlay",
	"overline",
	"padding",
	"padding-box",
	"painted",
	"page",
	"paused",
	"persian",
	"perspective",
	"pinch-zoom",
	"plus-darker",
	"plus-lighter",
	"pointer",
	"polygon",
	"portrait",
	"pre",
	"pre-line",
	"pre-wrap",
	"preserve-3d",
	"progress",
	"push-button",
	"radial-gradient",
	"radio",
	"read-only",
	"read-write",
	"read-write-plaintext-only",
	"rectangle",
	"region",
	"relative",
	"repeat",
	"repeating-linear-gradient",
	"repeating-radial-gradient",
	"repeating-conic-gradient",
	"repeat-x",
	"repeat-y",
	"reset",
	"reverse",
	"rgb",
	"rgba",
	"ridge",
	"right",
	"rotate",
	"rotate3d",
	"rotateX",
	"rotateY",
	"rotateZ",
	"round",
	"row",
	"row-resize",
	"row-reverse",
	"rtl",
	"run-in",
	"running",
	"s-resize",
	"sans-serif",
	"saturate",
	"saturation",
	"scale",
	"scale3d",
	"scaleX",
	"scaleY",
	"scaleZ",
	"screen",
	"scroll",
	"scrollbar",
	"scroll-position",
	"se-resize",
	"searchfield",
	"searchfield-cancel-button",
	"searchfield-decoration",
	"searchfield-results-button",
	"searchfield-results-decoration",
	"self-start",
	"self-end",
	"semi-condensed",
	"semi-expanded",
	"separate",
	"sepia",
	"serif",
	"show",
	"sidama",
	"simp-chinese-formal",
	"simp-chinese-informal",
	"single",
	"skew",
	"skewX",
	"skewY",
	"skip-white-space",
	"slide",
	"slider-horizontal",
	"slider-vertical",
	"sliderthumb-horizontal",
	"sliderthumb-vertical",
	"slow",
	"small",
	"small-caps",
	"small-caption",
	"smaller",
	"soft-light",
	"solid",
	"somali",
	"source-atop",
	"source-in",
	"source-out",
	"source-over",
	"space",
	"space-around",
	"space-between",
	"space-evenly",
	"spell-out",
	"square",
	"square-button",
	"start",
	"static",
	"status-bar",
	"stretch",
	"stroke",
	"stroke-box",
	"sub",
	"subpixel-antialiased",
	"svg_masks",
	"super",
	"sw-resize",
	"symbolic",
	"symbols",
	"system-ui",
	"table",
	"table-caption",
	"table-cell",
	"table-column",
	"table-column-group",
	"table-footer-group",
	"table-header-group",
	"table-row",
	"table-row-group",
	"tamil",
	"telugu",
	"text",
	"text-bottom",
	"text-top",
	"textarea",
	"textfield",
	"thai",
	"thick",
	"thin",
	"threeddarkshadow",
	"threedface",
	"threedhighlight",
	"threedlightshadow",
	"threedshadow",
	"tibetan",
	"tigre",
	"tigrinya-er",
	"tigrinya-er-abegede",
	"tigrinya-et",
	"tigrinya-et-abegede",
	"to",
	"top",
	"trad-chinese-formal",
	"trad-chinese-informal",
	"transform",
	"translate",
	"translate3d",
	"translateX",
	"translateY",
	"translateZ",
	"transparent",
	"ultra-condensed",
	"ultra-expanded",
	"underline",
	"unidirectional-pan",
	"unset",
	"up",
	"upper-alpha",
	"upper-armenian",
	"upper-greek",
	"upper-hexadecimal",
	"upper-latin",
	"upper-norwegian",
	"upper-roman",
	"uppercase",
	"urdu",
	"url",
	"var",
	"vertical",
	"vertical-text",
	"view-box",
	"visible",
	"visibleFill",
	"visiblePainted",
	"visibleStroke",
	"visual",
	"w-resize",
	"wait",
	"wave",
	"wider",
	"window",
	"windowframe",
	"windowtext",
	"words",
	"wrap",
	"wrap-reverse",
	"x-large",
	"x-small",
	"xor",
	"xx-large",
	"xx-small"
];
var valueKeywords$1 = keySet$1(valueKeywords_$1);
var allWords = documentTypes_$1.concat(mediaTypes_$1).concat(mediaFeatures_$1).concat(mediaValueKeywords_).concat(propertyKeywords_$1).concat(nonStandardPropertyKeywords_$1).concat(colorKeywords_$1).concat(valueKeywords_$1);
var defaults = {
	documentTypes: documentTypes$1,
	mediaTypes: mediaTypes$1,
	mediaFeatures: mediaFeatures$1,
	mediaValueKeywords,
	propertyKeywords: propertyKeywords$1,
	nonStandardPropertyKeywords: nonStandardPropertyKeywords$1,
	fontProperties: fontProperties$1,
	counterDescriptors,
	colorKeywords: colorKeywords$1,
	valueKeywords: valueKeywords$1,
	tokenHooks: { "/": function(stream, state) {
		if (!stream.eat("*")) return false;
		state.tokenize = tokenCComment$2;
		return tokenCComment$2(stream, state);
	} }
};
mkCSS({ name: "css" });
function tokenCComment$2(stream, state) {
	var maybeEnd = false, ch;
	while ((ch = stream.next()) != null) {
		if (maybeEnd && ch == "/") {
			state.tokenize = null;
			break;
		}
		maybeEnd = ch == "*";
	}
	return ["comment", "comment"];
}
mkCSS({
	name: "scss",
	mediaTypes: mediaTypes$1,
	mediaFeatures: mediaFeatures$1,
	mediaValueKeywords,
	propertyKeywords: propertyKeywords$1,
	nonStandardPropertyKeywords: nonStandardPropertyKeywords$1,
	colorKeywords: colorKeywords$1,
	valueKeywords: valueKeywords$1,
	fontProperties: fontProperties$1,
	allowNested: true,
	lineComment: "//",
	tokenHooks: {
		"/": function(stream, state) {
			if (stream.eat("/")) {
				stream.skipToEnd();
				return ["comment", "comment"];
			} else if (stream.eat("*")) {
				state.tokenize = tokenCComment$2;
				return tokenCComment$2(stream, state);
			} else return ["operator", "operator"];
		},
		":": function(stream) {
			if (stream.match(/^\s*\{/, false)) return [null, null];
			return false;
		},
		"$": function(stream) {
			stream.match(/^[\w-]+/);
			if (stream.match(/^\s*:/, false)) return ["def", "variable-definition"];
			return ["variableName.special", "variable"];
		},
		"#": function(stream) {
			if (!stream.eat("{")) return false;
			return [null, "interpolation"];
		}
	}
});
mkCSS({
	name: "less",
	mediaTypes: mediaTypes$1,
	mediaFeatures: mediaFeatures$1,
	mediaValueKeywords,
	propertyKeywords: propertyKeywords$1,
	nonStandardPropertyKeywords: nonStandardPropertyKeywords$1,
	colorKeywords: colorKeywords$1,
	valueKeywords: valueKeywords$1,
	fontProperties: fontProperties$1,
	allowNested: true,
	lineComment: "//",
	tokenHooks: {
		"/": function(stream, state) {
			if (stream.eat("/")) {
				stream.skipToEnd();
				return ["comment", "comment"];
			} else if (stream.eat("*")) {
				state.tokenize = tokenCComment$2;
				return tokenCComment$2(stream, state);
			} else return ["operator", "operator"];
		},
		"@": function(stream) {
			if (stream.eat("{")) return [null, "interpolation"];
			if (stream.match(/^(charset|document|font-face|import|(-(moz|ms|o|webkit)-)?keyframes|media|namespace|page|supports)\b/i, false)) return false;
			stream.eatWhile(/[\w\\\-]/);
			if (stream.match(/^\s*:/, false)) return ["def", "variable-definition"];
			return ["variableName", "variable"];
		},
		"&": function() {
			return ["atom", "atom"];
		}
	}
});
var gss = mkCSS({
	name: "gss",
	documentTypes: documentTypes$1,
	mediaTypes: mediaTypes$1,
	mediaFeatures: mediaFeatures$1,
	propertyKeywords: propertyKeywords$1,
	nonStandardPropertyKeywords: nonStandardPropertyKeywords$1,
	fontProperties: fontProperties$1,
	counterDescriptors,
	colorKeywords: colorKeywords$1,
	valueKeywords: valueKeywords$1,
	supportsAtComponent: true,
	tokenHooks: { "/": function(stream, state) {
		if (!stream.eat("*")) return false;
		state.tokenize = tokenCComment$2;
		return tokenCComment$2(stream, state);
	} }
});
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/cmake.js
var variable_regex$1 = /({)?[a-zA-Z0-9_]+(})?/;
function tokenString$24(stream, state) {
	var current, prev, found_var = false;
	while (!stream.eol() && (current = stream.next()) != state.pending) {
		if (current === "$" && prev != "\\" && state.pending == "\"") {
			found_var = true;
			break;
		}
		prev = current;
	}
	if (found_var) stream.backUp(1);
	if (current == state.pending) state.continueString = false;
	else state.continueString = true;
	return "string";
}
function tokenize$4(stream, state) {
	var ch = stream.next();
	if (ch === "$") {
		if (stream.match(variable_regex$1)) return "variableName.special";
		return "variable";
	}
	if (state.continueString) {
		stream.backUp(1);
		return tokenString$24(stream, state);
	}
	if (stream.match(/(\s+)?\w+\(/) || stream.match(/(\s+)?\w+\ \(/)) {
		stream.backUp(1);
		return "def";
	}
	if (ch == "#") {
		stream.skipToEnd();
		return "comment";
	}
	if (ch == "'" || ch == "\"") {
		state.pending = ch;
		return tokenString$24(stream, state);
	}
	if (ch == "(" || ch == ")") return "bracket";
	if (ch.match(/[0-9]/)) return "number";
	stream.eatWhile(/[\w-]/);
	return null;
}
var cmake = {
	name: "cmake",
	startState: function() {
		var state = {};
		state.inDefinition = false;
		state.inInclude = false;
		state.continueString = false;
		state.pending = false;
		return state;
	},
	token: function(stream, state) {
		if (stream.eatSpace()) return null;
		return tokenize$4(stream, state);
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/coffeescript.js
var ERRORCLASS$1 = "error";
function wordRegexp$14(words) {
	return new RegExp("^((" + words.join(")|(") + "))\\b");
}
var operators$5 = /^(?:->|=>|\+[+=]?|-[\-=]?|\*[\*=]?|\/[\/=]?|[=!]=|<[><]?=?|>>?=?|%=?|&=?|\|=?|\^=?|\~|!|\?|(or|and|\|\||&&|\?)=)/;
var delimiters$1 = /^(?:[()\[\]{},:`=;]|\.\.?\.?)/;
var identifiers$7 = /^[_A-Za-z$][_A-Za-z$0-9]*/;
var atProp = /^@[_A-Za-z$][_A-Za-z$0-9]*/;
var wordOperators$2 = wordRegexp$14([
	"and",
	"or",
	"not",
	"is",
	"isnt",
	"in",
	"instanceof",
	"typeof"
]);
var indentKeywords$1 = [
	"for",
	"while",
	"loop",
	"if",
	"unless",
	"else",
	"switch",
	"try",
	"catch",
	"finally",
	"class"
];
var keywords$33 = wordRegexp$14(indentKeywords$1.concat([
	"break",
	"by",
	"continue",
	"debugger",
	"delete",
	"do",
	"in",
	"of",
	"new",
	"return",
	"then",
	"this",
	"@",
	"throw",
	"when",
	"until",
	"extends"
]));
indentKeywords$1 = wordRegexp$14(indentKeywords$1);
var stringPrefixes$2 = /^('{3}|\"{3}|['\"])/;
var regexPrefixes = /^(\/{3}|\/)/;
var constants = wordRegexp$14([
	"Infinity",
	"NaN",
	"undefined",
	"null",
	"true",
	"false",
	"on",
	"off",
	"yes",
	"no"
]);
function tokenBase$39(stream, state) {
	if (stream.sol()) {
		if (state.scope.align === null) state.scope.align = false;
		var scopeOffset = state.scope.offset;
		if (stream.eatSpace()) {
			var lineOffset = stream.indentation();
			if (lineOffset > scopeOffset && state.scope.type == "coffee") return "indent";
			else if (lineOffset < scopeOffset) return "dedent";
			return null;
		} else if (scopeOffset > 0) dedent$1(stream, state);
	}
	if (stream.eatSpace()) return null;
	var ch = stream.peek();
	if (stream.match("####")) {
		stream.skipToEnd();
		return "comment";
	}
	if (stream.match("###")) {
		state.tokenize = longComment;
		return state.tokenize(stream, state);
	}
	if (ch === "#") {
		stream.skipToEnd();
		return "comment";
	}
	if (stream.match(/^-?[0-9\.]/, false)) {
		var floatLiteral = false;
		if (stream.match(/^-?\d*\.\d+(e[\+\-]?\d+)?/i)) floatLiteral = true;
		if (stream.match(/^-?\d+\.\d*/)) floatLiteral = true;
		if (stream.match(/^-?\.\d+/)) floatLiteral = true;
		if (floatLiteral) {
			if (stream.peek() == ".") stream.backUp(1);
			return "number";
		}
		var intLiteral = false;
		if (stream.match(/^-?0x[0-9a-f]+/i)) intLiteral = true;
		if (stream.match(/^-?[1-9]\d*(e[\+\-]?\d+)?/)) intLiteral = true;
		if (stream.match(/^-?0(?![\dx])/i)) intLiteral = true;
		if (intLiteral) return "number";
	}
	if (stream.match(stringPrefixes$2)) {
		state.tokenize = tokenFactory(stream.current(), false, "string");
		return state.tokenize(stream, state);
	}
	if (stream.match(regexPrefixes)) {
		if (stream.current() != "/" || stream.match(/^.*\//, false)) {
			state.tokenize = tokenFactory(stream.current(), true, "string.special");
			return state.tokenize(stream, state);
		} else stream.backUp(1);
	}
	if (stream.match(operators$5) || stream.match(wordOperators$2)) return "operator";
	if (stream.match(delimiters$1)) return "punctuation";
	if (stream.match(constants)) return "atom";
	if (stream.match(atProp) || state.prop && stream.match(identifiers$7)) return "property";
	if (stream.match(keywords$33)) return "keyword";
	if (stream.match(identifiers$7)) return "variable";
	stream.next();
	return ERRORCLASS$1;
}
function tokenFactory(delimiter, singleline, outclass) {
	return function(stream, state) {
		while (!stream.eol()) {
			stream.eatWhile(/[^'"\/\\]/);
			if (stream.eat("\\")) {
				stream.next();
				if (singleline && stream.eol()) return outclass;
			} else if (stream.match(delimiter)) {
				state.tokenize = tokenBase$39;
				return outclass;
			} else stream.eat(/['"\/]/);
		}
		if (singleline) state.tokenize = tokenBase$39;
		return outclass;
	};
}
function longComment(stream, state) {
	while (!stream.eol()) {
		stream.eatWhile(/[^#]/);
		if (stream.match("###")) {
			state.tokenize = tokenBase$39;
			break;
		}
		stream.eatWhile("#");
	}
	return "comment";
}
function indent$2(stream, state, type = "coffee") {
	var offset = 0, align = false, alignOffset = null;
	for (var scope = state.scope; scope; scope = scope.prev) if (scope.type === "coffee" || scope.type == "}") {
		offset = scope.offset + stream.indentUnit;
		break;
	}
	if (type !== "coffee") {
		align = null;
		alignOffset = stream.column() + stream.current().length;
	} else if (state.scope.align) state.scope.align = false;
	state.scope = {
		offset,
		type,
		prev: state.scope,
		align,
		alignOffset
	};
}
function dedent$1(stream, state) {
	if (!state.scope.prev) return;
	if (state.scope.type === "coffee") {
		var _indent = stream.indentation();
		var matched = false;
		for (var scope = state.scope; scope; scope = scope.prev) if (_indent === scope.offset) {
			matched = true;
			break;
		}
		if (!matched) return true;
		while (state.scope.prev && state.scope.offset !== _indent) state.scope = state.scope.prev;
		return false;
	} else {
		state.scope = state.scope.prev;
		return false;
	}
}
function tokenLexer$1(stream, state) {
	var style = state.tokenize(stream, state);
	var current = stream.current();
	if (current === "return") state.dedent = true;
	if ((current === "->" || current === "=>") && stream.eol() || style === "indent") indent$2(stream, state);
	var delimiter_index = "[({".indexOf(current);
	if (delimiter_index !== -1) indent$2(stream, state, "])}".slice(delimiter_index, delimiter_index + 1));
	if (indentKeywords$1.exec(current)) indent$2(stream, state);
	if (current == "then") dedent$1(stream, state);
	if (style === "dedent") {
		if (dedent$1(stream, state)) return ERRORCLASS$1;
	}
	delimiter_index = "])}".indexOf(current);
	if (delimiter_index !== -1) {
		while (state.scope.type == "coffee" && state.scope.prev) state.scope = state.scope.prev;
		if (state.scope.type == current) state.scope = state.scope.prev;
	}
	if (state.dedent && stream.eol()) {
		if (state.scope.type == "coffee" && state.scope.prev) state.scope = state.scope.prev;
		state.dedent = false;
	}
	return style == "indent" || style == "dedent" ? null : style;
}
var coffeeScript = {
	name: "coffeescript",
	startState: function() {
		return {
			tokenize: tokenBase$39,
			scope: {
				offset: 0,
				type: "coffee",
				prev: null,
				align: false
			},
			prop: false,
			dedent: 0
		};
	},
	token: function(stream, state) {
		var fillAlign = state.scope.align === null && state.scope;
		if (fillAlign && stream.sol()) fillAlign.align = false;
		var style = tokenLexer$1(stream, state);
		if (style && style != "comment") {
			if (fillAlign) fillAlign.align = true;
			state.prop = style == "punctuation" && stream.current() == ".";
		}
		return style;
	},
	indent: function(state, text) {
		if (state.tokenize != tokenBase$39) return 0;
		var scope = state.scope;
		var closer = text && "])}".indexOf(text.charAt(0)) > -1;
		if (closer) while (scope.type == "coffee" && scope.prev) scope = scope.prev;
		var closes = closer && scope.type === text.charAt(0);
		if (scope.align) return scope.alignOffset - (closes ? 1 : 0);
		else return (closes ? scope.prev : scope).offset;
	},
	languageData: { commentTokens: { line: "#" } }
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/commonlisp.js
var specialForm = /^(block|let*|return-from|catch|load-time-value|setq|eval-when|locally|symbol-macrolet|flet|macrolet|tagbody|function|multiple-value-call|the|go|multiple-value-prog1|throw|if|progn|unwind-protect|labels|progv|let|quote)$/;
var assumeBody = /^with|^def|^do|^prog|case$|^cond$|bind$|when$|unless$/;
var numLiteral = /^(?:[+\-]?(?:\d+|\d*\.\d+)(?:[efd][+\-]?\d+)?|[+\-]?\d+(?:\/[+\-]?\d+)?|#b[+\-]?[01]+|#o[+\-]?[0-7]+|#x[+\-]?[\da-f]+)/;
var symbol$2 = /[^\s'`,@()\[\]";]/;
var type$3;
function readSym(stream) {
	var ch;
	while (ch = stream.next()) if (ch == "\\") stream.next();
	else if (!symbol$2.test(ch)) {
		stream.backUp(1);
		break;
	}
	return stream.current();
}
function base(stream, state) {
	if (stream.eatSpace()) {
		type$3 = "ws";
		return null;
	}
	if (stream.match(numLiteral)) return "number";
	var ch = stream.next();
	if (ch == "\\") ch = stream.next();
	if (ch == "\"") return (state.tokenize = inString)(stream, state);
	else if (ch == "(") {
		type$3 = "open";
		return "bracket";
	} else if (ch == ")") {
		type$3 = "close";
		return "bracket";
	} else if (ch == ";") {
		stream.skipToEnd();
		type$3 = "ws";
		return "comment";
	} else if (/['`,@]/.test(ch)) return null;
	else if (ch == "|") {
		if (stream.skipTo("|")) {
			stream.next();
			return "variableName";
		} else {
			stream.skipToEnd();
			return "error";
		}
	} else if (ch == "#") {
		var ch = stream.next();
		if (ch == "(") {
			type$3 = "open";
			return "bracket";
		} else if (/[+\-=\.']/.test(ch)) return null;
		else if (/\d/.test(ch) && stream.match(/^\d*#/)) return null;
		else if (ch == "|") return (state.tokenize = inComment)(stream, state);
		else if (ch == ":") {
			readSym(stream);
			return "meta";
		} else if (ch == "\\") {
			stream.next();
			readSym(stream);
			return "string.special";
		} else return "error";
	} else {
		var name = readSym(stream);
		if (name == ".") return null;
		type$3 = "symbol";
		if (name == "nil" || name == "t" || name.charAt(0) == ":") return "atom";
		if (state.lastType == "open" && (specialForm.test(name) || assumeBody.test(name))) return "keyword";
		if (name.charAt(0) == "&") return "variableName.special";
		return "variableName";
	}
}
function inString(stream, state) {
	var escaped = false, next;
	while (next = stream.next()) {
		if (next == "\"" && !escaped) {
			state.tokenize = base;
			break;
		}
		escaped = !escaped && next == "\\";
	}
	return "string";
}
function inComment(stream, state) {
	var next, last;
	while (next = stream.next()) {
		if (next == "#" && last == "|") {
			state.tokenize = base;
			break;
		}
		last = next;
	}
	type$3 = "ws";
	return "comment";
}
var commonLisp = {
	name: "commonlisp",
	startState: function() {
		return {
			ctx: {
				prev: null,
				start: 0,
				indentTo: 0
			},
			lastType: null,
			tokenize: base
		};
	},
	token: function(stream, state) {
		if (stream.sol() && typeof state.ctx.indentTo != "number") state.ctx.indentTo = state.ctx.start + 1;
		type$3 = null;
		var style = state.tokenize(stream, state);
		if (type$3 != "ws") {
			if (state.ctx.indentTo == null) {
				if (type$3 == "symbol" && assumeBody.test(stream.current())) state.ctx.indentTo = state.ctx.start + stream.indentUnit;
				else state.ctx.indentTo = "next";
			} else if (state.ctx.indentTo == "next") state.ctx.indentTo = stream.column();
			state.lastType = type$3;
		}
		if (type$3 == "open") state.ctx = {
			prev: state.ctx,
			start: stream.column(),
			indentTo: null
		};
		else if (type$3 == "close") state.ctx = state.ctx.prev || state.ctx;
		return style;
	},
	indent: function(state) {
		var i = state.ctx.indentTo;
		return typeof i == "number" ? i : state.ctx.start + 1;
	},
	languageData: {
		commentTokens: {
			line: ";;",
			block: {
				open: "#|",
				close: "|#"
			}
		},
		closeBrackets: { brackets: [
			"(",
			"[",
			"{",
			"\""
		] }
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/cypher.js
var wordRegexp$13 = function(words) {
	return new RegExp("^(?:" + words.join("|") + ")$", "i");
};
var tokenBase$38 = function(stream) {
	curPunc$11 = null;
	var ch = stream.next();
	if (ch === "\"") {
		stream.match(/^.*?"/);
		return "string";
	}
	if (ch === "'") {
		stream.match(/^.*?'/);
		return "string";
	}
	if (/[{}\(\),\.;\[\]]/.test(ch)) {
		curPunc$11 = ch;
		return "punctuation";
	} else if (ch === "/" && stream.eat("/")) {
		stream.skipToEnd();
		return "comment";
	} else if (operatorChars$2.test(ch)) {
		stream.eatWhile(operatorChars$2);
		return null;
	} else {
		stream.eatWhile(/[_\w\d]/);
		if (stream.eat(":")) {
			stream.eatWhile(/[\w\d_\-]/);
			return "atom";
		}
		var word = stream.current();
		if (funcs.test(word)) return "builtin";
		if (preds.test(word)) return "def";
		if (keywords$32.test(word) || systemKeywords.test(word)) return "keyword";
		return "variable";
	}
};
var pushContext$11 = function(state, type, col) {
	return state.context = {
		prev: state.context,
		indent: state.indent,
		col,
		type
	};
};
var popContext$11 = function(state) {
	state.indent = state.context.indent;
	return state.context = state.context.prev;
};
var curPunc$11;
var funcs = wordRegexp$13([
	"abs",
	"acos",
	"allShortestPaths",
	"asin",
	"atan",
	"atan2",
	"avg",
	"ceil",
	"coalesce",
	"collect",
	"cos",
	"cot",
	"count",
	"degrees",
	"e",
	"endnode",
	"exp",
	"extract",
	"filter",
	"floor",
	"haversin",
	"head",
	"id",
	"keys",
	"labels",
	"last",
	"left",
	"length",
	"log",
	"log10",
	"lower",
	"ltrim",
	"max",
	"min",
	"node",
	"nodes",
	"percentileCont",
	"percentileDisc",
	"pi",
	"radians",
	"rand",
	"range",
	"reduce",
	"rel",
	"relationship",
	"relationships",
	"replace",
	"reverse",
	"right",
	"round",
	"rtrim",
	"shortestPath",
	"sign",
	"sin",
	"size",
	"split",
	"sqrt",
	"startnode",
	"stdev",
	"stdevp",
	"str",
	"substring",
	"sum",
	"tail",
	"tan",
	"timestamp",
	"toFloat",
	"toInt",
	"toString",
	"trim",
	"type",
	"upper"
]);
var preds = wordRegexp$13([
	"all",
	"and",
	"any",
	"contains",
	"exists",
	"has",
	"in",
	"none",
	"not",
	"or",
	"single",
	"xor"
]);
var keywords$32 = wordRegexp$13([
	"as",
	"asc",
	"ascending",
	"assert",
	"by",
	"case",
	"commit",
	"constraint",
	"create",
	"csv",
	"cypher",
	"delete",
	"desc",
	"descending",
	"detach",
	"distinct",
	"drop",
	"else",
	"end",
	"ends",
	"explain",
	"false",
	"fieldterminator",
	"foreach",
	"from",
	"headers",
	"in",
	"index",
	"is",
	"join",
	"limit",
	"load",
	"match",
	"merge",
	"null",
	"on",
	"optional",
	"order",
	"periodic",
	"profile",
	"remove",
	"return",
	"scan",
	"set",
	"skip",
	"start",
	"starts",
	"then",
	"true",
	"union",
	"unique",
	"unwind",
	"using",
	"when",
	"where",
	"with",
	"call",
	"yield"
]);
var systemKeywords = wordRegexp$13([
	"access",
	"active",
	"assign",
	"all",
	"alter",
	"as",
	"catalog",
	"change",
	"copy",
	"create",
	"constraint",
	"constraints",
	"current",
	"database",
	"databases",
	"dbms",
	"default",
	"deny",
	"drop",
	"element",
	"elements",
	"exists",
	"from",
	"grant",
	"graph",
	"graphs",
	"if",
	"index",
	"indexes",
	"label",
	"labels",
	"management",
	"match",
	"name",
	"names",
	"new",
	"node",
	"nodes",
	"not",
	"of",
	"on",
	"or",
	"password",
	"populated",
	"privileges",
	"property",
	"read",
	"relationship",
	"relationships",
	"remove",
	"replace",
	"required",
	"revoke",
	"role",
	"roles",
	"set",
	"show",
	"start",
	"status",
	"stop",
	"suspended",
	"to",
	"traverse",
	"type",
	"types",
	"user",
	"users",
	"with",
	"write"
]);
var operatorChars$2 = /[*+\-<>=&|~%^]/;
var cypher = {
	name: "cypher",
	startState: function() {
		return {
			tokenize: tokenBase$38,
			context: null,
			indent: 0,
			col: 0
		};
	},
	token: function(stream, state) {
		if (stream.sol()) {
			if (state.context && state.context.align == null) state.context.align = false;
			state.indent = stream.indentation();
		}
		if (stream.eatSpace()) return null;
		var style = state.tokenize(stream, state);
		if (style !== "comment" && state.context && state.context.align == null && state.context.type !== "pattern") state.context.align = true;
		if (curPunc$11 === "(") pushContext$11(state, ")", stream.column());
		else if (curPunc$11 === "[") pushContext$11(state, "]", stream.column());
		else if (curPunc$11 === "{") pushContext$11(state, "}", stream.column());
		else if (/[\]\}\)]/.test(curPunc$11)) {
			while (state.context && state.context.type === "pattern") popContext$11(state);
			if (state.context && curPunc$11 === state.context.type) popContext$11(state);
		} else if (curPunc$11 === "." && state.context && state.context.type === "pattern") popContext$11(state);
		else if (/atom|string|variable/.test(style) && state.context) {
			if (/[\}\]]/.test(state.context.type)) pushContext$11(state, "pattern", stream.column());
			else if (state.context.type === "pattern" && !state.context.align) {
				state.context.align = true;
				state.context.col = stream.column();
			}
		}
		return style;
	},
	indent: function(state, textAfter, cx) {
		var firstChar = textAfter && textAfter.charAt(0);
		var context = state.context;
		if (/[\]\}]/.test(firstChar)) while (context && context.type === "pattern") context = context.prev;
		var closing = context && firstChar === context.type;
		if (!context) return 0;
		if (context.type === "keywords") return null;
		if (context.align) return context.col + (closing ? 0 : 1);
		return context.indent + (closing ? 0 : cx.unit);
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/python.js
function wordRegexp$12(words) {
	return new RegExp("^((" + words.join(")|(") + "))\\b");
}
var wordOperators$1 = wordRegexp$12([
	"and",
	"or",
	"not",
	"is"
]);
var commonKeywords$4 = [
	"as",
	"assert",
	"break",
	"class",
	"continue",
	"def",
	"del",
	"elif",
	"else",
	"except",
	"finally",
	"for",
	"from",
	"global",
	"if",
	"import",
	"lambda",
	"pass",
	"raise",
	"return",
	"try",
	"while",
	"with",
	"yield",
	"in",
	"False",
	"True"
];
var commonBuiltins$1 = [
	"abs",
	"all",
	"any",
	"bin",
	"bool",
	"bytearray",
	"callable",
	"chr",
	"classmethod",
	"compile",
	"complex",
	"delattr",
	"dict",
	"dir",
	"divmod",
	"enumerate",
	"eval",
	"filter",
	"float",
	"format",
	"frozenset",
	"getattr",
	"globals",
	"hasattr",
	"hash",
	"help",
	"hex",
	"id",
	"input",
	"int",
	"isinstance",
	"issubclass",
	"iter",
	"len",
	"list",
	"locals",
	"map",
	"max",
	"memoryview",
	"min",
	"next",
	"object",
	"oct",
	"open",
	"ord",
	"pow",
	"property",
	"range",
	"repr",
	"reversed",
	"round",
	"set",
	"setattr",
	"slice",
	"sorted",
	"staticmethod",
	"str",
	"sum",
	"super",
	"tuple",
	"type",
	"vars",
	"zip",
	"__import__",
	"NotImplemented",
	"Ellipsis",
	"__debug__"
];
function top(state) {
	return state.scopes[state.scopes.length - 1];
}
function mkPython(parserConf) {
	var ERRORCLASS = "error";
	var delimiters = parserConf.delimiters || parserConf.singleDelimiters || /^[\(\)\[\]\{\}@,:`=;\.\\]/;
	var operators = [
		parserConf.singleOperators,
		parserConf.doubleOperators,
		parserConf.doubleDelimiters,
		parserConf.tripleDelimiters,
		parserConf.operators || /^([-+*/%\/&|^]=?|[<>=]+|\/\/=?|\*\*=?|!=|[~!@]|\.\.\.)/
	];
	for (var i = 0; i < operators.length; i++) if (!operators[i]) operators.splice(i--, 1);
	var hangingIndent = parserConf.hangingIndent;
	var myKeywords = commonKeywords$4, myBuiltins = commonBuiltins$1;
	if (parserConf.extra_keywords != void 0) myKeywords = myKeywords.concat(parserConf.extra_keywords);
	if (parserConf.extra_builtins != void 0) myBuiltins = myBuiltins.concat(parserConf.extra_builtins);
	var py3 = !(parserConf.version && Number(parserConf.version) < 3);
	if (py3) {
		var identifiers = parserConf.identifiers || /^[_A-Za-z\u00A1-\uFFFF][_A-Za-z0-9\u00A1-\uFFFF]*/;
		myKeywords = myKeywords.concat([
			"nonlocal",
			"None",
			"aiter",
			"anext",
			"async",
			"await",
			"breakpoint",
			"match",
			"case"
		]);
		myBuiltins = myBuiltins.concat([
			"ascii",
			"bytes",
			"exec",
			"print"
		]);
		var stringPrefixes = /* @__PURE__ */ new RegExp("^(([rbuf]|(br)|(rb)|(fr)|(rf))?('{3}|\"{3}|['\"]))", "i");
	} else {
		var identifiers = parserConf.identifiers || /^[_A-Za-z][_A-Za-z0-9]*/;
		myKeywords = myKeywords.concat(["exec", "print"]);
		myBuiltins = myBuiltins.concat([
			"apply",
			"basestring",
			"buffer",
			"cmp",
			"coerce",
			"execfile",
			"file",
			"intern",
			"long",
			"raw_input",
			"reduce",
			"reload",
			"unichr",
			"unicode",
			"xrange",
			"None"
		]);
		var stringPrefixes = /* @__PURE__ */ new RegExp("^(([rubf]|(ur)|(br))?('{3}|\"{3}|['\"]))", "i");
	}
	var keywords = wordRegexp$12(myKeywords);
	var builtins = wordRegexp$12(myBuiltins);
	function tokenBase(stream, state) {
		var sol = stream.sol() && state.lastToken != "\\";
		if (sol) state.indent = stream.indentation();
		if (sol && top(state).type == "py") {
			var scopeOffset = top(state).offset;
			if (stream.eatSpace()) {
				var lineOffset = stream.indentation();
				if (lineOffset > scopeOffset) pushPyScope(stream, state);
				else if (lineOffset < scopeOffset && dedent(stream, state) && stream.peek() != "#") state.errorToken = true;
				return null;
			} else {
				var style = tokenBaseInner(stream, state);
				if (scopeOffset > 0 && dedent(stream, state)) style += " error";
				return style;
			}
		}
		return tokenBaseInner(stream, state);
	}
	function tokenBaseInner(stream, state, inFormat) {
		if (stream.eatSpace()) return null;
		if (!inFormat && stream.match(/^#.*/)) return "comment";
		if (stream.match(/^[0-9\.]/, false)) {
			var floatLiteral = false;
			if (stream.match(/^[\d_]*\.\d+(e[\+\-]?\d+)?/i)) floatLiteral = true;
			if (stream.match(/^[\d_]+\.\d*/)) floatLiteral = true;
			if (stream.match(/^\.\d+/)) floatLiteral = true;
			if (floatLiteral) {
				stream.eat(/J/i);
				return "number";
			}
			var intLiteral = false;
			if (stream.match(/^0x[0-9a-f_]+/i)) intLiteral = true;
			if (stream.match(/^0b[01_]+/i)) intLiteral = true;
			if (stream.match(/^0o[0-7_]+/i)) intLiteral = true;
			if (stream.match(/^[1-9][\d_]*(e[\+\-]?[\d_]+)?/)) {
				stream.eat(/J/i);
				intLiteral = true;
			}
			if (stream.match(/^0(?![\dx])/i)) intLiteral = true;
			if (intLiteral) {
				stream.eat(/L/i);
				return "number";
			}
		}
		if (stream.match(stringPrefixes)) {
			if (!(stream.current().toLowerCase().indexOf("f") !== -1)) {
				state.tokenize = tokenStringFactory(stream.current(), state.tokenize);
				return state.tokenize(stream, state);
			} else {
				state.tokenize = formatStringFactory(stream.current(), state.tokenize);
				return state.tokenize(stream, state);
			}
		}
		for (var i = 0; i < operators.length; i++) if (stream.match(operators[i])) return "operator";
		if (stream.match(delimiters)) return "punctuation";
		if (state.lastToken == "." && stream.match(identifiers)) return "property";
		if (stream.match(keywords) || stream.match(wordOperators$1)) return "keyword";
		if (stream.match(builtins)) return "builtin";
		if (stream.match(/^(self|cls)\b/)) return "self";
		if (stream.match(identifiers)) {
			if (state.lastToken == "def" || state.lastToken == "class") return "def";
			return "variable";
		}
		stream.next();
		return inFormat ? null : ERRORCLASS;
	}
	function formatStringFactory(delimiter, tokenOuter) {
		while ("rubf".indexOf(delimiter.charAt(0).toLowerCase()) >= 0) delimiter = delimiter.substr(1);
		var singleline = delimiter.length == 1;
		var OUTCLASS = "string";
		function tokenNestedExpr(depth) {
			return function(stream, state) {
				var inner = tokenBaseInner(stream, state, true);
				if (inner == "punctuation") {
					if (stream.current() == "{") state.tokenize = tokenNestedExpr(depth + 1);
					else if (stream.current() == "}") {
						if (depth > 1) state.tokenize = tokenNestedExpr(depth - 1);
						else state.tokenize = tokenString;
					}
				}
				return inner;
			};
		}
		function tokenString(stream, state) {
			while (!stream.eol()) {
				stream.eatWhile(/[^'"\{\}\\]/);
				if (stream.eat("\\")) {
					stream.next();
					if (singleline && stream.eol()) return OUTCLASS;
				} else if (stream.match(delimiter)) {
					state.tokenize = tokenOuter;
					return OUTCLASS;
				} else if (stream.match("{{")) return OUTCLASS;
				else if (stream.match("{", false)) {
					state.tokenize = tokenNestedExpr(0);
					if (stream.current()) return OUTCLASS;
					else return state.tokenize(stream, state);
				} else if (stream.match("}}")) return OUTCLASS;
				else if (stream.match("}")) return ERRORCLASS;
				else stream.eat(/['"]/);
			}
			if (singleline) {
				if (parserConf.singleLineStringErrors) return ERRORCLASS;
				else state.tokenize = tokenOuter;
			}
			return OUTCLASS;
		}
		tokenString.isString = true;
		return tokenString;
	}
	function tokenStringFactory(delimiter, tokenOuter) {
		while ("rubf".indexOf(delimiter.charAt(0).toLowerCase()) >= 0) delimiter = delimiter.substr(1);
		var singleline = delimiter.length == 1;
		var OUTCLASS = "string";
		function tokenString(stream, state) {
			while (!stream.eol()) {
				stream.eatWhile(/[^'"\\]/);
				if (stream.eat("\\")) {
					stream.next();
					if (singleline && stream.eol()) return OUTCLASS;
				} else if (stream.match(delimiter)) {
					state.tokenize = tokenOuter;
					return OUTCLASS;
				} else stream.eat(/['"]/);
			}
			if (singleline) {
				if (parserConf.singleLineStringErrors) return ERRORCLASS;
				else state.tokenize = tokenOuter;
			}
			return OUTCLASS;
		}
		tokenString.isString = true;
		return tokenString;
	}
	function pushPyScope(stream, state) {
		while (top(state).type != "py") state.scopes.pop();
		state.scopes.push({
			offset: top(state).offset + stream.indentUnit,
			type: "py",
			align: null
		});
	}
	function pushBracketScope(stream, state, type) {
		var align = stream.match(/^[\s\[\{\(]*(?:#|$)/, false) ? null : stream.column() + 1;
		state.scopes.push({
			offset: state.indent + (hangingIndent || stream.indentUnit),
			type,
			align
		});
	}
	function dedent(stream, state) {
		var indented = stream.indentation();
		while (state.scopes.length > 1 && top(state).offset > indented) {
			if (top(state).type != "py") return true;
			state.scopes.pop();
		}
		return top(state).offset != indented;
	}
	function tokenLexer(stream, state) {
		if (stream.sol()) {
			state.beginningOfLine = true;
			state.dedent = false;
		}
		var style = state.tokenize(stream, state);
		var current = stream.current();
		if (state.beginningOfLine && current == "@") return stream.match(identifiers, false) ? "meta" : py3 ? "operator" : ERRORCLASS;
		if (/\S/.test(current)) state.beginningOfLine = false;
		if ((style == "variable" || style == "builtin") && state.lastToken == "meta") style = "meta";
		if (current == "pass" || current == "return") state.dedent = true;
		if (current == "lambda") state.lambda = true;
		if (current == ":" && !state.lambda && top(state).type == "py" && stream.match(/^\s*(?:#|$)/, false)) pushPyScope(stream, state);
		if (current.length == 1 && !/string|comment/.test(style)) {
			var delimiter_index = "[({".indexOf(current);
			if (delimiter_index != -1) pushBracketScope(stream, state, "])}".slice(delimiter_index, delimiter_index + 1));
			delimiter_index = "])}".indexOf(current);
			if (delimiter_index != -1) {
				if (top(state).type == current) state.indent = state.scopes.pop().offset - (hangingIndent || stream.indentUnit);
				else return ERRORCLASS;
			}
		}
		if (state.dedent && stream.eol() && top(state).type == "py" && state.scopes.length > 1) state.scopes.pop();
		return style;
	}
	return {
		name: "python",
		startState: function() {
			return {
				tokenize: tokenBase,
				scopes: [{
					offset: 0,
					type: "py",
					align: null
				}],
				indent: 0,
				lastToken: null,
				lambda: false,
				dedent: 0
			};
		},
		token: function(stream, state) {
			var addErr = state.errorToken;
			if (addErr) state.errorToken = false;
			var style = tokenLexer(stream, state);
			if (style && style != "comment") state.lastToken = style == "keyword" || style == "punctuation" ? stream.current() : style;
			if (style == "punctuation") style = null;
			if (stream.eol() && state.lambda) state.lambda = false;
			return addErr ? ERRORCLASS : style;
		},
		indent: function(state, textAfter, cx) {
			if (state.tokenize != tokenBase) return state.tokenize.isString ? null : 0;
			var scope = top(state);
			var closing = scope.type == textAfter.charAt(0) || scope.type == "py" && !state.dedent && /^(else:|elif |except |finally:)/.test(textAfter);
			if (scope.align != null) return scope.align - (closing ? 1 : 0);
			else return scope.offset - (closing ? hangingIndent || cx.unit : 0);
		},
		languageData: {
			autocomplete: commonKeywords$4.concat(commonBuiltins$1).concat(["exec", "print"]),
			indentOnInput: /^\s*([\}\]\)]|else:|elif |except |finally:)$/,
			commentTokens: { line: "#" },
			closeBrackets: { brackets: [
				"(",
				"[",
				"{",
				"'",
				"\"",
				"'''",
				"\"\"\""
			] }
		}
	};
}
var words$17 = function(str) {
	return str.split(" ");
};
mkPython({});
var cython = mkPython({ extra_keywords: words$17("by cdef cimport cpdef ctypedef enum except extern gil include nogil property public readonly struct union DEF IF ELIF ELSE") });
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/crystal.js
function wordRegExp(words, end) {
	return new RegExp((end ? "" : "^") + "(?:" + words.join("|") + ")" + (end ? "$" : "\\b"));
}
function chain$9(tokenize, stream, state) {
	state.tokenize.push(tokenize);
	return tokenize(stream, state);
}
var operators$4 = /^(?:[-+/%|&^]|\*\*?|[<>]{2})/;
var conditionalOperators = /^(?:[=!]~|===|<=>|[<>=!]=?|[|&]{2}|~)/;
var indexingOperators = /^(?:\[\][?=]?)/;
var anotherOperators = /^(?:\.(?:\.{2})?|->|[?:])/;
var idents = /^[a-z_\u009F-\uFFFF][a-zA-Z0-9_\u009F-\uFFFF]*/;
var types$5 = /^[A-Z_\u009F-\uFFFF][a-zA-Z0-9_\u009F-\uFFFF]*/;
var keywords$31 = wordRegExp([
	"abstract",
	"alias",
	"as",
	"asm",
	"begin",
	"break",
	"case",
	"class",
	"def",
	"do",
	"else",
	"elsif",
	"end",
	"ensure",
	"enum",
	"extend",
	"for",
	"fun",
	"if",
	"include",
	"instance_sizeof",
	"lib",
	"macro",
	"module",
	"next",
	"of",
	"out",
	"pointerof",
	"private",
	"protected",
	"rescue",
	"return",
	"require",
	"select",
	"sizeof",
	"struct",
	"super",
	"then",
	"type",
	"typeof",
	"uninitialized",
	"union",
	"unless",
	"until",
	"when",
	"while",
	"with",
	"yield",
	"__DIR__",
	"__END_LINE__",
	"__FILE__",
	"__LINE__"
]);
var atomWords = wordRegExp([
	"true",
	"false",
	"nil",
	"self"
]);
var indentKeywords = wordRegExp([
	"def",
	"fun",
	"macro",
	"class",
	"module",
	"struct",
	"lib",
	"enum",
	"union",
	"do",
	"for"
]);
var indentExpressionKeywords = wordRegExp([
	"if",
	"unless",
	"case",
	"while",
	"until",
	"begin",
	"then"
]);
var dedentKeywordsArray = [
	"end",
	"else",
	"elsif",
	"rescue",
	"ensure"
];
var dedentKeywords = wordRegExp(dedentKeywordsArray);
var dedentPunctualsArray = [
	"\\)",
	"\\}",
	"\\]"
];
var dedentPunctuals = new RegExp("^(?:" + dedentPunctualsArray.join("|") + ")$");
var nextTokenizer = {
	"def": tokenFollowIdent,
	"fun": tokenFollowIdent,
	"macro": tokenMacroDef,
	"class": tokenFollowType,
	"module": tokenFollowType,
	"struct": tokenFollowType,
	"lib": tokenFollowType,
	"enum": tokenFollowType,
	"union": tokenFollowType
};
var matching = {
	"[": "]",
	"{": "}",
	"(": ")",
	"<": ">"
};
function tokenBase$37(stream, state) {
	if (stream.eatSpace()) return null;
	if (state.lastToken != "\\" && stream.match("{%", false)) return chain$9(tokenMacro("%", "%"), stream, state);
	if (state.lastToken != "\\" && stream.match("{{", false)) return chain$9(tokenMacro("{", "}"), stream, state);
	if (stream.peek() == "#") {
		stream.skipToEnd();
		return "comment";
	}
	var matched;
	if (stream.match(idents)) {
		stream.eat(/[?!]/);
		matched = stream.current();
		if (stream.eat(":")) return "atom";
		else if (state.lastToken == ".") return "property";
		else if (keywords$31.test(matched)) {
			if (indentKeywords.test(matched)) {
				if (!(matched == "fun" && state.blocks.indexOf("lib") >= 0) && !(matched == "def" && state.lastToken == "abstract")) {
					state.blocks.push(matched);
					state.currentIndent += 1;
				}
			} else if ((state.lastStyle == "operator" || !state.lastStyle) && indentExpressionKeywords.test(matched)) {
				state.blocks.push(matched);
				state.currentIndent += 1;
			} else if (matched == "end") {
				state.blocks.pop();
				state.currentIndent -= 1;
			}
			if (nextTokenizer.hasOwnProperty(matched)) state.tokenize.push(nextTokenizer[matched]);
			return "keyword";
		} else if (atomWords.test(matched)) return "atom";
		return "variable";
	}
	if (stream.eat("@")) {
		if (stream.peek() == "[") return chain$9(tokenNest("[", "]", "meta"), stream, state);
		stream.eat("@");
		stream.match(idents) || stream.match(types$5);
		return "propertyName";
	}
	if (stream.match(types$5)) return "tag";
	if (stream.eat(":")) {
		if (stream.eat("\"")) return chain$9(tokenQuote("\"", "atom", false), stream, state);
		else if (stream.match(idents) || stream.match(types$5) || stream.match(operators$4) || stream.match(conditionalOperators) || stream.match(indexingOperators)) return "atom";
		stream.eat(":");
		return "operator";
	}
	if (stream.eat("\"")) return chain$9(tokenQuote("\"", "string", true), stream, state);
	if (stream.peek() == "%") {
		var style = "string";
		var embed = true;
		var delim;
		if (stream.match("%r")) {
			style = "string.special";
			delim = stream.next();
		} else if (stream.match("%w")) {
			embed = false;
			delim = stream.next();
		} else if (stream.match("%q")) {
			embed = false;
			delim = stream.next();
		} else if (delim = stream.match(/^%([^\w\s=])/)) delim = delim[1];
		else if (stream.match(/^%[a-zA-Z_\u009F-\uFFFF][\w\u009F-\uFFFF]*/)) return "meta";
		else if (stream.eat("%")) return "operator";
		if (matching.hasOwnProperty(delim)) delim = matching[delim];
		return chain$9(tokenQuote(delim, style, embed), stream, state);
	}
	if (matched = stream.match(/^<<-('?)([A-Z]\w*)\1/)) return chain$9(tokenHereDoc(matched[2], !matched[1]), stream, state);
	if (stream.eat("'")) {
		stream.match(/^(?:[^']|\\(?:[befnrtv0'"]|[0-7]{3}|u(?:[0-9a-fA-F]{4}|\{[0-9a-fA-F]{1,6}\})))/);
		stream.eat("'");
		return "atom";
	}
	if (stream.eat("0")) {
		if (stream.eat("x")) stream.match(/^[0-9a-fA-F_]+/);
		else if (stream.eat("o")) stream.match(/^[0-7_]+/);
		else if (stream.eat("b")) stream.match(/^[01_]+/);
		return "number";
	}
	if (stream.eat(/^\d/)) {
		stream.match(/^[\d_]*(?:\.[\d_]+)?(?:[eE][+-]?\d+)?/);
		return "number";
	}
	if (stream.match(operators$4)) {
		stream.eat("=");
		return "operator";
	}
	if (stream.match(conditionalOperators) || stream.match(anotherOperators)) return "operator";
	if (matched = stream.match(/[({[]/, false)) {
		matched = matched[0];
		return chain$9(tokenNest(matched, matching[matched], null), stream, state);
	}
	if (stream.eat("\\")) {
		stream.next();
		return "meta";
	}
	stream.next();
	return null;
}
function tokenNest(begin, end, style, started) {
	return function(stream, state) {
		if (!started && stream.match(begin)) {
			state.tokenize[state.tokenize.length - 1] = tokenNest(begin, end, style, true);
			state.currentIndent += 1;
			return style;
		}
		var nextStyle = tokenBase$37(stream, state);
		if (stream.current() === end) {
			state.tokenize.pop();
			state.currentIndent -= 1;
			nextStyle = style;
		}
		return nextStyle;
	};
}
function tokenMacro(begin, end, started) {
	return function(stream, state) {
		if (!started && stream.match("{" + begin)) {
			state.currentIndent += 1;
			state.tokenize[state.tokenize.length - 1] = tokenMacro(begin, end, true);
			return "meta";
		}
		if (stream.match(end + "}")) {
			state.currentIndent -= 1;
			state.tokenize.pop();
			return "meta";
		}
		return tokenBase$37(stream, state);
	};
}
function tokenMacroDef(stream, state) {
	if (stream.eatSpace()) return null;
	var matched;
	if (matched = stream.match(idents)) {
		if (matched == "def") return "keyword";
		stream.eat(/[?!]/);
	}
	state.tokenize.pop();
	return "def";
}
function tokenFollowIdent(stream, state) {
	if (stream.eatSpace()) return null;
	if (stream.match(idents)) stream.eat(/[!?]/);
	else stream.match(operators$4) || stream.match(conditionalOperators) || stream.match(indexingOperators);
	state.tokenize.pop();
	return "def";
}
function tokenFollowType(stream, state) {
	if (stream.eatSpace()) return null;
	stream.match(types$5);
	state.tokenize.pop();
	return "def";
}
function tokenQuote(end, style, embed) {
	return function(stream, state) {
		var escaped = false;
		while (stream.peek()) if (!escaped) {
			if (stream.match("{%", false)) {
				state.tokenize.push(tokenMacro("%", "%"));
				return style;
			}
			if (stream.match("{{", false)) {
				state.tokenize.push(tokenMacro("{", "}"));
				return style;
			}
			if (embed && stream.match("#{", false)) {
				state.tokenize.push(tokenNest("#{", "}", "meta"));
				return style;
			}
			var ch = stream.next();
			if (ch == end) {
				state.tokenize.pop();
				return style;
			}
			escaped = embed && ch == "\\";
		} else {
			stream.next();
			escaped = false;
		}
		return style;
	};
}
function tokenHereDoc(phrase, embed) {
	return function(stream, state) {
		if (stream.sol()) {
			stream.eatSpace();
			if (stream.match(phrase)) {
				state.tokenize.pop();
				return "string";
			}
		}
		var escaped = false;
		while (stream.peek()) if (!escaped) {
			if (stream.match("{%", false)) {
				state.tokenize.push(tokenMacro("%", "%"));
				return "string";
			}
			if (stream.match("{{", false)) {
				state.tokenize.push(tokenMacro("{", "}"));
				return "string";
			}
			if (embed && stream.match("#{", false)) {
				state.tokenize.push(tokenNest("#{", "}", "meta"));
				return "string";
			}
			escaped = stream.next() == "\\" && embed;
		} else {
			stream.next();
			escaped = false;
		}
		return "string";
	};
}
var crystal = {
	name: "crystal",
	startState: function() {
		return {
			tokenize: [tokenBase$37],
			currentIndent: 0,
			lastToken: null,
			lastStyle: null,
			blocks: []
		};
	},
	token: function(stream, state) {
		var style = state.tokenize[state.tokenize.length - 1](stream, state);
		var token = stream.current();
		if (style && style != "comment") {
			state.lastToken = token;
			state.lastStyle = style;
		}
		return style;
	},
	indent: function(state, textAfter, cx) {
		textAfter = textAfter.replace(/^\s*(?:\{%)?\s*|\s*(?:%\})?\s*$/g, "");
		if (dedentKeywords.test(textAfter) || dedentPunctuals.test(textAfter)) return cx.unit * (state.currentIndent - 1);
		return cx.unit * state.currentIndent;
	},
	languageData: {
		indentOnInput: wordRegExp(dedentPunctualsArray.concat(dedentKeywordsArray), true),
		commentTokens: { line: "#" }
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/d.js
function words$16(str) {
	var obj = {}, words = str.split(" ");
	for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
	return obj;
}
var blockKeywordsStr = "body catch class do else enum for foreach foreach_reverse if in interface mixin out scope struct switch try union unittest version while with";
var parserConfig$2 = {
	keywords: words$16("abstract alias align asm assert auto break case cast cdouble cent cfloat const continue debug default delegate delete deprecated export extern final finally function goto immutable import inout invariant is lazy macro module new nothrow override package pragma private protected public pure ref return shared short static super synchronized template this throw typedef typeid typeof volatile __FILE__ __LINE__ __gshared __traits __vector __parameters " + blockKeywordsStr),
	blockKeywords: words$16(blockKeywordsStr),
	builtin: words$16("bool byte char creal dchar double float idouble ifloat int ireal long real short ubyte ucent uint ulong ushort wchar wstring void size_t sizediff_t"),
	atoms: words$16("exit failure success true false null"),
	hooks: { "@": function(stream, _state) {
		stream.eatWhile(/[\w\$_]/);
		return "meta";
	} }
};
var statementIndentUnit = parserConfig$2.statementIndentUnit;
var keywords$30 = parserConfig$2.keywords;
var builtin$3 = parserConfig$2.builtin;
var blockKeywords$4 = parserConfig$2.blockKeywords;
var atoms$10 = parserConfig$2.atoms;
var hooks$2 = parserConfig$2.hooks;
var multiLineStrings$3 = parserConfig$2.multiLineStrings;
var isOperatorChar$11 = /[+\-*&%=<>!?|\/]/;
var curPunc$10;
function tokenBase$36(stream, state) {
	var ch = stream.next();
	if (hooks$2[ch]) {
		var result = hooks$2[ch](stream, state);
		if (result !== false) return result;
	}
	if (ch == "\"" || ch == "'" || ch == "`") {
		state.tokenize = tokenString$23(ch);
		return state.tokenize(stream, state);
	}
	if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
		curPunc$10 = ch;
		return null;
	}
	if (/\d/.test(ch)) {
		stream.eatWhile(/[\w\.]/);
		return "number";
	}
	if (ch == "/") {
		if (stream.eat("+")) {
			state.tokenize = tokenNestedComment;
			return tokenNestedComment(stream, state);
		}
		if (stream.eat("*")) {
			state.tokenize = tokenComment$17;
			return tokenComment$17(stream, state);
		}
		if (stream.eat("/")) {
			stream.skipToEnd();
			return "comment";
		}
	}
	if (isOperatorChar$11.test(ch)) {
		stream.eatWhile(isOperatorChar$11);
		return "operator";
	}
	stream.eatWhile(/[\w\$_\xa1-\uffff]/);
	var cur = stream.current();
	if (keywords$30.propertyIsEnumerable(cur)) {
		if (blockKeywords$4.propertyIsEnumerable(cur)) curPunc$10 = "newstatement";
		return "keyword";
	}
	if (builtin$3.propertyIsEnumerable(cur)) {
		if (blockKeywords$4.propertyIsEnumerable(cur)) curPunc$10 = "newstatement";
		return "builtin";
	}
	if (atoms$10.propertyIsEnumerable(cur)) return "atom";
	return "variable";
}
function tokenString$23(quote) {
	return function(stream, state) {
		var escaped = false, next, end = false;
		while ((next = stream.next()) != null) {
			if (next == quote && !escaped) {
				end = true;
				break;
			}
			escaped = !escaped && next == "\\";
		}
		if (end || !(escaped || multiLineStrings$3)) state.tokenize = null;
		return "string";
	};
}
function tokenComment$17(stream, state) {
	var maybeEnd = false, ch;
	while (ch = stream.next()) {
		if (ch == "/" && maybeEnd) {
			state.tokenize = null;
			break;
		}
		maybeEnd = ch == "*";
	}
	return "comment";
}
function tokenNestedComment(stream, state) {
	var maybeEnd = false, ch;
	while (ch = stream.next()) {
		if (ch == "/" && maybeEnd) {
			state.tokenize = null;
			break;
		}
		maybeEnd = ch == "+";
	}
	return "comment";
}
function Context$8(indented, column, type, align, prev) {
	this.indented = indented;
	this.column = column;
	this.type = type;
	this.align = align;
	this.prev = prev;
}
function pushContext$10(state, col, type) {
	var indent = state.indented;
	if (state.context && state.context.type == "statement") indent = state.context.indented;
	return state.context = new Context$8(indent, col, type, null, state.context);
}
function popContext$10(state) {
	var t = state.context.type;
	if (t == ")" || t == "]" || t == "}") state.indented = state.context.indented;
	return state.context = state.context.prev;
}
var d$1 = {
	name: "d",
	startState: function(indentUnit) {
		return {
			tokenize: null,
			context: new Context$8(-indentUnit, 0, "top", false),
			indented: 0,
			startOfLine: true
		};
	},
	token: function(stream, state) {
		var ctx = state.context;
		if (stream.sol()) {
			if (ctx.align == null) ctx.align = false;
			state.indented = stream.indentation();
			state.startOfLine = true;
		}
		if (stream.eatSpace()) return null;
		curPunc$10 = null;
		var style = (state.tokenize || tokenBase$36)(stream, state);
		if (style == "comment" || style == "meta") return style;
		if (ctx.align == null) ctx.align = true;
		if ((curPunc$10 == ";" || curPunc$10 == ":" || curPunc$10 == ",") && ctx.type == "statement") popContext$10(state);
		else if (curPunc$10 == "{") pushContext$10(state, stream.column(), "}");
		else if (curPunc$10 == "[") pushContext$10(state, stream.column(), "]");
		else if (curPunc$10 == "(") pushContext$10(state, stream.column(), ")");
		else if (curPunc$10 == "}") {
			while (ctx.type == "statement") ctx = popContext$10(state);
			if (ctx.type == "}") ctx = popContext$10(state);
			while (ctx.type == "statement") ctx = popContext$10(state);
		} else if (curPunc$10 == ctx.type) popContext$10(state);
		else if ((ctx.type == "}" || ctx.type == "top") && curPunc$10 != ";" || ctx.type == "statement" && curPunc$10 == "newstatement") pushContext$10(state, stream.column(), "statement");
		state.startOfLine = false;
		return style;
	},
	indent: function(state, textAfter, cx) {
		if (state.tokenize != tokenBase$36 && state.tokenize != null) return null;
		var ctx = state.context, firstChar = textAfter && textAfter.charAt(0);
		if (ctx.type == "statement" && firstChar == "}") ctx = ctx.prev;
		var closing = firstChar == ctx.type;
		if (ctx.type == "statement") return ctx.indented + (firstChar == "{" ? 0 : statementIndentUnit || cx.unit);
		else if (ctx.align) return ctx.column + (closing ? 0 : 1);
		else return ctx.indented + (closing ? 0 : cx.unit);
	},
	languageData: {
		indentOnInput: /^\s*[{}]$/,
		commentTokens: {
			line: "//",
			block: {
				open: "/*",
				close: "*/"
			}
		}
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/diff.js
var TOKEN_NAMES = {
	"+": "inserted",
	"-": "deleted",
	"@": "meta"
};
var diff = {
	name: "diff",
	token: function(stream) {
		var tw_pos = stream.string.search(/[\t ]+?$/);
		if (!stream.sol() || tw_pos === 0) {
			stream.skipToEnd();
			return ("error " + (TOKEN_NAMES[stream.string.charAt(0)] || "")).replace(/ $/, "");
		}
		var token_name = TOKEN_NAMES[stream.peek()] || stream.skipToEnd();
		if (tw_pos === -1) stream.skipToEnd();
		else stream.pos = tw_pos;
		return token_name;
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/dtd.js
var type$2;
function ret$1(style, tp) {
	type$2 = tp;
	return style;
}
function tokenBase$35(stream, state) {
	var ch = stream.next();
	if (ch == "<" && stream.eat("!")) {
		if (stream.eatWhile(/[\-]/)) {
			state.tokenize = tokenSGMLComment;
			return tokenSGMLComment(stream, state);
		} else if (stream.eatWhile(/[\w]/)) return ret$1("keyword", "doindent");
	} else if (ch == "<" && stream.eat("?")) {
		state.tokenize = inBlock("meta", "?>");
		return ret$1("meta", ch);
	} else if (ch == "#" && stream.eatWhile(/[\w]/)) return ret$1("atom", "tag");
	else if (ch == "|") return ret$1("keyword", "separator");
	else if (ch.match(/[\(\)\[\]\-\.,\+\?>]/)) return ret$1(null, ch);
	else if (ch.match(/[\[\]]/)) return ret$1("rule", ch);
	else if (ch == "\"" || ch == "'") {
		state.tokenize = tokenString$22(ch);
		return state.tokenize(stream, state);
	} else if (stream.eatWhile(/[a-zA-Z\?\+\d]/)) {
		var sc = stream.current();
		if (sc.substr(sc.length - 1, sc.length).match(/\?|\+/) !== null) stream.backUp(1);
		return ret$1("tag", "tag");
	} else if (ch == "%" || ch == "*") return ret$1("number", "number");
	else {
		stream.eatWhile(/[\w\\\-_%.{,]/);
		return ret$1(null, null);
	}
}
function tokenSGMLComment(stream, state) {
	var dashes = 0, ch;
	while ((ch = stream.next()) != null) {
		if (dashes >= 2 && ch == ">") {
			state.tokenize = tokenBase$35;
			break;
		}
		dashes = ch == "-" ? dashes + 1 : 0;
	}
	return ret$1("comment", "comment");
}
function tokenString$22(quote) {
	return function(stream, state) {
		var escaped = false, ch;
		while ((ch = stream.next()) != null) {
			if (ch == quote && !escaped) {
				state.tokenize = tokenBase$35;
				break;
			}
			escaped = !escaped && ch == "\\";
		}
		return ret$1("string", "tag");
	};
}
function inBlock(style, terminator) {
	return function(stream, state) {
		while (!stream.eol()) {
			if (stream.match(terminator)) {
				state.tokenize = tokenBase$35;
				break;
			}
			stream.next();
		}
		return style;
	};
}
var dtd = {
	name: "dtd",
	startState: function() {
		return {
			tokenize: tokenBase$35,
			baseIndent: 0,
			stack: []
		};
	},
	token: function(stream, state) {
		if (stream.eatSpace()) return null;
		var style = state.tokenize(stream, state);
		var context = state.stack[state.stack.length - 1];
		if (stream.current() == "[" || type$2 === "doindent" || type$2 == "[") state.stack.push("rule");
		else if (type$2 === "endtag") state.stack[state.stack.length - 1] = "endtag";
		else if (stream.current() == "]" || type$2 == "]" || type$2 == ">" && context == "rule") state.stack.pop();
		else if (type$2 == "[") state.stack.push("[");
		return style;
	},
	indent: function(state, textAfter, cx) {
		var n = state.stack.length;
		if (textAfter.charAt(0) === "]") n--;
		else if (textAfter.substr(textAfter.length - 1, textAfter.length) === ">") {
			if (textAfter.substr(0, 1) === "<") {} else if (type$2 == "doindent" && textAfter.length > 1) {} else if (type$2 == "doindent") n--;
			else if (type$2 == ">" && textAfter.length > 1) {} else if (type$2 == "tag" && textAfter !== ">") {} else if (type$2 == "tag" && state.stack[state.stack.length - 1] == "rule") n--;
			else if (type$2 == "tag") n++;
			else if (textAfter === ">" && state.stack[state.stack.length - 1] == "rule" && type$2 === ">") n--;
			else if (textAfter === ">" && state.stack[state.stack.length - 1] == "rule") {} else if (textAfter.substr(0, 1) !== "<" && textAfter.substr(0, 1) === ">") n = n - 1;
			else if (textAfter === ">") {} else n = n - 1;
			if (type$2 == null || type$2 == "]") n--;
		}
		return state.baseIndent + n * cx.unit;
	},
	languageData: { indentOnInput: /^\s*[\]>]$/ }
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/dylan.js
function forEach(arr, f) {
	for (var i = 0; i < arr.length; i++) f(arr[i], i);
}
function some(arr, f) {
	for (var i = 0; i < arr.length; i++) if (f(arr[i], i)) return true;
	return false;
}
var words$15 = {
	unnamedDefinition: ["interface"],
	namedDefinition: [
		"module",
		"library",
		"macro",
		"C-struct",
		"C-union",
		"C-function",
		"C-callable-wrapper"
	],
	typeParameterizedDefinition: [
		"class",
		"C-subtype",
		"C-mapped-subtype"
	],
	otherParameterizedDefinition: [
		"method",
		"function",
		"C-variable",
		"C-address"
	],
	constantSimpleDefinition: ["constant"],
	variableSimpleDefinition: ["variable"],
	otherSimpleDefinition: [
		"generic",
		"domain",
		"C-pointer-type",
		"table"
	],
	statement: [
		"if",
		"block",
		"begin",
		"method",
		"case",
		"for",
		"select",
		"when",
		"unless",
		"until",
		"while",
		"iterate",
		"profiling",
		"dynamic-bind"
	],
	separator: [
		"finally",
		"exception",
		"cleanup",
		"else",
		"elseif",
		"afterwards"
	],
	other: [
		"above",
		"below",
		"by",
		"from",
		"handler",
		"in",
		"instance",
		"let",
		"local",
		"otherwise",
		"slot",
		"subclass",
		"then",
		"to",
		"keyed-by",
		"virtual"
	],
	signalingCalls: [
		"signal",
		"error",
		"cerror",
		"break",
		"check-type",
		"abort"
	]
};
words$15["otherDefinition"] = words$15["unnamedDefinition"].concat(words$15["namedDefinition"]).concat(words$15["otherParameterizedDefinition"]);
words$15["definition"] = words$15["typeParameterizedDefinition"].concat(words$15["otherDefinition"]);
words$15["parameterizedDefinition"] = words$15["typeParameterizedDefinition"].concat(words$15["otherParameterizedDefinition"]);
words$15["simpleDefinition"] = words$15["constantSimpleDefinition"].concat(words$15["variableSimpleDefinition"]).concat(words$15["otherSimpleDefinition"]);
words$15["keyword"] = words$15["statement"].concat(words$15["separator"]).concat(words$15["other"]);
var symbolPattern = "[-_a-zA-Z?!*@<>$%]+";
var symbol$1 = new RegExp("^" + symbolPattern);
var patterns = {
	symbolKeyword: symbolPattern + ":",
	symbolClass: "<" + symbolPattern + ">",
	symbolGlobal: "\\*" + symbolPattern + "\\*",
	symbolConstant: "\\$" + symbolPattern
};
var patternStyles = {
	symbolKeyword: "atom",
	symbolClass: "tag",
	symbolGlobal: "variableName.standard",
	symbolConstant: "variableName.constant"
};
for (var patternName in patterns) if (patterns.hasOwnProperty(patternName)) patterns[patternName] = new RegExp("^" + patterns[patternName]);
patterns["keyword"] = [/^with(?:out)?-[-_a-zA-Z?!*@<>$%]+/];
var styles = {};
styles["keyword"] = "keyword";
styles["definition"] = "def";
styles["simpleDefinition"] = "def";
styles["signalingCalls"] = "builtin";
var wordLookup = {};
var styleLookup = {};
forEach([
	"keyword",
	"definition",
	"simpleDefinition",
	"signalingCalls"
], function(type) {
	forEach(words$15[type], function(word) {
		wordLookup[word] = type;
		styleLookup[word] = styles[type];
	});
});
function chain$8(stream, state, f) {
	state.tokenize = f;
	return f(stream, state);
}
function tokenBase$34(stream, state) {
	var ch = stream.peek();
	if (ch == "'" || ch == "\"") {
		stream.next();
		return chain$8(stream, state, tokenString$21(ch, "string"));
	} else if (ch == "/") {
		stream.next();
		if (stream.eat("*")) return chain$8(stream, state, tokenComment$16);
		else if (stream.eat("/")) {
			stream.skipToEnd();
			return "comment";
		}
		stream.backUp(1);
	} else if (/[+\-\d\.]/.test(ch)) {
		if (stream.match(/^[+-]?[0-9]*\.[0-9]*([esdx][+-]?[0-9]+)?/i) || stream.match(/^[+-]?[0-9]+([esdx][+-]?[0-9]+)/i) || stream.match(/^[+-]?\d+/)) return "number";
	} else if (ch == "#") {
		stream.next();
		ch = stream.peek();
		if (ch == "\"") {
			stream.next();
			return chain$8(stream, state, tokenString$21("\"", "string"));
		} else if (ch == "b") {
			stream.next();
			stream.eatWhile(/[01]/);
			return "number";
		} else if (ch == "x") {
			stream.next();
			stream.eatWhile(/[\da-f]/i);
			return "number";
		} else if (ch == "o") {
			stream.next();
			stream.eatWhile(/[0-7]/);
			return "number";
		} else if (ch == "#") {
			stream.next();
			return "punctuation";
		} else if (ch == "[" || ch == "(") {
			stream.next();
			return "bracket";
		} else if (stream.match(/f|t|all-keys|include|key|next|rest/i)) return "atom";
		else {
			stream.eatWhile(/[-a-zA-Z]/);
			return "error";
		}
	} else if (ch == "~") {
		stream.next();
		ch = stream.peek();
		if (ch == "=") {
			stream.next();
			ch = stream.peek();
			if (ch == "=") {
				stream.next();
				return "operator";
			}
			return "operator";
		}
		return "operator";
	} else if (ch == ":") {
		stream.next();
		ch = stream.peek();
		if (ch == "=") {
			stream.next();
			return "operator";
		} else if (ch == ":") {
			stream.next();
			return "punctuation";
		}
	} else if ("[](){}".indexOf(ch) != -1) {
		stream.next();
		return "bracket";
	} else if (".,".indexOf(ch) != -1) {
		stream.next();
		return "punctuation";
	} else if (stream.match("end")) return "keyword";
	for (var name in patterns) if (patterns.hasOwnProperty(name)) {
		var pattern = patterns[name];
		if (pattern instanceof Array && some(pattern, function(p) {
			return stream.match(p);
		}) || stream.match(pattern)) return patternStyles[name];
	}
	if (/[+\-*\/^=<>&|]/.test(ch)) {
		stream.next();
		return "operator";
	}
	if (stream.match("define")) return "def";
	else {
		stream.eatWhile(/[\w\-]/);
		if (wordLookup.hasOwnProperty(stream.current())) return styleLookup[stream.current()];
		else if (stream.current().match(symbol$1)) return "variable";
		else {
			stream.next();
			return "variableName.standard";
		}
	}
}
function tokenComment$16(stream, state) {
	var maybeEnd = false, maybeNested = false, nestedCount = 0, ch;
	while (ch = stream.next()) {
		if (ch == "/" && maybeEnd) {
			if (nestedCount > 0) nestedCount--;
			else {
				state.tokenize = tokenBase$34;
				break;
			}
		} else if (ch == "*" && maybeNested) nestedCount++;
		maybeEnd = ch == "*";
		maybeNested = ch == "/";
	}
	return "comment";
}
function tokenString$21(quote, style) {
	return function(stream, state) {
		var escaped = false, next, end = false;
		while ((next = stream.next()) != null) {
			if (next == quote && !escaped) {
				end = true;
				break;
			}
			escaped = !escaped && next == "\\";
		}
		if (end || !escaped) state.tokenize = tokenBase$34;
		return style;
	};
}
var dylan = {
	name: "dylan",
	startState: function() {
		return {
			tokenize: tokenBase$34,
			currentIndent: 0
		};
	},
	token: function(stream, state) {
		if (stream.eatSpace()) return null;
		return state.tokenize(stream, state);
	},
	languageData: { commentTokens: { block: {
		open: "/*",
		close: "*/"
	} } }
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/ecl.js
function words$14(str) {
	var obj = {}, words = str.split(" ");
	for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
	return obj;
}
function metaHook$1(stream, state) {
	if (!state.startOfLine) return false;
	stream.skipToEnd();
	return "meta";
}
var keyword = words$14("abs acos allnodes ascii asin asstring atan atan2 ave case choose choosen choosesets clustersize combine correlation cos cosh count covariance cron dataset dedup define denormalize distribute distributed distribution ebcdic enth error evaluate event eventextra eventname exists exp failcode failmessage fetch fromunicode getisvalid global graph group hash hash32 hash64 hashcrc hashmd5 having if index intformat isvalid iterate join keyunicode length library limit ln local log loop map matched matchlength matchposition matchtext matchunicode max merge mergejoin min nolocal nonempty normalize parse pipe power preload process project pull random range rank ranked realformat recordof regexfind regexreplace regroup rejected rollup round roundup row rowdiff sample set sin sinh sizeof soapcall sort sorted sqrt stepped stored sum table tan tanh thisnode topn tounicode transfer trim truncate typeof ungroup unicodeorder variance which workunit xmldecode xmlencode xmltext xmlunicode");
var variable = words$14("apply assert build buildindex evaluate fail keydiff keypatch loadxml nothor notify output parallel sequential soapcall wait");
var variable_2 = words$14("__compressed__ all and any as atmost before beginc++ best between case const counter csv descend encrypt end endc++ endmacro except exclusive expire export extend false few first flat from full function group header heading hole ifblock import in interface joined keep keyed last left limit load local locale lookup macro many maxcount maxlength min skew module named nocase noroot noscan nosort not of only opt or outer overwrite packed partition penalty physicallength pipe quote record relationship repeat return right scan self separator service shared skew skip sql store terminator thor threshold token transform trim true type unicodeorder unsorted validate virtual whole wild within xml xpath");
var variable_3 = words$14("ascii big_endian boolean data decimal ebcdic integer pattern qstring real record rule set of string token udecimal unicode unsigned varstring varunicode");
var builtin$2 = words$14("checkpoint deprecated failcode failmessage failure global independent onwarning persist priority recovery stored success wait when");
var blockKeywords$3 = words$14("catch class do else finally for if switch try while");
var atoms$9 = words$14("true false null");
var hooks$1 = { "#": metaHook$1 };
var isOperatorChar$10 = /[+\-*&%=<>!?|\/]/;
var curPunc$9;
function tokenBase$33(stream, state) {
	var ch = stream.next();
	if (hooks$1[ch]) {
		var result = hooks$1[ch](stream, state);
		if (result !== false) return result;
	}
	if (ch == "\"" || ch == "'") {
		state.tokenize = tokenString$20(ch);
		return state.tokenize(stream, state);
	}
	if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
		curPunc$9 = ch;
		return null;
	}
	if (/\d/.test(ch)) {
		stream.eatWhile(/[\w\.]/);
		return "number";
	}
	if (ch == "/") {
		if (stream.eat("*")) {
			state.tokenize = tokenComment$15;
			return tokenComment$15(stream, state);
		}
		if (stream.eat("/")) {
			stream.skipToEnd();
			return "comment";
		}
	}
	if (isOperatorChar$10.test(ch)) {
		stream.eatWhile(isOperatorChar$10);
		return "operator";
	}
	stream.eatWhile(/[\w\$_]/);
	var cur = stream.current().toLowerCase();
	if (keyword.propertyIsEnumerable(cur)) {
		if (blockKeywords$3.propertyIsEnumerable(cur)) curPunc$9 = "newstatement";
		return "keyword";
	} else if (variable.propertyIsEnumerable(cur)) {
		if (blockKeywords$3.propertyIsEnumerable(cur)) curPunc$9 = "newstatement";
		return "variable";
	} else if (variable_2.propertyIsEnumerable(cur)) {
		if (blockKeywords$3.propertyIsEnumerable(cur)) curPunc$9 = "newstatement";
		return "modifier";
	} else if (variable_3.propertyIsEnumerable(cur)) {
		if (blockKeywords$3.propertyIsEnumerable(cur)) curPunc$9 = "newstatement";
		return "type";
	} else if (builtin$2.propertyIsEnumerable(cur)) {
		if (blockKeywords$3.propertyIsEnumerable(cur)) curPunc$9 = "newstatement";
		return "builtin";
	} else {
		var i = cur.length - 1;
		while (i >= 0 && (!isNaN(cur[i]) || cur[i] == "_")) --i;
		if (i > 0) {
			var cur2 = cur.substr(0, i + 1);
			if (variable_3.propertyIsEnumerable(cur2)) {
				if (blockKeywords$3.propertyIsEnumerable(cur2)) curPunc$9 = "newstatement";
				return "type";
			}
		}
	}
	if (atoms$9.propertyIsEnumerable(cur)) return "atom";
	return null;
}
function tokenString$20(quote) {
	return function(stream, state) {
		var escaped = false, next, end = false;
		while ((next = stream.next()) != null) {
			if (next == quote && !escaped) {
				end = true;
				break;
			}
			escaped = !escaped && next == "\\";
		}
		if (end || !escaped) state.tokenize = tokenBase$33;
		return "string";
	};
}
function tokenComment$15(stream, state) {
	var maybeEnd = false, ch;
	while (ch = stream.next()) {
		if (ch == "/" && maybeEnd) {
			state.tokenize = tokenBase$33;
			break;
		}
		maybeEnd = ch == "*";
	}
	return "comment";
}
function Context$7(indented, column, type, align, prev) {
	this.indented = indented;
	this.column = column;
	this.type = type;
	this.align = align;
	this.prev = prev;
}
function pushContext$9(state, col, type) {
	return state.context = new Context$7(state.indented, col, type, null, state.context);
}
function popContext$9(state) {
	var t = state.context.type;
	if (t == ")" || t == "]" || t == "}") state.indented = state.context.indented;
	return state.context = state.context.prev;
}
var ecl = {
	name: "ecl",
	startState: function(indentUnit) {
		return {
			tokenize: null,
			context: new Context$7(-indentUnit, 0, "top", false),
			indented: 0,
			startOfLine: true
		};
	},
	token: function(stream, state) {
		var ctx = state.context;
		if (stream.sol()) {
			if (ctx.align == null) ctx.align = false;
			state.indented = stream.indentation();
			state.startOfLine = true;
		}
		if (stream.eatSpace()) return null;
		curPunc$9 = null;
		var style = (state.tokenize || tokenBase$33)(stream, state);
		if (style == "comment" || style == "meta") return style;
		if (ctx.align == null) ctx.align = true;
		if ((curPunc$9 == ";" || curPunc$9 == ":") && ctx.type == "statement") popContext$9(state);
		else if (curPunc$9 == "{") pushContext$9(state, stream.column(), "}");
		else if (curPunc$9 == "[") pushContext$9(state, stream.column(), "]");
		else if (curPunc$9 == "(") pushContext$9(state, stream.column(), ")");
		else if (curPunc$9 == "}") {
			while (ctx.type == "statement") ctx = popContext$9(state);
			if (ctx.type == "}") ctx = popContext$9(state);
			while (ctx.type == "statement") ctx = popContext$9(state);
		} else if (curPunc$9 == ctx.type) popContext$9(state);
		else if (ctx.type == "}" || ctx.type == "top" || ctx.type == "statement" && curPunc$9 == "newstatement") pushContext$9(state, stream.column(), "statement");
		state.startOfLine = false;
		return style;
	},
	indent: function(state, textAfter, cx) {
		if (state.tokenize != tokenBase$33 && state.tokenize != null) return 0;
		var ctx = state.context, firstChar = textAfter && textAfter.charAt(0);
		if (ctx.type == "statement" && firstChar == "}") ctx = ctx.prev;
		var closing = firstChar == ctx.type;
		if (ctx.type == "statement") return ctx.indented + (firstChar == "{" ? 0 : cx.unit);
		else if (ctx.align) return ctx.column + (closing ? 0 : 1);
		else return ctx.indented + (closing ? 0 : cx.unit);
	},
	languageData: { indentOnInput: /^\s*[{}]$/ }
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/eiffel.js
function wordObj$2(words) {
	var o = {};
	for (var i = 0, e = words.length; i < e; ++i) o[words[i]] = true;
	return o;
}
var keywords$29 = wordObj$2([
	"note",
	"across",
	"when",
	"variant",
	"until",
	"unique",
	"undefine",
	"then",
	"strip",
	"select",
	"retry",
	"rescue",
	"require",
	"rename",
	"reference",
	"redefine",
	"prefix",
	"once",
	"old",
	"obsolete",
	"loop",
	"local",
	"like",
	"is",
	"inspect",
	"infix",
	"include",
	"if",
	"frozen",
	"from",
	"external",
	"export",
	"ensure",
	"end",
	"elseif",
	"else",
	"do",
	"creation",
	"create",
	"check",
	"alias",
	"agent",
	"separate",
	"invariant",
	"inherit",
	"indexing",
	"feature",
	"expanded",
	"deferred",
	"class",
	"Void",
	"True",
	"Result",
	"Precursor",
	"False",
	"Current",
	"create",
	"attached",
	"detachable",
	"as",
	"and",
	"implies",
	"not",
	"or"
]);
var operators$3 = wordObj$2([
	":=",
	"and then",
	"and",
	"or",
	"<<",
	">>"
]);
function chain$7(newtok, stream, state) {
	state.tokenize.push(newtok);
	return newtok(stream, state);
}
function tokenBase$32(stream, state) {
	if (stream.eatSpace()) return null;
	var ch = stream.next();
	if (ch == "\"" || ch == "'") return chain$7(readQuoted$1(ch, "string"), stream, state);
	else if (ch == "-" && stream.eat("-")) {
		stream.skipToEnd();
		return "comment";
	} else if (ch == ":" && stream.eat("=")) return "operator";
	else if (/[0-9]/.test(ch)) {
		stream.eatWhile(/[xXbBCc0-9\.]/);
		stream.eat(/[\?\!]/);
		return "variable";
	} else if (/[a-zA-Z_0-9]/.test(ch)) {
		stream.eatWhile(/[a-zA-Z_0-9]/);
		stream.eat(/[\?\!]/);
		return "variable";
	} else if (/[=+\-\/*^%<>~]/.test(ch)) {
		stream.eatWhile(/[=+\-\/*^%<>~]/);
		return "operator";
	} else return null;
}
function readQuoted$1(quote, style, unescaped) {
	return function(stream, state) {
		var escaped = false, ch;
		while ((ch = stream.next()) != null) {
			if (ch == quote && (unescaped || !escaped)) {
				state.tokenize.pop();
				break;
			}
			escaped = !escaped && ch == "%";
		}
		return style;
	};
}
var eiffel = {
	name: "eiffel",
	startState: function() {
		return { tokenize: [tokenBase$32] };
	},
	token: function(stream, state) {
		var style = state.tokenize[state.tokenize.length - 1](stream, state);
		if (style == "variable") {
			var word = stream.current();
			style = keywords$29.propertyIsEnumerable(stream.current()) ? "keyword" : operators$3.propertyIsEnumerable(stream.current()) ? "operator" : /^[A-Z][A-Z_0-9]*$/g.test(word) ? "tag" : /^0[bB][0-1]+$/g.test(word) ? "number" : /^0[cC][0-7]+$/g.test(word) ? "number" : /^0[xX][a-fA-F0-9]+$/g.test(word) ? "number" : /^([0-9]+\.[0-9]*)|([0-9]*\.[0-9]+)$/g.test(word) ? "number" : /^[0-9]+$/g.test(word) ? "number" : "variable";
		}
		return style;
	},
	languageData: { commentTokens: { line: "--" } }
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/elm.js
function switchState$1(source, setState, f) {
	setState(f);
	return f(source, setState);
}
var lowerRE = /[a-z]/;
var upperRE = /[A-Z]/;
var innerRE = /[a-zA-Z0-9_]/;
var digitRE$1 = /[0-9]/;
var hexRE = /[0-9A-Fa-f]/;
var symbolRE$1 = /[-&*+.\\/<>=?^|:]/;
var specialRE$1 = /[(),[\]{}]/;
var spacesRE = /[ \v\f]/;
function normal$2() {
	return function(source, setState) {
		if (source.eatWhile(spacesRE)) return null;
		var char = source.next();
		if (specialRE$1.test(char)) return char === "{" && source.eat("-") ? switchState$1(source, setState, chompMultiComment(1)) : char === "[" && source.match("glsl|") ? switchState$1(source, setState, chompGlsl) : "builtin";
		if (char === "'") return switchState$1(source, setState, chompChar);
		if (char === "\"") return source.eat("\"") ? source.eat("\"") ? switchState$1(source, setState, chompMultiString) : "string" : switchState$1(source, setState, chompSingleString);
		if (upperRE.test(char)) {
			source.eatWhile(innerRE);
			return "type";
		}
		if (lowerRE.test(char)) {
			var isDef = source.pos === 1;
			source.eatWhile(innerRE);
			return isDef ? "def" : "variable";
		}
		if (digitRE$1.test(char)) {
			if (char === "0") {
				if (source.eat(/[xX]/)) {
					source.eatWhile(hexRE);
					return "number";
				}
			} else source.eatWhile(digitRE$1);
			if (source.eat(".")) source.eatWhile(digitRE$1);
			if (source.eat(/[eE]/)) {
				source.eat(/[-+]/);
				source.eatWhile(digitRE$1);
			}
			return "number";
		}
		if (symbolRE$1.test(char)) {
			if (char === "-" && source.eat("-")) {
				source.skipToEnd();
				return "comment";
			}
			source.eatWhile(symbolRE$1);
			return "keyword";
		}
		if (char === "_") return "keyword";
		return "error";
	};
}
function chompMultiComment(nest) {
	if (nest == 0) return normal$2();
	return function(source, setState) {
		while (!source.eol()) {
			var char = source.next();
			if (char == "{" && source.eat("-")) ++nest;
			else if (char == "-" && source.eat("}")) {
				--nest;
				if (nest === 0) {
					setState(normal$2());
					return "comment";
				}
			}
		}
		setState(chompMultiComment(nest));
		return "comment";
	};
}
function chompMultiString(source, setState) {
	while (!source.eol()) if (source.next() === "\"" && source.eat("\"") && source.eat("\"")) {
		setState(normal$2());
		return "string";
	}
	return "string";
}
function chompSingleString(source, setState) {
	while (source.skipTo("\\\"")) {
		source.next();
		source.next();
	}
	if (source.skipTo("\"")) {
		source.next();
		setState(normal$2());
		return "string";
	}
	source.skipToEnd();
	setState(normal$2());
	return "error";
}
function chompChar(source, setState) {
	while (source.skipTo("\\'")) {
		source.next();
		source.next();
	}
	if (source.skipTo("'")) {
		source.next();
		setState(normal$2());
		return "string";
	}
	source.skipToEnd();
	setState(normal$2());
	return "error";
}
function chompGlsl(source, setState) {
	while (!source.eol()) if (source.next() === "|" && source.eat("]")) {
		setState(normal$2());
		return "string";
	}
	return "string";
}
var wellKnownWords$1 = {
	case: 1,
	of: 1,
	as: 1,
	if: 1,
	then: 1,
	else: 1,
	let: 1,
	in: 1,
	type: 1,
	alias: 1,
	module: 1,
	where: 1,
	import: 1,
	exposing: 1,
	port: 1
};
var elm = {
	name: "elm",
	startState: function() {
		return { f: normal$2() };
	},
	copyState: function(s) {
		return { f: s.f };
	},
	token: function(stream, state) {
		var type = state.f(stream, function(s) {
			state.f = s;
		});
		var word = stream.current();
		return wellKnownWords$1.hasOwnProperty(word) ? "keyword" : type;
	},
	languageData: { commentTokens: { line: "--" } }
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/erlang.js
var typeWords = [
	"-type",
	"-spec",
	"-export_type",
	"-opaque"
];
var keywordWords = [
	"after",
	"begin",
	"catch",
	"case",
	"cond",
	"end",
	"fun",
	"if",
	"let",
	"of",
	"query",
	"receive",
	"try",
	"when"
];
var separatorRE = /[\->,;]/;
var separatorWords = [
	"->",
	";",
	","
];
var operatorAtomWords = [
	"and",
	"andalso",
	"band",
	"bnot",
	"bor",
	"bsl",
	"bsr",
	"bxor",
	"div",
	"not",
	"or",
	"orelse",
	"rem",
	"xor"
];
var operatorSymbolRE = /[\+\-\*\/<>=\|:!]/;
var operatorSymbolWords = [
	"=",
	"+",
	"-",
	"*",
	"/",
	">",
	">=",
	"<",
	"=<",
	"=:=",
	"==",
	"=/=",
	"/=",
	"||",
	"<-",
	"!"
];
var openParenRE = /[<\(\[\{]/;
var openParenWords = [
	"<<",
	"(",
	"[",
	"{"
];
var closeParenRE = /[>\)\]\}]/;
var closeParenWords = [
	"}",
	"]",
	")",
	">>"
];
var guardWords = [
	"is_atom",
	"is_binary",
	"is_bitstring",
	"is_boolean",
	"is_float",
	"is_function",
	"is_integer",
	"is_list",
	"is_number",
	"is_pid",
	"is_port",
	"is_record",
	"is_reference",
	"is_tuple",
	"atom",
	"binary",
	"bitstring",
	"boolean",
	"function",
	"integer",
	"list",
	"number",
	"pid",
	"port",
	"record",
	"reference",
	"tuple"
];
var bifWords = [
	"abs",
	"adler32",
	"adler32_combine",
	"alive",
	"apply",
	"atom_to_binary",
	"atom_to_list",
	"binary_to_atom",
	"binary_to_existing_atom",
	"binary_to_list",
	"binary_to_term",
	"bit_size",
	"bitstring_to_list",
	"byte_size",
	"check_process_code",
	"contact_binary",
	"crc32",
	"crc32_combine",
	"date",
	"decode_packet",
	"delete_module",
	"disconnect_node",
	"element",
	"erase",
	"exit",
	"float",
	"float_to_list",
	"garbage_collect",
	"get",
	"get_keys",
	"group_leader",
	"halt",
	"hd",
	"integer_to_list",
	"internal_bif",
	"iolist_size",
	"iolist_to_binary",
	"is_alive",
	"is_atom",
	"is_binary",
	"is_bitstring",
	"is_boolean",
	"is_float",
	"is_function",
	"is_integer",
	"is_list",
	"is_number",
	"is_pid",
	"is_port",
	"is_process_alive",
	"is_record",
	"is_reference",
	"is_tuple",
	"length",
	"link",
	"list_to_atom",
	"list_to_binary",
	"list_to_bitstring",
	"list_to_existing_atom",
	"list_to_float",
	"list_to_integer",
	"list_to_pid",
	"list_to_tuple",
	"load_module",
	"make_ref",
	"module_loaded",
	"monitor_node",
	"node",
	"node_link",
	"node_unlink",
	"nodes",
	"notalive",
	"now",
	"open_port",
	"pid_to_list",
	"port_close",
	"port_command",
	"port_connect",
	"port_control",
	"pre_loaded",
	"process_flag",
	"process_info",
	"processes",
	"purge_module",
	"put",
	"register",
	"registered",
	"round",
	"self",
	"setelement",
	"size",
	"spawn",
	"spawn_link",
	"spawn_monitor",
	"spawn_opt",
	"split_binary",
	"statistics",
	"term_to_binary",
	"time",
	"throw",
	"tl",
	"trunc",
	"tuple_size",
	"tuple_to_list",
	"unlink",
	"unregister",
	"whereis"
];
var anumRE = /[\w@Ø-ÞÀ-Öß-öø-ÿ]/;
var escapesRE = /[0-7]{1,3}|[bdefnrstv\\"']|\^[a-zA-Z]|x[0-9a-zA-Z]{2}|x{[0-9a-zA-Z]+}/;
function tokenizer(stream, state) {
	if (state.in_string) {
		state.in_string = !doubleQuote(stream);
		return rval(state, stream, "string");
	}
	if (state.in_atom) {
		state.in_atom = !singleQuote(stream);
		return rval(state, stream, "atom");
	}
	if (stream.eatSpace()) return rval(state, stream, "whitespace");
	if (!peekToken(state) && stream.match(/-\s*[a-zß-öø-ÿ][\wØ-ÞÀ-Öß-öø-ÿ]*/)) {
		if (is_member(stream.current(), typeWords)) return rval(state, stream, "type");
		else return rval(state, stream, "attribute");
	}
	var ch = stream.next();
	if (ch == "%") {
		stream.skipToEnd();
		return rval(state, stream, "comment");
	}
	if (ch == ":") return rval(state, stream, "colon");
	if (ch == "?") {
		stream.eatSpace();
		stream.eatWhile(anumRE);
		return rval(state, stream, "macro");
	}
	if (ch == "#") {
		stream.eatSpace();
		stream.eatWhile(anumRE);
		return rval(state, stream, "record");
	}
	if (ch == "$") {
		if (stream.next() == "\\" && !stream.match(escapesRE)) return rval(state, stream, "error");
		return rval(state, stream, "number");
	}
	if (ch == ".") return rval(state, stream, "dot");
	if (ch == "'") {
		if (!(state.in_atom = !singleQuote(stream))) {
			if (stream.match(/\s*\/\s*[0-9]/, false)) {
				stream.match(/\s*\/\s*[0-9]/, true);
				return rval(state, stream, "fun");
			}
			if (stream.match(/\s*\(/, false) || stream.match(/\s*:/, false)) return rval(state, stream, "function");
		}
		return rval(state, stream, "atom");
	}
	if (ch == "\"") {
		state.in_string = !doubleQuote(stream);
		return rval(state, stream, "string");
	}
	if (/[A-Z_Ø-ÞÀ-Ö]/.test(ch)) {
		stream.eatWhile(anumRE);
		return rval(state, stream, "variable");
	}
	if (/[a-z_ß-öø-ÿ]/.test(ch)) {
		stream.eatWhile(anumRE);
		if (stream.match(/\s*\/\s*[0-9]/, false)) {
			stream.match(/\s*\/\s*[0-9]/, true);
			return rval(state, stream, "fun");
		}
		var w = stream.current();
		if (is_member(w, keywordWords)) return rval(state, stream, "keyword");
		else if (is_member(w, operatorAtomWords)) return rval(state, stream, "operator");
		else if (stream.match(/\s*\(/, false)) {
			if (is_member(w, bifWords) && (peekToken(state).token != ":" || peekToken(state, 2).token == "erlang")) return rval(state, stream, "builtin");
			else if (is_member(w, guardWords)) return rval(state, stream, "guard");
			else return rval(state, stream, "function");
		} else if (lookahead(stream) == ":") {
			if (w == "erlang") return rval(state, stream, "builtin");
			else return rval(state, stream, "function");
		} else if (is_member(w, ["true", "false"])) return rval(state, stream, "boolean");
		else return rval(state, stream, "atom");
	}
	var digitRE = /[0-9]/;
	var radixRE = /[0-9a-zA-Z]/;
	if (digitRE.test(ch)) {
		stream.eatWhile(digitRE);
		if (stream.eat("#")) {
			if (!stream.eatWhile(radixRE)) stream.backUp(1);
		} else if (stream.eat(".")) {
			if (!stream.eatWhile(digitRE)) stream.backUp(1);
			else if (stream.eat(/[eE]/)) {
				if (stream.eat(/[-+]/)) {
					if (!stream.eatWhile(digitRE)) stream.backUp(2);
				} else if (!stream.eatWhile(digitRE)) stream.backUp(1);
			}
		}
		return rval(state, stream, "number");
	}
	if (nongreedy(stream, openParenRE, openParenWords)) return rval(state, stream, "open_paren");
	if (nongreedy(stream, closeParenRE, closeParenWords)) return rval(state, stream, "close_paren");
	if (greedy(stream, separatorRE, separatorWords)) return rval(state, stream, "separator");
	if (greedy(stream, operatorSymbolRE, operatorSymbolWords)) return rval(state, stream, "operator");
	return rval(state, stream, null);
}
function nongreedy(stream, re, words) {
	if (stream.current().length == 1 && re.test(stream.current())) {
		stream.backUp(1);
		while (re.test(stream.peek())) {
			stream.next();
			if (is_member(stream.current(), words)) return true;
		}
		stream.backUp(stream.current().length - 1);
	}
	return false;
}
function greedy(stream, re, words) {
	if (stream.current().length == 1 && re.test(stream.current())) {
		while (re.test(stream.peek())) stream.next();
		while (0 < stream.current().length) if (is_member(stream.current(), words)) return true;
		else stream.backUp(1);
		stream.next();
	}
	return false;
}
function doubleQuote(stream) {
	return quote(stream, "\"", "\\");
}
function singleQuote(stream) {
	return quote(stream, "'", "\\");
}
function quote(stream, quoteChar, escapeChar) {
	while (!stream.eol()) {
		var ch = stream.next();
		if (ch == quoteChar) return true;
		else if (ch == escapeChar) stream.next();
	}
	return false;
}
function lookahead(stream) {
	var m = stream.match(/^\s*([^\s%])/, false);
	return m ? m[1] : "";
}
function is_member(element, list) {
	return -1 < list.indexOf(element);
}
function rval(state, stream, type) {
	pushToken(state, realToken(type, stream));
	switch (type) {
		case "atom": return "atom";
		case "attribute": return "attribute";
		case "boolean": return "atom";
		case "builtin": return "builtin";
		case "close_paren": return null;
		case "colon": return null;
		case "comment": return "comment";
		case "dot": return null;
		case "error": return "error";
		case "fun": return "meta";
		case "function": return "tag";
		case "guard": return "property";
		case "keyword": return "keyword";
		case "macro": return "macroName";
		case "number": return "number";
		case "open_paren": return null;
		case "operator": return "operator";
		case "record": return "bracket";
		case "separator": return null;
		case "string": return "string";
		case "type": return "def";
		case "variable": return "variable";
		default: return null;
	}
}
function aToken(tok, col, ind, typ) {
	return {
		token: tok,
		column: col,
		indent: ind,
		type: typ
	};
}
function realToken(type, stream) {
	return aToken(stream.current(), stream.column(), stream.indentation(), type);
}
function fakeToken(type) {
	return aToken(type, 0, 0, type);
}
function peekToken(state, depth) {
	var len = state.tokenStack.length;
	var dep = depth ? depth : 1;
	if (len < dep) return false;
	else return state.tokenStack[len - dep];
}
function pushToken(state, token) {
	if (!(token.type == "comment" || token.type == "whitespace")) {
		state.tokenStack = maybe_drop_pre(state.tokenStack, token);
		state.tokenStack = maybe_drop_post(state.tokenStack);
	}
}
function maybe_drop_pre(s, token) {
	var last = s.length - 1;
	if (0 < last && s[last].type === "record" && token.type === "dot") s.pop();
	else if (0 < last && s[last].type === "group") {
		s.pop();
		s.push(token);
	} else s.push(token);
	return s;
}
function maybe_drop_post(s) {
	if (!s.length) return s;
	var last = s.length - 1;
	if (s[last].type === "dot") return [];
	if (last > 1 && s[last].type === "fun" && s[last - 1].token === "fun") return s.slice(0, last - 1);
	switch (s[last].token) {
		case "}": return d(s, { g: ["{"] });
		case "]": return d(s, { i: ["["] });
		case ")": return d(s, { i: ["("] });
		case ">>": return d(s, { i: ["<<"] });
		case "end": return d(s, { i: [
			"begin",
			"case",
			"fun",
			"if",
			"receive",
			"try"
		] });
		case ",": return d(s, { e: [
			"begin",
			"try",
			"when",
			"->",
			",",
			"(",
			"[",
			"{",
			"<<"
		] });
		case "->": return d(s, {
			r: ["when"],
			m: [
				"try",
				"if",
				"case",
				"receive"
			]
		});
		case ";": return d(s, { E: [
			"case",
			"fun",
			"if",
			"receive",
			"try",
			"when"
		] });
		case "catch": return d(s, { e: ["try"] });
		case "of": return d(s, { e: ["case"] });
		case "after": return d(s, { e: ["receive", "try"] });
		default: return s;
	}
}
function d(stack, tt) {
	for (var type in tt) {
		var len = stack.length - 1;
		var tokens = tt[type];
		for (var i = len - 1; -1 < i; i--) if (is_member(stack[i].token, tokens)) {
			var ss = stack.slice(0, i);
			switch (type) {
				case "m": return ss.concat(stack[i]).concat(stack[len]);
				case "r": return ss.concat(stack[len]);
				case "i": return ss;
				case "g": return ss.concat(fakeToken("group"));
				case "E": return ss.concat(stack[i]);
				case "e": return ss.concat(stack[i]);
			}
		}
	}
	return type == "E" ? [] : stack;
}
function indenter$1(state, textAfter, cx) {
	var t;
	var wordAfter = wordafter(textAfter);
	var currT = peekToken(state, 1);
	var prevT = peekToken(state, 2);
	if (state.in_string || state.in_atom) return null;
	else if (!prevT) return 0;
	else if (currT.token == "when") return currT.column + cx.unit;
	else if (wordAfter === "when" && prevT.type === "function") return prevT.indent + cx.unit;
	else if (wordAfter === "(" && currT.token === "fun") return currT.column + 3;
	else if (wordAfter === "catch" && (t = getToken(state, ["try"]))) return t.column;
	else if (is_member(wordAfter, [
		"end",
		"after",
		"of"
	])) {
		t = getToken(state, [
			"begin",
			"case",
			"fun",
			"if",
			"receive",
			"try"
		]);
		return t ? t.column : null;
	} else if (is_member(wordAfter, closeParenWords)) {
		t = getToken(state, openParenWords);
		return t ? t.column : null;
	} else if (is_member(currT.token, [
		",",
		"|",
		"||"
	]) || is_member(wordAfter, [
		",",
		"|",
		"||"
	])) {
		t = postcommaToken(state);
		return t ? t.column + t.token.length : cx.unit;
	} else if (currT.token == "->") {
		if (is_member(prevT.token, [
			"receive",
			"case",
			"if",
			"try"
		])) return prevT.column + cx.unit + cx.unit;
		else return prevT.column + cx.unit;
	} else if (is_member(currT.token, openParenWords)) return currT.column + currT.token.length;
	else {
		t = defaultToken(state);
		return truthy(t) ? t.column + cx.unit : 0;
	}
}
function wordafter(str) {
	var m = str.match(/,|[a-z]+|\}|\]|\)|>>|\|+|\(/);
	return truthy(m) && m.index === 0 ? m[0] : "";
}
function postcommaToken(state) {
	var objs = state.tokenStack.slice(0, -1);
	var i = getTokenIndex(objs, "type", ["open_paren"]);
	return truthy(objs[i]) ? objs[i] : false;
}
function defaultToken(state) {
	var objs = state.tokenStack;
	var stop = getTokenIndex(objs, "type", [
		"open_paren",
		"separator",
		"keyword"
	]);
	var oper = getTokenIndex(objs, "type", ["operator"]);
	if (truthy(stop) && truthy(oper) && stop < oper) return objs[stop + 1];
	else if (truthy(stop)) return objs[stop];
	else return false;
}
function getToken(state, tokens) {
	var objs = state.tokenStack;
	var i = getTokenIndex(objs, "token", tokens);
	return truthy(objs[i]) ? objs[i] : false;
}
function getTokenIndex(objs, propname, propvals) {
	for (var i = objs.length - 1; -1 < i; i--) if (is_member(objs[i][propname], propvals)) return i;
	return false;
}
function truthy(x) {
	return x !== false && x != null;
}
var erlang = {
	name: "erlang",
	startState() {
		return {
			tokenStack: [],
			in_string: false,
			in_atom: false
		};
	},
	token: tokenizer,
	indent: indenter$1,
	languageData: { commentTokens: { line: "%" } }
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/simple-mode.js
function simpleMode(states) {
	ensureState(states, "start");
	var states_ = {}, meta = states.languageData || {}, hasIndentation = false;
	for (var state in states) if (state != meta && states.hasOwnProperty(state)) {
		var list = states_[state] = [], orig = states[state];
		for (var i = 0; i < orig.length; i++) {
			var data = orig[i];
			list.push(new Rule(data, states));
			if (data.indent || data.dedent) hasIndentation = true;
		}
	}
	return {
		name: meta.name,
		startState: function() {
			return {
				state: "start",
				pending: null,
				indent: hasIndentation ? [] : null
			};
		},
		copyState: function(state) {
			var s = {
				state: state.state,
				pending: state.pending,
				indent: state.indent && state.indent.slice(0)
			};
			if (state.stack) s.stack = state.stack.slice(0);
			return s;
		},
		token: tokenFunction(states_),
		indent: indentFunction(states_, meta),
		mergeTokens: meta.mergeTokens,
		languageData: meta
	};
}
function ensureState(states, name) {
	if (!states.hasOwnProperty(name)) throw new Error("Undefined state " + name + " in simple mode");
}
function toRegex(val, caret) {
	if (!val) return /(?:)/;
	var flags = "";
	if (val instanceof RegExp) {
		if (val.ignoreCase) flags = "i";
		if (val.unicode) flags += "u";
		val = val.source;
	} else val = String(val);
	return new RegExp((caret === false ? "" : "^") + "(?:" + val + ")", flags);
}
function asToken(val) {
	if (!val) return null;
	if (val.apply) return val;
	if (typeof val == "string") return val.replace(/\./g, " ");
	var result = [];
	for (var i = 0; i < val.length; i++) result.push(val[i] && val[i].replace(/\./g, " "));
	return result;
}
function Rule(data, states) {
	if (data.next || data.push) ensureState(states, data.next || data.push);
	this.regex = toRegex(data.regex);
	this.token = asToken(data.token);
	this.data = data;
}
function tokenFunction(states) {
	return function(stream, state) {
		if (state.pending) {
			var pend = state.pending.shift();
			if (state.pending.length == 0) state.pending = null;
			stream.pos += pend.text.length;
			return pend.token;
		}
		var curState = states[state.state];
		for (var i = 0; i < curState.length; i++) {
			var rule = curState[i];
			var matches = (!rule.data.sol || stream.sol()) && stream.match(rule.regex);
			if (matches) {
				if (rule.data.next) state.state = rule.data.next;
				else if (rule.data.push) {
					(state.stack || (state.stack = [])).push(state.state);
					state.state = rule.data.push;
				} else if (rule.data.pop && state.stack && state.stack.length) state.state = state.stack.pop();
				if (rule.data.indent) state.indent.push(stream.indentation() + stream.indentUnit);
				if (rule.data.dedent) state.indent.pop();
				var token = rule.token;
				if (token && token.apply) token = token(matches);
				if (matches.length > 2 && rule.token && typeof rule.token != "string") {
					state.pending = [];
					for (var j = 2; j < matches.length; j++) if (matches[j]) state.pending.push({
						text: matches[j],
						token: rule.token[j - 1]
					});
					stream.backUp(matches[0].length - (matches[1] ? matches[1].length : 0));
					return token[0];
				} else if (token && token.join) return token[0];
				else return token;
			}
		}
		stream.next();
		return null;
	};
}
function indentFunction(states, meta) {
	return function(state, textAfter) {
		if (state.indent == null || meta.dontIndentStates && meta.dontIndentStates.indexOf(state.state) > -1) return null;
		var pos = state.indent.length - 1, rules = states[state.state];
		scan: for (;;) {
			for (var i = 0; i < rules.length; i++) {
				var rule = rules[i];
				if (rule.data.dedent && rule.data.dedentIfLineStart !== false) {
					var m = rule.regex.exec(textAfter);
					if (m && m[0]) {
						pos--;
						if (rule.next || rule.push) rules = states[rule.next || rule.push];
						textAfter = textAfter.slice(m[0].length);
						continue scan;
					}
				}
			}
			break;
		}
		return pos < 0 ? 0 : state.indent[pos];
	};
}
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/factor.js
var factor = simpleMode({
	start: [
		{
			regex: /#?!.*/,
			token: "comment"
		},
		{
			regex: /"""/,
			token: "string",
			next: "string3"
		},
		{
			regex: /(STRING:)(\s)/,
			token: ["keyword", null],
			next: "string2"
		},
		{
			regex: /\S*?"/,
			token: "string",
			next: "string"
		},
		{
			regex: /(?:0x[\d,a-f]+)|(?:0o[0-7]+)|(?:0b[0,1]+)|(?:\-?\d+.?\d*)(?=\s)/,
			token: "number"
		},
		{
			regex: /((?:GENERIC)|\:?\:)(\s+)(\S+)(\s+)(\()/,
			token: [
				"keyword",
				null,
				"def",
				null,
				"bracket"
			],
			next: "stack"
		},
		{
			regex: /(M\:)(\s+)(\S+)(\s+)(\S+)/,
			token: [
				"keyword",
				null,
				"def",
				null,
				"tag"
			]
		},
		{
			regex: /USING\:/,
			token: "keyword",
			next: "vocabulary"
		},
		{
			regex: /(USE\:|IN\:)(\s+)(\S+)(?=\s|$)/,
			token: [
				"keyword",
				null,
				"tag"
			]
		},
		{
			regex: /(\S+\:)(\s+)(\S+)(?=\s|$)/,
			token: [
				"keyword",
				null,
				"def"
			]
		},
		{
			regex: /(?:;|\\|t|f|if|loop|while|until|do|PRIVATE>|<PRIVATE|\.|\S*\[|\]|\S*\{|\})(?=\s|$)/,
			token: "keyword"
		},
		{
			regex: /\S+[\)>\.\*\?]+(?=\s|$)/,
			token: "builtin"
		},
		{
			regex: /[\)><]+\S+(?=\s|$)/,
			token: "builtin"
		},
		{
			regex: /(?:[\+\-\=\/\*<>])(?=\s|$)/,
			token: "keyword"
		},
		{
			regex: /\S+/,
			token: "variable"
		},
		{
			regex: /\s+|./,
			token: null
		}
	],
	vocabulary: [
		{
			regex: /;/,
			token: "keyword",
			next: "start"
		},
		{
			regex: /\S+/,
			token: "tag"
		},
		{
			regex: /\s+|./,
			token: null
		}
	],
	string: [{
		regex: /(?:[^\\]|\\.)*?"/,
		token: "string",
		next: "start"
	}, {
		regex: /.*/,
		token: "string"
	}],
	string2: [{
		regex: /^;/,
		token: "keyword",
		next: "start"
	}, {
		regex: /.*/,
		token: "string"
	}],
	string3: [{
		regex: /(?:[^\\]|\\.)*?"""/,
		token: "string",
		next: "start"
	}, {
		regex: /.*/,
		token: "string"
	}],
	stack: [
		{
			regex: /\)/,
			token: "bracket",
			next: "start"
		},
		{
			regex: /--/,
			token: "bracket"
		},
		{
			regex: /\S+/,
			token: "meta"
		},
		{
			regex: /\s+|./,
			token: null
		}
	],
	languageData: {
		name: "factor",
		dontIndentStates: [
			"start",
			"vocabulary",
			"string",
			"string3",
			"stack"
		],
		commentTokens: { line: "!" }
	}
});
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/forth.js
function toWordList(words) {
	var ret = [];
	words.split(" ").forEach(function(e) {
		ret.push({ name: e });
	});
	return ret;
}
var coreWordList = toWordList("INVERT AND OR XOR 2* 2/ LSHIFT RSHIFT 0= = 0< < > U< MIN MAX 2DROP 2DUP 2OVER 2SWAP ?DUP DEPTH DROP DUP OVER ROT SWAP >R R> R@ + - 1+ 1- ABS NEGATE S>D * M* UM* FM/MOD SM/REM UM/MOD */ */MOD / /MOD MOD HERE , @ ! CELL+ CELLS C, C@ C! CHARS 2@ 2! ALIGN ALIGNED +! ALLOT CHAR [CHAR] [ ] BL FIND EXECUTE IMMEDIATE COUNT LITERAL STATE ; DOES> >BODY EVALUATE SOURCE >IN <# # #S #> HOLD SIGN BASE >NUMBER HEX DECIMAL FILL MOVE . CR EMIT SPACE SPACES TYPE U. .R U.R ACCEPT TRUE FALSE <> U> 0<> 0> NIP TUCK ROLL PICK 2>R 2R@ 2R> WITHIN UNUSED MARKER I J TO COMPILE, [COMPILE] SAVE-INPUT RESTORE-INPUT PAD ERASE 2LITERAL DNEGATE D- D+ D0< D0= D2* D2/ D< D= DMAX DMIN D>S DABS M+ M*/ D. D.R 2ROT DU< CATCH THROW FREE RESIZE ALLOCATE CS-PICK CS-ROLL GET-CURRENT SET-CURRENT FORTH-WORDLIST GET-ORDER SET-ORDER PREVIOUS SEARCH-WORDLIST WORDLIST FIND ALSO ONLY FORTH DEFINITIONS ORDER -TRAILING /STRING SEARCH COMPARE CMOVE CMOVE> BLANK SLITERAL");
var immediateWordList = toWordList("IF ELSE THEN BEGIN WHILE REPEAT UNTIL RECURSE [IF] [ELSE] [THEN] ?DO DO LOOP +LOOP UNLOOP LEAVE EXIT AGAIN CASE OF ENDOF ENDCASE");
function searchWordList(wordList, word) {
	var i;
	for (i = wordList.length - 1; i >= 0; i--) if (wordList[i].name === word.toUpperCase()) return wordList[i];
}
var forth = {
	name: "forth",
	startState: function() {
		return {
			state: "",
			base: 10,
			coreWordList,
			immediateWordList,
			wordList: []
		};
	},
	token: function(stream, stt) {
		var mat;
		if (stream.eatSpace()) return null;
		if (stt.state === "") {
			if (stream.match(/^(\]|:NONAME)(\s|$)/i)) {
				stt.state = " compilation";
				return "builtin";
			}
			mat = stream.match(/^(\:)\s+(\S+)(\s|$)+/);
			if (mat) {
				stt.wordList.push({ name: mat[2].toUpperCase() });
				stt.state = " compilation";
				return "def";
			}
			mat = stream.match(/^(VARIABLE|2VARIABLE|CONSTANT|2CONSTANT|CREATE|POSTPONE|VALUE|WORD)\s+(\S+)(\s|$)+/i);
			if (mat) {
				stt.wordList.push({ name: mat[2].toUpperCase() });
				return "def";
			}
			mat = stream.match(/^(\'|\[\'\])\s+(\S+)(\s|$)+/);
			if (mat) return "builtin";
		} else {
			if (stream.match(/^(\;|\[)(\s)/)) {
				stt.state = "";
				stream.backUp(1);
				return "builtin";
			}
			if (stream.match(/^(\;|\[)($)/)) {
				stt.state = "";
				return "builtin";
			}
			if (stream.match(/^(POSTPONE)\s+\S+(\s|$)+/)) return "builtin";
		}
		mat = stream.match(/^(\S+)(\s+|$)/);
		if (mat) {
			if (searchWordList(stt.wordList, mat[1]) !== void 0) return "variable";
			if (mat[1] === "\\") {
				stream.skipToEnd();
				return "comment";
			}
			if (searchWordList(stt.coreWordList, mat[1]) !== void 0) return "builtin";
			if (searchWordList(stt.immediateWordList, mat[1]) !== void 0) return "keyword";
			if (mat[1] === "(") {
				stream.eatWhile(function(s) {
					return s !== ")";
				});
				stream.eat(")");
				return "comment";
			}
			if (mat[1] === ".(") {
				stream.eatWhile(function(s) {
					return s !== ")";
				});
				stream.eat(")");
				return "string";
			}
			if (mat[1] === "S\"" || mat[1] === ".\"" || mat[1] === "C\"") {
				stream.eatWhile(function(s) {
					return s !== "\"";
				});
				stream.eat("\"");
				return "string";
			}
			if (mat[1] - 68719476735) return "number";
			return "atom";
		}
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/fortran.js
function words$13(array) {
	var keys = {};
	for (var i = 0; i < array.length; ++i) keys[array[i]] = true;
	return keys;
}
var keywords$28 = words$13([
	"abstract",
	"accept",
	"allocatable",
	"allocate",
	"array",
	"assign",
	"asynchronous",
	"backspace",
	"bind",
	"block",
	"byte",
	"call",
	"case",
	"class",
	"close",
	"common",
	"contains",
	"continue",
	"cycle",
	"data",
	"deallocate",
	"decode",
	"deferred",
	"dimension",
	"do",
	"elemental",
	"else",
	"encode",
	"end",
	"endif",
	"entry",
	"enumerator",
	"equivalence",
	"exit",
	"external",
	"extrinsic",
	"final",
	"forall",
	"format",
	"function",
	"generic",
	"go",
	"goto",
	"if",
	"implicit",
	"import",
	"include",
	"inquire",
	"intent",
	"interface",
	"intrinsic",
	"module",
	"namelist",
	"non_intrinsic",
	"non_overridable",
	"none",
	"nopass",
	"nullify",
	"open",
	"optional",
	"options",
	"parameter",
	"pass",
	"pause",
	"pointer",
	"print",
	"private",
	"program",
	"protected",
	"public",
	"pure",
	"read",
	"recursive",
	"result",
	"return",
	"rewind",
	"save",
	"select",
	"sequence",
	"stop",
	"subroutine",
	"target",
	"then",
	"to",
	"type",
	"use",
	"value",
	"volatile",
	"where",
	"while",
	"write"
]);
var builtins$7 = words$13([
	"abort",
	"abs",
	"access",
	"achar",
	"acos",
	"adjustl",
	"adjustr",
	"aimag",
	"aint",
	"alarm",
	"all",
	"allocated",
	"alog",
	"amax",
	"amin",
	"amod",
	"and",
	"anint",
	"any",
	"asin",
	"associated",
	"atan",
	"besj",
	"besjn",
	"besy",
	"besyn",
	"bit_size",
	"btest",
	"cabs",
	"ccos",
	"ceiling",
	"cexp",
	"char",
	"chdir",
	"chmod",
	"clog",
	"cmplx",
	"command_argument_count",
	"complex",
	"conjg",
	"cos",
	"cosh",
	"count",
	"cpu_time",
	"cshift",
	"csin",
	"csqrt",
	"ctime",
	"c_funloc",
	"c_loc",
	"c_associated",
	"c_null_ptr",
	"c_null_funptr",
	"c_f_pointer",
	"c_null_char",
	"c_alert",
	"c_backspace",
	"c_form_feed",
	"c_new_line",
	"c_carriage_return",
	"c_horizontal_tab",
	"c_vertical_tab",
	"dabs",
	"dacos",
	"dasin",
	"datan",
	"date_and_time",
	"dbesj",
	"dbesj",
	"dbesjn",
	"dbesy",
	"dbesy",
	"dbesyn",
	"dble",
	"dcos",
	"dcosh",
	"ddim",
	"derf",
	"derfc",
	"dexp",
	"digits",
	"dim",
	"dint",
	"dlog",
	"dlog",
	"dmax",
	"dmin",
	"dmod",
	"dnint",
	"dot_product",
	"dprod",
	"dsign",
	"dsinh",
	"dsin",
	"dsqrt",
	"dtanh",
	"dtan",
	"dtime",
	"eoshift",
	"epsilon",
	"erf",
	"erfc",
	"etime",
	"exit",
	"exp",
	"exponent",
	"extends_type_of",
	"fdate",
	"fget",
	"fgetc",
	"float",
	"floor",
	"flush",
	"fnum",
	"fputc",
	"fput",
	"fraction",
	"fseek",
	"fstat",
	"ftell",
	"gerror",
	"getarg",
	"get_command",
	"get_command_argument",
	"get_environment_variable",
	"getcwd",
	"getenv",
	"getgid",
	"getlog",
	"getpid",
	"getuid",
	"gmtime",
	"hostnm",
	"huge",
	"iabs",
	"iachar",
	"iand",
	"iargc",
	"ibclr",
	"ibits",
	"ibset",
	"ichar",
	"idate",
	"idim",
	"idint",
	"idnint",
	"ieor",
	"ierrno",
	"ifix",
	"imag",
	"imagpart",
	"index",
	"int",
	"ior",
	"irand",
	"isatty",
	"ishft",
	"ishftc",
	"isign",
	"iso_c_binding",
	"is_iostat_end",
	"is_iostat_eor",
	"itime",
	"kill",
	"kind",
	"lbound",
	"len",
	"len_trim",
	"lge",
	"lgt",
	"link",
	"lle",
	"llt",
	"lnblnk",
	"loc",
	"log",
	"logical",
	"long",
	"lshift",
	"lstat",
	"ltime",
	"matmul",
	"max",
	"maxexponent",
	"maxloc",
	"maxval",
	"mclock",
	"merge",
	"move_alloc",
	"min",
	"minexponent",
	"minloc",
	"minval",
	"mod",
	"modulo",
	"mvbits",
	"nearest",
	"new_line",
	"nint",
	"not",
	"or",
	"pack",
	"perror",
	"precision",
	"present",
	"product",
	"radix",
	"rand",
	"random_number",
	"random_seed",
	"range",
	"real",
	"realpart",
	"rename",
	"repeat",
	"reshape",
	"rrspacing",
	"rshift",
	"same_type_as",
	"scale",
	"scan",
	"second",
	"selected_int_kind",
	"selected_real_kind",
	"set_exponent",
	"shape",
	"short",
	"sign",
	"signal",
	"sinh",
	"sin",
	"sleep",
	"sngl",
	"spacing",
	"spread",
	"sqrt",
	"srand",
	"stat",
	"sum",
	"symlnk",
	"system",
	"system_clock",
	"tan",
	"tanh",
	"time",
	"tiny",
	"transfer",
	"transpose",
	"trim",
	"ttynam",
	"ubound",
	"umask",
	"unlink",
	"unpack",
	"verify",
	"xor",
	"zabs",
	"zcos",
	"zexp",
	"zlog",
	"zsin",
	"zsqrt"
]);
var dataTypes = words$13([
	"c_bool",
	"c_char",
	"c_double",
	"c_double_complex",
	"c_float",
	"c_float_complex",
	"c_funptr",
	"c_int",
	"c_int16_t",
	"c_int32_t",
	"c_int64_t",
	"c_int8_t",
	"c_int_fast16_t",
	"c_int_fast32_t",
	"c_int_fast64_t",
	"c_int_fast8_t",
	"c_int_least16_t",
	"c_int_least32_t",
	"c_int_least64_t",
	"c_int_least8_t",
	"c_intmax_t",
	"c_intptr_t",
	"c_long",
	"c_long_double",
	"c_long_double_complex",
	"c_long_long",
	"c_ptr",
	"c_short",
	"c_signed_char",
	"c_size_t",
	"character",
	"complex",
	"double",
	"integer",
	"logical",
	"real"
]);
var isOperatorChar$9 = /[+\-*&=<>\/\:]/;
var litOperator = /^\.(and|or|eq|lt|le|gt|ge|ne|not|eqv|neqv)\./i;
function tokenBase$31(stream, state) {
	if (stream.match(litOperator)) return "operator";
	var ch = stream.next();
	if (ch == "!") {
		stream.skipToEnd();
		return "comment";
	}
	if (ch == "\"" || ch == "'") {
		state.tokenize = tokenString$19(ch);
		return state.tokenize(stream, state);
	}
	if (/[\[\]\(\),]/.test(ch)) return null;
	if (/\d/.test(ch)) {
		stream.eatWhile(/[\w\.]/);
		return "number";
	}
	if (isOperatorChar$9.test(ch)) {
		stream.eatWhile(isOperatorChar$9);
		return "operator";
	}
	stream.eatWhile(/[\w\$_]/);
	var word = stream.current().toLowerCase();
	if (keywords$28.hasOwnProperty(word)) return "keyword";
	if (builtins$7.hasOwnProperty(word) || dataTypes.hasOwnProperty(word)) return "builtin";
	return "variable";
}
function tokenString$19(quote) {
	return function(stream, state) {
		var escaped = false, next, end = false;
		while ((next = stream.next()) != null) {
			if (next == quote && !escaped) {
				end = true;
				break;
			}
			escaped = !escaped && next == "\\";
		}
		if (end || !escaped) state.tokenize = null;
		return "string";
	};
}
var fortran = {
	name: "fortran",
	startState: function() {
		return { tokenize: null };
	},
	token: function(stream, state) {
		if (stream.eatSpace()) return null;
		var style = (state.tokenize || tokenBase$31)(stream, state);
		if (style == "comment" || style == "meta") return style;
		return style;
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/mllike.js
function mlLike(parserConfig) {
	var words = {
		"as": "keyword",
		"do": "keyword",
		"else": "keyword",
		"end": "keyword",
		"exception": "keyword",
		"fun": "keyword",
		"functor": "keyword",
		"if": "keyword",
		"in": "keyword",
		"include": "keyword",
		"let": "keyword",
		"of": "keyword",
		"open": "keyword",
		"rec": "keyword",
		"struct": "keyword",
		"then": "keyword",
		"type": "keyword",
		"val": "keyword",
		"while": "keyword",
		"with": "keyword"
	};
	var extraWords = parserConfig.extraWords || {};
	for (var prop in extraWords) if (extraWords.hasOwnProperty(prop)) words[prop] = parserConfig.extraWords[prop];
	var hintWords = [];
	for (var k in words) hintWords.push(k);
	function tokenBase(stream, state) {
		var ch = stream.next();
		if (ch === "\"") {
			state.tokenize = tokenString;
			return state.tokenize(stream, state);
		}
		if (ch === "{") {
			if (stream.eat("|")) {
				state.longString = true;
				state.tokenize = tokenLongString;
				return state.tokenize(stream, state);
			}
		}
		if (ch === "(") {
			if (stream.match(/^\*(?!\))/)) {
				state.commentLevel++;
				state.tokenize = tokenComment;
				return state.tokenize(stream, state);
			}
		}
		if (ch === "~" || ch === "?") {
			stream.eatWhile(/\w/);
			return "variableName.special";
		}
		if (ch === "`") {
			stream.eatWhile(/\w/);
			return "quote";
		}
		if (ch === "/" && parserConfig.slashComments && stream.eat("/")) {
			stream.skipToEnd();
			return "comment";
		}
		if (/\d/.test(ch)) {
			if (ch === "0" && stream.eat(/[bB]/)) stream.eatWhile(/[01]/);
			if (ch === "0" && stream.eat(/[xX]/)) stream.eatWhile(/[0-9a-fA-F]/);
			if (ch === "0" && stream.eat(/[oO]/)) stream.eatWhile(/[0-7]/);
			else {
				stream.eatWhile(/[\d_]/);
				if (stream.eat(".")) stream.eatWhile(/[\d]/);
				if (stream.eat(/[eE]/)) stream.eatWhile(/[\d\-+]/);
			}
			return "number";
		}
		if (/[+\-*&%=<>!?|@\.~:]/.test(ch)) return "operator";
		if (/[\w\xa1-\uffff]/.test(ch)) {
			stream.eatWhile(/[\w\xa1-\uffff]/);
			var cur = stream.current();
			return words.hasOwnProperty(cur) ? words[cur] : "variable";
		}
		return null;
	}
	function tokenString(stream, state) {
		var next, end = false, escaped = false;
		while ((next = stream.next()) != null) {
			if (next === "\"" && !escaped) {
				end = true;
				break;
			}
			escaped = !escaped && next === "\\";
		}
		if (end && !escaped) state.tokenize = tokenBase;
		return "string";
	}
	function tokenComment(stream, state) {
		var prev, next;
		while (state.commentLevel > 0 && (next = stream.next()) != null) {
			if (prev === "(" && next === "*") state.commentLevel++;
			if (prev === "*" && next === ")") state.commentLevel--;
			prev = next;
		}
		if (state.commentLevel <= 0) state.tokenize = tokenBase;
		return "comment";
	}
	function tokenLongString(stream, state) {
		var prev, next;
		while (state.longString && (next = stream.next()) != null) {
			if (prev === "|" && next === "}") state.longString = false;
			prev = next;
		}
		if (!state.longString) state.tokenize = tokenBase;
		return "string";
	}
	return {
		startState: function() {
			return {
				tokenize: tokenBase,
				commentLevel: 0,
				longString: false
			};
		},
		token: function(stream, state) {
			if (stream.eatSpace()) return null;
			return state.tokenize(stream, state);
		},
		languageData: {
			autocomplete: hintWords,
			commentTokens: {
				line: parserConfig.slashComments ? "//" : void 0,
				block: {
					open: "(*",
					close: "*)"
				}
			}
		}
	};
}
var oCaml = mlLike({
	name: "ocaml",
	extraWords: {
		"and": "keyword",
		"assert": "keyword",
		"begin": "keyword",
		"class": "keyword",
		"constraint": "keyword",
		"done": "keyword",
		"downto": "keyword",
		"external": "keyword",
		"function": "keyword",
		"initializer": "keyword",
		"lazy": "keyword",
		"match": "keyword",
		"method": "keyword",
		"module": "keyword",
		"mutable": "keyword",
		"new": "keyword",
		"nonrec": "keyword",
		"object": "keyword",
		"private": "keyword",
		"sig": "keyword",
		"to": "keyword",
		"try": "keyword",
		"value": "keyword",
		"virtual": "keyword",
		"when": "keyword",
		"raise": "builtin",
		"failwith": "builtin",
		"true": "builtin",
		"false": "builtin",
		"asr": "builtin",
		"land": "builtin",
		"lor": "builtin",
		"lsl": "builtin",
		"lsr": "builtin",
		"lxor": "builtin",
		"mod": "builtin",
		"or": "builtin",
		"raise_notrace": "builtin",
		"trace": "builtin",
		"exit": "builtin",
		"print_string": "builtin",
		"print_endline": "builtin",
		"int": "type",
		"float": "type",
		"bool": "type",
		"char": "type",
		"string": "type",
		"unit": "type",
		"List": "builtin"
	}
});
var fSharp = mlLike({
	name: "fsharp",
	extraWords: {
		"abstract": "keyword",
		"assert": "keyword",
		"base": "keyword",
		"begin": "keyword",
		"class": "keyword",
		"default": "keyword",
		"delegate": "keyword",
		"do!": "keyword",
		"done": "keyword",
		"downcast": "keyword",
		"downto": "keyword",
		"elif": "keyword",
		"extern": "keyword",
		"finally": "keyword",
		"for": "keyword",
		"function": "keyword",
		"global": "keyword",
		"inherit": "keyword",
		"inline": "keyword",
		"interface": "keyword",
		"internal": "keyword",
		"lazy": "keyword",
		"let!": "keyword",
		"match": "keyword",
		"member": "keyword",
		"module": "keyword",
		"mutable": "keyword",
		"namespace": "keyword",
		"new": "keyword",
		"null": "keyword",
		"override": "keyword",
		"private": "keyword",
		"public": "keyword",
		"return!": "keyword",
		"return": "keyword",
		"select": "keyword",
		"static": "keyword",
		"to": "keyword",
		"try": "keyword",
		"upcast": "keyword",
		"use!": "keyword",
		"use": "keyword",
		"void": "keyword",
		"when": "keyword",
		"yield!": "keyword",
		"yield": "keyword",
		"atomic": "keyword",
		"break": "keyword",
		"checked": "keyword",
		"component": "keyword",
		"const": "keyword",
		"constraint": "keyword",
		"constructor": "keyword",
		"continue": "keyword",
		"eager": "keyword",
		"event": "keyword",
		"external": "keyword",
		"fixed": "keyword",
		"method": "keyword",
		"mixin": "keyword",
		"object": "keyword",
		"parallel": "keyword",
		"process": "keyword",
		"protected": "keyword",
		"pure": "keyword",
		"sealed": "keyword",
		"tailcall": "keyword",
		"trait": "keyword",
		"virtual": "keyword",
		"volatile": "keyword",
		"List": "builtin",
		"Seq": "builtin",
		"Map": "builtin",
		"Set": "builtin",
		"Option": "builtin",
		"int": "builtin",
		"string": "builtin",
		"not": "builtin",
		"true": "builtin",
		"false": "builtin",
		"raise": "builtin",
		"failwith": "builtin"
	},
	slashComments: true
});
var sml = mlLike({
	name: "sml",
	extraWords: {
		"abstype": "keyword",
		"and": "keyword",
		"andalso": "keyword",
		"case": "keyword",
		"datatype": "keyword",
		"fn": "keyword",
		"handle": "keyword",
		"infix": "keyword",
		"infixr": "keyword",
		"local": "keyword",
		"nonfix": "keyword",
		"op": "keyword",
		"orelse": "keyword",
		"raise": "keyword",
		"withtype": "keyword",
		"eqtype": "keyword",
		"sharing": "keyword",
		"sig": "keyword",
		"signature": "keyword",
		"structure": "keyword",
		"where": "keyword",
		"true": "keyword",
		"false": "keyword",
		"int": "builtin",
		"real": "builtin",
		"string": "builtin",
		"char": "builtin",
		"bool": "builtin"
	},
	slashComments: true
});
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/gas.js
function mkGas(arch) {
	var custom = [];
	var lineCommentStartSymbol = "";
	var directives = {
		".abort": "builtin",
		".align": "builtin",
		".altmacro": "builtin",
		".ascii": "builtin",
		".asciz": "builtin",
		".balign": "builtin",
		".balignw": "builtin",
		".balignl": "builtin",
		".bundle_align_mode": "builtin",
		".bundle_lock": "builtin",
		".bundle_unlock": "builtin",
		".byte": "builtin",
		".cfi_startproc": "builtin",
		".comm": "builtin",
		".data": "builtin",
		".def": "builtin",
		".desc": "builtin",
		".dim": "builtin",
		".double": "builtin",
		".eject": "builtin",
		".else": "builtin",
		".elseif": "builtin",
		".end": "builtin",
		".endef": "builtin",
		".endfunc": "builtin",
		".endif": "builtin",
		".equ": "builtin",
		".equiv": "builtin",
		".eqv": "builtin",
		".err": "builtin",
		".error": "builtin",
		".exitm": "builtin",
		".extern": "builtin",
		".fail": "builtin",
		".file": "builtin",
		".fill": "builtin",
		".float": "builtin",
		".func": "builtin",
		".global": "builtin",
		".gnu_attribute": "builtin",
		".hidden": "builtin",
		".hword": "builtin",
		".ident": "builtin",
		".if": "builtin",
		".incbin": "builtin",
		".include": "builtin",
		".int": "builtin",
		".internal": "builtin",
		".irp": "builtin",
		".irpc": "builtin",
		".lcomm": "builtin",
		".lflags": "builtin",
		".line": "builtin",
		".linkonce": "builtin",
		".list": "builtin",
		".ln": "builtin",
		".loc": "builtin",
		".loc_mark_labels": "builtin",
		".local": "builtin",
		".long": "builtin",
		".macro": "builtin",
		".mri": "builtin",
		".noaltmacro": "builtin",
		".nolist": "builtin",
		".octa": "builtin",
		".offset": "builtin",
		".org": "builtin",
		".p2align": "builtin",
		".popsection": "builtin",
		".previous": "builtin",
		".print": "builtin",
		".protected": "builtin",
		".psize": "builtin",
		".purgem": "builtin",
		".pushsection": "builtin",
		".quad": "builtin",
		".reloc": "builtin",
		".rept": "builtin",
		".sbttl": "builtin",
		".scl": "builtin",
		".section": "builtin",
		".set": "builtin",
		".short": "builtin",
		".single": "builtin",
		".size": "builtin",
		".skip": "builtin",
		".sleb128": "builtin",
		".space": "builtin",
		".stab": "builtin",
		".string": "builtin",
		".struct": "builtin",
		".subsection": "builtin",
		".symver": "builtin",
		".tag": "builtin",
		".text": "builtin",
		".title": "builtin",
		".type": "builtin",
		".uleb128": "builtin",
		".val": "builtin",
		".version": "builtin",
		".vtable_entry": "builtin",
		".vtable_inherit": "builtin",
		".warning": "builtin",
		".weak": "builtin",
		".weakref": "builtin",
		".word": "builtin"
	};
	var registers = {};
	function x86() {
		lineCommentStartSymbol = "#";
		registers.al = "variable";
		registers.ah = "variable";
		registers.ax = "variable";
		registers.eax = "variableName.special";
		registers.rax = "variableName.special";
		registers.bl = "variable";
		registers.bh = "variable";
		registers.bx = "variable";
		registers.ebx = "variableName.special";
		registers.rbx = "variableName.special";
		registers.cl = "variable";
		registers.ch = "variable";
		registers.cx = "variable";
		registers.ecx = "variableName.special";
		registers.rcx = "variableName.special";
		registers.dl = "variable";
		registers.dh = "variable";
		registers.dx = "variable";
		registers.edx = "variableName.special";
		registers.rdx = "variableName.special";
		registers.si = "variable";
		registers.esi = "variableName.special";
		registers.rsi = "variableName.special";
		registers.di = "variable";
		registers.edi = "variableName.special";
		registers.rdi = "variableName.special";
		registers.sp = "variable";
		registers.esp = "variableName.special";
		registers.rsp = "variableName.special";
		registers.bp = "variable";
		registers.ebp = "variableName.special";
		registers.rbp = "variableName.special";
		registers.ip = "variable";
		registers.eip = "variableName.special";
		registers.rip = "variableName.special";
		registers.cs = "keyword";
		registers.ds = "keyword";
		registers.ss = "keyword";
		registers.es = "keyword";
		registers.fs = "keyword";
		registers.gs = "keyword";
	}
	function armv6() {
		lineCommentStartSymbol = "@";
		directives.syntax = "builtin";
		registers.r0 = "variable";
		registers.r1 = "variable";
		registers.r2 = "variable";
		registers.r3 = "variable";
		registers.r4 = "variable";
		registers.r5 = "variable";
		registers.r6 = "variable";
		registers.r7 = "variable";
		registers.r8 = "variable";
		registers.r9 = "variable";
		registers.r10 = "variable";
		registers.r11 = "variable";
		registers.r12 = "variable";
		registers.sp = "variableName.special";
		registers.lr = "variableName.special";
		registers.pc = "variableName.special";
		registers.r13 = registers.sp;
		registers.r14 = registers.lr;
		registers.r15 = registers.pc;
		custom.push(function(ch, stream) {
			if (ch === "#") {
				stream.eatWhile(/\w/);
				return "number";
			}
		});
	}
	if (arch === "x86") x86();
	else if (arch === "arm" || arch === "armv6") armv6();
	function nextUntilUnescaped(stream, end) {
		var escaped = false, next;
		while ((next = stream.next()) != null) {
			if (next === end && !escaped) return false;
			escaped = !escaped && next === "\\";
		}
		return escaped;
	}
	function clikeComment(stream, state) {
		var maybeEnd = false, ch;
		while ((ch = stream.next()) != null) {
			if (ch === "/" && maybeEnd) {
				state.tokenize = null;
				break;
			}
			maybeEnd = ch === "*";
		}
		return "comment";
	}
	return {
		name: "gas",
		startState: function() {
			return { tokenize: null };
		},
		token: function(stream, state) {
			if (state.tokenize) return state.tokenize(stream, state);
			if (stream.eatSpace()) return null;
			var style, cur, ch = stream.next();
			if (ch === "/") {
				if (stream.eat("*")) {
					state.tokenize = clikeComment;
					return clikeComment(stream, state);
				}
			}
			if (ch === lineCommentStartSymbol) {
				stream.skipToEnd();
				return "comment";
			}
			if (ch === "\"") {
				nextUntilUnescaped(stream, "\"");
				return "string";
			}
			if (ch === ".") {
				stream.eatWhile(/\w/);
				cur = stream.current().toLowerCase();
				style = directives[cur];
				return style || null;
			}
			if (ch === "=") {
				stream.eatWhile(/\w/);
				return "tag";
			}
			if (ch === "{") return "bracket";
			if (ch === "}") return "bracket";
			if (/\d/.test(ch)) {
				if (ch === "0" && stream.eat("x")) {
					stream.eatWhile(/[0-9a-fA-F]/);
					return "number";
				}
				stream.eatWhile(/\d/);
				return "number";
			}
			if (/\w/.test(ch)) {
				stream.eatWhile(/\w/);
				if (stream.eat(":")) return "tag";
				cur = stream.current().toLowerCase();
				style = registers[cur];
				return style || null;
			}
			for (var i = 0; i < custom.length; i++) {
				style = custom[i](ch, stream, state);
				if (style) return style;
			}
		},
		languageData: { commentTokens: {
			line: lineCommentStartSymbol,
			block: {
				open: "/*",
				close: "*/"
			}
		} }
	};
}
var gas = mkGas("x86");
mkGas("arm");
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/gherkin.js
var gherkin = {
	name: "gherkin",
	startState: function() {
		return {
			lineNumber: 0,
			tableHeaderLine: false,
			allowFeature: true,
			allowBackground: false,
			allowScenario: false,
			allowSteps: false,
			allowPlaceholders: false,
			allowMultilineArgument: false,
			inMultilineString: false,
			inMultilineTable: false,
			inKeywordLine: false
		};
	},
	token: function(stream, state) {
		if (stream.sol()) {
			state.lineNumber++;
			state.inKeywordLine = false;
			if (state.inMultilineTable) {
				state.tableHeaderLine = false;
				if (!stream.match(/\s*\|/, false)) {
					state.allowMultilineArgument = false;
					state.inMultilineTable = false;
				}
			}
		}
		stream.eatSpace();
		if (state.allowMultilineArgument) {
			if (state.inMultilineString) {
				if (stream.match("\"\"\"")) {
					state.inMultilineString = false;
					state.allowMultilineArgument = false;
				} else stream.match(/.*/);
				return "string";
			}
			if (state.inMultilineTable) {
				if (stream.match(/\|\s*/)) return "bracket";
				else {
					stream.match(/[^\|]*/);
					return state.tableHeaderLine ? "header" : "string";
				}
			}
			if (stream.match("\"\"\"")) {
				state.inMultilineString = true;
				return "string";
			} else if (stream.match("|")) {
				state.inMultilineTable = true;
				state.tableHeaderLine = true;
				return "bracket";
			}
		}
		if (stream.match(/#.*/)) return "comment";
		else if (!state.inKeywordLine && stream.match(/@\S+/)) return "tag";
		else if (!state.inKeywordLine && state.allowFeature && stream.match(/(機能|功能|フィーチャ|기능|โครงหลัก|ความสามารถ|ความต้องการทางธุรกิจ|ಹೆಚ್ಚಳ|గుణము|ਮੁਹਾਂਦਰਾ|ਨਕਸ਼ ਨੁਹਾਰ|ਖਾਸੀਅਤ|रूप लेख|وِیژگی|خاصية|תכונה|Функціонал|Функция|Функционалност|Функционал|Үзенчәлеклелек|Свойство|Особина|Мөмкинлек|Могућност|Λειτουργία|Δυνατότητα|Właściwość|Vlastnosť|Trajto|Tính năng|Savybė|Pretty much|Požiadavka|Požadavek|Potrzeba biznesowa|Özellik|Osobina|Ominaisuus|Omadus|OH HAI|Mogućnost|Mogucnost|Jellemző|Hwæt|Hwaet|Funzionalità|Funktionalitéit|Funktionalität|Funkcja|Funkcionalnost|Funkcionalitāte|Funkcia|Fungsi|Functionaliteit|Funcționalitate|Funcţionalitate|Functionalitate|Funcionalitat|Funcionalidade|Fonctionnalité|Fitur|Fīča|Feature|Eiginleiki|Egenskap|Egenskab|Característica|Caracteristica|Business Need|Aspekt|Arwedd|Ahoy matey!|Ability):/)) {
			state.allowScenario = true;
			state.allowBackground = true;
			state.allowPlaceholders = false;
			state.allowSteps = false;
			state.allowMultilineArgument = false;
			state.inKeywordLine = true;
			return "keyword";
		} else if (!state.inKeywordLine && state.allowBackground && stream.match(/(背景|배경|แนวคิด|ಹಿನ್ನೆಲೆ|నేపథ్యం|ਪਿਛੋਕੜ|पृष्ठभूमि|زمینه|الخلفية|רקע|Тарих|Предыстория|Предистория|Позадина|Передумова|Основа|Контекст|Кереш|Υπόβαθρο|Założenia|Yo\-ho\-ho|Tausta|Taust|Situācija|Rerefons|Pozadina|Pozadie|Pozadí|Osnova|Latar Belakang|Kontext|Konteksts|Kontekstas|Kontekst|Háttér|Hannergrond|Grundlage|Geçmiş|Fundo|Fono|First off|Dis is what went down|Dasar|Contexto|Contexte|Context|Contesto|Cenário de Fundo|Cenario de Fundo|Cefndir|Bối cảnh|Bakgrunnur|Bakgrunn|Bakgrund|Baggrund|Background|B4|Antecedents|Antecedentes|Ær|Aer|Achtergrond):/)) {
			state.allowPlaceholders = false;
			state.allowSteps = true;
			state.allowBackground = false;
			state.allowMultilineArgument = false;
			state.inKeywordLine = true;
			return "keyword";
		} else if (!state.inKeywordLine && state.allowScenario && stream.match(/(場景大綱|场景大纲|劇本大綱|剧本大纲|テンプレ|シナリオテンプレート|シナリオテンプレ|シナリオアウトライン|시나리오 개요|สรุปเหตุการณ์|โครงสร้างของเหตุการณ์|ವಿವರಣೆ|కథనం|ਪਟਕਥਾ ਰੂਪ ਰੇਖਾ|ਪਟਕਥਾ ਢਾਂਚਾ|परिदृश्य रूपरेखा|سيناريو مخطط|الگوی سناریو|תבנית תרחיש|Сценарийның төзелеше|Сценарий структураси|Структура сценарію|Структура сценария|Структура сценарија|Скица|Рамка на сценарий|Концепт|Περιγραφή Σεναρίου|Wharrimean is|Template Situai|Template Senario|Template Keadaan|Tapausaihio|Szenariogrundriss|Szablon scenariusza|Swa hwær swa|Swa hwaer swa|Struktura scenarija|Structură scenariu|Structura scenariu|Skica|Skenario konsep|Shiver me timbers|Senaryo taslağı|Schema dello scenario|Scenariomall|Scenariomal|Scenario Template|Scenario Outline|Scenario Amlinellol|Scenārijs pēc parauga|Scenarijaus šablonas|Reckon it's like|Raamstsenaarium|Plang vum Szenario|Plan du Scénario|Plan du scénario|Osnova scénáře|Osnova Scenára|Náčrt Scenáru|Náčrt Scénáře|Náčrt Scenára|MISHUN SRSLY|Menggariskan Senario|Lýsing Dæma|Lýsing Atburðarásar|Konturo de la scenaro|Koncept|Khung tình huống|Khung kịch bản|Forgatókönyv vázlat|Esquema do Cenário|Esquema do Cenario|Esquema del escenario|Esquema de l'escenari|Esbozo do escenario|Delineação do Cenário|Delineacao do Cenario|All y'all|Abstrakt Scenario|Abstract Scenario):/)) {
			state.allowPlaceholders = true;
			state.allowSteps = true;
			state.allowMultilineArgument = false;
			state.inKeywordLine = true;
			return "keyword";
		} else if (state.allowScenario && stream.match(/(例子|例|サンプル|예|ชุดของเหตุการณ์|ชุดของตัวอย่าง|ಉದಾಹರಣೆಗಳು|ఉదాహరణలు|ਉਦਾਹਰਨਾਂ|उदाहरण|نمونه ها|امثلة|דוגמאות|Үрнәкләр|Сценарији|Примеры|Примери|Приклади|Мисоллар|Мисаллар|Σενάρια|Παραδείγματα|You'll wanna|Voorbeelden|Variantai|Tapaukset|Se þe|Se the|Se ðe|Scenarios|Scenariji|Scenarijai|Przykłady|Primjeri|Primeri|Příklady|Príklady|Piemēri|Példák|Pavyzdžiai|Paraugs|Örnekler|Juhtumid|Exemplos|Exemples|Exemple|Exempel|EXAMPLZ|Examples|Esempi|Enghreifftiau|Ekzemploj|Eksempler|Ejemplos|Dữ liệu|Dead men tell no tales|Dæmi|Contoh|Cenários|Cenarios|Beispiller|Beispiele|Atburðarásir):/)) {
			state.allowPlaceholders = false;
			state.allowSteps = true;
			state.allowBackground = false;
			state.allowMultilineArgument = true;
			return "keyword";
		} else if (!state.inKeywordLine && state.allowScenario && stream.match(/(場景|场景|劇本|剧本|シナリオ|시나리오|เหตุการณ์|ಕಥಾಸಾರಾಂಶ|సన్నివేశం|ਪਟਕਥਾ|परिदृश्य|سيناريو|سناریو|תרחיש|Сценарій|Сценарио|Сценарий|Пример|Σενάριο|Tình huống|The thing of it is|Tapaus|Szenario|Swa|Stsenaarium|Skenario|Situai|Senaryo|Senario|Scenaro|Scenariusz|Scenariu|Scénario|Scenario|Scenarijus|Scenārijs|Scenarij|Scenarie|Scénář|Scenár|Primer|MISHUN|Kịch bản|Keadaan|Heave to|Forgatókönyv|Escenario|Escenari|Cenário|Cenario|Awww, look mate|Atburðarás):/)) {
			state.allowPlaceholders = false;
			state.allowSteps = true;
			state.allowBackground = false;
			state.allowMultilineArgument = false;
			state.inKeywordLine = true;
			return "keyword";
		} else if (!state.inKeywordLine && state.allowSteps && stream.match(/(那麼|那么|而且|當|当|并且|同時|同时|前提|假设|假設|假定|假如|但是|但し|並且|もし|ならば|ただし|しかし|かつ|하지만|조건|먼저|만일|만약|단|그리고|그러면|และ |เมื่อ |แต่ |ดังนั้น |กำหนดให้ |ಸ್ಥಿತಿಯನ್ನು |ಮತ್ತು |ನೀಡಿದ |ನಂತರ |ಆದರೆ |మరియు |చెప్పబడినది |కాని |ఈ పరిస్థితిలో |అప్పుడు |ਪਰ |ਤਦ |ਜੇਕਰ |ਜਿਵੇਂ ਕਿ |ਜਦੋਂ |ਅਤੇ |यदि |परन्तु |पर |तब |तदा |तथा |जब |चूंकि |किन्तु |कदा |और |अगर |و |هنگامی |متى |لكن |عندما |ثم |بفرض |با فرض |اما |اذاً |آنگاه |כאשר |וגם |בהינתן |אזי |אז |אבל |Якщо |Һәм |Унда |Тоді |Тогда |То |Также |Та |Пусть |Припустимо, що |Припустимо |Онда |Но |Нехай |Нәтиҗәдә |Лекин |Ләкин |Коли |Когда |Когато |Када |Кад |К тому же |І |И |Задато |Задати |Задате |Если |Допустим |Дано |Дадено |Вә |Ва |Бирок |Әмма |Әйтик |Әгәр |Аммо |Али |Але |Агар |А також |А |Τότε |Όταν |Και |Δεδομένου |Αλλά |Þurh |Þegar |Þa þe |Þá |Þa |Zatati |Zakładając |Zadato |Zadate |Zadano |Zadani |Zadan |Za předpokladu |Za predpokladu |Youse know when youse got |Youse know like when |Yna |Yeah nah |Y'know |Y |Wun |Wtedy |When y'all |When |Wenn |WEN |wann |Ve |Và |Und |Un |ugeholl |Too right |Thurh |Thì |Then y'all |Then |Tha the |Tha |Tetapi |Tapi |Tak |Tada |Tad |Stel |Soit |Siis |Și |Şi |Si |Sed |Se |Så |Quando |Quand |Quan |Pryd |Potom |Pokud |Pokiaľ |Però |Pero |Pak |Oraz |Onda |Ond |Oletetaan |Og |Och |O zaman |Niin |Nhưng |När |Når |Mutta |Men |Mas |Maka |Majd |Mając |Mais |Maar |mä |Ma |Lorsque |Lorsqu'|Logo |Let go and haul |Kun |Kuid |Kui |Kiedy |Khi |Ketika |Kemudian |Keď |Když |Kaj |Kai |Kada |Kad |Jeżeli |Jeśli |Ja |It's just unbelievable |Ir |I CAN HAZ |I |Ha |Givun |Givet |Given y'all |Given |Gitt |Gegeven |Gegeben seien |Gegeben sei |Gdy |Gangway! |Fakat |Étant donnés |Etant donnés |Étant données |Etant données |Étant donnée |Etant donnée |Étant donné |Etant donné |Et |És |Entonces |Entón |Então |Entao |En |Eğer ki |Ef |Eeldades |E |Ðurh |Duota |Dun |Donitaĵo |Donat |Donada |Do |Diyelim ki |Diberi |Dengan |Den youse gotta |DEN |De |Dato |Dați fiind |Daţi fiind |Dati fiind |Dati |Date fiind |Date |Data |Dat fiind |Dar |Dann |dann |Dan |Dados |Dado |Dadas |Dada |Ða ðe |Ða |Cuando |Cho |Cando |Când |Cand |Cal |But y'all |But at the end of the day I reckon |BUT |But |Buh |Blimey! |Biết |Bet |Bagi |Aye |awer |Avast! |Atunci |Atesa |Atès |Apabila |Anrhegedig a |Angenommen |And y'all |And |AN |An |an |Amikor |Amennyiben |Ama |Als |Alors |Allora |Ali |Aleshores |Ale |Akkor |Ak |Adott |Ac |Aber |A zároveň |A tiež |A taktiež |A také |A |a |7 |\* )/)) {
			state.inStep = true;
			state.allowPlaceholders = true;
			state.allowMultilineArgument = true;
			state.inKeywordLine = true;
			return "keyword";
		} else if (stream.match(/"[^"]*"?/)) return "string";
		else if (state.allowPlaceholders && stream.match(/<[^>]*>?/)) return "variable";
		else {
			stream.next();
			stream.eatWhile(/[^@"<#]/);
			return null;
		}
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/groovy.js
function words$12(str) {
	var obj = {}, words = str.split(" ");
	for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
	return obj;
}
var keywords$27 = words$12("abstract as assert boolean break byte case catch char class const continue def default do double else enum extends final finally float for goto if implements import in instanceof int interface long native new package private protected public return short static strictfp super switch synchronized threadsafe throw throws trait transient try void volatile while");
var blockKeywords$2 = words$12("catch class def do else enum finally for if interface switch trait try while");
var standaloneKeywords = words$12("return break continue");
var atoms$8 = words$12("null true false this");
var curPunc$8;
function tokenBase$30(stream, state) {
	var ch = stream.next();
	if (ch == "\"" || ch == "'") return startString$1(ch, stream, state);
	if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
		curPunc$8 = ch;
		return null;
	}
	if (/\d/.test(ch)) {
		stream.eatWhile(/[\w\.]/);
		if (stream.eat(/eE/)) {
			stream.eat(/\+\-/);
			stream.eatWhile(/\d/);
		}
		return "number";
	}
	if (ch == "/") {
		if (stream.eat("*")) {
			state.tokenize.push(tokenComment$14);
			return tokenComment$14(stream, state);
		}
		if (stream.eat("/")) {
			stream.skipToEnd();
			return "comment";
		}
		if (expectExpression(state.lastToken, false)) return startString$1(ch, stream, state);
	}
	if (ch == "-" && stream.eat(">")) {
		curPunc$8 = "->";
		return null;
	}
	if (/[+\-*&%=<>!?|\/~]/.test(ch)) {
		stream.eatWhile(/[+\-*&%=<>|~]/);
		return "operator";
	}
	stream.eatWhile(/[\w\$_]/);
	if (ch == "@") {
		stream.eatWhile(/[\w\$_\.]/);
		return "meta";
	}
	if (state.lastToken == ".") return "property";
	if (stream.eat(":")) {
		curPunc$8 = "proplabel";
		return "property";
	}
	var cur = stream.current();
	if (atoms$8.propertyIsEnumerable(cur)) return "atom";
	if (keywords$27.propertyIsEnumerable(cur)) {
		if (blockKeywords$2.propertyIsEnumerable(cur)) curPunc$8 = "newstatement";
		else if (standaloneKeywords.propertyIsEnumerable(cur)) curPunc$8 = "standalone";
		return "keyword";
	}
	return "variable";
}
tokenBase$30.isBase = true;
function startString$1(quote, stream, state) {
	var tripleQuoted = false;
	if (quote != "/" && stream.eat(quote)) {
		if (stream.eat(quote)) tripleQuoted = true;
		else return "string";
	}
	function t(stream, state) {
		var escaped = false, next, end = !tripleQuoted;
		while ((next = stream.next()) != null) {
			if (next == quote && !escaped) {
				if (!tripleQuoted) break;
				if (stream.match(quote + quote)) {
					end = true;
					break;
				}
			}
			if (quote == "\"" && next == "$" && !escaped) {
				if (stream.eat("{")) {
					state.tokenize.push(tokenBaseUntilBrace$1());
					return "string";
				} else if (stream.match(/^\w/, false)) {
					state.tokenize.push(tokenVariableDeref);
					return "string";
				}
			}
			escaped = !escaped && next == "\\";
		}
		if (end) state.tokenize.pop();
		return "string";
	}
	state.tokenize.push(t);
	return t(stream, state);
}
function tokenBaseUntilBrace$1() {
	var depth = 1;
	function t(stream, state) {
		if (stream.peek() == "}") {
			depth--;
			if (depth == 0) {
				state.tokenize.pop();
				return state.tokenize[state.tokenize.length - 1](stream, state);
			}
		} else if (stream.peek() == "{") depth++;
		return tokenBase$30(stream, state);
	}
	t.isBase = true;
	return t;
}
function tokenVariableDeref(stream, state) {
	var next = stream.match(/^(\.|[\w\$_]+)/);
	if (!next || !stream.match(next[0] == "." ? /^[\w$_]/ : /^\./)) state.tokenize.pop();
	if (!next) return state.tokenize[state.tokenize.length - 1](stream, state);
	return next[0] == "." ? null : "variable";
}
function tokenComment$14(stream, state) {
	var maybeEnd = false, ch;
	while (ch = stream.next()) {
		if (ch == "/" && maybeEnd) {
			state.tokenize.pop();
			break;
		}
		maybeEnd = ch == "*";
	}
	return "comment";
}
function expectExpression(last, newline) {
	return !last || last == "operator" || last == "->" || /[\.\[\{\(,;:]/.test(last) || last == "newstatement" || last == "keyword" || last == "proplabel" || last == "standalone" && !newline;
}
function Context$6(indented, column, type, align, prev) {
	this.indented = indented;
	this.column = column;
	this.type = type;
	this.align = align;
	this.prev = prev;
}
function pushContext$8(state, col, type) {
	return state.context = new Context$6(state.indented, col, type, null, state.context);
}
function popContext$8(state) {
	var t = state.context.type;
	if (t == ")" || t == "]" || t == "}") state.indented = state.context.indented;
	return state.context = state.context.prev;
}
var groovy = {
	name: "groovy",
	startState: function(indentUnit) {
		return {
			tokenize: [tokenBase$30],
			context: new Context$6(-indentUnit, 0, "top", false),
			indented: 0,
			startOfLine: true,
			lastToken: null
		};
	},
	token: function(stream, state) {
		var ctx = state.context;
		if (stream.sol()) {
			if (ctx.align == null) ctx.align = false;
			state.indented = stream.indentation();
			state.startOfLine = true;
			if (ctx.type == "statement" && !expectExpression(state.lastToken, true)) {
				popContext$8(state);
				ctx = state.context;
			}
		}
		if (stream.eatSpace()) return null;
		curPunc$8 = null;
		var style = state.tokenize[state.tokenize.length - 1](stream, state);
		if (style == "comment") return style;
		if (ctx.align == null) ctx.align = true;
		if ((curPunc$8 == ";" || curPunc$8 == ":") && ctx.type == "statement") popContext$8(state);
		else if (curPunc$8 == "->" && ctx.type == "statement" && ctx.prev.type == "}") {
			popContext$8(state);
			state.context.align = false;
		} else if (curPunc$8 == "{") pushContext$8(state, stream.column(), "}");
		else if (curPunc$8 == "[") pushContext$8(state, stream.column(), "]");
		else if (curPunc$8 == "(") pushContext$8(state, stream.column(), ")");
		else if (curPunc$8 == "}") {
			while (ctx.type == "statement") ctx = popContext$8(state);
			if (ctx.type == "}") ctx = popContext$8(state);
			while (ctx.type == "statement") ctx = popContext$8(state);
		} else if (curPunc$8 == ctx.type) popContext$8(state);
		else if (ctx.type == "}" || ctx.type == "top" || ctx.type == "statement" && curPunc$8 == "newstatement") pushContext$8(state, stream.column(), "statement");
		state.startOfLine = false;
		state.lastToken = curPunc$8 || style;
		return style;
	},
	indent: function(state, textAfter, cx) {
		if (!state.tokenize[state.tokenize.length - 1].isBase) return null;
		var firstChar = textAfter && textAfter.charAt(0), ctx = state.context;
		if (ctx.type == "statement" && !expectExpression(state.lastToken, true)) ctx = ctx.prev;
		var closing = firstChar == ctx.type;
		if (ctx.type == "statement") return ctx.indented + (firstChar == "{" ? 0 : cx.unit);
		else if (ctx.align) return ctx.column + (closing ? 0 : 1);
		else return ctx.indented + (closing ? 0 : cx.unit);
	},
	languageData: {
		indentOnInput: /^\s*[{}]$/,
		commentTokens: {
			line: "//",
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
			"'''",
			"\"\"\""
		] }
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/haskell.js
function switchState(source, setState, f) {
	setState(f);
	return f(source, setState);
}
var smallRE = /[a-z_]/;
var largeRE = /[A-Z]/;
var digitRE = /\d/;
var hexitRE = /[0-9A-Fa-f]/;
var octitRE = /[0-7]/;
var idRE = /[a-z_A-Z0-9'\xa1-\uffff]/;
var symbolRE = /[-!#$%&*+.\/<=>?@\\^|~:]/;
var specialRE = /[(),;[\]`{}]/;
var whiteCharRE = /[ \t\v\f]/;
function normal$1(source, setState) {
	if (source.eatWhile(whiteCharRE)) return null;
	var ch = source.next();
	if (specialRE.test(ch)) {
		if (ch == "{" && source.eat("-")) {
			var t = "comment";
			if (source.eat("#")) t = "meta";
			return switchState(source, setState, ncomment(t, 1));
		}
		return null;
	}
	if (ch == "'") {
		if (source.eat("\\")) source.next();
		else source.next();
		if (source.eat("'")) return "string";
		return "error";
	}
	if (ch == "\"") return switchState(source, setState, stringLiteral);
	if (largeRE.test(ch)) {
		source.eatWhile(idRE);
		if (source.eat(".")) return "qualifier";
		return "type";
	}
	if (smallRE.test(ch)) {
		source.eatWhile(idRE);
		return "variable";
	}
	if (digitRE.test(ch)) {
		if (ch == "0") {
			if (source.eat(/[xX]/)) {
				source.eatWhile(hexitRE);
				return "integer";
			}
			if (source.eat(/[oO]/)) {
				source.eatWhile(octitRE);
				return "number";
			}
		}
		source.eatWhile(digitRE);
		var t = "number";
		if (source.match(/^\.\d+/)) t = "number";
		if (source.eat(/[eE]/)) {
			t = "number";
			source.eat(/[-+]/);
			source.eatWhile(digitRE);
		}
		return t;
	}
	if (ch == "." && source.eat(".")) return "keyword";
	if (symbolRE.test(ch)) {
		if (ch == "-" && source.eat(/-/)) {
			source.eatWhile(/-/);
			if (!source.eat(symbolRE)) {
				source.skipToEnd();
				return "comment";
			}
		}
		source.eatWhile(symbolRE);
		return "variable";
	}
	return "error";
}
function ncomment(type, nest) {
	if (nest == 0) return normal$1;
	return function(source, setState) {
		var currNest = nest;
		while (!source.eol()) {
			var ch = source.next();
			if (ch == "{" && source.eat("-")) ++currNest;
			else if (ch == "-" && source.eat("}")) {
				--currNest;
				if (currNest == 0) {
					setState(normal$1);
					return type;
				}
			}
		}
		setState(ncomment(type, currNest));
		return type;
	};
}
function stringLiteral(source, setState) {
	while (!source.eol()) {
		var ch = source.next();
		if (ch == "\"") {
			setState(normal$1);
			return "string";
		}
		if (ch == "\\") {
			if (source.eol() || source.eat(whiteCharRE)) {
				setState(stringGap);
				return "string";
			}
			if (source.eat("&")) {} else source.next();
		}
	}
	setState(normal$1);
	return "error";
}
function stringGap(source, setState) {
	if (source.eat("\\")) return switchState(source, setState, stringLiteral);
	source.next();
	setState(normal$1);
	return "error";
}
var wellKnownWords = (function() {
	var wkw = {};
	function setType(t) {
		return function() {
			for (var i = 0; i < arguments.length; i++) wkw[arguments[i]] = t;
		};
	}
	setType("keyword")("case", "class", "data", "default", "deriving", "do", "else", "foreign", "if", "import", "in", "infix", "infixl", "infixr", "instance", "let", "module", "newtype", "of", "then", "type", "where", "_");
	setType("keyword")("..", ":", "::", "=", "\\", "<-", "->", "@", "~", "=>");
	setType("builtin")("!!", "$!", "$", "&&", "+", "++", "-", ".", "/", "/=", "<", "<*", "<=", "<$>", "<*>", "=<<", "==", ">", ">=", ">>", ">>=", "^", "^^", "||", "*", "*>", "**");
	setType("builtin")("Applicative", "Bool", "Bounded", "Char", "Double", "EQ", "Either", "Enum", "Eq", "False", "FilePath", "Float", "Floating", "Fractional", "Functor", "GT", "IO", "IOError", "Int", "Integer", "Integral", "Just", "LT", "Left", "Maybe", "Monad", "Nothing", "Num", "Ord", "Ordering", "Rational", "Read", "ReadS", "Real", "RealFloat", "RealFrac", "Right", "Show", "ShowS", "String", "True");
	setType("builtin")("abs", "acos", "acosh", "all", "and", "any", "appendFile", "asTypeOf", "asin", "asinh", "atan", "atan2", "atanh", "break", "catch", "ceiling", "compare", "concat", "concatMap", "const", "cos", "cosh", "curry", "cycle", "decodeFloat", "div", "divMod", "drop", "dropWhile", "either", "elem", "encodeFloat", "enumFrom", "enumFromThen", "enumFromThenTo", "enumFromTo", "error", "even", "exp", "exponent", "fail", "filter", "flip", "floatDigits", "floatRadix", "floatRange", "floor", "fmap", "foldl", "foldl1", "foldr", "foldr1", "fromEnum", "fromInteger", "fromIntegral", "fromRational", "fst", "gcd", "getChar", "getContents", "getLine", "head", "id", "init", "interact", "ioError", "isDenormalized", "isIEEE", "isInfinite", "isNaN", "isNegativeZero", "iterate", "last", "lcm", "length", "lex", "lines", "log", "logBase", "lookup", "map", "mapM", "mapM_", "max", "maxBound", "maximum", "maybe", "min", "minBound", "minimum", "mod", "negate", "not", "notElem", "null", "odd", "or", "otherwise", "pi", "pred", "print", "product", "properFraction", "pure", "putChar", "putStr", "putStrLn", "quot", "quotRem", "read", "readFile", "readIO", "readList", "readLn", "readParen", "reads", "readsPrec", "realToFrac", "recip", "rem", "repeat", "replicate", "return", "reverse", "round", "scaleFloat", "scanl", "scanl1", "scanr", "scanr1", "seq", "sequence", "sequence_", "show", "showChar", "showList", "showParen", "showString", "shows", "showsPrec", "significand", "signum", "sin", "sinh", "snd", "span", "splitAt", "sqrt", "subtract", "succ", "sum", "tail", "take", "takeWhile", "tan", "tanh", "toEnum", "toInteger", "toRational", "truncate", "uncurry", "undefined", "unlines", "until", "unwords", "unzip", "unzip3", "userError", "words", "writeFile", "zip", "zip3", "zipWith", "zipWith3");
	return wkw;
})();
var haskell = {
	name: "haskell",
	startState: function() {
		return { f: normal$1 };
	},
	copyState: function(s) {
		return { f: s.f };
	},
	token: function(stream, state) {
		var t = state.f(stream, function(s) {
			state.f = s;
		});
		var w = stream.current();
		return wellKnownWords.hasOwnProperty(w) ? wellKnownWords[w] : t;
	},
	languageData: { commentTokens: {
		line: "--",
		block: {
			open: "{-",
			close: "-}"
		}
	} }
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/haxe.js
function kw(type) {
	return {
		type,
		style: "keyword"
	};
}
var A = kw("keyword a");
var B = kw("keyword b");
var C = kw("keyword c");
var operator = kw("operator");
var atom = {
	type: "atom",
	style: "atom"
};
var attribute$1 = {
	type: "attribute",
	style: "attribute"
};
var type$1 = kw("typedef");
var keywords$26 = {
	"if": A,
	"while": A,
	"else": B,
	"do": B,
	"try": B,
	"return": C,
	"break": C,
	"continue": C,
	"new": C,
	"throw": C,
	"var": kw("var"),
	"inline": attribute$1,
	"static": attribute$1,
	"using": kw("import"),
	"public": attribute$1,
	"private": attribute$1,
	"cast": kw("cast"),
	"import": kw("import"),
	"macro": kw("macro"),
	"function": kw("function"),
	"catch": kw("catch"),
	"untyped": kw("untyped"),
	"callback": kw("cb"),
	"for": kw("for"),
	"switch": kw("switch"),
	"case": kw("case"),
	"default": kw("default"),
	"in": operator,
	"never": kw("property_access"),
	"trace": kw("trace"),
	"class": type$1,
	"abstract": type$1,
	"enum": type$1,
	"interface": type$1,
	"typedef": type$1,
	"extends": type$1,
	"implements": type$1,
	"dynamic": type$1,
	"true": atom,
	"false": atom,
	"null": atom
};
var isOperatorChar$8 = /[+\-*&%=<>!?|]/;
function chain$6(stream, state, f) {
	state.tokenize = f;
	return f(stream, state);
}
function toUnescaped(stream, end) {
	var escaped = false, next;
	while ((next = stream.next()) != null) {
		if (next == end && !escaped) return true;
		escaped = !escaped && next == "\\";
	}
}
var type$1;
var content;
function ret(tp, style, cont) {
	type$1 = tp;
	content = cont;
	return style;
}
function haxeTokenBase(stream, state) {
	var ch = stream.next();
	if (ch == "\"" || ch == "'") return chain$6(stream, state, haxeTokenString(ch));
	else if (/[\[\]{}\(\),;\:\.]/.test(ch)) return ret(ch);
	else if (ch == "0" && stream.eat(/x/i)) {
		stream.eatWhile(/[\da-f]/i);
		return ret("number", "number");
	} else if (/\d/.test(ch) || ch == "-" && stream.eat(/\d/)) {
		stream.match(/^\d*(?:\.\d*(?!\.))?(?:[eE][+\-]?\d+)?/);
		return ret("number", "number");
	} else if (state.reAllowed && ch == "~" && stream.eat(/\//)) {
		toUnescaped(stream, "/");
		stream.eatWhile(/[gimsu]/);
		return ret("regexp", "string.special");
	} else if (ch == "/") {
		if (stream.eat("*")) return chain$6(stream, state, haxeTokenComment);
		else if (stream.eat("/")) {
			stream.skipToEnd();
			return ret("comment", "comment");
		} else {
			stream.eatWhile(isOperatorChar$8);
			return ret("operator", null, stream.current());
		}
	} else if (ch == "#") {
		stream.skipToEnd();
		return ret("conditional", "meta");
	} else if (ch == "@") {
		stream.eat(/:/);
		stream.eatWhile(/[\w_]/);
		return ret("metadata", "meta");
	} else if (isOperatorChar$8.test(ch)) {
		stream.eatWhile(isOperatorChar$8);
		return ret("operator", null, stream.current());
	} else {
		var word;
		if (/[A-Z]/.test(ch)) {
			stream.eatWhile(/[\w_<>]/);
			word = stream.current();
			return ret("type", "type", word);
		} else {
			stream.eatWhile(/[\w_]/);
			var word = stream.current(), known = keywords$26.propertyIsEnumerable(word) && keywords$26[word];
			return known && state.kwAllowed ? ret(known.type, known.style, word) : ret("variable", "variable", word);
		}
	}
}
function haxeTokenString(quote) {
	return function(stream, state) {
		if (toUnescaped(stream, quote)) state.tokenize = haxeTokenBase;
		return ret("string", "string");
	};
}
function haxeTokenComment(stream, state) {
	var maybeEnd = false, ch;
	while (ch = stream.next()) {
		if (ch == "/" && maybeEnd) {
			state.tokenize = haxeTokenBase;
			break;
		}
		maybeEnd = ch == "*";
	}
	return ret("comment", "comment");
}
var atomicTypes = {
	"atom": true,
	"number": true,
	"variable": true,
	"string": true,
	"regexp": true
};
function HaxeLexical(indented, column, type, align, prev, info) {
	this.indented = indented;
	this.column = column;
	this.type = type;
	this.prev = prev;
	this.info = info;
	if (align != null) this.align = align;
}
function inScope(state, varname) {
	for (var v = state.localVars; v; v = v.next) if (v.name == varname) return true;
}
function parseHaxe(state, style, type, content, stream) {
	var cc = state.cc;
	cx.state = state;
	cx.stream = stream;
	cx.marked = null, cx.cc = cc;
	if (!state.lexical.hasOwnProperty("align")) state.lexical.align = true;
	while (true) if ((cc.length ? cc.pop() : statement)(type, content)) {
		while (cc.length && cc[cc.length - 1].lex) cc.pop()();
		if (cx.marked) return cx.marked;
		if (type == "variable" && inScope(state, content)) return "variableName.local";
		if (type == "variable" && imported(state, content)) return "variableName.special";
		return style;
	}
}
function imported(state, typename) {
	if (/[a-z]/.test(typename.charAt(0))) return false;
	var len = state.importedtypes.length;
	for (var i = 0; i < len; i++) if (state.importedtypes[i] == typename) return true;
}
function registerimport(importname) {
	var state = cx.state;
	for (var t = state.importedtypes; t; t = t.next) if (t.name == importname) return;
	state.importedtypes = {
		name: importname,
		next: state.importedtypes
	};
}
var cx = {
	state: null,
	column: null,
	marked: null,
	cc: null
};
function pass$1() {
	for (var i = arguments.length - 1; i >= 0; i--) cx.cc.push(arguments[i]);
}
function cont() {
	pass$1.apply(null, arguments);
	return true;
}
function inList(name, list) {
	for (var v = list; v; v = v.next) if (v.name == name) return true;
	return false;
}
function register(varname) {
	var state = cx.state;
	if (state.context) {
		cx.marked = "def";
		if (inList(varname, state.localVars)) return;
		state.localVars = {
			name: varname,
			next: state.localVars
		};
	} else if (state.globalVars) {
		if (inList(varname, state.globalVars)) return;
		state.globalVars = {
			name: varname,
			next: state.globalVars
		};
	}
}
var defaultVars = {
	name: "this",
	next: null
};
function pushcontext() {
	if (!cx.state.context) cx.state.localVars = defaultVars;
	cx.state.context = {
		prev: cx.state.context,
		vars: cx.state.localVars
	};
}
function popcontext() {
	cx.state.localVars = cx.state.context.vars;
	cx.state.context = cx.state.context.prev;
}
popcontext.lex = true;
function pushlex(type, info) {
	var result = function() {
		var state = cx.state;
		state.lexical = new HaxeLexical(state.indented, cx.stream.column(), type, null, state.lexical, info);
	};
	result.lex = true;
	return result;
}
function poplex() {
	var state = cx.state;
	if (state.lexical.prev) {
		if (state.lexical.type == ")") state.indented = state.lexical.indented;
		state.lexical = state.lexical.prev;
	}
}
poplex.lex = true;
function expect(wanted) {
	function f(type) {
		if (type == wanted) return cont();
		else if (wanted == ";") return pass$1();
		else return cont(f);
	}
	return f;
}
function statement(type) {
	if (type == "@") return cont(metadef);
	if (type == "var") return cont(pushlex("vardef"), vardef1, expect(";"), poplex);
	if (type == "keyword a") return cont(pushlex("form"), expression, statement, poplex);
	if (type == "keyword b") return cont(pushlex("form"), statement, poplex);
	if (type == "{") return cont(pushlex("}"), pushcontext, block$1, poplex, popcontext);
	if (type == ";") return cont();
	if (type == "attribute") return cont(maybeattribute);
	if (type == "function") return cont(functiondef);
	if (type == "for") return cont(pushlex("form"), expect("("), pushlex(")"), forspec1, expect(")"), poplex, statement, poplex);
	if (type == "variable") return cont(pushlex("stat"), maybelabel);
	if (type == "switch") return cont(pushlex("form"), expression, pushlex("}", "switch"), expect("{"), block$1, poplex, poplex);
	if (type == "case") return cont(expression, expect(":"));
	if (type == "default") return cont(expect(":"));
	if (type == "catch") return cont(pushlex("form"), pushcontext, expect("("), funarg, expect(")"), statement, poplex, popcontext);
	if (type == "import") return cont(importdef, expect(";"));
	if (type == "typedef") return cont(typedef);
	return pass$1(pushlex("stat"), expression, expect(";"), poplex);
}
function expression(type) {
	if (atomicTypes.hasOwnProperty(type)) return cont(maybeoperator);
	if (type == "type") return cont(maybeoperator);
	if (type == "function") return cont(functiondef);
	if (type == "keyword c") return cont(maybeexpression);
	if (type == "(") return cont(pushlex(")"), maybeexpression, expect(")"), poplex, maybeoperator);
	if (type == "operator") return cont(expression);
	if (type == "[") return cont(pushlex("]"), commasep(maybeexpression, "]"), poplex, maybeoperator);
	if (type == "{") return cont(pushlex("}"), commasep(objprop, "}"), poplex, maybeoperator);
	return cont();
}
function maybeexpression(type) {
	if (type.match(/[;\}\)\],]/)) return pass$1();
	return pass$1(expression);
}
function maybeoperator(type, value) {
	if (type == "operator" && /\+\+|--/.test(value)) return cont(maybeoperator);
	if (type == "operator" || type == ":") return cont(expression);
	if (type == ";") return;
	if (type == "(") return cont(pushlex(")"), commasep(expression, ")"), poplex, maybeoperator);
	if (type == ".") return cont(property$1, maybeoperator);
	if (type == "[") return cont(pushlex("]"), expression, expect("]"), poplex, maybeoperator);
}
function maybeattribute(type) {
	if (type == "attribute") return cont(maybeattribute);
	if (type == "function") return cont(functiondef);
	if (type == "var") return cont(vardef1);
}
function metadef(type) {
	if (type == ":") return cont(metadef);
	if (type == "variable") return cont(metadef);
	if (type == "(") return cont(pushlex(")"), commasep(metaargs, ")"), poplex, statement);
}
function metaargs(type) {
	if (type == "variable") return cont();
}
function importdef(type, value) {
	if (type == "variable" && /[A-Z]/.test(value.charAt(0))) {
		registerimport(value);
		return cont();
	} else if (type == "variable" || type == "property" || type == "." || value == "*") return cont(importdef);
}
function typedef(type, value) {
	if (type == "variable" && /[A-Z]/.test(value.charAt(0))) {
		registerimport(value);
		return cont();
	} else if (type == "type" && /[A-Z]/.test(value.charAt(0))) return cont();
}
function maybelabel(type) {
	if (type == ":") return cont(poplex, statement);
	return pass$1(maybeoperator, expect(";"), poplex);
}
function property$1(type) {
	if (type == "variable") {
		cx.marked = "property";
		return cont();
	}
}
function objprop(type) {
	if (type == "variable") cx.marked = "property";
	if (atomicTypes.hasOwnProperty(type)) return cont(expect(":"), expression);
}
function commasep(what, end) {
	function proceed(type) {
		if (type == ",") return cont(what, proceed);
		if (type == end) return cont();
		return cont(expect(end));
	}
	return function(type) {
		if (type == end) return cont();
		else return pass$1(what, proceed);
	};
}
function block$1(type) {
	if (type == "}") return cont();
	return pass$1(statement, block$1);
}
function vardef1(type, value) {
	if (type == "variable") {
		register(value);
		return cont(typeuse, vardef2);
	}
	return cont();
}
function vardef2(type, value) {
	if (value == "=") return cont(expression, vardef2);
	if (type == ",") return cont(vardef1);
}
function forspec1(type, value) {
	if (type == "variable") {
		register(value);
		return cont(forin, expression);
	} else return pass$1();
}
function forin(_type, value) {
	if (value == "in") return cont();
}
function functiondef(type, value) {
	if (type == "variable" || type == "type") {
		register(value);
		return cont(functiondef);
	}
	if (value == "new") return cont(functiondef);
	if (type == "(") return cont(pushlex(")"), pushcontext, commasep(funarg, ")"), poplex, typeuse, statement, popcontext);
}
function typeuse(type) {
	if (type == ":") return cont(typestring);
}
function typestring(type) {
	if (type == "type") return cont();
	if (type == "variable") return cont();
	if (type == "{") return cont(pushlex("}"), commasep(typeprop, "}"), poplex);
}
function typeprop(type) {
	if (type == "variable") return cont(typeuse);
}
function funarg(type, value) {
	if (type == "variable") {
		register(value);
		return cont(typeuse);
	}
}
var haxe = {
	name: "haxe",
	startState: function(indentUnit) {
		return {
			tokenize: haxeTokenBase,
			reAllowed: true,
			kwAllowed: true,
			cc: [],
			lexical: new HaxeLexical(-indentUnit, 0, "block", false),
			importedtypes: [
				"Int",
				"Float",
				"String",
				"Void",
				"Std",
				"Bool",
				"Dynamic",
				"Array"
			],
			context: null,
			indented: 0
		};
	},
	token: function(stream, state) {
		if (stream.sol()) {
			if (!state.lexical.hasOwnProperty("align")) state.lexical.align = false;
			state.indented = stream.indentation();
		}
		if (stream.eatSpace()) return null;
		var style = state.tokenize(stream, state);
		if (type$1 == "comment") return style;
		state.reAllowed = !!(type$1 == "operator" || type$1 == "keyword c" || type$1.match(/^[\[{}\(,;:]$/));
		state.kwAllowed = type$1 != ".";
		return parseHaxe(state, style, type$1, content, stream);
	},
	indent: function(state, textAfter, cx) {
		if (state.tokenize != haxeTokenBase) return 0;
		var firstChar = textAfter && textAfter.charAt(0), lexical = state.lexical;
		if (lexical.type == "stat" && firstChar == "}") lexical = lexical.prev;
		var type = lexical.type, closing = firstChar == type;
		if (type == "vardef") return lexical.indented + 4;
		else if (type == "form" && firstChar == "{") return lexical.indented;
		else if (type == "stat" || type == "form") return lexical.indented + cx.unit;
		else if (lexical.info == "switch" && !closing) return lexical.indented + (/^(?:case|default)\b/.test(textAfter) ? cx.unit : 2 * cx.unit);
		else if (lexical.align) return lexical.column + (closing ? 0 : 1);
		else return lexical.indented + (closing ? 0 : cx.unit);
	},
	languageData: {
		indentOnInput: /^\s*[{}]$/,
		commentTokens: {
			line: "//",
			block: {
				open: "/*",
				close: "*/"
			}
		}
	}
};
var hxml = {
	name: "hxml",
	startState: function() {
		return {
			define: false,
			inString: false
		};
	},
	token: function(stream, state) {
		var ch = stream.peek();
		var sol = stream.sol();
		if (ch == "#") {
			stream.skipToEnd();
			return "comment";
		}
		if (sol && ch == "-") {
			var style = "variable-2";
			stream.eat(/-/);
			if (stream.peek() == "-") {
				stream.eat(/-/);
				style = "keyword a";
			}
			if (stream.peek() == "D") {
				stream.eat(/[D]/);
				style = "keyword c";
				state.define = true;
			}
			stream.eatWhile(/[A-Z]/i);
			return style;
		}
		var ch = stream.peek();
		if (state.inString == false && ch == "'") {
			state.inString = true;
			stream.next();
		}
		if (state.inString == true) {
			if (stream.skipTo("'")) {} else stream.skipToEnd();
			if (stream.peek() == "'") {
				stream.next();
				state.inString = false;
			}
			return "string";
		}
		stream.next();
		return null;
	},
	languageData: { commentTokens: { line: "#" } }
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/idl.js
function wordRegexp$11(words) {
	return new RegExp("^((" + words.join(")|(") + "))\\b", "i");
}
var builtinArray$1 = [
	"a_correlate",
	"abs",
	"acos",
	"adapt_hist_equal",
	"alog",
	"alog2",
	"alog10",
	"amoeba",
	"annotate",
	"app_user_dir",
	"app_user_dir_query",
	"arg_present",
	"array_equal",
	"array_indices",
	"arrow",
	"ascii_template",
	"asin",
	"assoc",
	"atan",
	"axis",
	"axis",
	"bandpass_filter",
	"bandreject_filter",
	"barplot",
	"bar_plot",
	"beseli",
	"beselj",
	"beselk",
	"besely",
	"beta",
	"biginteger",
	"bilinear",
	"bin_date",
	"binary_template",
	"bindgen",
	"binomial",
	"bit_ffs",
	"bit_population",
	"blas_axpy",
	"blk_con",
	"boolarr",
	"boolean",
	"boxplot",
	"box_cursor",
	"breakpoint",
	"broyden",
	"bubbleplot",
	"butterworth",
	"bytarr",
	"byte",
	"byteorder",
	"bytscl",
	"c_correlate",
	"calendar",
	"caldat",
	"call_external",
	"call_function",
	"call_method",
	"call_procedure",
	"canny",
	"catch",
	"cd",
	"cdf",
	"ceil",
	"chebyshev",
	"check_math",
	"chisqr_cvf",
	"chisqr_pdf",
	"choldc",
	"cholsol",
	"cindgen",
	"cir_3pnt",
	"clipboard",
	"close",
	"clust_wts",
	"cluster",
	"cluster_tree",
	"cmyk_convert",
	"code_coverage",
	"color_convert",
	"color_exchange",
	"color_quan",
	"color_range_map",
	"colorbar",
	"colorize_sample",
	"colormap_applicable",
	"colormap_gradient",
	"colormap_rotation",
	"colortable",
	"comfit",
	"command_line_args",
	"common",
	"compile_opt",
	"complex",
	"complexarr",
	"complexround",
	"compute_mesh_normals",
	"cond",
	"congrid",
	"conj",
	"constrained_min",
	"contour",
	"contour",
	"convert_coord",
	"convol",
	"convol_fft",
	"coord2to3",
	"copy_lun",
	"correlate",
	"cos",
	"cosh",
	"cpu",
	"cramer",
	"createboxplotdata",
	"create_cursor",
	"create_struct",
	"create_view",
	"crossp",
	"crvlength",
	"ct_luminance",
	"cti_test",
	"cursor",
	"curvefit",
	"cv_coord",
	"cvttobm",
	"cw_animate",
	"cw_animate_getp",
	"cw_animate_load",
	"cw_animate_run",
	"cw_arcball",
	"cw_bgroup",
	"cw_clr_index",
	"cw_colorsel",
	"cw_defroi",
	"cw_field",
	"cw_filesel",
	"cw_form",
	"cw_fslider",
	"cw_light_editor",
	"cw_light_editor_get",
	"cw_light_editor_set",
	"cw_orient",
	"cw_palette_editor",
	"cw_palette_editor_get",
	"cw_palette_editor_set",
	"cw_pdmenu",
	"cw_rgbslider",
	"cw_tmpl",
	"cw_zoom",
	"db_exists",
	"dblarr",
	"dcindgen",
	"dcomplex",
	"dcomplexarr",
	"define_key",
	"define_msgblk",
	"define_msgblk_from_file",
	"defroi",
	"defsysv",
	"delvar",
	"dendro_plot",
	"dendrogram",
	"deriv",
	"derivsig",
	"determ",
	"device",
	"dfpmin",
	"diag_matrix",
	"dialog_dbconnect",
	"dialog_message",
	"dialog_pickfile",
	"dialog_printersetup",
	"dialog_printjob",
	"dialog_read_image",
	"dialog_write_image",
	"dictionary",
	"digital_filter",
	"dilate",
	"dindgen",
	"dissolve",
	"dist",
	"distance_measure",
	"dlm_load",
	"dlm_register",
	"doc_library",
	"double",
	"draw_roi",
	"edge_dog",
	"efont",
	"eigenql",
	"eigenvec",
	"ellipse",
	"elmhes",
	"emboss",
	"empty",
	"enable_sysrtn",
	"eof",
	"eos",
	"erase",
	"erf",
	"erfc",
	"erfcx",
	"erode",
	"errorplot",
	"errplot",
	"estimator_filter",
	"execute",
	"exit",
	"exp",
	"expand",
	"expand_path",
	"expint",
	"extract",
	"extract_slice",
	"f_cvf",
	"f_pdf",
	"factorial",
	"fft",
	"file_basename",
	"file_chmod",
	"file_copy",
	"file_delete",
	"file_dirname",
	"file_expand_path",
	"file_gunzip",
	"file_gzip",
	"file_info",
	"file_lines",
	"file_link",
	"file_mkdir",
	"file_move",
	"file_poll_input",
	"file_readlink",
	"file_same",
	"file_search",
	"file_tar",
	"file_test",
	"file_untar",
	"file_unzip",
	"file_which",
	"file_zip",
	"filepath",
	"findgen",
	"finite",
	"fix",
	"flick",
	"float",
	"floor",
	"flow3",
	"fltarr",
	"flush",
	"format_axis_values",
	"forward_function",
	"free_lun",
	"fstat",
	"fulstr",
	"funct",
	"function",
	"fv_test",
	"fx_root",
	"fz_roots",
	"gamma",
	"gamma_ct",
	"gauss_cvf",
	"gauss_pdf",
	"gauss_smooth",
	"gauss2dfit",
	"gaussfit",
	"gaussian_function",
	"gaussint",
	"get_drive_list",
	"get_dxf_objects",
	"get_kbrd",
	"get_login_info",
	"get_lun",
	"get_screen_size",
	"getenv",
	"getwindows",
	"greg2jul",
	"grib",
	"grid_input",
	"grid_tps",
	"grid3",
	"griddata",
	"gs_iter",
	"h_eq_ct",
	"h_eq_int",
	"hanning",
	"hash",
	"hdf",
	"hdf5",
	"heap_free",
	"heap_gc",
	"heap_nosave",
	"heap_refcount",
	"heap_save",
	"help",
	"hilbert",
	"hist_2d",
	"hist_equal",
	"histogram",
	"hls",
	"hough",
	"hqr",
	"hsv",
	"i18n_multibytetoutf8",
	"i18n_multibytetowidechar",
	"i18n_utf8tomultibyte",
	"i18n_widechartomultibyte",
	"ibeta",
	"icontour",
	"iconvertcoord",
	"idelete",
	"identity",
	"idl_base64",
	"idl_container",
	"idl_validname",
	"idlexbr_assistant",
	"idlitsys_createtool",
	"idlunit",
	"iellipse",
	"igamma",
	"igetcurrent",
	"igetdata",
	"igetid",
	"igetproperty",
	"iimage",
	"image",
	"image_cont",
	"image_statistics",
	"image_threshold",
	"imaginary",
	"imap",
	"indgen",
	"int_2d",
	"int_3d",
	"int_tabulated",
	"intarr",
	"interpol",
	"interpolate",
	"interval_volume",
	"invert",
	"ioctl",
	"iopen",
	"ir_filter",
	"iplot",
	"ipolygon",
	"ipolyline",
	"iputdata",
	"iregister",
	"ireset",
	"iresolve",
	"irotate",
	"isa",
	"isave",
	"iscale",
	"isetcurrent",
	"isetproperty",
	"ishft",
	"isocontour",
	"isosurface",
	"isurface",
	"itext",
	"itranslate",
	"ivector",
	"ivolume",
	"izoom",
	"journal",
	"json_parse",
	"json_serialize",
	"jul2greg",
	"julday",
	"keyword_set",
	"krig2d",
	"kurtosis",
	"kw_test",
	"l64indgen",
	"la_choldc",
	"la_cholmprove",
	"la_cholsol",
	"la_determ",
	"la_eigenproblem",
	"la_eigenql",
	"la_eigenvec",
	"la_elmhes",
	"la_gm_linear_model",
	"la_hqr",
	"la_invert",
	"la_least_square_equality",
	"la_least_squares",
	"la_linear_equation",
	"la_ludc",
	"la_lumprove",
	"la_lusol",
	"la_svd",
	"la_tridc",
	"la_trimprove",
	"la_triql",
	"la_trired",
	"la_trisol",
	"label_date",
	"label_region",
	"ladfit",
	"laguerre",
	"lambda",
	"lambdap",
	"lambertw",
	"laplacian",
	"least_squares_filter",
	"leefilt",
	"legend",
	"legendre",
	"linbcg",
	"lindgen",
	"linfit",
	"linkimage",
	"list",
	"ll_arc_distance",
	"lmfit",
	"lmgr",
	"lngamma",
	"lnp_test",
	"loadct",
	"locale_get",
	"logical_and",
	"logical_or",
	"logical_true",
	"lon64arr",
	"lonarr",
	"long",
	"long64",
	"lsode",
	"lu_complex",
	"ludc",
	"lumprove",
	"lusol",
	"m_correlate",
	"machar",
	"make_array",
	"make_dll",
	"make_rt",
	"map",
	"mapcontinents",
	"mapgrid",
	"map_2points",
	"map_continents",
	"map_grid",
	"map_image",
	"map_patch",
	"map_proj_forward",
	"map_proj_image",
	"map_proj_info",
	"map_proj_init",
	"map_proj_inverse",
	"map_set",
	"matrix_multiply",
	"matrix_power",
	"max",
	"md_test",
	"mean",
	"meanabsdev",
	"mean_filter",
	"median",
	"memory",
	"mesh_clip",
	"mesh_decimate",
	"mesh_issolid",
	"mesh_merge",
	"mesh_numtriangles",
	"mesh_obj",
	"mesh_smooth",
	"mesh_surfacearea",
	"mesh_validate",
	"mesh_volume",
	"message",
	"min",
	"min_curve_surf",
	"mk_html_help",
	"modifyct",
	"moment",
	"morph_close",
	"morph_distance",
	"morph_gradient",
	"morph_hitormiss",
	"morph_open",
	"morph_thin",
	"morph_tophat",
	"multi",
	"n_elements",
	"n_params",
	"n_tags",
	"ncdf",
	"newton",
	"noise_hurl",
	"noise_pick",
	"noise_scatter",
	"noise_slur",
	"norm",
	"obj_class",
	"obj_destroy",
	"obj_hasmethod",
	"obj_isa",
	"obj_new",
	"obj_valid",
	"objarr",
	"on_error",
	"on_ioerror",
	"online_help",
	"openr",
	"openu",
	"openw",
	"oplot",
	"oploterr",
	"orderedhash",
	"p_correlate",
	"parse_url",
	"particle_trace",
	"path_cache",
	"path_sep",
	"pcomp",
	"plot",
	"plot3d",
	"plot",
	"plot_3dbox",
	"plot_field",
	"ploterr",
	"plots",
	"polar_contour",
	"polar_surface",
	"polyfill",
	"polyshade",
	"pnt_line",
	"point_lun",
	"polarplot",
	"poly",
	"poly_2d",
	"poly_area",
	"poly_fit",
	"polyfillv",
	"polygon",
	"polyline",
	"polywarp",
	"popd",
	"powell",
	"pref_commit",
	"pref_get",
	"pref_set",
	"prewitt",
	"primes",
	"print",
	"printf",
	"printd",
	"pro",
	"product",
	"profile",
	"profiler",
	"profiles",
	"project_vol",
	"ps_show_fonts",
	"psafm",
	"pseudo",
	"ptr_free",
	"ptr_new",
	"ptr_valid",
	"ptrarr",
	"pushd",
	"qgrid3",
	"qhull",
	"qromb",
	"qromo",
	"qsimp",
	"query_*",
	"query_ascii",
	"query_bmp",
	"query_csv",
	"query_dicom",
	"query_gif",
	"query_image",
	"query_jpeg",
	"query_jpeg2000",
	"query_mrsid",
	"query_pict",
	"query_png",
	"query_ppm",
	"query_srf",
	"query_tiff",
	"query_video",
	"query_wav",
	"r_correlate",
	"r_test",
	"radon",
	"randomn",
	"randomu",
	"ranks",
	"rdpix",
	"read",
	"readf",
	"read_ascii",
	"read_binary",
	"read_bmp",
	"read_csv",
	"read_dicom",
	"read_gif",
	"read_image",
	"read_interfile",
	"read_jpeg",
	"read_jpeg2000",
	"read_mrsid",
	"read_pict",
	"read_png",
	"read_ppm",
	"read_spr",
	"read_srf",
	"read_sylk",
	"read_tiff",
	"read_video",
	"read_wav",
	"read_wave",
	"read_x11_bitmap",
	"read_xwd",
	"reads",
	"readu",
	"real_part",
	"rebin",
	"recall_commands",
	"recon3",
	"reduce_colors",
	"reform",
	"region_grow",
	"register_cursor",
	"regress",
	"replicate",
	"replicate_inplace",
	"resolve_all",
	"resolve_routine",
	"restore",
	"retall",
	"return",
	"reverse",
	"rk4",
	"roberts",
	"rot",
	"rotate",
	"round",
	"routine_filepath",
	"routine_info",
	"rs_test",
	"s_test",
	"save",
	"savgol",
	"scale3",
	"scale3d",
	"scatterplot",
	"scatterplot3d",
	"scope_level",
	"scope_traceback",
	"scope_varfetch",
	"scope_varname",
	"search2d",
	"search3d",
	"sem_create",
	"sem_delete",
	"sem_lock",
	"sem_release",
	"set_plot",
	"set_shading",
	"setenv",
	"sfit",
	"shade_surf",
	"shade_surf_irr",
	"shade_volume",
	"shift",
	"shift_diff",
	"shmdebug",
	"shmmap",
	"shmunmap",
	"shmvar",
	"show3",
	"showfont",
	"signum",
	"simplex",
	"sin",
	"sindgen",
	"sinh",
	"size",
	"skewness",
	"skip_lun",
	"slicer3",
	"slide_image",
	"smooth",
	"sobel",
	"socket",
	"sort",
	"spawn",
	"sph_4pnt",
	"sph_scat",
	"spher_harm",
	"spl_init",
	"spl_interp",
	"spline",
	"spline_p",
	"sprsab",
	"sprsax",
	"sprsin",
	"sprstp",
	"sqrt",
	"standardize",
	"stddev",
	"stop",
	"strarr",
	"strcmp",
	"strcompress",
	"streamline",
	"streamline",
	"stregex",
	"stretch",
	"string",
	"strjoin",
	"strlen",
	"strlowcase",
	"strmatch",
	"strmessage",
	"strmid",
	"strpos",
	"strput",
	"strsplit",
	"strtrim",
	"struct_assign",
	"struct_hide",
	"strupcase",
	"surface",
	"surface",
	"surfr",
	"svdc",
	"svdfit",
	"svsol",
	"swap_endian",
	"swap_endian_inplace",
	"symbol",
	"systime",
	"t_cvf",
	"t_pdf",
	"t3d",
	"tag_names",
	"tan",
	"tanh",
	"tek_color",
	"temporary",
	"terminal_size",
	"tetra_clip",
	"tetra_surface",
	"tetra_volume",
	"text",
	"thin",
	"thread",
	"threed",
	"tic",
	"time_test2",
	"timegen",
	"timer",
	"timestamp",
	"timestamptovalues",
	"tm_test",
	"toc",
	"total",
	"trace",
	"transpose",
	"tri_surf",
	"triangulate",
	"trigrid",
	"triql",
	"trired",
	"trisol",
	"truncate_lun",
	"ts_coef",
	"ts_diff",
	"ts_fcast",
	"ts_smooth",
	"tv",
	"tvcrs",
	"tvlct",
	"tvrd",
	"tvscl",
	"typename",
	"uindgen",
	"uint",
	"uintarr",
	"ul64indgen",
	"ulindgen",
	"ulon64arr",
	"ulonarr",
	"ulong",
	"ulong64",
	"uniq",
	"unsharp_mask",
	"usersym",
	"value_locate",
	"variance",
	"vector",
	"vector_field",
	"vel",
	"velovect",
	"vert_t3d",
	"voigt",
	"volume",
	"voronoi",
	"voxel_proj",
	"wait",
	"warp_tri",
	"watershed",
	"wdelete",
	"wf_draw",
	"where",
	"widget_base",
	"widget_button",
	"widget_combobox",
	"widget_control",
	"widget_displaycontextmenu",
	"widget_draw",
	"widget_droplist",
	"widget_event",
	"widget_info",
	"widget_label",
	"widget_list",
	"widget_propertysheet",
	"widget_slider",
	"widget_tab",
	"widget_table",
	"widget_text",
	"widget_tree",
	"widget_tree_move",
	"widget_window",
	"wiener_filter",
	"window",
	"window",
	"write_bmp",
	"write_csv",
	"write_gif",
	"write_image",
	"write_jpeg",
	"write_jpeg2000",
	"write_nrif",
	"write_pict",
	"write_png",
	"write_ppm",
	"write_spr",
	"write_srf",
	"write_sylk",
	"write_tiff",
	"write_video",
	"write_wav",
	"write_wave",
	"writeu",
	"wset",
	"wshow",
	"wtn",
	"wv_applet",
	"wv_cwt",
	"wv_cw_wavelet",
	"wv_denoise",
	"wv_dwt",
	"wv_fn_coiflet",
	"wv_fn_daubechies",
	"wv_fn_gaussian",
	"wv_fn_haar",
	"wv_fn_morlet",
	"wv_fn_paul",
	"wv_fn_symlet",
	"wv_import_data",
	"wv_import_wavelet",
	"wv_plot3d_wps",
	"wv_plot_multires",
	"wv_pwt",
	"wv_tool_denoise",
	"xbm_edit",
	"xdisplayfile",
	"xdxf",
	"xfont",
	"xinteranimate",
	"xloadct",
	"xmanager",
	"xmng_tmpl",
	"xmtool",
	"xobjview",
	"xobjview_rotate",
	"xobjview_write_image",
	"xpalette",
	"xpcolor",
	"xplot3d",
	"xregistered",
	"xroi",
	"xsq_test",
	"xsurface",
	"xvaredit",
	"xvolume",
	"xvolume_rotate",
	"xvolume_write_image",
	"xyouts",
	"zlib_compress",
	"zlib_uncompress",
	"zoom",
	"zoom_24"
];
var builtins$6 = wordRegexp$11(builtinArray$1);
var keywordArray$2 = [
	"begin",
	"end",
	"endcase",
	"endfor",
	"endwhile",
	"endif",
	"endrep",
	"endforeach",
	"break",
	"case",
	"continue",
	"for",
	"foreach",
	"goto",
	"if",
	"then",
	"else",
	"repeat",
	"until",
	"switch",
	"while",
	"do",
	"pro",
	"function"
];
var keywords$25 = wordRegexp$11(keywordArray$2);
var identifiers$6 = /* @__PURE__ */ new RegExp("^[_a-z¡-￿][_a-z0-9¡-￿]*", "i");
var singleOperators$5 = /[+\-*&=<>\/@#~$]/;
var boolOperators = /* @__PURE__ */ new RegExp("(and|or|eq|lt|le|gt|ge|ne|not)", "i");
function tokenBase$29(stream) {
	if (stream.eatSpace()) return null;
	if (stream.match(";")) {
		stream.skipToEnd();
		return "comment";
	}
	if (stream.match(/^[0-9\.+-]/, false)) {
		if (stream.match(/^[+-]?0x[0-9a-fA-F]+/)) return "number";
		if (stream.match(/^[+-]?\d*\.\d+([EeDd][+-]?\d+)?/)) return "number";
		if (stream.match(/^[+-]?\d+([EeDd][+-]?\d+)?/)) return "number";
	}
	if (stream.match(/^"([^"]|(""))*"/)) return "string";
	if (stream.match(/^'([^']|(''))*'/)) return "string";
	if (stream.match(keywords$25)) return "keyword";
	if (stream.match(builtins$6)) return "builtin";
	if (stream.match(identifiers$6)) return "variable";
	if (stream.match(singleOperators$5) || stream.match(boolOperators)) return "operator";
	stream.next();
	return null;
}
var idl = {
	name: "idl",
	token: function(stream) {
		return tokenBase$29(stream);
	},
	languageData: { autocomplete: builtinArray$1.concat(keywordArray$2) }
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/javascript.js
function mkJavaScript(parserConfig) {
	var statementIndent = parserConfig.statementIndent;
	var jsonldMode = parserConfig.jsonld;
	var jsonMode = parserConfig.json || jsonldMode;
	var isTS = parserConfig.typescript;
	var wordRE = parserConfig.wordCharacters || /[\w$\xa1-\uffff]/;
	var keywords = function() {
		function kw(type) {
			return {
				type,
				style: "keyword"
			};
		}
		var A = kw("keyword a"), B = kw("keyword b"), C = kw("keyword c"), D = kw("keyword d");
		var operator = kw("operator"), atom = {
			type: "atom",
			style: "atom"
		};
		return {
			"if": kw("if"),
			"while": A,
			"with": A,
			"else": B,
			"do": B,
			"try": B,
			"finally": B,
			"return": D,
			"break": D,
			"continue": D,
			"new": kw("new"),
			"delete": C,
			"void": C,
			"throw": C,
			"debugger": kw("debugger"),
			"var": kw("var"),
			"const": kw("var"),
			"let": kw("var"),
			"function": kw("function"),
			"catch": kw("catch"),
			"for": kw("for"),
			"switch": kw("switch"),
			"case": kw("case"),
			"default": kw("default"),
			"in": operator,
			"typeof": operator,
			"instanceof": operator,
			"true": atom,
			"false": atom,
			"null": atom,
			"undefined": atom,
			"NaN": atom,
			"Infinity": atom,
			"this": kw("this"),
			"class": kw("class"),
			"super": kw("atom"),
			"yield": C,
			"export": kw("export"),
			"import": kw("import"),
			"extends": C,
			"await": C
		};
	}();
	var isOperatorChar = /[+\-*&%=<>!?|~^@]/;
	var isJsonldKeyword = /^@(context|id|value|language|type|container|list|set|reverse|index|base|vocab|graph)"/;
	function readRegexp(stream) {
		var escaped = false, next, inSet = false;
		while ((next = stream.next()) != null) {
			if (!escaped) {
				if (next == "/" && !inSet) return;
				if (next == "[") inSet = true;
				else if (inSet && next == "]") inSet = false;
			}
			escaped = !escaped && next == "\\";
		}
	}
	var type, content;
	function ret(tp, style, cont) {
		type = tp;
		content = cont;
		return style;
	}
	function tokenBase(stream, state) {
		var ch = stream.next();
		if (ch == "\"" || ch == "'") {
			state.tokenize = tokenString(ch);
			return state.tokenize(stream, state);
		} else if (ch == "." && stream.match(/^\d[\d_]*(?:[eE][+\-]?[\d_]+)?/)) return ret("number", "number");
		else if (ch == "." && stream.match("..")) return ret("spread", "meta");
		else if (/[\[\]{}\(\),;\:\.]/.test(ch)) return ret(ch);
		else if (ch == "=" && stream.eat(">")) return ret("=>", "operator");
		else if (ch == "0" && stream.match(/^(?:x[\dA-Fa-f_]+|o[0-7_]+|b[01_]+)n?/)) return ret("number", "number");
		else if (/\d/.test(ch)) {
			stream.match(/^[\d_]*(?:n|(?:\.[\d_]*)?(?:[eE][+\-]?[\d_]+)?)?/);
			return ret("number", "number");
		} else if (ch == "/") {
			if (stream.eat("*")) {
				state.tokenize = tokenComment;
				return tokenComment(stream, state);
			} else if (stream.eat("/")) {
				stream.skipToEnd();
				return ret("comment", "comment");
			} else if (expressionAllowed(stream, state, 1)) {
				readRegexp(stream);
				stream.match(/^\b(([gimyus])(?![gimyus]*\2))+\b/);
				return ret("regexp", "string.special");
			} else {
				stream.eat("=");
				return ret("operator", "operator", stream.current());
			}
		} else if (ch == "`") {
			state.tokenize = tokenQuasi;
			return tokenQuasi(stream, state);
		} else if (ch == "#" && stream.peek() == "!") {
			stream.skipToEnd();
			return ret("meta", "meta");
		} else if (ch == "#" && stream.eatWhile(wordRE)) return ret("variable", "property");
		else if (ch == "<" && stream.match("!--") || ch == "-" && stream.match("->") && !/\S/.test(stream.string.slice(0, stream.start))) {
			stream.skipToEnd();
			return ret("comment", "comment");
		} else if (isOperatorChar.test(ch)) {
			if (ch != ">" || !state.lexical || state.lexical.type != ">") {
				if (stream.eat("=")) {
					if (ch == "!" || ch == "=") stream.eat("=");
				} else if (/[<>*+\-|&?]/.test(ch)) {
					stream.eat(ch);
					if (ch == ">") stream.eat(ch);
				}
			}
			if (ch == "?" && stream.eat(".")) return ret(".");
			return ret("operator", "operator", stream.current());
		} else if (wordRE.test(ch)) {
			stream.eatWhile(wordRE);
			var word = stream.current();
			if (state.lastType != ".") {
				if (keywords.propertyIsEnumerable(word)) {
					var kw = keywords[word];
					return ret(kw.type, kw.style, word);
				}
				if (word == "async" && stream.match(/^(\s|\/\*([^*]|\*(?!\/))*?\*\/)*[\[\(\w]/, false)) return ret("async", "keyword", word);
			}
			return ret("variable", "variable", word);
		}
	}
	function tokenString(quote) {
		return function(stream, state) {
			var escaped = false, next;
			if (jsonldMode && stream.peek() == "@" && stream.match(isJsonldKeyword)) {
				state.tokenize = tokenBase;
				return ret("jsonld-keyword", "meta");
			}
			while ((next = stream.next()) != null) {
				if (next == quote && !escaped) break;
				escaped = !escaped && next == "\\";
			}
			if (!escaped) state.tokenize = tokenBase;
			return ret("string", "string");
		};
	}
	function tokenComment(stream, state) {
		var maybeEnd = false, ch;
		while (ch = stream.next()) {
			if (ch == "/" && maybeEnd) {
				state.tokenize = tokenBase;
				break;
			}
			maybeEnd = ch == "*";
		}
		return ret("comment", "comment");
	}
	function tokenQuasi(stream, state) {
		var escaped = false, next;
		while ((next = stream.next()) != null) {
			if (!escaped && (next == "`" || next == "$" && stream.eat("{"))) {
				state.tokenize = tokenBase;
				break;
			}
			escaped = !escaped && next == "\\";
		}
		return ret("quasi", "string.special", stream.current());
	}
	var brackets = "([{}])";
	function findFatArrow(stream, state) {
		if (state.fatArrowAt) state.fatArrowAt = null;
		var arrow = stream.string.indexOf("=>", stream.start);
		if (arrow < 0) return;
		if (isTS) {
			var m = /:\s*(?:\w+(?:<[^>]*>|\[\])?|\{[^}]*\})\s*$/.exec(stream.string.slice(stream.start, arrow));
			if (m) arrow = m.index;
		}
		var depth = 0, sawSomething = false;
		for (var pos = arrow - 1; pos >= 0; --pos) {
			var ch = stream.string.charAt(pos);
			var bracket = brackets.indexOf(ch);
			if (bracket >= 0 && bracket < 3) {
				if (!depth) {
					++pos;
					break;
				}
				if (--depth == 0) {
					if (ch == "(") sawSomething = true;
					break;
				}
			} else if (bracket >= 3 && bracket < 6) ++depth;
			else if (wordRE.test(ch)) sawSomething = true;
			else if (/["'\/`]/.test(ch)) for (;; --pos) {
				if (pos == 0) return;
				if (stream.string.charAt(pos - 1) == ch && stream.string.charAt(pos - 2) != "\\") {
					pos--;
					break;
				}
			}
			else if (sawSomething && !depth) {
				++pos;
				break;
			}
		}
		if (sawSomething && !depth) state.fatArrowAt = pos;
	}
	var atomicTypes = {
		"atom": true,
		"number": true,
		"variable": true,
		"string": true,
		"regexp": true,
		"this": true,
		"import": true,
		"jsonld-keyword": true
	};
	function JSLexical(indented, column, type, align, prev, info) {
		this.indented = indented;
		this.column = column;
		this.type = type;
		this.prev = prev;
		this.info = info;
		if (align != null) this.align = align;
	}
	function inScope(state, varname) {
		for (var v = state.localVars; v; v = v.next) if (v.name == varname) return true;
		for (var cx = state.context; cx; cx = cx.prev) for (var v = cx.vars; v; v = v.next) if (v.name == varname) return true;
	}
	function parseJS(state, style, type, content, stream) {
		var cc = state.cc;
		cx.state = state;
		cx.stream = stream;
		cx.marked = null;
		cx.cc = cc;
		cx.style = style;
		if (!state.lexical.hasOwnProperty("align")) state.lexical.align = true;
		while (true) if ((cc.length ? cc.pop() : jsonMode ? expression : statement)(type, content)) {
			while (cc.length && cc[cc.length - 1].lex) cc.pop()();
			if (cx.marked) return cx.marked;
			if (type == "variable" && inScope(state, content)) return "variableName.local";
			return style;
		}
	}
	var cx = {
		state: null,
		column: null,
		marked: null,
		cc: null
	};
	function pass() {
		for (var i = arguments.length - 1; i >= 0; i--) cx.cc.push(arguments[i]);
	}
	function cont() {
		pass.apply(null, arguments);
		return true;
	}
	function inList(name, list) {
		for (var v = list; v; v = v.next) if (v.name == name) return true;
		return false;
	}
	function register(varname) {
		var state = cx.state;
		cx.marked = "def";
		if (state.context) {
			if (state.lexical.info == "var" && state.context && state.context.block) {
				var newContext = registerVarScoped(varname, state.context);
				if (newContext != null) {
					state.context = newContext;
					return;
				}
			} else if (!inList(varname, state.localVars)) {
				state.localVars = new Var(varname, state.localVars);
				return;
			}
		}
		if (parserConfig.globalVars && !inList(varname, state.globalVars)) state.globalVars = new Var(varname, state.globalVars);
	}
	function registerVarScoped(varname, context) {
		if (!context) return null;
		else if (context.block) {
			var inner = registerVarScoped(varname, context.prev);
			if (!inner) return null;
			if (inner == context.prev) return context;
			return new Context(inner, context.vars, true);
		} else if (inList(varname, context.vars)) return context;
		else return new Context(context.prev, new Var(varname, context.vars), false);
	}
	function isModifier(name) {
		return name == "public" || name == "private" || name == "protected" || name == "abstract" || name == "readonly";
	}
	function Context(prev, vars, block) {
		this.prev = prev;
		this.vars = vars;
		this.block = block;
	}
	function Var(name, next) {
		this.name = name;
		this.next = next;
	}
	var defaultVars = new Var("this", new Var("arguments", null));
	function pushcontext() {
		cx.state.context = new Context(cx.state.context, cx.state.localVars, false);
		cx.state.localVars = defaultVars;
	}
	function pushblockcontext() {
		cx.state.context = new Context(cx.state.context, cx.state.localVars, true);
		cx.state.localVars = null;
	}
	pushcontext.lex = pushblockcontext.lex = true;
	function popcontext() {
		cx.state.localVars = cx.state.context.vars;
		cx.state.context = cx.state.context.prev;
	}
	popcontext.lex = true;
	function pushlex(type, info) {
		var result = function() {
			var state = cx.state, indent = state.indented;
			if (state.lexical.type == "stat") indent = state.lexical.indented;
			else for (var outer = state.lexical; outer && outer.type == ")" && outer.align; outer = outer.prev) indent = outer.indented;
			state.lexical = new JSLexical(indent, cx.stream.column(), type, null, state.lexical, info);
		};
		result.lex = true;
		return result;
	}
	function poplex() {
		var state = cx.state;
		if (state.lexical.prev) {
			if (state.lexical.type == ")") state.indented = state.lexical.indented;
			state.lexical = state.lexical.prev;
		}
	}
	poplex.lex = true;
	function expect(wanted) {
		function exp(type) {
			if (type == wanted) return cont();
			else if (wanted == ";" || type == "}" || type == ")" || type == "]") return pass();
			else return cont(exp);
		}
		return exp;
	}
	function statement(type, value) {
		if (type == "var") return cont(pushlex("vardef", value), vardef, expect(";"), poplex);
		if (type == "keyword a") return cont(pushlex("form"), parenExpr, statement, poplex);
		if (type == "keyword b") return cont(pushlex("form"), statement, poplex);
		if (type == "keyword d") return cx.stream.match(/^\s*$/, false) ? cont() : cont(pushlex("stat"), maybeexpression, expect(";"), poplex);
		if (type == "debugger") return cont(expect(";"));
		if (type == "{") return cont(pushlex("}"), pushblockcontext, block, poplex, popcontext);
		if (type == ";") return cont();
		if (type == "if") {
			if (cx.state.lexical.info == "else" && cx.state.cc[cx.state.cc.length - 1] == poplex) cx.state.cc.pop()();
			return cont(pushlex("form"), parenExpr, statement, poplex, maybeelse);
		}
		if (type == "function") return cont(functiondef);
		if (type == "for") return cont(pushlex("form"), pushblockcontext, forspec, statement, popcontext, poplex);
		if (type == "class" || isTS && value == "interface") {
			cx.marked = "keyword";
			return cont(pushlex("form", type == "class" ? type : value), className, poplex);
		}
		if (type == "variable") {
			if (isTS && value == "declare") {
				cx.marked = "keyword";
				return cont(statement);
			} else if (isTS && (value == "module" || value == "enum" || value == "type") && cx.stream.match(/^\s*\w/, false)) {
				cx.marked = "keyword";
				if (value == "enum") return cont(enumdef);
				else if (value == "type") return cont(typename, expect("operator"), typeexpr, expect(";"));
				else return cont(pushlex("form"), pattern, expect("{"), pushlex("}"), block, poplex, poplex);
			} else if (isTS && value == "namespace") {
				cx.marked = "keyword";
				return cont(pushlex("form"), expression, statement, poplex);
			} else if (isTS && value == "abstract") {
				cx.marked = "keyword";
				return cont(statement);
			} else return cont(pushlex("stat"), maybelabel);
		}
		if (type == "switch") return cont(pushlex("form"), parenExpr, expect("{"), pushlex("}", "switch"), pushblockcontext, block, poplex, poplex, popcontext);
		if (type == "case") return cont(expression, expect(":"));
		if (type == "default") return cont(expect(":"));
		if (type == "catch") return cont(pushlex("form"), pushcontext, maybeCatchBinding, statement, poplex, popcontext);
		if (type == "export") return cont(pushlex("stat"), afterExport, poplex);
		if (type == "import") return cont(pushlex("stat"), afterImport, poplex);
		if (type == "async") return cont(statement);
		if (value == "@") return cont(expression, statement);
		return pass(pushlex("stat"), expression, expect(";"), poplex);
	}
	function maybeCatchBinding(type) {
		if (type == "(") return cont(funarg, expect(")"));
	}
	function expression(type, value) {
		return expressionInner(type, value, false);
	}
	function expressionNoComma(type, value) {
		return expressionInner(type, value, true);
	}
	function parenExpr(type) {
		if (type != "(") return pass();
		return cont(pushlex(")"), maybeexpression, expect(")"), poplex);
	}
	function expressionInner(type, value, noComma) {
		if (cx.state.fatArrowAt == cx.stream.start) {
			var body = noComma ? arrowBodyNoComma : arrowBody;
			if (type == "(") return cont(pushcontext, pushlex(")"), commasep(funarg, ")"), poplex, expect("=>"), body, popcontext);
			else if (type == "variable") return pass(pushcontext, pattern, expect("=>"), body, popcontext);
		}
		var maybeop = noComma ? maybeoperatorNoComma : maybeoperatorComma;
		if (atomicTypes.hasOwnProperty(type)) return cont(maybeop);
		if (type == "function") return cont(functiondef, maybeop);
		if (type == "class" || isTS && value == "interface") {
			cx.marked = "keyword";
			return cont(pushlex("form"), classExpression, poplex);
		}
		if (type == "keyword c" || type == "async") return cont(noComma ? expressionNoComma : expression);
		if (type == "(") return cont(pushlex(")"), maybeexpression, expect(")"), poplex, maybeop);
		if (type == "operator" || type == "spread") return cont(noComma ? expressionNoComma : expression);
		if (type == "[") return cont(pushlex("]"), arrayLiteral, poplex, maybeop);
		if (type == "{") return contCommasep(objprop, "}", null, maybeop);
		if (type == "quasi") return pass(quasi, maybeop);
		if (type == "new") return cont(maybeTarget(noComma));
		return cont();
	}
	function maybeexpression(type) {
		if (type.match(/[;\}\)\],]/)) return pass();
		return pass(expression);
	}
	function maybeoperatorComma(type, value) {
		if (type == ",") return cont(maybeexpression);
		return maybeoperatorNoComma(type, value, false);
	}
	function maybeoperatorNoComma(type, value, noComma) {
		var me = noComma == false ? maybeoperatorComma : maybeoperatorNoComma;
		var expr = noComma == false ? expression : expressionNoComma;
		if (type == "=>") return cont(pushcontext, noComma ? arrowBodyNoComma : arrowBody, popcontext);
		if (type == "operator") {
			if (/\+\+|--/.test(value) || isTS && value == "!") return cont(me);
			if (isTS && value == "<" && cx.stream.match(/^([^<>]|<[^<>]*>)*>\s*\(/, false)) return cont(pushlex(">"), commasep(typeexpr, ">"), poplex, me);
			if (value == "?") return cont(expression, expect(":"), expr);
			return cont(expr);
		}
		if (type == "quasi") return pass(quasi, me);
		if (type == ";") return;
		if (type == "(") return contCommasep(expressionNoComma, ")", "call", me);
		if (type == ".") return cont(property, me);
		if (type == "[") return cont(pushlex("]"), maybeexpression, expect("]"), poplex, me);
		if (isTS && value == "as") {
			cx.marked = "keyword";
			return cont(typeexpr, me);
		}
		if (type == "regexp") {
			cx.state.lastType = cx.marked = "operator";
			cx.stream.backUp(cx.stream.pos - cx.stream.start - 1);
			return cont(expr);
		}
	}
	function quasi(type, value) {
		if (type != "quasi") return pass();
		if (value.slice(value.length - 2) != "${") return cont(quasi);
		return cont(maybeexpression, continueQuasi);
	}
	function continueQuasi(type) {
		if (type == "}") {
			cx.marked = "string.special";
			cx.state.tokenize = tokenQuasi;
			return cont(quasi);
		}
	}
	function arrowBody(type) {
		findFatArrow(cx.stream, cx.state);
		return pass(type == "{" ? statement : expression);
	}
	function arrowBodyNoComma(type) {
		findFatArrow(cx.stream, cx.state);
		return pass(type == "{" ? statement : expressionNoComma);
	}
	function maybeTarget(noComma) {
		return function(type) {
			if (type == ".") return cont(noComma ? targetNoComma : target);
			else if (type == "variable" && isTS) return cont(maybeTypeArgs, noComma ? maybeoperatorNoComma : maybeoperatorComma);
			else return pass(noComma ? expressionNoComma : expression);
		};
	}
	function target(_, value) {
		if (value == "target") {
			cx.marked = "keyword";
			return cont(maybeoperatorComma);
		}
	}
	function targetNoComma(_, value) {
		if (value == "target") {
			cx.marked = "keyword";
			return cont(maybeoperatorNoComma);
		}
	}
	function maybelabel(type) {
		if (type == ":") return cont(poplex, statement);
		return pass(maybeoperatorComma, expect(";"), poplex);
	}
	function property(type) {
		if (type == "variable") {
			cx.marked = "property";
			return cont();
		}
	}
	function objprop(type, value) {
		if (type == "async") {
			cx.marked = "property";
			return cont(objprop);
		} else if (type == "variable" || cx.style == "keyword") {
			cx.marked = "property";
			if (value == "get" || value == "set") return cont(getterSetter);
			var m;
			if (isTS && cx.state.fatArrowAt == cx.stream.start && (m = cx.stream.match(/^\s*:\s*/, false))) cx.state.fatArrowAt = cx.stream.pos + m[0].length;
			return cont(afterprop);
		} else if (type == "number" || type == "string") {
			cx.marked = jsonldMode ? "property" : cx.style + " property";
			return cont(afterprop);
		} else if (type == "jsonld-keyword") return cont(afterprop);
		else if (isTS && isModifier(value)) {
			cx.marked = "keyword";
			return cont(objprop);
		} else if (type == "[") return cont(expression, maybetype, expect("]"), afterprop);
		else if (type == "spread") return cont(expressionNoComma, afterprop);
		else if (value == "*") {
			cx.marked = "keyword";
			return cont(objprop);
		} else if (type == ":") return pass(afterprop);
	}
	function getterSetter(type) {
		if (type != "variable") return pass(afterprop);
		cx.marked = "property";
		return cont(functiondef);
	}
	function afterprop(type) {
		if (type == ":") return cont(expressionNoComma);
		if (type == "(") return pass(functiondef);
	}
	function commasep(what, end, sep) {
		function proceed(type, value) {
			if (sep ? sep.indexOf(type) > -1 : type == ",") {
				var lex = cx.state.lexical;
				if (lex.info == "call") lex.pos = (lex.pos || 0) + 1;
				return cont(function(type, value) {
					if (type == end || value == end) return pass();
					return pass(what);
				}, proceed);
			}
			if (type == end || value == end) return cont();
			if (sep && sep.indexOf(";") > -1) return pass(what);
			return cont(expect(end));
		}
		return function(type, value) {
			if (type == end || value == end) return cont();
			return pass(what, proceed);
		};
	}
	function contCommasep(what, end, info) {
		for (var i = 3; i < arguments.length; i++) cx.cc.push(arguments[i]);
		return cont(pushlex(end, info), commasep(what, end), poplex);
	}
	function block(type) {
		if (type == "}") return cont();
		return pass(statement, block);
	}
	function maybetype(type, value) {
		if (isTS) {
			if (type == ":") return cont(typeexpr);
			if (value == "?") return cont(maybetype);
		}
	}
	function maybetypeOrIn(type, value) {
		if (isTS && (type == ":" || value == "in")) return cont(typeexpr);
	}
	function mayberettype(type) {
		if (isTS && type == ":") {
			if (cx.stream.match(/^\s*\w+\s+is\b/, false)) return cont(expression, isKW, typeexpr);
			else return cont(typeexpr);
		}
	}
	function isKW(_, value) {
		if (value == "is") {
			cx.marked = "keyword";
			return cont();
		}
	}
	function typeexpr(type, value) {
		if (value == "keyof" || value == "typeof" || value == "infer" || value == "readonly") {
			cx.marked = "keyword";
			return cont(value == "typeof" ? expressionNoComma : typeexpr);
		}
		if (type == "variable" || value == "void") {
			cx.marked = "type";
			return cont(afterType);
		}
		if (value == "|" || value == "&") return cont(typeexpr);
		if (type == "string" || type == "number" || type == "atom") return cont(afterType);
		if (type == "[") return cont(pushlex("]"), commasep(typeexpr, "]", ","), poplex, afterType);
		if (type == "{") return cont(pushlex("}"), typeprops, poplex, afterType);
		if (type == "(") return cont(commasep(typearg, ")"), maybeReturnType, afterType);
		if (type == "<") return cont(commasep(typeexpr, ">"), typeexpr);
		if (type == "quasi") return pass(quasiType, afterType);
	}
	function maybeReturnType(type) {
		if (type == "=>") return cont(typeexpr);
	}
	function typeprops(type) {
		if (type.match(/[\}\)\]]/)) return cont();
		if (type == "," || type == ";") return cont(typeprops);
		return pass(typeprop, typeprops);
	}
	function typeprop(type, value) {
		if (type == "variable" || cx.style == "keyword") {
			cx.marked = "property";
			return cont(typeprop);
		} else if (value == "?" || type == "number" || type == "string") return cont(typeprop);
		else if (type == ":") return cont(typeexpr);
		else if (type == "[") return cont(expect("variable"), maybetypeOrIn, expect("]"), typeprop);
		else if (type == "(") return pass(functiondecl, typeprop);
		else if (!type.match(/[;\}\)\],]/)) return cont();
	}
	function quasiType(type, value) {
		if (type != "quasi") return pass();
		if (value.slice(value.length - 2) != "${") return cont(quasiType);
		return cont(typeexpr, continueQuasiType);
	}
	function continueQuasiType(type) {
		if (type == "}") {
			cx.marked = "string.special";
			cx.state.tokenize = tokenQuasi;
			return cont(quasiType);
		}
	}
	function typearg(type, value) {
		if (type == "variable" && cx.stream.match(/^\s*[?:]/, false) || value == "?") return cont(typearg);
		if (type == ":") return cont(typeexpr);
		if (type == "spread") return cont(typearg);
		return pass(typeexpr);
	}
	function afterType(type, value) {
		if (value == "<") return cont(pushlex(">"), commasep(typeexpr, ">"), poplex, afterType);
		if (value == "|" || type == "." || value == "&") return cont(typeexpr);
		if (type == "[") return cont(typeexpr, expect("]"), afterType);
		if (value == "extends" || value == "implements") {
			cx.marked = "keyword";
			return cont(typeexpr);
		}
		if (value == "?") return cont(typeexpr, expect(":"), typeexpr);
	}
	function maybeTypeArgs(_, value) {
		if (value == "<") return cont(pushlex(">"), commasep(typeexpr, ">"), poplex, afterType);
	}
	function typeparam() {
		return pass(typeexpr, maybeTypeDefault);
	}
	function maybeTypeDefault(_, value) {
		if (value == "=") return cont(typeexpr);
	}
	function vardef(_, value) {
		if (value == "enum") {
			cx.marked = "keyword";
			return cont(enumdef);
		}
		return pass(pattern, maybetype, maybeAssign, vardefCont);
	}
	function pattern(type, value) {
		if (isTS && isModifier(value)) {
			cx.marked = "keyword";
			return cont(pattern);
		}
		if (type == "variable") {
			register(value);
			return cont();
		}
		if (type == "spread") return cont(pattern);
		if (type == "[") return contCommasep(eltpattern, "]");
		if (type == "{") return contCommasep(proppattern, "}");
	}
	function proppattern(type, value) {
		if (type == "variable" && !cx.stream.match(/^\s*:/, false)) {
			register(value);
			return cont(maybeAssign);
		}
		if (type == "variable") cx.marked = "property";
		if (type == "spread") return cont(pattern);
		if (type == "}") return pass();
		if (type == "[") return cont(expression, expect("]"), expect(":"), proppattern);
		return cont(expect(":"), pattern, maybeAssign);
	}
	function eltpattern() {
		return pass(pattern, maybeAssign);
	}
	function maybeAssign(_type, value) {
		if (value == "=") return cont(expressionNoComma);
	}
	function vardefCont(type) {
		if (type == ",") return cont(vardef);
	}
	function maybeelse(type, value) {
		if (type == "keyword b" && value == "else") return cont(pushlex("form", "else"), statement, poplex);
	}
	function forspec(type, value) {
		if (value == "await") return cont(forspec);
		if (type == "(") return cont(pushlex(")"), forspec1, poplex);
	}
	function forspec1(type) {
		if (type == "var") return cont(vardef, forspec2);
		if (type == "variable") return cont(forspec2);
		return pass(forspec2);
	}
	function forspec2(type, value) {
		if (type == ")") return cont();
		if (type == ";") return cont(forspec2);
		if (value == "in" || value == "of") {
			cx.marked = "keyword";
			return cont(expression, forspec2);
		}
		return pass(expression, forspec2);
	}
	function functiondef(type, value) {
		if (value == "*") {
			cx.marked = "keyword";
			return cont(functiondef);
		}
		if (type == "variable") {
			register(value);
			return cont(functiondef);
		}
		if (type == "(") return cont(pushcontext, pushlex(")"), commasep(funarg, ")"), poplex, mayberettype, statement, popcontext);
		if (isTS && value == "<") return cont(pushlex(">"), commasep(typeparam, ">"), poplex, functiondef);
	}
	function functiondecl(type, value) {
		if (value == "*") {
			cx.marked = "keyword";
			return cont(functiondecl);
		}
		if (type == "variable") {
			register(value);
			return cont(functiondecl);
		}
		if (type == "(") return cont(pushcontext, pushlex(")"), commasep(funarg, ")"), poplex, mayberettype, popcontext);
		if (isTS && value == "<") return cont(pushlex(">"), commasep(typeparam, ">"), poplex, functiondecl);
	}
	function typename(type, value) {
		if (type == "keyword" || type == "variable") {
			cx.marked = "type";
			return cont(typename);
		} else if (value == "<") return cont(pushlex(">"), commasep(typeparam, ">"), poplex);
	}
	function funarg(type, value) {
		if (value == "@") cont(expression, funarg);
		if (type == "spread") return cont(funarg);
		if (isTS && isModifier(value)) {
			cx.marked = "keyword";
			return cont(funarg);
		}
		if (isTS && type == "this") return cont(maybetype, maybeAssign);
		return pass(pattern, maybetype, maybeAssign);
	}
	function classExpression(type, value) {
		if (type == "variable") return className(type, value);
		return classNameAfter(type, value);
	}
	function className(type, value) {
		if (type == "variable") {
			register(value);
			return cont(classNameAfter);
		}
	}
	function classNameAfter(type, value) {
		if (value == "<") return cont(pushlex(">"), commasep(typeparam, ">"), poplex, classNameAfter);
		if (value == "extends" || value == "implements" || isTS && type == ",") {
			if (value == "implements") cx.marked = "keyword";
			return cont(isTS ? typeexpr : expression, classNameAfter);
		}
		if (type == "{") return cont(pushlex("}"), classBody, poplex);
	}
	function classBody(type, value) {
		if (type == "async" || type == "variable" && (value == "static" || value == "get" || value == "set" || isTS && isModifier(value)) && cx.stream.match(/^\s+#?[\w$\xa1-\uffff]/, false)) {
			cx.marked = "keyword";
			return cont(classBody);
		}
		if (type == "variable" || cx.style == "keyword") {
			cx.marked = "property";
			return cont(classfield, classBody);
		}
		if (type == "number" || type == "string") return cont(classfield, classBody);
		if (type == "[") return cont(expression, maybetype, expect("]"), classfield, classBody);
		if (value == "*") {
			cx.marked = "keyword";
			return cont(classBody);
		}
		if (isTS && type == "(") return pass(functiondecl, classBody);
		if (type == ";" || type == ",") return cont(classBody);
		if (type == "}") return cont();
		if (value == "@") return cont(expression, classBody);
	}
	function classfield(type, value) {
		if (value == "!" || value == "?") return cont(classfield);
		if (type == ":") return cont(typeexpr, maybeAssign);
		if (value == "=") return cont(expressionNoComma);
		var context = cx.state.lexical.prev;
		return pass(context && context.info == "interface" ? functiondecl : functiondef);
	}
	function afterExport(type, value) {
		if (value == "*") {
			cx.marked = "keyword";
			return cont(maybeFrom, expect(";"));
		}
		if (value == "default") {
			cx.marked = "keyword";
			return cont(expression, expect(";"));
		}
		if (type == "{") return cont(commasep(exportField, "}"), maybeFrom, expect(";"));
		return pass(statement);
	}
	function exportField(type, value) {
		if (value == "as") {
			cx.marked = "keyword";
			return cont(expect("variable"));
		}
		if (type == "variable") return pass(expressionNoComma, exportField);
	}
	function afterImport(type) {
		if (type == "string") return cont();
		if (type == "(") return pass(expression);
		if (type == ".") return pass(maybeoperatorComma);
		return pass(importSpec, maybeMoreImports, maybeFrom);
	}
	function importSpec(type, value) {
		if (type == "{") return contCommasep(importSpec, "}");
		if (type == "variable") register(value);
		if (value == "*") cx.marked = "keyword";
		return cont(maybeAs);
	}
	function maybeMoreImports(type) {
		if (type == ",") return cont(importSpec, maybeMoreImports);
	}
	function maybeAs(_type, value) {
		if (value == "as") {
			cx.marked = "keyword";
			return cont(importSpec);
		}
	}
	function maybeFrom(_type, value) {
		if (value == "from") {
			cx.marked = "keyword";
			return cont(expression);
		}
	}
	function arrayLiteral(type) {
		if (type == "]") return cont();
		return pass(commasep(expressionNoComma, "]"));
	}
	function enumdef() {
		return pass(pushlex("form"), pattern, expect("{"), pushlex("}"), commasep(enummember, "}"), poplex, poplex);
	}
	function enummember() {
		return pass(pattern, maybeAssign);
	}
	function isContinuedStatement(state, textAfter) {
		return state.lastType == "operator" || state.lastType == "," || isOperatorChar.test(textAfter.charAt(0)) || /[,.]/.test(textAfter.charAt(0));
	}
	function expressionAllowed(stream, state, backUp) {
		return state.tokenize == tokenBase && /^(?:operator|sof|keyword [bcd]|case|new|export|default|spread|[\[{}\(,;:]|=>)$/.test(state.lastType) || state.lastType == "quasi" && /\{\s*$/.test(stream.string.slice(0, stream.pos - (backUp || 0)));
	}
	return {
		name: parserConfig.name,
		startState: function(indentUnit) {
			var state = {
				tokenize: tokenBase,
				lastType: "sof",
				cc: [],
				lexical: new JSLexical(-indentUnit, 0, "block", false),
				localVars: parserConfig.localVars,
				context: parserConfig.localVars && new Context(null, null, false),
				indented: 0
			};
			if (parserConfig.globalVars && typeof parserConfig.globalVars == "object") state.globalVars = parserConfig.globalVars;
			return state;
		},
		token: function(stream, state) {
			if (stream.sol()) {
				if (!state.lexical.hasOwnProperty("align")) state.lexical.align = false;
				state.indented = stream.indentation();
				findFatArrow(stream, state);
			}
			if (state.tokenize != tokenComment && stream.eatSpace()) return null;
			var style = state.tokenize(stream, state);
			if (type == "comment") return style;
			state.lastType = type == "operator" && (content == "++" || content == "--") ? "incdec" : type;
			return parseJS(state, style, type, content, stream);
		},
		indent: function(state, textAfter, cx) {
			if (state.tokenize == tokenComment || state.tokenize == tokenQuasi) return null;
			if (state.tokenize != tokenBase) return 0;
			var firstChar = textAfter && textAfter.charAt(0), lexical = state.lexical, top;
			if (!/^\s*else\b/.test(textAfter)) for (var i = state.cc.length - 1; i >= 0; --i) {
				var c = state.cc[i];
				if (c == poplex) lexical = lexical.prev;
				else if (c != maybeelse && c != popcontext) break;
			}
			while ((lexical.type == "stat" || lexical.type == "form") && (firstChar == "}" || (top = state.cc[state.cc.length - 1]) && (top == maybeoperatorComma || top == maybeoperatorNoComma) && !/^[,\.=+\-*:?[\(]/.test(textAfter))) lexical = lexical.prev;
			if (statementIndent && lexical.type == ")" && lexical.prev.type == "stat") lexical = lexical.prev;
			var type = lexical.type, closing = firstChar == type;
			if (type == "vardef") return lexical.indented + (state.lastType == "operator" || state.lastType == "," ? lexical.info.length + 1 : 0);
			else if (type == "form" && firstChar == "{") return lexical.indented;
			else if (type == "form") return lexical.indented + cx.unit;
			else if (type == "stat") return lexical.indented + (isContinuedStatement(state, textAfter) ? statementIndent || cx.unit : 0);
			else if (lexical.info == "switch" && !closing && parserConfig.doubleIndentSwitch != false) return lexical.indented + (/^(?:case|default)\b/.test(textAfter) ? cx.unit : 2 * cx.unit);
			else if (lexical.align) return lexical.column + (closing ? 0 : 1);
			else return lexical.indented + (closing ? 0 : cx.unit);
		},
		languageData: {
			indentOnInput: /^\s*(?:case .*?:|default:|\{|\})$/,
			commentTokens: jsonMode ? void 0 : {
				line: "//",
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
			] },
			wordChars: "$"
		}
	};
}
var javascript = mkJavaScript({ name: "javascript" });
mkJavaScript({
	name: "json",
	json: true
});
var jsonld = mkJavaScript({
	name: "json",
	jsonld: true
});
mkJavaScript({
	name: "typescript",
	typescript: true
});
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/julia.js
function wordRegexp$10(words, end, pre) {
	if (typeof pre === "undefined") pre = "";
	if (typeof end === "undefined") end = "\\b";
	return new RegExp("^" + pre + "((" + words.join(")|(") + "))" + end);
}
var octChar = "\\\\[0-7]{1,3}";
var hexChar = "\\\\x[A-Fa-f0-9]{1,2}";
var sChar = "\\\\[abefnrtv0%?'\"\\\\]";
var uChar = "([^\\u0027\\u005C\\uD800-\\uDFFF]|[\\uD800-\\uDFFF][\\uDC00-\\uDFFF])";
var asciiOperatorsList = [
	"[<>]:",
	"[<>=]=",
	"<<=?",
	">>>?=?",
	"=>",
	"--?>",
	"<--[->]?",
	"\\/\\/",
	"\\.{2,3}",
	"[\\.\\\\%*+\\-<>!\\/^|&]=?",
	"\\?",
	"\\$",
	"~",
	":"
];
var operators$2 = wordRegexp$10([
	"[<>]:",
	"[<>=]=",
	"[!=]==",
	"<<=?",
	">>>?=?",
	"=>?",
	"--?>",
	"<--[->]?",
	"\\/\\/",
	"[\\\\%*+\\-<>!\\/^|&\\u00F7\\u22BB]=?",
	"\\?",
	"\\$",
	"~",
	":",
	"\\u00D7",
	"\\u2208",
	"\\u2209",
	"\\u220B",
	"\\u220C",
	"\\u2218",
	"\\u221A",
	"\\u221B",
	"\\u2229",
	"\\u222A",
	"\\u2260",
	"\\u2264",
	"\\u2265",
	"\\u2286",
	"\\u2288",
	"\\u228A",
	"\\u22C5",
	"\\b(in|isa)\\b(?!.?\\()"
], "");
var delimiters = /^[;,()[\]{}]/;
var identifiers$5 = /^[_A-Za-z\u00A1-\u2217\u2219-\uFFFF][\w\u00A1-\u2217\u2219-\uFFFF]*!*/;
var chars = wordRegexp$10([
	octChar,
	hexChar,
	sChar,
	uChar
], "'");
var openersList = [
	"begin",
	"function",
	"type",
	"struct",
	"immutable",
	"let",
	"macro",
	"for",
	"while",
	"quote",
	"if",
	"else",
	"elseif",
	"try",
	"finally",
	"catch",
	"do"
];
var closersList = [
	"end",
	"else",
	"elseif",
	"catch",
	"finally"
];
var keywordsList = [
	"if",
	"else",
	"elseif",
	"while",
	"for",
	"begin",
	"let",
	"end",
	"do",
	"try",
	"catch",
	"finally",
	"return",
	"break",
	"continue",
	"global",
	"local",
	"const",
	"export",
	"import",
	"importall",
	"using",
	"function",
	"where",
	"macro",
	"module",
	"baremodule",
	"struct",
	"type",
	"mutable",
	"immutable",
	"quote",
	"typealias",
	"abstract",
	"primitive",
	"bitstype"
];
var builtinsList = [
	"true",
	"false",
	"nothing",
	"NaN",
	"Inf"
];
var openers = wordRegexp$10(openersList);
var closers = wordRegexp$10(closersList);
var keywords$24 = wordRegexp$10(keywordsList);
var builtins$5 = wordRegexp$10(builtinsList);
var macro = /^@[_A-Za-z\u00A1-\uFFFF][\w\u00A1-\uFFFF]*!*/;
var symbol = /^:[_A-Za-z\u00A1-\uFFFF][\w\u00A1-\uFFFF]*!*/;
var stringPrefixes$1 = /^(`|([_A-Za-z\u00A1-\uFFFF]*"("")?))/;
var macroOperators = wordRegexp$10(asciiOperatorsList, "", "@");
var symbolOperators = wordRegexp$10(asciiOperatorsList, "", ":");
function inArray(state) {
	return state.nestedArrays > 0;
}
function inGenerator(state) {
	return state.nestedGenerators > 0;
}
function currentScope$1(state, n) {
	if (typeof n === "undefined") n = 0;
	if (state.scopes.length <= n) return null;
	return state.scopes[state.scopes.length - (n + 1)];
}
function tokenBase$28(stream, state) {
	if (stream.match("#=", false)) {
		state.tokenize = tokenComment$13;
		return state.tokenize(stream, state);
	}
	var leavingExpr = state.leavingExpr;
	if (stream.sol()) leavingExpr = false;
	state.leavingExpr = false;
	if (leavingExpr) {
		if (stream.match(/^'+/)) return "operator";
	}
	if (stream.match(/\.{4,}/)) return "error";
	else if (stream.match(/\.{1,3}/)) return "operator";
	if (stream.eatSpace()) return null;
	var ch = stream.peek();
	if (ch === "#") {
		stream.skipToEnd();
		return "comment";
	}
	if (ch === "[") {
		state.scopes.push("[");
		state.nestedArrays++;
	}
	if (ch === "(") {
		state.scopes.push("(");
		state.nestedGenerators++;
	}
	if (inArray(state) && ch === "]") {
		while (state.scopes.length && currentScope$1(state) !== "[") state.scopes.pop();
		state.scopes.pop();
		state.nestedArrays--;
		state.leavingExpr = true;
	}
	if (inGenerator(state) && ch === ")") {
		while (state.scopes.length && currentScope$1(state) !== "(") state.scopes.pop();
		state.scopes.pop();
		state.nestedGenerators--;
		state.leavingExpr = true;
	}
	if (inArray(state)) {
		if (state.lastToken == "end" && stream.match(":")) return "operator";
		if (stream.match("end")) return "number";
	}
	var match;
	if (match = stream.match(openers, false)) state.scopes.push(match[0]);
	if (stream.match(closers, false)) state.scopes.pop();
	if (stream.match(/^::(?![:\$])/)) {
		state.tokenize = tokenAnnotation;
		return state.tokenize(stream, state);
	}
	if (!leavingExpr && (stream.match(symbol) || stream.match(symbolOperators))) return "builtin";
	if (stream.match(operators$2)) return "operator";
	if (stream.match(/^\.?\d/, false)) {
		var imMatcher = RegExp(/^im\b/);
		var numberLiteral = false;
		if (stream.match(/^0x\.[0-9a-f_]+p[\+\-]?[_\d]+/i)) numberLiteral = true;
		if (stream.match(/^0x[0-9a-f_]+/i)) numberLiteral = true;
		if (stream.match(/^0b[01_]+/i)) numberLiteral = true;
		if (stream.match(/^0o[0-7_]+/i)) numberLiteral = true;
		if (stream.match(/^(?:(?:\d[_\d]*)?\.(?!\.)(?:\d[_\d]*)?|\d[_\d]*\.(?!\.)(?:\d[_\d]*))?([Eef][\+\-]?[_\d]+)?/i)) numberLiteral = true;
		if (stream.match(/^\d[_\d]*(e[\+\-]?\d+)?/i)) numberLiteral = true;
		if (numberLiteral) {
			stream.match(imMatcher);
			state.leavingExpr = true;
			return "number";
		}
	}
	if (stream.match("'")) {
		state.tokenize = tokenChar;
		return state.tokenize(stream, state);
	}
	if (stream.match(stringPrefixes$1)) {
		state.tokenize = tokenStringFactory$1(stream.current());
		return state.tokenize(stream, state);
	}
	if (stream.match(macro) || stream.match(macroOperators)) return "meta";
	if (stream.match(delimiters)) return null;
	if (stream.match(keywords$24)) return "keyword";
	if (stream.match(builtins$5)) return "builtin";
	var isDefinition = state.isDefinition || state.lastToken == "function" || state.lastToken == "macro" || state.lastToken == "type" || state.lastToken == "struct" || state.lastToken == "immutable";
	if (stream.match(identifiers$5)) {
		if (isDefinition) {
			if (stream.peek() === ".") {
				state.isDefinition = true;
				return "variable";
			}
			state.isDefinition = false;
			return "def";
		}
		state.leavingExpr = true;
		return "variable";
	}
	stream.next();
	return "error";
}
function tokenAnnotation(stream, state) {
	stream.match(/.*?(?=[,;{}()=\s]|$)/);
	if (stream.match("{")) state.nestedParameters++;
	else if (stream.match("}") && state.nestedParameters > 0) state.nestedParameters--;
	if (state.nestedParameters > 0) stream.match(/.*?(?={|})/) || stream.next();
	else if (state.nestedParameters == 0) state.tokenize = tokenBase$28;
	return "builtin";
}
function tokenComment$13(stream, state) {
	if (stream.match("#=")) state.nestedComments++;
	if (!stream.match(/.*?(?=(#=|=#))/)) stream.skipToEnd();
	if (stream.match("=#")) {
		state.nestedComments--;
		if (state.nestedComments == 0) state.tokenize = tokenBase$28;
	}
	return "comment";
}
function tokenChar(stream, state) {
	var isChar = false, match;
	if (stream.match(chars)) isChar = true;
	else if (match = stream.match(/\\u([a-f0-9]{1,4})(?=')/i)) {
		var value = parseInt(match[1], 16);
		if (value <= 55295 || value >= 57344) {
			isChar = true;
			stream.next();
		}
	} else if (match = stream.match(/\\U([A-Fa-f0-9]{5,8})(?=')/)) {
		var value = parseInt(match[1], 16);
		if (value <= 1114111) {
			isChar = true;
			stream.next();
		}
	}
	if (isChar) {
		state.leavingExpr = true;
		state.tokenize = tokenBase$28;
		return "string";
	}
	if (!stream.match(/^[^']+(?=')/)) stream.skipToEnd();
	if (stream.match("'")) state.tokenize = tokenBase$28;
	return "error";
}
function tokenStringFactory$1(delimiter) {
	if (delimiter.substr(-3) === "\"\"\"") delimiter = "\"\"\"";
	else if (delimiter.substr(-1) === "\"") delimiter = "\"";
	function tokenString(stream, state) {
		if (stream.eat("\\")) stream.next();
		else if (stream.match(delimiter)) {
			state.tokenize = tokenBase$28;
			state.leavingExpr = true;
			return "string";
		} else stream.eat(/[`"]/);
		stream.eatWhile(/[^\\`"]/);
		return "string";
	}
	return tokenString;
}
var julia = {
	name: "julia",
	startState: function() {
		return {
			tokenize: tokenBase$28,
			scopes: [],
			lastToken: null,
			leavingExpr: false,
			isDefinition: false,
			nestedArrays: 0,
			nestedComments: 0,
			nestedGenerators: 0,
			nestedParameters: 0,
			firstParenPos: -1
		};
	},
	token: function(stream, state) {
		var style = state.tokenize(stream, state);
		var current = stream.current();
		if (current && style) state.lastToken = current;
		return style;
	},
	indent: function(state, textAfter, cx) {
		var delta = 0;
		if (textAfter === "]" || textAfter === ")" || /^end\b/.test(textAfter) || /^else/.test(textAfter) || /^catch\b/.test(textAfter) || /^elseif\b/.test(textAfter) || /^finally/.test(textAfter)) delta = -1;
		return (state.scopes.length + delta) * cx.unit;
	},
	languageData: {
		indentOnInput: /^\s*(end|else|catch|finally)\b$/,
		commentTokens: {
			line: "#",
			block: {
				open: "#=",
				close: "=#"
			}
		},
		closeBrackets: { brackets: [
			"(",
			"[",
			"{",
			"\""
		] },
		autocomplete: keywordsList.concat(builtinsList)
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/livescript.js
var tokenBase$27 = function(stream, state) {
	var next_rule = state.next || "start";
	if (next_rule) {
		state.next = state.next;
		var nr = Rules[next_rule];
		if (nr.splice) {
			for (var i$ = 0; i$ < nr.length; ++i$) {
				var r = nr[i$];
				if (r.regex && stream.match(r.regex)) {
					state.next = r.next || state.next;
					return r.token;
				}
			}
			stream.next();
			return "error";
		}
		if (stream.match(r = Rules[next_rule])) {
			if (r.regex && stream.match(r.regex)) {
				state.next = r.next;
				return r.token;
			} else {
				stream.next();
				return "error";
			}
		}
	}
	stream.next();
	return "error";
};
var identifier$1 = "(?![\\d\\s])[$\\w\\xAA-\\uFFDC](?:(?!\\s)[$\\w\\xAA-\\uFFDC]|-[A-Za-z])*";
var indenter = RegExp("(?:[({[=:]|[-~]>|\\b(?:e(?:lse|xport)|d(?:o|efault)|t(?:ry|hen)|finally|import(?:\\s*all)?|const|var|let|new|catch(?:\\s*" + identifier$1 + ")?))\\s*$");
var keywordend = "(?![$\\w]|-[A-Za-z]|\\s*:(?![:=]))";
var stringfill = {
	token: "string",
	regex: ".+"
};
var Rules = {
	start: [
		{
			token: "docComment",
			regex: "/\\*",
			next: "comment"
		},
		{
			token: "comment",
			regex: "#.*"
		},
		{
			token: "keyword",
			regex: "(?:t(?:h(?:is|row|en)|ry|ypeof!?)|c(?:on(?:tinue|st)|a(?:se|tch)|lass)|i(?:n(?:stanceof)?|mp(?:ort(?:\\s+all)?|lements)|[fs])|d(?:e(?:fault|lete|bugger)|o)|f(?:or(?:\\s+own)?|inally|unction)|s(?:uper|witch)|e(?:lse|x(?:tends|port)|val)|a(?:nd|rguments)|n(?:ew|ot)|un(?:less|til)|w(?:hile|ith)|o[fr]|return|break|let|var|loop)" + keywordend
		},
		{
			token: "atom",
			regex: "(?:true|false|yes|no|on|off|null|void|undefined)" + keywordend
		},
		{
			token: "invalid",
			regex: "(?:p(?:ackage|r(?:ivate|otected)|ublic)|i(?:mplements|nterface)|enum|static|yield)" + keywordend
		},
		{
			token: "className.standard",
			regex: "(?:R(?:e(?:gExp|ferenceError)|angeError)|S(?:tring|yntaxError)|E(?:rror|valError)|Array|Boolean|Date|Function|Number|Object|TypeError|URIError)" + keywordend
		},
		{
			token: "variableName.function.standard",
			regex: "(?:is(?:NaN|Finite)|parse(?:Int|Float)|Math|JSON|(?:en|de)codeURI(?:Component)?)" + keywordend
		},
		{
			token: "variableName.standard",
			regex: "(?:t(?:hat|il|o)|f(?:rom|allthrough)|it|by|e)" + keywordend
		},
		{
			token: "variableName",
			regex: identifier$1 + "\\s*:(?![:=])"
		},
		{
			token: "variableName",
			regex: identifier$1
		},
		{
			token: "operatorKeyword",
			regex: "(?:\\.{3}|\\s+\\?)"
		},
		{
			token: "keyword",
			regex: "(?:@+|::|\\.\\.)",
			next: "key"
		},
		{
			token: "operatorKeyword",
			regex: "\\.\\s*",
			next: "key"
		},
		{
			token: "string",
			regex: "\\\\\\S[^\\s,;)}\\]]*"
		},
		{
			token: "docString",
			regex: "'''",
			next: "qdoc"
		},
		{
			token: "docString",
			regex: "\"\"\"",
			next: "qqdoc"
		},
		{
			token: "string",
			regex: "'",
			next: "qstring"
		},
		{
			token: "string",
			regex: "\"",
			next: "qqstring"
		},
		{
			token: "string",
			regex: "`",
			next: "js"
		},
		{
			token: "string",
			regex: "<\\[",
			next: "words"
		},
		{
			token: "regexp",
			regex: "//",
			next: "heregex"
		},
		{
			token: "regexp",
			regex: "\\/(?:[^[\\/\\n\\\\]*(?:(?:\\\\.|\\[[^\\]\\n\\\\]*(?:\\\\.[^\\]\\n\\\\]*)*\\])[^[\\/\\n\\\\]*)*)\\/[gimy$]{0,4}",
			next: "key"
		},
		{
			token: "number",
			regex: "(?:0x[\\da-fA-F][\\da-fA-F_]*|(?:[2-9]|[12]\\d|3[0-6])r[\\da-zA-Z][\\da-zA-Z_]*|(?:\\d[\\d_]*(?:\\.\\d[\\d_]*)?|\\.\\d[\\d_]*)(?:e[+-]?\\d[\\d_]*)?[\\w$]*)"
		},
		{
			token: "paren",
			regex: "[({[]"
		},
		{
			token: "paren",
			regex: "[)}\\]]",
			next: "key"
		},
		{
			token: "operatorKeyword",
			regex: "\\S+"
		},
		{
			token: "content",
			regex: "\\s+"
		}
	],
	heregex: [
		{
			token: "regexp",
			regex: ".*?//[gimy$?]{0,4}",
			next: "start"
		},
		{
			token: "regexp",
			regex: "\\s*#{"
		},
		{
			token: "comment",
			regex: "\\s+(?:#.*)?"
		},
		{
			token: "regexp",
			regex: "\\S+"
		}
	],
	key: [
		{
			token: "operatorKeyword",
			regex: "[.?@!]+"
		},
		{
			token: "variableName",
			regex: identifier$1,
			next: "start"
		},
		{
			token: "content",
			regex: "",
			next: "start"
		}
	],
	comment: [{
		token: "docComment",
		regex: ".*?\\*/",
		next: "start"
	}, {
		token: "docComment",
		regex: ".+"
	}],
	qdoc: [{
		token: "string",
		regex: ".*?'''",
		next: "key"
	}, stringfill],
	qqdoc: [{
		token: "string",
		regex: ".*?\"\"\"",
		next: "key"
	}, stringfill],
	qstring: [{
		token: "string",
		regex: "[^\\\\']*(?:\\\\.[^\\\\']*)*'",
		next: "key"
	}, stringfill],
	qqstring: [{
		token: "string",
		regex: "[^\\\\\"]*(?:\\\\.[^\\\\\"]*)*\"",
		next: "key"
	}, stringfill],
	js: [{
		token: "string",
		regex: "[^\\\\`]*(?:\\\\.[^\\\\`]*)*`",
		next: "key"
	}, stringfill],
	words: [{
		token: "string",
		regex: ".*?\\]>",
		next: "key"
	}, stringfill]
};
for (var idx in Rules) {
	var r$1 = Rules[idx];
	if (r$1.splice) for (var i = 0, len = r$1.length; i < len; ++i) {
		var rr = r$1[i];
		if (typeof rr.regex === "string") Rules[idx][i].regex = new RegExp("^" + rr.regex);
	}
	else if (typeof rr.regex === "string") Rules[idx].regex = new RegExp("^" + r$1.regex);
}
var liveScript = {
	name: "livescript",
	startState: function() {
		return {
			next: "start",
			lastToken: {
				style: null,
				indent: 0,
				content: ""
			}
		};
	},
	token: function(stream, state) {
		while (stream.pos == stream.start) var style = tokenBase$27(stream, state);
		state.lastToken = {
			style,
			indent: stream.indentation(),
			content: stream.current()
		};
		return style.replace(/\./g, " ");
	},
	indent: function(state) {
		var indentation = state.lastToken.indent;
		if (state.lastToken.content.match(indenter)) indentation += 2;
		return indentation;
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/lua.js
function prefixRE(words) {
	return new RegExp("^(?:" + words.join("|") + ")", "i");
}
function wordRE(words) {
	return new RegExp("^(?:" + words.join("|") + ")$", "i");
}
var builtins$4 = wordRE([
	"_G",
	"_VERSION",
	"assert",
	"collectgarbage",
	"dofile",
	"error",
	"getfenv",
	"getmetatable",
	"ipairs",
	"load",
	"loadfile",
	"loadstring",
	"module",
	"next",
	"pairs",
	"pcall",
	"print",
	"rawequal",
	"rawget",
	"rawset",
	"require",
	"select",
	"setfenv",
	"setmetatable",
	"tonumber",
	"tostring",
	"type",
	"unpack",
	"xpcall",
	"coroutine.create",
	"coroutine.resume",
	"coroutine.running",
	"coroutine.status",
	"coroutine.wrap",
	"coroutine.yield",
	"debug.debug",
	"debug.getfenv",
	"debug.gethook",
	"debug.getinfo",
	"debug.getlocal",
	"debug.getmetatable",
	"debug.getregistry",
	"debug.getupvalue",
	"debug.setfenv",
	"debug.sethook",
	"debug.setlocal",
	"debug.setmetatable",
	"debug.setupvalue",
	"debug.traceback",
	"close",
	"flush",
	"lines",
	"read",
	"seek",
	"setvbuf",
	"write",
	"io.close",
	"io.flush",
	"io.input",
	"io.lines",
	"io.open",
	"io.output",
	"io.popen",
	"io.read",
	"io.stderr",
	"io.stdin",
	"io.stdout",
	"io.tmpfile",
	"io.type",
	"io.write",
	"math.abs",
	"math.acos",
	"math.asin",
	"math.atan",
	"math.atan2",
	"math.ceil",
	"math.cos",
	"math.cosh",
	"math.deg",
	"math.exp",
	"math.floor",
	"math.fmod",
	"math.frexp",
	"math.huge",
	"math.ldexp",
	"math.log",
	"math.log10",
	"math.max",
	"math.min",
	"math.modf",
	"math.pi",
	"math.pow",
	"math.rad",
	"math.random",
	"math.randomseed",
	"math.sin",
	"math.sinh",
	"math.sqrt",
	"math.tan",
	"math.tanh",
	"os.clock",
	"os.date",
	"os.difftime",
	"os.execute",
	"os.exit",
	"os.getenv",
	"os.remove",
	"os.rename",
	"os.setlocale",
	"os.time",
	"os.tmpname",
	"package.cpath",
	"package.loaded",
	"package.loaders",
	"package.loadlib",
	"package.path",
	"package.preload",
	"package.seeall",
	"string.byte",
	"string.char",
	"string.dump",
	"string.find",
	"string.format",
	"string.gmatch",
	"string.gsub",
	"string.len",
	"string.lower",
	"string.match",
	"string.rep",
	"string.reverse",
	"string.sub",
	"string.upper",
	"table.concat",
	"table.insert",
	"table.maxn",
	"table.remove",
	"table.sort"
]);
var keywords$23 = wordRE([
	"and",
	"break",
	"elseif",
	"false",
	"nil",
	"not",
	"or",
	"return",
	"true",
	"function",
	"end",
	"if",
	"then",
	"else",
	"do",
	"while",
	"repeat",
	"until",
	"for",
	"in",
	"local"
]);
var indentTokens = wordRE([
	"function",
	"if",
	"repeat",
	"do",
	"\\(",
	"{"
]);
var dedentTokens = wordRE([
	"end",
	"until",
	"\\)",
	"}"
]);
var dedentPartial = prefixRE([
	"end",
	"until",
	"\\)",
	"}",
	"else",
	"elseif"
]);
function readBracket(stream) {
	var level = 0;
	while (stream.eat("=")) ++level;
	stream.eat("[");
	return level;
}
function normal(stream, state) {
	var ch = stream.next();
	if (ch == "-" && stream.eat("-")) {
		if (stream.eat("[") && /[\[=]/.test(stream.peek())) return (state.cur = bracketed(readBracket(stream), "comment"))(stream, state);
		stream.skipToEnd();
		return "comment";
	}
	if (ch == "\"" || ch == "'") return (state.cur = string(ch))(stream, state);
	if (ch == "[" && /[\[=]/.test(stream.peek())) return (state.cur = bracketed(readBracket(stream), "string"))(stream, state);
	if (/\d/.test(ch)) {
		stream.eatWhile(/[\w.%]/);
		return "number";
	}
	if (/[\w_]/.test(ch)) {
		stream.eatWhile(/[\w\\\-_.]/);
		return "variable";
	}
	return null;
}
function bracketed(level, style) {
	return function(stream, state) {
		var curlev = null, ch;
		while ((ch = stream.next()) != null) if (curlev == null) {
			if (ch == "]") curlev = 0;
		} else if (ch == "=") ++curlev;
		else if (ch == "]" && curlev == level) {
			state.cur = normal;
			break;
		} else curlev = null;
		return style;
	};
}
function string(quote) {
	return function(stream, state) {
		var escaped = false, ch;
		while ((ch = stream.next()) != null) {
			if (ch == quote && !escaped) break;
			escaped = !escaped && ch == "\\";
		}
		if (!escaped) state.cur = normal;
		return "string";
	};
}
var lua = {
	name: "lua",
	startState: function() {
		return {
			basecol: 0,
			indentDepth: 0,
			cur: normal
		};
	},
	token: function(stream, state) {
		if (stream.eatSpace()) return null;
		var style = state.cur(stream, state);
		var word = stream.current();
		if (style == "variable") {
			if (keywords$23.test(word)) style = "keyword";
			else if (builtins$4.test(word)) style = "builtin";
		}
		if (style != "comment" && style != "string") {
			if (indentTokens.test(word)) ++state.indentDepth;
			else if (dedentTokens.test(word)) --state.indentDepth;
		}
		return style;
	},
	indent: function(state, textAfter, cx) {
		var closing = dedentPartial.test(textAfter);
		return state.basecol + cx.unit * (state.indentDepth - (closing ? 1 : 0));
	},
	languageData: {
		indentOnInput: /^\s*(?:end|until|else|\)|\})$/,
		commentTokens: {
			line: "--",
			block: {
				open: "--[[",
				close: "]]--"
			}
		}
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/mirc.js
function parseWords$2(str) {
	var obj = {}, words = str.split(" ");
	for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
	return obj;
}
var specials$1 = parseWords$2("$! $$ $& $? $+ $abook $abs $active $activecid $activewid $address $addtok $agent $agentname $agentstat $agentver $alias $and $anick $ansi2mirc $aop $appactive $appstate $asc $asctime $asin $atan $avoice $away $awaymsg $awaytime $banmask $base $bfind $binoff $biton $bnick $bvar $bytes $calc $cb $cd $ceil $chan $chanmodes $chantypes $chat $chr $cid $clevel $click $cmdbox $cmdline $cnick $color $com $comcall $comchan $comerr $compact $compress $comval $cos $count $cr $crc $creq $crlf $ctime $ctimer $ctrlenter $date $day $daylight $dbuh $dbuw $dccignore $dccport $dde $ddename $debug $decode $decompress $deltok $devent $dialog $did $didreg $didtok $didwm $disk $dlevel $dll $dllcall $dname $dns $duration $ebeeps $editbox $emailaddr $encode $error $eval $event $exist $feof $ferr $fgetc $file $filename $filtered $finddir $finddirn $findfile $findfilen $findtok $fline $floor $fopen $fread $fserve $fulladdress $fulldate $fullname $fullscreen $get $getdir $getdot $gettok $gmt $group $halted $hash $height $hfind $hget $highlight $hnick $hotline $hotlinepos $ial $ialchan $ibl $idle $iel $ifmatch $ignore $iif $iil $inelipse $ini $inmidi $inpaste $inpoly $input $inrect $inroundrect $insong $instok $int $inwave $ip $isalias $isbit $isdde $isdir $isfile $isid $islower $istok $isupper $keychar $keyrpt $keyval $knick $lactive $lactivecid $lactivewid $left $len $level $lf $line $lines $link $lock $lock $locked $log $logstamp $logstampfmt $longfn $longip $lower $ltimer $maddress $mask $matchkey $matchtok $md5 $me $menu $menubar $menucontext $menutype $mid $middir $mircdir $mircexe $mircini $mklogfn $mnick $mode $modefirst $modelast $modespl $mouse $msfile $network $newnick $nick $nofile $nopath $noqt $not $notags $notify $null $numeric $numok $oline $onpoly $opnick $or $ord $os $passivedcc $pic $play $pnick $port $portable $portfree $pos $prefix $prop $protect $puttok $qt $query $rand $r $rawmsg $read $readomo $readn $regex $regml $regsub $regsubex $remove $remtok $replace $replacex $reptok $result $rgb $right $round $scid $scon $script $scriptdir $scriptline $sdir $send $server $serverip $sfile $sha1 $shortfn $show $signal $sin $site $sline $snick $snicks $snotify $sock $sockbr $sockerr $sockname $sorttok $sound $sqrt $ssl $sreq $sslready $status $strip $str $stripped $syle $submenu $switchbar $tan $target $ticks $time $timer $timestamp $timestampfmt $timezone $tip $titlebar $toolbar $treebar $trust $ulevel $ulist $upper $uptime $url $usermode $v1 $v2 $var $vcmd $vcmdstat $vcmdver $version $vnick $vol $wid $width $wildsite $wildtok $window $wrap $xor");
var keywords$22 = parseWords$2("abook ajinvite alias aline ame amsg anick aop auser autojoin avoice away background ban bcopy beep bread break breplace bset btrunc bunset bwrite channel clear clearall cline clipboard close cnick color comclose comopen comreg continue copy creq ctcpreply ctcps dcc dccserver dde ddeserver debug dec describe dialog did didtok disable disconnect dlevel dline dll dns dqwindow drawcopy drawdot drawfill drawline drawpic drawrect drawreplace drawrot drawsave drawscroll drawtext ebeeps echo editbox emailaddr enable events exit fclose filter findtext finger firewall flash flist flood flush flushini font fopen fseek fsend fserve fullname fwrite ghide gload gmove gopts goto gplay gpoint gqreq groups gshow gsize gstop gtalk gunload hadd halt haltdef hdec hdel help hfree hinc hload hmake hop hsave ial ialclear ialmark identd if ignore iline inc invite iuser join kick linesep links list load loadbuf localinfo log mdi me menubar mkdir mnick mode msg nick noop notice notify omsg onotice part partall pdcc perform play playctrl pop protect pvoice qme qmsg query queryn quit raw reload remini remote remove rename renwin reseterror resetidle return rlevel rline rmdir run ruser save savebuf saveini say scid scon server set showmirc signam sline sockaccept sockclose socklist socklisten sockmark sockopen sockpause sockread sockrename sockudp sockwrite sound speak splay sreq strip switchbar timer timestamp titlebar tnick tokenize toolbar topic tray treebar ulist unload unset unsetall updatenl url uwho var vcadd vcmd vcrem vol while whois window winhelp write writeint if isalnum isalpha isaop isavoice isban ischan ishop isignore isin isincs isletter islower isnotify isnum ison isop isprotect isreg isupper isvoice iswm iswmcs elseif else goto menu nicklist status title icon size option text edit button check radio box scroll list combo link tab item");
var functions$2 = parseWords$2("if elseif else and not or eq ne in ni for foreach while switch");
var isOperatorChar$7 = /[+\-*&%=<>!?^\/\|]/;
function chain$5(stream, state, f) {
	state.tokenize = f;
	return f(stream, state);
}
function tokenBase$26(stream, state) {
	var beforeParams = state.beforeParams;
	state.beforeParams = false;
	var ch = stream.next();
	if (/[\[\]{}\(\),\.]/.test(ch)) {
		if (ch == "(" && beforeParams) state.inParams = true;
		else if (ch == ")") state.inParams = false;
		return null;
	} else if (/\d/.test(ch)) {
		stream.eatWhile(/[\w\.]/);
		return "number";
	} else if (ch == "\\") {
		stream.eat("\\");
		stream.eat(/./);
		return "number";
	} else if (ch == "/" && stream.eat("*")) return chain$5(stream, state, tokenComment$12);
	else if (ch == ";" && stream.match(/ *\( *\(/)) return chain$5(stream, state, tokenUnparsed$2);
	else if (ch == ";" && !state.inParams) {
		stream.skipToEnd();
		return "comment";
	} else if (ch == "\"") {
		stream.eat(/"/);
		return "keyword";
	} else if (ch == "$") {
		stream.eatWhile(/[$_a-z0-9A-Z\.:]/);
		if (specials$1 && specials$1.propertyIsEnumerable(stream.current().toLowerCase())) return "keyword";
		else {
			state.beforeParams = true;
			return "builtin";
		}
	} else if (ch == "%") {
		stream.eatWhile(/[^,\s()]/);
		state.beforeParams = true;
		return "string";
	} else if (isOperatorChar$7.test(ch)) {
		stream.eatWhile(isOperatorChar$7);
		return "operator";
	} else {
		stream.eatWhile(/[\w\$_{}]/);
		var word = stream.current().toLowerCase();
		if (keywords$22 && keywords$22.propertyIsEnumerable(word)) return "keyword";
		if (functions$2 && functions$2.propertyIsEnumerable(word)) {
			state.beforeParams = true;
			return "keyword";
		}
		return null;
	}
}
function tokenComment$12(stream, state) {
	var maybeEnd = false, ch;
	while (ch = stream.next()) {
		if (ch == "/" && maybeEnd) {
			state.tokenize = tokenBase$26;
			break;
		}
		maybeEnd = ch == "*";
	}
	return "comment";
}
function tokenUnparsed$2(stream, state) {
	var maybeEnd = 0, ch;
	while (ch = stream.next()) {
		if (ch == ";" && maybeEnd == 2) {
			state.tokenize = tokenBase$26;
			break;
		}
		if (ch == ")") maybeEnd++;
		else if (ch != " ") maybeEnd = 0;
	}
	return "meta";
}
var mirc = {
	name: "mirc",
	startState: function() {
		return {
			tokenize: tokenBase$26,
			beforeParams: false,
			inParams: false
		};
	},
	token: function(stream, state) {
		if (stream.eatSpace()) return null;
		return state.tokenize(stream, state);
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/mathematica.js
var Identifier = "[a-zA-Z\\$][a-zA-Z0-9\\$]*";
var pBase = "(?:\\d+)";
var pFloat = "(?:\\.\\d+|\\d+\\.\\d*|\\d+)";
var pFloatBase = "(?:\\.\\w+|\\w+\\.\\w*|\\w+)";
var pPrecision = "(?:`(?:`?" + pFloat + ")?)";
var reBaseForm = new RegExp("(?:" + pBase + "(?:\\^\\^" + pFloatBase + pPrecision + "?(?:\\*\\^[+-]?\\d+)?))");
var reFloatForm$1 = new RegExp("(?:" + pFloat + pPrecision + "?(?:\\*\\^[+-]?\\d+)?)");
var reIdInContext = new RegExp("(?:`?)(?:" + Identifier + ")(?:`(?:" + Identifier + "))*(?:`?)");
function tokenBase$25(stream, state) {
	var ch = stream.next();
	if (ch === "\"") {
		state.tokenize = tokenString$18;
		return state.tokenize(stream, state);
	}
	if (ch === "(") {
		if (stream.eat("*")) {
			state.commentLevel++;
			state.tokenize = tokenComment$11;
			return state.tokenize(stream, state);
		}
	}
	stream.backUp(1);
	if (stream.match(reBaseForm, true, false)) return "number";
	if (stream.match(reFloatForm$1, true, false)) return "number";
	if (stream.match(/(?:In|Out)\[[0-9]*\]/, true, false)) return "atom";
	if (stream.match(/([a-zA-Z\$][a-zA-Z0-9\$]*(?:`[a-zA-Z0-9\$]+)*::usage)/, true, false)) return "meta";
	if (stream.match(/([a-zA-Z\$][a-zA-Z0-9\$]*(?:`[a-zA-Z0-9\$]+)*::[a-zA-Z\$][a-zA-Z0-9\$]*):?/, true, false)) return "string.special";
	if (stream.match(/([a-zA-Z\$][a-zA-Z0-9\$]*\s*:)(?:(?:[a-zA-Z\$][a-zA-Z0-9\$]*)|(?:[^:=>~@\^\&\*\)\[\]'\?,\|])).*/, true, false)) return "variableName.special";
	if (stream.match(/[a-zA-Z\$][a-zA-Z0-9\$]*_+[a-zA-Z\$][a-zA-Z0-9\$]*/, true, false)) return "variableName.special";
	if (stream.match(/[a-zA-Z\$][a-zA-Z0-9\$]*_+/, true, false)) return "variableName.special";
	if (stream.match(/_+[a-zA-Z\$][a-zA-Z0-9\$]*/, true, false)) return "variableName.special";
	if (stream.match(/\\\[[a-zA-Z\$][a-zA-Z0-9\$]*\]/, true, false)) return "character";
	if (stream.match(/(?:\[|\]|{|}|\(|\))/, true, false)) return "bracket";
	if (stream.match(/(?:#[a-zA-Z\$][a-zA-Z0-9\$]*|#+[0-9]?)/, true, false)) return "variableName.constant";
	if (stream.match(reIdInContext, true, false)) return "keyword";
	if (stream.match(/(?:\\|\+|\-|\*|\/|,|;|\.|:|@|~|=|>|<|&|\||_|`|'|\^|\?|!|%)/, true, false)) return "operator";
	stream.next();
	return "error";
}
function tokenString$18(stream, state) {
	var next, end = false, escaped = false;
	while ((next = stream.next()) != null) {
		if (next === "\"" && !escaped) {
			end = true;
			break;
		}
		escaped = !escaped && next === "\\";
	}
	if (end && !escaped) state.tokenize = tokenBase$25;
	return "string";
}
function tokenComment$11(stream, state) {
	var prev, next;
	while (state.commentLevel > 0 && (next = stream.next()) != null) {
		if (prev === "(" && next === "*") state.commentLevel++;
		if (prev === "*" && next === ")") state.commentLevel--;
		prev = next;
	}
	if (state.commentLevel <= 0) state.tokenize = tokenBase$25;
	return "comment";
}
var mathematica = {
	name: "mathematica",
	startState: function() {
		return {
			tokenize: tokenBase$25,
			commentLevel: 0
		};
	},
	token: function(stream, state) {
		if (stream.eatSpace()) return null;
		return state.tokenize(stream, state);
	},
	languageData: { commentTokens: { block: {
		open: "(*",
		close: "*)"
	} } }
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/modelica.js
function words$11(str) {
	var obj = {}, words = str.split(" ");
	for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
	return obj;
}
var keywords$21 = words$11("algorithm and annotation assert block break class connect connector constant constrainedby der discrete each else elseif elsewhen encapsulated end enumeration equation expandable extends external false final flow for function if import impure in initial inner input loop model not operator or outer output package parameter partial protected public pure record redeclare replaceable return stream then true type when while within");
var builtin$1 = words$11("abs acos actualStream asin atan atan2 cardinality ceil cos cosh delay div edge exp floor getInstanceName homotopy inStream integer log log10 mod pre reinit rem semiLinear sign sin sinh spatialDistribution sqrt tan tanh");
var atoms$7 = words$11("Real Boolean Integer String");
var completions = [].concat(Object.keys(keywords$21), Object.keys(builtin$1), Object.keys(atoms$7));
var isSingleOperatorChar$1 = /[;=\(:\),{}.*<>+\-\/^\[\]]/;
var isDoubleOperatorChar$1 = /(:=|<=|>=|==|<>|\.\+|\.\-|\.\*|\.\/|\.\^)/;
var isDigit = /[0-9]/;
var isNonDigit = /[_a-zA-Z]/;
function tokenLineComment$1(stream, state) {
	stream.skipToEnd();
	state.tokenize = null;
	return "comment";
}
function tokenBlockComment$1(stream, state) {
	var maybeEnd = false, ch;
	while (ch = stream.next()) {
		if (maybeEnd && ch == "/") {
			state.tokenize = null;
			break;
		}
		maybeEnd = ch == "*";
	}
	return "comment";
}
function tokenString$17(stream, state) {
	var escaped = false, ch;
	while ((ch = stream.next()) != null) {
		if (ch == "\"" && !escaped) {
			state.tokenize = null;
			state.sol = false;
			break;
		}
		escaped = !escaped && ch == "\\";
	}
	return "string";
}
function tokenIdent(stream, state) {
	stream.eatWhile(isDigit);
	while (stream.eat(isDigit) || stream.eat(isNonDigit));
	var cur = stream.current();
	if (state.sol && (cur == "package" || cur == "model" || cur == "when" || cur == "connector")) state.level++;
	else if (state.sol && cur == "end" && state.level > 0) state.level--;
	state.tokenize = null;
	state.sol = false;
	if (keywords$21.propertyIsEnumerable(cur)) return "keyword";
	else if (builtin$1.propertyIsEnumerable(cur)) return "builtin";
	else if (atoms$7.propertyIsEnumerable(cur)) return "atom";
	else return "variable";
}
function tokenQIdent(stream, state) {
	while (stream.eat(/[^']/));
	state.tokenize = null;
	state.sol = false;
	if (stream.eat("'")) return "variable";
	else return "error";
}
function tokenUnsignedNumber(stream, state) {
	stream.eatWhile(isDigit);
	if (stream.eat(".")) stream.eatWhile(isDigit);
	if (stream.eat("e") || stream.eat("E")) {
		if (!stream.eat("-")) stream.eat("+");
		stream.eatWhile(isDigit);
	}
	state.tokenize = null;
	state.sol = false;
	return "number";
}
var modelica = {
	name: "modelica",
	startState: function() {
		return {
			tokenize: null,
			level: 0,
			sol: true
		};
	},
	token: function(stream, state) {
		if (state.tokenize != null) return state.tokenize(stream, state);
		if (stream.sol()) state.sol = true;
		if (stream.eatSpace()) {
			state.tokenize = null;
			return null;
		}
		var ch = stream.next();
		if (ch == "/" && stream.eat("/")) state.tokenize = tokenLineComment$1;
		else if (ch == "/" && stream.eat("*")) state.tokenize = tokenBlockComment$1;
		else if (isDoubleOperatorChar$1.test(ch + stream.peek())) {
			stream.next();
			state.tokenize = null;
			return "operator";
		} else if (isSingleOperatorChar$1.test(ch)) {
			state.tokenize = null;
			return "operator";
		} else if (isNonDigit.test(ch)) state.tokenize = tokenIdent;
		else if (ch == "'" && stream.peek() && stream.peek() != "'") state.tokenize = tokenQIdent;
		else if (ch == "\"") state.tokenize = tokenString$17;
		else if (isDigit.test(ch)) state.tokenize = tokenUnsignedNumber;
		else {
			state.tokenize = null;
			return "error";
		}
		return state.tokenize(stream, state);
	},
	indent: function(state, textAfter, cx) {
		if (state.tokenize != null) return null;
		var level = state.level;
		if (/(algorithm)/.test(textAfter)) level--;
		if (/(equation)/.test(textAfter)) level--;
		if (/(initial algorithm)/.test(textAfter)) level--;
		if (/(initial equation)/.test(textAfter)) level--;
		if (/(end)/.test(textAfter)) level--;
		if (level > 0) return cx.unit * level;
		else return 0;
	},
	languageData: {
		commentTokens: {
			line: "//",
			block: {
				open: "/*",
				close: "*/"
			}
		},
		autocomplete: completions
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/mumps.js
function wordRegexp$9(words) {
	return new RegExp("^((" + words.join(")|(") + "))\\b", "i");
}
var singleOperators$4 = /* @__PURE__ */ new RegExp("^[\\+\\-\\*/&#!_?\\\\<>=\\'\\[\\]]");
var doubleOperators$3 = /* @__PURE__ */ new RegExp("^(('=)|(<=)|(>=)|('>)|('<)|([[)|(]])|(^$))");
var singleDelimiters$2 = /* @__PURE__ */ new RegExp("^[\\.,:]");
var brackets = /* @__PURE__ */ new RegExp("[()]");
var identifiers$4 = /* @__PURE__ */ new RegExp("^[%A-Za-z][A-Za-z0-9]*");
var commandKeywords = [
	"break",
	"close",
	"do",
	"else",
	"for",
	"goto",
	"halt",
	"hang",
	"if",
	"job",
	"kill",
	"lock",
	"merge",
	"new",
	"open",
	"quit",
	"read",
	"set",
	"tcommit",
	"trollback",
	"tstart",
	"use",
	"view",
	"write",
	"xecute",
	"b",
	"c",
	"d",
	"e",
	"f",
	"g",
	"h",
	"i",
	"j",
	"k",
	"l",
	"m",
	"n",
	"o",
	"q",
	"r",
	"s",
	"tc",
	"tro",
	"ts",
	"u",
	"v",
	"w",
	"x"
];
var intrinsicFuncs = wordRegexp$9([
	"\\$ascii",
	"\\$char",
	"\\$data",
	"\\$ecode",
	"\\$estack",
	"\\$etrap",
	"\\$extract",
	"\\$find",
	"\\$fnumber",
	"\\$get",
	"\\$horolog",
	"\\$io",
	"\\$increment",
	"\\$job",
	"\\$justify",
	"\\$length",
	"\\$name",
	"\\$next",
	"\\$order",
	"\\$piece",
	"\\$qlength",
	"\\$qsubscript",
	"\\$query",
	"\\$quit",
	"\\$random",
	"\\$reverse",
	"\\$select",
	"\\$stack",
	"\\$test",
	"\\$text",
	"\\$translate",
	"\\$view",
	"\\$x",
	"\\$y",
	"\\$a",
	"\\$c",
	"\\$d",
	"\\$e",
	"\\$ec",
	"\\$es",
	"\\$et",
	"\\$f",
	"\\$fn",
	"\\$g",
	"\\$h",
	"\\$i",
	"\\$j",
	"\\$l",
	"\\$n",
	"\\$na",
	"\\$o",
	"\\$p",
	"\\$q",
	"\\$ql",
	"\\$qs",
	"\\$r",
	"\\$re",
	"\\$s",
	"\\$st",
	"\\$t",
	"\\$tr",
	"\\$v",
	"\\$z"
]);
var command = wordRegexp$9(commandKeywords);
function tokenBase$24(stream, state) {
	if (stream.sol()) {
		state.label = true;
		state.commandMode = 0;
	}
	var ch = stream.peek();
	if (ch == " " || ch == "	") {
		state.label = false;
		if (state.commandMode == 0) state.commandMode = 1;
		else if (state.commandMode < 0 || state.commandMode == 2) state.commandMode = 0;
	} else if (ch != "." && state.commandMode > 0) {
		if (ch == ":") state.commandMode = -1;
		else state.commandMode = 2;
	}
	if (ch === "(" || ch === "	") state.label = false;
	if (ch === ";") {
		stream.skipToEnd();
		return "comment";
	}
	if (stream.match(/^[-+]?\d+(\.\d+)?([eE][-+]?\d+)?/)) return "number";
	if (ch == "\"") {
		if (stream.skipTo("\"")) {
			stream.next();
			return "string";
		} else {
			stream.skipToEnd();
			return "error";
		}
	}
	if (stream.match(doubleOperators$3) || stream.match(singleOperators$4)) return "operator";
	if (stream.match(singleDelimiters$2)) return null;
	if (brackets.test(ch)) {
		stream.next();
		return "bracket";
	}
	if (state.commandMode > 0 && stream.match(command)) return "controlKeyword";
	if (stream.match(intrinsicFuncs)) return "builtin";
	if (stream.match(identifiers$4)) return "variable";
	if (ch === "$" || ch === "^") {
		stream.next();
		return "builtin";
	}
	if (ch === "@") {
		stream.next();
		return "string.special";
	}
	if (/[\w%]/.test(ch)) {
		stream.eatWhile(/[\w%]/);
		return "variable";
	}
	stream.next();
	return "error";
}
var mumps = {
	name: "mumps",
	startState: function() {
		return {
			label: false,
			commandMode: 0
		};
	},
	token: function(stream, state) {
		var style = tokenBase$24(stream, state);
		if (state.label) return "tag";
		return style;
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/mbox.js
var rfc2822 = [
	"From",
	"Sender",
	"Reply-To",
	"To",
	"Cc",
	"Bcc",
	"Message-ID",
	"In-Reply-To",
	"References",
	"Resent-From",
	"Resent-Sender",
	"Resent-To",
	"Resent-Cc",
	"Resent-Bcc",
	"Resent-Message-ID",
	"Return-Path",
	"Received"
];
var rfc2822NoEmail = [
	"Date",
	"Subject",
	"Comments",
	"Keywords",
	"Resent-Date"
];
var whitespace = /^[ \t]/;
var separator = /^From /;
var rfc2822Header = new RegExp("^(" + rfc2822.join("|") + "): ");
var rfc2822HeaderNoEmail = new RegExp("^(" + rfc2822NoEmail.join("|") + "): ");
var header = /^[^:]+:/;
var email = /^[^ ]+@[^ ]+/;
var untilEmail = /^.*?(?=[^ ]+?@[^ ]+)/;
var bracketedEmail = /^<.*?>/;
var untilBracketedEmail = /^.*?(?=<.*>)/;
function styleForHeader(header) {
	if (header === "Subject") return "header";
	return "string";
}
function readToken$1(stream, state) {
	if (stream.sol()) {
		state.inSeparator = false;
		if (state.inHeader && stream.match(whitespace)) return null;
		else {
			state.inHeader = false;
			state.header = null;
		}
		if (stream.match(separator)) {
			state.inHeaders = true;
			state.inSeparator = true;
			return "atom";
		}
		var match;
		var emailPermitted = false;
		if ((match = stream.match(rfc2822HeaderNoEmail)) || (emailPermitted = true) && (match = stream.match(rfc2822Header))) {
			state.inHeaders = true;
			state.inHeader = true;
			state.emailPermitted = emailPermitted;
			state.header = match[1];
			return "atom";
		}
		if (state.inHeaders && (match = stream.match(header))) {
			state.inHeader = true;
			state.emailPermitted = true;
			state.header = match[1];
			return "atom";
		}
		state.inHeaders = false;
		stream.skipToEnd();
		return null;
	}
	if (state.inSeparator) {
		if (stream.match(email)) return "link";
		if (stream.match(untilEmail)) return "atom";
		stream.skipToEnd();
		return "atom";
	}
	if (state.inHeader) {
		var style = styleForHeader(state.header);
		if (state.emailPermitted) {
			if (stream.match(bracketedEmail)) return style + " link";
			if (stream.match(untilBracketedEmail)) return style;
		}
		stream.skipToEnd();
		return style;
	}
	stream.skipToEnd();
	return null;
}
var mbox = {
	name: "mbox",
	startState: function() {
		return {
			inSeparator: false,
			inHeader: false,
			emailPermitted: false,
			header: null,
			inHeaders: false
		};
	},
	token: readToken$1,
	blankLine: function(state) {
		state.inHeaders = state.inSeparator = state.inHeader = false;
	},
	languageData: { autocomplete: rfc2822.concat(rfc2822NoEmail) }
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/nsis.js
var nsis = simpleMode({
	start: [
		{
			regex: /(?:[+-]?)(?:0x[\d,a-f]+)|(?:0o[0-7]+)|(?:0b[0,1]+)|(?:\d+.?\d*)/,
			token: "number"
		},
		{
			regex: /"(?:[^\\"]|\\.)*"?/,
			token: "string"
		},
		{
			regex: /'(?:[^\\']|\\.)*'?/,
			token: "string"
		},
		{
			regex: /`(?:[^\\`]|\\.)*`?/,
			token: "string"
		},
		{
			regex: /^\s*(?:\!(addincludedir|addplugindir|appendfile|assert|cd|define|delfile|echo|error|execute|finalize|getdllversion|gettlbversion|include|insertmacro|macro|macroend|makensis|packhdr|pragma|searchparse|searchreplace|system|tempfile|undef|uninstfinalize|verbose|warning))\b/i,
			token: "keyword"
		},
		{
			regex: /^\s*(?:\!(if(?:n?def)?|ifmacron?def|macro))\b/i,
			token: "keyword",
			indent: true
		},
		{
			regex: /^\s*(?:\!(else|endif|macroend))\b/i,
			token: "keyword",
			dedent: true
		},
		{
			regex: /^\s*(?:Abort|AddBrandingImage|AddSize|AllowRootDirInstall|AllowSkipFiles|AutoCloseWindow|BGFont|BGGradient|BrandingText|BringToFront|Call|CallInstDLL|Caption|ChangeUI|CheckBitmap|ClearErrors|CompletedText|ComponentText|CopyFiles|CRCCheck|CreateDirectory|CreateFont|CreateShortCut|Delete|DeleteINISec|DeleteINIStr|DeleteRegKey|DeleteRegValue|DetailPrint|DetailsButtonText|DirText|DirVar|DirVerify|EnableWindow|EnumRegKey|EnumRegValue|Exch|Exec|ExecShell|ExecShellWait|ExecWait|ExpandEnvStrings|File|FileBufSize|FileClose|FileErrorText|FileOpen|FileRead|FileReadByte|FileReadUTF16LE|FileReadWord|FileWriteUTF16LE|FileSeek|FileWrite|FileWriteByte|FileWriteWord|FindClose|FindFirst|FindNext|FindWindow|FlushINI|GetCurInstType|GetCurrentAddress|GetDlgItem|GetDLLVersion|GetDLLVersionLocal|GetErrorLevel|GetFileTime|GetFileTimeLocal|GetFullPathName|GetFunctionAddress|GetInstDirError|GetKnownFolderPath|GetLabelAddress|GetTempFileName|GetWinVer|Goto|HideWindow|Icon|IfAbort|IfErrors|IfFileExists|IfRebootFlag|IfRtlLanguage|IfShellVarContextAll|IfSilent|InitPluginsDir|InstallButtonText|InstallColors|InstallDir|InstallDirRegKey|InstProgressFlags|InstType|InstTypeGetText|InstTypeSetText|Int64Cmp|Int64CmpU|Int64Fmt|IntCmp|IntCmpU|IntFmt|IntOp|IntPtrCmp|IntPtrCmpU|IntPtrOp|IsWindow|LangString|LicenseBkColor|LicenseData|LicenseForceSelection|LicenseLangString|LicenseText|LoadAndSetImage|LoadLanguageFile|LockWindow|LogSet|LogText|ManifestDPIAware|ManifestLongPathAware|ManifestMaxVersionTested|ManifestSupportedOS|MessageBox|MiscButtonText|Name|Nop|OutFile|Page|PageCallbacks|PEAddResource|PEDllCharacteristics|PERemoveResource|PESubsysVer|Pop|Push|Quit|ReadEnvStr|ReadINIStr|ReadRegDWORD|ReadRegStr|Reboot|RegDLL|Rename|RequestExecutionLevel|ReserveFile|Return|RMDir|SearchPath|SectionGetFlags|SectionGetInstTypes|SectionGetSize|SectionGetText|SectionIn|SectionSetFlags|SectionSetInstTypes|SectionSetSize|SectionSetText|SendMessage|SetAutoClose|SetBrandingImage|SetCompress|SetCompressor|SetCompressorDictSize|SetCtlColors|SetCurInstType|SetDatablockOptimize|SetDateSave|SetDetailsPrint|SetDetailsView|SetErrorLevel|SetErrors|SetFileAttributes|SetFont|SetOutPath|SetOverwrite|SetRebootFlag|SetRegView|SetShellVarContext|SetSilent|ShowInstDetails|ShowUninstDetails|ShowWindow|SilentInstall|SilentUnInstall|Sleep|SpaceTexts|StrCmp|StrCmpS|StrCpy|StrLen|SubCaption|Target|Unicode|UninstallButtonText|UninstallCaption|UninstallIcon|UninstallSubCaption|UninstallText|UninstPage|UnRegDLL|Var|VIAddVersionKey|VIFileVersion|VIProductVersion|WindowIcon|WriteINIStr|WriteRegBin|WriteRegDWORD|WriteRegExpandStr|WriteRegMultiStr|WriteRegNone|WriteRegStr|WriteUninstaller|XPStyle)\b/i,
			token: "keyword"
		},
		{
			regex: /^\s*(?:Function|PageEx|Section(?:Group)?)\b/i,
			token: "keyword",
			indent: true
		},
		{
			regex: /^\s*(?:(Function|PageEx|Section(?:Group)?)End)\b/i,
			token: "keyword",
			dedent: true
		},
		{
			regex: /\b(?:ARCHIVE|FILE_ATTRIBUTE_ARCHIVE|FILE_ATTRIBUTE_HIDDEN|FILE_ATTRIBUTE_NORMAL|FILE_ATTRIBUTE_OFFLINE|FILE_ATTRIBUTE_READONLY|FILE_ATTRIBUTE_SYSTEM|FILE_ATTRIBUTE_TEMPORARY|HIDDEN|HKCC|HKCR(32|64)?|HKCU(32|64)?|HKDD|HKEY_CLASSES_ROOT|HKEY_CURRENT_CONFIG|HKEY_CURRENT_USER|HKEY_DYN_DATA|HKEY_LOCAL_MACHINE|HKEY_PERFORMANCE_DATA|HKEY_USERS|HKLM(32|64)?|HKPD|HKU|IDABORT|IDCANCEL|IDD_DIR|IDD_INST|IDD_INSTFILES|IDD_LICENSE|IDD_SELCOM|IDD_UNINST|IDD_VERIFY|IDIGNORE|IDNO|IDOK|IDRETRY|IDYES|MB_ABORTRETRYIGNORE|MB_DEFBUTTON1|MB_DEFBUTTON2|MB_DEFBUTTON3|MB_DEFBUTTON4|MB_ICONEXCLAMATION|MB_ICONINFORMATION|MB_ICONQUESTION|MB_ICONSTOP|MB_OK|MB_OKCANCEL|MB_RETRYCANCEL|MB_RIGHT|MB_RTLREADING|MB_SETFOREGROUND|MB_TOPMOST|MB_USERICON|MB_YESNO|MB_YESNOCANCEL|NORMAL|OFFLINE|READONLY|SHCTX|SHELL_CONTEXT|SW_HIDE|SW_SHOWDEFAULT|SW_SHOWMAXIMIZED|SW_SHOWMINIMIZED|SW_SHOWNORMAL|SYSTEM|TEMPORARY)\b/i,
			token: "atom"
		},
		{
			regex: /\b(?:admin|all|amd64-unicode|auto|both|bottom|bzip2|components|current|custom|directory|false|force|hide|highest|ifdiff|ifnewer|instfiles|lastused|leave|left|license|listonly|lzma|nevershow|none|normal|notset|off|on|right|show|silent|silentlog|textonly|top|true|try|un\.components|un\.custom|un\.directory|un\.instfiles|un\.license|uninstConfirm|user|Win10|Win7|Win8|WinVista|x-86-(ansi|unicode)|zlib)\b/i,
			token: "builtin"
		},
		{
			regex: /\$\{(?:And(?:If(?:Not)?|Unless)|Break|Case(?:2|3|4|5|Else)?|Continue|Default|Do(?:Until|While)?|Else(?:If(?:Not)?|Unless)?|End(?:If|Select|Switch)|Exit(?:Do|For|While)|For(?:Each)?|If(?:Cmd|Not(?:Then)?|Then)?|Loop(?:Until|While)?|Or(?:If(?:Not)?|Unless)|Select|Switch|Unless|While)\}/i,
			token: "variable-2",
			indent: true
		},
		{
			regex: /\$\{(?:BannerTrimPath|DirState|DriveSpace|Get(BaseName|Drives|ExeName|ExePath|FileAttributes|FileExt|FileName|FileVersion|Options|OptionsS|Parameters|Parent|Root|Size|Time)|Locate|RefreshShellIcons)\}/i,
			token: "variable-2",
			dedent: true
		},
		{
			regex: /\$\{(?:Memento(?:Section(?:Done|End|Restore|Save)?|UnselectedSection))\}/i,
			token: "variable-2",
			dedent: true
		},
		{
			regex: /\$\{(?:Config(?:Read|ReadS|Write|WriteS)|File(?:Join|ReadFromEnd|Recode)|Line(?:Find|Read|Sum)|Text(?:Compare|CompareS)|TrimNewLines)\}/i,
			token: "variable-2",
			dedent: true
		},
		{
			regex: /\$\{(?:(?:At(?:Least|Most)|Is)(?:ServicePack|Win(?:7|8|10|95|98|200(?:0|3|8(?:R2)?)|ME|NT4|Vista|XP))|Is(?:NT|Server))\}/i,
			token: "variable",
			dedent: true
		},
		{
			regex: /\$\{(?:StrFilterS?|Version(?:Compare|Convert)|Word(?:AddS?|Find(?:(?:2|3)X)?S?|InsertS?|ReplaceS?))\}/i,
			token: "keyword",
			dedent: true
		},
		{
			regex: /\$\{(?:RunningX64)\}/i,
			token: "variable",
			dedent: true
		},
		{
			regex: /\$\{(?:Disable|Enable)X64FSRedirection\}/i,
			token: "keyword",
			dedent: true
		},
		{
			regex: /(#|;).*/,
			token: "comment"
		},
		{
			regex: /\/\*/,
			token: "comment",
			next: "comment"
		},
		{
			regex: /[-+\/*=<>!]+/,
			token: "operator"
		},
		{
			regex: /\$\w[\w\.]*/,
			token: "variable"
		},
		{
			regex: /\${[\!\w\.:-]+}/,
			token: "variableName.constant"
		},
		{
			regex: /\$\([\!\w\.:-]+\)/,
			token: "atom"
		}
	],
	comment: [{
		regex: /.*?\*\//,
		token: "comment",
		next: "start"
	}, {
		regex: /.*/,
		token: "comment"
	}],
	languageData: {
		name: "nsis",
		indentOnInput: /^\s*((Function|PageEx|Section|Section(Group)?)End|(\!(endif|macroend))|\$\{(End(If|Unless|While)|Loop(Until)|Next)\})$/i,
		commentTokens: {
			line: "#",
			block: {
				open: "/*",
				close: "*/"
			}
		}
	}
});
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/ntriples.js
var Location = {
	PRE_SUBJECT: 0,
	WRITING_SUB_URI: 1,
	WRITING_BNODE_URI: 2,
	PRE_PRED: 3,
	WRITING_PRED_URI: 4,
	PRE_OBJ: 5,
	WRITING_OBJ_URI: 6,
	WRITING_OBJ_BNODE: 7,
	WRITING_OBJ_LITERAL: 8,
	WRITING_LIT_LANG: 9,
	WRITING_LIT_TYPE: 10,
	POST_OBJ: 11,
	ERROR: 12
};
function transitState(currState, c) {
	var currLocation = currState.location;
	var ret;
	if (currLocation == Location.PRE_SUBJECT && c == "<") ret = Location.WRITING_SUB_URI;
	else if (currLocation == Location.PRE_SUBJECT && c == "_") ret = Location.WRITING_BNODE_URI;
	else if (currLocation == Location.PRE_PRED && c == "<") ret = Location.WRITING_PRED_URI;
	else if (currLocation == Location.PRE_OBJ && c == "<") ret = Location.WRITING_OBJ_URI;
	else if (currLocation == Location.PRE_OBJ && c == "_") ret = Location.WRITING_OBJ_BNODE;
	else if (currLocation == Location.PRE_OBJ && c == "\"") ret = Location.WRITING_OBJ_LITERAL;
	else if (currLocation == Location.WRITING_SUB_URI && c == ">") ret = Location.PRE_PRED;
	else if (currLocation == Location.WRITING_BNODE_URI && c == " ") ret = Location.PRE_PRED;
	else if (currLocation == Location.WRITING_PRED_URI && c == ">") ret = Location.PRE_OBJ;
	else if (currLocation == Location.WRITING_OBJ_URI && c == ">") ret = Location.POST_OBJ;
	else if (currLocation == Location.WRITING_OBJ_BNODE && c == " ") ret = Location.POST_OBJ;
	else if (currLocation == Location.WRITING_OBJ_LITERAL && c == "\"") ret = Location.POST_OBJ;
	else if (currLocation == Location.WRITING_LIT_LANG && c == " ") ret = Location.POST_OBJ;
	else if (currLocation == Location.WRITING_LIT_TYPE && c == ">") ret = Location.POST_OBJ;
	else if (currLocation == Location.WRITING_OBJ_LITERAL && c == "@") ret = Location.WRITING_LIT_LANG;
	else if (currLocation == Location.WRITING_OBJ_LITERAL && c == "^") ret = Location.WRITING_LIT_TYPE;
	else if (c == " " && (currLocation == Location.PRE_SUBJECT || currLocation == Location.PRE_PRED || currLocation == Location.PRE_OBJ || currLocation == Location.POST_OBJ)) ret = currLocation;
	else if (currLocation == Location.POST_OBJ && c == ".") ret = Location.PRE_SUBJECT;
	else ret = Location.ERROR;
	currState.location = ret;
}
var ntriples = {
	name: "ntriples",
	startState: function() {
		return {
			location: Location.PRE_SUBJECT,
			uris: [],
			anchors: [],
			bnodes: [],
			langs: [],
			types: []
		};
	},
	token: function(stream, state) {
		var ch = stream.next();
		if (ch == "<") {
			transitState(state, ch);
			var parsedURI = "";
			stream.eatWhile(function(c) {
				if (c != "#" && c != ">") {
					parsedURI += c;
					return true;
				}
				return false;
			});
			state.uris.push(parsedURI);
			if (stream.match("#", false)) return "variable";
			stream.next();
			transitState(state, ">");
			return "variable";
		}
		if (ch == "#") {
			var parsedAnchor = "";
			stream.eatWhile(function(c) {
				if (c != ">" && c != " ") {
					parsedAnchor += c;
					return true;
				}
				return false;
			});
			state.anchors.push(parsedAnchor);
			return "url";
		}
		if (ch == ">") {
			transitState(state, ">");
			return "variable";
		}
		if (ch == "_") {
			transitState(state, ch);
			var parsedBNode = "";
			stream.eatWhile(function(c) {
				if (c != " ") {
					parsedBNode += c;
					return true;
				}
				return false;
			});
			state.bnodes.push(parsedBNode);
			stream.next();
			transitState(state, " ");
			return "builtin";
		}
		if (ch == "\"") {
			transitState(state, ch);
			stream.eatWhile(function(c) {
				return c != "\"";
			});
			stream.next();
			if (stream.peek() != "@" && stream.peek() != "^") transitState(state, "\"");
			return "string";
		}
		if (ch == "@") {
			transitState(state, "@");
			var parsedLang = "";
			stream.eatWhile(function(c) {
				if (c != " ") {
					parsedLang += c;
					return true;
				}
				return false;
			});
			state.langs.push(parsedLang);
			stream.next();
			transitState(state, " ");
			return "string.special";
		}
		if (ch == "^") {
			stream.next();
			transitState(state, "^");
			var parsedType = "";
			stream.eatWhile(function(c) {
				if (c != ">") {
					parsedType += c;
					return true;
				}
				return false;
			});
			state.types.push(parsedType);
			stream.next();
			transitState(state, ">");
			return "variable";
		}
		if (ch == " ") transitState(state, ch);
		if (ch == ".") transitState(state, ch);
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/octave.js
function wordRegexp$8(words) {
	return new RegExp("^((" + words.join(")|(") + "))\\b");
}
var singleOperators$3 = /* @__PURE__ */ new RegExp("^[\\+\\-\\*/&|\\^~<>!@'\\\\]");
var singleDelimiters$1 = /* @__PURE__ */ new RegExp("^[\\(\\[\\{\\},:=;\\.]");
var doubleOperators$2 = /* @__PURE__ */ new RegExp("^((==)|(~=)|(<=)|(>=)|(<<)|(>>)|(\\.[\\+\\-\\*/\\^\\\\]))");
var doubleDelimiters$1 = /* @__PURE__ */ new RegExp("^((!=)|(\\+=)|(\\-=)|(\\*=)|(/=)|(&=)|(\\|=)|(\\^=))");
var tripleDelimiters$1 = /* @__PURE__ */ new RegExp("^((>>=)|(<<=))");
var expressionEnd = /* @__PURE__ */ new RegExp("^[\\]\\)]");
var identifiers$3 = /* @__PURE__ */ new RegExp("^[_A-Za-z¡-￿][_A-Za-z0-9¡-￿]*");
var builtins$3 = wordRegexp$8([
	"error",
	"eval",
	"function",
	"abs",
	"acos",
	"atan",
	"asin",
	"cos",
	"cosh",
	"exp",
	"log",
	"prod",
	"sum",
	"log10",
	"max",
	"min",
	"sign",
	"sin",
	"sinh",
	"sqrt",
	"tan",
	"reshape",
	"break",
	"zeros",
	"default",
	"margin",
	"round",
	"ones",
	"rand",
	"syn",
	"ceil",
	"floor",
	"size",
	"clear",
	"zeros",
	"eye",
	"mean",
	"std",
	"cov",
	"det",
	"eig",
	"inv",
	"norm",
	"rank",
	"trace",
	"expm",
	"logm",
	"sqrtm",
	"linspace",
	"plot",
	"title",
	"xlabel",
	"ylabel",
	"legend",
	"text",
	"grid",
	"meshgrid",
	"mesh",
	"num2str",
	"fft",
	"ifft",
	"arrayfun",
	"cellfun",
	"input",
	"fliplr",
	"flipud",
	"ismember"
]);
var keywords$20 = wordRegexp$8([
	"return",
	"case",
	"switch",
	"else",
	"elseif",
	"end",
	"endif",
	"endfunction",
	"if",
	"otherwise",
	"do",
	"for",
	"while",
	"try",
	"catch",
	"classdef",
	"properties",
	"events",
	"methods",
	"global",
	"persistent",
	"endfor",
	"endwhile",
	"printf",
	"sprintf",
	"disp",
	"until",
	"continue",
	"pkg"
]);
function tokenTranspose(stream, state) {
	if (!stream.sol() && stream.peek() === "'") {
		stream.next();
		state.tokenize = tokenBase$23;
		return "operator";
	}
	state.tokenize = tokenBase$23;
	return tokenBase$23(stream, state);
}
function tokenComment$10(stream, state) {
	if (stream.match(/^.*%}/)) {
		state.tokenize = tokenBase$23;
		return "comment";
	}
	stream.skipToEnd();
	return "comment";
}
function tokenBase$23(stream, state) {
	if (stream.eatSpace()) return null;
	if (stream.match("%{")) {
		state.tokenize = tokenComment$10;
		stream.skipToEnd();
		return "comment";
	}
	if (stream.match(/^[%#]/)) {
		stream.skipToEnd();
		return "comment";
	}
	if (stream.match(/^[0-9\.+-]/, false)) {
		if (stream.match(/^[+-]?0x[0-9a-fA-F]+[ij]?/)) {
			stream.tokenize = tokenBase$23;
			return "number";
		}
		if (stream.match(/^[+-]?\d*\.\d+([EeDd][+-]?\d+)?[ij]?/)) return "number";
		if (stream.match(/^[+-]?\d+([EeDd][+-]?\d+)?[ij]?/)) return "number";
	}
	if (stream.match(wordRegexp$8([
		"nan",
		"NaN",
		"inf",
		"Inf"
	]))) return "number";
	var m = stream.match(/^"(?:[^"]|"")*("|$)/) || stream.match(/^'(?:[^']|'')*('|$)/);
	if (m) return m[1] ? "string" : "error";
	if (stream.match(keywords$20)) return "keyword";
	if (stream.match(builtins$3)) return "builtin";
	if (stream.match(identifiers$3)) return "variable";
	if (stream.match(singleOperators$3) || stream.match(doubleOperators$2)) return "operator";
	if (stream.match(singleDelimiters$1) || stream.match(doubleDelimiters$1) || stream.match(tripleDelimiters$1)) return null;
	if (stream.match(expressionEnd)) {
		state.tokenize = tokenTranspose;
		return null;
	}
	stream.next();
	return "error";
}
var octave = {
	name: "octave",
	startState: function() {
		return { tokenize: tokenBase$23 };
	},
	token: function(stream, state) {
		var style = state.tokenize(stream, state);
		if (style === "number" || style === "variable") state.tokenize = tokenTranspose;
		return style;
	},
	languageData: { commentTokens: { line: "%" } }
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/oz.js
function wordRegexp$7(words) {
	return new RegExp("^((" + words.join(")|(") + "))\\b");
}
var singleOperators$2 = /[\^@!\|<>#~\.\*\-\+\\/,=]/;
var doubleOperators$1 = /(<-)|(:=)|(=<)|(>=)|(<=)|(<:)|(>:)|(=:)|(\\=)|(\\=:)|(!!)|(==)|(::)/;
var tripleOperators = /(:::)|(\.\.\.)|(=<:)|(>=:)/;
var middle$1 = [
	"in",
	"then",
	"else",
	"of",
	"elseof",
	"elsecase",
	"elseif",
	"catch",
	"finally",
	"with",
	"require",
	"prepare",
	"import",
	"export",
	"define",
	"do"
];
var end = ["end"];
var atoms$6 = wordRegexp$7([
	"true",
	"false",
	"nil",
	"unit"
]);
var commonKeywords$3 = wordRegexp$7([
	"andthen",
	"at",
	"attr",
	"declare",
	"feat",
	"from",
	"lex",
	"mod",
	"div",
	"mode",
	"orelse",
	"parser",
	"prod",
	"prop",
	"scanner",
	"self",
	"syn",
	"token"
]);
var openingKeywords$1 = wordRegexp$7([
	"local",
	"proc",
	"fun",
	"case",
	"class",
	"if",
	"cond",
	"or",
	"dis",
	"choice",
	"not",
	"thread",
	"try",
	"raise",
	"lock",
	"for",
	"suchthat",
	"meth",
	"functor"
]);
var middleKeywords$1 = wordRegexp$7(middle$1);
var endKeywords$1 = wordRegexp$7(end);
function tokenBase$22(stream, state) {
	if (stream.eatSpace()) return null;
	if (stream.match(/[{}]/)) return "bracket";
	if (stream.match("[]")) return "keyword";
	if (stream.match(tripleOperators) || stream.match(doubleOperators$1)) return "operator";
	if (stream.match(atoms$6)) return "atom";
	var matched = stream.match(openingKeywords$1);
	if (matched) {
		if (!state.doInCurrentLine) state.currentIndent++;
		else state.doInCurrentLine = false;
		if (matched[0] == "proc" || matched[0] == "fun") state.tokenize = tokenFunProc;
		else if (matched[0] == "class") state.tokenize = tokenClass;
		else if (matched[0] == "meth") state.tokenize = tokenMeth;
		return "keyword";
	}
	if (stream.match(middleKeywords$1) || stream.match(commonKeywords$3)) return "keyword";
	if (stream.match(endKeywords$1)) {
		state.currentIndent--;
		return "keyword";
	}
	var ch = stream.next();
	if (ch == "\"" || ch == "'") {
		state.tokenize = tokenString$16(ch);
		return state.tokenize(stream, state);
	}
	if (/[~\d]/.test(ch)) {
		if (ch == "~") {
			if (!/^[0-9]/.test(stream.peek())) return null;
			else if (stream.next() == "0" && stream.match(/^[xX][0-9a-fA-F]+/) || stream.match(/^[0-9]*(\.[0-9]+)?([eE][~+]?[0-9]+)?/)) return "number";
		}
		if (ch == "0" && stream.match(/^[xX][0-9a-fA-F]+/) || stream.match(/^[0-9]*(\.[0-9]+)?([eE][~+]?[0-9]+)?/)) return "number";
		return null;
	}
	if (ch == "%") {
		stream.skipToEnd();
		return "comment";
	} else if (ch == "/") {
		if (stream.eat("*")) {
			state.tokenize = tokenComment$9;
			return tokenComment$9(stream, state);
		}
	}
	if (singleOperators$2.test(ch)) return "operator";
	stream.eatWhile(/\w/);
	return "variable";
}
function tokenClass(stream, state) {
	if (stream.eatSpace()) return null;
	stream.match(/([A-Z][A-Za-z0-9_]*)|(`.+`)/);
	state.tokenize = tokenBase$22;
	return "type";
}
function tokenMeth(stream, state) {
	if (stream.eatSpace()) return null;
	stream.match(/([a-zA-Z][A-Za-z0-9_]*)|(`.+`)/);
	state.tokenize = tokenBase$22;
	return "def";
}
function tokenFunProc(stream, state) {
	if (stream.eatSpace()) return null;
	if (!state.hasPassedFirstStage && stream.eat("{")) {
		state.hasPassedFirstStage = true;
		return "bracket";
	} else if (state.hasPassedFirstStage) {
		stream.match(/([A-Z][A-Za-z0-9_]*)|(`.+`)|\$/);
		state.hasPassedFirstStage = false;
		state.tokenize = tokenBase$22;
		return "def";
	} else {
		state.tokenize = tokenBase$22;
		return null;
	}
}
function tokenComment$9(stream, state) {
	var maybeEnd = false, ch;
	while (ch = stream.next()) {
		if (ch == "/" && maybeEnd) {
			state.tokenize = tokenBase$22;
			break;
		}
		maybeEnd = ch == "*";
	}
	return "comment";
}
function tokenString$16(quote) {
	return function(stream, state) {
		var escaped = false, next, end = false;
		while ((next = stream.next()) != null) {
			if (next == quote && !escaped) {
				end = true;
				break;
			}
			escaped = !escaped && next == "\\";
		}
		if (end || !escaped) state.tokenize = tokenBase$22;
		return "string";
	};
}
function buildElectricInputRegEx() {
	var allClosings = middle$1.concat(end);
	return new RegExp("[\\[\\]]|(" + allClosings.join("|") + ")$");
}
var oz = {
	name: "oz",
	startState: function() {
		return {
			tokenize: tokenBase$22,
			currentIndent: 0,
			doInCurrentLine: false,
			hasPassedFirstStage: false
		};
	},
	token: function(stream, state) {
		if (stream.sol()) state.doInCurrentLine = 0;
		return state.tokenize(stream, state);
	},
	indent: function(state, textAfter, cx) {
		var trueText = textAfter.replace(/^\s+|\s+$/g, "");
		if (trueText.match(endKeywords$1) || trueText.match(middleKeywords$1) || trueText.match(/(\[])/)) return cx.unit * (state.currentIndent - 1);
		if (state.currentIndent < 0) return 0;
		return state.currentIndent * cx.unit;
	},
	languageData: {
		indentOnInut: buildElectricInputRegEx(),
		commentTokens: {
			line: "%",
			block: {
				open: "/*",
				close: "*/"
			}
		}
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/pascal.js
function words$10(str) {
	var obj = {}, words = str.split(" ");
	for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
	return obj;
}
var keywords$19 = words$10("absolute and array asm begin case const constructor destructor div do downto else end file for function goto if implementation in inherited inline interface label mod nil not object of operator or packed procedure program record reintroduce repeat self set shl shr string then to type unit until uses var while with xor as class dispinterface except exports finalization finally initialization inline is library on out packed property raise resourcestring threadvar try absolute abstract alias assembler bitpacked break cdecl continue cppdecl cvar default deprecated dynamic enumerator experimental export external far far16 forward generic helper implements index interrupt iocheck local message name near nodefault noreturn nostackframe oldfpccall otherwise overload override pascal platform private protected public published read register reintroduce result safecall saveregisters softfloat specialize static stdcall stored strict unaligned unimplemented varargs virtual write");
var atoms$5 = { "null": true };
var isOperatorChar$6 = /[+\-*&%=<>!?|\/]/;
function tokenBase$21(stream, state) {
	var ch = stream.next();
	if (ch == "#" && state.startOfLine) {
		stream.skipToEnd();
		return "meta";
	}
	if (ch == "\"" || ch == "'") {
		state.tokenize = tokenString$15(ch);
		return state.tokenize(stream, state);
	}
	if (ch == "(" && stream.eat("*")) {
		state.tokenize = tokenComment$8;
		return tokenComment$8(stream, state);
	}
	if (ch == "{") {
		state.tokenize = tokenCommentBraces;
		return tokenCommentBraces(stream, state);
	}
	if (/[\[\]\(\),;\:\.]/.test(ch)) return null;
	if (/\d/.test(ch)) {
		stream.eatWhile(/[\w\.]/);
		return "number";
	}
	if (ch == "/") {
		if (stream.eat("/")) {
			stream.skipToEnd();
			return "comment";
		}
	}
	if (isOperatorChar$6.test(ch)) {
		stream.eatWhile(isOperatorChar$6);
		return "operator";
	}
	stream.eatWhile(/[\w\$_]/);
	var cur = stream.current().toLowerCase();
	if (keywords$19.propertyIsEnumerable(cur)) return "keyword";
	if (atoms$5.propertyIsEnumerable(cur)) return "atom";
	return "variable";
}
function tokenString$15(quote) {
	return function(stream, state) {
		var escaped = false, next, end = false;
		while ((next = stream.next()) != null) {
			if (next == quote && !escaped) {
				end = true;
				break;
			}
			escaped = !escaped && next == "\\";
		}
		if (end || !escaped) state.tokenize = null;
		return "string";
	};
}
function tokenComment$8(stream, state) {
	var maybeEnd = false, ch;
	while (ch = stream.next()) {
		if (ch == ")" && maybeEnd) {
			state.tokenize = null;
			break;
		}
		maybeEnd = ch == "*";
	}
	return "comment";
}
function tokenCommentBraces(stream, state) {
	var ch;
	while (ch = stream.next()) if (ch == "}") {
		state.tokenize = null;
		break;
	}
	return "comment";
}
var pascal = {
	name: "pascal",
	startState: function() {
		return { tokenize: null };
	},
	token: function(stream, state) {
		if (stream.eatSpace()) return null;
		var style = (state.tokenize || tokenBase$21)(stream, state);
		if (style == "comment" || style == "meta") return style;
		return style;
	},
	languageData: {
		indentOnInput: /^\s*[{}]$/,
		commentTokens: { block: {
			open: "(*",
			close: "*)"
		} }
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/perl.js
function look(stream, c) {
	return stream.string.charAt(stream.pos + (c || 0));
}
function prefix(stream, c) {
	if (c) {
		var x = stream.pos - c;
		return stream.string.substr(x >= 0 ? x : 0, c);
	} else return stream.string.substr(0, stream.pos - 1);
}
function suffix(stream, c) {
	var y = stream.string.length;
	var x = y - stream.pos + 1;
	return stream.string.substr(stream.pos, c && c < y ? c : x);
}
function eatSuffix(stream, c) {
	var x = stream.pos + c;
	var y;
	if (x <= 0) stream.pos = 0;
	else if (x >= (y = stream.string.length - 1)) stream.pos = y;
	else stream.pos = x;
}
var PERL = {
	"->": 4,
	"++": 4,
	"--": 4,
	"**": 4,
	"=~": 4,
	"!~": 4,
	"*": 4,
	"/": 4,
	"%": 4,
	"x": 4,
	"+": 4,
	"-": 4,
	".": 4,
	"<<": 4,
	">>": 4,
	"<": 4,
	">": 4,
	"<=": 4,
	">=": 4,
	"lt": 4,
	"gt": 4,
	"le": 4,
	"ge": 4,
	"==": 4,
	"!=": 4,
	"<=>": 4,
	"eq": 4,
	"ne": 4,
	"cmp": 4,
	"~~": 4,
	"&": 4,
	"|": 4,
	"^": 4,
	"&&": 4,
	"||": 4,
	"//": 4,
	"..": 4,
	"...": 4,
	"?": 4,
	":": 4,
	"=": 4,
	"+=": 4,
	"-=": 4,
	"*=": 4,
	",": 4,
	"=>": 4,
	"::": 4,
	"not": 4,
	"and": 4,
	"or": 4,
	"xor": 4,
	"BEGIN": [5, 1],
	"END": [5, 1],
	"PRINT": [5, 1],
	"PRINTF": [5, 1],
	"GETC": [5, 1],
	"READ": [5, 1],
	"READLINE": [5, 1],
	"DESTROY": [5, 1],
	"TIE": [5, 1],
	"TIEHANDLE": [5, 1],
	"UNTIE": [5, 1],
	"STDIN": 5,
	"STDIN_TOP": 5,
	"STDOUT": 5,
	"STDOUT_TOP": 5,
	"STDERR": 5,
	"STDERR_TOP": 5,
	"$ARG": 5,
	"$_": 5,
	"@ARG": 5,
	"@_": 5,
	"$LIST_SEPARATOR": 5,
	"$\"": 5,
	"$PROCESS_ID": 5,
	"$PID": 5,
	"$$": 5,
	"$REAL_GROUP_ID": 5,
	"$GID": 5,
	"$(": 5,
	"$EFFECTIVE_GROUP_ID": 5,
	"$EGID": 5,
	"$)": 5,
	"$PROGRAM_NAME": 5,
	"$0": 5,
	"$SUBSCRIPT_SEPARATOR": 5,
	"$SUBSEP": 5,
	"$;": 5,
	"$REAL_USER_ID": 5,
	"$UID": 5,
	"$<": 5,
	"$EFFECTIVE_USER_ID": 5,
	"$EUID": 5,
	"$>": 5,
	"$a": 5,
	"$b": 5,
	"$COMPILING": 5,
	"$^C": 5,
	"$DEBUGGING": 5,
	"$^D": 5,
	"${^ENCODING}": 5,
	"$ENV": 5,
	"%ENV": 5,
	"$SYSTEM_FD_MAX": 5,
	"$^F": 5,
	"@F": 5,
	"${^GLOBAL_PHASE}": 5,
	"$^H": 5,
	"%^H": 5,
	"@INC": 5,
	"%INC": 5,
	"$INPLACE_EDIT": 5,
	"$^I": 5,
	"$^M": 5,
	"$OSNAME": 5,
	"$^O": 5,
	"${^OPEN}": 5,
	"$PERLDB": 5,
	"$^P": 5,
	"$SIG": 5,
	"%SIG": 5,
	"$BASETIME": 5,
	"$^T": 5,
	"${^TAINT}": 5,
	"${^UNICODE}": 5,
	"${^UTF8CACHE}": 5,
	"${^UTF8LOCALE}": 5,
	"$PERL_VERSION": 5,
	"$^V": 5,
	"${^WIN32_SLOPPY_STAT}": 5,
	"$EXECUTABLE_NAME": 5,
	"$^X": 5,
	"$1": 5,
	"$MATCH": 5,
	"$&": 5,
	"${^MATCH}": 5,
	"$PREMATCH": 5,
	"$`": 5,
	"${^PREMATCH}": 5,
	"$POSTMATCH": 5,
	"$'": 5,
	"${^POSTMATCH}": 5,
	"$LAST_PAREN_MATCH": 5,
	"$+": 5,
	"$LAST_SUBMATCH_RESULT": 5,
	"$^N": 5,
	"@LAST_MATCH_END": 5,
	"@+": 5,
	"%LAST_PAREN_MATCH": 5,
	"%+": 5,
	"@LAST_MATCH_START": 5,
	"@-": 5,
	"%LAST_MATCH_START": 5,
	"%-": 5,
	"$LAST_REGEXP_CODE_RESULT": 5,
	"$^R": 5,
	"${^RE_DEBUG_FLAGS}": 5,
	"${^RE_TRIE_MAXBUF}": 5,
	"$ARGV": 5,
	"@ARGV": 5,
	"ARGV": 5,
	"ARGVOUT": 5,
	"$OUTPUT_FIELD_SEPARATOR": 5,
	"$OFS": 5,
	"$,": 5,
	"$INPUT_LINE_NUMBER": 5,
	"$NR": 5,
	"$.": 5,
	"$INPUT_RECORD_SEPARATOR": 5,
	"$RS": 5,
	"$/": 5,
	"$OUTPUT_RECORD_SEPARATOR": 5,
	"$ORS": 5,
	"$\\": 5,
	"$OUTPUT_AUTOFLUSH": 5,
	"$|": 5,
	"$ACCUMULATOR": 5,
	"$^A": 5,
	"$FORMAT_FORMFEED": 5,
	"$^L": 5,
	"$FORMAT_PAGE_NUMBER": 5,
	"$%": 5,
	"$FORMAT_LINES_LEFT": 5,
	"$-": 5,
	"$FORMAT_LINE_BREAK_CHARACTERS": 5,
	"$:": 5,
	"$FORMAT_LINES_PER_PAGE": 5,
	"$=": 5,
	"$FORMAT_TOP_NAME": 5,
	"$^": 5,
	"$FORMAT_NAME": 5,
	"$~": 5,
	"${^CHILD_ERROR_NATIVE}": 5,
	"$EXTENDED_OS_ERROR": 5,
	"$^E": 5,
	"$EXCEPTIONS_BEING_CAUGHT": 5,
	"$^S": 5,
	"$WARNING": 5,
	"$^W": 5,
	"${^WARNING_BITS}": 5,
	"$OS_ERROR": 5,
	"$ERRNO": 5,
	"$!": 5,
	"%OS_ERROR": 5,
	"%ERRNO": 5,
	"%!": 5,
	"$CHILD_ERROR": 5,
	"$?": 5,
	"$EVAL_ERROR": 5,
	"$@": 5,
	"$OFMT": 5,
	"$#": 5,
	"$*": 5,
	"$ARRAY_BASE": 5,
	"$[": 5,
	"$OLD_PERL_VERSION": 5,
	"$]": 5,
	"if": [1, 1],
	elsif: [1, 1],
	"else": [1, 1],
	"while": [1, 1],
	unless: [1, 1],
	"for": [1, 1],
	foreach: [1, 1],
	"abs": 1,
	accept: 1,
	alarm: 1,
	"atan2": 1,
	bind: 1,
	binmode: 1,
	bless: 1,
	bootstrap: 1,
	"break": 1,
	caller: 1,
	chdir: 1,
	chmod: 1,
	chomp: 1,
	chop: 1,
	chown: 1,
	chr: 1,
	chroot: 1,
	close: 1,
	closedir: 1,
	connect: 1,
	"continue": [1, 1],
	"cos": 1,
	crypt: 1,
	dbmclose: 1,
	dbmopen: 1,
	"default": 1,
	defined: 1,
	"delete": 1,
	die: 1,
	"do": 1,
	dump: 1,
	each: 1,
	endgrent: 1,
	endhostent: 1,
	endnetent: 1,
	endprotoent: 1,
	endpwent: 1,
	endservent: 1,
	eof: 1,
	"eval": 1,
	"exec": 1,
	exists: 1,
	exit: 1,
	"exp": 1,
	fcntl: 1,
	fileno: 1,
	flock: 1,
	fork: 1,
	format: 1,
	formline: 1,
	getc: 1,
	getgrent: 1,
	getgrgid: 1,
	getgrnam: 1,
	gethostbyaddr: 1,
	gethostbyname: 1,
	gethostent: 1,
	getlogin: 1,
	getnetbyaddr: 1,
	getnetbyname: 1,
	getnetent: 1,
	getpeername: 1,
	getpgrp: 1,
	getppid: 1,
	getpriority: 1,
	getprotobyname: 1,
	getprotobynumber: 1,
	getprotoent: 1,
	getpwent: 1,
	getpwnam: 1,
	getpwuid: 1,
	getservbyname: 1,
	getservbyport: 1,
	getservent: 1,
	getsockname: 1,
	getsockopt: 1,
	given: 1,
	glob: 1,
	gmtime: 1,
	"goto": 1,
	grep: 1,
	hex: 1,
	"import": 1,
	index: 1,
	"int": 1,
	ioctl: 1,
	"join": 1,
	keys: 1,
	kill: 1,
	last: 1,
	lc: 1,
	lcfirst: 1,
	length: 1,
	"link": 1,
	listen: 1,
	local: 2,
	localtime: 1,
	lock: 1,
	"log": 1,
	lstat: 1,
	m: null,
	map: 1,
	mkdir: 1,
	msgctl: 1,
	msgget: 1,
	msgrcv: 1,
	msgsnd: 1,
	my: 2,
	"new": 1,
	next: 1,
	no: 1,
	oct: 1,
	open: 1,
	opendir: 1,
	ord: 1,
	our: 2,
	pack: 1,
	"package": 1,
	pipe: 1,
	pop: 1,
	pos: 1,
	print: 1,
	printf: 1,
	prototype: 1,
	push: 1,
	q: null,
	qq: null,
	qr: null,
	quotemeta: null,
	qw: null,
	qx: null,
	rand: 1,
	read: 1,
	readdir: 1,
	readline: 1,
	readlink: 1,
	readpipe: 1,
	recv: 1,
	redo: 1,
	ref: 1,
	rename: 1,
	require: 1,
	reset: 1,
	"return": 1,
	reverse: 1,
	rewinddir: 1,
	rindex: 1,
	rmdir: 1,
	s: null,
	say: 1,
	scalar: 1,
	seek: 1,
	seekdir: 1,
	select: 1,
	semctl: 1,
	semget: 1,
	semop: 1,
	send: 1,
	setgrent: 1,
	sethostent: 1,
	setnetent: 1,
	setpgrp: 1,
	setpriority: 1,
	setprotoent: 1,
	setpwent: 1,
	setservent: 1,
	setsockopt: 1,
	shift: 1,
	shmctl: 1,
	shmget: 1,
	shmread: 1,
	shmwrite: 1,
	shutdown: 1,
	"sin": 1,
	sleep: 1,
	socket: 1,
	socketpair: 1,
	"sort": 1,
	splice: 1,
	"split": 1,
	sprintf: 1,
	"sqrt": 1,
	srand: 1,
	stat: 1,
	state: 1,
	study: 1,
	"sub": 1,
	"substr": 1,
	symlink: 1,
	syscall: 1,
	sysopen: 1,
	sysread: 1,
	sysseek: 1,
	system: 1,
	syswrite: 1,
	tell: 1,
	telldir: 1,
	tie: 1,
	tied: 1,
	time: 1,
	times: 1,
	tr: null,
	truncate: 1,
	uc: 1,
	ucfirst: 1,
	umask: 1,
	undef: 1,
	unlink: 1,
	unpack: 1,
	unshift: 1,
	untie: 1,
	use: 1,
	utime: 1,
	values: 1,
	vec: 1,
	wait: 1,
	waitpid: 1,
	wantarray: 1,
	warn: 1,
	when: 1,
	write: 1,
	y: null
};
var RXstyle = "string.special";
var RXmodifiers = /[goseximacplud]/;
function tokenChain(stream, state, chain, style, tail) {
	state.chain = null;
	state.style = null;
	state.tail = null;
	state.tokenize = function(stream, state) {
		var e = false, c, i = 0;
		while (c = stream.next()) {
			if (c === chain[i] && !e) {
				if (chain[++i] !== void 0) {
					state.chain = chain[i];
					state.style = style;
					state.tail = tail;
				} else if (tail) stream.eatWhile(tail);
				state.tokenize = tokenPerl;
				return style;
			}
			e = !e && c == "\\";
		}
		return style;
	};
	return state.tokenize(stream, state);
}
function tokenSOMETHING(stream, state, string) {
	state.tokenize = function(stream, state) {
		if (stream.string == string) state.tokenize = tokenPerl;
		stream.skipToEnd();
		return "string";
	};
	return state.tokenize(stream, state);
}
function tokenPerl(stream, state) {
	if (stream.eatSpace()) return null;
	if (state.chain) return tokenChain(stream, state, state.chain, state.style, state.tail);
	if (stream.match(/^(\-?((\d[\d_]*)?\.\d+(e[+-]?\d+)?|\d+\.\d*)|0x[\da-fA-F_]+|0b[01_]+|\d[\d_]*(e[+-]?\d+)?)/)) return "number";
	if (stream.match(/^<<(?=[_a-zA-Z])/)) {
		stream.eatWhile(/\w/);
		return tokenSOMETHING(stream, state, stream.current().substr(2));
	}
	if (stream.sol() && stream.match(/^\=item(?!\w)/)) return tokenSOMETHING(stream, state, "=cut");
	var ch = stream.next();
	if (ch == "\"" || ch == "'") {
		if (prefix(stream, 3) == "<<" + ch) {
			var p = stream.pos;
			stream.eatWhile(/\w/);
			var n = stream.current().substr(1);
			if (n && stream.eat(ch)) return tokenSOMETHING(stream, state, n);
			stream.pos = p;
		}
		return tokenChain(stream, state, [ch], "string");
	}
	if (ch == "q") {
		var c = look(stream, -2);
		if (!(c && /\w/.test(c))) {
			c = look(stream, 0);
			if (c == "x") {
				c = look(stream, 1);
				if (c == "(") {
					eatSuffix(stream, 2);
					return tokenChain(stream, state, [")"], RXstyle, RXmodifiers);
				}
				if (c == "[") {
					eatSuffix(stream, 2);
					return tokenChain(stream, state, ["]"], RXstyle, RXmodifiers);
				}
				if (c == "{") {
					eatSuffix(stream, 2);
					return tokenChain(stream, state, ["}"], RXstyle, RXmodifiers);
				}
				if (c == "<") {
					eatSuffix(stream, 2);
					return tokenChain(stream, state, [">"], RXstyle, RXmodifiers);
				}
				if (/[\^'"!~\/]/.test(c)) {
					eatSuffix(stream, 1);
					return tokenChain(stream, state, [stream.eat(c)], RXstyle, RXmodifiers);
				}
			} else if (c == "q") {
				c = look(stream, 1);
				if (c == "(") {
					eatSuffix(stream, 2);
					return tokenChain(stream, state, [")"], "string");
				}
				if (c == "[") {
					eatSuffix(stream, 2);
					return tokenChain(stream, state, ["]"], "string");
				}
				if (c == "{") {
					eatSuffix(stream, 2);
					return tokenChain(stream, state, ["}"], "string");
				}
				if (c == "<") {
					eatSuffix(stream, 2);
					return tokenChain(stream, state, [">"], "string");
				}
				if (/[\^'"!~\/]/.test(c)) {
					eatSuffix(stream, 1);
					return tokenChain(stream, state, [stream.eat(c)], "string");
				}
			} else if (c == "w") {
				c = look(stream, 1);
				if (c == "(") {
					eatSuffix(stream, 2);
					return tokenChain(stream, state, [")"], "bracket");
				}
				if (c == "[") {
					eatSuffix(stream, 2);
					return tokenChain(stream, state, ["]"], "bracket");
				}
				if (c == "{") {
					eatSuffix(stream, 2);
					return tokenChain(stream, state, ["}"], "bracket");
				}
				if (c == "<") {
					eatSuffix(stream, 2);
					return tokenChain(stream, state, [">"], "bracket");
				}
				if (/[\^'"!~\/]/.test(c)) {
					eatSuffix(stream, 1);
					return tokenChain(stream, state, [stream.eat(c)], "bracket");
				}
			} else if (c == "r") {
				c = look(stream, 1);
				if (c == "(") {
					eatSuffix(stream, 2);
					return tokenChain(stream, state, [")"], RXstyle, RXmodifiers);
				}
				if (c == "[") {
					eatSuffix(stream, 2);
					return tokenChain(stream, state, ["]"], RXstyle, RXmodifiers);
				}
				if (c == "{") {
					eatSuffix(stream, 2);
					return tokenChain(stream, state, ["}"], RXstyle, RXmodifiers);
				}
				if (c == "<") {
					eatSuffix(stream, 2);
					return tokenChain(stream, state, [">"], RXstyle, RXmodifiers);
				}
				if (/[\^'"!~\/]/.test(c)) {
					eatSuffix(stream, 1);
					return tokenChain(stream, state, [stream.eat(c)], RXstyle, RXmodifiers);
				}
			} else if (/[\^'"!~\/(\[{<]/.test(c)) {
				if (c == "(") {
					eatSuffix(stream, 1);
					return tokenChain(stream, state, [")"], "string");
				}
				if (c == "[") {
					eatSuffix(stream, 1);
					return tokenChain(stream, state, ["]"], "string");
				}
				if (c == "{") {
					eatSuffix(stream, 1);
					return tokenChain(stream, state, ["}"], "string");
				}
				if (c == "<") {
					eatSuffix(stream, 1);
					return tokenChain(stream, state, [">"], "string");
				}
				if (/[\^'"!~\/]/.test(c)) return tokenChain(stream, state, [stream.eat(c)], "string");
			}
		}
	}
	if (ch == "m") {
		var c = look(stream, -2);
		if (!(c && /\w/.test(c))) {
			c = stream.eat(/[(\[{<\^'"!~\/]/);
			if (c) {
				if (/[\^'"!~\/]/.test(c)) return tokenChain(stream, state, [c], RXstyle, RXmodifiers);
				if (c == "(") return tokenChain(stream, state, [")"], RXstyle, RXmodifiers);
				if (c == "[") return tokenChain(stream, state, ["]"], RXstyle, RXmodifiers);
				if (c == "{") return tokenChain(stream, state, ["}"], RXstyle, RXmodifiers);
				if (c == "<") return tokenChain(stream, state, [">"], RXstyle, RXmodifiers);
			}
		}
	}
	if (ch == "s") {
		var c = /[\/>\]})\w]/.test(look(stream, -2));
		if (!c) {
			c = stream.eat(/[(\[{<\^'"!~\/]/);
			if (c) {
				if (c == "[") return tokenChain(stream, state, ["]", "]"], RXstyle, RXmodifiers);
				if (c == "{") return tokenChain(stream, state, ["}", "}"], RXstyle, RXmodifiers);
				if (c == "<") return tokenChain(stream, state, [">", ">"], RXstyle, RXmodifiers);
				if (c == "(") return tokenChain(stream, state, [")", ")"], RXstyle, RXmodifiers);
				return tokenChain(stream, state, [c, c], RXstyle, RXmodifiers);
			}
		}
	}
	if (ch == "y") {
		var c = /[\/>\]})\w]/.test(look(stream, -2));
		if (!c) {
			c = stream.eat(/[(\[{<\^'"!~\/]/);
			if (c) {
				if (c == "[") return tokenChain(stream, state, ["]", "]"], RXstyle, RXmodifiers);
				if (c == "{") return tokenChain(stream, state, ["}", "}"], RXstyle, RXmodifiers);
				if (c == "<") return tokenChain(stream, state, [">", ">"], RXstyle, RXmodifiers);
				if (c == "(") return tokenChain(stream, state, [")", ")"], RXstyle, RXmodifiers);
				return tokenChain(stream, state, [c, c], RXstyle, RXmodifiers);
			}
		}
	}
	if (ch == "t") {
		var c = /[\/>\]})\w]/.test(look(stream, -2));
		if (!c) {
			c = stream.eat("r");
			if (c) {
				c = stream.eat(/[(\[{<\^'"!~\/]/);
				if (c) {
					if (c == "[") return tokenChain(stream, state, ["]", "]"], RXstyle, RXmodifiers);
					if (c == "{") return tokenChain(stream, state, ["}", "}"], RXstyle, RXmodifiers);
					if (c == "<") return tokenChain(stream, state, [">", ">"], RXstyle, RXmodifiers);
					if (c == "(") return tokenChain(stream, state, [")", ")"], RXstyle, RXmodifiers);
					return tokenChain(stream, state, [c, c], RXstyle, RXmodifiers);
				}
			}
		}
	}
	if (ch == "`") return tokenChain(stream, state, [ch], "builtin");
	if (ch == "/") {
		if (!/~\s*$/.test(prefix(stream))) return "operator";
		else return tokenChain(stream, state, [ch], RXstyle, RXmodifiers);
	}
	if (ch == "$") {
		var p = stream.pos;
		if (stream.eatWhile(/\d/) || stream.eat("{") && stream.eatWhile(/\d/) && stream.eat("}")) return "builtin";
		else stream.pos = p;
	}
	if (/[$@%]/.test(ch)) {
		var p = stream.pos;
		if (stream.eat("^") && stream.eat(/[A-Z]/) || !/[@$%&]/.test(look(stream, -2)) && stream.eat(/[=|\\\-#?@;:&`~\^!\[\]*'"$+.,\/<>()]/)) {
			var c = stream.current();
			if (PERL[c]) return "builtin";
		}
		stream.pos = p;
	}
	if (/[$@%&]/.test(ch)) {
		if (stream.eatWhile(/[\w$]/) || stream.eat("{") && stream.eatWhile(/[\w$]/) && stream.eat("}")) {
			var c = stream.current();
			if (PERL[c]) return "builtin";
			else return "variable";
		}
	}
	if (ch == "#") {
		if (look(stream, -2) != "$") {
			stream.skipToEnd();
			return "comment";
		}
	}
	if (/[:+\-\^*$&%@=<>!?|\/~\.]/.test(ch)) {
		var p = stream.pos;
		stream.eatWhile(/[:+\-\^*$&%@=<>!?|\/~\.]/);
		if (PERL[stream.current()]) return "operator";
		else stream.pos = p;
	}
	if (ch == "_") {
		if (stream.pos == 1) {
			if (suffix(stream, 6) == "_END__") return tokenChain(stream, state, ["\0"], "comment");
			else if (suffix(stream, 7) == "_DATA__") return tokenChain(stream, state, ["\0"], "builtin");
			else if (suffix(stream, 7) == "_C__") return tokenChain(stream, state, ["\0"], "string");
		}
	}
	if (/\w/.test(ch)) {
		var p = stream.pos;
		if (look(stream, -2) == "{" && (look(stream, 0) == "}" || stream.eatWhile(/\w/) && look(stream, 0) == "}")) return "string";
		else stream.pos = p;
	}
	if (/[A-Z]/.test(ch)) {
		var l = look(stream, -2);
		var p = stream.pos;
		stream.eatWhile(/[A-Z_]/);
		if (/[\da-z]/.test(look(stream, 0))) stream.pos = p;
		else {
			var c = PERL[stream.current()];
			if (!c) return "meta";
			if (c[1]) c = c[0];
			if (l != ":") {
				if (c == 1) return "keyword";
				else if (c == 2) return "def";
				else if (c == 3) return "atom";
				else if (c == 4) return "operator";
				else if (c == 5) return "builtin";
				else return "meta";
			} else return "meta";
		}
	}
	if (/[a-zA-Z_]/.test(ch)) {
		var l = look(stream, -2);
		stream.eatWhile(/\w/);
		var c = PERL[stream.current()];
		if (!c) return "meta";
		if (c[1]) c = c[0];
		if (l != ":") {
			if (c == 1) return "keyword";
			else if (c == 2) return "def";
			else if (c == 3) return "atom";
			else if (c == 4) return "operator";
			else if (c == 5) return "builtin";
			else return "meta";
		} else return "meta";
	}
	return null;
}
var perl = {
	name: "perl",
	startState: function() {
		return {
			tokenize: tokenPerl,
			chain: null,
			style: null,
			tail: null
		};
	},
	token: function(stream, state) {
		return (state.tokenize || tokenPerl)(stream, state);
	},
	languageData: {
		commentTokens: { line: "#" },
		wordChars: "$"
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/pig.js
function words$9(str) {
	var obj = {}, words = str.split(" ");
	for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
	return obj;
}
var pBuiltins = "ABS ACOS ARITY ASIN ATAN AVG BAGSIZE BINSTORAGE BLOOM BUILDBLOOM CBRT CEIL CONCAT COR COS COSH COUNT COUNT_STAR COV CONSTANTSIZE CUBEDIMENSIONS DIFF DISTINCT DOUBLEABS DOUBLEAVG DOUBLEBASE DOUBLEMAX DOUBLEMIN DOUBLEROUND DOUBLESUM EXP FLOOR FLOATABS FLOATAVG FLOATMAX FLOATMIN FLOATROUND FLOATSUM GENERICINVOKER INDEXOF INTABS INTAVG INTMAX INTMIN INTSUM INVOKEFORDOUBLE INVOKEFORFLOAT INVOKEFORINT INVOKEFORLONG INVOKEFORSTRING INVOKER ISEMPTY JSONLOADER JSONMETADATA JSONSTORAGE LAST_INDEX_OF LCFIRST LOG LOG10 LOWER LONGABS LONGAVG LONGMAX LONGMIN LONGSUM MAX MIN MAPSIZE MONITOREDUDF NONDETERMINISTIC OUTPUTSCHEMA  PIGSTORAGE PIGSTREAMING RANDOM REGEX_EXTRACT REGEX_EXTRACT_ALL REPLACE ROUND SIN SINH SIZE SQRT STRSPLIT SUBSTRING SUM STRINGCONCAT STRINGMAX STRINGMIN STRINGSIZE TAN TANH TOBAG TOKENIZE TOMAP TOP TOTUPLE TRIM TEXTLOADER TUPLESIZE UCFIRST UPPER UTF8STORAGECONVERTER ";
var pKeywords = "VOID IMPORT RETURNS DEFINE LOAD FILTER FOREACH ORDER CUBE DISTINCT COGROUP JOIN CROSS UNION SPLIT INTO IF OTHERWISE ALL AS BY USING INNER OUTER ONSCHEMA PARALLEL PARTITION GROUP AND OR NOT GENERATE FLATTEN ASC DESC IS STREAM THROUGH STORE MAPREDUCE SHIP CACHE INPUT OUTPUT STDERROR STDIN STDOUT LIMIT SAMPLE LEFT RIGHT FULL EQ GT LT GTE LTE NEQ MATCHES TRUE FALSE DUMP";
var pTypes = "BOOLEAN INT LONG FLOAT DOUBLE CHARARRAY BYTEARRAY BAG TUPLE MAP ";
var builtins$2 = words$9(pBuiltins);
var keywords$18 = words$9(pKeywords);
var types$4 = words$9(pTypes);
var isOperatorChar$5 = /[*+\-%<>=&?:\/!|]/;
function chain$4(stream, state, f) {
	state.tokenize = f;
	return f(stream, state);
}
function tokenComment$7(stream, state) {
	var isEnd = false;
	var ch;
	while (ch = stream.next()) {
		if (ch == "/" && isEnd) {
			state.tokenize = tokenBase$20;
			break;
		}
		isEnd = ch == "*";
	}
	return "comment";
}
function tokenString$14(quote) {
	return function(stream, state) {
		var escaped = false, next, end = false;
		while ((next = stream.next()) != null) {
			if (next == quote && !escaped) {
				end = true;
				break;
			}
			escaped = !escaped && next == "\\";
		}
		if (end || !escaped) state.tokenize = tokenBase$20;
		return "error";
	};
}
function tokenBase$20(stream, state) {
	var ch = stream.next();
	if (ch == "\"" || ch == "'") return chain$4(stream, state, tokenString$14(ch));
	else if (/[\[\]{}\(\),;\.]/.test(ch)) return null;
	else if (/\d/.test(ch)) {
		stream.eatWhile(/[\w\.]/);
		return "number";
	} else if (ch == "/") {
		if (stream.eat("*")) return chain$4(stream, state, tokenComment$7);
		else {
			stream.eatWhile(isOperatorChar$5);
			return "operator";
		}
	} else if (ch == "-") {
		if (stream.eat("-")) {
			stream.skipToEnd();
			return "comment";
		} else {
			stream.eatWhile(isOperatorChar$5);
			return "operator";
		}
	} else if (isOperatorChar$5.test(ch)) {
		stream.eatWhile(isOperatorChar$5);
		return "operator";
	} else {
		stream.eatWhile(/[\w\$_]/);
		if (keywords$18 && keywords$18.propertyIsEnumerable(stream.current().toUpperCase())) {
			if (!stream.eat(")") && !stream.eat(".")) return "keyword";
		}
		if (builtins$2 && builtins$2.propertyIsEnumerable(stream.current().toUpperCase())) return "builtin";
		if (types$4 && types$4.propertyIsEnumerable(stream.current().toUpperCase())) return "type";
		return "variable";
	}
}
var pig = {
	name: "pig",
	startState: function() {
		return {
			tokenize: tokenBase$20,
			startOfLine: true
		};
	},
	token: function(stream, state) {
		if (stream.eatSpace()) return null;
		return state.tokenize(stream, state);
	},
	languageData: { autocomplete: (pBuiltins + pTypes + pKeywords).split(" ") }
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/powershell.js
function buildRegexp(patterns, options) {
	options = options || {};
	var prefix = options.prefix !== void 0 ? options.prefix : "^";
	var suffix = options.suffix !== void 0 ? options.suffix : "\\b";
	for (var i = 0; i < patterns.length; i++) if (patterns[i] instanceof RegExp) patterns[i] = patterns[i].source;
	else patterns[i] = patterns[i].replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
	return new RegExp(prefix + "(" + patterns.join("|") + ")" + suffix, "i");
}
var notCharacterOrDash = "(?=[^A-Za-z\\d\\-_]|$)";
var varNames = /[\w\-:]/;
var grammar = {
	keyword: buildRegexp([
		/begin|break|catch|continue|data|default|do|dynamicparam/,
		/else|elseif|end|exit|filter|finally|for|foreach|from|function|if|in/,
		/param|process|return|switch|throw|trap|try|until|where|while/
	], { suffix: notCharacterOrDash }),
	number: /^((0x[\da-f]+)|((\d+\.\d+|\d\.|\.\d+|\d+)(e[\+\-]?\d+)?))[ld]?([kmgtp]b)?/i,
	operator: buildRegexp([buildRegexp([
		"f",
		/b?not/,
		/[ic]?split/,
		"join",
		/is(not)?/,
		"as",
		/[ic]?(eq|ne|[gl][te])/,
		/[ic]?(not)?(like|match|contains)/,
		/[ic]?replace/,
		/b?(and|or|xor)/
	], { prefix: "-" }), /[+\-*\/%]=|\+\+|--|\.\.|[+\-*&^%:=!|\/]|<(?!#)|(?!#)>/], { suffix: "" }),
	builtin: buildRegexp([
		/[A-Z]:|%|\?/i,
		buildRegexp([
			/Add-(Computer|Content|History|Member|PSSnapin|Type)/,
			/Checkpoint-Computer/,
			/Clear-(Content|EventLog|History|Host|Item(Property)?|Variable)/,
			/Compare-Object/,
			/Complete-Transaction/,
			/Connect-PSSession/,
			/ConvertFrom-(Csv|Json|SecureString|StringData)/,
			/Convert-Path/,
			/ConvertTo-(Csv|Html|Json|SecureString|Xml)/,
			/Copy-Item(Property)?/,
			/Debug-Process/,
			/Disable-(ComputerRestore|PSBreakpoint|PSRemoting|PSSessionConfiguration)/,
			/Disconnect-PSSession/,
			/Enable-(ComputerRestore|PSBreakpoint|PSRemoting|PSSessionConfiguration)/,
			/(Enter|Exit)-PSSession/,
			/Export-(Alias|Clixml|Console|Counter|Csv|FormatData|ModuleMember|PSSession)/,
			/ForEach-Object/,
			/Format-(Custom|List|Table|Wide)/,
			/* @__PURE__ */ new RegExp("Get-(Acl|Alias|AuthenticodeSignature|ChildItem|Command|ComputerRestorePoint|Content|ControlPanelItem|Counter|Credential|Culture|Date|Event|EventLog|EventSubscriber|ExecutionPolicy|FormatData|Help|History|Host|HotFix|Item|ItemProperty|Job|Location|Member|Module|PfxCertificate|Process|PSBreakpoint|PSCallStack|PSDrive|PSProvider|PSSession|PSSessionConfiguration|PSSnapin|Random|Service|TraceSource|Transaction|TypeData|UICulture|Unique|Variable|Verb|WinEvent|WmiObject)"),
			/Group-Object/,
			/Import-(Alias|Clixml|Counter|Csv|LocalizedData|Module|PSSession)/,
			/ImportSystemModules/,
			/Invoke-(Command|Expression|History|Item|RestMethod|WebRequest|WmiMethod)/,
			/Join-Path/,
			/Limit-EventLog/,
			/Measure-(Command|Object)/,
			/Move-Item(Property)?/,
			/* @__PURE__ */ new RegExp("New-(Alias|Event|EventLog|Item(Property)?|Module|ModuleManifest|Object|PSDrive|PSSession|PSSessionConfigurationFile|PSSessionOption|PSTransportOption|Service|TimeSpan|Variable|WebServiceProxy|WinEvent)"),
			/Out-(Default|File|GridView|Host|Null|Printer|String)/,
			/Pause/,
			/(Pop|Push)-Location/,
			/Read-Host/,
			/Receive-(Job|PSSession)/,
			/Register-(EngineEvent|ObjectEvent|PSSessionConfiguration|WmiEvent)/,
			/Remove-(Computer|Event|EventLog|Item(Property)?|Job|Module|PSBreakpoint|PSDrive|PSSession|PSSnapin|TypeData|Variable|WmiObject)/,
			/Rename-(Computer|Item(Property)?)/,
			/Reset-ComputerMachinePassword/,
			/Resolve-Path/,
			/Restart-(Computer|Service)/,
			/Restore-Computer/,
			/Resume-(Job|Service)/,
			/Save-Help/,
			/Select-(Object|String|Xml)/,
			/Send-MailMessage/,
			/* @__PURE__ */ new RegExp("Set-(Acl|Alias|AuthenticodeSignature|Content|Date|ExecutionPolicy|Item(Property)?|Location|PSBreakpoint|PSDebug|PSSessionConfiguration|Service|StrictMode|TraceSource|Variable|WmiInstance)"),
			/Show-(Command|ControlPanelItem|EventLog)/,
			/Sort-Object/,
			/Split-Path/,
			/Start-(Job|Process|Service|Sleep|Transaction|Transcript)/,
			/Stop-(Computer|Job|Process|Service|Transcript)/,
			/Suspend-(Job|Service)/,
			/TabExpansion2/,
			/Tee-Object/,
			/Test-(ComputerSecureChannel|Connection|ModuleManifest|Path|PSSessionConfigurationFile)/,
			/Trace-Command/,
			/Unblock-File/,
			/Undo-Transaction/,
			/Unregister-(Event|PSSessionConfiguration)/,
			/Update-(FormatData|Help|List|TypeData)/,
			/Use-Transaction/,
			/Wait-(Event|Job|Process)/,
			/Where-Object/,
			/Write-(Debug|Error|EventLog|Host|Output|Progress|Verbose|Warning)/,
			/cd|help|mkdir|more|oss|prompt/,
			/ac|asnp|cat|cd|chdir|clc|clear|clhy|cli|clp|cls|clv|cnsn|compare|copy|cp|cpi|cpp|cvpa|dbp|del|diff|dir|dnsn|ebp/,
			/echo|epal|epcsv|epsn|erase|etsn|exsn|fc|fl|foreach|ft|fw|gal|gbp|gc|gci|gcm|gcs|gdr|ghy|gi|gjb|gl|gm|gmo|gp|gps/,
			/group|gsn|gsnp|gsv|gu|gv|gwmi|h|history|icm|iex|ihy|ii|ipal|ipcsv|ipmo|ipsn|irm|ise|iwmi|iwr|kill|lp|ls|man|md/,
			/measure|mi|mount|move|mp|mv|nal|ndr|ni|nmo|npssc|nsn|nv|ogv|oh|popd|ps|pushd|pwd|r|rbp|rcjb|rcsn|rd|rdr|ren|ri/,
			/rjb|rm|rmdir|rmo|rni|rnp|rp|rsn|rsnp|rujb|rv|rvpa|rwmi|sajb|sal|saps|sasv|sbp|sc|select|set|shcm|si|sl|sleep|sls/,
			/sort|sp|spjb|spps|spsv|start|sujb|sv|swmi|tee|trcm|type|where|wjb|write/
		], {
			prefix: "",
			suffix: ""
		}),
		buildRegexp([
			/[$?^_]|Args|ConfirmPreference|ConsoleFileName|DebugPreference|Error|ErrorActionPreference|ErrorView|ExecutionContext/,
			/FormatEnumerationLimit|Home|Host|Input|MaximumAliasCount|MaximumDriveCount|MaximumErrorCount|MaximumFunctionCount/,
			/MaximumHistoryCount|MaximumVariableCount|MyInvocation|NestedPromptLevel|OutputEncoding|Pid|Profile|ProgressPreference/,
			/PSBoundParameters|PSCommandPath|PSCulture|PSDefaultParameterValues|PSEmailServer|PSHome|PSScriptRoot|PSSessionApplicationName/,
			/PSSessionConfigurationName|PSSessionOption|PSUICulture|PSVersionTable|Pwd|ShellId|StackTrace|VerbosePreference/,
			/WarningPreference|WhatIfPreference/,
			/Event|EventArgs|EventSubscriber|Sender/,
			/Matches|Ofs|ForEach|LastExitCode|PSCmdlet|PSItem|PSSenderInfo|This/,
			/true|false|null/
		], {
			prefix: "\\$",
			suffix: ""
		})
	], { suffix: notCharacterOrDash }),
	punctuation: /[\[\]{},;`\\\.]|@[({]/,
	variable: /^[A-Za-z\_][A-Za-z\-\_\d]*\b/
};
function tokenBase$19(stream, state) {
	var parent = state.returnStack[state.returnStack.length - 1];
	if (parent && parent.shouldReturnFrom(state)) {
		state.tokenize = parent.tokenize;
		state.returnStack.pop();
		return state.tokenize(stream, state);
	}
	if (stream.eatSpace()) return null;
	if (stream.eat("(")) {
		state.bracketNesting += 1;
		return "punctuation";
	}
	if (stream.eat(")")) {
		state.bracketNesting -= 1;
		return "punctuation";
	}
	for (var key in grammar) if (stream.match(grammar[key])) return key;
	var ch = stream.next();
	if (ch === "'") return tokenSingleQuoteString(stream, state);
	if (ch === "$") return tokenVariable$1(stream, state);
	if (ch === "\"") return tokenDoubleQuoteString(stream, state);
	if (ch === "<" && stream.eat("#")) {
		state.tokenize = tokenComment$6;
		return tokenComment$6(stream, state);
	}
	if (ch === "#") {
		stream.skipToEnd();
		return "comment";
	}
	if (ch === "@") {
		var quoteMatch = stream.eat(/["']/);
		if (quoteMatch && stream.eol()) {
			state.tokenize = tokenMultiString;
			state.startQuote = quoteMatch[0];
			return tokenMultiString(stream, state);
		} else if (stream.eol()) return "error";
		else if (stream.peek().match(/[({]/)) return "punctuation";
		else if (stream.peek().match(varNames)) return tokenVariable$1(stream, state);
	}
	return "error";
}
function tokenSingleQuoteString(stream, state) {
	var ch;
	while ((ch = stream.peek()) != null) {
		stream.next();
		if (ch === "'" && !stream.eat("'")) {
			state.tokenize = tokenBase$19;
			return "string";
		}
	}
	return "error";
}
function tokenDoubleQuoteString(stream, state) {
	var ch;
	while ((ch = stream.peek()) != null) {
		if (ch === "$") {
			state.tokenize = tokenStringInterpolation;
			return "string";
		}
		stream.next();
		if (ch === "`") {
			stream.next();
			continue;
		}
		if (ch === "\"" && !stream.eat("\"")) {
			state.tokenize = tokenBase$19;
			return "string";
		}
	}
	return "error";
}
function tokenStringInterpolation(stream, state) {
	return tokenInterpolation(stream, state, tokenDoubleQuoteString);
}
function tokenMultiStringReturn(stream, state) {
	state.tokenize = tokenMultiString;
	state.startQuote = "\"";
	return tokenMultiString(stream, state);
}
function tokenHereStringInterpolation(stream, state) {
	return tokenInterpolation(stream, state, tokenMultiStringReturn);
}
function tokenInterpolation(stream, state, parentTokenize) {
	if (stream.match("$(")) {
		var savedBracketNesting = state.bracketNesting;
		state.returnStack.push({
			shouldReturnFrom: function(state) {
				return state.bracketNesting === savedBracketNesting;
			},
			tokenize: parentTokenize
		});
		state.tokenize = tokenBase$19;
		state.bracketNesting += 1;
		return "punctuation";
	} else {
		stream.next();
		state.returnStack.push({
			shouldReturnFrom: function() {
				return true;
			},
			tokenize: parentTokenize
		});
		state.tokenize = tokenVariable$1;
		return state.tokenize(stream, state);
	}
}
function tokenComment$6(stream, state) {
	var maybeEnd = false, ch;
	while ((ch = stream.next()) != null) {
		if (maybeEnd && ch == ">") {
			state.tokenize = tokenBase$19;
			break;
		}
		maybeEnd = ch === "#";
	}
	return "comment";
}
function tokenVariable$1(stream, state) {
	var ch = stream.peek();
	if (stream.eat("{")) {
		state.tokenize = tokenVariableWithBraces;
		return tokenVariableWithBraces(stream, state);
	} else if (ch != void 0 && ch.match(varNames)) {
		stream.eatWhile(varNames);
		state.tokenize = tokenBase$19;
		return "variable";
	} else {
		state.tokenize = tokenBase$19;
		return "error";
	}
}
function tokenVariableWithBraces(stream, state) {
	var ch;
	while ((ch = stream.next()) != null) if (ch === "}") {
		state.tokenize = tokenBase$19;
		break;
	}
	return "variable";
}
function tokenMultiString(stream, state) {
	var quote = state.startQuote;
	if (stream.sol() && stream.match(new RegExp(quote + "@"))) state.tokenize = tokenBase$19;
	else if (quote === "\"") while (!stream.eol()) {
		var ch = stream.peek();
		if (ch === "$") {
			state.tokenize = tokenHereStringInterpolation;
			return "string";
		}
		stream.next();
		if (ch === "`") stream.next();
	}
	else stream.skipToEnd();
	return "string";
}
var powerShell = {
	name: "powershell",
	startState: function() {
		return {
			returnStack: [],
			bracketNesting: 0,
			tokenize: tokenBase$19
		};
	},
	token: function(stream, state) {
		return state.tokenize(stream, state);
	},
	languageData: { commentTokens: {
		line: "#",
		block: {
			open: "<#",
			close: "#>"
		}
	} }
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/properties.js
var properties = {
	name: "properties",
	token: function(stream, state) {
		var sol = stream.sol() || state.afterSection;
		var eol = stream.eol();
		state.afterSection = false;
		if (sol) {
			if (state.nextMultiline) {
				state.inMultiline = true;
				state.nextMultiline = false;
			} else state.position = "def";
		}
		if (eol && !state.nextMultiline) {
			state.inMultiline = false;
			state.position = "def";
		}
		if (sol) while (stream.eatSpace());
		var ch = stream.next();
		if (sol && (ch === "#" || ch === "!" || ch === ";")) {
			state.position = "comment";
			stream.skipToEnd();
			return "comment";
		} else if (sol && ch === "[") {
			state.afterSection = true;
			stream.skipTo("]");
			stream.eat("]");
			return "header";
		} else if (ch === "=" || ch === ":") {
			state.position = "quote";
			return null;
		} else if (ch === "\\" && state.position === "quote") {
			if (stream.eol()) state.nextMultiline = true;
		}
		return state.position;
	},
	startState: function() {
		return {
			position: "def",
			nextMultiline: false,
			inMultiline: false,
			afterSection: false
		};
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/protobuf.js
function wordRegexp$6(words) {
	return new RegExp("^((" + words.join(")|(") + "))\\b", "i");
}
var keywordArray$1 = [
	"package",
	"message",
	"import",
	"syntax",
	"required",
	"optional",
	"repeated",
	"reserved",
	"default",
	"extensions",
	"packed",
	"bool",
	"bytes",
	"double",
	"enum",
	"float",
	"string",
	"int32",
	"int64",
	"uint32",
	"uint64",
	"sint32",
	"sint64",
	"fixed32",
	"fixed64",
	"sfixed32",
	"sfixed64",
	"option",
	"service",
	"rpc",
	"returns"
];
var keywords$17 = wordRegexp$6(keywordArray$1);
var identifiers$2 = /* @__PURE__ */ new RegExp("^[_A-Za-z¡-￿][_A-Za-z0-9¡-￿]*");
function tokenBase$18(stream) {
	if (stream.eatSpace()) return null;
	if (stream.match("//")) {
		stream.skipToEnd();
		return "comment";
	}
	if (stream.match(/^[0-9\.+-]/, false)) {
		if (stream.match(/^[+-]?0x[0-9a-fA-F]+/)) return "number";
		if (stream.match(/^[+-]?\d*\.\d+([EeDd][+-]?\d+)?/)) return "number";
		if (stream.match(/^[+-]?\d+([EeDd][+-]?\d+)?/)) return "number";
	}
	if (stream.match(/^"([^"]|(""))*"/)) return "string";
	if (stream.match(/^'([^']|(''))*'/)) return "string";
	if (stream.match(keywords$17)) return "keyword";
	if (stream.match(identifiers$2)) return "variable";
	stream.next();
	return null;
}
var protobuf = {
	name: "protobuf",
	token: tokenBase$18,
	languageData: { autocomplete: keywordArray$1 }
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/pug.js
var ATTRS_NEST = {
	"{": "}",
	"(": ")",
	"[": "]"
};
function defaultCopyState(state) {
	if (typeof state != "object") return state;
	let newState = {};
	for (let prop in state) {
		let val = state[prop];
		newState[prop] = val instanceof Array ? val.slice() : val;
	}
	return newState;
}
var State$1 = class State$1 {
	constructor(indentUnit) {
		this.indentUnit = indentUnit;
		this.javaScriptLine = false;
		this.javaScriptLineExcludesColon = false;
		this.javaScriptArguments = false;
		this.javaScriptArgumentsDepth = 0;
		this.isInterpolating = false;
		this.interpolationNesting = 0;
		this.jsState = javascript.startState(indentUnit);
		this.restOfLine = "";
		this.isIncludeFiltered = false;
		this.isEach = false;
		this.lastTag = "";
		this.isAttrs = false;
		this.attrsNest = [];
		this.inAttributeName = true;
		this.attributeIsType = false;
		this.attrValue = "";
		this.indentOf = Infinity;
		this.indentToken = "";
	}
	copy() {
		var res = new State$1(this.indentUnit);
		res.javaScriptLine = this.javaScriptLine;
		res.javaScriptLineExcludesColon = this.javaScriptLineExcludesColon;
		res.javaScriptArguments = this.javaScriptArguments;
		res.javaScriptArgumentsDepth = this.javaScriptArgumentsDepth;
		res.isInterpolating = this.isInterpolating;
		res.interpolationNesting = this.interpolationNesting;
		res.jsState = (javascript.copyState || defaultCopyState)(this.jsState);
		res.restOfLine = this.restOfLine;
		res.isIncludeFiltered = this.isIncludeFiltered;
		res.isEach = this.isEach;
		res.lastTag = this.lastTag;
		res.isAttrs = this.isAttrs;
		res.attrsNest = this.attrsNest.slice();
		res.inAttributeName = this.inAttributeName;
		res.attributeIsType = this.attributeIsType;
		res.attrValue = this.attrValue;
		res.indentOf = this.indentOf;
		res.indentToken = this.indentToken;
		return res;
	}
};
function javaScript(stream, state) {
	if (stream.sol()) {
		state.javaScriptLine = false;
		state.javaScriptLineExcludesColon = false;
	}
	if (state.javaScriptLine) {
		if (state.javaScriptLineExcludesColon && stream.peek() === ":") {
			state.javaScriptLine = false;
			state.javaScriptLineExcludesColon = false;
			return;
		}
		var tok = javascript.token(stream, state.jsState);
		if (stream.eol()) state.javaScriptLine = false;
		return tok || true;
	}
}
function javaScriptArguments(stream, state) {
	if (state.javaScriptArguments) {
		if (state.javaScriptArgumentsDepth === 0 && stream.peek() !== "(") {
			state.javaScriptArguments = false;
			return;
		}
		if (stream.peek() === "(") state.javaScriptArgumentsDepth++;
		else if (stream.peek() === ")") state.javaScriptArgumentsDepth--;
		if (state.javaScriptArgumentsDepth === 0) {
			state.javaScriptArguments = false;
			return;
		}
		return javascript.token(stream, state.jsState) || true;
	}
}
function yieldStatement(stream) {
	if (stream.match(/^yield\b/)) return "keyword";
}
function doctype(stream) {
	if (stream.match(/^(?:doctype) *([^\n]+)?/)) return "meta";
}
function interpolation(stream, state) {
	if (stream.match("#{")) {
		state.isInterpolating = true;
		state.interpolationNesting = 0;
		return "punctuation";
	}
}
function interpolationContinued(stream, state) {
	if (state.isInterpolating) {
		if (stream.peek() === "}") {
			state.interpolationNesting--;
			if (state.interpolationNesting < 0) {
				stream.next();
				state.isInterpolating = false;
				return "punctuation";
			}
		} else if (stream.peek() === "{") state.interpolationNesting++;
		return javascript.token(stream, state.jsState) || true;
	}
}
function caseStatement(stream, state) {
	if (stream.match(/^case\b/)) {
		state.javaScriptLine = true;
		return "keyword";
	}
}
function when(stream, state) {
	if (stream.match(/^when\b/)) {
		state.javaScriptLine = true;
		state.javaScriptLineExcludesColon = true;
		return "keyword";
	}
}
function defaultStatement(stream) {
	if (stream.match(/^default\b/)) return "keyword";
}
function extendsStatement(stream, state) {
	if (stream.match(/^extends?\b/)) {
		state.restOfLine = "string";
		return "keyword";
	}
}
function append(stream, state) {
	if (stream.match(/^append\b/)) {
		state.restOfLine = "variable";
		return "keyword";
	}
}
function prepend(stream, state) {
	if (stream.match(/^prepend\b/)) {
		state.restOfLine = "variable";
		return "keyword";
	}
}
function block(stream, state) {
	if (stream.match(/^block\b *(?:(prepend|append)\b)?/)) {
		state.restOfLine = "variable";
		return "keyword";
	}
}
function include(stream, state) {
	if (stream.match(/^include\b/)) {
		state.restOfLine = "string";
		return "keyword";
	}
}
function includeFiltered(stream, state) {
	if (stream.match(/^include:([a-zA-Z0-9\-]+)/, false) && stream.match("include")) {
		state.isIncludeFiltered = true;
		return "keyword";
	}
}
function includeFilteredContinued(stream, state) {
	if (state.isIncludeFiltered) {
		var tok = filter(stream, state);
		state.isIncludeFiltered = false;
		state.restOfLine = "string";
		return tok;
	}
}
function mixin(stream, state) {
	if (stream.match(/^mixin\b/)) {
		state.javaScriptLine = true;
		return "keyword";
	}
}
function call(stream, state) {
	if (stream.match(/^\+([-\w]+)/)) {
		if (!stream.match(/^\( *[-\w]+ *=/, false)) {
			state.javaScriptArguments = true;
			state.javaScriptArgumentsDepth = 0;
		}
		return "variable";
	}
	if (stream.match("+#{", false)) {
		stream.next();
		state.mixinCallAfter = true;
		return interpolation(stream, state);
	}
}
function callArguments(stream, state) {
	if (state.mixinCallAfter) {
		state.mixinCallAfter = false;
		if (!stream.match(/^\( *[-\w]+ *=/, false)) {
			state.javaScriptArguments = true;
			state.javaScriptArgumentsDepth = 0;
		}
		return true;
	}
}
function conditional(stream, state) {
	if (stream.match(/^(if|unless|else if|else)\b/)) {
		state.javaScriptLine = true;
		return "keyword";
	}
}
function each(stream, state) {
	if (stream.match(/^(- *)?(each|for)\b/)) {
		state.isEach = true;
		return "keyword";
	}
}
function eachContinued(stream, state) {
	if (state.isEach) {
		if (stream.match(/^ in\b/)) {
			state.javaScriptLine = true;
			state.isEach = false;
			return "keyword";
		} else if (stream.sol() || stream.eol()) state.isEach = false;
		else if (stream.next()) {
			while (!stream.match(/^ in\b/, false) && stream.next());
			return "variable";
		}
	}
}
function whileStatement(stream, state) {
	if (stream.match(/^while\b/)) {
		state.javaScriptLine = true;
		return "keyword";
	}
}
function tag(stream, state) {
	var captures;
	if (captures = stream.match(/^(\w(?:[-:\w]*\w)?)\/?/)) {
		state.lastTag = captures[1].toLowerCase();
		return "tag";
	}
}
function filter(stream, state) {
	if (stream.match(/^:([\w\-]+)/)) {
		setStringMode(stream, state);
		return "atom";
	}
}
function code(stream, state) {
	if (stream.match(/^(!?=|-)/)) {
		state.javaScriptLine = true;
		return "punctuation";
	}
}
function id(stream) {
	if (stream.match(/^#([\w-]+)/)) return "builtin";
}
function className(stream) {
	if (stream.match(/^\.([\w-]+)/)) return "className";
}
function attrs(stream, state) {
	if (stream.peek() == "(") {
		stream.next();
		state.isAttrs = true;
		state.attrsNest = [];
		state.inAttributeName = true;
		state.attrValue = "";
		state.attributeIsType = false;
		return "punctuation";
	}
}
function attrsContinued(stream, state) {
	if (state.isAttrs) {
		if (ATTRS_NEST[stream.peek()]) state.attrsNest.push(ATTRS_NEST[stream.peek()]);
		if (state.attrsNest[state.attrsNest.length - 1] === stream.peek()) state.attrsNest.pop();
		else if (stream.eat(")")) {
			state.isAttrs = false;
			return "punctuation";
		}
		if (state.inAttributeName && stream.match(/^[^=,\)!]+/)) {
			if (stream.peek() === "=" || stream.peek() === "!") {
				state.inAttributeName = false;
				state.jsState = javascript.startState(2);
				if (state.lastTag === "script" && stream.current().trim().toLowerCase() === "type") state.attributeIsType = true;
				else state.attributeIsType = false;
			}
			return "attribute";
		}
		var tok = javascript.token(stream, state.jsState);
		if (state.attrsNest.length === 0 && (tok === "string" || tok === "variable" || tok === "keyword")) try {
			Function("", "var x " + state.attrValue.replace(/,\s*$/, "").replace(/^!/, ""));
			state.inAttributeName = true;
			state.attrValue = "";
			stream.backUp(stream.current().length);
			return attrsContinued(stream, state);
		} catch (ex) {}
		state.attrValue += stream.current();
		return tok || true;
	}
}
function attributesBlock(stream, state) {
	if (stream.match(/^&attributes\b/)) {
		state.javaScriptArguments = true;
		state.javaScriptArgumentsDepth = 0;
		return "keyword";
	}
}
function indent$1(stream) {
	if (stream.sol() && stream.eatSpace()) return "indent";
}
function comment(stream, state) {
	if (stream.match(/^ *\/\/(-)?([^\n]*)/)) {
		state.indentOf = stream.indentation();
		state.indentToken = "comment";
		return "comment";
	}
}
function colon(stream) {
	if (stream.match(/^: */)) return "colon";
}
function text(stream, state) {
	if (stream.match(/^(?:\| ?| )([^\n]+)/)) return "string";
	if (stream.match(/^(<[^\n]*)/, false)) {
		setStringMode(stream, state);
		stream.skipToEnd();
		return state.indentToken;
	}
}
function dot(stream, state) {
	if (stream.eat(".")) {
		setStringMode(stream, state);
		return "dot";
	}
}
function fail(stream) {
	stream.next();
	return null;
}
function setStringMode(stream, state) {
	state.indentOf = stream.indentation();
	state.indentToken = "string";
}
function restOfLine(stream, state) {
	if (stream.sol()) state.restOfLine = "";
	if (state.restOfLine) {
		stream.skipToEnd();
		var tok = state.restOfLine;
		state.restOfLine = "";
		return tok;
	}
}
function startState(indentUnit) {
	return new State$1(indentUnit);
}
function copyState(state) {
	return state.copy();
}
function nextToken(stream, state) {
	var tok = restOfLine(stream, state) || interpolationContinued(stream, state) || includeFilteredContinued(stream, state) || eachContinued(stream, state) || attrsContinued(stream, state) || javaScript(stream, state) || javaScriptArguments(stream, state) || callArguments(stream, state) || yieldStatement(stream) || doctype(stream) || interpolation(stream, state) || caseStatement(stream, state) || when(stream, state) || defaultStatement(stream) || extendsStatement(stream, state) || append(stream, state) || prepend(stream, state) || block(stream, state) || include(stream, state) || includeFiltered(stream, state) || mixin(stream, state) || call(stream, state) || conditional(stream, state) || each(stream, state) || whileStatement(stream, state) || tag(stream, state) || filter(stream, state) || code(stream, state) || id(stream) || className(stream) || attrs(stream, state) || attributesBlock(stream, state) || indent$1(stream) || text(stream, state) || comment(stream, state) || colon(stream) || dot(stream, state) || fail(stream);
	return tok === true ? null : tok;
}
var pug = {
	startState,
	copyState,
	token: nextToken
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/puppet.js
var words$8 = {};
var variable_regex = /({)?([a-z][a-z0-9_]*)?((::[a-z][a-z0-9_]*)*::)?[a-zA-Z0-9_]+(})?/;
function define$2(style, string) {
	var split = string.split(" ");
	for (var i = 0; i < split.length; i++) words$8[split[i]] = style;
}
define$2("keyword", "class define site node include import inherits");
define$2("keyword", "case if else in and elsif default or");
define$2("atom", "false true running present absent file directory undef");
define$2("builtin", "action augeas burst chain computer cron destination dport exec file filebucket group host icmp iniface interface jump k5login limit log_level log_prefix macauthorization mailalias maillist mcx mount nagios_command nagios_contact nagios_contactgroup nagios_host nagios_hostdependency nagios_hostescalation nagios_hostextinfo nagios_hostgroup nagios_service nagios_servicedependency nagios_serviceescalation nagios_serviceextinfo nagios_servicegroup nagios_timeperiod name notify outiface package proto reject resources router schedule scheduled_task selboolean selmodule service source sport ssh_authorized_key sshkey stage state table tidy todest toports tosource user vlan yumrepo zfs zone zpool");
function tokenString$13(stream, state) {
	var current, prev, found_var = false;
	while (!stream.eol() && (current = stream.next()) != state.pending) {
		if (current === "$" && prev != "\\" && state.pending == "\"") {
			found_var = true;
			break;
		}
		prev = current;
	}
	if (found_var) stream.backUp(1);
	if (current == state.pending) state.continueString = false;
	else state.continueString = true;
	return "string";
}
function tokenize$3(stream, state) {
	var word = stream.match(/[\w]+/, false);
	var attribute = stream.match(/(\s+)?\w+\s+=>.*/, false);
	var resource = stream.match(/(\s+)?[\w:_]+(\s+)?{/, false);
	var special_resource = stream.match(/(\s+)?[@]{1,2}[\w:_]+(\s+)?{/, false);
	var ch = stream.next();
	if (ch === "$") {
		if (stream.match(variable_regex)) return state.continueString ? "variableName.special" : "variable";
		return "error";
	}
	if (state.continueString) {
		stream.backUp(1);
		return tokenString$13(stream, state);
	}
	if (state.inDefinition) {
		if (stream.match(/(\s+)?[\w:_]+(\s+)?/)) return "def";
		stream.match(/\s+{/);
		state.inDefinition = false;
	}
	if (state.inInclude) {
		stream.match(/(\s+)?\S+(\s+)?/);
		state.inInclude = false;
		return "def";
	}
	if (stream.match(/(\s+)?\w+\(/)) {
		stream.backUp(1);
		return "def";
	}
	if (attribute) {
		stream.match(/(\s+)?\w+/);
		return "tag";
	}
	if (word && words$8.hasOwnProperty(word)) {
		stream.backUp(1);
		stream.match(/[\w]+/);
		if (stream.match(/\s+\S+\s+{/, false)) state.inDefinition = true;
		if (word == "include") state.inInclude = true;
		return words$8[word];
	}
	if (/(^|\s+)[A-Z][\w:_]+/.test(word)) {
		stream.backUp(1);
		stream.match(/(^|\s+)[A-Z][\w:_]+/);
		return "def";
	}
	if (resource) {
		stream.match(/(\s+)?[\w:_]+/);
		return "def";
	}
	if (special_resource) {
		stream.match(/(\s+)?[@]{1,2}/);
		return "atom";
	}
	if (ch == "#") {
		stream.skipToEnd();
		return "comment";
	}
	if (ch == "'" || ch == "\"") {
		state.pending = ch;
		return tokenString$13(stream, state);
	}
	if (ch == "{" || ch == "}") return "bracket";
	if (ch == "/") {
		stream.match(/^[^\/]*\//);
		return "string.special";
	}
	if (ch.match(/[0-9]/)) {
		stream.eatWhile(/[0-9]+/);
		return "number";
	}
	if (ch == "=") {
		if (stream.peek() == ">") stream.next();
		return "operator";
	}
	stream.eatWhile(/[\w-]/);
	return null;
}
var puppet = {
	name: "puppet",
	startState: function() {
		var state = {};
		state.inDefinition = false;
		state.inInclude = false;
		state.continueString = false;
		state.pending = false;
		return state;
	},
	token: function(stream, state) {
		if (stream.eatSpace()) return null;
		return tokenize$3(stream, state);
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/q.js
var curPunc$7;
var keywords$16 = buildRE([
	"abs",
	"acos",
	"aj",
	"aj0",
	"all",
	"and",
	"any",
	"asc",
	"asin",
	"asof",
	"atan",
	"attr",
	"avg",
	"avgs",
	"bin",
	"by",
	"ceiling",
	"cols",
	"cor",
	"cos",
	"count",
	"cov",
	"cross",
	"csv",
	"cut",
	"delete",
	"deltas",
	"desc",
	"dev",
	"differ",
	"distinct",
	"div",
	"do",
	"each",
	"ej",
	"enlist",
	"eval",
	"except",
	"exec",
	"exit",
	"exp",
	"fby",
	"fills",
	"first",
	"fkeys",
	"flip",
	"floor",
	"from",
	"get",
	"getenv",
	"group",
	"gtime",
	"hclose",
	"hcount",
	"hdel",
	"hopen",
	"hsym",
	"iasc",
	"idesc",
	"if",
	"ij",
	"in",
	"insert",
	"inter",
	"inv",
	"key",
	"keys",
	"last",
	"like",
	"list",
	"lj",
	"load",
	"log",
	"lower",
	"lsq",
	"ltime",
	"ltrim",
	"mavg",
	"max",
	"maxs",
	"mcount",
	"md5",
	"mdev",
	"med",
	"meta",
	"min",
	"mins",
	"mmax",
	"mmin",
	"mmu",
	"mod",
	"msum",
	"neg",
	"next",
	"not",
	"null",
	"or",
	"over",
	"parse",
	"peach",
	"pj",
	"plist",
	"prd",
	"prds",
	"prev",
	"prior",
	"rand",
	"rank",
	"ratios",
	"raze",
	"read0",
	"read1",
	"reciprocal",
	"reverse",
	"rload",
	"rotate",
	"rsave",
	"rtrim",
	"save",
	"scan",
	"select",
	"set",
	"setenv",
	"show",
	"signum",
	"sin",
	"sqrt",
	"ss",
	"ssr",
	"string",
	"sublist",
	"sum",
	"sums",
	"sv",
	"system",
	"tables",
	"tan",
	"til",
	"trim",
	"txf",
	"type",
	"uj",
	"ungroup",
	"union",
	"update",
	"upper",
	"upsert",
	"value",
	"var",
	"view",
	"views",
	"vs",
	"wavg",
	"where",
	"where",
	"while",
	"within",
	"wj",
	"wj1",
	"wsum",
	"xasc",
	"xbar",
	"xcol",
	"xcols",
	"xdesc",
	"xexp",
	"xgroup",
	"xkey",
	"xlog",
	"xprev",
	"xrank"
]);
var E = /[|/&^!+:\\\-*%$=~#;@><,?_\'\"\[\(\]\)\s{}]/;
function buildRE(w) {
	return new RegExp("^(" + w.join("|") + ")$");
}
function tokenBase$17(stream, state) {
	var sol = stream.sol(), c = stream.next();
	curPunc$7 = null;
	if (sol) {
		if (c == "/") return (state.tokenize = tokenLineComment)(stream, state);
		else if (c == "\\") {
			if (stream.eol() || /\s/.test(stream.peek())) return stream.skipToEnd(), /^\\\s*$/.test(stream.current()) ? (state.tokenize = tokenCommentToEOF)(stream) : state.tokenize = tokenBase$17, "comment";
			else return state.tokenize = tokenBase$17, "builtin";
		}
	}
	if (/\s/.test(c)) return stream.peek() == "/" ? (stream.skipToEnd(), "comment") : "null";
	if (c == "\"") return (state.tokenize = tokenString$12)(stream, state);
	if (c == "`") return stream.eatWhile(/[A-Za-z\d_:\/.]/), "macroName";
	if ("." == c && /\d/.test(stream.peek()) || /\d/.test(c)) {
		var t = null;
		stream.backUp(1);
		if (stream.match(/^\d{4}\.\d{2}(m|\.\d{2}([DT](\d{2}(:\d{2}(:\d{2}(\.\d{1,9})?)?)?)?)?)/) || stream.match(/^\d+D(\d{2}(:\d{2}(:\d{2}(\.\d{1,9})?)?)?)/) || stream.match(/^\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?/) || stream.match(/^\d+[ptuv]{1}/)) t = "temporal";
		else if (stream.match(/^0[NwW]{1}/) || stream.match(/^0x[\da-fA-F]*/) || stream.match(/^[01]+[b]{1}/) || stream.match(/^\d+[chijn]{1}/) || stream.match(/-?\d*(\.\d*)?(e[+\-]?\d+)?(e|f)?/)) t = "number";
		return t && (!(c = stream.peek()) || E.test(c)) ? t : (stream.next(), "error");
	}
	if (/[A-Za-z]|\./.test(c)) return stream.eatWhile(/[A-Za-z._\d]/), keywords$16.test(stream.current()) ? "keyword" : "variable";
	if (/[|/&^!+:\\\-*%$=~#;@><\.,?_\']/.test(c)) return null;
	if (/[{}\(\[\]\)]/.test(c)) return null;
	return "error";
}
function tokenLineComment(stream, state) {
	return stream.skipToEnd(), /^\/\s*$/.test(stream.current()) ? (state.tokenize = tokenBlockComment)(stream, state) : state.tokenize = tokenBase$17, "comment";
}
function tokenBlockComment(stream, state) {
	var f = stream.sol() && stream.peek() == "\\";
	stream.skipToEnd();
	if (f && /^\\\s*$/.test(stream.current())) state.tokenize = tokenBase$17;
	return "comment";
}
function tokenCommentToEOF(stream) {
	return stream.skipToEnd(), "comment";
}
function tokenString$12(stream, state) {
	var escaped = false, next, end = false;
	while (next = stream.next()) {
		if (next == "\"" && !escaped) {
			end = true;
			break;
		}
		escaped = !escaped && next == "\\";
	}
	if (end) state.tokenize = tokenBase$17;
	return "string";
}
function pushContext$7(state, type, col) {
	state.context = {
		prev: state.context,
		indent: state.indent,
		col,
		type
	};
}
function popContext$7(state) {
	state.indent = state.context.indent;
	state.context = state.context.prev;
}
var q = {
	name: "q",
	startState: function() {
		return {
			tokenize: tokenBase$17,
			context: null,
			indent: 0,
			col: 0
		};
	},
	token: function(stream, state) {
		if (stream.sol()) {
			if (state.context && state.context.align == null) state.context.align = false;
			state.indent = stream.indentation();
		}
		var style = state.tokenize(stream, state);
		if (style != "comment" && state.context && state.context.align == null && state.context.type != "pattern") state.context.align = true;
		if (curPunc$7 == "(") pushContext$7(state, ")", stream.column());
		else if (curPunc$7 == "[") pushContext$7(state, "]", stream.column());
		else if (curPunc$7 == "{") pushContext$7(state, "}", stream.column());
		else if (/[\]\}\)]/.test(curPunc$7)) {
			while (state.context && state.context.type == "pattern") popContext$7(state);
			if (state.context && curPunc$7 == state.context.type) popContext$7(state);
		} else if (curPunc$7 == "." && state.context && state.context.type == "pattern") popContext$7(state);
		else if (/atom|string|variable/.test(style) && state.context) {
			if (/[\}\]]/.test(state.context.type)) pushContext$7(state, "pattern", stream.column());
			else if (state.context.type == "pattern" && !state.context.align) {
				state.context.align = true;
				state.context.col = stream.column();
			}
		}
		return style;
	},
	indent: function(state, textAfter, cx) {
		var firstChar = textAfter && textAfter.charAt(0);
		var context = state.context;
		if (/[\]\}]/.test(firstChar)) while (context && context.type == "pattern") context = context.prev;
		var closing = context && firstChar == context.type;
		if (!context) return 0;
		else if (context.type == "pattern") return context.col;
		else if (context.align) return context.col + (closing ? 0 : 1);
		else return context.indent + (closing ? 0 : cx.unit);
	},
	languageData: { commentTokens: { line: "/" } }
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/r.js
function wordObj$1(words) {
	var res = {};
	for (var i = 0; i < words.length; ++i) res[words[i]] = true;
	return res;
}
var commonAtoms$2 = [
	"NULL",
	"NA",
	"Inf",
	"NaN",
	"NA_integer_",
	"NA_real_",
	"NA_complex_",
	"NA_character_",
	"TRUE",
	"FALSE"
];
var commonBuiltins = [
	"list",
	"quote",
	"bquote",
	"eval",
	"return",
	"call",
	"parse",
	"deparse"
];
var commonKeywords$2 = [
	"if",
	"else",
	"repeat",
	"while",
	"function",
	"for",
	"in",
	"next",
	"break"
];
var commonBlockKeywords = [
	"if",
	"else",
	"repeat",
	"while",
	"function",
	"for"
];
var atoms$4 = wordObj$1(commonAtoms$2);
var builtins$1 = wordObj$1(commonBuiltins);
var keywords$15 = wordObj$1(commonKeywords$2);
var blockkeywords = wordObj$1(commonBlockKeywords);
var opChars = /[+\-*\/^<>=!&|~$:]/;
var curPunc$6;
function tokenBase$16(stream, state) {
	curPunc$6 = null;
	var ch = stream.next();
	if (ch == "#") {
		stream.skipToEnd();
		return "comment";
	} else if (ch == "0" && stream.eat("x")) {
		stream.eatWhile(/[\da-f]/i);
		return "number";
	} else if (ch == "." && stream.eat(/\d/)) {
		stream.match(/\d*(?:e[+\-]?\d+)?/);
		return "number";
	} else if (/\d/.test(ch)) {
		stream.match(/\d*(?:\.\d+)?(?:e[+\-]\d+)?L?/);
		return "number";
	} else if (ch == "'" || ch == "\"") {
		state.tokenize = tokenString$11(ch);
		return "string";
	} else if (ch == "`") {
		stream.match(/[^`]+`/);
		return "string.special";
	} else if (ch == "." && stream.match(/.(?:[.]|\d+)/)) return "keyword";
	else if (/[a-zA-Z\.]/.test(ch)) {
		stream.eatWhile(/[\w\.]/);
		var word = stream.current();
		if (atoms$4.propertyIsEnumerable(word)) return "atom";
		if (keywords$15.propertyIsEnumerable(word)) {
			if (blockkeywords.propertyIsEnumerable(word) && !stream.match(/\s*if(\s+|$)/, false)) curPunc$6 = "block";
			return "keyword";
		}
		if (builtins$1.propertyIsEnumerable(word)) return "builtin";
		return "variable";
	} else if (ch == "%") {
		if (stream.skipTo("%")) stream.next();
		return "variableName.special";
	} else if (ch == "<" && stream.eat("-") || ch == "<" && stream.match("<-") || ch == "-" && stream.match(/>>?/)) return "operator";
	else if (ch == "=" && state.ctx.argList) return "operator";
	else if (opChars.test(ch)) {
		if (ch == "$") return "operator";
		stream.eatWhile(opChars);
		return "operator";
	} else if (/[\(\){}\[\];]/.test(ch)) {
		curPunc$6 = ch;
		if (ch == ";") return "punctuation";
		return null;
	} else return null;
}
function tokenString$11(quote) {
	return function(stream, state) {
		if (stream.eat("\\")) {
			var ch = stream.next();
			if (ch == "x") stream.match(/^[a-f0-9]{2}/i);
			else if ((ch == "u" || ch == "U") && stream.eat("{") && stream.skipTo("}")) stream.next();
			else if (ch == "u") stream.match(/^[a-f0-9]{4}/i);
			else if (ch == "U") stream.match(/^[a-f0-9]{8}/i);
			else if (/[0-7]/.test(ch)) stream.match(/^[0-7]{1,2}/);
			return "string.special";
		} else {
			var next;
			while ((next = stream.next()) != null) {
				if (next == quote) {
					state.tokenize = tokenBase$16;
					break;
				}
				if (next == "\\") {
					stream.backUp(1);
					break;
				}
			}
			return "string";
		}
	};
}
var ALIGN_YES = 1;
var ALIGN_NO = 2;
var BRACELESS = 4;
function push(state, type, stream) {
	state.ctx = {
		type,
		indent: state.indent,
		flags: 0,
		column: stream.column(),
		prev: state.ctx
	};
}
function setFlag(state, flag) {
	var ctx = state.ctx;
	state.ctx = {
		type: ctx.type,
		indent: ctx.indent,
		flags: ctx.flags | flag,
		column: ctx.column,
		prev: ctx.prev
	};
}
function pop(state) {
	state.indent = state.ctx.indent;
	state.ctx = state.ctx.prev;
}
var r = {
	name: "r",
	startState: function(indentUnit) {
		return {
			tokenize: tokenBase$16,
			ctx: {
				type: "top",
				indent: -indentUnit,
				flags: ALIGN_NO
			},
			indent: 0,
			afterIdent: false
		};
	},
	token: function(stream, state) {
		if (stream.sol()) {
			if ((state.ctx.flags & 3) == 0) state.ctx.flags |= ALIGN_NO;
			if (state.ctx.flags & BRACELESS) pop(state);
			state.indent = stream.indentation();
		}
		if (stream.eatSpace()) return null;
		var style = state.tokenize(stream, state);
		if (style != "comment" && (state.ctx.flags & ALIGN_NO) == 0) setFlag(state, ALIGN_YES);
		if ((curPunc$6 == ";" || curPunc$6 == "{" || curPunc$6 == "}") && state.ctx.type == "block") pop(state);
		if (curPunc$6 == "{") push(state, "}", stream);
		else if (curPunc$6 == "(") {
			push(state, ")", stream);
			if (state.afterIdent) state.ctx.argList = true;
		} else if (curPunc$6 == "[") push(state, "]", stream);
		else if (curPunc$6 == "block") push(state, "block", stream);
		else if (curPunc$6 == state.ctx.type) pop(state);
		else if (state.ctx.type == "block" && style != "comment") setFlag(state, BRACELESS);
		state.afterIdent = style == "variable" || style == "keyword";
		return style;
	},
	indent: function(state, textAfter, cx) {
		if (state.tokenize != tokenBase$16) return 0;
		var firstChar = textAfter && textAfter.charAt(0), ctx = state.ctx, closing = firstChar == ctx.type;
		if (ctx.flags & BRACELESS) ctx = ctx.prev;
		if (ctx.type == "block") return ctx.indent + (firstChar == "{" ? 0 : cx.unit);
		else if (ctx.flags & ALIGN_YES) return ctx.column + (closing ? 0 : 1);
		else return ctx.indent + (closing ? 0 : cx.unit);
	},
	languageData: {
		wordChars: ".",
		commentTokens: { line: "#" },
		autocomplete: commonAtoms$2.concat(commonBuiltins, commonKeywords$2)
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/rpm.js
var arch = /^(i386|i586|i686|x86_64|ppc64le|ppc64|ppc|ia64|s390x|s390|sparc64|sparcv9|sparc|noarch|alphaev6|alpha|hppa|mipsel)/;
var preamble = /^[a-zA-Z0-9()]+:/;
var section = /^%(debug_package|package|description|prep|build|install|files|clean|changelog|preinstall|preun|postinstall|postun|pretrans|posttrans|pre|post|triggerin|triggerun|verifyscript|check|triggerpostun|triggerprein|trigger)/;
var control_flow_complex = /^%(ifnarch|ifarch|if)/;
var control_flow_simple = /^%(else|endif)/;
var operators$1 = /^(\!|\?|\<\=|\<|\>\=|\>|\=\=|\&\&|\|\|)/;
var rpmSpec = {
	name: "rpmspec",
	startState: function() {
		return {
			controlFlow: false,
			macroParameters: false,
			section: false
		};
	},
	token: function(stream, state) {
		if (stream.peek() == "#") {
			stream.skipToEnd();
			return "comment";
		}
		if (stream.sol()) {
			if (stream.match(preamble)) return "header";
			if (stream.match(section)) return "atom";
		}
		if (stream.match(/^\$\w+/)) return "def";
		if (stream.match(/^\$\{\w+\}/)) return "def";
		if (stream.match(control_flow_simple)) return "keyword";
		if (stream.match(control_flow_complex)) {
			state.controlFlow = true;
			return "keyword";
		}
		if (state.controlFlow) {
			if (stream.match(operators$1)) return "operator";
			if (stream.match(/^(\d+)/)) return "number";
			if (stream.eol()) state.controlFlow = false;
		}
		if (stream.match(arch)) {
			if (stream.eol()) state.controlFlow = false;
			return "number";
		}
		if (stream.match(/^%[\w]+/)) {
			if (stream.match("(")) state.macroParameters = true;
			return "keyword";
		}
		if (state.macroParameters) {
			if (stream.match(/^\d+/)) return "number";
			if (stream.match(")")) {
				state.macroParameters = false;
				return "keyword";
			}
		}
		if (stream.match(/^%\{\??[\w \-\:\!]+\}/)) {
			if (stream.eol()) state.controlFlow = false;
			return "def";
		}
		stream.next();
		return null;
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/ruby.js
function wordObj(words) {
	var o = {};
	for (var i = 0, e = words.length; i < e; ++i) o[words[i]] = true;
	return o;
}
var keywordList = [
	"alias",
	"and",
	"BEGIN",
	"begin",
	"break",
	"case",
	"class",
	"def",
	"defined?",
	"do",
	"else",
	"elsif",
	"END",
	"end",
	"ensure",
	"false",
	"for",
	"if",
	"in",
	"module",
	"next",
	"not",
	"or",
	"redo",
	"rescue",
	"retry",
	"return",
	"self",
	"super",
	"then",
	"true",
	"undef",
	"unless",
	"until",
	"when",
	"while",
	"yield",
	"nil",
	"raise",
	"throw",
	"catch",
	"fail",
	"loop",
	"callcc",
	"caller",
	"lambda",
	"proc",
	"public",
	"protected",
	"private",
	"require",
	"load",
	"require_relative",
	"extend",
	"autoload",
	"__END__",
	"__FILE__",
	"__LINE__",
	"__dir__"
];
var keywords$14 = wordObj(keywordList);
var indentWords = wordObj([
	"def",
	"class",
	"case",
	"for",
	"while",
	"until",
	"module",
	"catch",
	"loop",
	"proc",
	"begin"
]);
var dedentWords = wordObj(["end", "until"]);
var opening$1 = {
	"[": "]",
	"{": "}",
	"(": ")"
};
var closing$1 = {
	"]": "[",
	"}": "{",
	")": "("
};
var curPunc$5;
function chain$3(newtok, stream, state) {
	state.tokenize.push(newtok);
	return newtok(stream, state);
}
function tokenBase$15(stream, state) {
	if (stream.sol() && stream.match("=begin") && stream.eol()) {
		state.tokenize.push(readBlockComment);
		return "comment";
	}
	if (stream.eatSpace()) return null;
	var ch = stream.next(), m;
	if (ch == "`" || ch == "'" || ch == "\"") return chain$3(readQuoted(ch, "string", ch == "\"" || ch == "`"), stream, state);
	else if (ch == "/") {
		if (regexpAhead(stream)) return chain$3(readQuoted(ch, "string.special", true), stream, state);
		else return "operator";
	} else if (ch == "%") {
		var style = "string", embed = true;
		if (stream.eat("s")) style = "atom";
		else if (stream.eat(/[WQ]/)) style = "string";
		else if (stream.eat(/[r]/)) style = "string.special";
		else if (stream.eat(/[wxq]/)) {
			style = "string";
			embed = false;
		}
		var delim = stream.eat(/[^\w\s=]/);
		if (!delim) return "operator";
		if (opening$1.propertyIsEnumerable(delim)) delim = opening$1[delim];
		return chain$3(readQuoted(delim, style, embed, true), stream, state);
	} else if (ch == "#") {
		stream.skipToEnd();
		return "comment";
	} else if (ch == "<" && (m = stream.match(/^<([-~])[\`\"\']?([a-zA-Z_?]\w*)[\`\"\']?(?:;|$)/))) return chain$3(readHereDoc(m[2], m[1]), stream, state);
	else if (ch == "0") {
		if (stream.eat("x")) stream.eatWhile(/[\da-fA-F]/);
		else if (stream.eat("b")) stream.eatWhile(/[01]/);
		else stream.eatWhile(/[0-7]/);
		return "number";
	} else if (/\d/.test(ch)) {
		stream.match(/^[\d_]*(?:\.[\d_]+)?(?:[eE][+\-]?[\d_]+)?/);
		return "number";
	} else if (ch == "?") {
		while (stream.match(/^\\[CM]-/));
		if (stream.eat("\\")) stream.eatWhile(/\w/);
		else stream.next();
		return "string";
	} else if (ch == ":") {
		if (stream.eat("'")) return chain$3(readQuoted("'", "atom", false), stream, state);
		if (stream.eat("\"")) return chain$3(readQuoted("\"", "atom", true), stream, state);
		if (stream.eat(/[\<\>]/)) {
			stream.eat(/[\<\>]/);
			return "atom";
		}
		if (stream.eat(/[\+\-\*\/\&\|\:\!]/)) return "atom";
		if (stream.eat(/[a-zA-Z$@_\xa1-\uffff]/)) {
			stream.eatWhile(/[\w$\xa1-\uffff]/);
			stream.eat(/[\?\!\=]/);
			return "atom";
		}
		return "operator";
	} else if (ch == "@" && stream.match(/^@?[a-zA-Z_\xa1-\uffff]/)) {
		stream.eat("@");
		stream.eatWhile(/[\w\xa1-\uffff]/);
		return "propertyName";
	} else if (ch == "$") {
		if (stream.eat(/[a-zA-Z_]/)) stream.eatWhile(/[\w]/);
		else if (stream.eat(/\d/)) stream.eat(/\d/);
		else stream.next();
		return "variableName.special";
	} else if (/[a-zA-Z_\xa1-\uffff]/.test(ch)) {
		stream.eatWhile(/[\w\xa1-\uffff]/);
		stream.eat(/[\?\!]/);
		if (stream.eat(":")) return "atom";
		return "variable";
	} else if (ch == "|" && (state.varList || state.lastTok == "{" || state.lastTok == "do")) {
		curPunc$5 = "|";
		return null;
	} else if (/[\(\)\[\]{}\\;]/.test(ch)) {
		curPunc$5 = ch;
		return null;
	} else if (ch == "-" && stream.eat(">")) return "operator";
	else if (/[=+\-\/*:\.^%<>~|]/.test(ch)) {
		var more = stream.eatWhile(/[=+\-\/*:\.^%<>~|]/);
		if (ch == "." && !more) curPunc$5 = ".";
		return "operator";
	} else return null;
}
function regexpAhead(stream) {
	var start = stream.pos, depth = 0, next, found = false, escaped = false;
	while ((next = stream.next()) != null) if (!escaped) {
		if ("[{(".indexOf(next) > -1) depth++;
		else if ("]})".indexOf(next) > -1) {
			depth--;
			if (depth < 0) break;
		} else if (next == "/" && depth == 0) {
			found = true;
			break;
		}
		escaped = next == "\\";
	} else escaped = false;
	stream.backUp(stream.pos - start);
	return found;
}
function tokenBaseUntilBrace(depth) {
	if (!depth) depth = 1;
	return function(stream, state) {
		if (stream.peek() == "}") {
			if (depth == 1) {
				state.tokenize.pop();
				return state.tokenize[state.tokenize.length - 1](stream, state);
			} else state.tokenize[state.tokenize.length - 1] = tokenBaseUntilBrace(depth - 1);
		} else if (stream.peek() == "{") state.tokenize[state.tokenize.length - 1] = tokenBaseUntilBrace(depth + 1);
		return tokenBase$15(stream, state);
	};
}
function tokenBaseOnce() {
	var alreadyCalled = false;
	return function(stream, state) {
		if (alreadyCalled) {
			state.tokenize.pop();
			return state.tokenize[state.tokenize.length - 1](stream, state);
		}
		alreadyCalled = true;
		return tokenBase$15(stream, state);
	};
}
function readQuoted(quote, style, embed, unescaped) {
	return function(stream, state) {
		var escaped = false, ch;
		if (state.context.type === "read-quoted-paused") {
			state.context = state.context.prev;
			stream.eat("}");
		}
		while ((ch = stream.next()) != null) {
			if (ch == quote && (unescaped || !escaped)) {
				state.tokenize.pop();
				break;
			}
			if (embed && ch == "#" && !escaped) {
				if (stream.eat("{")) {
					if (quote == "}") state.context = {
						prev: state.context,
						type: "read-quoted-paused"
					};
					state.tokenize.push(tokenBaseUntilBrace());
					break;
				} else if (/[@\$]/.test(stream.peek())) {
					state.tokenize.push(tokenBaseOnce());
					break;
				}
			}
			escaped = !escaped && ch == "\\";
		}
		return style;
	};
}
function readHereDoc(phrase, mayIndent) {
	return function(stream, state) {
		if (mayIndent) stream.eatSpace();
		if (stream.match(phrase)) state.tokenize.pop();
		else stream.skipToEnd();
		return "string";
	};
}
function readBlockComment(stream, state) {
	if (stream.sol() && stream.match("=end") && stream.eol()) state.tokenize.pop();
	stream.skipToEnd();
	return "comment";
}
var ruby = {
	name: "ruby",
	startState: function(indentUnit) {
		return {
			tokenize: [tokenBase$15],
			indented: 0,
			context: {
				type: "top",
				indented: -indentUnit
			},
			continuedLine: false,
			lastTok: null,
			varList: false
		};
	},
	token: function(stream, state) {
		curPunc$5 = null;
		if (stream.sol()) state.indented = stream.indentation();
		var style = state.tokenize[state.tokenize.length - 1](stream, state), kwtype;
		var thisTok = curPunc$5;
		if (style == "variable") {
			var word = stream.current();
			style = state.lastTok == "." ? "property" : keywords$14.propertyIsEnumerable(stream.current()) ? "keyword" : /^[A-Z]/.test(word) ? "tag" : state.lastTok == "def" || state.lastTok == "class" || state.varList ? "def" : "variable";
			if (style == "keyword") {
				thisTok = word;
				if (indentWords.propertyIsEnumerable(word)) kwtype = "indent";
				else if (dedentWords.propertyIsEnumerable(word)) kwtype = "dedent";
				else if ((word == "if" || word == "unless") && stream.column() == stream.indentation()) kwtype = "indent";
				else if (word == "do" && state.context.indented < state.indented) kwtype = "indent";
			}
		}
		if (curPunc$5 || style && style != "comment") state.lastTok = thisTok;
		if (curPunc$5 == "|") state.varList = !state.varList;
		if (kwtype == "indent" || /[\(\[\{]/.test(curPunc$5)) state.context = {
			prev: state.context,
			type: curPunc$5 || style,
			indented: state.indented
		};
		else if ((kwtype == "dedent" || /[\)\]\}]/.test(curPunc$5)) && state.context.prev) state.context = state.context.prev;
		if (stream.eol()) state.continuedLine = curPunc$5 == "\\" || style == "operator";
		return style;
	},
	indent: function(state, textAfter, cx) {
		if (state.tokenize[state.tokenize.length - 1] != tokenBase$15) return null;
		var firstChar = textAfter && textAfter.charAt(0);
		var ct = state.context;
		var closed = ct.type == closing$1[firstChar] || ct.type == "keyword" && /^(?:end|until|else|elsif|when|rescue)\b/.test(textAfter);
		return ct.indented + (closed ? 0 : cx.unit) + (state.continuedLine ? cx.unit : 0);
	},
	languageData: {
		indentOnInput: /^\s*(?:end|rescue|elsif|else|\})$/,
		commentTokens: { line: "#" },
		autocomplete: keywordList
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/sas.js
var words$7 = {};
var isDoubleOperatorSym = {
	eq: "operator",
	lt: "operator",
	le: "operator",
	gt: "operator",
	ge: "operator",
	"in": "operator",
	ne: "operator",
	or: "operator"
};
var isDoubleOperatorChar = /(<=|>=|!=|<>)/;
var isSingleOperatorChar = /[=\(:\),{}.*<>+\-\/^\[\]]/;
function define$1(style, string, context) {
	if (context) {
		var split = string.split(" ");
		for (var i = 0; i < split.length; i++) words$7[split[i]] = {
			style,
			state: context
		};
	}
}
define$1("def", "stack pgm view source debug nesting nolist", ["inDataStep"]);
define$1("def", "if while until for do do; end end; then else cancel", ["inDataStep"]);
define$1("def", "label format _n_ _error_", ["inDataStep"]);
define$1("def", "ALTER BUFNO BUFSIZE CNTLLEV COMPRESS DLDMGACTION ENCRYPT ENCRYPTKEY EXTENDOBSCOUNTER GENMAX GENNUM INDEX LABEL OBSBUF OUTREP PW PWREQ READ REPEMPTY REPLACE REUSE ROLE SORTEDBY SPILL TOBSNO TYPE WRITE FILECLOSE FIRSTOBS IN OBS POINTOBS WHERE WHEREUP IDXNAME IDXWHERE DROP KEEP RENAME", ["inDataStep"]);
define$1("def", "filevar finfo finv fipname fipnamel fipstate first firstobs floor", ["inDataStep"]);
define$1("def", "varfmt varinfmt varlabel varlen varname varnum varray varrayx vartype verify vformat vformatd vformatdx vformatn vformatnx vformatw vformatwx vformatx vinarray vinarrayx vinformat vinformatd vinformatdx vinformatn vinformatnx vinformatw vinformatwx vinformatx vlabel vlabelx vlength vlengthx vname vnamex vnferr vtype vtypex weekday", ["inDataStep"]);
define$1("def", "zipfips zipname zipnamel zipstate", ["inDataStep"]);
define$1("def", "put putc putn", ["inDataStep"]);
define$1("builtin", "data run", ["inDataStep"]);
define$1("def", "data", ["inProc"]);
define$1("def", "%if %end %end; %else %else; %do %do; %then", ["inMacro"]);
define$1("builtin", "proc run; quit; libname filename %macro %mend option options", ["ALL"]);
define$1("def", "footnote title libname ods", ["ALL"]);
define$1("def", "%let %put %global %sysfunc %eval ", ["ALL"]);
define$1("variable", "&sysbuffr &syscc &syscharwidth &syscmd &sysdate &sysdate9 &sysday &sysdevic &sysdmg &sysdsn &sysencoding &sysenv &syserr &syserrortext &sysfilrc &syshostname &sysindex &sysinfo &sysjobid &syslast &syslckrc &syslibrc &syslogapplname &sysmacroname &sysmenv &sysmsg &sysncpu &sysodspath &sysparm &syspbuff &sysprocessid &sysprocessname &sysprocname &sysrc &sysscp &sysscpl &sysscpl &syssite &sysstartid &sysstartname &systcpiphostname &systime &sysuserid &sysver &sysvlong &sysvlong4 &syswarningtext", ["ALL"]);
define$1("def", "source2 nosource2 page pageno pagesize", ["ALL"]);
define$1("def", "_all_ _character_ _cmd_ _freq_ _i_ _infile_ _last_ _msg_ _null_ _numeric_ _temporary_ _type_ abort abs addr adjrsq airy alpha alter altlog altprint and arcos array arsin as atan attrc attrib attrn authserver autoexec awscontrol awsdef awsmenu awsmenumerge awstitle backward band base betainv between blocksize blshift bnot bor brshift bufno bufsize bxor by byerr byline byte calculated call cards cards4 catcache cbufno cdf ceil center cexist change chisq cinv class cleanup close cnonct cntllev coalesce codegen col collate collin column comamid comaux1 comaux2 comdef compbl compound compress config continue convert cos cosh cpuid create cross crosstab css curobs cv daccdb daccdbsl daccsl daccsyd dacctab dairy datalines datalines4 datejul datepart datetime day dbcslang dbcstype dclose ddfm ddm delete delimiter depdb depdbsl depsl depsyd deptab dequote descending descript design= device dflang dhms dif digamma dim dinfo display distinct dkricond dkrocond dlm dnum do dopen doptname doptnum dread drop dropnote dsname dsnferr echo else emaildlg emailid emailpw emailserver emailsys encrypt end endsas engine eof eov erf erfc error errorcheck errors exist exp fappend fclose fcol fdelete feedback fetch fetchobs fexist fget file fileclose fileexist filefmt filename fileref  fmterr fmtsearch fnonct fnote font fontalias  fopen foptname foptnum force formatted formchar formdelim formdlim forward fpoint fpos fput fread frewind frlen from fsep fuzz fwrite gaminv gamma getoption getvarc getvarn go goto group gwindow hbar hbound helpenv helploc hms honorappearance hosthelp hostprint hour hpct html hvar ibessel ibr id if index indexc indexw initcmd initstmt inner input inputc inputn inr insert int intck intnx into intrr invaliddata irr is jbessel join juldate keep kentb kurtosis label lag last lbound leave left length levels lgamma lib  library libref line linesize link list log log10 log2 logpdf logpmf logsdf lostcard lowcase lrecl ls macro macrogen maps mautosource max maxdec maxr mdy mean measures median memtype merge merror min minute missing missover mlogic mod mode model modify month mopen mort mprint mrecall msglevel msymtabmax mvarsize myy n nest netpv new news nmiss no nobatch nobs nocaps nocardimage nocenter nocharcode nocmdmac nocol nocum nodate nodbcs nodetails nodmr nodms nodmsbatch nodup nodupkey noduplicates noechoauto noequals noerrorabend noexitwindows nofullstimer noicon noimplmac noint nolist noloadlist nomiss nomlogic nomprint nomrecall nomsgcase nomstored nomultenvappl nonotes nonumber noobs noovp nopad nopercent noprint noprintinit normal norow norsasuser nosetinit  nosplash nosymbolgen note notes notitle notitles notsorted noverbose noxsync noxwait npv null number numkeys nummousekeys nway obs  on open     order ordinal otherwise out outer outp= output over ovp p(1 5 10 25 50 75 90 95 99) pad pad2  paired parm parmcards path pathdll pathname pdf peek peekc pfkey pmf point poisson poke position printer probbeta probbnml probchi probf probgam probhypr probit probnegb probnorm probsig probt procleave prt ps  pw pwreq qtr quote r ranbin rancau random ranexp rangam range ranks rannor ranpoi rantbl rantri ranuni rcorr read recfm register regr remote remove rename repeat repeated replace resolve retain return reuse reverse rewind right round rsquare rtf rtrace rtraceloc s s2 samploc sasautos sascontrol sasfrscr sasmsg sasmstore sasscript sasuser saving scan sdf second select selection separated seq serror set setcomm setot sign simple sin sinh siteinfo skewness skip sle sls sortedby sortpgm sortseq sortsize soundex  spedis splashlocation split spool sqrt start std stderr stdin stfips stimer stname stnamel stop stopover sub subgroup subpopn substr sum sumwgt symbol symbolgen symget symput sysget sysin sysleave sysmsg sysparm sysprint sysprintfont sysprod sysrc system t table tables tan tanh tapeclose tbufsize terminal test then timepart tinv  tnonct to today tol tooldef totper transformout translate trantab tranwrd trigamma trim trimn trunc truncover type unformatted uniform union until upcase update user usericon uss validate value var  weight when where while wincharset window work workinit workterm write wsum xsync xwait yearcutoff yes yyq  min max", ["inDataStep", "inProc"]);
define$1("operator", "and not ", ["inDataStep", "inProc"]);
function tokenize$2(stream, state) {
	var ch = stream.next();
	if (ch === "/" && stream.eat("*")) {
		state.continueComment = true;
		return "comment";
	} else if (state.continueComment === true) {
		if (ch === "*" && stream.peek() === "/") {
			stream.next();
			state.continueComment = false;
		} else if (stream.skipTo("*")) {
			stream.skipTo("*");
			stream.next();
			if (stream.eat("/")) state.continueComment = false;
		} else stream.skipToEnd();
		return "comment";
	}
	if (ch == "*" && stream.column() == stream.indentation()) {
		stream.skipToEnd();
		return "comment";
	}
	var doubleOperator = ch + stream.peek();
	if ((ch === "\"" || ch === "'") && !state.continueString) {
		state.continueString = ch;
		return "string";
	} else if (state.continueString) {
		if (state.continueString == ch) state.continueString = null;
		else if (stream.skipTo(state.continueString)) {
			stream.next();
			state.continueString = null;
		} else stream.skipToEnd();
		return "string";
	} else if (state.continueString !== null && stream.eol()) {
		stream.skipTo(state.continueString) || stream.skipToEnd();
		return "string";
	} else if (/[\d\.]/.test(ch)) {
		if (ch === ".") stream.match(/^[0-9]+([eE][\-+]?[0-9]+)?/);
		else if (ch === "0") stream.match(/^[xX][0-9a-fA-F]+/) || stream.match(/^0[0-7]+/);
		else stream.match(/^[0-9]*\.?[0-9]*([eE][\-+]?[0-9]+)?/);
		return "number";
	} else if (isDoubleOperatorChar.test(ch + stream.peek())) {
		stream.next();
		return "operator";
	} else if (isDoubleOperatorSym.hasOwnProperty(doubleOperator)) {
		stream.next();
		if (stream.peek() === " ") return isDoubleOperatorSym[doubleOperator.toLowerCase()];
	} else if (isSingleOperatorChar.test(ch)) return "operator";
	var word;
	if (stream.match(/[%&;\w]+/, false) != null) {
		word = ch + stream.match(/[%&;\w]+/, true);
		if (/&/.test(word)) return "variable";
	} else word = ch;
	if (state.nextword) {
		stream.match(/[\w]+/);
		if (stream.peek() === ".") stream.skipTo(" ");
		state.nextword = false;
		return "variableName.special";
	}
	word = word.toLowerCase();
	if (state.inDataStep) {
		if (word === "run;" || stream.match(/run\s;/)) {
			state.inDataStep = false;
			return "builtin";
		}
		if (word && stream.next() === ".") {
			if (/\w/.test(stream.peek())) return "variableName.special";
			else return "variable";
		}
		if (word && words$7.hasOwnProperty(word) && (words$7[word].state.indexOf("inDataStep") !== -1 || words$7[word].state.indexOf("ALL") !== -1)) {
			if (stream.start < stream.pos) stream.backUp(stream.pos - stream.start);
			for (var i = 0; i < word.length; ++i) stream.next();
			return words$7[word].style;
		}
	}
	if (state.inProc) {
		if (word === "run;" || word === "quit;") {
			state.inProc = false;
			return "builtin";
		}
		if (word && words$7.hasOwnProperty(word) && (words$7[word].state.indexOf("inProc") !== -1 || words$7[word].state.indexOf("ALL") !== -1)) {
			stream.match(/[\w]+/);
			return words$7[word].style;
		}
	}
	if (state.inMacro) {
		if (word === "%mend") {
			if (stream.peek() === ";") stream.next();
			state.inMacro = false;
			return "builtin";
		}
		if (word && words$7.hasOwnProperty(word) && (words$7[word].state.indexOf("inMacro") !== -1 || words$7[word].state.indexOf("ALL") !== -1)) {
			stream.match(/[\w]+/);
			return words$7[word].style;
		}
		return "atom";
	}
	if (word && words$7.hasOwnProperty(word)) {
		stream.backUp(1);
		stream.match(/[\w]+/);
		if (word === "data" && /=/.test(stream.peek()) === false) {
			state.inDataStep = true;
			state.nextword = true;
			return "builtin";
		}
		if (word === "proc") {
			state.inProc = true;
			state.nextword = true;
			return "builtin";
		}
		if (word === "%macro") {
			state.inMacro = true;
			state.nextword = true;
			return "builtin";
		}
		if (/title[1-9]/.test(word)) return "def";
		if (word === "footnote") {
			stream.eat(/[1-9]/);
			return "def";
		}
		if (state.inDataStep === true && words$7[word].state.indexOf("inDataStep") !== -1) return words$7[word].style;
		if (state.inProc === true && words$7[word].state.indexOf("inProc") !== -1) return words$7[word].style;
		if (state.inMacro === true && words$7[word].state.indexOf("inMacro") !== -1) return words$7[word].style;
		if (words$7[word].state.indexOf("ALL") !== -1) return words$7[word].style;
		return null;
	}
	return null;
}
var sas = {
	name: "sas",
	startState: function() {
		return {
			inDataStep: false,
			inProc: false,
			inMacro: false,
			nextword: false,
			continueString: null,
			continueComment: false
		};
	},
	token: function(stream, state) {
		if (stream.eatSpace()) return null;
		return tokenize$2(stream, state);
	},
	languageData: { commentTokens: { block: {
		open: "/*",
		close: "*/"
	} } }
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/scheme.js
var BUILTIN = "builtin";
var COMMENT = "comment";
var STRING = "string";
var SYMBOL = "symbol";
var ATOM = "atom";
var NUMBER = "number";
var BRACKET = "bracket";
var INDENT_WORD_SKIP = 2;
function makeKeywords(str) {
	var obj = {}, words = str.split(" ");
	for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
	return obj;
}
var keywords$13 = makeKeywords("λ case-lambda call/cc class cond-expand define-class define-values exit-handler field import inherit init-field interface let*-values let-values let/ec mixin opt-lambda override protect provide public rename require require-for-syntax syntax syntax-case syntax-error unit/sig unless when with-syntax and begin call-with-current-continuation call-with-input-file call-with-output-file case cond define define-syntax define-macro defmacro delay do dynamic-wind else for-each if lambda let let* let-syntax letrec letrec-syntax map or syntax-rules abs acos angle append apply asin assoc assq assv atan boolean? caar cadr call-with-input-file call-with-output-file call-with-values car cdddar cddddr cdr ceiling char->integer char-alphabetic? char-ci<=? char-ci<? char-ci=? char-ci>=? char-ci>? char-downcase char-lower-case? char-numeric? char-ready? char-upcase char-upper-case? char-whitespace? char<=? char<? char=? char>=? char>? char? close-input-port close-output-port complex? cons cos current-input-port current-output-port denominator display eof-object? eq? equal? eqv? eval even? exact->inexact exact? exp expt #f floor force gcd imag-part inexact->exact inexact? input-port? integer->char integer? interaction-environment lcm length list list->string list->vector list-ref list-tail list? load log magnitude make-polar make-rectangular make-string make-vector max member memq memv min modulo negative? newline not null-environment null? number->string number? numerator odd? open-input-file open-output-file output-port? pair? peek-char port? positive? procedure? quasiquote quote quotient rational? rationalize read read-char real-part real? remainder reverse round scheme-report-environment set! set-car! set-cdr! sin sqrt string string->list string->number string->symbol string-append string-ci<=? string-ci<? string-ci=? string-ci>=? string-ci>? string-copy string-fill! string-length string-ref string-set! string<=? string<? string=? string>=? string>? string? substring symbol->string symbol? #t tan transcript-off transcript-on truncate values vector vector->list vector-fill! vector-length vector-ref vector-set! with-input-from-file with-output-to-file write write-char zero?");
var indentKeys = makeKeywords("define let letrec let* lambda define-macro defmacro let-syntax letrec-syntax let-values let*-values define-syntax syntax-rules define-values when unless");
function stateStack(indent, type, prev) {
	this.indent = indent;
	this.type = type;
	this.prev = prev;
}
function pushStack(state, indent, type) {
	state.indentStack = new stateStack(indent, type, state.indentStack);
}
function popStack(state) {
	state.indentStack = state.indentStack.prev;
}
var binaryMatcher = /* @__PURE__ */ new RegExp(/^(?:[-+]i|[-+][01]+#*(?:\/[01]+#*)?i|[-+]?[01]+#*(?:\/[01]+#*)?@[-+]?[01]+#*(?:\/[01]+#*)?|[-+]?[01]+#*(?:\/[01]+#*)?[-+](?:[01]+#*(?:\/[01]+#*)?)?i|[-+]?[01]+#*(?:\/[01]+#*)?)(?=[()\s;"]|$)/i);
var octalMatcher = /* @__PURE__ */ new RegExp(/^(?:[-+]i|[-+][0-7]+#*(?:\/[0-7]+#*)?i|[-+]?[0-7]+#*(?:\/[0-7]+#*)?@[-+]?[0-7]+#*(?:\/[0-7]+#*)?|[-+]?[0-7]+#*(?:\/[0-7]+#*)?[-+](?:[0-7]+#*(?:\/[0-7]+#*)?)?i|[-+]?[0-7]+#*(?:\/[0-7]+#*)?)(?=[()\s;"]|$)/i);
var hexMatcher = /* @__PURE__ */ new RegExp(/^(?:[-+]i|[-+][\da-f]+#*(?:\/[\da-f]+#*)?i|[-+]?[\da-f]+#*(?:\/[\da-f]+#*)?@[-+]?[\da-f]+#*(?:\/[\da-f]+#*)?|[-+]?[\da-f]+#*(?:\/[\da-f]+#*)?[-+](?:[\da-f]+#*(?:\/[\da-f]+#*)?)?i|[-+]?[\da-f]+#*(?:\/[\da-f]+#*)?)(?=[()\s;"]|$)/i);
var decimalMatcher = /* @__PURE__ */ new RegExp(/^(?:[-+]i|[-+](?:(?:(?:\d+#+\.?#*|\d+\.\d*#*|\.\d+#*|\d+)(?:[esfdl][-+]?\d+)?)|\d+#*\/\d+#*)i|[-+]?(?:(?:(?:\d+#+\.?#*|\d+\.\d*#*|\.\d+#*|\d+)(?:[esfdl][-+]?\d+)?)|\d+#*\/\d+#*)@[-+]?(?:(?:(?:\d+#+\.?#*|\d+\.\d*#*|\.\d+#*|\d+)(?:[esfdl][-+]?\d+)?)|\d+#*\/\d+#*)|[-+]?(?:(?:(?:\d+#+\.?#*|\d+\.\d*#*|\.\d+#*|\d+)(?:[esfdl][-+]?\d+)?)|\d+#*\/\d+#*)[-+](?:(?:(?:\d+#+\.?#*|\d+\.\d*#*|\.\d+#*|\d+)(?:[esfdl][-+]?\d+)?)|\d+#*\/\d+#*)?i|(?:(?:(?:\d+#+\.?#*|\d+\.\d*#*|\.\d+#*|\d+)(?:[esfdl][-+]?\d+)?)|\d+#*\/\d+#*))(?=[()\s;"]|$)/i);
function isBinaryNumber(stream) {
	return stream.match(binaryMatcher);
}
function isOctalNumber(stream) {
	return stream.match(octalMatcher);
}
function isDecimalNumber(stream, backup) {
	if (backup === true) stream.backUp(1);
	return stream.match(decimalMatcher);
}
function isHexNumber(stream) {
	return stream.match(hexMatcher);
}
function processEscapedSequence(stream, options) {
	var next, escaped = false;
	while ((next = stream.next()) != null) {
		if (next == options.token && !escaped) {
			options.state.mode = false;
			break;
		}
		escaped = !escaped && next == "\\";
	}
}
var scheme = {
	name: "scheme",
	startState: function() {
		return {
			indentStack: null,
			indentation: 0,
			mode: false,
			sExprComment: false,
			sExprQuote: false
		};
	},
	token: function(stream, state) {
		if (state.indentStack == null && stream.sol()) state.indentation = stream.indentation();
		if (stream.eatSpace()) return null;
		var returnType = null;
		switch (state.mode) {
			case "string":
				processEscapedSequence(stream, {
					token: "\"",
					state
				});
				returnType = STRING;
				break;
			case "symbol":
				processEscapedSequence(stream, {
					token: "|",
					state
				});
				returnType = SYMBOL;
				break;
			case "comment":
				var next, maybeEnd = false;
				while ((next = stream.next()) != null) {
					if (next == "#" && maybeEnd) {
						state.mode = false;
						break;
					}
					maybeEnd = next == "|";
				}
				returnType = COMMENT;
				break;
			case "s-expr-comment":
				state.mode = false;
				if (stream.peek() == "(" || stream.peek() == "[") state.sExprComment = 0;
				else {
					stream.eatWhile(/[^\s\(\)\[\]]/);
					returnType = COMMENT;
					break;
				}
			default:
				var ch = stream.next();
				if (ch == "\"") {
					state.mode = "string";
					returnType = STRING;
				} else if (ch == "'") {
					if (stream.peek() == "(" || stream.peek() == "[") {
						if (typeof state.sExprQuote != "number") state.sExprQuote = 0;
						returnType = ATOM;
					} else {
						stream.eatWhile(/[\w_\-!$%&*+\.\/:<=>?@\^~]/);
						returnType = ATOM;
					}
				} else if (ch == "|") {
					state.mode = "symbol";
					returnType = SYMBOL;
				} else if (ch == "#") {
					if (stream.eat("|")) {
						state.mode = "comment";
						returnType = COMMENT;
					} else if (stream.eat(/[tf]/i)) returnType = ATOM;
					else if (stream.eat(";")) {
						state.mode = "s-expr-comment";
						returnType = COMMENT;
					} else {
						var numTest = null, hasExactness = false, hasRadix = true;
						if (stream.eat(/[ei]/i)) hasExactness = true;
						else stream.backUp(1);
						if (stream.match(/^#b/i)) numTest = isBinaryNumber;
						else if (stream.match(/^#o/i)) numTest = isOctalNumber;
						else if (stream.match(/^#x/i)) numTest = isHexNumber;
						else if (stream.match(/^#d/i)) numTest = isDecimalNumber;
						else if (stream.match(/^[-+0-9.]/, false)) {
							hasRadix = false;
							numTest = isDecimalNumber;
						} else if (!hasExactness) stream.eat("#");
						if (numTest != null) {
							if (hasRadix && !hasExactness) stream.match(/^#[ei]/i);
							if (numTest(stream)) returnType = NUMBER;
						}
					}
				} else if (/^[-+0-9.]/.test(ch) && isDecimalNumber(stream, true)) returnType = NUMBER;
				else if (ch == ";") {
					stream.skipToEnd();
					returnType = COMMENT;
				} else if (ch == "(" || ch == "[") {
					var keyWord = "";
					var indentTemp = stream.column(), letter;
					/**
					Either
					(indent-word ..
					(non-indent-word ..
					(;something else, bracket, etc.
					*/
					while ((letter = stream.eat(/[^\s\(\[\;\)\]]/)) != null) keyWord += letter;
					if (keyWord.length > 0 && indentKeys.propertyIsEnumerable(keyWord)) pushStack(state, indentTemp + INDENT_WORD_SKIP, ch);
					else {
						stream.eatSpace();
						if (stream.eol() || stream.peek() == ";") pushStack(state, indentTemp + 1, ch);
						else pushStack(state, indentTemp + stream.current().length, ch);
					}
					stream.backUp(stream.current().length - 1);
					if (typeof state.sExprComment == "number") state.sExprComment++;
					if (typeof state.sExprQuote == "number") state.sExprQuote++;
					returnType = BRACKET;
				} else if (ch == ")" || ch == "]") {
					returnType = BRACKET;
					if (state.indentStack != null && state.indentStack.type == (ch == ")" ? "(" : "[")) {
						popStack(state);
						if (typeof state.sExprComment == "number") {
							if (--state.sExprComment == 0) {
								returnType = COMMENT;
								state.sExprComment = false;
							}
						}
						if (typeof state.sExprQuote == "number") {
							if (--state.sExprQuote == 0) {
								returnType = ATOM;
								state.sExprQuote = false;
							}
						}
					}
				} else {
					stream.eatWhile(/[\w_\-!$%&*+\.\/:<=>?@\^~]/);
					if (keywords$13 && keywords$13.propertyIsEnumerable(stream.current())) returnType = BUILTIN;
					else returnType = "variable";
				}
		}
		return typeof state.sExprComment == "number" ? COMMENT : typeof state.sExprQuote == "number" ? ATOM : returnType;
	},
	indent: function(state) {
		if (state.indentStack == null) return state.indentation;
		return state.indentStack.indent;
	},
	languageData: {
		closeBrackets: { brackets: [
			"(",
			"[",
			"{",
			"\""
		] },
		commentTokens: { line: ";;" }
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/shell.js
var words$6 = {};
function define(style, dict) {
	for (var i = 0; i < dict.length; i++) words$6[dict[i]] = style;
}
var commonAtoms$1 = ["true", "false"];
var commonKeywords$1 = [
	"if",
	"then",
	"do",
	"else",
	"elif",
	"while",
	"until",
	"for",
	"in",
	"esac",
	"fi",
	"fin",
	"fil",
	"done",
	"exit",
	"set",
	"unset",
	"export",
	"function"
];
var commonCommands = [
	"ab",
	"awk",
	"bash",
	"beep",
	"cat",
	"cc",
	"cd",
	"chown",
	"chmod",
	"chroot",
	"clear",
	"cp",
	"curl",
	"cut",
	"diff",
	"echo",
	"find",
	"gawk",
	"gcc",
	"get",
	"git",
	"grep",
	"hg",
	"kill",
	"killall",
	"ln",
	"ls",
	"make",
	"mkdir",
	"openssl",
	"mv",
	"nc",
	"nl",
	"node",
	"npm",
	"ping",
	"ps",
	"restart",
	"rm",
	"rmdir",
	"sed",
	"service",
	"sh",
	"shopt",
	"shred",
	"source",
	"sort",
	"sleep",
	"ssh",
	"start",
	"stop",
	"su",
	"sudo",
	"svn",
	"tee",
	"telnet",
	"top",
	"touch",
	"vi",
	"vim",
	"wall",
	"wc",
	"wget",
	"who",
	"write",
	"yes",
	"zsh"
];
define("atom", commonAtoms$1);
define("keyword", commonKeywords$1);
define("builtin", commonCommands);
function tokenBase$14(stream, state) {
	if (stream.eatSpace()) return null;
	var sol = stream.sol();
	var ch = stream.next();
	if (ch === "\\") {
		stream.next();
		return null;
	}
	if (ch === "'" || ch === "\"" || ch === "`") {
		state.tokens.unshift(tokenString$10(ch, ch === "`" ? "quote" : "string"));
		return tokenize$1(stream, state);
	}
	if (ch === "#") {
		if (sol && stream.eat("!")) {
			stream.skipToEnd();
			return "meta";
		}
		stream.skipToEnd();
		return "comment";
	}
	if (ch === "$") {
		state.tokens.unshift(tokenDollar);
		return tokenize$1(stream, state);
	}
	if (ch === "+" || ch === "=") return "operator";
	if (ch === "-") {
		stream.eat("-");
		stream.eatWhile(/\w/);
		return "attribute";
	}
	if (ch == "<") {
		if (stream.match("<<")) return "operator";
		var heredoc = stream.match(/^<-?\s*(?:['"]([^'"]*)['"]|([^'"\s]*))/);
		if (heredoc) {
			state.tokens.unshift(tokenHeredoc(heredoc[1] || heredoc[2]));
			return "string.special";
		}
	}
	if (/\d/.test(ch)) {
		stream.eatWhile(/\d/);
		if (stream.eol() || !/\w/.test(stream.peek())) return "number";
	}
	stream.eatWhile(/[\w-]/);
	var cur = stream.current();
	if (stream.peek() === "=" && /\w+/.test(cur)) return "def";
	return words$6.hasOwnProperty(cur) ? words$6[cur] : null;
}
function tokenString$10(quote, style) {
	var close = quote == "(" ? ")" : quote == "{" ? "}" : quote;
	return function(stream, state) {
		var next, escaped = false;
		while ((next = stream.next()) != null) {
			if (next === close && !escaped) {
				state.tokens.shift();
				break;
			} else if (next === "$" && !escaped && quote !== "'" && stream.peek() != close) {
				escaped = true;
				stream.backUp(1);
				state.tokens.unshift(tokenDollar);
				break;
			} else if (!escaped && quote !== close && next === quote) {
				state.tokens.unshift(tokenString$10(quote, style));
				return tokenize$1(stream, state);
			} else if (!escaped && /['"]/.test(next) && !/['"]/.test(quote)) {
				state.tokens.unshift(tokenStringStart(next, "string"));
				stream.backUp(1);
				break;
			}
			escaped = !escaped && next === "\\";
		}
		return style;
	};
}
function tokenStringStart(quote, style) {
	return function(stream, state) {
		state.tokens[0] = tokenString$10(quote, style);
		stream.next();
		return tokenize$1(stream, state);
	};
}
var tokenDollar = function(stream, state) {
	if (state.tokens.length > 1) stream.eat("$");
	var ch = stream.next();
	if (/['"({]/.test(ch)) {
		state.tokens[0] = tokenString$10(ch, ch == "(" ? "quote" : ch == "{" ? "def" : "string");
		return tokenize$1(stream, state);
	}
	if (!/\d/.test(ch)) stream.eatWhile(/\w/);
	state.tokens.shift();
	return "def";
};
function tokenHeredoc(delim) {
	return function(stream, state) {
		if (stream.sol() && stream.string == delim) state.tokens.shift();
		stream.skipToEnd();
		return "string.special";
	};
}
function tokenize$1(stream, state) {
	return (state.tokens[0] || tokenBase$14)(stream, state);
}
var shell = {
	name: "shell",
	startState: function() {
		return { tokens: [] };
	},
	token: function(stream, state) {
		return tokenize$1(stream, state);
	},
	languageData: {
		autocomplete: commonAtoms$1.concat(commonKeywords$1, commonCommands),
		closeBrackets: { brackets: [
			"(",
			"[",
			"{",
			"'",
			"\"",
			"`"
		] },
		commentTokens: { line: "#" }
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/sieve.js
function words$5(str) {
	var obj = {}, words = str.split(" ");
	for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
	return obj;
}
var keywords$12 = words$5("if elsif else stop require");
var atoms$3 = words$5("true false not");
function tokenBase$13(stream, state) {
	var ch = stream.next();
	if (ch == "/" && stream.eat("*")) {
		state.tokenize = tokenCComment$1;
		return tokenCComment$1(stream, state);
	}
	if (ch === "#") {
		stream.skipToEnd();
		return "comment";
	}
	if (ch == "\"") {
		state.tokenize = tokenString$9(ch);
		return state.tokenize(stream, state);
	}
	if (ch == "(") {
		state._indent.push("(");
		state._indent.push("{");
		return null;
	}
	if (ch === "{") {
		state._indent.push("{");
		return null;
	}
	if (ch == ")") {
		state._indent.pop();
		state._indent.pop();
	}
	if (ch === "}") {
		state._indent.pop();
		return null;
	}
	if (ch == ",") return null;
	if (ch == ";") return null;
	if (/[{}\(\),;]/.test(ch)) return null;
	if (/\d/.test(ch)) {
		stream.eatWhile(/[\d]/);
		stream.eat(/[KkMmGg]/);
		return "number";
	}
	if (ch == ":") {
		stream.eatWhile(/[a-zA-Z_]/);
		stream.eatWhile(/[a-zA-Z0-9_]/);
		return "operator";
	}
	stream.eatWhile(/\w/);
	var cur = stream.current();
	if (cur == "text" && stream.eat(":")) {
		state.tokenize = tokenMultiLineString;
		return "string";
	}
	if (keywords$12.propertyIsEnumerable(cur)) return "keyword";
	if (atoms$3.propertyIsEnumerable(cur)) return "atom";
	return null;
}
function tokenMultiLineString(stream, state) {
	state._multiLineString = true;
	if (!stream.sol()) {
		stream.eatSpace();
		if (stream.peek() == "#") {
			stream.skipToEnd();
			return "comment";
		}
		stream.skipToEnd();
		return "string";
	}
	if (stream.next() == "." && stream.eol()) {
		state._multiLineString = false;
		state.tokenize = tokenBase$13;
	}
	return "string";
}
function tokenCComment$1(stream, state) {
	var maybeEnd = false, ch;
	while ((ch = stream.next()) != null) {
		if (maybeEnd && ch == "/") {
			state.tokenize = tokenBase$13;
			break;
		}
		maybeEnd = ch == "*";
	}
	return "comment";
}
function tokenString$9(quote) {
	return function(stream, state) {
		var escaped = false, ch;
		while ((ch = stream.next()) != null) {
			if (ch == quote && !escaped) break;
			escaped = !escaped && ch == "\\";
		}
		if (!escaped) state.tokenize = tokenBase$13;
		return "string";
	};
}
var sieve = {
	name: "sieve",
	startState: function(base) {
		return {
			tokenize: tokenBase$13,
			baseIndent: base || 0,
			_indent: []
		};
	},
	token: function(stream, state) {
		if (stream.eatSpace()) return null;
		return (state.tokenize || tokenBase$13)(stream, state);
	},
	indent: function(state, _textAfter, cx) {
		var length = state._indent.length;
		if (_textAfter && _textAfter[0] == "}") length--;
		if (length < 0) length = 0;
		return length * cx.unit;
	},
	languageData: { indentOnInput: /^\s*\}$/ }
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/smalltalk.js
var specialChars = /[+\-\/\\*~<>=@%|&?!.,:;^]/;
var keywords$11 = /true|false|nil|self|super|thisContext/;
var Context$5 = function(tokenizer, parent) {
	this.next = tokenizer;
	this.parent = parent;
};
var Token = function(name, context, eos) {
	this.name = name;
	this.context = context;
	this.eos = eos;
};
var State = function() {
	this.context = new Context$5(next, null);
	this.expectVariable = true;
	this.indentation = 0;
	this.userIndentationDelta = 0;
};
State.prototype.userIndent = function(indentation, indentUnit) {
	this.userIndentationDelta = indentation > 0 ? indentation / indentUnit - this.indentation : 0;
};
var next = function(stream, context, state) {
	var token = new Token(null, context, false);
	var aChar = stream.next();
	if (aChar === "\"") token = nextComment(stream, new Context$5(nextComment, context));
	else if (aChar === "'") token = nextString(stream, new Context$5(nextString, context));
	else if (aChar === "#") {
		if (stream.peek() === "'") {
			stream.next();
			token = nextSymbol(stream, new Context$5(nextSymbol, context));
		} else if (stream.eatWhile(/[^\s.{}\[\]()]/)) token.name = "string.special";
		else token.name = "meta";
	} else if (aChar === "$") {
		if (stream.next() === "<") {
			stream.eatWhile(/[^\s>]/);
			stream.next();
		}
		token.name = "string.special";
	} else if (aChar === "|" && state.expectVariable) token.context = new Context$5(nextTemporaries, context);
	else if (/[\[\]{}()]/.test(aChar)) {
		token.name = "bracket";
		token.eos = /[\[{(]/.test(aChar);
		if (aChar === "[") state.indentation++;
		else if (aChar === "]") state.indentation = Math.max(0, state.indentation - 1);
	} else if (specialChars.test(aChar)) {
		stream.eatWhile(specialChars);
		token.name = "operator";
		token.eos = aChar !== ";";
	} else if (/\d/.test(aChar)) {
		stream.eatWhile(/[\w\d]/);
		token.name = "number";
	} else if (/[\w_]/.test(aChar)) {
		stream.eatWhile(/[\w\d_]/);
		token.name = state.expectVariable ? keywords$11.test(stream.current()) ? "keyword" : "variable" : null;
	} else token.eos = state.expectVariable;
	return token;
};
var nextComment = function(stream, context) {
	stream.eatWhile(/[^"]/);
	return new Token("comment", stream.eat("\"") ? context.parent : context, true);
};
var nextString = function(stream, context) {
	stream.eatWhile(/[^']/);
	return new Token("string", stream.eat("'") ? context.parent : context, false);
};
var nextSymbol = function(stream, context) {
	stream.eatWhile(/[^']/);
	return new Token("string.special", stream.eat("'") ? context.parent : context, false);
};
var nextTemporaries = function(stream, context) {
	var token = new Token(null, context, false);
	if (stream.next() === "|") {
		token.context = context.parent;
		token.eos = true;
	} else {
		stream.eatWhile(/[^|]/);
		token.name = "variable";
	}
	return token;
};
var smalltalk = {
	name: "smalltalk",
	startState: function() {
		return new State();
	},
	token: function(stream, state) {
		state.userIndent(stream.indentation(), stream.indentUnit);
		if (stream.eatSpace()) return null;
		var token = state.context.next(stream, state.context, state);
		state.context = token.context;
		state.expectVariable = token.eos;
		return token.name;
	},
	blankLine: function(state, indentUnit) {
		state.userIndent(0, indentUnit);
	},
	indent: function(state, textAfter, cx) {
		var i = state.context.next === next && textAfter && textAfter.charAt(0) === "]" ? -1 : state.userIndentationDelta;
		return (state.indentation + i) * cx.unit;
	},
	languageData: { indentOnInput: /^\s*\]$/ }
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/sparql.js
var curPunc$4;
function wordRegexp$5(words) {
	return new RegExp("^(?:" + words.join("|") + ")$", "i");
}
var ops = wordRegexp$5([
	"str",
	"lang",
	"langmatches",
	"datatype",
	"bound",
	"sameterm",
	"isiri",
	"isuri",
	"iri",
	"uri",
	"bnode",
	"count",
	"sum",
	"min",
	"max",
	"avg",
	"sample",
	"group_concat",
	"rand",
	"abs",
	"ceil",
	"floor",
	"round",
	"concat",
	"substr",
	"strlen",
	"replace",
	"ucase",
	"lcase",
	"encode_for_uri",
	"contains",
	"strstarts",
	"strends",
	"strbefore",
	"strafter",
	"year",
	"month",
	"day",
	"hours",
	"minutes",
	"seconds",
	"timezone",
	"tz",
	"now",
	"uuid",
	"struuid",
	"md5",
	"sha1",
	"sha256",
	"sha384",
	"sha512",
	"coalesce",
	"if",
	"strlang",
	"strdt",
	"isnumeric",
	"regex",
	"exists",
	"isblank",
	"isliteral",
	"a",
	"bind"
]);
var keywords$10 = wordRegexp$5([
	"base",
	"prefix",
	"select",
	"distinct",
	"reduced",
	"construct",
	"describe",
	"ask",
	"from",
	"named",
	"where",
	"order",
	"limit",
	"offset",
	"filter",
	"optional",
	"graph",
	"by",
	"asc",
	"desc",
	"as",
	"having",
	"undef",
	"values",
	"group",
	"minus",
	"in",
	"not",
	"service",
	"silent",
	"using",
	"insert",
	"delete",
	"union",
	"true",
	"false",
	"with",
	"data",
	"copy",
	"to",
	"move",
	"add",
	"create",
	"drop",
	"clear",
	"load",
	"into"
]);
var operatorChars$1 = /[*+\-<>=&|\^\/!\?]/;
var PN_CHARS = "[A-Za-z_\\-0-9]";
var PREFIX_START = /* @__PURE__ */ new RegExp("[A-Za-z]");
var PREFIX_REMAINDER = new RegExp("((" + PN_CHARS + "|\\.)*(" + PN_CHARS + "))?:");
function tokenBase$12(stream, state) {
	var ch = stream.next();
	curPunc$4 = null;
	if (ch == "$" || ch == "?") {
		if (ch == "?" && stream.match(/\s/, false)) return "operator";
		stream.match(/^[A-Za-z0-9_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][A-Za-z0-9_\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]*/);
		return "variableName.local";
	} else if (ch == "<" && !stream.match(/^[\s\u00a0=]/, false)) {
		stream.match(/^[^\s\u00a0>]*>?/);
		return "atom";
	} else if (ch == "\"" || ch == "'") {
		state.tokenize = tokenLiteral$1(ch);
		return state.tokenize(stream, state);
	} else if (/[{}\(\),\.;\[\]]/.test(ch)) {
		curPunc$4 = ch;
		return "bracket";
	} else if (ch == "#") {
		stream.skipToEnd();
		return "comment";
	} else if (operatorChars$1.test(ch)) return "operator";
	else if (ch == ":") {
		eatPnLocal(stream);
		return "atom";
	} else if (ch == "@") {
		stream.eatWhile(/[a-z\d\-]/i);
		return "meta";
	} else if (PREFIX_START.test(ch) && stream.match(PREFIX_REMAINDER)) {
		eatPnLocal(stream);
		return "atom";
	}
	stream.eatWhile(/[_\w\d]/);
	var word = stream.current();
	if (ops.test(word)) return "builtin";
	else if (keywords$10.test(word)) return "keyword";
	else return "variable";
}
function eatPnLocal(stream) {
	stream.match(/(\.(?=[\w_\-\\%])|[:\w_-]|\\[-\\_~.!$&'()*+,;=/?#@%]|%[a-f\d][a-f\d])+/i);
}
function tokenLiteral$1(quote) {
	return function(stream, state) {
		var escaped = false, ch;
		while ((ch = stream.next()) != null) {
			if (ch == quote && !escaped) {
				state.tokenize = tokenBase$12;
				break;
			}
			escaped = !escaped && ch == "\\";
		}
		return "string";
	};
}
function pushContext$6(state, type, col) {
	state.context = {
		prev: state.context,
		indent: state.indent,
		col,
		type
	};
}
function popContext$6(state) {
	state.indent = state.context.indent;
	state.context = state.context.prev;
}
var sparql = {
	name: "sparql",
	startState: function() {
		return {
			tokenize: tokenBase$12,
			context: null,
			indent: 0,
			col: 0
		};
	},
	token: function(stream, state) {
		if (stream.sol()) {
			if (state.context && state.context.align == null) state.context.align = false;
			state.indent = stream.indentation();
		}
		if (stream.eatSpace()) return null;
		var style = state.tokenize(stream, state);
		if (style != "comment" && state.context && state.context.align == null && state.context.type != "pattern") state.context.align = true;
		if (curPunc$4 == "(") pushContext$6(state, ")", stream.column());
		else if (curPunc$4 == "[") pushContext$6(state, "]", stream.column());
		else if (curPunc$4 == "{") pushContext$6(state, "}", stream.column());
		else if (/[\]\}\)]/.test(curPunc$4)) {
			while (state.context && state.context.type == "pattern") popContext$6(state);
			if (state.context && curPunc$4 == state.context.type) {
				popContext$6(state);
				if (curPunc$4 == "}" && state.context && state.context.type == "pattern") popContext$6(state);
			}
		} else if (curPunc$4 == "." && state.context && state.context.type == "pattern") popContext$6(state);
		else if (/atom|string|variable/.test(style) && state.context) {
			if (/[\}\]]/.test(state.context.type)) pushContext$6(state, "pattern", stream.column());
			else if (state.context.type == "pattern" && !state.context.align) {
				state.context.align = true;
				state.context.col = stream.column();
			}
		}
		return style;
	},
	indent: function(state, textAfter, cx) {
		var firstChar = textAfter && textAfter.charAt(0);
		var context = state.context;
		if (/[\]\}]/.test(firstChar)) while (context && context.type == "pattern") context = context.prev;
		var closing = context && firstChar == context.type;
		if (!context) return 0;
		else if (context.type == "pattern") return context.col;
		else if (context.align) return context.col + (closing ? 0 : 1);
		else return context.indent + (closing ? 0 : cx.unit);
	},
	languageData: { commentTokens: { line: "#" } }
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/stylus.js
var tagKeywords_ = [
	"a",
	"abbr",
	"address",
	"area",
	"article",
	"aside",
	"audio",
	"b",
	"base",
	"bdi",
	"bdo",
	"bgsound",
	"blockquote",
	"body",
	"br",
	"button",
	"canvas",
	"caption",
	"cite",
	"code",
	"col",
	"colgroup",
	"data",
	"datalist",
	"dd",
	"del",
	"details",
	"dfn",
	"div",
	"dl",
	"dt",
	"em",
	"embed",
	"fieldset",
	"figcaption",
	"figure",
	"footer",
	"form",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"head",
	"header",
	"hgroup",
	"hr",
	"html",
	"i",
	"iframe",
	"img",
	"input",
	"ins",
	"kbd",
	"keygen",
	"label",
	"legend",
	"li",
	"link",
	"main",
	"map",
	"mark",
	"marquee",
	"menu",
	"menuitem",
	"meta",
	"meter",
	"nav",
	"nobr",
	"noframes",
	"noscript",
	"object",
	"ol",
	"optgroup",
	"option",
	"output",
	"p",
	"param",
	"pre",
	"progress",
	"q",
	"rp",
	"rt",
	"ruby",
	"s",
	"samp",
	"script",
	"section",
	"select",
	"small",
	"source",
	"span",
	"strong",
	"style",
	"sub",
	"summary",
	"sup",
	"table",
	"tbody",
	"td",
	"textarea",
	"tfoot",
	"th",
	"thead",
	"time",
	"tr",
	"track",
	"u",
	"ul",
	"var",
	"video"
];
var documentTypes_ = [
	"domain",
	"regexp",
	"url-prefix",
	"url"
];
var mediaTypes_ = [
	"all",
	"aural",
	"braille",
	"handheld",
	"print",
	"projection",
	"screen",
	"tty",
	"tv",
	"embossed"
];
var mediaFeatures_ = [
	"width",
	"min-width",
	"max-width",
	"height",
	"min-height",
	"max-height",
	"device-width",
	"min-device-width",
	"max-device-width",
	"device-height",
	"min-device-height",
	"max-device-height",
	"aspect-ratio",
	"min-aspect-ratio",
	"max-aspect-ratio",
	"device-aspect-ratio",
	"min-device-aspect-ratio",
	"max-device-aspect-ratio",
	"color",
	"min-color",
	"max-color",
	"color-index",
	"min-color-index",
	"max-color-index",
	"monochrome",
	"min-monochrome",
	"max-monochrome",
	"resolution",
	"min-resolution",
	"max-resolution",
	"scan",
	"grid",
	"dynamic-range",
	"video-dynamic-range"
];
var propertyKeywords_ = [
	"align-content",
	"align-items",
	"align-self",
	"alignment-adjust",
	"alignment-baseline",
	"anchor-point",
	"animation",
	"animation-delay",
	"animation-direction",
	"animation-duration",
	"animation-fill-mode",
	"animation-iteration-count",
	"animation-name",
	"animation-play-state",
	"animation-timing-function",
	"appearance",
	"azimuth",
	"backface-visibility",
	"background",
	"background-attachment",
	"background-clip",
	"background-color",
	"background-image",
	"background-origin",
	"background-position",
	"background-repeat",
	"background-size",
	"baseline-shift",
	"binding",
	"bleed",
	"bookmark-label",
	"bookmark-level",
	"bookmark-state",
	"bookmark-target",
	"border",
	"border-bottom",
	"border-bottom-color",
	"border-bottom-left-radius",
	"border-bottom-right-radius",
	"border-bottom-style",
	"border-bottom-width",
	"border-collapse",
	"border-color",
	"border-image",
	"border-image-outset",
	"border-image-repeat",
	"border-image-slice",
	"border-image-source",
	"border-image-width",
	"border-left",
	"border-left-color",
	"border-left-style",
	"border-left-width",
	"border-radius",
	"border-right",
	"border-right-color",
	"border-right-style",
	"border-right-width",
	"border-spacing",
	"border-style",
	"border-top",
	"border-top-color",
	"border-top-left-radius",
	"border-top-right-radius",
	"border-top-style",
	"border-top-width",
	"border-width",
	"bottom",
	"box-decoration-break",
	"box-shadow",
	"box-sizing",
	"break-after",
	"break-before",
	"break-inside",
	"caption-side",
	"clear",
	"clip",
	"color",
	"color-profile",
	"column-count",
	"column-fill",
	"column-gap",
	"column-rule",
	"column-rule-color",
	"column-rule-style",
	"column-rule-width",
	"column-span",
	"column-width",
	"columns",
	"content",
	"counter-increment",
	"counter-reset",
	"crop",
	"cue",
	"cue-after",
	"cue-before",
	"cursor",
	"direction",
	"display",
	"dominant-baseline",
	"drop-initial-after-adjust",
	"drop-initial-after-align",
	"drop-initial-before-adjust",
	"drop-initial-before-align",
	"drop-initial-size",
	"drop-initial-value",
	"elevation",
	"empty-cells",
	"fit",
	"fit-position",
	"flex",
	"flex-basis",
	"flex-direction",
	"flex-flow",
	"flex-grow",
	"flex-shrink",
	"flex-wrap",
	"float",
	"float-offset",
	"flow-from",
	"flow-into",
	"font",
	"font-feature-settings",
	"font-family",
	"font-kerning",
	"font-language-override",
	"font-size",
	"font-size-adjust",
	"font-stretch",
	"font-style",
	"font-synthesis",
	"font-variant",
	"font-variant-alternates",
	"font-variant-caps",
	"font-variant-east-asian",
	"font-variant-ligatures",
	"font-variant-numeric",
	"font-variant-position",
	"font-weight",
	"grid",
	"grid-area",
	"grid-auto-columns",
	"grid-auto-flow",
	"grid-auto-position",
	"grid-auto-rows",
	"grid-column",
	"grid-column-end",
	"grid-column-start",
	"grid-row",
	"grid-row-end",
	"grid-row-start",
	"grid-template",
	"grid-template-areas",
	"grid-template-columns",
	"grid-template-rows",
	"hanging-punctuation",
	"height",
	"hyphens",
	"icon",
	"image-orientation",
	"image-rendering",
	"image-resolution",
	"inline-box-align",
	"justify-content",
	"left",
	"letter-spacing",
	"line-break",
	"line-height",
	"line-stacking",
	"line-stacking-ruby",
	"line-stacking-shift",
	"line-stacking-strategy",
	"list-style",
	"list-style-image",
	"list-style-position",
	"list-style-type",
	"margin",
	"margin-bottom",
	"margin-left",
	"margin-right",
	"margin-top",
	"marker-offset",
	"marks",
	"marquee-direction",
	"marquee-loop",
	"marquee-play-count",
	"marquee-speed",
	"marquee-style",
	"max-height",
	"max-width",
	"min-height",
	"min-width",
	"move-to",
	"nav-down",
	"nav-index",
	"nav-left",
	"nav-right",
	"nav-up",
	"object-fit",
	"object-position",
	"opacity",
	"order",
	"orphans",
	"outline",
	"outline-color",
	"outline-offset",
	"outline-style",
	"outline-width",
	"overflow",
	"overflow-style",
	"overflow-wrap",
	"overflow-x",
	"overflow-y",
	"padding",
	"padding-bottom",
	"padding-left",
	"padding-right",
	"padding-top",
	"page",
	"page-break-after",
	"page-break-before",
	"page-break-inside",
	"page-policy",
	"pause",
	"pause-after",
	"pause-before",
	"perspective",
	"perspective-origin",
	"pitch",
	"pitch-range",
	"play-during",
	"position",
	"presentation-level",
	"punctuation-trim",
	"quotes",
	"region-break-after",
	"region-break-before",
	"region-break-inside",
	"region-fragment",
	"rendering-intent",
	"resize",
	"rest",
	"rest-after",
	"rest-before",
	"richness",
	"right",
	"rotation",
	"rotation-point",
	"ruby-align",
	"ruby-overhang",
	"ruby-position",
	"ruby-span",
	"shape-image-threshold",
	"shape-inside",
	"shape-margin",
	"shape-outside",
	"size",
	"speak",
	"speak-as",
	"speak-header",
	"speak-numeral",
	"speak-punctuation",
	"speech-rate",
	"stress",
	"string-set",
	"tab-size",
	"table-layout",
	"target",
	"target-name",
	"target-new",
	"target-position",
	"text-align",
	"text-align-last",
	"text-decoration",
	"text-decoration-color",
	"text-decoration-line",
	"text-decoration-skip",
	"text-decoration-style",
	"text-emphasis",
	"text-emphasis-color",
	"text-emphasis-position",
	"text-emphasis-style",
	"text-height",
	"text-indent",
	"text-justify",
	"text-outline",
	"text-overflow",
	"text-shadow",
	"text-size-adjust",
	"text-space-collapse",
	"text-transform",
	"text-underline-position",
	"text-wrap",
	"top",
	"transform",
	"transform-origin",
	"transform-style",
	"transition",
	"transition-delay",
	"transition-duration",
	"transition-property",
	"transition-timing-function",
	"unicode-bidi",
	"vertical-align",
	"visibility",
	"voice-balance",
	"voice-duration",
	"voice-family",
	"voice-pitch",
	"voice-range",
	"voice-rate",
	"voice-stress",
	"voice-volume",
	"volume",
	"white-space",
	"widows",
	"width",
	"will-change",
	"word-break",
	"word-spacing",
	"word-wrap",
	"z-index",
	"clip-path",
	"clip-rule",
	"mask",
	"enable-background",
	"filter",
	"flood-color",
	"flood-opacity",
	"lighting-color",
	"stop-color",
	"stop-opacity",
	"pointer-events",
	"color-interpolation",
	"color-interpolation-filters",
	"color-rendering",
	"fill",
	"fill-opacity",
	"fill-rule",
	"image-rendering",
	"marker",
	"marker-end",
	"marker-mid",
	"marker-start",
	"shape-rendering",
	"stroke",
	"stroke-dasharray",
	"stroke-dashoffset",
	"stroke-linecap",
	"stroke-linejoin",
	"stroke-miterlimit",
	"stroke-opacity",
	"stroke-width",
	"text-rendering",
	"baseline-shift",
	"dominant-baseline",
	"glyph-orientation-horizontal",
	"glyph-orientation-vertical",
	"text-anchor",
	"writing-mode",
	"font-smoothing",
	"osx-font-smoothing"
];
var nonStandardPropertyKeywords_ = [
	"scrollbar-arrow-color",
	"scrollbar-base-color",
	"scrollbar-dark-shadow-color",
	"scrollbar-face-color",
	"scrollbar-highlight-color",
	"scrollbar-shadow-color",
	"scrollbar-3d-light-color",
	"scrollbar-track-color",
	"shape-inside",
	"searchfield-cancel-button",
	"searchfield-decoration",
	"searchfield-results-button",
	"searchfield-results-decoration",
	"zoom"
];
var fontProperties_ = [
	"font-family",
	"src",
	"unicode-range",
	"font-variant",
	"font-feature-settings",
	"font-stretch",
	"font-weight",
	"font-style"
];
var colorKeywords_ = [
	"aliceblue",
	"antiquewhite",
	"aqua",
	"aquamarine",
	"azure",
	"beige",
	"bisque",
	"black",
	"blanchedalmond",
	"blue",
	"blueviolet",
	"brown",
	"burlywood",
	"cadetblue",
	"chartreuse",
	"chocolate",
	"coral",
	"cornflowerblue",
	"cornsilk",
	"crimson",
	"cyan",
	"darkblue",
	"darkcyan",
	"darkgoldenrod",
	"darkgray",
	"darkgreen",
	"darkkhaki",
	"darkmagenta",
	"darkolivegreen",
	"darkorange",
	"darkorchid",
	"darkred",
	"darksalmon",
	"darkseagreen",
	"darkslateblue",
	"darkslategray",
	"darkturquoise",
	"darkviolet",
	"deeppink",
	"deepskyblue",
	"dimgray",
	"dodgerblue",
	"firebrick",
	"floralwhite",
	"forestgreen",
	"fuchsia",
	"gainsboro",
	"ghostwhite",
	"gold",
	"goldenrod",
	"gray",
	"grey",
	"green",
	"greenyellow",
	"honeydew",
	"hotpink",
	"indianred",
	"indigo",
	"ivory",
	"khaki",
	"lavender",
	"lavenderblush",
	"lawngreen",
	"lemonchiffon",
	"lightblue",
	"lightcoral",
	"lightcyan",
	"lightgoldenrodyellow",
	"lightgray",
	"lightgreen",
	"lightpink",
	"lightsalmon",
	"lightseagreen",
	"lightskyblue",
	"lightslategray",
	"lightsteelblue",
	"lightyellow",
	"lime",
	"limegreen",
	"linen",
	"magenta",
	"maroon",
	"mediumaquamarine",
	"mediumblue",
	"mediumorchid",
	"mediumpurple",
	"mediumseagreen",
	"mediumslateblue",
	"mediumspringgreen",
	"mediumturquoise",
	"mediumvioletred",
	"midnightblue",
	"mintcream",
	"mistyrose",
	"moccasin",
	"navajowhite",
	"navy",
	"oldlace",
	"olive",
	"olivedrab",
	"orange",
	"orangered",
	"orchid",
	"palegoldenrod",
	"palegreen",
	"paleturquoise",
	"palevioletred",
	"papayawhip",
	"peachpuff",
	"peru",
	"pink",
	"plum",
	"powderblue",
	"purple",
	"rebeccapurple",
	"red",
	"rosybrown",
	"royalblue",
	"saddlebrown",
	"salmon",
	"sandybrown",
	"seagreen",
	"seashell",
	"sienna",
	"silver",
	"skyblue",
	"slateblue",
	"slategray",
	"snow",
	"springgreen",
	"steelblue",
	"tan",
	"teal",
	"thistle",
	"tomato",
	"turquoise",
	"violet",
	"wheat",
	"white",
	"whitesmoke",
	"yellow",
	"yellowgreen"
];
var valueKeywords_ = [
	"above",
	"absolute",
	"activeborder",
	"additive",
	"activecaption",
	"afar",
	"after-white-space",
	"ahead",
	"alias",
	"all",
	"all-scroll",
	"alphabetic",
	"alternate",
	"always",
	"amharic",
	"amharic-abegede",
	"antialiased",
	"appworkspace",
	"arabic-indic",
	"armenian",
	"asterisks",
	"attr",
	"auto",
	"avoid",
	"avoid-column",
	"avoid-page",
	"avoid-region",
	"background",
	"backwards",
	"baseline",
	"below",
	"bidi-override",
	"binary",
	"bengali",
	"blink",
	"block",
	"block-axis",
	"bold",
	"bolder",
	"border",
	"border-box",
	"both",
	"bottom",
	"break",
	"break-all",
	"break-word",
	"bullets",
	"button",
	"buttonface",
	"buttonhighlight",
	"buttonshadow",
	"buttontext",
	"calc",
	"cambodian",
	"capitalize",
	"caps-lock-indicator",
	"caption",
	"captiontext",
	"caret",
	"cell",
	"center",
	"checkbox",
	"circle",
	"cjk-decimal",
	"cjk-earthly-branch",
	"cjk-heavenly-stem",
	"cjk-ideographic",
	"clear",
	"clip",
	"close-quote",
	"col-resize",
	"collapse",
	"column",
	"compact",
	"condensed",
	"conic-gradient",
	"contain",
	"content",
	"contents",
	"content-box",
	"context-menu",
	"continuous",
	"copy",
	"counter",
	"counters",
	"cover",
	"crop",
	"cross",
	"crosshair",
	"currentcolor",
	"cursive",
	"cyclic",
	"dashed",
	"decimal",
	"decimal-leading-zero",
	"default",
	"default-button",
	"destination-atop",
	"destination-in",
	"destination-out",
	"destination-over",
	"devanagari",
	"disc",
	"discard",
	"disclosure-closed",
	"disclosure-open",
	"document",
	"dot-dash",
	"dot-dot-dash",
	"dotted",
	"double",
	"down",
	"e-resize",
	"ease",
	"ease-in",
	"ease-in-out",
	"ease-out",
	"element",
	"ellipse",
	"ellipsis",
	"embed",
	"end",
	"ethiopic",
	"ethiopic-abegede",
	"ethiopic-abegede-am-et",
	"ethiopic-abegede-gez",
	"ethiopic-abegede-ti-er",
	"ethiopic-abegede-ti-et",
	"ethiopic-halehame-aa-er",
	"ethiopic-halehame-aa-et",
	"ethiopic-halehame-am-et",
	"ethiopic-halehame-gez",
	"ethiopic-halehame-om-et",
	"ethiopic-halehame-sid-et",
	"ethiopic-halehame-so-et",
	"ethiopic-halehame-ti-er",
	"ethiopic-halehame-ti-et",
	"ethiopic-halehame-tig",
	"ethiopic-numeric",
	"ew-resize",
	"expanded",
	"extends",
	"extra-condensed",
	"extra-expanded",
	"fantasy",
	"fast",
	"fill",
	"fixed",
	"flat",
	"flex",
	"footnotes",
	"forwards",
	"from",
	"geometricPrecision",
	"georgian",
	"graytext",
	"groove",
	"gujarati",
	"gurmukhi",
	"hand",
	"hangul",
	"hangul-consonant",
	"hebrew",
	"help",
	"hidden",
	"hide",
	"high",
	"higher",
	"highlight",
	"highlighttext",
	"hiragana",
	"hiragana-iroha",
	"horizontal",
	"hsl",
	"hsla",
	"icon",
	"ignore",
	"inactiveborder",
	"inactivecaption",
	"inactivecaptiontext",
	"infinite",
	"infobackground",
	"infotext",
	"inherit",
	"initial",
	"inline",
	"inline-axis",
	"inline-block",
	"inline-flex",
	"inline-table",
	"inset",
	"inside",
	"intrinsic",
	"invert",
	"italic",
	"japanese-formal",
	"japanese-informal",
	"justify",
	"kannada",
	"katakana",
	"katakana-iroha",
	"keep-all",
	"khmer",
	"korean-hangul-formal",
	"korean-hanja-formal",
	"korean-hanja-informal",
	"landscape",
	"lao",
	"large",
	"larger",
	"left",
	"level",
	"lighter",
	"line-through",
	"linear",
	"linear-gradient",
	"lines",
	"list-item",
	"listbox",
	"listitem",
	"local",
	"logical",
	"loud",
	"lower",
	"lower-alpha",
	"lower-armenian",
	"lower-greek",
	"lower-hexadecimal",
	"lower-latin",
	"lower-norwegian",
	"lower-roman",
	"lowercase",
	"ltr",
	"malayalam",
	"match",
	"matrix",
	"matrix3d",
	"media-play-button",
	"media-slider",
	"media-sliderthumb",
	"media-volume-slider",
	"media-volume-sliderthumb",
	"medium",
	"menu",
	"menulist",
	"menulist-button",
	"menutext",
	"message-box",
	"middle",
	"min-intrinsic",
	"mix",
	"mongolian",
	"monospace",
	"move",
	"multiple",
	"myanmar",
	"n-resize",
	"narrower",
	"ne-resize",
	"nesw-resize",
	"no-close-quote",
	"no-drop",
	"no-open-quote",
	"no-repeat",
	"none",
	"normal",
	"not-allowed",
	"nowrap",
	"ns-resize",
	"numbers",
	"numeric",
	"nw-resize",
	"nwse-resize",
	"oblique",
	"octal",
	"open-quote",
	"optimizeLegibility",
	"optimizeSpeed",
	"oriya",
	"oromo",
	"outset",
	"outside",
	"outside-shape",
	"overlay",
	"overline",
	"padding",
	"padding-box",
	"painted",
	"page",
	"paused",
	"persian",
	"perspective",
	"plus-darker",
	"plus-lighter",
	"pointer",
	"polygon",
	"portrait",
	"pre",
	"pre-line",
	"pre-wrap",
	"preserve-3d",
	"progress",
	"push-button",
	"radial-gradient",
	"radio",
	"read-only",
	"read-write",
	"read-write-plaintext-only",
	"rectangle",
	"region",
	"relative",
	"repeat",
	"repeating-linear-gradient",
	"repeating-radial-gradient",
	"repeating-conic-gradient",
	"repeat-x",
	"repeat-y",
	"reset",
	"reverse",
	"rgb",
	"rgba",
	"ridge",
	"right",
	"rotate",
	"rotate3d",
	"rotateX",
	"rotateY",
	"rotateZ",
	"round",
	"row-resize",
	"rtl",
	"run-in",
	"running",
	"s-resize",
	"sans-serif",
	"scale",
	"scale3d",
	"scaleX",
	"scaleY",
	"scaleZ",
	"scroll",
	"scrollbar",
	"scroll-position",
	"se-resize",
	"searchfield",
	"searchfield-cancel-button",
	"searchfield-decoration",
	"searchfield-results-button",
	"searchfield-results-decoration",
	"semi-condensed",
	"semi-expanded",
	"separate",
	"serif",
	"show",
	"sidama",
	"simp-chinese-formal",
	"simp-chinese-informal",
	"single",
	"skew",
	"skewX",
	"skewY",
	"skip-white-space",
	"slide",
	"slider-horizontal",
	"slider-vertical",
	"sliderthumb-horizontal",
	"sliderthumb-vertical",
	"slow",
	"small",
	"small-caps",
	"small-caption",
	"smaller",
	"solid",
	"somali",
	"source-atop",
	"source-in",
	"source-out",
	"source-over",
	"space",
	"spell-out",
	"square",
	"square-button",
	"standard",
	"start",
	"static",
	"status-bar",
	"stretch",
	"stroke",
	"sub",
	"subpixel-antialiased",
	"super",
	"sw-resize",
	"symbolic",
	"symbols",
	"table",
	"table-caption",
	"table-cell",
	"table-column",
	"table-column-group",
	"table-footer-group",
	"table-header-group",
	"table-row",
	"table-row-group",
	"tamil",
	"telugu",
	"text",
	"text-bottom",
	"text-top",
	"textarea",
	"textfield",
	"thai",
	"thick",
	"thin",
	"threeddarkshadow",
	"threedface",
	"threedhighlight",
	"threedlightshadow",
	"threedshadow",
	"tibetan",
	"tigre",
	"tigrinya-er",
	"tigrinya-er-abegede",
	"tigrinya-et",
	"tigrinya-et-abegede",
	"to",
	"top",
	"trad-chinese-formal",
	"trad-chinese-informal",
	"translate",
	"translate3d",
	"translateX",
	"translateY",
	"translateZ",
	"transparent",
	"ultra-condensed",
	"ultra-expanded",
	"underline",
	"up",
	"upper-alpha",
	"upper-armenian",
	"upper-greek",
	"upper-hexadecimal",
	"upper-latin",
	"upper-norwegian",
	"upper-roman",
	"uppercase",
	"urdu",
	"url",
	"var",
	"vertical",
	"vertical-text",
	"visible",
	"visibleFill",
	"visiblePainted",
	"visibleStroke",
	"visual",
	"w-resize",
	"wait",
	"wave",
	"wider",
	"window",
	"windowframe",
	"windowtext",
	"words",
	"x-large",
	"x-small",
	"xor",
	"xx-large",
	"xx-small",
	"bicubic",
	"optimizespeed",
	"grayscale",
	"row",
	"row-reverse",
	"wrap",
	"wrap-reverse",
	"column-reverse",
	"flex-start",
	"flex-end",
	"space-between",
	"space-around",
	"unset"
];
var wordOperatorKeywords_ = [
	"in",
	"and",
	"or",
	"not",
	"is not",
	"is a",
	"is",
	"isnt",
	"defined",
	"if unless"
];
var blockKeywords_ = [
	"for",
	"if",
	"else",
	"unless",
	"from",
	"to"
];
var commonAtoms_ = [
	"null",
	"true",
	"false",
	"href",
	"title",
	"type",
	"not-allowed",
	"readonly",
	"disabled"
];
var hintWords = tagKeywords_.concat(documentTypes_, mediaTypes_, mediaFeatures_, propertyKeywords_, nonStandardPropertyKeywords_, colorKeywords_, valueKeywords_, fontProperties_, wordOperatorKeywords_, blockKeywords_, commonAtoms_, [
	"@font-face",
	"@keyframes",
	"@media",
	"@viewport",
	"@page",
	"@host",
	"@supports",
	"@block",
	"@css"
]);
function wordRegexp$4(words) {
	words = words.sort(function(a, b) {
		return b > a;
	});
	return new RegExp("^((" + words.join(")|(") + "))\\b");
}
function keySet(array) {
	var keys = {};
	for (var i = 0; i < array.length; ++i) keys[array[i]] = true;
	return keys;
}
function escapeRegExp(text) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
var tagKeywords = keySet(tagKeywords_);
var tagVariablesRegexp = /^(a|b|i|s|col|em)$/i;
var propertyKeywords = keySet(propertyKeywords_);
var nonStandardPropertyKeywords = keySet(nonStandardPropertyKeywords_);
var valueKeywords = keySet(valueKeywords_);
var colorKeywords = keySet(colorKeywords_);
var documentTypes = keySet(documentTypes_);
var documentTypesRegexp = wordRegexp$4(documentTypes_);
var mediaFeatures = keySet(mediaFeatures_);
var mediaTypes = keySet(mediaTypes_);
var fontProperties = keySet(fontProperties_);
var operatorsRegexp = /^\s*([.]{2,3}|&&|\|\||\*\*|[?!=:]?=|[-+*\/%<>]=?|\?:|\~)/;
var wordOperatorKeywordsRegexp = wordRegexp$4(wordOperatorKeywords_);
var blockKeywords$1 = keySet(blockKeywords_);
var vendorPrefixesRegexp = /* @__PURE__ */ new RegExp(/^\-(moz|ms|o|webkit)-/i);
var commonAtoms = keySet(commonAtoms_);
var firstWordMatch = "";
var states = {};
var ch;
var style;
var type;
var override;
/**
* Tokenizers
*/
function tokenBase$11(stream, state) {
	firstWordMatch = stream.string.match(/(^[\w-]+\s*=\s*$)|(^\s*[\w-]+\s*=\s*[\w-])|(^\s*(\.|#|@|\$|\&|\[|\d|\+|::?|\{|\>|~|\/)?\s*[\w-]*([a-z0-9-]|\*|\/\*)(\(|,)?)/);
	state.context.line.firstWord = firstWordMatch ? firstWordMatch[0].replace(/^\s*/, "") : "";
	state.context.line.indent = stream.indentation();
	ch = stream.peek();
	if (stream.match("//")) {
		stream.skipToEnd();
		return ["comment", "comment"];
	}
	if (stream.match("/*")) {
		state.tokenize = tokenCComment;
		return tokenCComment(stream, state);
	}
	if (ch == "\"" || ch == "'") {
		stream.next();
		state.tokenize = tokenString$8(ch);
		return state.tokenize(stream, state);
	}
	if (ch == "@") {
		stream.next();
		stream.eatWhile(/[\w\\-]/);
		return ["def", stream.current()];
	}
	if (ch == "#") {
		stream.next();
		if (stream.match(/^[0-9a-f]{3}([0-9a-f]([0-9a-f]{2}){0,2})?\b(?!-)/i)) return ["atom", "atom"];
		if (stream.match(/^[a-z][\w-]*/i)) return ["builtin", "hash"];
	}
	if (stream.match(vendorPrefixesRegexp)) return ["meta", "vendor-prefixes"];
	if (stream.match(/^-?[0-9]?\.?[0-9]/)) {
		stream.eatWhile(/[a-z%]/i);
		return ["number", "unit"];
	}
	if (ch == "!") {
		stream.next();
		return [stream.match(/^(important|optional)/i) ? "keyword" : "operator", "important"];
	}
	if (ch == "." && stream.match(/^\.[a-z][\w-]*/i)) return ["qualifier", "qualifier"];
	if (stream.match(documentTypesRegexp)) {
		if (stream.peek() == "(") state.tokenize = tokenParenthesized;
		return ["property", "word"];
	}
	if (stream.match(/^[a-z][\w-]*\(/i)) {
		stream.backUp(1);
		return ["keyword", "mixin"];
	}
	if (stream.match(/^(\+|-)[a-z][\w-]*\(/i)) {
		stream.backUp(1);
		return ["keyword", "block-mixin"];
	}
	if (stream.string.match(/^\s*&/) && stream.match(/^[-_]+[a-z][\w-]*/)) return ["qualifier", "qualifier"];
	if (stream.match(/^(\/|&)(-|_|:|\.|#|[a-z])/)) {
		stream.backUp(1);
		return ["variableName.special", "reference"];
	}
	if (stream.match(/^&{1}\s*$/)) return ["variableName.special", "reference"];
	if (stream.match(wordOperatorKeywordsRegexp)) return ["operator", "operator"];
	if (stream.match(/^\$?[-_]*[a-z0-9]+[\w-]*/i)) {
		if (stream.match(/^(\.|\[)[\w-\'\"\]]+/i, false)) {
			if (!wordIsTag(stream.current())) {
				stream.match(".");
				return ["variable", "variable-name"];
			}
		}
		return ["variable", "word"];
	}
	if (stream.match(operatorsRegexp)) return ["operator", stream.current()];
	if (/[:;,{}\[\]\(\)]/.test(ch)) {
		stream.next();
		return [null, ch];
	}
	stream.next();
	return [null, null];
}
/**
* Token comment
*/
function tokenCComment(stream, state) {
	var maybeEnd = false, ch;
	while ((ch = stream.next()) != null) {
		if (maybeEnd && ch == "/") {
			state.tokenize = null;
			break;
		}
		maybeEnd = ch == "*";
	}
	return ["comment", "comment"];
}
/**
* Token string
*/
function tokenString$8(quote) {
	return function(stream, state) {
		var escaped = false, ch;
		while ((ch = stream.next()) != null) {
			if (ch == quote && !escaped) {
				if (quote == ")") stream.backUp(1);
				break;
			}
			escaped = !escaped && ch == "\\";
		}
		if (ch == quote || !escaped && quote != ")") state.tokenize = null;
		return ["string", "string"];
	};
}
/**
* Token parenthesized
*/
function tokenParenthesized(stream, state) {
	stream.next();
	if (!stream.match(/\s*[\"\')]/, false)) state.tokenize = tokenString$8(")");
	else state.tokenize = null;
	return [null, "("];
}
/**
* Context management
*/
function Context$4(type, indent, prev, line) {
	this.type = type;
	this.indent = indent;
	this.prev = prev;
	this.line = line || {
		firstWord: "",
		indent: 0
	};
}
function pushContext$5(state, stream, type, indent) {
	indent = indent >= 0 ? indent : stream.indentUnit;
	state.context = new Context$4(type, stream.indentation() + indent, state.context);
	return type;
}
function popContext$5(state, stream, currentIndent) {
	var contextIndent = state.context.indent - stream.indentUnit;
	currentIndent = currentIndent || false;
	state.context = state.context.prev;
	if (currentIndent) state.context.indent = contextIndent;
	return state.context.type;
}
function pass(type, stream, state) {
	return states[state.context.type](type, stream, state);
}
function popAndPass(type, stream, state, n) {
	for (var i = n || 1; i > 0; i--) state.context = state.context.prev;
	return pass(type, stream, state);
}
/**
* Parser
*/
function wordIsTag(word) {
	return word.toLowerCase() in tagKeywords;
}
function wordIsProperty(word) {
	word = word.toLowerCase();
	return word in propertyKeywords || word in fontProperties;
}
function wordIsBlock(word) {
	return word.toLowerCase() in blockKeywords$1;
}
function wordIsVendorPrefix(word) {
	return word.toLowerCase().match(vendorPrefixesRegexp);
}
function wordAsValue(word) {
	var wordLC = word.toLowerCase();
	var override = "variable";
	if (wordIsTag(word)) override = "tag";
	else if (wordIsBlock(word)) override = "block-keyword";
	else if (wordIsProperty(word)) override = "property";
	else if (wordLC in valueKeywords || wordLC in commonAtoms) override = "atom";
	else if (wordLC == "return" || wordLC in colorKeywords) override = "keyword";
	else if (word.match(/^[A-Z]/)) override = "string";
	return override;
}
function typeIsBlock(type, stream) {
	return endOfLine(stream) && (type == "{" || type == "]" || type == "hash" || type == "qualifier") || type == "block-mixin";
}
function typeIsInterpolation(type, stream) {
	return type == "{" && stream.match(/^\s*\$?[\w-]+/i, false);
}
function typeIsPseudo(type, stream) {
	return type == ":" && stream.match(/^[a-z-]+/, false);
}
function startOfLine(stream) {
	return stream.sol() || stream.string.match(new RegExp("^\\s*" + escapeRegExp(stream.current())));
}
function endOfLine(stream) {
	return stream.eol() || stream.match(/^\s*$/, false);
}
function firstWordOfLine(line) {
	var re = /^\s*[-_]*[a-z0-9]+[\w-]*/i;
	var result = typeof line == "string" ? line.match(re) : line.string.match(re);
	return result ? result[0].replace(/^\s*/, "") : "";
}
/**
* Block
*/
states.block = function(type, stream, state) {
	if (type == "comment" && startOfLine(stream) || type == "," && endOfLine(stream) || type == "mixin") return pushContext$5(state, stream, "block", 0);
	if (typeIsInterpolation(type, stream)) return pushContext$5(state, stream, "interpolation");
	if (endOfLine(stream) && type == "]") {
		if (!/^\s*(\.|#|:|\[|\*|&)/.test(stream.string) && !wordIsTag(firstWordOfLine(stream))) return pushContext$5(state, stream, "block", 0);
	}
	if (typeIsBlock(type, stream)) return pushContext$5(state, stream, "block");
	if (type == "}" && endOfLine(stream)) return pushContext$5(state, stream, "block", 0);
	if (type == "variable-name") {
		if (stream.string.match(/^\s?\$[\w-\.\[\]\'\"]+$/) || wordIsBlock(firstWordOfLine(stream))) return pushContext$5(state, stream, "variableName");
		else return pushContext$5(state, stream, "variableName", 0);
	}
	if (type == "=") {
		if (!endOfLine(stream) && !wordIsBlock(firstWordOfLine(stream))) return pushContext$5(state, stream, "block", 0);
		return pushContext$5(state, stream, "block");
	}
	if (type == "*") {
		if (endOfLine(stream) || stream.match(/\s*(,|\.|#|\[|:|{)/, false)) {
			override = "tag";
			return pushContext$5(state, stream, "block");
		}
	}
	if (typeIsPseudo(type, stream)) return pushContext$5(state, stream, "pseudo");
	if (/@(font-face|media|supports|(-moz-)?document)/.test(type)) return pushContext$5(state, stream, endOfLine(stream) ? "block" : "atBlock");
	if (/@(-(moz|ms|o|webkit)-)?keyframes$/.test(type)) return pushContext$5(state, stream, "keyframes");
	if (/@extends?/.test(type)) return pushContext$5(state, stream, "extend", 0);
	if (type && type.charAt(0) == "@") {
		if (stream.indentation() > 0 && wordIsProperty(stream.current().slice(1))) {
			override = "variable";
			return "block";
		}
		if (/(@import|@require|@charset)/.test(type)) return pushContext$5(state, stream, "block", 0);
		return pushContext$5(state, stream, "block");
	}
	if (type == "reference" && endOfLine(stream)) return pushContext$5(state, stream, "block");
	if (type == "(") return pushContext$5(state, stream, "parens");
	if (type == "vendor-prefixes") return pushContext$5(state, stream, "vendorPrefixes");
	if (type == "word") {
		var word = stream.current();
		override = wordAsValue(word);
		if (override == "property") {
			if (startOfLine(stream)) return pushContext$5(state, stream, "block", 0);
			else {
				override = "atom";
				return "block";
			}
		}
		if (override == "tag") {
			if (/embed|menu|pre|progress|sub|table/.test(word)) {
				if (wordIsProperty(firstWordOfLine(stream))) {
					override = "atom";
					return "block";
				}
			}
			if (stream.string.match(new RegExp("\\[\\s*" + word + "|" + word + "\\s*\\]"))) {
				override = "atom";
				return "block";
			}
			if (tagVariablesRegexp.test(word)) {
				if (startOfLine(stream) && stream.string.match(/=/) || !startOfLine(stream) && !stream.string.match(/^(\s*\.|#|\&|\[|\/|>|\*)/) && !wordIsTag(firstWordOfLine(stream))) {
					override = "variable";
					if (wordIsBlock(firstWordOfLine(stream))) return "block";
					return pushContext$5(state, stream, "block", 0);
				}
			}
			if (endOfLine(stream)) return pushContext$5(state, stream, "block");
		}
		if (override == "block-keyword") {
			override = "keyword";
			if (stream.current(/(if|unless)/) && !startOfLine(stream)) return "block";
			return pushContext$5(state, stream, "block");
		}
		if (word == "return") return pushContext$5(state, stream, "block", 0);
		if (override == "variable" && stream.string.match(/^\s?\$[\w-\.\[\]\'\"]+$/)) return pushContext$5(state, stream, "block");
	}
	return state.context.type;
};
/**
* Parens
*/
states.parens = function(type, stream, state) {
	if (type == "(") return pushContext$5(state, stream, "parens");
	if (type == ")") {
		if (state.context.prev.type == "parens") return popContext$5(state, stream);
		if (stream.string.match(/^[a-z][\w-]*\(/i) && endOfLine(stream) || wordIsBlock(firstWordOfLine(stream)) || /(\.|#|:|\[|\*|&|>|~|\+|\/)/.test(firstWordOfLine(stream)) || !stream.string.match(/^-?[a-z][\w-\.\[\]\'\"]*\s*=/) && wordIsTag(firstWordOfLine(stream))) return pushContext$5(state, stream, "block");
		if (stream.string.match(/^[\$-]?[a-z][\w-\.\[\]\'\"]*\s*=/) || stream.string.match(/^\s*(\(|\)|[0-9])/) || stream.string.match(/^\s+[a-z][\w-]*\(/i) || stream.string.match(/^\s+[\$-]?[a-z]/i)) return pushContext$5(state, stream, "block", 0);
		if (endOfLine(stream)) return pushContext$5(state, stream, "block");
		else return pushContext$5(state, stream, "block", 0);
	}
	if (type && type.charAt(0) == "@" && wordIsProperty(stream.current().slice(1))) override = "variable";
	if (type == "word") {
		var word = stream.current();
		override = wordAsValue(word);
		if (override == "tag" && tagVariablesRegexp.test(word)) override = "variable";
		if (override == "property" || word == "to") override = "atom";
	}
	if (type == "variable-name") return pushContext$5(state, stream, "variableName");
	if (typeIsPseudo(type, stream)) return pushContext$5(state, stream, "pseudo");
	return state.context.type;
};
/**
* Vendor prefixes
*/
states.vendorPrefixes = function(type, stream, state) {
	if (type == "word") {
		override = "property";
		return pushContext$5(state, stream, "block", 0);
	}
	return popContext$5(state, stream);
};
/**
* Pseudo
*/
states.pseudo = function(type, stream, state) {
	if (!wordIsProperty(firstWordOfLine(stream.string))) {
		stream.match(/^[a-z-]+/);
		override = "variableName.special";
		if (endOfLine(stream)) return pushContext$5(state, stream, "block");
		return popContext$5(state, stream);
	}
	return popAndPass(type, stream, state);
};
/**
* atBlock
*/
states.atBlock = function(type, stream, state) {
	if (type == "(") return pushContext$5(state, stream, "atBlock_parens");
	if (typeIsBlock(type, stream)) return pushContext$5(state, stream, "block");
	if (typeIsInterpolation(type, stream)) return pushContext$5(state, stream, "interpolation");
	if (type == "word") {
		var word = stream.current().toLowerCase();
		if (/^(only|not|and|or)$/.test(word)) override = "keyword";
		else if (documentTypes.hasOwnProperty(word)) override = "tag";
		else if (mediaTypes.hasOwnProperty(word)) override = "attribute";
		else if (mediaFeatures.hasOwnProperty(word)) override = "property";
		else if (nonStandardPropertyKeywords.hasOwnProperty(word)) override = "string.special";
		else override = wordAsValue(stream.current());
		if (override == "tag" && endOfLine(stream)) return pushContext$5(state, stream, "block");
	}
	if (type == "operator" && /^(not|and|or)$/.test(stream.current())) override = "keyword";
	return state.context.type;
};
states.atBlock_parens = function(type, stream, state) {
	if (type == "{" || type == "}") return state.context.type;
	if (type == ")") {
		if (endOfLine(stream)) return pushContext$5(state, stream, "block");
		else return pushContext$5(state, stream, "atBlock");
	}
	if (type == "word") {
		var word = stream.current().toLowerCase();
		override = wordAsValue(word);
		if (/^(max|min)/.test(word)) override = "property";
		if (override == "tag") tagVariablesRegexp.test(word) ? override = "variable" : override = "atom";
		return state.context.type;
	}
	return states.atBlock(type, stream, state);
};
/**
* Keyframes
*/
states.keyframes = function(type, stream, state) {
	if (stream.indentation() == "0" && (type == "}" && startOfLine(stream) || type == "]" || type == "hash" || type == "qualifier" || wordIsTag(stream.current()))) return popAndPass(type, stream, state);
	if (type == "{") return pushContext$5(state, stream, "keyframes");
	if (type == "}") {
		if (startOfLine(stream)) return popContext$5(state, stream, true);
		else return pushContext$5(state, stream, "keyframes");
	}
	if (type == "unit" && /^[0-9]+\%$/.test(stream.current())) return pushContext$5(state, stream, "keyframes");
	if (type == "word") {
		override = wordAsValue(stream.current());
		if (override == "block-keyword") {
			override = "keyword";
			return pushContext$5(state, stream, "keyframes");
		}
	}
	if (/@(font-face|media|supports|(-moz-)?document)/.test(type)) return pushContext$5(state, stream, endOfLine(stream) ? "block" : "atBlock");
	if (type == "mixin") return pushContext$5(state, stream, "block", 0);
	return state.context.type;
};
/**
* Interpolation
*/
states.interpolation = function(type, stream, state) {
	if (type == "{") popContext$5(state, stream) && pushContext$5(state, stream, "block");
	if (type == "}") {
		if (stream.string.match(/^\s*(\.|#|:|\[|\*|&|>|~|\+|\/)/i) || stream.string.match(/^\s*[a-z]/i) && wordIsTag(firstWordOfLine(stream))) return pushContext$5(state, stream, "block");
		if (!stream.string.match(/^(\{|\s*\&)/) || stream.match(/\s*[\w-]/, false)) return pushContext$5(state, stream, "block", 0);
		return pushContext$5(state, stream, "block");
	}
	if (type == "variable-name") return pushContext$5(state, stream, "variableName", 0);
	if (type == "word") {
		override = wordAsValue(stream.current());
		if (override == "tag") override = "atom";
	}
	return state.context.type;
};
/**
* Extend/s
*/
states.extend = function(type, stream, state) {
	if (type == "[" || type == "=") return "extend";
	if (type == "]") return popContext$5(state, stream);
	if (type == "word") {
		override = wordAsValue(stream.current());
		return "extend";
	}
	return popContext$5(state, stream);
};
/**
* Variable name
*/
states.variableName = function(type, stream, state) {
	if (type == "string" || type == "[" || type == "]" || stream.current().match(/^(\.|\$)/)) {
		if (stream.current().match(/^\.[\w-]+/i)) override = "variable";
		return "variableName";
	}
	return popAndPass(type, stream, state);
};
var stylus = {
	name: "stylus",
	startState: function() {
		return {
			tokenize: null,
			state: "block",
			context: new Context$4("block", 0, null)
		};
	},
	token: function(stream, state) {
		if (!state.tokenize && stream.eatSpace()) return null;
		style = (state.tokenize || tokenBase$11)(stream, state);
		if (style && typeof style == "object") {
			type = style[1];
			style = style[0];
		}
		override = style;
		state.state = states[state.state](type, stream, state);
		return override;
	},
	indent: function(state, textAfter, iCx) {
		var cx = state.context, ch = textAfter && textAfter.charAt(0), indent = cx.indent, lineFirstWord = firstWordOfLine(textAfter), lineIndent = cx.line.indent, prevLineFirstWord = state.context.prev ? state.context.prev.line.firstWord : "", prevLineIndent = state.context.prev ? state.context.prev.line.indent : lineIndent;
		if (cx.prev && (ch == "}" && (cx.type == "block" || cx.type == "atBlock" || cx.type == "keyframes") || ch == ")" && (cx.type == "parens" || cx.type == "atBlock_parens") || ch == "{" && cx.type == "at")) indent = cx.indent - iCx.unit;
		else if (!/(\})/.test(ch)) {
			if (/@|\$|\d/.test(ch) || /^\{/.test(textAfter) || /^\s*\/(\/|\*)/.test(textAfter) || /^\s*\/\*/.test(prevLineFirstWord) || /^\s*[\w-\.\[\]\'\"]+\s*(\?|:|\+)?=/i.test(textAfter) || /^(\+|-)?[a-z][\w-]*\(/i.test(textAfter) || /^return/.test(textAfter) || wordIsBlock(lineFirstWord)) indent = lineIndent;
			else if (/(\.|#|:|\[|\*|&|>|~|\+|\/)/.test(ch) || wordIsTag(lineFirstWord)) {
				if (/\,\s*$/.test(prevLineFirstWord)) indent = prevLineIndent;
				else if (/(\.|#|:|\[|\*|&|>|~|\+|\/)/.test(prevLineFirstWord) || wordIsTag(prevLineFirstWord)) indent = lineIndent <= prevLineIndent ? prevLineIndent : prevLineIndent + iCx.unit;
				else indent = lineIndent;
			} else if (!/,\s*$/.test(textAfter) && (wordIsVendorPrefix(lineFirstWord) || wordIsProperty(lineFirstWord))) {
				if (wordIsBlock(prevLineFirstWord)) indent = lineIndent <= prevLineIndent ? prevLineIndent : prevLineIndent + iCx.unit;
				else if (/^\{/.test(prevLineFirstWord)) indent = lineIndent <= prevLineIndent ? lineIndent : prevLineIndent + iCx.unit;
				else if (wordIsVendorPrefix(prevLineFirstWord) || wordIsProperty(prevLineFirstWord)) indent = lineIndent >= prevLineIndent ? prevLineIndent : lineIndent;
				else if (/^(\.|#|:|\[|\*|&|@|\+|\-|>|~|\/)/.test(prevLineFirstWord) || /=\s*$/.test(prevLineFirstWord) || wordIsTag(prevLineFirstWord) || /^\$[\w-\.\[\]\'\"]/.test(prevLineFirstWord)) indent = prevLineIndent + iCx.unit;
				else indent = lineIndent;
			}
		}
		return indent;
	},
	languageData: {
		indentOnInput: /^\s*\}$/,
		commentTokens: {
			line: "//",
			block: {
				open: "/*",
				close: "*/"
			}
		},
		autocomplete: hintWords
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/swift.js
function wordSet(words) {
	var set = {};
	for (var i = 0; i < words.length; i++) set[words[i]] = true;
	return set;
}
var keywords$9 = wordSet([
	"_",
	"var",
	"let",
	"actor",
	"class",
	"enum",
	"extension",
	"import",
	"protocol",
	"struct",
	"func",
	"typealias",
	"associatedtype",
	"open",
	"public",
	"internal",
	"fileprivate",
	"private",
	"deinit",
	"init",
	"new",
	"override",
	"self",
	"subscript",
	"super",
	"convenience",
	"dynamic",
	"final",
	"indirect",
	"lazy",
	"required",
	"static",
	"unowned",
	"unowned(safe)",
	"unowned(unsafe)",
	"weak",
	"as",
	"is",
	"break",
	"case",
	"continue",
	"default",
	"else",
	"fallthrough",
	"for",
	"guard",
	"if",
	"in",
	"repeat",
	"switch",
	"where",
	"while",
	"defer",
	"return",
	"inout",
	"mutating",
	"nonmutating",
	"isolated",
	"nonisolated",
	"catch",
	"do",
	"rethrows",
	"throw",
	"throws",
	"async",
	"await",
	"try",
	"didSet",
	"get",
	"set",
	"willSet",
	"assignment",
	"associativity",
	"infix",
	"left",
	"none",
	"operator",
	"postfix",
	"precedence",
	"precedencegroup",
	"prefix",
	"right",
	"Any",
	"AnyObject",
	"Type",
	"dynamicType",
	"Self",
	"Protocol",
	"__COLUMN__",
	"__FILE__",
	"__FUNCTION__",
	"__LINE__"
]);
var definingKeywords = wordSet([
	"var",
	"let",
	"actor",
	"class",
	"enum",
	"extension",
	"import",
	"protocol",
	"struct",
	"func",
	"typealias",
	"associatedtype",
	"for"
]);
var atoms$2 = wordSet([
	"true",
	"false",
	"nil",
	"self",
	"super",
	"_"
]);
var types$3 = wordSet([
	"Array",
	"Bool",
	"Character",
	"Dictionary",
	"Double",
	"Float",
	"Int",
	"Int8",
	"Int16",
	"Int32",
	"Int64",
	"Never",
	"Optional",
	"Set",
	"String",
	"UInt8",
	"UInt16",
	"UInt32",
	"UInt64",
	"Void"
]);
var operators = "+-/*%=|&<>~^?!";
var punc = ":;,.(){}[]";
var binary = /^\-?0b[01][01_]*/;
var octal = /^\-?0o[0-7][0-7_]*/;
var hexadecimal = /^\-?0x[\dA-Fa-f][\dA-Fa-f_]*(?:(?:\.[\dA-Fa-f][\dA-Fa-f_]*)?[Pp]\-?\d[\d_]*)?/;
var decimal = /^\-?\d[\d_]*(?:\.\d[\d_]*)?(?:[Ee]\-?\d[\d_]*)?/;
var identifier = /^\$\d+|(`?)[_A-Za-z][_A-Za-z$0-9]*\1/;
var property = /^\.(?:\$\d+|(`?)[_A-Za-z][_A-Za-z$0-9]*\1)/;
var instruction = /^\#[A-Za-z]+/;
var attribute = /^@(?:\$\d+|(`?)[_A-Za-z][_A-Za-z$0-9]*\1)/;
function tokenBase$10(stream, state, prev) {
	if (stream.sol()) state.indented = stream.indentation();
	if (stream.eatSpace()) return null;
	var ch = stream.peek();
	if (ch == "/") {
		if (stream.match("//")) {
			stream.skipToEnd();
			return "comment";
		}
		if (stream.match("/*")) {
			state.tokenize.push(tokenComment$5);
			return tokenComment$5(stream, state);
		}
	}
	if (stream.match(instruction)) return "builtin";
	if (stream.match(attribute)) return "attribute";
	if (stream.match(binary)) return "number";
	if (stream.match(octal)) return "number";
	if (stream.match(hexadecimal)) return "number";
	if (stream.match(decimal)) return "number";
	if (stream.match(property)) return "property";
	if (operators.indexOf(ch) > -1) {
		stream.next();
		return "operator";
	}
	if (punc.indexOf(ch) > -1) {
		stream.next();
		stream.match("..");
		return "punctuation";
	}
	var stringMatch;
	if (stringMatch = stream.match(/("""|"|')/)) {
		var tokenize = tokenString$7.bind(null, stringMatch[0]);
		state.tokenize.push(tokenize);
		return tokenize(stream, state);
	}
	if (stream.match(identifier)) {
		var ident = stream.current();
		if (types$3.hasOwnProperty(ident)) return "type";
		if (atoms$2.hasOwnProperty(ident)) return "atom";
		if (keywords$9.hasOwnProperty(ident)) {
			if (definingKeywords.hasOwnProperty(ident)) state.prev = "define";
			return "keyword";
		}
		if (prev == "define") return "def";
		return "variable";
	}
	stream.next();
	return null;
}
function tokenUntilClosingParen() {
	var depth = 0;
	return function(stream, state, prev) {
		var inner = tokenBase$10(stream, state, prev);
		if (inner == "punctuation") {
			if (stream.current() == "(") ++depth;
			else if (stream.current() == ")") {
				if (depth == 0) {
					stream.backUp(1);
					state.tokenize.pop();
					return state.tokenize[state.tokenize.length - 1](stream, state);
				} else --depth;
			}
		}
		return inner;
	};
}
function tokenString$7(openQuote, stream, state) {
	var singleLine = openQuote.length == 1;
	var ch, escaped = false;
	while (ch = stream.peek()) if (escaped) {
		stream.next();
		if (ch == "(") {
			state.tokenize.push(tokenUntilClosingParen());
			return "string";
		}
		escaped = false;
	} else if (stream.match(openQuote)) {
		state.tokenize.pop();
		return "string";
	} else {
		stream.next();
		escaped = ch == "\\";
	}
	if (singleLine) state.tokenize.pop();
	return "string";
}
function tokenComment$5(stream, state) {
	var ch;
	while (ch = stream.next()) if (ch === "/" && stream.eat("*")) state.tokenize.push(tokenComment$5);
	else if (ch === "*" && stream.eat("/")) {
		state.tokenize.pop();
		break;
	}
	return "comment";
}
function Context$3(prev, align, indented) {
	this.prev = prev;
	this.align = align;
	this.indented = indented;
}
function pushContext$4(state, stream) {
	var align = stream.match(/^\s*($|\/[\/\*]|[)}\]])/, false) ? null : stream.column() + 1;
	state.context = new Context$3(state.context, align, state.indented);
}
function popContext$4(state) {
	if (state.context) {
		state.indented = state.context.indented;
		state.context = state.context.prev;
	}
}
var swift = {
	name: "swift",
	startState: function() {
		return {
			prev: null,
			context: null,
			indented: 0,
			tokenize: []
		};
	},
	token: function(stream, state) {
		var prev = state.prev;
		state.prev = null;
		var style = (state.tokenize[state.tokenize.length - 1] || tokenBase$10)(stream, state, prev);
		if (!style || style == "comment") state.prev = prev;
		else if (!state.prev) state.prev = style;
		if (style == "punctuation") {
			var bracket = /[\(\[\{]|([\]\)\}])/.exec(stream.current());
			if (bracket) (bracket[1] ? popContext$4 : pushContext$4)(state, stream);
		}
		return style;
	},
	indent: function(state, textAfter, iCx) {
		var cx = state.context;
		if (!cx) return 0;
		var closing = /^[\]\}\)]/.test(textAfter);
		if (cx.align != null) return cx.align - (closing ? 1 : 0);
		return cx.indented + (closing ? 0 : iCx.unit);
	},
	languageData: {
		indentOnInput: /^\s*[\)\}\]]$/,
		commentTokens: {
			line: "//",
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
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/stex.js
function mkStex(mathMode) {
	function pushCommand(state, command) {
		state.cmdState.push(command);
	}
	function peekCommand(state) {
		if (state.cmdState.length > 0) return state.cmdState[state.cmdState.length - 1];
		else return null;
	}
	function popCommand(state) {
		var plug = state.cmdState.pop();
		if (plug) plug.closeBracket();
	}
	function getMostPowerful(state) {
		var context = state.cmdState;
		for (var i = context.length - 1; i >= 0; i--) {
			var plug = context[i];
			if (plug.name == "DEFAULT") continue;
			return plug;
		}
		return { styleIdentifier: function() {
			return null;
		} };
	}
	function addPluginPattern(pluginName, cmdStyle, styles) {
		return function() {
			this.name = pluginName;
			this.bracketNo = 0;
			this.style = cmdStyle;
			this.styles = styles;
			this.argument = null;
			this.styleIdentifier = function() {
				return this.styles[this.bracketNo - 1] || null;
			};
			this.openBracket = function() {
				this.bracketNo++;
				return "bracket";
			};
			this.closeBracket = function() {};
		};
	}
	var plugins = {};
	plugins["importmodule"] = addPluginPattern("importmodule", "tag", ["string", "builtin"]);
	plugins["documentclass"] = addPluginPattern("documentclass", "tag", ["", "atom"]);
	plugins["usepackage"] = addPluginPattern("usepackage", "tag", ["atom"]);
	plugins["begin"] = addPluginPattern("begin", "tag", ["atom"]);
	plugins["end"] = addPluginPattern("end", "tag", ["atom"]);
	plugins["label"] = addPluginPattern("label", "tag", ["atom"]);
	plugins["ref"] = addPluginPattern("ref", "tag", ["atom"]);
	plugins["eqref"] = addPluginPattern("eqref", "tag", ["atom"]);
	plugins["cite"] = addPluginPattern("cite", "tag", ["atom"]);
	plugins["bibitem"] = addPluginPattern("bibitem", "tag", ["atom"]);
	plugins["Bibitem"] = addPluginPattern("Bibitem", "tag", ["atom"]);
	plugins["RBibitem"] = addPluginPattern("RBibitem", "tag", ["atom"]);
	plugins["DEFAULT"] = function() {
		this.name = "DEFAULT";
		this.style = "tag";
		this.styleIdentifier = this.openBracket = this.closeBracket = function() {};
	};
	function setState(state, f) {
		state.f = f;
	}
	function normal(source, state) {
		var plug;
		if (source.match(/^\\[a-zA-Z@\xc0-\u1fff\u2060-\uffff]+/)) {
			var cmdName = source.current().slice(1);
			plug = plugins.hasOwnProperty(cmdName) ? plugins[cmdName] : plugins["DEFAULT"];
			plug = new plug();
			pushCommand(state, plug);
			setState(state, beginParams);
			return plug.style;
		}
		if (source.match(/^\\[$&%#{}_]/)) return "tag";
		if (source.match(/^\\[,;!\/\\]/)) return "tag";
		if (source.match("\\[")) {
			setState(state, function(source, state) {
				return inMathMode(source, state, "\\]");
			});
			return "keyword";
		}
		if (source.match("\\(")) {
			setState(state, function(source, state) {
				return inMathMode(source, state, "\\)");
			});
			return "keyword";
		}
		if (source.match("$$")) {
			setState(state, function(source, state) {
				return inMathMode(source, state, "$$");
			});
			return "keyword";
		}
		if (source.match("$")) {
			setState(state, function(source, state) {
				return inMathMode(source, state, "$");
			});
			return "keyword";
		}
		var ch = source.next();
		if (ch == "%") {
			source.skipToEnd();
			return "comment";
		} else if (ch == "}" || ch == "]") {
			plug = peekCommand(state);
			if (plug) {
				plug.closeBracket(ch);
				setState(state, beginParams);
			} else return "error";
			return "bracket";
		} else if (ch == "{" || ch == "[") {
			plug = plugins["DEFAULT"];
			plug = new plug();
			pushCommand(state, plug);
			return "bracket";
		} else if (/\d/.test(ch)) {
			source.eatWhile(/[\w.%]/);
			return "atom";
		} else {
			source.eatWhile(/[\w\-_]/);
			plug = getMostPowerful(state);
			if (plug.name == "begin") plug.argument = source.current();
			return plug.styleIdentifier();
		}
	}
	function inMathMode(source, state, endModeSeq) {
		if (source.eatSpace()) return null;
		if (endModeSeq && source.match(endModeSeq)) {
			setState(state, normal);
			return "keyword";
		}
		if (source.match(/^\\[a-zA-Z@]+/)) return "tag";
		if (source.match(/^[a-zA-Z]+/)) return "variableName.special";
		if (source.match(/^\\[$&%#{}_]/)) return "tag";
		if (source.match(/^\\[,;!\/]/)) return "tag";
		if (source.match(/^[\^_&]/)) return "tag";
		if (source.match(/^[+\-<>|=,\/@!*:;'"`~#?]/)) return null;
		if (source.match(/^(\d+\.\d*|\d*\.\d+|\d+)/)) return "number";
		var ch = source.next();
		if (ch == "{" || ch == "}" || ch == "[" || ch == "]" || ch == "(" || ch == ")") return "bracket";
		if (ch == "%") {
			source.skipToEnd();
			return "comment";
		}
		return "error";
	}
	function beginParams(source, state) {
		var ch = source.peek(), lastPlug;
		if (ch == "{" || ch == "[") {
			lastPlug = peekCommand(state);
			lastPlug.openBracket(ch);
			source.eat(ch);
			setState(state, normal);
			return "bracket";
		}
		if (/[ \t\r]/.test(ch)) {
			source.eat(ch);
			return null;
		}
		setState(state, normal);
		popCommand(state);
		return normal(source, state);
	}
	return {
		name: "stex",
		startState: function() {
			return {
				cmdState: [],
				f: mathMode ? function(source, state) {
					return inMathMode(source, state);
				} : normal
			};
		},
		copyState: function(s) {
			return {
				cmdState: s.cmdState.slice(),
				f: s.f
			};
		},
		token: function(stream, state) {
			return state.f(stream, state);
		},
		blankLine: function(state) {
			state.f = normal;
			state.cmdState.length = 0;
		},
		languageData: { commentTokens: { line: "%" } }
	};
}
var stex = mkStex(false);
mkStex(true);
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/verilog.js
function mkVerilog(parserConfig) {
	var statementIndentUnit = parserConfig.statementIndentUnit, dontAlignCalls = parserConfig.dontAlignCalls, noIndentKeywords = parserConfig.noIndentKeywords || [], multiLineStrings = parserConfig.multiLineStrings, hooks = parserConfig.hooks || {};
	function words(str) {
		var obj = {}, words = str.split(" ");
		for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
		return obj;
	}
	/**
	* Keywords from IEEE 1800-2012
	*/
	var keywords = words("accept_on alias always always_comb always_ff always_latch and assert assign assume automatic before begin bind bins binsof bit break buf bufif0 bufif1 byte case casex casez cell chandle checker class clocking cmos config const constraint context continue cover covergroup coverpoint cross deassign default defparam design disable dist do edge else end endcase endchecker endclass endclocking endconfig endfunction endgenerate endgroup endinterface endmodule endpackage endprimitive endprogram endproperty endspecify endsequence endtable endtask enum event eventually expect export extends extern final first_match for force foreach forever fork forkjoin function generate genvar global highz0 highz1 if iff ifnone ignore_bins illegal_bins implements implies import incdir include initial inout input inside instance int integer interconnect interface intersect join join_any join_none large let liblist library local localparam logic longint macromodule matches medium modport module nand negedge nettype new nexttime nmos nor noshowcancelled not notif0 notif1 null or output package packed parameter pmos posedge primitive priority program property protected pull0 pull1 pulldown pullup pulsestyle_ondetect pulsestyle_onevent pure rand randc randcase randsequence rcmos real realtime ref reg reject_on release repeat restrict return rnmos rpmos rtran rtranif0 rtranif1 s_always s_eventually s_nexttime s_until s_until_with scalared sequence shortint shortreal showcancelled signed small soft solve specify specparam static string strong strong0 strong1 struct super supply0 supply1 sync_accept_on sync_reject_on table tagged task this throughout time timeprecision timeunit tran tranif0 tranif1 tri tri0 tri1 triand trior trireg type typedef union unique unique0 unsigned until until_with untyped use uwire var vectored virtual void wait wait_order wand weak weak0 weak1 while wildcard wire with within wor xnor xor");
	/** Operators from IEEE 1800-2012
	unary_operator ::=
	+ | - | ! | ~ | & | ~& | | | ~| | ^ | ~^ | ^~
	binary_operator ::=
	+ | - | * | / | % | == | != | === | !== | ==? | !=? | && | || | **
	| < | <= | > | >= | & | | | ^ | ^~ | ~^ | >> | << | >>> | <<<
	| -> | <->
	inc_or_dec_operator ::= ++ | --
	unary_module_path_operator ::=
	! | ~ | & | ~& | | | ~| | ^ | ~^ | ^~
	binary_module_path_operator ::=
	== | != | && | || | & | | | ^ | ^~ | ~^
	*/
	var isOperatorChar = /[\+\-\*\/!~&|^%=?:]/;
	var isBracketChar = /[\[\]{}()]/;
	var unsignedNumber = /\d[0-9_]*/;
	var decimalLiteral = /\d*\s*'s?d\s*\d[0-9_]*/i;
	var binaryLiteral = /\d*\s*'s?b\s*[xz01][xz01_]*/i;
	var octLiteral = /\d*\s*'s?o\s*[xz0-7][xz0-7_]*/i;
	var hexLiteral = /\d*\s*'s?h\s*[0-9a-fxz?][0-9a-fxz?_]*/i;
	var realLiteral = /(\d[\d_]*(\.\d[\d_]*)?E-?[\d_]+)|(\d[\d_]*\.\d[\d_]*)/i;
	var closingBracketOrWord = /^((\w+)|[)}\]])/;
	var closingBracket = /[)}\]]/;
	var curPunc;
	var curKeyword;
	var blockKeywords = words("case checker class clocking config function generate interface module package primitive program property specify sequence table task");
	var openClose = {};
	for (var keyword in blockKeywords) openClose[keyword] = "end" + keyword;
	openClose["begin"] = "end";
	openClose["casex"] = "endcase";
	openClose["casez"] = "endcase";
	openClose["do"] = "while";
	openClose["fork"] = "join;join_any;join_none";
	openClose["covergroup"] = "endgroup";
	for (var i in noIndentKeywords) {
		var keyword = noIndentKeywords[i];
		if (openClose[keyword]) openClose[keyword] = void 0;
	}
	var statementKeywords = words("always always_comb always_ff always_latch assert assign assume else export for foreach forever if import initial repeat while");
	function tokenBase(stream, state) {
		var ch = stream.peek(), style;
		if (hooks[ch] && (style = hooks[ch](stream, state)) != false) return style;
		if (hooks.tokenBase && (style = hooks.tokenBase(stream, state)) != false) return style;
		if (/[,;:\.]/.test(ch)) {
			curPunc = stream.next();
			return null;
		}
		if (isBracketChar.test(ch)) {
			curPunc = stream.next();
			return "bracket";
		}
		if (ch == "`") {
			stream.next();
			if (stream.eatWhile(/[\w\$_]/)) return "def";
			else return null;
		}
		if (ch == "$") {
			stream.next();
			if (stream.eatWhile(/[\w\$_]/)) return "meta";
			else return null;
		}
		if (ch == "#") {
			stream.next();
			stream.eatWhile(/[\d_.]/);
			return "def";
		}
		if (ch == "\"") {
			stream.next();
			state.tokenize = tokenString(ch);
			return state.tokenize(stream, state);
		}
		if (ch == "/") {
			stream.next();
			if (stream.eat("*")) {
				state.tokenize = tokenComment;
				return tokenComment(stream, state);
			}
			if (stream.eat("/")) {
				stream.skipToEnd();
				return "comment";
			}
			stream.backUp(1);
		}
		if (stream.match(realLiteral) || stream.match(decimalLiteral) || stream.match(binaryLiteral) || stream.match(octLiteral) || stream.match(hexLiteral) || stream.match(unsignedNumber) || stream.match(realLiteral)) return "number";
		if (stream.eatWhile(isOperatorChar)) return "meta";
		if (stream.eatWhile(/[\w\$_]/)) {
			var cur = stream.current();
			if (keywords[cur]) {
				if (openClose[cur]) curPunc = "newblock";
				if (statementKeywords[cur]) curPunc = "newstatement";
				curKeyword = cur;
				return "keyword";
			}
			return "variable";
		}
		stream.next();
		return null;
	}
	function tokenString(quote) {
		return function(stream, state) {
			var escaped = false, next, end = false;
			while ((next = stream.next()) != null) {
				if (next == quote && !escaped) {
					end = true;
					break;
				}
				escaped = !escaped && next == "\\";
			}
			if (end || !(escaped || multiLineStrings)) state.tokenize = tokenBase;
			return "string";
		};
	}
	function tokenComment(stream, state) {
		var maybeEnd = false, ch;
		while (ch = stream.next()) {
			if (ch == "/" && maybeEnd) {
				state.tokenize = tokenBase;
				break;
			}
			maybeEnd = ch == "*";
		}
		return "comment";
	}
	function Context(indented, column, type, align, prev) {
		this.indented = indented;
		this.column = column;
		this.type = type;
		this.align = align;
		this.prev = prev;
	}
	function pushContext(state, col, type) {
		var indent = state.indented;
		return state.context = new Context(indent, col, type, null, state.context);
	}
	function popContext(state) {
		var t = state.context.type;
		if (t == ")" || t == "]" || t == "}") state.indented = state.context.indented;
		return state.context = state.context.prev;
	}
	function isClosing(text, contextClosing) {
		if (text == contextClosing) return true;
		else {
			var closingKeywords = contextClosing.split(";");
			for (var i in closingKeywords) if (text == closingKeywords[i]) return true;
			return false;
		}
	}
	function buildElectricInputRegEx() {
		var allClosings = [];
		for (var i in openClose) if (openClose[i]) {
			var closings = openClose[i].split(";");
			for (var j in closings) allClosings.push(closings[j]);
		}
		return new RegExp("[{}()\\[\\]]|(" + allClosings.join("|") + ")$");
	}
	return {
		name: "verilog",
		startState: function(indentUnit) {
			var state = {
				tokenize: null,
				context: new Context(-indentUnit, 0, "top", false),
				indented: 0,
				startOfLine: true
			};
			if (hooks.startState) hooks.startState(state);
			return state;
		},
		token: function(stream, state) {
			var ctx = state.context;
			if (stream.sol()) {
				if (ctx.align == null) ctx.align = false;
				state.indented = stream.indentation();
				state.startOfLine = true;
			}
			if (hooks.token) {
				var style = hooks.token(stream, state);
				if (style !== void 0) return style;
			}
			if (stream.eatSpace()) return null;
			curPunc = null;
			curKeyword = null;
			var style = (state.tokenize || tokenBase)(stream, state);
			if (style == "comment" || style == "meta" || style == "variable") return style;
			if (ctx.align == null) ctx.align = true;
			if (curPunc == ctx.type) popContext(state);
			else if (curPunc == ";" && ctx.type == "statement" || ctx.type && isClosing(curKeyword, ctx.type)) {
				ctx = popContext(state);
				while (ctx && ctx.type == "statement") ctx = popContext(state);
			} else if (curPunc == "{") pushContext(state, stream.column(), "}");
			else if (curPunc == "[") pushContext(state, stream.column(), "]");
			else if (curPunc == "(") pushContext(state, stream.column(), ")");
			else if (ctx && ctx.type == "endcase" && curPunc == ":") pushContext(state, stream.column(), "statement");
			else if (curPunc == "newstatement") pushContext(state, stream.column(), "statement");
			else if (curPunc == "newblock") {
				if (curKeyword == "function" && ctx && (ctx.type == "statement" || ctx.type == "endgroup")) {} else if (curKeyword == "task" && ctx && ctx.type == "statement") {} else {
					var close = openClose[curKeyword];
					pushContext(state, stream.column(), close);
				}
			}
			state.startOfLine = false;
			return style;
		},
		indent: function(state, textAfter, cx) {
			if (state.tokenize != tokenBase && state.tokenize != null) return null;
			if (hooks.indent) {
				var fromHook = hooks.indent(state);
				if (fromHook >= 0) return fromHook;
			}
			var ctx = state.context, firstChar = textAfter && textAfter.charAt(0);
			if (ctx.type == "statement" && firstChar == "}") ctx = ctx.prev;
			var closing = false;
			var possibleClosing = textAfter.match(closingBracketOrWord);
			if (possibleClosing) closing = isClosing(possibleClosing[0], ctx.type);
			if (ctx.type == "statement") return ctx.indented + (firstChar == "{" ? 0 : statementIndentUnit || cx.unit);
			else if (closingBracket.test(ctx.type) && ctx.align && !dontAlignCalls) return ctx.column + (closing ? 0 : 1);
			else if (ctx.type == ")" && !closing) return ctx.indented + (statementIndentUnit || cx.unit);
			else return ctx.indented + (closing ? 0 : cx.unit);
		},
		languageData: {
			indentOnInput: buildElectricInputRegEx(),
			commentTokens: {
				line: "//",
				block: {
					open: "/*",
					close: "*/"
				}
			}
		}
	};
}
var verilog = mkVerilog({});
var tlvIdentifierStyle = {
	"|": "link",
	">": "property",
	"$": "variable",
	"$$": "variable",
	"?$": "qualifier",
	"?*": "qualifier",
	"-": "contentSeparator",
	"/": "property",
	"/-": "property",
	"@": "variableName.special",
	"@-": "variableName.special",
	"@++": "variableName.special",
	"@+=": "variableName.special",
	"@+=-": "variableName.special",
	"@--": "variableName.special",
	"@-=": "variableName.special",
	"%+": "tag",
	"%-": "tag",
	"%": "tag",
	">>": "tag",
	"<<": "tag",
	"<>": "tag",
	"#": "tag",
	"^": "attribute",
	"^^": "attribute",
	"^!": "attribute",
	"*": "variable",
	"**": "variable",
	"\\": "keyword",
	"\"": "comment"
};
var tlvScopePrefixChars = {
	"/": "beh-hier",
	">": "beh-hier",
	"-": "phys-hier",
	"|": "pipe",
	"?": "when",
	"@": "stage",
	"\\": "keyword"
};
var tlvIndentUnit = 3;
var tlvTrackStatements = false;
var tlvIdentMatch = /^([~!@#\$%\^&\*-\+=\?\/\\\|'"<>]+)([\d\w_]*)/;
var tlvLineIndentationMatch = /^[! ] */;
var tlvCommentMatch = /^\/[\/\*]/;
mkVerilog({ hooks: {
	electricInput: false,
	token: function(stream, state) {
		var style = void 0;
		var match;
		if (stream.sol() && !state.tlvInBlockComment) {
			if (stream.peek() == "\\") {
				style = "def";
				stream.skipToEnd();
				if (stream.string.match(/\\SV/)) state.tlvCodeActive = false;
				else if (stream.string.match(/\\TLV/)) state.tlvCodeActive = true;
			}
			if (state.tlvCodeActive && stream.pos == 0 && state.indented == 0 && (match = stream.match(tlvLineIndentationMatch, false))) state.indented = match[0].length;
			var indented = state.indented;
			var depth = indented / tlvIndentUnit;
			if (depth <= state.tlvIndentationStyle.length) {
				var blankline = stream.string.length == indented;
				var chPos = depth * tlvIndentUnit;
				if (chPos < stream.string.length) {
					var bodyString = stream.string.slice(chPos);
					var ch = bodyString[0];
					if (tlvScopePrefixChars[ch] && (match = bodyString.match(tlvIdentMatch)) && tlvIdentifierStyle[match[1]]) {
						indented += tlvIndentUnit;
						if (!(ch == "\\" && chPos > 0)) {
							state.tlvIndentationStyle[depth] = tlvScopePrefixChars[ch];
							if (tlvTrackStatements) state.statementComment = false;
							depth++;
						}
					}
				}
				if (!blankline) while (state.tlvIndentationStyle.length > depth) state.tlvIndentationStyle.pop();
			}
			state.tlvNextIndent = indented;
		}
		if (state.tlvCodeActive) {
			var beginStatement = false;
			if (tlvTrackStatements) {
				beginStatement = stream.peek() != " " && style === void 0 && !state.tlvInBlockComment && stream.column() == state.tlvIndentationStyle.length * tlvIndentUnit;
				//!stream.match(tlvCommentMatch, false) && // not comment start
				if (beginStatement) {
					if (state.statementComment) beginStatement = false;
					state.statementComment = stream.match(tlvCommentMatch, false);
				}
			}
			var match;
			if (style !== void 0) {} else if (state.tlvInBlockComment) {
				if (stream.match(/^.*?\*\//)) {
					state.tlvInBlockComment = false;
					if (tlvTrackStatements && !stream.eol()) state.statementComment = false;
				} else stream.skipToEnd();
				style = "comment";
			} else if ((match = stream.match(tlvCommentMatch)) && !state.tlvInBlockComment) {
				if (match[0] == "//") stream.skipToEnd();
				else state.tlvInBlockComment = true;
				style = "comment";
			} else if (match = stream.match(tlvIdentMatch)) {
				var prefix = match[1];
				var mnemonic = match[2];
				if (tlvIdentifierStyle.hasOwnProperty(prefix) && (mnemonic.length > 0 || stream.eol())) style = tlvIdentifierStyle[prefix];
				else stream.backUp(stream.current().length - 1);
			} else if (stream.match(/^\t+/)) style = "invalid";
			else if (stream.match(/^[\[\]{}\(\);\:]+/)) style = "meta";
			else if (match = stream.match(/^[mM]4([\+_])?[\w\d_]*/)) style = match[1] == "+" ? "keyword.special" : "keyword";
			else if (stream.match(/^ +/)) {
				if (stream.eol()) style = "error";
			} else if (stream.match(/^[\w\d_]+/)) style = "number";
			else stream.next();
		} else if (stream.match(/^[mM]4([\w\d_]*)/)) style = "keyword";
		return style;
	},
	indent: function(state) {
		return state.tlvCodeActive == true ? state.tlvNextIndent : -1;
	},
	startState: function(state) {
		state.tlvIndentationStyle = [];
		state.tlvCodeActive = true;
		state.tlvNextIndent = -1;
		state.tlvInBlockComment = false;
		if (tlvTrackStatements) state.statementComment = false;
	}
} });
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/tcl.js
function parseWords$1(str) {
	var obj = {}, words = str.split(" ");
	for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
	return obj;
}
var keywords$8 = parseWords$1("Tcl safe after append array auto_execok auto_import auto_load auto_mkindex auto_mkindex_old auto_qualify auto_reset bgerror binary break catch cd close concat continue dde eof encoding error eval exec exit expr fblocked fconfigure fcopy file fileevent filename filename flush for foreach format gets glob global history http if incr info interp join lappend lindex linsert list llength load lrange lreplace lsearch lset lsort memory msgcat namespace open package parray pid pkg::create pkg_mkIndex proc puts pwd re_syntax read regex regexp registry regsub rename resource return scan seek set socket source split string subst switch tcl_endOfWord tcl_findLibrary tcl_startOfNextWord tcl_wordBreakAfter tcl_startOfPreviousWord tcl_wordBreakBefore tcltest tclvars tell time trace unknown unset update uplevel upvar variable vwait");
var functions$1 = parseWords$1("if elseif else and not or eq ne in ni for foreach while switch");
var isOperatorChar$4 = /[+\-*&%=<>!?^\/\|]/;
function chain$2(stream, state, f) {
	state.tokenize = f;
	return f(stream, state);
}
function tokenBase$9(stream, state) {
	var beforeParams = state.beforeParams;
	state.beforeParams = false;
	var ch = stream.next();
	if ((ch == "\"" || ch == "'") && state.inParams) return chain$2(stream, state, tokenString$6(ch));
	else if (/[\[\]{}\(\),;\.]/.test(ch)) {
		if (ch == "(" && beforeParams) state.inParams = true;
		else if (ch == ")") state.inParams = false;
		return null;
	} else if (/\d/.test(ch)) {
		stream.eatWhile(/[\w\.]/);
		return "number";
	} else if (ch == "#") {
		if (stream.eat("*")) return chain$2(stream, state, tokenComment$4);
		if (ch == "#" && stream.match(/ *\[ *\[/)) return chain$2(stream, state, tokenUnparsed$1);
		stream.skipToEnd();
		return "comment";
	} else if (ch == "\"") {
		stream.skipTo(/"/);
		return "comment";
	} else if (ch == "$") {
		stream.eatWhile(/[$_a-z0-9A-Z\.{:]/);
		stream.eatWhile(/}/);
		state.beforeParams = true;
		return "builtin";
	} else if (isOperatorChar$4.test(ch)) {
		stream.eatWhile(isOperatorChar$4);
		return "comment";
	} else {
		stream.eatWhile(/[\w\$_{}\xa1-\uffff]/);
		var word = stream.current().toLowerCase();
		if (keywords$8 && keywords$8.propertyIsEnumerable(word)) return "keyword";
		if (functions$1 && functions$1.propertyIsEnumerable(word)) {
			state.beforeParams = true;
			return "keyword";
		}
		return null;
	}
}
function tokenString$6(quote) {
	return function(stream, state) {
		var escaped = false, next, end = false;
		while ((next = stream.next()) != null) {
			if (next == quote && !escaped) {
				end = true;
				break;
			}
			escaped = !escaped && next == "\\";
		}
		if (end) state.tokenize = tokenBase$9;
		return "string";
	};
}
function tokenComment$4(stream, state) {
	var maybeEnd = false, ch;
	while (ch = stream.next()) {
		if (ch == "#" && maybeEnd) {
			state.tokenize = tokenBase$9;
			break;
		}
		maybeEnd = ch == "*";
	}
	return "comment";
}
function tokenUnparsed$1(stream, state) {
	var maybeEnd = 0, ch;
	while (ch = stream.next()) {
		if (ch == "#" && maybeEnd == 2) {
			state.tokenize = tokenBase$9;
			break;
		}
		if (ch == "]") maybeEnd++;
		else if (ch != " ") maybeEnd = 0;
	}
	return "meta";
}
var tcl = {
	name: "tcl",
	startState: function() {
		return {
			tokenize: tokenBase$9,
			beforeParams: false,
			inParams: false
		};
	},
	token: function(stream, state) {
		if (stream.eatSpace()) return null;
		return state.tokenize(stream, state);
	},
	languageData: { commentTokens: { line: "#" } }
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/textile.js
var TOKEN_STYLES = {
	addition: "inserted",
	attributes: "propertyName",
	bold: "strong",
	cite: "keyword",
	code: "monospace",
	definitionList: "list",
	deletion: "deleted",
	div: "punctuation",
	em: "emphasis",
	footnote: "variable",
	footCite: "qualifier",
	header: "heading",
	html: "comment",
	image: "atom",
	italic: "emphasis",
	link: "link",
	linkDefinition: "link",
	list1: "list",
	list2: "list.special",
	list3: "list",
	notextile: "string.special",
	pre: "operator",
	p: "content",
	quote: "bracket",
	span: "quote",
	specialChar: "character",
	strong: "strong",
	sub: "content.special",
	sup: "content.special",
	table: "variableName.special",
	tableHeading: "operator"
};
function startNewLine(stream, state) {
	state.mode = Modes.newLayout;
	state.tableHeading = false;
	if (state.layoutType === "definitionList" && state.spanningLayout && stream.match(RE("definitionListEnd"), false)) state.spanningLayout = false;
}
function handlePhraseModifier(stream, state, ch) {
	if (ch === "_") {
		if (stream.eat("_")) return togglePhraseModifier(stream, state, "italic", /__/, 2);
		else return togglePhraseModifier(stream, state, "em", /_/, 1);
	}
	if (ch === "*") {
		if (stream.eat("*")) return togglePhraseModifier(stream, state, "bold", /\*\*/, 2);
		return togglePhraseModifier(stream, state, "strong", /\*/, 1);
	}
	if (ch === "[") {
		if (stream.match(/\d+\]/)) state.footCite = true;
		return tokenStyles(state);
	}
	if (ch === "(") {
		if (stream.match(/^(r|tm|c)\)/)) return TOKEN_STYLES.specialChar;
	}
	if (ch === "<" && stream.match(/(\w+)[^>]+>[^<]+<\/\1>/)) return TOKEN_STYLES.html;
	if (ch === "?" && stream.eat("?")) return togglePhraseModifier(stream, state, "cite", /\?\?/, 2);
	if (ch === "=" && stream.eat("=")) return togglePhraseModifier(stream, state, "notextile", /==/, 2);
	if (ch === "-" && !stream.eat("-")) return togglePhraseModifier(stream, state, "deletion", /-/, 1);
	if (ch === "+") return togglePhraseModifier(stream, state, "addition", /\+/, 1);
	if (ch === "~") return togglePhraseModifier(stream, state, "sub", /~/, 1);
	if (ch === "^") return togglePhraseModifier(stream, state, "sup", /\^/, 1);
	if (ch === "%") return togglePhraseModifier(stream, state, "span", /%/, 1);
	if (ch === "@") return togglePhraseModifier(stream, state, "code", /@/, 1);
	if (ch === "!") {
		var type = togglePhraseModifier(stream, state, "image", /(?:\([^\)]+\))?!/, 1);
		stream.match(/^:\S+/);
		return type;
	}
	return tokenStyles(state);
}
function togglePhraseModifier(stream, state, phraseModifier, closeRE, openSize) {
	var charBefore = stream.pos > openSize ? stream.string.charAt(stream.pos - openSize - 1) : null;
	var charAfter = stream.peek();
	if (state[phraseModifier]) {
		if ((!charAfter || /\W/.test(charAfter)) && charBefore && /\S/.test(charBefore)) {
			var type = tokenStyles(state);
			state[phraseModifier] = false;
			return type;
		}
	} else if ((!charBefore || /\W/.test(charBefore)) && charAfter && /\S/.test(charAfter) && stream.match(new RegExp("^.*\\S" + closeRE.source + "(?:\\W|$)"), false)) {
		state[phraseModifier] = true;
		state.mode = Modes.attributes;
	}
	return tokenStyles(state);
}
function tokenStyles(state) {
	var disabled = textileDisabled(state);
	if (disabled) return disabled;
	var styles = [];
	if (state.layoutType) styles.push(TOKEN_STYLES[state.layoutType]);
	styles = styles.concat(activeStyles(state, "addition", "bold", "cite", "code", "deletion", "em", "footCite", "image", "italic", "link", "span", "strong", "sub", "sup", "table", "tableHeading"));
	if (state.layoutType === "header") styles.push(TOKEN_STYLES.header + "-" + state.header);
	return styles.length ? styles.join(" ") : null;
}
function textileDisabled(state) {
	var type = state.layoutType;
	switch (type) {
		case "notextile":
		case "code":
		case "pre": return TOKEN_STYLES[type];
		default:
			if (state.notextile) return TOKEN_STYLES.notextile + (type ? " " + TOKEN_STYLES[type] : "");
			return null;
	}
}
function activeStyles(state) {
	var styles = [];
	for (var i = 1; i < arguments.length; ++i) if (state[arguments[i]]) styles.push(TOKEN_STYLES[arguments[i]]);
	return styles;
}
function blankLine(state) {
	var spanningLayout = state.spanningLayout, type = state.layoutType;
	for (var key in state) if (state.hasOwnProperty(key)) delete state[key];
	state.mode = Modes.newLayout;
	if (spanningLayout) {
		state.layoutType = type;
		state.spanningLayout = true;
	}
}
var REs = {
	cache: {},
	single: {
		bc: "bc",
		bq: "bq",
		definitionList: /- .*?:=+/,
		definitionListEnd: /.*=:\s*$/,
		div: "div",
		drawTable: /\|.*\|/,
		foot: /fn\d+/,
		header: /h[1-6]/,
		html: /\s*<(?:\/)?(\w+)(?:[^>]+)?>(?:[^<]+<\/\1>)?/,
		link: /[^"]+":\S/,
		linkDefinition: /\[[^\s\]]+\]\S+/,
		list: /(?:#+|\*+)/,
		notextile: "notextile",
		para: "p",
		pre: "pre",
		table: "table",
		tableCellAttributes: /[\/\\]\d+/,
		tableHeading: /\|_\./,
		tableText: /[^"_\*\[\(\?\+~\^%@|-]+/,
		text: /[^!"_=\*\[\(<\?\+~\^%@-]+/
	},
	attributes: {
		align: /(?:<>|<|>|=)/,
		selector: /\([^\(][^\)]+\)/,
		lang: /\[[^\[\]]+\]/,
		pad: /(?:\(+|\)+){1,2}/,
		css: /\{[^\}]+\}/
	},
	createRe: function(name) {
		switch (name) {
			case "drawTable": return REs.makeRe("^", REs.single.drawTable, "$");
			case "html": return REs.makeRe("^", REs.single.html, "(?:", REs.single.html, ")*", "$");
			case "linkDefinition": return REs.makeRe("^", REs.single.linkDefinition, "$");
			case "listLayout": return REs.makeRe("^", REs.single.list, RE("allAttributes"), "*\\s+");
			case "tableCellAttributes": return REs.makeRe("^", REs.choiceRe(REs.single.tableCellAttributes, RE("allAttributes")), "+\\.");
			case "type": return REs.makeRe("^", RE("allTypes"));
			case "typeLayout": return REs.makeRe("^", RE("allTypes"), RE("allAttributes"), "*\\.\\.?", "(\\s+|$)");
			case "attributes": return REs.makeRe("^", RE("allAttributes"), "+");
			case "allTypes": return REs.choiceRe(REs.single.div, REs.single.foot, REs.single.header, REs.single.bc, REs.single.bq, REs.single.notextile, REs.single.pre, REs.single.table, REs.single.para);
			case "allAttributes": return REs.choiceRe(REs.attributes.selector, REs.attributes.css, REs.attributes.lang, REs.attributes.align, REs.attributes.pad);
			default: return REs.makeRe("^", REs.single[name]);
		}
	},
	makeRe: function() {
		var pattern = "";
		for (var i = 0; i < arguments.length; ++i) {
			var arg = arguments[i];
			pattern += typeof arg === "string" ? arg : arg.source;
		}
		return new RegExp(pattern);
	},
	choiceRe: function() {
		var parts = [arguments[0]];
		for (var i = 1; i < arguments.length; ++i) {
			parts[i * 2 - 1] = "|";
			parts[i * 2] = arguments[i];
		}
		parts.unshift("(?:");
		parts.push(")");
		return REs.makeRe.apply(null, parts);
	}
};
function RE(name) {
	return REs.cache[name] || (REs.cache[name] = REs.createRe(name));
}
var Modes = {
	newLayout: function(stream, state) {
		if (stream.match(RE("typeLayout"), false)) {
			state.spanningLayout = false;
			return (state.mode = Modes.blockType)(stream, state);
		}
		var newMode;
		if (!textileDisabled(state)) {
			if (stream.match(RE("listLayout"), false)) newMode = Modes.list;
			else if (stream.match(RE("drawTable"), false)) newMode = Modes.table;
			else if (stream.match(RE("linkDefinition"), false)) newMode = Modes.linkDefinition;
			else if (stream.match(RE("definitionList"))) newMode = Modes.definitionList;
			else if (stream.match(RE("html"), false)) newMode = Modes.html;
		}
		return (state.mode = newMode || Modes.text)(stream, state);
	},
	blockType: function(stream, state) {
		var match, type;
		state.layoutType = null;
		if (match = stream.match(RE("type"))) type = match[0];
		else return (state.mode = Modes.text)(stream, state);
		if (match = type.match(RE("header"))) {
			state.layoutType = "header";
			state.header = parseInt(match[0][1]);
		} else if (type.match(RE("bq"))) state.layoutType = "quote";
		else if (type.match(RE("bc"))) state.layoutType = "code";
		else if (type.match(RE("foot"))) state.layoutType = "footnote";
		else if (type.match(RE("notextile"))) state.layoutType = "notextile";
		else if (type.match(RE("pre"))) state.layoutType = "pre";
		else if (type.match(RE("div"))) state.layoutType = "div";
		else if (type.match(RE("table"))) state.layoutType = "table";
		state.mode = Modes.attributes;
		return tokenStyles(state);
	},
	text: function(stream, state) {
		if (stream.match(RE("text"))) return tokenStyles(state);
		var ch = stream.next();
		if (ch === "\"") return (state.mode = Modes.link)(stream, state);
		return handlePhraseModifier(stream, state, ch);
	},
	attributes: function(stream, state) {
		state.mode = Modes.layoutLength;
		if (stream.match(RE("attributes"))) return TOKEN_STYLES.attributes;
		else return tokenStyles(state);
	},
	layoutLength: function(stream, state) {
		if (stream.eat(".") && stream.eat(".")) state.spanningLayout = true;
		state.mode = Modes.text;
		return tokenStyles(state);
	},
	list: function(stream, state) {
		state.listDepth = stream.match(RE("list"))[0].length;
		var listMod = (state.listDepth - 1) % 3;
		if (!listMod) state.layoutType = "list1";
		else if (listMod === 1) state.layoutType = "list2";
		else state.layoutType = "list3";
		state.mode = Modes.attributes;
		return tokenStyles(state);
	},
	link: function(stream, state) {
		state.mode = Modes.text;
		if (stream.match(RE("link"))) {
			stream.match(/\S+/);
			return TOKEN_STYLES.link;
		}
		return tokenStyles(state);
	},
	linkDefinition: function(stream) {
		stream.skipToEnd();
		return TOKEN_STYLES.linkDefinition;
	},
	definitionList: function(stream, state) {
		stream.match(RE("definitionList"));
		state.layoutType = "definitionList";
		if (stream.match(/\s*$/)) state.spanningLayout = true;
		else state.mode = Modes.attributes;
		return tokenStyles(state);
	},
	html: function(stream) {
		stream.skipToEnd();
		return TOKEN_STYLES.html;
	},
	table: function(stream, state) {
		state.layoutType = "table";
		return (state.mode = Modes.tableCell)(stream, state);
	},
	tableCell: function(stream, state) {
		if (stream.match(RE("tableHeading"))) state.tableHeading = true;
		else stream.eat("|");
		state.mode = Modes.tableCellAttributes;
		return tokenStyles(state);
	},
	tableCellAttributes: function(stream, state) {
		state.mode = Modes.tableText;
		if (stream.match(RE("tableCellAttributes"))) return TOKEN_STYLES.attributes;
		else return tokenStyles(state);
	},
	tableText: function(stream, state) {
		if (stream.match(RE("tableText"))) return tokenStyles(state);
		if (stream.peek() === "|") {
			state.mode = Modes.tableCell;
			return tokenStyles(state);
		}
		return handlePhraseModifier(stream, state, stream.next());
	}
};
var textile = {
	name: "textile",
	startState: function() {
		return { mode: Modes.newLayout };
	},
	token: function(stream, state) {
		if (stream.sol()) startNewLine(stream, state);
		return state.mode(stream, state);
	},
	blankLine
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/toml.js
var toml = {
	name: "toml",
	startState: function() {
		return {
			inString: false,
			stringType: "",
			lhs: true,
			inArray: 0
		};
	},
	token: function(stream, state) {
		let quote;
		if (!state.inString && (quote = stream.match(/^('''|"""|'|")/))) {
			state.stringType = quote[0];
			state.inString = true;
		}
		if (stream.sol() && !state.inString && state.inArray === 0) state.lhs = true;
		if (state.inString) {
			while (state.inString) if (stream.match(state.stringType)) state.inString = false;
			else if (stream.peek() === "\\") {
				stream.next();
				stream.next();
			} else if (stream.eol()) break;
			else stream.match(/^.[^\\\"\']*/);
			return state.lhs ? "property" : "string";
		} else if (state.inArray && stream.peek() === "]") {
			stream.next();
			state.inArray--;
			return "bracket";
		} else if (state.lhs && stream.peek() === "[" && stream.skipTo("]")) {
			stream.next();
			if (stream.peek() === "]") stream.next();
			return "atom";
		} else if (stream.peek() === "#") {
			stream.skipToEnd();
			return "comment";
		} else if (stream.eatSpace()) return null;
		else if (state.lhs && stream.eatWhile(function(c) {
			return c != "=" && c != " ";
		})) return "property";
		else if (state.lhs && stream.peek() === "=") {
			stream.next();
			state.lhs = false;
			return null;
		} else if (!state.lhs && stream.match(/^\d\d\d\d[\d\-\:\.T]*Z/)) return "atom";
		else if (!state.lhs && (stream.match("true") || stream.match("false"))) return "atom";
		else if (!state.lhs && stream.peek() === "[") {
			state.inArray++;
			stream.next();
			return "bracket";
		} else if (!state.lhs && stream.match(/^\-?\d+(?:\.\d+)?/)) return "number";
		else if (!stream.eatSpace()) stream.next();
		return null;
	},
	languageData: { commentTokens: { line: "#" } }
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/troff.js
var words$4 = {};
function tokenBase$8(stream) {
	if (stream.eatSpace()) return null;
	var sol = stream.sol();
	var ch = stream.next();
	if (ch === "\\") {
		if (stream.match("fB") || stream.match("fR") || stream.match("fI") || stream.match("u") || stream.match("d") || stream.match("%") || stream.match("&")) return "string";
		if (stream.match("m[")) {
			stream.skipTo("]");
			stream.next();
			return "string";
		}
		if (stream.match("s+") || stream.match("s-")) {
			stream.eatWhile(/[\d-]/);
			return "string";
		}
		if (stream.match("(") || stream.match("*(")) {
			stream.eatWhile(/[\w-]/);
			return "string";
		}
		return "string";
	}
	if (sol && (ch === "." || ch === "'")) {
		if (stream.eat("\\") && stream.eat("\"")) {
			stream.skipToEnd();
			return "comment";
		}
	}
	if (sol && ch === ".") {
		if (stream.match("B ") || stream.match("I ") || stream.match("R ")) return "attribute";
		if (stream.match("TH ") || stream.match("SH ") || stream.match("SS ") || stream.match("HP ")) {
			stream.skipToEnd();
			return "quote";
		}
		if (stream.match(/[A-Z]/) && stream.match(/[A-Z]/) || stream.match(/[a-z]/) && stream.match(/[a-z]/)) return "attribute";
	}
	stream.eatWhile(/[\w-]/);
	var cur = stream.current();
	return words$4.hasOwnProperty(cur) ? words$4[cur] : null;
}
function tokenize(stream, state) {
	return (state.tokens[0] || tokenBase$8)(stream, state);
}
var troff = {
	name: "troff",
	startState: function() {
		return { tokens: [] };
	},
	token: function(stream, state) {
		return tokenize(stream, state);
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/ttcn.js
function words$3(str) {
	var obj = {}, words = str.split(" ");
	for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
	return obj;
}
var parserConfig$1 = {
	name: "ttcn",
	keywords: words$3("activate address alive all alt altstep and and4b any break case component const continue control deactivate display do else encode enumerated except exception execute extends extension external for from function goto group if import in infinity inout interleave label language length log match message mixed mod modifies module modulepar mtc noblock not not4b nowait of on optional or or4b out override param pattern port procedure record recursive rem repeat return runs select self sender set signature system template testcase to type union value valueof var variant while with xor xor4b"),
	builtin: words$3("bit2hex bit2int bit2oct bit2str char2int char2oct encvalue decomp decvalue float2int float2str hex2bit hex2int hex2oct hex2str int2bit int2char int2float int2hex int2oct int2str int2unichar isbound ischosen ispresent isvalue lengthof log2str oct2bit oct2char oct2hex oct2int oct2str regexp replace rnd sizeof str2bit str2float str2hex str2int str2oct substr unichar2int unichar2char enum2int"),
	types: words$3("anytype bitstring boolean char charstring default float hexstring integer objid octetstring universal verdicttype timer"),
	timerOps: words$3("read running start stop timeout"),
	portOps: words$3("call catch check clear getcall getreply halt raise receive reply send trigger"),
	configOps: words$3("create connect disconnect done kill killed map unmap"),
	verdictOps: words$3("getverdict setverdict"),
	sutOps: words$3("action"),
	functionOps: words$3("apply derefers refers"),
	verdictConsts: words$3("error fail inconc none pass"),
	booleanConsts: words$3("true false"),
	otherConsts: words$3("null NULL omit"),
	visibilityModifiers: words$3("private public friend"),
	templateMatch: words$3("complement ifpresent subset superset permutation"),
	multiLineStrings: true
};
var wordList = [];
function add(obj) {
	if (obj) {
		for (var prop in obj) if (obj.hasOwnProperty(prop)) wordList.push(prop);
	}
}
add(parserConfig$1.keywords);
add(parserConfig$1.builtin);
add(parserConfig$1.timerOps);
add(parserConfig$1.portOps);
var keywords$7 = parserConfig$1.keywords || {};
var builtin = parserConfig$1.builtin || {};
var timerOps = parserConfig$1.timerOps || {};
var portOps = parserConfig$1.portOps || {};
var configOps = parserConfig$1.configOps || {};
var verdictOps = parserConfig$1.verdictOps || {};
var sutOps = parserConfig$1.sutOps || {};
var functionOps = parserConfig$1.functionOps || {};
var verdictConsts = parserConfig$1.verdictConsts || {};
var booleanConsts = parserConfig$1.booleanConsts || {};
var otherConsts = parserConfig$1.otherConsts || {};
var types$2 = parserConfig$1.types || {};
var visibilityModifiers = parserConfig$1.visibilityModifiers || {};
var templateMatch = parserConfig$1.templateMatch || {};
var multiLineStrings$2 = parserConfig$1.multiLineStrings;
var indentStatements$1 = parserConfig$1.indentStatements !== false;
var isOperatorChar$3 = /[+\-*&@=<>!\/]/;
var curPunc$3;
function tokenBase$7(stream, state) {
	var ch = stream.next();
	if (ch == "\"" || ch == "'") {
		state.tokenize = tokenString$5(ch);
		return state.tokenize(stream, state);
	}
	if (/[\[\]{}\(\),;\\:\?\.]/.test(ch)) {
		curPunc$3 = ch;
		return "punctuation";
	}
	if (ch == "#") {
		stream.skipToEnd();
		return "atom";
	}
	if (ch == "%") {
		stream.eatWhile(/\b/);
		return "atom";
	}
	if (/\d/.test(ch)) {
		stream.eatWhile(/[\w\.]/);
		return "number";
	}
	if (ch == "/") {
		if (stream.eat("*")) {
			state.tokenize = tokenComment$3;
			return tokenComment$3(stream, state);
		}
		if (stream.eat("/")) {
			stream.skipToEnd();
			return "comment";
		}
	}
	if (isOperatorChar$3.test(ch)) {
		if (ch == "@") {
			if (stream.match("try") || stream.match("catch") || stream.match("lazy")) return "keyword";
		}
		stream.eatWhile(isOperatorChar$3);
		return "operator";
	}
	stream.eatWhile(/[\w\$_\xa1-\uffff]/);
	var cur = stream.current();
	if (keywords$7.propertyIsEnumerable(cur)) return "keyword";
	if (builtin.propertyIsEnumerable(cur)) return "builtin";
	if (timerOps.propertyIsEnumerable(cur)) return "def";
	if (configOps.propertyIsEnumerable(cur)) return "def";
	if (verdictOps.propertyIsEnumerable(cur)) return "def";
	if (portOps.propertyIsEnumerable(cur)) return "def";
	if (sutOps.propertyIsEnumerable(cur)) return "def";
	if (functionOps.propertyIsEnumerable(cur)) return "def";
	if (verdictConsts.propertyIsEnumerable(cur)) return "string";
	if (booleanConsts.propertyIsEnumerable(cur)) return "string";
	if (otherConsts.propertyIsEnumerable(cur)) return "string";
	if (types$2.propertyIsEnumerable(cur)) return "typeName.standard";
	if (visibilityModifiers.propertyIsEnumerable(cur)) return "modifier";
	if (templateMatch.propertyIsEnumerable(cur)) return "atom";
	return "variable";
}
function tokenString$5(quote) {
	return function(stream, state) {
		var escaped = false, next, end = false;
		while ((next = stream.next()) != null) {
			if (next == quote && !escaped) {
				var afterQuote = stream.peek();
				if (afterQuote) {
					afterQuote = afterQuote.toLowerCase();
					if (afterQuote == "b" || afterQuote == "h" || afterQuote == "o") stream.next();
				}
				end = true;
				break;
			}
			escaped = !escaped && next == "\\";
		}
		if (end || !(escaped || multiLineStrings$2)) state.tokenize = null;
		return "string";
	};
}
function tokenComment$3(stream, state) {
	var maybeEnd = false, ch;
	while (ch = stream.next()) {
		if (ch == "/" && maybeEnd) {
			state.tokenize = null;
			break;
		}
		maybeEnd = ch == "*";
	}
	return "comment";
}
function Context$2(indented, column, type, align, prev) {
	this.indented = indented;
	this.column = column;
	this.type = type;
	this.align = align;
	this.prev = prev;
}
function pushContext$3(state, col, type) {
	var indent = state.indented;
	if (state.context && state.context.type == "statement") indent = state.context.indented;
	return state.context = new Context$2(indent, col, type, null, state.context);
}
function popContext$3(state) {
	var t = state.context.type;
	if (t == ")" || t == "]" || t == "}") state.indented = state.context.indented;
	return state.context = state.context.prev;
}
var ttcn = {
	name: "ttcn",
	startState: function() {
		return {
			tokenize: null,
			context: new Context$2(0, 0, "top", false),
			indented: 0,
			startOfLine: true
		};
	},
	token: function(stream, state) {
		var ctx = state.context;
		if (stream.sol()) {
			if (ctx.align == null) ctx.align = false;
			state.indented = stream.indentation();
			state.startOfLine = true;
		}
		if (stream.eatSpace()) return null;
		curPunc$3 = null;
		var style = (state.tokenize || tokenBase$7)(stream, state);
		if (style == "comment") return style;
		if (ctx.align == null) ctx.align = true;
		if ((curPunc$3 == ";" || curPunc$3 == ":" || curPunc$3 == ",") && ctx.type == "statement") popContext$3(state);
		else if (curPunc$3 == "{") pushContext$3(state, stream.column(), "}");
		else if (curPunc$3 == "[") pushContext$3(state, stream.column(), "]");
		else if (curPunc$3 == "(") pushContext$3(state, stream.column(), ")");
		else if (curPunc$3 == "}") {
			while (ctx.type == "statement") ctx = popContext$3(state);
			if (ctx.type == "}") ctx = popContext$3(state);
			while (ctx.type == "statement") ctx = popContext$3(state);
		} else if (curPunc$3 == ctx.type) popContext$3(state);
		else if (indentStatements$1 && ((ctx.type == "}" || ctx.type == "top") && curPunc$3 != ";" || ctx.type == "statement" && curPunc$3 == "newstatement")) pushContext$3(state, stream.column(), "statement");
		state.startOfLine = false;
		return style;
	},
	languageData: {
		indentOnInput: /^\s*[{}]$/,
		commentTokens: {
			line: "//",
			block: {
				open: "/*",
				close: "*/"
			}
		},
		autocomplete: wordList
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/ttcn-cfg.js
function words$2(str) {
	var obj = {}, words = str.split(" ");
	for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
	return obj;
}
var parserConfig = {
	name: "ttcn-cfg",
	keywords: words$2("Yes No LogFile FileMask ConsoleMask AppendFile TimeStampFormat LogEventTypes SourceInfoFormat LogEntityName LogSourceInfo DiskFullAction LogFileNumber LogFileSize MatchingHints Detailed Compact SubCategories Stack Single None Seconds DateTime Time Stop Error Retry Delete TCPPort KillTimer NumHCs UnixSocketsEnabled LocalAddress"),
	fileNCtrlMaskOptions: words$2("TTCN_EXECUTOR TTCN_ERROR TTCN_WARNING TTCN_PORTEVENT TTCN_TIMEROP TTCN_VERDICTOP TTCN_DEFAULTOP TTCN_TESTCASE TTCN_ACTION TTCN_USER TTCN_FUNCTION TTCN_STATISTICS TTCN_PARALLEL TTCN_MATCHING TTCN_DEBUG EXECUTOR ERROR WARNING PORTEVENT TIMEROP VERDICTOP DEFAULTOP TESTCASE ACTION USER FUNCTION STATISTICS PARALLEL MATCHING DEBUG LOG_ALL LOG_NOTHING ACTION_UNQUALIFIED DEBUG_ENCDEC DEBUG_TESTPORT DEBUG_UNQUALIFIED DEFAULTOP_ACTIVATE DEFAULTOP_DEACTIVATE DEFAULTOP_EXIT DEFAULTOP_UNQUALIFIED ERROR_UNQUALIFIED EXECUTOR_COMPONENT EXECUTOR_CONFIGDATA EXECUTOR_EXTCOMMAND EXECUTOR_LOGOPTIONS EXECUTOR_RUNTIME EXECUTOR_UNQUALIFIED FUNCTION_RND FUNCTION_UNQUALIFIED MATCHING_DONE MATCHING_MCSUCCESS MATCHING_MCUNSUCC MATCHING_MMSUCCESS MATCHING_MMUNSUCC MATCHING_PCSUCCESS MATCHING_PCUNSUCC MATCHING_PMSUCCESS MATCHING_PMUNSUCC MATCHING_PROBLEM MATCHING_TIMEOUT MATCHING_UNQUALIFIED PARALLEL_PORTCONN PARALLEL_PORTMAP PARALLEL_PTC PARALLEL_UNQUALIFIED PORTEVENT_DUALRECV PORTEVENT_DUALSEND PORTEVENT_MCRECV PORTEVENT_MCSEND PORTEVENT_MMRECV PORTEVENT_MMSEND PORTEVENT_MQUEUE PORTEVENT_PCIN PORTEVENT_PCOUT PORTEVENT_PMIN PORTEVENT_PMOUT PORTEVENT_PQUEUE PORTEVENT_STATE PORTEVENT_UNQUALIFIED STATISTICS_UNQUALIFIED STATISTICS_VERDICT TESTCASE_FINISH TESTCASE_START TESTCASE_UNQUALIFIED TIMEROP_GUARD TIMEROP_READ TIMEROP_START TIMEROP_STOP TIMEROP_TIMEOUT TIMEROP_UNQUALIFIED USER_UNQUALIFIED VERDICTOP_FINAL VERDICTOP_GETVERDICT VERDICTOP_SETVERDICT VERDICTOP_UNQUALIFIED WARNING_UNQUALIFIED"),
	externalCommands: words$2("BeginControlPart EndControlPart BeginTestCase EndTestCase"),
	multiLineStrings: true
};
var keywords$6 = parserConfig.keywords;
var fileNCtrlMaskOptions = parserConfig.fileNCtrlMaskOptions;
var externalCommands = parserConfig.externalCommands;
var multiLineStrings$1 = parserConfig.multiLineStrings;
var indentStatements = parserConfig.indentStatements !== false;
var isOperatorChar$2 = /[\|]/;
var curPunc$2;
function tokenBase$6(stream, state) {
	var ch = stream.next();
	if (ch == "\"" || ch == "'") {
		state.tokenize = tokenString$4(ch);
		return state.tokenize(stream, state);
	}
	if (/[:=]/.test(ch)) {
		curPunc$2 = ch;
		return "punctuation";
	}
	if (ch == "#") {
		stream.skipToEnd();
		return "comment";
	}
	if (/\d/.test(ch)) {
		stream.eatWhile(/[\w\.]/);
		return "number";
	}
	if (isOperatorChar$2.test(ch)) {
		stream.eatWhile(isOperatorChar$2);
		return "operator";
	}
	if (ch == "[") {
		stream.eatWhile(/[\w_\]]/);
		return "number";
	}
	stream.eatWhile(/[\w\$_]/);
	var cur = stream.current();
	if (keywords$6.propertyIsEnumerable(cur)) return "keyword";
	if (fileNCtrlMaskOptions.propertyIsEnumerable(cur)) return "atom";
	if (externalCommands.propertyIsEnumerable(cur)) return "deleted";
	return "variable";
}
function tokenString$4(quote) {
	return function(stream, state) {
		var escaped = false, next, end = false;
		while ((next = stream.next()) != null) {
			if (next == quote && !escaped) {
				var afterNext = stream.peek();
				if (afterNext) {
					afterNext = afterNext.toLowerCase();
					if (afterNext == "b" || afterNext == "h" || afterNext == "o") stream.next();
				}
				end = true;
				break;
			}
			escaped = !escaped && next == "\\";
		}
		if (end || !(escaped || multiLineStrings$1)) state.tokenize = null;
		return "string";
	};
}
function Context$1(indented, column, type, align, prev) {
	this.indented = indented;
	this.column = column;
	this.type = type;
	this.align = align;
	this.prev = prev;
}
function pushContext$2(state, col, type) {
	var indent = state.indented;
	if (state.context && state.context.type == "statement") indent = state.context.indented;
	return state.context = new Context$1(indent, col, type, null, state.context);
}
function popContext$2(state) {
	var t = state.context.type;
	if (t == ")" || t == "]" || t == "}") state.indented = state.context.indented;
	return state.context = state.context.prev;
}
var ttcnCfg = {
	name: "ttcn",
	startState: function() {
		return {
			tokenize: null,
			context: new Context$1(0, 0, "top", false),
			indented: 0,
			startOfLine: true
		};
	},
	token: function(stream, state) {
		var ctx = state.context;
		if (stream.sol()) {
			if (ctx.align == null) ctx.align = false;
			state.indented = stream.indentation();
			state.startOfLine = true;
		}
		if (stream.eatSpace()) return null;
		curPunc$2 = null;
		var style = (state.tokenize || tokenBase$6)(stream, state);
		if (style == "comment") return style;
		if (ctx.align == null) ctx.align = true;
		if ((curPunc$2 == ";" || curPunc$2 == ":" || curPunc$2 == ",") && ctx.type == "statement") popContext$2(state);
		else if (curPunc$2 == "{") pushContext$2(state, stream.column(), "}");
		else if (curPunc$2 == "[") pushContext$2(state, stream.column(), "]");
		else if (curPunc$2 == "(") pushContext$2(state, stream.column(), ")");
		else if (curPunc$2 == "}") {
			while (ctx.type == "statement") ctx = popContext$2(state);
			if (ctx.type == "}") ctx = popContext$2(state);
			while (ctx.type == "statement") ctx = popContext$2(state);
		} else if (curPunc$2 == ctx.type) popContext$2(state);
		else if (indentStatements && ((ctx.type == "}" || ctx.type == "top") && curPunc$2 != ";" || ctx.type == "statement" && curPunc$2 == "newstatement")) pushContext$2(state, stream.column(), "statement");
		state.startOfLine = false;
		return style;
	},
	languageData: {
		indentOnInput: /^\s*[{}]$/,
		commentTokens: { line: "#" }
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/turtle.js
var curPunc$1;
function wordRegexp$3(words) {
	return new RegExp("^(?:" + words.join("|") + ")$", "i");
}
wordRegexp$3([]);
var keywords$5 = wordRegexp$3([
	"@prefix",
	"@base",
	"a"
]);
var operatorChars = /[*+\-<>=&|]/;
function tokenBase$5(stream, state) {
	var ch = stream.next();
	curPunc$1 = null;
	if (ch == "<" && !stream.match(/^[\s\u00a0=]/, false)) {
		stream.match(/^[^\s\u00a0>]*>?/);
		return "atom";
	} else if (ch == "\"" || ch == "'") {
		state.tokenize = tokenLiteral(ch);
		return state.tokenize(stream, state);
	} else if (/[{}\(\),\.;\[\]]/.test(ch)) {
		curPunc$1 = ch;
		return null;
	} else if (ch == "#") {
		stream.skipToEnd();
		return "comment";
	} else if (operatorChars.test(ch)) {
		stream.eatWhile(operatorChars);
		return null;
	} else if (ch == ":") return "operator";
	else {
		stream.eatWhile(/[_\w\d]/);
		if (stream.peek() == ":") return "variableName.special";
		else {
			var word = stream.current();
			if (keywords$5.test(word)) return "meta";
			if (ch >= "A" && ch <= "Z") return "comment";
			else return "keyword";
		}
		var word;
	}
}
function tokenLiteral(quote) {
	return function(stream, state) {
		var escaped = false, ch;
		while ((ch = stream.next()) != null) {
			if (ch == quote && !escaped) {
				state.tokenize = tokenBase$5;
				break;
			}
			escaped = !escaped && ch == "\\";
		}
		return "string";
	};
}
function pushContext$1(state, type, col) {
	state.context = {
		prev: state.context,
		indent: state.indent,
		col,
		type
	};
}
function popContext$1(state) {
	state.indent = state.context.indent;
	state.context = state.context.prev;
}
var turtle = {
	name: "turtle",
	startState: function() {
		return {
			tokenize: tokenBase$5,
			context: null,
			indent: 0,
			col: 0
		};
	},
	token: function(stream, state) {
		if (stream.sol()) {
			if (state.context && state.context.align == null) state.context.align = false;
			state.indent = stream.indentation();
		}
		if (stream.eatSpace()) return null;
		var style = state.tokenize(stream, state);
		if (style != "comment" && state.context && state.context.align == null && state.context.type != "pattern") state.context.align = true;
		if (curPunc$1 == "(") pushContext$1(state, ")", stream.column());
		else if (curPunc$1 == "[") pushContext$1(state, "]", stream.column());
		else if (curPunc$1 == "{") pushContext$1(state, "}", stream.column());
		else if (/[\]\}\)]/.test(curPunc$1)) {
			while (state.context && state.context.type == "pattern") popContext$1(state);
			if (state.context && curPunc$1 == state.context.type) popContext$1(state);
		} else if (curPunc$1 == "." && state.context && state.context.type == "pattern") popContext$1(state);
		else if (/atom|string|variable/.test(style) && state.context) {
			if (/[\}\]]/.test(state.context.type)) pushContext$1(state, "pattern", stream.column());
			else if (state.context.type == "pattern" && !state.context.align) {
				state.context.align = true;
				state.context.col = stream.column();
			}
		}
		return style;
	},
	indent: function(state, textAfter, cx) {
		var firstChar = textAfter && textAfter.charAt(0);
		var context = state.context;
		if (/[\]\}]/.test(firstChar)) while (context && context.type == "pattern") context = context.prev;
		var closing = context && firstChar == context.type;
		if (!context) return 0;
		else if (context.type == "pattern") return context.col;
		else if (context.align) return context.col + (closing ? 0 : 1);
		else return context.indent + (closing ? 0 : cx.unit);
	},
	languageData: { commentTokens: { line: "#" } }
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/webidl.js
function wordRegexp$2(words) {
	return new RegExp("^((" + words.join(")|(") + "))\\b");
}
var builtinArray = [
	"Clamp",
	"Constructor",
	"EnforceRange",
	"Exposed",
	"ImplicitThis",
	"Global",
	"PrimaryGlobal",
	"LegacyArrayClass",
	"LegacyUnenumerableNamedProperties",
	"LenientThis",
	"NamedConstructor",
	"NewObject",
	"NoInterfaceObject",
	"OverrideBuiltins",
	"PutForwards",
	"Replaceable",
	"SameObject",
	"TreatNonObjectAsNull",
	"TreatNullAs",
	"EmptyString",
	"Unforgeable",
	"Unscopeable"
];
var builtins = wordRegexp$2(builtinArray);
var typeArray = [
	"unsigned",
	"short",
	"long",
	"unrestricted",
	"float",
	"double",
	"boolean",
	"byte",
	"octet",
	"Promise",
	"ArrayBuffer",
	"DataView",
	"Int8Array",
	"Int16Array",
	"Int32Array",
	"Uint8Array",
	"Uint16Array",
	"Uint32Array",
	"Uint8ClampedArray",
	"Float32Array",
	"Float64Array",
	"ByteString",
	"DOMString",
	"USVString",
	"sequence",
	"object",
	"RegExp",
	"Error",
	"DOMException",
	"FrozenArray",
	"any",
	"void"
];
var types$1 = wordRegexp$2(typeArray);
var keywordArray = [
	"attribute",
	"callback",
	"const",
	"deleter",
	"dictionary",
	"enum",
	"getter",
	"implements",
	"inherit",
	"interface",
	"iterable",
	"legacycaller",
	"maplike",
	"partial",
	"required",
	"serializer",
	"setlike",
	"setter",
	"static",
	"stringifier",
	"typedef",
	"optional",
	"readonly",
	"or"
];
var keywords$4 = wordRegexp$2(keywordArray);
var atomArray = [
	"true",
	"false",
	"Infinity",
	"NaN",
	"null"
];
var atoms$1 = wordRegexp$2(atomArray);
var startDefs = wordRegexp$2([
	"callback",
	"dictionary",
	"enum",
	"interface"
]);
var endDefs = wordRegexp$2(["typedef"]);
var singleOperators$1 = /^[:<=>?]/;
var integers = /^-?([1-9][0-9]*|0[Xx][0-9A-Fa-f]+|0[0-7]*)/;
var floats = /^-?(([0-9]+\.[0-9]*|[0-9]*\.[0-9]+)([Ee][+-]?[0-9]+)?|[0-9]+[Ee][+-]?[0-9]+)/;
var identifiers$1 = /^_?[A-Za-z][0-9A-Z_a-z-]*/;
var identifiersEnd = /^_?[A-Za-z][0-9A-Z_a-z-]*(?=\s*;)/;
var strings = /^"[^"]*"/;
var multilineComments = /^\/\*.*?\*\//;
var multilineCommentsStart = /^\/\*.*/;
var multilineCommentsEnd = /^.*?\*\//;
function readToken(stream, state) {
	if (stream.eatSpace()) return null;
	if (state.inComment) {
		if (stream.match(multilineCommentsEnd)) {
			state.inComment = false;
			return "comment";
		}
		stream.skipToEnd();
		return "comment";
	}
	if (stream.match("//")) {
		stream.skipToEnd();
		return "comment";
	}
	if (stream.match(multilineComments)) return "comment";
	if (stream.match(multilineCommentsStart)) {
		state.inComment = true;
		return "comment";
	}
	if (stream.match(/^-?[0-9\.]/, false)) {
		if (stream.match(integers) || stream.match(floats)) return "number";
	}
	if (stream.match(strings)) return "string";
	if (state.startDef && stream.match(identifiers$1)) return "def";
	if (state.endDef && stream.match(identifiersEnd)) {
		state.endDef = false;
		return "def";
	}
	if (stream.match(keywords$4)) return "keyword";
	if (stream.match(types$1)) {
		var lastToken = state.lastToken;
		var nextToken = (stream.match(/^\s*(.+?)\b/, false) || [])[1];
		if (lastToken === ":" || lastToken === "implements" || nextToken === "implements" || nextToken === "=") return "builtin";
		else return "type";
	}
	if (stream.match(builtins)) return "builtin";
	if (stream.match(atoms$1)) return "atom";
	if (stream.match(identifiers$1)) return "variable";
	if (stream.match(singleOperators$1)) return "operator";
	stream.next();
	return null;
}
var webIDL = {
	name: "webidl",
	startState: function() {
		return {
			inComment: false,
			lastToken: "",
			startDef: false,
			endDef: false
		};
	},
	token: function(stream, state) {
		var style = readToken(stream, state);
		if (style) {
			var cur = stream.current();
			state.lastToken = cur;
			if (style === "keyword") {
				state.startDef = startDefs.test(cur);
				state.endDef = state.endDef || endDefs.test(cur);
			} else state.startDef = false;
		}
		return style;
	},
	languageData: { autocomplete: builtinArray.concat(typeArray).concat(keywordArray).concat(atomArray) }
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/vb.js
var ERRORCLASS = "error";
function wordRegexp$1(words) {
	return new RegExp("^((" + words.join(")|(") + "))\\b", "i");
}
var singleOperators = /* @__PURE__ */ new RegExp("^[\\+\\-\\*/%&\\\\|\\^~<>!]");
var singleDelimiters = /* @__PURE__ */ new RegExp("^[\\(\\)\\[\\]\\{\\}@,:`=;\\.]");
var doubleOperators = /* @__PURE__ */ new RegExp("^((==)|(<>)|(<=)|(>=)|(<>)|(<<)|(>>)|(//)|(\\*\\*))");
var doubleDelimiters = /* @__PURE__ */ new RegExp("^((\\+=)|(\\-=)|(\\*=)|(%=)|(/=)|(&=)|(\\|=)|(\\^=))");
var tripleDelimiters = /* @__PURE__ */ new RegExp("^((//=)|(>>=)|(<<=)|(\\*\\*=))");
var identifiers = /* @__PURE__ */ new RegExp("^[_A-Za-z][_A-Za-z0-9]*");
var openingKeywords = [
	"class",
	"module",
	"sub",
	"enum",
	"select",
	"while",
	"if",
	"function",
	"get",
	"set",
	"property",
	"try",
	"structure",
	"synclock",
	"using",
	"with"
];
var middleKeywords = [
	"else",
	"elseif",
	"case",
	"catch",
	"finally"
];
var endKeywords = ["next", "loop"];
var operatorKeywords = [
	"and",
	"andalso",
	"or",
	"orelse",
	"xor",
	"in",
	"not",
	"is",
	"isnot",
	"like"
];
var wordOperators = wordRegexp$1(operatorKeywords);
var commonKeywords = [
	"#const",
	"#else",
	"#elseif",
	"#end",
	"#if",
	"#region",
	"addhandler",
	"addressof",
	"alias",
	"as",
	"byref",
	"byval",
	"cbool",
	"cbyte",
	"cchar",
	"cdate",
	"cdbl",
	"cdec",
	"cint",
	"clng",
	"cobj",
	"compare",
	"const",
	"continue",
	"csbyte",
	"cshort",
	"csng",
	"cstr",
	"cuint",
	"culng",
	"cushort",
	"declare",
	"default",
	"delegate",
	"dim",
	"directcast",
	"each",
	"erase",
	"error",
	"event",
	"exit",
	"explicit",
	"false",
	"for",
	"friend",
	"gettype",
	"goto",
	"handles",
	"implements",
	"imports",
	"infer",
	"inherits",
	"interface",
	"isfalse",
	"istrue",
	"lib",
	"me",
	"mod",
	"mustinherit",
	"mustoverride",
	"my",
	"mybase",
	"myclass",
	"namespace",
	"narrowing",
	"new",
	"nothing",
	"notinheritable",
	"notoverridable",
	"of",
	"off",
	"on",
	"operator",
	"option",
	"optional",
	"out",
	"overloads",
	"overridable",
	"overrides",
	"paramarray",
	"partial",
	"private",
	"protected",
	"public",
	"raiseevent",
	"readonly",
	"redim",
	"removehandler",
	"resume",
	"return",
	"shadows",
	"shared",
	"static",
	"step",
	"stop",
	"strict",
	"then",
	"throw",
	"to",
	"true",
	"trycast",
	"typeof",
	"until",
	"until",
	"when",
	"widening",
	"withevents",
	"writeonly"
];
var commontypes = [
	"object",
	"boolean",
	"char",
	"string",
	"byte",
	"sbyte",
	"short",
	"ushort",
	"int16",
	"uint16",
	"integer",
	"uinteger",
	"int32",
	"uint32",
	"long",
	"ulong",
	"int64",
	"uint64",
	"decimal",
	"single",
	"double",
	"float",
	"date",
	"datetime",
	"intptr",
	"uintptr"
];
var keywords$3 = wordRegexp$1(commonKeywords);
var types = wordRegexp$1(commontypes);
var stringPrefixes = "\"";
var opening = wordRegexp$1(openingKeywords);
var middle = wordRegexp$1(middleKeywords);
var closing = wordRegexp$1(endKeywords);
var doubleClosing = wordRegexp$1(["end"]);
var doOpening = wordRegexp$1(["do"]);
var indentInfo = null;
function indent(_stream, state) {
	state.currentIndent++;
}
function dedent(_stream, state) {
	state.currentIndent--;
}
function tokenBase$4(stream, state) {
	if (stream.eatSpace()) return null;
	if (stream.peek() === "'") {
		stream.skipToEnd();
		return "comment";
	}
	if (stream.match(/^((&H)|(&O))?[0-9\.a-f]/i, false)) {
		var floatLiteral = false;
		if (stream.match(/^\d*\.\d+F?/i)) floatLiteral = true;
		else if (stream.match(/^\d+\.\d*F?/)) floatLiteral = true;
		else if (stream.match(/^\.\d+F?/)) floatLiteral = true;
		if (floatLiteral) {
			stream.eat(/J/i);
			return "number";
		}
		var intLiteral = false;
		if (stream.match(/^&H[0-9a-f]+/i)) intLiteral = true;
		else if (stream.match(/^&O[0-7]+/i)) intLiteral = true;
		else if (stream.match(/^[1-9]\d*F?/)) {
			stream.eat(/J/i);
			intLiteral = true;
		} else if (stream.match(/^0(?![\dx])/i)) intLiteral = true;
		if (intLiteral) {
			stream.eat(/L/i);
			return "number";
		}
	}
	if (stream.match(stringPrefixes)) {
		state.tokenize = tokenStringFactory(stream.current());
		return state.tokenize(stream, state);
	}
	if (stream.match(tripleDelimiters) || stream.match(doubleDelimiters)) return null;
	if (stream.match(doubleOperators) || stream.match(singleOperators) || stream.match(wordOperators)) return "operator";
	if (stream.match(singleDelimiters)) return null;
	if (stream.match(doOpening)) {
		indent(stream, state);
		state.doInCurrentLine = true;
		return "keyword";
	}
	if (stream.match(opening)) {
		if (!state.doInCurrentLine) indent(stream, state);
		else state.doInCurrentLine = false;
		return "keyword";
	}
	if (stream.match(middle)) return "keyword";
	if (stream.match(doubleClosing)) {
		dedent(stream, state);
		dedent(stream, state);
		return "keyword";
	}
	if (stream.match(closing)) {
		dedent(stream, state);
		return "keyword";
	}
	if (stream.match(types)) return "keyword";
	if (stream.match(keywords$3)) return "keyword";
	if (stream.match(identifiers)) return "variable";
	stream.next();
	return ERRORCLASS;
}
function tokenStringFactory(delimiter) {
	var singleline = delimiter.length == 1;
	var OUTCLASS = "string";
	return function(stream, state) {
		while (!stream.eol()) {
			stream.eatWhile(/[^'"]/);
			if (stream.match(delimiter)) {
				state.tokenize = tokenBase$4;
				return OUTCLASS;
			} else stream.eat(/['"]/);
		}
		if (singleline) state.tokenize = tokenBase$4;
		return OUTCLASS;
	};
}
function tokenLexer(stream, state) {
	var style = state.tokenize(stream, state);
	var current = stream.current();
	if (current === ".") {
		style = state.tokenize(stream, state);
		if (style === "variable") return "variable";
		else return ERRORCLASS;
	}
	var delimiter_index = "[({".indexOf(current);
	if (delimiter_index !== -1) indent(stream, state);
	if (indentInfo === "dedent") {
		if (dedent(stream, state)) return ERRORCLASS;
	}
	delimiter_index = "])}".indexOf(current);
	if (delimiter_index !== -1) {
		if (dedent(stream, state)) return ERRORCLASS;
	}
	return style;
}
var vb = {
	name: "vb",
	startState: function() {
		return {
			tokenize: tokenBase$4,
			lastToken: null,
			currentIndent: 0,
			nextLineIndent: 0,
			doInCurrentLine: false
		};
	},
	token: function(stream, state) {
		if (stream.sol()) {
			state.currentIndent += state.nextLineIndent;
			state.nextLineIndent = 0;
			state.doInCurrentLine = 0;
		}
		var style = tokenLexer(stream, state);
		state.lastToken = {
			style,
			content: stream.current()
		};
		return style;
	},
	indent: function(state, textAfter, cx) {
		var trueText = textAfter.replace(/^\s+|\s+$/g, "");
		if (trueText.match(closing) || trueText.match(doubleClosing) || trueText.match(middle)) return cx.unit * (state.currentIndent - 1);
		if (state.currentIndent < 0) return 0;
		return state.currentIndent * cx.unit;
	},
	languageData: {
		closeBrackets: { brackets: [
			"(",
			"[",
			"{",
			"\""
		] },
		commentTokens: { line: "'" },
		autocomplete: openingKeywords.concat(middleKeywords).concat(endKeywords).concat(operatorKeywords).concat(commonKeywords).concat(commontypes)
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/vbscript.js
function mkVBScript(parserConf) {
	var ERRORCLASS = "error";
	function wordRegexp(words) {
		return new RegExp("^((" + words.join(")|(") + "))\\b", "i");
	}
	var singleOperators = /* @__PURE__ */ new RegExp("^[\\+\\-\\*/&\\\\\\^<>=]");
	var doubleOperators = /* @__PURE__ */ new RegExp("^((<>)|(<=)|(>=))");
	var singleDelimiters = /* @__PURE__ */ new RegExp("^[\\.,]");
	var brackets = /* @__PURE__ */ new RegExp("^[\\(\\)]");
	var identifiers = /* @__PURE__ */ new RegExp("^[A-Za-z][_A-Za-z0-9]*");
	var openingKeywords = [
		"class",
		"sub",
		"select",
		"while",
		"if",
		"function",
		"property",
		"with",
		"for"
	];
	var middleKeywords = [
		"else",
		"elseif",
		"case"
	];
	var endKeywords = [
		"next",
		"loop",
		"wend"
	];
	var wordOperators = wordRegexp([
		"and",
		"or",
		"not",
		"xor",
		"is",
		"mod",
		"eqv",
		"imp"
	]);
	var commonkeywords = [
		"dim",
		"redim",
		"then",
		"until",
		"randomize",
		"byval",
		"byref",
		"new",
		"property",
		"exit",
		"in",
		"const",
		"private",
		"public",
		"get",
		"set",
		"let",
		"stop",
		"on error resume next",
		"on error goto 0",
		"option explicit",
		"call",
		"me"
	];
	var atomWords = [
		"true",
		"false",
		"nothing",
		"empty",
		"null"
	];
	var builtinFuncsWords = [
		"abs",
		"array",
		"asc",
		"atn",
		"cbool",
		"cbyte",
		"ccur",
		"cdate",
		"cdbl",
		"chr",
		"cint",
		"clng",
		"cos",
		"csng",
		"cstr",
		"date",
		"dateadd",
		"datediff",
		"datepart",
		"dateserial",
		"datevalue",
		"day",
		"escape",
		"eval",
		"execute",
		"exp",
		"filter",
		"formatcurrency",
		"formatdatetime",
		"formatnumber",
		"formatpercent",
		"getlocale",
		"getobject",
		"getref",
		"hex",
		"hour",
		"inputbox",
		"instr",
		"instrrev",
		"int",
		"fix",
		"isarray",
		"isdate",
		"isempty",
		"isnull",
		"isnumeric",
		"isobject",
		"join",
		"lbound",
		"lcase",
		"left",
		"len",
		"loadpicture",
		"log",
		"ltrim",
		"rtrim",
		"trim",
		"maths",
		"mid",
		"minute",
		"month",
		"monthname",
		"msgbox",
		"now",
		"oct",
		"replace",
		"rgb",
		"right",
		"rnd",
		"round",
		"scriptengine",
		"scriptenginebuildversion",
		"scriptenginemajorversion",
		"scriptengineminorversion",
		"second",
		"setlocale",
		"sgn",
		"sin",
		"space",
		"split",
		"sqr",
		"strcomp",
		"string",
		"strreverse",
		"tan",
		"time",
		"timer",
		"timeserial",
		"timevalue",
		"typename",
		"ubound",
		"ucase",
		"unescape",
		"vartype",
		"weekday",
		"weekdayname",
		"year"
	];
	var builtinConsts = [
		"vbBlack",
		"vbRed",
		"vbGreen",
		"vbYellow",
		"vbBlue",
		"vbMagenta",
		"vbCyan",
		"vbWhite",
		"vbBinaryCompare",
		"vbTextCompare",
		"vbSunday",
		"vbMonday",
		"vbTuesday",
		"vbWednesday",
		"vbThursday",
		"vbFriday",
		"vbSaturday",
		"vbUseSystemDayOfWeek",
		"vbFirstJan1",
		"vbFirstFourDays",
		"vbFirstFullWeek",
		"vbGeneralDate",
		"vbLongDate",
		"vbShortDate",
		"vbLongTime",
		"vbShortTime",
		"vbObjectError",
		"vbOKOnly",
		"vbOKCancel",
		"vbAbortRetryIgnore",
		"vbYesNoCancel",
		"vbYesNo",
		"vbRetryCancel",
		"vbCritical",
		"vbQuestion",
		"vbExclamation",
		"vbInformation",
		"vbDefaultButton1",
		"vbDefaultButton2",
		"vbDefaultButton3",
		"vbDefaultButton4",
		"vbApplicationModal",
		"vbSystemModal",
		"vbOK",
		"vbCancel",
		"vbAbort",
		"vbRetry",
		"vbIgnore",
		"vbYes",
		"vbNo",
		"vbCr",
		"VbCrLf",
		"vbFormFeed",
		"vbLf",
		"vbNewLine",
		"vbNullChar",
		"vbNullString",
		"vbTab",
		"vbVerticalTab",
		"vbUseDefault",
		"vbTrue",
		"vbFalse",
		"vbEmpty",
		"vbNull",
		"vbInteger",
		"vbLong",
		"vbSingle",
		"vbDouble",
		"vbCurrency",
		"vbDate",
		"vbString",
		"vbObject",
		"vbError",
		"vbBoolean",
		"vbVariant",
		"vbDataObject",
		"vbDecimal",
		"vbByte",
		"vbArray"
	];
	var builtinObjsWords = [
		"WScript",
		"err",
		"debug",
		"RegExp"
	];
	var knownProperties = [
		"description",
		"firstindex",
		"global",
		"helpcontext",
		"helpfile",
		"ignorecase",
		"length",
		"number",
		"pattern",
		"source",
		"value",
		"count"
	];
	var knownMethods = [
		"clear",
		"execute",
		"raise",
		"replace",
		"test",
		"write",
		"writeline",
		"close",
		"open",
		"state",
		"eof",
		"update",
		"addnew",
		"end",
		"createobject",
		"quit"
	];
	var aspBuiltinObjsWords = [
		"server",
		"response",
		"request",
		"session",
		"application"
	];
	var aspKnownProperties = [
		"buffer",
		"cachecontrol",
		"charset",
		"contenttype",
		"expires",
		"expiresabsolute",
		"isclientconnected",
		"pics",
		"status",
		"clientcertificate",
		"cookies",
		"form",
		"querystring",
		"servervariables",
		"totalbytes",
		"contents",
		"staticobjects",
		"codepage",
		"lcid",
		"sessionid",
		"timeout",
		"scripttimeout"
	];
	var aspKnownMethods = [
		"addheader",
		"appendtolog",
		"binarywrite",
		"end",
		"flush",
		"redirect",
		"binaryread",
		"remove",
		"removeall",
		"lock",
		"unlock",
		"abandon",
		"getlasterror",
		"htmlencode",
		"mappath",
		"transfer",
		"urlencode"
	];
	var knownWords = knownMethods.concat(knownProperties);
	builtinObjsWords = builtinObjsWords.concat(builtinConsts);
	if (parserConf.isASP) {
		builtinObjsWords = builtinObjsWords.concat(aspBuiltinObjsWords);
		knownWords = knownWords.concat(aspKnownMethods, aspKnownProperties);
	}
	var keywords = wordRegexp(commonkeywords);
	var atoms = wordRegexp(atomWords);
	var builtinFuncs = wordRegexp(builtinFuncsWords);
	var builtinObjs = wordRegexp(builtinObjsWords);
	var known = wordRegexp(knownWords);
	var stringPrefixes = "\"";
	var opening = wordRegexp(openingKeywords);
	var middle = wordRegexp(middleKeywords);
	var closing = wordRegexp(endKeywords);
	var doubleClosing = wordRegexp(["end"]);
	var doOpening = wordRegexp(["do"]);
	var noIndentWords = wordRegexp(["on error resume next", "exit"]);
	var comment = wordRegexp(["rem"]);
	function indent(_stream, state) {
		state.currentIndent++;
	}
	function dedent(_stream, state) {
		state.currentIndent--;
	}
	function tokenBase(stream, state) {
		if (stream.eatSpace()) return null;
		if (stream.peek() === "'") {
			stream.skipToEnd();
			return "comment";
		}
		if (stream.match(comment)) {
			stream.skipToEnd();
			return "comment";
		}
		if (stream.match(/^((&H)|(&O))?[0-9\.]/i, false) && !stream.match(/^((&H)|(&O))?[0-9\.]+[a-z_]/i, false)) {
			var floatLiteral = false;
			if (stream.match(/^\d*\.\d+/i)) floatLiteral = true;
			else if (stream.match(/^\d+\.\d*/)) floatLiteral = true;
			else if (stream.match(/^\.\d+/)) floatLiteral = true;
			if (floatLiteral) {
				stream.eat(/J/i);
				return "number";
			}
			var intLiteral = false;
			if (stream.match(/^&H[0-9a-f]+/i)) intLiteral = true;
			else if (stream.match(/^&O[0-7]+/i)) intLiteral = true;
			else if (stream.match(/^[1-9]\d*F?/)) {
				stream.eat(/J/i);
				intLiteral = true;
			} else if (stream.match(/^0(?![\dx])/i)) intLiteral = true;
			if (intLiteral) {
				stream.eat(/L/i);
				return "number";
			}
		}
		if (stream.match(stringPrefixes)) {
			state.tokenize = tokenStringFactory(stream.current());
			return state.tokenize(stream, state);
		}
		if (stream.match(doubleOperators) || stream.match(singleOperators) || stream.match(wordOperators)) return "operator";
		if (stream.match(singleDelimiters)) return null;
		if (stream.match(brackets)) return "bracket";
		if (stream.match(noIndentWords)) {
			state.doInCurrentLine = true;
			return "keyword";
		}
		if (stream.match(doOpening)) {
			indent(stream, state);
			state.doInCurrentLine = true;
			return "keyword";
		}
		if (stream.match(opening)) {
			if (!state.doInCurrentLine) indent(stream, state);
			else state.doInCurrentLine = false;
			return "keyword";
		}
		if (stream.match(middle)) return "keyword";
		if (stream.match(doubleClosing)) {
			dedent(stream, state);
			dedent(stream, state);
			return "keyword";
		}
		if (stream.match(closing)) {
			if (!state.doInCurrentLine) dedent(stream, state);
			else state.doInCurrentLine = false;
			return "keyword";
		}
		if (stream.match(keywords)) return "keyword";
		if (stream.match(atoms)) return "atom";
		if (stream.match(known)) return "variableName.special";
		if (stream.match(builtinFuncs)) return "builtin";
		if (stream.match(builtinObjs)) return "builtin";
		if (stream.match(identifiers)) return "variable";
		stream.next();
		return ERRORCLASS;
	}
	function tokenStringFactory(delimiter) {
		var singleline = delimiter.length == 1;
		var OUTCLASS = "string";
		return function(stream, state) {
			while (!stream.eol()) {
				stream.eatWhile(/[^'"]/);
				if (stream.match(delimiter)) {
					state.tokenize = tokenBase;
					return OUTCLASS;
				} else stream.eat(/['"]/);
			}
			if (singleline) state.tokenize = tokenBase;
			return OUTCLASS;
		};
	}
	function tokenLexer(stream, state) {
		var style = state.tokenize(stream, state);
		var current = stream.current();
		if (current === ".") {
			style = state.tokenize(stream, state);
			current = stream.current();
			if (style && (style.substr(0, 8) === "variable" || style === "builtin" || style === "keyword")) {
				if (style === "builtin" || style === "keyword") style = "variable";
				if (knownWords.indexOf(current.substr(1)) > -1) style = "keyword";
				return style;
			} else return ERRORCLASS;
		}
		return style;
	}
	return {
		name: "vbscript",
		startState: function() {
			return {
				tokenize: tokenBase,
				lastToken: null,
				currentIndent: 0,
				nextLineIndent: 0,
				doInCurrentLine: false,
				ignoreKeyword: false
			};
		},
		token: function(stream, state) {
			if (stream.sol()) {
				state.currentIndent += state.nextLineIndent;
				state.nextLineIndent = 0;
				state.doInCurrentLine = 0;
			}
			var style = tokenLexer(stream, state);
			state.lastToken = {
				style,
				content: stream.current()
			};
			if (style === null) style = null;
			return style;
		},
		indent: function(state, textAfter, cx) {
			var trueText = textAfter.replace(/^\s+|\s+$/g, "");
			if (trueText.match(closing) || trueText.match(doubleClosing) || trueText.match(middle)) return cx.unit * (state.currentIndent - 1);
			if (state.currentIndent < 0) return 0;
			return state.currentIndent * cx.unit;
		}
	};
}
var vbScript = mkVBScript({});
mkVBScript({ isASP: true });
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/velocity.js
function parseWords(str) {
	var obj = {}, words = str.split(" ");
	for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
	return obj;
}
var keywords$2 = parseWords("#end #else #break #stop #[[ #]] #{end} #{else} #{break} #{stop}");
var functions = parseWords("#if #elseif #foreach #set #include #parse #macro #define #evaluate #{if} #{elseif} #{foreach} #{set} #{include} #{parse} #{macro} #{define} #{evaluate}");
var specials = parseWords("$foreach.count $foreach.hasNext $foreach.first $foreach.last $foreach.topmost $foreach.parent.count $foreach.parent.hasNext $foreach.parent.first $foreach.parent.last $foreach.parent $velocityCount $!bodyContent $bodyContent");
var isOperatorChar$1 = /[+\-*&%=<>!?:\/|]/;
function chain$1(stream, state, f) {
	state.tokenize = f;
	return f(stream, state);
}
function tokenBase$3(stream, state) {
	var beforeParams = state.beforeParams;
	state.beforeParams = false;
	var ch = stream.next();
	if (ch == "'" && !state.inString && state.inParams) {
		state.lastTokenWasBuiltin = false;
		return chain$1(stream, state, tokenString$3(ch));
	} else if (ch == "\"") {
		state.lastTokenWasBuiltin = false;
		if (state.inString) {
			state.inString = false;
			return "string";
		} else if (state.inParams) return chain$1(stream, state, tokenString$3(ch));
	} else if (/[\[\]{}\(\),;\.]/.test(ch)) {
		if (ch == "(" && beforeParams) state.inParams = true;
		else if (ch == ")") {
			state.inParams = false;
			state.lastTokenWasBuiltin = true;
		}
		return null;
	} else if (/\d/.test(ch)) {
		state.lastTokenWasBuiltin = false;
		stream.eatWhile(/[\w\.]/);
		return "number";
	} else if (ch == "#" && stream.eat("*")) {
		state.lastTokenWasBuiltin = false;
		return chain$1(stream, state, tokenComment$2);
	} else if (ch == "#" && stream.match(/ *\[ *\[/)) {
		state.lastTokenWasBuiltin = false;
		return chain$1(stream, state, tokenUnparsed);
	} else if (ch == "#" && stream.eat("#")) {
		state.lastTokenWasBuiltin = false;
		stream.skipToEnd();
		return "comment";
	} else if (ch == "$") {
		stream.eat("!");
		stream.eatWhile(/[\w\d\$_\.{}-]/);
		if (specials && specials.propertyIsEnumerable(stream.current())) return "keyword";
		else {
			state.lastTokenWasBuiltin = true;
			state.beforeParams = true;
			return "builtin";
		}
	} else if (isOperatorChar$1.test(ch)) {
		state.lastTokenWasBuiltin = false;
		stream.eatWhile(isOperatorChar$1);
		return "operator";
	} else {
		stream.eatWhile(/[\w\$_{}@]/);
		var word = stream.current();
		if (keywords$2 && keywords$2.propertyIsEnumerable(word)) return "keyword";
		if (functions && functions.propertyIsEnumerable(word) || stream.current().match(/^#@?[a-z0-9_]+ *$/i) && stream.peek() == "(" && !(functions && functions.propertyIsEnumerable(word.toLowerCase()))) {
			state.beforeParams = true;
			state.lastTokenWasBuiltin = false;
			return "keyword";
		}
		if (state.inString) {
			state.lastTokenWasBuiltin = false;
			return "string";
		}
		if (stream.pos > word.length && stream.string.charAt(stream.pos - word.length - 1) == "." && state.lastTokenWasBuiltin) return "builtin";
		state.lastTokenWasBuiltin = false;
		return null;
	}
}
function tokenString$3(quote) {
	return function(stream, state) {
		var escaped = false, next, end = false;
		while ((next = stream.next()) != null) {
			if (next == quote && !escaped) {
				end = true;
				break;
			}
			if (quote == "\"" && stream.peek() == "$" && !escaped) {
				state.inString = true;
				end = true;
				break;
			}
			escaped = !escaped && next == "\\";
		}
		if (end) state.tokenize = tokenBase$3;
		return "string";
	};
}
function tokenComment$2(stream, state) {
	var maybeEnd = false, ch;
	while (ch = stream.next()) {
		if (ch == "#" && maybeEnd) {
			state.tokenize = tokenBase$3;
			break;
		}
		maybeEnd = ch == "*";
	}
	return "comment";
}
function tokenUnparsed(stream, state) {
	var maybeEnd = 0, ch;
	while (ch = stream.next()) {
		if (ch == "#" && maybeEnd == 2) {
			state.tokenize = tokenBase$3;
			break;
		}
		if (ch == "]") maybeEnd++;
		else if (ch != " ") maybeEnd = 0;
	}
	return "meta";
}
var velocity = {
	name: "velocity",
	startState: function() {
		return {
			tokenize: tokenBase$3,
			beforeParams: false,
			inParams: false,
			inString: false,
			lastTokenWasBuiltin: false
		};
	},
	token: function(stream, state) {
		if (stream.eatSpace()) return null;
		return state.tokenize(stream, state);
	},
	languageData: { commentTokens: {
		line: "##",
		block: {
			open: "#*",
			close: "*#"
		}
	} }
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/vhdl.js
function words$1(str) {
	var obj = {}, words = str.split(",");
	for (var i = 0; i < words.length; ++i) {
		var allCaps = words[i].toUpperCase();
		var firstCap = words[i].charAt(0).toUpperCase() + words[i].slice(1);
		obj[words[i]] = true;
		obj[allCaps] = true;
		obj[firstCap] = true;
	}
	return obj;
}
function metaHook(stream) {
	stream.eatWhile(/[\w\$_]/);
	return "meta";
}
var atoms = words$1("null");
var hooks = {
	"`": metaHook,
	"$": metaHook
};
var multiLineStrings = false;
var keywords$1 = words$1("abs,access,after,alias,all,and,architecture,array,assert,attribute,begin,block,body,buffer,bus,case,component,configuration,constant,disconnect,downto,else,elsif,end,end block,end case,end component,end for,end generate,end if,end loop,end process,end record,end units,entity,exit,file,for,function,generate,generic,generic map,group,guarded,if,impure,in,inertial,inout,is,label,library,linkage,literal,loop,map,mod,nand,new,next,nor,null,of,on,open,or,others,out,package,package body,port,port map,postponed,procedure,process,pure,range,record,register,reject,rem,report,return,rol,ror,select,severity,signal,sla,sll,sra,srl,subtype,then,to,transport,type,unaffected,units,until,use,variable,wait,when,while,with,xnor,xor");
var blockKeywords = words$1("architecture,entity,begin,case,port,else,elsif,end,for,function,if");
var isOperatorChar = /[&|~><!\)\(*#%@+\/=?\:;}{,\.\^\-\[\]]/;
var curPunc;
function tokenBase$2(stream, state) {
	var ch = stream.next();
	if (hooks[ch]) {
		var result = hooks[ch](stream, state);
		if (result !== false) return result;
	}
	if (ch == "\"") {
		state.tokenize = tokenString2(ch);
		return state.tokenize(stream, state);
	}
	if (ch == "'") {
		state.tokenize = tokenString$2(ch);
		return state.tokenize(stream, state);
	}
	if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
		curPunc = ch;
		return null;
	}
	if (/[\d']/.test(ch)) {
		stream.eatWhile(/[\w\.']/);
		return "number";
	}
	if (ch == "-") {
		if (stream.eat("-")) {
			stream.skipToEnd();
			return "comment";
		}
	}
	if (isOperatorChar.test(ch)) {
		stream.eatWhile(isOperatorChar);
		return "operator";
	}
	stream.eatWhile(/[\w\$_]/);
	var cur = stream.current();
	if (keywords$1.propertyIsEnumerable(cur.toLowerCase())) {
		if (blockKeywords.propertyIsEnumerable(cur)) curPunc = "newstatement";
		return "keyword";
	}
	if (atoms.propertyIsEnumerable(cur)) return "atom";
	return "variable";
}
function tokenString$2(quote) {
	return function(stream, state) {
		var escaped = false, next, end = false;
		while ((next = stream.next()) != null) {
			if (next == quote && !escaped) {
				end = true;
				break;
			}
			escaped = !escaped && next == "--";
		}
		if (end || !(escaped || multiLineStrings)) state.tokenize = tokenBase$2;
		return "string";
	};
}
function tokenString2(quote) {
	return function(stream, state) {
		var escaped = false, next, end = false;
		while ((next = stream.next()) != null) {
			if (next == quote && !escaped) {
				end = true;
				break;
			}
			escaped = !escaped && next == "--";
		}
		if (end || !(escaped || multiLineStrings)) state.tokenize = tokenBase$2;
		return "string.special";
	};
}
function Context(indented, column, type, align, prev) {
	this.indented = indented;
	this.column = column;
	this.type = type;
	this.align = align;
	this.prev = prev;
}
function pushContext(state, col, type) {
	return state.context = new Context(state.indented, col, type, null, state.context);
}
function popContext(state) {
	var t = state.context.type;
	if (t == ")" || t == "]" || t == "}") state.indented = state.context.indented;
	return state.context = state.context.prev;
}
var vhdl = {
	name: "vhdl",
	startState: function(indentUnit) {
		return {
			tokenize: null,
			context: new Context(-indentUnit, 0, "top", false),
			indented: 0,
			startOfLine: true
		};
	},
	token: function(stream, state) {
		var ctx = state.context;
		if (stream.sol()) {
			if (ctx.align == null) ctx.align = false;
			state.indented = stream.indentation();
			state.startOfLine = true;
		}
		if (stream.eatSpace()) return null;
		curPunc = null;
		var style = (state.tokenize || tokenBase$2)(stream, state);
		if (style == "comment" || style == "meta") return style;
		if (ctx.align == null) ctx.align = true;
		if ((curPunc == ";" || curPunc == ":") && ctx.type == "statement") popContext(state);
		else if (curPunc == "{") pushContext(state, stream.column(), "}");
		else if (curPunc == "[") pushContext(state, stream.column(), "]");
		else if (curPunc == "(") pushContext(state, stream.column(), ")");
		else if (curPunc == "}") {
			while (ctx.type == "statement") ctx = popContext(state);
			if (ctx.type == "}") ctx = popContext(state);
			while (ctx.type == "statement") ctx = popContext(state);
		} else if (curPunc == ctx.type) popContext(state);
		else if (ctx.type == "}" || ctx.type == "top" || ctx.type == "statement" && curPunc == "newstatement") pushContext(state, stream.column(), "statement");
		state.startOfLine = false;
		return style;
	},
	indent: function(state, textAfter, cx) {
		if (state.tokenize != tokenBase$2 && state.tokenize != null) return 0;
		var firstChar = textAfter && textAfter.charAt(0), ctx = state.context, closing = firstChar == ctx.type;
		if (ctx.type == "statement") return ctx.indented + (firstChar == "{" ? 0 : cx.unit);
		else if (ctx.align) return ctx.column + (closing ? 0 : 1);
		else return ctx.indented + (closing ? 0 : cx.unit);
	},
	languageData: {
		indentOnInput: /^\s*[{}]$/,
		commentTokens: { line: "--" }
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/xquery.js
var keywords = function() {
	function kw(type) {
		return {
			type,
			style: "keyword"
		};
	}
	var operator = kw("operator"), atom = {
		type: "atom",
		style: "atom"
	}, punctuation = {
		type: "punctuation",
		style: null
	}, qualifier = {
		type: "axis_specifier",
		style: "qualifier"
	};
	var kwObj = { ",": punctuation };
	var basic = [
		"after",
		"all",
		"allowing",
		"ancestor",
		"ancestor-or-self",
		"any",
		"array",
		"as",
		"ascending",
		"at",
		"attribute",
		"base-uri",
		"before",
		"boundary-space",
		"by",
		"case",
		"cast",
		"castable",
		"catch",
		"child",
		"collation",
		"comment",
		"construction",
		"contains",
		"content",
		"context",
		"copy",
		"copy-namespaces",
		"count",
		"decimal-format",
		"declare",
		"default",
		"delete",
		"descendant",
		"descendant-or-self",
		"descending",
		"diacritics",
		"different",
		"distance",
		"document",
		"document-node",
		"element",
		"else",
		"empty",
		"empty-sequence",
		"encoding",
		"end",
		"entire",
		"every",
		"exactly",
		"except",
		"external",
		"first",
		"following",
		"following-sibling",
		"for",
		"from",
		"ftand",
		"ftnot",
		"ft-option",
		"ftor",
		"function",
		"fuzzy",
		"greatest",
		"group",
		"if",
		"import",
		"in",
		"inherit",
		"insensitive",
		"insert",
		"instance",
		"intersect",
		"into",
		"invoke",
		"is",
		"item",
		"language",
		"last",
		"lax",
		"least",
		"let",
		"levels",
		"lowercase",
		"map",
		"modify",
		"module",
		"most",
		"namespace",
		"next",
		"no",
		"node",
		"nodes",
		"no-inherit",
		"no-preserve",
		"not",
		"occurs",
		"of",
		"only",
		"option",
		"order",
		"ordered",
		"ordering",
		"paragraph",
		"paragraphs",
		"parent",
		"phrase",
		"preceding",
		"preceding-sibling",
		"preserve",
		"previous",
		"processing-instruction",
		"relationship",
		"rename",
		"replace",
		"return",
		"revalidation",
		"same",
		"satisfies",
		"schema",
		"schema-attribute",
		"schema-element",
		"score",
		"self",
		"sensitive",
		"sentence",
		"sentences",
		"sequence",
		"skip",
		"sliding",
		"some",
		"stable",
		"start",
		"stemming",
		"stop",
		"strict",
		"strip",
		"switch",
		"text",
		"then",
		"thesaurus",
		"times",
		"to",
		"transform",
		"treat",
		"try",
		"tumbling",
		"type",
		"typeswitch",
		"union",
		"unordered",
		"update",
		"updating",
		"uppercase",
		"using",
		"validate",
		"value",
		"variable",
		"version",
		"weight",
		"when",
		"where",
		"wildcards",
		"window",
		"with",
		"without",
		"word",
		"words",
		"xquery"
	];
	for (var i = 0, l = basic.length; i < l; i++) kwObj[basic[i]] = kw(basic[i]);
	var types = [
		"xs:anyAtomicType",
		"xs:anySimpleType",
		"xs:anyType",
		"xs:anyURI",
		"xs:base64Binary",
		"xs:boolean",
		"xs:byte",
		"xs:date",
		"xs:dateTime",
		"xs:dateTimeStamp",
		"xs:dayTimeDuration",
		"xs:decimal",
		"xs:double",
		"xs:duration",
		"xs:ENTITIES",
		"xs:ENTITY",
		"xs:float",
		"xs:gDay",
		"xs:gMonth",
		"xs:gMonthDay",
		"xs:gYear",
		"xs:gYearMonth",
		"xs:hexBinary",
		"xs:ID",
		"xs:IDREF",
		"xs:IDREFS",
		"xs:int",
		"xs:integer",
		"xs:item",
		"xs:java",
		"xs:language",
		"xs:long",
		"xs:Name",
		"xs:NCName",
		"xs:negativeInteger",
		"xs:NMTOKEN",
		"xs:NMTOKENS",
		"xs:nonNegativeInteger",
		"xs:nonPositiveInteger",
		"xs:normalizedString",
		"xs:NOTATION",
		"xs:numeric",
		"xs:positiveInteger",
		"xs:precisionDecimal",
		"xs:QName",
		"xs:short",
		"xs:string",
		"xs:time",
		"xs:token",
		"xs:unsignedByte",
		"xs:unsignedInt",
		"xs:unsignedLong",
		"xs:unsignedShort",
		"xs:untyped",
		"xs:untypedAtomic",
		"xs:yearMonthDuration"
	];
	for (var i = 0, l = types.length; i < l; i++) kwObj[types[i]] = atom;
	var operators = [
		"eq",
		"ne",
		"lt",
		"le",
		"gt",
		"ge",
		":=",
		"=",
		">",
		">=",
		"<",
		"<=",
		".",
		"|",
		"?",
		"and",
		"or",
		"div",
		"idiv",
		"mod",
		"*",
		"/",
		"+",
		"-"
	];
	for (var i = 0, l = operators.length; i < l; i++) kwObj[operators[i]] = operator;
	var axis_specifiers = [
		"self::",
		"attribute::",
		"child::",
		"descendant::",
		"descendant-or-self::",
		"parent::",
		"ancestor::",
		"ancestor-or-self::",
		"following::",
		"preceding::",
		"following-sibling::",
		"preceding-sibling::"
	];
	for (var i = 0, l = axis_specifiers.length; i < l; i++) kwObj[axis_specifiers[i]] = qualifier;
	return kwObj;
}();
function chain(stream, state, f) {
	state.tokenize = f;
	return f(stream, state);
}
function tokenBase$1(stream, state) {
	var ch = stream.next(), mightBeFunction = false, isEQName = isEQNameAhead(stream);
	if (ch == "<") {
		if (stream.match("!--", true)) return chain(stream, state, tokenXMLComment);
		if (stream.match("![CDATA", false)) {
			state.tokenize = tokenCDATA;
			return "tag";
		}
		if (stream.match("?", false)) return chain(stream, state, tokenPreProcessing);
		var isclose = stream.eat("/");
		stream.eatSpace();
		var tagName = "", c;
		while (c = stream.eat(/[^\s\u00a0=<>\"\'\/?]/)) tagName += c;
		return chain(stream, state, tokenTag(tagName, isclose));
	} else if (ch == "{") {
		pushStateStack(state, { type: "codeblock" });
		return null;
	} else if (ch == "}") {
		popStateStack(state);
		return null;
	} else if (isInXmlBlock(state)) {
		if (ch == ">") return "tag";
		else if (ch == "/" && stream.eat(">")) {
			popStateStack(state);
			return "tag";
		} else return "variable";
	} else if (/\d/.test(ch)) {
		stream.match(/^\d*(?:\.\d*)?(?:E[+\-]?\d+)?/);
		return "atom";
	} else if (ch === "(" && stream.eat(":")) {
		pushStateStack(state, { type: "comment" });
		return chain(stream, state, tokenComment$1);
	} else if (!isEQName && (ch === "\"" || ch === "'")) return startString(stream, state, ch);
	else if (ch === "$") return chain(stream, state, tokenVariable);
	else if (ch === ":" && stream.eat("=")) return "keyword";
	else if (ch === "(") {
		pushStateStack(state, { type: "paren" });
		return null;
	} else if (ch === ")") {
		popStateStack(state);
		return null;
	} else if (ch === "[") {
		pushStateStack(state, { type: "bracket" });
		return null;
	} else if (ch === "]") {
		popStateStack(state);
		return null;
	} else {
		var known = keywords.propertyIsEnumerable(ch) && keywords[ch];
		if (isEQName && ch === "\"") while (stream.next() !== "\"");
		if (isEQName && ch === "'") while (stream.next() !== "'");
		if (!known) stream.eatWhile(/[\w\$_-]/);
		var foundColon = stream.eat(":");
		if (!stream.eat(":") && foundColon) stream.eatWhile(/[\w\$_-]/);
		if (stream.match(/^[ \t]*\(/, false)) mightBeFunction = true;
		var word = stream.current();
		known = keywords.propertyIsEnumerable(word) && keywords[word];
		if (mightBeFunction && !known) known = {
			type: "function_call",
			style: "def"
		};
		if (isInXmlConstructor(state)) {
			popStateStack(state);
			return "variable";
		}
		if (word == "element" || word == "attribute" || known.type == "axis_specifier") pushStateStack(state, { type: "xmlconstructor" });
		return known ? known.style : "variable";
	}
}
function tokenComment$1(stream, state) {
	var maybeEnd = false, maybeNested = false, nestedCount = 0, ch;
	while (ch = stream.next()) {
		if (ch == ")" && maybeEnd) {
			if (nestedCount > 0) nestedCount--;
			else {
				popStateStack(state);
				break;
			}
		} else if (ch == ":" && maybeNested) nestedCount++;
		maybeEnd = ch == ":";
		maybeNested = ch == "(";
	}
	return "comment";
}
function tokenString$1(quote, f) {
	return function(stream, state) {
		var ch;
		while (ch = stream.next()) if (ch == quote) {
			popStateStack(state);
			if (f) state.tokenize = f;
			break;
		} else if (stream.match("{", false) && isInXmlAttributeBlock(state)) {
			pushStateStack(state, { type: "codeblock" });
			state.tokenize = tokenBase$1;
			return "string";
		}
		return "string";
	};
}
function startString(stream, state, quote, f) {
	let tokenize = tokenString$1(quote, f);
	pushStateStack(state, {
		type: "string",
		name: quote,
		tokenize
	});
	return chain(stream, state, tokenize);
}
function tokenVariable(stream, state) {
	var isVariableChar = /[\w\$_-]/;
	if (stream.eat("\"")) {
		while (stream.next() !== "\"");
		stream.eat(":");
	} else {
		stream.eatWhile(isVariableChar);
		if (!stream.match(":=", false)) stream.eat(":");
	}
	stream.eatWhile(isVariableChar);
	state.tokenize = tokenBase$1;
	return "variable";
}
function tokenTag(name, isclose) {
	return function(stream, state) {
		stream.eatSpace();
		if (isclose && stream.eat(">")) {
			popStateStack(state);
			state.tokenize = tokenBase$1;
			return "tag";
		}
		if (!stream.eat("/")) pushStateStack(state, {
			type: "tag",
			name,
			tokenize: tokenBase$1
		});
		if (!stream.eat(">")) {
			state.tokenize = tokenAttribute;
			return "tag";
		} else state.tokenize = tokenBase$1;
		return "tag";
	};
}
function tokenAttribute(stream, state) {
	var ch = stream.next();
	if (ch == "/" && stream.eat(">")) {
		if (isInXmlAttributeBlock(state)) popStateStack(state);
		if (isInXmlBlock(state)) popStateStack(state);
		return "tag";
	}
	if (ch == ">") {
		if (isInXmlAttributeBlock(state)) popStateStack(state);
		return "tag";
	}
	if (ch == "=") return null;
	if (ch == "\"" || ch == "'") return startString(stream, state, ch, tokenAttribute);
	if (!isInXmlAttributeBlock(state)) pushStateStack(state, {
		type: "attribute",
		tokenize: tokenAttribute
	});
	stream.eat(/[a-zA-Z_:]/);
	stream.eatWhile(/[-a-zA-Z0-9_:.]/);
	stream.eatSpace();
	if (stream.match(">", false) || stream.match("/", false)) {
		popStateStack(state);
		state.tokenize = tokenBase$1;
	}
	return "attribute";
}
function tokenXMLComment(stream, state) {
	var ch;
	while (ch = stream.next()) if (ch == "-" && stream.match("->", true)) {
		state.tokenize = tokenBase$1;
		return "comment";
	}
}
function tokenCDATA(stream, state) {
	var ch;
	while (ch = stream.next()) if (ch == "]" && stream.match("]", true)) {
		state.tokenize = tokenBase$1;
		return "comment";
	}
}
function tokenPreProcessing(stream, state) {
	var ch;
	while (ch = stream.next()) if (ch == "?" && stream.match(">", true)) {
		state.tokenize = tokenBase$1;
		return "processingInstruction";
	}
}
function isInXmlBlock(state) {
	return isIn(state, "tag");
}
function isInXmlAttributeBlock(state) {
	return isIn(state, "attribute");
}
function isInXmlConstructor(state) {
	return isIn(state, "xmlconstructor");
}
function isEQNameAhead(stream) {
	if (stream.current() === "\"") return stream.match(/^[^\"]+\"\:/, false);
	else if (stream.current() === "'") return stream.match(/^[^\"]+\'\:/, false);
	else return false;
}
function isIn(state, type) {
	return state.stack.length && state.stack[state.stack.length - 1].type == type;
}
function pushStateStack(state, newState) {
	state.stack.push(newState);
}
function popStateStack(state) {
	state.stack.pop();
	state.tokenize = state.stack.length && state.stack[state.stack.length - 1].tokenize || tokenBase$1;
}
var xQuery = {
	name: "xquery",
	startState: function() {
		return {
			tokenize: tokenBase$1,
			cc: [],
			stack: []
		};
	},
	token: function(stream, state) {
		if (stream.eatSpace()) return null;
		return state.tokenize(stream, state);
	},
	languageData: { commentTokens: { block: {
		open: "(:",
		close: ":)"
	} } }
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/yacas.js
function words(str) {
	var obj = {}, words = str.split(" ");
	for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
	return obj;
}
var bodiedOps = words("Assert BackQuote D Defun Deriv For ForEach FromFile FromString Function Integrate InverseTaylor Limit LocalSymbols Macro MacroRule MacroRulePattern NIntegrate Rule RulePattern Subst TD TExplicitSum TSum Taylor Taylor1 Taylor2 Taylor3 ToFile ToStdout ToString TraceRule Until While");
var pFloatForm = "(?:(?:\\.\\d+|\\d+\\.\\d*|\\d+)(?:[eE][+-]?\\d+)?)";
var pIdentifier = "(?:[a-zA-Z\\$'][a-zA-Z0-9\\$']*)";
var reFloatForm = new RegExp(pFloatForm);
var reIdentifier = new RegExp(pIdentifier);
var rePattern = new RegExp(pIdentifier + "?_" + pIdentifier);
var reFunctionLike = new RegExp(pIdentifier + "\\s*\\(");
function tokenBase(stream, state) {
	var ch = stream.next();
	if (ch === "\"") {
		state.tokenize = tokenString;
		return state.tokenize(stream, state);
	}
	if (ch === "/") {
		if (stream.eat("*")) {
			state.tokenize = tokenComment;
			return state.tokenize(stream, state);
		}
		if (stream.eat("/")) {
			stream.skipToEnd();
			return "comment";
		}
	}
	stream.backUp(1);
	var m = stream.match(/^(\w+)\s*\(/, false);
	if (m !== null && bodiedOps.hasOwnProperty(m[1])) state.scopes.push("bodied");
	var scope = currentScope(state);
	if (scope === "bodied" && ch === "[") state.scopes.pop();
	if (ch === "[" || ch === "{" || ch === "(") state.scopes.push(ch);
	scope = currentScope(state);
	if (scope === "[" && ch === "]" || scope === "{" && ch === "}" || scope === "(" && ch === ")") state.scopes.pop();
	if (ch === ";") while (scope === "bodied") {
		state.scopes.pop();
		scope = currentScope(state);
	}
	if (stream.match(/\d+ *#/, true, false)) return "qualifier";
	if (stream.match(reFloatForm, true, false)) return "number";
	if (stream.match(rePattern, true, false)) return "variableName.special";
	if (stream.match(/(?:\[|\]|{|}|\(|\))/, true, false)) return "bracket";
	if (stream.match(reFunctionLike, true, false)) {
		stream.backUp(1);
		return "variableName.function";
	}
	if (stream.match(reIdentifier, true, false)) return "variable";
	if (stream.match(/(?:\\|\+|\-|\*|\/|,|;|\.|:|@|~|=|>|<|&|\||_|`|'|\^|\?|!|%|#)/, true, false)) return "operator";
	return "error";
}
function tokenString(stream, state) {
	var next, end = false, escaped = false;
	while ((next = stream.next()) != null) {
		if (next === "\"" && !escaped) {
			end = true;
			break;
		}
		escaped = !escaped && next === "\\";
	}
	if (end && !escaped) state.tokenize = tokenBase;
	return "string";
}
function tokenComment(stream, state) {
	var prev, next;
	while ((next = stream.next()) != null) {
		if (prev === "*" && next === "/") {
			state.tokenize = tokenBase;
			break;
		}
		prev = next;
	}
	return "comment";
}
function currentScope(state) {
	var scope = null;
	if (state.scopes.length > 0) scope = state.scopes[state.scopes.length - 1];
	return scope;
}
var yacas = {
	name: "yacas",
	startState: function() {
		return {
			tokenize: tokenBase,
			scopes: []
		};
	},
	token: function(stream, state) {
		if (stream.eatSpace()) return null;
		return state.tokenize(stream, state);
	},
	indent: function(state, textAfter, cx) {
		if (state.tokenize !== tokenBase && state.tokenize !== null) return null;
		var delta = 0;
		if (textAfter === "]" || textAfter === "];" || textAfter === "}" || textAfter === "};" || textAfter === ");") delta = -1;
		return (state.scopes.length + delta) * cx.unit;
	},
	languageData: {
		electricInput: /[{}\[\]()\;]/,
		commentTokens: {
			line: "//",
			block: {
				open: "/*",
				close: "*/"
			}
		}
	}
};
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/z80.js
function mkZ80(ez80) {
	var keywords1, keywords2;
	if (ez80) {
		keywords1 = /^(exx?|(ld|cp)([di]r?)?|[lp]ea|pop|push|ad[cd]|cpl|daa|dec|inc|neg|sbc|sub|and|bit|[cs]cf|x?or|res|set|r[lr]c?a?|r[lr]d|s[lr]a|srl|djnz|nop|[de]i|halt|im|in([di]mr?|ir?|irx|2r?)|ot(dmr?|[id]rx|imr?)|out(0?|[di]r?|[di]2r?)|tst(io)?|slp)(\.([sl]?i)?[sl])?\b/i;
		keywords2 = /^(((call|j[pr]|rst|ret[in]?)(\.([sl]?i)?[sl])?)|(rs|st)mix)\b/i;
	} else {
		keywords1 = /^(exx?|(ld|cp|in)([di]r?)?|pop|push|ad[cd]|cpl|daa|dec|inc|neg|sbc|sub|and|bit|[cs]cf|x?or|res|set|r[lr]c?a?|r[lr]d|s[lr]a|srl|djnz|nop|rst|[de]i|halt|im|ot[di]r|out[di]?)\b/i;
		keywords2 = /^(call|j[pr]|ret[in]?|b_?(call|jump))\b/i;
	}
	var variables1 = /^(af?|bc?|c|de?|e|hl?|l|i[xy]?|r|sp)\b/i;
	var variables2 = /^(n?[zc]|p[oe]?|m)\b/i;
	var errors = /^([hl][xy]|i[xy][hl]|slia|sll)\b/i;
	var numbers = /^([\da-f]+h|[0-7]+o|[01]+b|\d+d?)\b/i;
	return {
		name: "z80",
		startState: function() {
			return { context: 0 };
		},
		token: function(stream, state) {
			if (!stream.column()) state.context = 0;
			if (stream.eatSpace()) return null;
			var w;
			if (stream.eatWhile(/\w/)) {
				if (ez80 && stream.eat(".")) stream.eatWhile(/\w/);
				w = stream.current();
				if (stream.indentation()) {
					if ((state.context == 1 || state.context == 4) && variables1.test(w)) {
						state.context = 4;
						return "variable";
					}
					if (state.context == 2 && variables2.test(w)) {
						state.context = 4;
						return "variableName.special";
					}
					if (keywords1.test(w)) {
						state.context = 1;
						return "keyword";
					} else if (keywords2.test(w)) {
						state.context = 2;
						return "keyword";
					} else if (state.context == 4 && numbers.test(w)) return "number";
					if (errors.test(w)) return "error";
				} else if (stream.match(numbers)) return "number";
				else return null;
			} else if (stream.eat(";")) {
				stream.skipToEnd();
				return "comment";
			} else if (stream.eat("\"")) {
				while (w = stream.next()) {
					if (w == "\"") break;
					if (w == "\\") stream.next();
				}
				return "string";
			} else if (stream.eat("'")) {
				if (stream.match(/\\?.'/)) return "number";
			} else if (stream.eat(".") || stream.sol() && stream.eat("#")) {
				state.context = 5;
				if (stream.eatWhile(/\w/)) return "def";
			} else if (stream.eat("$")) {
				if (stream.eatWhile(/[\da-f]/i)) return "number";
			} else if (stream.eat("%")) {
				if (stream.eatWhile(/[01]/)) return "number";
			} else stream.next();
			return null;
		}
	};
}
var z80 = mkZ80(false);
mkZ80(true);
//#endregion
//#region node_modules/@codemirror/legacy-modes/mode/mscgen.js
function mkParser(lang) {
	return {
		name: "mscgen",
		startState: startStateFn,
		copyState: copyStateFn,
		token: produceTokenFunction(lang),
		languageData: { commentTokens: {
			line: "#",
			block: {
				open: "/*",
				close: "*/"
			}
		} }
	};
}
var mscgen = mkParser({
	"keywords": ["msc"],
	"options": [
		"hscale",
		"width",
		"arcgradient",
		"wordwraparcs"
	],
	"constants": [
		"true",
		"false",
		"on",
		"off"
	],
	"attributes": [
		"label",
		"idurl",
		"id",
		"url",
		"linecolor",
		"linecolour",
		"textcolor",
		"textcolour",
		"textbgcolor",
		"textbgcolour",
		"arclinecolor",
		"arclinecolour",
		"arctextcolor",
		"arctextcolour",
		"arctextbgcolor",
		"arctextbgcolour",
		"arcskip"
	],
	"brackets": ["\\{", "\\}"],
	"arcsWords": [
		"note",
		"abox",
		"rbox",
		"box"
	],
	"arcsOthers": [
		"\\|\\|\\|",
		"\\.\\.\\.",
		"---",
		"--",
		"<->",
		"==",
		"<<=>>",
		"<=>",
		"\\.\\.",
		"<<>>",
		"::",
		"<:>",
		"->",
		"=>>",
		"=>",
		">>",
		":>",
		"<-",
		"<<=",
		"<=",
		"<<",
		"<:",
		"x-",
		"-x"
	],
	"singlecomment": ["//", "#"],
	"operators": ["="]
});
var msgenny = mkParser({
	"keywords": null,
	"options": [
		"hscale",
		"width",
		"arcgradient",
		"wordwraparcs",
		"wordwrapentities",
		"watermark"
	],
	"constants": [
		"true",
		"false",
		"on",
		"off",
		"auto"
	],
	"attributes": null,
	"brackets": ["\\{", "\\}"],
	"arcsWords": [
		"note",
		"abox",
		"rbox",
		"box",
		"alt",
		"else",
		"opt",
		"break",
		"par",
		"seq",
		"strict",
		"neg",
		"critical",
		"ignore",
		"consider",
		"assert",
		"loop",
		"ref",
		"exc"
	],
	"arcsOthers": [
		"\\|\\|\\|",
		"\\.\\.\\.",
		"---",
		"--",
		"<->",
		"==",
		"<<=>>",
		"<=>",
		"\\.\\.",
		"<<>>",
		"::",
		"<:>",
		"->",
		"=>>",
		"=>",
		">>",
		":>",
		"<-",
		"<<=",
		"<=",
		"<<",
		"<:",
		"x-",
		"-x"
	],
	"singlecomment": ["//", "#"],
	"operators": ["="]
});
var xu = mkParser({
	"keywords": ["msc", "xu"],
	"options": [
		"hscale",
		"width",
		"arcgradient",
		"wordwraparcs",
		"wordwrapentities",
		"watermark"
	],
	"constants": [
		"true",
		"false",
		"on",
		"off",
		"auto"
	],
	"attributes": [
		"label",
		"idurl",
		"id",
		"url",
		"linecolor",
		"linecolour",
		"textcolor",
		"textcolour",
		"textbgcolor",
		"textbgcolour",
		"arclinecolor",
		"arclinecolour",
		"arctextcolor",
		"arctextcolour",
		"arctextbgcolor",
		"arctextbgcolour",
		"arcskip",
		"title",
		"deactivate",
		"activate",
		"activation"
	],
	"brackets": ["\\{", "\\}"],
	"arcsWords": [
		"note",
		"abox",
		"rbox",
		"box",
		"alt",
		"else",
		"opt",
		"break",
		"par",
		"seq",
		"strict",
		"neg",
		"critical",
		"ignore",
		"consider",
		"assert",
		"loop",
		"ref",
		"exc"
	],
	"arcsOthers": [
		"\\|\\|\\|",
		"\\.\\.\\.",
		"---",
		"--",
		"<->",
		"==",
		"<<=>>",
		"<=>",
		"\\.\\.",
		"<<>>",
		"::",
		"<:>",
		"->",
		"=>>",
		"=>",
		">>",
		":>",
		"<-",
		"<<=",
		"<=",
		"<<",
		"<:",
		"x-",
		"-x"
	],
	"singlecomment": ["//", "#"],
	"operators": ["="]
});
function wordRegexpBoundary(pWords) {
	return new RegExp("^\\b(" + pWords.join("|") + ")\\b", "i");
}
function wordRegexp(pWords) {
	return new RegExp("^(?:" + pWords.join("|") + ")", "i");
}
function startStateFn() {
	return {
		inComment: false,
		inString: false,
		inAttributeList: false,
		inScript: false
	};
}
function copyStateFn(pState) {
	return {
		inComment: pState.inComment,
		inString: pState.inString,
		inAttributeList: pState.inAttributeList,
		inScript: pState.inScript
	};
}
function produceTokenFunction(pConfig) {
	return function(pStream, pState) {
		if (pStream.match(wordRegexp(pConfig.brackets), true, true)) return "bracket";
		if (!pState.inComment) {
			if (pStream.match(/\/\*[^\*\/]*/, true, true)) {
				pState.inComment = true;
				return "comment";
			}
			if (pStream.match(wordRegexp(pConfig.singlecomment), true, true)) {
				pStream.skipToEnd();
				return "comment";
			}
		}
		if (pState.inComment) {
			if (pStream.match(/[^\*\/]*\*\//, true, true)) pState.inComment = false;
			else pStream.skipToEnd();
			return "comment";
		}
		if (!pState.inString && pStream.match(/\"(\\\"|[^\"])*/, true, true)) {
			pState.inString = true;
			return "string";
		}
		if (pState.inString) {
			if (pStream.match(/[^\"]*\"/, true, true)) pState.inString = false;
			else pStream.skipToEnd();
			return "string";
		}
		if (!!pConfig.keywords && pStream.match(wordRegexpBoundary(pConfig.keywords), true, true)) return "keyword";
		if (pStream.match(wordRegexpBoundary(pConfig.options), true, true)) return "keyword";
		if (pStream.match(wordRegexpBoundary(pConfig.arcsWords), true, true)) return "keyword";
		if (pStream.match(wordRegexp(pConfig.arcsOthers), true, true)) return "keyword";
		if (!!pConfig.operators && pStream.match(wordRegexp(pConfig.operators), true, true)) return "operator";
		if (!!pConfig.constants && pStream.match(wordRegexp(pConfig.constants), true, true)) return "variable";
		if (!pConfig.inAttributeList && !!pConfig.attributes && pStream.match("[", true, true)) {
			pConfig.inAttributeList = true;
			return "bracket";
		}
		if (pConfig.inAttributeList) {
			if (pConfig.attributes !== null && pStream.match(wordRegexpBoundary(pConfig.attributes), true, true)) return "attribute";
			if (pStream.match("]", true, true)) {
				pConfig.inAttributeList = false;
				return "bracket";
			}
		}
		pStream.next();
		return null;
	};
}
//#endregion
export { jsonld as $, rpmSpec as A, dart as At, pascal as B, sparql as C, cypher as Ct, scheme as D, gss as Dt, shell as E, cmake as Et, protobuf as F, cobol as Ft, mbox as G, octave as H, properties as I, brainfuck as It, mathematica as J, mumps as K, powerShell as L, asn1 as Lt, q as M, objectiveCpp as Mt, puppet as N, scala as Nt, sas as O, clojure as Ot, pug as P, squirrel as Pt, julia as Q, pig as R, asciiArmor as Rt, stylus as S, cython as St, sieve as T, coffeeScript as Tt, ntriples as U, oz as V, nsis as W, lua as X, mirc as Y, liveScript as Z, textile as _, dylan as _t, yacas as a, gherkin as at, stex as b, d$1 as bt, velocity as c, oCaml as ct, webIDL as d, forth as dt, idl as et, turtle as f, factor as ft, toml as g, ecl as gt, troff as h, eiffel as ht, z80 as i, groovy as it, r as j, kotlin as jt, ruby as k, csharp as kt, vbScript as l, sml as lt, ttcn as m, elm as mt, msgenny as n, hxml as nt, xQuery as o, gas as ot, ttcnCfg as p, erlang as pt, modelica as q, xu as r, haskell as rt, vhdl as s, fSharp as st, mscgen as t, haxe as tt, vb as u, fortran as ut, tcl as v, dtd as vt, smalltalk as w, commonLisp as wt, swift as x, crystal as xt, verilog as y, diff as yt, perl as z, apl as zt };
