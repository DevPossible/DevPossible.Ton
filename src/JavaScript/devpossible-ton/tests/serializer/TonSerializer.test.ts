/**
 * TonSerializer Tests
 * Copyright (c) 2024 DevPossible, LLC
 */

import { TonSerializer, TonSerializeOptions } from '../../src/serializer/TonSerializer';
import { TonDocument, TonObject, TonValue, TonArray } from '../../src/models';
import { TonParser } from '../../src/parser/TonParser';

describe('TonSerializer', () => {
  describe('Basic Serialization', () => {
    test('should serialize empty object', () => {
      const doc = new TonDocument();
      doc.setRoot(new TonObject());

      const serializer = new TonSerializer();
      const result = serializer.serialize(doc);

      expect(result).toBe('{}');
    });

    test('should serialize object with properties', () => {
      const obj = new TonObject();
      obj.set('name', new TonValue('John'));
      obj.set('age', new TonValue(30));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const serializer = new TonSerializer({ format: 'compact' });
      const result = serializer.serialize(doc);

      expect(result).toBe('{name:"John",age:30}');
    });

    test('should serialize array', () => {
      const arr = new TonArray();
      arr.push(new TonValue(1));
      arr.push(new TonValue(2));
      arr.push(new TonValue(3));

      const doc = new TonDocument();
      doc.setRoot(arr);

      const serializer = new TonSerializer({ format: 'compact' });
      const result = serializer.serialize(doc);

      expect(result).toBe('[1,2,3]');
    });

    test('should serialize nested objects', () => {
      const inner = new TonObject();
      inner.set('city', new TonValue('New York'));

      const outer = new TonObject();
      outer.set('name', new TonValue('John'));
      outer.set('address', inner);

      const doc = new TonDocument();
      doc.setRoot(outer);

      const serializer = new TonSerializer({ format: 'compact' });
      const result = serializer.serialize(doc);

      expect(result).toBe('{name:"John",address:{city:"New York"}}');
    });
  });

  describe('Pretty Formatting', () => {
    test('should serialize with indentation', () => {
      const obj = new TonObject();
      obj.set('name', new TonValue('John'));
      obj.set('age', new TonValue(30));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const serializer = new TonSerializer({ format: 'pretty', indent: '  ' });
      const result = serializer.serialize(doc);

      expect(result).toBe('{\n  name: "John"\n  age: 30\n}');
    });

    test('should serialize nested objects with indentation', () => {
      const inner = new TonObject();
      inner.set('city', new TonValue('New York'));

      const outer = new TonObject();
      outer.set('name', new TonValue('John'));
      outer.set('address', inner);

      const doc = new TonDocument();
      doc.setRoot(outer);

      const serializer = new TonSerializer({ format: 'pretty', indent: '  ' });
      const result = serializer.serialize(doc);

      expect(result).toBe('{\n  name: "John"\n  address: {\n    city: "New York"\n  }\n}');
    });

    test('should serialize arrays with indentation', () => {
      const arr = new TonArray();
      arr.push(new TonValue('one'));
      arr.push(new TonValue('two'));

      const doc = new TonDocument();
      doc.setRoot(arr);

      const serializer = new TonSerializer({ format: 'pretty', indent: '  ' });
      const result = serializer.serialize(doc);

      expect(result).toBe('[\n  "one"\n  "two"\n]');
    });
  });

  describe('Data Type Serialization', () => {
    test('should serialize strings with quotes', () => {
      const obj = new TonObject();
      obj.set('text', new TonValue('Hello "World"'));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const serializer = new TonSerializer({ format: 'compact' });
      const result = serializer.serialize(doc);

      expect(result).toBe('{text:"Hello \\"World\\""}');
    });

    test('should serialize numbers', () => {
      const obj = new TonObject();
      obj.set('int', new TonValue(42));
      obj.set('float', new TonValue(3.14));
      obj.set('negative', new TonValue(-10));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const serializer = new TonSerializer({ format: 'compact' });
      const result = serializer.serialize(doc);

      expect(result).toContain('int:42');
      expect(result).toContain('float:3.14');
      expect(result).toContain('negative:-10');
    });

    test('should serialize booleans', () => {
      const obj = new TonObject();
      obj.set('yes', new TonValue(true));
      obj.set('no', new TonValue(false));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const serializer = new TonSerializer({ format: 'compact' });
      const result = serializer.serialize(doc);

      expect(result).toContain('yes:true');
      expect(result).toContain('no:false');
    });

    test('should serialize null and undefined', () => {
      const obj = new TonObject();
      obj.set('nothing', new TonValue(null));
      obj.set('undef', new TonValue(undefined));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const serializer = new TonSerializer({ format: 'compact', omitNull: false, omitUndefined: false });
      const result = serializer.serialize(doc);

      expect(result).toContain('nothing:null');
      expect(result).toContain('undef:undefined');
    });

    test('should serialize GUID', () => {
      const obj = new TonObject();
      obj.set('id', new TonValue('550e8400-e29b-41d4-a716-446655440000'));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const serializer = new TonSerializer({ format: 'compact' });
      const result = serializer.serialize(doc);

      expect(result).toBe('{id:550e8400-e29b-41d4-a716-446655440000}');
    });
  });

  describe('Type Annotations', () => {
    test('should serialize with type annotations', () => {
      const obj = new TonObject();
      obj.set('age:number', new TonValue(30));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const serializer = new TonSerializer({ format: 'compact', includeTypes: true });
      const result = serializer.serialize(doc);

      expect(result).toBe('{age:number:30}');
    });
  });

  describe('Type Hints', () => {
    test('should serialize string hint', () => {
      const obj = new TonObject();
      obj.set('value', new TonValue('text', 'string'));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const serializer = new TonSerializer({ format: 'compact', includeHints: true });
      const result = serializer.serialize(doc);

      expect(result).toBe('{value:$"text"}');
    });

    test('should serialize number hint', () => {
      const obj = new TonObject();
      obj.set('value', new TonValue(42, 'number'));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const serializer = new TonSerializer({ format: 'compact', includeHints: true });
      const result = serializer.serialize(doc);

      expect(result).toBe('{value:%42}');
    });

    test('should serialize boolean hint', () => {
      const obj = new TonObject();
      obj.set('value', new TonValue(true, 'boolean'));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const serializer = new TonSerializer({ format: 'compact', includeHints: true });
      const result = serializer.serialize(doc);

      expect(result).toBe('{value:&true}');
    });

    test('should serialize date hint', () => {
      const obj = new TonObject();
      obj.set('value', new TonValue('2024-01-01', 'date'));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const serializer = new TonSerializer({ format: 'compact', includeHints: true });
      const result = serializer.serialize(doc);

      expect(result).toBe('{value:^"2024-01-01"}');
    });
  });

  describe('Enums', () => {
    test('should serialize single enum', () => {
      const obj = new TonObject();
      obj.set('status', new TonValue('active', 'enum'));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const serializer = new TonSerializer({ format: 'compact' });
      const result = serializer.serialize(doc);

      expect(result).toBe('{status:|active|}');
    });

    test('should serialize enum set', () => {
      const obj = new TonObject();
      obj.set('permissions', new TonValue(['read', 'write'], 'enumSet'));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const serializer = new TonSerializer({ format: 'compact' });
      const result = serializer.serialize(doc);

      expect(result).toBe('{permissions:|read|write|}');
    });
  });

  describe('Class Objects', () => {
    test('should serialize typed object', () => {
      const obj = new TonObject('Person');
      obj.set('name', new TonValue('John'));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const serializer = new TonSerializer({ format: 'compact' });
      const result = serializer.serialize(doc);

      expect(result).toBe('Person{name:"John"}');
    });

    test('should serialize typed object with instance', () => {
      const obj = new TonObject('Person', 1);
      obj.set('name', new TonValue('John'));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const serializer = new TonSerializer({ format: 'compact' });
      const result = serializer.serialize(doc);

      expect(result).toBe('Person(1){name:"John"}');
    });
  });

  describe('Options', () => {
    test('should omit null values when configured', () => {
      const obj = new TonObject();
      obj.set('name', new TonValue('John'));
      obj.set('age', new TonValue(null));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const serializer = new TonSerializer({ format: 'compact', omitNull: true });
      const result = serializer.serialize(doc);

      expect(result).toBe('{name:"John"}');
    });

    test('should omit undefined values when configured', () => {
      const obj = new TonObject();
      obj.set('name', new TonValue('John'));
      obj.set('age', new TonValue(undefined));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const serializer = new TonSerializer({ format: 'compact', omitUndefined: true });
      const result = serializer.serialize(doc);

      expect(result).toBe('{name:"John"}');
    });

    test('should use custom indentation', () => {
      const obj = new TonObject();
      obj.set('name', new TonValue('John'));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const serializer = new TonSerializer({ format: 'pretty', indent: '    ' });
      const result = serializer.serialize(doc);

      expect(result).toBe('{\n    name: "John"\n}');
    });
  });

  describe('Round-trip', () => {
    test('should maintain data through parse and serialize', () => {
      const original = {
        name: 'John',
        age: 30,
        active: true,
        tags: ['developer', 'typescript'],
        address: {
          city: 'New York',
          zip: '10001'
        }
      };

      const doc = TonDocument.fromObject(original);
      const serializer = new TonSerializer({ format: 'compact' });
      const serialized = serializer.serialize(doc);

      const parser = new TonParser();
      const parsed = parser.parse(serialized);

      expect(parsed.getRoot()).toEqual(original);
    });
  });
});