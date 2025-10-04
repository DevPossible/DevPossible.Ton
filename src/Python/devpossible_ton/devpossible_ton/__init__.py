"""
DevPossible.Ton - Python Library for TON (Text Object Notation)
Copyright (c) 2024 DevPossible, LLC. All rights reserved.
Author: DevPossible, LLC <support@devpossible.com>
"""

__version__ = "1.0.0"
__author__ = "DevPossible, LLC"
__email__ = "support@devpossible.com"

from .lexer import TonLexer, Token, TokenType
from .parser import TonParser, TonParseOptions
from .serializer import TonSerializer, TonSerializeOptions, TonFormatStyle
from .validator import TonValidator, TonValidationResult
from .models import TonDocument, TonObject, TonValue, TonArray, TonEnum, TonEnumSet
from .formatter import TonFormatter
from .schema import (
    ValidationRuleType,
    TonValidationRule,
    TonPropertySchema,
    TonSchemaDefinition,
    TonSchemaCollection,
    TonEnumDefinition
)
from .errors import TonParseError, TonValidationError

# Convenience functions
def parse(text: str, options: TonParseOptions = None) -> TonDocument:
    """Parse TON text into a document."""
    parser = TonParser(options)
    return parser.parse(text)


def parse_file(filepath: str, options: TonParseOptions = None) -> TonDocument:
    """Parse a TON file into a document."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return parse(f.read(), options)


def serialize(document: TonDocument, options: TonSerializeOptions = None) -> str:
    """Serialize a TON document to string."""
    serializer = TonSerializer(options)
    return serializer.serialize(document)


def serialize_to_file(document: TonDocument, filepath: str, options: TonSerializeOptions = None):
    """Serialize a TON document to a file."""
    content = serialize(document, options)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)


def validate(document: TonDocument, schema: dict) -> TonValidationResult:
    """Validate a TON document against a schema."""
    validator = TonValidator()
    return validator.validate(document, schema)


__all__ = [
    # Main classes
    'TonLexer',
    'TonParser',
    'TonSerializer',
    'TonValidator',
    'TonFormatter',

    # Models
    'TonDocument',
    'TonObject',
    'TonValue',
    'TonArray',
    'TonEnum',
    'TonEnumSet',

    # Schema
    'ValidationRuleType',
    'TonValidationRule',
    'TonPropertySchema',
    'TonSchemaDefinition',
    'TonSchemaCollection',
    'TonEnumDefinition',

    # Types
    'Token',
    'TokenType',
    'TonParseOptions',
    'TonSerializeOptions',
    'TonFormatStyle',
    'TonValidationResult',

    # Errors
    'TonParseError',
    'TonValidationError',

    # Convenience functions
    'parse',
    'parse_file',
    'serialize',
    'serialize_to_file',
    'validate',
]
