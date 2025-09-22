using Xunit;
using FluentAssertions;
using TONfile;
using System;
using System.Linq;

namespace TONfile.Tests.EdgeCases
{
    public class EdgeCaseTests
    {
        private readonly TonParser _parser = new TonParser();
        private readonly TonSerializer _serializer = new TonSerializer();

        [Fact]
        public void Should_Handle_Empty_Input()
        {
            // Arrange & Act & Assert
            Action act = () => _parser.Parse("");
            act.Should().Throw<ArgumentException>()
                .WithMessage("*cannot be empty*");
        }

        [Fact]
        public void Should_Handle_Whitespace_Only_Input()
        {
            // Arrange & Act & Assert
            Action act = () => _parser.Parse("   \n\t  ");
            act.Should().Throw<ArgumentException>()
                .WithMessage("*cannot be empty*");
        }

        [Fact]
        public void Should_Handle_Missing_Root_Braces()
        {
            // Arrange
            var input = "name = 'test'";

            // Act & Assert
            Action act = () => _parser.Parse(input);
            act.Should().Throw<TonParseException>()
                .WithMessage("*Expected*{*");
        }

        [Fact]
        public void Should_Handle_Unclosed_Brace()
        {
            // Arrange
            var input = "{ name = 'test'";

            // Act & Assert
            Action act = () => _parser.Parse(input);
            act.Should().Throw<TonParseException>();
        }

        [Fact]
        public void Should_Handle_Mismatched_Quotes()
        {
            // Arrange
            var input = "{ name = 'test\" }"; // Single quote start, double quote end

            // Act & Assert
            Action act = () => _parser.Parse(input);
            act.Should().Throw<TonParseException>();
        }

        [Fact]
        public void Should_Handle_Special_Characters_In_Property_Names()
        {
            // Arrange
            var input = @"{
                '!@#$%^&*()' = 'special',
                'with spaces' = 'value',
                'with-dash' = 123,
                'with.dot' = true,
                '123start' = 'number start',
                '中文' = 'unicode'
            }";

            // Act
            var document = _parser.Parse(input);

            // Assert
            document.RootObject.GetProperty("!@#$%^&*()")?.ToString().Should().Be("special");
            document.RootObject.GetProperty("with spaces")?.ToString().Should().Be("value");
            document.RootObject.GetProperty("with-dash")?.ToInt32().Should().Be(123);
            document.RootObject.GetProperty("with.dot")?.ToBoolean().Should().BeTrue();
            document.RootObject.GetProperty("123start")?.ToString().Should().Be("number start");
            document.RootObject.GetProperty("中文")?.ToString().Should().Be("unicode");
        }

        [Fact]
        public void Should_Handle_Unicode_In_Strings()
        {
            // Arrange
            var input = @"{
                text = '你好世界 🌍 مرحبا بالعالم',
                emoji = '😀😃😄😁',
                escaped = '\u0048\u0065\u006C\u006C\u006F'
            }";

            // Act
            var document = _parser.Parse(input);

