Feature: TON Edge Cases and Error Handling
  As a TON parser
  I need to handle edge cases and errors gracefully
  So that the parser is robust and reliable

  Background:
    Given a TON parser with error handling

  # Empty and Whitespace Cases

  # @TestID: EDG-BASIC-001
  # Test parsing of completely empty document
  Scenario: Empty document
    When I parse ""
    Then result should be null or empty object

  # @TestID: EDG-BASIC-002
  # Test parsing of document with only whitespace characters
  Scenario: Only whitespace
    When I parse "   \n\t  "
    Then result should be null or empty object

  # @TestID: EDG-BASIC-003
  # Test parsing of document with only comments
  Scenario: Only comments
    When I parse:
      """
      // Just a comment
      /* Another comment */
      """
    Then result should be null or empty object

  # Brace and Bracket Errors

  # @TestID: EDG-ERROR-001
  # Test error handling for missing closing brace
  Scenario: Missing closing brace
    When I parse "{ name = 'test'"
    Then should throw parse error
    And error should mention missing '}'
    And error should include line and column

  # @TestID: EDG-ERROR-002
  # Test error handling for missing opening brace
  Scenario: Missing opening brace
    When I parse "name = 'test' }"
    Then should throw parse error
    And error should mention unexpected '}'

  # @TestID: EDG-ERROR-003
  # Test error handling for mismatched brackets
  Scenario: Mismatched brackets
    When I parse "{ items = [1, 2, 3} ]"
    Then should throw parse error
    And error should mention bracket mismatch

  # @TestID: EDG-ERROR-004
  # Test error handling for missing array closing bracket
  Scenario: Missing array closing bracket
    When I parse "{ items = [1, 2, 3 }"
    Then should throw parse error
    And error should mention missing ']'

  # @TestID: EDG-ERROR-005
  # Test error handling for extra array closing bracket
  Scenario: Extra array closing bracket
    When I parse "{ items = [1, 2, 3]] }"
    Then should throw parse error
    And error should mention unexpected ']'

  # Property Name Issues

  # @TestID: EDG-ERROR-006
  # Test error handling for invalid property name with special characters
  Scenario: Invalid property name with special char
    When I parse "{ @invalid = 'test' }"
    Then should throw parse error
    And error should mention invalid property name

  # @TestID: EDG-ERROR-007
  # Test error handling for reserved keywords used as property names
  Scenario: Reserved keywords as property names
    When I parse "{ true = 'value' }"
    Then should throw parse error
    And error should mention reserved keyword

  # @TestID: EDG-EDGE-001
  # Test handling of duplicate properties in normal mode
  Scenario: Duplicate properties
    When I parse:
      """
      {
        name = 'first',
        name = 'second'
      }
      """
    Then last value should win
    Or parser should report warning

  # @TestID: EDG-ERROR-008
  # Test error handling for duplicate properties in strict mode
  Scenario: Duplicate properties in strict mode
    Given parser in strict mode
    When I parse:
      """
      {
        id = 1,
        id = 2
      }
      """
    Then should throw parse error
    And error should mention duplicate property

  # String Errors

  # @TestID: EDG-ERROR-009
  # Test error handling for unterminated string
  Scenario: Unterminated string
    When I parse "{ text = 'unterminated }"
    Then should throw parse error
    And error should mention unterminated string
    And error should include line number

  # @TestID: EDG-ERROR-010
  # Test error handling for unterminated multi-line string
  Scenario: Unterminated multi-line string
    When I parse:
      """
      {
        text = """
        This is never closed
      }
      """
    Then should throw parse error
    And error should mention unterminated multi-line string

  # @TestID: EDG-ERROR-011
  # Test handling of invalid escape sequences
  Scenario: Invalid escape sequence
    When I parse "{ text = 'invalid\\q' }"
    Then should handle gracefully
    Or report warning about unknown escape

  # @TestID: EDG-ERROR-012
  # Test error handling for invalid unicode escape sequences
  Scenario: Invalid unicode escape
    When I parse "{ text = '\\u12GH' }"
    Then should throw parse error
    And error should mention invalid unicode

  # Number Format Errors

  # @TestID: EDG-ERROR-013
  # Test error handling for invalid number format
  Scenario: Invalid number format
    When I parse "{ value = 123abc }"
    Then should throw parse error
    And error should mention invalid number

  # @TestID: EDG-ERROR-014
  # Test error handling for invalid hexadecimal number
  Scenario: Invalid hex number
    When I parse "{ value = 0xGHIJ }"
    Then should throw parse error
    And error should mention invalid hex

  # @TestID: EDG-ERROR-015
  # Test error handling for invalid binary number
  Scenario: Invalid binary number
    When I parse "{ value = 0b123 }"
    Then should throw parse error
    And error should mention invalid binary

  # @TestID: EDG-EDGE-002
  # Test handling of integer overflow conditions
  Scenario: Integer overflow
    When I parse "{ value = 99999999999999999999999999999999 }"
    Then should handle as BigInt or float
    Or report overflow error

  # @TestID: EDG-EDGE-003
  # Test handling of floating point overflow conditions
  Scenario: Float overflow
    When I parse "{ value = 1.0e999999 }"
    Then should report overflow error
    Or handle as infinity

  # @TestID: EDG-EDGE-004
  # Test handling of division by zero in expressions
  Scenario: Division by zero in expressions
    When I parse "{ value = 1/0 }"
    Then should handle as infinity
    Or report division by zero

  # Enum Errors

  # @TestID: EDG-ERROR-016
  # Test error handling for empty enum syntax
  Scenario: Invalid enum syntax - empty
    When I parse "{ status = | }"
    Then should throw parse error
    And error should mention empty enum

  # @TestID: EDG-ERROR-017
  # Test error handling for empty enum value in set
  Scenario: Empty enum value in set
    When I parse "{ status = |active|| }"
    Then should throw parse error
    And error should mention empty enum value

  # @TestID: EDG-ERROR-018
  # Test error handling for unclosed enum
  Scenario: Unclosed enum
    When I parse "{ status = |active }"
    Then should throw parse error
    And error should mention unclosed enum

  # @TestID: EDG-EDGE-005
  # Test handling of invalid characters in enum values
  Scenario: Invalid characters in enum
    When I parse "{ status = |active-now| }"
    Then should handle hyphen in enum
    Or report invalid character

  # GUID Errors

  # @TestID: EDG-ERROR-019
  # Test error handling for invalid GUID format
  Scenario: Invalid GUID format
    When I parse "{ id = {not-a-guid} }"
    Then should throw parse error
    And error should mention invalid GUID

  # @TestID: EDG-ERROR-020
  # Test error handling for malformed GUID
  Scenario: Malformed GUID
    When I parse "{ id = {12345678-1234-1234-1234-12345678901Z} }"
    Then should throw parse error
    And error should mention GUID format

  # @TestID: EDG-ERROR-021
  # Test error handling for incomplete GUID
  Scenario: Incomplete GUID
    When I parse "{ id = {12345678-1234} }"
    Then should throw parse error
    And error should mention incomplete GUID

  # Syntax Errors

  # @TestID: EDG-ERROR-022
  # Test error handling for missing equals sign
  Scenario: Missing equals sign
    When I parse "{ name 'value' }"
    Then should throw parse error
    And error should mention missing '='

  # @TestID: EDG-EDGE-006
  # Test handling of missing colon in type annotation
  Scenario: Missing colon in type annotation
    When I parse "{ namestring = 'value' }"
    Then should parse as regular property
    Or report missing colon

  # @TestID: EDG-ERROR-023
  # Test error handling for double equals operator
  Scenario: Double equals
    When I parse "{ name == 'value' }"
    Then should throw parse error
    And error should mention invalid operator

  # Comma Issues

  # @TestID: EDG-EDGE-007
  # Test handling of trailing comma in object
  Scenario: Trailing comma in object
    When I parse "{ name = 'test', }"
    Then should parse successfully
    And trailing comma should be ignored

  # @TestID: EDG-EDGE-008
  # Test handling of trailing comma in array
  Scenario: Trailing comma in array
    When I parse "{ items = [1, 2, 3,] }"
    Then should parse successfully
    And trailing comma should be ignored

  # @TestID: EDG-ERROR-024
  # Test error handling for leading comma
  Scenario: Leading comma
    When I parse "{ , name = 'test' }"
    Then should throw parse error
    And error should mention unexpected ','

  # @TestID: EDG-ERROR-025
  # Test error handling for double comma
  Scenario: Double comma
    When I parse "{ a = 1,, b = 2 }"
    Then should throw parse error
    And error should mention unexpected ','

  # Unicode and Special Characters

  # @TestID: EDG-EDGE-009
  # Test handling of unicode characters in property names
  Scenario: Unicode in property names
    When I parse "{ M = 'value' }"
    Then should handle unicode correctly
    And preserve character encoding

  # @TestID: EDG-EDGE-010
  # Test handling of unicode characters in string values
  Scenario: Unicode in string values
    When I parse "{ text = '`}L <' }"
    Then unicode should be preserved
    And emoji should work

  # @TestID: EDG-EDGE-011
  # Test handling of emoji in identifiers
  Scenario: Emoji in identifiers
    When I parse "{ =%hot = true }"
    Then should handle or reject appropriately
    And provide clear error if rejected

  # @TestID: EDG-EDGE-012
  # Test handling of zero-width characters
  Scenario: Zero-width characters
    When I parse document with zero-width joiners
    Then should handle invisibles appropriately
    And potentially warn about them

  # @TestID: EDG-EDGE-013
  # Test handling of right-to-left text
  Scenario: Right-to-left text
    When I parse "{ ����� = 'Hebrew', 'D91(J) = 'Arabic' }"
    Then should preserve directionality
    And handle mixed directions

  # Circular References

  # @TestID: EDG-EDGE-014
  # Test detection of circular references during serialization
  Scenario: Circular reference detection
    Given objects with circular references
    When I serialize
    Then should detect and handle cycles
    Or report circular reference error

  # @TestID: EDG-EDGE-015
  # Test detection of deep circular references
  Scenario: Deep circular reference
    Given deeply nested circular structure
    When I serialize
    Then should detect even deep cycles
    And not cause infinite loop

  # @TestID: EDG-EDGE-016
  # Test handling of self-referential structures
  Scenario: Self-referential structure
    Given object that references itself
    When I serialize
    Then should handle self-reference
    And provide meaningful output

  # Stack and Memory Limits

  # @TestID: EDG-EDGE-017
  # Test handling of deeply nested documents with stack depth limits
  Scenario: Stack depth limit
    Given deeply nested document (1000+ levels)
    When I parse
    Then should handle or limit depth
    And prevent stack overflow

  # @TestID: EDG-EDGE-018
  # Test handling of recursive schema validation
  Scenario: Recursive schema validation
    Given schema with recursive definitions
    When I validate
    Then should handle recursion properly
    And not cause infinite loop

  # @TestID: EDG-EDGE-019
  # Test handling of arrays with maximum size
  Scenario: Maximum array size
    Given array with 1 million elements
    When I parse
    Then should handle large arrays
    Or report size limit exceeded

  # File and Encoding Issues

  # @TestID: EDG-EDGE-020
  # Test handling of mixed line endings
  Scenario: Mixed line endings
    Given document with \r\n, \r, and \n
    When I parse
    Then should handle all line endings
    And normalize consistently

  # @TestID: EDG-EDGE-021
  # Test handling of Byte Order Mark (BOM)
  Scenario: BOM (Byte Order Mark)
    Given UTF-8 file with BOM
    When I parse
    Then BOM should be handled
    And not appear in parsed data

  # @TestID: EDG-ERROR-026
  # Test error handling for invalid UTF-8 sequences
  Scenario: Invalid UTF-8 sequences
    Given file with invalid UTF-8
    When I parse
    Then should report encoding error
    Or handle with replacement character

  # @TestID: EDG-EDGE-022
  # Test handling of different text encodings
  Scenario: Different encodings
    Given files in UTF-16, UTF-32
    When I parse
    Then should detect encoding
    Or require encoding specification

  # Type System Errors

  # @TestID: EDG-ERROR-027
  # Test handling of invalid type hints
  Scenario: Invalid type hint
    When I parse "{ value:unknown = 42 }"
    Then should handle unknown type
    Or report warning

  # @TestID: EDG-ERROR-028
  # Test handling of conflicting type hints
  Scenario: Conflicting type hints
    When I parse "{ value:int = 'string' }"
    Then should report type mismatch
    Or coerce if possible

  # @TestID: EDG-EDGE-023
  # Test handling of type hints on null values
  Scenario: Type hint on non-value
    When I parse "{ value:string = null }"
    Then should handle null with type
    Or report incompatibility

  # I/O Errors

  # @TestID: EDG-ERROR-029
  # Test error handling for file not found
  Scenario: File not found
    When I try to parse non-existent file
    Then should throw appropriate error
    And error should be clear

  # @TestID: EDG-ERROR-030
  # Test error handling for permission denied
  Scenario: Permission denied
    Given file without read permissions
    When I try to parse
    Then should throw permission error
    And suggest solution

  # @TestID: EDG-ERROR-031
  # Test handling of locked files
  Scenario: Locked file
    Given file locked by another process
    When I try to parse
    Then should handle lock appropriately
    Or wait and retry

  # @TestID: EDG-ERROR-032
  # Test handling of network file timeouts
  Scenario: Network file timeout
    Given file on slow network drive
    When parsing times out
    Then should handle timeout gracefully
    And cleanup resources

  # Resource Limits

  # @TestID: EDG-ERROR-033
  # Test handling of memory exhaustion
  Scenario: Memory exhaustion
    Given extremely large document
    When memory is limited
    Then should fail gracefully
    And provide meaningful error

  # @TestID: EDG-ERROR-034
  # Test handling of parsing timeouts
  Scenario: Timeout handling
    Given parser with timeout
    When parsing takes too long
    Then should timeout cleanly
    And provide partial results if possible

  # @TestID: EDG-ERROR-035
  # Test handling of CPU limit exceeded
  Scenario: CPU limit exceeded
    Given complex parsing task
    When CPU limit is reached
    Then should stop parsing
    And report resource limit

  # Special Cases

  # @TestID: EDG-EDGE-024
  # Test handling of comments in unexpected places
  Scenario: Comments in unexpected places
    When I parse "{ name /* comment */ = 'value' }"
    Then should handle mid-expression comments
    Or report unexpected comment

  # @TestID: EDG-EDGE-025
  # Test handling of null bytes in strings
  Scenario: Null bytes in strings
    When I parse "{ text = 'has\0null' }"
    Then should handle or reject null bytes
    And provide clear error

  # @TestID: EDG-EDGE-026
  # Test handling of control characters
  Scenario: Control characters
    When I parse document with control chars
    Then should handle or escape them
    And potentially warn

  # @TestID: EDG-EDGE-027
  # Test handling of very long property names
  Scenario: Very long property names
    Given property name with 10000 characters
    When I parse
    Then should handle or limit length
    And not cause buffer overflow

  # @TestID: EDG-EDGE-028
  # Test handling of extreme precision decimals
  Scenario: Extreme precision decimals
    When I parse "{ pi = 3.14159265358979323846264338327950288 }"
    Then should preserve precision
    Or round appropriately

  # @TestID: EDG-EDGE-029
  # Test handling of date parsing edge cases
  Scenario: Date parsing edge cases
    When I parse "{ date = '9999-99-99T99:99:99Z' }"
    Then should reject invalid date
    And report format error

  # @TestID: EDG-EDGE-030
  # Test schema validation with undefined values
  Scenario: Schema validation with undefined
    Given schema requiring property
    When document has undefined value
    Then should treat as missing
    And fail validation