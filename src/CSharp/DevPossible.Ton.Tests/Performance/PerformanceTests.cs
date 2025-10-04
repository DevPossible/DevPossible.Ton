using Xunit;
using FluentAssertions;
using TONfile;
using System;
using System.Diagnostics;
using System.Text;

namespace TONfile.Tests.Performance
{
    public class PerformanceTests
    {
        private readonly TonParser _parser = new TonParser();
        private readonly TonSerializer _serializer = new TonSerializer();

        // @TestID: PRF-BASIC-003
        // Test parsing performance for large documents
        [Fact]
        public void Should_Parse_Large_Document_Efficiently()
        {
            // Arrange
            var sb = new StringBuilder();
            sb.AppendLine("{(dataset)");

            // Add 10,000 properties
            for (int i = 0; i < 10000; i++)
            {
                sb.AppendLine($"    property_{i} = 'value_{i}',");
            }

            // Add 1,000 child objects
            for (int i = 0; i < 1000; i++)
            {
                sb.AppendLine($"    {{(record)");
                sb.AppendLine($"        id = {i},");
                sb.AppendLine($"        name = 'Record {i}',");
                sb.AppendLine($"        value = {i * 1.5}");
                sb.AppendLine($"    }}{(i < 999 ? "," : "")}");
            }

            sb.AppendLine("}");

            var input = sb.ToString();

            // Act
            var stopwatch = Stopwatch.StartNew();
            var document = _parser.Parse(input);
            stopwatch.Stop();

            // Assert
            document.RootObject.Properties.Should().HaveCount(10000);
            document.RootObject.Children.Should().HaveCount(1000);

            // Should parse in reasonable time (< 5 seconds for this size)
            stopwatch.ElapsedMilliseconds.Should().BeLessThan(5000);
        }

        // @TestID: PRF-PERF-001
        // Test serialization performance for large documents
        [Fact]
        public void Should_Serialize_Large_Document_Efficiently()
        {
            // Arrange
            var document = new TonDocument();
            var root = document.RootObject;
            root.ClassName = "dataset";

            // Add 10,000 properties
            for (int i = 0; i < 10000; i++)
            {
                root.SetProperty($"property_{i}", TonValue.From($"value_{i}"));
            }

            // Add 1,000 child objects
            for (int i = 0; i < 1000; i++)
            {
                var child = new TonObject { ClassName = "record" };
                child.SetProperty("id", TonValue.From(i));
                child.SetProperty("name", TonValue.From($"Record {i}"));
                child.SetProperty("value", TonValue.From(i * 1.5));
                root.AddChild(child);
            }

            // Act
            var stopwatch = Stopwatch.StartNew();
            var result = _serializer.SerializeDocument(document, TonSerializeOptions.Compact);
            stopwatch.Stop();

            // Assert
            result.Should().NotBeNullOrEmpty();
            result.Should().Contain("property_5000");

            // Should serialize in reasonable time (< 2 seconds for this size)
            stopwatch.ElapsedMilliseconds.Should().BeLessThan(2000);
        }

        // @TestID: PRF-COMPLEX-001
        // Test performance with deeply nested structures
        [Fact]
        public void Should_Handle_Deep_Nesting_Efficiently()
        {
            // Arrange
            var depth = 50;
            var sb = new StringBuilder();

            // Build deeply nested structure
            for (int i = 0; i < depth; i++)
            {
                sb.Append("{");
                if (i == 0)
                {
                    sb.Append($"(level{i})");
                }
                sb.AppendLine();
                sb.Append(new string(' ', (i + 1) * 4));
                sb.Append($"depth = {i},");
                sb.AppendLine();
                sb.Append(new string(' ', (i + 1) * 4));
            }

            // Close all braces
            for (int i = depth - 1; i >= 0; i--)
            {
                sb.Append(new string(' ', i * 4));
                sb.AppendLine("}");
            }

            var input = sb.ToString();

            // Act
            var stopwatch = Stopwatch.StartNew();
            var options = new TonParseOptions { MaxNestingDepth = 100 };
            var document = _parser.Parse(input, options);
            stopwatch.Stop();

            // Assert
            document.Should().NotBeNull();

            // Should handle deep nesting quickly (< 500ms)
            stopwatch.ElapsedMilliseconds.Should().BeLessThan(500);

            // Verify the structure
            var current = document.RootObject;
            for (int i = 0; i < Math.Min(depth - 1, 10); i++)
            {
                current.GetProperty("depth")?.ToInt32().Should().Be(i);
                current = current.Children.FirstOrDefault();
                if (current == null) break;
            }
        }

