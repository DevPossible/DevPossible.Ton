using Xunit;
using FluentAssertions;
using DevPossible.Ton.Lexer;
using System.Linq;

namespace DevPossible.Ton.Tests.Lexer
{
    public class TonLexerTests
    {
        // @TestID: LEX-BASIC-001
        // Test tokenization of basic brace structure
        [Fact]
        public void Should_Tokenize_Basic_Structure()
        {
            // Arrange
            var input = "{ }";
            var lexer = new TonLexer(input);

            // Act
            var tokens = lexer.GetAllTokens();

            // Assert
            tokens.Should().HaveCount(2);
            tokens[0].Type.Should().Be(TonTokenType.LeftBrace);
            tokens[1].Type.Should().Be(TonTokenType.RightBrace);
        }

        // @TestID: LEX-BASIC-002
        // Test tokenization of object with class name in parentheses
        [Fact]
        public void Should_Tokenize_Object_With_Class()
        {
            // Arrange
            var input = "{(person)}";
            var lexer = new TonLexer(input);

            // Act
            var tokens = lexer.GetAllTokens();

            // Assert
            tokens.Should().HaveCount(5);
            tokens[0].Type.Should().Be(TonTokenType.LeftBrace);
            tokens[1].Type.Should().Be(TonTokenType.LeftParen);
            tokens[2].Type.Should().Be(TonTokenType.Identifier);
            tokens[2].Value.Should().Be("person");
            tokens[3].Type.Should().Be(TonTokenType.RightParen);
            tokens[4].Type.Should().Be(TonTokenType.RightBrace);
        }

        // @TestID: LEX-BASIC-003
        // Test tokenization of property assignments
        [Fact]
        public void Should_Tokenize_Properties()
        {
            // Arrange
            var input = "name = 'John', age = 30";
            var lexer = new TonLexer(input);

            // Act
            var tokens = lexer.GetAllTokens();

            // Assert
            tokens.Should().Contain(t => t.Type == TonTokenType.Identifier && t.Value == "name");
            tokens.Should().Contain(t => t.Type == TonTokenType.Equals);
            tokens.Should().Contain(t => t.Type == TonTokenType.String && t.Value == "John");
            tokens.Should().Contain(t => t.Type == TonTokenType.Comma);
            tokens.Should().Contain(t => t.Type == TonTokenType.Identifier && t.Value == "age");
            tokens.Should().Contain(t => t.Type == TonTokenType.Number && t.Value == "30");
        }

        // @TestID: LEX-BASIC-004
        // Test tokenization of single-quoted strings
        [Fact]
        public void Should_Tokenize_Strings_With_Single_Quotes()
        {
            // Arrange
            var input = "'Hello World'";
            var lexer = new TonLexer(input);

            // Act
            var token = lexer.GetNextToken();

            // Assert
            token.Should().NotBeNull();
            token!.Type.Should().Be(TonTokenType.String);
            token.Value.Should().Be("Hello World");
        }

        // @TestID: LEX-BASIC-005
        // Test tokenization of double-quoted strings
        [Fact]
        public void Should_Tokenize_Strings_With_Double_Quotes()
        {
            // Arrange
            var input = "\"Hello World\"";
            var lexer = new TonLexer(input);

            // Act
            var token = lexer.GetNextToken();

            // Assert
            token.Should().NotBeNull();
            token!.Type.Should().Be(TonTokenType.String);
            token.Value.Should().Be("Hello World");
        }

        // @TestID: LEX-COMPLEX-001
        // Test handling of escape sequences in strings
        [Fact]
        public void Should_Handle_Escape_Sequences()
        {
            // Arrange
            var input = @"'Line 1\nLine 2\t\''";
            var lexer = new TonLexer(input);

            // Act
            var token = lexer.GetNextToken();

            // Assert
            token.Should().NotBeNull();
            token!.Type.Should().Be(TonTokenType.String);
            token.Value.Should().Be("Line 1\nLine 2\t'");
        }

        // @TestID: LEX-BASIC-006
        // Test tokenization of various number formats
        [Theory]
        [InlineData("123", "123")]
        [InlineData("-456", "-456")]
        [InlineData("3.14", "3.14")]
        [InlineData("-2.5", "-2.5")]
        [InlineData("1.23e10", "1.23e10")]
        [InlineData("5E-3", "5E-3")]
        public void Should_Tokenize_Decimal_Numbers(string input, string expected)
        {
            // Arrange
            var lexer = new TonLexer(input);

            // Act
            var token = lexer.GetNextToken();

            // Assert
            token.Should().NotBeNull();
            token!.Type.Should().Be(TonTokenType.Number);
            token.Value.Should().Be(expected);
        }

