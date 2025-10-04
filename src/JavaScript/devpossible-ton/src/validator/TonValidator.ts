/**
 * TonValidator - Schema validation for TON format
 * Copyright (c) 2024 DevPossible, LLC
 */

import { TonDocument } from '../models/TonDocument';
import { TonObject } from '../models/TonObject';
import { TonValue } from '../models/TonValue';
import { TonArray } from '../models/TonArray';
import { TonSchemaCollection } from '../schema/TonSchemaCollection';
import { TonPropertySchema, ValidationRuleType } from '../schema/TonSchema';

export interface ValidationResult {
  valid: boolean;
  isValid: boolean; // Alias for valid
  errors: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
  value?: any;
  rule?: string;
}

export interface SchemaRule {
  type?: string | string[];
  required?: boolean | string[]; // Can be boolean for individual properties or array for object
  minLength?: number;
  maxLength?: number;
  minItems?: number; // Alias for minLength for arrays
  maxItems?: number; // Alias for maxLength for arrays
  min?: number;
  max?: number;
  minimum?: number; // Alias for min
  maximum?: number; // Alias for max
  pattern?: string | RegExp;
  enum?: any[];
  values?: any[]; // Alias for enum (used with type: 'enum')
  default?: any;
  properties?: { [key: string]: SchemaRule };
  items?: SchemaRule;
  custom?: (value: any, path: string) => ValidationError | null;
}

export interface TonSchema {
  [path: string]: SchemaRule;
}

export class TonValidator {
  private schema: TonSchema;
  private schemaCollection?: TonSchemaCollection;
  private errors: ValidationError[];

  constructor(schema?: TonSchema | TonSchemaCollection) {
    // Store TonSchemaCollection for advanced validation
    if (schema instanceof TonSchemaCollection) {
      this.schemaCollection = schema;
      this.schema = schema.getAllSchemas() as any;
    } else {
      this.schema = schema || {};
    }
    this.errors = [];
  }

  /**
   * Validates a document or object against the schema
   */
  public validate(obj: any): ValidationResult {
    this.errors = [];

    let target: any;
    if (obj instanceof TonDocument) {
      target = obj.root;
    } else {
      target = obj;
    }

    // If using TonSchemaCollection, validate by className
    if (this.schemaCollection && target instanceof TonObject) {
      this.validateWithSchemaCollection(target);
    } else if (this.schema.type || this.schema.properties) {
      // Object-style schema
      this.validateValue(target, '', this.schema as SchemaRule);
    } else {
      // Path-style schema
      for (const [path, rule] of Object.entries(this.schema)) {
        this.validatePath(target, path, rule);
      }
    }

    const isValid = this.errors.length === 0;
    return {
      valid: isValid,
      isValid: isValid, // Alias for valid
      errors: [...this.errors]
    };
  }

  /**
   * Validates using TonSchemaCollection with className matching
   */
  private validateWithSchemaCollection(obj: TonObject): void {
    if (!this.schemaCollection || !obj.className) {
      return;
    }

    const schemaDef = this.schemaCollection.getSchema(obj.className);
    if (!schemaDef || !schemaDef.properties) {
      return;
    }

    // Validate each property with its schema
    for (const [path, propSchema] of Object.entries(schemaDef.properties)) {
      this.validatePropertyWithSchema(obj, path, propSchema);
    }
  }

  /**
   * Validates a property using TonPropertySchema with custom validation rules
   */
  private validatePropertyWithSchema(obj: TonObject, path: string, propSchema: TonPropertySchema): void {
    // Get the property value (path starts with /)
    const propertyName = path.startsWith('/') ? path.substring(1) : path;
    const value = obj.get(propertyName);

    // Unwrap TonValue
    let actualValue = value;
    if (value instanceof TonValue) {
      actualValue = value.value;
    }

    // Check if it's an array type
    const isArray = actualValue instanceof TonArray || Array.isArray(actualValue);
    const arr = actualValue instanceof TonArray ? actualValue.items : actualValue;

    // Parse type for array base type validation (e.g., "array:int")
    let arrayBaseType: string | undefined;
    if (propSchema.type && propSchema.type.startsWith('array:')) {
      arrayBaseType = propSchema.type.substring(6); // Extract "int" from "array:int"
    }

    // Validate array base type
    if (isArray && arrayBaseType) {
      for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        const itemValue = item instanceof TonValue ? item.value : item;
        const itemType = this.getValueType(itemValue);

        // Map TON type names to validation types
        const expectedType = this.mapTonType(arrayBaseType);
        if (itemType !== expectedType) {
          this.addError(
            `${propertyName}[${i}]`,
            `Type mismatch at index ${i}: expected ${expectedType}, got ${itemType}`,
            itemValue,
            'type'
          );
        }
      }
    }

