/**
 * TonEnum - Enum model for TON
 * Copyright (c) 2024 DevPossible, LLC
 */

export class TonEnum {
  public values: string | string[];
  private isSingleValue: boolean;

  constructor(value: string | string[]) {
    this.values = value;
    this.isSingleValue = typeof value === 'string';
  }

  public getValue(): string | string[] {
    return this.values;
  }

  public getValues(): string[] {
    return this.isSingleValue ? [this.values as string] : this.values as string[];
  }

  public contains(value: string): boolean {
    if (this.isSingleValue) {
      return this.values === value;
    }
    return (this.values as string[]).includes(value);
  }

  public isSet(): boolean {
    return !this.isSingleValue;
  }

  public toJSON(): string | string[] {
    return this.getValue();
  }

  public toString(): string {
    if (this.isSingleValue) {
      return `|${this.values}|`;
    }
    return (this.values as string[]).map(v => `|${v}`).join('') + '|';
  }
}