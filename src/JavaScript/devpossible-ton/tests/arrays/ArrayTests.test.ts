/**
 * ArrayTests
 * Copyright (c) 2024 DevPossible, LLC
 */

import { TonParser } from '../../src/parser/TonParser';
import { TonSerializer } from '../../src/serializer/TonSerializer';
import { TonValidator } from '../../src/validator/TonValidator';
import { TonObject } from '../../src/models/TonObject';
import { TonValue, TonValueType } from '../../src/models/TonValue';
import { TonSchemaDefinition, TonPropertySchema, TonValidationRule, ValidationRuleType } from '../../src/schema/TonSchema';
import { TonSchemaCollection } from '../../src/schema/TonSchemaCollection';
import { TonParseException } from '../../src/exceptions/TonParseException';

describe('ArrayTests', () => {
  describe('Parser', () => {
    test('should parse empty array', () => {
      const ton = `{
        @emptyArray = []
      }`;

      const parser = new TonParser();
      const document = parser.parse(ton);

      const array = document.rootObject.getProperty('@emptyArray');
      expect(array).not.toBeNull();
      expect(array!.type).toBe(TonValueType.Array);
      expect(array!.getArrayCount()).toBe(0);
    });

    test('should parse simple array', () => {
      const ton = `{
        @numbers = [1, 2, 3, 4, 5]
      }`;

      const parser = new TonParser();
      const document = parser.parse(ton);

      const array = document.rootObject.getProperty('@numbers');
      expect(array).not.toBeNull();
      expect(array!.type).toBe(TonValueType.Array);
      expect(array!.getArrayCount()).toBe(5);

      expect(array!.getArrayElement(0)!.toInt32()).toBe(1);
      expect(array!.getArrayElement(1)!.toInt32()).toBe(2);
      expect(array!.getArrayElement(2)!.toInt32()).toBe(3);
      expect(array!.getArrayElement(3)!.toInt32()).toBe(4);
      expect(array!.getArrayElement(4)!.toInt32()).toBe(5);
    });

    test('should parse string array', () => {
      const ton = `{
        @fruits = ["apple", "banana", "cherry"]
      }`;

      const parser = new TonParser();
      const document = parser.parse(ton);

      const array = document.rootObject.getProperty('@fruits');
      expect(array).not.toBeNull();
      expect(array!.type).toBe(TonValueType.Array);
      expect(array!.getArrayCount()).toBe(3);

      expect(array!.getArrayElement(0)!.toString()).toBe('apple');
      expect(array!.getArrayElement(1)!.toString()).toBe('banana');
      expect(array!.getArrayElement(2)!.toString()).toBe('cherry');
    });

    test('should parse mixed array', () => {
      const ton = `{
        @mixed = [1, "hello", true, null, 3.14]
      }`;

      const parser = new TonParser();
      const document = parser.parse(ton);

      const array = document.rootObject.getProperty('@mixed');
      expect(array).not.toBeNull();
      expect(array!.getArrayCount()).toBe(5);

      expect(array!.getArrayElement(0)!.type).toBe(TonValueType.Integer);
      expect(array!.getArrayElement(1)!.type).toBe(TonValueType.String);
      expect(array!.getArrayElement(2)!.type).toBe(TonValueType.Boolean);
      expect(array!.getArrayElement(3)!.type).toBe(TonValueType.Null);
      expect(array!.getArrayElement(4)!.type).toBe(TonValueType.Float);
    });

    test('should parse nested arrays', () => {
      const ton = `{
        @matrix = [[1, 2], [3, 4], [5, 6]]
      }`;

      const parser = new TonParser();
      const document = parser.parse(ton);

      const matrix = document.rootObject.getProperty('@matrix');
      expect(matrix).not.toBeNull();
      expect(matrix!.type).toBe(TonValueType.Array);
      expect(matrix!.getArrayCount()).toBe(3);

      const row1 = matrix!.getArrayElement(0);
      expect(row1!.type).toBe(TonValueType.Array);
      expect(row1!.getArrayCount()).toBe(2);
      expect(row1!.getArrayElement(0)!.toInt32()).toBe(1);
      expect(row1!.getArrayElement(1)!.toInt32()).toBe(2);
    });

    test('should parse array with type hint', () => {
      const ton = `{
        @numbers = ^[1, 2, 3]
      }`;

      const parser = new TonParser();
      const document = parser.parse(ton);

      const array = document.rootObject.getProperty('@numbers');
      expect(array).not.toBeNull();
      expect(array!.type).toBe(TonValueType.Array);
      expect(array!.getArrayCount()).toBe(3);
    });

    test('should throw on trailing comma', () => {
      const ton = `{
        @invalid = [1, 2, 3,]
      }`;

      const parser = new TonParser();

      expect(() => parser.parse(ton)).toThrowError(TonParseException);
      expect(() => parser.parse(ton)).toThrowError(/Trailing comma not allowed in arrays/);
    });
  });

  describe('Serializer', () => {
    test('should serialize empty array', () => {
      const obj = new TonObject();
      obj.setProperty('emptyArray', TonValue.fromArray());

      const serializer = new TonSerializer();
      const result = serializer.serialize(obj);

      expect(result).toContain('emptyArray = []');
    });

    test('should serialize simple array', () => {
      const obj = new TonObject();
      obj.setProperty('numbers', TonValue.fromArray(1, 2, 3));

      const serializer = new TonSerializer();
      const result = serializer.serialize(obj);

      expect(result).toContain('numbers = [1, 2, 3]');
    });

    test('should serialize nested arrays', () => {
      const obj = new TonObject();
      const row1 = TonValue.fromArray(1, 2);
      const row2 = TonValue.fromArray(3, 4);
      const matrix = TonValue.fromArray([row1, row2]);
      obj.setProperty('matrix', matrix);

      const serializer = new TonSerializer();
      const result = serializer.serialize(obj);

      expect(result).toContain('matrix = [[1, 2], [3, 4]]');
    });
  });

  describe('Validator', () => {
    test('should validate array min count', () => {
      const ton = `{(TestClass)
        @items = [1, 2]
      }`;

      const schema = new TonSchemaDefinition('TestClass');
      const propSchema = new TonPropertySchema('/items', 'array:int');
      propSchema.addValidation(new TonValidationRule(ValidationRuleType.MinCount, 3));
      schema.addProperty('/items', propSchema);

      const schemas = new TonSchemaCollection();
      schemas.addSchema(schema);

      const parser = new TonParser();
      const document = parser.parse(ton);

      const validator = new TonValidator(schemas);
      const result = validator.validate(document);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('at least 3 elements'))).toBe(true);
    });

    test('should validate array max count', () => {
      const ton = `{(TestClass)
        @items = [1, 2, 3, 4, 5]
      }`;

      const schema = new TonSchemaDefinition('TestClass');
      const propSchema = new TonPropertySchema('/items', 'array');
      propSchema.addValidation(new TonValidationRule(ValidationRuleType.MaxCount, 3));
      schema.addProperty('/items', propSchema);

      const schemas = new TonSchemaCollection();
      schemas.addSchema(schema);

      const parser = new TonParser();
      const document = parser.parse(ton);

      const validator = new TonValidator(schemas);
      const result = validator.validate(document);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('at most 3 elements'))).toBe(true);
    });

    test('should validate non-empty array', () => {
      const ton = `{(TestClass)
        @items = []
      }`;

      const schema = new TonSchemaDefinition('TestClass');
      const propSchema = new TonPropertySchema('/items', 'array');
      propSchema.addValidation(new TonValidationRule(ValidationRuleType.NonEmpty));
      schema.addProperty('/items', propSchema);

      const schemas = new TonSchemaCollection();
      schemas.addSchema(schema);

      const parser = new TonParser();
      const document = parser.parse(ton);

      const validator = new TonValidator(schemas);
      const result = validator.validate(document);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('must not be empty'))).toBe(true);
    });

    test('should validate unique array', () => {
      const ton = `{(TestClass)
        @items = [1, 2, 3, 2, 4]
      }`;

      const schema = new TonSchemaDefinition('TestClass');
      const propSchema = new TonPropertySchema('/items', 'array');
      propSchema.addValidation(new TonValidationRule(ValidationRuleType.Unique));
      schema.addProperty('/items', propSchema);

      const schemas = new TonSchemaCollection();
      schemas.addSchema(schema);

      const parser = new TonParser();
      const document = parser.parse(ton);

      const validator = new TonValidator(schemas);
      const result = validator.validate(document);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('unique elements'))).toBe(true);
    });

    test('should validate sorted array', () => {
      const ton = `{(TestClass)
        @items = [1, 3, 2, 4]
      }`;

      const schema = new TonSchemaDefinition('TestClass');
      const propSchema = new TonPropertySchema('/items', 'array:int');
      propSchema.addValidation(new TonValidationRule(ValidationRuleType.Sorted));
      schema.addProperty('/items', propSchema);

      const schemas = new TonSchemaCollection();
      schemas.addSchema(schema);

      const parser = new TonParser();
      const document = parser.parse(ton);

      const validator = new TonValidator(schemas);
      const result = validator.validate(document);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('must be sorted'))).toBe(true);
    });

    test('should validate array base type', () => {
      const ton = `{(TestClass)
        @items = [1, "hello", 3]
      }`;

      const schema = new TonSchemaDefinition('TestClass');
      const propSchema = new TonPropertySchema('/items', 'array:int');
      schema.addProperty('/items', propSchema);

      const schemas = new TonSchemaCollection();
      schemas.addSchema(schema);

      const parser = new TonParser();
      const document = parser.parse(ton);

      const validator = new TonValidator(schemas);
      const result = validator.validate(document);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Type mismatch'))).toBe(true);
    });
  });

  describe('TonValue', () => {
    test('should convert array correctly', () => {
      const values = [1, 2, 3, 4, 5];
      const tonValue = TonValue.fromArray(...values);

      expect(tonValue.type).toBe(TonValueType.Array);
      expect(tonValue.getArrayCount()).toBe(5);
      expect(tonValue.isEmpty()).toBe(false);

      const array = tonValue.toArray();
      expect(array).not.toBeNull();
      expect(array!.length).toBe(5);
    });
  });

  describe('Complex Nested Structures', () => {
    test('should parse complex nested structure', () => {
      const ton = `{(DataSet)
        @datasets = [
          {(Dataset)
            @name = "Set1",
            @values = [10, 20, 30]
          },
          {(Dataset)
            @name = "Set2",
            @values = [40, 50, 60]
          }
        ],
        {(Metadata)
          @version = "1.0",
          @tags = ["production", "critical"]
        }
      }`;

      const parser = new TonParser();
      const document = parser.parse(ton);

      expect(document.rootObject.className).toBe('DataSet');

      const datasets = document.rootObject.getProperty('@datasets');
      expect(datasets).not.toBeNull();
      expect(datasets!.type).toBe(TonValueType.Array);
      expect(datasets!.getArrayCount()).toBe(2);

      // Check first dataset in array
      const firstDataset = datasets!.getArrayElement(0);
      expect(firstDataset).not.toBeNull();
      expect(firstDataset!.type).toBe(TonValueType.Object);

      const firstObj = firstDataset!.value as TonObject;
      expect(firstObj).not.toBeNull();
      expect(firstObj!.className).toBe('Dataset');
      expect(firstObj!.getProperty('@name')!.toString()).toBe('Set1');

      // Check metadata child object
      const metadata = document.rootObject.children[0];
      expect(metadata.className).toBe('Metadata');
      const tags = metadata.getProperty('@tags');
      expect(tags!.getArrayCount()).toBe(2);
    });
  });
});