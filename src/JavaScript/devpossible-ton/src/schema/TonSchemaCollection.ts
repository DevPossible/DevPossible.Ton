/**
 * TonSchemaCollection - Legacy schema collection for backward compatibility
 * Copyright (c) 2024 DevPossible, LLC
 */

import { TonSchemaDefinition } from './TonSchema';
import { TonEnumDefinition } from './TonEnumDefinition';

export class TonSchemaCollection {
  private schemas: Map<string, TonSchemaDefinition> = new Map();
  private enums: Map<string, TonEnumDefinition> = new Map();

  public addSchema(nameOrSchema: string | TonSchemaDefinition, schema?: TonSchemaDefinition): void {
    if (typeof nameOrSchema === 'string' && schema) {
      this.schemas.set(nameOrSchema, schema);
    } else if (typeof nameOrSchema === 'object' && nameOrSchema.type) {
      // Use type as the name if only schema is provided
      this.schemas.set(nameOrSchema.type, nameOrSchema);
    }
  }

  public getSchema(name: string): TonSchemaDefinition | undefined {
    return this.schemas.get(name);
  }

  public hasSchema(name: string): boolean {
    return this.schemas.has(name);
  }

  public removeSchema(name: string): boolean {
    return this.schemas.delete(name);
  }

  public getAllSchemas(): Record<string, TonSchemaDefinition> {
    const result: Record<string, TonSchemaDefinition> = {};
    for (const [key, value] of this.schemas.entries()) {
      result[key] = value;
    }
    return result;
  }

  public addEnum(enumDef: TonEnumDefinition): void {
    this.enums.set(enumDef.name, enumDef);
  }

  public getEnum(name: string): TonEnumDefinition | undefined {
    return this.enums.get(name);
  }

  public getAllEnums(): TonEnumDefinition[] {
    return Array.from(this.enums.values());
  }
}
