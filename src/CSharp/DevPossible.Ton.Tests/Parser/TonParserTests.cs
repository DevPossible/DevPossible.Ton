using Xunit;
using FluentAssertions;
using TONfile;
using System;
using System.Linq;

namespace TONfile.Tests.Parser
{
    public class TonParserTests
    {
        private readonly TonParser _parser = new TonParser();

        [Fact]
        public void Should_Parse_Empty_Object()
        {
            // Arrange
            var input = "{ }";

            // Act
            var document = _parser.Parse(input);

            // Assert
            document.Should().NotBeNull();
            document.RootObject.Should().NotBeNull();
            document.RootObject.Properties.Should().BeEmpty();
            document.RootObject.Children.Should().BeEmpty();
        }

        [Fact]
        public void Should_Parse_Object_With_Class()
        {
            // Arrange
            var input = "{(person)}";

            // Act
            var document = _parser.Parse(input);

            // Assert
            document.RootObject.ClassName.Should().Be("person");
        }

        [Fact]
        public void Should_Parse_Simple_Properties()
        {
            // Arrange
            var input = @"{
                name = 'John Doe',
                age = 30,
                active = true
            }";

            // Act
            var document = _parser.Parse(input);

            // Assert
            document.RootObject.GetProperty("name")?.ToString().Should().Be("John Doe");
            document.RootObject.GetProperty("age")?.ToInt32().Should().Be(30);
            document.RootObject.GetProperty("active")?.ToBoolean().Should().BeTrue();
        }

        [Fact]
        public void Should_Parse_Properties_With_At_Prefix()
        {
            // Arrange
            var input = "{@name = 'John', @age = 30}";

            // Act
            var document = _parser.Parse(input);

            // Assert
            document.RootObject.GetProperty("@name")?.ToString().Should().Be("John");
            document.RootObject.GetProperty("name")?.ToString().Should().Be("John"); // Should work without @ too
            document.RootObject.GetProperty("@age")?.ToInt32().Should().Be(30);
        }

        [Fact]
        public void Should_Parse_Quoted_Property_Names()
        {
            // Arrange
            var input = @"{
                'first name' = 'John',
                ""last-name"" = 'Doe',
                'user@id' = 123
            }";

            // Act
            var document = _parser.Parse(input);

