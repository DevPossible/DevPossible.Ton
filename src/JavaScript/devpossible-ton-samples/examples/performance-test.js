/**
 * Performance Test Example
 * Copyright (c) 2024 DevPossible, LLC
 */

import * as ton from '../../devpossible-ton/dist/index.esm.js';

export async function run() {
  console.log('=== Performance Test Example ===\n');

  const parser = new ton.TonParser();
  const serializer = new ton.TonSerializer();

  // Example 1: Large array parsing
  console.log('1. Large array performance test:');
  const largeArray = Array.from({ length: 1000 }, (_, i) => i);
  const arrayDoc = new ton.TonDocument();
  arrayDoc.setRoot({ numbers: largeArray });
  
  const startArray = Date.now();
  const arraySerialized = serializer.serialize(arrayDoc);
  const arrayParsed = parser.parse(arraySerialized);
  const arrayTime = Date.now() - startArray;
  
  console.log(`   Array with ${largeArray.length} items`);
  console.log(`   Serialization + parsing time: ${arrayTime}ms`);

  // Example 2: Deep nesting
  console.log('\n2. Deep nesting performance test:');
  let deepObj = { value: 'end' };
  for (let i = 0; i < 50; i++) {
    deepObj = { nested: deepObj };
  }
  
  const deepDoc = new ton.TonDocument();
  deepDoc.setRoot(deepObj);
  
  const startDeep = Date.now();
  const deepSerialized = serializer.serialize(deepDoc);
  const deepParsed = parser.parse(deepSerialized);
  const deepTime = Date.now() - startDeep;
  
  console.log(`   Nesting depth: 50 levels`);
  console.log(`   Processing time: ${deepTime}ms`);

  // Example 3: Multiple small documents
  console.log('\n3. Multiple documents test:');
  const docCount = 100;
  const startMulti = Date.now();
  
  for (let i = 0; i < docCount; i++) {
    const data = { id: i, name: `Item${i}`, value: i * 10 };
    const doc = new ton.TonDocument();
    doc.setRoot(data);
    const serialized = serializer.serialize(doc);
    parser.parse(serialized);
  }
  
  const multiTime = Date.now() - startMulti;
  
  console.log(`   Processed ${docCount} documents`);
  console.log(`   Total time: ${multiTime}ms`);
  console.log(`   Average per document: ${(multiTime / docCount).toFixed(2)}ms`);

  // Example 4: Complex object benchmark
  console.log('\n4. Complex object benchmark:');
  const complexData = {
    users: Array.from({ length: 50 }, (_, i) => ({
      id: i,
      name: `User${i}`,
      email: `user${i}@example.com`,
      profile: {
        age: 20 + i,
        country: 'USA',
        interests: ['tech', 'science', 'art']
      }
    })),
    metadata: {
      created: new Date().toISOString(),
      version: '1.0.0'
    }
  };
  
  const complexDoc = new ton.TonDocument();
  complexDoc.setRoot(complexData);
  
  const startComplex = Date.now();
  const complexSerialized = serializer.serialize(complexDoc);
  const complexParsed = parser.parse(complexSerialized);
  const complexTime = Date.now() - startComplex;
  
  console.log(`   Objects: ${complexData.users.length} users with nested data`);
  console.log(`   Serialized size: ${complexSerialized.length} characters`);
  console.log(`   Processing time: ${complexTime}ms`);
}
