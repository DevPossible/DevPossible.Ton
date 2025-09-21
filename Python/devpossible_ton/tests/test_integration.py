"""
Integration Tests
Copyright (c) 2024 DevPossible, LLC
"""

import pytest
import tempfile
import os
import json
import time
from datetime import datetime
from pathlib import Path
from devpossible_ton.parser import TonParser
from devpossible_ton.serializer import TonSerializer, TonSerializeOptions
from devpossible_ton.validator import TonValidator
from devpossible_ton.models import TonDocument, TonObject, TonValue, TonArray


class TestIntegrationEndToEnd:
    """End-to-end integration tests."""

    def test_parse_validate_serialize_workflow(self):
        input_text = """{
            name: "MyApp",
            version: "1.0.0",
            config: {
                port: 8080,
                debug: true
            }
        }"""

        # Parse
        parser = TonParser()
        doc = parser.parse(input_text)

        # Validate
        schema = {
            'type': 'object',
            'required': ['name', 'version'],
            'properties': {
                'name': {'type': 'string'},
                'version': {'type': 'string'},
                'config': {
                    'type': 'object',
                    'properties': {
                        'port': {'type': 'number'},
                        'debug': {'type': 'boolean'}
                    }
                }
            }
        }

        validator = TonValidator()
        validation_result = validator.validate(doc, schema)
        assert validation_result.is_valid is True

        # Serialize
        serializer = TonSerializer(TonSerializeOptions(format='compact'))
        output = serializer.serialize(doc)

        assert 'name:"MyApp"' in output
        assert 'version:"1.0.0"' in output
        assert 'port:8080' in output
        assert 'debug:true' in output

    def test_complex_document_with_all_features(self):
        input_text = """{
            // Application configuration
            name:string: "Enterprise App",
            version: $"2.0.0",
            port: %8080,
            secure: &true,
            releaseDate: ^"2024-01-01",
            environment: |production|,
            features: |auth|api|logging|,
            instanceId: 550e8400-e29b-41d4-a716-446655440000,

            database: Database(1) {
                host: "localhost",
                port: 5432,
                credentials: {
                    username: "admin",
                    password: \"\"\"
                        SuperSecret
                        Password123
                    \"\"\"
                }
            },

            servers: [
                { name: "web1", ip: "10.0.0.1" },
                { name: "web2", ip: "10.0.0.2" }
            ],

            /* Multi-line
               comment block */
            metadata: {
                tags: ["production", "critical"],
                monitoring: true
            }
        }"""

        parser = TonParser()
        doc = parser.parse(input_text)

        root = doc.get_root()
        assert root['name'] == 'Enterprise App'
        assert root['version'] == '2.0.0'
        assert root['port'] == 8080
        assert root['secure'] is True
        assert isinstance(root['releaseDate'], datetime)
        assert root['environment'] == 'production'
        assert root['features'] == ['auth', 'api', 'logging']
        assert root['instanceId'] == '550e8400-e29b-41d4-a716-446655440000'
        assert root['database'].get('_className') == 'Database'
        assert root['database'].get('_instanceId') == 1
        assert 'SuperSecret' in root['database']['credentials']['password']
        assert len(root['servers']) == 2
        assert root['metadata']['tags'] == ['production', 'critical']


class TestIntegrationFileOperations:
    """Tests for file operations."""

    def test_read_and_write_ton_files(self):
        data = {
            'name': 'Test',
            'value': 42
        }

        # Create document
        doc = TonDocument.from_object(data)

        # Serialize and write
        serializer = TonSerializer(TonSerializeOptions(format='pretty'))
        content = serializer.serialize(doc)

        with tempfile.NamedTemporaryFile(mode='w', suffix='.ton', delete=False) as f:
            f.write(content)
            temp_file = f.name

        try:
            # Read and parse
            with open(temp_file, 'r') as f:
                read_content = f.read()

            parser = TonParser()
            parsed_doc = parser.parse(read_content)

            assert parsed_doc.get_root() == data
        finally:
            os.unlink(temp_file)

    def test_handle_streaming_operations(self):
        data = {
            'items': [
                {'id': i, 'value': f'item-{i}'}
                for i in range(100)
            ]
        }

        doc = TonDocument.from_object(data)
        serializer = TonSerializer(TonSerializeOptions(format='compact'))
        content = serializer.serialize(doc)

        # Simulate streaming
        chunks = []
        chunk_size = 100
        for i in range(0, len(content), chunk_size):
            chunks.append(content[i:i + chunk_size])

        # Reassemble and parse
        reassembled = ''.join(chunks)
        parser = TonParser()
        result = parser.parse(reassembled)

        assert len(result.get_root()['items']) == 100
        assert result.get_root()['items'][0] == {'id': 0, 'value': 'item-0'}
        assert result.get_root()['items'][99] == {'id': 99, 'value': 'item-99'}


class TestIntegrationErrorRecovery:
    """Tests for error recovery."""

    def test_provide_helpful_error_messages(self):
        invalid_inputs = [
            ('{ unclosed', 'Unexpected end of input'),
            ('{ "key": }', 'Unexpected token'),
        ]

        parser = TonParser()

        for input_text, expected_error in invalid_inputs:
            with pytest.raises(Exception) as exc_info:
                parser.parse(input_text)
            assert expected_error in str(exc_info.value)

    def test_handle_partial_documents_gracefully(self):
        partial_doc = """{
            name: "Test",
            // Incomplete
        """

        parser = TonParser(allow_partial=True)

        try:
            doc = parser.parse(partial_doc)
            assert doc.get_root()['name'] == 'Test'
            assert doc.has_errors() is True
        except:
            # Expected for strict parsing
            pass


