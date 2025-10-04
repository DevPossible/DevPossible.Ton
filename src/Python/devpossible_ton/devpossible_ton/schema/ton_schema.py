"""
TonSchema - Schema definitions for TON format
Copyright (c) 2024 DevPossible, LLC
"""

from enum import Enum
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field


class ValidationRuleType(Enum):
    """Types of validation rules"""
    
    # Universal validations
    REQUIRED = 'required'
    NOT_NULL = 'not_null'
    DEFAULT = 'default'
    DEFAULT_WHEN_NULL = 'default_when_null'
    DEFAULT_WHEN_EMPTY = 'default_when_empty'
    DEFAULT_WHEN_INVALID = 'default_when_invalid'
    
    # String validations
    MIN_LENGTH = 'min_length'
    MAX_LENGTH = 'max_length'
    LENGTH = 'length'
    PATTERN = 'pattern'
    FORMAT = 'format'
    ENUM = 'enum'
    
    # Numeric validations
    MIN = 'min'
    MAX = 'max'
    RANGE = 'range'
    POSITIVE = 'positive'
    NEGATIVE = 'negative'
    NON_NEGATIVE = 'non_negative'
    NON_POSITIVE = 'non_positive'
    MULTIPLE_OF = 'multiple_of'
    
    # Integer-specific
    BITS = 'bits'
    UNSIGNED = 'unsigned'
    SIGNED = 'signed'
    
    # GUID validations
    GUID_FORMAT = 'guid_format'
    VERSION = 'version'
    
    # Date validations
    AFTER = 'after'
    BEFORE = 'before'
    BETWEEN = 'between'
    FUTURE = 'future'
    PAST = 'past'
    
    # Enum validations
    ALLOW_INDEX = 'allow_index'
    STRICT_INDEX = 'strict_index'
    
    # Collection validations
    MIN_COUNT = 'min_count'
    MAX_COUNT = 'max_count'
    COUNT = 'count'
    
    # Array-specific validations
    NON_EMPTY = 'non_empty'
    UNIQUE = 'unique'
    SORTED = 'sorted'
    ALLOW_DUPLICATES = 'allow_duplicates'


@dataclass
class TonValidationRule:
    """Represents a validation rule"""
    
    rule_type: ValidationRuleType
    parameters: Optional[List[Any]] = None
    message: Optional[str] = None
    
    def __init__(self, rule_type: ValidationRuleType, *parameters, message: Optional[str] = None):
        self.rule_type = rule_type
        self.parameters = list(parameters) if parameters else None
        self.message = message


class TonPropertySchema:
    """Represents schema for a single property"""
    
    def __init__(self, path: str, property_type: str):
        self.path = path
        self.type = property_type
        self.validations: List[TonValidationRule] = []
    
    def add_validation(self, rule: TonValidationRule) -> None:
        """Adds a validation rule"""
        self.validations.append(rule)
    
    @property
    def is_required(self) -> bool:
        """Checks if the property is required"""
        return any(v.rule_type == ValidationRuleType.REQUIRED for v in self.validations)
    
    @property
    def allows_null(self) -> bool:
        """Checks if the property allows null"""
        return not any(v.rule_type == ValidationRuleType.NOT_NULL for v in self.validations)
    
    def get_default_value(self) -> Optional[Any]:
        """Gets the default value if defined"""
        for validation in self.validations:
            if validation.rule_type == ValidationRuleType.DEFAULT:
                if validation.parameters and len(validation.parameters) > 0:
                    return validation.parameters[0]
        return None


class TonSchemaDefinition:
    """Represents a schema definition for a TON class"""
    
    def __init__(self, class_name: str):
        self.class_name = class_name
        self.properties: Dict[str, TonPropertySchema] = {}
    
    def add_property(self, path: str, property_schema: TonPropertySchema) -> None:
        """Adds a property schema"""
        self.properties[path] = property_schema
    
    def get_property(self, path: str) -> Optional[TonPropertySchema]:
        """Gets a property schema by path"""
        return self.properties.get(path)
    
    def has_property(self, path: str) -> bool:
        """Checks if a property exists"""
        return path in self.properties


class TonEnumDefinition:
    """Represents an enum definition in the schema"""
    
    def __init__(self, name: str, values: List[str], is_enum_set: bool = False, description: Optional[str] = None):
        self.name = name
        self.values = values
        self.is_enum_set = is_enum_set
        self.description = description
    
    def is_valid_value(self, value: str) -> bool:
        """Validates if a value is valid for this enum"""
        # Check if it's an index
        try:
            index = int(value)
            return 0 <= index < len(self.values)
        except ValueError:
            pass
        
        # Check if it's a valid name (case-insensitive)
        return value.lower() in [v.lower() for v in self.values]
    
    def get_value_at(self, index: int) -> Optional[str]:
        """Gets the value at the specified index"""
        if 0 <= index < len(self.values):
            return self.values[index]
        return None
    
    def get_index_of(self, value: str) -> int:
        """Gets the index of a value (case-insensitive)"""
        value_lower = value.lower()
        for i, v in enumerate(self.values):
            if v.lower() == value_lower:
                return i
        return -1
    
    @staticmethod
    def from_config(config: Dict[str, Any]) -> 'TonEnumDefinition':
        """Creates a TonEnumDefinition from a configuration object"""
        return TonEnumDefinition(
            name=config['name'],
            values=config['values'],
            is_enum_set=config.get('is_enum_set', False),
            description=config.get('description')
        )


class TonSchemaCollection:
    """Collection of schema definitions"""
    
    def __init__(self):
        self._schemas: Dict[str, TonSchemaDefinition] = {}
        self._enums: Dict[str, TonEnumDefinition] = {}
    
    def add_schema(self, schema: TonSchemaDefinition) -> None:
        """Adds a schema definition"""
        self._schemas[schema.class_name.lower()] = schema
    
    def get_schema(self, class_name: str) -> Optional[TonSchemaDefinition]:
        """Gets a schema by class name (case-insensitive)"""
        return self._schemas.get(class_name.lower())
    
    def has_schema(self, class_name: str) -> bool:
        """Checks if a schema exists"""
        return class_name.lower() in self._schemas
    
    def remove_schema(self, class_name: str) -> bool:
        """Removes a schema"""
        key = class_name.lower()
        if key in self._schemas:
            del self._schemas[key]
            return True
        return False
    
    def get_all_schemas(self) -> Dict[str, TonSchemaDefinition]:
        """Gets all schema definitions"""
        return dict(self._schemas)
    
    def add_enum(self, enum_def: TonEnumDefinition) -> None:
        """Adds an enum definition"""
        self._enums[enum_def.name.lower()] = enum_def
    
    def get_enum(self, name: str) -> Optional[TonEnumDefinition]:
        """Gets an enum definition by name (case-insensitive)"""
        return self._enums.get(name.lower())
    
    def get_all_enums(self) -> List[TonEnumDefinition]:
        """Gets all enum definitions"""
        return list(self._enums.values())
    
    @property
    def schemas(self) -> List[TonSchemaDefinition]:
        """Gets all schema definitions as a list"""
        return list(self._schemas.values())
    
    @property
    def enums(self) -> List[TonEnumDefinition]:
        """Gets all enum definitions as a list"""
        return list(self._enums.values())
