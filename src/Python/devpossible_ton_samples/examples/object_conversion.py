#!/usr/bin/env python
"""
Object Conversion Example
Copyright (c) 2024 DevPossible, LLC
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'devpossible_ton'))

import devpossible_ton as ton
from datetime import datetime


def run():
    """Run object conversion examples."""
    print('=== Object Conversion Example ===\n')

    # Example 1: Convert Python object to TON
    print('1. Converting Python object to TON:')
    user = {
        'firstName': 'John',
        'lastName': 'Doe',
        'email': 'john.doe@example.com',
        'age': 35,
        'isActive': True,
        'createdAt': datetime.now().isoformat(),
        'roles': ['admin', 'developer', 'reviewer'],
        'address': {
            'street': '123 Main St',
            'city': 'Springfield',
            'state': 'IL',
            'zipCode': '62701',
            'country': 'USA'
        }
    }

    ton_doc = ton.TonDocument()
    ton_doc.set_root(user)
    
    print('   User converted to TON document')
    print(f'   Name: {user["firstName"]} {user["lastName"]}')
    print(f'   Has Address: {user["address"] is not None}')

    # Example 2: Serialize the converted object
    print('\n2. Serializing the converted object:')
    serializer = ton.TonSerializer()
    ton_string = serializer.serialize(ton_doc)
    
    print('   TON Output:')
    for line in ton_string.split('\n'):
        print(f'   {line}')

    # Example 3: Convert TON back to Python object
    print('\n3. Converting TON back to Python object:')
    parser = ton.TonParser()
    parsed_doc = parser.parse(ton_string)
    reconstructed_user = parsed_doc.to_json()

    print(f'   Reconstructed User: {reconstructed_user["firstName"]} {reconstructed_user["lastName"]}')
    print(f'   Email: {reconstructed_user["email"]}')
    print(f'   Age: {reconstructed_user["age"]}')
    print(f'   Active: {reconstructed_user["isActive"]}')
    print(f'   Roles Count: {len(reconstructed_user.get("roles", []))}')
    print(f'   City: {reconstructed_user.get("address", {}).get("city")}')

    # Example 4: Partial object conversion
    print('\n4. Partial object conversion:')
    partial_ton = '''{ 
        firstName = 'Jane',
        email = 'jane@example.com',
        roles = ['user', 'editor']
    }'''

    partial_doc = parser.parse(partial_ton)
    partial_user = partial_doc.to_json()

    print(f'   Partial User: {partial_user["firstName"]}')
    print(f'   Email: {partial_user["email"]}')
    print(f'   Age (None): {partial_user.get("age")}')
    print(f'   Roles: {", ".join(partial_user.get("roles", []))}')

    # Example 5: Object with arrays
    print('\n5. Object with arrays:')
    settings = {
        'theme': 'dark',
        'fontSize': 14,
        'autoSave': True,
        'plugins': ['spell-check', 'formatter', 'linter'],
        'shortcuts': {
            'save': 'Ctrl+S',
            'find': 'Ctrl+F',
            'replace': 'Ctrl+H'
        }
    }

    settings_doc = ton.TonDocument()
    settings_doc.set_root(settings)
    
    print('   Settings object created')
    
    settings_ton = serializer.serialize(settings_doc)
    settings_back = parser.parse(settings_ton).to_json()
    
    print(f'   Theme: {settings_back["theme"]}')
    print(f'   Font Size: {settings_back["fontSize"]}')
    print(f'   Plugins: {", ".join(settings_back.get("plugins", []))}')

    # Example 6: Complex nested structures
    print('\n6. Complex nested structures:')
    company = {
        'name': 'Tech Corp',
        'founded': 2020,
        'employees': [
            {'name': 'Alice', 'role': 'CEO', 'department': 'Executive'},
            {'name': 'Bob', 'role': 'CTO', 'department': 'Engineering'},
            {'name': 'Charlie', 'role': 'Developer', 'department': 'Engineering'}
        ],
        'offices': {
            'headquarters': {'city': 'New York', 'country': 'USA'},
            'branch': {'city': 'London', 'country': 'UK'}
        }
    }

    company_doc = ton.TonDocument()
    company_doc.set_root(company)
    company_ton = serializer.serialize(company_doc)
    
    print('   Company structure serialized')
    company_back = parser.parse(company_ton).to_json()
    print(f'   Company: {company_back["name"]} ({company_back["founded"]})')
    print(f'   Employees: {len(company_back.get("employees", []))}')
    print(f'   Offices: {len(company_back.get("offices", {}))} locations')
