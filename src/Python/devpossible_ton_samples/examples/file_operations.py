#!/usr/bin/env python
"""
File Operations Example
Copyright (c) 2024 DevPossible, LLC
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'devpossible_ton'))

import devpossible_ton as ton
from datetime import datetime


def run():
    """Run file operations examples."""
    print('=== File Operations Example ===\n')

    # Example 1: Read TON file
    print('1. Reading TON file:')
    simple_path = os.path.join(os.path.dirname(__file__), '..', 'SampleData', 'simple.ton')
    
    try:
        with open(simple_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        parser = ton.TonParser()
        document = parser.parse(content)
        
        print('   File read successfully!')
        print(f'   Content: {document.to_json()}')
    except Exception as error:
        print(f'   Error reading file: {error}')

    # Example 2: Write TON file
    print('\n2. Writing TON file:')
    output_path = os.path.join(os.path.dirname(__file__), '..', 'SampleData', 'output.ton')
    
    data = {
        'application': 'Sample App',
        'version': '2.0.0',
        'settings': {
            'theme': 'dark',
            'language': 'en',
            'notifications': True
        },
        'features': ['analytics', 'reporting', 'export']
    }

    doc = ton.TonDocument()
    doc.set_root(data)
    
    serializer = ton.TonSerializer()
    ton_content = serializer.serialize(doc)
    
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(ton_content)
        print(f'   File written successfully to: {output_path}')
    except Exception as error:
        print(f'   Error writing file: {error}')

    # Example 3: Read and modify
    print('\n3. Read, modify, and save:')
    config_path = os.path.join(os.path.dirname(__file__), '..', 'SampleData', 'config.ton')
    
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config_content = f.read()
        
        parser = ton.TonParser()
        config_doc = parser.parse(config_content)
        
        print('   Original config loaded')
        
        # Modify the document
        root = config_doc.get_root()
        from devpossible_ton.models.ton_object import TonObject
        if isinstance(root, TonObject):
            root.set('modified', datetime.now().isoformat())
            root.set('version', '1.0.1')
        
        # Save modified version
        modified_path = os.path.join(os.path.dirname(__file__), '..', 'SampleData', 'config-modified.ton')
        modified_content = serializer.serialize(config_doc)
        
        with open(modified_path, 'w', encoding='utf-8') as f:
            f.write(modified_content)
        
        print(f'   Modified config saved to: {modified_path}')
    except Exception as error:
        print(f'   Error: {error}')

    # Example 4: Batch processing
    print('\n4. Batch file processing:')
    sample_dir = os.path.join(os.path.dirname(__file__), '..', 'SampleData')
    
    try:
        files = [f for f in os.listdir(sample_dir) if f.endswith('.ton')]
        
        print(f'   Found {len(files)} TON files:')
        
        parser = ton.TonParser()
        for file in files:
            try:
                file_path = os.path.join(sample_dir, file)
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                document = parser.parse(content)
                print(f'     ✓ {file} - Valid TON file')
            except Exception as error:
                print(f'     ✗ {file} - Parse error: {error}')
    except Exception as error:
        print(f'   Error reading directory: {error}')
