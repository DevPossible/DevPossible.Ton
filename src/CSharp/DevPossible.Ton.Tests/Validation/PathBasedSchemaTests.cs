using Xunit;
using FluentAssertions;
using DevPossible.Ton;
using System.Linq;

namespace DevPossible.Ton.Tests.Validation
{
    public class PathBasedSchemaTests
    {
        // @TestID: VAL-NESTED-001
        // Test validation of nested object structures
        [Fact]
        public void Should_Validate_Deep_Nested_Path_Properties()
        {
            // Arrange
            var ton = @"
{(user)
    name = ""John"",
    email = ""john@example.com"",

    details = {
        bio = ""Software engineer"",
        avatar = ""avatar.jpg""
    }
}

#! {(user)
    /name = string(required, minLength(1), maxLength(100)),
    /email = string(required, format(email)),
    /details/bio = string(maxLength(1000)),
    /details/avatar = string(maxLength(255))
}
";
            var parser = new TonParser();
            var document = parser.Parse(ton);
            var validator = new TonValidator(document.Schemas);

            // Act
            var result = validator.Validate(document);

            // Assert
            result.IsValid.Should().BeTrue();
            result.Errors.Should().BeEmpty();
        }

        // @TestID: VAL-NESTED-001
        // Test validation of nested object structures
        [Fact]
        public void Should_Fail_Validation_For_Missing_Nested_Required_Property()
        {
            // Arrange
            var ton = @"
{(user)
    name = ""John"",

    details = {
        avatar = ""avatar.jpg""
    }
}

#! {(user)
    /name = string(required),
    /details/bio = string(required),
    /details/avatar = string(required)
}
";
            var parser = new TonParser();
            var document = parser.Parse(ton);
            var validator = new TonValidator(document.Schemas);

            // Act
            var result = validator.Validate(document);

