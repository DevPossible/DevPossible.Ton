#!/usr/bin/env python
"""
Error Handling Example
Copyright (c) 2024 DevPossible, LLC
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'devpossible_ton'))

import devpossible_ton as ton


def run():
    """Run error handling examples."""
    print('=== Error Handling Example ===\n')

    parser = ton.TonParser()

    # Example 1: Parse error handling
    print('1. Handling parse errors:')
    invalid_ton = '{ name = unclosed string'
    
    try:
        parser.parse(invalid_ton)
        print('   No error (unexpected)')
    except Exception as error:
        print(f'   ✓ Parse error caught: {error}')

    # Example 2: Missing properties
    print('\n2. Handling missing properties:')
    partial_ton = '{ firstName = "John" }'
    doc = parser.parse(partial_ton)
    data = doc.to_json()
    
    print(f'   First Name: {data.get("firstName")}')
    print(f'   Last Name (None): {data.get("lastName", "N/A")}')

    # Example 3: Type mismatches
    print('\n3. Handling type mismatches:')
    type_mismatch = '{ age = "not a number" }'
    type_doc = parser.parse(type_mismatch)
    type_data = type_doc.to_json()
    
    print(f'   Age value: {type_data.get("age")}')
    print(f'   Type: {type(type_data.get("age")).__name__}')

    # Example 4: Validation errors
    print('\n4. Schema validation errors:')
    invalid_data = '{ name = "Test", age = -5 }'
    invalid_doc = parser.parse(invalid_data)
    
    schema = {
        'type': 'object',
        'required': ['name', 'age', 'email'],
        'properties': {
            'age': {'type': 'number', 'minimum': 0}
        }
    }
    
    validator = ton.TonValidator()
    result = validator.validate(invalid_doc, schema)
    
    if not result.is_valid:
        print('   ✓ Validation errors detected:')
        for err in result.errors:
            print(f'     - {err}')

    # Example 5: Safe parsing
    print('\n5. Safe parsing with try-except:')
    test_inputs = [
        '{ valid = true }',
        '{ invalid syntax',
        '{ another = "valid" }'
    ]
    
    for i, input_data in enumerate(test_inputs, 1):
        try:
            parser.parse(input_data)
            print(f'   Input {i}: ✓ Valid')
        except Exception as error:
            print(f'   Input {i}: ✗ Invalid - {error}')
