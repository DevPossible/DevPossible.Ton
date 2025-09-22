"""
TonValidator Tests
Copyright (c) 2024 DevPossible, LLC
"""

import pytest
from devpossible_ton.validator import TonValidator
from devpossible_ton.models import TonDocument, TonObject, TonValue, TonArray


class TestTonValidatorTypeValidation:
    """Tests for type validation."""

    def test_validate_string_type(self):
        obj = TonObject()
        obj.set('name', TonValue('John'))

        doc = TonDocument()
        doc.set_root(obj)

        schema = {
            'type': 'object',
            'properties': {
                'name': {'type': 'string'}
            }
        }

        validator = TonValidator()
        result = validator.validate(doc, schema)

        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_fail_on_wrong_string_type(self):
        obj = TonObject()
        obj.set('name', TonValue(123))

        doc = TonDocument()
        doc.set_root(obj)

        schema = {
            'type': 'object',
            'properties': {
                'name': {'type': 'string'}
            }
        }

        validator = TonValidator()
        result = validator.validate(doc, schema)

        assert result.is_valid is False
        assert 'name: Expected string, got int' in result.errors[0]

    def test_validate_number_type(self):
        obj = TonObject()
        obj.set('age', TonValue(30))

        doc = TonDocument()
        doc.set_root(obj)

        schema = {
            'type': 'object',
            'properties': {
                'age': {'type': 'number'}
            }
        }

        validator = TonValidator()
        result = validator.validate(doc, schema)

        assert result.is_valid is True

    def test_validate_boolean_type(self):
        obj = TonObject()
        obj.set('active', TonValue(True))

        doc = TonDocument()
        doc.set_root(obj)

        schema = {
            'type': 'object',
            'properties': {
                'active': {'type': 'boolean'}
            }
        }

        validator = TonValidator()
        result = validator.validate(doc, schema)

        assert result.is_valid is True

    def test_validate_null_type(self):
        obj = TonObject()
        obj.set('value', TonValue(None))

        doc = TonDocument()
        doc.set_root(obj)

        schema = {
            'type': 'object',
            'properties': {
                'value': {'type': 'null'}
            }
        }

        validator = TonValidator()
        result = validator.validate(doc, schema)

        assert result.is_valid is True


class TestTonValidatorRequiredProperties:
    """Tests for required properties."""

    def test_validate_required_properties_exist(self):
        obj = TonObject()
        obj.set('name', TonValue('John'))
        obj.set('age', TonValue(30))

        doc = TonDocument()
        doc.set_root(obj)

        schema = {
            'type': 'object',
            'required': ['name', 'age'],
            'properties': {
                'name': {'type': 'string'},
                'age': {'type': 'number'}
            }
        }

        validator = TonValidator()
        result = validator.validate(doc, schema)

        assert result.is_valid is True

    def test_fail_on_missing_required_property(self):
        obj = TonObject()
        obj.set('name', TonValue('John'))

        doc = TonDocument()
        doc.set_root(obj)

        schema = {
            'type': 'object',
            'required': ['name', 'age'],
            'properties': {
                'name': {'type': 'string'},
                'age': {'type': 'number'}
            }
        }

        validator = TonValidator()
        result = validator.validate(doc, schema)

        assert result.is_valid is False
        assert "Missing required property 'age'" in result.errors[0]


class TestTonValidatorStringConstraints:
    """Tests for string constraints."""

    def test_validate_minlength(self):
        obj = TonObject()
        obj.set('password', TonValue('12345678'))

        doc = TonDocument()
        doc.set_root(obj)

        schema = {
            'type': 'object',
            'properties': {
                'password': {'type': 'string', 'minLength': 8}
            }
        }

        validator = TonValidator()
        result = validator.validate(doc, schema)

        assert result.is_valid is True

    def test_fail_on_string_too_short(self):
        obj = TonObject()
        obj.set('password', TonValue('1234'))

        doc = TonDocument()
        doc.set_root(obj)

        schema = {
            'type': 'object',
            'properties': {
                'password': {'type': 'string', 'minLength': 8}
            }
        }

        validator = TonValidator()
        result = validator.validate(doc, schema)

        assert result.is_valid is False
        assert 'String length 4 is less than minimum 8' in result.errors[0]

    def test_validate_maxlength(self):
        obj = TonObject()
        obj.set('username', TonValue('john'))

        doc = TonDocument()
        doc.set_root(obj)

        schema = {
            'type': 'object',
            'properties': {
                'username': {'type': 'string', 'maxLength': 10}
            }
        }

        validator = TonValidator()
        result = validator.validate(doc, schema)

        assert result.is_valid is True

    def test_validate_pattern(self):
        obj = TonObject()
        obj.set('email', TonValue('john@example.com'))

        doc = TonDocument()
        doc.set_root(obj)

        schema = {
            'type': 'object',
            'properties': {
                'email': {'type': 'string', 'pattern': '^[^@]+@[^@]+\\.[^@]+$'}
            }
        }

        validator = TonValidator()
        result = validator.validate(doc, schema)

        assert result.is_valid is True


