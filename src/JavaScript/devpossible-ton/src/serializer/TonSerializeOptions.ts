/**
 * TonSerializeOptions - Options for serializing TON format
 * Copyright (c) 2024 DevPossible, LLC
 */

export enum TonFormatStyle {
  Compact = 'compact',
  Pretty = 'pretty'
}

export interface ITonSerializeOptions {
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

  /**
   * Whether to use @ prefix for properties
   */
  useAtPrefix?: boolean;

  /**
   * Whether to use multi-line string literals
   */
  useMultiLineStrings?: boolean;

  /**
   * Minimum number of lines to trigger multi-line string formatting
   */
  multiLineStringThreshold?: number;

  /**
   * Whether to omit empty collections
   */
  omitEmptyCollections?: boolean;

  /**
   * Property separator (':' or '=')
   */
  propertySeparator?: string;

  /**
   * Array item separator (',' or ', ')
   */
  arraySeparator?: string;
}

/**
 * Class-based serialization options with static presets (matches C# implementation)
 */
export class TonSerializeOptions implements ITonSerializeOptions {
  formatStyle?: TonFormatStyle = TonFormatStyle.Pretty;
  indentSize?: number = 4;
  indentChar?: string = ' ';
  includeTypeHints?: boolean = false;
  includeHeader?: boolean = false;
  tonVersion?: string = '1';
  omitNulls?: boolean = false;
  omitUndefined?: boolean = true;
  sortProperties?: boolean = false;
  quoteStyle?: 'single' | 'double' = 'single';
  lineEnding?: string = '\n';
  trailingCommas?: boolean = false;
  maxLineLength?: number = 0;
  preserveComments?: boolean = false;
  useAtPrefix?: boolean = false;
  useMultiLineStrings?: boolean = true;
  multiLineStringThreshold?: number = 2;
  omitEmptyCollections?: boolean = false;
  propertySeparator?: string = ' = ';
  arraySeparator?: string;

  constructor(options?: Partial<ITonSerializeOptions>) {
    if (options) {
      Object.assign(this, options);

      // Apply format-specific defaults if not explicitly set
      if (options.formatStyle === TonFormatStyle.Compact) {
        if (options.propertySeparator === undefined) {
          this.propertySeparator = ' = ';  // TON-style per Gherkin spec
        }
        if (options.quoteStyle === undefined) {
          this.quoteStyle = 'single';  // TON-style per Gherkin spec
        }
      } else if (options.formatStyle === TonFormatStyle.Pretty) {
        if (options.propertySeparator === undefined) {
          this.propertySeparator = ': ';
        }
        if (options.quoteStyle === undefined) {
          this.quoteStyle = 'double';
        }
      }
    }
  }

  /**
   * Default serialization options
   */
  static get Default(): TonSerializeOptions {
    return new TonSerializeOptions();
  }

  /**
   * Default serialization options (lowercase method for compatibility)
   */
  static default(): TonSerializeOptions {
    return new TonSerializeOptions();
  }

  /**
   * Compact serialization options (no formatting)
   */
  static get Compact(): TonSerializeOptions {
    return new TonSerializeOptions({
      formatStyle: TonFormatStyle.Compact,
      indentSize: 0,
      indentChar: '',
      includeHeader: false,
      includeTypeHints: false,
      omitNulls: true,
      omitUndefined: true,
      omitEmptyCollections: true,
      useMultiLineStrings: false,
      sortProperties: false,
      propertySeparator: ' = ',  // Use TON-style separator per Gherkin spec
      quoteStyle: 'single'       // Use single quotes per Gherkin spec
    });
  }

  /**
   * Compact serialization options (lowercase method for compatibility)
   */
  static compact(): TonSerializeOptions {
    return TonSerializeOptions.Compact;
  }

  /**
   * Pretty-print serialization options
   */
  static get Pretty(): TonSerializeOptions {
    return new TonSerializeOptions({
      formatStyle: TonFormatStyle.Pretty,
      indentSize: 4,
      indentChar: ' ',
      sortProperties: false,
      includeHeader: false,
      includeTypeHints: false,
      useMultiLineStrings: true,
      propertySeparator: ': ',
      quoteStyle: 'double',
      trailingCommas: false
    });
  }

  /**
   * Optimized serialization options with hints
   */
  static get Optimized(): TonSerializeOptions {
    return new TonSerializeOptions({
      includeTypeHints: true,
      sortProperties: true
    });
  }
}