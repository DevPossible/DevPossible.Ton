/**
 * Array Operations Example
 * Copyright (c) 2024 DevPossible, LLC
 */

import * as ton from '../../devpossible-ton/dist/index.esm.js';

export async function run() {
  console.log('=== Array Operations Example ===\n');

  // Example 1: Basic array parsing
  console.log('1. Basic array parsing:');
  const arrayTon = `{
    numbers = [1, 2, 3, 4, 5],
    strings = ['apple', 'banana', 'cherry'],
    mixed = [42, 'text', true, null, 3.14]
  }`;

  const parser = new ton.TonParser();
  const doc = parser.parse(arrayTon);
  const root = doc.getRoot();

  const numbers = root.get('numbers');
  console.log('   Numbers array:', numbers);

  const strings = root.get('strings');
  console.log('   Strings array:', strings);

  const mixed = root.get('mixed');
  console.log('   Mixed array has', mixed.length, 'elements');

  // Example 2: Arrays with type hints
  console.log('\n2. Arrays with type hints:');
  const typedArrayTon = `{
    integers = [%1, 2, 3, 4, 5],
    floats = [^1.1, 2.2, 3.3, 4.4],
    strings = ['$hello', 'world'],
    booleans = [&true, false, true]
  }`;

  const typedDoc = parser.parse(typedArrayTon);
  const typedRoot = typedDoc.getRoot();

  console.log('   Integer array:', typedRoot.get('integers'));
  console.log('   Float array:', typedRoot.get('floats'));

  // Example 3: Nested arrays
  console.log('\n3. Nested arrays:');
  const nestedTon = `{
    matrix = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9]
    ],
    jagged = [
      [1],
      [2, 3],
      [4, 5, 6],
      [7, 8, 9, 10]
    ]
  }`;

  const nestedDoc = parser.parse(nestedTon);
  const nestedRoot = nestedDoc.getRoot();
  const matrix = nestedRoot.get('matrix');

  if (matrix && matrix.length > 0) {
    console.log(`   Matrix dimensions: ${matrix.length}x${matrix[0].length}`);
  }

  const jagged = nestedRoot.get('jagged');
  console.log('   Jagged array row lengths:');
  jagged.forEach(row => {
    console.log(`     Row with ${row.length} elements`);
  });

  // Example 4: Arrays of objects
  console.log('\n4. Arrays of objects:');
  const objectArrayTon = `{
    users = [
      { name = 'Alice', age = 30, role = |admin| },
      { name = 'Bob', age = 25, role = |user| },
      { name = 'Charlie', age = 35, role = |moderator| }
    ],
    products = [
      {(Product) id = 1, name = 'Laptop', price = 999.99 },
      {(Product) id = 2, name = 'Mouse', price = 29.99 },
      {(Product) id = 3, name = 'Keyboard', price = 79.99 }
    ]
  }`;

  const objectArrayDoc = parser.parse(objectArrayTon);
  const objectRoot = objectArrayDoc.getRoot();
  const users = objectRoot.get('users');

  console.log('   Users:');
  users.forEach(user => {
    console.log(`     - ${user.name}, Age: ${user.age}, Role: ${user.role}`);
  });

  const products = objectRoot.get('products');
  console.log('\n   Products:');
  products.forEach(product => {
    console.log(`     - ${product.name}: $${product.price}`);
  });

  // Example 5: Array serialization
  console.log('\n5. Array serialization:');
  const testDoc = new ton.TonDocument();
  testDoc.setRoot({
    compact: [1, 2, 3],
    typed: [100, 200, 300],
    multiline: [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' }
    ]
  });

  const serializer = new ton.TonSerializer();
  const serialized = serializer.serialize(testDoc);
  console.log('   Serialized arrays:');
  console.log('   ' + serialized.replace(/\n/g, '\n   '));
}
