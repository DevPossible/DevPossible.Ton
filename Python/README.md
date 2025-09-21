# DevPossible.Ton - Python Library

**Developed by DevPossible, LLC**
**Contact: support@devpossible.com**

Python implementation of the TON (Text Object Notation) parser, serializer, and validator.

## Installation

```bash
pip install devpossible-ton
```

or with Poetry:

```bash
poetry add devpossible-ton
```

## Quick Start

```python
import devpossible_ton as ton

# Parse TON data
document = ton.parse("""
{
  name: "My App"
  version: "1.0.0"
  features: ["auth", "logging"]
}
""")

# Access data
root = document.get_root()
if root.is_object():
    obj = root.as_object()
    print(obj.get('name'))  # "My App"

# Serialize back to TON
serialized = ton.serialize(document)
print(serialized)
```

## Features

- ✅ Full TON specification support
- ✅ Python 3.8+ support
- ✅ Type hints throughout
- ✅ Zero dependencies for core functionality
- ✅ Comprehensive error messages with line/column information
- ✅ Schema validation support
- ✅ Async file operations

## API Reference

### Parsing

```python
# Parse from string
doc = ton.parse(ton_string)

# Parse from file
doc = ton.parse_file('config.ton')

# Parse with options
doc = ton.parse(ton_string, ton.TonParseOptions(
    allow_trailing_comma=True,
    strict_mode=False
))
```

### Serialization

```python
# Serialize to string
text = ton.serialize(doc)

# Serialize with options
text = ton.serialize(doc, ton.TonSerializeOptions(
    indent='  ',
    format='pretty',  # 'pretty' | 'compact'
    omit_null=True
))

# Serialize to file
ton.serialize_to_file(doc, 'output.ton')
```

### Validation

```python
# Validate against schema
result = ton.validate(doc, schema)
if result.is_valid:
    print('Valid!')
else:
    for error in result.errors:
        print(f'Error: {error}')
```

## Development

```bash
# Install development dependencies
pip install -e .[dev]

# Run tests
pytest

# Run tests with coverage
pytest --cov=devpossible_ton

# Format code
black devpossible_ton tests

# Lint code
flake8 devpossible_ton tests

# Type check
mypy devpossible_ton
```

## Project Structure

```
devpossible_ton/
├── devpossible_ton/   # Main package
│   ├── lexer/         # Tokenizer
│   ├── parser/        # Parser
│   ├── serializer/    # Serializer
│   ├── validator/     # Schema validator
│   └── models/        # Data models
├── tests/             # Test files
└── examples/          # Usage examples
```

## Examples

See the `examples/` directory for more comprehensive usage examples.

## Testing

The library includes comprehensive test coverage:

```bash
pytest                        # Run all tests
pytest -v                     # Verbose output
pytest --cov=devpossible_ton  # With coverage
pytest -k test_parser         # Run specific tests
```

## Command Line Interface

The package includes CLI tools:

```bash
# Validate a TON file
ton-validate config.ton

# Format a TON file
ton-format input.ton -o output.ton
```

## Requirements

- Python 3.8 or higher
- No runtime dependencies for core functionality

## License

MIT License - Copyright © 2024 DevPossible, LLC

## Support

**DevPossible, LLC**
Email: support@devpossible.com
GitHub: https://github.com/DevPossible/DevPossible.Ton

---

**© 2024 DevPossible, LLC. All rights reserved.**