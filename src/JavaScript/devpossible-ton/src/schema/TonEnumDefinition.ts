/**
 * TonEnumDefinition - Defines an enum type for schema validation
 * Copyright (c) 2024 DevPossible, LLC
 */

export interface TonEnumDefinition {
  name: string;
  values: string[];
  description?: string;
}

export class TonEnumDefinition implements TonEnumDefinition {
  public name: string;
  public values: string[];
  public description?: string;

  constructor(name: string, values: string[], description?: string) {
    this.name = name;
    this.values = values;
    this.description = description;
  }

  /**
   * Validates if a value is in this enum
   */
  public isValid(value: string): boolean {
    return this.values.includes(value);
  }

  /**
   * Alias for isValid - validates if a value is in this enum
   */
  public isValidValue(value: string): boolean {
    return this.isValid(value);
  }

  /**
   * Creates a TonEnumDefinition from a configuration object
   */
  public static from(config: { name: string; values: string[]; description?: string }): TonEnumDefinition {
    return new TonEnumDefinition(config.name, config.values, config.description);
  }
}
