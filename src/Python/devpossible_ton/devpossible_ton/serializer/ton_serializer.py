"""
TonSerializer - Serializer for TON format
Copyright (c) 2024 DevPossible, LLC
"""

from typing import Optional, Any
from ..models import TonDocument, TonObject, TonValue, TonArray, TonEnum
from .ton_serialize_options import TonSerializeOptions, TonFormatStyle


class TonSerializer:
    """Serializer for TON format."""

    def __init__(self, options: Optional[TonSerializeOptions] = None):
        self.options = options or TonSerializeOptions()

    def serialize(self, document: TonDocument) -> str:
        """Serialize a document to TON format."""
        result = []
        
        # Add header if requested
        if self.options.include_header:
            result.append(f"#TON {self.options.ton_version}")
            if self.options.schema_file:
                result.append(f"#SCHEMA {self.options.schema_file}")
            result.append("")
        
        # Serialize the root value
        result.append(self._serialize_value(document.get_root(), 0))
        
        return self.options.line_ending.join(result)

    def _serialize_value(self, value: Any, indent_level: int) -> str:
        """Serialize a value."""
        if isinstance(value, TonObject):
            return self._serialize_object(value, indent_level)
        elif isinstance(value, dict):
            # Handle plain Python dicts by wrapping in TonObject
            obj = TonObject()
            for k, v in value.items():
                obj.set(k, v)
            return self._serialize_object(obj, indent_level)
        elif isinstance(value, TonArray):
            return self._serialize_array(value, indent_level)
        elif isinstance(value, list):
            # Handle plain Python lists by wrapping in TonArray
            arr = TonArray()
            for item in value:
                arr.add(item)
            return self._serialize_array(arr, indent_level)
        elif isinstance(value, TonValue):
            # Handle enum and enumSet type hints
            if hasattr(value, 'type_hint') and value.type_hint:
                if value.type_hint == 'enum':
                    return f'|{value.get_value()}|'
                elif value.type_hint == 'enumSet':
                    val = value.get_value()
                    if isinstance(val, list):
                        return '|' + '|'.join(str(v) for v in val) + '|'
                    return f'|{val}|'
                else:
                    return self._serialize_primitive(value.get_value(), value.type_hint)
            return self._serialize_primitive(value.get_value())
        elif isinstance(value, TonEnum):
            return str(value)
        else:
            return self._serialize_primitive(value)

    def _serialize_object(self, obj: TonObject, indent_level: int) -> str:
        """Serialize an object."""
        is_compact = self.options.format_style == TonFormatStyle.COMPACT
        
        # Add class name prefix if present
        prefix = ''
        if obj.class_name:
            prefix = obj.class_name
            if obj.instance_count is not None:
                prefix += f'({obj.instance_count})'
        
        # Check if object is empty (or all values are omitted)
        non_omitted_items = []
        keys = sorted(obj.keys()) if self.options.sort_properties else obj.keys()
        for key in keys:
            # Skip metadata properties (_className, _instanceCount)
            if key.startswith('_'):
                continue
            value = obj.get(key)
            if not self._should_omit_value(value):
                non_omitted_items.append((key, value))
        
        # If empty, return compact format regardless of style
        if len(non_omitted_items) == 0:
            return prefix + '{}'
        
        if is_compact:
            items = []
            for key, value in non_omitted_items:
                val_str = self._serialize_value(value, 0)
                items.append(f'{key}{self.options.property_separator}{val_str}')
            content = '{' + ','.join(items) + '}'
            return prefix + content
        else:
            lines = ['{']
            indent = self.options.indentation or ''
            current_indent = indent * (indent_level + 1)
            
            for key, value in non_omitted_items:
                val_str = self._serialize_value(value, indent_level + 1)
                lines.append(f'{current_indent}{key}{self.options.property_separator}{val_str}')
            
            lines.append((indent * indent_level) + '}')
            content = self.options.line_ending.join(lines)
            return prefix + content

    def _serialize_array(self, arr: TonArray, indent_level: int) -> str:
        """Serialize an array."""
        if self.options.omit_empty_collections and arr.length() == 0:
            return '[]'
        
        is_compact = self.options.format_style == TonFormatStyle.COMPACT
        items = [self._serialize_value(item, indent_level) for item in arr.to_array()]
        
        if is_compact:
            return '[' + self.options.array_separator.join(items) + ']'
        else:
            indent = self.options.indentation or ''
            current_indent = indent * (indent_level + 1)
            # Pretty arrays don't have commas between lines (based on test expectations)
            return '[' + self.options.line_ending + \
                   self.options.line_ending.join(f'{current_indent}{item}' for item in items) + \
                   self.options.line_ending + (indent * indent_level) + ']'

    def _serialize_primitive(self, value: Any, type_hint: Optional[str] = None) -> str:
        """Serialize a primitive value."""
        if value is None:
            return 'null'
        elif value is True:
            # Handle type hints for booleans
            if self.options.include_type_hints and type_hint:
                prefix = self._get_type_hint_prefix(type_hint)
                return f'{prefix}true'
            return 'true'
        elif value is False:
            # Handle type hints for booleans
            if self.options.include_type_hints and type_hint:
                prefix = self._get_type_hint_prefix(type_hint)
                return f'{prefix}false'
            return 'false'
        elif isinstance(value, str):
            # Check if it's a GUID
            if self._is_guid(value):
                return value
            
            # Handle type hints with prefixes
            if self.options.include_type_hints and type_hint:
                prefix = self._get_type_hint_prefix(type_hint)
                quote = '"' if self.options.quote_style == 'double' else "'"
                return f'{prefix}{quote}{value}{quote}'
            
            quote = '"' if self.options.quote_style == 'double' else "'"
            # Escape quotes in the string
            escaped = value.replace('\\', '\\\\').replace(quote, f'\\{quote}')
            return f'{quote}{escaped}{quote}'
        elif hasattr(value, 'isoformat'):
            # Handle datetime objects
            iso_string = value.isoformat()
            if 'T' in iso_string:
                # Convert to date-only format if it's midnight
                iso_string = iso_string.split('T')[0] if value.hour == 0 and value.minute == 0 and value.second == 0 else iso_string
            
            if self.options.include_type_hints and type_hint:
                prefix = self._get_type_hint_prefix(type_hint)
                quote = '"' if self.options.quote_style == 'double' else "'"
                return f'{prefix}{quote}{iso_string}{quote}'
            
            quote = '"' if self.options.quote_style == 'double' else "'"
            return f'{quote}{iso_string}{quote}'
        else:
            # Handle type hints for numbers
            if self.options.include_type_hints and type_hint:
                prefix = self._get_type_hint_prefix(type_hint)
                return f'{prefix}{value}'
            return str(value)
    
    def _is_guid(self, value: str) -> bool:
        """Check if a string is a GUID."""
        import re
        guid_pattern = r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
        return bool(re.match(guid_pattern, value))
    
    def _get_type_hint_prefix(self, type_hint: str) -> str:
        """Get the prefix for a type hint."""
        prefixes = {
            'string': '$',
            'number': '%',
            'boolean': '&',
            'date': '^'
        }
        return prefixes.get(type_hint.lower(), '')
    
    def _should_omit_value(self, value: Any) -> bool:
        """Check if a value should be omitted based on options."""
        # Check for TonValue wrapping
        actual_value = value.get_value() if hasattr(value, 'get_value') else value
        
        if actual_value is None:
            # Only omit if explicitly requested
            if self.options.omit_nulls:
                return True
            # Don't auto-omit nulls even if omit_undefined is true
            # (in TON, null and undefined are different)
            return False
        
        if isinstance(value, (TonArray, list)) and len(value) == 0 and self.options.omit_empty_collections:
            return True
        if isinstance(value, (TonObject, dict)) and len(value) == 0 and self.options.omit_empty_collections:
            return True
        return False
