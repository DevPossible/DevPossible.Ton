"""
TonSerializer Tests
Copyright (c) 2024 DevPossible, LLC
"""

import pytest
from devpossible_ton.serializer import TonSerializer, TonSerializeOptions
from devpossible_ton.models import TonDocument, TonObject, TonValue, TonArray
from devpossible_ton.parser import TonParser


class TestTonSerializerBasic:
    """Tests for basic serialization."""

    def test_serialize_empty_object(self):
        doc = TonDocument()
        doc.set_root(TonObject())

        serializer = TonSerializer()
        result = serializer.serialize(doc)

        assert result == '{}'

    def test_serialize_object_with_properties(self):
        obj = TonObject()
        obj.set('name', TonValue('John'))
        obj.set('age', TonValue(30))

        doc = TonDocument()
        doc.set_root(obj)

        options = TonSerializeOptions(format='compact')
        serializer = TonSerializer(options)
        result = serializer.serialize(doc)

        assert result == '{name:"John",age:30}'

    def test_serialize_array(self):
        arr = TonArray()
        arr.push(TonValue(1))
        arr.push(TonValue(2))
        arr.push(TonValue(3))

        doc = TonDocument()
        doc.set_root(arr)

        options = TonSerializeOptions(format='compact')
        serializer = TonSerializer(options)
        result = serializer.serialize(doc)

        assert result == '[1,2,3]'

    def test_serialize_nested_objects(self):
        inner = TonObject()
        inner.set('city', TonValue('New York'))

        outer = TonObject()
        outer.set('name', TonValue('John'))
        outer.set('address', inner)

        doc = TonDocument()
        doc.set_root(outer)

        options = TonSerializeOptions(format='compact')
        serializer = TonSerializer(options)
        result = serializer.serialize(doc)

        assert result == '{name:"John",address:{city:"New York"}}'


class TestTonSerializerFormatting:
    """Tests for pretty formatting."""

    def test_serialize_with_indentation(self):
        obj = TonObject()
        obj.set('name', TonValue('John'))
        obj.set('age', TonValue(30))

        doc = TonDocument()
        doc.set_root(obj)

        options = TonSerializeOptions(format='pretty', indent='  ')
        serializer = TonSerializer(options)
        result = serializer.serialize(doc)

        expected = '{\n  name: "John"\n  age: 30\n}'
        assert result == expected

    def test_serialize_nested_objects_with_indentation(self):
        inner = TonObject()
        inner.set('city', TonValue('New York'))

        outer = TonObject()
        outer.set('name', TonValue('John'))
        outer.set('address', inner)

        doc = TonDocument()
        doc.set_root(outer)

        options = TonSerializeOptions(format='pretty', indent='  ')
        serializer = TonSerializer(options)
        result = serializer.serialize(doc)

        expected = '{\n  name: "John"\n  address: {\n    city: "New York"\n  }\n}'
        assert result == expected

    def test_serialize_arrays_with_indentation(self):
        arr = TonArray()
        arr.push(TonValue('one'))
        arr.push(TonValue('two'))

        doc = TonDocument()
        doc.set_root(arr)

        options = TonSerializeOptions(format='pretty', indent='  ')
        serializer = TonSerializer(options)
        result = serializer.serialize(doc)

        expected = '[\n  "one"\n  "two"\n]'
        assert result == expected


class TestTonSerializerDataTypes:
    """Tests for different data types."""

    def test_serialize_strings_with_quotes(self):
        obj = TonObject()
        obj.set('text', TonValue('Hello "World"'))

        doc = TonDocument()
        doc.set_root(obj)

        options = TonSerializeOptions(format='compact')
        serializer = TonSerializer(options)
        result = serializer.serialize(doc)

        assert result == '{text:"Hello \\"World\\""}'

    def test_serialize_numbers(self):
        obj = TonObject()
        obj.set('int', TonValue(42))
        obj.set('float', TonValue(3.14))
        obj.set('negative', TonValue(-10))

        doc = TonDocument()
        doc.set_root(obj)

        options = TonSerializeOptions(format='compact')
        serializer = TonSerializer(options)
        result = serializer.serialize(doc)

        assert 'int:42' in result
        assert 'float:3.14' in result
        assert 'negative:-10' in result

    def test_serialize_booleans(self):
        obj = TonObject()
        obj.set('yes', TonValue(True))
        obj.set('no', TonValue(False))

        doc = TonDocument()
        doc.set_root(obj)

        options = TonSerializeOptions(format='compact')
        serializer = TonSerializer(options)
        result = serializer.serialize(doc)

        assert 'yes:true' in result
        assert 'no:false' in result

    def test_serialize_null_and_undefined(self):
        obj = TonObject()
        obj.set('nothing', TonValue(None))

        doc = TonDocument()
        doc.set_root(obj)

        options = TonSerializeOptions(format='compact', omit_null=False)
        serializer = TonSerializer(options)
        result = serializer.serialize(doc)

        assert 'nothing:null' in result

    def test_serialize_guid(self):
        obj = TonObject()
        obj.set('id', TonValue('550e8400-e29b-41d4-a716-446655440000'))

        doc = TonDocument()
        doc.set_root(obj)

        options = TonSerializeOptions(format='compact')
        serializer = TonSerializer(options)
        result = serializer.serialize(doc)

        assert result == '{id:550e8400-e29b-41d4-a716-446655440000}'


