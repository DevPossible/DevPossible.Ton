using Xunit;
using FluentAssertions;
using TONfile.Lexer;

namespace TONfile.Tests.Lexer
{
    public class MultiLineStringTests
    {
        [Fact]
        public void Should_Parse_Triple_Double_Quotes()
        {
            // Arrange
            var input = "\"\"\"Hello World\"\"\"";
            var lexer = new TonLexer(input);

            // Act
            var token = lexer.GetNextToken();

            // Assert
            token.Should().NotBeNull();
            token!.Type.Should().Be(TonTokenType.String);
            token.Value.Should().Be("Hello World");
        }

        [Fact]
        public void Should_Parse_Triple_Single_Quotes()
        {
            // Arrange
            var input = "'''Hello World'''";
            var lexer = new TonLexer(input);

            // Act
            var token = lexer.GetNextToken();

            // Assert
            token.Should().NotBeNull();
            token!.Type.Should().Be(TonTokenType.String);
            token.Value.Should().Be("Hello World");
        }

        [Fact]
        public void Should_Parse_Basic_Multi_Line_String()
        {
            // Arrange
            var input = @"""""""
Line 1
Line 2
Line 3
""""""";
            var lexer = new TonLexer(input);

            // Act
            var token = lexer.GetNextToken();

            // Assert
            token.Should().NotBeNull();
            token!.Type.Should().Be(TonTokenType.String);
            token.Value.Should().Be("Line 1\nLine 2\nLine 3");
        }

        [Fact]
        public void Should_Handle_Indentation_Processing()
        {
            // Arrange
            var input = @"""""""
        function greet(name) {
            console.log(`Hello, ${name}!`);
            if (name === 'World') {
                console.log('Welcome to TON!');
            }
        }
""""""";
            var lexer = new TonLexer(input);

            // Act
            var token = lexer.GetNextToken();

            // Assert
            token.Should().NotBeNull();
            token!.Type.Should().Be(TonTokenType.String);

            var expected = @"function greet(name) {
    console.log(`Hello, ${name}!`);
    if (name === 'World') {
        console.log('Welcome to TON!');
    }
}";
            token.Value.Should().Be(expected);
        }

        [Fact]
        public void Should_Preserve_Empty_Lines()
        {
            // Arrange
            var input = @"""""""
    Line 1

    Line 3

    Line 5
""""""";
            var lexer = new TonLexer(input);

            // Act
            var token = lexer.GetNextToken();

            // Assert
            token.Should().NotBeNull();
            token!.Type.Should().Be(TonTokenType.String);

            var expected = "Line 1\n\nLine 3\n\nLine 5";
            token.Value.Should().Be(expected);
        }

        [Fact]
        public void Should_Handle_Mixed_Indentation_Levels()
        {
            // Arrange
            var input = @"""""""
    API Documentation

    Overview:
        This API provides user management functionality.

        Key features:
            • User creation and management
            • Authentication and authorization

    Usage:
        POST /api/users
        GET /api/users/{id}
""""""";
            var lexer = new TonLexer(input);

            // Act
            var token = lexer.GetNextToken();

            // Assert
            token.Should().NotBeNull();
            token!.Type.Should().Be(TonTokenType.String);

            var expected = @"API Documentation

Overview:
    This API provides user management functionality.

    Key features:
        • User creation and management
        • Authentication and authorization

Usage:
    POST /api/users
    GET /api/users/{id}";
            token.Value.Should().Be(expected);
        }

        [Fact]
        public void Should_Handle_Escape_Sequences_In_Multi_Line()
        {
            // Arrange
            var input = "\"\"\"\nLine 1\nLine 2 with \\t explicit tab\nLine 3 with \\\"escaped quotes\\\"\nLine 4 with \\\\ backslash\nUnicode: \\u0041\\u0042\\u0043\n\"\"\"";
            var lexer = new TonLexer(input);

            // Act
            var token = lexer.GetNextToken();

            // Assert
            token.Should().NotBeNull();
            token!.Type.Should().Be(TonTokenType.String);

            var expected = "Line 1\nLine 2 with \t explicit tab\nLine 3 with \"escaped quotes\"\nLine 4 with \\ backslash\nUnicode: ABC";
            token.Value.Should().Be(expected);
        }