        // @TestID: PRF-BASIC-001
        // Test parsing performance for small documents
        [Fact]
        public void Should_Optimize_With_Type_Hints()
        {
            // Arrange
            var sb1 = new StringBuilder();
            var sb2 = new StringBuilder();

            sb1.AppendLine("{");
            sb2.AppendLine("{");

            // Version without type hints
            for (int i = 0; i < 1000; i++)
            {
                sb1.AppendLine($"    str_{i} = 'string value {i}',");
                sb1.AppendLine($"    num_{i} = {i * 2},");
                sb1.AppendLine($"    guid_{i} = 550e8400-e29b-41d4-a716-44665544{i:D4},");
            }

            // Version with type hints
            for (int i = 0; i < 1000; i++)
            {
                sb2.AppendLine($"    str_{i} = $'string value {i}',");
                sb2.AppendLine($"    num_{i} = %{i * 2},");
                sb2.AppendLine($"    guid_{i} = &550e8400-e29b-41d4-a716-44665544{i:D4},");
            }

            sb1.AppendLine("}");
            sb2.AppendLine("}");

            var withoutHints = sb1.ToString();
            var withHints = sb2.ToString();

            // Act
            var stopwatch1 = Stopwatch.StartNew();
            var doc1 = _parser.Parse(withoutHints);
            stopwatch1.Stop();

            var stopwatch2 = Stopwatch.StartNew();
            var doc2 = _parser.Parse(withHints);
            stopwatch2.Stop();

            // Assert
            doc1.RootObject.Properties.Should().HaveCount(3000);
            doc2.RootObject.Properties.Should().HaveCount(3000);

            // Both should parse quickly
            stopwatch1.ElapsedMilliseconds.Should().BeLessThan(2000);
            stopwatch2.ElapsedMilliseconds.Should().BeLessThan(2000);

            // Type hints version might be slightly faster (but not always measurable)
            // The main benefit is in type safety and reduced ambiguity
        }

        // @TestID: PRF-PERF-002
        // Test validation performance with complex schemas
        [Fact]
        public void Should_Validate_Large_Document_Efficiently()
        {
            // Arrange
            var schemas = new TonSchemaCollection();
            var recordSchema = new TonSchemaDefinition("record");

            var idSchema = new TonPropertySchema("/id", "int");
            idSchema.AddValidation(new TonValidationRule(ValidationRuleType.Required));
            idSchema.AddValidation(new TonValidationRule(ValidationRuleType.Min, 0));
            recordSchema.AddProperty("/id", idSchema);

            var nameSchema = new TonPropertySchema("/name", "string");
            nameSchema.AddValidation(new TonValidationRule(ValidationRuleType.Required));
            nameSchema.AddValidation(new TonValidationRule(ValidationRuleType.MinLength, 1));
            nameSchema.AddValidation(new TonValidationRule(ValidationRuleType.MaxLength, 100));
            recordSchema.AddProperty("/name", nameSchema);

            var valueSchema = new TonPropertySchema("/value", "float");
            valueSchema.AddValidation(new TonValidationRule(ValidationRuleType.Min, 0.0));
            valueSchema.AddValidation(new TonValidationRule(ValidationRuleType.Max, 1000000.0));
            recordSchema.AddProperty("/value", valueSchema);

            schemas.AddSchema(recordSchema);

            // Create document with 1000 records
            var document = new TonDocument();
            document.Schemas = schemas;

            for (int i = 0; i < 1000; i++)
            {
                var record = new TonObject { ClassName = "record" };
                record.SetProperty("id", TonValue.From(i));
                record.SetProperty("name", TonValue.From($"Record {i}"));
                record.SetProperty("value", TonValue.From(i * 10.5));
                document.RootObject.AddChild(record);
            }

            // Act
            var stopwatch = Stopwatch.StartNew();
            var result = document.Validate();
            stopwatch.Stop();

            // Assert
            result.IsValid.Should().BeTrue();

            // Should validate quickly (< 1 second for 1000 records)
            stopwatch.ElapsedMilliseconds.Should().BeLessThan(1000);
        }

