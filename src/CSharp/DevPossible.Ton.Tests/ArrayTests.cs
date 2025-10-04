using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using Xunit;

namespace TONfile.Tests
{
    public class ArrayTests
    {
        // @TestID: ARR-BASIC-001
        // Tests parsing of empty array literals
        [Fact]
        public void Parser_Should_ParseEmptyArray()
        {
            var ton = @"{
                @emptyArray = []
            }";

            var parser = new TonParser();
            var document = parser.Parse(ton);

            var array = document.RootObject.GetProperty("@emptyArray");
            array.Should().NotBeNull();
            array!.Type.Should().Be(TonValueType.Array);
            array.GetArrayCount().Should().Be(0);
        }

        // @TestID: ARR-BASIC-002
        // Tests parsing of simple numeric arrays
        [Fact]
        public void Parser_Should_ParseSimpleArray()
        {
            var ton = @"{
                @numbers = [1, 2, 3, 4, 5]
            }";

            var parser = new TonParser();
            var document = parser.Parse(ton);

            var array = document.RootObject.GetProperty("@numbers");
            array.Should().NotBeNull();
            array!.Type.Should().Be(TonValueType.Array);
            array.GetArrayCount().Should().Be(5);

            array.GetArrayElement(0)!.ToInt32().Should().Be(1);
            array.GetArrayElement(1)!.ToInt32().Should().Be(2);
            array.GetArrayElement(2)!.ToInt32().Should().Be(3);
            array.GetArrayElement(3)!.ToInt32().Should().Be(4);
            array.GetArrayElement(4)!.ToInt32().Should().Be(5);
        }

        // @TestID: ARR-BASIC-003
        // Tests parsing of string arrays
        [Fact]
        public void Parser_Should_ParseStringArray()
        {
            var ton = @"{
                @fruits = [""apple"", ""banana"", ""cherry""]
            }";

            var parser = new TonParser();
            var document = parser.Parse(ton);

            var array = document.RootObject.GetProperty("@fruits");
            array.Should().NotBeNull();
            array!.Type.Should().Be(TonValueType.Array);
            array.GetArrayCount().Should().Be(3);

            array.GetArrayElement(0)!.ToString().Should().Be("apple");
            array.GetArrayElement(1)!.ToString().Should().Be("banana");
            array.GetArrayElement(2)!.ToString().Should().Be("cherry");
        }

        // @TestID: ARR-MIXED-001
        // Tests parsing of arrays with mixed data types
        [Fact]
        public void Parser_Should_ParseMixedArray()
        {
            var ton = @"{
                @mixed = [1, ""hello"", true, null, 3.14]
            }";

            var parser = new TonParser();
            var document = parser.Parse(ton);

            var array = document.RootObject.GetProperty("@mixed");
            array.Should().NotBeNull();
            array!.GetArrayCount().Should().Be(5);

            array.GetArrayElement(0)!.Type.Should().Be(TonValueType.Integer);
            array.GetArrayElement(1)!.Type.Should().Be(TonValueType.String);
            array.GetArrayElement(2)!.Type.Should().Be(TonValueType.Boolean);
            array.GetArrayElement(3)!.Type.Should().Be(TonValueType.Null);
            array.GetArrayElement(4)!.Type.Should().Be(TonValueType.Float);
        }

        // @TestID: ARR-NESTED-001
        // Tests parsing of 2D nested arrays (matrix)
        [Fact]
        public void Parser_Should_ParseNestedArrays()
        {
            var ton = @"{
                @matrix = [[1, 2], [3, 4], [5, 6]]
            }";

            var parser = new TonParser();
            var document = parser.Parse(ton);

            var matrix = document.RootObject.GetProperty("@matrix");
            matrix.Should().NotBeNull();
            matrix!.Type.Should().Be(TonValueType.Array);
            matrix.GetArrayCount().Should().Be(3);

            var row1 = matrix.GetArrayElement(0);
            row1!.Type.Should().Be(TonValueType.Array);
            row1.GetArrayCount().Should().Be(2);
            row1.GetArrayElement(0)!.ToInt32().Should().Be(1);
            row1.GetArrayElement(1)!.ToInt32().Should().Be(2);
        }

        // @TestID: ARR-SYNTAX-002
        // Tests parsing of arrays with type hints
        [Fact]
        public void Parser_Should_ParseArrayWithTypeHint()
        {
            var ton = @"{
                @numbers = ^[1, 2, 3]
            }";

            var parser = new TonParser();
            var document = parser.Parse(ton);

            var array = document.RootObject.GetProperty("@numbers");
            array.Should().NotBeNull();
            array!.Type.Should().Be(TonValueType.Array);
            array.GetArrayCount().Should().Be(3);
        }


        // @TestID: ARR-SYNTAX-001
        // Tests handling of trailing comma in arrays
        [Fact]
        public void Parser_Should_ThrowOnTrailingComma()
        {
            var ton = @"{
                @invalid = [1, 2, 3,]
            }";

            var parser = new TonParser();
            var act = () => parser.Parse(ton);

            act.Should().Throw<TonParseException>()
                .WithMessage("*Trailing comma not allowed in arrays*");
        }

        // @TestID: ARR-SERIAL-001
        // Tests serialization of empty arrays
        [Fact]
        public void Serializer_Should_SerializeEmptyArray()
        {
            var obj = new TonObject();
            obj.SetProperty("emptyArray", TonValue.FromArray());

            var serializer = new TonSerializer();
            var result = serializer.Serialize(obj);

            result.Should().Contain("emptyArray = []");
        }

        // @TestID: ARR-SERIAL-002
        // Tests serialization of arrays with pretty formatting
        [Fact]
        public void Serializer_Should_SerializeSimpleArray()
        {
            var obj = new TonObject();
            obj.SetProperty("numbers", TonValue.FromArray(1, 2, 3));

            var serializer = new TonSerializer();
            var result = serializer.Serialize(obj);

            result.Should().Contain("numbers = [1, 2, 3]");
        }

        // @TestID: ARR-SERIAL-003
        // Tests serialization of nested arrays
        [Fact]
        public void Serializer_Should_SerializeNestedArrays()
        {
            var obj = new TonObject();
            var row1 = TonValue.FromArray(1, 2);
            var row2 = TonValue.FromArray(3, 4);
            var matrix = TonValue.FromArray(new List<TonValue> { row1, row2 });
            obj.SetProperty("matrix", matrix);

            var serializer = new TonSerializer();
            var result = serializer.Serialize(obj);

            result.Should().Contain("matrix = [[1, 2], [3, 4]]");
        }

        // @TestID: ARR-VALID-001
        // Tests array validation with count constraints
        [Fact]
        public void Validator_Should_ValidateArrayMinCount()
        {
            var ton = @"{(TestClass)
                @items = [1, 2]
            }";

            var schema = new TonSchemaDefinition("TestClass");
            var propSchema = new TonPropertySchema("/items", "array:int");
            propSchema.AddValidation(new TonValidationRule(ValidationRuleType.MinCount, 3));
            schema.AddProperty("/items", propSchema);

            var schemas = new TonSchemaCollection();
            schemas.AddSchema(schema);

            var parser = new TonParser();
            var document = parser.Parse(ton);

            var validator = new TonValidator(schemas);
            var result = validator.Validate(document);

            result.IsValid.Should().BeFalse();
            result.Errors.Should().ContainSingle(e => e.Message.Contains("at least 3 elements"));
        }

        // @TestID: ARR-VALID-001
        // Tests array validation with count constraints
        [Fact]
        public void Validator_Should_ValidateArrayMaxCount()
        {
            var ton = @"{(TestClass)
                @items = [1, 2, 3, 4, 5]
            }";

            var schema = new TonSchemaDefinition("TestClass");
            var propSchema = new TonPropertySchema("/items", "array");
            propSchema.AddValidation(new TonValidationRule(ValidationRuleType.MaxCount, 3));
            schema.AddProperty("/items", propSchema);

            var schemas = new TonSchemaCollection();
            schemas.AddSchema(schema);

            var parser = new TonParser();
            var document = parser.Parse(ton);

            var validator = new TonValidator(schemas);
            var result = validator.Validate(document);

            result.IsValid.Should().BeFalse();
            result.Errors.Should().ContainSingle(e => e.Message.Contains("at most 3 elements"));
        }

        // @TestID: ARR-VALID-001
        // Tests array validation with count constraints
        [Fact]
        public void Validator_Should_ValidateNonEmptyArray()
        {
            var ton = @"{(TestClass)
                @items = []
            }";

            var schema = new TonSchemaDefinition("TestClass");
            var propSchema = new TonPropertySchema("/items", "array");
            propSchema.AddValidation(new TonValidationRule(ValidationRuleType.NonEmpty));
            schema.AddProperty("/items", propSchema);

            var schemas = new TonSchemaCollection();
            schemas.AddSchema(schema);

            var parser = new TonParser();
            var document = parser.Parse(ton);

            var validator = new TonValidator(schemas);
            var result = validator.Validate(document);

            result.IsValid.Should().BeFalse();
            result.Errors.Should().ContainSingle(e => e.Message.Contains("must not be empty"));
        }

        // @TestID: ARR-VALID-004
        // Tests array validation for unique elements
        [Fact]
        public void Validator_Should_ValidateUniqueArray()
        {
            var ton = @"{(TestClass)
                @items = [1, 2, 3, 2, 4]
            }";

            var schema = new TonSchemaDefinition("TestClass");
            var propSchema = new TonPropertySchema("/items", "array");
            propSchema.AddValidation(new TonValidationRule(ValidationRuleType.Unique));
            schema.AddProperty("/items", propSchema);

            var schemas = new TonSchemaCollection();
            schemas.AddSchema(schema);

            var parser = new TonParser();
            var document = parser.Parse(ton);

            var validator = new TonValidator(schemas);
            var result = validator.Validate(document);

            result.IsValid.Should().BeFalse();
            result.Errors.Should().ContainSingle(e => e.Message.Contains("unique elements"));
        }

        // @TestID: ARR-VALID-005
        // Tests array validation for sorted elements
        [Fact]
        public void Validator_Should_ValidateSortedArray()
        {
            var ton = @"{(TestClass)
                @items = [1, 3, 2, 4]
            }";

            var schema = new TonSchemaDefinition("TestClass");
            var propSchema = new TonPropertySchema("/items", "array:int");
            propSchema.AddValidation(new TonValidationRule(ValidationRuleType.Sorted));
            schema.AddProperty("/items", propSchema);

            var schemas = new TonSchemaCollection();
            schemas.AddSchema(schema);

            var parser = new TonParser();
            var document = parser.Parse(ton);

            var validator = new TonValidator(schemas);
            var result = validator.Validate(document);

            result.IsValid.Should().BeFalse();
            result.Errors.Should().ContainSingle(e => e.Message.Contains("must be sorted"));
        }

        // @TestID: ARR-VALID-002
        // Tests array element type validation
        [Fact]
        public void Validator_Should_ValidateArrayBaseType()
        {
            var ton = @"{(TestClass)
                @items = [1, ""hello"", 3]
            }";

            var schema = new TonSchemaDefinition("TestClass");
            var propSchema = new TonPropertySchema("/items", "array:int");
            schema.AddProperty("/items", propSchema);

            var schemas = new TonSchemaCollection();
            schemas.AddSchema(schema);

            var parser = new TonParser();
            var document = parser.Parse(ton);

            var validator = new TonValidator(schemas);
            var result = validator.Validate(document);

            result.IsValid.Should().BeFalse();
            result.Errors.Should().ContainSingle(e => e.Message.Contains("Type mismatch"));
        }

        // @TestID: ARR-MODIFY-001
        // Tests array modification operations
        [Fact]
        public void TonValue_Should_ConvertArrayCorrectly()
        {
            var values = new[] { 1, 2, 3, 4, 5 };
            var tonValue = TonValue.FromArray(values.Cast<object>().ToArray());

            tonValue.Type.Should().Be(TonValueType.Array);
            tonValue.GetArrayCount().Should().Be(5);
            tonValue.IsEmpty().Should().BeFalse();

            var array = tonValue.ToArray();
            array.Should().NotBeNull();
            array!.Count.Should().Be(5);
        }

        // @TestID: ARR-COMPLEX-002
        // Tests complex nested array and object structures
        [Fact]
        public void Parser_Should_ParseComplexNestedStructure()
        {
            var ton = @"{(DataSet)
                @datasets = [
                    {(Dataset)
                        @name = ""Set1"",
                        @values = [10, 20, 30]
                    },
                    {(Dataset)
                        @name = ""Set2"",
                        @values = [40, 50, 60]
                    }
                ],
                {(Metadata)
                    @version = ""1.0"",
                    @tags = [""production"", ""critical""]
                }
            }";

            var parser = new TonParser();
            var document = parser.Parse(ton);

            document.RootObject.ClassName.Should().Be("DataSet");

            var datasets = document.RootObject.GetProperty("@datasets");
            datasets.Should().NotBeNull();
            datasets!.Type.Should().Be(TonValueType.Array);
            datasets.GetArrayCount().Should().Be(2);

            // Check first dataset in array
            var firstDataset = datasets.GetArrayElement(0);
            firstDataset.Should().NotBeNull();
            firstDataset!.Type.Should().Be(TonValueType.Object);

            var firstObj = firstDataset.Value as TonObject;
            firstObj.Should().NotBeNull();
            firstObj!.ClassName.Should().Be("Dataset");
            firstObj.GetProperty("@name")!.ToString().Should().Be("Set1");

            // Check metadata child object
            var metadata = document.RootObject.Children.First();
            metadata.ClassName.Should().Be("Metadata");
            var tags = metadata.GetProperty("@tags");
            tags!.GetArrayCount().Should().Be(2);
        }
    }
}