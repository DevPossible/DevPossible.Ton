/**
 * Basic Usage Example for DevPossible.Ton JavaScript Library
 * Copyright (c) 2024 DevPossible, LLC
 */

// Note: This would normally be: const ton = require('@devpossible/ton');
// For this example, we'll use a relative import
const ton = require('../devpossible-ton/dist');

// Sample TON data
const tonData = `
{
  // Configuration object
  name: "My Application"
  version: "1.0.0"

  database: {
    host: "localhost"
    port: 5432
    credentials: {
      username: "admin"
      password: "secret123"
    }
  }

  features: [
    "authentication"
    "logging"
    "caching"
  ]

  // Using type hints
  timeout: %30000  // Number hint
  debug: &true     // Boolean hint

  // Enum example
  environment: |production|

  // Multi-line string
  description: """
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
    const document = ton.parse(tonData);

    console.log('Parsed TON Document:');
    console.log(JSON.stringify(document.toJSON(), null, 2));

    // Access specific values
    const root = document.getRoot();
    if (root.isObject()) {
      const obj = root.asObject();
      console.log('\nApplication Name:', obj.get('name'));
      console.log('Version:', obj.get('version'));

      const db = obj.get('database');
      if (db) {
        console.log('Database Host:', db.get('host'));
        console.log('Database Port:', db.get('port'));
      }
    }

    // Serialize back to TON format
    const serialized = ton.serialize(document, {
      indent: '  ',
      format: 'pretty'
    });

    console.log('\nSerialized TON:');
    console.log(serialized);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();