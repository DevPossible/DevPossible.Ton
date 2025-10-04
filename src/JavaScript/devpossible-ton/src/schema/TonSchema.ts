/**
 * TonSchema - Legacy schema types for backward compatibility
 * Copyright (c) 2024 DevPossible, LLC
 */

export enum ValidationRuleType {
  Required = 'required',
  Type = 'type',
  MinLength = 'minLength',
  MaxLength = 'maxLength',
  Minimum = 'minimum',
  Maximum = 'maximum',
  Pattern = 'pattern',
  Enum = 'enum',
  Unique = 'unique',
  Sorted = 'sorted',
  MinCount = 'minCount',
  MaxCount = 'maxCount',
  NonEmpty = 'nonEmpty'
}

export interface TonValidationRule {
  type: ValidationRuleType;
  value?: any;
  message?: string;
}

export class TonValidationRule implements TonValidationRule {
  public type: ValidationRuleType;
  public value?: any;
  public message?: string;

  constructor(type: ValidationRuleType, value?: any, message?: string) {
    this.type = type;
    this.value = value;
    this.message = message;
  }
}

export interface TonPropertySchema {
  type?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  enum?: any[];
  properties?: Record<string, TonPropertySchema>;
  items?: TonPropertySchema;
}

export class TonPropertySchema implements TonPropertySchema {
  public type?: string;
  public required?: boolean;
  public minLength?: number;
  public maxLength?: number;
  public minimum?: number;
  public maximum?: number;
  public pattern?: string;
  public enum?: any[];
  public properties?: Record<string, TonPropertySchema>;
  public items?: TonPropertySchema;
  private validations: TonValidationRule[] = [];

  constructor(_path: string, type?: string) {
    this.type = type;
  }

  public addValidation(rule: TonValidationRule): void {
    this.validations.push(rule);
  }

  public getValidations(): TonValidationRule[] {
    return this.validations;
  }
}

export interface TonSchemaDefinition {
  type: string;
  required?: string[];
  properties?: Record<string, TonPropertySchema>;
  additionalProperties?: boolean;
}

export class TonSchemaDefinition implements TonSchemaDefinition {
  public type: string;
  public required?: string[];
  public properties?: Record<string, TonPropertySchema>;
  public additionalProperties?: boolean;

  constructor(type: string) {
    this.type = type;
    this.properties = {};
  }

  public addProperty(name: string, schema: TonPropertySchema): void {
    if (!this.properties) {
      this.properties = {};
    }
    this.properties[name] = schema;
  }
}
