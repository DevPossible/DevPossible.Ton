# CLAUDE.md

**DevPossible.Ton Project Documentation**
**Developed by DevPossible, LLC**
**Contact: support@devpossible.com**

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## IMPORTANT: Command Preferences

**ALWAYS use PowerShell (pwsh) commands instead of bash/Linux commands when working in this Windows environment:**
- Use `pwsh` or PowerShell cmdlets (Get-ChildItem, Copy-Item, Remove-Item, etc.)
- Use Windows-style paths with backslashes (`C:\Dev\...`)
- Use `dotnet` CLI commands for .NET operations
- Avoid Linux/bash commands like `ls`, `rm`, `cp`, `grep`, etc.

## Project Overview

DevPossible.Ton (formerly TONfile) is a complete .NET 8.0 library for parsing, validating, and serializing TON (Text Object Notation) files. TON is a human-readable data format that combines JSON-like simplicity with advanced features like schema validation, type annotations, enums, and hierarchical object structures.

**Official TON Specification:** https://tonspec.com

**Developed and maintained by DevPossible, LLC**

## Technology Stack

- **Language**: C# 12.0
- **Framework**: .NET 8.0
- **Testing**: xUnit with FluentAssertions and Moq
- **Package Format**: NuGet
- **Development Environment**: Windows with PowerShell

## Project Structure

```
DevPossible.Ton/
├── DevPossible.Ton.slnx                  # Solution file
├── README.md                              # Comprehensive documentation
├── CLAUDE.md                              # This file
├── DOCUMENTATION.md                       # Documentation server guide
├── launch.ps1                             # PowerShell documentation launcher
├── launch-docs.bat                        # Batch file documentation launcher
├── package.json                           # NPM scripts for documentation
├── doc/                                   # Documentation folder
│   └── doc-html/                          # HTML documentation and web project
│       ├── index.html                     # Main documentation page
│       ├── css/                           # Stylesheets
│       ├── js/                            # JavaScript files
│       ├── images/                        # Images and logos
│       └── (other HTML documentation files)
└── src/                                   # Source code for all languages
    ├── CSharp/                            # C#/.NET implementation
    │   ├── DevPossible.Ton/               # Main library project
    │   │   ├── DevPossible.Ton.csproj    # Project file
    │   │   ├── DevPossible.Ton.nuspec    # NuGet package specification
    │   │   └── src/                       # All source code
    │   │       ├── Examples/              # Usage examples
    │   │       ├── Interfaces/            # Public interfaces
    │   │       ├── Lexer/                 # Tokenization (TonLexer, TonToken)
    │   │       ├── Models/                # Core data models (TonDocument, TonObject, TonValue, TonEnum)
    │   │       ├── Parser/                # Parsing logic (TonParser, TonParseOptions)
    │   │       ├── Schema/                # Schema definitions
    │   │       ├── Serializer/            # Serialization (TonSerializer, TonSerializeOptions)
    │   │       └── Validator/             # Validation logic (TonValidator)
    │   ├── DevPossible.Ton.Tests/         # Test project
    │   │   ├── DevPossible.Ton.Tests.csproj
    │   │   └── (test files organized by category)
    │   └── DevPossible.Ton.Samples/       # Sample applications
    │       └── (sample code and examples)
    ├── JavaScript/                         # JavaScript/TypeScript implementation
    │   ├── devpossible-ton/               # Main library
    │   │   ├── package.json
    │   │   ├── tsconfig.json
    │   │   ├── src/                       # TypeScript source
    │   │   └── tests/                     # Jest tests
    │   ├── devpossible-ton-samples/       # Sample applications
    │   └── README.md                      # JavaScript-specific documentation
    └── Python/                             # Python implementation
        ├── devpossible_ton/                # Main library package
        │   ├── setup.py
        │   ├── pyproject.toml
        │   ├── devpossible_ton/           # Python source
        │   └── tests/                      # Python tests
        ├── devpossible_ton_samples/        # Sample applications
        └── README.md                       # Python-specific documentation

```

## Key Features Implemented

