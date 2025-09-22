Feature: TON Lexer Tokenization
  As a TON parser
  I need to tokenize TON input into discrete tokens
  So that I can parse the document structure

  Background:
    Given a TON lexer instance

  Scenario: Tokenize basic structure
    When I tokenize "{ }"
    Then I should get 2 tokens
    And token 0 should be LeftBrace
    And token 1 should be RightBrace

  Scenario: Tokenize object with class name
    When I tokenize "{(person)}"
    Then I should get 5 tokens
    And token 0 should be LeftBrace
    And token 1 should be LeftParen
    And token 2 should be Identifier with value "person"
    And token 3 should be RightParen
    And token 4 should be RightBrace

  Scenario: Tokenize properties
    When I tokenize "name = 'John', age = 30"
    Then the tokens should contain Identifier "name"
    And the tokens should contain Equals
    And the tokens should contain String "John"
    And the tokens should contain Comma
    And the tokens should contain Identifier "age"
    And the tokens should contain Number "30"

  Scenario: Tokenize single-quoted strings
    When I tokenize "'Hello World'"
    Then the first token should be String with value "Hello World"

  Scenario: Tokenize double-quoted strings
    When I tokenize "\"Hello World\""
    Then the first token should be String with value "Hello World"

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

  Scenario: Tokenize hexadecimal numbers
    When I tokenize "0xFF"
    Then the first token should be HexNumber with value "0xFF"

  Scenario: Tokenize binary numbers
    When I tokenize "0b1010"
    Then the first token should be BinaryNumber with value "0b1010"

  Scenario Outline: Tokenize boolean values
    When I tokenize "<input>"
    Then the first token should be Boolean with value "<value>"

    Examples:
      | input | value |
      | true  | true  |
      | false | false |

  Scenario: Tokenize null value
    When I tokenize "null"
    Then the first token should be Null

  Scenario: Tokenize undefined value
    When I tokenize "undefined"
    Then the first token should be Undefined

  Scenario: Tokenize enum value
    When I tokenize "|status|"
    Then I should get 3 tokens
    And token 0 should be Pipe
    And token 1 should be Identifier with value "status"
    And token 2 should be Pipe

  Scenario: Tokenize enum set
    When I tokenize "|read|write|execute|"
    Then I should get 6 tokens
    And the tokens should be Pipe, Identifier, Pipe, Identifier, Pipe, Identifier, Pipe

  Scenario: Tokenize GUID with braces
    When I tokenize "{550e8400-e29b-41d4-a716-446655440000}"
    Then the first token should be Guid with value "550e8400-e29b-41d4-a716-446655440000"

  Scenario: Tokenize GUID without braces
    When I tokenize "550e8400-e29b-41d4-a716-446655440000"
    Then the first token should be Guid with value "550e8400-e29b-41d4-a716-446655440000"

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

  Scenario: Skip single-line comments
    When I tokenize "// This is a comment\nvalue = 42"
    Then the tokens should contain Identifier "value"
    And the tokens should contain Number "42"
    And the tokens should not contain "This is a comment"

  Scenario: Skip multi-line comments
    When I tokenize "/* Multi\nline\ncomment */\nvalue = 42"
    Then the tokens should contain Identifier "value"
    And the tokens should contain Number "42"
    And the tokens should not contain "Multi"

  Scenario: Tokenize type hints
    When I tokenize "$'string' %123 &true ^null"
    Then I should get 4 tokens
    And token 0 should be String with value "string" and type hint "$"
    And token 1 should be Number with value "123" and type hint "%"
    And token 2 should be Boolean with value "true" and type hint "&"
    And token 3 should be Null with type hint "^"

  Scenario: Track token positions
    When I tokenize "{\n  name = 'John'\n}"
    Then each token should have line and column information
    And the "name" token should be at line 2, column 3

  Scenario: Handle numeric property names
    When I tokenize "123 = 'value'"
    Then token 0 should be Number with value "123"
    And token 1 should be Equals
    And token 2 should be String with value "value"

  Scenario: Tokenize property with @ prefix
    When I tokenize "@metadata = 'test'"
    Then token 0 should be At
    And token 1 should be Identifier with value "metadata"
    And token 2 should be Equals
    And token 3 should be String with value "test"

  Scenario: Handle quoted property names
    When I tokenize "\"complex-name\" = 'value'"
    Then token 0 should be String with value "complex-name"
    And token 1 should be Equals
    And token 2 should be String with value "value"

  Scenario: Tokenize triple-quoted strings
    When I tokenize "\"\"\"Multi-line\nstring\"\"\""
    Then the first token should be String with value "Multi-line\nstring"

  Scenario: Handle invalid tokens
    When I tokenize "{ @ }"
    Then an error should be reported for unexpected character "@"