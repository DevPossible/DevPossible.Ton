"""
TonEnumSet - Enum set model for TON
Copyright (c) 2024 DevPossible, LLC
"""

from typing import List


class TonEnumSet:
    """Enum set model for TON format - handles multiple enum values like |value1|value2|"""
    
    def __init__(self, values: List[str] = None):
        self.values: List[str] = values if values else []
    
    def add(self, value: str) -> None:
        """Add a value to the set"""
        if value and value not in self.values:
            self.values.append(value)
    
    def contains(self, value: str) -> bool:
        """Check if contains a value"""
        return value in self.values
    
    def contains_index(self, index: int) -> bool:
        """Check if contains a specific index"""
        try:
            int_val = int(self.values[index])
            return True
        except (ValueError, IndexError):
            return False
    
    def get_names(self) -> List[str]:
        """Get all name values (excludes index-based values)"""
        names = []
        for value in self.values:
            try:
                int(value)
                # It's an index, skip it
            except ValueError:
                names.append(value)
        return names
    
    def get_indices(self) -> List[int]:
        """Get all index values"""
        indices = []
        for value in self.values:
            try:
                indices.append(int(value))
            except ValueError:
                pass
        return indices
    
    def is_empty(self) -> bool:
        """Check if the set is empty"""
        return len(self.values) == 0
    
    def count(self) -> int:
        """Get the number of values"""
        return len(self.values)
    
    def to_json(self) -> List[str]:
        """Convert to JSON-serializable list"""
        return self.values.copy()
    
    def __str__(self) -> str:
        """String representation in TON format"""
        if not self.values:
            return "||"
        return '|' + '|'.join(self.values) + '|'
    
    def __repr__(self) -> str:
        """Representation"""
        return f"TonEnumSet({self.values})"
    
    @staticmethod
    def parse(text: str) -> 'TonEnumSet':
        """Parse a TON enum set string like |value1|value2|"""
        if not text:
            return TonEnumSet()
        
        # Remove outer pipe delimiters
        text = text.strip('|')
        if not text:
            return TonEnumSet()
        
        # Split by pipe and filter out empty strings
        values = [v for v in text.split('|') if v]
        return TonEnumSet(values)
