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
    TokenType["AtSign"] = "AT_SIGN";
    TokenType["Slash"] = "SLASH";
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
    // Headers
    TokenType["HeaderMarker"] = "HEADER_MARKER";
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
            case '#':
                // Check for header marker #@
                if (this.peek(1) === '@') {
                    this.advance(); // consume #
                    this.advance(); // consume @
                    return this.createToken(TokenType.HeaderMarker, '#@');
                }
                return this.consumeChar(TokenType.Identifier); // Handle # for instance counts
            case '@': return this.consumeChar(TokenType.AtSign);
            case '/':
                // Only return Slash token if not followed by / or * (comments are handled in skipWhitespaceAndComments)
                if (this.peek(1) !== '/' && this.peek(1) !== '*') {
                    return this.consumeChar(TokenType.Slash);
                }
                // If it's a comment, it should have been skipped by skipWhitespaceAndComments
                throw new TonParseError(`Unexpected character '${char}'`, this.line, this.column);
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
        throw new TonParseError(`Unexpected character '${char}'`, this.line, this.column);
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
                    throw new TonParseError(`Unterminated string`, startLine, startColumn);
                }
                value += this.advance();
            }
        }
        if (this.isAtEnd()) {
            throw new TonParseError(`Unterminated string`, startLine, startColumn);
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
        throw new TonParseError(`Unterminated triple-quoted string`, this.line, this.column);
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
            throw new TonParseError(`Unterminated template string`, this.line, this.column);
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
        // Check for triple-quoted string
        if (this.peek(1) === "'" && this.peek(2) === "'") {
            return this.scanTripleSingleQuotedString();
        }
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
            throw new TonParseError(`Unterminated string`, startLine, startColumn);
        }
        this.advance(); // consume closing '
        return {
            type: TokenType.String,
            value,
            line: startLine,
            column: startColumn
        };
    }
    scanTripleSingleQuotedString() {
        const startLine = this.line;
        const startColumn = this.column;
        this.advance(); // consume first '
        this.advance(); // consume second '
        this.advance(); // consume third '
        let value = '';
        while (!this.isAtEnd()) {
            if (this.peek() === "'" && this.peek(1) === "'" && this.peek(2) === "'") {
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
        throw new TonParseError(`Unterminated triple-quoted string`, startLine, startColumn);
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
        if (values.length === 0) {
            // Empty enum set ||
            return {
                type: TokenType.EnumSet,
                value: [],
                line: startLine,
                column: startColumn
            };
        }
        else if (values.length === 1) {
            return {
                type: TokenType.Enum,
                value: values[0],
                line: startLine,
                column: startColumn
            };
        }
        else {
            return {
                type: TokenType.EnumSet,
                value: values,
                line: startLine,
                column: startColumn
            };
        }
    }
    scanIdentifierOrKeyword() {
        const startColumn = this.column;
        const startLine = this.line;
        let value = '';
        while (this.isAlphaNumeric(this.peek()) || this.peek() === '_' || this.peek() === '-') {
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
            case 'u': {
                // Unicode escape sequence \uXXXX
                let hex = '';
                for (let i = 0; i < 4; i++) {
                    if (this.isAtEnd())
                        break;
                    const hexChar = this.peek();
                    if (this.isHexDigit(hexChar)) {
                        hex += this.advance();
                    }
                    else {
                        break;
                    }
                }
                if (hex.length === 4) {
                    return String.fromCharCode(parseInt(hex, 16));
                }
                // If not a valid unicode escape, return as-is
                return 'u' + hex;
            }
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
            else if (char === '#' && this.peek(1) === '!') {
                // Skip schema declaration lines (e.g., #! enum(status) [active])
                this.skipLineComment();
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
    constructor(className, instanceCount) {
        this.properties = new Map();
        this.className = className;
        this.instanceCount = instanceCount;
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
    /**
     * Alias for set() - for compatibility with tests
     */
    setProperty(key, value) {
        this.set(key, value);
    }
    /**
     * Alias for get() - for compatibility with tests
     */
    getProperty(key) {
        return this.get(key);
    }
    /**
     * Adds a child object (for compatibility with tests that expect children array)
     */
    addChild(child) {
        // For now, just add it as a numbered property
        const childIndex = this.children.length;
        this.set(`child${childIndex}`, child);
    }
    /**
     * Gets children (for compatibility with tests)
     */
    get children() {
        const children = [];
        for (const value of this.properties.values()) {
            // Handle both wrapped and unwrapped TonObjects
            if (value instanceof TonObject) {
                children.push(value);
            }
            else if (value && typeof value === 'object' && value.value instanceof TonObject) {
                children.push(value.value);
            }
        }
        return children;
    }
    toJSON() {
        const result = {};
        // Add className and instanceCount if present
        if (this.className) {
            result._className = this.className;
        }
        if (this.instanceCount !== undefined) {
            result._instanceId = this.instanceCount;
        }
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
    push(value) {
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
var TonValueType;
(function (TonValueType) {
    TonValueType["String"] = "string";
    TonValueType["Number"] = "number";
    TonValueType["Integer"] = "integer";
    TonValueType["Float"] = "float";
    TonValueType["Boolean"] = "boolean";
    TonValueType["Null"] = "null";
    TonValueType["Undefined"] = "undefined";
    TonValueType["Object"] = "object";
    TonValueType["Array"] = "array";
    TonValueType["Date"] = "date";
    TonValueType["Guid"] = "guid";
    TonValueType["Enum"] = "enum";
})(TonValueType || (TonValueType = {}));
class TonValue {
    constructor(value, typeHint) {
        this.value = value;
        this.typeHint = typeHint;
    }
    getValue() {
        // Apply type conversions based on typeHint
        if (this.typeHint) {
            switch (this.typeHint) {
                case 'date':
                    return typeof this.value === 'string' ? new Date(this.value) : this.value;
                case 'number':
                    return typeof this.value === 'string' ? Number(this.value) : this.value;
                case 'boolean':
                    return typeof this.value === 'string' ? this.value === 'true' : this.value;
                default:
                    return this.value;
            }
        }
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
    /**
     * Gets the TonValueType enum value
     */
    get type() {
        // Import TonArray dynamically to avoid circular dependency
        const TonArray = require('./TonArray').TonArray;
        const TonObject = require('./TonObject').TonObject;
        if (Array.isArray(this.value) || this.value instanceof TonArray) {
            return TonValueType.Array;
        }
        if (this.value instanceof TonObject) {
            return TonValueType.Object;
        }
        const typeStr = this.getType();
        switch (typeStr) {
            case 'string':
                return TonValueType.String;
            case 'number':
                // Check if it's an integer or float
                if (typeof this.value === 'number' && Number.isInteger(this.value)) {
                    return TonValueType.Integer;
                }
                return TonValueType.Float;
            case 'boolean':
                return TonValueType.Boolean;
            case 'null':
                return TonValueType.Null;
            case 'undefined':
                return TonValueType.Undefined;
            case 'object':
                return TonValueType.Object;
            case 'date':
                return TonValueType.Date;
            case 'guid':
                return TonValueType.Guid;
            case 'enum':
                return TonValueType.Enum;
            default:
                return TonValueType.String;
        }
    }
    toJSON() {
        const value = this.getValue();
        // If the value has a toJSON method, use it (for TonObject, TonArray, etc.)
        // But don't call toJSON on Date objects - return them directly
        if (value instanceof Date) {
            return value;
        }
        if (value && typeof value.toJSON === 'function') {
            return value.toJSON();
        }
        return value;
    }
    toString() {
        return String(this.value);
    }
    /**
     * Returns the primitive value for comparison
     * This allows TonValue to be used in comparisons like toBe()
     */
    valueOf() {
        // For primitive types, return the unwrapped value
        if (this.value === null || this.value === undefined) {
            return this.value;
        }
        if (typeof this.value === 'string' || typeof this.value === 'number' || typeof this.value === 'boolean') {
            return this.value;
        }
        // For objects and arrays, return this so identity comparison works
        return this;
    }
    /**
     * Creates a TonValue from any value
     */
    static from(value, typeHint) {
        return new TonValue(value, typeHint);
    }
    /**
     * Creates a TonValue from an array
     */
    static fromArray(...args) {
        // Support both fromArray([1,2,3]) and fromArray(1,2,3)
        if (args.length === 1 && Array.isArray(args[0])) {
            return new TonValue(args[0]);
        }
        else {
            return new TonValue(args);
        }
    }
    /**
     * Gets the array count (length) if value is an array
     */
    getArrayCount() {
        const TonArray = require('./TonArray').TonArray;
        if (Array.isArray(this.value)) {
            return this.value.length;
        }
        if (this.value instanceof TonArray) {
            return this.value.length();
        }
        return 0;
    }
    /**
     * Checks if the array is empty
     */
    isEmpty() {
        if (Array.isArray(this.value)) {
            return this.value.length === 0;
        }
        return true;
    }
    /**
     * Converts the value to an array
     */
    toArray() {
        const TonArray = require('./TonArray').TonArray;
        if (Array.isArray(this.value)) {
            return this.value;
        }
        if (this.value instanceof TonArray) {
            return this.value.toArray();
        }
        return [this.value];
    }
    /**
     * Gets an element from the array at the specified index
     */
    getArrayElement(index) {
        const TonArray = require('./TonArray').TonArray;
        if (Array.isArray(this.value)) {
            if (index >= 0 && index < this.value.length) {
                const element = this.value[index];
                return element instanceof TonValue ? element : TonValue.from(element);
            }
        }
        else if (this.value instanceof TonArray) {
            const element = this.value.get(index);
            if (element !== undefined) {
                return element instanceof TonValue ? element : TonValue.from(element);
            }
        }
        return null;
    }
    /**
     * Conversion methods for type compatibility
     */
    toInt32() {
        return typeof this.value === 'number' ? Math.floor(this.value) : parseInt(String(this.value), 10);
    }
    toNumber() {
        return typeof this.value === 'number' ? this.value : parseFloat(String(this.value));
    }
    toBoolean() {
        return typeof this.value === 'boolean' ? this.value : Boolean(this.value);
    }
}

/**
 * TonDocument - Root document model
 * Copyright (c) 2024 DevPossible, LLC
 */
class TonDocument {
    constructor(root) {
        this.root = root || new TonObject();
    }
    getRoot() {
        return this.toJSON();
    }
    setRoot(root) {
        this.root = root;
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
    /**
     * Convenience property to get/set root as TonObject
     */
    get rootObject() {
        if (!(this.root instanceof TonObject)) {
            throw new Error('Root is not a TonObject');
        }
        return this.root;
    }
    set rootObject(value) {
        this.root = value;
    }
    /**
     * Gets a value at a path (e.g., "/property" or "/parent/child")
     */
    getValue(path) {
        if (path === '') {
            return null;
        }
        if (path === '/') {
            return this.root;
        }
        const parts = path.split('/').filter(p => p.length > 0);
        let current = this.root;
        for (const part of parts) {
            if (current instanceof TonObject) {
                // Try direct property access first
                let found = current.get(part);
                // If not found, try to find a child with matching className
                if (found === undefined) {
                    const children = Array.from(current.properties.values());
                    for (const child of children) {
                        const childObj = child instanceof TonValue ? child.value : child;
                        if (childObj instanceof TonObject && childObj.className === part) {
                            found = childObj;
                            break;
                        }
                    }
                }
                current = found;
            }
            else if (current instanceof TonArray) {
                const index = parseInt(part, 10);
                if (isNaN(index) || index < 0 || index >= current.items.length) {
                    return null;
                }
                current = current.items[index];
            }
            else {
                return null;
            }
            if (current === undefined) {
                return null;
            }
        }
        // Unwrap TonValue
        if (current instanceof TonValue) {
            return current.getValue();
        }
        return current;
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
        // Check for empty or whitespace-only input
        if (!input || input.trim().length === 0) {
            throw new TonParseError('Input cannot be empty', 1, 1);
        }
        const lexer = new TonLexer(input);
        this.tokens = lexer.tokenize();
        this.current = 0;
        // Parse optional header
        const header = this.parseHeader();
        const root = this.parseValue();
        if (!this.isAtEnd()) {
            throw new TonParseError('Unexpected content after parsing', this.peek().line, this.peek().column);
        }
        const doc = new TonDocument(root);
        if (header) {
            doc.header = header;
        }
        return doc;
    }
    parseHeader() {
        if (!this.check(TokenType.HeaderMarker)) {
            return null;
        }
        this.advance(); // consume #@
        const header = {};
        // Parse header properties (e.g., tonVersion = '1')
        while (!this.isAtEnd() && !this.check(TokenType.LeftBrace)) {
            // Check if we hit another marker or structural element
            if (this.check(TokenType.HeaderMarker)) {
                break;
            }
            // Parse property name
            const nameToken = this.advance();
            if (nameToken.type !== TokenType.Identifier &&
                nameToken.type !== TokenType.String &&
                nameToken.type !== TokenType.ClassName) {
                break; // Not a header property
            }
            const name = String(nameToken.value);
            // Expect = or :
            if (!this.check(TokenType.Equals) && !this.check(TokenType.Colon)) {
                break;
            }
            this.advance();
            // Parse value
            const value = this.parseHeaderValue();
            header[name] = value;
            // Optional comma
            if (this.check(TokenType.Comma)) {
                this.advance();
            }
        }
        return Object.keys(header).length > 0 ? header : null;
    }
    parseHeaderValue() {
        const token = this.peek();
        if (token.type === TokenType.String) {
            return this.advance().value;
        }
        else if (token.type === TokenType.Number) {
            return this.advance().value;
        }
        else if (token.type === TokenType.Boolean) {
            return this.advance().value;
        }
        else if (token.type === TokenType.Identifier) {
            return this.advance().value;
        }
        return null;
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
                return new TonValue(this.parseTypedObject());
            case TokenType.Identifier:
                // Check if this looks like a GUID pattern (contains hyphens)
                const identValue = token.value;
                if (typeof identValue === 'string' && identValue.includes('-')) {
                    // Treat as a string value (e.g., "not-a-guid")
                    this.advance();
                    return new TonValue(identValue);
                }
                throw new TonParseError('Expected { to start object', token.line, token.column);
            default:
                throw new TonParseError(`Unexpected token: ${token.type}`, token.line, token.column);
        }
    }
    parseObject() {
        this.consume(TokenType.LeftBrace, 'Expected {');
        // Check for typed object: {(ClassName)...}
        let className;
        let instanceCount;
        if (this.check(TokenType.LeftParen)) {
            this.advance(); // consume (
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
        const obj = new TonObject(className, instanceCount);
        while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
            // Check for child object
            if (this.check(TokenType.LeftBrace)) {
                // Child object
                const childObj = this.parseObject();
                obj.addChild(childObj);
                // Check for comma
                if (this.check(TokenType.Comma)) {
                    this.advance();
                }
                continue;
            }
            // Check for optional @ prefix (property marker)
            const hasAtPrefix = this.check(TokenType.AtSign);
            if (hasAtPrefix) {
                this.advance(); // consume @
            }
            // Check for optional / prefix (path marker)
            const hasSlashPrefix = this.check(TokenType.Slash);
            if (hasSlashPrefix) {
                this.advance(); // consume /
            }
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
            // Check for type annotation or separator
            let typeHint;
            let separatorConsumed = false;
            if (this.check(TokenType.Colon)) {
                this.advance(); // consume first :
                // Check if next token is a type identifier (for type annotation)
                if (this.check(TokenType.Identifier)) {
                    // This is a type annotation like name:string
                    typeHint = this.advance().value;
                    // Now expect another : or =
                    if (this.check(TokenType.Colon)) {
                        this.advance(); // consume second :
                        separatorConsumed = true;
                    }
                    else if (this.check(TokenType.Equals)) {
                        this.advance(); // consume =
                        separatorConsumed = true;
                    }
                }
                else {
                    // The : was the separator itself (like name: value)
                    separatorConsumed = true;
                }
            }
            // If separator not yet consumed, expect equals sign
            if (!separatorConsumed) {
                this.consume(TokenType.Equals, 'Expected Equals (=) or Colon (:) after property name');
            }
            // Parse property value
            const value = this.parseValue();
            // Wrap value in TonValue (like C# implementation does)
            let tonValue;
            if (value instanceof TonValue) {
                tonValue = value;
            }
            else {
                tonValue = TonValue.from(value);
            }
            if (typeHint) {
                tonValue.typeHint = typeHint;
            }
            obj.set(name, tonValue);
            // Check for comma or closing brace
            if (!this.check(TokenType.RightBrace)) {
                if (this.check(TokenType.Comma)) {
                    this.advance();
                    // Trailing commas are allowed
                }
                else if (this.check(TokenType.LeftBrace)) ;
                else {
                    // Require comma between properties
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
                    // Trailing commas are allowed
                }
                else {
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
 * Class-based serialization options with static presets (matches C# implementation)
 */
class TonSerializeOptions {
    constructor(options) {
        this.formatStyle = TonFormatStyle.Pretty;
        this.indentSize = 4;
        this.indentChar = ' ';
        this.includeTypeHints = false;
        this.includeHeader = false;
        this.tonVersion = '1';
        this.omitNulls = false;
        this.omitUndefined = true;
        this.sortProperties = false;
        this.quoteStyle = 'single';
        this.lineEnding = '\n';
        this.trailingCommas = false;
        this.maxLineLength = 0;
        this.preserveComments = false;
        this.useAtPrefix = false;
        this.useMultiLineStrings = true;
        this.multiLineStringThreshold = 2;
        this.omitEmptyCollections = false;
        this.propertySeparator = ' = ';
        if (options) {
            Object.assign(this, options);
            // Apply format-specific defaults if not explicitly set
            if (options.formatStyle === TonFormatStyle.Compact) {
                if (options.propertySeparator === undefined) {
                    this.propertySeparator = ' = '; // TON-style per Gherkin spec
                }
                if (options.quoteStyle === undefined) {
                    this.quoteStyle = 'single'; // TON-style per Gherkin spec
                }
            }
            else if (options.formatStyle === TonFormatStyle.Pretty) {
                if (options.propertySeparator === undefined) {
                    this.propertySeparator = ': ';
                }
                if (options.quoteStyle === undefined) {
                    this.quoteStyle = 'double';
                }
            }
        }
    }
    /**
     * Default serialization options
     */
    static get Default() {
        return new TonSerializeOptions();
    }
    /**
     * Default serialization options (lowercase method for compatibility)
     */
    static default() {
        return new TonSerializeOptions();
    }
    /**
     * Compact serialization options (no formatting)
     */
    static get Compact() {
        return new TonSerializeOptions({
            formatStyle: TonFormatStyle.Compact,
            indentSize: 0,
            indentChar: '',
            includeHeader: false,
            includeTypeHints: false,
            omitNulls: true,
            omitUndefined: true,
            omitEmptyCollections: true,
            useMultiLineStrings: false,
            sortProperties: false,
            propertySeparator: ' = ', // Use TON-style separator per Gherkin spec
            quoteStyle: 'single' // Use single quotes per Gherkin spec
        });
    }
    /**
     * Compact serialization options (lowercase method for compatibility)
     */
    static compact() {
        return TonSerializeOptions.Compact;
    }
    /**
     * Pretty-print serialization options
     */
    static get Pretty() {
        return new TonSerializeOptions({
            formatStyle: TonFormatStyle.Pretty,
            indentSize: 4,
            indentChar: ' ',
            sortProperties: false,
            includeHeader: false,
            includeTypeHints: false,
            useMultiLineStrings: true,
            propertySeparator: ': ',
            quoteStyle: 'double',
            trailingCommas: false
        });
    }
    /**
     * Optimized serialization options with hints
     */
    static get Optimized() {
        return new TonSerializeOptions({
            includeTypeHints: true,
            sortProperties: true
        });
    }
}

/**
 * TonSerializer - Serializer for TON format
 * Copyright (c) 2024 DevPossible, LLC
 */
class TonSerializer {
    constructor(options) {
        // If options is a TonSerializeOptions instance, use it directly
        // Otherwise, create a new instance with the provided options
        if (options instanceof TonSerializeOptions) {
            this.defaultOptions = options;
        }
        else {
            this.defaultOptions = new TonSerializeOptions(options);
        }
    }
    /**
     * Get the effective options for a serialize call
     */
    getOptions(options) {
        if (options instanceof TonSerializeOptions) {
            return options;
        }
        else if (options) {
            return new TonSerializeOptions(options);
        }
        return this.defaultOptions;
    }
    /**
     * Serializes a TonDocument or object to TON format string
     * Matches C# signature: Serialize(object obj, TonSerializeOptions? options = null)
     */
    serialize(obj, options) {
        const opts = this.getOptions(options);
        // Temporarily set options for this serialize call
        const savedOptions = this.defaultOptions;
        this.defaultOptions = opts;
        try {
            if (obj instanceof TonDocument) {
                return this._serializeDocument(obj);
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
                return this._serializeDocument(doc);
            }
        }
        finally {
            // Restore default options
            this.defaultOptions = savedOptions;
        }
    }
    /**
     * Serializes a TonDocument to string
     */
    serializeDocument(doc, options) {
        const savedOptions = this.defaultOptions;
        try {
            const opts = this.getOptions(options);
            this.defaultOptions = opts;
            return this._serializeDocument(doc);
        }
        finally {
            this.defaultOptions = savedOptions;
        }
    }
    _serializeDocument(doc) {
        const parts = [];
        // Add header if requested
        if (this.defaultOptions.includeHeader && this.defaultOptions.tonVersion) {
            parts.push(`#@ tonVersion = '${this.defaultOptions.tonVersion}'`);
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
        return parts.join(this.defaultOptions.lineEnding || '\n');
    }
    /**
     * Serializes a TonObject to string
     */
    serializeObject(obj, indent) {
        const props = obj.properties;
        // Handle empty object
        if (props.size === 0) {
            // Check if it has a className
            if (obj.className) {
                const prefix = obj.instanceCount !== undefined ?
                    `(${obj.className})(${obj.instanceCount})` :
                    `(${obj.className})`;
                return `${prefix}{}`;
            }
            return '{}';
        }
        // Sort properties if requested
        let keys = Array.from(props.keys());
        if (this.defaultOptions.sortProperties) {
            keys.sort();
        }
        // Filter out nulls/undefined if requested
        keys = keys.filter(key => {
            const value = props.get(key);
            const actualValue = value instanceof TonValue ? value.value : value;
            if (this.defaultOptions.omitNulls && actualValue === null)
                return false;
            if (this.defaultOptions.omitUndefined && actualValue === undefined)
                return false;
            return true;
        });
        // Format based on style
        if (this.defaultOptions.formatStyle === TonFormatStyle.Compact) {
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
                `(${obj.className})(${obj.instanceCount})` :
                `(${obj.className})`;
        }
        const separator = this.defaultOptions.propertySeparator || ' = ';
        const propParts = keys.map(key => {
            const value = obj.properties.get(key);
            const keyStr = this.serializePropertyName(key);
            const valueStr = this.serializeAnyValue(value, 0);
            return `${keyStr}${separator}${valueStr}`;
        });
        const joinStr = separator === ':' ? ',' : ', ';
        return `${prefix}{${propParts.join(joinStr)}}`;
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
                `(${obj.className})(${obj.instanceCount})` :
                `(${obj.className})`;
        }
        parts.push(`${prefix}{`);
        const separator = this.defaultOptions.propertySeparator || ' = ';
        keys.forEach((key, index) => {
            const value = obj.properties.get(key);
            const keyStr = this.serializePropertyName(key);
            const valueStr = this.serializeAnyValue(value, indent + 1);
            // Add comma after each property except the last (unless trailingCommas is true)
            const isLast = index === keys.length - 1;
            const comma = (this.defaultOptions.trailingCommas || !isLast) ? ',' : '';
            parts.push(`${nextIndentStr}${keyStr}${separator}${valueStr}${comma}`);
        });
        parts.push(`${indentStr}}`);
        return parts.join(this.defaultOptions.lineEnding);
    }
    /**
     * Serializes a property name
     */
    serializePropertyName(name) {
        // Check if it has a type annotation (name:type format)
        const typeAnnotationMatch = name.match(/^([a-zA-Z_][a-zA-Z0-9_]*):([a-zA-Z_][a-zA-Z0-9_]*)$/);
        if (typeAnnotationMatch) {
            return name; // Return as-is for type annotations
        }
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
        // In Pretty mode, format root-level arrays with indentation
        // Nested arrays stay inline
        if (this.defaultOptions.formatStyle === TonFormatStyle.Pretty && indent === 0) {
            const indentStr = this.getIndentString(indent);
            const nextIndentStr = this.getIndentString(indent + 1);
            const parts = [];
            parts.push('[');
            items.forEach((item, index) => {
                const valueStr = this.serializeAnyValue(item, indent + 1);
                // Add comma after each item except the last (unless trailingCommas is true)
                const isLast = index === items.length - 1;
                const comma = (this.defaultOptions.trailingCommas || !isLast) ? ',' : '';
                parts.push(`${nextIndentStr}${valueStr}${comma}`);
            });
            parts.push(`${indentStr}]`);
            return parts.join(this.defaultOptions.lineEnding);
        }
        else {
            // Nested arrays and compact mode: stay inline
            const itemStrs = items.map(item => this.serializeAnyValue(item, indent));
            // Use arraySeparator if specified, otherwise default based on format style
            const separator = this.defaultOptions.arraySeparator !== undefined
                ? this.defaultOptions.arraySeparator
                : (this.defaultOptions.formatStyle === TonFormatStyle.Compact ? ',' : ', ');
            return `[${itemStrs.join(separator)}]`;
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
        // Handle enum and enumSet specially
        if (value.typeHint === 'enum') {
            if (Array.isArray(value.value)) {
                return '|' + value.value.join('|') + '|';
            }
            else {
                return '|' + value.value + '|';
            }
        }
        if (value.typeHint === 'enumSet') {
            if (Array.isArray(value.value)) {
                return '|' + value.value.join('|') + '|';
            }
            else {
                return '|' + value.value + '|';
            }
        }
        // If the wrapped value is a TonObject or TonArray, serialize it properly
        if (value.value instanceof TonObject) {
            return this.serializeObject(value.value, indent);
        }
        if (value.value instanceof TonArray) {
            return this.serializeArray(value.value, indent);
        }
        let result = this.serializePlainValue(value.value, indent);
        // Add type hint if requested and present
        if (this.defaultOptions.includeTypeHints && value.typeHint) {
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
            // Check if it's a GUID (with or without braces)
            const guidPattern = /^(\{)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\})?$/i;
            if (guidPattern.test(value)) {
                return value;
            }
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
        const quote = this.defaultOptions.quoteStyle === 'single' ? "'" : '"';
        const escaped = str
            .replace(/\\/g, '\\\\')
            .replace(new RegExp(quote, 'g'), '\\' + quote)
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
        // Check if it's a multiline string
        if (str.includes('\n') && this.defaultOptions.formatStyle === TonFormatStyle.Pretty) {
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
        if (this.defaultOptions.formatStyle === TonFormatStyle.Compact) {
            return '';
        }
        return (this.defaultOptions.indentChar || ' ').repeat((this.defaultOptions.indentSize || 4) * level);
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
 * TonSchemaCollection - Legacy schema collection for backward compatibility
 * Copyright (c) 2024 DevPossible, LLC
 */
class TonSchemaCollection {
    constructor() {
        this.schemas = new Map();
        this.enums = new Map();
    }
    addSchema(nameOrSchema, schema) {
        if (typeof nameOrSchema === 'string' && schema) {
            this.schemas.set(nameOrSchema, schema);
        }
        else if (typeof nameOrSchema === 'object' && nameOrSchema.type) {
            // Use type as the name if only schema is provided
            this.schemas.set(nameOrSchema.type, nameOrSchema);
        }
    }
    getSchema(name) {
        return this.schemas.get(name);
    }
    hasSchema(name) {
        return this.schemas.has(name);
    }
    removeSchema(name) {
        return this.schemas.delete(name);
    }
    getAllSchemas() {
        const result = {};
        for (const [key, value] of this.schemas.entries()) {
            result[key] = value;
        }
        return result;
    }
    addEnum(enumDef) {
        this.enums.set(enumDef.name, enumDef);
    }
    getEnum(name) {
        return this.enums.get(name);
    }
    getAllEnums() {
        return Array.from(this.enums.values());
    }
}

/**
 * TonSchema - Legacy schema types for backward compatibility
 * Copyright (c) 2024 DevPossible, LLC
 */
var ValidationRuleType;
(function (ValidationRuleType) {
    ValidationRuleType["Required"] = "required";
    ValidationRuleType["Type"] = "type";
    ValidationRuleType["MinLength"] = "minLength";
    ValidationRuleType["MaxLength"] = "maxLength";
    ValidationRuleType["Minimum"] = "minimum";
    ValidationRuleType["Maximum"] = "maximum";
    ValidationRuleType["Pattern"] = "pattern";
    ValidationRuleType["Enum"] = "enum";
    ValidationRuleType["Unique"] = "unique";
    ValidationRuleType["Sorted"] = "sorted";
    ValidationRuleType["MinCount"] = "minCount";
    ValidationRuleType["MaxCount"] = "maxCount";
    ValidationRuleType["NonEmpty"] = "nonEmpty";
})(ValidationRuleType || (ValidationRuleType = {}));
class TonPropertySchema {
    constructor(_path, type) {
        this.validations = [];
        this.type = type;
    }
    addValidation(rule) {
        this.validations.push(rule);
    }
    getValidations() {
        return this.validations;
    }
}

/**
 * TonValidator - Schema validation for TON format
 * Copyright (c) 2024 DevPossible, LLC
 */
class TonValidator {
    constructor(schema) {
        // Store TonSchemaCollection for advanced validation
        if (schema instanceof TonSchemaCollection) {
            this.schemaCollection = schema;
            this.schema = schema.getAllSchemas();
        }
        else {
            this.schema = schema || {};
        }
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
        // If using TonSchemaCollection, validate by className
        if (this.schemaCollection && target instanceof TonObject) {
            this.validateWithSchemaCollection(target);
        }
        else if (this.schema.type || this.schema.properties) {
            // Object-style schema
            this.validateValue(target, '', this.schema);
        }
        else {
            // Path-style schema
            for (const [path, rule] of Object.entries(this.schema)) {
                this.validatePath(target, path, rule);
            }
        }
        const isValid = this.errors.length === 0;
        return {
            valid: isValid,
            isValid: isValid, // Alias for valid
            errors: [...this.errors]
        };
    }
    /**
     * Validates using TonSchemaCollection with className matching
     */
    validateWithSchemaCollection(obj) {
        if (!this.schemaCollection || !obj.className) {
            return;
        }
        const schemaDef = this.schemaCollection.getSchema(obj.className);
        if (!schemaDef || !schemaDef.properties) {
            return;
        }
        // Validate each property with its schema
        for (const [path, propSchema] of Object.entries(schemaDef.properties)) {
            this.validatePropertyWithSchema(obj, path, propSchema);
        }
    }
    /**
     * Validates a property using TonPropertySchema with custom validation rules
     */
    validatePropertyWithSchema(obj, path, propSchema) {
        // Get the property value (path starts with /)
        const propertyName = path.startsWith('/') ? path.substring(1) : path;
        const value = obj.get(propertyName);
        // Unwrap TonValue
        let actualValue = value;
        if (value instanceof TonValue) {
            actualValue = value.value;
        }
        // Check if it's an array type
        const isArray = actualValue instanceof TonArray || Array.isArray(actualValue);
        const arr = actualValue instanceof TonArray ? actualValue.items : actualValue;
        // Parse type for array base type validation (e.g., "array:int")
        let arrayBaseType;
        if (propSchema.type && propSchema.type.startsWith('array:')) {
            arrayBaseType = propSchema.type.substring(6); // Extract "int" from "array:int"
        }
        // Validate array base type
        if (isArray && arrayBaseType) {
            for (let i = 0; i < arr.length; i++) {
                const item = arr[i];
                const itemValue = item instanceof TonValue ? item.value : item;
                const itemType = this.getValueType(itemValue);
                // Map TON type names to validation types
                const expectedType = this.mapTonType(arrayBaseType);
                if (itemType !== expectedType) {
                    this.addError(`${propertyName}[${i}]`, `Type mismatch at index ${i}: expected ${expectedType}, got ${itemType}`, itemValue, 'type');
                }
            }
        }
        // Process custom validation rules
        if (propSchema instanceof TonPropertySchema) {
            const validations = propSchema.getValidations();
            for (const rule of validations) {
                this.applyValidationRule(propertyName, actualValue, rule, isArray ? arr : undefined);
            }
        }
    }
    /**
     * Maps TON type names to validator type names
     */
    mapTonType(tonType) {
        const typeMap = {
            'int': 'number',
            'integer': 'number',
            'float': 'number',
            'double': 'number',
            'str': 'string',
            'bool': 'boolean'
        };
        return typeMap[tonType.toLowerCase()] || tonType.toLowerCase();
    }
    /**
     * Applies a custom validation rule
     */
    applyValidationRule(path, value, rule, arr) {
        switch (rule.type) {
            case ValidationRuleType.MinCount:
                if (arr && arr.length < rule.value) {
                    this.addError(path, `Array must have at least ${rule.value} elements, but has ${arr.length}`, value, 'minCount');
                }
                break;
            case ValidationRuleType.MaxCount:
                if (arr && arr.length > rule.value) {
                    this.addError(path, `Array must have at most ${rule.value} elements, but has ${arr.length}`, value, 'maxCount');
                }
                break;
            case ValidationRuleType.NonEmpty:
                if (arr && arr.length === 0) {
                    this.addError(path, 'Array must not be empty', value, 'nonEmpty');
                }
                break;
            case ValidationRuleType.Unique:
                if (arr) {
                    const seen = new Set();
                    const duplicates = new Set();
                    for (const item of arr) {
                        const itemValue = item instanceof TonValue ? item.value : item;
                        const key = JSON.stringify(itemValue);
                        if (seen.has(key)) {
                            duplicates.add(itemValue);
                        }
                        seen.add(key);
                    }
                    if (duplicates.size > 0) {
                        this.addError(path, 'Array must contain only unique elements', value, 'unique');
                    }
                }
                break;
            case ValidationRuleType.Sorted:
                if (arr && arr.length > 1) {
                    for (let i = 0; i < arr.length - 1; i++) {
                        const current = arr[i] instanceof TonValue ? arr[i].value : arr[i];
                        const next = arr[i + 1] instanceof TonValue ? arr[i + 1].value : arr[i + 1];
                        if (current > next) {
                            this.addError(path, 'Array must be sorted in ascending order', value, 'sorted');
                            break;
                        }
                    }
                }
                break;
        }
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
        // Enum validation (check both 'enum' and 'values' properties)
        const enumValues = rule.enum || rule.values;
        if (enumValues && !enumValues.includes(value)) {
            this.addError(path, `Value must be one of: ${enumValues.join(', ')}`, value, 'enum');
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
     * Validates a value directly against a rule (object-style validation)
     */
    validateValue(value, path, rule) {
        // Unwrap TonValue if needed
        let actualValue = value;
        if (value instanceof TonValue) {
            actualValue = value.value;
        }
        if (value instanceof TonObject) {
            actualValue = value;
        }
        // Check required
        if (rule.required && (actualValue === undefined || actualValue === null)) {
            this.addError(path || 'root', `Missing required property: ${path}`, actualValue, 'required');
            return;
        }
        // Skip if null/undefined and not required
        if (actualValue === undefined || actualValue === null) {
            return;
        }
        // Type validation
        if (rule.type) {
            const types = Array.isArray(rule.type) ? rule.type : [rule.type];
            const actualType = this.getValueType(actualValue);
            // Special handling for type: 'enum' - it's valid for string values
            const typesWithoutEnum = types.filter(t => t !== 'enum');
            if (typesWithoutEnum.length > 0 && !typesWithoutEnum.includes(actualType)) {
                this.addError(path || 'root', `${path}: Expected ${typesWithoutEnum.join(' or ')}, got ${actualType}`, actualValue, 'type');
                return;
            }
        }
        // String validations
        if (typeof actualValue === 'string') {
            if (rule.minLength !== undefined && actualValue.length < rule.minLength) {
                this.addError(path, `String length ${actualValue.length} is less than minimum ${rule.minLength}`, actualValue, 'minLength');
            }
            if (rule.maxLength !== undefined && actualValue.length > rule.maxLength) {
                this.addError(path, `String length ${actualValue.length} exceeds maximum ${rule.maxLength}`, actualValue, 'maxLength');
            }
            if (rule.pattern) {
                const regex = rule.pattern instanceof RegExp ? rule.pattern : new RegExp(rule.pattern);
                if (!regex.test(actualValue)) {
                    this.addError(path, `String does not match pattern`, actualValue, 'pattern');
                }
            }
        }
        // Number validations
        if (typeof actualValue === 'number') {
            const minValue = rule.minimum !== undefined ? rule.minimum : rule.min;
            const maxValue = rule.maximum !== undefined ? rule.maximum : rule.max;
            if (minValue !== undefined && actualValue < minValue) {
                this.addError(path, `Value ${actualValue} is less than minimum ${minValue}`, actualValue, 'min');
            }
            if (maxValue !== undefined && actualValue > maxValue) {
                this.addError(path, `Value ${actualValue} exceeds maximum ${maxValue}`, actualValue, 'max');
            }
        }
        // Enum validation (check both 'enum' and 'values' properties)
        const enumValues = rule.enum || rule.values;
        if (enumValues && !enumValues.includes(actualValue)) {
            const valueStr = typeof actualValue === 'string' ? `"${actualValue}"` : actualValue;
            this.addError(path, `Value ${valueStr} is not in enum`, actualValue, 'enum');
        }
        // Object property validation
        if (rule.properties && (actualValue instanceof TonObject || (typeof actualValue === 'object' && !Array.isArray(actualValue)))) {
            const obj = actualValue instanceof TonObject ? actualValue : actualValue;
            // Check required properties array
            if (Array.isArray(rule.required)) {
                for (const requiredProp of rule.required) {
                    const propValue = obj instanceof TonObject ? obj.get(requiredProp) : obj[requiredProp];
                    if (propValue === undefined || propValue === null) {
                        this.addError(path || 'root', `Missing required property: ${requiredProp}`, actualValue, 'required');
                    }
                }
            }
            for (const [propName, propRule] of Object.entries(rule.properties)) {
                const propValue = obj instanceof TonObject ? obj.get(propName) : obj[propName];
                const propPath = path ? `${path}.${propName}` : propName;
                this.validateValue(propValue, propPath, propRule);
            }
        }
        // Array validations
        if (Array.isArray(actualValue) || actualValue instanceof TonArray) {
            const arr = actualValue instanceof TonArray ? actualValue.items : actualValue;
            const minLen = rule.minItems !== undefined ? rule.minItems : rule.minLength;
            const maxLen = rule.maxItems !== undefined ? rule.maxItems : rule.maxLength;
            if (minLen !== undefined && arr.length < minLen) {
                this.addError(path, `Array length ${arr.length} is less than minimum ${minLen}`, actualValue, 'minLength');
            }
            if (maxLen !== undefined && arr.length > maxLen) {
                this.addError(path, `Array length ${arr.length} exceeds maximum ${maxLen}`, actualValue, 'maxLength');
            }
            if (rule.items) {
                arr.forEach((item, index) => {
                    this.validateValue(item, `${path}[${index}]`, rule.items);
                });
            }
        }
        // Custom validation
        if (rule.custom) {
            const error = rule.custom(actualValue, path);
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
            includeHeader: this.options.style === TonFormatStyle.Pretty, // Header only for Pretty
            tonVersion: this.options.style === TonFormatStyle.Pretty ? '1' : undefined,
            includeTypeHints: true,
            omitNulls: false,
            omitUndefined: false,
            propertySeparator: ' = ', // Formatter always uses ' = ' separator
            arraySeparator: ', ' // Formatter always uses spaces in arrays for readability
        };
        const serializer = new TonSerializer(serializeOptions);
        return serializer.serialize(document);
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
     * Format TON content with specified style
     */
    function formatString(content, style) {
        const formatter = new TonFormatter({
            style: style || TonFormatStyle.Pretty,
            preserveComments: false // Disable comment preservation for clean serialization
        });
        return formatter.format(content);
    }
    TonFormatter.formatString = formatString;
    /**
     * Format TON content with default pretty style
     */
    function pretty(content) {
        const formatter = new TonFormatter({
            style: TonFormatStyle.Pretty,
            preserveComments: false
        });
        return formatter.format(content);
    }
    TonFormatter.pretty = pretty;
    /**
     * Format TON content with compact style
     */
    function compact(content) {
        const formatter = new TonFormatter({
            style: TonFormatStyle.Compact,
            preserveComments: false
        });
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

export { SchemaRules, TokenType, TonArray, TonDocument, TonEnum, TonFormatStyle, TonFormatter, TonLexer, TonObject, TonParseError, TonParser, TonSerializeOptions, TonSerializer, TonValidator, TonValue, index as default, parse, stringify };
//# sourceMappingURL=index.esm.js.map
