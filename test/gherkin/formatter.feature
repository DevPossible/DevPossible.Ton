Feature: TON Formatter
  As a TON formatter
  I need to format TON documents in different styles
  So that users can maintain consistent code style

  Background:
    Given a TON formatter instance

  # @TestID: FMT-FORMAT-001
  # Test formatting unformatted TON to pretty style
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

  # @TestID: FMT-FORMAT-002
  # Test formatting TON to compact style
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

  # @TestID: FMT-FORMAT-003
  # Test comment preservation during formatting
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

  # @TestID: FMT-FORMAT-004
  # Test formatting with type hints preservation
  Scenario: Handle type hints
    Given TON with type hints:
      """
      {name=$'Test',age=%30,active=&true}
      """
    When I format with pretty style
    Then type hints should be preserved

  # @TestID: FMT-FORMAT-005
  # Test array formatting in pretty style
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

  # @TestID: FMT-FORMAT-006
  # Test enum formatting with proper spacing
  Scenario: Format enums
    Given TON with enums:
      """
      {status=|active|,perms=|read|write|execute|}
      """
    When I format with pretty style
    Then enums should be spaced properly

  # @TestID: FMT-FORMAT-007
  # Test multi-line string formatting
  Scenario: Format multi-line strings
    Given TON with multi-line strings
    When I format
    Then multi-line strings should maintain formatting
    And indentation should be correct

  # @TestID: FMT-FORMAT-008
  # Test custom indentation settings
  Scenario: Custom indentation
    Given a formatter with 2-space indentation
    When I format a nested structure
    Then indentation should be 2 spaces per level

  # @TestID: FMT-FORMAT-009
  # Test property sorting during formatting
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

  # @TestID: FMT-FORMAT-010
  # Test omitting null values in formatted output
  Scenario: Omit null values
    Given formatter with omitNulls option
    When I format:
      """
      {name='Test',value=null,active=true}
      """
    Then output should not contain null property

  # @TestID: FMT-FORMAT-011
  # Test formatting with class name preservation
  Scenario: Format class names
    Given TON with class names:
      """
      {(person)name='John',{(address)street='Main'}}
      """
    When I format with pretty style
    Then class names should be preserved

  # @TestID: FMT-FORMAT-012
  # Test header formatting
  Scenario: Format headers
    Given TON with header:
      """
      #@tonVersion='1',@schema='test'
      {value=42}
      """
    When I format
    Then header should be formatted properly

  # @TestID: FMT-FORMAT-013
  # Test inline schema formatting
  Scenario: Format inline schemas
    Given TON with inline schema
    When I format
    Then schema should be formatted
    And maintain readability

  # @TestID: FMT-FORMAT-014
  # Test line length limit handling
  Scenario: Line length limits
    Given formatter with 80 character line limit
    When I format long lines
    Then lines should be wrapped appropriately
    Or arrays/objects should be multi-line

  # @TestID: FMT-FORMAT-015
  # Test trailing comma handling
  Scenario: Trailing commas
    Given formatter with trailing comma preference
    When I format arrays and objects
    Then trailing commas should be added
    Or removed based on setting

  # @TestID: FMT-FORMAT-016
  # Test quote style preferences
  Scenario: Quote style
    Given formatter preferring single quotes
    When I format strings
    Then single quotes should be used
    Unless escaping is needed

  # @TestID: FMT-FORMAT-017
  # Test number format preservation
  Scenario: Number formatting
    Given various number formats
    When I format
    Then hex should remain hex
    And binary should remain binary
    And scientific notation preserved

  # @TestID: FMT-VALID-001
  # Test idempotent formatting operations
  Scenario: Idempotent formatting
    Given a formatted document
    When I format it again
    Then output should be identical
    And no changes should occur

  # @TestID: FMT-ERROR-001
  # Test error recovery during formatting
  Scenario: Error recovery
    Given malformed TON
    When I attempt to format
    Then formatter should report errors
    And preserve as much as possible

  # @TestID: FMT-BASIC-001
  # Test formatting from file input
  Scenario: Format from file
    Given a TON file "input.ton"
    When I format the file
    Then formatted output should be written
    And original can be backed up

  # @TestID: FMT-BASIC-002
  # Test batch formatting of multiple files
  Scenario: Batch formatting
    Given multiple TON files
    When I format all files
    Then each should be formatted
    And consistent style applied