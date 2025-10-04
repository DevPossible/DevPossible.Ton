/**
 * Schema Validation Example
 * Copyright (c) 2024 DevPossible, LLC
 */

import * as ton from '../../devpossible-ton/dist/index.esm.js';

export async function run() {
  console.log('=== Schema Validation Example ===\n');

  // Example 1: Basic schema validation
  console.log('1. Basic schema validation:');
  const data = `{
    name = "John Doe",
    age = 30,
    email = "john@example.com"
  }`;

  const parser = new ton.TonParser();
  const document = parser.parse(data);

  const schema = {
    type: 'object',
    required: ['name', 'email'],
    properties: {
      name: { type: 'string' },
      age: { type: 'number' },
      email: { type: 'string' }
    }
  };

  const validator = new ton.TonValidator();
  const result = validator.validate(document, schema);

  if (result.isValid) {
    console.log('   ✓ Document is valid');
  } else {
    console.log('   ✗ Validation errors:');
    result.errors.forEach(error => console.log('     -', error));
  }

  // Example 2: Nested object validation
  console.log('\n2. Nested object validation:');
  const nestedData = `{
    user = {
      name = "Alice",
      profile = {
        age = 25,
        location = "New York"
      }
    },
    settings = {
      theme = "dark",
      notifications = true
    }
  }`;

  const nestedDoc = parser.parse(nestedData);
  const nestedSchema = {
    type: 'object',
    properties: {
      user: {
        type: 'object',
        required: ['name', 'profile'],
        properties: {
          name: { type: 'string' },
          profile: {
            type: 'object',
            properties: {
              age: { type: 'number' },
              location: { type: 'string' }
            }
          }
        }
      },
      settings: {
        type: 'object',
        properties: {
          theme: { type: 'string' },
          notifications: { type: 'boolean' }
        }
      }
    }
  };

  const nestedResult = validator.validate(nestedDoc, nestedSchema);
  console.log(nestedResult.isValid ? '   ✓ Valid' : '   ✗ Invalid');

  // Example 3: Array validation
  console.log('\n3. Array validation:');
  const arrayData = `{
    tags = ["javascript", "typescript", "nodejs"],
    scores = [95, 87, 92, 88]
  }`;

  const arrayDoc = parser.parse(arrayData);
  const arraySchema = {
    type: 'object',
    properties: {
      tags: {
        type: 'array',
        items: { type: 'string' }
      },
      scores: {
        type: 'array',
        items: { type: 'number' }
      }
    }
  };

  const arrayResult = validator.validate(arrayDoc, arraySchema);
  console.log(arrayResult.isValid ? '   ✓ Valid array structure' : '   ✗ Invalid');

  // Example 4: Validation with constraints
  console.log('\n4. Validation with constraints:');
  const constrainedData = `{
    username = "alice123",
    password = "secret",
    age = 15
  }`;

  const constrainedDoc = parser.parse(constrainedData);
  const constrainedSchema = {
    type: 'object',
    required: ['username', 'password', 'age'],
    properties: {
      username: {
        type: 'string',
        minLength: 5,
        maxLength: 20
      },
      password: {
        type: 'string',
        minLength: 8
      },
      age: {
        type: 'number',
        minimum: 18,
        maximum: 120
      }
    }
  };

  const constrainedResult = validator.validate(constrainedDoc, constrainedSchema);
  if (!constrainedResult.isValid) {
    console.log('   ✗ Validation failed (expected):');
    constrainedResult.errors.forEach(error => console.log('     -', error));
  }

  // Example 5: Optional fields
  console.log('\n5. Optional fields validation:');
  const optionalData = `{
    name = "Product",
    price = 99.99
  }`;

  const optionalDoc = parser.parse(optionalData);
  const optionalSchema = {
    type: 'object',
    required: ['name', 'price'],
    properties: {
      name: { type: 'string' },
      price: { type: 'number' },
      description: { type: 'string' },  // Optional
      category: { type: 'string' }       // Optional
    }
  };

  const optionalResult = validator.validate(optionalDoc, optionalSchema);
  console.log(optionalResult.isValid ? 
    '   ✓ Valid (optional fields not required)' : 
    '   ✗ Invalid');

  // Example 6: Custom validation
  console.log('\n6. Multiple document validation:');
  const documents = [
    { name: 'Valid Doc', version: '1.0.0' },
    { name: 'Invalid Doc' },  // Missing version
    { version: '2.0.0' }      // Missing name
  ];

  const docSchema = {
    type: 'object',
    required: ['name', 'version'],
    properties: {
      name: { type: 'string' },
      version: { type: 'string' }
    }
  };

  console.log('   Validating multiple documents:');
  documents.forEach((data, index) => {
    const doc = new ton.TonDocument();
    doc.setRoot(data);
    const result = validator.validate(doc, docSchema);
    console.log(`     Doc ${index + 1}: ${result.isValid ? '✓ Valid' : '✗ Invalid'}`);
  });
}
