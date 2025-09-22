/**
 * TonParseOptions - Options for parsing TON documents
 * Copyright (c) 2024 DevPossible, LLC
 */

export interface TonParseOptions {
  /**
   * Whether to allow comments in the TON document
   */
  allowComments?: boolean;

  /**
   * Whether to allow trailing commas in objects and arrays
   */
  allowTrailingCommas?: boolean;

  /**
   * Whether to preserve type annotations
   */
  preserveTypeAnnotations?: boolean;

  /**
   * Whether to preserve type hints ($, %, &, ^)
   */
  preserveTypeHints?: boolean;

  /**
   * Whether to validate the document during parsing
   */
  validate?: boolean;

  /**
   * Maximum depth for nested structures
   */
  maxDepth?: number;

  /**
   * Whether to throw on duplicate keys
   */
  strictDuplicateKeys?: boolean;
}