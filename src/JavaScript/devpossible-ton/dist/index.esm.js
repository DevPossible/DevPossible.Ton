/**
 * TonLexer - Tokenizer for TON format
 * Copyright (c) 2024 DevPossible, LLC
 */
var TokenType;
(function (TokenType) {
    // Literals
    TokenType["String"] = "STRING";
    TokenType["Number"] = "NUMBER";
    TokenType["Boolean"] = "BOOLEAN";
    TokenType["Null"] = "NULL";
    TokenType["Undefined"] = "UNDEFINED";
    // Identifiers and Keywords
    TokenType["Identifier"] = "IDENTIFIER";
    TokenType["ClassName"] = "CLASS_NAME";
    // Delimiters
    TokenType["LeftBrace"] = "LEFT_BRACE";
    TokenType["RightBrace"] = "RIGHT_BRACE";
    TokenType["LeftBracket"] = "LEFT_BRACKET";
    TokenType["RightBracket"] = "RIGHT_BRACKET";
    TokenType["LeftParen"] = "LEFT_PAREN";
    TokenType["RightParen"] = "RIGHT_PAREN";
    // Operators
    TokenType["Equals"] = "EQUALS";
    TokenType["Colon"] = "COLON";
    TokenType["Comma"] = "COMMA";
    TokenType["Pipe"] = "PIPE";
    // Type Hints
    TokenType["StringHint"] = "STRING_HINT";
    TokenType["NumberHint"] = "NUMBER_HINT";
    TokenType["BooleanHint"] = "BOOLEAN_HINT";
    TokenType["DateHint"] = "DATE_HINT";
    // Special
    TokenType["Enum"] = "ENUM";
    TokenType["EnumSet"] = "ENUM_SET";
    TokenType["Guid"] = "GUID";
    // Comments
    TokenType["Comment"] = "COMMENT";
    // Control
    TokenType["EndOfFile"] = "EOF";
    TokenType["NewLine"] = "NEWLINE";
})(TokenType || (TokenType = {}));
class TonLexer {
    constructor(input) {
        this.position = 0;
        this.line = 1;
        this.column = 1;
        this.tokens = [];
        this.input = input;
    }
    tokenize() {
        while (!this.isAtEnd()) {
            this.skipWhitespaceAndComments();
            if (this.isAtEnd())
                break;
            const token = this.nextToken();
            if (token && token.type !== TokenType.Comment) {
                this.tokens.push(token);
            }
        }
        this.tokens.push(this.createToken(TokenType.EndOfFile, null));
        return this.tokens;
    }
    nextToken() {
        const char = this.peek();
        // Handle structural tokens
        switch (char) {
            case '{':
                // Check if this might be a braced GUID
                const bracedGuid = this.tryToScanBracedGuid();
                if (bracedGuid) {
                    return bracedGuid;
                }
                return this.consumeChar(TokenType.LeftBrace);
            case '}': return this.consumeChar(TokenType.RightBrace);
            case '[': return this.consumeChar(TokenType.LeftBracket);
            case ']': return this.consumeChar(TokenType.RightBracket);
            case '(': return this.consumeChar(TokenType.LeftParen);
            case ')': return this.consumeChar(TokenType.RightParen);
            case '=': return this.consumeChar(TokenType.Equals);
            case ':': return this.consumeChar(TokenType.Colon);
            case ',': return this.consumeChar(TokenType.Comma);
            case '$': return this.consumeChar(TokenType.StringHint);
            case '%': return this.consumeChar(TokenType.NumberHint);
            case '&': return this.consumeChar(TokenType.BooleanHint);
            case '^': return this.consumeChar(TokenType.DateHint);
            case '#': return this.consumeChar(TokenType.Identifier); // Handle # for instance counts
            case '|': return this.scanEnum();
            case '"': return this.scanString();
            case '`': return this.scanTemplateString();
            case "'": return this.scanSingleQuoteString();
        }
        // Try to scan as GUID first if it could be one (starts with hex digit)
        if (this.isHexDigit(char)) {
            const startLine = this.line;
            const startColumn = this.column;
            const guidValue = this.tryToScanGuid();
            if (guidValue) {
                return {
                    type: TokenType.Guid,
                    value: guidValue,
                    line: startLine,
                    column: startColumn
                };
            }
        }
        // Handle numbers (but could also be numeric property names)
        if (this.isDigit(char) || (char === '-' && this.isDigit(this.peek(1)))) {
            return this.scanNumberOrNumericProperty();
        }
        // Handle keywords and identifiers
        if (this.isAlpha(char) || char === '_') {
            return this.scanIdentifierOrKeyword();
        }
        throw new Error(`Unexpected character '${char}' at line ${this.line}, column ${this.column}`);
    }
    scanString() {
        const startLine = this.line;
        const startColumn = this.column;
        // Check for triple-quoted string
        if (this.peek(1) === '"' && this.peek(2) === '"') {
            return this.scanTripleQuotedString();
        }
        this.advance(); // consume opening "
        let value = '';
        while (!this.isAtEnd() && this.peek() !== '"') {
            if (this.peek() === '\\') {
                this.advance();
                value += this.scanEscapeSequence();
            }
            else {
                if (this.peek() === '\n') {
                    throw new Error(`Unterminated string at line ${startLine}, column ${startColumn}`);
                }
                value += this.advance();
            }
        }
        if (this.isAtEnd()) {
            throw new Error(`Unterminated string at line ${startLine}, column ${startColumn}`);
        }
        this.advance(); // consume closing "
        return {
            type: TokenType.String,
            value,
            line: startLine,
            column: startColumn
        };
    }
    scanTripleQuotedString() {
        const startLine = this.line;
        const startColumn = this.column;
        this.advance(); // consume first "
        this.advance(); // consume second "
        this.advance(); // consume third "
        let value = '';
        while (!this.isAtEnd()) {
            if (this.peek() === '"' && this.peek(1) === '"' && this.peek(2) === '"') {
                this.advance();
                this.advance();
                this.advance();
                return {
                    type: TokenType.String,
                    value: this.processMultilineString(value),
                    line: startLine,
                    column: startColumn
                };
            }
            value += this.advance();
        }
        throw new Error(`Unterminated triple-quoted string`);
    }
    processMultilineString(value) {
        const lines = value.split('\n');
        if (lines.length === 0)
            return value;
        // Remove leading and trailing empty lines
        while (lines.length > 0 && lines[0].trim() === '')
            lines.shift();
        while (lines.length > 0 && lines[lines.length - 1].trim() === '')
            lines.pop();
        if (lines.length === 0)
            return '';
        // Find minimum indentation
        const minIndent = Math.min(...lines
            .filter(line => line.trim().length > 0)
            .map(line => line.match(/^(\s*)/)?.[0].length || 0));
        // Remove common indentation
        return lines.map(line => line.substring(minIndent)).join('\n');
    }
    scanTemplateString() {
        const startLine = this.line;
        const startColumn = this.column;
        this.advance(); // consume `
        let value = '';
        while (!this.isAtEnd() && this.peek() !== '`') {
            if (this.peek() === '\\') {
                this.advance();
                value += this.scanEscapeSequence();
            }
            else {
                value += this.advance();
            }
        }
        if (this.isAtEnd()) {
            throw new Error(`Unterminated template string`);
        }
        this.advance(); // consume closing `
        return {
            type: TokenType.String,
            value,
            line: startLine,
            column: startColumn
        };
    }
    scanSingleQuoteString() {
        const startLine = this.line;
        const startColumn = this.column;
        this.advance(); // consume '
        let value = '';
        while (!this.isAtEnd() && this.peek() !== "'") {
            if (this.peek() === '\\') {
                this.advance();
                value += this.scanEscapeSequence();
            }
            else {
                value += this.advance();
            }
        }
        if (this.isAtEnd()) {
            throw new Error(`Unterminated string`);
        }
        this.advance(); // consume closing '
        return {
            type: TokenType.String,
            value,
            line: startLine,
            column: startColumn
        };
    }
    scanNumberOrNumericProperty() {
        const startColumn = this.column;
        const startLine = this.line;
        let value = '';
        // Check if negative
        const isNegative = this.peek() === '-';
        if (isNegative) {
            value += this.advance();
        }
        // Check for hex or binary
        if (this.peek() === '0') {
            const next = this.peek(1);
            if (next === 'x' || next === 'X') {
                return this.scanHexNumber(startLine, startColumn);
            }
            else if (next === 'b' || next === 'B') {
                return this.scanBinaryNumber(startLine, startColumn);
            }
        }
        // Scan integer part
        while (this.isDigit(this.peek())) {
            value += this.advance();
        }
        // Check if this might be a numeric property name with alphanumeric chars
        if (!isNegative && (this.isAlpha(this.peek()) || this.peek() === '_')) {
            // It's an identifier that starts with numbers
            while (this.isAlphaNumeric(this.peek()) || this.peek() === '_') {
                value += this.advance();
            }
            return {
                type: TokenType.Identifier,
                value,
                line: startLine,
                column: startColumn
            };
        }
        // Check for decimal part
        if (this.peek() === '.' && this.isDigit(this.peek(1))) {
            value += this.advance(); // consume .
            while (this.isDigit(this.peek())) {
                value += this.advance();
            }
        }
        // Check for scientific notation
        const expChar = this.peek();
        if (expChar === 'e' || expChar === 'E') {
            const lookahead = this.peek(1);
            if (this.isDigit(lookahead) || ((lookahead === '+' || lookahead === '-') && this.isDigit(this.peek(2)))) {
                value += this.advance(); // consume e/E
                if (this.peek() === '+' || this.peek() === '-') {
                    value += this.advance();
                }
                while (this.isDigit(this.peek())) {
                    value += this.advance();
                }
            }
        }
        return {
            type: TokenType.Number,
            value: parseFloat(value),
            line: startLine,
            column: startColumn
        };
    }
    scanHexNumber(startLine, startColumn) {
        let value = '0x';
        this.advance(); // consume 0
        this.advance(); // consume x
        while (this.isHexDigit(this.peek())) {
            value += this.advance();
        }
        return {
            type: TokenType.Number,
            value: parseInt(value, 16),
            line: startLine,
            column: startColumn
        };
    }
    scanBinaryNumber(startLine, startColumn) {
        let value = '0b';
        this.advance(); // consume 0
        this.advance(); // consume b
        while (this.peek() === '0' || this.peek() === '1') {
            value += this.advance();
        }
        return {
            type: TokenType.Number,
            value: parseInt(value.slice(2), 2),
            line: startLine,
            column: startColumn
        };
    }
    scanEnum() {
        const startLine = this.line;
        const startColumn = this.column;
        const startPos = this.position;
        this.advance(); // consume first |
        const values = [];
        let current = '';
        while (!this.isAtEnd()) {
            const char = this.peek();
            if (char === '|') {
                if (current) {
                    values.push(current);
                    current = '';
                }
                this.advance();
                // Check if this closes the enum
                if (!this.isAlpha(this.peek()) && this.peek() !== '_') {
                    break;
                }
            }
            else if (this.isAlpha(char) || this.isDigit(char) || char === '_') {
                current += this.advance();
            }
            else {
                break;
            }
        }
        if (values.length === 0 && current) {
            values.push(current);
        }
        if (values.length === 1) {
            return {
                type: TokenType.Enum,
                value: values[0],
                line: startLine,
                column: startColumn
            };
        }
        else if (values.length > 1) {
            return {
                type: TokenType.EnumSet,
                value: values,
                line: startLine,
                column: startColumn
            };
        }
        throw new Error(`Invalid enum at position ${startPos}`);
    }
    scanIdentifierOrKeyword() {
        const startColumn = this.column;
        const startLine = this.line;
        let value = '';
        while (this.isAlphaNumeric(this.peek()) || this.peek() === '_') {
            value += this.advance();
        }
        // Check for boolean keywords
        if (value === 'true' || value === 'false') {
            return {
                type: TokenType.Boolean,
                value: value === 'true',
                line: startLine,
                column: startColumn
            };
        }
        // Check for null/undefined
        if (value === 'null') {
            return {
                type: TokenType.Null,
                value: null,
                line: startLine,
                column: startColumn
            };
        }
        if (value === 'undefined') {
            return {
                type: TokenType.Undefined,
                value: undefined,
                line: startLine,
                column: startColumn
            };
        }
        // Check if it's a class name (starts with capital)
        const tokenType = (value[0] >= 'A' && value[0] <= 'Z') ? TokenType.ClassName : TokenType.Identifier;
        return {
            type: tokenType,
            value,
            line: startLine,
            column: startColumn
        };
    }
    tryToScanBracedGuid() {
        // Check for {GUID} pattern
        if (this.peek() !== '{')
            return null;
        const startPos = this.position;
        const startCol = this.column;
        const startLn = this.line;
        this.advance(); // consume {
        // Try to scan the GUID part
        const guidValue = this.tryToScanGuid();
        if (guidValue && this.peek() === '}') {
            this.advance(); // consume }
            return {
                type: TokenType.Guid,
                value: guidValue,
                line: startLn,
                column: startCol
            };
        }
        // Not a braced GUID, reset
        this.position = startPos;
        this.column = startCol;
        this.line = startLn;
        return null;
    }
    tryToScanGuid() {
        // GUID pattern: 8-4-4-4-12 hex digits
        const startPos = this.position;
        const startCol = this.column;
        const startLn = this.line;
        const parts = [8, 4, 4, 4, 12];
        let guid = '';
        for (let i = 0; i < parts.length; i++) {
            if (i > 0) {
                if (this.peek() !== '-') {
                    // Not a GUID, reset position and column
                    this.position = startPos;
                    this.column = startCol;
                    this.line = startLn;
                    return null;
                }
                guid += this.advance(); // consume '-'
            }
            for (let j = 0; j < parts[i]; j++) {
                if (!this.isHexDigit(this.peek())) {
                    // Not a GUID, reset position and column
                    this.position = startPos;
                    this.column = startCol;
                    this.line = startLn;
                    return null;
                }
                guid += this.advance();
            }
        }
        return guid;
    }
    scanEscapeSequence() {
        const char = this.advance();
        switch (char) {
            case 'n': return '\n';
            case 't': return '\t';
            case 'r': return '\r';
            case '\\': return '\\';
            case '"': return '"';
            case "'": return "'";
            case '`': return '`';
            default: return char;
        }
    }
    skipWhitespaceAndComments() {
        while (!this.isAtEnd()) {
            const char = this.peek();
            if (char === ' ' || char === '\t' || char === '\r') {
                this.advance();
            }
            else if (char === '\n') {
                this.line++;
                this.column = 0;
                this.advance();
            }
            else if (char === '/' && this.peek(1) === '/') {
                this.skipLineComment();
            }
            else if (char === '/' && this.peek(1) === '*') {
                this.skipBlockComment();
            }
            else {
                break;
            }
        }
    }
    skipLineComment() {
        while (!this.isAtEnd() && this.peek() !== '\n') {
            this.advance();
        }
    }
    skipBlockComment() {
        this.advance(); // consume /
        this.advance(); // consume *
        while (!this.isAtEnd()) {
            if (this.peek() === '*' && this.peek(1) === '/') {
                this.advance(); // consume *
                this.advance(); // consume /
                break;
            }
            if (this.peek() === '\n') {
                this.line++;
                this.column = 0;
            }
            this.advance();
        }
    }
    consumeChar(type) {
        const startColumn = this.column;
        const char = this.advance();
        return {
            type,
            value: char,
            line: this.line,
            column: startColumn
        };
    }
    createToken(type, value) {
        // Calculate the correct column position for the start of the token
        let tokenColumn = this.column;
        if (typeof value === 'string' && value.length > 0) {
            tokenColumn = Math.max(1, this.column - value.length);
        }
        else if (type !== TokenType.EndOfFile) {
            tokenColumn = Math.max(1, this.column - 1);
        }
        return {
            type,
            value,
            line: this.line,
            column: tokenColumn
        };
    }
    advance() {
        const char = this.input[this.position++];
        this.column++;
        return char;
    }
    peek(offset = 0) {
        const pos = this.position + offset;
        return pos < this.input.length ? this.input[pos] : '\0';
    }
    isAtEnd() {
        return this.position >= this.input.length;
    }
    isDigit(char) {
        return char >= '0' && char <= '9';
    }
    isHexDigit(char) {
        return this.isDigit(char) ||
            (char >= 'a' && char <= 'f') ||
            (char >= 'A' && char <= 'F');
    }
    isAlpha(char) {
        return (char >= 'a' && char <= 'z') ||
            (char >= 'A' && char <= 'Z');
    }
    isAlphaNumeric(char) {
        return this.isAlpha(char) || this.isDigit(char);
    }
}

