/**
 * TonDocument - Root document model
 * Copyright (c) 2024 DevPossible, LLC
 */

import { TonObject } from './TonObject';
import { TonArray } from './TonArray';
import { TonValue } from './TonValue';

export class TonDocument {
  private root: TonObject | TonArray | TonValue;

  constructor(root: TonObject | TonArray | TonValue) {
    this.root = root;
  }

  public getRoot(): TonObject | TonArray | TonValue {
    return this.root;
  }

  public isObject(): boolean {
    return this.root instanceof TonObject;
  }

  public isArray(): boolean {
    return this.root instanceof TonArray;
  }

  public isValue(): boolean {
    return this.root instanceof TonValue;
  }

  public asObject(): TonObject | undefined {
    return this.root instanceof TonObject ? this.root : undefined;
  }

  public asArray(): TonArray | undefined {
    return this.root instanceof TonArray ? this.root : undefined;
  }

  public asValue(): TonValue | undefined {
    return this.root instanceof TonValue ? this.root : undefined;
  }

  public toJSON(): any {
    if (this.root instanceof TonObject) {
      return this.root.toJSON();
    } else if (this.root instanceof TonArray) {
      return this.root.toJSON();
    } else if (this.root instanceof TonValue) {
      return this.root.getValue();
    }
    return null;
  }

  public toString(): string {
    return JSON.stringify(this.toJSON(), null, 2);
  }
}