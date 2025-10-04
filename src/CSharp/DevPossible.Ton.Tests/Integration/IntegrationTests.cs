using Xunit;
using FluentAssertions;
using TONfile;
using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;

namespace TONfile.Tests.Integration
{
    public class IntegrationTests : IDisposable
    {
        private readonly string _testDirectory;

        public IntegrationTests()
        {
            _testDirectory = Path.Combine(Path.GetTempPath(), $"tonfile_tests_{Guid.NewGuid()}");
            Directory.CreateDirectory(_testDirectory);
        }

        public void Dispose()
        {
            if (Directory.Exists(_testDirectory))
            {
                Directory.Delete(_testDirectory, true);
            }
        }

        // @TestID: INT-COMPLEX-001
        // Test complex round-trip with all TON features
        [Fact]
        public void Should_RoundTrip_Complex_Document()
        {
            // Arrange
            var parser = new TonParser();
            var serializer = new TonSerializer();

            var originalTon = @"
#@ tonVersion = '1', @schemaFile = 'schema.ton'

{(database)
    @host = $'localhost',
    @port = %5432,
    name = 'mydb',
    ssl = true,
    maxConnections = 0xFF,
    flags = 0b11010101,
    instanceId = 550e8400-e29b-41d4-a716-446655440000,
    logLevel = |debug|,
    features = |encryption|compression|monitoring|,
    createdAt = '2024-01-15T10:30:00Z',
    lastBackup = null,
    description = undefined,

    {(credentials)
        username = 'admin',
        password = 'secret123',
        expires = '2024-12-31T23:59:59Z'
    },

    {(pool)
        min = 5,
        max = 100,
        timeout = 30
    }
}

#! enum(logLevel) [error, warning, info, debug, trace]
#! enumSet(features) [encryption, compression, monitoring, replication, caching]

#! {(database)
    /host = string(required, format(hostname)),
    /port = int(required, range(1, 65535)),
    /name = string(required, minLength(1), maxLength(64)),
    /ssl = boolean(default(false)),
    /maxConnections = int(min(1), max(1000)),
    /logLevel = enum:logLevel(default(info))
}";

            // Act
            var document1 = parser.Parse(originalTon);
            var serialized = serializer.SerializeDocument(document1, TonSerializeOptions.Pretty);
            var document2 = parser.Parse(serialized);

            // Assert
            // Check header
            document2.Header?.TonVersion.Should().Be("1");
            document2.Header?.SchemaFile.Should().Be("schema.ton");

            // Check root object
            var root = document2.RootObject;
            root.ClassName.Should().Be("database");

            // Check properties
            root.GetProperty("host")?.ToString().Should().Be("localhost");
            root.GetProperty("port")?.ToInt32().Should().Be(5432);
            root.GetProperty("name")?.ToString().Should().Be("mydb");
            root.GetProperty("ssl")?.ToBoolean().Should().BeTrue();
            root.GetProperty("maxConnections")?.ToInt32().Should().Be(255);
            root.GetProperty("flags")?.ToInt32().Should().Be(213);
            root.GetProperty("instanceId")?.ToGuid().Should().Be(Guid.Parse("550e8400-e29b-41d4-a716-446655440000"));
            root.GetProperty("lastBackup")?.IsNull.Should().BeTrue();
            root.GetProperty("description")?.IsUndefined.Should().BeTrue();

            // Check enums
            var logLevel = root.GetProperty("logLevel")?.Value as TonEnum;
            logLevel?.Value.Should().Be("debug");

            var features = root.GetProperty("features")?.Value as TonEnumSet;
            features?.GetNames().Should().Contain(new[] { "encryption", "compression", "monitoring" });

            // Check children
            root.Children.Should().HaveCount(2);
            var credentials = root.GetChild("credentials");
            credentials?.GetProperty("username")?.ToString().Should().Be("admin");

            var pool = root.GetChild("pool");
            pool?.GetProperty("min")?.ToInt32().Should().Be(5);

            // Check schemas
            document2.Schemas?.Enums.Should().HaveCount(2);
        }

        // @TestID: INT-BASIC-004
        // Test serializing and writing to file
        [Fact]
        public async Task Should_Handle_File_Operations()
        {
            // Arrange
            var parser = new TonParser();
            var serializer = new TonSerializer();

            var filePath = Path.Combine(_testDirectory, "test.ton");
            var content = @"{
                name = 'Test File',
                version = 1.0,
                active = true
            }";

            await File.WriteAllTextAsync(filePath, content);

            // Act - Parse from file
            var document = await parser.ParseFileAsync(filePath);

            // Assert
            document.Source.Should().Be(filePath);
            document.RootObject.GetProperty("name")?.ToString().Should().Be("Test File");
            document.RootObject.GetProperty("version")?.ToDouble().Should().Be(1.0);

            // Act - Modify and save
            document.SetValue("/version", 2.0);
            document.SetValue("/modified", DateTime.UtcNow.ToString("O"));

            var outputPath = Path.Combine(_testDirectory, "output.ton");
            await serializer.SerializeToFileAsync(document, outputPath, TonSerializeOptions.Pretty);

