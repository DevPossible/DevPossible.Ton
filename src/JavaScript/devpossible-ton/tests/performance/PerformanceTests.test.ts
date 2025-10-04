/**
 * PerformanceTests
 * Copyright (c) 2024 DevPossible, LLC
 */

import { TonParser, TonParseOptions } from '../../src/parser/TonParser';
import { TonSerializer } from '../../src/serializer/TonSerializer';
import { TonDocument } from '../../src/models/TonDocument';
import { TonObject } from '../../src/models/TonObject';
import { TonValue } from '../../src/models/TonValue';
import { TonSerializeOptions } from '../../src/serializer/TonSerializeOptions';

describe('PerformanceTests', () => {
  let parser: TonParser;
  let serializer: TonSerializer;

  beforeEach(() => {
    parser = new TonParser();
    serializer = new TonSerializer();
  });

  test('should parse large document efficiently', () => {
    // Arrange
    const lines = ['{(dataset)'];

    // Add 10,000 properties
    for (let i = 0; i < 10000; i++) {
      lines.push(`    property_${i} = 'value_${i}',`);
    }

    // Add 1,000 child objects
    for (let i = 0; i < 1000; i++) {
      lines.push(`    {(record)`);
      lines.push(`        id = ${i},`);
      lines.push(`        name = 'Record ${i}',`);
      lines.push(`        value = ${i * 1.5}`);
      lines.push(`    }${i < 999 ? ',' : ''}`);
    }

    lines.push('}');
    const input = lines.join('\n');

    // Act
    const startTime = performance.now();
    const document = parser.parse(input);
    const elapsed = performance.now() - startTime;

    // Assert
    // Note: In JS implementation, children are stored as properties, so total is 11000
    expect(document.rootObject.properties.size).toBe(11000);
    expect(document.rootObject.children.length).toBe(1000);

    // Should parse in reasonable time (< 5 seconds for this size)
    expect(elapsed).toBeLessThan(5000);
  });

  test('should serialize large document efficiently', () => {
    // Arrange
    const document = new TonDocument();
    const root = document.rootObject;
    root.className = 'dataset';

    // Add 10,000 properties
    for (let i = 0; i < 10000; i++) {
      root.setProperty(`property_${i}`, TonValue.from(`value_${i}`));
    }

    // Add 1,000 child objects
    for (let i = 0; i < 1000; i++) {
      const child = new TonObject();
      child.className = 'record';
      child.setProperty('id', TonValue.from(i));
      child.setProperty('name', TonValue.from(`Record ${i}`));
      child.setProperty('value', TonValue.from(i * 1.5));
      root.addChild(child);
    }

    // Act
    const startTime = performance.now();
    const result = serializer.serializeDocument(document, TonSerializeOptions.compact());
    const elapsed = performance.now() - startTime;

    // Assert
    expect(result).toBeTruthy();
    expect(result).toContain('property_5000');

    // Should serialize in reasonable time (< 2 seconds for this size)
    expect(elapsed).toBeLessThan(2000);
  });

  test('should handle deep nesting efficiently', () => {
    // Arrange
    const depth = 50;
    const lines: string[] = [];

    // Build deeply nested structure
    for (let i = 0; i < depth; i++) {
      let line = '{';
      if (i === 0) {
        line += `(level${i})`;
      }
      lines.push(' '.repeat(i * 4) + line);
      lines.push(' '.repeat((i + 1) * 4) + `depth = ${i},`);
    }

    // Close all braces
    for (let i = depth - 1; i >= 0; i--) {
      lines.push(' '.repeat(i * 4) + '}');
    }

    const input = lines.join('\n');

    // Act
    const startTime = performance.now();
    const options: TonParseOptions = {
      maxDepth: 100
    };
    const parserWithOptions = new TonParser(options);
    const document = parserWithOptions.parse(input);
    const elapsed = performance.now() - startTime;

    // Assert
    expect(document).toBeTruthy();

    // Should handle deep nesting quickly (< 500ms)
    expect(elapsed).toBeLessThan(500);

    // Verify the structure
    let current = document.rootObject;
    for (let i = 0; i < Math.min(depth - 1, 10); i++) {
      expect(current.getProperty('depth')?.toInt32()).toBe(i);
      current = current.children[0];
      if (!current) break;
    }
  });

  test('should handle large arrays efficiently', () => {
    // Arrange
    const arraySize = 5000;
    const values = [];
    for (let i = 0; i < arraySize; i++) {
      values.push(i);
    }

    const input = `{
      largeArray = [${values.join(', ')}]
    }`;

    // Act
    const startTime = performance.now();
    const document = parser.parse(input);
    const elapsed = performance.now() - startTime;

    // Assert
    const array = document.rootObject.getProperty('largeArray');
    expect(array?.getArrayCount()).toBe(arraySize);

    // Should parse large array quickly (< 1 second)
    expect(elapsed).toBeLessThan(1000);
  });

  test('should handle many objects efficiently', () => {
    // Arrange
    const objectCount = 2000;
    const lines = ['{'];

    for (let i = 0; i < objectCount; i++) {
      lines.push(`    {(object_${i})`);
      lines.push(`        id = ${i},`);
      lines.push(`        data = 'data_${i}'`);
      lines.push(`    }${i < objectCount - 1 ? ',' : ''}`);
    }

    lines.push('}');
    const input = lines.join('\n');

    // Act
    const startTime = performance.now();
    const document = parser.parse(input);
    const elapsed = performance.now() - startTime;

    // Assert
    expect(document.rootObject.children.length).toBe(objectCount);

    // Should handle many objects quickly (< 2 seconds)
    expect(elapsed).toBeLessThan(2000);
  });

  test('should round-trip large document efficiently', () => {
    // Arrange
    const document = new TonDocument();
    const root = document.rootObject;

    // Add 1000 properties
    for (let i = 0; i < 1000; i++) {
      root.setProperty(`prop_${i}`, TonValue.from(i));
    }

    // Act
    const startSerialize = performance.now();
    const serialized = serializer.serializeDocument(document, TonSerializeOptions.default());
    const serializeTime = performance.now() - startSerialize;

    const startParse = performance.now();
    const reparsed = parser.parse(serialized);
    const parseTime = performance.now() - startParse;

    // Assert
    expect(reparsed.rootObject.properties.size).toBe(1000);

    // Both operations should be fast
    expect(serializeTime).toBeLessThan(500);
    expect(parseTime).toBeLessThan(500);
  });
});