            // Assert
            result.IsValid.Should().BeFalse();
            result.Errors.Should().HaveCount(1);
            result.Errors[0].Message.Should().Contain("Required property 'bio' is missing");
            result.Errors[0].Path.Should().Be("/details/bio");
        }

        // @TestID: VAL-EDGE-001
        // Test validation with numeric property names in schema
        [Fact]
        public void Should_Validate_Numeric_Property_Paths()
        {
            // Arrange
            var ton = @"
{(inventory)
    123 = ""Special numbered item"",
    42name = ""Answer item"",
    2024data = [1.5, 2.0, 3.5]
}

#! {(inventory)
    /123 = string(maxLength(50)),
    /42name = string(minLength(5)),
    /2024data = array:float(maxCount(5))
}
";
            var parser = new TonParser();
            var document = parser.Parse(ton);
            var validator = new TonValidator(document.Schemas);

            // Act
            var result = validator.Validate(document);

            // Assert
            result.IsValid.Should().BeTrue();
            result.Errors.Should().BeEmpty();
        }

        // @TestID: VAL-BASIC-008
        // Test validation of array element type constraints
        [Fact]
        public void Should_Validate_Array_With_BaseType()
        {
            // Arrange
            var ton = @"
{(project)
    tags = [""javascript"", ""typescript"", ""nodejs""],
    scores = [85.5, 92.0, 78.5],
    flags = [true, false, true]
}

#! {(project)
    /tags = array:string(minCount(1), maxCount(10)),
    /scores = array:float(minCount(1), range(0.0, 100.0)),
    /flags = array:boolean(maxCount(5))
}
";
            var parser = new TonParser();
            var document = parser.Parse(ton);
            var validator = new TonValidator(document.Schemas);

            // Act
            var result = validator.Validate(document);

            // Assert
            result.IsValid.Should().BeTrue();
            result.Errors.Should().BeEmpty();
        }

        // @TestID: VAL-BASIC-008
        // Test validation of array element type constraints
        [Fact]
        public void Should_Fail_Array_Validation_With_Wrong_Element_Type()
        {
            // Arrange
            var schemas = new TonSchemaCollection();
            var schema = new TonSchemaDefinition("test");

            var propSchema = new TonPropertySchema("/numbers", "array:int");
            propSchema.AddValidation(new TonValidationRule(ValidationRuleType.Required));
            schema.AddProperty("/numbers", propSchema);

            schemas.AddSchema(schema);

            var obj = new TonObject { ClassName = "test" };
            obj.SetProperty("numbers", TonValue.From(new[] {
                TonValue.From(1),
                TonValue.From("not a number"),
                TonValue.From(3)
            }));

            var validator = new TonValidator(schemas);

            // Act
            var result = validator.ValidateObject(obj, schemas);

            // Assert
            result.IsValid.Should().BeFalse();
            result.Errors[0].Message.Should().Contain("Type mismatch");
        }

        // @TestID: VAL-COMPLEX-001
        // Test validation using path-based schema rules
        [Fact]
        public void Should_Validate_Complex_Nested_Structure()
        {
            // Arrange
            var ton = @"
{(company)
    name = ""TechCorp"",
    employees = 250,

    headquarters = {
        address = ""123 Tech Street"",
        city = ""San Francisco"",

        coordinates = {
            latitude = 37.7749,
            longitude = -122.4194
        }
    },

    departments = [
        {(dept) name = ""Engineering"", headCount = 120},
        {(dept) name = ""Sales"", headCount = 80}
    ]
}

#! {(company)
    /name = string(required, maxLength(100)),
    /employees = int(min(1), max(10000)),
    /headquarters/address = string(required),
    /headquarters/city = string(required),
    /headquarters/coordinates/latitude = float(range(-90.0, 90.0)),
    /headquarters/coordinates/longitude = float(range(-180.0, 180.0)),
    /departments = array:object(minCount(1))
}
";
            var parser = new TonParser();
            var document = parser.Parse(ton);
            var validator = new TonValidator(document.Schemas);

            // Act
            var result = validator.Validate(document);

            // Assert
            result.IsValid.Should().BeTrue();
            result.Errors.Should().BeEmpty();
        }

        // @TestID: VAL-COMPLEX-002
        // Test application of default values during validation
        [Fact]
        public void Should_Validate_Default_Values_With_Paths()
        {
            // Arrange
            var ton = @"
{(config)
    name = ""MyApp"",

    settings = {
        theme = ""dark""
    }
}

#! {(config)
    /name = string(required),
    /version = string(default(""1.0.0"")),
    /settings/theme = string(default(""light"")),
    /settings/language = string(default(""en""))
}
";
            var parser = new TonParser();
            var document = parser.Parse(ton);

            // The validator should apply defaults, but we're just testing validation here
            var validator = new TonValidator(document.Schemas);
            var result = validator.Validate(document);

            // Assert - validation should pass even with missing properties that have defaults
            result.IsValid.Should().BeTrue();
        }

        // @TestID: VAL-BASIC-005
        // Test validation of enum value constraints
        [Fact]
        public void Should_Validate_Enum_And_EnumSet_With_Paths()
        {
            // Arrange
            var ton = @"
{(user)
    status = |active|,

    preferences = {
        role = |admin|,
        permissions = |read|write|delete|
    }
}

#! enum(userStatus) [active, inactive, suspended]
#! enum(userRole) [admin, user, guest]
#! enumSet(userPermissions) [read, write, delete, execute]

#! {(user)
    /status = enum:userStatus(required),
    /preferences/role = enum:userRole(required),
    /preferences/permissions = enumSet:userPermissions(required)
}
";
            var parser = new TonParser();
            var document = parser.Parse(ton);
            var validator = new TonValidator(document.Schemas);

            // Act
            var result = validator.Validate(document);

            // Assert
            result.IsValid.Should().BeTrue();
            result.Errors.Should().BeEmpty();
        }

        // @TestID: VAL-BASIC-007
        // Test validation of array size constraints
        [Fact]
        public void Should_Support_Array_Element_Validation()
        {
            // Arrange
            var ton = @"
{(data)
    emails = [""valid@example.com"", ""also.valid@test.org""],
    codes = [""ABC"", ""DEFG"", ""HI""]
}

#! {(data)
    /emails = array:string(maxCount(10), format(email)),
    /codes = array:string(minLength(2), maxLength(5))
}
";
            var parser = new TonParser();
            var document = parser.Parse(ton);
            var validator = new TonValidator(document.Schemas);

            // Act
            var result = validator.Validate(document);

            // Assert
            result.IsValid.Should().BeTrue();
        }

        // @TestID: VAL-BASIC-009
        // Test validation of unique value constraint in arrays
        [Fact]
        public void Should_Validate_Array_With_Unique_Constraint()
        {
            // Arrange
            var schemas = new TonSchemaCollection();
            var schema = new TonSchemaDefinition("test");

            var propSchema = new TonPropertySchema("/tags", "array:string");
            propSchema.AddValidation(new TonValidationRule(ValidationRuleType.Unique));
            schema.AddProperty("/tags", propSchema);

            schemas.AddSchema(schema);

            // Test with duplicates
            var obj1 = new TonObject { ClassName = "test" };
            obj1.SetProperty("tags", TonValue.From(new[] {
                TonValue.From("tag1"),
                TonValue.From("tag2"),
                TonValue.From("tag1") // Duplicate
            }));

            var validator = new TonValidator(schemas);
            var result1 = validator.ValidateObject(obj1, schemas);

            // Assert - should fail with duplicates
            result1.IsValid.Should().BeFalse();
            result1.Errors[0].Message.Should().Contain("unique");

            // Test without duplicates
            var obj2 = new TonObject { ClassName = "test" };
            obj2.SetProperty("tags", TonValue.From(new[] {
                TonValue.From("tag1"),
                TonValue.From("tag2"),
                TonValue.From("tag3")
            }));

            var result2 = validator.ValidateObject(obj2, schemas);

            // Assert - should pass without duplicates
            result2.IsValid.Should().BeTrue();
        }

        // @TestID: VAL-BASIC-007
        // Test validation of array size constraints
        [Fact]
        public void Should_Validate_Array_With_Sorted_Constraint()
        {
            // Arrange
            var schemas = new TonSchemaCollection();
            var schema = new TonSchemaDefinition("test");

            var propSchema = new TonPropertySchema("/values", "array:int");
            propSchema.AddValidation(new TonValidationRule(ValidationRuleType.Sorted));
            schema.AddProperty("/values", propSchema);

            schemas.AddSchema(schema);

            // Test with unsorted array
            var obj1 = new TonObject { ClassName = "test" };
            obj1.SetProperty("values", TonValue.From(new[] {
                TonValue.From(3),
                TonValue.From(1),
                TonValue.From(2)
            }));

            var validator = new TonValidator(schemas);
            var result1 = validator.ValidateObject(obj1, schemas);

            // Assert - should fail when not sorted
            result1.IsValid.Should().BeFalse();
            result1.Errors[0].Message.Should().Contain("sorted");

            // Test with sorted array
            var obj2 = new TonObject { ClassName = "test" };
            obj2.SetProperty("values", TonValue.From(new[] {
                TonValue.From(1),
                TonValue.From(2),
                TonValue.From(3)
            }));

            var result2 = validator.ValidateObject(obj2, schemas);

            // Assert - should pass when sorted
            result2.IsValid.Should().BeTrue();
        }

        // @TestID: VAL-COMPLEX-005
        // Test validation with wildcard path matching
        [Fact]
        public void Should_Handle_Missing_Intermediate_Path_Segments()
        {
            // Arrange
            var ton = @"
{(user)
    name = ""John""
}

#! {(user)
    /name = string(required),
    /details/bio/full = string(maxLength(1000))
}
";
            var parser = new TonParser();
            var document = parser.Parse(ton);
            var validator = new TonValidator(document.Schemas);

            // Act
            var result = validator.Validate(document);

            // Assert - should pass because the deep nested property is optional
            result.IsValid.Should().BeTrue();
        }

        // @TestID: VAL-COMPLEX-001
        // Test validation using path-based schema rules
        [Fact]
        public void Should_Validate_Multiple_Path_Levels()
        {
            // Arrange
            var ton = @"
{(api)
    v1 = {
        users = {
            endpoints = {
                get = ""/api/v1/users"",
                post = ""/api/v1/users""
            }
        }
    }
}

#! {(api)
    /v1/users/endpoints/get = string(required, pattern(""^/api/.*"")),
    /v1/users/endpoints/post = string(required, pattern(""^/api/.*""))
}
";
            var parser = new TonParser();
            var document = parser.Parse(ton);
            var validator = new TonValidator(document.Schemas);

            // Act
            var result = validator.Validate(document);

            // Assert
            result.IsValid.Should().BeTrue();
            result.Errors.Should().BeEmpty();
        }
    }
}