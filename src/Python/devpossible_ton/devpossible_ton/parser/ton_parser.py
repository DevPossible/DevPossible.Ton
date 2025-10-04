"""
TonParser - Parser for TON format
Copyright (c) 2024 DevPossible, LLC
"""

from dataclasses import dataclass
from typing import Optional, Any
from ..lexer import TonLexer, Token, TokenType
from ..models import TonDocument, TonObject, TonValue, TonArray
from ..errors import TonParseError


@dataclass
class TonParseOptions:
    """Options for parsing TON format."""
    allow_trailing_comma: bool = False
    strict_mode: bool = True
    allow_partial: bool = False


class TonParser:
    """Parser for TON format."""

    def __init__(self, options: Optional[TonParseOptions] = None, **kwargs):
        # Handle keyword arguments for backward compatibility
        if options is None and kwargs:
            options = TonParseOptions(**kwargs)
        self.options = options or TonParseOptions()
        self.tokens = []
        self.current = 0

    def parse(self, text: str) -> TonDocument:
        """Parse TON text into a document."""
        lexer = TonLexer(text)
        self.tokens = lexer.tokenize()
        self.current = 0

        root = self._parse_value()

        if not self._is_at_end():
            token = self._peek()
            raise TonParseError(
                'Unexpected content after parsing',
                token.line,
                token.column
            )

        return TonDocument(root)
    
    def parse_file(self, file_path: str) -> TonDocument:
        """Parse a TON file into a document."""
        if not file_path:
            raise ValueError("file_path cannot be None or empty")
        
        import os
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return self.parse(content)
    
    async def parse_file_async(self, file_path: str) -> TonDocument:
        """Parse a TON file into a document asynchronously."""
        import aiofiles
        import os
        
        if not file_path:
            raise ValueError("file_path cannot be None or empty")
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
            content = await f.read()
        
        return self.parse(content)

    def _parse_value(self) -> Any:
        """Parse a value."""
        token = self._peek()

        if token.type == TokenType.LEFT_BRACE:
            return self._parse_object()
        elif token.type == TokenType.LEFT_BRACKET:
            return self._parse_array()
        elif token.type in (TokenType.STRING, TokenType.NUMBER, TokenType.BOOLEAN,
                            TokenType.NULL, TokenType.UNDEFINED, TokenType.GUID):
            return TonValue(self._advance().value)
        elif token.type in (TokenType.ENUM, TokenType.ENUM_SET):
            return self._parse_enum()
        elif token.type in (TokenType.STRING_HINT, TokenType.NUMBER_HINT,
                            TokenType.BOOLEAN_HINT, TokenType.DATE_HINT):
            return self._parse_hinted_value()
        elif token.type == TokenType.CLASS_NAME:
            return self._parse_typed_object()
        elif token.type == TokenType.END_OF_FILE:
            raise TonParseError(
                'Unexpected end of input',
                token.line,
                token.column
            )
        else:
            raise TonParseError(
                f'Unexpected token: {token.type}',
                token.line,
                token.column
            )

    def _parse_object(self) -> TonObject:
        """Parse an object."""
        self._consume(TokenType.LEFT_BRACE, 'Expected {')
        obj = TonObject()

        while not self._check(TokenType.RIGHT_BRACE) and not self._is_at_end():
            # Parse property name
            name_token = self._advance()
            if name_token.type not in (TokenType.IDENTIFIER, TokenType.STRING):
                raise TonParseError(
                    'Expected property name',
                    name_token.line,
                    name_token.column
                )

            name = name_token.value

            # Check for type annotation (name:type: value syntax)
            type_hint = None
            if self._check(TokenType.COLON):
                self._advance()  # consume first :
                if self._check(TokenType.IDENTIFIER):
                    type_hint = self._advance().value
                    # Consume the second colon if present
                    if self._check(TokenType.COLON):
                        self._advance()  # consume second :

            # Parse property value
            value = self._parse_value()

            if type_hint and isinstance(value, TonValue):
                value.type_hint = type_hint

            obj.set(name, value)

            # Check for comma or closing brace (commas are optional in pretty format)
            if not self._check(TokenType.RIGHT_BRACE):
                if self._check(TokenType.COMMA):
                    self._advance()
                # Commas are always optional - TON format allows newline-separated properties

        self._consume(TokenType.RIGHT_BRACE, 'Expected }')
        return obj

    def _parse_array(self) -> TonArray:
        """Parse an array."""
        self._consume(TokenType.LEFT_BRACKET, 'Expected [')
        arr = TonArray()

        while not self._check(TokenType.RIGHT_BRACKET) and not self._is_at_end():
            arr.add(self._parse_value())

            if not self._check(TokenType.RIGHT_BRACKET):
                if self._check(TokenType.COMMA):
                    self._advance()
                elif not self.options.allow_trailing_comma:
                    next_token = self._peek()
                    if next_token.type != TokenType.RIGHT_BRACKET:
                        raise TonParseError(
                            'Expected comma or ]',
                            next_token.line,
                            next_token.column
                        )

        self._consume(TokenType.RIGHT_BRACKET, 'Expected ]')
        return arr

    def _parse_enum(self) -> TonValue:
        """Parse an enum."""
        token = self._advance()
        return TonValue(token.value, 'enum')

    def _parse_hinted_value(self) -> TonValue:
        """Parse a hinted value."""
        hint_token = self._advance()
        type_hint_map = {
            TokenType.STRING_HINT: 'string',
            TokenType.NUMBER_HINT: 'number',
            TokenType.BOOLEAN_HINT: 'boolean',
            TokenType.DATE_HINT: 'date',
        }
        type_hint = type_hint_map.get(hint_token.type, 'unknown')

        value = self._parse_value()
        if isinstance(value, TonValue):
            value.type_hint = type_hint

        return value

    def _parse_typed_object(self) -> TonObject:
        """Parse a typed object."""
        class_name = self._advance().value

        # Check for instance count
        instance_count = None
        if self._check(TokenType.LEFT_PAREN):
            self._advance()  # consume (
            count_token = self._consume(TokenType.NUMBER, 'Expected instance count')
            instance_count = int(count_token.value)
            self._consume(TokenType.RIGHT_PAREN, 'Expected )')

        obj = self._parse_object()
        obj.class_name = class_name
        obj.instance_count = instance_count

        return obj

    def _consume(self, token_type: TokenType, message: str) -> Token:
        """Consume a token of the expected type."""
        if self._check(token_type):
            return self._advance()

        token = self._peek()
        raise TonParseError(message, token.line, token.column)

    def _check(self, token_type: TokenType) -> bool:
        """Check if current token is of expected type."""
        if self._is_at_end():
            return False
        return self._peek().type == token_type

    def _advance(self) -> Token:
        """Advance to next token."""
        if not self._is_at_end():
            self.current += 1
        return self._previous()

    def _peek(self) -> Token:
        """Peek at current token."""
        return self.tokens[self.current]

    def _previous(self) -> Token:
        """Get previous token."""
        return self.tokens[self.current - 1]

    def _is_at_end(self) -> bool:
        """Check if at end of tokens."""
        return self._peek().type == TokenType.END_OF_FILE