/**
 * TonObject - Object model for TON
 * Copyright (c) 2024 DevPossible, LLC
 */
class TonObject {
    constructor() {
        this.properties = new Map();
    }
    set(key, value) {
        this.properties.set(key, value);
    }
    get(key) {
        return this.properties.get(key);
    }
    has(key) {
        return this.properties.has(key);
    }
    delete(key) {
        return this.properties.delete(key);
    }
    keys() {
        return Array.from(this.properties.keys());
    }
    values() {
        return Array.from(this.properties.values());
    }
    entries() {
        return Array.from(this.properties.entries());
    }
    size() {
        return this.properties.size;
    }
    toJSON() {
        const result = {};
        for (const [key, value] of this.properties) {
            if (value && typeof value.toJSON === 'function') {
                result[key] = value.toJSON();
            }
            else if (value && typeof value.getValue === 'function') {
                result[key] = value.getValue();
            }
            else {
                result[key] = value;
            }
        }
        return result;
    }
}

/**
 * TonArray - Array model for TON
 * Copyright (c) 2024 DevPossible, LLC
 */
class TonArray {
    constructor() {
        this.items = [];
    }
    add(value) {
        this.items.push(value);
    }
    get(index) {
        return this.items[index];
    }
    set(index, value) {
        this.items[index] = value;
    }
    length() {
        return this.items.length;
    }
    toArray() {
        return [...this.items];
    }
    toJSON() {
        return this.items.map(item => {
            if (item && typeof item.toJSON === 'function') {
                return item.toJSON();
            }
            else if (item && typeof item.getValue === 'function') {
                return item.getValue();
            }
            else {
                return item;
            }
        });
    }
}

