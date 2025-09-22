Feature: TON Array Handling
  As a TON parser
  I need to properly handle arrays in all contexts
  So that users can work with collection data

  Background:
    Given a TON parser instance

  Scenario: Parse empty array
    When I parse "{ items = [] }"
    Then property "items" should be an empty array
    And the array should have 0 elements

  Scenario: Parse simple number array
    When I parse "{ numbers = [1, 2, 3, 4, 5] }"
    Then property "numbers" should be an array
    And the array should have 5 elements
    And all elements should be numbers

  Scenario: Parse string array
    When I parse "{ colors = ['red', 'green', 'blue'] }"
    Then property "colors" should be an array
    And the array should contain strings ["red", "green", "blue"]

  Scenario: Parse boolean array
    When I parse "{ flags = [true, false, true] }"
    Then property "flags" should be an array
    And the array should contain booleans [true, false, true]

  Scenario: Parse mixed type array
    When I parse "{ mixed = [1, 'text', true, null, undefined] }"
    Then property "mixed" should be an array with 5 elements
    And element 0 should be number 1
    And element 1 should be string "text"
    And element 2 should be boolean true
    And element 3 should be null
    And element 4 should be undefined

  Scenario: Parse nested arrays
    When I parse "{ matrix = [[1, 2], [3, 4], [5, 6]] }"
    Then property "matrix" should be an array with 3 elements
    And each element should be an array with 2 elements
    And matrix[0][0] should be 1
    And matrix[1][1] should be 4
    And matrix[2][0] should be 5

  Scenario: Parse deeply nested arrays
    When I parse "{ deep = [[[1, 2], [3, 4]], [[5, 6], [7, 8]]] }"
    Then property "deep" should be a 3-dimensional array
    And deep[0][0][0] should be 1
    And deep[1][1][1] should be 8

  Scenario: Parse array with objects
    When I parse """
    {
      users = [
        { name = 'Alice', age = 30 },
        { name = 'Bob', age = 25 },
        { name = 'Charlie', age = 35 }
      ]
    }
    """
    Then property "users" should be an array with 3 objects
    And users[0].name should be "Alice"
    And users[1].age should be 25
    And users[2].name should be "Charlie"

  Scenario: Parse array with enums
    When I parse "{ statuses = [|active|, |inactive|, |pending|] }"
    Then property "statuses" should be an array with 3 enum values
    And the array should contain enums ["active", "inactive", "pending"]

  Scenario: Parse array with GUIDs
    When I parse """
    {
      ids = [
        550e8400-e29b-41d4-a716-446655440000,
        6ba7b810-9dad-11d1-80b4-00c04fd430c8
      ]
    }
    """
    Then property "ids" should be an array with 2 GUIDs

  Scenario: Parse array with hex and binary numbers
    When I parse "{ values = [0xFF, 0b1010, 42] }"
    Then property "values" should be an array
    And element 0 should equal 255
    And element 1 should equal 10
    And element 2 should equal 42

  Scenario: Parse array with trailing comma
    When I parse "{ items = [1, 2, 3,] }"
    Then property "items" should be an array with 3 elements
    And trailing comma should be handled correctly

  Scenario: Serialize empty array
    Given an object with property "items" as empty array
    When I serialize with compact format
    Then the output should be "{items = []}"

  Scenario: Serialize number array with pretty format
    Given an object with property "numbers" as [1, 2, 3]
    When I serialize with pretty format
    Then the output should format array elements properly

  Scenario: Serialize nested arrays
    Given an object with property "matrix" as [[1, 2], [3, 4]]
    When I serialize with pretty format
    Then nested arrays should be indented correctly

  Scenario: Validate array with schema
    Given a schema defining "numbers" as array:int with minCount(1) and maxCount(10)
    When I validate "numbers" = [1, 2, 3]
    Then validation should pass
    When I validate "numbers" = []
    Then validation should fail with "Array must have at least 1 element"

  Scenario: Validate array element types
    Given a schema defining "strings" as array:string
    When I validate "strings" = ["a", "b", "c"]
    Then validation should pass
    When I validate "strings" = ["a", 2, "c"]
    Then validation should fail with "Element at index 1 must be string"

  Scenario: Validate nested array structure
    Given a schema defining "matrix" as array:array:int
    When I validate "matrix" = [[1, 2], [3, 4]]
    Then validation should pass
    When I validate "matrix" = [[1, "2"], [3, 4]]
    Then validation should fail for nested element type

  Scenario: Array with multi-line strings
    When I parse """
    {
      descriptions = [
        '''First item
        with multiple lines''',
        '''Second item
        also multi-line'''
      ]
    }
    """
    Then array elements should contain multi-line strings

  Scenario: Array index access
    Given a parsed array [10, 20, 30, 40, 50]
    When I access index 0
    Then I should get 10
    When I access index 4
    Then I should get 50
    When I access index -1
    Then I should get 50 (last element)
    When I access index 10
    Then I should get undefined or error

  Scenario: Array modification
    Given a parsed array [1, 2, 3]
    When I add element 4
    Then the array should be [1, 2, 3, 4]
    When I remove index 1
    Then the array should be [1, 3, 4]
    When I insert 2 at index 1
    Then the array should be [1, 2, 3, 4]

  Scenario: Array as root element
    When I parse "[1, 2, 3]"
    Then the document root should be an array
    And the array should have 3 elements

  Scenario: Complex array scenario
    When I parse """
    {
      data = [
        { id = 1, items = [10, 20], active = true },
        { id = 2, items = [], active = false },
        { id = 3, items = [30, 40, 50], active = true }
      ]
    }
    """
    Then property "data" should be an array of objects
    And data[0].items should be array [10, 20]
    And data[1].items should be empty array
    And data[2].items should have 3 elements

  Scenario: Array with comments
    When I parse """
    {
      items = [
        1,  // first item
        2,  /* second item */
        3   // last item
      ]
    }
    """
    Then comments should be ignored
    And array should contain [1, 2, 3]

  Scenario: Performance with large arrays
    When I parse an array with 10000 elements
    Then parsing should complete within 100 milliseconds
    And all elements should be accessible