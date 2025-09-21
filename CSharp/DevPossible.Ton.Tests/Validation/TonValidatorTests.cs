using Xunit;
using FluentAssertions;
using TONfile;
using System.Linq;

namespace TONfile.Tests.Validation
{
    public class TonValidatorTests
    {
        [Fact]
        public void Should_Validate_Required_Properties()
        {
            // Arrange
            var schemas = new TonSchemaCollection();
            var userSchema = new TonSchemaDefinition("user");

            var nameSchema = new TonPropertySchema("/name", "string");
            nameSchema.AddValidation(new TonValidationRule(ValidationRuleType.Required));
            userSchema.AddProperty("/name", nameSchema);

            schemas.AddSchema(userSchema);

            var obj = new TonObject { ClassName = "user" };
            // Missing required 'name' property

            var validator = new TonValidator(schemas);

            // Act
            var result = validator.ValidateObject(obj, schemas);

            // Assert
            result.IsValid.Should().BeFalse();
            result.Errors.Should().HaveCount(1);
            result.Errors[0].Message.Should().Contain("Required property 'name' is missing");
        }

        [Fact]
        public void Should_Validate_NotNull_Constraint()
        {
            // Arrange
            var schemas = new TonSchemaCollection();
            var schema = new TonSchemaDefinition("test");

            var propSchema = new TonPropertySchema("/value", "string");
            propSchema.AddValidation(new TonValidationRule(ValidationRuleType.NotNull));
            schema.AddProperty("/value", propSchema);

            schemas.AddSchema(schema);

            var obj = new TonObject { ClassName = "test" };
            obj.SetProperty("value", new TonValue(null, TonValueType.Null));

            var validator = new TonValidator(schemas);

            // Act
            var result = validator.ValidateObject(obj, schemas);

            // Assert
            result.IsValid.Should().BeFalse();
            result.Errors[0].Message.Should().Contain("Value cannot be null");
        }

        [Fact]
        public void Should_Validate_String_Length_Constraints()
        {
            // Arrange
            var schemas = new TonSchemaCollection();
            var schema = new TonSchemaDefinition("test");

            var nameSchema = new TonPropertySchema("/name", "string");
            nameSchema.AddValidation(new TonValidationRule(ValidationRuleType.MinLength, 3));
            nameSchema.AddValidation(new TonValidationRule(ValidationRuleType.MaxLength, 10));
            schema.AddProperty("/name", nameSchema);

            schemas.AddSchema(schema);

            var validator = new TonValidator(schemas);

            // Test too short
            var obj1 = new TonObject { ClassName = "test" };
            obj1.SetProperty("name", TonValue.From("AB"));

            var result1 = validator.ValidateObject(obj1, schemas);
            result1.IsValid.Should().BeFalse();
            result1.Errors[0].Message.Should().Contain("at least 3");

            // Test too long
            var obj2 = new TonObject { ClassName = "test" };
            obj2.SetProperty("name", TonValue.From("ThisNameIsTooLong"));

            var result2 = validator.ValidateObject(obj2, schemas);
            result2.IsValid.Should().BeFalse();
            result2.Errors[0].Message.Should().Contain("at most 10");

            // Test valid length
            var obj3 = new TonObject { ClassName = "test" };
            obj3.SetProperty("name", TonValue.From("Valid"));

            var result3 = validator.ValidateObject(obj3, schemas);
            result3.IsValid.Should().BeTrue();
        }

        [Fact]
        public void Should_Validate_Numeric_Range_Constraints()
        {
            // Arrange
            var schemas = new TonSchemaCollection();
            var schema = new TonSchemaDefinition("test");

            var ageSchema = new TonPropertySchema("/age", "int");
            ageSchema.AddValidation(new TonValidationRule(ValidationRuleType.Min, 0));
            ageSchema.AddValidation(new TonValidationRule(ValidationRuleType.Max, 150));
            schema.AddProperty("/age", ageSchema);

            schemas.AddSchema(schema);

            var validator = new TonValidator(schemas);

            // Test below minimum
            var obj1 = new TonObject { ClassName = "test" };
            obj1.SetProperty("age", TonValue.From(-5));

            var result1 = validator.ValidateObject(obj1, schemas);
            result1.IsValid.Should().BeFalse();
            result1.Errors[0].Message.Should().Contain("at least 0");

            // Test above maximum
            var obj2 = new TonObject { ClassName = "test" };
            obj2.SetProperty("age", TonValue.From(200));

            var result2 = validator.ValidateObject(obj2, schemas);
            result2.IsValid.Should().BeFalse();
            result2.Errors[0].Message.Should().Contain("at most 150");

            // Test valid range
            var obj3 = new TonObject { ClassName = "test" };
            obj3.SetProperty("age", TonValue.From(30));

            var result3 = validator.ValidateObject(obj3, schemas);
            result3.IsValid.Should().BeTrue();
        }