        // @TestID: PRF-COMPLEX-002
        // Test performance with large arrays
        [Fact]
        public void Should_Handle_Many_Enum_Values_Efficiently()
        {
            // Arrange
            var sb = new StringBuilder();
            sb.AppendLine("{");

            // Create properties with large enum sets
            for (int i = 0; i < 100; i++)
            {
                sb.Append($"    permissions_{i} = |");
                for (int j = 0; j < 50; j++)
                {
                    sb.Append($"perm{j}|");
                }
                sb.AppendLine(",");
            }

            sb.AppendLine("}");

            var input = sb.ToString();

            // Act
            var stopwatch = Stopwatch.StartNew();
            var document = _parser.Parse(input);
            stopwatch.Stop();

            // Assert
            document.RootObject.Properties.Should().HaveCount(100);

            // Verify enum sets were parsed correctly
            var firstEnumSet = document.RootObject.GetProperty("permissions_0")?.Value as TonEnumSet;
            firstEnumSet?.Values.Should().HaveCount(50);

            // Should parse quickly even with many enum values
            stopwatch.ElapsedMilliseconds.Should().BeLessThan(1000);
        }

        // @TestID: PRF-PERF-003
        // Test round-trip parse-serialize cycle performance
        [Fact]
        public void Should_Round_Trip_Efficiently()
        {
            // Arrange
            var originalDoc = new TonDocument();
            var root = originalDoc.RootObject;
            root.ClassName = "performance_test";

            // Add various data types
            for (int i = 0; i < 100; i++)
            {
                root.SetProperty($"string_{i}", TonValue.From($"Value {i}"));
                root.SetProperty($"int_{i}", TonValue.From(i));
                root.SetProperty($"float_{i}", TonValue.From(i * 3.14));
                root.SetProperty($"bool_{i}", TonValue.From(i % 2 == 0));
                root.SetProperty($"guid_{i}", TonValue.From(Guid.NewGuid()));

                if (i % 3 == 0)
                    root.SetProperty($"null_{i}", new TonValue(null, TonValueType.Null));

                if (i % 5 == 0)
                    root.SetProperty($"enum_{i}", TonValue.From(new TonEnum("value")));
            }

            // Act
            var stopwatch = Stopwatch.StartNew();

            // Serialize
            var serialized = _serializer.SerializeDocument(originalDoc, TonSerializeOptions.Compact);

            // Parse back
            var parsed = _parser.Parse(serialized);

            // Serialize again
            var reserialized = _serializer.SerializeDocument(parsed, TonSerializeOptions.Compact);

            stopwatch.Stop();

            // Assert
            // Compact mode omits null values, so we expect fewer properties
            var expectedCount = originalDoc.RootObject.Properties.Count -
                originalDoc.RootObject.Properties.Count(p => p.Value.IsNull);
            parsed.RootObject.Properties.Count.Should().Be(expectedCount);

            // Should complete round-trip quickly
            stopwatch.ElapsedMilliseconds.Should().BeLessThan(500);

            // Results should be equivalent
            reserialized.Should().Be(serialized);
        }

        [Theory]
        [InlineData(100)]
        [InlineData(1000)]
        [InlineData(5000)]
        public void Should_Scale_Linearly_With_Document_Size(int propertyCount)
        {
            // Arrange
            var sb = new StringBuilder();
            sb.AppendLine("{");

            for (int i = 0; i < propertyCount; i++)
            {
                sb.AppendLine($"    property_{i} = 'value_{i}'{(i < propertyCount - 1 ? "," : "")}");
            }

            sb.AppendLine("}");
            var input = sb.ToString();

            // Act
            var stopwatch = Stopwatch.StartNew();
            var document = _parser.Parse(input);
            stopwatch.Stop();

            // Assert
            document.RootObject.Properties.Should().HaveCount(propertyCount);

            // Time should scale roughly linearly
            // Increased threshold to account for CI environment overhead
            // CI environments (GitHub Actions) are typically 1.5-2x slower than local development machines
            var expectedMaxTime = (propertyCount / 10) + 400; // +400ms overhead for CI environments
            stopwatch.ElapsedMilliseconds.Should().BeLessThan(expectedMaxTime);
        }
    }
}