/**
 * TonValue - Value model for TON
 * Copyright (c) 2024 DevPossible, LLC
 */
class TonValue {
    constructor(value, typeHint) {
        this.value = value;
        this.typeHint = typeHint;
    }
    getValue() {
        return this.value;
    }
    setValue(value) {
        this.value = value;
    }
    getType() {
        if (this.typeHint) {
            return this.typeHint;
        }
        if (this.value === null) {
            return 'null';
        }
        if (this.value === undefined) {
            return 'undefined';
        }
        return typeof this.value;
    }
    toJSON() {
        return this.value;
    }
    toString() {
        return String(this.value);
    }
}

/**
 * TonDocument - Root document model
 * Copyright (c) 2024 DevPossible, LLC
 */
class TonDocument {
    constructor(root) {
        this.root = root;
    }
    getRoot() {
        return this.root;
    }
    isObject() {
        return this.root instanceof TonObject;
    }
    isArray() {
        return this.root instanceof TonArray;
    }
    isValue() {
        return this.root instanceof TonValue;
    }
    asObject() {
        return this.root instanceof TonObject ? this.root : undefined;
    }
    asArray() {
        return this.root instanceof TonArray ? this.root : undefined;
    }
    asValue() {
        return this.root instanceof TonValue ? this.root : undefined;
    }
    toJSON() {
        if (this.root instanceof TonObject) {
            return this.root.toJSON();
        }
        else if (this.root instanceof TonArray) {
            return this.root.toJSON();
        }
        else if (this.root instanceof TonValue) {
            return this.root.getValue();
        }
        return null;
    }
    toString() {
        return JSON.stringify(this.toJSON(), null, 2);
    }
    /**
     * Creates a TonDocument from a plain JavaScript object
     */
    static fromObject(obj) {
        if (obj === null || obj === undefined) {
            return new TonDocument(new TonValue(obj));
        }
        if (Array.isArray(obj)) {
            const arr = new TonArray();
            arr.items = obj;
            return new TonDocument(arr);
        }
        if (typeof obj === 'object') {
            const tonObj = new TonObject();
            for (const [key, value] of Object.entries(obj)) {
                tonObj.set(key, value);
            }
            return new TonDocument(tonObj);
        }
        return new TonDocument(new TonValue(obj));
    }
}

