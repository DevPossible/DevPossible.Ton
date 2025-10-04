Feature: TON Lexer Tokenization
  As a TON parser
  I need to tokenize TON input into discrete tokens
  So that I can parse the document structure

  Background:
    Given a TON lexer instance

  # @TestID: LEX-BASIC-001
  # Test tokenization of basic brace structure
  Scenario: Tokenize basic structure
    When I tokenize "{ }"
    Then I should get 2 tokens
    And token 0 should be LeftBrace
    And token 1 should be RightBrace

  # @TestID: LEX-BASIC-002
  # Test tokenization of object with class name in parentheses
  Scenario: Tokenize object with class name
    When I tokenize "{(person)}"
    Then I should get 5 tokens
    And token 0 should be LeftBrace
    And token 1 should be LeftParen
    And token 2 should be Identifier with value "person"
    And token 3 should be RightParen
    And token 4 should be RightBrace

  # @TestID: LEX-BASIC-003
  # Test tokenization of property assignments
  Scenario: Tokenize properties
    When I tokenize "name = 'John', age = 30"
    Then the tokens should contain Identifier "name"
    And the tokens should contain Equals
    And the tokens should contain String "John"
    And the tokens should contain Comma
    And the tokens should contain Identifier "age"
    And the tokens should contain Number "30"

  # @TestID: LEX-BASIC-004
  # Test tokenization of single-quoted strings
  Scenario: Tokenize single-quoted strings
    When I tokenize "'Hello World'"
    Then the first token should be String with value "Hello World"

  # @TestID: LEX-BASIC-005
  # Test tokenization of double-quoted strings
  Scenario: Tokenize double-quoted strings
    When I tokenize "\"Hello World\""
    Then the first token should be String with value "Hello World"

  # @TestID: LEX-COMPLEX-001
  # Test handling of escape sequences in strings
  Scenario Outline: Handle escape sequences
    When I tokenize "<input>"
    Then the first token should be String with value "<expected>"

    Examples:
      | input                    | expected            |
      | "'Hello\\nWorld'"        | Hello\nWorld        |
      | "'Tab\\there'"           | Tab\there           |
      | "'Quote\\'s'"            | Quote's             |
      | "\"Backslash\\\\\""      | Backslash\\         |
      | "'Unicode\\u0041'"       | UnicodeA            |

  # @TestID: LEX-BASIC-006
  # Test tokenization of various number formats
  Scenario Outline: Tokenize numbers
    When I tokenize "<input>"
    Then the first token should be Number with value "<value>"

    Examples:
      | input     | value     |
      | 123       | 123       |
      | -456      | -456      |
      | 3.14      | 3.14      |
      | -2.5      | -2.5      |
      | 0         | 0         |
      | 1e5       | 1e5       |
      | 1.5e-2    | 1.5e-2    |

  # @TestID: LEX-BASIC-007
  # Test tokenization of hexadecimal numbers
  Scenario: Tokenize hexadecimal numbers
    When I tokenize "0xFF"
    Then the first token should be HexNumber with value "0xFF"

  # @TestID: LEX-BASIC-008
  # Test tokenization of binary numbers
  Scenario: Tokenize binary numbers
    When I tokenize "0b1010"
    Then the first token should be BinaryNumber with value "0b1010"

  # @TestID: LEX-BASIC-009
  # Test tokenization of boolean values
  Scenario Outline: Tokenize boolean values
    When I tokenize "<input>"
    Then the first token should be Boolean with value "<value>"

    Examples:
      | input | value |
      | true  | true  |
      | false | false |

  # @TestID: LEX-BASIC-010
  # Test tokenization of null value
  Scenario: Tokenize null value
    When I tokenize "null"
    Then the first token should be Null

  # @TestID: LEX-BASIC-011
  # Test tokenization of undefined value
  Scenario: Tokenize undefined value
    When I tokenize "undefined"
    Then the first token should be Undefined

  # @TestID: LEX-BASIC-012
  # Test tokenization of single enum value
  Scenario: Tokenize enum value
    When I tokenize "|status|"
    Then I should get 3 tokens
    And token 0 should be Pipe
    And token 1 should be Identifier with value "status"
    And token 2 should be Pipe

  # @TestID: LEX-BASIC-013
  # Test tokenization of enum set with multiple values
  Scenario: Tokenize enum set
    When I tokenize "|read|write|execute|"
    Then I should get 6 tokens
    And the tokens should be Pipe, Identifier, Pipe, Identifier, Pipe, Identifier, Pipe

  # @TestID: LEX-BASIC-014
  # Test tokenization of GUID with braces
  Scenario: Tokenize GUID with braces
    When I tokenize "{550e8400-e29b-41d4-a716-446655440000}"
    Then the first token should be Guid with value "550e8400-e29b-41d4-a716-446655440000"

  # @TestID: LEX-BASIC-015
  # Test tokenization of GUID without braces
  Scenario: Tokenize GUID without braces
    When I tokenize "550e8400-e29b-41d4-a716-446655440000"
    Then the first token should be Guid with value "550e8400-e29b-41d4-a716-446655440000"

  # @TestID: LEX-BASIC-016
  # Test tokenization of array with elements
  Scenario: Tokenize arrays
    When I tokenize "[1, 2, 3]"
    Then I should get 7 tokens
    And token 0 should be LeftBracket
    And token 1 should be Number with value "1"
    And token 2 should be Comma
    And token 3 should be Number with value "2"
    And token 4 should be Comma
    And token 5 should be Number with value "3"
    And token 6 should be RightBracket

  # @TestID: LEX-BASIC-017
  # Test skipping single-line comments during tokenization
  Scenario: Skip single-line comments
    When I tokenize "// This is a comment\nvalue = 42"
    Then the tokens should contain Identifier "value"
    And the tokens should contain Number "42"
    And the tokens should not contain "This is a comment"

  # @TestID: LEX-BASIC-018
  # Test skipping multi-line comments during tokenization
  Scenario: Skip multi-line comments
    When I tokenize "/* Multi\nline\ncomment */\nvalue = 42"
    Then the tokens should contain Identifier "value"
    And the tokens should contain Number "42"
    And the tokens should not contain "Multi"

  # @TestID: LEX-COMPLEX-002
  # Test tokenization of values with type hints
  Scenario: Tokenize type hints
    When I tokenize "$'string' %123 &true ^null"
    Then I should get 4 tokens
    And token 0 should be String with value "string" and type hint "$"
    And token 1 should be Number with value "123" and type hint "%"
    And token 2 should be Boolean with value "true" and type hint "&"
    And token 3 should be Null with type hint "^"

  # @TestID: LEX-BASIC-019
  # Test tracking of token line and column positions
  Scenario: Track token positions
    When I tokenize "{\n  name = 'John'\n}"
    Then each token should have line and column information
    And the "name" token should be at line 2, column 3

  # @TestID: LEX-EDGE-001
  # Test handling of numeric property names
  Scenario: Handle numeric property names
    When I tokenize "123 = 'value'"
    Then token 0 should be Number with value "123"
    And token 1 should be Equals
    And token 2 should be String with value "value"

  # @TestID: LEX-BASIC-020
  # Test tokenization of properties with @ prefix
  Scenario: Tokenize property with @ prefix
    When I tokenize "@metadata = 'test'"
    Then token 0 should be At
    And token 1 should be Identifier with value "metadata"
    And token 2 should be Equals
    And token 3 should be String with value "test"

  # @TestID: LEX-EDGE-002
  # Test handling of quoted property names
  Scenario: Handle quoted property names
    When I tokenize "\"complex-name\" = 'value'"
    Then token 0 should be String with value "complex-name"
    And token 1 should be Equals
    And token 2 should be String with value "value"

  # @TestID: LEX-COMPLEX-003
  # Test tokenization of triple-quoted multi-line strings
  Scenario: Tokenize triple-quoted strings
    When I tokenize "\"\"\"Multi-line\nstring\"\"\""
    Then the first token should be String with value "Multi-line\nstring"

  # @TestID: LEX-ERROR-001
  # Test error handling for invalid token characters
  Scenario: Handle invalid tokens
    When I tokenize "{ @ }"
    Then an error should be reported for unexpected character "@"