/**
 * Error Handling Example
 * Copyright (c) 2024 DevPossible, LLC
 */

import * as ton from '../../devpossible-ton/dist/index.esm.js';

export async function run() {
  console.log('=== Error Handling Example ===\n');

  const parser = new ton.TonParser();

  // Example 1: Parse error handling
  console.log('1. Handling parse errors:');
  const invalidTon = `{ name = unclosed string`;
  
  try {
    parser.parse(invalidTon);
    console.log('   No error (unexpected)');
  } catch (error) {
    console.log('   ✓ Parse error caught:', error.message);
  }

  // Example 2: Missing properties
  console.log('\n2. Handling missing properties:');
  const partialTon = `{ firstName = "John" }`;
  const doc = parser.parse(partialTon);
  const data = doc.toJSON();
  
  console.log('   First Name:', data.firstName);
  console.log('   Last Name (undefined):', data.lastName || 'N/A');

  // Example 3: Type mismatches
  console.log('\n3. Handling type mismatches:');
  const typeMismatch = `{ age = "not a number" }`;
  const typeDoc = parser.parse(typeMismatch);
  const typeData = typeDoc.toJSON();
  
  console.log('   Age value:', typeData.age);
  console.log('   Type:', typeof typeData.age);

  // Example 4: Validation errors
  console.log('\n4. Schema validation errors:');
  const invalidData = `{ name = "Test", age = -5 }`;
  const invalidDoc = parser.parse(invalidData);
  
  const schema = {
    type: 'object',
    required: ['name', 'age', 'email'],
    properties: {
      age: { type: 'number', minimum: 0 }
    }
  };
  
  const validator = new ton.TonValidator();
  const result = validator.validate(invalidDoc, schema);
  
  if (!result.isValid) {
    console.log('   ✓ Validation errors detected:');
    result.errors.forEach(err => console.log('     -', err));
  }

  // Example 5: Safe parsing
  console.log('\n5. Safe parsing with try-catch:');
  const testInputs = [
    '{ valid = true }',
    '{ invalid syntax',
    '{ another = "valid" }'
  ];
  
  testInputs.forEach((input, i) => {
    try {
      parser.parse(input);
      console.log(`   Input ${i + 1}: ✓ Valid`);
    } catch (error) {
      console.log(`   Input ${i + 1}: ✗ Invalid - ${error.message}`);
    }
  });
}