class TestTonSerializerTypeAnnotations:
    """Tests for type annotations."""

    def test_serialize_with_type_annotations(self):
        obj = TonObject()
        obj.set('age:number', TonValue(30))

        doc = TonDocument()
        doc.set_root(obj)

        options = TonSerializeOptions(format='compact', include_types=True)
        serializer = TonSerializer(options)
        result = serializer.serialize(doc)

        assert result == '{age:number:30}'


class TestTonSerializerTypeHints:
    """Tests for type hints."""

    def test_serialize_string_hint(self):
        obj = TonObject()
        obj.set('value', TonValue('text', type_hint='string'))

        doc = TonDocument()
        doc.set_root(obj)

        options = TonSerializeOptions(format='compact', include_hints=True)
        serializer = TonSerializer(options)
        result = serializer.serialize(doc)

        assert result == '{value:$"text"}'

    def test_serialize_number_hint(self):
        obj = TonObject()
        obj.set('value', TonValue(42, type_hint='number'))

        doc = TonDocument()
        doc.set_root(obj)

        options = TonSerializeOptions(format='compact', include_hints=True)
        serializer = TonSerializer(options)
        result = serializer.serialize(doc)

        assert result == '{value:%42}'

    def test_serialize_boolean_hint(self):
        obj = TonObject()
        obj.set('value', TonValue(True, type_hint='boolean'))

        doc = TonDocument()
        doc.set_root(obj)

        options = TonSerializeOptions(format='compact', include_hints=True)
        serializer = TonSerializer(options)
        result = serializer.serialize(doc)

        assert result == '{value:&true}'

    def test_serialize_date_hint(self):
        obj = TonObject()
        obj.set('value', TonValue('2024-01-01', type_hint='date'))

        doc = TonDocument()
        doc.set_root(obj)

        options = TonSerializeOptions(format='compact', include_hints=True)
        serializer = TonSerializer(options)
        result = serializer.serialize(doc)

        assert result == '{value:^"2024-01-01"}'


class TestTonSerializerEnums:
    """Tests for enum serialization."""

    def test_serialize_single_enum(self):
        obj = TonObject()
        obj.set('status', TonValue('active', type_hint='enum'))

        doc = TonDocument()
        doc.set_root(obj)

        options = TonSerializeOptions(format='compact')
        serializer = TonSerializer(options)
        result = serializer.serialize(doc)

        assert result == '{status:|active|}'

    def test_serialize_enum_set(self):
        obj = TonObject()
        obj.set('permissions', TonValue(['read', 'write'], type_hint='enumSet'))

        doc = TonDocument()
        doc.set_root(obj)

        options = TonSerializeOptions(format='compact')
        serializer = TonSerializer(options)
        result = serializer.serialize(doc)

        assert result == '{permissions:|read|write|}'


class TestTonSerializerClassObjects:
    """Tests for class objects."""

    def test_serialize_typed_object(self):
        obj = TonObject(class_name='Person')
        obj.set('name', TonValue('John'))

        doc = TonDocument()
        doc.set_root(obj)

        options = TonSerializeOptions(format='compact')
        serializer = TonSerializer(options)
        result = serializer.serialize(doc)

        assert result == 'Person{name:"John"}'

    def test_serialize_typed_object_with_instance(self):
        obj = TonObject(class_name='Person', instance_id=1)
        obj.set('name', TonValue('John'))

        doc = TonDocument()
        doc.set_root(obj)

        options = TonSerializeOptions(format='compact')
        serializer = TonSerializer(options)
        result = serializer.serialize(doc)

        assert result == 'Person(1){name:"John"}'


class TestTonSerializerOptions:
    """Tests for serializer options."""

    def test_omit_null_values(self):
        obj = TonObject()
        obj.set('name', TonValue('John'))
        obj.set('age', TonValue(None))

        doc = TonDocument()
        doc.set_root(obj)

        options = TonSerializeOptions(format='compact', omit_null=True)
        serializer = TonSerializer(options)
        result = serializer.serialize(doc)

        assert result == '{name:"John"}'

    def test_custom_indentation(self):
        obj = TonObject()
        obj.set('name', TonValue('John'))

        doc = TonDocument()
        doc.set_root(obj)

        options = TonSerializeOptions(format='pretty', indent='    ')
        serializer = TonSerializer(options)
        result = serializer.serialize(doc)

        assert result == '{\n    name: "John"\n}'


class TestTonSerializerRoundTrip:
    """Tests for round-trip serialization."""

    def test_maintain_data_through_parse_and_serialize(self):
        original = {
            'name': 'John',
            'age': 30,
            'active': True,
            'tags': ['developer', 'python'],
            'address': {
                'city': 'New York',
                'zip': '10001'
            }
        }

        doc = TonDocument.from_object(original)
        options = TonSerializeOptions(format='compact')
        serializer = TonSerializer(options)
        serialized = serializer.serialize(doc)

        parser = TonParser()
        parsed = parser.parse(serialized)

        assert parsed.get_root() == original