/**
 * TonParseError - Parse error for TON format
 * Copyright (c) 2024 DevPossible, LLC
 */
class TonParseError extends Error {
    constructor(message, line, column) {
        super(`Parse error at line ${line}, column ${column}: ${message}`);
        this.name = 'TonParseError';
        this.line = line;
        this.column = column;
    }
}

/**
 * TonParser - Parser for TON format
 * Copyright (c) 2024 DevPossible, LLC
 */
class TonParser {
    constructor(options) {
        this.tokens = [];
        this.current = 0;
        this.options = options || {};
    }
    parse(input) {
        const lexer = new TonLexer(input);
        this.tokens = lexer.tokenize();
        this.current = 0;
        const root = this.parseValue();
        if (!this.isAtEnd()) {
            throw new TonParseError('Unexpected content after parsing', this.peek().line, this.peek().column);
        }
        return new TonDocument(root);
    }
    parseValue() {
        const token = this.peek();
        switch (token.type) {
            case TokenType.LeftBrace:
                return this.parseObject();
            case TokenType.LeftParen:
                // Check if this is a typed object (ClassName){...}
                return this.parseTypedObject();
            case TokenType.LeftBracket:
                return this.parseArray();
            case TokenType.String:
            case TokenType.Number:
            case TokenType.Boolean:
            case TokenType.Null:
            case TokenType.Undefined:
            case TokenType.Guid:
                return new TonValue(this.advance().value);
            case TokenType.Enum:
            case TokenType.EnumSet:
                return this.parseEnum();
            case TokenType.StringHint:
            case TokenType.NumberHint:
            case TokenType.BooleanHint:
            case TokenType.DateHint:
                return this.parseHintedValue();
            case TokenType.ClassName:
                return this.parseTypedObject();
            default:
                throw new TonParseError(`Unexpected token: ${token.type}`, token.line, token.column);
        }
    }
    parseObject() {
        this.consume(TokenType.LeftBrace, 'Expected {');
        const obj = new TonObject();
        while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
            // Parse property name (can be identifier, string, number, guid, or keywords)
            const nameToken = this.advance();
            if (nameToken.type !== TokenType.Identifier &&
                nameToken.type !== TokenType.String &&
                nameToken.type !== TokenType.Number &&
                nameToken.type !== TokenType.Guid &&
                nameToken.type !== TokenType.ClassName &&
                nameToken.type !== TokenType.Boolean &&
                nameToken.type !== TokenType.Null &&
                nameToken.type !== TokenType.Undefined) {
                throw new TonParseError('Expected property name', nameToken.line, nameToken.column);
            }
            // Convert keyword token values back to string names
            let name;
            if (nameToken.type === TokenType.Boolean) {
                name = nameToken.value ? 'true' : 'false';
            }
            else if (nameToken.type === TokenType.Null) {
                name = 'null';
            }
            else if (nameToken.type === TokenType.Undefined) {
                name = 'undefined';
            }
            else {
                name = String(nameToken.value);
            }
            // Check for type annotation
            let typeHint;
            if (this.check(TokenType.Colon)) {
                this.advance(); // consume :
                // Check if next token is a type identifier
                if (this.check(TokenType.Identifier)) {
                    typeHint = this.advance().value;
                }
            }
            // Expect equals sign
            this.consume(TokenType.Equals, 'Expected = after property name');
            // Parse property value
            const value = this.parseValue();
            if (typeHint && value instanceof TonValue) {
                value.typeHint = typeHint;
            }
            obj.set(name, value);
            // Check for comma or closing brace
            if (!this.check(TokenType.RightBrace)) {
                if (this.check(TokenType.Comma)) {
                    this.advance();
                }
                else if (!this.options.allowTrailingCommas) {
                    // In strict mode, require comma between properties
                    const next = this.peek();
                    if (next.type !== TokenType.RightBrace) {
                        throw new TonParseError('Expected comma or }', next.line, next.column);
                    }
                }
            }
        }
        this.consume(TokenType.RightBrace, 'Expected }');
        return obj;
    }
    parseArray() {
        this.consume(TokenType.LeftBracket, 'Expected [');
        const arr = new TonArray();
        while (!this.check(TokenType.RightBracket) && !this.isAtEnd()) {
            arr.add(this.parseValue());
            if (!this.check(TokenType.RightBracket)) {
                if (this.check(TokenType.Comma)) {
                    this.advance();
                }
                else if (!this.options.allowTrailingCommas) {
                    const next = this.peek();
                    if (next.type !== TokenType.RightBracket) {
                        throw new TonParseError('Expected comma or ]', next.line, next.column);
                    }
                }
            }
        }
        this.consume(TokenType.RightBracket, 'Expected ]');
        return arr;
    }
    parseEnum() {
        const token = this.advance();
        return new TonValue(token.value, 'enum');
    }
    parseHintedValue() {
        const hintToken = this.advance();
        let typeHint;
        switch (hintToken.type) {
            case TokenType.StringHint:
                typeHint = 'string';
                break;
            case TokenType.NumberHint:
                typeHint = 'number';
                break;
            case TokenType.BooleanHint:
                typeHint = 'boolean';
                break;
            case TokenType.DateHint:
                typeHint = 'date';
                break;
            default:
                typeHint = 'unknown';
        }
        const value = this.parseValue();
        if (value instanceof TonValue) {
            value.typeHint = typeHint;
        }
        return value;
    }
    parseTypedObject() {
        // Handle both (ClassName) and ClassName syntaxes
        let className;
        let instanceCount;
        if (this.check(TokenType.LeftParen)) {
            // Format: (ClassName) or (ClassName#count)
            this.advance(); // consume (
            // Class name can be either ClassName or Identifier token type
            if (!this.check(TokenType.ClassName) && !this.check(TokenType.Identifier)) {
                throw new TonParseError('Expected class name', this.peek().line, this.peek().column);
            }
            const nameToken = this.advance();
            className = nameToken.value;
            // Check for instance count with # token
            if (this.check(TokenType.Identifier) && this.peek().value === '#') {
                this.advance(); // consume #
                const countToken = this.consume(TokenType.Number, 'Expected instance count');
                instanceCount = countToken.value;
            }
            this.consume(TokenType.RightParen, 'Expected )');
        }
        else {
            // Format: ClassName (legacy support)
            const nameToken = this.advance();
            className = nameToken.value;
            // Check for instance count with parentheses
            if (this.check(TokenType.LeftParen)) {
                this.advance(); // consume (
                const countToken = this.consume(TokenType.Number, 'Expected instance count');
                instanceCount = countToken.value;
                this.consume(TokenType.RightParen, 'Expected )');
            }
        }
        const obj = this.parseObject();
        obj.className = className;
        obj.instanceCount = instanceCount;
        return obj;
    }
    consume(type, message) {
        if (this.check(type)) {
            return this.advance();
        }
        const token = this.peek();
        throw new TonParseError(message, token.line, token.column);
    }
    check(type) {
        if (this.isAtEnd())
            return false;
        return this.peek().type === type;
    }
    advance() {
        if (!this.isAtEnd())
            this.current++;
        return this.previous();
    }
    peek() {
        return this.tokens[this.current];
    }
    previous() {
        return this.tokens[this.current - 1];
    }
    isAtEnd() {
        return this.peek().type === TokenType.EndOfFile;
    }
}

