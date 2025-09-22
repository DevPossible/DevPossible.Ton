Feature: TON Edge Cases and Error Handling
  As a TON parser
  I need to handle edge cases and errors gracefully
  So that the parser is robust and reliable

  Background:
    Given a TON parser with error handling

  # Empty and Whitespace Cases

  Scenario: Empty document
    When I parse ""
    Then result should be null or empty object

  Scenario: Only whitespace
    When I parse "   \n\t  "
    Then result should be null or empty object

  Scenario: Only comments
    When I parse:
      """
      // Just a comment
      /* Another comment */
      """
    Then result should be null or empty object

  # Brace and Bracket Errors

  Scenario: Missing closing brace
    When I parse "{ name = 'test'"
    Then should throw parse error
    And error should mention missing '}'
    And error should include line and column

  Scenario: Missing opening brace
    When I parse "name = 'test' }"
    Then should throw parse error
    And error should mention unexpected '}'

  Scenario: Mismatched brackets
    When I parse "{ items = [1, 2, 3} ]"
    Then should throw parse error
    And error should mention bracket mismatch

  Scenario: Missing array closing bracket
    When I parse "{ items = [1, 2, 3 }"
    Then should throw parse error
    And error should mention missing ']'

  Scenario: Extra array closing bracket
    When I parse "{ items = [1, 2, 3]] }"
    Then should throw parse error
    And error should mention unexpected ']'

  # Property Name Issues

  Scenario: Invalid property name with special char
    When I parse "{ @invalid = 'test' }"
    Then should throw parse error
    And error should mention invalid property name

  Scenario: Reserved keywords as property names
    When I parse "{ true = 'value' }"
    Then should throw parse error
    And error should mention reserved keyword

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

  Scenario: Unterminated string
    When I parse "{ text = 'unterminated }"
    Then should throw parse error
    And error should mention unterminated string
    And error should include line number

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

  Scenario: Invalid escape sequence
    When I parse "{ text = 'invalid\\q' }"
    Then should handle gracefully
    Or report warning about unknown escape

  Scenario: Invalid unicode escape
    When I parse "{ text = '\\u12GH' }"
    Then should throw parse error
    And error should mention invalid unicode

  # Number Format Errors

  Scenario: Invalid number format
    When I parse "{ value = 123abc }"
    Then should throw parse error
    And error should mention invalid number

  Scenario: Invalid hex number
    When I parse "{ value = 0xGHIJ }"
    Then should throw parse error
    And error should mention invalid hex

  Scenario: Invalid binary number
    When I parse "{ value = 0b123 }"
    Then should throw parse error
    And error should mention invalid binary

  Scenario: Integer overflow
    When I parse "{ value = 99999999999999999999999999999999 }"
    Then should handle as BigInt or float
    Or report overflow error

  Scenario: Float overflow
    When I parse "{ value = 1.0e999999 }"
    Then should report overflow error
    Or handle as infinity

  Scenario: Division by zero in expressions
    When I parse "{ value = 1/0 }"
    Then should handle as infinity
    Or report division by zero

  # Enum Errors

  Scenario: Invalid enum syntax - empty
    When I parse "{ status = | }"
    Then should throw parse error
    And error should mention empty enum

  Scenario: Empty enum value in set
    When I parse "{ status = |active|| }"
    Then should throw parse error
    And error should mention empty enum value

  Scenario: Unclosed enum
    When I parse "{ status = |active }"
    Then should throw parse error
    And error should mention unclosed enum

  Scenario: Invalid characters in enum
    When I parse "{ status = |active-now| }"
    Then should handle hyphen in enum
    Or report invalid character

  # GUID Errors

  Scenario: Invalid GUID format
    When I parse "{ id = {not-a-guid} }"
    Then should throw parse error
    And error should mention invalid GUID

  Scenario: Malformed GUID
    When I parse "{ id = {12345678-1234-1234-1234-12345678901Z} }"
    Then should throw parse error
    And error should mention GUID format

  Scenario: Incomplete GUID
    When I parse "{ id = {12345678-1234} }"
    Then should throw parse error
    And error should mention incomplete GUID

  # Syntax Errors

  Scenario: Missing equals sign
    When I parse "{ name 'value' }"
    Then should throw parse error
    And error should mention missing '='

  Scenario: Missing colon in type annotation
    When I parse "{ namestring = 'value' }"
    Then should parse as regular property
    Or report missing colon

  Scenario: Double equals
    When I parse "{ name == 'value' }"
    Then should throw parse error
    And error should mention invalid operator

  # Comma Issues

  Scenario: Trailing comma in object
    When I parse "{ name = 'test', }"
    Then should parse successfully
    And trailing comma should be ignored

  Scenario: Trailing comma in array
    When I parse "{ items = [1, 2, 3,] }"
    Then should parse successfully
    And trailing comma should be ignored

  Scenario: Leading comma
    When I parse "{ , name = 'test' }"
    Then should throw parse error
    And error should mention unexpected ','

  Scenario: Double comma
    When I parse "{ a = 1,, b = 2 }"
    Then should throw parse error
    And error should mention unexpected ','

  # Unicode and Special Characters

  Scenario: Unicode in property names
    When I parse "{ M = 'value' }"
    Then should handle unicode correctly
    And preserve character encoding

  Scenario: Unicode in string values
    When I parse "{ text = '`}L <' }"
    Then unicode should be preserved
    And emoji should work

  Scenario: Emoji in identifiers
    When I parse "{ =%hot = true }"
    Then should handle or reject appropriately
    And provide clear error if rejected

  Scenario: Zero-width characters
    When I parse document with zero-width joiners
    Then should handle invisibles appropriately
    And potentially warn about them

  Scenario: Right-to-left text
    When I parse "{ âÑèÙê = 'Hebrew', 'D91(J) = 'Arabic' }"
    Then should preserve directionality
    And handle mixed directions

  # Circular References

  Scenario: Circular reference detection
    Given objects with circular references
    When I serialize
    Then should detect and handle cycles
    Or report circular reference error

  Scenario: Deep circular reference
    Given deeply nested circular structure
    When I serialize
    Then should detect even deep cycles
    And not cause infinite loop

  Scenario: Self-referential structure
    Given object that references itself
    When I serialize
    Then should handle self-reference
    And provide meaningful output

  # Stack and Memory Limits

  Scenario: Stack depth limit
    Given deeply nested document (1000+ levels)
    When I parse
    Then should handle or limit depth
    And prevent stack overflow

  Scenario: Recursive schema validation
    Given schema with recursive definitions
    When I validate
    Then should handle recursion properly
    And not cause infinite loop

  Scenario: Maximum array size
    Given array with 1 million elements
    When I parse
    Then should handle large arrays
    Or report size limit exceeded

  # File and Encoding Issues

  Scenario: Mixed line endings
    Given document with \r\n, \r, and \n
    When I parse
    Then should handle all line endings
    And normalize consistently

  Scenario: BOM (Byte Order Mark)
    Given UTF-8 file with BOM
    When I parse
    Then BOM should be handled
    And not appear in parsed data

  Scenario: Invalid UTF-8 sequences
    Given file with invalid UTF-8
    When I parse
    Then should report encoding error
    Or handle with replacement character

  Scenario: Different encodings
    Given files in UTF-16, UTF-32
    When I parse
    Then should detect encoding
    Or require encoding specification

  # Type System Errors

  Scenario: Invalid type hint
    When I parse "{ value:unknown = 42 }"
    Then should handle unknown type
    Or report warning

  Scenario: Conflicting type hints
    When I parse "{ value:int = 'string' }"
    Then should report type mismatch
    Or coerce if possible

  Scenario: Type hint on non-value
    When I parse "{ value:string = null }"
    Then should handle null with type
    Or report incompatibility

  # I/O Errors

  Scenario: File not found
    When I try to parse non-existent file
    Then should throw appropriate error
    And error should be clear

  Scenario: Permission denied
    Given file without read permissions
    When I try to parse
    Then should throw permission error
    And suggest solution

  Scenario: Locked file
    Given file locked by another process
    When I try to parse
    Then should handle lock appropriately
    Or wait and retry

  Scenario: Network file timeout
    Given file on slow network drive
    When parsing times out
    Then should handle timeout gracefully
    And cleanup resources

  # Resource Limits

  Scenario: Memory exhaustion
    Given extremely large document
    When memory is limited
    Then should fail gracefully
    And provide meaningful error

  Scenario: Timeout handling
    Given parser with timeout
    When parsing takes too long
    Then should timeout cleanly
    And provide partial results if possible

  Scenario: CPU limit exceeded
    Given complex parsing task
    When CPU limit is reached
    Then should stop parsing
    And report resource limit

  # Special Cases

  Scenario: Comments in unexpected places
    When I parse "{ name /* comment */ = 'value' }"
    Then should handle mid-expression comments
    Or report unexpected comment

  Scenario: Null bytes in strings
    When I parse "{ text = 'has\0null' }"
    Then should handle or reject null bytes
    And provide clear error

  Scenario: Control characters
    When I parse document with control chars
    Then should handle or escape them
    And potentially warn

  Scenario: Very long property names
    Given property name with 10000 characters
    When I parse
    Then should handle or limit length
    And not cause buffer overflow

  Scenario: Extreme precision decimals
    When I parse "{ pi = 3.14159265358979323846264338327950288 }"
    Then should preserve precision
    Or round appropriately

  Scenario: Date parsing edge cases
    When I parse "{ date = '9999-99-99T99:99:99Z' }"
    Then should reject invalid date
    And report format error

  Scenario: Schema validation with undefined
    Given schema requiring property
    When document has undefined value
    Then should treat as missing
    And fail validation