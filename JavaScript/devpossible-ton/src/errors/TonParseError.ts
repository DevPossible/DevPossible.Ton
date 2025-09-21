/**
 * TonParseError - Parse error for TON format
 * Copyright (c) 2024 DevPossible, LLC
 */

export class TonParseError extends Error {
  public line: number;
  public column: number;

  constructor(message: string, line: number, column: number) {
    super(`Parse error at line ${line}, column ${column}: ${message}`);
    this.name = 'TonParseError';
    this.line = line;
    this.column = column;
  }
}