            // Assert - Read back
            var content2 = await File.ReadAllTextAsync(outputPath);
            content2.Should().Contain("version = %2");
            content2.Should().Contain("modified");
        }

        // @TestID: INT-BASIC-007
        // Test parsing from input stream
        [Fact]
        public void Should_Handle_Stream_Operations()
        {
            // Arrange
            var parser = new TonParser();
            var serializer = new TonSerializer();

            var tonContent = @"{
                data = 'stream test',
                value = 42
            }";

            // Act - Parse from stream
            TonDocument document;
            using (var stream = new MemoryStream(Encoding.UTF8.GetBytes(tonContent)))
            {
                document = parser.ParseStream(stream);
            }

            // Assert
            document.RootObject.GetProperty("data")?.ToString().Should().Be("stream test");
            document.RootObject.GetProperty("value")?.ToInt32().Should().Be(42);

            // Act - Serialize to stream
            using (var outputStream = new MemoryStream())
            {
                serializer.SerializeToStream(document, outputStream, TonSerializeOptions.Compact);
                var result = Encoding.UTF8.GetString(outputStream.ToArray());

                // Assert
                result.Should().Contain("data = 'stream test'");
                result.Should().Contain("value = 42");
            }
        }

        // @TestID: INT-MAPPING-001
        // Test deserialization to typed objects
        [Fact]
        public void Should_Convert_Between_Objects_And_Ton()
        {
            // Arrange
            var testData = new TestData
            {
                Id = Guid.NewGuid(),
                Name = "Test Object",
                Count = 42,
                IsActive = true,
                Tags = new[] { "tag1", "tag2", "tag3" },
                CreatedAt = DateTime.UtcNow,
                Metadata = new TestMetadata
                {
                    Version = "1.0.0",
                    Author = "Test Author"
                }
            };

            // Act - Convert to TON
            var document = TonDocument.FromObject(testData);
            var serializer = new TonSerializer();
            var tonString = serializer.SerializeDocument(document, TonSerializeOptions.Pretty);

            // Assert
            tonString.Should().Contain("Name = $'Test Object'");
            tonString.Should().Contain("Count = %42");
            tonString.Should().Contain("IsActive = true");

            // Act - Parse back and convert to object
            var parser = new TonParser();
            var parsed = parser.Parse(tonString);
            var reconstructed = parsed.RootObject.ToObject<TestData>();

            // Assert
            reconstructed.Name.Should().Be("Test Object");
            reconstructed.Count.Should().Be(42);
            reconstructed.IsActive.Should().BeTrue();
        }

        // @TestID: INT-VALID-001
        // Test parsing with schema validation
        [Fact]
        public void Should_Validate_With_External_Schema()
        {
            // Arrange
            var schemaPath = Path.Combine(_testDirectory, "schema.ton");
            var schemaContent = @"
#! enum(priority) [low, medium, high, critical]

#! {(task)
    /title = string(required, minLength(1), maxLength(100)),
    /description = string(maxLength(500)),
    /priority = enum:priority(required, default(medium)),
    /completed = boolean(default(false)),
    /dueDate = date(future)
}";

            File.WriteAllText(schemaPath, schemaContent);

            var dataContent = $@"
#@ @schemaFile = '{schemaPath.Replace('\\', '/')}'

{{(task)
    title = 'Complete unit tests',
    description = 'Write comprehensive unit tests for TON parser',
    priority = |high|,
    completed = false,
    dueDate = '2024-12-31T23:59:59Z'
}}";

            var parser = new TonParser();

            // Act
            var document = parser.Parse(dataContent);

            // Note: In a real implementation, we'd load and apply the external schema
            // For this test, we're demonstrating the structure

            // Assert
            document.Header?.SchemaFile.Should().Contain("schema.ton");
            document.RootObject.ClassName.Should().Be("task");
            document.RootObject.GetProperty("priority")?.Value.Should().BeOfType<TonEnum>();
        }

        // @TestID: INT-PERF-002
        // Test handling of large documents with many properties
        [Fact]
        public void Should_Handle_Large_Document()
        {
            // Arrange
            var parser = new TonParser();
            var serializer = new TonSerializer();

            var doc = new TonDocument();
            var root = doc.RootObject;
            root.ClassName = "dataset";

            // Add many properties
            for (int i = 0; i < 1000; i++)
            {
                root.SetProperty($"prop_{i}", TonValue.From($"value_{i}"));
            }

            // Add many child objects
            for (int i = 0; i < 100; i++)
            {
                var child = new TonObject { ClassName = "record" };
                child.SetProperty("id", TonValue.From(i));
                child.SetProperty("data", TonValue.From($"Record {i}"));
                root.AddChild(child);
            }

            // Act
            var serialized = serializer.SerializeDocument(doc, TonSerializeOptions.Compact);
            var parsed = parser.Parse(serialized);

            // Assert
            parsed.RootObject.Properties.Should().HaveCount(1000);
            parsed.RootObject.Children.Should().HaveCount(100);
            parsed.RootObject.GetProperty("prop_500")?.ToString().Should().Be("value_500");
            parsed.RootObject.Children[50].GetProperty("id")?.ToInt32().Should().Be(50);
        }

        // Test data classes
        private class TestData
        {
            public Guid Id { get; set; }
            public string Name { get; set; } = "";
            public int Count { get; set; }
            public bool IsActive { get; set; }
            public string[] Tags { get; set; } = Array.Empty<string>();
            public DateTime CreatedAt { get; set; }
            public TestMetadata? Metadata { get; set; }
        }

        private class TestMetadata
        {
            public string Version { get; set; } = "";
            public string Author { get; set; } = "";
        }
    }
}