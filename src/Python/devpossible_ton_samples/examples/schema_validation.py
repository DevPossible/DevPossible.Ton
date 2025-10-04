#!/usr/bin/env python
"""
Schema Validation Example
Copyright (c) 2024 DevPossible, LLC
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'devpossible_ton'))

import devpossible_ton as ton


def run():
    """Run schema validation examples."""
    print('=== Schema Validation Example ===\n')

    # Example 1: Basic schema validation
    print('1. Basic schema validation:')
    data = '''{
        name = "John Doe",
        age = 30,
        email = "john@example.com"
    }'''

    parser = ton.TonParser()
    document = parser.parse(data)

    schema = {
        'type': 'object',
        'required': ['name', 'email'],
        'properties': {
            'name': {'type': 'string'},
            'age': {'type': 'number'},
            'email': {'type': 'string'}
        }
    }

    validator = ton.TonValidator()
    result = validator.validate(document, schema)

    if result.is_valid:
        print('   ✓ Document is valid')
    else:
        print('   ✗ Validation errors:')
        for error in result.errors:
            print(f'     - {error}')

    # Example 2: Nested object validation
    print('\n2. Nested object validation:')
    nested_data = '''{
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
    }'''

    nested_doc = parser.parse(nested_data)
    nested_schema = {
        'type': 'object',
        'properties': {
            'user': {
                'type': 'object',
                'required': ['name', 'profile'],
                'properties': {
                    'name': {'type': 'string'},
                    'profile': {
                        'type': 'object',
                        'properties': {
                            'age': {'type': 'number'},
                            'location': {'type': 'string'}
                        }
                    }
                }
            },
            'settings': {
                'type': 'object',
                'properties': {
                    'theme': {'type': 'string'},
                    'notifications': {'type': 'boolean'}
                }
            }
        }
    }

    nested_result = validator.validate(nested_doc, nested_schema)
    print('   ✓ Valid' if nested_result.is_valid else '   ✗ Invalid')

    # Example 3: Array validation
    print('\n3. Array validation:')
    array_data = '''{
        tags = ["javascript", "typescript", "nodejs"],
        scores = [95, 87, 92, 88]
    }'''

    array_doc = parser.parse(array_data)
    array_schema = {
        'type': 'object',
        'properties': {
            'tags': {
                'type': 'array',
                'items': {'type': 'string'}
            },
            'scores': {
                'type': 'array',
                'items': {'type': 'number'}
            }
        }
    }

    array_result = validator.validate(array_doc, array_schema)
    print('   ✓ Valid array structure' if array_result.is_valid else '   ✗ Invalid')

    # Example 4: Validation with constraints
    print('\n4. Validation with constraints:')
    constrained_data = '''{
        username = "alice123",
        password = "secret",
        age = 15
    }'''

    constrained_doc = parser.parse(constrained_data)
    constrained_schema = {
        'type': 'object',
        'required': ['username', 'password', 'age'],
        'properties': {
            'username': {
                'type': 'string',
                'minLength': 5,
                'maxLength': 20
            },
            'password': {
                'type': 'string',
                'minLength': 8
            },
            'age': {
                'type': 'number',
                'minimum': 18,
                'maximum': 120
            }
        }
    }

    constrained_result = validator.validate(constrained_doc, constrained_schema)
    if not constrained_result.is_valid:
        print('   ✗ Validation failed (expected):')
        for error in constrained_result.errors:
            print(f'     - {error}')

    # Example 5: Optional fields
    print('\n5. Optional fields validation:')
    optional_data = '''{
        name = "Product",
        price = 99.99
    }'''

    optional_doc = parser.parse(optional_data)
    optional_schema = {
        'type': 'object',
        'required': ['name', 'price'],
        'properties': {
            'name': {'type': 'string'},
            'price': {'type': 'number'},
            'description': {'type': 'string'},  # Optional
            'category': {'type': 'string'}      # Optional
        }
    }

    optional_result = validator.validate(optional_doc, optional_schema)
    print('   ✓ Valid (optional fields not required)' if optional_result.is_valid else '   ✗ Invalid')

    # Example 6: Multiple document validation
    print('\n6. Multiple document validation:')
    documents = [
        {'name': 'Valid Doc', 'version': '1.0.0'},
        {'name': 'Invalid Doc'},  # Missing version
        {'version': '2.0.0'}      # Missing name
    ]

    doc_schema = {
        'type': 'object',
        'required': ['name', 'version'],
        'properties': {
            'name': {'type': 'string'},
            'version': {'type': 'string'}
        }
    }

    print('   Validating multiple documents:')
    for index, data in enumerate(documents):
        doc = ton.TonDocument()
        doc.set_root(data)
        result = validator.validate(doc, doc_schema)
        status = '✓ Valid' if result.is_valid else '✗ Invalid'
        print(f'     Doc {index + 1}: {status}')
