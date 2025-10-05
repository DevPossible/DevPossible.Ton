using Xunit;
using FluentAssertions;
using DevPossible.Ton;

namespace DevPossible.Ton.Tests.Integration
{
    public class MultiLineStringIntegrationTests
    {
        // @TestID: MLS-VALID-001
        // Test round-trip preservation of multi-line string content
        [Fact]
        public void Should_Round_Trip_Multi_Line_Strings()
        {
            // Arrange
            var parser = new TonParser();
            var serializer = new TonSerializer();

            var originalContent = @"{
                description = """"""
                This is a multi-line description
                with proper indentation handling
                and multiple lines of text.
                """"""
            }";

            // Act - Parse the multi-line string
            var document = parser.Parse(originalContent);
            var description = document.RootObject.GetProperty("description")?.ToString();

            // Serialize it back
            var options = new TonSerializeOptions
            {
                UseMultiLineStrings = true,
                QuoteChar = '"',
                Indentation = "    "
            };
            var serializedContent = serializer.SerializeDocument(document, options);

            // Parse again to verify round-trip
            var document2 = parser.Parse(serializedContent);
            var description2 = document2.RootObject.GetProperty("description")?.ToString();

            // Assert
            description.Should().Be("This is a multi-line description\nwith proper indentation handling\nand multiple lines of text.");
            description2.Should().Be(description);
            serializedContent.Should().Contain("\"\"\"");
        }

        // @TestID: MLS-COMPLEX-001
        // Test common indentation removal in multi-line strings
        [Fact]
        public void Should_Handle_Complex_Multi_Line_Document()
        {
            // Arrange
            var parser = new TonParser();
            var serializer = new TonSerializer();

            var originalContent = @"{(configuration)
                sqlQuery = """"""
                SELECT u.name, u.email, p.bio
                FROM users u
                LEFT JOIN profiles p ON u.id = p.user_id
                WHERE u.active = true
                ORDER BY u.last_login DESC
                """""",

                jsCode = '''
                function processData(data) {
                    return data.map(item => ({
                        id: item.id,
                        name: item.name.toUpperCase(),
                        email: item.email.toLowerCase()
                    }));
                }
                ''',

                description = """"""
                This configuration file demonstrates:
                - Multi-line SQL queries
                - JavaScript code embedding
                - Proper indentation handling
                """"""
            }";

            // Act
            var document = parser.Parse(originalContent);
            var options = new TonSerializeOptions
            {
                UseMultiLineStrings = true,
                Indentation = "    ",
                SortProperties = true
            };
            var serializedContent = serializer.SerializeDocument(document, options);
            var document2 = parser.Parse(serializedContent);

            // Assert
            document.RootObject.ClassName.Should().Be("configuration");
            document.RootObject.Properties.Should().HaveCount(3);

            var sqlQuery = document.RootObject.GetProperty("sqlQuery")?.ToString();
            sqlQuery.Should().Contain("SELECT u.name, u.email, p.bio");
            sqlQuery.Should().Contain("FROM users u");

            var jsCode = document.RootObject.GetProperty("jsCode")?.ToString();
            jsCode.Should().Contain("function processData(data)");
            jsCode.Should().Contain("toUpperCase()");

            // Verify round-trip integrity
            document2.RootObject.GetProperty("sqlQuery")?.ToString().Should().Be(sqlQuery);
            document2.RootObject.GetProperty("jsCode")?.ToString().Should().Be(jsCode);
        }

        // @TestID: MLS-BASIC-005
        // Test inline multi-line string on one line
        [Fact]
        public void Should_Handle_Mixed_String_Types()
        {
            // Arrange
            var parser = new TonParser();
            var serializer = new TonSerializer();

            var originalContent = "{\n    singleLine = 'Just a simple string',\n    multiLine = \"\"\"\nLine 1\nLine 2\nLine 3\n\"\"\",\n    escaped = 'String with\\nnewlines\\tand\\ttabs',\n    empty = '',\n    emptyMultiLine = \"\"\"\"\"\"\n}";

            // Act
            var document = parser.Parse(originalContent);
            var options = new TonSerializeOptions
            {
                UseMultiLineStrings = true,
                QuoteChar = '"',
                Indentation = "  "
            };
            var serializedContent = serializer.SerializeDocument(document, options);
            var document2 = parser.Parse(serializedContent);

            // Assert
            document.RootObject.GetProperty("singleLine")?.ToString().Should().Be("Just a simple string");
            document.RootObject.GetProperty("multiLine")?.ToString().Should().Be("Line 1\nLine 2\nLine 3");
            document.RootObject.GetProperty("escaped")?.ToString().Should().Be("String with\nnewlines\tand\ttabs");
            document.RootObject.GetProperty("empty")?.ToString().Should().Be("");
            document.RootObject.GetProperty("emptyMultiLine")?.ToString().Should().Be("");

            // Verify all values survived round-trip
            document2.RootObject.GetProperty("singleLine")?.ToString().Should().Be("Just a simple string");
            document2.RootObject.GetProperty("multiLine")?.ToString().Should().Be("Line 1\nLine 2\nLine 3");
            document2.RootObject.GetProperty("escaped")?.ToString().Should().Be("String with\nnewlines\tand\ttabs");
            document2.RootObject.GetProperty("empty")?.ToString().Should().Be("");
            document2.RootObject.GetProperty("emptyMultiLine")?.ToString().Should().Be("");
        }

        // @TestID: MLS-COMPLEX-002
        // Test preservation of mixed indentation levels
        [Fact]
        public void Should_Handle_Indentation_Edge_Cases()
        {
            // Arrange
            var parser = new TonParser();

            var contentWithMixedIndentation = @"{
                code = """"""
                    if (condition) {
                        // 4-space indent
                        doSomething();

                        if (nested) {
                            // 8-space indent
                            doNestedThing();
                        }
                    }
                """"""
            }";

            // Act
            var document = parser.Parse(contentWithMixedIndentation);
            var code = document.RootObject.GetProperty("code")?.ToString();

            // Assert
            var expectedCode = "if (condition) {\n    // 4-space indent\n    doSomething();\n\n    if (nested) {\n        // 8-space indent\n        doNestedThing();\n    }\n}";
            code.Should().Be(expectedCode);
        }

        // @TestID: MLS-EDGE-001
        // Test content starting immediately after opening quotes
        [Fact]
        public void Should_Preserve_Content_Boundaries()
        {
            // Arrange
            var parser = new TonParser();

            // Test content starting on opening line
            var content1 = @"{value = """"""Content starts here
and continues here""""""}";

            // Test content ending on closing line
            var content2 = @"{value = """"""
Content starts on new line
and ends here""""""}";

            // Test inline content
            var content3 = @"{value = """"""Single line content""""""}";

            // Act & Assert
            var doc1 = parser.Parse(content1);
            doc1.RootObject.GetProperty("value")?.ToString().Should().Be("Content starts here\nand continues here");

            var doc2 = parser.Parse(content2);
            doc2.RootObject.GetProperty("value")?.ToString().Should().Be("Content starts on new line\nand ends here");

            var doc3 = parser.Parse(content3);
            doc3.RootObject.GetProperty("value")?.ToString().Should().Be("Single line content");
        }
    }
}