"""
TonSerializer - Serializer for TON format
Copyright (c) 2024 DevPossible, LLC
"""

from dataclasses import dataclass
from typing import Optional, Any
from ..models import TonDocument, TonObject, TonValue, TonArray, TonEnum


@dataclass
class TonSerializeOptions:
    """Options for serializing TON format."""
    indent: str = '  '
    format: str = 'pretty'  # 'pretty' | 'compact'
    omit_null: bool = False
    omit_undefined: bool = True


class TonSerializer:
    """Serializer for TON format."""

    def __init__(self, options: Optional[TonSerializeOptions] = None):
        self.options = options or TonSerializeOptions()

    def serialize(self, document: TonDocument) -> str:
        """Serialize a document to TON format."""
        return self._serialize_value(document.get_root(), 0)

    def _serialize_value(self, value: Any, indent_level: int) -> str:
        """Serialize a value."""
        if isinstance(value, TonObject):
            return self._serialize_object(value, indent_level)
        elif isinstance(value, TonArray):
            return self._serialize_array(value, indent_level)
        elif isinstance(value, TonValue):
            return self._serialize_primitive(value.get_value())
        elif isinstance(value, TonEnum):
            return str(value)
        else:
            return self._serialize_primitive(value)

    def _serialize_object(self, obj: TonObject, indent_level: int) -> str:
        """Serialize an object."""
        if self.options.format == 'compact':
            items = []
            for key, value in obj.entries():
                val_str = self._serialize_value(value, 0)
                items.append(f'{key}:{val_str}')
            return '{' + ','.join(items) + '}'
        else:
            lines = ['{']
            indent = self.options.indent * (indent_level + 1)
            for key, value in obj.entries():
                val_str = self._serialize_value(value, indent_level + 1)
                lines.append(f'{indent}{key}: {val_str}')
            lines.append(self.options.indent * indent_level + '}')
            return '\n'.join(lines)

    def _serialize_array(self, arr: TonArray, indent_level: int) -> str:
        """Serialize an array."""
        items = [self._serialize_value(item, indent_level) for item in arr.to_array()]
        if self.options.format == 'compact':
            return '[' + ','.join(items) + ']'
        else:
            return '[\n' + ',\n'.join(f'{self.options.indent * (indent_level + 1)}{item}'
                                     for item in items) + '\n' + self.options.indent * indent_level + ']'

    def _serialize_primitive(self, value: Any) -> str:
        """Serialize a primitive value."""
        if value is None:
            return 'null'
        elif value is True:
            return 'true'
        elif value is False:
            return 'false'
        elif isinstance(value, str):
            return f'"{value}"'
        else:
            return str(value)