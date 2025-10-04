#!/usr/bin/env python
"""
Basic Usage Example for DevPossible.Ton Python Library
Copyright (c) 2024 DevPossible, LLC
"""

# Note: This would normally be: import devpossible_ton as ton
# For this example, we'll use a direct import
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'devpossible_ton'))

import devpossible_ton as ton

# Sample TON data
ton_data = '''
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
    "authentication",
    "logging",
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
'''


def main():
    """Main function demonstrating TON library usage."""
    try:
        # Parse TON data
        document = ton.parse(ton_data)

        print("Parsed TON Document:")
        print(document.to_json())

        # Access specific values
        root = document.get_root()
        from devpossible_ton.models.ton_object import TonObject
        if isinstance(root, TonObject):
            print(f"\nApplication Name: {root.get('name')}")
            print(f"Version: {root.get('version')}")

            db = root.get('database')
            if db and isinstance(db, TonObject):
                print(f"Database Host: {db.get('host')}")
                print(f"Database Port: {db.get('port')}")

        # Serialize back to TON format
        serialized = ton.serialize(document, ton.TonSerializeOptions(
            indent='  ',
            format='pretty'
        ))

        print("\nSerialized TON:")
        print(serialized)

        # Validate against a schema
        schema = {
            "type": "object",
            "required": ["name", "version"],
            "properties": {
                "name": {"type": "string"},
                "version": {"type": "string"},
                "database": {
                    "type": "object",
                    "properties": {
                        "host": {"type": "string"},
                        "port": {"type": "number"}
                    }
                }
            }
        }

        validation_result = ton.validate(document, schema)
        if validation_result.is_valid:
            print("\nDocument is valid according to schema!")
        else:
            print("\nValidation errors:")
            for error in validation_result.errors:
                print(f"  - {error}")

    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    main()
