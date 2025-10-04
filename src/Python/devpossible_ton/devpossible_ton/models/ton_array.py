"""
TonArray - Array model for TON
Copyright (c) 2024 DevPossible, LLC
"""

from typing import Any, List


class TonArray:
    """Array model for TON format."""

    def __init__(self):
        self.items: List[Any] = []

    def add(self, value: Any) -> None:
        """Add an item."""
        self.items.append(value)
    
    def push(self, value: Any) -> None:
        """Add an item (alias for add)."""
        self.add(value)

    def get(self, index: int) -> Any:
        """Get an item by index."""
        return self.items[index] if 0 <= index < len(self.items) else None

    def set(self, index: int, value: Any) -> None:
        """Set an item by index."""
        if 0 <= index < len(self.items):
            self.items[index] = value

    def length(self) -> int:
        """Get array length."""
        return len(self.items)
    
    def __len__(self) -> int:
        """Get array length."""
        return len(self.items)
    
    def __getitem__(self, index: int) -> Any:
        """Support subscript access like arr[index]."""
        value = self.get(index)
        # Unwrap TonValue objects for easier access
        if hasattr(value, 'get_value'):
            return value.get_value()
        return value
    
    def __setitem__(self, index: int, value: Any) -> None:
        """Support subscript assignment like arr[index] = value."""
        self.set(index, value)
    
    def __eq__(self, other) -> bool:
        """Support equality comparison with lists."""
        if isinstance(other, list):
            return self.to_json() == other
        elif isinstance(other, TonArray):
            return self.items == other.items
        return False

    def to_array(self) -> List[Any]:
        """Get as Python list."""
        return self.items.copy()

    def to_json(self) -> List[Any]:
        """Convert to JSON-serializable list."""
        result = []
        for item in self.items:
            if hasattr(item, 'to_json'):
                result.append(item.to_json())
            elif hasattr(item, 'get_value'):
                result.append(item.get_value())
            else:
                result.append(item)
        return result
