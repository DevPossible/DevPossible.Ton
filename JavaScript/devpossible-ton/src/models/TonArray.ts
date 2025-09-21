/**
 * TonArray - Array model for TON
 * Copyright (c) 2024 DevPossible, LLC
 */

export class TonArray {
  private items: any[] = [];

  public add(value: any): void {
    this.items.push(value);
  }

  public get(index: number): any {
    return this.items[index];
  }

  public set(index: number, value: any): void {
    this.items[index] = value;
  }

  public length(): number {
    return this.items.length;
  }

  public toArray(): any[] {
    return [...this.items];
  }

  public toJSON(): any[] {
    return this.items.map(item => {
      if (item && typeof item.toJSON === 'function') {
        return item.toJSON();
      } else if (item && typeof item.getValue === 'function') {
        return item.getValue();
      } else {
        return item;
      }
    });
  }
}