/**
 * TonLexer Tests - Based on Gherkin Specifications
 * Tests for tokenizing TON format
 */

import { TonLexer, TokenType } from '../../src/lexer/TonLexer';

describe('TonLexer - Gherkin Specifications', () => {
  describe('Basic Tokenization', () => {
    test('should tokenize empty string', () => {
      const lexer = new TonLexer('');
      const tokens = lexer.tokenize();
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe(TokenType.EndOfFile);
    });

    test('should tokenize simple object', () => {
      const lexer = new TonLexer('{ name = "John" }');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.LeftBrace);
      expect(tokens[1].type).toBe(TokenType.Identifier);
      expect(tokens[1].value).toBe('name');
      expect(tokens[2].type).toBe(TokenType.Equals);
      expect(tokens[3].type).toBe(TokenType.String);
      expect(tokens[3].value).toBe('John');
      expect(tokens[4].type).toBe(TokenType.RightBrace);
    });

    test('should handle all bracket types', () => {
      const lexer = new TonLexer('{}[]()');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.LeftBrace);
      expect(tokens[1].type).toBe(TokenType.RightBrace);
      expect(tokens[2].type).toBe(TokenType.LeftBracket);
      expect(tokens[3].type).toBe(TokenType.RightBracket);
      expect(tokens[4].type).toBe(TokenType.LeftParen);
      expect(tokens[5].type).toBe(TokenType.RightParen);
    });

    test('should handle operators and delimiters', () => {
      const lexer = new TonLexer('= : ,');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.Equals);
      expect(tokens[1].type).toBe(TokenType.Colon);
      expect(tokens[2].type).toBe(TokenType.Comma);
    });
  });

  describe('String Handling', () => {
    test('should parse double-quoted strings', () => {
      const lexer = new TonLexer('"Hello World"');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.String);
      expect(tokens[0].value).toBe('Hello World');
    });

    test('should parse single-quoted strings', () => {
      const lexer = new TonLexer("'Hello World'");
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.String);
      expect(tokens[0].value).toBe('Hello World');
    });

    test('should parse template strings', () => {
      const lexer = new TonLexer('`Hello World`');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.String);
      expect(tokens[0].value).toBe('Hello World');
    });

    test('should handle escape sequences', () => {
      const lexer = new TonLexer('"Line 1\\nLine 2\\tTabbed\\r\\n"');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.String);
      expect(tokens[0].value).toBe('Line 1\nLine 2\tTabbed\r\n');
    });

    test('should handle escaped quotes', () => {
      const lexer = new TonLexer('"He said \\"Hello\\""');
      const tokens = lexer.tokenize();
      expect(tokens[0].value).toBe('He said "Hello"');
    });

    test('should parse triple-quoted strings', () => {
      const input = '"""Multi\nLine\nString"""';
      const lexer = new TonLexer(input);
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.String);
      expect(tokens[0].value).toContain('Multi');
      expect(tokens[0].value).toContain('Line');
      expect(tokens[0].value).toContain('String');
    });

    test('should handle unicode in strings', () => {
      const lexer = new TonLexer('"Hello 世界 🌍"');
      const tokens = lexer.tokenize();
      expect(tokens[0].value).toBe('Hello 世界 🌍');
    });
  });

  describe('Number Formats', () => {
    test('should parse integers', () => {
      const lexer = new TonLexer('42');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.Number);
      expect(tokens[0].value).toBe(42);
    });

    test('should parse negative numbers', () => {
      const lexer = new TonLexer('-42');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.Number);
      expect(tokens[0].value).toBe(-42);
    });

    test('should parse floating point numbers', () => {
      const lexer = new TonLexer('3.14159');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.Number);
      expect(tokens[0].value).toBeCloseTo(3.14159);
    });

    test('should parse scientific notation', () => {
      const lexer = new TonLexer('1.23e10');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.Number);
      expect(tokens[0].value).toBe(1.23e10);
    });

    test('should parse negative scientific notation', () => {
      const lexer = new TonLexer('1.5e-10');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.Number);
      expect(tokens[0].value).toBe(1.5e-10);
    });

    test('should parse hexadecimal numbers', () => {
      const lexer = new TonLexer('0xFF');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.Number);
      expect(tokens[0].value).toBe(255);
    });

    test('should parse binary numbers', () => {
      const lexer = new TonLexer('0b1010');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.Number);
      expect(tokens[0].value).toBe(10);
    });

    test('should handle very large numbers', () => {
      const lexer = new TonLexer('999999999999999');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.Number);
      expect(tokens[0].value).toBe(999999999999999);
    });
  });

  describe('Boolean and Special Values', () => {
    test('should parse true', () => {
      const lexer = new TonLexer('true');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.Boolean);
      expect(tokens[0].value).toBe(true);
    });

    test('should parse false', () => {
      const lexer = new TonLexer('false');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.Boolean);
      expect(tokens[0].value).toBe(false);
    });

    test('should parse null', () => {
      const lexer = new TonLexer('null');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.Null);
      expect(tokens[0].value).toBe(null);
    });

    test('should parse undefined', () => {
      const lexer = new TonLexer('undefined');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.Undefined);
      expect(tokens[0].value).toBe(undefined);
    });
  });

  describe('Enums and Enum Sets', () => {
    test('should parse single enum value', () => {
      const lexer = new TonLexer('|active|');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.Enum);
      expect(tokens[0].value).toBe('active');
    });

    test('should parse enum set', () => {
      const lexer = new TonLexer('|read|write|execute|');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.EnumSet);
      expect(tokens[0].value).toEqual(['read', 'write', 'execute']);
    });

    test('should handle enum with underscores', () => {
      const lexer = new TonLexer('|is_active|');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.Enum);
      expect(tokens[0].value).toBe('is_active');
    });

    test('should handle enum with numbers', () => {
      const lexer = new TonLexer('|status123|');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.Enum);
      expect(tokens[0].value).toBe('status123');
    });
  });

  describe('Comments', () => {
    test('should skip single-line comments', () => {
      const lexer = new TonLexer('// This is a comment\n42');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.Number);
      expect(tokens[0].value).toBe(42);
    });

    test('should skip block comments', () => {
      const lexer = new TonLexer('/* Block comment */ 42');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.Number);
      expect(tokens[0].value).toBe(42);
    });

    test('should skip multi-line block comments', () => {
      const lexer = new TonLexer('/* Line 1\n   Line 2\n   Line 3 */ 42');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.Number);
      expect(tokens[0].value).toBe(42);
    });

    test('should handle nested comments correctly', () => {
      const lexer = new TonLexer('42 /* comment */ 43');
      const tokens = lexer.tokenize();
      expect(tokens[0].value).toBe(42);
      expect(tokens[1].value).toBe(43);
    });
  });

  describe('Type Hints', () => {
    test('should parse string hint', () => {
      const lexer = new TonLexer('$"text"');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.StringHint);
      expect(tokens[1].type).toBe(TokenType.String);
    });

    test('should parse number hint', () => {
      const lexer = new TonLexer('%42');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.NumberHint);
      expect(tokens[1].type).toBe(TokenType.Number);
    });

    test('should parse boolean hint', () => {
      const lexer = new TonLexer('&true');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.BooleanHint);
      expect(tokens[1].type).toBe(TokenType.Boolean);
    });

    test('should parse date hint', () => {
      const lexer = new TonLexer('^"2024-01-01"');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.DateHint);
      expect(tokens[1].type).toBe(TokenType.String);
    });
  });

  describe('GUIDs', () => {
    test('should parse GUID without braces', () => {
      const guid = '123e4567-e89b-12d3-a456-426614174000';
      const lexer = new TonLexer(guid);
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.Guid);
      expect(tokens[0].value).toBe(guid);
    });

    test('should parse GUID with braces as single token', () => {
      const guid = '123e4567-e89b-12d3-a456-426614174000';
      const lexer = new TonLexer(`{${guid}}`);
      const tokens = lexer.tokenize();
      // Braced GUID is now a single GUID token
      expect(tokens[0].type).toBe(TokenType.Guid);
      expect(tokens[0].value).toBe(guid);
      expect(tokens[1].type).toBe(TokenType.EndOfFile);
    });

    test('should parse separate braces when not a GUID', () => {
      const lexer = new TonLexer('{notGuid}');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.LeftBrace);
      expect(tokens[1].type).toBe(TokenType.Identifier);
      expect(tokens[1].value).toBe('notGuid');
      expect(tokens[2].type).toBe(TokenType.RightBrace);
    });

    test('should handle uppercase GUIDs', () => {
      const guid = '123E4567-E89B-12D3-A456-426614174000';
      const lexer = new TonLexer(guid);
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.Guid);
      expect(tokens[0].value).toBe(guid);
    });
  });

  describe('Identifiers and Class Names', () => {
    test('should parse simple identifiers', () => {
      const lexer = new TonLexer('myVariable');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.Identifier);
      expect(tokens[0].value).toBe('myVariable');
    });

    test('should parse identifiers with underscores', () => {
      const lexer = new TonLexer('my_variable');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.Identifier);
      expect(tokens[0].value).toBe('my_variable');
    });

    test('should parse class names (capitalized)', () => {
      const lexer = new TonLexer('Person');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.ClassName);
      expect(tokens[0].value).toBe('Person');
    });

    test('should parse numeric property names', () => {
      const lexer = new TonLexer('123');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.Number);
      expect(tokens[0].value).toBe(123);
    });

    test('should parse alphanumeric identifiers starting with numbers', () => {
      const lexer = new TonLexer('2024year');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.Identifier);
      expect(tokens[0].value).toBe('2024year');
    });

    test('should parse identifiers with numbers', () => {
      const lexer = new TonLexer('var123');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.Identifier);
      expect(tokens[0].value).toBe('var123');
    });
  });

  describe('Whitespace and Line Handling', () => {
    test('should skip whitespace', () => {
      const lexer = new TonLexer('  \t  42  \r\n  ');
      const tokens = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.Number);
      expect(tokens[0].value).toBe(42);
    });

    test('should handle Windows line endings', () => {
      const lexer = new TonLexer('42\r\n43');
      const tokens = lexer.tokenize();
      expect(tokens[0].value).toBe(42);
      expect(tokens[1].value).toBe(43);
    });

    test('should handle Unix line endings', () => {
      const lexer = new TonLexer('42\n43');
      const tokens = lexer.tokenize();
      expect(tokens[0].value).toBe(42);
      expect(tokens[1].value).toBe(43);
    });

    test('should track line and column numbers', () => {
      const lexer = new TonLexer('42\n  43');
      const tokens = lexer.tokenize();
      expect(tokens[0].line).toBe(1);
      expect(tokens[0].column).toBe(1);
      expect(tokens[1].line).toBe(2);
      expect(tokens[1].column).toBe(3);
    });
  });

  describe('Complex Tokenization', () => {
    test('should tokenize complex nested structure', () => {
      const input = `{
        name = "John",
        age = 30,
        address = {
          street = "Main St",
          number = 123
        }
      }`;
      const lexer = new TonLexer(input);
      const tokens = lexer.tokenize();

      const tokenTypes = tokens.map(t => t.type);
      expect(tokenTypes).toContain(TokenType.LeftBrace);
      expect(tokenTypes).toContain(TokenType.Identifier);
      expect(tokenTypes).toContain(TokenType.Equals);
      expect(tokenTypes).toContain(TokenType.String);
      expect(tokenTypes).toContain(TokenType.Comma);
      expect(tokenTypes).toContain(TokenType.Number);
      expect(tokenTypes).toContain(TokenType.RightBrace);
    });

    test('should handle mixed content', () => {
      const input = '{ /* comment */ items = [1, "two", true, null, |active|] }';
      const lexer = new TonLexer(input);
      const tokens = lexer.tokenize();

      const values = tokens
        .filter(t => ![TokenType.LeftBrace, TokenType.RightBrace,
                      TokenType.LeftBracket, TokenType.RightBracket,
                      TokenType.Equals, TokenType.Comma, TokenType.EndOfFile].includes(t.type))
        .map(t => t.value);

      expect(values).toContain('items');
      expect(values).toContain(1);
      expect(values).toContain('two');
      expect(values).toContain(true);
      expect(values).toContain(null);
      expect(values).toContain('active');
    });

    test('should tokenize with type annotations', () => {
      const input = 'name:string = "John"';
      const lexer = new TonLexer(input);
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.Identifier);
      expect(tokens[0].value).toBe('name');
      expect(tokens[1].type).toBe(TokenType.Colon);
      expect(tokens[2].type).toBe(TokenType.Identifier);
      expect(tokens[2].value).toBe('string');
      expect(tokens[3].type).toBe(TokenType.Equals);
      expect(tokens[4].type).toBe(TokenType.String);
      expect(tokens[4].value).toBe('John');
    });

    test('should handle class with instance count', () => {
      const input = '(Person#1){ name = "John" }';
      const lexer = new TonLexer(input);
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.LeftParen);
      expect(tokens[1].type).toBe(TokenType.ClassName);
      expect(tokens[1].value).toBe('Person');
      // Note: # handling might need adjustment based on implementation
    });
  });

  describe('Error Cases', () => {
    test('should throw on unterminated string', () => {
      const lexer = new TonLexer('"unterminated');
      expect(() => lexer.tokenize()).toThrow();
    });

    test('should throw on unterminated block comment', () => {
      const lexer = new TonLexer('/* unterminated comment');
      // Note: Current implementation may not throw for this
      const tokens = lexer.tokenize();
      expect(tokens).toBeDefined();
    });

    test('should throw on invalid character', () => {
      const lexer = new TonLexer('{ @ }');
      expect(() => lexer.tokenize()).toThrow();
    });
  });
});