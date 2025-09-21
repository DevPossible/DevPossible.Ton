"""
TonObject - Object model for TON
Copyright (c) 2024 DevPossible, LLC
"""

from typing import Any, Dict, List, Tuple, Optional


class TonObject:
    """Object model for TON format."""

    def __init__(self):
        self.properties: Dict[str, Any] = {}
        self.class_name: Optional[str] = None
        self.instance_count: Optional[int] = None

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

    def to_json(self) -> Dict[str, Any]:
        """Convert to JSON-serializable dict."""
        result = {}
        for key, value in self.properties.items():
            if hasattr(value, 'to_json'):
                result[key] = value.to_json()
            elif hasattr(value, 'get_value'):
                result[key] = value.get_value()
            else:
                result[key] = value
        return result