        // @TestID: LEX-BASIC-007
        // Test tokenization of hexadecimal numbers
        [Theory]
        [InlineData("0xFF", "0xFF")]
        [InlineData("0x1A2B", "0x1A2B")]
        [InlineData("0xdeadbeef", "0xdeadbeef")]
        [InlineData("0X00", "0X00")]
        public void Should_Tokenize_Hexadecimal_Numbers(string input, string expected)
        {
            // Arrange
            var lexer = new TonLexer(input);

            // Act
            var token = lexer.GetNextToken();

            // Assert
            token.Should().NotBeNull();
            token!.Type.Should().Be(TonTokenType.Number);
            token.Value.Should().Be(expected);
        }

        // @TestID: LEX-BASIC-008
        // Test tokenization of binary numbers
        [Theory]
        [InlineData("0b1010", "0b1010")]
        [InlineData("0B11110000", "0B11110000")]
        [InlineData("0b0", "0b0")]
        [InlineData("0b1", "0b1")]
        public void Should_Tokenize_Binary_Numbers(string input, string expected)
        {
            // Arrange
            var lexer = new TonLexer(input);

            // Act
            var token = lexer.GetNextToken();

            // Assert
            token.Should().NotBeNull();
            token!.Type.Should().Be(TonTokenType.Number);
            token.Value.Should().Be(expected);
        }

        // @TestID: LEX-BASIC-009
        // Test tokenization of boolean values
        [Theory]
        [InlineData("true", TonTokenType.Boolean)]
        [InlineData("false", TonTokenType.Boolean)]
        [InlineData("null", TonTokenType.Null)]
        [InlineData("undefined", TonTokenType.Undefined)]
        public void Should_Tokenize_Keywords(string input, TonTokenType expectedType)
        {
            // Arrange
            var lexer = new TonLexer(input);

            // Act
            var token = lexer.GetNextToken();

            // Assert
            token.Should().NotBeNull();
            token!.Type.Should().Be(expectedType);
            token.Value.Should().Be(input);
        }

        // @TestID: LEX-BASIC-014
        // Test tokenization of GUID with braces
        [Theory]
        [InlineData("550e8400-e29b-41d4-a716-446655440000")]
        [InlineData("{550e8400-e29b-41d4-a716-446655440000}")]
        public void Should_Tokenize_GUIDs(string input)
        {
            // Arrange
            var lexer = new TonLexer(input);

            // Act
            var token = lexer.GetNextToken();

            // Assert
            token.Should().NotBeNull();
            token!.Type.Should().Be(TonTokenType.Guid);
            token.Value.Should().Be(input);
        }

        // @TestID: LEX-BASIC-012
        // Test tokenization of single enum value
        [Theory]
        [InlineData("|active|", "|active|")]
        [InlineData("|0|", "|0|")]
        [InlineData("|read|write|", "|read|write|")]
        [InlineData("|0|2|4|", "|0|2|4|")]
        public void Should_Tokenize_Enums(string input, string expected)
        {
            // Arrange
            var lexer = new TonLexer(input);

            // Act
            var token = lexer.GetNextToken();

            // Assert
            token.Should().NotBeNull();
            token!.Type.Should().Be(TonTokenType.Enum);
            token.Value.Should().Be(expected);
        }

        // @TestID: LEX-BASIC-020
        // Test tokenization of properties with @ prefix
        [Fact]
        public void Should_Tokenize_At_Prefixed_Properties()
        {
            // Arrange
            var input = "@name = 'value'";
            var lexer = new TonLexer(input);

            // Act
            var tokens = lexer.GetAllTokens();

            // Assert
            tokens[0].Type.Should().Be(TonTokenType.AtSign);
            tokens[1].Type.Should().Be(TonTokenType.Identifier);
            tokens[1].Value.Should().Be("name");
            tokens[2].Type.Should().Be(TonTokenType.Equals);
            tokens[3].Type.Should().Be(TonTokenType.String);
        }

        // @TestID: LEX-COMPLEX-002
        // Test tokenization of values with type hints
        [Theory]
        [InlineData("$", TonTokenType.StringHint)]
        [InlineData("%", TonTokenType.NumberHint)]
        [InlineData("&", TonTokenType.GuidHint)]
        public void Should_Tokenize_Type_Hints(string input, TonTokenType expectedType)
        {
            // Arrange
            var lexer = new TonLexer(input);

            // Act
            var token = lexer.GetNextToken();

            // Assert
            token.Should().NotBeNull();
            token!.Type.Should().Be(expectedType);
        }

