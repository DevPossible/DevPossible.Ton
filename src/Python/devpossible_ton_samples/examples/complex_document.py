#!/usr/bin/env python
"""
Complex Document Example
Copyright (c) 2024 DevPossible, LLC
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'devpossible_ton'))

import devpossible_ton as ton
from datetime import datetime


def run():
    """Run complex document examples."""
    print('=== Complex Document Example ===\n')

    # Example 1: Multi-level nested structure
    print('1. Multi-level nested structure:')
    complex_data = {
        'company': 'Tech Solutions Inc.',
        'departments': [
            {
                'name': 'Engineering',
                'manager': 'Alice Johnson',
                'teams': [
                    {
                        'name': 'Backend',
                        'members': ['Bob', 'Charlie', 'David'],
                        'tech': ['Node.js', 'Python', 'Go']
                    },
                    {
                        'name': 'Frontend',
                        'members': ['Eve', 'Frank'],
                        'tech': ['React', 'TypeScript', 'CSS']
                    }
                ]
            },
            {
                'name': 'Sales',
                'manager': 'Grace Wilson',
                'regions': ['North', 'South', 'East', 'West']
            }
        ],
        'metadata': {
            'created': datetime.now().isoformat(),
            'version': '3.0',
            'tags': ['production', 'verified']
        }
    }

    doc = ton.TonDocument()
    doc.set_root(complex_data)
    
    serializer = ton.TonSerializer()
    serialized = serializer.serialize(doc)
    
    print('   Complex structure created and serialized')
    print(f'   Total length: {len(serialized)} characters')
    print(f'   Departments: {len(complex_data["departments"])}')

    # Example 2: Parse and navigate complex document
    print('\n2. Parsing and navigating complex document:')
    parser = ton.TonParser()
    parsed = parser.parse(serialized)
    data = parsed.to_json()
    
    print(f'   Company: {data["company"]}')
    print(f'   First department: {data["departments"][0]["name"]}')
    print(f'   First team: {data["departments"][0]["teams"][0]["name"]}')
    print(f'   Backend tech stack: {", ".join(data["departments"][0]["teams"][0]["tech"])}')

    # Example 3: Mixed data types in arrays
    print('\n3. Mixed data types and structures:')
    mixed_ton = '''{ 
        items = [
            'string',
            42,
            true,
            { type = 'object', value = 100 },
            [1, 2, 3]
        ],
        settings = {
            feature_flags = {
                new_ui = true,
                beta_api = false,
                experimental = true
            }
        }
    }'''
    
    mixed_doc = parser.parse(mixed_ton)
    mixed_data = mixed_doc.to_json()
    
    print(f'   Items array length: {len(mixed_data["items"])}')
    print(f'   Item types: {", ".join(type(i).__name__ for i in mixed_data["items"])}')
    print(f'   Feature flags count: {len(mixed_data["settings"]["feature_flags"])}')

    # Example 4: Large document summary
    print('\n4. Large document with statistics:')
    stats = {
        'users': [
            {'id': i + 1, 'name': f'User{i + 1}', 'active': i % 2 == 0}
            for i in range(10)
        ],
        'metrics': {
            'total': 10,
            'active': 5,
            'inactive': 5
        }
    }
    
    stats_doc = ton.TonDocument()
    stats_doc.set_root(stats)
    stats_str = serializer.serialize(stats_doc)
    
    print(f'   Generated {len(stats["users"])} users')
    print(f'   Document size: {len(stats_str)} characters')
    print(f'   Active users: {stats["metrics"]["active"]}')
