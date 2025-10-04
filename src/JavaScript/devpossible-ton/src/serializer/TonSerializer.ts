/**
 * TonSerializer - Serializer for TON format
 * Copyright (c) 2024 DevPossible, LLC
 */

import { TonDocument } from '../models/TonDocument';
import { TonObject } from '../models/TonObject';
import { TonValue } from '../models/TonValue';
import { TonArray } from '../models/TonArray';
import { TonEnum } from '../models/TonEnum';
import { TonSerializeOptions, ITonSerializeOptions, TonFormatStyle } from './TonSerializeOptions';

// Re-export for convenience
export { TonSerializeOptions, TonFormatStyle };

export class TonSerializer {
  private defaultOptions: TonSerializeOptions;

  constructor(options?: TonSerializeOptions | ITonSerializeOptions) {
    // If options is a TonSerializeOptions instance, use it directly
    // Otherwise, create a new instance with the provided options
    if (options instanceof TonSerializeOptions) {
      this.defaultOptions = options;
    } else {
      this.defaultOptions = new TonSerializeOptions(options);
    }
  }

  /**
   * Get the effective options for a serialize call
   */
  private getOptions(options?: TonSerializeOptions | ITonSerializeOptions): TonSerializeOptions {
    if (options instanceof TonSerializeOptions) {
      return options;
    } else if (options) {
      return new TonSerializeOptions(options);
    }
    return this.defaultOptions;
  }

  /**
   * Serializes a TonDocument or object to TON format string
   * Matches C# signature: Serialize(object obj, TonSerializeOptions? options = null)
   */
  public serialize(obj: any, options?: TonSerializeOptions | ITonSerializeOptions): string {
    const opts = this.getOptions(options);

    // Temporarily set options for this serialize call
    const savedOptions = this.defaultOptions;
    this.defaultOptions = opts;

    try {
      if (obj instanceof TonDocument) {
        return this._serializeDocument(obj);
      } else if (obj instanceof TonObject) {
        return this.serializeObject(obj, 0);
      } else if (obj instanceof TonArray) {
        return this.serializeArray(obj, 0);
      } else {
        // Convert plain object to TonDocument
        const doc = TonDocument.fromObject(obj);
        return this._serializeDocument(doc);
      }
    } finally {
      // Restore default options
      this.defaultOptions = savedOptions;
    }
  }

  /**
   * Serializes a TonDocument to string
   */
  public serializeDocument(doc: TonDocument, options?: TonSerializeOptions | ITonSerializeOptions): string {
    const savedOptions = this.defaultOptions;
    try {
      const opts = this.getOptions(options);
      this.defaultOptions = opts;
      return this._serializeDocument(doc);
    } finally {
      this.defaultOptions = savedOptions;
    }
  }

  private _serializeDocument(doc: TonDocument): string {
    const parts: string[] = [];

    // Add header if requested
    if (this.defaultOptions.includeHeader && this.defaultOptions.tonVersion) {
      parts.push(`#@ tonVersion = '${this.defaultOptions.tonVersion}'`);
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

    return parts.join(this.defaultOptions.lineEnding || '\n');
  }

  /**
   * Serializes a TonObject to string
   */
  private serializeObject(obj: TonObject, indent: number): string {
    const props = obj.properties;

    // Handle empty object
    if (props.size === 0) {
      // Check if it has a className
      if (obj.className) {
        const prefix = obj.instanceCount !== undefined ?
          `(${obj.className})(${obj.instanceCount})` :
          `(${obj.className})`;
        return `${prefix}{}`;
      }
      return '{}';
    }

    // Sort properties if requested
    let keys = Array.from(props.keys());
    if (this.defaultOptions.sortProperties) {
      keys.sort();
    }

    // Filter out nulls/undefined if requested
    keys = keys.filter(key => {
      const value = props.get(key);
      const actualValue = value instanceof TonValue ? value.value : value;
      if (this.defaultOptions.omitNulls && actualValue === null) return false;
      if (this.defaultOptions.omitUndefined && actualValue === undefined) return false;
      return true;
    });

    // Format based on style
    if (this.defaultOptions.formatStyle === TonFormatStyle.Compact) {
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
        `(${obj.className})(${obj.instanceCount})` :
        `(${obj.className})`;
    }

    const separator = this.defaultOptions.propertySeparator || ' = ';
    const propParts = keys.map(key => {
      const value = obj.properties.get(key)!;
      const keyStr = this.serializePropertyName(key);
      const valueStr = this.serializeAnyValue(value, 0);
      return `${keyStr}${separator}${valueStr}`;
    });

    const joinStr = separator === ':' ? ',' : ', ';
    return `${prefix}{${propParts.join(joinStr)}}`;
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
        `(${obj.className})(${obj.instanceCount})` :
        `(${obj.className})`;
    }

    parts.push(`${prefix}{`);

    const separator = this.defaultOptions.propertySeparator || ' = ';
    keys.forEach((key, index) => {
      const value = obj.properties.get(key)!;
      const keyStr = this.serializePropertyName(key);
      const valueStr = this.serializeAnyValue(value, indent + 1);
      // Add comma after each property except the last (unless trailingCommas is true)
      const isLast = index === keys.length - 1;
      const comma = (this.defaultOptions.trailingCommas || !isLast) ? ',' : '';
      parts.push(`${nextIndentStr}${keyStr}${separator}${valueStr}${comma}`);
    });

    parts.push(`${indentStr}}`);

    return parts.join(this.defaultOptions.lineEnding);
  }

