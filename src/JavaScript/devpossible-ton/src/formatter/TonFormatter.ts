/**
 * TonFormatter - Code formatter for TON format
 * Copyright (c) 2024 DevPossible, LLC
 */

import { TonParser } from '../parser/TonParser';
import { TonSerializer } from '../serializer/TonSerializer';
import { TonSerializeOptions, TonFormatStyle } from '../serializer/TonSerializeOptions';

export interface TonFormatterOptions {
  style?: TonFormatStyle;
  indentSize?: number;
  indentChar?: string;
  sortProperties?: boolean;
  preserveComments?: boolean;
  trailingCommas?: boolean;
  quoteStyle?: 'single' | 'double';
  lineEnding?: string;
  maxLineLength?: number;
}

export class TonFormatter {
  private options: TonFormatterOptions;

  constructor(options?: TonFormatterOptions) {
    this.options = {
      style: TonFormatStyle.Pretty,
      indentSize: 4,
      indentChar: ' ',
      sortProperties: false,
      preserveComments: true,
      trailingCommas: false,
      quoteStyle: 'single',
      lineEnding: '\n',
      maxLineLength: 80,
      ...options
    };
  }

  /**
   * Formats TON content
   */
  public format(content: string): string {
    try {
      // Parse the content
      const parser = new TonParser();
      const document = parser.parse(content);

      // If we need to preserve comments, we need a different approach
      if (this.options.preserveComments) {
        return this.formatWithComments(content);
      }

      // Use the serializer to format
      const serializeOptions: TonSerializeOptions = {
        formatStyle: this.options.style,
        indentSize: this.options.indentSize,
        indentChar: this.options.indentChar,
        sortProperties: this.options.sortProperties,
        trailingCommas: this.options.trailingCommas,
        quoteStyle: this.options.quoteStyle,
        lineEnding: this.options.lineEnding,
        includeHeader: true,
        includeTypeHints: true,
        omitNulls: false,
        omitUndefined: false
      };

      const serializer = new TonSerializer(serializeOptions);
      return serializer.serialize(document);
    } catch (error) {
      // If parsing fails, return original content
      console.error('Failed to format TON content:', error);
      return content;
    }
  }

  /**
   * Formats TON content while preserving comments
   */
  private formatWithComments(content: string): string {
    // This is a simplified version - a full implementation would need
    // to track comment positions and reinsert them appropriately
    const lines = content.split(/\r?\n/);
    const formatted: string[] = [];
    let depth = 0;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) {
        if (this.options.style === TonFormatStyle.Pretty) {
          formatted.push('');
        }
        continue;
      }

      // Handle comments
      if (trimmed.startsWith('//')) {
        formatted.push(this.getIndent(depth) + trimmed);
        continue;
      }

      // Handle block comments
      if (trimmed.startsWith('/*')) {
        formatted.push(this.getIndent(depth) + trimmed);
        continue;
      }

      // Adjust depth for braces
      const openBraces = (trimmed.match(/\{/g) || []).length;
      const closeBraces = (trimmed.match(/\}/g) || []).length;
      const openBrackets = (trimmed.match(/\[/g) || []).length;
      const closeBrackets = (trimmed.match(/\]/g) || []).length;

      const depthBefore = depth;
      depth += openBraces + openBrackets;
      depth -= closeBraces + closeBrackets;

      // Use appropriate indentation
      const currentIndent = closeBraces > 0 || closeBrackets > 0 ?
        Math.min(depthBefore, depth) : depthBefore;

      if (this.options.style === TonFormatStyle.Pretty) {
        formatted.push(this.getIndent(currentIndent) + trimmed);
      } else {
        // Compact style - join lines
        if (formatted.length > 0 && !trimmed.startsWith('#')) {
          const last = formatted[formatted.length - 1];
          if (!last.endsWith('{') && !last.endsWith('[')) {
            formatted[formatted.length - 1] = last + ' ' + trimmed;
          } else {
            formatted[formatted.length - 1] = last + trimmed;
          }
        } else {
          formatted.push(trimmed);
        }
      }
    }

    return formatted.join(this.options.lineEnding);
  }

  /**
   * Gets indentation string for a given depth
   */
  private getIndent(depth: number): string {
    if (this.options.style === TonFormatStyle.Compact) {
      return '';
    }
    return (this.options.indentChar || ' ').repeat((this.options.indentSize || 4) * depth);
  }

  /**
   * Validates that the formatted content is equivalent to original
   */
  public validate(original: string, formatted: string): boolean {
    try {
      const parser = new TonParser();
      const originalDoc = parser.parse(original);
      const formattedDoc = parser.parse(formatted);

      // Compare the JSON representations
      const originalJson = JSON.stringify(originalDoc.toJSON());
      const formattedJson = JSON.stringify(formattedDoc.toJSON());

      return originalJson === formattedJson;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Static helper functions
 */
export namespace TonFormatter {
  /**
   * Format TON content with default pretty style
   */
  export function pretty(content: string): string {
    const formatter = new TonFormatter({ style: TonFormatStyle.Pretty });
    return formatter.format(content);
  }

  /**
   * Format TON content with compact style
   */
  export function compact(content: string): string {
    const formatter = new TonFormatter({ style: TonFormatStyle.Compact });
    return formatter.format(content);
  }

  /**
   * Format and sort properties alphabetically
   */
  export function sorted(content: string): string {
    const formatter = new TonFormatter({
      style: TonFormatStyle.Pretty,
      sortProperties: true
    });
    return formatter.format(content);
  }
}