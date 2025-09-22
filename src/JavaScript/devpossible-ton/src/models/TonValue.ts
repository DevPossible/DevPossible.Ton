/**
 * TonValue - Value model for TON
 * Copyright (c) 2024 DevPossible, LLC
 */

export class TonValue {
  private value: any;
  public typeHint?: string;

  constructor(value: any, typeHint?: string) {
    this.value = value;
    this.typeHint = typeHint;
  }

  public getValue(): any {
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

  public toJSON(): any {
    return this.value;
  }

  public toString(): string {
    return String(this.value);
  }
}