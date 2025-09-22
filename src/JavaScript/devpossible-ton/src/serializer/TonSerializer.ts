/**
 * TonSerializer - Serializer for TON format
 * Copyright (c) 2024 DevPossible, LLC
 */

import { TonDocument } from '../models/TonDocument';
import { TonObject } from '../models/TonObject';
import { TonValue } from '../models/TonValue';
import { TonArray } from '../models/TonArray';
import { TonEnum } from '../models/TonEnum';
import { TonSerializeOptions, TonFormatStyle } from './TonSerializeOptions';

export class TonSerializer {
  private options: TonSerializeOptions;

  constructor(options?: TonSerializeOptions) {
    this.options = {
      formatStyle: TonFormatStyle.Pretty,
      indentSize: 4,
      indentChar: ' ',
      includeTypeHints: true,
      includeHeader: true,
      tonVersion: '1',
      omitNulls: false,
      omitUndefined: true,
      sortProperties: false,
      quoteStyle: 'single',
      lineEnding: '\n',
      ...options
    };
  }

  /**
   * Serializes a TonDocument or object to TON format string
   */
  public serialize(obj: any): string {
    if (obj instanceof TonDocument) {
      return this.serializeDocument(obj);
    } else if (obj instanceof TonObject) {
      return this.serializeObject(obj, 0);
    } else if (obj instanceof TonArray) {
      return this.serializeArray(obj, 0);
    } else {
      // Convert plain object to TonDocument
      const doc = TonDocument.fromObject(obj);
      return this.serializeDocument(doc);
    }
  }

  /**
   * Serializes a TonDocument to string
   */
  private serializeDocument(doc: TonDocument): string {
    const parts: string[] = [];

    // Add header if requested
    if (this.options.includeHeader && this.options.tonVersion) {
      parts.push(`#@ tonVersion = '${this.options.tonVersion}'`);
      parts.push('');
    }

    // Serialize root object
    if (doc.root instanceof TonObject) {
      parts.push(this.serializeObject(doc.root, 0));
    } else if (doc.root instanceof TonArray) {
      parts.push(this.serializeArray(doc.root, 0));
    } else if (doc.root instanceof TonValue) {
      parts.push(this.serializeValue(doc.root, 0));
    } else {
      parts.push(this.serializePlainValue(doc.root, 0));
    }

    return parts.join(this.options.lineEnding);
  }

  /**
   * Serializes a TonObject to string
   */
  private serializeObject(obj: TonObject, indent: number): string {
    const props = obj.properties;

    // Handle empty object
    if (props.size === 0) {
      return '{}';
    }

    // Sort properties if requested
    let keys = Array.from(props.keys());
    if (this.options.sortProperties) {
      keys.sort();
    }

    // Filter out nulls/undefined if requested
    keys = keys.filter(key => {
      const value = props.get(key);
      if (this.options.omitNulls && value === null) return false;
      if (this.options.omitUndefined && value === undefined) return false;
      return true;
    });

    // Format based on style
    if (this.options.formatStyle === TonFormatStyle.Compact) {
      return this.serializeObjectCompact(obj, keys);
    } else {
      return this.serializeObjectPretty(obj, keys, indent);
    }
  }

  /**
   * Serializes an object in compact format
   */
  private serializeObjectCompact(obj: TonObject, keys: string[]): string {
    // Add class name if present
    let prefix = '';
    if (obj.className) {
      prefix = obj.instanceCount !== undefined ?
        `(${obj.className}#${obj.instanceCount})` :
        `(${obj.className})`;
    }

    const propParts = keys.map(key => {
      const value = obj.properties.get(key)!;
      const keyStr = this.serializePropertyName(key);
      const valueStr = this.serializeAnyValue(value, 0);
      return `${keyStr} = ${valueStr}`;
    });

    return `${prefix}{${propParts.join(', ')}}`;
  }

  /**
   * Serializes an object in pretty format
   */
  private serializeObjectPretty(obj: TonObject, keys: string[], indent: number): string {
    const indentStr = this.getIndentString(indent);
    const nextIndentStr = this.getIndentString(indent + 1);
    const parts: string[] = [];

    // Add class name if present
    let prefix = '';
    if (obj.className) {
      prefix = obj.instanceCount !== undefined ?
        `(${obj.className}#${obj.instanceCount})` :
        `(${obj.className})`;
    }

    parts.push(`${prefix}{`);

    keys.forEach((key, index) => {
      const value = obj.properties.get(key)!;
      const keyStr = this.serializePropertyName(key);
      const valueStr = this.serializeAnyValue(value, indent + 1);
      const comma = index < keys.length - 1 ? ',' : '';
      parts.push(`${nextIndentStr}${keyStr} = ${valueStr}${comma}`);
    });

    parts.push(`${indentStr}}`);

    return parts.join(this.options.lineEnding);
  }

