/**
 * TonSerializeOptions - Options for serializing TON format
 * Copyright (c) 2024 DevPossible, LLC
 */

export enum TonFormatStyle {
  Compact = 'compact',
  Pretty = 'pretty'
}

export interface TonSerializeOptions {
  /**
   * The formatting style to use
   */
  formatStyle?: TonFormatStyle;

  /**
   * Size of indentation in spaces (for pretty format)
   */
  indentSize?: number;

  /**
   * Character to use for indentation (' ' or '\t')
   */
  indentChar?: string;

  /**
   * Whether to include type hints ($, %, &, ^)
   */
  includeTypeHints?: boolean;

  /**
   * Whether to include the TON header
   */
  includeHeader?: boolean;

  /**
   * The TON version to include in the header
   */
  tonVersion?: string;

  /**
   * Whether to omit properties with null values
   */
  omitNulls?: boolean;

  /**
   * Whether to omit properties with undefined values
   */
  omitUndefined?: boolean;

  /**
   * Whether to sort object properties alphabetically
   */
  sortProperties?: boolean;

  /**
   * Quote style for strings ('single' or 'double')
   */
  quoteStyle?: 'single' | 'double';

  /**
   * Line ending to use ('\n' or '\r\n')
   */
  lineEnding?: string;

  /**
   * Whether to include trailing commas
   */
  trailingCommas?: boolean;

  /**
   * Maximum line length for compact format
   */
  maxLineLength?: number;

  /**
   * Whether to preserve comments
   */
  preserveComments?: boolean;
}