/**
 * TonObject - Object model for TON
 * Copyright (c) 2024 DevPossible, LLC
 */

export class TonObject {
  public properties: Map<string, any> = new Map();
  public className?: string;
  public instanceCount?: number;

  constructor(className?: string, instanceCount?: number) {
    this.className = className;
    this.instanceCount = instanceCount;
  }

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

  /**
   * Alias for set() - for compatibility with tests
   */
  public setProperty(key: string, value: any): void {
    this.set(key, value);
  }

  /**
   * Alias for get() - for compatibility with tests
   */
  public getProperty(key: string): any {
    return this.get(key);
  }

  /**
   * Adds a child object (for compatibility with tests that expect children array)
   */
  public addChild(child: TonObject): void {
    // For now, just add it as a numbered property
    const childIndex = this.children.length;
    this.set(`child${childIndex}`, child);
  }

  /**
   * Gets children (for compatibility with tests)
   */
  public get children(): TonObject[] {
    const children: TonObject[] = [];
    for (const value of this.properties.values()) {
      // Handle both wrapped and unwrapped TonObjects
      if (value instanceof TonObject) {
        children.push(value);
      } else if (value && typeof value === 'object' && value.value instanceof TonObject) {
        children.push(value.value);
      }
    }
    return children;
  }

  public toJSON(): any {
    const result: any = {};

    // Add className and instanceCount if present
    if (this.className) {
      result._className = this.className;
    }
    if (this.instanceCount !== undefined) {
      result._instanceId = this.instanceCount;
    }

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