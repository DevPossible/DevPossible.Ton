Feature: TON Parser
  As a TON parser
  I need to parse tokenized input into a document structure
  So that I can work with TON data

  Background:
    Given a TON parser instance

  # @TestID: PRS-BASIC-001
  # Test parsing of empty object
  Scenario: Parse empty object
    When I parse "{}"
    Then the document should have a root object
    And the root object should have 0 properties

  # @TestID: PRS-BASIC-002
  # Test parsing of simple object with basic properties
  Scenario: Parse simple object
    When I parse "{ name = 'John', age = 30 }"
    Then the root object should have 2 properties
    And property "name" should have value "John"
    And property "age" should have value 30

  # @TestID: PRS-BASIC-003
  # Test parsing of object with class name in parentheses
  Scenario: Parse object with class name
    When I parse "{(person) name = 'John' }"
    Then the root object should have class name "person"
    And property "name" should have value "John"

  # @TestID: PRS-NESTED-001
  # Test parsing of nested object structures
  Scenario: Parse nested objects
    When I parse """
    {
      user = {
        name = 'John',
        details = {
          age = 30,
          city = 'New York'
        }
      }
    }
    """
    Then property "user" should be an object
    And property "user.name" should have value "John"
    And property "user.details" should be an object
    And property "user.details.age" should have value 30
    And property "user.details.city" should have value "New York"

  # @TestID: PRS-BASIC-004
  # Test parsing of arrays with numeric elements
  Scenario: Parse arrays
    When I parse "{ numbers = [1, 2, 3] }"
    Then property "numbers" should be an array
    And the array should have 3 elements
    And array element 0 should be 1
    And array element 1 should be 2
    And array element 2 should be 3

  # @TestID: PRS-BASIC-005
  # Test parsing of arrays with mixed data types
  Scenario: Parse mixed arrays
    When I parse "{ items = [1, 'text', true, null] }"
    Then property "items" should be an array with 4 elements
    And array element 0 should be number 1
    And array element 1 should be string "text"
    And array element 2 should be boolean true
    And array element 3 should be null

  # @TestID: PRS-NESTED-002
  # Test parsing of nested array structures
  Scenario: Parse nested arrays
    When I parse "{ matrix = [[1, 2], [3, 4]] }"
    Then property "matrix" should be an array with 2 elements
    And array element 0 should be an array with 2 elements
    And array element 1 should be an array with 2 elements

  # @TestID: PRS-BASIC-006
  # Test parsing of single enum values
  Scenario: Parse enum values
    When I parse "{ status = |active| }"
    Then property "status" should be enum "active"

  # @TestID: PRS-BASIC-007
  # Test parsing of enum sets with multiple values
  Scenario: Parse enum sets
    When I parse "{ permissions = |read|write|execute| }"
    Then property "permissions" should be enum set with values "read", "write", "execute"

  # @TestID: PRS-BASIC-008
  # Test parsing of GUID values
  Scenario: Parse GUIDs
    When I parse "{ id = 550e8400-e29b-41d4-a716-446655440000 }"
    Then property "id" should be GUID "550e8400-e29b-41d4-a716-446655440000"

  # @TestID: PRS-BASIC-009
  # Test parsing of hexadecimal number values
  Scenario: Parse hexadecimal numbers
    When I parse "{ value = 0xFF }"
    Then property "value" should have numeric value 255

  # @TestID: PRS-BASIC-010
  # Test parsing of binary number values
  Scenario: Parse binary numbers
    When I parse "{ flags = 0b1010 }"
    Then property "flags" should have numeric value 10

  # @TestID: PRS-BASIC-011
  # Test parsing of boolean true and false values
  Scenario: Parse boolean values
    When I parse "{ active = true, disabled = false }"
    Then property "active" should be boolean true
    And property "disabled" should be boolean false

  # @TestID: PRS-BASIC-012
  # Test parsing of null and undefined values
  Scenario: Parse null and undefined
    When I parse "{ value1 = null, value2 = undefined }"
    Then property "value1" should be null
    And property "value2" should be undefined

  # @TestID: PRS-BASIC-013
  # Test parsing of numbers in scientific notation
  Scenario: Parse scientific notation
    When I parse "{ value = 1.5e-10 }"
    Then property "value" should have numeric value 1.5e-10

  # @TestID: PRS-COMPLEX-001
  # Test parsing of multi-line strings with triple quotes
  Scenario: Parse multi-line strings
    When I parse """
    {
      description = """
        This is a
        multi-line string
      """
    }
    """
    Then property "description" should contain "This is a\nmulti-line string"

  # @TestID: PRS-BASIC-014
  # Test parsing of numeric property names
  Scenario: Parse numeric property names
    When I parse "{ 123 = 'value', 2024 = 'year' }"
    Then property "123" should have value "value"
    And property "2024" should have value "year"

  # @TestID: PRS-BASIC-015
  # Test parsing of properties with @ prefix
  Scenario: Parse properties with @ prefix
    When I parse "{ @metadata = 'test' }"
    Then property "@metadata" should have value "test"

  # @TestID: PRS-COMPLEX-002
  # Test parsing of values with type hints
  Scenario: Parse type hints
    When I parse "{ name = $'John', age = %30 }"
    Then property "name" should have value "John" with type hint "$"
    And property "age" should have value 30 with type hint "%"

  # @TestID: PRS-COMPLEX-003
  # Test parsing of child objects with class names
  Scenario: Parse child objects with class names
    When I parse """
    {(database)
      {(connection)
        host = 'localhost',
        port = 5432
      }
    }
    """
    Then the root object should have class name "database"
    And the root should have 1 child object
    And child object 0 should have class name "connection"
    And child object 0 property "host" should have value "localhost"
    And child object 0 property "port" should have value 5432

  # @TestID: PRS-COMPLEX-004
  # Test parsing of header metadata with document properties
  Scenario: Parse header metadata
    When I parse """
    #@ tonVersion = '1.0', @schema = 'test.ton'
    { value = 42 }
    """
    Then the document header should have "tonVersion" = "1.0"
    And the document header should have "schema" = "test.ton"
    And property "value" should have value 42

  # @TestID: PRS-COMPLEX-005
  # Test parsing of inline schema definitions
  Scenario: Parse inline schema
    When I parse """
    { value = 42 }
    #! { /value = int(required) }
    """
    Then the document should have an inline schema
    And the schema should define "/value" as required integer

  # @TestID: PRS-EDGE-001
  # Test parsing of empty array structures
  Scenario: Parse empty arrays
    When I parse "{ items = [] }"
    Then property "items" should be an empty array

  # @TestID: PRS-EDGE-002
  # Test parsing of properties with spaces in quoted names
  Scenario: Parse properties with spaces in names
    When I parse "{ \"complex name\" = 'value' }"
    Then property "complex name" should have value "value"

  # @TestID: PRS-BASIC-016
  # Test parsing of ISO date string values
  Scenario: Parse date values
    When I parse "{ created = '2024-01-15T10:30:00Z' }"
    Then property "created" should be date "2024-01-15T10:30:00Z"

  # @TestID: PRS-EDGE-003
  # Test parsing of objects with trailing commas
  Scenario: Parse objects with trailing commas
    When I parse "{ a = 1, b = 2, }"
    Then the root object should have 2 properties
    And property "a" should have value 1
    And property "b" should have value 2

  # @TestID: PRS-COMPLEX-006
  # Test parsing of complex nested object and array structure
  Scenario: Parse complex nested structure
    When I parse """
    {(config)
      database = {
        primary = {
          host = 'db1.example.com',
          port = 5432,
          credentials = {
            username = 'admin',
            password = 'secret'
          }
        },
        replicas = [
          { host = 'db2.example.com', port = 5433 },
          { host = 'db3.example.com', port = 5434 }
        ]
      }
    }
    """
    Then the root object should have class name "config"
    And property "database.primary.host" should have value "db1.example.com"
    And property "database.primary.credentials.username" should have value "admin"
    And property "database.replicas" should be an array with 2 elements

  # @TestID: PRS-ERROR-001
  # Test error handling for invalid syntax
  Scenario: Handle parsing errors
    When I parse "{ invalid syntax }"
    Then parsing should fail with error message containing "unexpected token"

  # @TestID: PRS-BASIC-017
  # Test parsing of class names with instance counts
  Scenario: Parse instance count
    When I parse "{(person:2) name = 'John' }"
    Then the root object should have class name "person"
    And the root object should have instance count 2