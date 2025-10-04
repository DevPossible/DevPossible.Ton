/**
 * TonParser - Parser for TON format
 * Copyright (c) 2024 DevPossible, LLC
 */

import { TonLexer, Token, TokenType } from '../lexer/TonLexer';
import { TonDocument } from '../models/TonDocument';
import { TonObject } from '../models/TonObject';
import { TonValue } from '../models/TonValue';
import { TonArray } from '../models/TonArray';
import { TonParseOptions } from './TonParseOptions';
import { TonParseError } from '../errors/TonParseError';

// Re-export TonParseOptions for convenience
export { TonParseOptions };

export class TonParser {
  private tokens: Token[] = [];
  private current: number = 0;
  // @ts-ignore - options reserved for future use
  private options: TonParseOptions;

  constructor(options?: TonParseOptions) {
    this.options = options || {};
  }

  public parse(input: string): TonDocument {
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
      throw new TonParseError(
        'Unexpected content after parsing',
        this.peek().line,
        this.peek().column
      );
    }

    const doc = new TonDocument(root);
    if (header) {
      doc.header = header;
    }
    return doc;
  }

  private parseHeader(): any {
    if (!this.check(TokenType.HeaderMarker)) {
      return null;
    }

    this.advance(); // consume #@

    const header: any = {};

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

  private parseHeaderValue(): any {
    const token = this.peek();

    if (token.type === TokenType.String) {
      return this.advance().value;
    } else if (token.type === TokenType.Number) {
      return this.advance().value;
    } else if (token.type === TokenType.Boolean) {
      return this.advance().value;
    } else if (token.type === TokenType.Identifier) {
      return this.advance().value;
    }

    return null;
  }

  private parseValue(): any {
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
        throw new TonParseError(
          'Expected { to start object',
          token.line,
          token.column
        );

      default:
        throw new TonParseError(
          `Unexpected token: ${token.type}`,
          token.line,
          token.column
        );
    }
  }

  private parseObject(): TonObject {
    this.consume(TokenType.LeftBrace, 'Expected {');

    // Check for typed object: {(ClassName)...}
    let className: string | undefined;
    let instanceCount: number | undefined;

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
        throw new TonParseError(
          'Expected property name',
          nameToken.line,
          nameToken.column
        );
      }

      // Convert keyword token values back to string names
      let name: string;
      if (nameToken.type === TokenType.Boolean) {
        name = nameToken.value ? 'true' : 'false';
      } else if (nameToken.type === TokenType.Null) {
        name = 'null';
      } else if (nameToken.type === TokenType.Undefined) {
        name = 'undefined';
      } else {
        name = String(nameToken.value);
      }

      // Check for type annotation or separator
      let typeHint: string | undefined;
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
          } else if (this.check(TokenType.Equals)) {
            this.advance(); // consume =
            separatorConsumed = true;
          }
        } else {
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
      let tonValue: TonValue;
      if (value instanceof TonValue) {
        tonValue = value;
      } else {
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
        } else if (this.check(TokenType.LeftBrace)) {
          // Next token is {, which will be parsed as a child object in the next iteration
          // No comma required before child objects
        } else {
          // Require comma between properties
          const next = this.peek();
          if (next.type !== TokenType.RightBrace) {
            throw new TonParseError(
              'Expected comma or }',
              next.line,
              next.column
            );
          }
        }
      }
    }

    this.consume(TokenType.RightBrace, 'Expected }');
    return obj;
  }

  private parseArray(): TonArray {
    this.consume(TokenType.LeftBracket, 'Expected [');
    const arr = new TonArray();

    while (!this.check(TokenType.RightBracket) && !this.isAtEnd()) {
      arr.add(this.parseValue());

      if (!this.check(TokenType.RightBracket)) {
        if (this.check(TokenType.Comma)) {
          this.advance();
          // Trailing commas are allowed
        } else {
          const next = this.peek();
          if (next.type !== TokenType.RightBracket) {
            throw new TonParseError(
              'Expected comma or ]',
              next.line,
              next.column
            );
          }
        }
      }
    }

    this.consume(TokenType.RightBracket, 'Expected ]');
    return arr;
  }

  private parseEnum(): TonValue {
    const token = this.advance();
    return new TonValue(token.value, 'enum');
  }

  private parseHintedValue(): TonValue {
    const hintToken = this.advance();
    let typeHint: string;

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

  private parseTypedObject(): TonObject {
    // Handle both (ClassName) and ClassName syntaxes
    let className: string;
    let instanceCount: number | undefined;

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
    } else {
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

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }

    const token = this.peek();
    throw new TonParseError(message, token.line, token.column);
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EndOfFile;
  }
}