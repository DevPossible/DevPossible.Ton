# TON Gherkin Test Specifications

This directory contains Gherkin feature files that define the behavior specifications for TON (Text Object Notation) parsers, serializers, validators, and related functionality. These feature files serve as language-agnostic test specifications that can be implemented in any programming language.

## Purpose

These Gherkin files provide:
- **Clear specifications** for TON functionality
- **Language-agnostic test cases** that any implementation should pass
- **Comprehensive coverage** of all TON features
- **Living documentation** of expected behavior
- **BDD-style scenarios** for better understanding

## Feature Files

### Core Functionality

- **`lexer.feature`** - Token generation from raw TON input
  - Basic tokenization
  - String handling with escape sequences
  - Number formats (decimal, hex, binary, scientific)
  - Enums and enum sets
  - Comments and whitespace
  - Type hints and special characters

- **`parser.feature`** - Document structure parsing
  - Object and array parsing
  - Nested structures
  - Property types and values
  - Class names and metadata
  - Header and schema parsing

- **`serializer.feature`** - Converting documents back to TON format
  - Compact and pretty formatting
  - Type hint preservation
  - Round-trip fidelity
  - Custom serialization options

- **`validator.feature`** - Schema validation
  - Required properties
  - Type checking
  - Constraints (min/max, length, pattern)
  - Path-based validation
  - Default value application

### Specialized Features

- **`arrays.feature`** - Array handling
  - Empty and nested arrays
  - Mixed types
  - Array validation
  - Performance with large arrays

- **`multiline-strings.feature`** - Triple-quoted strings
  - Indentation handling
  - Line ending normalization
  - Escape sequence processing
  - Preservation of formatting

- **`numeric-properties.feature`** - Numeric property names
  - Pure numeric names
  - Alphanumeric combinations
  - Year-based properties
  - Special numeric formats

- **`formatter.feature`** - Code formatting
  - Pretty and compact styles
  - Custom indentation
  - Comment preservation
  - Property sorting

### Quality Assurance

- **`integration.feature`** - End-to-end scenarios
  - Round-trip operations
  - File I/O
  - Stream handling
  - Object conversion
  - Multi-format support

- **`edge-cases.feature`** - Error handling and edge cases
  - Malformed input
  - Overflow conditions
  - Unicode handling
  - Error recovery

- **`performance.feature`** - Performance requirements
  - Parsing speed benchmarks
  - Memory usage limits
  - Scalability tests
  - Concurrent operations

## Implementation Guidelines

### For Test Implementers

1. **Start with core features** - Implement lexer, parser, serializer, and validator tests first
2. **Use exact test data** - The input and expected output in scenarios should be used exactly as specified
3. **Handle all scenarios** - Each scenario represents a required capability
4. **Report clear failures** - When tests fail, indicate which scenario and step failed

### Test Organization

Each feature file follows this structure:
```gherkin
Feature: [Component Name]
  As a [role]
  I need [functionality]
  So that [benefit]

  Background:
    [Common setup steps]

  Scenario: [Test case name]
    Given [initial context]
    When [action performed]
    Then [expected outcome]
```

### Data Tables and Examples

Many scenarios use data tables for multiple test cases:
```gherkin
Scenario Outline: [Parameterized test]
  When I parse "<input>"
  Then result should be "<expected>"

  Examples:
    | input | expected |
    | ...   | ...      |
```

## Running Tests

The specific method for running these tests depends on your implementation language and test framework. Common approaches include:

### JavaScript/TypeScript (Cucumber.js)
```bash
npm install --save-dev @cucumber/cucumber
npx cucumber-js test/gherkin
```

### C# (SpecFlow)
```bash
dotnet add package SpecFlow
dotnet test
```

### Python (Behave)
```bash
pip install behave
behave test/gherkin
```

### Go (Godog)
```bash
go get github.com/cucumber/godog
godog test/gherkin
```

## Conformance Levels

Not all implementations may support every feature immediately. Consider these conformance levels:

1. **Basic** - Lexer, Parser, basic Serializer
2. **Standard** - Basic + Validator, Arrays, all data types
3. **Complete** - All features including edge cases and performance

## Contributing

When adding new test cases:
1. Place them in the appropriate feature file
2. Follow the existing scenario format
3. Provide clear, unambiguous specifications
4. Include both positive and negative test cases
5. Document any special requirements

## Test Coverage

These Gherkin files aim to provide comprehensive coverage of:
- ✅ All TON data types
- ✅ All syntax variations
- ✅ Error conditions
- ✅ Performance requirements
- ✅ Edge cases
- ✅ Round-trip fidelity
- ✅ Schema validation
- ✅ Format preservation

## Notes

- Test data uses realistic examples where possible
- Error messages in "Then" clauses are suggestions - implementations may use different wording
- Performance requirements are guidelines - adjust based on target platform
- Unicode test cases assume UTF-8 encoding

## License

These test specifications are part of the TON specification and are available under the same license as the main project.

---

For more information about TON, visit [tonspec.com](https://tonspec.com)