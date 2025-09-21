"""
Error classes for DevPossible.Ton
Copyright (c) 2024 DevPossible, LLC
"""


class TonParseError(Exception):
    """Exception raised for parsing errors."""

    def __init__(self, message: str, line: int = None, column: int = None):
        if line is not None and column is not None:
            full_message = f"Parse error at line {line}, column {column}: {message}"
        else:
            full_message = f"Parse error: {message}"
        super().__init__(full_message)
        self.line = line
        self.column = column


class TonValidationError(Exception):
    """Exception raised for validation errors."""

    def __init__(self, message: str, path: str = None):
        if path:
            full_message = f"Validation error at {path}: {message}"
        else:
            full_message = f"Validation error: {message}"
        super().__init__(full_message)
        self.path = path


class TonSerializationError(Exception):
    """Exception raised for serialization errors."""

    def __init__(self, message: str):
        super().__init__(f"Serialization error: {message}")