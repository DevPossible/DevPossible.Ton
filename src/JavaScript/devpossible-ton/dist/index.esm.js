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
            case '{': return this.consumeChar(TokenType.LeftBrace);
            case '}': return this.consumeChar(TokenType.RightBrace);
            case '[': return this.consumeChar(TokenType.LeftBracket);
            case ']': return this.consumeChar(TokenType.RightBracket);
            case '(': return this.consumeChar(TokenType.LeftParen);
            case ')': return this.consumeChar(TokenType.RightParen);
            case ':': return this.consumeChar(TokenType.Colon);
            case ',': return this.consumeChar(TokenType.Comma);
            case '$': return this.consumeChar(TokenType.StringHint);
            case '%': return this.consumeChar(TokenType.NumberHint);
            case '&': return this.consumeChar(TokenType.BooleanHint);
            case '^': return this.consumeChar(TokenType.DateHint);
            case '|': return this.scanEnum();
            case '"': return this.scanString();
            case '`': return this.scanTemplateString();
            case "'": return this.scanSingleQuoteString();
        }
        // Try to scan as GUID first if it could be one (starts with hex digit)
        if (this.isHexDigit(char)) {
            const guidValue = this.tryToScanGuid();
            if (guidValue) {
                return this.createToken(TokenType.Guid, guidValue);
            }
        }
        // Handle numbers
        if (this.isDigit(char) || (char === '-' && this.isDigit(this.peek(1)))) {
            return this.scanNumber();
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
        return this.createToken(TokenType.String, value);
    }
    scanTripleQuotedString() {
        this.advance(); // consume first "
        this.advance(); // consume second "
        this.advance(); // consume third "
        let value = '';
        while (!this.isAtEnd()) {
            if (this.peek() === '"' && this.peek(1) === '"' && this.peek(2) === '"') {
                this.advance();
                this.advance();
                this.advance();
                return this.createToken(TokenType.String, this.processMultilineString(value));
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
        return this.createToken(TokenType.String, value);
    }
    scanSingleQuoteString() {
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
        return this.createToken(TokenType.String, value);
    }
    scanNumber() {
        let value = '';
        if (this.peek() === '-') {
            value += this.advance();
        }
        // Check for hex or binary
        if (this.peek() === '0') {
            const next = this.peek(1);
            if (next === 'x' || next === 'X') {
                return this.scanHexNumber();
            }
            else if (next === 'b' || next === 'B') {
                return this.scanBinaryNumber();
            }
        }
        // Scan integer part
        while (this.isDigit(this.peek())) {
            value += this.advance();
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
            value += this.advance();
            if (this.peek() === '+' || this.peek() === '-') {
                value += this.advance();
            }
            while (this.isDigit(this.peek())) {
                value += this.advance();
            }
        }
        return this.createToken(TokenType.Number, parseFloat(value));
    }
    scanHexNumber() {
        let value = '0x';
        this.advance(); // consume 0
        this.advance(); // consume x
        while (this.isHexDigit(this.peek())) {
            value += this.advance();
        }
        return this.createToken(TokenType.Number, parseInt(value, 16));
    }
    scanBinaryNumber() {
        let value = '0b';
        this.advance(); // consume 0
        this.advance(); // consume b
        while (this.peek() === '0' || this.peek() === '1') {
            value += this.advance();
        }
        return this.createToken(TokenType.Number, parseInt(value.slice(2), 2));
    }
    scanEnum() {
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
            return this.createToken(TokenType.Enum, values[0]);
        }
        else if (values.length > 1) {
            return this.createToken(TokenType.EnumSet, values);
        }
        throw new Error(`Invalid enum at position ${startPos}`);
    }
    scanIdentifierOrKeyword() {
        let value = '';
        while (this.isAlphaNumeric(this.peek()) || this.peek() === '_') {
            value += this.advance();
        }
        // Check for boolean keywords
        if (value === 'true' || value === 'false') {
            return this.createToken(TokenType.Boolean, value === 'true');
        }
        // Check for null/undefined
        if (value === 'null') {
            return this.createToken(TokenType.Null, null);
        }
        if (value === 'undefined') {
            return this.createToken(TokenType.Undefined, undefined);
        }
        // Check if it's a class name (starts with capital)
        if (value[0] >= 'A' && value[0] <= 'Z') {
            return this.createToken(TokenType.ClassName, value);
        }
        return this.createToken(TokenType.Identifier, value);
    }
    tryToScanGuid() {
        // GUID pattern: 8-4-4-4-12 hex digits
        const startPos = this.position;
        const parts = [8, 4, 4, 4, 12];
        let guid = '';
        for (let i = 0; i < parts.length; i++) {
            if (i > 0) {
                if (this.peek() !== '-') {
                    // Not a GUID, reset position
                    this.position = startPos;
                    return null;
                }
                guid += this.advance(); // consume '-'
            }
            for (let j = 0; j < parts[i]; j++) {
                if (!this.isHexDigit(this.peek())) {
                    // Not a GUID, reset position
                    this.position = startPos;
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
        const char = this.advance();
        return this.createToken(type, char);
    }
    createToken(type, value) {
        return {
            type,
            value,
            line: this.line,
            column: this.column - (typeof value === 'string' ? value.length : 1)
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
            // Parse property name
            const nameToken = this.advance();
            if (nameToken.type !== TokenType.Identifier &&
                nameToken.type !== TokenType.String) {
                throw new TonParseError('Expected property name', nameToken.line, nameToken.column);
            }
            const name = nameToken.value;
            // Check for type annotation
            let typeHint;
            if (this.check(TokenType.Colon)) {
                this.advance(); // consume :
                // Check if next token is a type identifier
                if (this.check(TokenType.Identifier)) {
                    typeHint = this.advance().value;
                }
            }
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
        const className = this.advance().value;
        // Check for instance count
        let instanceCount;
        if (this.check(TokenType.LeftParen)) {
            this.advance(); // consume (
            const countToken = this.consume(TokenType.Number, 'Expected instance count');
            instanceCount = countToken.value;
            this.consume(TokenType.RightParen, 'Expected )');
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
        if (typeof value === 'string') {
            this.values = [value];
            this.isSingleValue = true;
        }
        else {
            this.values = value;
            this.isSingleValue = false;
        }
    }
    getValue() {
        return this.isSingleValue ? this.values[0] : this.values;
    }
    getValues() {
        return this.values;
    }
    contains(value) {
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
            return `|${this.values[0]}|`;
        }
        return this.values.map(v => `|${v}`).join('') + '|';
    }
}

export { TonArray, TonDocument, TonEnum, TonLexer, TonObject, TonParseError, TonParser, TonValue };
//# sourceMappingURL=index.esm.js.map