class TestTonValidatorNumberConstraints:
    """Tests for number constraints."""

    def test_validate_minimum(self):
        obj = TonObject()
        obj.set('age', TonValue(18))

        doc = TonDocument()
        doc.set_root(obj)

        schema = {
            'type': 'object',
            'properties': {
                'age': {'type': 'number', 'minimum': 18}
            }
        }

        validator = TonValidator()
        result = validator.validate(doc, schema)

        assert result.is_valid is True

    def test_fail_on_number_below_minimum(self):
        obj = TonObject()
        obj.set('age', TonValue(16))

        doc = TonDocument()
        doc.set_root(obj)

        schema = {
            'type': 'object',
            'properties': {
                'age': {'type': 'number', 'minimum': 18}
            }
        }

        validator = TonValidator()
        result = validator.validate(doc, schema)

        assert result.is_valid is False
        assert 'Value 16 is less than minimum 18' in result.errors[0]

    def test_validate_maximum(self):
        obj = TonObject()
        obj.set('score', TonValue(95))

        doc = TonDocument()
        doc.set_root(obj)

        schema = {
            'type': 'object',
            'properties': {
                'score': {'type': 'number', 'maximum': 100}
            }
        }

        validator = TonValidator()
        result = validator.validate(doc, schema)

        assert result.is_valid is True


class TestTonValidatorArrayValidation:
    """Tests for array validation."""

    def test_validate_array_type(self):
        arr = TonArray()
        arr.push(TonValue(1))
        arr.push(TonValue(2))

        obj = TonObject()
        obj.set('numbers', arr)

        doc = TonDocument()
        doc.set_root(obj)

        schema = {
            'type': 'object',
            'properties': {
                'numbers': {
                    'type': 'array',
                    'items': {'type': 'number'}
                }
            }
        }

        validator = TonValidator()
        result = validator.validate(doc, schema)

        assert result.is_valid is True

    def test_validate_min_items(self):
        arr = TonArray()
        arr.push(TonValue(1))
        arr.push(TonValue(2))

        obj = TonObject()
        obj.set('items', arr)

        doc = TonDocument()
        doc.set_root(obj)

        schema = {
            'type': 'object',
            'properties': {
                'items': {
                    'type': 'array',
                    'minItems': 2
                }
            }
        }

        validator = TonValidator()
        result = validator.validate(doc, schema)

        assert result.is_valid is True

    def test_fail_on_array_too_short(self):
        arr = TonArray()
        arr.push(TonValue(1))

        obj = TonObject()
        obj.set('items', arr)

        doc = TonDocument()
        doc.set_root(obj)

        schema = {
            'type': 'object',
            'properties': {
                'items': {
                    'type': 'array',
                    'minItems': 2
                }
            }
        }

        validator = TonValidator()
        result = validator.validate(doc, schema)

        assert result.is_valid is False
        assert 'Array has 1 items, minimum is 2' in result.errors[0]

    def test_validate_max_items(self):
        arr = TonArray()
        arr.push(TonValue(1))
        arr.push(TonValue(2))

        obj = TonObject()
        obj.set('items', arr)

        doc = TonDocument()
        doc.set_root(obj)

        schema = {
            'type': 'object',
            'properties': {
                'items': {
                    'type': 'array',
                    'maxItems': 5
                }
            }
        }

        validator = TonValidator()
        result = validator.validate(doc, schema)

        assert result.is_valid is True

    def test_validate_array_item_types(self):
        arr = TonArray()
        arr.push(TonValue('one'))
        arr.push(TonValue('two'))

        obj = TonObject()
        obj.set('strings', arr)

        doc = TonDocument()
        doc.set_root(obj)

        schema = {
            'type': 'object',
            'properties': {
                'strings': {
                    'type': 'array',
                    'items': {'type': 'string'}
                }
            }
        }

        validator = TonValidator()
        result = validator.validate(doc, schema)

        assert result.is_valid is True