/**
 * TonEnum - Enum model for TON
 * Copyright (c) 2024 DevPossible, LLC
 */
class TonEnum {
    constructor(value) {
        this.values = value;
        this.isSingleValue = typeof value === 'string';
    }
    getValue() {
        return this.values;
    }
    getValues() {
        return this.isSingleValue ? [this.values] : this.values;
    }
    contains(value) {
        if (this.isSingleValue) {
            return this.values === value;
        }
        return this.values.includes(value);
    }
    isSet() {
        return !this.isSingleValue;
    }
    toJSON() {
        return this.getValue();
    }
    toString() {
        if (this.isSingleValue) {
            return `|${this.values}|`;
        }
        return this.values.map(v => `|${v}`).join('') + '|';
    }
}

/**
 * TonSerializeOptions - Options for serializing TON format
 * Copyright (c) 2024 DevPossible, LLC
 */
var TonFormatStyle;
(function (TonFormatStyle) {
    TonFormatStyle["Compact"] = "compact";
    TonFormatStyle["Pretty"] = "pretty";
})(TonFormatStyle || (TonFormatStyle = {}));

/**
 * TonSerializer - Serializer for TON format
 * Copyright (c) 2024 DevPossible, LLC
 */
class TonSerializer {
    constructor(options) {
        this.options = {
            formatStyle: TonFormatStyle.Pretty,
            indentSize: 4,
            indentChar: ' ',
            includeTypeHints: true,
            includeHeader: true,
            tonVersion: '1',
            omitNulls: false,
            omitUndefined: true,
            sortProperties: false,
            quoteStyle: 'single',
            lineEnding: '\n',
            ...options
        };
    }
    /**
     * Serializes a TonDocument or object to TON format string
     */
    serialize(obj) {
        if (obj instanceof TonDocument) {
            return this.serializeDocument(obj);
        }
        else if (obj instanceof TonObject) {
            return this.serializeObject(obj, 0);
        }
        else if (obj instanceof TonArray) {
            return this.serializeArray(obj, 0);
        }
        else {
            // Convert plain object to TonDocument
            const doc = TonDocument.fromObject(obj);
            return this.serializeDocument(doc);
        }
    }
    /**
     * Serializes a TonDocument to string
     */
    serializeDocument(doc) {
        const parts = [];
        // Add header if requested
        if (this.options.includeHeader && this.options.tonVersion) {
            parts.push(`#@ tonVersion = '${this.options.tonVersion}'`);
            parts.push('');
        }
        // Serialize root object
        if (doc.root instanceof TonObject) {
            parts.push(this.serializeObject(doc.root, 0));
        }
        else if (doc.root instanceof TonArray) {
            parts.push(this.serializeArray(doc.root, 0));
        }
        else if (doc.root instanceof TonValue) {
            parts.push(this.serializeValue(doc.root, 0));
        }
        else {
            parts.push(this.serializePlainValue(doc.root, 0));
        }
        return parts.join(this.options.lineEnding);
    }
    /**
     * Serializes a TonObject to string
     */
    serializeObject(obj, indent) {
        const props = obj.properties;
        // Handle empty object
        if (props.size === 0) {
            return '{}';
        }
        // Sort properties if requested
        let keys = Array.from(props.keys());
        if (this.options.sortProperties) {
            keys.sort();
        }
        // Filter out nulls/undefined if requested
        keys = keys.filter(key => {
            const value = props.get(key);
            if (this.options.omitNulls && value === null)
                return false;
            if (this.options.omitUndefined && value === undefined)
                return false;
            return true;
        });
        // Format based on style
        if (this.options.formatStyle === TonFormatStyle.Compact) {
            return this.serializeObjectCompact(obj, keys);
        }
        else {
            return this.serializeObjectPretty(obj, keys, indent);
        }
    }
    /**
     * Serializes an object in compact format
     */
    serializeObjectCompact(obj, keys) {
        // Add class name if present
        let prefix = '';
        if (obj.className) {
            prefix = obj.instanceCount !== undefined ?
                `(${obj.className}#${obj.instanceCount})` :
                `(${obj.className})`;
        }
        const propParts = keys.map(key => {
            const value = obj.properties.get(key);
            const keyStr = this.serializePropertyName(key);
            const valueStr = this.serializeAnyValue(value, 0);
            return `${keyStr} = ${valueStr}`;
        });
        return `${prefix}{${propParts.join(', ')}}`;
    }
    /**
     * Serializes an object in pretty format
     */
    serializeObjectPretty(obj, keys, indent) {
        const indentStr = this.getIndentString(indent);
        const nextIndentStr = this.getIndentString(indent + 1);
        const parts = [];
        // Add class name if present
        let prefix = '';
        if (obj.className) {
            prefix = obj.instanceCount !== undefined ?
                `(${obj.className}#${obj.instanceCount})` :
                `(${obj.className})`;
        }
        parts.push(`${prefix}{`);
        keys.forEach((key, index) => {
            const value = obj.properties.get(key);
            const keyStr = this.serializePropertyName(key);
            const valueStr = this.serializeAnyValue(value, indent + 1);
            const comma = index < keys.length - 1 ? ',' : '';
            parts.push(`${nextIndentStr}${keyStr} = ${valueStr}${comma}`);
        });
        parts.push(`${indentStr}}`);
        return parts.join(this.options.lineEnding);
    }
    /**
     * Serializes a property name
     */
    serializePropertyName(name) {
        // Check if it's a valid identifier
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name) || /^[0-9]+(\.[0-9]+)?$/.test(name)) {
            return name;
        }
        // Otherwise quote it
        return this.quoteString(name);
    }
    /**
     * Serializes a TonArray to string
     */
    serializeArray(arr, indent) {
        const items = arr.items;
        if (items.length === 0) {
            return '[]';
        }
        if (this.options.formatStyle === TonFormatStyle.Compact) {
            const itemStrs = items.map(item => this.serializeAnyValue(item, 0));
            return `[${itemStrs.join(', ')}]`;
        }
        else {
            const indentStr = this.getIndentString(indent);
            const nextIndentStr = this.getIndentString(indent + 1);
            const parts = ['['];
            items.forEach((item, index) => {
                const itemStr = this.serializeAnyValue(item, indent + 1);
                const comma = index < items.length - 1 ? ',' : '';
                // Check if item is complex (object/array) for better formatting
                if (item instanceof TonObject || item instanceof TonArray) {
                    parts.push(`${nextIndentStr}${itemStr}${comma}`);
                }
                else {
                    if (index === 0) {
                        parts[0] = `[${itemStr}${comma}`;
                    }
                    else {
                        parts.push(`${itemStr}${comma}`);
                    }
                }
            });
            if (parts.length > 1) {
                parts.push(`${indentStr}]`);
                return parts.join(this.options.lineEnding);
            }
            else {
                return parts[0] + ']';
            }
        }
    }
    /**
     * Serializes any value
     */
    serializeAnyValue(value, indent) {
        if (value instanceof TonObject) {
            return this.serializeObject(value, indent);
        }
        else if (value instanceof TonArray) {
            return this.serializeArray(value, indent);
        }
        else if (value instanceof TonValue) {
            return this.serializeValue(value, indent);
        }
        else if (value instanceof TonEnum) {
            return this.serializeEnum(value);
        }
        else {
            return this.serializePlainValue(value, indent);
        }
    }
    /**
     * Serializes a TonValue
     */
    serializeValue(value, indent) {
        let result = this.serializePlainValue(value.value, indent);
        // Add type hint if requested and present
        if (this.options.includeTypeHints && value.typeHint) {
            const hint = this.getTypeHintPrefix(value.typeHint);
            if (hint) {
                result = hint + result;
            }
        }
        return result;
    }
    /**
     * Serializes a TonEnum
     */
    serializeEnum(enumValue) {
        if (Array.isArray(enumValue.values)) {
            // EnumSet
            return '|' + enumValue.values.join('|') + '|';
        }
        else {
            // Single enum
            return '|' + enumValue.values + '|';
        }
    }
    /**
     * Serializes a plain JavaScript value
     */
    serializePlainValue(value, indent) {
        if (value === null) {
            return 'null';
        }
        if (value === undefined) {
            return 'undefined';
        }
        if (typeof value === 'boolean') {
            return value ? 'true' : 'false';
        }
        if (typeof value === 'number') {
            // Handle special numbers
            if (Number.isNaN(value))
                return 'NaN';
            if (value === Infinity)
                return 'Infinity';
            if (value === -Infinity)
                return '-Infinity';
            // Check if it's an integer and within safe range
            if (Number.isInteger(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER) {
                return value.toString();
            }
            // Use exponential notation for very large/small numbers
            if (Math.abs(value) >= 1e21 || (Math.abs(value) < 1e-6 && value !== 0)) {
                return value.toExponential();
            }
            return value.toString();
        }
        if (typeof value === 'string') {
            return this.quoteString(value);
        }
        if (value instanceof Date) {
            return this.quoteString(value.toISOString());
        }
        if (Array.isArray(value)) {
            // Convert to TonArray and serialize
            const tonArray = new TonArray();
            tonArray.items = value;
            return this.serializeArray(tonArray, indent);
        }
        if (typeof value === 'object') {
            // Convert to TonObject and serialize
            const tonObj = new TonObject();
            for (const [key, val] of Object.entries(value)) {
                tonObj.set(key, val);
            }
            return this.serializeObject(tonObj, indent);
        }
        return String(value);
    }
    /**
     * Quotes a string value
     */
    quoteString(str) {
        const quote = this.options.quoteStyle === 'single' ? "'" : '"';
        const escaped = str
            .replace(/\\/g, '\\\\')
            .replace(new RegExp(quote, 'g'), '\\' + quote)
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
        // Check if it's a multiline string
        if (str.includes('\n') && this.options.formatStyle === TonFormatStyle.Pretty) {
            // Use triple quotes for multiline
            return `"""${str}"""`;
        }
        return quote + escaped + quote;
    }
    /**
     * Gets the type hint prefix character
     */
    getTypeHintPrefix(typeHint) {
        switch (typeHint) {
            case 'string': return '$';
            case 'number': return '%';
            case 'boolean': return '&';
            case 'date': return '^';
            default: return '';
        }
    }
    /**
     * Gets the indentation string for a given level
     */
    getIndentString(level) {
        if (this.options.formatStyle === TonFormatStyle.Compact) {
            return '';
        }
        return (this.options.indentChar || ' ').repeat((this.options.indentSize || 4) * level);
    }
}
// Static methods for convenience
(function (TonSerializer) {
    function stringify(obj, options) {
        const serializer = new TonSerializer(options);
        return serializer.serialize(obj);
    }
    TonSerializer.stringify = stringify;
    function compact(obj) {
        return stringify(obj, { formatStyle: TonFormatStyle.Compact });
    }
    TonSerializer.compact = compact;
    function pretty(obj) {
        return stringify(obj, { formatStyle: TonFormatStyle.Pretty });
    }
    TonSerializer.pretty = pretty;
})(TonSerializer || (TonSerializer = {}));

