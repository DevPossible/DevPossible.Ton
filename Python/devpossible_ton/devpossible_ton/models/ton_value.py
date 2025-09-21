"""
TonValue - Value model for TON
Copyright (c) 2024 DevPossible, LLC
"""

from typing import Any, Optional


class TonValue:
    """Value model for TON format."""

    def __init__(self, value: Any, type_hint: Optional[str] = None):
        self.value = value
        self.type_hint = type_hint

    def get_value(self) -> Any:
        """Get the value."""
        return self.value

    def set_value(self, value: Any) -> None:
        """Set the value."""
        self.value = value

    def get_type(self) -> str:
        """Get the type."""
        if self.type_hint:
            return self.type_hint

        if self.value is None:
            return 'null'

        return type(self.value).__name__

    def to_json(self) -> Any:
        """Convert to JSON-serializable value."""
        return self.value

    def __str__(self) -> str:
        """String representation."""
        return str(self.value)