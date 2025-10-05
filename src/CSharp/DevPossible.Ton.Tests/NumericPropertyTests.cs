using System;
using System.Collections.Generic;
using Xunit;
using FluentAssertions;
using DevPossible.Ton;

namespace DevPossible.Ton.Tests
{
    public class NumericPropertyTests
    {
        private readonly TonParser _parser = new TonParser();
        private readonly TonSerializer _serializer = new TonSerializer();

        // @TestID: NUM-BASIC-002
        // Test properties that start with numbers
        [Fact]
        public void Should_Parse_Property_Names_Starting_With_Numbers()
        {
            // Arrange
            var ton = @"{
                1property = 'value1',
                2ndProperty = 'value2',
                3rdItem = 'value3'
            }";

            // Act
            var document = _parser.Parse(ton);

            // Assert
            document.RootObject.GetProperty("1property")?.Value.Should().Be("value1");
            document.RootObject.GetProperty("2ndProperty")?.Value.Should().Be("value2");
            document.RootObject.GetProperty("3rdItem")?.Value.Should().Be("value3");
        }

        // @TestID: NUM-BASIC-001
        // Test pure numeric property names
        [Fact]
        public void Should_Parse_Pure_Numeric_Property_Names()
        {
            // Arrange
            var ton = @"{
                123 = 'value123',
                456 = 'value456',
                789 = 'value789'
            }";

            // Act
            var document = _parser.Parse(ton);

            // Assert
            document.RootObject.GetProperty("123")?.Value.Should().Be("value123");
            document.RootObject.GetProperty("456")?.Value.Should().Be("value456");
            document.RootObject.GetProperty("789")?.Value.Should().Be("value789");
        }

        // @TestID: NUM-BASIC-003
        // Test year-based numeric properties
        [Fact]
        public void Should_Parse_Year_Property_Names()
        {
            // Arrange
            var ton = @"{
                2022 = 450000000,
                2023 = 520000000,
                2024 = 380000000
            }";

            // Act
            var document = _parser.Parse(ton);

            // Assert
            document.RootObject.GetProperty("2022")?.Value.Should().Be(450000000);
            document.RootObject.GetProperty("2023")?.Value.Should().Be(520000000);
            document.RootObject.GetProperty("2024")?.Value.Should().Be(380000000);
        }

        // @TestID: NUM-BASIC-004
        // Test mixing numeric and regular property names
        [Fact]
        public void Should_Parse_Mixed_Property_Names()
        {
            // Arrange
            var ton = @"{
                name = 'John',
                123 = 'numeric',
                age = 30,
                2024 = 'year',
                active = true
            }";

            // Act
            var document = _parser.Parse(ton);

            // Assert
            document.RootObject.Properties.Should().HaveCount(5);
            document.RootObject.GetProperty("name")?.Value.Should().Be("John");
            document.RootObject.GetProperty("123")?.Value.Should().Be("numeric");
            document.RootObject.GetProperty("age")?.Value.Should().Be(30);
            document.RootObject.GetProperty("2024")?.Value.Should().Be("year");
            document.RootObject.GetProperty("active")?.Value.Should().Be(true);
        }

        // @TestID: NUM-NESTED-001
        // Test numeric properties within array objects
        [Fact]
        public void Should_Parse_Nested_Objects_With_Numeric_Properties()
        {
            // Arrange
            var ton = @"{
                financials = {
                    revenue = {
                        2022 = 450000000,
                        2023 = 520000000,
                        2024 = 380000000
                    },
                    expenses = {
                        2022 = 400000000,
                        2023 = 450000000,
                        2024 = 320000000
                    }
                }
            }";

            // Act
            var document = _parser.Parse(ton);

            // Assert
            var financials = document.RootObject.GetProperty("financials")?.Value as TonObject;
            financials.Should().NotBeNull();

            var revenue = financials?.GetProperty("revenue")?.Value as TonObject;
            revenue.Should().NotBeNull();
            revenue?.GetProperty("2022")?.Value.Should().Be(450000000);
            revenue?.GetProperty("2023")?.Value.Should().Be(520000000);
            revenue?.GetProperty("2024")?.Value.Should().Be(380000000);

            var expenses = financials?.GetProperty("expenses")?.Value as TonObject;
            expenses.Should().NotBeNull();
            expenses?.GetProperty("2022")?.Value.Should().Be(400000000);
            expenses?.GetProperty("2023")?.Value.Should().Be(450000000);
            expenses?.GetProperty("2024")?.Value.Should().Be(320000000);
        }

        // @TestID: NUM-FORMAT-001
        // Test serialization of objects with numeric property names
        [Fact]
        public void Should_Serialize_Numeric_Property_Names()
        {
            // Arrange
            var document = new TonDocument
            {
                RootObject = new TonObject
                {
                    Properties = new Dictionary<string, TonValue>
                    {
                        ["2022"] = TonValue.From(100),
                        ["2023"] = TonValue.From(200),
                        ["2024"] = TonValue.From(300),
                        ["123"] = TonValue.From("test"),
                        ["regular"] = TonValue.From("value")
                    }
                }
            };

            // Act
            var serialized = _serializer.SerializeDocument(document, TonSerializeOptions.Default);
            var reparsed = _parser.Parse(serialized);

            // Assert
            reparsed.RootObject.GetProperty("2022")?.Value.Should().Be(100);
            reparsed.RootObject.GetProperty("2023")?.Value.Should().Be(200);
            reparsed.RootObject.GetProperty("2024")?.Value.Should().Be(300);
            reparsed.RootObject.GetProperty("123")?.Value.Should().Be("test");
            reparsed.RootObject.GetProperty("regular")?.Value.Should().Be("value");
        }

        // @TestID: NUM-BASIC-005
        // Test floating point numbers as property names
        [Fact]
        public void Should_Handle_Float_Like_Property_Names()
        {
            // Arrange
            var ton = @"{
                3.14 = 'pi',
                2.71 = 'e',
                1.618 = 'golden'
            }";

            // Act
            var document = _parser.Parse(ton);

            // Assert
            // Float-like numbers (3.14) are parsed as Number tokens and accepted as property names
            document.RootObject.GetProperty("3.14")?.Value.Should().Be("pi");
            document.RootObject.GetProperty("2.71")?.Value.Should().Be("e");
            document.RootObject.GetProperty("1.618")?.Value.Should().Be("golden");
        }

        // @TestID: NUM-FORMAT-002
        // Test property ordering when mixing numeric and text names
        [Fact]
        public void Should_Round_Trip_Numeric_Properties()
        {
            // Arrange
            var originalTon = @"{
                2022 = 450000000,
                2023 = 520000000,
                2024 = 380000000,
                name = 'Financial Data',
                123 = 'test'
            }";

            // Act
            var document = _parser.Parse(originalTon);
            var serialized = _serializer.SerializeDocument(document, TonSerializeOptions.Default);
            var reparsed = _parser.Parse(serialized);

            // Assert
            reparsed.RootObject.Properties.Should().HaveCount(5);
            reparsed.RootObject.GetProperty("2022")?.Value.Should().Be(450000000);
            reparsed.RootObject.GetProperty("2023")?.Value.Should().Be(520000000);
            reparsed.RootObject.GetProperty("2024")?.Value.Should().Be(380000000);
            reparsed.RootObject.GetProperty("name")?.Value.Should().Be("Financial Data");
            reparsed.RootObject.GetProperty("123")?.Value.Should().Be("test");
        }
    }
}