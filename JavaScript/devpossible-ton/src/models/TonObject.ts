/**
 * TonObject - Object model for TON
 * Copyright (c) 2024 DevPossible, LLC
 */

export class TonObject {
  private properties: Map<string, any> = new Map();
  public className?: string;
  public instanceCount?: number;

  public set(key: string, value: any): void {
    this.properties.set(key, value);
  }

  public get(key: string): any {
    return this.properties.get(key);
  }

  public has(key: string): boolean {
    return this.properties.has(key);
  }

  public delete(key: string): boolean {
    return this.properties.delete(key);
  }

  public keys(): string[] {
    return Array.from(this.properties.keys());
  }

  public values(): any[] {
    return Array.from(this.properties.values());
  }

  public entries(): [string, any][] {
    return Array.from(this.properties.entries());
  }

  public size(): number {
    return this.properties.size;
  }

  public toJSON(): any {
    const result: any = {};

    for (const [key, value] of this.properties) {
      if (value && typeof value.toJSON === 'function') {
        result[key] = value.toJSON();
      } else if (value && typeof value.getValue === 'function') {
        result[key] = value.getValue();
      } else {
        result[key] = value;
      }
    }

    return result;
  }
}