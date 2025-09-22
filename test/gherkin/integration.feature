Feature: TON Integration Tests
  As a TON library
  I need to ensure all components work together correctly
  So that users can rely on end-to-end functionality

  Background:
    Given a complete TON library implementation

  # Round-trip Operations

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

  Scenario: Complex round-trip
    Given a complex document with all features
    When I parse, modify, and serialize
    Then all data should be preserved
    And modifications should be reflected

  Scenario: Format conversion round-trip
    Given a pretty-formatted document
    When I parse and serialize compact
    Then parse compact and serialize pretty
    Then semantics should be identical

  # File Operations

  Scenario: Read from file
    Given a TON file "test.ton"
    When I read and parse the file
    Then document should be loaded correctly
    And encoding should be detected

  Scenario: Write to file
    Given a parsed document
    When I serialize to file "output.ton"
    Then file should be created
    And content should be valid TON

  Scenario: Update existing file
    Given an existing TON file
    When I read, modify, and save
    Then changes should be persisted
    And file should remain valid

  Scenario: Batch file processing
    Given a directory of TON files
    When I process all files
    Then each should be handled correctly
    And errors should be collected

  # Stream Processing

  Scenario: Parse from stream
    Given a readable stream with TON content
    When I parse from stream
    Then document should be parsed
    And stream should be properly closed

  Scenario: Serialize to stream
    Given a document to serialize
    When I write to stream
    Then stream should contain valid TON
    And be flushable on demand

  Scenario: Streaming large documents
    Given a 100MB TON document stream
    When I process in streaming mode
    Then memory should stay bounded
    And processing should complete

  # Schema Integration

  Scenario: Parse with schema validation
    Given a schema and matching document
    When I parse with validation
    Then document should parse successfully
    And be validated against schema

  Scenario: Schema-guided parsing
    Given a schema with defaults
    When I parse incomplete document
    Then defaults should be applied
    And required fields enforced

  Scenario: Multiple schema validation
    Given document and multiple schemas
    When I validate against all
    Then should report which schemas match
    And which validations fail

  Scenario: Schema evolution
    Given versioned schemas v1 and v2
    When I migrate document from v1 to v2
    Then migration should succeed
    And document should validate against v2

  # Type Conversion

  Scenario: JSON to TON conversion
    Given a JSON document
    When I convert to TON
    Then TON should represent same data
    And use appropriate TON features

  Scenario: TON to JSON conversion
    Given a TON document
    When I convert to JSON
    Then JSON should be valid
    And preserve as much as possible

  Scenario: YAML interoperability
    Given a YAML document
    When I convert to TON and back
    Then data should be preserved
    And structure maintained

  Scenario: XML transformation
    Given XML with attributes and text
    When I transform to TON
    Then structure should map appropriately
    And attributes should be preserved

  # Object Mapping

  Scenario: Map to typed objects
    Given a TON document and class definition
    When I deserialize to object
    Then object should be populated
    And types should be correct

  Scenario: Serialize from objects
    Given an object instance
    When I serialize to TON
    Then TON should reflect object state
    And maintain type information

  Scenario: Nested object graphs
    Given complex object hierarchy
    When I serialize and deserialize
    Then object graph should be preserved
    And references maintained

  Scenario: Polymorphic deserialization
    Given TON with class hints
    When I deserialize polymorphically
    Then correct types should be instantiated
    And inheritance respected

  # Configuration Management

  Scenario: Load configuration
    Given a configuration file in TON
    When application loads config
    Then settings should be applied
    And environment variables resolved

  Scenario: Merge configurations
    Given base and override configs
    When I merge configurations
    Then overrides should take precedence
    And arrays should merge correctly

  Scenario: Configuration profiles
    Given configs for dev, test, prod
    When I load with profile
    Then correct config should be used
    And profile-specific values applied

  Scenario: Dynamic configuration reload
    Given a running application
    When config file changes
    Then changes should be detected
    And configuration reloaded

  # Error Handling Integration

  Scenario: Parse error recovery
    Given document with multiple errors
    When I parse with recovery
    Then should report all errors
    And recover where possible

  Scenario: Validation error aggregation
    Given document with validation errors
    When I validate completely
    Then all errors should be collected
    And reported with context

  Scenario: Serialization error handling
    Given object with circular reference
    When I attempt to serialize
    Then should detect cycle
    And provide helpful error

  # Performance Integration

  Scenario: Large document handling
    Given a document with 1M properties
    When I perform operations
    Then performance should be acceptable
    And memory usage reasonable

  Scenario: Concurrent operations
    Given multiple threads/processes
    When they access same document
    Then operations should be thread-safe
    And data should not corrupt

  Scenario: Cache integration
    Given repeated operations
    When I enable caching
    Then performance should improve
    And cache should be manageable

  # Extension Integration

  Scenario: Custom type handlers
    Given custom type definitions
    When I parse with extensions
    Then custom types should work
    And serialize correctly

  Scenario: Plugin architecture
    Given parser with plugins
    When I process documents
    Then plugins should be invoked
    And modify behavior appropriately

  Scenario: Format negotiation
    Given multiple format handlers
    When I process unknown extension
    Then correct handler should be selected
    And format detected

  # Debugging and Tooling

  Scenario: Debug mode parsing
    Given parser in debug mode
    When I parse document
    Then should output parse tree
    And token stream

  Scenario: Syntax highlighting
    Given a TON document
    When I tokenize for highlighting
    Then tokens should classify correctly
    And enable proper coloring

  Scenario: Linting integration
    Given a linter configuration
    When I lint TON files
    Then issues should be detected
    And fixes suggested

  Scenario: Format checking
    Given style configuration
    When I check formatting
    Then violations should be reported
    And auto-fixable identified

  # Backward Compatibility

  Scenario: Parse legacy format
    Given TON v1 document
    When I parse with v2 parser
    Then should maintain compatibility
    And upgrade format if requested

  Scenario: Version detection
    Given documents of various versions
    When I parse each
    Then versions should be detected
    And handled appropriately

  # Security Integration

  Scenario: Untrusted input handling
    Given potentially malicious input
    When I parse with security enabled
    Then should prevent attacks
    And sanitize output

  Scenario: Resource limit enforcement
    Given resource-limited environment
    When I parse large document
    Then limits should be enforced
    And graceful degradation occur

  # Localization

  Scenario: Internationalized content
    Given TON with multiple languages
    When I parse and process
    Then encodings should be preserved
    And languages handled correctly

  Scenario: Error message localization
    Given locale preference
    When errors occur
    Then messages should be localized
    And maintain technical details