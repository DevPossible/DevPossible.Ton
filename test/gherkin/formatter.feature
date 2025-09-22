Feature: TON Formatter
  As a TON formatter
  I need to format TON documents in different styles
  So that users can maintain consistent code style

  Background:
    Given a TON formatter instance

  Scenario: Format to pretty style
    Given unformatted TON:
      """
      {name='Test',version=1.0,active=true,nested={a=1,b=2}}
      """
    When I format with pretty style
    Then output should be:
      """
      #@ tonVersion = '1'

      {
          name = $'Test',
          version = %1.0,
          active = true,
          nested = {
              a = %1,
              b = %2
          }
      }
      """

  Scenario: Format to compact style
    Given formatted TON:
      """
      {
          name = 'Test',
          version = 1.0,
          active = true
      }
      """
    When I format with compact style
    Then output should be:
      """
      {name = 'Test', version = 1.0, active = true}
      """

  Scenario: Preserve comments
    Given TON with comments:
      """
      // Header comment
      {
          name = 'Test', // Inline comment
          /* Block comment */
          value = 42
      }
      """
    When I format with comment preservation
    Then comments should be maintained

  Scenario: Handle type hints
    Given TON with type hints:
      """
      {name=$'Test',age=%30,active=&true}
      """
    When I format with pretty style
    Then type hints should be preserved

  Scenario: Format arrays
    Given TON with arrays:
      """
      {items=[1,2,3],matrix=[[1,2],[3,4]]}
      """
    When I format with pretty style
    Then arrays should be formatted:
      """
      {
          items = [1, 2, 3],
          matrix = [
              [1, 2],
              [3, 4]
          ]
      }
      """

  Scenario: Format enums
    Given TON with enums:
      """
      {status=|active|,perms=|read|write|execute|}
      """
    When I format with pretty style
    Then enums should be spaced properly

  Scenario: Format multi-line strings
    Given TON with multi-line strings
    When I format
    Then multi-line strings should maintain formatting
    And indentation should be correct

  Scenario: Custom indentation
    Given a formatter with 2-space indentation
    When I format a nested structure
    Then indentation should be 2 spaces per level

  Scenario: Sort properties
    Given formatter with property sorting enabled
    When I format:
      """
      {z='last',a='first',m='middle'}
      """
    Then output should be:
      """
      {
          a = 'first',
          m = 'middle',
          z = 'last'
      }
      """

  Scenario: Omit null values
    Given formatter with omitNulls option
    When I format:
      """
      {name='Test',value=null,active=true}
      """
    Then output should not contain null property

  Scenario: Format class names
    Given TON with class names:
      """
      {(person)name='John',{(address)street='Main'}}
      """
    When I format with pretty style
    Then class names should be preserved

  Scenario: Format headers
    Given TON with header:
      """
      #@tonVersion='1',@schema='test'
      {value=42}
      """
    When I format
    Then header should be formatted properly

  Scenario: Format inline schemas
    Given TON with inline schema
    When I format
    Then schema should be formatted
    And maintain readability

  Scenario: Line length limits
    Given formatter with 80 character line limit
    When I format long lines
    Then lines should be wrapped appropriately
    Or arrays/objects should be multi-line

  Scenario: Trailing commas
    Given formatter with trailing comma preference
    When I format arrays and objects
    Then trailing commas should be added
    Or removed based on setting

  Scenario: Quote style
    Given formatter preferring single quotes
    When I format strings
    Then single quotes should be used
    Unless escaping is needed

  Scenario: Number formatting
    Given various number formats
    When I format
    Then hex should remain hex
    And binary should remain binary
    And scientific notation preserved

  Scenario: Idempotent formatting
    Given a formatted document
    When I format it again
    Then output should be identical
    And no changes should occur

  Scenario: Error recovery
    Given malformed TON
    When I attempt to format
    Then formatter should report errors
    And preserve as much as possible

  Scenario: Format from file
    Given a TON file "input.ton"
    When I format the file
    Then formatted output should be written
    And original can be backed up

  Scenario: Batch formatting
    Given multiple TON files
    When I format all files
    Then each should be formatted
    And consistent style applied