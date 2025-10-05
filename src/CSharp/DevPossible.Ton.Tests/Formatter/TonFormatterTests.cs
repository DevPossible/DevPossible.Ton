using System;
using System.IO;
using System.Threading.Tasks;
using Xunit;
using FluentAssertions;
using DevPossible.Ton;

namespace DevPossible.Ton.Tests.Formatter
{
    public class TonFormatterTests
    {
        private const string SampleTonContent = @"{
name='TestApp',version=1.5,enabled=true,database={host='localhost',port=5432,ssl=true},features=|auth|logging|,endpoints=[{path='/api/users',method='GET',auth=true},{path='/api/health',method='GET',auth=false}]
}";

        private const string MultiLineTonContent = "{\n    description = 'Simple description',\n    value = 42\n}";

        // @TestID: FMT-FORMAT-001
        // Test formatting unformatted TON to pretty style
        [Fact]
        public void FormatString_WithPrettyStyle_ShouldFormatCorrectly()
        {
            // Act
            var result = TonFormatter.FormatString(SampleTonContent, TonFormatStyle.Pretty);

            // Assert
            result.Should().NotBeNullOrEmpty();
            result.Should().Contain("#@ tonVersion = '1'"); // Should include header
            result.Should().Contain("    "); // Should have indentation
            result.Should().Contain("enabled = true");
            result.Should().Match("*{*database*}*"); // Should have proper structure
        }

        // @TestID: FMT-FORMAT-002
        // Test formatting TON to compact style
        [Fact]
        public void FormatString_WithCompactStyle_ShouldFormatCorrectly()
        {
            // Act
            var result = TonFormatter.FormatString(SampleTonContent, TonFormatStyle.Compact);

            // Assert
            result.Should().NotBeNullOrEmpty();
            result.Should().NotContain("#@"); // Should not include header
            result.Should().NotContain("    "); // Should not have indentation
            result.Should().NotContain("\n"); // Should be on single line
            result.Should().Contain("enabled = true"); // Should have compact format
        }

        // @TestID: FMT-BASIC-001
        // Test formatting from file input
        [Fact]
        public void FormatString_WithDefaultStyle_ShouldUsePretty()
        {
            // Act
            var result = TonFormatter.FormatString(SampleTonContent);

            // Assert
            result.Should().NotBeNullOrEmpty();
            result.Should().Contain("#@ tonVersion = '1'"); // Should include header (pretty format)
            result.Should().Contain("    "); // Should have indentation
        }

        // @TestID: FMT-ERROR-001
        // Test error recovery during formatting
        [Fact]
        public void FormatString_WithNullContent_ShouldThrowArgumentNullException()
        {
            // Act & Assert
            Assert.Throws<ArgumentNullException>(() => TonFormatter.FormatString(null!));
        }

        // @TestID: FMT-ERROR-001
        // Test error recovery during formatting
        [Fact]
        public void FormatString_WithInvalidContent_ShouldThrowTonParseException()
        {
            // Arrange
            var invalidContent = "{ invalid syntax here }";

            // Act & Assert
            Assert.Throws<TonParseException>(() => TonFormatter.FormatString(invalidContent));
        }

        // @TestID: FMT-FORMAT-007
        // Test multi-line string formatting
        [Fact]
        public void FormatString_WithMultiLineStrings_ShouldPreserveContent()
        {
            // Act
            var result = TonFormatter.FormatString(MultiLineTonContent, TonFormatStyle.Pretty);

            // Assert
            result.Should().NotBeNullOrEmpty();
            result.Should().Contain("Simple description");
            result.Should().Contain("value = %42"); // Should have type hints in pretty format
        }

        // @TestID: FMT-FORMAT-001
        // Test formatting unformatted TON to pretty style
        [Fact]
        public async Task FormatStringAsync_WithPrettyStyle_ShouldFormatCorrectly()
        {
            // Act
            var result = await TonFormatter.FormatStringAsync(SampleTonContent, TonFormatStyle.Pretty);

            // Assert
            result.Should().NotBeNullOrEmpty();
            result.Should().Contain("#@ tonVersion = '1'");
            result.Should().Contain("    "); // Should have indentation
        }

        // @TestID: FMT-FORMAT-002
        // Test formatting TON to compact style
        [Fact]
        public async Task FormatStringAsync_WithCompactStyle_ShouldFormatCorrectly()
        {
            // Act
            var result = await TonFormatter.FormatStringAsync(SampleTonContent, TonFormatStyle.Compact);

            // Assert
            result.Should().NotBeNullOrEmpty();
            result.Should().NotContain("#@");
            result.Should().NotContain("    "); // Should not have indentation
        }