            // Assert
            document.RootObject.GetProperty("first name")?.ToString().Should().Be("John");
            document.RootObject.GetProperty("last-name")?.ToString().Should().Be("Doe");
            document.RootObject.GetProperty("user@id")?.ToInt32().Should().Be(123);
        }

        [Theory]
        [InlineData("null")]
        [InlineData("undefined")]
        public void Should_Parse_Null_And_Undefined(string input)
        {
            // Arrange
            var tonInput = $"{{value = {input}}}";

            // Act
            var document = _parser.Parse(tonInput);

            // Assert
            var value = document.RootObject.GetProperty("value");
            if (input == "null")
            {
                value?.IsNull.Should().BeTrue();
            }
            else
            {
                value?.IsUndefined.Should().BeTrue();
            }
        }

        [Theory]
        [InlineData("0xFF", 255)]
        [InlineData("0x00", 0)]
        [InlineData("0x1A2B", 6699)]
        public void Should_Parse_Hexadecimal_Numbers(string hexValue, int expectedDecimal)
        {
            // Arrange
            var input = $"{{value = {hexValue}}}";

            // Act
            var document = _parser.Parse(input);

            // Assert
            document.RootObject.GetProperty("value")?.ToInt32().Should().Be(expectedDecimal);
        }

        [Theory]
        [InlineData("0b1010", 10)]
        [InlineData("0b0", 0)]
        [InlineData("0b11111111", 255)]
        public void Should_Parse_Binary_Numbers(string binValue, int expectedDecimal)
        {
            // Arrange
            var input = $"{{value = {binValue}}}";

            // Act
            var document = _parser.Parse(input);

            // Assert
            document.RootObject.GetProperty("value")?.ToInt32().Should().Be(expectedDecimal);
        }

        [Fact]
        public void Should_Parse_GUIDs()
        {
            // Arrange
            var guidValue = "550e8400-e29b-41d4-a716-446655440000";
            var input = $"{{id = {guidValue}}}";

            // Act
            var document = _parser.Parse(input);

            // Assert
            var value = document.RootObject.GetProperty("id");
            value?.Type.Should().Be(TonValueType.Guid);
            value?.ToGuid().Should().Be(Guid.Parse(guidValue));
        }

        [Fact]
        public void Should_Parse_Single_Enum()
        {
            // Arrange
            var input = "{status = |active|}";

            // Act
            var document = _parser.Parse(input);

            // Assert
            var value = document.RootObject.GetProperty("status");
            value?.Type.Should().Be(TonValueType.Enum);
            var enumValue = value?.Value as TonEnum;
            enumValue?.Value.Should().Be("active");
        }

        [Fact]
        public void Should_Parse_EnumSet()
        {
            // Arrange
            var input = "{permissions = |read|write|admin|}";

            // Act
            var document = _parser.Parse(input);

            // Assert
            var value = document.RootObject.GetProperty("permissions");
            value?.Type.Should().Be(TonValueType.EnumSet);
            var enumSet = value?.Value as TonEnumSet;
            enumSet?.Values.Should().HaveCount(3);
            enumSet?.GetNames().Should().Contain(new[] { "read", "write", "admin" });
        }

        [Fact]
        public void Should_Parse_Nested_Objects()
        {
            // Arrange
            var input = @"{
                name = 'John',
                {(address)
                    street = '123 Main St',
                    city = 'New York'
                }
            }";

            // Act
            var document = _parser.Parse(input);

            // Assert
            document.RootObject.Children.Should().HaveCount(1);
            var address = document.RootObject.Children.First();
            address.ClassName.Should().Be("address");
            address.GetProperty("street")?.ToString().Should().Be("123 Main St");
            address.GetProperty("city")?.ToString().Should().Be("New York");
        }

        [Fact]
        public void Should_Parse_Document_Header()
        {
            // Arrange
            var input = @"
#@ tonVersion = '1', @schemaFile = 'schema.ton'

{
    name = 'test'
}";

            // Act
            var document = _parser.Parse(input);

            // Assert
            document.Header.Should().NotBeNull();
            document.Header!.TonVersion.Should().Be("1");
            document.Header.SchemaFile.Should().Be("schema.ton");
        }

        [Fact]
        public void Should_Parse_Embedded_Schema()
        {
            // Arrange
            var input = @"
{
    name = 'test'
}

#! enum(status) [active, inactive, pending]
#! {(test)
    /name = string(required)
}";

            // Act
            var document = _parser.Parse(input);

            // Assert
            document.Schemas.Should().NotBeNull();
            document.Schemas!.Enums.Should().HaveCount(1);
            var enumDef = document.Schemas.Enums.First();
            enumDef.Name.Should().Be("status");
            enumDef.Values.Should().Contain(new[] { "active", "inactive", "pending" });
        }

        [Fact]
        public void Should_Enforce_Property_Ordering()
        {
            // Arrange
            var input = @"{
                {(child)}
                name = 'test'
            }";

            // Act & Assert
            var options = new TonParseOptions { EnforcePropertyOrdering = true };
            Action act = () => _parser.Parse(input, options);
            act.Should().Throw<TonParseException>()
                .WithMessage("*Properties must appear before child objects*");
        }

        [Fact]
        public void Should_Allow_Mixed_Property_Ordering_When_Not_Strict()
        {
            // Arrange
            var input = @"{
                {(child)}
                name = 'test'
            }";

            // Act
            var options = new TonParseOptions { EnforcePropertyOrdering = false };
            var document = _parser.Parse(input, options);

            // Assert
            document.RootObject.Children.Should().HaveCount(1);
            document.RootObject.GetProperty("name")?.ToString().Should().Be("test");
        }

        [Fact]
        public void Should_Parse_Complex_Document()
        {
            // Arrange
            var input = @"
#@ tonVersion = '1'

{(user)
    @name = $'John Doe',
    @age = %30,
    email = 'john@example.com',
    active = true,
    score = 95.5,
    userId = 550e8400-e29b-41d4-a716-446655440000,
    permissions = |read|write|,
    lastLogin = null,
    config = undefined,
    maxConnections = 0xFF,
    flags = 0b11010101,

    {(address)
        street = '123 Main St',
        city = 'New York',
        zipCode = 10001
    },

    {(phone)
        type = 'mobile',
        number = '+1-555-0123'
    }
}

#! enum(permissions) [read, write, admin, delete]
#! enumSet(features) [feature1, feature2, feature3]
";

            // Act
            var document = _parser.Parse(input);

            // Assert
            document.Header?.TonVersion.Should().Be("1");
            document.RootObject.ClassName.Should().Be("user");
            document.RootObject.GetProperty("name")?.ToString().Should().Be("John Doe");
            document.RootObject.GetProperty("age")?.ToInt32().Should().Be(30);
            document.RootObject.GetProperty("active")?.ToBoolean().Should().BeTrue();
            document.RootObject.GetProperty("score")?.ToDouble().Should().Be(95.5);
            document.RootObject.GetProperty("lastLogin")?.IsNull.Should().BeTrue();
            document.RootObject.GetProperty("config")?.IsUndefined.Should().BeTrue();
            document.RootObject.GetProperty("maxConnections")?.ToInt32().Should().Be(255);
            document.RootObject.GetProperty("flags")?.ToInt32().Should().Be(213);
            document.RootObject.Children.Should().HaveCount(2);
            document.Schemas?.Enums.Should().HaveCount(2);
        }

        [Fact]
        public void Should_Handle_Parse_Errors_With_Line_Info()
        {
            // Arrange
            var input = @"
{
    name = 'test'
    age = // missing value
}";

            // Act & Assert
            Action act = () => _parser.Parse(input);
            act.Should().Throw<TonParseException>()
                .Where(e => e.Line.HasValue && e.Column.HasValue);
        }

        [Fact]
        public void Should_Parse_String_With_Escape_Sequences()
        {
            // Arrange
            var input = @"{
                text = 'Line 1\nLine 2\tTabbed',
                quote = 'It\'s working',
                path = 'C:\\Users\\Test'
            }";

            // Act
            var document = _parser.Parse(input);

            // Assert
            document.RootObject.GetProperty("text")?.ToString().Should().Be("Line 1\nLine 2\tTabbed");
            document.RootObject.GetProperty("quote")?.ToString().Should().Be("It's working");
            document.RootObject.GetProperty("path")?.ToString().Should().Be("C:\\Users\\Test");
        }

        [Fact]
        public void Should_Support_Path_Navigation()
        {
            // Arrange
            var input = @"{
                user = 'John',
                {(settings)
                    {(display)
                        theme = 'dark',
                        fontSize = 14
                    }
                }
            }";

            // Act
            var document = _parser.Parse(input);

            // Assert
            document.GetValue("/user").Should().Be("John");
            document.GetValue("/settings/display/theme").Should().Be("dark");
            document.GetValue("/settings/display/fontSize").Should().Be(14L);
        }

        [Fact]
        public void Should_Respect_Max_Nesting_Depth()
        {
            // Arrange
            var deeplyNested = string.Join("", Enumerable.Repeat("{", 10)) +
                               string.Join("", Enumerable.Repeat("}", 10));

            // Act & Assert
            var options = new TonParseOptions { MaxNestingDepth = 5 };
            Action act = () => _parser.Parse(deeplyNested, options);
            act.Should().Throw<TonParseException>()
                .WithMessage("*Maximum nesting depth*exceeded*");
        }
    }
}