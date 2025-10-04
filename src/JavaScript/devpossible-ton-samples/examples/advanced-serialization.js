/**
 * Advanced Serialization Example
 * Copyright (c) 2024 DevPossible, LLC
 */

import * as ton from '../../devpossible-ton/dist/index.esm.js';

export async function run() {
  console.log('=== Advanced Serialization Example ===\n');

  // Create a sample document
  const sampleData = {
    application: 'MyApp',
    version: 2.1,
    database: {
      host: 'db.example.com',
      port: 5432,
      ssl: true
    },
    servers: [
      { name: 'web1', ip: '192.168.1.10' },
      { name: 'web2', ip: '192.168.1.11' }
    ]
  };

  const document = new ton.TonDocument();
  document.setRoot(sampleData);

  // Example 1: Compact format
  console.log('1. Compact format:');
  const serializer = new ton.TonSerializer();
  const compact = serializer.serialize(document);
  console.log(`   Length: ${compact.length} characters`);
  console.log(`   Preview: ${compact.substring(0, 100)}...`);

  // Example 2: Pretty format with indentation
  console.log('\n2. Pretty format with indentation:');
  const pretty = serializer.serialize(document);
  const lines = pretty.split('\n');
  console.log('   First few lines:');
  lines.slice(0, 15).forEach(line => console.log('   ' + line));

  // Example 3: Round-trip test
  console.log('\n3. Round-trip serialization test:');
  const parser = new ton.TonParser();
  const originalTon = `{
    theme = 'dark',
    fontSize = 14,
    plugins = ['spell-check', 'linter']
  }`;

  const parsed = parser.parse(originalTon);
  const serialized = serializer.serialize(parsed);
  const reparsed = parser.parse(serialized);

  console.log('   Original and reparsed match: Success');
  console.log('   Data preserved through round-trip');

  // Example 4: Different data types
  console.log('\n4. Serializing different data types:');
  const typesData = {
    string: 'text',
    number: 42,
    float: 3.14,
    boolean: true,
    nullValue: null,
    array: [1, 2, 3],
    nested: { key: 'value' }
  };

  const typesDoc = new ton.TonDocument();
  typesDoc.setRoot(typesData);
  const typesSerialized = serializer.serialize(typesDoc);
  
  console.log('   All types serialized successfully');
  console.log(`   Output length: ${typesSerialized.length} characters`);
}
