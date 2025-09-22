/**
 * TonValidator - Schema validation for TON format
 * Copyright (c) 2024 DevPossible, LLC
 */

import { TonDocument } from '../models/TonDocument';
import { TonObject } from '../models/TonObject';
import { TonValue } from '../models/TonValue';
import { TonArray } from '../models/TonArray';

export interface ValidationResult {
  valid: boolean;
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
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string | RegExp;
  enum?: any[];
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
  private errors: ValidationError[];

  constructor(schema?: TonSchema) {
    this.schema = schema || {};
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

    // Validate against each schema path
    for (const [path, rule] of Object.entries(this.schema)) {
      this.validatePath(target, path, rule);
    }

    return {
      valid: this.errors.length === 0,
      errors: [...this.errors]
    };
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

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      this.addError(path, `Value must be one of: ${rule.enum.join(', ')}`, value, 'enum');
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