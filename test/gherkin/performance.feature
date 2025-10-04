Feature: TON Performance Requirements
  As a TON library
  I need to handle large documents efficiently
  So that the library is usable in production

  Background:
    Given a TON parser with performance monitoring

  # @TestID: PRF-BASIC-001
  # Test parsing performance for small documents
  Scenario: Parse small document
    Given a TON document with 10 properties
    When I parse the document
    Then parsing should complete within 1 millisecond
    And memory usage should be under 1 MB

  # @TestID: PRF-BASIC-002
  # Test parsing performance for medium-sized documents
  Scenario: Parse medium document
    Given a TON document with 1000 properties
    When I parse the document
    Then parsing should complete within 10 milliseconds
    And memory usage should be under 10 MB

  # @TestID: PRF-BASIC-003
  # Test parsing performance for large documents
  Scenario: Parse large document
    Given a TON document with 100000 properties
    When I parse the document
    Then parsing should complete within 1 second
    And memory usage should be under 100 MB

  # @TestID: PRF-COMPLEX-001
  # Test performance with deeply nested structures
  Scenario: Deep nesting performance
    Given a document with 100 levels of nesting
    When I parse the document
    Then parsing should complete within 100 milliseconds
    And stack should not overflow

  # @TestID: PRF-COMPLEX-002
  # Test performance with large arrays
  Scenario: Large array performance
    Given an array with 100000 elements
    When I parse the array
    Then parsing should complete within 500 milliseconds
    And all elements should be accessible

  # @TestID: PRF-COMPLEX-003
  # Test performance with very long string values
  Scenario: Long string performance
    Given a string property with 10 MB of text
    When I parse the document
    Then parsing should handle large strings
    And memory should not be duplicated unnecessarily

  # @TestID: PRF-COMPLEX-004
  # Test performance with many child objects
  Scenario: Many child objects
    Given a document with 10000 child objects
    When I parse the document
    Then parsing should scale linearly
    And child access should be efficient

  # @TestID: PRF-PERF-001
  # Test serialization performance for large documents
  Scenario: Serialization performance
    Given a large parsed document with 10000 properties
    When I serialize to string
    Then serialization should complete within 100 milliseconds
    And output should be correct

  # @TestID: PRF-PERF-002
  # Test validation performance with complex schemas
  Scenario: Validation performance
    Given a complex schema with 100 rules
    And a document with 1000 properties
    When I validate the document
    Then validation should complete within 50 milliseconds
    And all rules should be checked

  # @TestID: PRF-PERF-003
  # Test round-trip parse-serialize cycle performance
  Scenario: Round-trip performance
    Given a complex document
    When I perform 1000 parse-serialize cycles
    Then average time should be under 10 milliseconds
    And no memory leaks should occur

  # @TestID: PRF-PERF-004
  # Test streaming performance for large files
  Scenario: Streaming large files
    Given a 100 MB TON file
    When I parse using streaming
    Then memory usage should stay under 50 MB
    And first results should be available within 100ms

  # @TestID: PRF-PERF-005
  # Test concurrent parsing performance and thread safety
  Scenario: Concurrent parsing
    Given 10 documents to parse
    When I parse them concurrently
    Then total time should be less than sequential
    And results should be thread-safe

  # @TestID: PRF-PERF-006
  # Test property access performance for large objects
  Scenario: Property access performance
    Given a document with 10000 properties
    When I access properties 100000 times
    Then average access time should be O(1)
    And performance should not degrade

  # @TestID: PRF-PERF-007
  # Test array iteration performance for large arrays
  Scenario: Array iteration performance
    Given an array with 100000 elements
    When I iterate through all elements
    Then iteration should complete within 100 milliseconds
    And memory should remain stable

  # @TestID: PRF-PERF-008
  # Test schema compilation performance
  Scenario: Schema compilation
    Given a complex schema with 1000 rules
    When I compile the schema
    Then compilation should complete within 100 milliseconds
    And compiled schema should be reusable

  # @TestID: PRF-PERF-009
  # Test performance impact of error recovery
  Scenario: Error recovery performance
    Given a document with 100 errors
    When I parse with error recovery
    Then parsing should not be significantly slower
    And all errors should be collected

  # @TestID: PRF-PERF-010
  # Test memory efficiency and scaling
  Scenario: Memory efficiency
    Given documents of increasing size
    When I measure memory usage
    Then memory should scale linearly with document size
    And garbage collection should work properly

  # @TestID: PRF-PERF-011
  # Test cache effectiveness for repeated operations
  Scenario: Cache effectiveness
    Given repeated parsing of same structures
    When I measure performance over time
    Then caching should improve performance
    And cache size should be bounded

  # @TestID: PRF-BASIC-004
  # Test library initialization performance
  Scenario: Startup performance
    When I initialize the TON library
    Then initialization should complete within 10 milliseconds
    And lazy loading should defer unnecessary work

  # @TestID: PRF-FORMAT-001
  # Test performance comparison between different formats
  Scenario Outline: Format comparison
    Given a document with <size> properties
    When I serialize with <format> format
    Then time should be within <limit> milliseconds

    Examples:
      | size  | format  | limit |
      | 100   | compact | 1     |
      | 100   | pretty  | 2     |
      | 1000  | compact | 10    |
      | 1000  | pretty  | 20    |
      | 10000 | compact | 100   |
      | 10000 | pretty  | 200   |

  # @TestID: PRF-EDGE-001
  # Test performance with pathological input designed to be slow
  Scenario: Worst case performance
    Given a pathological document designed to be slow
    When I parse the document
    Then parsing should still complete
    And performance should degrade gracefully
    And timeouts should be available

  # @TestID: PRF-BASIC-005
  # Test benchmark comparison with other parsers
  Scenario: Benchmark comparison
    Given standard benchmark documents
    When I compare with other parsers
    Then TON parser should be competitive
    And performance should be documented