            // Assert
            document.RootObject.GetProperty("text")?.ToString().Should().Be("你好世界 🌍 مرحبا بالعالم");
            document.RootObject.GetProperty("emoji")?.ToString().Should().Be("😀😃😄😁");
            document.RootObject.GetProperty("escaped")?.ToString().Should().Be("Hello");
        }

        [Fact]
        public void Should_Handle_Very_Long_Strings()
        {
            // Arrange
            var longString = new string('A', 10000);
            var input = $"{{ text = '{longString}' }}";

            // Act
            var document = _parser.Parse(input);

            // Assert
            document.RootObject.GetProperty("text")?.ToString().Should().Be(longString);
        }

        [Fact]
        public void Should_Handle_Extreme_Number_Values()
        {
            // Arrange
            var input = @"{
                maxInt = 2147483647,
                minInt = -2147483648,
                maxLong = 9223372036854775807,
                minLong = -9223372036854775808,
                verySmall = 0.000000001,
                veryLarge = 1.7976931348623157E+308,
                hex32bit = 0xFFFFFFFF,
                binary32bit = 0b11111111111111111111111111111111
            }";

            // Act
            var document = _parser.Parse(input);

            // Assert
            document.RootObject.GetProperty("maxInt")?.ToInt32().Should().Be(int.MaxValue);
            document.RootObject.GetProperty("minInt")?.ToInt32().Should().Be(int.MinValue);
            document.RootObject.GetProperty("maxLong")?.ToInt64().Should().Be(long.MaxValue);
            document.RootObject.GetProperty("minLong")?.ToInt64().Should().Be(long.MinValue);
            document.RootObject.GetProperty("verySmall")?.ToDouble().Should().BeApproximately(0.000000001, 1e-10);
            document.RootObject.GetProperty("hex32bit")?.ToInt64().Should().Be(4294967295L);
        }

        [Fact]
        public void Should_Handle_Duplicate_Property_Names()
        {
            // Arrange
            var input = @"{
                name = 'first',
                name = 'second',
                name = 'third'
            }";

            // Act
            var document = _parser.Parse(input);

            // Assert
            // Last value should win
            document.RootObject.GetProperty("name")?.ToString().Should().Be("third");
        }

        [Fact]
        public void Should_Handle_Mixed_At_Prefix()
        {
            // Arrange
            var input = @"{
                @name = 'with at',
                name = 'without at'
            }";

            // Act
            var document = _parser.Parse(input);

            // Assert
            // Both should be accessible, last one wins
            document.RootObject.GetProperty("name")?.ToString().Should().Be("without at");
        }

        [Fact]
        public void Should_Handle_Empty_Enum_Values()
        {
            // Arrange
            var input = "{ status = || }";

            // Act
            var document = _parser.Parse(input);

            // Assert
            var value = document.RootObject.GetProperty("status")?.Value as TonEnumSet;
            value?.Values.Should().BeEmpty();
        }

        [Fact]
        public void Should_Handle_Invalid_Enum_Index()
        {
            // Arrange
            var schemas = new TonSchemaCollection();
            var enumDef = new TonEnumDefinition("status");
            enumDef.Values.AddRange(new[] { "active", "inactive" });
            schemas.AddEnum(enumDef);

            var obj = new TonObject();
            obj.SetProperty("status", TonValue.From(new TonEnum("10"))); // Index out of range

            // Act & Assert
            enumDef.IsValidValue("10").Should().BeFalse();
        }

        [Fact]
        public void Should_Handle_Circular_References_Prevention()
        {
            // Note: TON doesn't support circular references by design
            // This test ensures we don't get into infinite loops

            // Arrange
            var obj1 = new TonObject { ClassName = "obj1" };
            var obj2 = new TonObject { ClassName = "obj2" };

            obj1.AddChild(obj2);
            // We can't add obj1 as a child of obj2 (no parent reference in TON)

            // Act
            var serialized = _serializer.Serialize(obj1, TonSerializeOptions.Compact);

            // Assert
            serialized.Should().Contain("(obj1)");
            serialized.Should().Contain("(obj2)");
        }

        [Fact]
        public void Should_Handle_Null_Document()
        {
            // Arrange & Act & Assert
            Action act = () => _serializer.SerializeDocument(null!, TonSerializeOptions.Default);
            act.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void Should_Handle_Invalid_GUID_Format()
        {
            // Arrange
            var input = "{ id = not-a-guid }";

            // Act
            var document = _parser.Parse(input);

            // Assert
            // Should be parsed as a regular identifier, not a GUID
            var value = document.RootObject.GetProperty("id");
            value?.Type.Should().NotBe(TonValueType.Guid);
            value?.ToString().Should().Be("not-a-guid");
        }

        [Fact]
        public void Should_Handle_Missing_Equals_Sign()
        {
            // Arrange
            var input = "{ name 'test' }";

            // Act & Assert
            Action act = () => _parser.Parse(input);
            act.Should().Throw<TonParseException>()
                .WithMessage("*Expected*Equals*");
        }

        [Fact]
        public void Should_Handle_Invalid_Type_Annotation()
        {
            // Arrange
            var input = "{ age: = 30 }"; // Missing type after colon

            // Act & Assert
            Action act = () => _parser.Parse(input);
            act.Should().Throw<TonParseException>();
        }

        [Fact]
        public void Should_Handle_Reserved_Characters_At_Property_Start()
        {
            // These should require quoting
            var testCases = new[]
            {
                ("#property", "'#property'"),
                ("0property", "'0property'"),
                ("{property", "'{property'"),
                ("[property", "'[property'"),
                ("(property", "'(property'")
            };

            foreach (var (propName, quotedName) in testCases)
            {
                // Arrange
                var obj = new TonObject();
                obj.SetProperty(propName, TonValue.From("value"));

                // Act
                var serialized = _serializer.Serialize(obj, TonSerializeOptions.Compact);

                // Assert
                serialized.Should().Contain($"{quotedName} = 'value'");
            }
        }

        [Fact]
        public void Should_Handle_Comments_In_Various_Positions()
        {
            // Arrange
            var input = @"
// Comment at start
#@ tonVersion = '1' // Comment after header

/* Multi-line comment
   before object */
{(test) // Comment after class
    // Comment before property
    name = 'test', // Comment after property
    /* inline */ value = 42 /* comment */

    // Comment before child
    {(child) /* comment in child */
    } // Comment after child
} // Final comment

// Comment before schema
#! /* comment */ enum(status) [active] // End comment
";

            // Act
            var document = _parser.Parse(input);

            // Assert
            document.Header?.TonVersion.Should().Be("1");
            document.RootObject.ClassName.Should().Be("test");
            document.RootObject.GetProperty("name")?.ToString().Should().Be("test");
            document.RootObject.GetProperty("value")?.ToInt32().Should().Be(42);
            document.RootObject.Children.Should().HaveCount(1);
            document.Schemas?.Enums.Should().HaveCount(1);
        }

        [Fact]
        public void Should_Handle_Schema_Without_Data()
        {
            // Arrange
            var input = @"
#! enum(status) [active, inactive]
#! {(test)
    /name = string(required)
}";

            // Act & Assert
            // Schema definitions must come after data
            Action act = () => _parser.Parse(input);
            act.Should().Throw<TonParseException>();
        }

        [Fact]
        public void Should_Handle_Complex_Escape_Sequences()
        {
            // Arrange
            var input = @"{
                text1 = 'Line 1\nLine 2\rLine 3\r\nLine 4',
                text2 = 'Tab\there\tand\tthere',
                text3 = 'Quote: \' and \\backslash\\',
                text4 = 'Form\ffeed and back\bspace',
                text5 = 'Unicode: \u0041\u0042\u0043'
            }";

            // Act
            var document = _parser.Parse(input);

            // Assert
            document.RootObject.GetProperty("text1")?.ToString().Should().Contain("\n");
            document.RootObject.GetProperty("text2")?.ToString().Should().Contain("\t");
            document.RootObject.GetProperty("text3")?.ToString().Should().Be("Quote: ' and \\backslash\\");
            document.RootObject.GetProperty("text5")?.ToString().Should().Be("Unicode: ABC");
        }

        [Fact]
        public void Should_Handle_Property_Path_Edge_Cases()
        {
            // Arrange
            var document = new TonDocument();
            document.RootObject.SetProperty("level1", TonValue.From("value1"));

            var child = new TonObject { ClassName = "level2" };
            child.SetProperty("prop", TonValue.From("value2"));
            document.RootObject.AddChild(child);

            // Act & Assert
            document.GetValue("/").Should().Be(document.RootObject);
            document.GetValue("/level1").Should().Be("value1");
            document.GetValue("/level2/prop").Should().Be("value2");
            document.GetValue("/nonexistent").Should().BeNull();
            document.GetValue("/level2/nonexistent").Should().BeNull();
            document.GetValue("").Should().BeNull();
        }
    }
}