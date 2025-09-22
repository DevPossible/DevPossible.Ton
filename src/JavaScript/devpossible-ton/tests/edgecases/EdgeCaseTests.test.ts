/**
 * EdgeCaseTests
 * Copyright (c) 2024 DevPossible, LLC
 */

import { TonParser } from '../../src/parser/TonParser';
import { TonSerializer } from '../../src/serializer/TonSerializer';
import { TonDocument } from '../../src/models/TonDocument';
import { TonObject } from '../../src/models/TonObject';
import { TonValue, TonValueType } from '../../src/models/TonValue';
import { TonEnum } from '../../src/models/TonEnum';
import { TonEnumSet } from '../../src/models/TonEnumSet';
import { TonEnumDefinition } from '../../src/schema/TonEnumDefinition';
import { TonSchemaCollection } from '../../src/schema/TonSchemaCollection';
import { TonSerializeOptions } from '../../src/serializer/TonSerializeOptions';
import { TonParseException } from '../../src/exceptions/TonParseException';

describe('EdgeCaseTests', () => {
  let parser: TonParser;
  let serializer: TonSerializer;

  beforeEach(() => {
    parser = new TonParser();
    serializer = new TonSerializer();
  });

  test('should handle empty input', () => {
    expect(() => parser.parse('')).toThrowError('cannot be empty');
  });

  test('should handle whitespace only input', () => {
    expect(() => parser.parse('   \n\t  ')).toThrowError('cannot be empty');
  });

  test('should handle missing root braces', () => {
    const input = "name = 'test'";
    expect(() => parser.parse(input)).toThrowError(/Expected.*\{/);
  });

  test('should handle unclosed brace', () => {
    const input = "{ name = 'test'";
    expect(() => parser.parse(input)).toThrowError(TonParseException);
  });

  test('should handle mismatched quotes', () => {
    const input = "{ name = 'test\" }"; // Single quote start, double quote end
    expect(() => parser.parse(input)).toThrowError(TonParseException);
  });

  test('should handle special characters in property names', () => {
    const input = `{
      '!@#$%^&*()' = 'special',
      'with spaces' = 'value',
      'with-dash' = 123,
      'with.dot' = true,
      '123start' = 'number start',
      '中文' = 'unicode'
    }`;

    const document = parser.parse(input);

    expect(document.rootObject.getProperty('!@#$%^&*()')?.toString()).toBe('special');
    expect(document.rootObject.getProperty('with spaces')?.toString()).toBe('value');
    expect(document.rootObject.getProperty('with-dash')?.toInt32()).toBe(123);
    expect(document.rootObject.getProperty('with.dot')?.toBoolean()).toBe(true);
    expect(document.rootObject.getProperty('123start')?.toString()).toBe('number start');
    expect(document.rootObject.getProperty('中文')?.toString()).toBe('unicode');
  });

  test('should handle unicode in strings', () => {
    const input = `{
      text = '你好世界 🌍 مرحبا بالعالم',
      emoji = '😀😃😄😁',
      escaped = '\\u0048\\u0065\\u006C\\u006C\\u006F'
    }`;

    const document = parser.parse(input);

    expect(document.rootObject.getProperty('text')?.toString()).toBe('你好世界 🌍 مرحبا بالعالم');
    expect(document.rootObject.getProperty('emoji')?.toString()).toBe('😀😃😄😁');
    expect(document.rootObject.getProperty('escaped')?.toString()).toBe('Hello');
  });

  test('should handle very long strings', () => {
    const longString = 'A'.repeat(10000);
    const input = `{ text = '${longString}' }`;

    const document = parser.parse(input);

    expect(document.rootObject.getProperty('text')?.toString()).toBe(longString);
  });

  test('should handle extreme number values', () => {
    const input = `{
      maxInt = 2147483647,
      minInt = -2147483648,
      maxSafeInt = 9007199254740991,
      minSafeInt = -9007199254740991,
      verySmall = 0.000000001,
      veryLarge = 1.7976931348623157E+308,
      hex32bit = 0xFFFFFFFF,
      binary32bit = 0b11111111111111111111111111111111
    }`;

    const document = parser.parse(input);

    expect(document.rootObject.getProperty('maxInt')?.toInt32()).toBe(2147483647);
    expect(document.rootObject.getProperty('minInt')?.toInt32()).toBe(-2147483648);
    expect(document.rootObject.getProperty('maxSafeInt')?.toNumber()).toBe(9007199254740991);
    expect(document.rootObject.getProperty('minSafeInt')?.toNumber()).toBe(-9007199254740991);
    expect(document.rootObject.getProperty('verySmall')?.toNumber()).toBeCloseTo(0.000000001, 10);
    expect(document.rootObject.getProperty('hex32bit')?.toNumber()).toBe(4294967295);
  });

  test('should handle duplicate property names', () => {
    const input = `{
      name = 'first',
      name = 'second',
      name = 'third'
    }`;

    const document = parser.parse(input);

    // Last value should win
    expect(document.rootObject.getProperty('name')?.toString()).toBe('third');
  });

  test('should handle mixed at prefix', () => {
    const input = `{
      @name = 'with at',
      name = 'without at'
    }`;

    const document = parser.parse(input);

    // Both should be accessible, last one wins
    expect(document.rootObject.getProperty('name')?.toString()).toBe('without at');
  });

  test('should handle empty enum values', () => {
    const input = '{ status = || }';

    const document = parser.parse(input);

    const value = document.rootObject.getProperty('status')?.value as TonEnumSet;
    expect(value?.values).toHaveLength(0);
  });

  test('should handle invalid enum index', () => {
    const schemas = new TonSchemaCollection();
    const enumDef = new TonEnumDefinition('status');
    enumDef.values.push('active', 'inactive');
    schemas.addEnum(enumDef);

    const obj = new TonObject();
    obj.setProperty('status', TonValue.from(new TonEnum('10'))); // Index out of range

    expect(enumDef.isValidValue('10')).toBe(false);
  });

  test('should handle circular references prevention', () => {
    // Note: TON doesn't support circular references by design
    // This test ensures we don't get into infinite loops

    const obj1 = new TonObject();
    obj1.className = 'obj1';
    const obj2 = new TonObject();
    obj2.className = 'obj2';

    obj1.addChild(obj2);
    // We can't add obj1 as a child of obj2 (no parent reference in TON)

    const serialized = serializer.serialize(obj1, TonSerializeOptions.compact());

    expect(serialized).toContain('(obj1)');
    expect(serialized).toContain('(obj2)');
  });

  test('should handle null document', () => {
    expect(() => serializer.serializeDocument(null!, TonSerializeOptions.default())).toThrowError();
  });

  test('should handle invalid GUID format', () => {
    const input = '{ id = not-a-guid }';

    const document = parser.parse(input);

    // Should be parsed as a regular identifier, not a GUID
    const value = document.rootObject.getProperty('id');
    expect(value?.type).not.toBe(TonValueType.Guid);
    expect(value?.toString()).toBe('not-a-guid');
  });

  test('should handle missing equals sign', () => {
    const input = "{ name 'test' }";

    expect(() => parser.parse(input)).toThrowError(/Expected.*Equals/);
  });

  test('should handle invalid type annotation', () => {
    const input = '{ age: = 30 }'; // Missing type after colon

    expect(() => parser.parse(input)).toThrowError(TonParseException);
  });

  test('should handle reserved characters at property start', () => {
    // These should require quoting
    const testCases = [
      ['#property', "'#property'"],
      ['0property', "'0property'"],
      ['{property', "'{property'"],
      ['[property', "'[property'"],
      ['(property', "'(property'"]
    ];

    testCases.forEach(([propName, quotedName]) => {
      const obj = new TonObject();
      obj.setProperty(propName, TonValue.from('value'));

      const serialized = serializer.serialize(obj, TonSerializeOptions.compact());

      expect(serialized).toContain(`${quotedName} = 'value'`);
    });
  });

  test('should handle comments in various positions', () => {
    const input = `
// Comment at start
#@ tonVersion = '1' // Comment after header

/* Multi-line comment
   before object */
{(test) // Comment after class
    // Comment before property
    name = 'test', // Comment after property
    /* inline */ value = 42 /* comment */

    // Comment before child
    {(child) /* comment in child */
    } // Comment after child
} // Final comment

// Comment before schema
#! /* comment */ enum(status) [active] // End comment
`;

    const document = parser.parse(input);

    expect(document.header?.tonVersion).toBe('1');
    expect(document.rootObject.className).toBe('test');
    expect(document.rootObject.getProperty('name')?.toString()).toBe('test');
    expect(document.rootObject.getProperty('value')?.toInt32()).toBe(42);
    expect(document.rootObject.children).toHaveLength(1);
    expect(document.schemas?.enums).toHaveLength(1);
  });

  test('should handle schema without data', () => {
    const input = `
#! enum(status) [active, inactive]
#! {(test)
    /name = string(required)
}`;

    // Schema definitions must come after data
    expect(() => parser.parse(input)).toThrowError(TonParseException);
  });

  test('should handle complex escape sequences', () => {
    const input = `{
      text1 = 'Line 1\\nLine 2\\rLine 3\\r\\nLine 4',
      text2 = 'Tab\\there\\tand\\tthere',
      text3 = 'Quote: \\' and \\\\backslash\\\\',
      text4 = 'Form\\ffeed and back\\bspace',
      text5 = 'Unicode: \\u0041\\u0042\\u0043'
    }`;

    const document = parser.parse(input);

    expect(document.rootObject.getProperty('text1')?.toString()).toContain('\n');
    expect(document.rootObject.getProperty('text2')?.toString()).toContain('\t');
    expect(document.rootObject.getProperty('text3')?.toString()).toBe("Quote: ' and \\backslash\\");
    expect(document.rootObject.getProperty('text5')?.toString()).toBe('Unicode: ABC');
  });

  test('should handle property path edge cases', () => {
    const document = new TonDocument();
    document.rootObject.setProperty('level1', TonValue.from('value1'));

    const child = new TonObject();
    child.className = 'level2';
    child.setProperty('prop', TonValue.from('value2'));
    document.rootObject.addChild(child);

    expect(document.getValue('/')).toBe(document.rootObject);
    expect(document.getValue('/level1')).toBe('value1');
    expect(document.getValue('/level2/prop')).toBe('value2');
    expect(document.getValue('/nonexistent')).toBeNull();
    expect(document.getValue('/level2/nonexistent')).toBeNull();
    expect(document.getValue('')).toBeNull();
  });
});