"""
TonDocument - Root document model
Copyright (c) 2024 DevPossible, LLC
"""

from typing import Union, Optional, Any
import json


class TonDocument:
    """Root document for TON format."""

    def __init__(self, root: Any):
        self.root = root

    def get_root(self) -> Any:
        """Get the root element."""
        return self.root

    def is_object(self) -> bool:
        """Check if root is an object."""
        from .ton_object import TonObject
        return isinstance(self.root, TonObject)

    def is_array(self) -> bool:
        """Check if root is an array."""
        from .ton_array import TonArray
        return isinstance(self.root, TonArray)

    def is_value(self) -> bool:
        """Check if root is a value."""
        from .ton_value import TonValue
        return isinstance(self.root, TonValue)

    def as_object(self) -> Optional['TonObject']:
        """Get root as object."""
        from .ton_object import TonObject
        return self.root if isinstance(self.root, TonObject) else None

    def as_array(self) -> Optional['TonArray']:
        """Get root as array."""
        from .ton_array import TonArray
        return self.root if isinstance(self.root, TonArray) else None

    def as_value(self) -> Optional['TonValue']:
        """Get root as value."""
        from .ton_value import TonValue
        return self.root if isinstance(self.root, TonValue) else None

    def to_json(self) -> Any:
        """Convert to JSON-serializable object."""
        if hasattr(self.root, 'to_json'):
            return self.root.to_json()
        elif hasattr(self.root, 'get_value'):
            return self.root.get_value()
        return self.root

    def __str__(self) -> str:
        """String representation."""
        return json.dumps(self.to_json(), indent=2)