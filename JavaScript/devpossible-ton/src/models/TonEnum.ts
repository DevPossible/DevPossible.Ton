/**
 * TonEnum - Enum model for TON
 * Copyright (c) 2024 DevPossible, LLC
 */

export class TonEnum {
  private values: string[];
  private isSingleValue: boolean;

  constructor(value: string | string[]) {
    if (typeof value === 'string') {
      this.values = [value];
      this.isSingleValue = true;
    } else {
      this.values = value;
      this.isSingleValue = false;
    }
  }

  public getValue(): string | string[] {
    return this.isSingleValue ? this.values[0] : this.values;
  }

  public getValues(): string[] {
    return this.values;
  }

  public contains(value: string): boolean {
    return this.values.includes(value);
  }

  public isSet(): boolean {
    return !this.isSingleValue;
  }

  public toJSON(): string | string[] {
    return this.getValue();
  }

  public toString(): string {
    if (this.isSingleValue) {
      return `|${this.values[0]}|`;
    }
    return this.values.map(v => `|${v}`).join('') + '|';
  }
}