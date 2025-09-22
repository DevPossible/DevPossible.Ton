Feature: TON Serializer
  As a TON serializer
  I need to convert document structures back to TON format
  So that I can save and transmit TON data

  Background:
    Given a TON serializer instance

  Scenario: Serialize empty object
    Given an empty TON object
    When I serialize with compact format
    Then the output should be "{}"

  Scenario: Serialize simple object with compact format
    Given a TON object with properties:
      | name  | type   | value |
      | name  | string | John  |
      | age   | number | 30    |
    When I serialize with compact format
    Then the output should be "{name = 'John', age = 30}"

  Scenario: Serialize simple object with pretty format
    Given a TON object with properties:
      | name  | type   | value |
      | name  | string | John  |
      | age   | number | 30    |
    When I serialize with pretty format
    Then the output should contain:
      """
      {
          name = $'John',
          age = %30
      }
      """

  Scenario: Serialize object with class name
    Given a TON object with class name "person"
    And the object has property "name" with value "John"
    When I serialize with compact format
    Then the output should be "{(person) name = 'John'}"

  Scenario: Serialize nested objects
    Given a TON object with nested structure:
      """
      {
        user: {
          name: "John",
          details: {
            age: 30,
            city: "New York"
          }
        }
      }
      """
    When I serialize with pretty format
    Then the output should contain proper indentation
    And the output should maintain the nested structure

  Scenario: Serialize arrays
    Given a TON object with property "numbers" containing array [1, 2, 3]
    When I serialize with compact format
    Then the output should be "{numbers = [1, 2, 3]}"

  Scenario: Serialize mixed arrays
    Given a TON object with property "items" containing array [1, "text", true, null]
    When I serialize with compact format
    Then the output should be "{items = [1, 'text', true, null]}"

  Scenario: Serialize enum values
    Given a TON object with property "status" containing enum "active"
    When I serialize with compact format
    Then the output should be "{status = |active|}"

  Scenario: Serialize enum sets
    Given a TON object with property "permissions" containing enum set ["read", "write", "execute"]
    When I serialize with compact format
    Then the output should be "{permissions = |read|write|execute|}"

  Scenario: Serialize GUID values
    Given a TON object with property "id" containing GUID "550e8400-e29b-41d4-a716-446655440000"
    When I serialize with compact format
    Then the output should be "{id = 550e8400-e29b-41d4-a716-446655440000}"

  Scenario: Serialize hexadecimal numbers
    Given a TON object with property "value" containing hex number 0xFF
    When I serialize with format preserving hex
    Then the output should be "{value = 0xFF}"

  Scenario: Serialize binary numbers
    Given a TON object with property "flags" containing binary number 0b1010
    When I serialize with format preserving binary
    Then the output should be "{flags = 0b1010}"

  Scenario: Serialize boolean values
    Given a TON object with properties:
      | name     | type    | value |
      | active   | boolean | true  |
      | disabled | boolean | false |
    When I serialize with compact format
    Then the output should be "{active = true, disabled = false}"

  Scenario: Serialize null and undefined
    Given a TON object with properties:
      | name   | type      | value     |
      | value1 | null      | null      |
      | value2 | undefined | undefined |
    When I serialize with compact format
    Then the output should be "{value1 = null, value2 = undefined}"

  Scenario: Serialize with type hints
    Given a TON object with properties:
      | name | type   | value | hint |
      | name | string | John  | $    |
      | age  | number | 30    | %    |
    When I serialize with pretty format including type hints
    Then the output should contain "$'John'" for name
    And the output should contain "%30" for age

  Scenario: Serialize multi-line strings
    Given a TON object with property "description" containing:
      """
      This is a
      multi-line string
      """
    When I serialize with pretty format
    Then the output should contain triple-quoted string
    And the string should preserve line breaks

  Scenario: Serialize numeric property names
    Given a TON object with numeric properties:
      | name | value |
      | 123  | value |
      | 2024 | year  |
    When I serialize with compact format
    Then the output should be "{123 = 'value', 2024 = 'year'}"

  Scenario: Serialize properties with @ prefix
    Given a TON object with property "@metadata" having value "test"
    When I serialize with compact format
    Then the output should be "{@metadata = 'test'}"

  Scenario: Serialize document with header
    Given a TON document with header:
      | key        | value |
      | tonVersion | 1.0   |
      | schema     | test  |
    And a root object with property "value" = 42
    When I serialize with pretty format
    Then the output should start with "#@ tonVersion = '1.0', @schema = 'test'"
    And the output should contain the object

  Scenario: Serialize with inline schema
    Given a TON document with inline schema defining "/value" as required integer
    And a root object with property "value" = 42
    When I serialize with pretty format
    Then the output should contain "#! { /value = int(required) }"

  Scenario: Serialize empty arrays
    Given a TON object with property "items" containing empty array
    When I serialize with compact format
    Then the output should be "{items = []}"

  Scenario: Serialize escaped strings
    Given a TON object with property "text" containing "Line 1\nLine 2\t\"quoted\""
    When I serialize with compact format
    Then the output should properly escape special characters

  Scenario: Serialize date values
    Given a TON object with property "created" containing date "2024-01-15T10:30:00Z"
    When I serialize with compact format
    Then the output should be "{created = '2024-01-15T10:30:00Z'}"

  Scenario: Serialize with custom options
    Given a TON object with multiple properties
    When I serialize with options:
      | option              | value |
      | omitNulls          | true  |
      | includeTypeHints   | false |
      | indentSize         | 2     |
      | quoteStyle         | single|
    Then the output should respect all formatting options

  Scenario: Serialize child objects
    Given a TON object with class "database"
    And a child object with class "connection" containing:
      | name | value     |
      | host | localhost |
      | port | 5432      |
    When I serialize with pretty format
    Then the output should show proper parent-child structure

  Scenario: Round-trip serialization
    Given a complex TON document
    When I parse the document
    And I serialize the parsed result
    And I parse the serialized output
    Then the final document should equal the original document

  Scenario: Serialize with comments preservation
    Given a TON document with comments
    When I serialize with comment preservation enabled
    Then the output should contain the original comments

  Scenario: Serialize large documents
    Given a TON object with 1000 properties
    When I serialize with compact format
    Then serialization should complete within 1 second
    And the output should contain all 1000 properties