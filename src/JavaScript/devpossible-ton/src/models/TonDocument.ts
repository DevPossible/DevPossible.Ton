/**
 * TonDocument - Root document model
 * Copyright (c) 2024 DevPossible, LLC
 */

import { TonObject } from './TonObject';
import { TonArray } from './TonArray';
import { TonValue } from './TonValue';
import { TonSchemaCollection } from '../schema/TonSchemaCollection';
import { TonEnumDefinition } from '../schema/TonEnumDefinition';

export interface TonDocumentHeader {
  tonVersion?: string;
  [key: string]: any;
}

export class TonDocument {
  public root: TonObject | TonArray | TonValue;
  public header?: TonDocumentHeader;
  public schemas?: TonSchemaCollection & { enums?: TonEnumDefinition[] };

  constructor(root?: TonObject | TonArray | TonValue) {
    this.root = root || new TonObject();
  }

  public getRoot(): any {
    return this.toJSON();
  }

  public setRoot(root: TonObject | TonArray | TonValue): void {
    this.root = root;
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

  /**
   * Convenience property to get/set root as TonObject
   */
  public get rootObject(): TonObject {
    if (!(this.root instanceof TonObject)) {
      throw new Error('Root is not a TonObject');
    }
    return this.root;
  }

  public set rootObject(value: TonObject) {
    this.root = value;
  }

  /**
   * Gets a value at a path (e.g., "/property" or "/parent/child")
   */
  public getValue(path: string): any {
    if (path === '') {
      return null;
    }
    if (path === '/') {
      return this.root;
    }

    const parts = path.split('/').filter(p => p.length > 0);
    let current: any = this.root;

    for (const part of parts) {
      if (current instanceof TonObject) {
        // Try direct property access first
        let found = current.get(part);

        // If not found, try to find a child with matching className
        if (found === undefined) {
          const children = Array.from(current.properties.values());
          for (const child of children) {
            const childObj = child instanceof TonValue ? child.value : child;
            if (childObj instanceof TonObject && childObj.className === part) {
              found = childObj;
              break;
            }
          }
        }

        current = found;
      } else if (current instanceof TonArray) {
        const index = parseInt(part, 10);
        if (isNaN(index) || index < 0 || index >= current.items.length) {
          return null;
        }
        current = current.items[index];
      } else {
        return null;
      }

      if (current === undefined) {
        return null;
      }
    }

    // Unwrap TonValue
    if (current instanceof TonValue) {
      return current.getValue();
    }

    return current;
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
    // Import is handled at the top of the file if needed
    const { TonSerializer } = require('../serializer/TonSerializer');
    const serializer = new TonSerializer();
    return serializer.serialize(this);
  }

  /**
   * Creates a TonDocument from a plain JavaScript object
   */
  public static fromObject(obj: any): TonDocument {
    if (obj === null || obj === undefined) {
      return new TonDocument(new TonValue(obj));
    }
    if (Array.isArray(obj)) {
      const arr = new TonArray();
      arr.items = obj;
      return new TonDocument(arr);
    }
    if (typeof obj === 'object') {
      const tonObj = new TonObject();
      for (const [key, value] of Object.entries(obj)) {
        tonObj.set(key, value);
      }
      return new TonDocument(tonObj);
    }
    return new TonDocument(new TonValue(obj));
  }
}
