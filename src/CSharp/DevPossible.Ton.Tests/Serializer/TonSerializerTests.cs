using Xunit;
using FluentAssertions;
using DevPossible.Ton;
using System;
using System.Collections.Generic;

namespace DevPossible.Ton.Tests.Serializer
{
    public class TonSerializerTests
    {
        private readonly TonSerializer _serializer = new TonSerializer();
        private readonly TonParser _parser = new TonParser();

        // @TestID: SER-BASIC-001
        // Test serialization of empty object
        [Fact]
        public void Should_Serialize_Empty_Object()
        {
            // Arrange
            var obj = new TonObject();

            // Act
            var result = _serializer.Serialize(obj, TonSerializeOptions.Compact);

            // Assert
            result.Should().Be("{}");
        }

        // @TestID: SER-BASIC-003
        // Test serialization of object with class name
        [Fact]
        public void Should_Serialize_Object_With_Class()
        {
            // Arrange
            var obj = new TonObject { ClassName = "person" };

            // Act
            var result = _serializer.Serialize(obj, TonSerializeOptions.Compact);

            // Assert
            result.Should().Be("{(person)}");
        }

        // @TestID: SER-BASIC-002
        // Test serialization of simple object with compact format
        [Fact]
        public void Should_Serialize_Simple_Properties()
        {
            // Arrange
            var obj = new TonObject();
            obj.SetProperty("name", TonValue.From("John Doe"));
            obj.SetProperty("age", TonValue.From(30));
            obj.SetProperty("active", TonValue.From(true));

            // Act
            var result = _serializer.Serialize(obj, TonSerializeOptions.Compact);

            // Assert
            result.Should().Contain("name = 'John Doe'");
            result.Should().Contain("age = 30");
            result.Should().Contain("active = true");
        }

        // @TestID: SER-BASIC-014
        // Test serialization of properties with @ prefix
        [Fact]
        public void Should_Serialize_With_At_Prefix()
        {
            // Arrange
            var obj = new TonObject();
            obj.SetProperty("name", TonValue.From("John"));
            var options = new TonSerializeOptions
            {
                UseAtPrefix = true,
                Indentation = null
            };

            // Act
            var result = _serializer.Serialize(obj, options);

            // Assert
            result.Should().Contain("@name = 'John'");
        }

        // @TestID: SER-COMPLEX-005
        // Test serialization with proper string escaping
        [Fact]
        public void Should_Quote_Property_Names_When_Needed()
        {
            // Arrange
            var obj = new TonObject();
            obj.SetProperty("first name", TonValue.From("John"));
            obj.SetProperty("user@id", TonValue.From(123));

            // Act
            var result = _serializer.Serialize(obj, TonSerializeOptions.Compact);

            // Assert
            result.Should().Contain("'first name' = 'John'");
            result.Should().Contain("'user@id' = 123");
        }

        // @TestID: SER-COMPLEX-001
        // Test serialization with type hints preservation
        [Fact]
        public void Should_Serialize_Type_Hints()
        {
            // Arrange
            var obj = new TonObject();
            obj.SetProperty("name", TonValue.From("John"));
            obj.SetProperty("age", TonValue.From(30));
            obj.SetProperty("id", TonValue.From(Guid.Parse("550e8400-e29b-41d4-a716-446655440000")));

            var options = new TonSerializeOptions
            {
                IncludeTypeHints = true,
                Indentation = null
            };

            // Act
            var result = _serializer.Serialize(obj, options);

            // Assert
            result.Should().Contain("name = $'John'");
            result.Should().Contain("age = %30");
            result.Should().Contain("id = &550e8400-e29b-41d4-a716-446655440000");
        }

        // @TestID: SER-BASIC-012
        // Test serialization of null and undefined values
        [Fact]
        public void Should_Serialize_Null_And_Undefined()
        {
            // Arrange
            var obj = new TonObject();
            obj.SetProperty("nullValue", new TonValue(null, TonValueType.Null));
            obj.SetProperty("undefinedValue", new TonValue(TonValue.UndefinedMarker, TonValueType.Undefined));

            var options = new TonSerializeOptions
            {
                Indentation = null,
                OmitNullValues = false,
                OmitUndefinedValues = false
            };

            // Act
            var result = _serializer.Serialize(obj, options);

            // Assert
            result.Should().Contain("nullValue = null");
            result.Should().Contain("undefinedValue = undefined");
        }

        // @TestID: SER-BASIC-009
        // Test serialization of hexadecimal number format
        [Fact]
        public void Should_Serialize_Numbers_In_Different_Formats()
        {
            // Arrange
            var obj = new TonObject();
            obj.SetProperty("decimal", TonValue.From(123));
            obj.SetProperty("float", TonValue.From(123.45));
            obj.SetProperty("scientific", TonValue.From(1.23e10));

            // Act
            var result = _serializer.Serialize(obj, TonSerializeOptions.Compact);

            // Assert
            result.Should().Contain("decimal = 123");
            result.Should().Contain("float = 123.45");
            result.Should().Contain("scientific = 12300000000");
        }

