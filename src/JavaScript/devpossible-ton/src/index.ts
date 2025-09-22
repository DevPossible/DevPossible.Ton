/**
 * DevPossible.Ton - JavaScript/TypeScript Library
 * Copyright (c) 2024 DevPossible, LLC. All rights reserved.
 * Author: DevPossible, LLC <support@devpossible.com>
 * Website: https://tonspec.com
 */

// Export lexer
export { TonLexer, Token, TokenType } from './lexer/TonLexer';

// Export parser
export { TonParser } from './parser/TonParser';
export { TonParseOptions } from './parser/TonParseOptions';

// Export models
export { TonDocument } from './models/TonDocument';
export { TonObject } from './models/TonObject';
export { TonValue } from './models/TonValue';
export { TonArray } from './models/TonArray';
export { TonEnum } from './models/TonEnum';

// Export serializer
export { TonSerializer } from './serializer/TonSerializer';
export { TonSerializeOptions, TonFormatStyle } from './serializer/TonSerializeOptions';

// Export validator
export { TonValidator, ValidationResult, ValidationError, SchemaRule, TonSchema, SchemaRules } from './validator/TonValidator';

// Export formatter
export { TonFormatter, TonFormatterOptions } from './formatter/TonFormatter';

// Export errors
export { TonParseError } from './errors/TonParseError';

// Convenience functions
import { TonParser } from './parser/TonParser';
import { TonSerializer } from './serializer/TonSerializer';
import { TonFormatStyle } from './serializer/TonSerializeOptions';
import { TonValidator } from './validator/TonValidator';
import { TonFormatter } from './formatter/TonFormatter';
import { TonDocument } from './models/TonDocument';
import { TonObject } from './models/TonObject';
import { TonArray } from './models/TonArray';
import { TonValue } from './models/TonValue';
import { TonEnum } from './models/TonEnum';

/**
 * Parse a TON string into a TonDocument
 */
export function parse(input: string): any {
  const parser = new TonParser();
  const doc = parser.parse(input);
  return doc.toJSON();
}

/**
 * Stringify an object to TON format
 */
export function stringify(obj: any, pretty: boolean = true): string {
  const serializer = new TonSerializer({
    formatStyle: pretty ? TonFormatStyle.Pretty : TonFormatStyle.Compact
  });
  return serializer.serialize(obj);
}

// Default export
export default {
  parse,
  stringify,
  TonParser,
  TonSerializer,
  TonValidator,
  TonFormatter,
  TonDocument,
  TonObject,
  TonArray,
  TonValue,
  TonEnum
};