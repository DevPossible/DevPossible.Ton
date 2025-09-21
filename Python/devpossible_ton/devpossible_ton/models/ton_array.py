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