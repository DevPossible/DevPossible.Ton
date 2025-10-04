"""
TonValidator - Validator for TON format
Copyright (c) 2024 DevPossible, LLC
"""

from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional
from ..models import TonDocument, TonObject, TonValue, TonArray
from ..errors import TonValidationError


@dataclass
class TonValidationResult:
    """Result of validation."""
    is_valid: bool
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)


class TonValidator:
    """Validator for TON format."""

    def validate(self, document: TonDocument, schema: Dict[str, Any]) -> TonValidationResult:
        """Validate a document against a schema."""
        result = TonValidationResult(is_valid=True)

        try:
            self._validate_value(document.get_root(), schema, '', result)
        except TonValidationError as e:
            result.is_valid = False
            result.errors.append(str(e))

        return result

    def _validate_value(self, value: Any, schema: Dict[str, Any], path: str,
                        result: TonValidationResult) -> None:
        """Validate a value against a schema."""
        schema_type = schema.get('type')

        if schema_type == 'object':
            self._validate_object(value, schema, path, result)
        elif schema_type == 'array':
            self._validate_array(value, schema, path, result)
        elif schema_type == 'string':
            self._validate_string(value, schema, path, result)
        elif schema_type == 'number':
            self._validate_number(value, schema, path, result)
        elif schema_type == 'boolean':
            self._validate_boolean(value, schema, path, result)
        elif schema_type == 'null':
            self._validate_null(value, schema, path, result)

    def _validate_object(self, value: Any, schema: Dict[str, Any], path: str,
                         result: TonValidationResult) -> None:
        """Validate an object."""
        if not isinstance(value, TonObject):
            result.is_valid = False
            result.errors.append(f"{path}: Expected object, got {type(value).__name__}")
            return

        # Check required properties
        required = schema.get('required', [])
        for req_prop in required:
            if not value.has(req_prop):
                result.is_valid = False
                result.errors.append(f"{path}: Missing required property '{req_prop}'")

        # Validate properties
        properties_schema = schema.get('properties', {})
        for key in value.keys():
            if key in properties_schema:
                prop_path = f"{path}.{key}" if path else key
                prop_value = value.get(key)
                self._validate_value(prop_value, properties_schema[key], prop_path, result)

    def _validate_array(self, value: Any, schema: Dict[str, Any], path: str,
                        result: TonValidationResult) -> None:
        """Validate an array."""
        if not isinstance(value, TonArray):
            result.is_valid = False
            result.errors.append(f"{path}: Expected array, got {type(value).__name__}")
            return

        # Check min/max items
        min_items = schema.get('minItems')
        max_items = schema.get('maxItems')
        length = value.length()

        if min_items is not None and length < min_items:
            result.is_valid = False
            result.errors.append(f"{path}: Array has {length} items, minimum is {min_items}")

        if max_items is not None and length > max_items:
            result.is_valid = False
            result.errors.append(f"{path}: Array has {length} items, maximum is {max_items}")

        # Validate items
        items_schema = schema.get('items')
        if items_schema:
            for i in range(length):
                item_path = f"{path}[{i}]"
                item_value = value.get(i)
                self._validate_value(item_value, items_schema, item_path, result)

    def _validate_string(self, value: Any, schema: Dict[str, Any], path: str,
                         result: TonValidationResult) -> None:
        """Validate a string."""
        actual_value = value.get_value() if isinstance(value, TonValue) else value

        if not isinstance(actual_value, str):
            result.is_valid = False
            result.errors.append(f"{path}: Expected string, got {type(actual_value).__name__}")
            return

        # Check enum constraint
        enum_values = schema.get('enum')
        if enum_values is not None and actual_value not in enum_values:
            result.is_valid = False
            result.errors.append(f'{path}: Value "{actual_value}" is not in enum {enum_values}')
            return

        # Check min/max length
        min_length = schema.get('minLength')
        max_length = schema.get('maxLength')

        if min_length is not None and len(actual_value) < min_length:
            result.is_valid = False
            result.errors.append(f"{path}: String length {len(actual_value)} is less than minimum {min_length}")

        if max_length is not None and len(actual_value) > max_length:
            result.is_valid = False
            result.errors.append(f"{path}: String length {len(actual_value)} exceeds maximum {max_length}")

    def _validate_number(self, value: Any, schema: Dict[str, Any], path: str,
                         result: TonValidationResult) -> None:
        """Validate a number."""
        actual_value = value.get_value() if isinstance(value, TonValue) else value

        if not isinstance(actual_value, (int, float)):
            result.is_valid = False
            result.errors.append(f"{path}: Expected number, got {type(actual_value).__name__}")
            return

        # Check min/max
        minimum = schema.get('minimum')
        maximum = schema.get('maximum')

        if minimum is not None and actual_value < minimum:
            result.is_valid = False
            result.errors.append(f"{path}: Value {actual_value} is less than minimum {minimum}")

        if maximum is not None and actual_value > maximum:
            result.is_valid = False
            result.errors.append(f"{path}: Value {actual_value} exceeds maximum {maximum}")

    def _validate_boolean(self, value: Any, schema: Dict[str, Any], path: str,
                          result: TonValidationResult) -> None:
        """Validate a boolean."""
        actual_value = value.get_value() if isinstance(value, TonValue) else value

        if not isinstance(actual_value, bool):
            result.is_valid = False
            result.errors.append(f"{path}: Expected boolean, got {type(actual_value).__name__}")

    def _validate_null(self, value: Any, schema: Dict[str, Any], path: str,
                       result: TonValidationResult) -> None:
        """Validate null."""
        actual_value = value.get_value() if isinstance(value, TonValue) else value

        if actual_value is not None:
            result.is_valid = False
            result.errors.append(f"{path}: Expected null, got {type(actual_value).__name__}")
