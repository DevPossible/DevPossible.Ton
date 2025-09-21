/**
 * TonLexer - Tokenizer for TON format
 * Copyright (c) 2024 DevPossible, LLC
 */

export enum TokenType {
  // Literals
  String = 'STRING',
  Number = 'NUMBER',
  Boolean = 'BOOLEAN',
  Null = 'NULL',
  Undefined = 'UNDEFINED',

  // Identifiers and Keywords
  Identifier = 'IDENTIFIER',
  ClassName = 'CLASS_NAME',

  // Delimiters
  LeftBrace = 'LEFT_BRACE',
  RightBrace = 'RIGHT_BRACE',
  LeftBracket = 'LEFT_BRACKET',
  RightBracket = 'RIGHT_BRACKET',
  LeftParen = 'LEFT_PAREN',
  RightParen = 'RIGHT_PAREN',

  // Operators
  Colon = 'COLON',
  Comma = 'COMMA',
  Pipe = 'PIPE',

  // Type Hints
  StringHint = 'STRING_HINT',     // $
  NumberHint = 'NUMBER_HINT',     // %
  BooleanHint = 'BOOLEAN_HINT',   // &
  DateHint = 'DATE_HINT',         // ^

  // Special
  Enum = 'ENUM',
  EnumSet = 'ENUM_SET',
  Guid = 'GUID',

  // Comments
  Comment = 'COMMENT',

  // Control
  EndOfFile = 'EOF',
  NewLine = 'NEWLINE'
}

export interface Token {
  type: TokenType;
  value: any;
  line: number;
  column: number;
  raw?: string;
}

export class TonLexer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];

  constructor(input: string) {
    this.input = input;
  }

  public tokenize(): Token[] {
    while (!this.isAtEnd()) {
      this.skipWhitespaceAndComments();
      if (this.isAtEnd()) break;

      const token = this.nextToken();
      if (token && token.type !== TokenType.Comment) {
        this.tokens.push(token);
      }
    }

    this.tokens.push(this.createToken(TokenType.EndOfFile, null));
    return this.tokens;
  }

  private nextToken(): Token | null {
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

  private scanString(): Token {
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
      } else {
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

  private scanTripleQuotedString(): Token {
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

  private processMultilineString(value: string): string {
    const lines = value.split('\n');
    if (lines.length === 0) return value;

    // Remove leading and trailing empty lines
    while (lines.length > 0 && lines[0].trim() === '') lines.shift();
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();

    if (lines.length === 0) return '';

    // Find minimum indentation
    const minIndent = Math.min(
      ...lines
        .filter(line => line.trim().length > 0)
        .map(line => line.match(/^(\s*)/)?.[0].length || 0)
    );

    // Remove common indentation
    return lines.map(line => line.substring(minIndent)).join('\n');
  }

  private scanTemplateString(): Token {
    this.advance(); // consume `
    let value = '';

    while (!this.isAtEnd() && this.peek() !== '`') {
      if (this.peek() === '\\') {
        this.advance();
        value += this.scanEscapeSequence();
      } else {
        value += this.advance();
      }
    }

    if (this.isAtEnd()) {
      throw new Error(`Unterminated template string`);
    }

    this.advance(); // consume closing `
    return this.createToken(TokenType.String, value);
  }

  private scanSingleQuoteString(): Token {
    this.advance(); // consume '
    let value = '';

    while (!this.isAtEnd() && this.peek() !== "'") {
      if (this.peek() === '\\') {
        this.advance();
        value += this.scanEscapeSequence();
      } else {
        value += this.advance();
      }
    }

    if (this.isAtEnd()) {
      throw new Error(`Unterminated string`);
    }

    this.advance(); // consume closing '
    return this.createToken(TokenType.String, value);
  }

  private scanNumber(): Token {
    let value = '';

    if (this.peek() === '-') {
      value += this.advance();
    }

    // Check for hex or binary
    if (this.peek() === '0') {
      const next = this.peek(1);
      if (next === 'x' || next === 'X') {
        return this.scanHexNumber();
      } else if (next === 'b' || next === 'B') {
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

  private scanHexNumber(): Token {
    let value = '0x';
    this.advance(); // consume 0
    this.advance(); // consume x

    while (this.isHexDigit(this.peek())) {
      value += this.advance();
    }

    return this.createToken(TokenType.Number, parseInt(value, 16));
  }

  private scanBinaryNumber(): Token {
    let value = '0b';
    this.advance(); // consume 0
    this.advance(); // consume b

    while (this.peek() === '0' || this.peek() === '1') {
      value += this.advance();
    }

    return this.createToken(TokenType.Number, parseInt(value.slice(2), 2));
  }

  private scanEnum(): Token {
    const startPos = this.position;
    this.advance(); // consume first |

    const values: string[] = [];
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
      } else if (this.isAlpha(char) || this.isDigit(char) || char === '_') {
        current += this.advance();
      } else {
        break;
      }
    }

    if (values.length === 0 && current) {
      values.push(current);
    }

    if (values.length === 1) {
      return this.createToken(TokenType.Enum, values[0]);
    } else if (values.length > 1) {
      return this.createToken(TokenType.EnumSet, values);
    }

    throw new Error(`Invalid enum at position ${startPos}`);
  }

  private scanIdentifierOrKeyword(): Token {
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

  private tryToScanGuid(): string | null {
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

  private scanEscapeSequence(): string {
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

  private skipWhitespaceAndComments(): void {
    while (!this.isAtEnd()) {
      const char = this.peek();

      if (char === ' ' || char === '\t' || char === '\r') {
        this.advance();
      } else if (char === '\n') {
        this.line++;
        this.column = 0;
        this.advance();
      } else if (char === '/' && this.peek(1) === '/') {
        this.skipLineComment();
      } else if (char === '/' && this.peek(1) === '*') {
        this.skipBlockComment();
      } else {
        break;
      }
    }
  }

  private skipLineComment(): void {
    while (!this.isAtEnd() && this.peek() !== '\n') {
      this.advance();
    }
  }

  private skipBlockComment(): void {
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

  private consumeChar(type: TokenType): Token {
    const char = this.advance();
    return this.createToken(type, char);
  }

  private createToken(type: TokenType, value: any): Token {
    return {
      type,
      value,
      line: this.line,
      column: this.column - (typeof value === 'string' ? value.length : 1)
    };
  }

  private advance(): string {
    const char = this.input[this.position++];
    this.column++;
    return char;
  }

  private peek(offset: number = 0): string {
    const pos = this.position + offset;
    return pos < this.input.length ? this.input[pos] : '\0';
  }

  private isAtEnd(): boolean {
    return this.position >= this.input.length;
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isHexDigit(char: string): boolean {
    return this.isDigit(char) ||
           (char >= 'a' && char <= 'f') ||
           (char >= 'A' && char <= 'F');
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') ||
           (char >= 'A' && char <= 'Z');
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }
}