    // Process custom validation rules
    if (propSchema instanceof TonPropertySchema) {
      const validations = propSchema.getValidations();
      for (const rule of validations) {
        this.applyValidationRule(propertyName, actualValue, rule, isArray ? arr : undefined);
      }
    }
  }

  /**
   * Maps TON type names to validator type names
   */
  private mapTonType(tonType: string): string {
    const typeMap: Record<string, string> = {
      'int': 'number',
      'integer': 'number',
      'float': 'number',
      'double': 'number',
      'str': 'string',
      'bool': 'boolean'
    };
    return typeMap[tonType.toLowerCase()] || tonType.toLowerCase();
  }

  /**
   * Applies a custom validation rule
   */
  private applyValidationRule(path: string, value: any, rule: any, arr?: any[]): void {
    switch (rule.type) {
      case ValidationRuleType.MinCount:
        if (arr && arr.length < rule.value) {
          this.addError(
            path,
            `Array must have at least ${rule.value} elements, but has ${arr.length}`,
            value,
            'minCount'
          );
        }
        break;

      case ValidationRuleType.MaxCount:
        if (arr && arr.length > rule.value) {
          this.addError(
            path,
            `Array must have at most ${rule.value} elements, but has ${arr.length}`,
            value,
            'maxCount'
          );
        }
        break;

      case ValidationRuleType.NonEmpty:
        if (arr && arr.length === 0) {
          this.addError(
            path,
            'Array must not be empty',
            value,
            'nonEmpty'
          );
        }
        break;

      case ValidationRuleType.Unique:
        if (arr) {
          const seen = new Set();
          const duplicates = new Set();
          for (const item of arr) {
            const itemValue = item instanceof TonValue ? item.value : item;
            const key = JSON.stringify(itemValue);
            if (seen.has(key)) {
              duplicates.add(itemValue);
            }
            seen.add(key);
          }
          if (duplicates.size > 0) {
            this.addError(
              path,
              'Array must contain only unique elements',
              value,
              'unique'
            );
          }
        }
        break;

      case ValidationRuleType.Sorted:
        if (arr && arr.length > 1) {
          for (let i = 0; i < arr.length - 1; i++) {
            const current = arr[i] instanceof TonValue ? arr[i].value : arr[i];
            const next = arr[i + 1] instanceof TonValue ? arr[i + 1].value : arr[i + 1];
            if (current > next) {
              this.addError(
                path,
                'Array must be sorted in ascending order',
                value,
                'sorted'
              );
              break;
            }
          }
        }
        break;
    }
  }

  /**
   * Validates a specific path against a rule
   */
  private validatePath(obj: any, path: string, rule: SchemaRule): void {
    const value = this.getValueAtPath(obj, path);

    // Check required
    if (rule.required && (value === undefined || value === null)) {
      this.addError(path, 'Required field is missing', value, 'required');
      return;
    }

    // Skip further validation if value is null/undefined and not required
    if (value === undefined || value === null) {
      // Apply default if specified
      if (rule.default !== undefined) {
        this.setValueAtPath(obj, path, rule.default);
      }
      return;
    }

    // Type validation
    if (rule.type) {
      const types = Array.isArray(rule.type) ? rule.type : [rule.type];
      const actualType = this.getValueType(value);
      if (!types.includes(actualType)) {
        this.addError(path, `Expected type ${types.join(' or ')}, got ${actualType}`, value, 'type');
        return;
      }
    }

    // String validations
    if (typeof value === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        this.addError(path, `String length ${value.length} is less than minimum ${rule.minLength}`, value, 'minLength');
      }
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        this.addError(path, `String length ${value.length} exceeds maximum ${rule.maxLength}`, value, 'maxLength');
      }
      if (rule.pattern) {
        const regex = rule.pattern instanceof RegExp ? rule.pattern : new RegExp(rule.pattern);
        if (!regex.test(value)) {
          this.addError(path, `String does not match pattern ${rule.pattern}`, value, 'pattern');
        }
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        this.addError(path, `Value ${value} is less than minimum ${rule.min}`, value, 'min');
      }
      if (rule.max !== undefined && value > rule.max) {
        this.addError(path, `Value ${value} exceeds maximum ${rule.max}`, value, 'max');
      }
    }

    // Array validations
    if (Array.isArray(value)) {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        this.addError(path, `Array length ${value.length} is less than minimum ${rule.minLength}`, value, 'minLength');
      }
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        this.addError(path, `Array length ${value.length} exceeds maximum ${rule.maxLength}`, value, 'maxLength');
      }
      if (rule.items) {
        value.forEach((_item, index) => {
          this.validatePath(obj, `${path}[${index}]`, rule.items!);
        });
      }
    }

    // Enum validation (check both 'enum' and 'values' properties)
    const enumValues = rule.enum || rule.values;
    if (enumValues && !enumValues.includes(value)) {
      this.addError(path, `Value must be one of: ${enumValues.join(', ')}`, value, 'enum');
    }

    // Object property validations
    if (typeof value === 'object' && !Array.isArray(value) && rule.properties) {
      for (const [prop, propRule] of Object.entries(rule.properties)) {
        this.validatePath(value, prop, propRule);
      }
    }

    // Custom validation
    if (rule.custom) {
      const error = rule.custom(value, path);
      if (error) {
        this.errors.push(error);
      }
    }
  }

  /**
   * Validates a value directly against a rule (object-style validation)
   */
  private validateValue(value: any, path: string, rule: SchemaRule): void {
    // Unwrap TonValue if needed
    let actualValue = value;
    if (value instanceof TonValue) {
      actualValue = value.value;
    }
    if (value instanceof TonObject) {
      actualValue = value;
    }

    // Check required
    if (rule.required && (actualValue === undefined || actualValue === null)) {
      this.addError(path || 'root', `Missing required property: ${path}`, actualValue, 'required');
      return;
    }

    // Skip if null/undefined and not required
    if (actualValue === undefined || actualValue === null) {
      return;
    }

    // Type validation
    if (rule.type) {
      const types = Array.isArray(rule.type) ? rule.type : [rule.type];
      const actualType = this.getValueType(actualValue);

      // Special handling for type: 'enum' - it's valid for string values
      const typesWithoutEnum = types.filter(t => t !== 'enum');
      if (typesWithoutEnum.length > 0 && !typesWithoutEnum.includes(actualType)) {
        this.addError(path || 'root', `${path}: Expected ${typesWithoutEnum.join(' or ')}, got ${actualType}`, actualValue, 'type');
        return;
      }
    }

    // String validations
    if (typeof actualValue === 'string') {
      if (rule.minLength !== undefined && actualValue.length < rule.minLength) {
        this.addError(path, `String length ${actualValue.length} is less than minimum ${rule.minLength}`, actualValue, 'minLength');
      }
      if (rule.maxLength !== undefined && actualValue.length > rule.maxLength) {
        this.addError(path, `String length ${actualValue.length} exceeds maximum ${rule.maxLength}`, actualValue, 'maxLength');
      }
      if (rule.pattern) {
        const regex = rule.pattern instanceof RegExp ? rule.pattern : new RegExp(rule.pattern);
        if (!regex.test(actualValue)) {
          this.addError(path, `String does not match pattern`, actualValue, 'pattern');
        }
      }
    }

    // Number validations
    if (typeof actualValue === 'number') {
      const minValue = rule.minimum !== undefined ? rule.minimum : rule.min;
      const maxValue = rule.maximum !== undefined ? rule.maximum : rule.max;

      if (minValue !== undefined && actualValue < minValue) {
        this.addError(path, `Value ${actualValue} is less than minimum ${minValue}`, actualValue, 'min');
      }
      if (maxValue !== undefined && actualValue > maxValue) {
        this.addError(path, `Value ${actualValue} exceeds maximum ${maxValue}`, actualValue, 'max');
      }
    }

    // Enum validation (check both 'enum' and 'values' properties)
    const enumValues = rule.enum || rule.values;
    if (enumValues && !enumValues.includes(actualValue)) {
      const valueStr = typeof actualValue === 'string' ? `"${actualValue}"` : actualValue;
      this.addError(path, `Value ${valueStr} is not in enum`, actualValue, 'enum');
    }

    // Object property validation
    if (rule.properties && (actualValue instanceof TonObject || (typeof actualValue === 'object' && !Array.isArray(actualValue)))) {
      const obj = actualValue instanceof TonObject ? actualValue : actualValue;

      // Check required properties array
      if (Array.isArray(rule.required)) {
        for (const requiredProp of rule.required) {
          const propValue = obj instanceof TonObject ? obj.get(requiredProp) : obj[requiredProp];
          if (propValue === undefined || propValue === null) {
            this.addError(path || 'root', `Missing required property: ${requiredProp}`, actualValue, 'required');
          }
        }
      }

      for (const [propName, propRule] of Object.entries(rule.properties)) {
        const propValue = obj instanceof TonObject ? obj.get(propName) : obj[propName];
        const propPath = path ? `${path}.${propName}` : propName;
        this.validateValue(propValue, propPath, propRule);
      }
    }

    // Array validations
    if (Array.isArray(actualValue) || actualValue instanceof TonArray) {
      const arr = actualValue instanceof TonArray ? actualValue.items : actualValue;
      const minLen = rule.minItems !== undefined ? rule.minItems : rule.minLength;
      const maxLen = rule.maxItems !== undefined ? rule.maxItems : rule.maxLength;

      if (minLen !== undefined && arr.length < minLen) {
        this.addError(path, `Array length ${arr.length} is less than minimum ${minLen}`, actualValue, 'minLength');
      }
      if (maxLen !== undefined && arr.length > maxLen) {
        this.addError(path, `Array length ${arr.length} exceeds maximum ${maxLen}`, actualValue, 'maxLength');
      }
      if (rule.items) {
        arr.forEach((item: any, index: number) => {
          this.validateValue(item, `${path}[${index}]`, rule.items!);
        });
      }
    }

    // Custom validation
    if (rule.custom) {
      const error = rule.custom(actualValue, path);
      if (error) {
        this.errors.push(error);
      }
    }
  }

  /**
   * Gets a value at a specific path
   */
  private getValueAtPath(obj: any, path: string): any {
    // Handle root path
    if (path === '/' || path === '') {
      return obj;
    }

    // Parse path segments
    const segments = path.split('/').filter(s => s);
    let current = obj;

    for (const segment of segments) {
      if (current === null || current === undefined) {
        return undefined;
      }

      // Handle array indices
      const arrayMatch = segment.match(/^(.+)\[(\d+)\]$/);
      if (arrayMatch) {
        const propName = arrayMatch[1];
        const index = parseInt(arrayMatch[2]);
        current = this.getProperty(current, propName);
        if (Array.isArray(current) || current instanceof TonArray) {
          current = current instanceof TonArray ? current.items[index] : current[index];
        } else {
          return undefined;
        }
      } else {
        current = this.getProperty(current, segment);
      }
    }

    return current;
  }

  /**
   * Sets a value at a specific path
   */
  private setValueAtPath(obj: any, path: string, value: any): void {
    const segments = path.split('/').filter(s => s);
    if (segments.length === 0) return;

    let current = obj;
    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];
      const next = this.getProperty(current, segment);
      if (next === undefined) {
        // Create intermediate object
        if (current instanceof TonObject) {
          const newObj = new TonObject();
          current.set(segment, newObj);
          current = newObj;
        } else {
          current[segment] = {};
          current = current[segment];
        }
      } else {
        current = next;
      }
    }

    const lastSegment = segments[segments.length - 1];
    if (current instanceof TonObject) {
      current.set(lastSegment, value);
    } else {
      current[lastSegment] = value;
    }
  }

  /**
   * Gets a property from an object or TonObject
   */
  private getProperty(obj: any, property: string): any {
    if (obj instanceof TonObject) {
      return obj.get(property);
    } else if (obj instanceof TonValue) {
      return obj.value?.[property];
    } else if (typeof obj === 'object' && obj !== null) {
      return obj[property];
    }
    return undefined;
  }

  /**
   * Determines the type of a value
   */
  private getValueType(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (value instanceof TonObject) return 'object';
    if (value instanceof TonArray) return 'array';
    if (value instanceof TonValue) return this.getValueType(value.value);
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    return typeof value;
  }

  /**
   * Adds a validation error
   */
  private addError(path: string, message: string, value?: any, rule?: string): void {
    this.errors.push({ path, message, value, rule });
  }
}

