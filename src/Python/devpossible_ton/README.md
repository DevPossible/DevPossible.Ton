# DevPossible.Ton - Python Library

**Developed by DevPossible, LLC**
**Contact: support@devpossible.com**

Python implementation of the TON (Text Object Notation) parser, serializer, formatter, and validator.

## Installation

```bash
pip install devpossible-ton
```

## Quick Start

```python
import devpossible_ton as ton

# Parse TON data
document = ton.parse("""
{
  name: "My App"
  version: "1.0.0"
}
""")

# Access data
root = document.get_root()
print(root.get('name'))  # "My App"

# Serialize back to TON
serialized = ton.serialize(document)
print(serialized)

# Format TON files
from devpossible_ton import TonFormatter
formatted = TonFormatter.pretty(ton_text)
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

## Advanced Usage

### Schema Validation

```python
from devpossible_ton import (
    TonSchemaDefinition, 
    TonPropertySchema, 
    ValidationRuleType, 
    TonValidationRule
)

# Create a schema
schema = TonSchemaDefinition('User')
name_prop = TonPropertySchema('name', 'string')
name_prop.add_validation(TonValidationRule(ValidationRuleType.REQUIRED))
name_prop.add_validation(TonValidationRule(ValidationRuleType.MIN_LENGTH, 3))
schema.add_property('name', name_prop)
```

### Formatting

```python
from devpossible_ton import TonFormatter, TonFormatStyle

# Format with different styles
compact = TonFormatter.compact(ton_text)
pretty = TonFormatter.pretty(ton_text)
sorted_output = TonFormatter.sorted(ton_text)

# Async formatting
import asyncio
formatted = await TonFormatter.format_file_async('input.ton', TonFormatStyle.PRETTY)
```

### Serialization Options

```python
from devpossible_ton import TonSerializeOptions, TonFormatStyle

# Use presets
options = TonSerializeOptions.compact()
options = TonSerializeOptions.pretty()
options = TonSerializeOptions.optimized()

# Custom options
options = TonSerializeOptions(
    format_style=TonFormatStyle.PRETTY,
    indent_size=2,
    sort_properties=True,
    include_header=True
)
```

## License

MIT License - Copyright © 2024 DevPossible, LLC

## Support

**DevPossible, LLC**
Email: support@devpossible.com

---

**© 2024 DevPossible, LLC. All rights reserved.**
