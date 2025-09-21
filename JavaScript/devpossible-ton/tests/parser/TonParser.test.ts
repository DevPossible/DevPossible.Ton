/**
 * TonParser Tests
 * Copyright (c) 2024 DevPossible, LLC
 */

import { TonParser } from '../../src/parser/TonParser';
import { TokenType } from '../../src/lexer/TonLexer';

describe('TonParser', () => {
  describe('Basic Object Parsing', () => {
    test('should parse empty object', () => {
      const parser = new TonParser();
      const result = parser.parse('{}');

      expect(result).toBeDefined();
      expect(result.getRoot()).toEqual({});
    });

    test('should parse object with single property', () => {
      const parser = new TonParser();
      const result = parser.parse('{ name: "John" }');

      expect(result.getRoot()).toEqual({ name: 'John' });
    });

    test('should parse object with multiple properties', () => {
      const parser = new TonParser();
      const result = parser.parse('{ name: "John", age: 30, active: true }');

      expect(result.getRoot()).toEqual({
        name: 'John',
        age: 30,
        active: true
      });
    });

    test('should parse nested objects', () => {
      const parser = new TonParser();
      const result = parser.parse('{ user: { name: "John", age: 30 } }');

      expect(result.getRoot()).toEqual({
        user: {
          name: 'John',
          age: 30
        }
      });
    });
  });

  describe('Array Parsing', () => {
    test('should parse empty array', () => {
      const parser = new TonParser();
      const result = parser.parse('[]');

      expect(result.getRoot()).toEqual([]);
    });

    test('should parse array with values', () => {
      const parser = new TonParser();
      const result = parser.parse('[1, 2, 3]');

      expect(result.getRoot()).toEqual([1, 2, 3]);
    });

    test('should parse array with mixed types', () => {
      const parser = new TonParser();
      const result = parser.parse('[1, "two", true, null]');

      expect(result.getRoot()).toEqual([1, 'two', true, null]);
    });

    test('should parse nested arrays', () => {
      const parser = new TonParser();
      const result = parser.parse('[[1, 2], [3, 4]]');

      expect(result.getRoot()).toEqual([[1, 2], [3, 4]]);
    });

    test('should parse array of objects', () => {
      const parser = new TonParser();
      const result = parser.parse('[{ id: 1 }, { id: 2 }]');

      expect(result.getRoot()).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  describe('Data Types', () => {
    test('should parse strings', () => {
      const parser = new TonParser();
      const result = parser.parse('{ text: "Hello World" }');

      expect(result.getRoot().text).toBe('Hello World');
    });

    test('should parse numbers', () => {
      const parser = new TonParser();
      const result = parser.parse('{ int: 42, float: 3.14, negative: -10, hex: 0xFF }');

      expect(result.getRoot()).toEqual({
        int: 42,
        float: 3.14,
        negative: -10,
        hex: 255
      });
    });

    test('should parse booleans', () => {
      const parser = new TonParser();
      const result = parser.parse('{ yes: true, no: false }');

      expect(result.getRoot()).toEqual({
        yes: true,
        no: false
      });
    });

    test('should parse null and undefined', () => {
      const parser = new TonParser();
      const result = parser.parse('{ nothing: null, undef: undefined }');

      expect(result.getRoot()).toEqual({
        nothing: null,
        undef: undefined
      });
    });

    test('should parse GUID', () => {
      const parser = new TonParser();
      const result = parser.parse('{ id: 550e8400-e29b-41d4-a716-446655440000 }');

      expect(result.getRoot().id).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('Type Annotations', () => {
    test('should parse property with type annotation', () => {
      const parser = new TonParser();
      const result = parser.parse('{ age:number: 30 }');

      const root = result.getRoot();
      expect(root.age).toBe(30);
    });

    test('should parse multiple type annotations', () => {
      const parser = new TonParser();
      const result = parser.parse('{ name:string: "John", age:number: 30 }');

      expect(result.getRoot()).toEqual({
        name: 'John',
        age: 30
      });
    });
  });

  describe('Type Hints', () => {
    test('should parse string hint', () => {
      const parser = new TonParser();
      const result = parser.parse('{ value: $"text" }');

      expect(result.getRoot().value).toBe('text');
    });

    test('should parse number hint', () => {
      const parser = new TonParser();
      const result = parser.parse('{ value: %42 }');

      expect(result.getRoot().value).toBe(42);
    });

    test('should parse boolean hint', () => {
      const parser = new TonParser();
      const result = parser.parse('{ value: &true }');

      expect(result.getRoot().value).toBe(true);
    });

    test('should parse date hint', () => {
      const parser = new TonParser();
      const result = parser.parse('{ value: ^"2024-01-01" }');

      expect(result.getRoot().value).toEqual(new Date('2024-01-01'));
    });
  });

  describe('Enums', () => {
    test('should parse single enum', () => {
      const parser = new TonParser();
      const result = parser.parse('{ status: |active| }');

      expect(result.getRoot().status).toBe('active');
    });

    test('should parse enum set', () => {
      const parser = new TonParser();
      const result = parser.parse('{ permissions: |read|write|execute| }');

      expect(result.getRoot().permissions).toEqual(['read', 'write', 'execute']);
    });
  });

  describe('Class Objects', () => {
    test('should parse typed object', () => {
      const parser = new TonParser();
      const result = parser.parse('Person { name: "John" }');

      const root = result.getRoot();
      expect(root._className).toBe('Person');
      expect(root.name).toBe('John');
    });

    test('should parse typed object with instance count', () => {
      const parser = new TonParser();
      const result = parser.parse('Person(1) { name: "John" }');

      const root = result.getRoot();
      expect(root._className).toBe('Person');
      expect(root._instanceId).toBe(1);
      expect(root.name).toBe('John');
    });

    test('should parse nested typed objects', () => {
      const parser = new TonParser();
      const result = parser.parse(`{
        user: Person {
          name: "John",
          address: Address {
            city: "New York"
          }
        }
      }`);

      const root = result.getRoot();
      expect(root.user._className).toBe('Person');
      expect(root.user.address._className).toBe('Address');
      expect(root.user.address.city).toBe('New York');
    });
  });

  describe('Multi-line Strings', () => {
    test('should parse triple-quoted string', () => {
      const parser = new TonParser();
      const result = parser.parse('{ text: """Hello\nWorld""" }');

      expect(result.getRoot().text).toBe('Hello\nWorld');
    });

    test('should parse triple-quoted string with indentation', () => {
      const parser = new TonParser();
      const result = parser.parse(`{
        text: """
          Line 1
          Line 2
        """
      }`);

      expect(result.getRoot().text).toBe('Line 1\nLine 2');
    });
  });

  describe('Comments', () => {
    test('should ignore single-line comments', () => {
      const parser = new TonParser();
      const result = parser.parse(`{
        // This is a comment
        name: "John"
      }`);

      expect(result.getRoot()).toEqual({ name: 'John' });
    });

    test('should ignore multi-line comments', () => {
      const parser = new TonParser();
      const result = parser.parse(`{
        /* This is a
           multi-line comment */
        name: "John"
      }`);

      expect(result.getRoot()).toEqual({ name: 'John' });
    });
  });

  describe('Complex Documents', () => {
    test('should parse complex nested structure', () => {
      const parser = new TonParser();
      const input = `{
        version: "1.0.0",
        database: {
          host: "localhost",
          port: 5432,
          credentials: {
            username: "admin",
            password: "secret"
          }
        },
        features: ["auth", "api", "logging"],
        active: true
      }`;

      const result = parser.parse(input);
      const root = result.getRoot();

      expect(root.version).toBe('1.0.0');
      expect(root.database.host).toBe('localhost');
      expect(root.database.port).toBe(5432);
      expect(root.database.credentials.username).toBe('admin');
      expect(root.features).toEqual(['auth', 'api', 'logging']);
      expect(root.active).toBe(true);
    });

    test('should parse document with all features', () => {
      const parser = new TonParser();
      const input = `{
        // Configuration file
        name:string: "MyApp",
        version: $"1.0.0",
        port: %8080,
        debug: &true,
        releaseDate: ^"2024-01-01",
        status: |production|,
        features: |read|write|,
        guid: 550e8400-e29b-41d4-a716-446655440000,
        server: Server(1) {
          host: "localhost"
        }
      }`;

      const result = parser.parse(input);
      const root = result.getRoot();

      expect(root.name).toBe('MyApp');
      expect(root.version).toBe('1.0.0');
      expect(root.port).toBe(8080);
      expect(root.debug).toBe(true);
      expect(root.releaseDate).toEqual(new Date('2024-01-01'));
      expect(root.status).toBe('production');
      expect(root.features).toEqual(['read', 'write']);
      expect(root.guid).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(root.server._className).toBe('Server');
      expect(root.server._instanceId).toBe(1);
    });
  });

  describe('Error Handling', () => {
    test('should throw on invalid syntax', () => {
      const parser = new TonParser();
      expect(() => parser.parse('{ invalid: }')).toThrow();
    });

    test('should throw on unclosed object', () => {
      const parser = new TonParser();
      expect(() => parser.parse('{ name: "John"')).toThrow();
    });

    test('should throw on unclosed array', () => {
      const parser = new TonParser();
      expect(() => parser.parse('[1, 2, 3')).toThrow();
    });

    test('should provide error with line and column', () => {
      const parser = new TonParser();
      try {
        parser.parse('{\n  invalid: @\n}');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.line).toBeDefined();
        expect(error.column).toBeDefined();
      }
    });
  });

  describe('Edge Cases', () => {
    test('should parse empty string property', () => {
      const parser = new TonParser();
      const result = parser.parse('{ empty: "" }');

      expect(result.getRoot().empty).toBe('');
    });

    test('should parse property with special characters', () => {
      const parser = new TonParser();
      const result = parser.parse('{ "special-key": "value" }');

      expect(result.getRoot()['special-key']).toBe('value');
    });

    test('should parse unicode strings', () => {
      const parser = new TonParser();
      const result = parser.parse('{ text: "Hello 世界 🌍" }');

      expect(result.getRoot().text).toBe('Hello 世界 🌍');
    });

    test('should parse deeply nested structure', () => {
      const parser = new TonParser();
      const result = parser.parse('{ a: { b: { c: { d: { e: "deep" } } } } }');

      expect(result.getRoot().a.b.c.d.e).toBe('deep');
    });
  });
});