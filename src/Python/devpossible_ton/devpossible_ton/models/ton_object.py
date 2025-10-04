"""
TonObject - Object model for TON
Copyright (c) 2024 DevPossible, LLC
"""

from typing import Any, Dict, List, Tuple, Optional


class TonObject:
    """Object model for TON format."""

    def __init__(self, class_name: Optional[str] = None, instance_count: Optional[int] = None, instance_id: Optional[int] = None):
        self.properties: Dict[str, Any] = {}
        self._class_name: Optional[str] = None
        self._instance_count: Optional[int] = None
        
        # Use property setters to ensure metadata is stored
        if class_name:
            self.class_name = class_name
        if instance_count is not None:
            self.instance_count = instance_count
        elif instance_id is not None:
            self.instance_count = instance_id
    
    @property
    def class_name(self) -> Optional[str]:
        """Get the class name."""
        return self._class_name
    
    @class_name.setter
    def class_name(self, value: Optional[str]) -> None:
        """Set the class name and update metadata property."""
        self._class_name = value
        if value:
            self.properties['_className'] = value
        elif '_className' in self.properties:
            del self.properties['_className']
    
    @property
    def instance_count(self) -> Optional[int]:
        """Get the instance count."""
        return self._instance_count
    
    @instance_count.setter
    def instance_count(self, value: Optional[int]) -> None:
        """Set the instance count and update metadata property."""
        self._instance_count = value
        if value is not None:
            self.properties['_instanceId'] = value
        elif '_instanceId' in self.properties:
            del self.properties['_instanceId']

    def set(self, key: str, value: Any) -> None:
        """Set a property."""
        self.properties[key] = value

    def get(self, key: str) -> Any:
        """Get a property."""
        return self.properties.get(key)

    def has(self, key: str) -> bool:
        """Check if property exists."""
        return key in self.properties

    def delete(self, key: str) -> bool:
        """Delete a property."""
        if key in self.properties:
            del self.properties[key]
            return True
        return False

    def keys(self) -> List[str]:
        """Get all keys."""
        return list(self.properties.keys())

    def values(self) -> List[Any]:
        """Get all values."""
        return list(self.properties.values())

    def entries(self) -> List[Tuple[str, Any]]:
        """Get all entries."""
        return list(self.properties.items())

    def size(self) -> int:
        """Get number of properties."""
        return len(self.properties)
    
    def __len__(self) -> int:
        """Get number of properties."""
        return len(self.properties)
    
    def __getitem__(self, key: str) -> Any:
        """Support subscript access like obj['key']."""
        value = self.get(key)
        # Unwrap TonValue objects for easier access
        if hasattr(value, 'get_value'):
            return value.get_value()
        return value
    
    def __setitem__(self, key: str, value: Any) -> None:
        """Support subscript assignment like obj['key'] = value."""
        self.set(key, value)
    
    def __contains__(self, key: str) -> bool:
        """Support 'in' operator."""
        return self.has(key)
    
    def __iter__(self):
        """Support iteration over keys for dict() and json.dumps() compatibility."""
        # Don't include metadata properties when iterating
        return (k for k in self.properties.keys() if not k.startswith('_'))
    
    def __eq__(self, other) -> bool:
        """Support equality comparison with dicts."""
        if isinstance(other, dict):
            return self.to_json() == other
        elif isinstance(other, TonObject):
            return self.properties == other.properties
        return False

    def to_json(self) -> Dict[str, Any]:
        """Convert to JSON-serializable dict."""
        result = {}
        
        # Add class metadata if present
        if self.class_name:
            result['_className'] = self.class_name
        if self.instance_count is not None:
            result['_instanceId'] = self.instance_count
        
        for key, value in self.properties.items():
            if hasattr(value, 'to_json'):
                result[key] = value.to_json()
            elif hasattr(value, 'get_value'):
                result[key] = value.get_value()
            else:
                result[key] = value
        return result