        // @TestID: SER-BASIC-008
        // Test serialization of GUID values
        [Fact]
        public void Should_Serialize_GUIDs()
        {
            // Arrange
            var guid = Guid.Parse("550e8400-e29b-41d4-a716-446655440000");
            var obj = new TonObject();
            obj.SetProperty("id", TonValue.From(guid));

            // Act
            var result = _serializer.Serialize(obj, TonSerializeOptions.Compact);

            // Assert
            result.Should().Contain("id = 550e8400-e29b-41d4-a716-446655440000");
        }

        // @TestID: SER-BASIC-008
        // Test serialization of GUID values
        [Fact]
        public void Should_Serialize_GUIDs_Lowercase()
        {
            // Arrange
            var guid = Guid.Parse("550E8400-E29B-41D4-A716-446655440000");
            var obj = new TonObject();
            obj.SetProperty("id", TonValue.From(guid));

            var options = new TonSerializeOptions
            {
                LowercaseGuids = true,
                Indentation = null
            };

            // Act
            var result = _serializer.Serialize(obj, options);

            // Assert
            result.Should().Contain("id = 550e8400-e29b-41d4-a716-446655440000");
        }

        // @TestID: SER-BASIC-006
        // Test serialization of single enum values
        [Fact]
        public void Should_Serialize_Enums()
        {
            // Arrange
            var obj = new TonObject();
            obj.SetProperty("status", TonValue.From(new TonEnum("active")));
            obj.SetProperty("permissions", TonValue.From(new TonEnumSet("read", "write", "admin")));

            // Act
            var result = _serializer.Serialize(obj, TonSerializeOptions.Compact);

            // Assert
            result.Should().Contain("status = |active|");
            result.Should().Contain("permissions = |read|write|admin|");
        }

        // @TestID: SER-NESTED-001
        // Test serialization of nested object structures
        [Fact]
        public void Should_Serialize_Nested_Objects()
        {
            // Arrange
            var obj = new TonObject();
            obj.SetProperty("name", TonValue.From("John"));

            var address = new TonObject { ClassName = "address" };
            address.SetProperty("street", TonValue.From("123 Main St"));
            address.SetProperty("city", TonValue.From("New York"));
            obj.AddChild(address);

            // Act
            var result = _serializer.Serialize(obj, TonSerializeOptions.Pretty);

            // Assert
            result.Should().Contain("name = $'John'");
            result.Should().Contain("{(address)");
            result.Should().Contain("street = $'123 Main St'");
            result.Should().Contain("city = $'New York'");
        }

        // @TestID: SER-COMPLEX-003
        // Test serialization of document with header metadata
        [Fact]
        public void Should_Serialize_With_Header()
        {
            // Arrange
            var document = new TonDocument();
            document.Header = new TonHeader
            {
                TonVersion = "1"
            };
            document.Header.Attributes["customAttr"] = "value";

            var options = new TonSerializeOptions
            {
                IncludeHeader = true,
                Indentation = null
            };

            // Act
            var result = _serializer.SerializeDocument(document, options);

            // Assert
            result.Should().StartWith("#@ tonVersion = '1', customAttr = 'value'");
        }

        // @TestID: SER-FORMAT-002
        // Test serialization with custom formatting options
        [Fact]
        public void Should_Sort_Properties()
        {
            // Arrange
            var obj = new TonObject();
            obj.SetProperty("zebra", TonValue.From("z"));
            obj.SetProperty("alpha", TonValue.From("a"));
            obj.SetProperty("beta", TonValue.From("b"));

            var options = new TonSerializeOptions
            {
                SortProperties = true,
                Indentation = null
            };

            // Act
            var result = _serializer.Serialize(obj, options);

            // Assert
            var alphaIndex = result.IndexOf("alpha");
            var betaIndex = result.IndexOf("beta");
            var zebraIndex = result.IndexOf("zebra");

            alphaIndex.Should().BeLessThan(betaIndex);
            betaIndex.Should().BeLessThan(zebraIndex);
        }

        // @TestID: SER-FORMAT-002
        // Test serialization with custom formatting options
        [Fact]
        public void Should_Omit_Null_Values_When_Configured()
        {
            // Arrange
            var obj = new TonObject();
            obj.SetProperty("name", TonValue.From("John"));
            obj.SetProperty("middleName", new TonValue(null, TonValueType.Null));
            obj.SetProperty("age", TonValue.From(30));

            var options = new TonSerializeOptions
            {
                OmitNullValues = true,
                Indentation = null
            };

            // Act
            var result = _serializer.Serialize(obj, options);

            // Assert
            result.Should().Contain("name = 'John'");
            result.Should().Contain("age = 30");
            result.Should().NotContain("middleName");
        }

