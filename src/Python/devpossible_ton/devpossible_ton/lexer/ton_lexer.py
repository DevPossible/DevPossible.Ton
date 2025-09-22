"""
TonLexer - Tokenizer for TON format
Copyright (c) 2024 DevPossible, LLC
"""

from enum import Enum, auto
from dataclasses import dataclass
from typing import List, Optional, Any
import re


class TokenType(Enum):
    """Token types for TON format."""

    # Literals
    STRING = auto()
    NUMBER = auto()
    BOOLEAN = auto()
    NULL = auto()
    UNDEFINED = auto()

    # Identifiers and Keywords
    IDENTIFIER = auto()
    CLASS_NAME = auto()

    # Delimiters
    LEFT_BRACE = auto()
    RIGHT_BRACE = auto()
    LEFT_BRACKET = auto()
    RIGHT_BRACKET = auto()
    LEFT_PAREN = auto()
    RIGHT_PAREN = auto()

    # Operators
    COLON = auto()
    COMMA = auto()
    PIPE = auto()

    # Type Hints
    STRING_HINT = auto()     # $
    NUMBER_HINT = auto()     # %
    BOOLEAN_HINT = auto()    # &
    DATE_HINT = auto()       # ^

    # Special
    ENUM = auto()
    ENUM_SET = auto()
    GUID = auto()

    # Comments
    COMMENT = auto()

    # Control
    END_OF_FILE = auto()
    NEWLINE = auto()


@dataclass
class Token:
    """Represents a lexical token."""
    type: TokenType
    value: Any
    line: int
    column: int
    raw: Optional[str] = None