  /**
   * Serializes a property name
   */
  private serializePropertyName(name: string): string {
    // Check if it's a valid identifier
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name) || /^[0-9]+(\.[0-9]+)?$/.test(name)) {
      return name;
    }
    // Otherwise quote it
    return this.quoteString(name);
  }

  /**
   * Serializes a TonArray to string
   */
  private serializeArray(arr: TonArray, indent: number): string {
    const items = arr.items;

    if (items.length === 0) {
      return '[]';
    }

    if (this.options.formatStyle === TonFormatStyle.Compact) {
      const itemStrs = items.map(item => this.serializeAnyValue(item, 0));
      return `[${itemStrs.join(', ')}]`;
    } else {
      const indentStr = this.getIndentString(indent);
      const nextIndentStr = this.getIndentString(indent + 1);
      const parts: string[] = ['['];

      items.forEach((item, index) => {
        const itemStr = this.serializeAnyValue(item, indent + 1);
        const comma = index < items.length - 1 ? ',' : '';

        // Check if item is complex (object/array) for better formatting
        if (item instanceof TonObject || item instanceof TonArray) {
          parts.push(`${nextIndentStr}${itemStr}${comma}`);
        } else {
          if (index === 0) {
            parts[0] = `[${itemStr}${comma}`;
          } else {
            parts.push(`${itemStr}${comma}`);
          }
        }
      });

      if (parts.length > 1) {
        parts.push(`${indentStr}]`);
        return parts.join(this.options.lineEnding);
      } else {
        return parts[0] + ']';
      }
    }
  }

  /**
   * Serializes any value
   */
  private serializeAnyValue(value: any, indent: number): string {
    if (value instanceof TonObject) {
      return this.serializeObject(value, indent);
    } else if (value instanceof TonArray) {
      return this.serializeArray(value, indent);
    } else if (value instanceof TonValue) {
      return this.serializeValue(value, indent);
    } else if (value instanceof TonEnum) {
      return this.serializeEnum(value);
    } else {
      return this.serializePlainValue(value, indent);
    }
  }

  /**
   * Serializes a TonValue
   */
  private serializeValue(value: TonValue, indent: number): string {
    let result = this.serializePlainValue(value.value, indent);

    // Add type hint if requested and present
    if (this.options.includeTypeHints && value.typeHint) {
      const hint = this.getTypeHintPrefix(value.typeHint);
      if (hint) {
        result = hint + result;
      }
    }

    return result;
  }

  /**
   * Serializes a TonEnum
   */
  private serializeEnum(enumValue: TonEnum): string {
    if (Array.isArray(enumValue.values)) {
      // EnumSet
      return '|' + enumValue.values.join('|') + '|';
    } else {
      // Single enum
      return '|' + enumValue.values + '|';
    }
  }

  /**
   * Serializes a plain JavaScript value
   */
  private serializePlainValue(value: any, indent: number): string {
    if (value === null) {
      return 'null';
    }
    if (value === undefined) {
      return 'undefined';
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    if (typeof value === 'number') {
      // Handle special numbers
      if (Number.isNaN(value)) return 'NaN';
      if (value === Infinity) return 'Infinity';
      if (value === -Infinity) return '-Infinity';

      // Check if it's an integer and within safe range
      if (Number.isInteger(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER) {
        return value.toString();
      }
      // Use exponential notation for very large/small numbers
      if (Math.abs(value) >= 1e21 || (Math.abs(value) < 1e-6 && value !== 0)) {
        return value.toExponential();
      }
      return value.toString();
    }
    if (typeof value === 'string') {
      return this.quoteString(value);
    }
    if (value instanceof Date) {
      return this.quoteString(value.toISOString());
    }
    if (Array.isArray(value)) {
      // Convert to TonArray and serialize
      const tonArray = new TonArray();
      tonArray.items = value;
      return this.serializeArray(tonArray, indent);
    }
    if (typeof value === 'object') {
      // Convert to TonObject and serialize
      const tonObj = new TonObject();
      for (const [key, val] of Object.entries(value)) {
        tonObj.set(key, val);
      }
      return this.serializeObject(tonObj, indent);
    }

    return String(value);
  }

  /**
   * Quotes a string value
   */
  private quoteString(str: string): string {
    const quote = this.options.quoteStyle === 'single' ? "'" : '"';
    const escaped = str
      .replace(/\\/g, '\\\\')
      .replace(new RegExp(quote, 'g'), '\\' + quote)
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');

    // Check if it's a multiline string
    if (str.includes('\n') && this.options.formatStyle === TonFormatStyle.Pretty) {
      // Use triple quotes for multiline
      return `"""${str}"""`;
    }

    return quote + escaped + quote;
  }

  /**
   * Gets the type hint prefix character
   */
  private getTypeHintPrefix(typeHint: string): string {
    switch (typeHint) {
      case 'string': return '$';
      case 'number': return '%';
      case 'boolean': return '&';
      case 'date': return '^';
      default: return '';
    }
  }

  /**
   * Gets the indentation string for a given level
   */
  private getIndentString(level: number): string {
    if (this.options.formatStyle === TonFormatStyle.Compact) {
      return '';
    }
    return (this.options.indentChar || ' ').repeat((this.options.indentSize || 4) * level);
  }
}

// Static methods for convenience
export namespace TonSerializer {
  export function stringify(obj: any, options?: TonSerializeOptions): string {
    const serializer = new TonSerializer(options);
    return serializer.serialize(obj);
  }

  export function compact(obj: any): string {
    return stringify(obj, { formatStyle: TonFormatStyle.Compact });
  }

  export function pretty(obj: any): string {
    return stringify(obj, { formatStyle: TonFormatStyle.Pretty });
  }
}