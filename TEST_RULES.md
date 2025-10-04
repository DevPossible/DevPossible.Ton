# Test Rules and Guidelines

**CRITICAL: These rules override any default behavior when working with tests**

## Core Testing Principles

### 1. NEVER Reduce Test Functionality
- **DO NOT** simplify tests to make them pass
- **DO NOT** remove assertions to avoid failures
- **DO NOT** comment out failing test cases
- **DO NOT** reduce test coverage to fix compilation errors
- If a test fails, fix the implementation, not the test

### 2. Gherkin-Driven Testing
- Tests MUST be primarily driven by Gherkin feature files located in `/test/gherkin/` directory
- Each Gherkin scenario MUST have a unique Test ID (e.g., `@TestID: ARR-BASIC-001`)
- Test implementations MUST reference their Test ID in comments
- Test names and structure should reflect Gherkin scenarios
- When creating new tests, first check for corresponding Gherkin files
- See TEST_ID_GUIDELINES.md for Test ID format and usage

### 3. Test Parity Across Languages
- All language implementations (C#, JavaScript, Python) MUST have equivalent test coverage
- If a test exists in one language, it should exist in all others
- Test behavior and assertions must be consistent across implementations

### 4. Handling Test Failures

#### When Tests Fail Due to API Differences:
1. **FIX THE IMPLEMENTATION** to match expected behavior
2. Create adapter methods if needed to maintain consistent APIs
3. Document any unavoidable differences in implementation

#### When Tests Fail Due to Missing Features:
1. Implement the missing feature
2. If implementation is not immediate, create a stub that throws "Not Implemented"
3. Mark test as pending/skipped with clear explanation
4. Create a tracking issue for the missing feature

### 5. Test Structure Requirements

Each test file MUST include:
- Test ID reference in comments (e.g., `// @TestID: ARR-BASIC-001`)
- Clear test descriptions matching Gherkin scenarios
- All assertions from the original specification
- Proper setup and teardown
- Edge cases and error conditions
- Direct mapping to Gherkin scenario via Test ID

### 6. Forbidden Practices

**NEVER DO:**
- ❌ Reduce assertions to make tests pass
- ❌ Change expected values to match incorrect output
- ❌ Remove test cases that fail
- ❌ Simplify complex test scenarios
- ❌ Ignore Gherkin specifications
- ❌ Create tests that don't test actual functionality

### 7. Required Practices

**ALWAYS DO:**
- ✅ Maintain full test coverage from Gherkin files
- ✅ Fix implementation to match test expectations
- ✅ Keep test complexity that reflects real-world usage
- ✅ Ensure all edge cases are tested
- ✅ Match test structure to Gherkin Given/When/Then format

## Example Approach

### Wrong Approach:
```javascript
// Original test expects complex validation
test('should validate nested schema', () => {
  // Simplified to make it pass - WRONG!
  expect(true).toBe(true);
});
```

### Correct Approach:
```javascript
// @TestID: VAL-NESTED-001
// Original test expects complex validation
test('should validate nested schema', () => {
  // Implement the actual validation logic needed
  const result = validator.validateNested(schema, data);
  expect(result.valid).toBe(true);
  expect(result.errors).toHaveLength(0);
  // All original assertions maintained
});
```

## Gherkin File Locations and Test IDs

Primary Gherkin specifications are located in:
- `/test/gherkin/` - Main feature specifications

Each Gherkin scenario has a unique Test ID:
- Format: `@TestID: [CATEGORY]-[SUBCATEGORY]-[SEQUENCE]`
- Example: `@TestID: ARR-BASIC-001`
- Must be referenced in all language implementations

### Available Feature Files:
- `arrays.feature` - Array handling and validation
- `edge-cases.feature` - Edge cases and error conditions
- `formatter.feature` - TON formatting (Pretty, Compact styles)
- `integration.feature` - End-to-end integration scenarios
- `lexer.feature` - Tokenization and lexical analysis
- `multiline-strings.feature` - Multi-line string handling
- `numeric-properties.feature` - Numeric property handling
- `parser.feature` - Parsing TON documents
- `performance.feature` - Performance requirements
- `serializer.feature` - Serialization scenarios
- `validator.feature` - Schema validation

## Implementation Priority

When implementing tests from Gherkin files:
1. Parse the feature file
2. Identify all scenarios
3. Create test structure matching Given/When/Then
4. Implement all steps without simplification
5. Verify tests against all acceptance criteria

## Handling Missing Functionality

If functionality required by tests doesn't exist:
1. **First Priority**: Implement the missing functionality
2. **Second Priority**: Create detailed stub with "Not Implemented" error
3. **Third Priority**: Mark test as pending with implementation plan
4. **Never**: Remove or simplify the test

## Review Checklist

Before modifying any test:
- [ ] Have I checked the corresponding Gherkin file and Test ID?
- [ ] Have I preserved the Test ID reference in the code?
- [ ] Am I maintaining all original assertions?
- [ ] Am I fixing implementation rather than tests?
- [ ] Does this maintain parity across all languages?
- [ ] Are all edge cases still covered?
- [ ] Is the Test ID consistent across all implementations?

---

**Remember: Tests define the contract. Change the implementation to meet the contract, never change the contract to match a broken implementation.**

**© 2024 DevPossible, LLC. All rights reserved.**