/**
 * TonValidator - Schema validation for TON format
 * Copyright (c) 2024 DevPossible, LLC
 */
class TonValidator {
    constructor(schema) {
        this.schema = schema || {};
        this.errors = [];
    }
    /**
     * Validates a document or object against the schema
     */
    validate(obj) {
        this.errors = [];
        let target;
        if (obj instanceof TonDocument) {
            target = obj.root;
        }
        else {
            target = obj;
        }
        // Validate against each schema path
        for (const [path, rule] of Object.entries(this.schema)) {
            this.validatePath(target, path, rule);
        }
        return {
            valid: this.errors.length === 0,
            errors: [...this.errors]
        };
    }
    /**
     * Validates a specific path against a rule
     */
    validatePath(obj, path, rule) {
        const value = this.getValueAtPath(obj, path);
        // Check required
        if (rule.required && (value === undefined || value === null)) {
            this.addError(path, 'Required field is missing', value, 'required');
            return;
        }
        // Skip further validation if value is null/undefined and not required
        if (value === undefined || value === null) {
            // Apply default if specified
            if (rule.default !== undefined) {
                this.setValueAtPath(obj, path, rule.default);
            }
            return;
        }
        // Type validation
        if (rule.type) {
            const types = Array.isArray(rule.type) ? rule.type : [rule.type];
            const actualType = this.getValueType(value);
            if (!types.includes(actualType)) {
                this.addError(path, `Expected type ${types.join(' or ')}, got ${actualType}`, value, 'type');
                return;
            }
        }
        // String validations
        if (typeof value === 'string') {
            if (rule.minLength !== undefined && value.length < rule.minLength) {
                this.addError(path, `String length ${value.length} is less than minimum ${rule.minLength}`, value, 'minLength');
            }
            if (rule.maxLength !== undefined && value.length > rule.maxLength) {
                this.addError(path, `String length ${value.length} exceeds maximum ${rule.maxLength}`, value, 'maxLength');
            }
            if (rule.pattern) {
                const regex = rule.pattern instanceof RegExp ? rule.pattern : new RegExp(rule.pattern);
                if (!regex.test(value)) {
                    this.addError(path, `String does not match pattern ${rule.pattern}`, value, 'pattern');
                }
            }
        }
        // Number validations
        if (typeof value === 'number') {
            if (rule.min !== undefined && value < rule.min) {
                this.addError(path, `Value ${value} is less than minimum ${rule.min}`, value, 'min');
            }
            if (rule.max !== undefined && value > rule.max) {
                this.addError(path, `Value ${value} exceeds maximum ${rule.max}`, value, 'max');
            }
        }
        // Array validations
        if (Array.isArray(value)) {
            if (rule.minLength !== undefined && value.length < rule.minLength) {
                this.addError(path, `Array length ${value.length} is less than minimum ${rule.minLength}`, value, 'minLength');
            }
            if (rule.maxLength !== undefined && value.length > rule.maxLength) {
                this.addError(path, `Array length ${value.length} exceeds maximum ${rule.maxLength}`, value, 'maxLength');
            }
            if (rule.items) {
                value.forEach((_item, index) => {
                    this.validatePath(obj, `${path}[${index}]`, rule.items);
                });
            }
        }
        // Enum validation
        if (rule.enum && !rule.enum.includes(value)) {
            this.addError(path, `Value must be one of: ${rule.enum.join(', ')}`, value, 'enum');
        }
        // Object property validations
        if (typeof value === 'object' && !Array.isArray(value) && rule.properties) {
            for (const [prop, propRule] of Object.entries(rule.properties)) {
                this.validatePath(value, prop, propRule);
            }
        }
        // Custom validation
        if (rule.custom) {
            const error = rule.custom(value, path);
            if (error) {
                this.errors.push(error);
            }
        }
    }
    /**
     * Gets a value at a specific path
     */
    getValueAtPath(obj, path) {
        // Handle root path
        if (path === '/' || path === '') {
            return obj;
        }
        // Parse path segments
        const segments = path.split('/').filter(s => s);
        let current = obj;
        for (const segment of segments) {
            if (current === null || current === undefined) {
                return undefined;
            }
            // Handle array indices
            const arrayMatch = segment.match(/^(.+)\[(\d+)\]$/);
            if (arrayMatch) {
                const propName = arrayMatch[1];
                const index = parseInt(arrayMatch[2]);
                current = this.getProperty(current, propName);
                if (Array.isArray(current) || current instanceof TonArray) {
                    current = current instanceof TonArray ? current.items[index] : current[index];
                }
                else {
                    return undefined;
                }
            }
            else {
                current = this.getProperty(current, segment);
            }
        }
        return current;
    }
    /**
     * Sets a value at a specific path
     */
    setValueAtPath(obj, path, value) {
        const segments = path.split('/').filter(s => s);
        if (segments.length === 0)
            return;
        let current = obj;
        for (let i = 0; i < segments.length - 1; i++) {
            const segment = segments[i];
            const next = this.getProperty(current, segment);
            if (next === undefined) {
                // Create intermediate object
                if (current instanceof TonObject) {
                    const newObj = new TonObject();
                    current.set(segment, newObj);
                    current = newObj;
                }
                else {
                    current[segment] = {};
                    current = current[segment];
                }
            }
            else {
                current = next;
            }
        }
        const lastSegment = segments[segments.length - 1];
        if (current instanceof TonObject) {
            current.set(lastSegment, value);
        }
        else {
            current[lastSegment] = value;
        }
    }
    /**
     * Gets a property from an object or TonObject
     */
    getProperty(obj, property) {
        if (obj instanceof TonObject) {
            return obj.get(property);
        }
        else if (obj instanceof TonValue) {
            return obj.value?.[property];
        }
        else if (typeof obj === 'object' && obj !== null) {
            return obj[property];
        }
        return undefined;
    }
    /**
     * Determines the type of a value
     */
    getValueType(value) {
        if (value === null)
            return 'null';
        if (value === undefined)
            return 'undefined';
        if (value instanceof TonObject)
            return 'object';
        if (value instanceof TonArray)
            return 'array';
        if (value instanceof TonValue)
            return this.getValueType(value.value);
        if (Array.isArray(value))
            return 'array';
        if (value instanceof Date)
            return 'date';
        return typeof value;
    }
    /**
     * Adds a validation error
     */
    addError(path, message, value, rule) {
        this.errors.push({ path, message, value, rule });
    }
}
/**
 * Common schema rules for reuse
 */