        [Fact]
        public void Should_Handle_Inline_Multi_Line_String()
        {
            // Arrange
            var input = "\"\"\"This is all on one line\"\"\"";
            var lexer = new TonLexer(input);

            // Act
            var token = lexer.GetNextToken();

            // Assert
            token.Should().NotBeNull();
            token!.Type.Should().Be(TonTokenType.String);
            token.Value.Should().Be("This is all on one line");
        }

        [Fact]
        public void Should_Handle_Content_Starting_On_Opening_Line()
        {
            // Arrange
            var input = "\"\"\"This starts here\nand continues here\n\"\"\"";
            var lexer = new TonLexer(input);

            // Act
            var token = lexer.GetNextToken();

            // Assert
            token.Should().NotBeNull();
            token!.Type.Should().Be(TonTokenType.String);
            token.Value.Should().Be("This starts here\nand continues here");
        }

        [Fact]
        public void Should_Handle_Content_Ending_On_Closing_Line()
        {
            // Arrange
            var input = "\"\"\"\nThis starts on a new line\nand ends here\"\"\"";
            var lexer = new TonLexer(input);

            // Act
            var token = lexer.GetNextToken();

            // Assert
            token.Should().NotBeNull();
            token!.Type.Should().Be(TonTokenType.String);
            token.Value.Should().Be("This starts on a new line\nand ends here");
        }

        [Fact]
        public void Should_Distinguish_Between_Single_And_Triple_Quotes()
        {
            // Arrange
            var input = "'single' \"\"\"triple\"\"\"";
            var lexer = new TonLexer(input);

            // Act
            var token1 = lexer.GetNextToken();
            var token2 = lexer.GetNextToken();

            // Assert
            token1.Should().NotBeNull();
            token1!.Type.Should().Be(TonTokenType.String);
            token1.Value.Should().Be("single");

            token2.Should().NotBeNull();
            token2!.Type.Should().Be(TonTokenType.String);
            token2.Value.Should().Be("triple");
        }

        [Fact]
        public void Should_Handle_Empty_Multi_Line_String()
        {
            // Arrange
            var input = "\"\"\"\"\"\"";
            var lexer = new TonLexer(input);

            // Act
            var token = lexer.GetNextToken();

            // Assert
            token.Should().NotBeNull();
            token!.Type.Should().Be(TonTokenType.String);
            token.Value.Should().Be("");
        }

        [Fact]
        public void Should_Serialize_Multi_Line_String()
        {
            // Arrange
            var obj = new TonObject();
            var multiLineText = "Line 1\nLine 2\nLine 3";
            obj.SetProperty("description", TonValue.From(multiLineText));

            var options = new TonSerializeOptions
            {
                UseMultiLineStrings = true,
                MultiLineStringThreshold = 2,
                Indentation = "    ",
                QuoteChar = '"'
            };

            var serializer = new TonSerializer();

            // Act
            var result = serializer.Serialize(obj, options);

            // Assert
            result.Should().Contain("\"\"\"");
            result.Should().Contain("Line 1");
            result.Should().Contain("Line 2");
            result.Should().Contain("Line 3");
        }

        [Fact]
        public void Should_Serialize_Single_Line_String_When_Below_Threshold()
        {
            // Arrange
            var obj = new TonObject();
            var singleLineText = "Just one line";
            obj.SetProperty("description", TonValue.From(singleLineText));

            var options = new TonSerializeOptions
            {
                UseMultiLineStrings = true,
                MultiLineStringThreshold = 2,
                Indentation = null
            };

            var serializer = new TonSerializer();

            // Act
            var result = serializer.Serialize(obj, options);

            // Assert
            result.Should().Contain("'Just one line'");
            result.Should().NotContain("'''");
        }

        [Fact]
        public void Should_Disable_Multi_Line_Strings_When_Option_False()
        {
            // Arrange
            var obj = new TonObject();
            var multiLineText = "Line 1\nLine 2\nLine 3";
            obj.SetProperty("description", TonValue.From(multiLineText));

            var options = new TonSerializeOptions
            {
                UseMultiLineStrings = false,
                Indentation = null
            };

            var serializer = new TonSerializer();

            // Act
            var result = serializer.Serialize(obj, options);

            // Assert
            result.Should().Contain("'Line 1\\nLine 2\\nLine 3'");
            result.Should().NotContain("'''");
        }
    }
}