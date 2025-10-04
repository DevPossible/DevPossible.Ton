#!/usr/bin/env python
"""
DevPossible.Ton Python Sample Programs
Copyright (c) 2024 DevPossible, LLC
"""

import sys
import os

# Add the library to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'devpossible_ton'))

from examples import (
    array_operations, 
    file_operations, 
    schema_validation,
    object_conversion,
    advanced_serialization,
    error_handling,
    complex_document,
    performance_test
)


def display_menu():
    """Display the main menu."""
    os.system('cls' if os.name == 'nt' else 'clear')
    print('============================================')
    print('  DevPossible.Ton Library Sample Programs  ')
    print('============================================\n')
    print('Select a sample to run:')
    print('1. Basic Usage - Parse simple TON content')
    print('2. File Operations - Read and write TON files')
    print('3. Object Conversion - Convert objects to/from TON')
    print('4. Schema Validation - Validate TON with schemas')
    print('5. Array Operations - Work with arrays in TON')
    print('6. Advanced Serialization - Serialization options')
    print('7. Complex Document - Complex nested structures')
    print('8. Error Handling - Handle errors and edge cases')
    print('9. Performance Test - Performance benchmarks')
    print('0. Exit')
    print()


def run_basic_usage():
    """Run the basic usage sample."""
    import basic_usage
    basic_usage.main()


def run_sample(choice):
    """Run the selected sample."""
    os.system('cls' if os.name == 'nt' else 'clear')
    
    try:
        if choice == '1':
            print('Running Basic Usage sample...\n')
            run_basic_usage()
        elif choice == '2':
            file_operations.run()
        elif choice == '3':
            object_conversion.run()
        elif choice == '4':
            schema_validation.run()
        elif choice == '5':
            array_operations.run()
        elif choice == '6':
            advanced_serialization.run()
        elif choice == '7':
            complex_document.run()
        elif choice == '8':
            error_handling.run()
        elif choice == '9':
            performance_test.run()
        elif choice == '0':
            print('Exiting samples. Thank you!')
            return False
        else:
            print('Invalid choice. Please try again.')
    except Exception as error:
        print(f'\nError: {error}')
    
    return True


def main():
    """Main entry point."""
    continue_running = True
    
    while continue_running:
        display_menu()
        choice = input('Enter your choice: ')
        
        continue_running = run_sample(choice)
        
        if continue_running:
            input('\nPress Enter to continue...')


if __name__ == '__main__':
    main()
