Feature: TON Integration Tests
  As a TON library
  I need to ensure all components work together correctly
  So that users can rely on end-to-end functionality

  Background:
    Given a complete TON library implementation

  # Round-trip Operations

  # @TestID: INT-BASIC-001
  # Test basic round-trip parsing and serialization
  Scenario: Simple round-trip
    Given a simple TON document:
      """
      {
        name = 'Test',
        value = 42
      }
      """
    When I parse and serialize
    Then output should match input semantically

  # @TestID: INT-COMPLEX-001
  # Test complex round-trip with all TON features
  Scenario: Complex round-trip
    Given a complex document with all features
    When I parse, modify, and serialize
    Then all data should be preserved
    And modifications should be reflected

  # @TestID: INT-BASIC-002
  # Test round-trip format conversion between pretty and compact
  Scenario: Format conversion round-trip
    Given a pretty-formatted document
    When I parse and serialize compact
    Then parse compact and serialize pretty
    Then semantics should be identical

  # File Operations

  # @TestID: INT-BASIC-003
  # Test reading and parsing from file
  Scenario: Read from file
    Given a TON file "test.ton"
    When I read and parse the file
    Then document should be loaded correctly
    And encoding should be detected

  # @TestID: INT-BASIC-004
  # Test serializing and writing to file
  Scenario: Write to file
    Given a parsed document
    When I serialize to file "output.ton"
    Then file should be created
    And content should be valid TON

  # @TestID: INT-BASIC-005
  # Test updating an existing TON file
  Scenario: Update existing file
    Given an existing TON file
    When I read, modify, and save
    Then changes should be persisted
    And file should remain valid

  # @TestID: INT-BASIC-006
  # Test batch processing of multiple files
  Scenario: Batch file processing
    Given a directory of TON files
    When I process all files
    Then each should be handled correctly
    And errors should be collected

  # Stream Processing

  # @TestID: INT-BASIC-007
  # Test parsing from input stream
  Scenario: Parse from stream
    Given a readable stream with TON content
    When I parse from stream
    Then document should be parsed
    And stream should be properly closed

  # @TestID: INT-BASIC-008
  # Test serializing to output stream
  Scenario: Serialize to stream
    Given a document to serialize
    When I write to stream
    Then stream should contain valid TON
    And be flushable on demand

  # @TestID: INT-PERF-001
  # Test streaming mode for large documents
  Scenario: Streaming large documents
    Given a 100MB TON document stream
    When I process in streaming mode
    Then memory should stay bounded
    And processing should complete

  # Schema Integration

  # @TestID: INT-VALID-001
  # Test parsing with schema validation
  Scenario: Parse with schema validation
    Given a schema and matching document
    When I parse with validation
    Then document should parse successfully
    And be validated against schema

  # @TestID: INT-VALID-002
  # Test schema-guided parsing with defaults
  Scenario: Schema-guided parsing
    Given a schema with defaults
    When I parse incomplete document
    Then defaults should be applied
    And required fields enforced

  # @TestID: INT-VALID-003
  # Test validation against multiple schemas
  Scenario: Multiple schema validation
    Given document and multiple schemas
    When I validate against all
    Then should report which schemas match
    And which validations fail

  # @TestID: INT-VALID-004
  # Test schema evolution and migration
  Scenario: Schema evolution
    Given versioned schemas v1 and v2
    When I migrate document from v1 to v2
    Then migration should succeed
    And document should validate against v2

  # Type Conversion

  # @TestID: INT-CONVERT-001
  # Test JSON to TON format conversion
  Scenario: JSON to TON conversion
    Given a JSON document
    When I convert to TON
    Then TON should represent same data
    And use appropriate TON features

  # @TestID: INT-CONVERT-002
  # Test TON to JSON format conversion
  Scenario: TON to JSON conversion
    Given a TON document
    When I convert to JSON
    Then JSON should be valid
    And preserve as much as possible

  # @TestID: INT-CONVERT-003
  # Test YAML to TON interoperability
  Scenario: YAML interoperability
    Given a YAML document
    When I convert to TON and back
    Then data should be preserved
    And structure maintained

  # @TestID: INT-CONVERT-004
  # Test XML to TON transformation
  Scenario: XML transformation
    Given XML with attributes and text
    When I transform to TON
    Then structure should map appropriately
    And attributes should be preserved

  # Object Mapping

  # @TestID: INT-MAPPING-001
  # Test deserialization to typed objects
  Scenario: Map to typed objects
    Given a TON document and class definition
    When I deserialize to object
    Then object should be populated
    And types should be correct

  # @TestID: INT-MAPPING-002
  # Test serialization from object instances
  Scenario: Serialize from objects
    Given an object instance
    When I serialize to TON
    Then TON should reflect object state
    And maintain type information

  # @TestID: INT-MAPPING-003
  # Test nested object graph preservation
  Scenario: Nested object graphs
    Given complex object hierarchy
    When I serialize and deserialize
    Then object graph should be preserved
    And references maintained

  # @TestID: INT-MAPPING-004
  # Test polymorphic deserialization with class hints
  Scenario: Polymorphic deserialization
    Given TON with class hints
    When I deserialize polymorphically
    Then correct types should be instantiated
    And inheritance respected

  # Configuration Management

  # @TestID: INT-CONFIG-001
  # Test loading configuration from TON file
  Scenario: Load configuration
    Given a configuration file in TON
    When application loads config
    Then settings should be applied
    And environment variables resolved

  # @TestID: INT-CONFIG-002
  # Test merging base and override configurations
  Scenario: Merge configurations
    Given base and override configs
    When I merge configurations
    Then overrides should take precedence
    And arrays should merge correctly

  # @TestID: INT-CONFIG-003
  # Test configuration profiles for different environments
  Scenario: Configuration profiles
    Given configs for dev, test, prod
    When I load with profile
    Then correct config should be used
    And profile-specific values applied

  # @TestID: INT-CONFIG-004
  # Test dynamic configuration reloading
  Scenario: Dynamic configuration reload
    Given a running application
    When config file changes
    Then changes should be detected
    And configuration reloaded

  # Error Handling Integration

  # @TestID: INT-ERROR-001
  # Test parse error recovery with multiple errors
  Scenario: Parse error recovery
    Given document with multiple errors
    When I parse with recovery
    Then should report all errors
    And recover where possible

  # @TestID: INT-ERROR-002
  # Test validation error collection and aggregation
  Scenario: Validation error aggregation
    Given document with validation errors
    When I validate completely
    Then all errors should be collected
    And reported with context

  # @TestID: INT-ERROR-003
  # Test serialization error handling for circular references
  Scenario: Serialization error handling
    Given object with circular reference
    When I attempt to serialize
    Then should detect cycle
    And provide helpful error

  # Performance Integration

  # @TestID: INT-PERF-002
  # Test handling of large documents with many properties
  Scenario: Large document handling
    Given a document with 1M properties
    When I perform operations
    Then performance should be acceptable
    And memory usage reasonable

  # @TestID: INT-PERF-003
  # Test concurrent operations and thread safety
  Scenario: Concurrent operations
    Given multiple threads/processes
    When they access same document
    Then operations should be thread-safe
    And data should not corrupt

  # @TestID: INT-PERF-004
  # Test cache integration for performance improvement
  Scenario: Cache integration
    Given repeated operations
    When I enable caching
    Then performance should improve
    And cache should be manageable

  # Extension Integration

  # @TestID: INT-EXTEND-001
  # Test custom type handler integration
  Scenario: Custom type handlers
    Given custom type definitions
    When I parse with extensions
    Then custom types should work
    And serialize correctly

  # @TestID: INT-EXTEND-002
  # Test plugin architecture integration
  Scenario: Plugin architecture
    Given parser with plugins
    When I process documents
    Then plugins should be invoked
    And modify behavior appropriately

  # @TestID: INT-EXTEND-003
  # Test format negotiation with multiple handlers
  Scenario: Format negotiation
    Given multiple format handlers
    When I process unknown extension
    Then correct handler should be selected
    And format detected

  # Debugging and Tooling

  # @TestID: INT-DEBUG-001
  # Test debug mode parsing with parse tree output
  Scenario: Debug mode parsing
    Given parser in debug mode
    When I parse document
    Then should output parse tree
    And token stream

  # @TestID: INT-DEBUG-002
  # Test tokenization for syntax highlighting
  Scenario: Syntax highlighting
    Given a TON document
    When I tokenize for highlighting
    Then tokens should classify correctly
    And enable proper coloring

  # @TestID: INT-DEBUG-003
  # Test linting integration with issue detection
  Scenario: Linting integration
    Given a linter configuration
    When I lint TON files
    Then issues should be detected
    And fixes suggested

  # @TestID: INT-DEBUG-004
  # Test format checking with style configuration
  Scenario: Format checking
    Given style configuration
    When I check formatting
    Then violations should be reported
    And auto-fixable identified

  # Backward Compatibility

  # @TestID: INT-COMPAT-001
  # Test parsing legacy TON format versions
  Scenario: Parse legacy format
    Given TON v1 document
    When I parse with v2 parser
    Then should maintain compatibility
    And upgrade format if requested

  # @TestID: INT-COMPAT-002
  # Test version detection for different TON versions
  Scenario: Version detection
    Given documents of various versions
    When I parse each
    Then versions should be detected
    And handled appropriately

  # Security Integration

  # @TestID: INT-SECURITY-001
  # Test handling of potentially malicious input
  Scenario: Untrusted input handling
    Given potentially malicious input
    When I parse with security enabled
    Then should prevent attacks
    And sanitize output

  # @TestID: INT-SECURITY-002
  # Test resource limit enforcement in constrained environments
  Scenario: Resource limit enforcement
    Given resource-limited environment
    When I parse large document
    Then limits should be enforced
    And graceful degradation occur

  # Localization

  # @TestID: INT-I18N-001
  # Test internationalized content with multiple languages
  Scenario: Internationalized content
    Given TON with multiple languages
    When I parse and process
    Then encodings should be preserved
    And languages handled correctly

  # @TestID: INT-I18N-002
  # Test localization of error messages
  Scenario: Error message localization
    Given locale preference
    When errors occur
    Then messages should be localized
    And maintain technical details