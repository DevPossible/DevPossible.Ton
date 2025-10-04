#!/usr/bin/env python
"""
Array Operations Example
Copyright (c) 2024 DevPossible, LLC
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'devpossible_ton'))

import devpossible_ton as ton


def run():
    """Run array operations examples."""
    print('=== Array Operations Example ===\n')

    # Example 1: Basic array parsing
    print('1. Basic array parsing:')
    array_ton = '''{
        numbers = [1, 2, 3, 4, 5],
        strings = ['apple', 'banana', 'cherry'],
        mixed = [42, 'text', true, null, 3.14]
    }'''

    parser = ton.TonParser()
    doc = parser.parse(array_ton)
    root = doc.get_root()

    numbers = root.get('numbers')
    print(f'   Numbers array: {numbers}')

    strings = root.get('strings')
    print(f'   Strings array: {strings}')

    mixed = root.get('mixed')
    print(f'   Mixed array has {len(mixed)} elements')

    # Example 2: Arrays with type hints
    print('\n2. Arrays with type hints:')
    typed_array_ton = '''{
        integers = [%1, 2, 3, 4, 5],
        floats = [^1.1, 2.2, 3.3, 4.4],
        strings = ['$hello', 'world'],
        booleans = [&true, false, true]
    }'''

    typed_doc = parser.parse(typed_array_ton)
    typed_root = typed_doc.get_root()

    print(f'   Integer array: {typed_root.get("integers")}')
    print(f'   Float array: {typed_root.get("floats")}')

    # Example 3: Nested arrays
    print('\n3. Nested arrays:')
    nested_ton = '''{
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
    }'''

    nested_doc = parser.parse(nested_ton)
    nested_root = nested_doc.get_root()
    matrix = nested_root.get('matrix')

    if matrix and len(matrix) > 0:
        print(f'   Matrix dimensions: {len(matrix)}x{len(matrix[0])}')

    jagged = nested_root.get('jagged')
    print('   Jagged array row lengths:')
    for row in jagged:
        print(f'     Row with {len(row)} elements')

    # Example 4: Arrays of objects
    print('\n4. Arrays of objects:')
    object_array_ton = '''{
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
    }'''

    object_array_doc = parser.parse(object_array_ton)
    object_root = object_array_doc.get_root()
    users = object_root.get('users')

    print('   Users:')
    for user in users:
        print(f'     - {user["name"]}, Age: {user["age"]}, Role: {user["role"]}')

    products = object_root.get('products')
    print('\n   Products:')
    for product in products:
        print(f'     - {product["name"]}: ${product["price"]}')

    # Example 5: Array serialization
    print('\n5. Array serialization:')
    test_doc = ton.TonDocument()
    test_doc.set_root({
        'compact': [1, 2, 3],
        'typed': [100, 200, 300],
        'multiline': [
            {'id': 1, 'name': 'Item 1'},
            {'id': 2, 'name': 'Item 2'}
        ]
    })

    serializer = ton.TonSerializer()
    serialized = serializer.serialize(test_doc)
    print('   Serialized arrays:')
    for line in serialized.split('\n'):
        print(f'   {line}')
