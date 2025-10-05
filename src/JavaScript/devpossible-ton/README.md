# DevPossible.Ton - JavaScript / TypeScript Library

**Developed by DevPossible, LLC**  
**Contact: support@devpossible.com**

JavaScript/TypeScript implementation of the TON (Text Object Notation) parser, serializer, formatter, and validator.

## Installation

```bash
npm install @devpossible/ton
```

or

```bash
yarn add @devpossible/ton
```

## Quick Start

```javascript
import { TonParser, TonDocument, TonObject, TonValue, TonSerializer, TonSerializeOptions } from '@devpossible/ton';

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

// Serialize and save
const serializer = new TonSerializer();
const tonContent = serializer.serializeDocument(newDoc, TonSerializeOptions.Pretty);
await serializer.serializeToFile(newDoc, 'config.ton', TonSerializeOptions.Pretty);
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
- ✅ TypeScript type definitions included
- ✅ ESM and CommonJS support

## Advanced Usage

### Schema Validation

```javascript
import { TonParser, TonSchemaCollection, TonSchemaDefinition, TonPropertySchema, TonValidationRule, TonValidator, ValidationRuleType } from '@devpossible/ton';

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

### Formatting

```javascript
import { TonFormatter, TonFormatStyle } from '@devpossible/ton';

// Format a TON string with pretty formatting (default)
const unformattedTon = "{name='MyApp',version=1.0,enabled=true}";
const prettyFormatted = TonFormatter.formatString(unformattedTon);

// Format with compact formatting
const compactFormatted = TonFormatter.formatString(unformattedTon, TonFormatStyle.Compact);

// Format files
TonFormatter.formatFileInPlace('config.ton', TonFormatStyle.Pretty);

// Async formatting
const formatted = await TonFormatter.formatStringAsync(unformattedTon, TonFormatStyle.Pretty);
```

### Serialization Options

```javascript
import { TonSerializeOptions } from '@devpossible/ton';

// Compact format - minimal size
const compact = TonSerializeOptions.Compact;

// Pretty format - human readable with all features
const pretty = TonSerializeOptions.Pretty;

// Custom options
const custom = new TonSerializeOptions({
    // Formatting
    indentation: '  ',           // Two spaces
    pretty: true,                // Enable formatting
    sortProperties: true,        // Alphabetical property order

    // Content control
    includeHeader: true,         // Include #@ header
    includeSchema: true,         // Include #! schema
    includeTypeHints: true,      // Add type hints ($, %, etc.)

    // Value handling
    omitNullValues: false,       // Include null values
    omitUndefinedValues: true,   // Skip undefined values
    omitEmptyCollections: false, // Include empty arrays

    // Formatting preferences
    useAtPrefix: true,           // Use @ for properties
    quoteChar: "'",              // Use single quotes
    useMultiLineStrings: true,   // Enable multi-line string format
    multiLineStringThreshold: 2, // Min lines to use multi-line format
    lowercaseHex: true,          // 0xff instead of 0xFF
    lowercaseGuids: true,        // Lowercase GUID format
    preferEnumNames: true        // Use names over indices
});

const serializer = new TonSerializer();
const output = serializer.serializeDocument(document, custom);
```

### Working with Arrays

```javascript
import { TonDocument, TonValue } from '@devpossible/ton';

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

## TypeScript Support

The library includes full TypeScript type definitions:

```typescript
import { TonParser, TonDocument, TonValue, TonValueType } from '@devpossible/ton';

const parser: TonParser = new TonParser();
const document: TonDocument = parser.parseFile('config.ton');

const value: TonValue | undefined = document.rootObject.getProperty('name');
if (value?.type === TonValueType.String) {
    const name: string = value.toString();
}
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

### Key Enumerations

- **`TonValueType`** - Types of TON values (String, Integer, Float, Boolean, etc.)
- **`TonTokenType`** - Token types used by the lexer
- **`ValidationRuleType`** - Types of validation rules
- **`TonFormatStyle`** - Formatting styles (Compact, Pretty)

## Requirements

- Node.js 14.0.0 or later
- Modern browsers with ES2015+ support

## License

MIT License - Copyright © 2024 DevPossible, LLC

## Support

**DevPossible, LLC**  
Website: [devpossible.com](https://www.devpossible.com)  
Email: support@devpossible.com  
TON Specification: [tonspec.com](https://tonspec.com)

---

**© 2024 DevPossible, LLC. All rights reserved.**
