# DevPossible.Ton - C# / .NET Library

**Developed by DevPossible, LLC**  
**Contact: support@devpossible.com**

.NET Standard 2.1 implementation of the TON (Text Object Notation) parser, serializer, formatter, and validator.

## Installation

### Via NuGet Package Manager

```bash
dotnet add package DevPossible.Ton
```

### Via Package Manager Console

```powershell
Install-Package DevPossible.Ton
```

### Via PackageReference

```xml
<PackageReference Include="DevPossible.Ton" Version="0.1.6" />
```

## Quick Start

```csharp
using DevPossible.Ton;

// Parse a TON file
var parser = new TonParser();
var document = parser.ParseFile("config.ton");

// Access properties
string name = document.RootObject.GetProperty("name")?.ToString();
int port = document.RootObject.GetProperty("port")?.ToInt32() ?? 8080;

// Create a new document
var newDoc = new TonDocument();
newDoc.RootObject.SetProperty("name", TonValue.From("My App"));
newDoc.RootObject.SetProperty("port", TonValue.From(8080));

// Add nested object
var database = new TonObject { ClassName = "database" };
database.SetProperty("host", TonValue.From("localhost"));
newDoc.RootObject.AddChild(database);

// Serialize and save
var serializer = new TonSerializer();
string tonContent = serializer.SerializeDocument(newDoc, TonSerializeOptions.Pretty);
await serializer.SerializeToFileAsync(newDoc, "config.ton", TonSerializeOptions.Pretty);
```

## Features

- ✅ Full TON specification parser with async support
- ✅ Comprehensive schema validation with 30+ validation rule types
- ✅ Code formatter with compact and pretty styles
- ✅ Type annotations and hints
- ✅ Enum and EnumSet support
- ✅ Array support with mixed types
- ✅ Pretty and compact serialization
- ✅ Async file operations
- ✅ Schema collections and definitions
- ✅ Path-based schema validation
- ✅ Object conversion (C# ↔ TON)

## Advanced Usage

### Schema Validation

```csharp
using DevPossible.Ton;

// Define schema
var schemas = new TonSchemaCollection();
var userSchema = new TonSchemaDefinition("user");

// Add property validations
var nameSchema = new TonPropertySchema("/name", "string");
nameSchema.AddValidation(new TonValidationRule(ValidationRuleType.Required));
nameSchema.AddValidation(new TonValidationRule(ValidationRuleType.MaxLength, 100));
userSchema.AddProperty("/name", nameSchema);

var emailSchema = new TonPropertySchema("/email", "string");
emailSchema.AddValidation(new TonValidationRule(ValidationRuleType.Format, "email"));
userSchema.AddProperty("/email", emailSchema);

schemas.AddSchema(userSchema);

// Validate document
var validator = new TonValidator();
var document = parser.Parse("{ (user) name = 'John', email = 'john@example.com' }");
document.Schemas = schemas;

var results = validator.Validate(document);
if (!results.IsValid)
{
    foreach (var error in results.Errors)
        Console.WriteLine($"Error at {error.Path}: {error.Message}");
}
```

### Formatting

```csharp
using DevPossible.Ton;

// Format a TON string with pretty formatting (default)
string unformattedTon = "{name='MyApp',version=1.0,enabled=true}";
string prettyFormatted = TonFormatter.FormatString(unformattedTon);

// Format with compact formatting
string compactFormatted = TonFormatter.FormatString(unformattedTon, TonFormatStyle.Compact);

// Format files
TonFormatter.FormatFileInPlace("config.ton", TonFormatStyle.Pretty);

// Async formatting
string formatted = await TonFormatter.FormatStringAsync(unformattedTon, TonFormatStyle.Pretty);
```

### Serialization Options

```csharp
// Compact format - minimal size
var compact = TonSerializeOptions.Compact;

// Pretty format - human readable with all features
var pretty = TonSerializeOptions.Pretty;

// Custom options
var custom = new TonSerializeOptions
{
    // Formatting
    Indentation = "  ",           // Two spaces
    Pretty = true,                // Enable formatting
    SortProperties = true,        // Alphabetical property order

    // Content control
    IncludeHeader = true,         // Include #@ header
    IncludeSchema = true,         // Include #! schema
    IncludeTypeHints = true,      // Add type hints ($, %, etc.)

    // Value handling
    OmitNullValues = false,       // Include null values
    OmitUndefinedValues = true,   // Skip undefined values
    OmitEmptyCollections = false, // Include empty arrays

    // Formatting preferences
    UseAtPrefix = true,           // Use @ for properties
    QuoteChar = '\'',             // Use single quotes
    UseMultiLineStrings = true,   // Enable multi-line string format
    MultiLineStringThreshold = 2, // Min lines to use multi-line format
    LowercaseHex = true,          // 0xff instead of 0xFF
    LowercaseGuids = true,        // Lowercase GUID format
    PreferEnumNames = true        // Use names over indices
};

var serializer = new TonSerializer();
string output = serializer.SerializeDocument(document, custom);
```

### Object Conversion

```csharp
// Convert C# object to TON
public class Configuration
{
    public string Name { get; set; }
    public int Port { get; set; }
    public bool Enabled { get; set; }
    public string[] Tags { get; set; }
}

var config = new Configuration
{
    Name = "MyApp",
    Port = 8080,
    Enabled = true,
    Tags = new[] { "production", "web" }
};

var tonObject = TonObject.FromObject(config);
var document = new TonDocument(tonObject);

// Convert TON to C# object
var parsedConfig = document.RootObject.ToObject<Configuration>();
```

## API Reference

### Core Classes

- **`TonDocument`** - Represents a complete TON document with header, root object, and schemas
- **`TonObject`** - Represents an object with properties and child objects
- **`TonValue`** - Represents a typed value with conversion methods
- **`TonParser`** - Parses TON content from various sources
- **`TonSerializer`** - Serializes TON objects to string format
- **`TonFormatter`** - Formats existing TON content with different styles
- **`TonValidator`** - Validates TON documents against schemas

### Key Interfaces

- **`ITonValue`** - Interface for TON values
- **`ITonSerializable`** - Interface for serializable TON elements

### Enumerations

- **`TonValueType`** - Types of TON values (String, Integer, Float, Boolean, etc.)
- **`TonTokenType`** - Token types used by the lexer
- **`TonValidationRuleType`** - Types of validation rules
- **`TonFormatStyle`** - Formatting styles (Compact, Pretty)

## Requirements

- .NET Standard 2.1 or later
- Compatible with .NET Core 3.0+, .NET 5+, .NET 6+, .NET 7+, .NET 8+, .NET 9+

## License

MIT License - Copyright © 2024 DevPossible, LLC

## Support

**DevPossible, LLC**  
Website: [devpossible.com](https://www.devpossible.com)  
Email: support@devpossible.com  
TON Specification: [tonspec.com](https://tonspec.com)

---

**© 2024 DevPossible, LLC. All rights reserved.**

