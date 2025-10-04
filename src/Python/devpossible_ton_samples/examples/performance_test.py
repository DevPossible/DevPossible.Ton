#!/usr/bin/env python
"""
Performance Test Example
Copyright (c) 2024 DevPossible, LLC
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'devpossible_ton'))

import devpossible_ton as ton
import time
from datetime import datetime


def run():
    """Run performance test examples."""
    print('=== Performance Test Example ===\n')

    parser = ton.TonParser()
    serializer = ton.TonSerializer()

    # Example 1: Large array parsing
    print('1. Large array performance test:')
    large_array = list(range(1000))
    array_doc = ton.TonDocument()
    array_doc.set_root({'numbers': large_array})
    
    start_array = time.time()
    array_serialized = serializer.serialize(array_doc)
    array_parsed = parser.parse(array_serialized)
    array_time = (time.time() - start_array) * 1000
    
    print(f'   Array with {len(large_array)} items')
    print(f'   Serialization + parsing time: {array_time:.2f}ms')

    # Example 2: Deep nesting
    print('\n2. Deep nesting performance test:')
    deep_obj = {'value': 'end'}
    for i in range(50):
        deep_obj = {'nested': deep_obj}
    
    deep_doc = ton.TonDocument()
    deep_doc.set_root(deep_obj)
    
    start_deep = time.time()
    deep_serialized = serializer.serialize(deep_doc)
    deep_parsed = parser.parse(deep_serialized)
    deep_time = (time.time() - start_deep) * 1000
    
    print('   Nesting depth: 50 levels')
    print(f'   Processing time: {deep_time:.2f}ms')

    # Example 3: Multiple small documents
    print('\n3. Multiple documents test:')
    doc_count = 100
    start_multi = time.time()
    
    for i in range(doc_count):
        data = {'id': i, 'name': f'Item{i}', 'value': i * 10}
        doc = ton.TonDocument()
        doc.set_root(data)
        serialized = serializer.serialize(doc)
        parser.parse(serialized)
    
    multi_time = (time.time() - start_multi) * 1000
    
    print(f'   Processed {doc_count} documents')
    print(f'   Total time: {multi_time:.2f}ms')
    print(f'   Average per document: {(multi_time / doc_count):.2f}ms')

    # Example 4: Complex object benchmark
    print('\n4. Complex object benchmark:')
    complex_data = {
        'users': [
            {
                'id': i,
                'name': f'User{i}',
                'email': f'user{i}@example.com',
                'profile': {
                    'age': 20 + i,
                    'country': 'USA',
                    'interests': ['tech', 'science', 'art']
                }
            }
            for i in range(50)
        ],
        'metadata': {
            'created': datetime.now().isoformat(),
            'version': '1.0.0'
        }
    }
    
    complex_doc = ton.TonDocument()
    complex_doc.set_root(complex_data)
    
    start_complex = time.time()
    complex_serialized = serializer.serialize(complex_doc)
    complex_parsed = parser.parse(complex_serialized)
    complex_time = (time.time() - start_complex) * 1000
    
    print(f'   Objects: {len(complex_data["users"])} users with nested data')
    print(f'   Serialized size: {len(complex_serialized)} characters')
    print(f'   Processing time: {complex_time:.2f}ms')
