Feature: TON Multi-line String Support
  As a TON parser
  I need to handle multi-line strings with triple quotes
  So that users can include formatted text and code

  Background:
    Given a TON parser with multi-line string support

  Scenario: Basic triple-quoted string
    When I parse:
      """
      {
        text = """Hello World"""
      }
      """
    Then property "text" should equal "Hello World"

  Scenario: Multi-line with line breaks
    When I parse:
      """
      {
        text = """
        Line 1
        Line 2
        Line 3
        """
      }
      """
    Then property "text" should equal "Line 1\nLine 2\nLine 3"

  Scenario: Indentation handling
    When I parse:
      """
      {
        code = """
            function greet(name) {
                console.log(`Hello, ${name}!`);
                return true;
            }
        """
      }
      """
    Then common indentation should be removed
    And relative indentation should be preserved
    And the result should be:
      """
      function greet(name) {
          console.log(`Hello, ${name}!`);
          return true;
      }
      """

  Scenario: Mixed indentation levels
    When I parse:
      """
      {
        doc = """
        Title
            Indented section
                More indented
            Back to first indent
        No indent
        """
      }
      """
    Then indentation structure should be preserved

  Scenario: Empty lines preservation
    When I parse:
      """
      {
        text = """
        First paragraph

        Second paragraph

        Third paragraph
        """
      }
      """
    Then empty lines should be preserved

  Scenario: Triple single quotes
    When I parse:
      """
      {
        text = '''
        Using single quotes
        '''
      }
      """
    Then it should work same as double quotes

  Scenario: Escape sequences in multi-line
    When I parse:
      """
      {
        text = """
        Line with \t tab
        Line with \" quotes
        Line with \\ backslash
        Unicode: \u0041\u0042\u0043
        """
      }
      """
    Then escape sequences should be processed

  Scenario: Inline multi-line string
    When I parse:
      """
      { text = """All on one line""" }
      """
    Then property "text" should equal "All on one line"

  Scenario: Content starting on opening line
    When I parse:
      """
      {
        text = """First line
        Second line
        """
      }
      """
    Then first line should be included

  Scenario: Tab indentation
    When I parse string with tab indentation:
      """
      {
        text = """
        \tTabbed line 1
        \tTabbed line 2
        \t\tDouble tabbed
        """
      }
      """
    Then tabs should be handled correctly

  Scenario: Mixed tabs and spaces
    When I parse mixed indentation
    Then parser should handle it
    Or report warning about mixed indentation

  Scenario: Trailing whitespace
    When I parse:
      """
      {
        text = """
        Line with trailing spaces
        Line without
        """
      }
      """
    Then trailing spaces should be preserved

  Scenario: Special characters in multi-line
    When I parse:
      """
      {
        text = """
        Special: !@#$%^&*()
        Quotes: 'single' and "double"
        Math: 1 + 2 = 3
        """
      }
      """
    Then all characters should be preserved

  Scenario: Very long multi-line strings
    Given a multi-line string with 10000 lines
    When I parse the document
    Then all lines should be preserved
    And performance should be acceptable

  Scenario: Nested quote marks
    When I parse:
      """
      {
        text = """
        He said "Hello" and she replied 'Hi'
        """
      }
      """
    Then quotes should not need escaping

  Scenario: Windows line endings
    When I parse multi-line with \r\n endings
    Then line endings should be normalized to \n

  Scenario: Mac line endings
    When I parse multi-line with \r endings
    Then line endings should be normalized to \n

  Scenario: Empty multi-line string
    When I parse:
      """
      {
        text = """"""
      }
      """
    Then property "text" should be empty string

  Scenario: Only whitespace multi-line
    When I parse:
      """
      {
        text = """


        """
      }
      """
    Then property "text" should contain only newlines

  Scenario: Serializing multi-line strings
    Given an object with multi-line string property
    When I serialize with pretty format
    Then multi-line strings should use triple quotes
    And indentation should be appropriate

  Scenario: Round-trip multi-line strings
    Given a document with complex multi-line strings
    When I parse, serialize, and parse again
    Then multi-line content should be preserved exactly