/**
 * Common schema rules for reuse
 */
export class SchemaRules {
  static string(options: Partial<SchemaRule> = {}): SchemaRule {
    return { type: 'string', ...options };
  }

  static number(options: Partial<SchemaRule> = {}): SchemaRule {
    return { type: 'number', ...options };
  }

  static boolean(options: Partial<SchemaRule> = {}): SchemaRule {
    return { type: 'boolean', ...options };
  }

  static array(itemRule?: SchemaRule, options: Partial<SchemaRule> = {}): SchemaRule {
    return { type: 'array', items: itemRule, ...options };
  }

  static object(properties: { [key: string]: SchemaRule }, options: Partial<SchemaRule> = {}): SchemaRule {
    return { type: 'object', properties, ...options };
  }

  static required(rule: SchemaRule): SchemaRule {
    return { ...rule, required: true };
  }

  static optional(rule: SchemaRule): SchemaRule {
    return { ...rule, required: false };
  }

  static email(): SchemaRule {
    return {
      type: 'string',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    };
  }

  static url(): SchemaRule {
    return {
      type: 'string',
      pattern: /^https?:\/\/.+/
    };
  }

  static uuid(): SchemaRule {
    return {
      type: 'string',
      pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    };
  }

  static date(): SchemaRule {
    return {
      type: 'string',
      custom: (value: any) => {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return {
            path: '',
            message: 'Invalid date format',
            value,
            rule: 'date'
          };
        }
        return null;
      }
    };
  }
}