        [Fact]
        public void Should_Validate_Pattern_Constraint()
        {
            // Arrange
            var schemas = new TonSchemaCollection();
            var schema = new TonSchemaDefinition("test");

            var emailSchema = new TonPropertySchema("/email", "string");
            emailSchema.AddValidation(new TonValidationRule(ValidationRuleType.Pattern,
                @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"));
            schema.AddProperty("/email", emailSchema);

            schemas.AddSchema(schema);

            var validator = new TonValidator(schemas);

            // Test invalid email
            var obj1 = new TonObject { ClassName = "test" };
            obj1.SetProperty("email", TonValue.From("invalid-email"));

            var result1 = validator.ValidateObject(obj1, schemas);
            result1.IsValid.Should().BeFalse();
            result1.Errors[0].Message.Should().Contain("does not match pattern");

            // Test valid email
            var obj2 = new TonObject { ClassName = "test" };
            obj2.SetProperty("email", TonValue.From("user@example.com"));

            var result2 = validator.ValidateObject(obj2, schemas);
            result2.IsValid.Should().BeTrue();
        }

        [Fact]
        public void Should_Validate_Type_Mismatch()
        {
            // Arrange
            var schemas = new TonSchemaCollection();
            var schema = new TonSchemaDefinition("test");

            var ageSchema = new TonPropertySchema("/age", "int");
            schema.AddProperty("/age", ageSchema);

            schemas.AddSchema(schema);

            var obj = new TonObject { ClassName = "test" };
            obj.SetProperty("age", TonValue.From("not a number"));

            var validator = new TonValidator(schemas);

            // Act
            var result = validator.ValidateObject(obj, schemas);

            // Assert
            result.IsValid.Should().BeFalse();
            result.Errors[0].Message.Should().Contain("Type mismatch");
        }

        [Fact]
        public void Should_Validate_Enum_Values()
        {
            // Arrange
            var schemas = new TonSchemaCollection();

            var statusEnum = new TonEnumDefinition("status");
            statusEnum.Values.Add("active");
            statusEnum.Values.Add("inactive");
            statusEnum.Values.Add("pending");
            schemas.AddEnum(statusEnum);

            var schema = new TonSchemaDefinition("test");
            var statusSchema = new TonPropertySchema("/status", "enum:status");
            schema.AddProperty("/status", statusSchema);
            schemas.AddSchema(schema);

            var validator = new TonValidator(schemas);

            // Test valid enum value
            var obj1 = new TonObject { ClassName = "test" };
            obj1.SetProperty("status", TonValue.From(new TonEnum("active")));

            var result1 = validator.ValidateObject(obj1, schemas);
            result1.IsValid.Should().BeTrue();

            // Test invalid enum value
            var obj2 = new TonObject { ClassName = "test" };
            obj2.SetProperty("status", TonValue.From(new TonEnum("unknown")));

            var result2 = validator.ValidateObject(obj2, schemas);
            result2.IsValid.Should().BeFalse();

            // Test enum by index
            var obj3 = new TonObject { ClassName = "test" };
            obj3.SetProperty("status", TonValue.From(new TonEnum("1"))); // Index for "inactive"

            var result3 = validator.ValidateObject(obj3, schemas);
            result3.IsValid.Should().BeTrue();
        }

        [Fact]
        public void Should_Validate_EnumSet_Values()
        {
            // Arrange
            var schemas = new TonSchemaCollection();

            var permEnum = new TonEnumDefinition("permissions", isEnumSet: true);
            permEnum.Values.Add("read");
            permEnum.Values.Add("write");
            permEnum.Values.Add("delete");
            permEnum.Values.Add("admin");
            schemas.AddEnum(permEnum);

            var schema = new TonSchemaDefinition("test");
            var permSchema = new TonPropertySchema("/permissions", "enumSet:permissions");
            schema.AddProperty("/permissions", permSchema);
            schemas.AddSchema(schema);

            var validator = new TonValidator(schemas);

            // Test valid enum set
            var obj1 = new TonObject { ClassName = "test" };
            obj1.SetProperty("permissions", TonValue.From(new TonEnumSet("read", "write")));

            var result1 = validator.ValidateObject(obj1, schemas);
            result1.IsValid.Should().BeTrue();

            // Test with invalid value in set
            var obj2 = new TonObject { ClassName = "test" };
            obj2.SetProperty("permissions", TonValue.From(new TonEnumSet("read", "unknown")));

            var result2 = validator.ValidateObject(obj2, schemas);
            result2.IsValid.Should().BeFalse();
        }

        [Fact]
        public void Should_Validate_Nested_Objects()
        {
            // Arrange
            var schemas = new TonSchemaCollection();

            var addressSchema = new TonSchemaDefinition("address");
            var streetSchema = new TonPropertySchema("/street", "string");
            streetSchema.AddValidation(new TonValidationRule(ValidationRuleType.Required));
            addressSchema.AddProperty("/street", streetSchema);
            schemas.AddSchema(addressSchema);

            var userSchema = new TonSchemaDefinition("user");
            var nameSchema = new TonPropertySchema("/name", "string");
            nameSchema.AddValidation(new TonValidationRule(ValidationRuleType.Required));
            userSchema.AddProperty("/name", nameSchema);
            schemas.AddSchema(userSchema);

            var user = new TonObject { ClassName = "user" };
            user.SetProperty("name", TonValue.From("John"));

            var address = new TonObject { ClassName = "address" };
            // Missing required 'street' property
            user.AddChild(address);

            var validator = new TonValidator(schemas);

            // Act
            var result = validator.ValidateObject(user, schemas);

            // Assert
            result.IsValid.Should().BeFalse();
            result.Errors.Should().Contain(e => e.Message.Contains("street"));
        }

        [Fact]
        public void Should_Get_Default_Values_From_Schema()
        {
            // Arrange
            var schema = new TonPropertySchema("/status", "string");
            schema.AddValidation(new TonValidationRule(ValidationRuleType.Default, "active"));

            // Act
            var defaultValue = schema.GetDefaultValue();

            // Assert
            defaultValue.Should().Be("active");
        }

        [Fact]
        public void Should_Validate_Complex_Document()
        {
            // Arrange
            var schemas = new TonSchemaCollection();

            // Define enums
            var statusEnum = new TonEnumDefinition("status");
            statusEnum.Values.AddRange(new[] { "active", "inactive", "pending" });
            schemas.AddEnum(statusEnum);

            var roleEnum = new TonEnumDefinition("roles", isEnumSet: true);
            roleEnum.Values.AddRange(new[] { "user", "admin", "moderator" });
            schemas.AddEnum(roleEnum);

            // Define user schema
            var userSchema = new TonSchemaDefinition("user");

            var nameSchema = new TonPropertySchema("/name", "string");
            nameSchema.AddValidation(new TonValidationRule(ValidationRuleType.Required));
            nameSchema.AddValidation(new TonValidationRule(ValidationRuleType.MinLength, 2));
            nameSchema.AddValidation(new TonValidationRule(ValidationRuleType.MaxLength, 50));
            userSchema.AddProperty("/name", nameSchema);

            var emailSchema = new TonPropertySchema("/email", "string");
            emailSchema.AddValidation(new TonValidationRule(ValidationRuleType.Required));
            emailSchema.AddValidation(new TonValidationRule(ValidationRuleType.Pattern,
                @"^[^@]+@[^@]+\.[^@]+$"));
            userSchema.AddProperty("/email", emailSchema);

            var ageSchema = new TonPropertySchema("/age", "int");
            ageSchema.AddValidation(new TonValidationRule(ValidationRuleType.Min, 13));
            ageSchema.AddValidation(new TonValidationRule(ValidationRuleType.Max, 120));
            userSchema.AddProperty("/age", ageSchema);

            var statusSchema = new TonPropertySchema("/status", "enum:status");
            statusSchema.AddValidation(new TonValidationRule(ValidationRuleType.Required));
            userSchema.AddProperty("/status", statusSchema);

            var rolesSchema = new TonPropertySchema("/roles", "enumSet:roles");
            userSchema.AddProperty("/roles", rolesSchema);

            schemas.AddSchema(userSchema);

            // Create valid user object
            var user = new TonObject { ClassName = "user" };
            user.SetProperty("name", TonValue.From("John Doe"));
            user.SetProperty("email", TonValue.From("john@example.com"));
            user.SetProperty("age", TonValue.From(30));
            user.SetProperty("status", TonValue.From(new TonEnum("active")));
            user.SetProperty("roles", TonValue.From(new TonEnumSet("user", "moderator")));

            var validator = new TonValidator(schemas);

            // Act
            var result = validator.ValidateObject(user, schemas);

            // Assert
            result.IsValid.Should().BeTrue();
            result.Errors.Should().BeEmpty();
        }

        [Fact]
        public void Should_Validate_Document_With_Embedded_Schema()
        {
            // Arrange
            var parser = new TonParser();
            var tonContent = @"
{(product)
    name = 'Widget',
    price = 29.99,
    inStock = true
}

#! {(product)
    /name = string(required, minLength(1)),
    /price = float(required, min(0.01)),
    /inStock = boolean(required)
}";

            // Act
            var document = parser.Parse(tonContent);
            var result = document.Validate();

            // Assert
            result.IsValid.Should().BeTrue();
        }
    }
}