        // @TestID: SER-FORMAT-002
        // Test serialization with custom formatting options
        [Fact]
        public void Should_Use_Different_Quote_Characters()
        {
            // Arrange
            var obj = new TonObject();
            obj.SetProperty("single", TonValue.From("test"));

            var optionsSingle = new TonSerializeOptions
            {
                QuoteChar = '\'',
                Indentation = null
            };

            var optionsDouble = new TonSerializeOptions
            {
                QuoteChar = '"',
                Indentation = null
            };

            // Act
            var resultSingle = _serializer.Serialize(obj, optionsSingle);
            var resultDouble = _serializer.Serialize(obj, optionsDouble);

            // Assert
            resultSingle.Should().Contain("single = 'test'");
            resultDouble.Should().Contain("single = \"test\"");
        }

        // @TestID: SER-COMPLEX-006
        // Test serialization of parent-child object structures
        [Fact]
        public void Should_Serialize_Complex_Document()
        {
            // Arrange
            var document = new TonDocument();
            document.Header = new TonHeader { TonVersion = "1" };

            var root = document.RootObject;
            root.ClassName = "user";

            root.SetProperty("@name", TonValue.From("John Doe"));
            root.SetProperty("@age", TonValue.From(30));
            root.SetProperty("email", TonValue.From("john@example.com"));
            root.SetProperty("active", TonValue.From(true));
            root.SetProperty("permissions", TonValue.From(new TonEnumSet("read", "write")));

            var address = new TonObject { ClassName = "address" };
            address.SetProperty("street", TonValue.From("123 Main St"));
            address.SetProperty("city", TonValue.From("New York"));
            root.AddChild(address);

            var options = TonSerializeOptions.Pretty;

            // Act
            var result = _serializer.SerializeDocument(document, options);

            // Assert
            result.Should().Contain("#@ tonVersion = '1'");
            result.Should().Contain("{(user)");
            result.Should().Contain("@name = $'John Doe'");
            result.Should().Contain("@age = %30");
            result.Should().Contain("{(address)");
        }

        // @TestID: SER-COMPLEX-005
        // Test serialization with proper string escaping
        [Fact]
        public void Should_Escape_Special_Characters_In_Strings()
        {
            // Arrange
            var obj = new TonObject();
            obj.SetProperty("text", TonValue.From("Line 1\nLine 2\t'quoted'"));
            obj.SetProperty("path", TonValue.From("C:\\Users\\Test"));

            // Act
            var result = _serializer.Serialize(obj, TonSerializeOptions.Compact);

            // Assert
            result.Should().Contain(@"text = 'Line 1\nLine 2\t\'quoted\''");
            result.Should().Contain(@"path = 'C:\\Users\\Test'");
        }

        // @TestID: SER-VALID-001
        // Test round-trip parse-serialize-parse preservation
        [Fact]
        public void Should_Round_Trip_Serialize_And_Parse()
        {
            // Arrange
            var original = new TonObject { ClassName = "test" };
            original.SetProperty("name", TonValue.From("Test Object"));
            original.SetProperty("value", TonValue.From(42));
            original.SetProperty("active", TonValue.From(true));

            var child = new TonObject { ClassName = "child" };
            child.SetProperty("data", TonValue.From("child data"));
            original.AddChild(child);

            // Act
            var serialized = _serializer.Serialize(original);
            var parsed = _parser.Parse(serialized);
            var reserialized = _serializer.Serialize(parsed.RootObject);

            // Assert
            parsed.RootObject.ClassName.Should().Be("test");
            parsed.RootObject.GetProperty("name")?.ToString().Should().Be("Test Object");
            parsed.RootObject.GetProperty("value")?.ToInt32().Should().Be(42);
            parsed.RootObject.GetProperty("active")?.ToBoolean().Should().BeTrue();
            parsed.RootObject.Children.Should().HaveCount(1);
            parsed.RootObject.Children[0].ClassName.Should().Be("child");
        }

        // @TestID: SER-BASIC-004
        // Test serialization of arrays with numeric elements
        [Fact]
        public void Should_Serialize_From_Anonymous_Object()
        {
            // Arrange
            var obj = new
            {
                Name = "John Doe",
                Age = 30,
                Email = "john@example.com",
                Active = true
            };

            // Act
            var result = _serializer.Serialize(obj, TonSerializeOptions.Pretty);

            // Assert
            result.Should().Contain("Name = $'John Doe'");
            result.Should().Contain("Age = %30");
            result.Should().Contain("Email = $'john@example.com'");
            result.Should().Contain("Active = true");
        }
    }
}