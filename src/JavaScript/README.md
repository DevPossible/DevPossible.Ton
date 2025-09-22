# DevPossible.Ton - JavaScript/TypeScript Library

**Developed by DevPossible, LLC**
**Contact: support@devpossible.com**
**GitHub: https://github.com/DevPossible/DevPossible.Ton**

JavaScript/TypeScript implementation of the TON (Text Object Notation) parser, serializer, and validator.

## Installation

```bash
npm install @devpossible/ton
```

or with Yarn:

```bash
yarn add @devpossible/ton
```

## Quick Start

```javascript
const ton = require('@devpossible/ton');
// or ES6 import
import * as ton from '@devpossible/ton';

// Parse TON data
const document = ton.parse(`{
  name: "My App"
  version: "1.0.0"
  features: ["auth", "logging"]
}`);

// Access data
const root = document.getRoot();
console.log(root.get('name')); // "My App"

// Serialize back to TON
const serialized = ton.serialize(document);
console.log(serialized);
```

## Features

- ✅ Full TON specification support
- ✅ TypeScript support with complete type definitions
- ✅ Zero dependencies
- ✅ Tree-shakeable ESM build
- ✅ Comprehensive error messages with line/column information
- ✅ Schema validation support
- ✅ Streaming parser for large files

## API Reference

### Parsing

```typescript
// Parse from string
const doc = ton.parse(tonString);

// Parse from file
const doc = await ton.parseFile('config.ton');

// Parse with options
const doc = ton.parse(tonString, {
  allowTrailingComma: true,
  strictMode: false
});
```

### Serialization

```typescript
// Serialize to string
const str = ton.serialize(doc);

// Serialize with options
const str = ton.serialize(doc, {
  indent: '  ',
  format: 'pretty', // 'pretty' | 'compact'
  omitNull: true
});

// Serialize to file
await ton.serializeToFile(doc, 'output.ton');
```

### Validation

```typescript
// Validate against schema
const result = ton.validate(doc, schema);
if (result.isValid) {
  console.log('Valid!');
} else {
  console.error(result.errors);
}
```

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

## Project Structure

```
devpossible-ton/
├── src/               # TypeScript source files
│   ├── lexer/         # Tokenizer
│   ├── parser/        # Parser
│   ├── serializer/    # Serializer
│   ├── validator/     # Schema validator
│   └── models/        # Data models
├── dist/              # Compiled JavaScript
├── tests/             # Test files
└── examples/          # Usage examples
```

## Examples

See the `examples/` directory for more comprehensive usage examples.

## Testing

The library includes comprehensive test coverage:

```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

## License

MIT License - Copyright © 2024 DevPossible, LLC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

- **Repository**: https://github.com/DevPossible/DevPossible.Ton
- **Issues**: https://github.com/DevPossible/DevPossible.Ton/issues
- **Pull Requests**: https://github.com/DevPossible/DevPossible.Ton/pulls

## Support

**DevPossible, LLC**
- **Email**: support@devpossible.com
- **GitHub**: https://github.com/DevPossible/DevPossible.Ton
- **Documentation**: https://tonspec.com

---

**© 2024 DevPossible, LLC. All rights reserved.**