        // @TestID: LEX-BASIC-019
        // Test tracking of token line and column positions
        [Fact]
        public void Should_Tokenize_Header_Prefix()
        {
            // Arrange
            var input = "#@ tonVersion = '1'";
            var lexer = new TonLexer(input);

            // Act
            var tokens = lexer.GetAllTokens();

            // Assert
            tokens[0].Type.Should().Be(TonTokenType.HeaderPrefix);
            tokens[1].Type.Should().Be(TonTokenType.Identifier);
            tokens[1].Value.Should().Be("tonVersion");
        }

        // @TestID: LEX-BASIC-019
        // Test tracking of token line and column positions
        [Fact]
        public void Should_Tokenize_Schema_Prefix()
        {
            // Arrange
            var input = "#! {(className)}";
            var lexer = new TonLexer(input);

            // Act
            var tokens = lexer.GetAllTokens();

            // Assert
            tokens[0].Type.Should().Be(TonTokenType.SchemaPrefix);
            tokens[1].Type.Should().Be(TonTokenType.LeftBrace);
        }

        // @TestID: LEX-BASIC-017
        // Test skipping single-line comments during tokenization
        [Fact]
        public void Should_Skip_Single_Line_Comments()
        {
            // Arrange
            var input = @"// This is a comment
name = 'value'";
            var lexer = new TonLexer(input);

            // Act
            var tokens = lexer.GetAllTokens();

            // Assert
            tokens.Should().NotContain(t => t.Value.Contains("comment"));
            tokens[0].Type.Should().Be(TonTokenType.Identifier);
            tokens[0].Value.Should().Be("name");
        }

        // @TestID: LEX-BASIC-018
        // Test skipping multi-line comments during tokenization
        [Fact]
        public void Should_Skip_Multi_Line_Comments()
        {
            // Arrange
            var input = @"/* This is a
multi-line comment */
name = 'value'";
            var lexer = new TonLexer(input);

            // Act
            var tokens = lexer.GetAllTokens();

            // Assert
            tokens.Should().NotContain(t => t.Value.Contains("comment"));
            tokens[0].Type.Should().Be(TonTokenType.Identifier);
            tokens[0].Value.Should().Be("name");
        }

        // @TestID: LEX-BASIC-019
        // Test tracking of token line and column positions
        [Fact]
        public void Should_Track_Line_And_Column_Numbers()
        {
            // Arrange
            var input = "name = 'value'\nage = 30";
            var lexer = new TonLexer(input);

            // Act
            var tokens = lexer.GetAllTokens();

            // Assert
            var nameToken = tokens.First(t => t.Value == "name");
            nameToken.Line.Should().Be(1);
            nameToken.Column.Should().Be(1);

            var ageToken = tokens.First(t => t.Value == "age");
            ageToken.Line.Should().Be(2);
            ageToken.Column.Should().Be(1);
        }

        // @TestID: LEX-COMPLEX-003
        // Test tokenization of triple-quoted multi-line strings
        [Fact]
        public void Should_Handle_Complex_Document()
        {
            // Arrange
            var input = @"
#@ tonVersion = '1'

{(person)
    @name = $'John Doe',
    age = %30,
    active = true,
    score = 95.5,
    id = &550e8400-e29b-41d4-a716-446655440000,
    permissions = |read|write|,
    hexValue = 0xFF,
    binValue = 0b1010,

    {(address)
        street = '123 Main St'
    }
}

#! enum(status) [active, inactive]
";
            var lexer = new TonLexer(input);

            // Act
            var tokens = lexer.GetAllTokens();

            // Assert
            tokens.Should().Contain(t => t.Type == TonTokenType.HeaderPrefix);
            tokens.Should().Contain(t => t.Type == TonTokenType.AtSign);
            tokens.Should().Contain(t => t.Type == TonTokenType.StringHint);
            tokens.Should().Contain(t => t.Type == TonTokenType.NumberHint);
            tokens.Should().Contain(t => t.Type == TonTokenType.GuidHint);
            tokens.Should().Contain(t => t.Type == TonTokenType.Enum);
            tokens.Should().Contain(t => t.Type == TonTokenType.SchemaPrefix);
            tokens.Should().Contain(t => t.Type == TonTokenType.EnumKeyword);
        }
    }
}