using System;
using System.Collections.Generic;
using System.Linq;

namespace DevPossible.Ton
{
    /// <summary>
    /// Represents a TON document containing the parsed content and metadata
    /// </summary>
    public class TonDocument
    {
        /// <summary>
        /// The document header attributes
        /// </summary>
        public TonHeader? Header { get; set; }

        /// <summary>
        /// The root object of the document
        /// </summary>
        public TonObject RootObject { get; set; }

        /// <summary>
        /// Schema definitions embedded in the document
        /// </summary>
        public TonSchemaCollection? Schemas { get; set; }

        /// <summary>
        /// The original source of the document (file path or identifier)
        /// </summary>
        public string? Source { get; set; }

        /// <summary>
        /// Creates a new TON document with an empty root object
        /// </summary>
        public TonDocument()
        {
            RootObject = new TonObject();
        }

        /// <summary>
        /// Creates a new TON document with the specified root object
        /// </summary>
        public TonDocument(TonObject rootObject)
        {
            RootObject = rootObject ?? throw new ArgumentNullException(nameof(rootObject));
        }

        /// <summary>
        /// Validates the document against its embedded or referenced schemas
        /// </summary>
        /// <returns>Validation results</returns>
        public TonValidationResult Validate()
        {
            if (Schemas == null && Header?.SchemaFile == null)
            {
                return new TonValidationResult { IsValid = true };
            }

            var validator = new TonValidator(Schemas);
            return validator.Validate(this);
        }

        /// <summary>
        /// Gets a value from the document using a path expression
        /// </summary>
        /// <param name="path">Path expression (e.g., "/person/address/street")</param>
        /// <returns>The value at the specified path, or null if not found</returns>
        public object? GetValue(string path)
        {
            if (string.IsNullOrWhiteSpace(path))
                return null;

            var segments = path.Trim('/').Split('/', StringSplitOptions.RemoveEmptyEntries);
            return RootObject.GetValue(segments);
        }

        /// <summary>
        /// Sets a value in the document using a path expression
        /// </summary>
        /// <param name="path">Path expression (e.g., "/person/address/street")</param>
        /// <param name="value">The value to set</param>
        public void SetValue(string path, object? value)
        {
            if (string.IsNullOrWhiteSpace(path))
                throw new ArgumentException("Path cannot be empty", nameof(path));

            var segments = path.Trim('/').Split('/', StringSplitOptions.RemoveEmptyEntries);
            RootObject.SetValue(segments, value);
        }

        /// <summary>
        /// Converts the document to a typed object
        /// </summary>
        /// <typeparam name="T">The target type</typeparam>
        /// <returns>The converted object</returns>
        public T ToObject<T>() where T : new()
        {
            return RootObject.ToObject<T>();
        }

        /// <summary>
        /// Creates a TON document from an object
        /// </summary>
        /// <param name="obj">The object to convert</param>
        /// <returns>A new TON document</returns>
        public static TonDocument FromObject(object obj)
        {
            if (obj == null)
                throw new ArgumentNullException(nameof(obj));

            var rootObject = TonObject.FromObject(obj);
            return new TonDocument(rootObject);
        }

        /// <summary>
        /// Serializes the document to a TON string using default options
        /// </summary>
        /// <returns>The serialized TON document</returns>
        public override string ToString()
        {
            var serializer = new TonSerializer();
            return serializer.Serialize(this);
        }
    }

    /// <summary>
    /// Represents the document header with metadata
    /// </summary>
    public class TonHeader
    {
        /// <summary>
        /// TON version specified in the header
        /// </summary>
        public string? TonVersion { get; set; }

        /// <summary>
        /// External schema file reference
        /// </summary>
        public string? SchemaFile { get; set; }

        /// <summary>
        /// Additional custom attributes
        /// </summary>
        public Dictionary<string, object?> Attributes { get; set; } = new Dictionary<string, object?>();

        /// <summary>
        /// Gets or sets an attribute value
        /// </summary>
        public object? this[string key]
        {
            get => Attributes.TryGetValue(key, out var value) ? value : null;
            set => Attributes[key] = value;
        }
    }
}
