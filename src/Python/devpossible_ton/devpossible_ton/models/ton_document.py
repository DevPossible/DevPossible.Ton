"""
TonDocument - Root document model
Copyright (c) 2024 DevPossible, LLC
"""

from typing import Union, Optional, Any
import json


class TonJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder for TON types."""
    
    def default(self, obj):
        if hasattr(obj, 'to_json'):
            return obj.to_json()
        elif hasattr(obj, 'get_value'):
            return obj.get_value()
        elif hasattr(obj, 'to_array'):
            return obj.to_array()
        return super().default(obj)


class TonDocument:
    """Root document for TON format."""

    def __init__(self, root: Any = None):
        self.root = root if root is not None else {}

    def get_root(self) -> Any:
        """Get root value."""
        return self.root
    
    def set_root(self, root: Any) -> None:
        """Set the root element."""
        self.root = root
    
    @staticmethod
    def from_object(obj: Any) -> 'TonDocument':
        """Create a TonDocument from an object."""
        return TonDocument(obj)

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


# Monkey-patch json.dumps to use our encoder by default for TonDocument types
_original_dumps = json.dumps

def _ton_aware_dumps(obj, **kwargs):
    """JSON dumps that handles TON types."""
    if 'cls' not in kwargs:
        # Check if obj contains any TON types
        from .ton_object import TonObject
        from .ton_array import TonArray
        from .ton_value import TonValue
        
        if isinstance(obj, (TonObject, TonArray, TonValue)):
            kwargs['cls'] = TonJSONEncoder
    
    return _original_dumps(obj, **kwargs)

# Only patch if not already patched
if not hasattr(json.dumps, '_ton_patched'):
    json.dumps = _ton_aware_dumps
    json.dumps._ton_patched = True