class SchemaRules {
    static string(options = {}) {
        return { type: 'string', ...options };
    }
    static number(options = {}) {
        return { type: 'number', ...options };
    }
    static boolean(options = {}) {
        return { type: 'boolean', ...options };
    }
    static array(itemRule, options = {}) {
        return { type: 'array', items: itemRule, ...options };
    }
    static object(properties, options = {}) {
        return { type: 'object', properties, ...options };
    }
    static required(rule) {
        return { ...rule, required: true };
    }
    static optional(rule) {
        return { ...rule, required: false };
    }
    static email() {
        return {
            type: 'string',
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        };
    }
    static url() {
        return {
            type: 'string',
            pattern: /^https?:\/\/.+/
        };
    }
    static uuid() {
        return {
            type: 'string',
            pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        };
    }
    static date() {
        return {
            type: 'string',
            custom: (value) => {
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    return {
                        path: '',
                        message: 'Invalid date format',
                        value,
                        rule: 'date'
                    };
                }
                return null;
            }
        };
    }
}

/**
 * TonFormatter - Code formatter for TON format
 * Copyright (c) 2024 DevPossible, LLC
 */
class TonFormatter {
    constructor(options) {
        this.options = {
            style: TonFormatStyle.Pretty,
            indentSize: 4,
            indentChar: ' ',
            sortProperties: false,
            preserveComments: true,
            trailingCommas: false,
            quoteStyle: 'single',
            lineEnding: '\n',
            maxLineLength: 80,
            ...options
        };
    }
    /**
     * Formats TON content
     */
    format(content) {
        try {
            // Parse the content
            const parser = new TonParser();
            const document = parser.parse(content);
            // If we need to preserve comments, we need a different approach
            if (this.options.preserveComments) {
                return this.formatWithComments(content);
            }
            // Use the serializer to format
            const serializeOptions = {
                formatStyle: this.options.style,
                indentSize: this.options.indentSize,
                indentChar: this.options.indentChar,
                sortProperties: this.options.sortProperties,
                trailingCommas: this.options.trailingCommas,
                quoteStyle: this.options.quoteStyle,
                lineEnding: this.options.lineEnding,
                includeHeader: true,
                includeTypeHints: true,
                omitNulls: false,
                omitUndefined: false
            };
            const serializer = new TonSerializer(serializeOptions);
            return serializer.serialize(document);
        }
        catch (error) {
            // If parsing fails, return original content
            console.error('Failed to format TON content:', error);
            return content;
        }
    }
    /**
     * Formats TON content while preserving comments
     */
    formatWithComments(content) {
        // This is a simplified version - a full implementation would need
        // to track comment positions and reinsert them appropriately
        const lines = content.split(/\r?\n/);
        const formatted = [];
        let depth = 0;
        for (const line of lines) {
            const trimmed = line.trim();
            // Skip empty lines
            if (!trimmed) {
                if (this.options.style === TonFormatStyle.Pretty) {
                    formatted.push('');
                }
                continue;
            }
            // Handle comments
            if (trimmed.startsWith('//')) {
                formatted.push(this.getIndent(depth) + trimmed);
                continue;
            }
            // Handle block comments
            if (trimmed.startsWith('/*')) {
                formatted.push(this.getIndent(depth) + trimmed);
                continue;
            }
            // Adjust depth for braces
            const openBraces = (trimmed.match(/\{/g) || []).length;
            const closeBraces = (trimmed.match(/\}/g) || []).length;
            const openBrackets = (trimmed.match(/\[/g) || []).length;
            const closeBrackets = (trimmed.match(/\]/g) || []).length;
            const depthBefore = depth;
            depth += openBraces + openBrackets;
            depth -= closeBraces + closeBrackets;
            // Use appropriate indentation
            const currentIndent = closeBraces > 0 || closeBrackets > 0 ?
                Math.min(depthBefore, depth) : depthBefore;
            if (this.options.style === TonFormatStyle.Pretty) {
                formatted.push(this.getIndent(currentIndent) + trimmed);
            }
            else {
                // Compact style - join lines
                if (formatted.length > 0 && !trimmed.startsWith('#')) {
                    const last = formatted[formatted.length - 1];
                    if (!last.endsWith('{') && !last.endsWith('[')) {
                        formatted[formatted.length - 1] = last + ' ' + trimmed;
                    }
                    else {
                        formatted[formatted.length - 1] = last + trimmed;
                    }
                }
                else {
                    formatted.push(trimmed);
                }
            }
        }
        return formatted.join(this.options.lineEnding);
    }
    /**
     * Gets indentation string for a given depth
     */
    getIndent(depth) {
        if (this.options.style === TonFormatStyle.Compact) {
            return '';
        }
        return (this.options.indentChar || ' ').repeat((this.options.indentSize || 4) * depth);
    }
    /**
     * Validates that the formatted content is equivalent to original
     */
    validate(original, formatted) {
        try {
            const parser = new TonParser();
            const originalDoc = parser.parse(original);
            const formattedDoc = parser.parse(formatted);
            // Compare the JSON representations
            const originalJson = JSON.stringify(originalDoc.toJSON());
            const formattedJson = JSON.stringify(formattedDoc.toJSON());
            return originalJson === formattedJson;
        }
        catch (error) {
            return false;
        }
    }
}
/**
 * Static helper functions
 */
