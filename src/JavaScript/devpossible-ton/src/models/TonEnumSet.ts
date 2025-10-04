/**
 * TonEnumSet - Represents a set of enum values
 * Copyright (c) 2024 DevPossible, LLC
 */

import { TonEnum } from './TonEnum';

/**
 * TonEnumSet is an alias for TonEnum with multiple values
 */
export class TonEnumSet extends TonEnum {
  constructor(values: string[]) {
    super(values);
  }

  /**
   * Creates a TonEnumSet from an array of values
   */
  public static from(values: string[]): TonEnumSet {
    return new TonEnumSet(values);
  }
}
