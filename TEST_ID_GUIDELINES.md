# Test ID Guidelines

## Test ID Format

Each test in Gherkin files has a unique identifier following this format:

```
@TestID: [CATEGORY]-[SUBCATEGORY]-[SEQUENCE]
```

### Categories and Their Prefixes:

| Category | Prefix | Description |
|----------|--------|-------------|
| Arrays | `ARR` | Array handling and operations |
| Edge Cases | `EDG` | Edge cases and error conditions |
| Formatter | `FMT` | Formatting and output styles |
| Integration | `INT` | End-to-end integration tests |
| Lexer | `LEX` | Tokenization and lexical analysis |
| Multi-line Strings | `MLS` | Multi-line string handling |
| Numeric Properties | `NUM` | Numeric property handling |
| Parser | `PRS` | Parsing functionality |
| Performance | `PRF` | Performance and benchmarks |
| Serializer | `SER` | Serialization operations |
| Validator | `VAL` | Schema validation |

### Subcategories:

Common subcategories include:
- `BASIC` - Basic functionality
- `COMPLEX` - Complex scenarios
- `ERROR` - Error handling
- `EDGE` - Edge cases
- `NESTED` - Nested structures
- `VALID` - Validation scenarios
- `PERF` - Performance specific
- `FORMAT` - Formatting specific

### Examples:
- `@TestID: ARR-BASIC-001` - Basic array parsing
- `@TestID: VAL-NESTED-005` - Nested validation scenario
- `@TestID: FMT-PRETTY-002` - Pretty formatting test

## Using Test IDs in Code

### C# Implementation:
```csharp
[Fact]
public void Should_Parse_Simple_Array()
{
    // @TestID: ARR-BASIC-001
    // Scenario: Parse simple array

    // Test implementation
}
```

### JavaScript/TypeScript Implementation:
```javascript
test('should parse simple array', () => {
    // @TestID: ARR-BASIC-001
    // Scenario: Parse simple array

    // Test implementation
});
```

### Python Implementation:
```python
def test_parse_simple_array():
    """
    @TestID: ARR-BASIC-001
    Scenario: Parse simple array
    """

    # Test implementation
```

## Gherkin File Format

In Gherkin files, the test ID appears as a comment above each scenario:

```gherkin
# @TestID: ARR-BASIC-001
# Tests basic array parsing with numeric elements
Scenario: Parse simple array
  Given I have a TON string "[1, 2, 3]"
  When I parse the string
  Then I should get an array with 3 elements
```

## AI Guidance Instructions

When working with tests:

1. **Always preserve Test IDs** when modifying tests
2. **Reference Test IDs** in commit messages when fixing tests
3. **Use Test IDs** for cross-referencing between Gherkin and implementation
4. **Ensure Test ID consistency** across all language implementations
5. **Never duplicate Test IDs** - each must be unique

## Test ID Registry

Test IDs should be tracked to ensure uniqueness. When adding new tests:
1. Check existing IDs in the category
2. Use next sequential number
3. Document new ID in Gherkin file first
4. Reference in all implementations

## Benefits of Test IDs

1. **Traceability** - Easy to trace from requirement to implementation
2. **Cross-reference** - Link tests across different languages
3. **Debugging** - Quickly identify which specification failed
4. **Documentation** - Clear test purpose identification
5. **Automation** - Can be used for test filtering and reporting

## Validation Rules

- Test IDs must be unique across entire test suite
- Format must follow: `[A-Z]{3}-[A-Z]+-[0-9]{3}`
- Must appear in both Gherkin and implementation
- Sequential numbering within category/subcategory

---

**© 2024 DevPossible, LLC. All rights reserved.**