### Core Functionality
- ✅ Full TON specification parser with recursive descent
- ✅ Comprehensive lexer with all token types
- ✅ Schema validation with custom rules
- ✅ Flexible serialization with multiple formats
- ✅ Type safety with automatic conversions
- ✅ Array support with square bracket syntax
- ✅ Enum and EnumSet support
- ✅ Object hierarchy with class names and instance counts
- ✅ Comments (single-line // and multi-line /* */)
- ✅ Multiple number formats (decimal, hex 0xFF, binary 0b1010, scientific)
- ✅ GUID support (with and without braces)
- ✅ Type annotations (name:string) and hints ($, %, &, ^)

### Data Types Supported
- Primitives: string, integer, float, boolean, null, undefined
- Special: GUID, Date (ISO 8601)
- Collections: Arrays with mixed types and nesting
- Enums: Single values (|value|) and sets (|val1|val2|)
- Objects: Nested structures with optional class typing

## Development Commands

### Building
```powershell
# Build solution
dotnet build

# Build in Release mode
dotnet build -c Release

# Clean build
dotnet clean
```

### Testing
```powershell
# Run all tests
dotnet test

# Run with detailed output
dotnet test --verbosity normal

# Run specific test category
dotnet test --filter "Category=Parser"

# Run specific test
dotnet test --filter "FullyQualifiedName~Should_Parse_Simple_Object"
```

### NuGet Package
```powershell
# Create NuGet package
dotnet pack -c Release

# Pack with specific version
dotnet pack -c Release -p:PackageVersion=1.0.0

# The package will be in: src\CSharp\DevPossible.Ton\bin\Release\DevPossible.Ton.1.0.0.nupkg
```

## Code Conventions

### Namespaces
- Root namespace: `DevPossible.Ton`
- Lexer components: `DevPossible.Ton.Lexer`
- All other components use root namespace

### Naming Conventions
- Classes: PascalCase (e.g., `TonParser`, `TonDocument`)
- Interfaces: IPascalCase (e.g., `ITonParser`)
- Methods: PascalCase
- Properties: PascalCase
- Private fields: _camelCase with underscore prefix
- Parameters and local variables: camelCase

### File Organization
- One primary class per file
- File name matches class name
- Related small classes/enums can be in same file
- Test files mirror source structure with "Tests" suffix
- Test files must include Test ID references in comments

## Testing Guidelines

### Test Structure
- **Unit Tests**: For individual components (Parser, Lexer, Serializer, Validator)
- **Integration Tests**: For end-to-end scenarios
- **Edge Case Tests**: For boundary conditions and error cases
- **Performance Tests**: For large document handling
- **Array Tests**: Specific tests for array functionality
- **All tests must include Test ID references** (e.g., `// @TestID: ARR-BASIC-001`)

### Current Test Coverage
- 162 tests total, all passing
- Categories: Lexer, Parser, Serializer, Validator, Integration, EdgeCases, Performance, Arrays

## Common Development Tasks

### Adding a New Feature
1. Update the relevant model/parser/serializer components
2. Add corresponding tests
3. Update documentation in README.md
4. Run full test suite to ensure no regressions

### Debugging
- Use the TestConsole project for quick testing
- The TestConsole/Program.cs can be modified for specific scenarios

### Making Breaking Changes
- Update version number in .csproj and .nuspec
- Document changes in release notes
- Ensure backward compatibility where possible

## Test-Driven Development

**All implementations must be test-driven based on Gherkin specifications with Test IDs.**

Gherkin files are located in:
- `/test/gherkin/` - Primary specifications with Test IDs

Each scenario has a unique Test ID format:
- `@TestID: [CATEGORY]-[SUBCATEGORY]-[SEQUENCE]`
- Example: `@TestID: ARR-BASIC-001` for basic array parsing

When implementing features:
1. First read the Gherkin specification and note the Test ID
2. Include Test ID reference in your test implementation
3. Implement tests that match Gherkin scenarios exactly
4. Implement code to make tests pass
5. Never modify tests to match broken implementations
6. Ensure Test ID consistency across C#, JavaScript, and Python

## Important Implementation Details

### Parser Architecture
- Recursive descent parser with lookahead
- Token-based parsing from TonLexer
- Comprehensive error reporting with line/column info

### Serialization Options
- **Compact**: Minimal formatting, omits nulls
- **Pretty**: Human-readable with indentation and all features
- **Custom**: Fully configurable via TonSerializeOptions

### Validation System
- Schema-based validation
- Support for required fields, type checking, constraints
- Custom validation rules (min/max, pattern, etc.)

## Known Issues and TODOs

Currently, all features are implemented and all tests pass. Future enhancements could include:
- Performance optimizations for very large files
- Streaming support for huge documents
- Additional schema validation rules
- VS Code/Visual Studio syntax highlighting extension

## Error Handling

The library uses specific exception types:
- `TonParseException`: For parsing errors (includes line/column info)
- `TonValidationException`: For validation failures
- `ArgumentException`: For invalid inputs
- `ArgumentNullException`: For null parameters where not allowed

## Performance Considerations

- Lexer uses compiled regex for GUIDs
- Parser minimizes string allocations
- Serializer uses StringBuilder for efficiency
- Validator caches schema lookups

## Testing Philosophy

**CRITICAL: Tests that correlate to Gherkin tests should not be updated to deviate from what the Gherkin test specifies. Tests that do not map to a Gherkin test should only be updated when the test needs to change because it no longer matches the actual implementation. See TEST_RULES.md and TEST_ID_GUIDELINES.md for comprehensive testing guidelines.**

### Key Testing Rules:
1. **Tests are driven by Gherkin specifications** in `/test/gherkin/` directory
2. **Every test MUST reference its Test ID** (e.g., `@TestID: ARR-BASIC-001`)
3. **Gherkin-mapped tests must not deviate from their specification** - fix the implementation instead
4. **Non-Gherkin tests should only change when implementation requirements change**
5. **Maintain test parity** across all language implementations
6. **Tests define the contract** - implementations must meet test requirements
7. **Test IDs must be preserved** when modifying or implementing tests

## Contributing Guidelines

When modifying the codebase:
1. Maintain the existing code style
2. Add tests for new functionality based on Gherkin specs
3. Update documentation as needed
4. Ensure all tests pass before committing
5. Use meaningful commit messages
6. **For Gherkin-mapped tests**: Never deviate from the specification
7. **For non-Gherkin tests**: Only update when implementation requirements change

## Platform Notes

This project is developed and tested on Windows but should work cross-platform wherever .NET 8.0 is supported. File paths in code use forward slashes for cross-platform compatibility, but documentation uses Windows-style paths.

---

**© 2024 DevPossible, LLC. All rights reserved.**
**Support: support@devpossible.com**