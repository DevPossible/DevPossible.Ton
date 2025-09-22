Feature: TON Numeric Property Names
  As a TON parser
  I need to handle numeric and alphanumeric property names
  So that users can use numbers as property keys

  Background:
    Given a TON parser supporting numeric properties

  Scenario: Pure numeric property names
    When I parse:
      """
      {
        123 = 'value1',
        456 = 'value2',
        789 = 'value3'
      }
      """
    Then property "123" should equal "value1"
    And property "456" should equal "value2"
    And property "789" should equal "value3"

  Scenario: Properties starting with numbers
    When I parse:
      """
      {
        1property = 'first',
        2ndProperty = 'second',
        3rdItem = 'third'
      }
      """
    Then all properties should be parsed correctly

  Scenario: Year-based properties
    When I parse:
      """
      {
        revenues = {
          2022 = 450000000,
          2023 = 520000000,
          2024 = 380000000
        }
      }
      """
    Then year properties should work as expected

  Scenario: Mixed numeric and regular properties
    When I parse:
      """
      {
        name = 'John',
        123 = 'numeric',
        age = 30,
        2024 = 'year',
        active = true
      }
      """
    Then both types should coexist

  Scenario: Zero and leading zeros
    When I parse:
      """
      {
        0 = 'zero',
        00 = 'double zero',
        01 = 'zero one',
        001 = 'triple zero one'
      }
      """
    Then each should be distinct property

  Scenario: Floating point property names
    When I parse:
      """
      {
        3.14 = 'pi',
        2.718 = 'e',
        1.0 = 'one point zero'
      }
      """
    Then decimal points should be allowed

  Scenario: Scientific notation names
    When I parse:
      """
      {
        1e3 = 'thousand',
        1e6 = 'million',
        1.5e2 = 'one fifty'
      }
      """
    Then scientific notation should work

  Scenario: Negative number names
    When I parse:
      """
      {
        "-1" = 'negative one',
        "-999" = 'negative many'
      }
      """
    Then negative numbers need quotes

  Scenario: Very large number names
    When I parse:
      """
      {
        999999999999 = 'very large'
      }
      """
    Then large numbers should work

  Scenario: Hex and binary as names
    When I parse:
      """
      {
        "0xFF" = 'hex name',
        "0b1010" = 'binary name'
      }
      """
    Then special formats need quotes

  Scenario: Serializing numeric properties
    Given an object with numeric property names
    When I serialize to TON
    Then numeric names should not have quotes
    And format should be valid

  Scenario: Validating numeric properties
    Given a schema with numeric property paths:
      """
      #! {
        /2024 = int(required),
        /123 = string(maxLength(10))
      }
      """
    When I validate matching document
    Then validation should work correctly

  Scenario: Accessing numeric properties
    Given a parsed object with numeric properties
    When I access property "123"
    Then I should get the correct value
    When I access property 123 as number
    Then it should be converted to string key

  Scenario: Numeric properties in arrays
    When I parse:
      """
      {
        items = [
          { 1 = 'first', 2 = 'second' },
          { 100 = 'hundred', 200 = 'two hundred' }
        ]
      }
      """
    Then numeric properties in array objects should work

  Scenario: Property ordering with numbers
    When I parse and serialize:
      """
      {
        z = 'last',
        123 = 'numeric',
        a = 'first',
        456 = 'another'
      }
      """
    Then property order should be maintained
    Or follow consistent ordering rules

  Scenario: Unicode digits
    When I parse:
      """
      {
        "१२३" = 'Hindi numbers',
        "一二三" = 'Chinese numbers'
      }
      """
    Then unicode digits should be handled

  Scenario: Mixed alphanumeric
    When I parse:
      """
      {
        123abc = 'starts with number',
        abc123 = 'ends with number',
        a1b2c3 = 'mixed'
      }
      """
    Then all should parse correctly

  Scenario: Edge cases
    When I parse:
      """
      {
        "." = 'just dot',
        ".123" = 'starts with dot',
        "123." = 'ends with dot',
        "1.2.3" = 'multiple dots'
      }
      """
    Then special cases should be handled