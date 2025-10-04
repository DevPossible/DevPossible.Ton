using System;
using System.Collections.Generic;
using System.Linq;

namespace TONfile
{
    /// <summary>
    /// Represents a schema definition for a TON class
    /// </summary>
    public class TonSchemaDefinition
    {
        /// <summary>
        /// The class name this schema applies to (case-insensitive)
        /// </summary>
        public string ClassName { get; set; }

        /// <summary>
        /// Property validation rules
        /// </summary>
        public Dictionary<string, TonPropertySchema> Properties { get; set; } = new Dictionary<string, TonPropertySchema>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Creates a new schema definition
        /// </summary>
        public TonSchemaDefinition(string className)
        {
            ClassName = className ?? throw new ArgumentNullException(nameof(className));
        }

        /// <summary>
        /// Adds a property schema
        /// </summary>
        public void AddProperty(string path, TonPropertySchema propertySchema)
        {
            Properties[path] = propertySchema;
        }

        /// <summary>
        /// Gets a property schema by path
        /// </summary>
        public TonPropertySchema? GetProperty(string path)
        {
            return Properties.TryGetValue(path, out var schema) ? schema : null;
        }
    }

    /// <summary>
    /// Represents schema for a single property
    /// </summary>
    public class TonPropertySchema
    {
        /// <summary>
        /// The property path
        /// </summary>
        public string Path { get; set; }

        /// <summary>
        /// The expected data type
        /// </summary>
        public string Type { get; set; }

        /// <summary>
        /// Validation rules for this property
        /// </summary>
        public List<TonValidationRule> Validations { get; set; } = new List<TonValidationRule>();

        /// <summary>
        /// Creates a new property schema
        /// </summary>
        public TonPropertySchema(string path, string type)
        {
            Path = path ?? throw new ArgumentNullException(nameof(path));
            Type = type ?? throw new ArgumentNullException(nameof(type));
        }

        /// <summary>
        /// Adds a validation rule
        /// </summary>
        public void AddValidation(TonValidationRule rule)
        {
            Validations.Add(rule);
        }

        /// <summary>
        /// Checks if the property is required
        /// </summary>
        public bool IsRequired => Validations.Any(v => v.Type == ValidationRuleType.Required);

        /// <summary>
        /// Checks if the property allows null
        /// </summary>
        public bool AllowsNull => !Validations.Any(v => v.Type == ValidationRuleType.NotNull);

        /// <summary>
        /// Gets the default value if defined
        /// </summary>
        public object? GetDefaultValue()
        {
            var defaultRule = Validations.FirstOrDefault(v => v.Type == ValidationRuleType.Default);
            return defaultRule?.Parameters?.FirstOrDefault();
        }
    }

    /// <summary>
    /// Represents a validation rule
    /// </summary>
    public class TonValidationRule
    {
        /// <summary>
        /// The type of validation
        /// </summary>
        public ValidationRuleType Type { get; set; }

        /// <summary>
        /// Parameters for the validation
        /// </summary>
        public object?[]? Parameters { get; set; }

        /// <summary>
        /// Creates a new validation rule
        /// </summary>
        public TonValidationRule(ValidationRuleType type, params object?[] parameters)
        {
            Type = type;
            Parameters = parameters;
        }
    }

    /// <summary>
    /// Types of validation rules
    /// </summary>
    public enum ValidationRuleType
    {
        // Universal validations
        Required,
        NotNull,
        Default,
        DefaultWhenNull,
        DefaultWhenEmpty,
        DefaultWhenInvalid,

        // String validations
        MinLength,
        MaxLength,
        Length,
        Pattern,
        Format,
        Enum,

        // Numeric validations
        Min,
        Max,
        Range,
        Positive,
        Negative,
        NonNegative,
        NonPositive,
        MultipleOf,

        // Integer-specific
        Bits,
        Unsigned,
        Signed,

        // GUID validations
        GuidFormat,
        Version,

        // Date validations
        After,
        Before,
        Between,
        Future,
        Past,

        // Enum validations
        AllowIndex,
        StrictIndex,

        // Collection validations
        MinCount,
        MaxCount,
        Count,

        // Array-specific validations
        NonEmpty,
        Unique,
        Sorted,
        AllowDuplicates
    }

    /// <summary>
    /// Collection of schema definitions
    /// </summary>
    public class TonSchemaCollection
    {
        private readonly Dictionary<string, TonSchemaDefinition> _schemas = new Dictionary<string, TonSchemaDefinition>(StringComparer.OrdinalIgnoreCase);
        private readonly Dictionary<string, TonEnumDefinition> _enums = new Dictionary<string, TonEnumDefinition>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Adds a schema definition
        /// </summary>
        public void AddSchema(TonSchemaDefinition schema)
        {
            _schemas[schema.ClassName] = schema;
        }

        /// <summary>
        /// Gets a schema by class name
        /// </summary>
        public TonSchemaDefinition? GetSchema(string className)
        {
            return _schemas.TryGetValue(className, out var schema) ? schema : null;
        }

        /// <summary>
        /// Adds an enum definition
        /// </summary>
        public void AddEnum(TonEnumDefinition enumDef)
        {
            _enums[enumDef.Name] = enumDef;
        }

        /// <summary>
        /// Gets an enum definition by name
        /// </summary>
        public TonEnumDefinition? GetEnum(string name)
        {
            return _enums.TryGetValue(name, out var enumDef) ? enumDef : null;
        }

        /// <summary>
        /// Gets all schema definitions
        /// </summary>
        public IEnumerable<TonSchemaDefinition> Schemas => _schemas.Values;

        /// <summary>
        /// Gets all enum definitions
        /// </summary>
        public IEnumerable<TonEnumDefinition> Enums => _enums.Values;
    }
}
