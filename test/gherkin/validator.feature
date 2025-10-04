Feature: TON Schema Validator
  As a TON validator
  I need to validate documents against schemas
  So that I can ensure data integrity and correctness

  Background:
    Given a TON validator instance

  # @TestID: VAL-BASIC-001
  # Test validation of required properties
  Scenario: Validate required properties
    Given a schema requiring property "name"
    When I validate an object with property "name" = "John"
    Then validation should pass
    When I validate an object without property "name"
    Then validation should fail with error "Required property 'name' is missing"

  # @TestID: VAL-BASIC-002
  # Test validation of property data types
  Scenario: Validate property types
    Given a schema defining "age" as integer
    When I validate an object with "age" = 30
    Then validation should pass
    When I validate an object with "age" = "thirty"
    Then validation should fail with error "Property 'age' must be of type integer"

  # @TestID: VAL-BASIC-003
  # Test validation of string length constraints
  Scenario: Validate string constraints
    Given a schema for "name" with:
      | constraint | value |
      | type       | string |
      | minLength  | 2     |
      | maxLength  | 50    |
    When I validate "name" = "John"
    Then validation should pass
    When I validate "name" = "J"
    Then validation should fail with error "String length must be at least 2"
    When I validate "name" = "<51 character string>"
    Then validation should fail with error "String length must not exceed 50"

  # @TestID: VAL-BASIC-004
  # Test validation of number range constraints
  Scenario: Validate number constraints
    Given a schema for "age" with:
      | constraint | value |
      | type       | int   |
      | min        | 0     |
      | max        | 150   |
    When I validate "age" = 30
    Then validation should pass
    When I validate "age" = -1
    Then validation should fail with error "Value must be at least 0"
    When I validate "age" = 200
    Then validation should fail with error "Value must not exceed 150"

  # @TestID: VAL-BASIC-005
  # Test validation of enum value constraints
  Scenario: Validate enum values
    Given a schema defining "status" as enum with values ["active", "inactive", "pending"]
    When I validate "status" = |active|
    Then validation should pass
    When I validate "status" = |unknown|
    Then validation should fail with error "Value 'unknown' is not a valid enum value"

  # @TestID: VAL-BASIC-006
  # Test validation of enum set constraints
  Scenario: Validate enum sets
    Given a schema defining "permissions" as enumSet with values ["read", "write", "execute", "delete"]
    When I validate "permissions" = |read|write|
    Then validation should pass
    When I validate "permissions" = |read|invalid|
    Then validation should fail with error "Value 'invalid' is not a valid enum value"

  # @TestID: VAL-BASIC-007
  # Test validation of array size constraints
  Scenario: Validate arrays
    Given a schema for "items" with:
      | constraint | value  |
      | type       | array  |
      | minCount   | 1      |
      | maxCount   | 10     |
    When I validate "items" = [1, 2, 3]
    Then validation should pass
    When I validate "items" = []
    Then validation should fail with error "Array must have at least 1 element"
    When I validate "items" = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    Then validation should fail with error "Array must not exceed 10 elements"

  # @TestID: VAL-BASIC-008
  # Test validation of array element type constraints
  Scenario: Validate array element types
    Given a schema defining "numbers" as array:int
    When I validate "numbers" = [1, 2, 3]
    Then validation should pass
    When I validate "numbers" = [1, "two", 3]
    Then validation should fail with error "Array element at index 1 must be of type int"

  # @TestID: VAL-NESTED-001
  # Test validation of nested object structures
  Scenario: Validate nested objects
    Given a schema for object with nested structure:
      """
      {(user)
        /name = string(required),
        /details/age = int(required, min(0)),
        /details/city = string(maxLength(50))
      }
      """
    When I validate:
      """
      {(user)
        name = 'John',
        details = {
          age = 30,
          city = 'New York'
        }
      }
      """
    Then validation should pass

  # @TestID: VAL-COMPLEX-001
  # Test validation using path-based schema rules
  Scenario: Validate path-based schemas
    Given a schema with path-based rules:
      | path               | rule                    |
      | /user/name         | string(required)        |
      | /user/email        | string(format(email))   |
      | /user/profile/bio  | string(maxLength(500))  |
    When I validate matching structure
    Then validation should apply rules to correct paths

  # @TestID: VAL-FORMAT-001
  # Test validation of email format constraint
  Scenario: Validate email format
    Given a schema defining "email" with format(email)
    When I validate "email" = "user@example.com"
    Then validation should pass
    When I validate "email" = "invalid-email"
    Then validation should fail with error "Invalid email format"

  # @TestID: VAL-FORMAT-002
  # Test validation of URL format constraint
  Scenario: Validate URL format
    Given a schema defining "website" with format(url)
    When I validate "website" = "https://example.com"
    Then validation should pass
    When I validate "website" = "not-a-url"
    Then validation should fail with error "Invalid URL format"

  # @TestID: VAL-FORMAT-003
  # Test validation of date format constraint
  Scenario: Validate date format
    Given a schema defining "created" as date
    When I validate "created" = "2024-01-15T10:30:00Z"
    Then validation should pass
    When I validate "created" = "not-a-date"
    Then validation should fail with error "Invalid date format"

  # @TestID: VAL-FORMAT-004
  # Test validation of GUID format constraint
  Scenario: Validate GUID format
    Given a schema defining "id" as guid
    When I validate "id" = "550e8400-e29b-41d4-a716-446655440000"
    Then validation should pass
    When I validate "id" = "not-a-guid"
    Then validation should fail with error "Invalid GUID format"

  # @TestID: VAL-FORMAT-005
  # Test validation of regex pattern matching
  Scenario: Validate pattern matching
    Given a schema defining "code" with pattern "^[A-Z]{3}-\d{3}$"
    When I validate "code" = "ABC-123"
    Then validation should pass
    When I validate "code" = "abc-123"
    Then validation should fail with error "Value does not match required pattern"

  # @TestID: VAL-COMPLEX-002
  # Test application of default values during validation
  Scenario: Apply default values
    Given a schema with defaults:
      | property | default |
      | status   | active  |
      | count    | 0       |
      | enabled  | true    |
    When I validate an empty object
    Then the object should have "status" = "active"
    And the object should have "count" = 0
    And the object should have "enabled" = true

  # @TestID: VAL-COMPLEX-003
  # Test validation with class-specific schema rules
  Scenario: Validate class-specific schemas
    Given schemas for different classes:
      """
      #! {(user)
        /name = string(required)
      }
      #! {(product)
        /price = float(required, min(0))
      }
      """
    When I validate a "user" object without "name"
    Then validation should fail
    When I validate a "product" object without "price"
    Then validation should fail

  # @TestID: VAL-COMPLEX-004
  # Test validation with conditional requirement rules
  Scenario: Validate conditional requirements
    Given a schema with conditional rule:
      """
      if property "type" = "email"
      then "emailAddress" is required
      """
    When I validate object with "type" = "email" and "emailAddress" = "test@example.com"
    Then validation should pass
    When I validate object with "type" = "email" without "emailAddress"
    Then validation should fail

  # @TestID: VAL-BASIC-009
  # Test validation of unique value constraint in arrays
  Scenario: Validate unique values in array
    Given a schema defining "tags" as array with unique constraint
    When I validate "tags" = ["a", "b", "c"]
    Then validation should pass
    When I validate "tags" = ["a", "b", "a"]
    Then validation should fail with error "Array must contain unique values"

  # @TestID: VAL-EDGE-001
  # Test validation with numeric property names in schema
  Scenario: Validate numeric property names
    Given a schema with numeric property paths:
      | path  | rule           |
      | /2024 | int(required)  |
      | /123  | string         |
    When I validate object with "2024" = 100 and "123" = "test"
    Then validation should pass

  # @TestID: VAL-COMPLEX-005
  # Test validation with wildcard path matching
  Scenario: Validate wildcard paths
    Given a schema with wildcard path "/servers/*/port" as int(range(1, 65535))
    When I validate:
      """
      {
        servers = {
          primary = { port = 8080 },
          backup = { port = 8081 }
        }
      }
      """
    Then validation should pass for all matching paths

  # @TestID: VAL-ERROR-001
  # Test collection of multiple validation errors
  Scenario: Collect multiple validation errors
    Given a schema with multiple rules
    When I validate an object violating multiple rules
    Then all validation errors should be collected
    And error messages should include property paths

  # @TestID: VAL-COMPLEX-006
  # Test validation using external schema files
  Scenario: Validate with external schema file
    Given an external schema file "user.schema.ton"
    When I validate a document referencing this schema
    Then the external schema rules should be applied

  # @TestID: VAL-PERF-001
  # Test validation performance with large schemas and documents
  Scenario: Performance validation
    Given a schema with 100 rules
    And a document with 1000 properties
    When I validate the document
    Then validation should complete within 100 milliseconds