  /**
   * Serializes a property name
   */
  private serializePropertyName(name: string): string {
    // Check if it has a type annotation (name:type format)
    const typeAnnotationMatch = name.match(/^([a-zA-Z_][a-zA-Z0-9_]*):([a-zA-Z_][a-zA-Z0-9_]*)$/);
    if (typeAnnotationMatch) {
      return name; // Return as-is for type annotations
    }

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

    // In Pretty mode, format root-level arrays with indentation
    // Nested arrays stay inline
    if (this.defaultOptions.formatStyle === TonFormatStyle.Pretty && indent === 0) {
      const indentStr = this.getIndentString(indent);
      const nextIndentStr = this.getIndentString(indent + 1);
      const parts: string[] = [];

      parts.push('[');

      items.forEach((item, index) => {
        const valueStr = this.serializeAnyValue(item, indent + 1);
        // Add comma after each item except the last (unless trailingCommas is true)
        const isLast = index === items.length - 1;
        const comma = (this.defaultOptions.trailingCommas || !isLast) ? ',' : '';
        parts.push(`${nextIndentStr}${valueStr}${comma}`);
      });

      parts.push(`${indentStr}]`);

      return parts.join(this.defaultOptions.lineEnding);
    } else {
      // Nested arrays and compact mode: stay inline
      const itemStrs = items.map(item => this.serializeAnyValue(item, indent));
      // Use arraySeparator if specified, otherwise default based on format style
      const separator = this.defaultOptions.arraySeparator !== undefined
        ? this.defaultOptions.arraySeparator
        : (this.defaultOptions.formatStyle === TonFormatStyle.Compact ? ',' : ', ');
      return `[${itemStrs.join(separator)}]`;
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
    // Handle enum and enumSet specially
    if (value.typeHint === 'enum') {
      if (Array.isArray(value.value)) {
        return '|' + value.value.join('|') + '|';
      } else {
        return '|' + value.value + '|';
      }
    }
    if (value.typeHint === 'enumSet') {
      if (Array.isArray(value.value)) {
        return '|' + value.value.join('|') + '|';
      } else {
        return '|' + value.value + '|';
      }
    }

    // If the wrapped value is a TonObject or TonArray, serialize it properly
    if (value.value instanceof TonObject) {
      return this.serializeObject(value.value, indent);
    }
    if (value.value instanceof TonArray) {
      return this.serializeArray(value.value, indent);
    }

    let result = this.serializePlainValue(value.value, indent);

    // Add type hint if requested and present
    if (this.defaultOptions.includeTypeHints && value.typeHint) {
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
      // Check if it's a GUID (with or without braces)
      const guidPattern = /^(\{)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\})?$/i;
      if (guidPattern.test(value)) {
        return value;
      }
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
    const quote = this.defaultOptions.quoteStyle === 'single' ? "'" : '"';
    const escaped = str
      .replace(/\\/g, '\\\\')
      .replace(new RegExp(quote, 'g'), '\\' + quote)
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');

    // Check if it's a multiline string
    if (str.includes('\n') && this.defaultOptions.formatStyle === TonFormatStyle.Pretty) {
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
    if (this.defaultOptions.formatStyle === TonFormatStyle.Compact) {
      return '';
    }
    return (this.defaultOptions.indentChar || ' ').repeat((this.defaultOptions.indentSize || 4) * level);
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