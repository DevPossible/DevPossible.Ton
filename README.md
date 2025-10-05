# DevPossible.Ton - Text Object Notation Library for .NET

**Developed by DevPossible, LLC**

[![NuGet Version](https://img.shields.io/nuget/v/DevPossible.Ton)](https://www.nuget.org/packages/DevPossible.Ton/)
[![.NET 8.0](https://img.shields.io/badge/.NET-8.0-512BD4)](https://dotnet.microsoft.com/download/dotnet/8.0)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TON Spec](https://img.shields.io/badge/TON%20Spec-tonspec.com-green)](https://tonspec.com)
[![Library Version](https://img.shields.io/badge/library-0.1.0-blue)](https://github.com/DevPossible/DevPossible.Ton/releases)
[![TON Spec Version](https://img.shields.io/badge/TON%20Spec-1.0-green)](https://tonspec.com)

> **⚠️ INITIAL DEVELOPMENT (0.x.x)** - This library is in active development. The TON file format specification is stable at version 1.0, but the library implementation is at version 0.1.0 and may undergo changes before reaching 1.0.0 stable release.

A robust .NET library for parsing, validating, and serializing TON (Text Object Notation) files. TON is a human-readable data format that combines the simplicity of JSON with advanced features like schema validation, type hints, enums, and hierarchical object structures.

📚 **Full specification and documentation available at [tonspec.com](https://tonspec.com)**

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [TON Format Overview](#ton-format-overview)
  - [Multi-line Strings](#multi-line-strings)
- [Usage Guide](#usage-guide)
  - [Parsing TON Files](#parsing-ton-files)
  - [Creating TON Documents](#creating-ton-documents)
  - [Serialization](#serialization)
  - [Formatting TON Files](#formatting-ton-files)
  - [Schema Validation](#schema-validation)
  - [Working with Arrays](#working-with-arrays)
  - [Type Conversions](#type-conversions)
- [Advanced Features](#advanced-features)
- [API Reference](#api-reference)
- [Building from Source](#building-from-source)
- [Contributing](#contributing)
- [License](#license)

## Features

✨ **Core Features**
- 📖 **Full TON Specification Support** - Complete implementation of the [TON file format](https://tonspec.com)
- 🔍 **Robust Parser** - Recursive descent parser with comprehensive error reporting
- ✅ **Schema Validation** - Built-in validation with custom rules and constraints
- 📝 **Flexible Serialization** - Multiple output formats with customizable options
- 🚀 **High Performance** - Optimized for speed with minimal memory allocation
- 🎯 **Type Safety** - Strong typing with automatic type inference and conversion

🎨 **Format Features**
- **Multi-line Strings** - Triple-quoted strings with automatic indentation processing (`"""content"""`)
- **Type Hints** - Shorthand type indicators (`$` for string, `%` for number, etc.)
- **Enums & EnumSets** - Built-in enumeration support (`|value|` and `|val1|val2|`)
- **Arrays** - Native array syntax with validation (`[1, 2, 3]`)
- **Object Hierarchy** - Nested objects with optional class names
- **Comments** - Single-line (`//`) and multi-line (`/* */`) comments
- **Multiple Number Formats** - Decimal, hex (`0xFF`), binary (`0b1010`), scientific notation

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
<PackageReference Include="DevPossible.Ton" Version="1.0.0" />
```

## Quick Start

### Example 1: Basic Parsing and Creating TON Files

<details open>
<summary><strong>C# / .NET</strong></summary>

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

// Serialize - using ToString() for quick serialization with default options
string tonContent = newDoc.ToString();
Console.WriteLine(tonContent);

// Or use TonSerializer for more control
var serializer = new TonSerializer();
string prettyTon = serializer.SerializeDocument(newDoc, TonSerializeOptions.Pretty);
await serializer.SerializeToFileAsync(newDoc, "config.ton", TonSerializeOptions.Pretty);
```
</details>

<details>
<summary><strong>JavaScript / TypeScript</strong></summary>

```javascript
import { TonParser, TonDocument, TonObject, TonValue, TonSerializer, TonSerializeOptions } from 'devpossible-ton';

// Parse a TON file
const parser = new TonParser();
const document = parser.parseFile('config.ton');

// Access properties
const name = document.rootObject.getProperty('name')?.toString();
const port = document.rootObject.getProperty('port')?.toInt32() ?? 8080;

// Create a new document
const newDoc = new TonDocument();
newDoc.rootObject.setProperty('name', TonValue.from('My App'));
newDoc.rootObject.setProperty('port', TonValue.from(8080));

// Add nested object
const database = new TonObject('database');
database.setProperty('host', TonValue.from('localhost'));
newDoc.rootObject.addChild(database);

// Serialize - using toString() for quick serialization with default options
const tonContent = newDoc.toString();
console.log(tonContent);

// Or use TonSerializer for more control
const serializer = new TonSerializer();
const prettyTon = serializer.serializeDocument(newDoc, TonSerializeOptions.Pretty);
await serializer.serializeToFile(newDoc, 'config.ton', TonSerializeOptions.Pretty);
```
</details>

<details>
<summary><strong>Python</strong></summary>

```python
from devpossible_ton import TonParser, TonDocument, TonObject, TonValue, TonSerializer, TonSerializeOptions

# Parse a TON file
parser = TonParser()
document = parser.parse_file('config.ton')

# Access properties
name = document.root_object.get_property('name').to_string() if document.root_object.get_property('name') else None
port = document.root_object.get_property('port').to_int32() if document.root_object.get_property('port') else 8080

# Create a new document
new_doc = TonDocument()
new_doc.root_object.set_property('name', TonValue.from_value('My App'))
new_doc.root_object.set_property('port', TonValue.from_value(8080))

# Add nested object
database = TonObject(class_name='database')
database.set_property('host', TonValue.from_value('localhost'))
new_doc.root_object.add_child(database)

# Serialize - using str() for quick serialization with default options
ton_content = str(new_doc)
print(ton_content)

# Or use TonSerializer for more control
serializer = TonSerializer()
pretty_ton = serializer.serialize_document(new_doc, TonSerializeOptions.Pretty)
await serializer.serialize_to_file(new_doc, 'config.ton', TonSerializeOptions.Pretty)
```
</details>

### Example 2: Schema Validation

<details open>
<summary><strong>C# / .NET</strong></summary>

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
</details>

<details>
<summary><strong>JavaScript / TypeScript</strong></summary>

```javascript
import { TonParser, TonSchemaCollection, TonSchemaDefinition, TonPropertySchema, TonValidationRule, TonValidator, ValidationRuleType } from 'devpossible-ton';

// Define schema
const schemas = new TonSchemaCollection();
const userSchema = new TonSchemaDefinition('user');

// Add property validations
const nameSchema = new TonPropertySchema('/name', 'string');
nameSchema.addValidation(new TonValidationRule(ValidationRuleType.Required));
nameSchema.addValidation(new TonValidationRule(ValidationRuleType.MaxLength, 100));
userSchema.addProperty('/name', nameSchema);

const emailSchema = new TonPropertySchema('/email', 'string');
emailSchema.addValidation(new TonValidationRule(ValidationRuleType.Format, 'email'));
userSchema.addProperty('/email', emailSchema);

schemas.addSchema(userSchema);

// Validate document
const validator = new TonValidator();
const parser = new TonParser();
const document = parser.parse("{ (user) name = 'John', email = 'john@example.com' }");
document.schemas = schemas;

const results = validator.validate(document);
if (!results.isValid) {
    results.errors.forEach(error => 
        console.log(`Error at ${error.path}: ${error.message}`)
    );
}
```
</details>

<details>
<summary><strong>Python</strong></summary>

```python
from devpossible_ton import (TonParser, TonSchemaCollection, TonSchemaDefinition, 
                              TonPropertySchema, TonValidationRule, TonValidator, 
                              ValidationRuleType)

# Define schema
schemas = TonSchemaCollection()
user_schema = TonSchemaDefinition('user')

# Add property validations
name_schema = TonPropertySchema('/name', 'string')
name_schema.add_validation(TonValidationRule(ValidationRuleType.Required))
name_schema.add_validation(TonValidationRule(ValidationRuleType.MaxLength, 100))
user_schema.add_property('/name', name_schema)

email_schema = TonPropertySchema('/email', 'string')
email_schema.add_validation(TonValidationRule(ValidationRuleType.Format, 'email'))
user_schema.add_property('/email', email_schema)

schemas.add_schema(user_schema)

# Validate document
validator = TonValidator()
parser = TonParser()
document = parser.parse("{ (user) name = 'John', email = 'john@example.com' }")
document.schemas = schemas

results = validator.validate(document)
if not results.is_valid:
    for error in results.errors:
        print(f"Error at {error.path}: {error.message}")
```
</details>

### Example 3: Working with Arrays and Formatting

<details open>
<summary><strong>C# / .NET</strong></summary>

```csharp
using DevPossible.Ton;

// Create document with arrays
var document = new TonDocument();
var tags = new List<object> { "production", "web", "api" };
var scores = new List<object> { 98.5, 87.2, 95.0 };

document.RootObject.SetProperty("tags", TonValue.From(tags));
document.RootObject.SetProperty("scores", TonValue.From(scores));

// Format with different styles
var serializer = new TonSerializer();
string compact = serializer.SerializeDocument(document, TonSerializeOptions.Compact);
string pretty = serializer.SerializeDocument(document, TonSerializeOptions.Pretty);

// Or use the formatter directly
string formatted = TonFormatter.FormatString(compact, TonFormatStyle.Pretty);
```
</details>

<details>
<summary><strong>JavaScript / TypeScript</strong></summary>

```javascript
import { TonDocument, TonValue, TonSerializer, TonSerializeOptions, TonFormatter, TonFormatStyle } from 'devpossible-ton';

// Create document with arrays
const document = new TonDocument();
const tags = ['production', 'web', 'api'];
const scores = [98.5, 87.2, 95.0];

document.rootObject.setProperty('tags', TonValue.from(tags));
document.rootObject.setProperty('scores', TonValue.from(scores));

// Format with different styles
const serializer = new TonSerializer();
const compact = serializer.serializeDocument(document, TonSerializeOptions.Compact);
const pretty = serializer.serializeDocument(document, TonSerializeOptions.Pretty);

// Or use the formatter directly
const formatted = TonFormatter.formatString(compact, TonFormatStyle.Pretty);
```
</details>

<details>
<summary><strong>Python</strong></summary>

```python
from devpossible_ton import TonDocument, TonValue, TonSerializer, TonSerializeOptions, TonFormatter, TonFormatStyle

# Create document with arrays
document = TonDocument()
tags = ['production', 'web', 'api']
scores = [98.5, 87.2, 95.0]

document.root_object.set_property('tags', TonValue.from_value(tags))
document.root_object.set_property('scores', TonValue.from_value(scores))

# Format with different styles
serializer = TonSerializer()
compact = serializer.serialize_document(document, TonSerializeOptions.Compact)
pretty = serializer.serialize_document(document, TonSerializeOptions.Pretty)

# Or use the formatter directly
formatted = TonFormatter.format_string(compact, TonFormatStyle.Pretty)
```
</details>

## TON Format Overview

For the complete TON specification, visit [tonspec.com](https://tonspec.com).

### Basic Structure

```ton
#@ tonVersion = '1', schemaFile = 'schema.ton'

{(application)
    name = 'My App',
    version = 1.0,
    enabled = true,

    // Nested object
    {(database)
        host = 'localhost',
        port = 5432,
        ssl = true
    }
}
```

### Data Types

```ton
{
    // Strings
    text = 'Hello World',
    quoted = "With \"quotes\"",
    multiLine = """
    This is a multi-line string
    with automatic indentation processing
    and preserved relative spacing
    """,

    // Numbers
    integer = 42,
    float = 3.14,
    hex = 0xFF,
    binary = 0b1010,
    scientific = 1.23e-4,

    // Booleans
    active = true,
    disabled = false,

    // Null and undefined
    optional = null,
    missing = undefined,

    // GUIDs
    id = 550e8400-e29b-41d4-a716-446655440000,

    // Enums
    status = |active|,
    permissions = |read|write|execute|,

    // Arrays
    numbers = [1, 2, 3, 4, 5],
    mixed = ['text', 123, true, null],
    nested = [[1, 2], [3, 4]]
}
```

### Multi-line Strings

TON supports multi-line string literals using triple quotes (`"""` or `'''`). Multi-line strings provide automatic indentation processing and preserve relative formatting:

```ton
{
    // Basic multi-line string
    description = """
    This is a multi-line string that spans
    multiple lines with automatic indentation
    processing and preserved formatting.
    """,

    // SQL query example
    sqlQuery = """
    SELECT u.id, u.name, u.email
    FROM users u
    WHERE u.active = true
      AND u.created_at > '2023-01-01'
    ORDER BY u.name
    """,

    // Code snippet with proper indentation
    jsFunction = """
    function processData(items) {
        return items
            .filter(item => item.active)
            .map(item => ({
                id: item.id,
                name: item.name.toUpperCase()
            }));
    }
    """,

    // Alternative syntax with single quotes
    alternativeQuotes = '''
    Multi-line strings can use either triple
    double quotes or triple single quotes.
    Choose based on your content requirements.
    ''',

    // Inline multi-line (no actual line breaks)
    inline = """Single line content in triple quotes"""
}
```

**Multi-line String Features:**
- **Automatic Indentation Processing**: Common leading whitespace is removed while preserving relative indentation
- **Flexible Content Boundaries**: Content can start immediately after opening quotes or on the next line
- **Escape Sequence Support**: Standard escape sequences (`\n`, `\t`, `\"`, etc.) work within multi-line strings
- **Preserved Empty Lines**: Empty lines within the content are maintained
- **Choice of Quote Characters**: Use `"""` or `'''` based on your content needs

### Type Hints

```ton
{
    // Type hints
    @description = $'Product description',  // $ = string hint
    @quantity = %100,                       // % = number hint
    @id = &{550e8400-e29b-41d4-a716-446655440000}, // & = GUID hint
    @tags = ^['red', 'blue', 'green']     // ^ = array hint
}
```

## Usage Guide

For detailed usage information and additional examples, please refer to:
- **[Quick Start Examples](#quick-start)** above for basic usage in all three languages
- **Sample Projects** in `src/CSharp/DevPossible.Ton.Samples/`, `src/JavaScript/devpossible-ton-samples/`, and `src/Python/devpossible_ton_samples/`
- **Full API Documentation** at the [project wiki](https://github.com/DevPossible/DevPossible.Ton/wiki)
- **TON Specification** at [tonspec.com](https://tonspec.com)

### Key Capabilities

All three library implementations (C#, JavaScript, and Python) support:

- **Parsing**: From files, strings, and streams (with async support)
- **Document Creation**: Programmatically build TON documents with headers, properties, and nested objects
- **Object Conversion**: Convert between TON and native objects (C# classes, JavaScript objects, Python dicts)

### Serialization

#### Serialization Options

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
    // Note: IncludeTypeAnnotations removed from specification
    IncludeTypeHints = true,      // Add type hints ($, %, etc.)
    // Note: IncludeInstanceCounts removed from specification

    // Value handling
    OmitNullValues = false,       // Include null values
    OmitUndefinedValues = true,   // Skip undefined values
    OmitEmptyCollections = false, // Include empty arrays

    // Formatting preferences
    UseAtPrefix = true,           // Use @ for properties
    QuoteChar = '\'',            // Use single quotes
    UseMultiLineStrings = true,   // Enable multi-line string format
    MultiLineStringThreshold = 2, // Min lines to use multi-line format
    LowercaseHex = true,         // 0xff instead of 0xFF
    LowercaseGuids = true,       // Lowercase GUID format
    PreferEnumNames = true       // Use names over indices
};

var serializer = new TonSerializer();
string output = serializer.SerializeDocument(document, custom);
```

### Formatting TON Files

The `TonFormatter` class provides convenient utilities for formatting existing TON files and strings with different styles.

#### Format String Content

```csharp
using DevPossible.Ton;

// Format a TON string with pretty formatting (default)
string unformattedTon = "{name='MyApp',version=1.0,enabled=true}";
string prettyFormatted = TonFormatter.FormatString(unformattedTon);

// Format with compact formatting
string compactFormatted = TonFormatter.FormatString(unformattedTon, TonFormatStyle.Compact);

// Async formatting
string formatted = await TonFormatter.FormatStringAsync(unformattedTon, TonFormatStyle.Pretty);
```

#### Format Files

```csharp
// Format a file and return the result
string formattedContent = TonFormatter.FormatFile("config.ton", TonFormatStyle.Pretty);

// Format a file in place (overwrites the original file)
TonFormatter.FormatFileInPlace("config.ton", TonFormatStyle.Pretty);

// Format a file to a new file
TonFormatter.FormatFileToFile("input.ton", "output.ton", TonFormatStyle.Pretty);

// Async file operations
var formatted = await TonFormatter.FormatFileAsync("config.ton", TonFormatStyle.Compact);
await TonFormatter.FormatFileInPlaceAsync("config.ton", TonFormatStyle.Pretty);
await TonFormatter.FormatFileToFileAsync("input.ton", "output.ton", TonFormatStyle.Pretty);
```

#### Format Styles

```csharp
// Pretty format - includes headers, type hints, and proper indentation
TonFormatStyle.Pretty

// Compact format - minimal whitespace, no headers, single line
TonFormatStyle.Compact
```

#### Example Usage in Build Scripts

```csharp
// Format all TON files in a directory
var tonFiles = Directory.GetFiles("./config", "*.ton");
foreach (var file in tonFiles)
{
    try
    {
        TonFormatter.FormatFileInPlace(file, TonFormatStyle.Pretty);
        Console.WriteLine($"Formatted: {file}");
    }
    catch (TonParseException ex)
    {
        Console.WriteLine($"Error formatting {file}: {ex.Message}");
    }
}
```

#### Output Examples

**Compact Format:**
```ton
{name='App',version=1.0,enabled=true,{(db)host='localhost',port=5432}}
```

**Pretty Format:**
```ton
#@ tonVersion = '1'

{(application)
    enabled = true,
    name = $'App',
    version = %1.0,

    {(db)
        host = $'localhost',
        port = %5432
    }
}
```

### Schema Validation

TON supports powerful schema validation with path-based property specifications that allow you to apply validation rules to deeply nested properties using a path-like syntax (e.g., `/details/bio` or `/address/city`).

#### Path-Based Schema Syntax

The path-based schema syntax uses forward slashes (`/`) to specify the hierarchical location of properties within objects:

```ton
# Data structure
{(user)
    name = "John",
    email = "john@example.com",

    details = {
        bio = "Software engineer",
        avatar = "avatar.jpg"
    }
}

# Schema with path-based property rules
#! {(user)
    /name = string(required, minLength(1), maxLength(100)),
    /email = string(required, format(email)),
    /details/bio = string(maxLength(1000)),
    /details/avatar = string(maxLength(255))
}
```

#### Defining Schemas Programmatically

```csharp
// Create schema collection
var schemas = new TonSchemaCollection();

// Define enum
var logLevelEnum = new TonEnumDefinition("LogLevel");
logLevelEnum.Values.AddRange(new[] { "error", "warning", "info", "debug" });
schemas.AddEnum(logLevelEnum);

// Define object schema with path-based properties
var userSchema = new TonSchemaDefinition("user");

// Root-level properties
var nameSchema = new TonPropertySchema("/name", "string");
nameSchema.AddValidation(new TonValidationRule(ValidationRuleType.Required));
nameSchema.AddValidation(new TonValidationRule(ValidationRuleType.MinLength, 1));
nameSchema.AddValidation(new TonValidationRule(ValidationRuleType.MaxLength, 100));
userSchema.AddProperty("/name", nameSchema);

// Nested properties using paths
var bioSchema = new TonPropertySchema("/details/bio", "string");
bioSchema.AddValidation(new TonValidationRule(ValidationRuleType.MaxLength, 1000));
userSchema.AddProperty("/details/bio", bioSchema);

// Deep nested paths
var citySchema = new TonPropertySchema("/details/address/city", "string");
citySchema.AddValidation(new TonValidationRule(ValidationRuleType.Required));
citySchema.AddValidation(new TonValidationRule(ValidationRuleType.MaxLength, 100));
userSchema.AddProperty("/details/address/city", citySchema);

// Numeric property paths
var idSchema = new TonPropertySchema("/123", "string");
idSchema.AddValidation(new TonValidationRule(ValidationRuleType.MaxLength, 50));
userSchema.AddProperty("/123", idSchema);

// Array with base type validation
var tagsSchema = new TonPropertySchema("/tags", "array:string");
tagsSchema.AddValidation(new TonValidationRule(ValidationRuleType.MinCount, 1));
tagsSchema.AddValidation(new TonValidationRule(ValidationRuleType.MaxCount, 10));
tagsSchema.AddValidation(new TonValidationRule(ValidationRuleType.Unique));
userSchema.AddProperty("/tags", tagsSchema);

schemas.AddSchema(userSchema);

// Apply schema to document
document.Schemas = schemas;
```

#### Validation Rules

```csharp
// String validation with path
var emailSchema = new TonPropertySchema("/contact/email", "string");
emailSchema.AddValidation(new TonValidationRule(ValidationRuleType.Required));
emailSchema.AddValidation(new TonValidationRule(ValidationRuleType.Format, "email"));
emailSchema.AddValidation(new TonValidationRule(ValidationRuleType.MaxLength, 255));

// Number validation with deep path
var ageSchema = new TonPropertySchema("/user/profile/age", "int");
ageSchema.AddValidation(new TonValidationRule(ValidationRuleType.Min, 0));
ageSchema.AddValidation(new TonValidationRule(ValidationRuleType.Max, 150));

// Array validation with base type
var tagsSchema = new TonPropertySchema("/metadata/tags", "array:string");
tagsSchema.AddValidation(new TonValidationRule(ValidationRuleType.MinCount, 1));
tagsSchema.AddValidation(new TonValidationRule(ValidationRuleType.MaxCount, 10));
tagsSchema.AddValidation(new TonValidationRule(ValidationRuleType.Unique));

// Numeric property path
var yearSchema = new TonPropertySchema("/2024data", "array:float");
yearSchema.AddValidation(new TonValidationRule(ValidationRuleType.MaxCount, 12));
yearSchema.AddValidation(new TonValidationRule(ValidationRuleType.Range, 0.0, 100.0));
```

#### Performing Validation

```csharp
var validator = new TonValidator();

// Validate entire document
var results = validator.Validate(document);

if (!results.IsValid)
{
    foreach (var error in results.Errors)
    {
        Console.WriteLine($"Validation error at {error.Path}: {error.Message}");
    }
}

// Validate specific object with schemas
var obj = new TonObject { ClassName = "user" };
obj.SetProperty("name", TonValue.From("John Doe"));
obj.SetProperty("email", TonValue.From("john@example.com"));

var detailsObj = new TonObject();
detailsObj.SetProperty("bio", TonValue.From("Software engineer"));
detailsObj.SetProperty("avatar", TonValue.From("avatar.jpg"));
obj.SetProperty("details", TonValue.From(detailsObj));

var validationResult = validator.ValidateObject(obj, schemas);
```

#### Path-Based Schema Examples

```ton
# Complex nested structure with path-based validation
{(company)
    name = "TechCorp",
    employees = 250,

    headquarters = {
        address = "123 Tech Street",
        city = "San Francisco",

        coordinates = {
            latitude = 37.7749,
            longitude = -122.4194
        }
    },

    # Numeric property names
    2024revenue = 1500000,
    123employeeId = "EMP-001"
}

# Schema with deep path specifications
#! {(company)
    /name = string(required, maxLength(100)),
    /employees = int(min(1), max(10000)),

    # Nested paths
    /headquarters/address = string(required),
    /headquarters/city = string(required),

    # Deep nested paths
    /headquarters/coordinates/latitude = float(range(-90.0, 90.0)),
    /headquarters/coordinates/longitude = float(range(-180.0, 180.0)),

    # Numeric property paths
    /2024revenue = float(positive),
    /123employeeId = string(pattern("^EMP-\\d{3}$"))
}
```

#### Array Type Validation

```ton
# Arrays with base type specifications
{(data)
    strings = ["hello", "world"],
    numbers = [1, 2, 3, 4, 5],
    floats = [1.5, 2.7, 3.14],

    # Nested arrays
    matrix = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
    ]
}

#! {(data)
    /strings = array:string(minCount(1), maxLength(20)),
    /numbers = array:int(unique, sorted, range(1, 100)),
    /floats = array:float(maxCount(10), positive),
    /matrix = array:array:int(maxCount(3))
}
```

### Working with Arrays

#### Creating Arrays

```csharp
// Simple array
var numbers = new List<object> { 1, 2, 3, 4, 5 };
root.SetProperty("numbers", TonValue.From(numbers));

// String array
var tags = new List<object> { "red", "green", "blue" };
root.SetProperty("tags", TonValue.From(tags));

// Mixed type array
var mixed = new List<object> { "text", 123, true, null };
root.SetProperty("mixed", TonValue.From(mixed));

// Nested arrays
var matrix = new List<object>
{
    new List<object> { 1, 2, 3 },
    new List<object> { 4, 5, 6 },
    new List<object> { 7, 8, 9 }
};
root.SetProperty("matrix", TonValue.From(matrix));

// Array with type hints (using ^ prefix)
var typedArray = TonValue.From(numbers);
root.SetProperty("scores", typedArray);
```

#### Reading Arrays

```csharp
// Get array value
var tagsValue = document.RootObject.GetProperty("tags");
if (tagsValue?.Type == TonValueType.Array && tagsValue.Value is List<object> tagList)
{
    foreach (var tag in tagList)
    {
        Console.WriteLine($"Tag: {tag}");
    }
}

// Convert to typed array
string[] tagArray = tagList.Select(t => t?.ToString() ?? "").ToArray();

// Access nested arrays
var matrixValue = document.RootObject.GetProperty("matrix");
if (matrixValue?.Value is List<object> rows)
{
    for (int i = 0; i < rows.Count; i++)
    {
        if (rows[i] is List<object> cols)
        {
            for (int j = 0; j < cols.Count; j++)
            {
                Console.WriteLine($"matrix[{i}][{j}] = {cols[j]}");
            }
        }
    }
}
```

### Type Conversions

#### Converting TON Values

```csharp
var value = document.RootObject.GetProperty("someProperty");

// String conversion
string text = value?.ToString() ?? "default";

// Number conversions
int intVal = value?.ToInt32() ?? 0;
long longVal = value?.ToInt64() ?? 0L;
double doubleVal = value?.ToDouble() ?? 0.0;
decimal decimalVal = value?.ToDecimal() ?? 0m;

// Boolean conversion
bool boolVal = value?.ToBoolean() ?? false;

// GUID conversion
Guid? guidVal = value?.ToGuid();

// DateTime conversion
DateTime? dateVal = value?.ToDateTime();

// Check for null/undefined
bool isNull = value?.IsNull ?? false;
bool isUndefined = value?.IsUndefined ?? false;

// Type checking
if (value?.Type == TonValueType.Array)
{
    var arrayItems = value.Value as List<object>;
    // Process array
}

if (value?.Type == TonValueType.Enum)
{
    var enumValue = value.Value as TonEnum;
    string enumName = enumValue?.Value;
}
```

#### Object Conversion

```csharp
// Convert TON to C# object
public class Configuration
{
    public string Name { get; set; }
    public int Port { get; set; }
    public bool Enabled { get; set; }
    public string[] Tags { get; set; }
}

// Parse and convert
var document = parser.Parse(tonContent);
var config = document.RootObject.ToObject<Configuration>();

// Access converted properties
Console.WriteLine($"Name: {config.Name}");
Console.WriteLine($"Port: {config.Port}");
Console.WriteLine($"Tags: {string.Join(", ", config.Tags)}");

// Convert C# object to TON
var newConfig = new Configuration
{
    Name = "MyApp",
    Port = 8080,
    Enabled = true,
    Tags = new[] { "production", "web" }
};

var tonObject = TonObject.FromObject(newConfig);
var document = new TonDocument(tonObject);
```

## Advanced Features

### Custom Value Types
- **Enums**: Single value enumerations (`|value|`)
- **EnumSets**: Multiple value enumerations (`|value1|value2|value3|`)
- **Type Hints**: Optional type indicators (`$` for string, `%` for number, `&` for GUID, `^` for array)

### Property Paths
- Access nested properties using path syntax: `/parent/child/property`
- Support for numeric property names: `/user/123/data`
- Array index access: `/items/0/name`

### Error Handling
All implementations provide detailed error information including:
- **Parse Errors**: Line and column numbers with context
- **Validation Errors**: Property paths and validation rule details
- **Type Errors**: Expected vs. actual type information

### Performance Optimization
- **Streaming Support**: Parse large files with minimal memory usage
- **Async Operations**: Non-blocking I/O for all file operations
- **Compact Serialization**: Minimal output size for network transmission
- **Instance Reuse**: Reuse parser and serializer instances for better performance

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

## Building from Source

### Prerequisites

- .NET SDK 8.0 or later
- Visual Studio 2022 or VS Code (optional)

### Build Steps

```bash
# Clone the repository
git clone https://github.com/DevPossible/DevPossible.Ton.git
cd DevPossible.Ton

# Restore dependencies
dotnet restore

# Build the solution
dotnet build

# Run tests
dotnet test

# Create NuGet package
dotnet pack -c Release
```

### Publishing to NuGet

```bash
# Pack the library
dotnet pack -c Release -p:PackageVersion=1.0.0

# Push to NuGet
dotnet nuget push ./src/CSharp/DevPossible.Ton/bin/Release/DevPossible.Ton.1.0.0.nupkg \
    --api-key YOUR_API_KEY \
    --source https://api.nuget.org/v3/index.json
```

### Project Structure

The repository is organized as follows:

```
DevPossible.Ton/
├── src/                           # Source code for all implementations
│   ├── CSharp/                    # C#/.NET implementation
│   │   ├── DevPossible.Ton/       # Main library
│   │   ├── DevPossible.Ton.Tests/ # Test suite (160+ tests)
│   │   └── DevPossible.Ton.Samples/ # Sample applications
│   ├── JavaScript/                # JavaScript/TypeScript implementation
│   │   ├── devpossible-ton/       # Main library
│   │   └── devpossible-ton-samples/ # Sample applications
│   └── Python/                    # Python implementation
│       ├── devpossible_ton/       # Main library package
│       └── devpossible_ton_samples/ # Sample applications
├── doc-html/                      # HTML documentation website
└── README.md                      # This file
```

### Development Configuration

The C#/.NET project includes:
- **DevPossible.Ton.csproj** - Main library project
- **DevPossible.Ton.Tests.csproj** - Comprehensive test suite (160+ tests)
- **DevPossible.Ton.Samples.csproj** - Sample applications and examples

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Running Tests

```bash
# Run all tests
dotnet test

# Run specific test categories
dotnet test --filter Category=Parser
dotnet test --filter Category=Serializer
dotnet test --filter Category=Validator

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"
```

## Examples

Check out the [examples](examples/) directory for more comprehensive examples:

- [Configuration Files](examples/configuration/)
- [Data Serialization](examples/serialization/)
- [Schema Validation](examples/validation/)
- [Database Schemas](examples/database/)
- [Game Data](examples/gamedata/)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Copyright © 2024 DevPossible, LLC**

## Acknowledgments

- TON format specification contributors
- .NET community for feedback and suggestions
- All contributors who have helped improve this library

## Roadmap

See [ROADMAP.md](ROADMAP.md) for planned features and future development.

## Support

**DevPossible, LLC**

- **Website**: [devpossible.com](https://www.devpossible.com)
- **Email**: support@devpossible.com
- **TON Specification**: [tonspec.com](https://tonspec.com) - Official TON file format specification
- **API Documentation**: [Full API Documentation](https://github.com/DevPossible/DevPossible.Ton/wiki)
- **Issues**: [GitHub Issues](https://github.com/DevPossible/DevPossible.Ton/issues)
- **Discussions**: [GitHub Discussions](https://github.com/DevPossible/DevPossible.Ton/discussions)

---

**© 2024 DevPossible, LLC. All rights reserved.**

**DevPossible, LLC**  
Website: [www.devpossible.com](https://www.devpossible.com)  
Email: support@devpossible.com

Developed and maintained with ❤️ for the developer community