class TonLexer:
    """Lexer for TON format."""

    GUID_PATTERN = re.compile(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        re.IGNORECASE
    )

    def __init__(self, text: str):
        self.text = text
        self.position = 0
        self.line = 1
        self.column = 1
        self.tokens: List[Token] = []

    def tokenize(self) -> List[Token]:
        """Tokenize the input text."""
        while not self._is_at_end():
            self._skip_whitespace_and_comments()
            if self._is_at_end():
                break

            token = self._next_token()
            if token and token.type != TokenType.COMMENT:
                self.tokens.append(token)

        self.tokens.append(self._create_token(TokenType.END_OF_FILE, None))
        return self.tokens

    def _next_token(self) -> Optional[Token]:
        """Get the next token."""
        char = self._peek()

        # Structural tokens
        if char == '{':
            return self._consume_char(TokenType.LEFT_BRACE)
        elif char == '}':
            return self._consume_char(TokenType.RIGHT_BRACE)
        elif char == '[':
            return self._consume_char(TokenType.LEFT_BRACKET)
        elif char == ']':
            return self._consume_char(TokenType.RIGHT_BRACKET)
        elif char == '(':
            return self._consume_char(TokenType.LEFT_PAREN)
        elif char == ')':
            return self._consume_char(TokenType.RIGHT_PAREN)
        elif char == ':':
            return self._consume_char(TokenType.COLON)
        elif char == ',':
            return self._consume_char(TokenType.COMMA)
        elif char == '$':
            return self._consume_char(TokenType.STRING_HINT)
        elif char == '%':
            return self._consume_char(TokenType.NUMBER_HINT)
        elif char == '&':
            return self._consume_char(TokenType.BOOLEAN_HINT)
        elif char == '^':
            return self._consume_char(TokenType.DATE_HINT)
        elif char == '|':
            return self._scan_enum()
        elif char == '"':
            return self._scan_string('"')
        elif char == "'":
            return self._scan_string("'")
        elif char == '`':
            return self._scan_string('`')

        # Try to scan as GUID first if it could be one (starts with hex digit)
        if self._is_hex_digit(char):
            guid_value = self._try_to_scan_guid()
            if guid_value:
                return self._create_token(TokenType.GUID, guid_value)

        # Numbers
        if self._is_digit(char) or (char == '-' and self._is_digit(self._peek(1))):
            return self._scan_number()

        # Identifiers and keywords
        if self._is_alpha(char) or char == '_':
            return self._scan_identifier_or_keyword()

        raise SyntaxError(f"Unexpected character '{char}' at line {self.line}, column {self.column}")

    def _scan_string(self, quote_char: str) -> Token:
        """Scan a string literal."""
        start_line = self.line
        start_column = self.column

        # Check for triple-quoted string
        if quote_char == '"' and self._peek(1) == '"' and self._peek(2) == '"':
            return self._scan_triple_quoted_string()

        self._advance()  # consume opening quote
        value = ''

        while not self._is_at_end() and self._peek() != quote_char:
            if self._peek() == '\\':
                self._advance()
                value += self._scan_escape_sequence()
            else:
                if self._peek() == '\n' and quote_char != '`':
                    raise SyntaxError(f"Unterminated string at line {start_line}, column {start_column}")
                value += self._advance()

        if self._is_at_end():
            raise SyntaxError(f"Unterminated string at line {start_line}, column {start_column}")

        self._advance()  # consume closing quote
        return self._create_token(TokenType.STRING, value)

    def _scan_triple_quoted_string(self) -> Token:
        """Scan a triple-quoted multi-line string."""
        self._advance()  # consume first "
        self._advance()  # consume second "
        self._advance()  # consume third "

        value = ''

        while not self._is_at_end():
            if self._peek() == '"' and self._peek(1) == '"' and self._peek(2) == '"':
                self._advance()
                self._advance()
                self._advance()
                return self._create_token(TokenType.STRING, self._process_multiline_string(value))

            value += self._advance()

        raise SyntaxError("Unterminated triple-quoted string")

    def _process_multiline_string(self, value: str) -> str:
        """Process a multi-line string to handle indentation."""
        lines = value.split('\n')
        if not lines:
            return value

        # Remove leading and trailing empty lines
        while lines and not lines[0].strip():
            lines.pop(0)
        while lines and not lines[-1].strip():
            lines.pop()

        if not lines:
            return ''

        # Find minimum indentation
        min_indent = float('inf')
        for line in lines:
            if line.strip():
                indent = len(line) - len(line.lstrip())
                min_indent = min(min_indent, indent)

        if min_indent == float('inf'):
            min_indent = 0

        # Remove common indentation
        return '\n'.join(line[min_indent:] if len(line) > min_indent else line for line in lines)

    def _scan_number(self) -> Token:
        """Scan a number literal."""
        value = ''

        if self._peek() == '-':
            value += self._advance()

        # Check for hex or binary
        if self._peek() == '0':
            next_char = self._peek(1)
            if next_char in ('x', 'X'):
                return self._scan_hex_number()
            elif next_char in ('b', 'B'):
                return self._scan_binary_number()

        # Scan integer part
        while self._is_digit(self._peek()):
            value += self._advance()

        # Check for decimal part
        if self._peek() == '.' and self._is_digit(self._peek(1)):
            value += self._advance()  # consume .
            while self._is_digit(self._peek()):
                value += self._advance()

        # Check for scientific notation
        exp_char = self._peek()
        if exp_char in ('e', 'E'):
            value += self._advance()
            if self._peek() in ('+', '-'):
                value += self._advance()
            while self._is_digit(self._peek()):
                value += self._advance()

        return self._create_token(TokenType.NUMBER, float(value))

    def _scan_hex_number(self) -> Token:
        """Scan a hexadecimal number."""
        value = '0x'
        self._advance()  # consume 0
        self._advance()  # consume x

        while self._is_hex_digit(self._peek()):
            value += self._advance()

        return self._create_token(TokenType.NUMBER, int(value, 16))

    def _scan_binary_number(self) -> Token:
        """Scan a binary number."""
        value = '0b'
        self._advance()  # consume 0
        self._advance()  # consume b

        while self._peek() in ('0', '1'):
            value += self._advance()

        return self._create_token(TokenType.NUMBER, int(value[2:], 2))

    def _scan_enum(self) -> Token:
        """Scan an enum or enum set."""
        self._advance()  # consume first |

        values = []
        current = ''

        while not self._is_at_end():
            char = self._peek()

            if char == '|':
                if current:
                    values.append(current)
                    current = ''
                self._advance()

                # Check if this closes the enum
                if not (self._is_alpha(self._peek()) or self._peek() == '_'):
                    break
            elif self._is_alpha(char) or self._is_digit(char) or char == '_':
                current += self._advance()
            else:
                break

        if not values and current:
            values.append(current)

        if len(values) == 1:
            return self._create_token(TokenType.ENUM, values[0])
        elif len(values) > 1:
            return self._create_token(TokenType.ENUM_SET, values)

        raise SyntaxError("Invalid enum")

    def _try_to_scan_guid(self) -> Optional[str]:
        """Try to scan a GUID pattern."""
        # GUID pattern: 8-4-4-4-12 hex digits
        start_pos = self.position
        parts = [8, 4, 4, 4, 12]
        guid = ''

        for i, part_length in enumerate(parts):
            if i > 0:
                if self._peek() != '-':
                    # Not a GUID, reset position
                    self.position = start_pos
                    return None
                guid += self._advance()  # consume '-'

            for j in range(part_length):
                if not self._is_hex_digit(self._peek()):
                    # Not a GUID, reset position
                    self.position = start_pos
                    return None
                guid += self._advance()

        return guid

    def _scan_identifier_or_keyword(self) -> Token:
        """Scan an identifier or keyword."""
        value = ''

        while self._is_alphanumeric(self._peek()) or self._peek() == '_':
            value += self._advance()

        # Check for boolean keywords
        if value in ('true', 'false'):
            return self._create_token(TokenType.BOOLEAN, value == 'true')

        # Check for null/undefined
        if value == 'null':
            return self._create_token(TokenType.NULL, None)

        if value == 'undefined':
            return self._create_token(TokenType.UNDEFINED, None)

        # Check if it's a class name (starts with capital)
        if value[0].isupper():
            return self._create_token(TokenType.CLASS_NAME, value)

        return self._create_token(TokenType.IDENTIFIER, value)

    def _scan_escape_sequence(self) -> str:
        """Scan an escape sequence."""
        char = self._advance()
        escape_map = {
            'n': '\n',
            't': '\t',
            'r': '\r',
            '\\': '\\',
            '"': '"',
            "'": "'",
            '`': '`',
        }
        return escape_map.get(char, char)

    def _skip_whitespace_and_comments(self):
        """Skip whitespace and comments."""
        while not self._is_at_end():
            char = self._peek()

            if char in (' ', '\t', '\r'):
                self._advance()
            elif char == '\n':
                self.line += 1
                self.column = 0
                self._advance()
            elif char == '/' and self._peek(1) == '/':
                self._skip_line_comment()
            elif char == '/' and self._peek(1) == '*':
                self._skip_block_comment()
            else:
                break

    def _skip_line_comment(self):
        """Skip a line comment."""
        while not self._is_at_end() and self._peek() != '\n':
            self._advance()

    def _skip_block_comment(self):
        """Skip a block comment."""
        self._advance()  # consume /
        self._advance()  # consume *

        while not self._is_at_end():
            if self._peek() == '*' and self._peek(1) == '/':
                self._advance()  # consume *
                self._advance()  # consume /
                break

            if self._peek() == '\n':
                self.line += 1
                self.column = 0

            self._advance()

    def _consume_char(self, token_type: TokenType) -> Token:
        """Consume a character and create a token."""
        char = self._advance()
        return self._create_token(token_type, char)

    def _create_token(self, token_type: TokenType, value: Any) -> Token:
        """Create a new token."""
        return Token(
            type=token_type,
            value=value,
            line=self.line,
            column=self.column - (len(str(value)) if value else 1)
        )

    def _advance(self) -> str:
        """Advance to the next character."""
        char = self.text[self.position]
        self.position += 1
        self.column += 1
        return char

    def _peek(self, offset: int = 0) -> str:
        """Peek at a character without advancing."""
        pos = self.position + offset
        return self.text[pos] if pos < len(self.text) else '\0'

    def _is_at_end(self) -> bool:
        """Check if at end of input."""
        return self.position >= len(self.text)

    def _is_digit(self, char: str) -> bool:
        """Check if character is a digit."""
        return '0' <= char <= '9'

    def _is_hex_digit(self, char: str) -> bool:
        """Check if character is a hex digit."""
        return self._is_digit(char) or 'a' <= char.lower() <= 'f'

    def _is_alpha(self, char: str) -> bool:
        """Check if character is alphabetic."""
        return 'a' <= char.lower() <= 'z'

    def _is_alphanumeric(self, char: str) -> bool:
        """Check if character is alphanumeric."""
        return self._is_alpha(char) or self._is_digit(char)