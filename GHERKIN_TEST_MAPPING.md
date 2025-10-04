# Gherkin to Test File Mapping

This document maps Gherkin feature files to their corresponding test implementations across all languages.

## Feature to Test Mapping

| Gherkin Feature | C# Test File | JavaScript Test File | Python Test File |
|-----------------|--------------|----------------------|------------------|
| `arrays.feature` | `ArrayTests.cs` | `ArrayTests.test.ts` | `test_arrays.py` |
| `edge-cases.feature` | `EdgeCaseTests.cs` | `EdgeCaseTests.test.ts` | `test_edge_cases.py` |
| `formatter.feature` | `TonFormatterTests.cs` | `TonFormatter.test.ts` | `test_formatter.py` |
| `integration.feature` | `IntegrationTests.cs` | `Integration.test.ts` | `test_integration.py` |
| `lexer.feature` | `TonLexerTests.cs` | `TonLexer.test.ts` | `test_lexer.py` |
| `multiline-strings.feature` | `MultiLineStringTests.cs` | `MultiLineString.test.ts` | `test_multiline_strings.py` |
| `numeric-properties.feature` | `NumericPropertyTests.cs` | `NumericPropertyTests.test.ts` | `test_numeric_properties.py` |
| `parser.feature` | `TonParserTests.cs` | `TonParser.test.ts` | `test_parser.py` |
| `performance.feature` | `PerformanceTests.cs` | `PerformanceTests.test.ts` | `test_performance.py` |
| `serializer.feature` | `TonSerializerTests.cs` | `TonSerializer.test.ts` | `test_serializer.py` |
| `validator.feature` | `TonValidatorTests.cs` | `TonValidator.test.ts` | `test_validator.py` |

## Additional Test Files (Not Gherkin-Driven)

Some test files exist for specific implementation details:
- `PathBasedSchemaTests.cs/.test.ts` - Path-based schema validation
- `MultiLineStringIntegrationTests.cs` - Additional multi-line integration tests

## Test Implementation Guidelines

1. **Read the Gherkin file first** - Located in `/test/gherkin/`
2. **Map scenarios to test methods** - Each scenario becomes one or more test cases
3. **Maintain Given-When-Then structure** in test implementation
4. **Use exact values from Gherkin** - Don't change test data
5. **Implement all scenarios** - No cherry-picking

## Example Mapping

### Gherkin Scenario (from `arrays.feature`):
```gherkin
Scenario: Parse simple array
  Given I have a TON string "[1, 2, 3]"
  When I parse the string
  Then I should get an array with 3 elements
  And the elements should be [1, 2, 3]
```

### C# Test Implementation:
```csharp
[Fact]
public void Should_Parse_Simple_Array()
{
    // Given
    var tonString = "[1, 2, 3]";

    // When
    var result = parser.Parse(tonString);

    // Then
    result.Should().BeOfType<TonArray>();
    result.Count.Should().Be(3);
    result[0].Should().Be(1);
    result[1].Should().Be(2);
    result[2].Should().Be(3);
}
```

### JavaScript Test Implementation:
```javascript
test('should parse simple array', () => {
    // Given
    const tonString = '[1, 2, 3]';

    // When
    const result = parser.parse(tonString);

    // Then
    expect(result).toBeInstanceOf(TonArray);
    expect(result.length).toBe(3);
    expect(result[0]).toBe(1);
    expect(result[1]).toBe(2);
    expect(result[2]).toBe(3);
});
```

## Validation Checklist

When implementing tests from Gherkin:
- [ ] All scenarios from feature file are implemented
- [ ] Test names reflect scenario names
- [ ] Given-When-Then structure is maintained
- [ ] All assertions from Gherkin are included
- [ ] Test data matches exactly
- [ ] Edge cases are covered
- [ ] Performance requirements are tested (if specified)

---

**Remember: The Gherkin files are the source of truth for test requirements.**

**© 2024 DevPossible, LLC. All rights reserved.**