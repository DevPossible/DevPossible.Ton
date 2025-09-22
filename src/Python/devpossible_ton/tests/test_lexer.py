"""
TonLexer Tests
Copyright (c) 2024 DevPossible, LLC
"""

import pytest
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from devpossible_ton.lexer import TonLexer, TokenType


class TestTonLexerBasicStructure:
    """Test basic structural tokenization."""

    def test_tokenize_empty_object(self):
        lexer = TonLexer('{ }')
        tokens = lexer.tokenize()

        assert len(tokens) == 3  # { } EOF
        assert tokens[0].type == TokenType.LEFT_BRACE
        assert tokens[1].type == TokenType.RIGHT_BRACE
        assert tokens[2].type == TokenType.END_OF_FILE

    def test_tokenize_empty_array(self):
        lexer = TonLexer('[ ]')
        tokens = lexer.tokenize()

        assert len(tokens) == 3  # [ ] EOF
        assert tokens[0].type == TokenType.LEFT_BRACKET
        assert tokens[1].type == TokenType.RIGHT_BRACKET
        assert tokens[2].type == TokenType.END_OF_FILE


class TestTonLexerStrings:
    """Test string tokenization."""

    def test_tokenize_double_quoted_string(self):
        lexer = TonLexer('"Hello World"')
        tokens = lexer.tokenize()

        assert tokens[0].type == TokenType.STRING
        assert tokens[0].value == 'Hello World'

    def test_tokenize_single_quoted_string(self):
        lexer = TonLexer("'Hello World'")
        tokens = lexer.tokenize()

        assert tokens[0].type == TokenType.STRING
        assert tokens[0].value == 'Hello World'

    def test_tokenize_template_string(self):
        lexer = TonLexer('`Hello World`')
        tokens = lexer.tokenize()

        assert tokens[0].type == TokenType.STRING
        assert tokens[0].value == 'Hello World'

    def test_handle_escape_sequences(self):
        lexer = TonLexer('"Hello\\nWorld"')
        tokens = lexer.tokenize()

        assert tokens[0].type == TokenType.STRING
        assert tokens[0].value == 'Hello\nWorld'

    def test_tokenize_triple_quoted_string(self):
        lexer = TonLexer('"""Hello\nWorld"""')
        tokens = lexer.tokenize()

        assert tokens[0].type == TokenType.STRING
        assert tokens[0].value == 'Hello\nWorld'


class TestTonLexerNumbers:
    """Test number tokenization."""

    def test_tokenize_integer(self):
        lexer = TonLexer('42')
        tokens = lexer.tokenize()

        assert tokens[0].type == TokenType.NUMBER
        assert tokens[0].value == 42

    def test_tokenize_float(self):
        lexer = TonLexer('3.14')
        tokens = lexer.tokenize()

        assert tokens[0].type == TokenType.NUMBER
        assert tokens[0].value == 3.14

    def test_tokenize_negative_number(self):
        lexer = TonLexer('-42')
        tokens = lexer.tokenize()

        assert tokens[0].type == TokenType.NUMBER
        assert tokens[0].value == -42

    def test_tokenize_hexadecimal(self):
        lexer = TonLexer('0xFF')
        tokens = lexer.tokenize()

        assert tokens[0].type == TokenType.NUMBER
        assert tokens[0].value == 255

    def test_tokenize_binary(self):
        lexer = TonLexer('0b1010')
        tokens = lexer.tokenize()

        assert tokens[0].type == TokenType.NUMBER
        assert tokens[0].value == 10

    def test_tokenize_scientific_notation(self):
        lexer = TonLexer('1.5e10')
        tokens = lexer.tokenize()

        assert tokens[0].type == TokenType.NUMBER
        assert tokens[0].value == 1.5e10


class TestTonLexerBooleanAndKeywords:
    """Test boolean and keyword tokenization."""

    def test_tokenize_true(self):
        lexer = TonLexer('true')
        tokens = lexer.tokenize()

        assert tokens[0].type == TokenType.BOOLEAN
        assert tokens[0].value is True

    def test_tokenize_false(self):
        lexer = TonLexer('false')
        tokens = lexer.tokenize()

        assert tokens[0].type == TokenType.BOOLEAN
        assert tokens[0].value is False

    def test_tokenize_null(self):
        lexer = TonLexer('null')
        tokens = lexer.tokenize()

        assert tokens[0].type == TokenType.NULL
        assert tokens[0].value is None

    def test_tokenize_undefined(self):
        lexer = TonLexer('undefined')
        tokens = lexer.tokenize()

        assert tokens[0].type == TokenType.UNDEFINED
        assert tokens[0].value is None


class TestTonLexerIdentifiersAndClassNames:
    """Test identifier and class name tokenization."""

    def test_tokenize_identifier(self):
        lexer = TonLexer('myVariable')
        tokens = lexer.tokenize()

        assert tokens[0].type == TokenType.IDENTIFIER
        assert tokens[0].value == 'myVariable'

    def test_tokenize_class_name(self):
        lexer = TonLexer('Person')
        tokens = lexer.tokenize()

        assert tokens[0].type == TokenType.CLASS_NAME
        assert tokens[0].value == 'Person'

    def test_tokenize_identifier_with_underscore(self):
        lexer = TonLexer('_privateVar')
        tokens = lexer.tokenize()

        assert tokens[0].type == TokenType.IDENTIFIER
        assert tokens[0].value == '_privateVar'


