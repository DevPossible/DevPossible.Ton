/**
 * TonParser Tests - Based on Gherkin Specifications
 * Tests for parsing TON documents
 */

import { TonParser } from '../../src/parser/TonParser';
import { TonDocument } from '../../src/models/TonDocument';
import { TonObject } from '../../src/models/TonObject';
import { TonArray } from '../../src/models/TonArray';
import { TonValue } from '../../src/models/TonValue';

describe('TonParser - Gherkin Specifications', () => {
  let parser: TonParser;

  beforeEach(() => {
    parser = new TonParser();
  });

  describe('Simple Object Parsing', () => {
    test('should parse empty object', () => {
      const doc = parser.parse('{}');
      expect(doc).toBeInstanceOf(TonDocument);
      expect(doc.root).toBeInstanceOf(TonObject);
      const obj = doc.root as TonObject;
      expect(obj.size()).toBe(0);
    });

    test('should parse object with single property', () => {
      const doc = parser.parse('{ name = "John" }');
      const obj = doc.root as TonObject;
      expect(obj.get('name')).toBeInstanceOf(TonValue);
      expect((obj.get('name') as TonValue).value).toBe('John');
    });

    test('should parse object with multiple properties', () => {
      const doc = parser.parse('{ name = "John", age = 30, active = true }');
      const obj = doc.root as TonObject;
      expect(obj.get('name')).toBeInstanceOf(TonValue);
      expect((obj.get('name') as TonValue).value).toBe('John');
      expect((obj.get('age') as TonValue).value).toBe(30);
      expect((obj.get('active') as TonValue).value).toBe(true);
    });

    test('should parse object with various data types', () => {
      const input = `{
        string = "text",
        number = 42,
        float = 3.14,
        boolean = true,
        null = null,
        undefined = undefined
      }`;
      const doc = parser.parse(input);
      const obj = doc.root as TonObject;

      expect((obj.get('string') as TonValue).value).toBe('text');
      expect((obj.get('number') as TonValue).value).toBe(42);
      expect((obj.get('float') as TonValue).value).toBeCloseTo(3.14);
      expect((obj.get('boolean') as TonValue).value).toBe(true);
      expect((obj.get('null') as TonValue).value).toBe(null);
      expect((obj.get('undefined') as TonValue).value).toBe(undefined);
    });
  });

  describe('Array Parsing', () => {
    test('should parse empty array', () => {
      const doc = parser.parse('[]');
      expect(doc.root).toBeInstanceOf(TonArray);
      const arr = doc.root as TonArray;
      expect(arr.length()).toBe(0);
    });

    test('should parse array with single element', () => {
      const doc = parser.parse('[42]');
      const arr = doc.root as TonArray;
      expect(arr.length()).toBe(1);
      expect((arr.get(0) as TonValue).value).toBe(42);
    });

    test('should parse array with multiple elements', () => {
      const doc = parser.parse('[1, "two", true, null]');
      const arr = doc.root as TonArray;
      expect(arr.length()).toBe(4);
      expect((arr.get(0) as TonValue).value).toBe(1);
      expect((arr.get(1) as TonValue).value).toBe('two');
      expect((arr.get(2) as TonValue).value).toBe(true);
      expect((arr.get(3) as TonValue).value).toBe(null);
    });

    test('should parse nested arrays', () => {
      const doc = parser.parse('[[1, 2], [3, 4]]');
      const arr = doc.root as TonArray;
      expect(arr.length()).toBe(2);

      const arr1 = arr.get(0) as TonArray;
      expect(arr1.length()).toBe(2);
      expect((arr1.get(0) as TonValue).value).toBe(1);
      expect((arr1.get(1) as TonValue).value).toBe(2);

      const arr2 = arr.get(1) as TonArray;
      expect(arr2.length()).toBe(2);
      expect((arr2.get(0) as TonValue).value).toBe(3);
      expect((arr2.get(1) as TonValue).value).toBe(4);
    });
  });

  describe('Nested Structures', () => {
    test('should parse nested object', () => {
      const input = `{
        person = {
          name = "John",
          age = 30
        }
      }`;
      const doc = parser.parse(input);
      const obj = doc.root as TonObject;
      const person = obj.get('person') as TonObject;
      expect(person).toBeInstanceOf(TonObject);
      expect((person.get('name') as TonValue).value).toBe('John');
      expect((person.get('age') as TonValue).value).toBe(30);
    });

    test('should parse deeply nested structures', () => {
      const input = `{
        level1 = {
          level2 = {
            level3 = {
              value = "deep"
            }
          }
        }
      }`;
      const doc = parser.parse(input);
      const obj = doc.root as TonObject;
      const level1 = obj.get('level1') as TonObject;
      const level2 = level1.get('level2') as TonObject;
      const level3 = level2.get('level3') as TonObject;
      expect((level3.get('value') as TonValue).value).toBe('deep');
    });

    test('should parse object with array property', () => {
      const input = `{
        items = [1, 2, 3],
        name = "Test"
      }`;
      const doc = parser.parse(input);
      const obj = doc.root as TonObject;
      const items = obj.get('items') as TonArray;
      expect(items).toBeInstanceOf(TonArray);
      expect(items.length()).toBe(3);
    });

    test('should parse array of objects', () => {
      const input = `[
        { name = "John", age = 30 },
        { name = "Jane", age = 25 }
      ]`;
      const doc = parser.parse(input);
      const arr = doc.root as TonArray;
      const obj1 = arr.get(0) as TonObject;
      expect((obj1.get('name') as TonValue).value).toBe('John');
      const obj2 = arr.get(1) as TonObject;
      expect((obj2.get('name') as TonValue).value).toBe('Jane');
    });
  });

  describe('Property Types and Values', () => {
    test('should parse string values with different quotes', () => {
      const input = `{
        double = "double",
        single = 'single',
        template = \`template\`
      }`;
      const doc = parser.parse(input);
      const obj = doc.root as TonObject;
      expect((obj.get('double') as TonValue).value).toBe('double');
      expect((obj.get('single') as TonValue).value).toBe('single');
      expect((obj.get('template') as TonValue).value).toBe('template');
    });

    test('should parse numeric values', () => {
      const input = `{
        integer = 42,
        negative = -17,
        float = 3.14159,
        scientific = 1.23e10,
        hex = 0xFF,
        binary = 0b1010
      }`;
      const doc = parser.parse(input);
      const obj = doc.root as TonObject;
      expect((obj.get('integer') as TonValue).value).toBe(42);
      expect((obj.get('negative') as TonValue).value).toBe(-17);
      expect((obj.get('float') as TonValue).value).toBeCloseTo(3.14159);
      expect((obj.get('scientific') as TonValue).value).toBe(1.23e10);
      expect((obj.get('hex') as TonValue).value).toBe(255);
      expect((obj.get('binary') as TonValue).value).toBe(10);
    });

    test('should parse boolean values', () => {
      const input = '{ yes = true, no = false }';
      const doc = parser.parse(input);
      const obj = doc.root as TonObject;
      expect((obj.get('yes') as TonValue).value).toBe(true);
      expect((obj.get('no') as TonValue).value).toBe(false);
    });

    test('should parse null and undefined', () => {
      const input = '{ nothing = null, notDefined = undefined }';
      const doc = parser.parse(input);
      const obj = doc.root as TonObject;
      expect((obj.get('nothing') as TonValue).value).toBe(null);
      expect((obj.get('notDefined') as TonValue).value).toBe(undefined);
    });
  });

  describe('Enum Parsing', () => {
    test('should parse single enum value', () => {
      const input = '{ status = |active| }';
      const doc = parser.parse(input);
      const obj = doc.root as TonObject;
      const status = obj.get('status') as TonValue;
      expect(status.value).toBe('active');
    });

    test('should parse enum set', () => {
      const input = '{ permissions = |read|write|execute| }';
      const doc = parser.parse(input);
      const obj = doc.root as TonObject;
      const perms = obj.get('permissions') as TonValue;
      expect(perms.value).toEqual(['read', 'write', 'execute']);
    });
  });

  describe('Type Annotations', () => {
    test('should parse property with type annotation', () => {
      const input = '{ name:string = "John" }';
      const doc = parser.parse(input);
      const obj = doc.root as TonObject;
      const name = obj.get('name') as TonValue;
      expect(name.value).toBe('John');
      expect(name.typeHint).toBe('string');
    });

    test('should parse multiple type annotations', () => {
      const input = `{
        name:string = "John",
        age:number = 30,
        active:boolean = true
      }`;
      const doc = parser.parse(input);
      const obj = doc.root as TonObject;

      const name = obj.get('name') as TonValue;
      expect(name.typeHint).toBe('string');

      const age = obj.get('age') as TonValue;
      expect(age.typeHint).toBe('number');

      const active = obj.get('active') as TonValue;
      expect(active.typeHint).toBe('boolean');
    });
  });

  describe('Type Hints', () => {
    test('should parse string hint', () => {
      const input = '{ text = $"hello" }';
      const doc = parser.parse(input);
      const obj = doc.root as TonObject;
      const text = obj.get('text') as TonValue;
      expect(text.value).toBe('hello');
      expect(text.typeHint).toBe('string');
    });

    test('should parse number hint', () => {
      const input = '{ value = %42 }';
      const doc = parser.parse(input);
      const obj = doc.root as TonObject;
      const value = obj.get('value') as TonValue;
      expect(value.value).toBe(42);
      expect(value.typeHint).toBe('number');
    });

    test('should parse boolean hint', () => {
      const input = '{ flag = &true }';
      const doc = parser.parse(input);
      const obj = doc.root as TonObject;
      const flag = obj.get('flag') as TonValue;
      expect(flag.value).toBe(true);
      expect(flag.typeHint).toBe('boolean');
    });

    test('should parse date hint', () => {
      const input = '{ date = ^"2024-01-01" }';
      const doc = parser.parse(input);
      const obj = doc.root as TonObject;
      const date = obj.get('date') as TonValue;
      expect(date.value).toBe('2024-01-01');
      expect(date.typeHint).toBe('date');
    });
  });

  describe('Class Names and Metadata', () => {
    test('should parse object with class name', () => {
      const input = '(Person){ name = "John" }';
      const doc = parser.parse(input);
      const obj = doc.root as TonObject;
      expect(obj.className).toBe('Person');
      expect((obj.get('name') as TonValue).value).toBe('John');
    });

    test('should parse object with class and instance count', () => {
      const input = '(Person#3){ name = "John" }';
      const doc = parser.parse(input);
      const obj = doc.root as TonObject;
      expect(obj.className).toBe('Person');
      // Note: instance count handling might need adjustment
    });
  });

  describe('Numeric Property Names', () => {
    test('should parse pure numeric property names', () => {
      const input = `{
        123 = "value1",
        456 = "value2"
      }`;
      const doc = parser.parse(input);
      const obj = doc.root as TonObject;
      expect((obj.get('123') as TonValue).value).toBe('value1');
      expect((obj.get('456') as TonValue).value).toBe('value2');
    });

    test('should parse year-based properties', () => {
      const input = `{
        revenues = {
          2022 = 450000000,
          2023 = 520000000,
          2024 = 380000000
        }
      }`;
      const doc = parser.parse(input);
      const obj = doc.root as TonObject;
      const revenues = obj.get('revenues') as TonObject;
      expect((revenues.get('2022') as TonValue).value).toBe(450000000);
      expect((revenues.get('2023') as TonValue).value).toBe(520000000);
      expect((revenues.get('2024') as TonValue).value).toBe(380000000);
    });

    test('should parse alphanumeric property names', () => {
      const input = `{
        1property = "first",
        2ndProperty = "second",
        var123 = "third"
      }`;
      const doc = parser.parse(input);
      const obj = doc.root as TonObject;
      expect((obj.get('1property') as TonValue).value).toBe('first');
      expect((obj.get('2ndProperty') as TonValue).value).toBe('second');
      expect((obj.get('var123') as TonValue).value).toBe('third');
    });
  });

  describe('Comments', () => {
    test('should ignore single-line comments', () => {
      const input = `{
        // This is a comment
        name = "John" // Another comment
      }`;
      const doc = parser.parse(input);
      const obj = doc.root as TonObject;
      expect((obj.get('name') as TonValue).value).toBe('John');
    });

    test('should ignore block comments', () => {
      const input = `{
        /* Block comment */
        name = "John",
        /* Multi-line
           comment */
        age = 30
      }`;
      const doc = parser.parse(input);
      const obj = doc.root as TonObject;
      expect((obj.get('name') as TonValue).value).toBe('John');
      expect((obj.get('age') as TonValue).value).toBe(30);
    });
  });

  describe('Error Handling', () => {
    test('should throw on missing closing brace', () => {
      expect(() => parser.parse('{ name = "test"')).toThrow();
    });

    test('should throw on missing equals sign', () => {
      expect(() => parser.parse('{ name "test" }')).toThrow();
    });

    test('should throw on invalid property name', () => {
      expect(() => parser.parse('{ @invalid = "test" }')).toThrow();
    });

    test('should throw on duplicate commas', () => {
      expect(() => parser.parse('{ name = "test",, age = 30 }')).toThrow();
    });
  });

  describe('Complex Documents', () => {
    test('should parse complex nested document', () => {
      const input = `{
        metadata = {
          version = "1.0.0",
          author = "John Doe"
        },
        data = [
          { id = 1, name = "Item 1", tags = |active|important| },
          { id = 2, name = "Item 2", tags = |archived| }
        ],
        settings = {
          debug = false,
          timeout = 5000,
          features = {
            newUI = true,
            darkMode = false
          }
        }
      }`;

      const doc = parser.parse(input);
      const obj = doc.root as TonObject;

      // Check metadata
      const metadata = obj.get('metadata') as TonObject;
      expect((metadata.get('version') as TonValue).value).toBe('1.0.0');

      // Check data array
      const data = obj.get('data') as TonArray;
      expect(data.length()).toBe(2);

      const item1 = data.get(0) as TonObject;
      expect((item1.get('id') as TonValue).value).toBe(1);
      const tags1 = item1.get('tags') as TonValue;
      expect(tags1.value).toEqual(['active', 'important']);

      // Check settings
      const settings = obj.get('settings') as TonObject;
      const features = settings.get('features') as TonObject;
      expect((features.get('newUI') as TonValue).value).toBe(true);
    });
  });

  describe('Multi-line Strings', () => {
    test('should parse triple-quoted strings', () => {
      const input = `{
        text = """
        Line 1
        Line 2
        Line 3
        """
      }`;
      const doc = parser.parse(input);
      const obj = doc.root as TonObject;
      const text = (obj.get('text') as TonValue).value as string;
      expect(text).toContain('Line 1');
      expect(text).toContain('Line 2');
      expect(text).toContain('Line 3');
    });

    test('should handle indentation in multi-line strings', () => {
      const input = `{
        code = """
            function hello() {
                console.log("Hello");
            }
        """
      }`;
      const doc = parser.parse(input);
      const obj = doc.root as TonObject;
      const code = (obj.get('code') as TonValue).value as string;
      expect(code).toContain('function hello()');
      expect(code).toContain('console.log');
    });
  });

  describe('GUID Parsing', () => {
    test('should parse GUID values', () => {
      const guid = '123e4567-e89b-12d3-a456-426614174000';
      const input = `{ id = ${guid} }`;
      const doc = parser.parse(input);
      const obj = doc.root as TonObject;
      expect((obj.get('id') as TonValue).value).toBe(guid);
    });

    test('should parse GUID with braces', () => {
      const guid = '123e4567-e89b-12d3-a456-426614174000';
      const input = `{ id = {${guid}} }`;
      const doc = parser.parse(input);
      const obj = doc.root as TonObject;
      expect(obj.get('id')).toBeDefined();
      expect((obj.get('id') as TonValue).value).toBe(guid);
    });
  });

  describe('Trailing Commas', () => {
    test('should handle trailing comma in object', () => {
      const input = '{ name = "John", age = 30, }';
      const doc = parser.parse(input);
      const obj = doc.root as TonObject;
      expect(obj.size()).toBe(2);
    });

    test('should handle trailing comma in array', () => {
      const input = '[1, 2, 3,]';
      const doc = parser.parse(input);
      const arr = doc.root as TonArray;
      expect(arr.length()).toBe(3);
    });
  });
});