(function (TonFormatter) {
    /**
     * Format TON content with default pretty style
     */
    function pretty(content) {
        const formatter = new TonFormatter({ style: TonFormatStyle.Pretty });
        return formatter.format(content);
    }
    TonFormatter.pretty = pretty;
    /**
     * Format TON content with compact style
     */
    function compact(content) {
        const formatter = new TonFormatter({ style: TonFormatStyle.Compact });
        return formatter.format(content);
    }
    TonFormatter.compact = compact;
    /**
     * Format and sort properties alphabetically
     */
    function sorted(content) {
        const formatter = new TonFormatter({
            style: TonFormatStyle.Pretty,
            sortProperties: true
        });
        return formatter.format(content);
    }
    TonFormatter.sorted = sorted;
})(TonFormatter || (TonFormatter = {}));

/**
 * DevPossible.Ton - JavaScript/TypeScript Library
 * Copyright (c) 2024 DevPossible, LLC. All rights reserved.
 * Author: DevPossible, LLC <support@devpossible.com>
 * Website: https://tonspec.com
 */
// Export lexer
/**
 * Parse a TON string into a TonDocument
 */
function parse(input) {
    const parser = new TonParser();
    const doc = parser.parse(input);
    return doc.toJSON();
}
/**
 * Stringify an object to TON format
 */
function stringify(obj, pretty = true) {
    const serializer = new TonSerializer({
        formatStyle: pretty ? TonFormatStyle.Pretty : TonFormatStyle.Compact
    });
    return serializer.serialize(obj);
}
// Default export
var index = {
    parse,
    stringify,
    TonParser,
    TonSerializer,
    TonValidator,
    TonFormatter,
    TonDocument,
    TonObject,
    TonArray,
    TonValue,
    TonEnum
};

export { SchemaRules, TokenType, TonArray, TonDocument, TonEnum, TonFormatStyle, TonFormatter, TonLexer, TonObject, TonParseError, TonParser, TonSerializer, TonValidator, TonValue, index as default, parse, stringify };
//# sourceMappingURL=index.esm.js.map
