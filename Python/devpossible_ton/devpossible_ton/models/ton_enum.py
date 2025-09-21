"""
TonEnum - Enum model for TON
Copyright (c) 2024 DevPossible, LLC
"""

from typing import Union, List


class TonEnum:
    """Enum model for TON format."""

    def __init__(self, value: Union[str, List[str]]):
        if isinstance(value, str):
            self.values = [value]
            self.is_single_value = True
        else:
            self.values = value
            self.is_single_value = False

    def get_value(self) -> Union[str, List[str]]:
        """Get the value(s)."""
        return self.values[0] if self.is_single_value else self.values

    def get_values(self) -> List[str]:
        """Get all values as list."""
        return self.values

    def contains(self, value: str) -> bool:
        """Check if contains a value."""
        return value in self.values

    def is_set(self) -> bool:
        """Check if this is an enum set."""
        return not self.is_single_value

    def to_json(self) -> Union[str, List[str]]:
        """Convert to JSON-serializable value."""
        return self.get_value()

    def __str__(self) -> str:
        """String representation."""
        if self.is_single_value:
            return f"|{self.values[0]}|"
        return ''.join(f"|{v}" for v in self.values) + '|'