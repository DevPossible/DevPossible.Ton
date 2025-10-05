using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace DevPossible.Ton
{
    /// <summary>
    /// Validator for TON documents and objects
    /// </summary>
    public class TonValidator
    {
        private readonly TonSchemaCollection? _schemas;

        /// <summary>
        /// Creates a new validator with the given schemas
        /// </summary>
        public TonValidator(TonSchemaCollection? schemas = null)
        {
            _schemas = schemas;
        }

        /// <summary>
        /// Validates a TON document
        /// </summary>
        public TonValidationResult Validate(TonDocument document)
        {
            var result = new TonValidationResult { IsValid = true };

            if (_schemas == null && document.Schemas == null)
            {
                // No schemas to validate against
                return result;
            }

            var schemas = _schemas ?? document.Schemas;
            ValidateObject(document.RootObject, schemas!, result, "/");

            return result;
        }

        /// <summary>
        /// Validates a TON object
        /// </summary>
        public TonValidationResult ValidateObject(TonObject obj, TonSchemaCollection schemas)
        {
            var result = new TonValidationResult { IsValid = true };
            ValidateObject(obj, schemas, result, "/");
            return result;
        }

        private void ValidateObject(TonObject obj, TonSchemaCollection schemas, TonValidationResult result, string path)
        {
            if (obj.ClassName != null)
            {
                var schema = schemas.GetSchema(obj.ClassName);
                if (schema != null)
                {
                    ValidateAgainstSchema(obj, schema, schemas, result, path);
                }
            }

            // Validate child objects recursively
            foreach (var child in obj.Children)
            {
                var childPath = path + (child.ClassName ?? "object") + "/";
                ValidateObject(child, schemas, result, childPath);
            }
        }

        private void ValidateAgainstSchema(TonObject obj, TonSchemaDefinition schema, TonSchemaCollection schemas,
            TonValidationResult result, string path)
        {
            // Validate all properties defined in the schema
            foreach (var propSchema in schema.Properties.Values)
            {
                var schemaPath = propSchema.Path;
                var value = GetValueAtPath(obj, schemaPath);
                var fullPath = path + schemaPath.TrimStart('/');

                // Check if required property is missing
                if (propSchema.IsRequired && (value == null || value.IsUndefined))
                {
                    // Use the simple property name for backwards compatibility with existing tests
                    var simpleName = schemaPath.TrimStart('/').Split('/').LastOrDefault() ?? schemaPath;
                    result.AddError($"Required property '{simpleName}' is missing", fullPath);
                    continue;
                }

                // Validate property if it exists
                if (value != null && !value.IsUndefined)
                {
                    ValidateProperty(value, propSchema, schemas, result, fullPath);
                }
            }
        }

        private TonValue? GetValueAtPath(TonObject obj, string path)
        {
            // Remove leading slash if present
            path = path.TrimStart('/');

            // Split path into segments
            var segments = path.Split('/');
            TonObject? current = obj;
            TonValue? value = null;

            for (int i = 0; i < segments.Length; i++)
            {
                var segment = segments[i];

                if (current == null)
                    return null;

                // Get property from current object
                value = current.GetProperty(segment);

                // If this is not the last segment, we need to traverse deeper
                if (i < segments.Length - 1)
                {
                    // Check if value is an object we can traverse into
                    if (value?.Value is TonObject nestedObj)
                    {
                        current = nestedObj;
                    }
                    else
                    {
                        // Can't traverse deeper - path doesn't exist
                        return null;
                    }
                }
            }

            return value;
        }

        private void ValidateProperty(TonValue value, TonPropertySchema schema, TonSchemaCollection schemas,
            TonValidationResult result, string path)
        {
            // Check NotNull validation first if present
            var hasNotNullRule = schema.Validations.Any(r => r.Type == ValidationRuleType.NotNull);

            // Type validation - allow null if NotNull validation will check it
            if (!ValidateType(value, schema.Type, schemas, allowNullForNotNullRule: hasNotNullRule))
            {
                // Only report type mismatch if it's not a null issue that NotNull will handle
                if (!(value.Type == TonValueType.Null && hasNotNullRule))
                {
                    result.AddError($"Type mismatch: expected {schema.Type}, got {value.Type}", path);
                    return;
                }
            }

            // Apply validation rules
            foreach (var rule in schema.Validations)
            {
                ValidateRule(value, rule, result, path);
            }
        }

        private bool ValidateType(TonValue value, string expectedType, TonSchemaCollection schemas, bool allowNullForNotNullRule = false)
        {
            // Allow null values if NotNull rule will validate them
            if (allowNullForNotNullRule && value.Type == TonValueType.Null)
                return true;

            switch (expectedType.ToLowerInvariant())
            {
                case "string":
                    return value.Type == TonValueType.String;
                case "int":
                case "integer":
                    return value.Type == TonValueType.Integer;
                case "float":
                case "double":
                case "decimal":
                    return value.Type == TonValueType.Float || value.Type == TonValueType.Integer;
                case "boolean":
                case "bool":
                    return value.Type == TonValueType.Boolean;
                case "null":
                    return value.Type == TonValueType.Null;
                case "undefined":
                    return value.Type == TonValueType.Undefined;
                case "guid":
                case "uuid":
                    return value.Type == TonValueType.Guid;
                case "date":
                case "datetime":
                    return value.Type == TonValueType.Date;
                case "array":
                    return value.Type == TonValueType.Array;
                default:
                    // Check for array with base type (array:baseType)
                    if (expectedType.StartsWith("array:"))
                    {
                        if (value.Type != TonValueType.Array)
                            return false;

                        // Validate base type for all elements
                        var baseType = expectedType.Substring(6);
                        var array = value.ToArray();
                        if (array != null)
                        {
                            foreach (var element in array)
                            {
                                if (!ValidateType(element, baseType, schemas))
                                    return false;
                            }
                        }
                        return true;
                    }
                    // Check if it's an enum type
                    if (expectedType.StartsWith("enum:"))
                    {
                        var enumName = expectedType.Substring(5);
                        var enumDef = schemas.GetEnum(enumName);
                        if (enumDef != null && !enumDef.IsEnumSet)
                        {
                            return value.Type == TonValueType.Enum && ValidateEnumValue(value, enumDef);
                        }
                    }
                    else if (expectedType.StartsWith("enumSet:"))
                    {
                        var enumName = expectedType.Substring(8);
                        var enumDef = schemas.GetEnum(enumName);
                        if (enumDef != null && enumDef.IsEnumSet)
                        {
                            return value.Type == TonValueType.EnumSet && ValidateEnumSetValue(value, enumDef);
                        }
                    }
                    return true; // Unknown type, assume valid
            }
        }

        private bool ValidateEnumValue(TonValue value, TonEnumDefinition enumDef)
        {
            if (value.Value is TonEnum enumValue)
            {
                return enumDef.IsValidValue(enumValue.Value);
            }
            return false;
        }

        private bool ValidateEnumSetValue(TonValue value, TonEnumDefinition enumDef)
        {
            if (value.Value is TonEnumSet enumSet)
            {
                return enumSet.Values.All(v => enumDef.IsValidValue(v.Value));
            }
            return false;
        }

        private void ValidateRule(TonValue value, TonValidationRule rule, TonValidationResult result, string path)
        {
            switch (rule.Type)
            {
                case ValidationRuleType.Required:
                    if (value.IsUndefined)
                        result.AddError("Value is required", path);
                    break;

                case ValidationRuleType.NotNull:
                    if (value.IsNull)
                        result.AddError("Value cannot be null", path);
                    break;

                case ValidationRuleType.MinLength:
                    if (value.Type == TonValueType.String && rule.Parameters?.Length > 0)
                    {
                        var minLength = Convert.ToInt32(rule.Parameters[0]);
                        var str = value.ToString() ?? "";
                        if (str.Length < minLength)
                            result.AddError($"String length must be at least {minLength}", path);
                    }
                    break;

                case ValidationRuleType.MaxLength:
                    if (value.Type == TonValueType.String && rule.Parameters?.Length > 0)
                    {
                        var maxLength = Convert.ToInt32(rule.Parameters[0]);
                        var str = value.ToString() ?? "";
                        if (str.Length > maxLength)
                            result.AddError($"String length must be at most {maxLength}", path);
                    }
                    break;

                case ValidationRuleType.Min:
                    if ((value.Type == TonValueType.Integer || value.Type == TonValueType.Float) && rule.Parameters?.Length > 0)
                    {
                        var min = Convert.ToDouble(rule.Parameters[0]);
                        if (value.ToDouble() < min)
                            result.AddError($"Value must be at least {min}", path);
                    }
                    break;

                case ValidationRuleType.Max:
                    if ((value.Type == TonValueType.Integer || value.Type == TonValueType.Float) && rule.Parameters?.Length > 0)
                    {
                        var max = Convert.ToDouble(rule.Parameters[0]);
                        if (value.ToDouble() > max)
                            result.AddError($"Value must be at most {max}", path);
                    }
                    break;

                case ValidationRuleType.Pattern:
                    if (value.Type == TonValueType.String && rule.Parameters?.Length > 0)
                    {
                        var pattern = rule.Parameters[0]?.ToString();
                        if (!string.IsNullOrEmpty(pattern))
                        {
                            var regex = new Regex(pattern);
                            var str = value.ToString() ?? "";
                            if (!regex.IsMatch(str))
                                result.AddError($"Value does not match pattern: {pattern}", path);
                        }
                    }
                    break;

                // Array-specific validations
                case ValidationRuleType.MinCount:
                    if (value.Type == TonValueType.Array && rule.Parameters?.Length > 0)
                    {
                        var minCount = Convert.ToInt32(rule.Parameters[0]);
                        var count = value.GetArrayCount();
                        if (count < minCount)
                            result.AddError($"Array must have at least {minCount} elements", path);
                    }
                    break;

                case ValidationRuleType.MaxCount:
                    if (value.Type == TonValueType.Array && rule.Parameters?.Length > 0)
                    {
                        var maxCount = Convert.ToInt32(rule.Parameters[0]);
                        var count = value.GetArrayCount();
                        if (count > maxCount)
                            result.AddError($"Array must have at most {maxCount} elements", path);
                    }
                    break;

                case ValidationRuleType.Count:
                    if (value.Type == TonValueType.Array && rule.Parameters?.Length > 0)
                    {
                        var expectedCount = Convert.ToInt32(rule.Parameters[0]);
                        var count = value.GetArrayCount();
                        if (count != expectedCount)
                            result.AddError($"Array must have exactly {expectedCount} elements", path);
                    }
                    break;

                case ValidationRuleType.NonEmpty:
                    if (value.Type == TonValueType.Array)
                    {
                        if (value.GetArrayCount() == 0)
                            result.AddError("Array must not be empty", path);
                    }
                    break;

                case ValidationRuleType.Unique:
                    if (value.Type == TonValueType.Array)
                    {
                        var array = value.ToArray();
                        if (array != null)
                        {
                            var seen = new HashSet<string>();
                            for (int i = 0; i < array.Count; i++)
                            {
                                var elementStr = array[i].ToString() ?? "null";
                                if (!seen.Add(elementStr))
                                {
                                    result.AddError($"Array must contain unique elements, duplicate found: {elementStr}", path);
                                    break;
                                }
                            }
                        }
                    }
                    break;

                case ValidationRuleType.Sorted:
                    if (value.Type == TonValueType.Array)
                    {
                        var array = value.ToArray();
                        if (array != null && array.Count > 1)
                        {
                            for (int i = 1; i < array.Count; i++)
                            {
                                var prev = array[i - 1];
                                var curr = array[i];

                                // Compare based on type
                                bool outOfOrder = false;
                                if (prev.Type == TonValueType.Integer && curr.Type == TonValueType.Integer)
                                {
                                    outOfOrder = prev.ToInt64() > curr.ToInt64();
                                }
                                else if ((prev.Type == TonValueType.Float || prev.Type == TonValueType.Integer) &&
                                         (curr.Type == TonValueType.Float || curr.Type == TonValueType.Integer))
                                {
                                    outOfOrder = prev.ToDouble() > curr.ToDouble();
                                }
                                else if (prev.Type == TonValueType.String && curr.Type == TonValueType.String)
                                {
                                    outOfOrder = string.Compare(prev.ToString(), curr.ToString(), StringComparison.Ordinal) > 0;
                                }

                                if (outOfOrder)
                                {
                                    result.AddError($"Array must be sorted, element at index {i} is out of order", path);
                                    break;
                                }
                            }
                        }
                    }
                    break;

                case ValidationRuleType.AllowDuplicates:
                    // This is a positive validation, no check needed (duplicates are allowed by default)
                    break;

                // Add more validation rule implementations as needed
            }
        }
    }

    /// <summary>
    /// Result of TON validation
    /// </summary>
    public class TonValidationResult
    {
        /// <summary>
        /// Whether the validation passed
        /// </summary>
        public bool IsValid { get; set; }

        /// <summary>
        /// List of validation errors
        /// </summary>
        public List<TonValidationError> Errors { get; } = new List<TonValidationError>();

        /// <summary>
        /// List of validation warnings
        /// </summary>
        public List<TonValidationWarning> Warnings { get; } = new List<TonValidationWarning>();

        /// <summary>
        /// Adds a validation error
        /// </summary>
        public void AddError(string message, string path)
        {
            IsValid = false;
            Errors.Add(new TonValidationError(message, path));
        }

        /// <summary>
        /// Adds a validation warning
        /// </summary>
        public void AddWarning(string message, string path)
        {
            Warnings.Add(new TonValidationWarning(message, path));
        }
    }

    /// <summary>
    /// Represents a validation error
    /// </summary>
    public class TonValidationError
    {
        /// <summary>
        /// Error message
        /// </summary>
        public string Message { get; }

        /// <summary>
        /// Path to the property that failed validation
        /// </summary>
        public string Path { get; }

        public TonValidationError(string message, string path)
        {
            Message = message;
            Path = path;
        }

        public override string ToString() => $"{Path}: {Message}";
    }

    /// <summary>
    /// Represents a validation warning
    /// </summary>
    public class TonValidationWarning
    {
        /// <summary>
        /// Warning message
        /// </summary>
        public string Message { get; }

        /// <summary>
        /// Path to the property that triggered the warning
        /// </summary>
        public string Path { get; }

        public TonValidationWarning(string message, string path)
        {
            Message = message;
            Path = path;
        }

        public override string ToString() => $"{Path}: {Message}";
    }
}