class TestTonLexerTypeHints:
    """Test type hint tokenization."""

    def test_tokenize_string_hint(self):
        lexer = TonLexer('$"value"')
        tokens = lexer.tokenize()

        assert tokens[0].type == TokenType.STRING_HINT
        assert tokens[1].type == TokenType.STRING

    def test_tokenize_number_hint(self):
        lexer = TonLexer('%42')
        tokens = lexer.tokenize()

        assert tokens[0].type == TokenType.NUMBER_HINT
        assert tokens[1].type == TokenType.NUMBER

    def test_tokenize_boolean_hint(self):
        lexer = TonLexer('&true')
        tokens = lexer.tokenize()

        assert tokens[0].type == TokenType.BOOLEAN_HINT
        assert tokens[1].type == TokenType.BOOLEAN

    def test_tokenize_date_hint(self):
        lexer = TonLexer('^"2024-01-01"')
        tokens = lexer.tokenize()

        assert tokens[0].type == TokenType.DATE_HINT
        assert tokens[1].type == TokenType.STRING


class TestTonLexerEnums:
    """Test enum tokenization."""

    def test_tokenize_single_enum(self):
        lexer = TonLexer('|active|')
        tokens = lexer.tokenize()

        assert tokens[0].type == TokenType.ENUM
        assert tokens[0].value == 'active'

    def test_tokenize_enum_set(self):
        lexer = TonLexer('|read|write|execute|')
        tokens = lexer.tokenize()

        assert tokens[0].type == TokenType.ENUM_SET
        assert tokens[0].value == ['read', 'write', 'execute']


class TestTonLexerGUID:
    """Test GUID tokenization."""

    def test_tokenize_guid(self):
        lexer = TonLexer('550e8400-e29b-41d4-a716-446655440000')
        tokens = lexer.tokenize()

        assert tokens[0].type == TokenType.GUID
        assert tokens[0].value == '550e8400-e29b-41d4-a716-446655440000'


class TestTonLexerComments:
    """Test comment handling."""

    def test_skip_single_line_comments(self):
        lexer = TonLexer('42 // comment\n43')
        tokens = lexer.tokenize()

        assert len(tokens) == 3  # 42, 43, EOF
        assert tokens[0].value == 42
        assert tokens[1].value == 43

    def test_skip_multi_line_comments(self):
        lexer = TonLexer('42 /* comment */ 43')
        tokens = lexer.tokenize()

        assert len(tokens) == 3  # 42, 43, EOF
        assert tokens[0].value == 42
        assert tokens[1].value == 43


class TestTonLexerComplexStructures:
    """Test complex structure tokenization."""

    def test_tokenize_object_with_properties(self):
        input_str = '{ name: "John", age: 30 }'
        lexer = TonLexer(input_str)
        tokens = lexer.tokenize()

        token_types = [t.type for t in tokens]
        assert token_types == [
            TokenType.LEFT_BRACE,
            TokenType.IDENTIFIER,
            TokenType.COLON,
            TokenType.STRING,
            TokenType.COMMA,
            TokenType.IDENTIFIER,
            TokenType.COLON,
            TokenType.NUMBER,
            TokenType.RIGHT_BRACE,
            TokenType.END_OF_FILE
        ]

    def test_tokenize_array_with_values(self):
        input_str = '[1, "two", true, null]'
        lexer = TonLexer(input_str)
        tokens = lexer.tokenize()

        token_types = [t.type for t in tokens]
        assert token_types == [
            TokenType.LEFT_BRACKET,
            TokenType.NUMBER,
            TokenType.COMMA,
            TokenType.STRING,
            TokenType.COMMA,
            TokenType.BOOLEAN,
            TokenType.COMMA,
            TokenType.NULL,
            TokenType.RIGHT_BRACKET,
            TokenType.END_OF_FILE
        ]

    def test_tokenize_typed_object(self):
        input_str = 'Person(1) { name: "John" }'
        lexer = TonLexer(input_str)
        tokens = lexer.tokenize()

        assert tokens[0].type == TokenType.CLASS_NAME
        assert tokens[0].value == 'Person'
        assert tokens[1].type == TokenType.LEFT_PAREN
        assert tokens[2].type == TokenType.NUMBER
        assert tokens[3].type == TokenType.RIGHT_PAREN


class TestTonLexerErrorHandling:
    """Test error handling."""

    def test_throw_on_unterminated_string(self):
        lexer = TonLexer('"unterminated')
        with pytest.raises(SyntaxError, match='Unterminated string'):
            lexer.tokenize()

    def test_throw_on_invalid_character(self):
        lexer = TonLexer('{ @ }')
        with pytest.raises(SyntaxError, match='Unexpected character'):
            lexer.tokenize()

    def test_throw_on_invalid_enum(self):
        lexer = TonLexer('|')
        with pytest.raises(SyntaxError, match='Invalid enum'):
            lexer.tokenize()