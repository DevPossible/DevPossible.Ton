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

export class TonParser {
  private tokens: Token[] = [];
  private current: number = 0;
  private options: TonParseOptions;

  constructor(options?: TonParseOptions) {
    this.options = options || {};
  }

  public parse(input: string): TonDocument {
    const lexer = new TonLexer(input);
    this.tokens = lexer.tokenize();
    this.current = 0;

    const root = this.parseValue();

    if (!this.isAtEnd()) {
      throw new TonParseError(
        'Unexpected content after parsing',
        this.peek().line,
        this.peek().column
      );
    }

    return new TonDocument(root);
  }

  private parseValue(): any {
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
        throw new TonParseError(
          `Unexpected token: ${token.type}`,
          token.line,
          token.column
        );
    }
  }

  private parseObject(): TonObject {
    this.consume(TokenType.LeftBrace, 'Expected {');
    const obj = new TonObject();

    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      // Parse property name
      const nameToken = this.advance();
      if (nameToken.type !== TokenType.Identifier &&
          nameToken.type !== TokenType.String) {
        throw new TonParseError(
          'Expected property name',
          nameToken.line,
          nameToken.column
        );
      }

      const name = nameToken.value;

      // Check for type annotation
      let typeHint: string | undefined;
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
        } else if (!this.options.allowTrailingComma) {
          // In strict mode, require comma between properties
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
        } else if (!this.options.allowTrailingComma) {
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
    const className = this.advance().value;

    // Check for instance count
    let instanceCount: number | undefined;
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