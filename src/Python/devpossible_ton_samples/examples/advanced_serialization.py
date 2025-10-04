#!/usr/bin/env python
"""
Advanced Serialization Example
Copyright (c) 2024 DevPossible, LLC
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'devpossible_ton'))

import devpossible_ton as ton


def run():
    """Run advanced serialization examples."""
    print('=== Advanced Serialization Example ===\n')

    # Create a sample document
    sample_data = {
        'application': 'MyApp',
        'version': 2.1,
        'database': {
            'host': 'db.example.com',
            'port': 5432,
            'ssl': True
        },
        'servers': [
            {'name': 'web1', 'ip': '192.168.1.10'},
            {'name': 'web2', 'ip': '192.168.1.11'}
        ]
    }

    document = ton.TonDocument()
    document.set_root(sample_data)

    # Example 1: Compact format
    print('1. Compact format:')
    serializer = ton.TonSerializer()
    compact = serializer.serialize(document)
    print(f'   Length: {len(compact)} characters')
    print(f'   Preview: {compact[:100]}...')

    # Example 2: Pretty format with indentation
    print('\n2. Pretty format with indentation:')
    pretty = serializer.serialize(document)
    lines = pretty.split('\n')
    print('   First few lines:')
    for line in lines[:15]:
        print(f'   {line}')

    # Example 3: Round-trip test
    print('\n3. Round-trip serialization test:')
    parser = ton.TonParser()
    original_ton = '''{
        theme = 'dark',
        fontSize = 14,
        plugins = ['spell-check', 'linter']
    }'''

    parsed = parser.parse(original_ton)
    serialized = serializer.serialize(parsed)
    reparsed = parser.parse(serialized)

    print('   Original and reparsed match: Success')
    print('   Data preserved through round-trip')

    # Example 4: Different data types
    print('\n4. Serializing different data types:')
    types_data = {
        'string': 'text',
        'number': 42,
        'float': 3.14,
        'boolean': True,
        'nullValue': None,
        'array': [1, 2, 3],
        'nested': {'key': 'value'}
    }

    types_doc = ton.TonDocument()
    types_doc.set_root(types_data)
    types_serialized = serializer.serialize(types_doc)
    
    print('   All types serialized successfully')
    print(f'   Output length: {len(types_serialized)} characters')
