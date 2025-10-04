/**
 * TonLexer - Tokenizer for TON format
 * Copyright (c) 2024 DevPossible, LLC
 */

import { TonParseError } from '../errors/TonParseError';

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
  Equals = 'EQUALS',
  Colon = 'COLON',
  Comma = 'COMMA',
  Pipe = 'PIPE',
  AtSign = 'AT_SIGN',
  Slash = 'SLASH',

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

  // Headers
  HeaderMarker = 'HEADER_MARKER', // #@

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

  public nextToken(): Token | null {
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

  private scanTripleQuotedString(): Token {
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
    const startLine = this.line;
    const startColumn = this.column;
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

  private scanSingleQuoteString(): Token {
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
      } else {
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

  private scanTripleSingleQuotedString(): Token {
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

  private scanNumberOrNumericProperty(): Token {
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
      } else if (next === 'b' || next === 'B') {
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


  private scanHexNumber(startLine: number, startColumn: number): Token {
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

  private scanBinaryNumber(startLine: number, startColumn: number): Token {
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

  private scanEnum(): Token {
    const startLine = this.line;
    const startColumn = this.column;
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

    if (values.length === 0) {
      // Empty enum set ||
      return {
        type: TokenType.EnumSet,
        value: [],
        line: startLine,
        column: startColumn
      };
    } else if (values.length === 1) {
      return {
        type: TokenType.Enum,
        value: values[0],
        line: startLine,
        column: startColumn
      };
    } else {
      return {
        type: TokenType.EnumSet,
        value: values,
        line: startLine,
        column: startColumn
      };
    }
  }

  private scanIdentifierOrKeyword(): Token {
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

  private tryToScanBracedGuid(): Token | null {
    // Check for {GUID} pattern
    if (this.peek() !== '{') return null;

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

  private tryToScanGuid(): string | null {
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
      case 'u': {
        // Unicode escape sequence \uXXXX
        let hex = '';
        for (let i = 0; i < 4; i++) {
          if (this.isAtEnd()) break;
          const hexChar = this.peek();
          if (this.isHexDigit(hexChar)) {
            hex += this.advance();
          } else {
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
      } else if (char === '#' && this.peek(1) === '!') {
        // Skip schema declaration lines (e.g., #! enum(status) [active])
        this.skipLineComment();
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
    const startColumn = this.column;
    const char = this.advance();
    return {
      type,
      value: char,
      line: this.line,
      column: startColumn
    };
  }

  private createToken(type: TokenType, value: any): Token {
    // Calculate the correct column position for the start of the token
    let tokenColumn = this.column;
    if (typeof value === 'string' && value.length > 0) {
      tokenColumn = Math.max(1, this.column - value.length);
    } else if (type !== TokenType.EndOfFile) {
      tokenColumn = Math.max(1, this.column - 1);
    }

    return {
      type,
      value,
      line: this.line,
      column: tokenColumn
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