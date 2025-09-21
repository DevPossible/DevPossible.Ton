"""
TonParser Tests
Copyright (c) 2024 DevPossible, LLC
"""

import pytest
from datetime import datetime
from devpossible_ton.parser import TonParser
from devpossible_ton.models import TonDocument, TonObject, TonValue, TonArray
from devpossible_ton.errors import TonParseError


class TestTonParserBasicObjects:
    """Tests for basic object parsing."""

    def test_parse_empty_object(self):
        parser = TonParser()
        result = parser.parse('{}')

        assert result is not None
        assert result.get_root() == {}

    def test_parse_object_with_single_property(self):
        parser = TonParser()
        result = parser.parse('{ name: "John" }')

        assert result.get_root() == {'name': 'John'}

    def test_parse_object_with_multiple_properties(self):
        parser = TonParser()
        result = parser.parse('{ name: "John", age: 30, active: true }')

        assert result.get_root() == {
            'name': 'John',
            'age': 30,
            'active': True
        }

    def test_parse_nested_objects(self):
        parser = TonParser()
        result = parser.parse('{ user: { name: "John", age: 30 } }')

        assert result.get_root() == {
            'user': {
                'name': 'John',
                'age': 30
            }
        }


class TestTonParserArrays:
    """Tests for array parsing."""

    def test_parse_empty_array(self):
        parser = TonParser()
        result = parser.parse('[]')

        assert result.get_root() == []

    def test_parse_array_with_values(self):
        parser = TonParser()
        result = parser.parse('[1, 2, 3]')

        assert result.get_root() == [1, 2, 3]

    def test_parse_array_with_mixed_types(self):
        parser = TonParser()
        result = parser.parse('[1, "two", true, null]')

        assert result.get_root() == [1, 'two', True, None]

    def test_parse_nested_arrays(self):
        parser = TonParser()
        result = parser.parse('[[1, 2], [3, 4]]')

        assert result.get_root() == [[1, 2], [3, 4]]

    def test_parse_array_of_objects(self):
        parser = TonParser()
        result = parser.parse('[{ id: 1 }, { id: 2 }]')

        assert result.get_root() == [{'id': 1}, {'id': 2}]


class TestTonParserDataTypes:
    """Tests for different data types."""

    def test_parse_strings(self):
        parser = TonParser()
        result = parser.parse('{ text: "Hello World" }')

        assert result.get_root()['text'] == 'Hello World'

    def test_parse_numbers(self):
        parser = TonParser()
        result = parser.parse('{ int: 42, float: 3.14, negative: -10, hex: 0xFF }')

        assert result.get_root() == {
            'int': 42,
            'float': 3.14,
            'negative': -10,
            'hex': 255
        }

    def test_parse_booleans(self):
        parser = TonParser()
        result = parser.parse('{ yes: true, no: false }')

        assert result.get_root() == {
            'yes': True,
            'no': False
        }

    def test_parse_null_and_undefined(self):
        parser = TonParser()
        result = parser.parse('{ nothing: null, undef: undefined }')

        assert result.get_root() == {
            'nothing': None,
            'undef': None  # Python doesn't have undefined, maps to None
        }

    def test_parse_guid(self):
        parser = TonParser()
        result = parser.parse('{ id: 550e8400-e29b-41d4-a716-446655440000 }')

        assert result.get_root()['id'] == '550e8400-e29b-41d4-a716-446655440000'


class TestTonParserTypeAnnotations:
    """Tests for type annotations."""

    def test_parse_property_with_type_annotation(self):
        parser = TonParser()
        result = parser.parse('{ age:number: 30 }')

        root = result.get_root()
        assert root['age'] == 30

    def test_parse_multiple_type_annotations(self):
        parser = TonParser()
        result = parser.parse('{ name:string: "John", age:number: 30 }')

        assert result.get_root() == {
            'name': 'John',
            'age': 30
        }


class TestTonParserTypeHints:
    """Tests for type hints."""

    def test_parse_string_hint(self):
        parser = TonParser()
        result = parser.parse('{ value: $"text" }')

        assert result.get_root()['value'] == 'text'

    def test_parse_number_hint(self):
        parser = TonParser()
        result = parser.parse('{ value: %42 }')

        assert result.get_root()['value'] == 42

    def test_parse_boolean_hint(self):
        parser = TonParser()
        result = parser.parse('{ value: &true }')

        assert result.get_root()['value'] is True

    def test_parse_date_hint(self):
        parser = TonParser()
        result = parser.parse('{ value: ^"2024-01-01" }')

        assert isinstance(result.get_root()['value'], datetime)
        assert result.get_root()['value'].year == 2024


class TestTonParserEnums:
    """Tests for enum parsing."""

    def test_parse_single_enum(self):
        parser = TonParser()
        result = parser.parse('{ status: |active| }')

        assert result.get_root()['status'] == 'active'

    def test_parse_enum_set(self):
        parser = TonParser()
        result = parser.parse('{ permissions: |read|write|execute| }')

        assert result.get_root()['permissions'] == ['read', 'write', 'execute']


