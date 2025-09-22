Feature: TON Schema Validator
  As a TON validator
  I need to validate documents against schemas
  So that I can ensure data integrity and correctness

  Background:
    Given a TON validator instance

  Scenario: Validate required properties
    Given a schema requiring property "name"
    When I validate an object with property "name" = "John"
    Then validation should pass
    When I validate an object without property "name"
    Then validation should fail with error "Required property 'name' is missing"

  Scenario: Validate property types
    Given a schema defining "age" as integer
    When I validate an object with "age" = 30
    Then validation should pass
    When I validate an object with "age" = "thirty"
    Then validation should fail with error "Property 'age' must be of type integer"

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

  Scenario: Validate enum values
    Given a schema defining "status" as enum with values ["active", "inactive", "pending"]
    When I validate "status" = |active|
    Then validation should pass
    When I validate "status" = |unknown|
    Then validation should fail with error "Value 'unknown' is not a valid enum value"

  Scenario: Validate enum sets
    Given a schema defining "permissions" as enumSet with values ["read", "write", "execute", "delete"]
    When I validate "permissions" = |read|write|
    Then validation should pass
    When I validate "permissions" = |read|invalid|
    Then validation should fail with error "Value 'invalid' is not a valid enum value"

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

  Scenario: Validate array element types
    Given a schema defining "numbers" as array:int
    When I validate "numbers" = [1, 2, 3]
    Then validation should pass
    When I validate "numbers" = [1, "two", 3]
    Then validation should fail with error "Array element at index 1 must be of type int"

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

  Scenario: Validate path-based schemas
    Given a schema with path-based rules:
      | path               | rule                    |
      | /user/name         | string(required)        |
      | /user/email        | string(format(email))   |
      | /user/profile/bio  | string(maxLength(500))  |
    When I validate matching structure
    Then validation should apply rules to correct paths

  Scenario: Validate email format
    Given a schema defining "email" with format(email)
    When I validate "email" = "user@example.com"
    Then validation should pass
    When I validate "email" = "invalid-email"
    Then validation should fail with error "Invalid email format"

  Scenario: Validate URL format
    Given a schema defining "website" with format(url)
    When I validate "website" = "https://example.com"
    Then validation should pass
    When I validate "website" = "not-a-url"
    Then validation should fail with error "Invalid URL format"

  Scenario: Validate date format
    Given a schema defining "created" as date
    When I validate "created" = "2024-01-15T10:30:00Z"
    Then validation should pass
    When I validate "created" = "not-a-date"
    Then validation should fail with error "Invalid date format"

  Scenario: Validate GUID format
    Given a schema defining "id" as guid
    When I validate "id" = "550e8400-e29b-41d4-a716-446655440000"
    Then validation should pass
    When I validate "id" = "not-a-guid"
    Then validation should fail with error "Invalid GUID format"

  Scenario: Validate pattern matching
    Given a schema defining "code" with pattern "^[A-Z]{3}-\d{3}$"
    When I validate "code" = "ABC-123"
    Then validation should pass
    When I validate "code" = "abc-123"
    Then validation should fail with error "Value does not match required pattern"

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

  Scenario: Validate unique values in array
    Given a schema defining "tags" as array with unique constraint
    When I validate "tags" = ["a", "b", "c"]
    Then validation should pass
    When I validate "tags" = ["a", "b", "a"]
    Then validation should fail with error "Array must contain unique values"

  Scenario: Validate numeric property names
    Given a schema with numeric property paths:
      | path  | rule           |
      | /2024 | int(required)  |
      | /123  | string         |
    When I validate object with "2024" = 100 and "123" = "test"
    Then validation should pass

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

  Scenario: Collect multiple validation errors
    Given a schema with multiple rules
    When I validate an object violating multiple rules
    Then all validation errors should be collected
    And error messages should include property paths

  Scenario: Validate with external schema file
    Given an external schema file "user.schema.ton"
    When I validate a document referencing this schema
    Then the external schema rules should be applied

  Scenario: Performance validation
    Given a schema with 100 rules
    And a document with 1000 properties
    When I validate the document
    Then validation should complete within 100 milliseconds