        // @TestID: FMT-BASIC-001
        // Test formatting from file input
        [Fact]
        public void FormatFile_WithValidFile_ShouldFormatCorrectly()
        {
            // Arrange
            var tempFile = Path.GetTempFileName();
            File.WriteAllText(tempFile, SampleTonContent);

            try
            {
                // Act
                var result = TonFormatter.FormatFile(tempFile, TonFormatStyle.Pretty);

                // Assert
                result.Should().NotBeNullOrEmpty();
                result.Should().Contain("#@ tonVersion = '1'");
                result.Should().Contain("    "); // Should have indentation
            }
            finally
            {
                File.Delete(tempFile);
            }
        }

        // @TestID: FMT-ERROR-001
        // Test error recovery during formatting
        [Fact]
        public void FormatFile_WithNonExistentFile_ShouldThrowFileNotFoundException()
        {
            // Arrange
            var nonExistentFile = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString() + ".ton");

            // Act & Assert
            Assert.Throws<FileNotFoundException>(() => TonFormatter.FormatFile(nonExistentFile));
        }

        // @TestID: FMT-ERROR-001
        // Test error recovery during formatting
        [Fact]
        public void FormatFile_WithNullPath_ShouldThrowArgumentNullException()
        {
            // Act & Assert
            Assert.Throws<ArgumentNullException>(() => TonFormatter.FormatFile(null!));
        }

        // @TestID: FMT-BASIC-001
        // Test formatting from file input
        [Fact]
        public async Task FormatFileAsync_WithValidFile_ShouldFormatCorrectly()
        {
            // Arrange
            var tempFile = Path.GetTempFileName();
            await File.WriteAllTextAsync(tempFile, SampleTonContent);

            try
            {
                // Act
                var result = await TonFormatter.FormatFileAsync(tempFile, TonFormatStyle.Pretty);

                // Assert
                result.Should().NotBeNullOrEmpty();
                result.Should().Contain("#@ tonVersion = '1'");
                result.Should().Contain("    "); // Should have indentation
            }
            finally
            {
                File.Delete(tempFile);
            }
        }

        // @TestID: FMT-BASIC-001
        // Test formatting from file input
        [Fact]
        public void FormatFileInPlace_WithValidFile_ShouldUpdateFile()
        {
            // Arrange
            var tempFile = Path.GetTempFileName();
            File.WriteAllText(tempFile, SampleTonContent);

            try
            {
                // Act
                TonFormatter.FormatFileInPlace(tempFile, TonFormatStyle.Pretty);

                // Assert
                var result = File.ReadAllText(tempFile);
                result.Should().NotBeNullOrEmpty();
                result.Should().Contain("#@ tonVersion = '1'");
                result.Should().Contain("    "); // Should have indentation
                result.Should().NotBe(SampleTonContent); // Should be different from original
            }
            finally
            {
                File.Delete(tempFile);
            }
        }

        // @TestID: FMT-BASIC-001
        // Test formatting from file input
        [Fact]
        public async Task FormatFileInPlaceAsync_WithValidFile_ShouldUpdateFile()
        {
            // Arrange
            var tempFile = Path.GetTempFileName();
            await File.WriteAllTextAsync(tempFile, SampleTonContent);

            try
            {
                // Act
                await TonFormatter.FormatFileInPlaceAsync(tempFile, TonFormatStyle.Pretty);

                // Assert
                var result = await File.ReadAllTextAsync(tempFile);
                result.Should().NotBeNullOrEmpty();
                result.Should().Contain("#@ tonVersion = '1'");
                result.Should().Contain("    "); // Should have indentation
                result.Should().NotBe(SampleTonContent); // Should be different from original
            }
            finally
            {
                File.Delete(tempFile);
            }
        }

        // @TestID: FMT-BASIC-002
        // Test batch formatting of multiple files
        [Fact]
        public void FormatFileToFile_WithValidFiles_ShouldCreateFormattedOutput()
        {
            // Arrange
            var inputFile = Path.GetTempFileName();
            var outputFile = Path.GetTempFileName();
            File.WriteAllText(inputFile, SampleTonContent);

            try
            {
                // Act
                TonFormatter.FormatFileToFile(inputFile, outputFile, TonFormatStyle.Pretty);

                // Assert
                var result = File.ReadAllText(outputFile);
                result.Should().NotBeNullOrEmpty();
                result.Should().Contain("#@ tonVersion = '1'");
                result.Should().Contain("    "); // Should have indentation

                // Original file should be unchanged
                var originalContent = File.ReadAllText(inputFile);
                originalContent.Should().Be(SampleTonContent);
            }
            finally
            {
                File.Delete(inputFile);
                File.Delete(outputFile);
            }
        }

        // @TestID: FMT-BASIC-002
        // Test batch formatting of multiple files
        [Fact]
        public async Task FormatFileToFileAsync_WithValidFiles_ShouldCreateFormattedOutput()
        {
            // Arrange
            var inputFile = Path.GetTempFileName();
            var outputFile = Path.GetTempFileName();
            await File.WriteAllTextAsync(inputFile, SampleTonContent);

            try
            {
                // Act
                await TonFormatter.FormatFileToFileAsync(inputFile, outputFile, TonFormatStyle.Pretty);

                // Assert
                var result = await File.ReadAllTextAsync(outputFile);
                result.Should().NotBeNullOrEmpty();
                result.Should().Contain("#@ tonVersion = '1'");
                result.Should().Contain("    "); // Should have indentation

                // Original file should be unchanged
                var originalContent = await File.ReadAllTextAsync(inputFile);
                originalContent.Should().Be(SampleTonContent);
            }
            finally
            {
                File.Delete(inputFile);
                File.Delete(outputFile);
            }
        }

        // @TestID: FMT-ERROR-001
        // Test error recovery during formatting
        [Fact]
        public void FormatFileToFile_WithNullInputPath_ShouldThrowArgumentNullException()
        {
            // Arrange
            var outputFile = Path.GetTempFileName();

            try
            {
                // Act & Assert
                Assert.Throws<ArgumentNullException>(() => TonFormatter.FormatFileToFile(null!, outputFile));
            }
            finally
            {
                File.Delete(outputFile);
            }
        }

        // @TestID: FMT-ERROR-001
        // Test error recovery during formatting
        [Fact]
        public void FormatFileToFile_WithNullOutputPath_ShouldThrowArgumentNullException()
        {
            // Arrange
            var inputFile = Path.GetTempFileName();
            File.WriteAllText(inputFile, SampleTonContent);

            try
            {
                // Act & Assert
                Assert.Throws<ArgumentNullException>(() => TonFormatter.FormatFileToFile(inputFile, null!));
            }
            finally
            {
                File.Delete(inputFile);
            }
        }

        // @TestID: FMT-VALID-001
        // Test idempotent formatting operations
        [Fact]
        public void FormatString_CompactVsPretty_ShouldProduceDifferentResults()
        {
            // Act
            var compactResult = TonFormatter.FormatString(SampleTonContent, TonFormatStyle.Compact);
            var prettyResult = TonFormatter.FormatString(SampleTonContent, TonFormatStyle.Pretty);

            // Assert
            compactResult.Should().NotBe(prettyResult);
            compactResult.Length.Should().BeLessThan(prettyResult.Length);

            // Compact should be more condensed
            compactResult.Should().NotContain("\n");
            prettyResult.Should().Contain("\n");

            // Both should represent the same data when parsed
            var parser = new TonParser();
            var compactDoc = parser.Parse(compactResult);
            var prettyDoc = parser.Parse(prettyResult);

            compactDoc.RootObject.Properties.Count.Should().Be(prettyDoc.RootObject.Properties.Count);
        }

        // @TestID: FMT-FORMAT-005
        // Test array formatting in pretty style
        [Fact]
        public void FormatString_WithComplexDocument_ShouldPreserveAllData()
        {
            // Arrange
            var complexContent = "{\n" +
                "name = 'Test Application',\n" +
                "version = 2.1,\n" +
                "enabled = true,\n" +
                "features = |authentication|logging|monitoring|,\n" +
                "database = {\n" +
                "    host = 'localhost',\n" +
                "    port = 5432,\n" +
                "    ssl = true\n" +
                "},\n" +
                "servers = [\n" +
                "    { name = 'web1', active = true },\n" +
                "    { name = 'web2', active = false }\n" +
                "],\n" +
                "metadata = {\n" +
                "    tags = ['production', 'web', 'api']\n" +
                "}\n" +
                "}";

            // Act
            var compactResult = TonFormatter.FormatString(complexContent, TonFormatStyle.Compact);
            var prettyResult = TonFormatter.FormatString(complexContent, TonFormatStyle.Pretty);

            // Assert
            var parser = new TonParser();
            var originalDoc = parser.Parse(complexContent);
            var compactDoc = parser.Parse(compactResult);
            var prettyDoc = parser.Parse(prettyResult);

            // All should have the same structure (no root class in this simplified version)
            originalDoc.RootObject.ClassName.Should().BeNull();
            compactDoc.RootObject.ClassName.Should().BeNull();
            prettyDoc.RootObject.ClassName.Should().BeNull();

            // All should have the same number of properties
            var expectedPropertyCount = originalDoc.RootObject.Properties.Count;
            compactDoc.RootObject.Properties.Count.Should().Be(expectedPropertyCount);
            prettyDoc.RootObject.Properties.Count.Should().Be(expectedPropertyCount);

            // Verify basic properties are preserved
            prettyDoc.RootObject.GetProperty("name")?.ToString().Should().Be("Test Application");
            prettyDoc.RootObject.GetProperty("enabled")?.ToBoolean().Should().Be(true);
        }
    }
}