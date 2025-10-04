/**
 * TonValue - Value model for TON
 * Copyright (c) 2024 DevPossible, LLC
 */

export enum TonValueType {
  String = 'string',
  Number = 'number',
  Integer = 'integer',
  Float = 'float',
  Boolean = 'boolean',
  Null = 'null',
  Undefined = 'undefined',
  Object = 'object',
  Array = 'array',
  Date = 'date',
  Guid = 'guid',
  Enum = 'enum'
}

export class TonValue {
  public value: any;
  public typeHint?: string;

  constructor(value: any, typeHint?: string) {
    this.value = value;
    this.typeHint = typeHint;
  }

  public getValue(): any {
    // Apply type conversions based on typeHint
    if (this.typeHint) {
      switch (this.typeHint) {
        case 'date':
          return typeof this.value === 'string' ? new Date(this.value) : this.value;
        case 'number':
          return typeof this.value === 'string' ? Number(this.value) : this.value;
        case 'boolean':
          return typeof this.value === 'string' ? this.value === 'true' : this.value;
        default:
          return this.value;
      }
    }
    return this.value;
  }

  public setValue(value: any): void {
    this.value = value;
  }

  public getType(): string {
    if (this.typeHint) {
      return this.typeHint;
    }

    if (this.value === null) {
      return 'null';
    }

    if (this.value === undefined) {
      return 'undefined';
    }

    return typeof this.value;
  }

  /**
   * Gets the TonValueType enum value
   */
  public get type(): TonValueType {
    // Import TonArray dynamically to avoid circular dependency
    const TonArray = require('./TonArray').TonArray;
    const TonObject = require('./TonObject').TonObject;

    if (Array.isArray(this.value) || this.value instanceof TonArray) {
      return TonValueType.Array;
    }

    if (this.value instanceof TonObject) {
      return TonValueType.Object;
    }

    const typeStr = this.getType();
    switch (typeStr) {
      case 'string':
        return TonValueType.String;
      case 'number':
        // Check if it's an integer or float
        if (typeof this.value === 'number' && Number.isInteger(this.value)) {
          return TonValueType.Integer;
        }
        return TonValueType.Float;
      case 'boolean':
        return TonValueType.Boolean;
      case 'null':
        return TonValueType.Null;
      case 'undefined':
        return TonValueType.Undefined;
      case 'object':
        return TonValueType.Object;
      case 'date':
        return TonValueType.Date;
      case 'guid':
        return TonValueType.Guid;
      case 'enum':
        return TonValueType.Enum;
      default:
        return TonValueType.String;
    }
  }

  public toJSON(): any {
    const value = this.getValue();
    // If the value has a toJSON method, use it (for TonObject, TonArray, etc.)
    // But don't call toJSON on Date objects - return them directly
    if (value instanceof Date) {
      return value;
    }
    if (value && typeof value.toJSON === 'function') {
      return value.toJSON();
    }
    return value;
  }

  public toString(): string {
    return String(this.value);
  }

  /**
   * Returns the primitive value for comparison
   * This allows TonValue to be used in comparisons like toBe()
   */
  public valueOf(): any {
    // For primitive types, return the unwrapped value
    if (this.value === null || this.value === undefined) {
      return this.value;
    }
    if (typeof this.value === 'string' || typeof this.value === 'number' || typeof this.value === 'boolean') {
      return this.value;
    }
    // For objects and arrays, return this so identity comparison works
    return this;
  }

  /**
   * Creates a TonValue from any value
   */
  public static from(value: any, typeHint?: string): TonValue {
    return new TonValue(value, typeHint);
  }

  /**
   * Creates a TonValue from an array
   */
  public static fromArray(...args: any[]): TonValue {
    // Support both fromArray([1,2,3]) and fromArray(1,2,3)
    if (args.length === 1 && Array.isArray(args[0])) {
      return new TonValue(args[0]);
    } else {
      return new TonValue(args);
    }
  }

  /**
   * Gets the array count (length) if value is an array
   */
  public getArrayCount(): number {
    const TonArray = require('./TonArray').TonArray;

    if (Array.isArray(this.value)) {
      return this.value.length;
    }
    if (this.value instanceof TonArray) {
      return this.value.length();
    }
    return 0;
  }

  /**
   * Checks if the array is empty
   */
  public isEmpty(): boolean {
    if (Array.isArray(this.value)) {
      return this.value.length === 0;
    }
    return true;
  }

  /**
   * Converts the value to an array
   */
  public toArray(): any[] {
    const TonArray = require('./TonArray').TonArray;

    if (Array.isArray(this.value)) {
      return this.value;
    }
    if (this.value instanceof TonArray) {
      return this.value.toArray();
    }
    return [this.value];
  }

  /**
   * Gets an element from the array at the specified index
   */
  public getArrayElement(index: number): TonValue | null {
    const TonArray = require('./TonArray').TonArray;

    if (Array.isArray(this.value)) {
      if (index >= 0 && index < this.value.length) {
        const element = this.value[index];
        return element instanceof TonValue ? element : TonValue.from(element);
      }
    } else if (this.value instanceof TonArray) {
      const element = this.value.get(index);
      if (element !== undefined) {
        return element instanceof TonValue ? element : TonValue.from(element);
      }
    }
    return null;
  }

  /**
   * Conversion methods for type compatibility
   */
  public toInt32(): number {
    return typeof this.value === 'number' ? Math.floor(this.value) : parseInt(String(this.value), 10);
  }

  public toNumber(): number {
    return typeof this.value === 'number' ? this.value : parseFloat(String(this.value));
  }

  public toBoolean(): boolean {
    return typeof this.value === 'boolean' ? this.value : Boolean(this.value);
  }
}