/**
 * TonLexer Tests
 * Copyright (c) 2024 DevPossible, LLC
 */

import { TonLexer, TokenType } from '../../src/lexer/TonLexer';

describe('TonLexer', () => {
  describe('Basic Structure', () => {
    test('should tokenize empty object', () => {
      const lexer = new TonLexer('{ }');
      const tokens = lexer.tokenize();

      expect(tokens).toHaveLength(3); // { } EOF
      expect(tokens[0].type).toBe(TokenType.LeftBrace);
      expect(tokens[1].type).toBe(TokenType.RightBrace);
      expect(tokens[2].type).toBe(TokenType.EndOfFile);
    });

    test('should tokenize empty array', () => {
      const lexer = new TonLexer('[ ]');
      const tokens = lexer.tokenize();

      expect(tokens).toHaveLength(3); // [ ] EOF
      expect(tokens[0].type).toBe(TokenType.LeftBracket);
      expect(tokens[1].type).toBe(TokenType.RightBracket);
      expect(tokens[2].type).toBe(TokenType.EndOfFile);
    });
  });

  describe('Strings', () => {
    test('should tokenize double-quoted string', () => {
      const lexer = new TonLexer('"Hello World"');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.String);
      expect(tokens[0].value).toBe('Hello World');
    });

    test('should tokenize single-quoted string', () => {
      const lexer = new TonLexer("'Hello World'");
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.String);
      expect(tokens[0].value).toBe('Hello World');
    });

    test('should tokenize template string', () => {
      const lexer = new TonLexer('`Hello World`');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.String);
      expect(tokens[0].value).toBe('Hello World');
    });

    test('should handle escape sequences', () => {
      const lexer = new TonLexer('"Hello\\nWorld"');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.String);
      expect(tokens[0].value).toBe('Hello\nWorld');
    });

    test('should tokenize triple-quoted string', () => {
      const lexer = new TonLexer('"""Hello\nWorld"""');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.String);
      expect(tokens[0].value).toBe('Hello\nWorld');
    });
  });

  describe('Numbers', () => {
    test('should tokenize integer', () => {
      const lexer = new TonLexer('42');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.Number);
      expect(tokens[0].value).toBe(42);
    });

    test('should tokenize float', () => {
      const lexer = new TonLexer('3.14');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.Number);
      expect(tokens[0].value).toBe(3.14);
    });

    test('should tokenize negative number', () => {
      const lexer = new TonLexer('-42');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.Number);
      expect(tokens[0].value).toBe(-42);
    });

    test('should tokenize hexadecimal', () => {
      const lexer = new TonLexer('0xFF');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.Number);
      expect(tokens[0].value).toBe(255);
    });

    test('should tokenize binary', () => {
      const lexer = new TonLexer('0b1010');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.Number);
      expect(tokens[0].value).toBe(10);
    });

    test('should tokenize scientific notation', () => {
      const lexer = new TonLexer('1.5e10');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.Number);
      expect(tokens[0].value).toBe(1.5e10);
    });
  });

  describe('Booleans and Keywords', () => {
    test('should tokenize true', () => {
      const lexer = new TonLexer('true');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.Boolean);
      expect(tokens[0].value).toBe(true);
    });

    test('should tokenize false', () => {
      const lexer = new TonLexer('false');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.Boolean);
      expect(tokens[0].value).toBe(false);
    });

    test('should tokenize null', () => {
      const lexer = new TonLexer('null');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.Null);
      expect(tokens[0].value).toBe(null);
    });

    test('should tokenize undefined', () => {
      const lexer = new TonLexer('undefined');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.Undefined);
      expect(tokens[0].value).toBe(undefined);
    });
  });

  describe('Identifiers and Class Names', () => {
    test('should tokenize identifier', () => {
      const lexer = new TonLexer('myVariable');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.Identifier);
      expect(tokens[0].value).toBe('myVariable');
    });

    test('should tokenize class name', () => {
      const lexer = new TonLexer('Person');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.ClassName);
      expect(tokens[0].value).toBe('Person');
    });

    test('should tokenize identifier with underscore', () => {
      const lexer = new TonLexer('_privateVar');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.Identifier);
      expect(tokens[0].value).toBe('_privateVar');
    });
  });

  describe('Type Hints', () => {
    test('should tokenize string hint', () => {
      const lexer = new TonLexer('$"value"');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.StringHint);
      expect(tokens[1].type).toBe(TokenType.String);
    });

    test('should tokenize number hint', () => {
      const lexer = new TonLexer('%42');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.NumberHint);
      expect(tokens[1].type).toBe(TokenType.Number);
    });

    test('should tokenize boolean hint', () => {
      const lexer = new TonLexer('&true');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.BooleanHint);
      expect(tokens[1].type).toBe(TokenType.Boolean);
    });

    test('should tokenize date hint', () => {
      const lexer = new TonLexer('^"2024-01-01"');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.DateHint);
      expect(tokens[1].type).toBe(TokenType.String);
    });
  });

  describe('Enums', () => {
    test('should tokenize single enum', () => {
      const lexer = new TonLexer('|active|');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.Enum);
      expect(tokens[0].value).toBe('active');
    });

    test('should tokenize enum set', () => {
      const lexer = new TonLexer('|read|write|execute|');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.EnumSet);
      expect(tokens[0].value).toEqual(['read', 'write', 'execute']);
    });
  });

  describe('GUID', () => {
    test('should tokenize GUID', () => {
      const lexer = new TonLexer('550e8400-e29b-41d4-a716-446655440000');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.Guid);
      expect(tokens[0].value).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('Comments', () => {
    test('should skip single-line comments', () => {
      const lexer = new TonLexer('42 // comment\n43');
      const tokens = lexer.tokenize();

      expect(tokens).toHaveLength(3); // 42, 43, EOF
      expect(tokens[0].value).toBe(42);
      expect(tokens[1].value).toBe(43);
    });

    test('should skip multi-line comments', () => {
      const lexer = new TonLexer('42 /* comment */ 43');
      const tokens = lexer.tokenize();

      expect(tokens).toHaveLength(3); // 42, 43, EOF
      expect(tokens[0].value).toBe(42);
      expect(tokens[1].value).toBe(43);
    });
  });

  describe('Complex Structures', () => {
    test('should tokenize object with properties', () => {
      const input = '{ name: "John", age: 30 }';
      const lexer = new TonLexer(input);
      const tokens = lexer.tokenize();

      expect(tokens.map(t => t.type)).toEqual([
        TokenType.LeftBrace,
        TokenType.Identifier,
        TokenType.Colon,
        TokenType.String,
        TokenType.Comma,
        TokenType.Identifier,
        TokenType.Colon,
        TokenType.Number,
        TokenType.RightBrace,
        TokenType.EndOfFile
      ]);
    });

    test('should tokenize array with values', () => {
      const input = '[1, "two", true, null]';
      const lexer = new TonLexer(input);
      const tokens = lexer.tokenize();

      expect(tokens.map(t => t.type)).toEqual([
        TokenType.LeftBracket,
        TokenType.Number,
        TokenType.Comma,
        TokenType.String,
        TokenType.Comma,
        TokenType.Boolean,
        TokenType.Comma,
        TokenType.Null,
        TokenType.RightBracket,
        TokenType.EndOfFile
      ]);
    });

    test('should tokenize typed object', () => {
      const input = 'Person(1) { name: "John" }';
      const lexer = new TonLexer(input);
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.ClassName);
      expect(tokens[0].value).toBe('Person');
      expect(tokens[1].type).toBe(TokenType.LeftParen);
      expect(tokens[2].type).toBe(TokenType.Number);
      expect(tokens[3].type).toBe(TokenType.RightParen);
    });
  });

  describe('Error Handling', () => {
    test('should throw on unterminated string', () => {
      const lexer = new TonLexer('"unterminated');
      expect(() => lexer.tokenize()).toThrow('Unterminated string');
    });

    test('should throw on invalid character', () => {
      const lexer = new TonLexer('{ @ }');
      expect(() => lexer.tokenize()).toThrow('Unexpected character');
    });

    test('should throw on invalid enum', () => {
      const lexer = new TonLexer('|');
      expect(() => lexer.tokenize()).toThrow('Invalid enum');
    });
  });
});