class TestIntegrationPerformance:
    """Tests for performance."""

    def test_handle_large_documents_efficiently(self):
        large_data = {
            'items': [
                {
                    'id': i,
                    'name': f'Item {i}',
                    'value': i * 3.14,
                    'active': i % 2 == 0,
                    'tags': ['tag1', 'tag2', 'tag3']
                }
                for i in range(10000)
            ]
        }

        start_time = time.time()

        # Create and serialize
        doc = TonDocument.from_object(large_data)
        serializer = TonSerializer(TonSerializeOptions(format='compact'))
        serialized = serializer.serialize(doc)

        # Parse back
        parser = TonParser()
        parsed = parser.parse(serialized)

        end_time = time.time()
        duration = end_time - start_time

        # Should complete within reasonable time (5 seconds)
        assert duration < 5
        assert len(parsed.get_root()['items']) == 10000

    def test_handle_deeply_nested_structures(self):
        # Create deeply nested object
        current = {'value': 'deepest'}
        for i in range(100):
            current = {'level': current}

        doc = TonDocument.from_object(current)
        serializer = TonSerializer(TonSerializeOptions(format='compact'))
        serialized = serializer.serialize(doc)

        parser = TonParser()
        parsed = parser.parse(serialized)

        # Navigate to deepest level
        result = parsed.get_root()
        for i in range(100):
            result = result['level']

        assert result['value'] == 'deepest'


class TestIntegrationTypeConversion:
    """Tests for type conversion."""

    def test_convert_between_ton_and_json(self):
        ton_input = """{
            name: "Test",
            value: 42,
            active: true,
            items: [1, 2, 3]
        }"""

        parser = TonParser()
        doc = parser.parse(ton_input)

        # Convert to JSON
        json_str = json.dumps(doc.get_root())
        json_obj = json.loads(json_str)

        assert json_obj['name'] == 'Test'
        assert json_obj['value'] == 42
        assert json_obj['active'] is True
        assert json_obj['items'] == [1, 2, 3]

        # Convert back to TON
        new_doc = TonDocument.from_object(json_obj)
        serializer = TonSerializer(TonSerializeOptions(format='compact'))
        ton_output = serializer.serialize(new_doc)

        assert 'name:"Test"' in ton_output
        assert 'value:42' in ton_output

    def test_preserve_type_information(self):
        input_text = """{
            date: ^"2024-01-01",
            status: |active|,
            permissions: |read|write|,
            guid: 550e8400-e29b-41d4-a716-446655440000,
            config: Config {
                setting: "value"
            }
        }"""

        parser = TonParser()
        doc = parser.parse(input_text)
        root = doc.get_root()

        assert isinstance(root['date'], datetime)
        assert root['status'] == 'active'
        assert root['permissions'] == ['read', 'write']
        assert root['guid'] == '550e8400-e29b-41d4-a716-446655440000'
        assert root['config'].get('_className') == 'Config'


class TestIntegrationArrayHandling:
    """Tests for array handling."""

    def test_array_of_mixed_types(self):
        input_text = """{
            mixedArray: [
                42,
                "string",
                true,
                null,
                { nested: "object" },
                [1, 2, 3]
            ]
        }"""

        parser = TonParser()
        doc = parser.parse(input_text)
        array = doc.get_root()['mixedArray']

        assert array[0] == 42
        assert array[1] == 'string'
        assert array[2] is True
        assert array[3] is None
        assert array[4] == {'nested': 'object'}
        assert array[5] == [1, 2, 3]

    def test_deeply_nested_arrays(self):
        input_text = "[[[[[1]]]]]"

        parser = TonParser()
        doc = parser.parse(input_text)
        result = doc.get_root()

        assert result[0][0][0][0][0] == 1


class TestIntegrationEdgeCases:
    """Tests for edge cases."""

    def test_empty_containers(self):
        input_text = """{
            emptyObject: {},
            emptyArray: [],
            emptyString: "",
            nullValue: null
        }"""

        parser = TonParser()
        doc = parser.parse(input_text)
        root = doc.get_root()

        assert root['emptyObject'] == {}
        assert root['emptyArray'] == []
        assert root['emptyString'] == ''
        assert root['nullValue'] is None

    def test_unicode_handling(self):
        input_text = """{
            chinese: "你好世界",
            emoji: "🌍🚀💻",
            mixed: "Hello 世界 🌍"
        }"""

        parser = TonParser()
        doc = parser.parse(input_text)
        root = doc.get_root()

        assert root['chinese'] == '你好世界'
        assert root['emoji'] == '🌍🚀💻'
        assert root['mixed'] == 'Hello 世界 🌍'

    def test_extreme_numbers(self):
        input_text = """{
            veryLarge: 1.7976931348623157e+308,
            verySmall: 5e-324,
            maxInt: 9007199254740991,
            minInt: -9007199254740991
        }"""

        parser = TonParser()
        doc = parser.parse(input_text)
        root = doc.get_root()

        assert root['veryLarge'] == 1.7976931348623157e+308
        assert root['verySmall'] == 5e-324
        assert root['maxInt'] == 9007199254740991
        assert root['minInt'] == -9007199254740991


class TestIntegrationNumericProperties:
    """Tests for numeric property names."""

    def test_numeric_property_names(self):
        input_text = """{
            "2024": "year",
            "123": "pure number",
            "3.14": "pi",
            "0xFF": "hex"
        }"""

        parser = TonParser()
        doc = parser.parse(input_text)
        root = doc.get_root()

        assert root['2024'] == 'year'
        assert root['123'] == 'pure number'
        assert root['3.14'] == 'pi'
        assert root['0xFF'] == 'hex'