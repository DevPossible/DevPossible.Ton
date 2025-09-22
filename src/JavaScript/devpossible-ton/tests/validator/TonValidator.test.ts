/**
 * TonValidator Tests
 * Copyright (c) 2024 DevPossible, LLC
 */

import { TonValidator } from '../../src/validator/TonValidator';
import { TonDocument, TonObject, TonValue, TonArray } from '../../src/models';

describe('TonValidator', () => {
  describe('Type Validation', () => {
    test('should validate string type', () => {
      const obj = new TonObject();
      obj.set('name', new TonValue('John'));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' }
        }
      };

      const validator = new TonValidator();
      const result = validator.validate(doc, schema);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should fail on wrong string type', () => {
      const obj = new TonObject();
      obj.set('name', new TonValue(123));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' }
        }
      };

      const validator = new TonValidator();
      const result = validator.validate(doc, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('name: Expected string, got number');
    });

    test('should validate number type', () => {
      const obj = new TonObject();
      obj.set('age', new TonValue(30));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const schema = {
        type: 'object',
        properties: {
          age: { type: 'number' }
        }
      };

      const validator = new TonValidator();
      const result = validator.validate(doc, schema);

      expect(result.isValid).toBe(true);
    });

    test('should validate boolean type', () => {
      const obj = new TonObject();
      obj.set('active', new TonValue(true));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const schema = {
        type: 'object',
        properties: {
          active: { type: 'boolean' }
        }
      };

      const validator = new TonValidator();
      const result = validator.validate(doc, schema);

      expect(result.isValid).toBe(true);
    });

    test('should validate null type', () => {
      const obj = new TonObject();
      obj.set('value', new TonValue(null));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const schema = {
        type: 'object',
        properties: {
          value: { type: 'null' }
        }
      };

      const validator = new TonValidator();
      const result = validator.validate(doc, schema);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Required Properties', () => {
    test('should validate required properties exist', () => {
      const obj = new TonObject();
      obj.set('name', new TonValue('John'));
      obj.set('age', new TonValue(30));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const schema = {
        type: 'object',
        required: ['name', 'age'],
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        }
      };

      const validator = new TonValidator();
      const result = validator.validate(doc, schema);

      expect(result.isValid).toBe(true);
    });

    test('should fail on missing required property', () => {
      const obj = new TonObject();
      obj.set('name', new TonValue('John'));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const schema = {
        type: 'object',
        required: ['name', 'age'],
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        }
      };

      const validator = new TonValidator();
      const result = validator.validate(doc, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required property: age');
    });
  });

  describe('String Constraints', () => {
    test('should validate minLength', () => {
      const obj = new TonObject();
      obj.set('password', new TonValue('12345678'));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const schema = {
        type: 'object',
        properties: {
          password: { type: 'string', minLength: 8 }
        }
      };

      const validator = new TonValidator();
      const result = validator.validate(doc, schema);

      expect(result.isValid).toBe(true);
    });

    test('should fail on string too short', () => {
      const obj = new TonObject();
      obj.set('password', new TonValue('1234'));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const schema = {
        type: 'object',
        properties: {
          password: { type: 'string', minLength: 8 }
        }
      };

      const validator = new TonValidator();
      const result = validator.validate(doc, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('String length 4 is less than minimum 8');
    });

    test('should validate maxLength', () => {
      const obj = new TonObject();
      obj.set('username', new TonValue('john'));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const schema = {
        type: 'object',
        properties: {
          username: { type: 'string', maxLength: 10 }
        }
      };

      const validator = new TonValidator();
      const result = validator.validate(doc, schema);

      expect(result.isValid).toBe(true);
    });

    test('should validate pattern', () => {
      const obj = new TonObject();
      obj.set('email', new TonValue('john@example.com'));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const schema = {
        type: 'object',
        properties: {
          email: { type: 'string', pattern: '^[^@]+@[^@]+\\.[^@]+$' }
        }
      };

      const validator = new TonValidator();
      const result = validator.validate(doc, schema);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Number Constraints', () => {
    test('should validate minimum', () => {
      const obj = new TonObject();
      obj.set('age', new TonValue(18));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const schema = {
        type: 'object',
        properties: {
          age: { type: 'number', minimum: 18 }
        }
      };

      const validator = new TonValidator();
      const result = validator.validate(doc, schema);

      expect(result.isValid).toBe(true);
    });

    test('should fail on number below minimum', () => {
      const obj = new TonObject();
      obj.set('age', new TonValue(16));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const schema = {
        type: 'object',
        properties: {
          age: { type: 'number', minimum: 18 }
        }
      };

      const validator = new TonValidator();
      const result = validator.validate(doc, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Value 16 is less than minimum 18');
    });

    test('should validate maximum', () => {
      const obj = new TonObject();
      obj.set('score', new TonValue(95));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const schema = {
        type: 'object',
        properties: {
          score: { type: 'number', maximum: 100 }
        }
      };

      const validator = new TonValidator();
      const result = validator.validate(doc, schema);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Array Validation', () => {
    test('should validate array type', () => {
      const arr = new TonArray();
      arr.push(new TonValue(1));
      arr.push(new TonValue(2));

      const obj = new TonObject();
      obj.set('numbers', arr);

      const doc = new TonDocument();
      doc.setRoot(obj);

      const schema = {
        type: 'object',
        properties: {
          numbers: {
            type: 'array',
            items: { type: 'number' }
          }
        }
      };

      const validator = new TonValidator();
      const result = validator.validate(doc, schema);

      expect(result.isValid).toBe(true);
    });

    test('should validate minItems', () => {
      const arr = new TonArray();
      arr.push(new TonValue(1));
      arr.push(new TonValue(2));

      const obj = new TonObject();
      obj.set('items', arr);

      const doc = new TonDocument();
      doc.setRoot(obj);

      const schema = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            minItems: 2
          }
        }
      };

      const validator = new TonValidator();
      const result = validator.validate(doc, schema);

      expect(result.isValid).toBe(true);
    });

    test('should fail on array too short', () => {
      const arr = new TonArray();
      arr.push(new TonValue(1));

      const obj = new TonObject();
      obj.set('items', arr);

      const doc = new TonDocument();
      doc.setRoot(obj);

      const schema = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            minItems: 2
          }
        }
      };

      const validator = new TonValidator();
      const result = validator.validate(doc, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Array has 1 items, minimum is 2');
    });

    test('should validate maxItems', () => {
      const arr = new TonArray();
      arr.push(new TonValue(1));
      arr.push(new TonValue(2));

      const obj = new TonObject();
      obj.set('items', arr);

      const doc = new TonDocument();
      doc.setRoot(obj);

      const schema = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            maxItems: 5
          }
        }
      };

      const validator = new TonValidator();
      const result = validator.validate(doc, schema);

      expect(result.isValid).toBe(true);
    });

    test('should validate array item types', () => {
      const arr = new TonArray();
      arr.push(new TonValue('one'));
      arr.push(new TonValue('two'));

      const obj = new TonObject();
      obj.set('strings', arr);

      const doc = new TonDocument();
      doc.setRoot(obj);

      const schema = {
        type: 'object',
        properties: {
          strings: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      };

      const validator = new TonValidator();
      const result = validator.validate(doc, schema);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Nested Object Validation', () => {
    test('should validate nested objects', () => {
      const inner = new TonObject();
      inner.set('city', new TonValue('New York'));
      inner.set('zip', new TonValue('10001'));

      const outer = new TonObject();
      outer.set('name', new TonValue('John'));
      outer.set('address', inner);

      const doc = new TonDocument();
      doc.setRoot(outer);

      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          address: {
            type: 'object',
            properties: {
              city: { type: 'string' },
              zip: { type: 'string' }
            }
          }
        }
      };

      const validator = new TonValidator();
      const result = validator.validate(doc, schema);

      expect(result.isValid).toBe(true);
    });

    test('should validate deeply nested structures', () => {
      const level3 = new TonObject();
      level3.set('value', new TonValue('deep'));

      const level2 = new TonObject();
      level2.set('nested', level3);

      const level1 = new TonObject();
      level1.set('data', level2);

      const doc = new TonDocument();
      doc.setRoot(level1);

      const schema = {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              nested: {
                type: 'object',
                properties: {
                  value: { type: 'string' }
                }
              }
            }
          }
        }
      };

      const validator = new TonValidator();
      const result = validator.validate(doc, schema);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Enum Validation', () => {
    test('should validate enum values', () => {
      const obj = new TonObject();
      obj.set('status', new TonValue('active'));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const schema = {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'pending']
          }
        }
      };

      const validator = new TonValidator();
      const result = validator.validate(doc, schema);

      expect(result.isValid).toBe(true);
    });

    test('should fail on invalid enum value', () => {
      const obj = new TonObject();
      obj.set('status', new TonValue('unknown'));

      const doc = new TonDocument();
      doc.setRoot(obj);

      const schema = {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'pending']
          }
        }
      };

      const validator = new TonValidator();
      const result = validator.validate(doc, schema);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Value "unknown" is not in enum');
    });
  });

  describe('Complex Schemas', () => {
    test('should validate complex document', () => {
      const config = new TonObject();
      config.set('host', new TonValue('localhost'));
      config.set('port', new TonValue(5432));

      const doc = new TonDocument();
      doc.setRoot(config);

      const schema = {
        type: 'object',
        required: ['host', 'port'],
        properties: {
          host: {
            type: 'string',
            minLength: 1
          },
          port: {
            type: 'number',
            minimum: 1,
            maximum: 65535
          }
        }
      };

      const validator = new TonValidator();
      const result = validator.validate(doc, schema);

      expect(result.isValid).toBe(true);
    });
  });
});