class TestTonParserClassObjects:
    """Tests for class objects."""

    def test_parse_typed_object(self):
        parser = TonParser()
        result = parser.parse('Person { name: "John" }')

        root = result.get_root()
        assert root.get('_className') == 'Person'
        assert root['name'] == 'John'

    def test_parse_typed_object_with_instance_count(self):
        parser = TonParser()
        result = parser.parse('Person(1) { name: "John" }')

        root = result.get_root()
        assert root.get('_className') == 'Person'
        assert root.get('_instanceId') == 1
        assert root['name'] == 'John'

    def test_parse_nested_typed_objects(self):
        parser = TonParser()
        result = parser.parse("""{
            user: Person {
                name: "John",
                address: Address {
                    city: "New York"
                }
            }
        }""")

        root = result.get_root()
        assert root['user'].get('_className') == 'Person'
        assert root['user']['address'].get('_className') == 'Address'
        assert root['user']['address']['city'] == 'New York'


class TestTonParserMultiLineStrings:
    """Tests for multi-line strings."""

    def test_parse_triple_quoted_string(self):
        parser = TonParser()
        result = parser.parse('{ text: """Hello\nWorld""" }')

        assert result.get_root()['text'] == 'Hello\nWorld'

    def test_parse_triple_quoted_string_with_indentation(self):
        parser = TonParser()
        result = parser.parse("""{
            text: \"\"\"
                Line 1
                Line 2
            \"\"\"
        }""")

        assert result.get_root()['text'] == 'Line 1\nLine 2'


class TestTonParserComments:
    """Tests for comment handling."""

    def test_ignore_single_line_comments(self):
        parser = TonParser()
        result = parser.parse("""{
            // This is a comment
            name: "John"
        }""")

        assert result.get_root() == {'name': 'John'}

    def test_ignore_multi_line_comments(self):
        parser = TonParser()
        result = parser.parse("""{
            /* This is a
               multi-line comment */
            name: "John"
        }""")

        assert result.get_root() == {'name': 'John'}


class TestTonParserComplexDocuments:
    """Tests for complex documents."""

    def test_parse_complex_nested_structure(self):
        parser = TonParser()
        input_text = """{
            version: "1.0.0",
            database: {
                host: "localhost",
                port: 5432,
                credentials: {
                    username: "admin",
                    password: "secret"
                }
            },
            features: ["auth", "api", "logging"],
            active: true
        }"""

        result = parser.parse(input_text)
        root = result.get_root()

        assert root['version'] == '1.0.0'
        assert root['database']['host'] == 'localhost'
        assert root['database']['port'] == 5432
        assert root['database']['credentials']['username'] == 'admin'
        assert root['features'] == ['auth', 'api', 'logging']
        assert root['active'] is True

    def test_parse_document_with_all_features(self):
        parser = TonParser()
        input_text = """{
            // Configuration file
            name:string: "MyApp",
            version: $"1.0.0",
            port: %8080,
            debug: &true,
            releaseDate: ^"2024-01-01",
            status: |production|,
            features: |read|write|,
            guid: 550e8400-e29b-41d4-a716-446655440000,
            server: Server(1) {
                host: "localhost"
            }
        }"""

        result = parser.parse(input_text)
        root = result.get_root()

        assert root['name'] == 'MyApp'
        assert root['version'] == '1.0.0'
        assert root['port'] == 8080
        assert root['debug'] is True
        assert isinstance(root['releaseDate'], datetime)
        assert root['status'] == 'production'
        assert root['features'] == ['read', 'write']
        assert root['guid'] == '550e8400-e29b-41d4-a716-446655440000'
        assert root['server'].get('_className') == 'Server'
        assert root['server'].get('_instanceId') == 1


class TestTonParserErrorHandling:
    """Tests for error handling."""

    def test_throw_on_invalid_syntax(self):
        parser = TonParser()
        with pytest.raises(TonParseError):
            parser.parse('{ invalid: }')

    def test_throw_on_unclosed_object(self):
        parser = TonParser()
        with pytest.raises(TonParseError):
            parser.parse('{ name: "John"')

    def test_throw_on_unclosed_array(self):
        parser = TonParser()
        with pytest.raises(TonParseError):
            parser.parse('[1, 2, 3')

    def test_provide_error_with_line_and_column(self):
        parser = TonParser()
        with pytest.raises(TonParseError) as exc_info:
            parser.parse('{\n  invalid: @\n}')

        assert hasattr(exc_info.value, 'line')
        assert hasattr(exc_info.value, 'column')


class TestTonParserEdgeCases:
    """Tests for edge cases."""

    def test_parse_empty_string_property(self):
        parser = TonParser()
        result = parser.parse('{ empty: "" }')

        assert result.get_root()['empty'] == ''

    def test_parse_property_with_special_characters(self):
        parser = TonParser()
        result = parser.parse('{ "special-key": "value" }')

        assert result.get_root()['special-key'] == 'value'

    def test_parse_unicode_strings(self):
        parser = TonParser()
        result = parser.parse('{ text: "Hello 世界 🌍" }')

        assert result.get_root()['text'] == 'Hello 世界 🌍'

    def test_parse_deeply_nested_structure(self):
        parser = TonParser()
        result = parser.parse('{ a: { b: { c: { d: { e: "deep" } } } } }')

        assert result.get_root()['a']['b']['c']['d']['e'] == 'deep'


class TestTonParserNumericProperties:
    """Tests for numeric property names."""

    def test_parse_property_starting_with_number(self):
        parser = TonParser()
        result = parser.parse('{ "2024config": "value" }')

        assert result.get_root()['2024config'] == 'value'

    def test_parse_pure_numeric_property(self):
        parser = TonParser()
        result = parser.parse('{ "123": "numeric key" }')

        assert result.get_root()['123'] == 'numeric key'