class TestTonValidatorNestedObjects:
    """Tests for nested object validation."""

    def test_validate_nested_objects(self):
        inner = TonObject()
        inner.set('city', TonValue('New York'))
        inner.set('zip', TonValue('10001'))

        outer = TonObject()
        outer.set('name', TonValue('John'))
        outer.set('address', inner)

        doc = TonDocument()
        doc.set_root(outer)

        schema = {
            'type': 'object',
            'properties': {
                'name': {'type': 'string'},
                'address': {
                    'type': 'object',
                    'properties': {
                        'city': {'type': 'string'},
                        'zip': {'type': 'string'}
                    }
                }
            }
        }

        validator = TonValidator()
        result = validator.validate(doc, schema)

        assert result.is_valid is True

    def test_validate_deeply_nested_structures(self):
        level3 = TonObject()
        level3.set('value', TonValue('deep'))

        level2 = TonObject()
        level2.set('nested', level3)

        level1 = TonObject()
        level1.set('data', level2)

        doc = TonDocument()
        doc.set_root(level1)

        schema = {
            'type': 'object',
            'properties': {
                'data': {
                    'type': 'object',
                    'properties': {
                        'nested': {
                            'type': 'object',
                            'properties': {
                                'value': {'type': 'string'}
                            }
                        }
                    }
                }
            }
        }

        validator = TonValidator()
        result = validator.validate(doc, schema)

        assert result.is_valid is True


class TestTonValidatorEnumValidation:
    """Tests for enum validation."""

    def test_validate_enum_values(self):
        obj = TonObject()
        obj.set('status', TonValue('active'))

        doc = TonDocument()
        doc.set_root(obj)

        schema = {
            'type': 'object',
            'properties': {
                'status': {
                    'type': 'string',
                    'enum': ['active', 'inactive', 'pending']
                }
            }
        }

        validator = TonValidator()
        result = validator.validate(doc, schema)

        assert result.is_valid is True

    def test_fail_on_invalid_enum_value(self):
        obj = TonObject()
        obj.set('status', TonValue('unknown'))

        doc = TonDocument()
        doc.set_root(obj)

        schema = {
            'type': 'object',
            'properties': {
                'status': {
                    'type': 'string',
                    'enum': ['active', 'inactive', 'pending']
                }
            }
        }

        validator = TonValidator()
        result = validator.validate(doc, schema)

        assert result.is_valid is False
        assert 'Value "unknown" is not in enum' in result.errors[0]


class TestTonValidatorComplexSchemas:
    """Tests for complex schemas."""

    def test_validate_complex_document(self):
        config = TonObject()
        config.set('host', TonValue('localhost'))
        config.set('port', TonValue(5432))

        doc = TonDocument()
        doc.set_root(config)

        schema = {
            'type': 'object',
            'required': ['host', 'port'],
            'properties': {
                'host': {
                    'type': 'string',
                    'minLength': 1
                },
                'port': {
                    'type': 'number',
                    'minimum': 1,
                    'maximum': 65535
                }
            }
        }

        validator = TonValidator()
        result = validator.validate(doc, schema)

        assert result.is_valid is True


class TestTonValidatorPathBasedValidation:
    """Tests for path-based validation rules."""

    def test_validate_specific_path(self):
        inner = TonObject()
        inner.set('required_field', TonValue('value'))

        outer = TonObject()
        outer.set('optional', TonValue('data'))
        outer.set('nested', inner)

        doc = TonDocument()
        doc.set_root(outer)

        schema = {
            'type': 'object',
            'properties': {
                'optional': {'type': 'string'},
                'nested': {
                    'type': 'object',
                    'required': ['required_field'],
                    'properties': {
                        'required_field': {'type': 'string'}
                    }
                }
            }
        }

        validator = TonValidator()
        result = validator.validate(doc, schema)

        assert result.is_valid is True