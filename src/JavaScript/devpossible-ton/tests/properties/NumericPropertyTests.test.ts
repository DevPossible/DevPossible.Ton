/**
 * NumericPropertyTests
 * Copyright (c) 2024 DevPossible, LLC
 */

import { TonParser } from '../../src/parser/TonParser';
import { TonSerializer } from '../../src/serializer/TonSerializer';
import { TonDocument } from '../../src/models/TonDocument';
import { TonObject } from '../../src/models/TonObject';
import { TonValue } from '../../src/models/TonValue';
import { TonSerializeOptions } from '../../src/serializer/TonSerializeOptions';

describe('NumericPropertyTests', () => {
  let parser: TonParser;
  let serializer: TonSerializer;

  beforeEach(() => {
    parser = new TonParser();
    serializer = new TonSerializer();
  });

  test('should parse property names starting with numbers', () => {
    const ton = `{
      1property = 'value1',
      2ndProperty = 'value2',
      3rdItem = 'value3'
    }`;

    const document = parser.parse(ton);

    expect(document.rootObject.getProperty('1property')?.value).toBe('value1');
    expect(document.rootObject.getProperty('2ndProperty')?.value).toBe('value2');
    expect(document.rootObject.getProperty('3rdItem')?.value).toBe('value3');
  });

  test('should parse pure numeric property names', () => {
    const ton = `{
      123 = 'value123',
      456 = 'value456',
      789 = 'value789'
    }`;

    const document = parser.parse(ton);

    expect(document.rootObject.getProperty('123')?.value).toBe('value123');
    expect(document.rootObject.getProperty('456')?.value).toBe('value456');
    expect(document.rootObject.getProperty('789')?.value).toBe('value789');
  });

  test('should parse year property names', () => {
    const ton = `{
      2022 = 450000000,
      2023 = 520000000,
      2024 = 380000000
    }`;

    const document = parser.parse(ton);

    expect(document.rootObject.getProperty('2022')?.value).toBe(450000000);
    expect(document.rootObject.getProperty('2023')?.value).toBe(520000000);
    expect(document.rootObject.getProperty('2024')?.value).toBe(380000000);
  });

  test('should parse mixed property names', () => {
    const ton = `{
      name = 'John',
      123 = 'numeric',
      age = 30,
      2024 = 'year',
      active = true
    }`;

    const document = parser.parse(ton);

    expect(document.rootObject.properties.size).toBe(5); // properties is a Map, not an object
    expect(document.rootObject.getProperty('name')?.value).toBe('John');
    expect(document.rootObject.getProperty('123')?.value).toBe('numeric');
    expect(document.rootObject.getProperty('age')?.value).toBe(30);
    expect(document.rootObject.getProperty('2024')?.value).toBe('year');
    expect(document.rootObject.getProperty('active')?.value).toBe(true);
  });

  test('should parse nested objects with numeric properties', () => {
    const ton = `{
      financials = {
        revenue = {
          2022 = 450000000,
          2023 = 520000000,
          2024 = 380000000
        },
        expenses = {
          2022 = 400000000,
          2023 = 450000000,
          2024 = 320000000
        }
      }
    }`;

    const document = parser.parse(ton);

    const financialsValue = document.rootObject.getProperty('financials');
    const financials = financialsValue?.value || financialsValue as TonObject;
    expect(financials).not.toBeNull();

    const revenueValue = financials?.getProperty('revenue');
    const revenue = revenueValue?.value || revenueValue as TonObject;
    expect(revenue).not.toBeNull();
    const rev2022 = revenue?.getProperty('2022');
    expect(rev2022?.value || rev2022).toBe(450000000);
    const rev2023 = revenue?.getProperty('2023');
    expect(rev2023?.value || rev2023).toBe(520000000);
    const rev2024 = revenue?.getProperty('2024');
    expect(rev2024?.value || rev2024).toBe(380000000);

    const expensesValue = financials?.getProperty('expenses');
    const expenses = expensesValue?.value || expensesValue as TonObject;
    expect(expenses).not.toBeNull();
    const exp2022 = expenses?.getProperty('2022');
    expect(exp2022?.value || exp2022).toBe(400000000);
    const exp2023 = expenses?.getProperty('2023');
    expect(exp2023?.value || exp2023).toBe(450000000);
    const exp2024 = expenses?.getProperty('2024');
    expect(exp2024?.value || exp2024).toBe(320000000);
  });

  test('should serialize numeric property names', () => {
    const document = new TonDocument();
    document.rootObject = new TonObject();
    document.rootObject.set('2022', TonValue.from(100));
    document.rootObject.set('2023', TonValue.from(200));
    document.rootObject.set('2024', TonValue.from(300));
    document.rootObject.set('123', TonValue.from('test'));
    document.rootObject.set('regular', TonValue.from('value'));

    const serialized = serializer.serializeDocument(document, TonSerializeOptions.default());
    const reparsed = parser.parse(serialized);

    expect(reparsed.rootObject.getProperty('2022')?.value).toBe(100);
    expect(reparsed.rootObject.getProperty('2023')?.value).toBe(200);
    expect(reparsed.rootObject.getProperty('2024')?.value).toBe(300);
    expect(reparsed.rootObject.getProperty('123')?.value).toBe('test');
    expect(reparsed.rootObject.getProperty('regular')?.value).toBe('value');
  });

  test('should handle float-like property names', () => {
    const ton = `{
      3.14 = 'pi',
      2.71 = 'e',
      1.618 = 'golden'
    }`;

    const document = parser.parse(ton);

    // Float-like numbers (3.14) are parsed as Number tokens and accepted as property names
    expect(document.rootObject.getProperty('3.14')?.value).toBe('pi');
    expect(document.rootObject.getProperty('2.71')?.value).toBe('e');
    expect(document.rootObject.getProperty('1.618')?.value).toBe('golden');
  });

  test('should round trip numeric properties', () => {
    const originalTon = `{
      2022 = 450000000,
      2023 = 520000000,
      2024 = 380000000,
      name = 'Financial Data',
      123 = 'test'
    }`;

    const document = parser.parse(originalTon);
    const serialized = serializer.serializeDocument(document, TonSerializeOptions.default());
    const reparsed = parser.parse(serialized);

    expect(reparsed.rootObject.properties.size).toBe(5); // properties is a Map, not an object
    expect(reparsed.rootObject.getProperty('2022')?.value).toBe(450000000);
    expect(reparsed.rootObject.getProperty('2023')?.value).toBe(520000000);
    expect(reparsed.rootObject.getProperty('2024')?.value).toBe(380000000);
    expect(reparsed.rootObject.getProperty('name')?.value).toBe('Financial Data');
    expect(reparsed.rootObject.getProperty('123')?.value).toBe('test');
  });
});