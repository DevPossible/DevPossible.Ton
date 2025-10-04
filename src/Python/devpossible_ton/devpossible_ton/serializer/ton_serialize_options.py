"""
TonSerializeOptions - Options for serializing TON format
Copyright (c) 2024 DevPossible, LLC
"""

from enum import Enum
from typing import Optional
from dataclasses import dataclass, field


class TonFormatStyle(Enum):
    """Formatting style for TON serialization"""
    COMPACT = 'compact'
    PRETTY = 'pretty'


class TonSerializeOptions:
    """Options for serializing TON format."""
    
    def __init__(self, 
                 format_style: Optional[TonFormatStyle] = None,
                 indent_size: int = 4,
                 indent_char: str = ' ',
                 include_header: bool = False,
                 ton_version: str = '1',
                 include_schema: bool = False,
                 schema_file: Optional[str] = None,
                 include_type_hints: bool = False,
                 use_at_prefix: bool = False,
                 sort_properties: bool = False,
                 property_separator: Optional[str] = None,
                 quote_style: Optional[str] = None,
                 line_ending: str = '\n',
                 trailing_commas: bool = False,
                 max_line_length: int = 0,
                 omit_nulls: bool = False,
                 omit_undefined: bool = True,
                 omit_empty_collections: bool = False,
                 use_multi_line_strings: bool = True,
                 multi_line_string_threshold: int = 2,
                 lowercase_hex: bool = True,
                 lowercase_guids: bool = True,
                 prefer_enum_names: bool = True,
                 array_separator: Optional[str] = None,
                 preserve_comments: bool = False,
                 # Legacy parameters for backward compatibility
                 format: Optional[str] = None,
                 indent: Optional[str] = None,
                 omit_null: Optional[bool] = None,
                 # Additional backward compatibility
                 include_hints: Optional[bool] = None,
                 include_types: Optional[bool] = None):
        
        # Handle legacy 'format' parameter
        if format is not None:
            if format == 'compact':
                self.format_style = TonFormatStyle.COMPACT
            elif format == 'pretty':
                self.format_style = TonFormatStyle.PRETTY
            else:
                self.format_style = TonFormatStyle.PRETTY
        else:
            self.format_style = format_style if format_style is not None else TonFormatStyle.PRETTY
        
        # Handle legacy 'indent' parameter
        if indent is not None:
            self.indent_char = indent[0] if len(indent) > 0 else ' '
            self.indent_size = len(indent)
        else:
            self.indent_size = indent_size
            self.indent_char = indent_char
        
        # Handle legacy 'omit_null' parameter
        if omit_null is not None:
            self.omit_nulls = omit_null
        else:
            self.omit_nulls = omit_nulls
        
        # Handle include_hints and include_types (aliases for include_type_hints)
        if include_hints is not None:
            self.include_type_hints = include_hints
        elif include_types is not None:
            self.include_type_hints = include_types
        else:
            self.include_type_hints = include_type_hints
        
        # Set separators based on format style if not specified
        if property_separator is None:
            if self.format_style == TonFormatStyle.COMPACT:
                self.property_separator = ':'
            else:
                self.property_separator = ': '
        else:
            self.property_separator = property_separator
        
        if array_separator is None:
            if self.format_style == TonFormatStyle.COMPACT:
                self.array_separator = ','
            else:
                self.array_separator = ', '
        else:
            self.array_separator = array_separator
        
        # Set quote style based on format if not specified
        if quote_style is None:
            self.quote_style = 'double'  # Default to double quotes for both
        else:
            self.quote_style = quote_style
        
        # Set all other properties
        self.include_header = include_header
        self.ton_version = ton_version
        self.include_schema = include_schema
        self.schema_file = schema_file
        self.use_at_prefix = use_at_prefix
        self.sort_properties = sort_properties
        self.line_ending = line_ending
        self.trailing_commas = trailing_commas
        self.max_line_length = max_line_length
        self.omit_undefined = omit_undefined
        self.omit_empty_collections = omit_empty_collections
        self.use_multi_line_strings = use_multi_line_strings
        self.multi_line_string_threshold = multi_line_string_threshold
        self.lowercase_hex = lowercase_hex
        self.lowercase_guids = lowercase_guids
        self.prefer_enum_names = prefer_enum_names
        self.preserve_comments = preserve_comments
    
    @staticmethod
    def default() -> 'TonSerializeOptions':
        """Creates default serialization options"""
        return TonSerializeOptions()
    
    @staticmethod
    def compact() -> 'TonSerializeOptions':
        """Creates compact serialization options (no formatting)"""
        return TonSerializeOptions(
            format_style=TonFormatStyle.COMPACT,
            indent_size=0,
            indent_char='',
            include_header=False,
            include_schema=False,
            include_type_hints=False,
            omit_nulls=True,
            omit_undefined=True,
            omit_empty_collections=True,
            use_multi_line_strings=False,
            sort_properties=False,
            property_separator=' = ',
            quote_style='single',
            trailing_commas=False
        )
    
    @staticmethod
    def pretty() -> 'TonSerializeOptions':
        """Creates pretty-print serialization options"""
        return TonSerializeOptions(
            format_style=TonFormatStyle.PRETTY,
            indent_size=4,
            indent_char=' ',
            sort_properties=False,
            include_header=False,
            include_type_hints=False,
            use_multi_line_strings=True,
            property_separator=': ',
            quote_style='double',
            trailing_commas=False,
            prefer_enum_names=True
        )
    
    @staticmethod
    def optimized() -> 'TonSerializeOptions':
        """Creates optimized serialization options with hints"""
        return TonSerializeOptions(
            include_type_hints=True,
            sort_properties=True
        )
    
    @property
    def indentation(self) -> Optional[str]:
        """Get the indentation string (None for compact)"""
        if self.format_style == TonFormatStyle.COMPACT or self.indent_size == 0:
            return None
        return self.indent_char * self.indent_size
    
    # Aliases for C#/JavaScript compatibility
    Default = default.__func__
    Compact = compact.__func__
    Pretty = pretty.__func__
    Optimized = optimized.__func__
