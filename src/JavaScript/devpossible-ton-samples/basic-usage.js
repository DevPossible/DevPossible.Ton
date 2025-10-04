/**
 * Basic Usage Example for DevPossible.Ton JavaScript Library
 * Copyright (c) 2024 DevPossible, LLC
 */

// Note: This would normally be: import * as ton from '@devpossible/ton';
// For this example, we'll use a relative import
import * as ton from '../devpossible-ton/dist/index.esm.js';

// Sample TON data
const tonData = `
{
  // Configuration object
  name = "My Application",
  version = "1.0.0",

  database = {
    host = "localhost",
    port = 5432,
    credentials = {
      username = "admin",
      password = "secret123"
    }
  },

  features = [
    "authentication",
    "logging",
    "caching"
  ],

  // Using type hints
  timeout = %30000,  // Number hint
  debug = &true,     // Boolean hint

  // Enum example
  environment = |production|,

  // Multi-line string
  description = """
    This is a sample application
    demonstrating TON format features.

    It supports various data types
    and configurations.
  """
}
`;

async function main() {
  try {
    // Parse TON data
    const parser = new ton.TonParser();
    const document = parser.parse(tonData);

    console.log('Parsed TON Document:');
    console.log(JSON.stringify(document.toJSON(), null, 2));

    // Access specific values
    const root = document.getRoot();
    console.log('\nApplication Name:', root.get('name'));
    console.log('Version:', root.get('version'));

    const db = root.get('database');
    if (db) {
      console.log('Database Host:', db.get('host'));
      console.log('Database Port:', db.get('port'));
    }

    // Serialize back to TON format
    const serializer = new ton.TonSerializer();
    const serialized = serializer.serialize(document);

    console.log('\nSerialized TON:');
    console.log(serialized);

    // Validate against a schema
    const schema = {
      type: 'object',
      required: ['name', 'version'],
      properties: {
        name: { type: 'string' },
        version: { type: 'string' },
        database: {
          type: 'object',
          properties: {
            host: { type: 'string' },
            port: { type: 'number' }
          }
        }
      }
    };

    const validator = new ton.TonValidator();
    const validationResult = validator.validate(document, schema);
    if (validationResult.isValid) {
      console.log('\nDocument is valid according to schema!');
    } else {
      console.log('\nValidation errors:');
      validationResult.errors.forEach(error => console.log('  -', error));
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
