"""
TonFormatter - Code formatter for TON format
Copyright (c) 2024 DevPossible, LLC
"""

from typing import Optional
from ..parser import TonParser, TonParseOptions
from ..serializer import TonSerializer
from ..serializer.ton_serialize_options import TonSerializeOptions, TonFormatStyle


class TonFormatter:
    """Formatter for TON format"""
    
    def __init__(self, options: Optional[TonSerializeOptions] = None):
        self.options = options or TonSerializeOptions.pretty()
    
    def format(self, content: str) -> str:
        """Formats TON content"""
        parser = TonParser()
        document = parser.parse(content)
        
        serializer = TonSerializer(self.options)
        return serializer.serialize(document)
    
    def validate(self, original: str, formatted: str) -> bool:
        """Validates that the formatted content is equivalent to original"""
        try:
            parser = TonParser()
            original_doc = parser.parse(original)
            formatted_doc = parser.parse(formatted)
            
            # Compare the JSON representations
            import json
            original_json = json.dumps(original_doc.to_json(), sort_keys=True)
            formatted_json = json.dumps(formatted_doc.to_json(), sort_keys=True)
            
            return original_json == formatted_json
        except Exception:
            return False
    
    @staticmethod
    def format_string(content: str, style: TonFormatStyle = TonFormatStyle.PRETTY) -> str:
        """Format TON content with specified style"""
        if style == TonFormatStyle.COMPACT:
            options = TonSerializeOptions.compact()
        else:
            options = TonSerializeOptions.pretty()
        
        formatter = TonFormatter(options)
        return formatter.format(content)
    
    @staticmethod
    async def format_string_async(content: str, style: TonFormatStyle = TonFormatStyle.PRETTY) -> str:
        """Format TON content with specified style asynchronously"""
        import asyncio
        return await asyncio.to_thread(TonFormatter.format_string, content, style)
    
    @staticmethod
    def format_file(file_path: str, style: TonFormatStyle = TonFormatStyle.PRETTY) -> str:
        """Formats a TON file using the specified style"""
        if not file_path:
            raise ValueError("file_path cannot be None or empty")
        
        import os
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return TonFormatter.format_string(content, style)
    
    @staticmethod
    async def format_file_async(file_path: str, style: TonFormatStyle = TonFormatStyle.PRETTY) -> str:
        """Formats a TON file using the specified style asynchronously"""
        import aiofiles
        import os
        
        if not file_path:
            raise ValueError("file_path cannot be None or empty")
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
            content = await f.read()
        
        return await TonFormatter.format_string_async(content, style)
    
    @staticmethod
    def format_file_in_place(file_path: str, style: TonFormatStyle = TonFormatStyle.PRETTY) -> None:
        """Formats a TON file in place using the specified style"""
        formatted_content = TonFormatter.format_file(file_path, style)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(formatted_content)
    
    @staticmethod
    async def format_file_in_place_async(file_path: str, style: TonFormatStyle = TonFormatStyle.PRETTY) -> None:
        """Formats a TON file in place using the specified style asynchronously"""
        import aiofiles
        
        formatted_content = await TonFormatter.format_file_async(file_path, style)
        
        async with aiofiles.open(file_path, 'w', encoding='utf-8') as f:
            await f.write(formatted_content)
    
    @staticmethod
    def format_file_to_file(input_file_path: str, output_file_path: str, 
                           style: TonFormatStyle = TonFormatStyle.PRETTY) -> None:
        """Formats TON content to a new file using the specified style"""
        if not input_file_path:
            raise ValueError("input_file_path cannot be None or empty")
        if not output_file_path:
            raise ValueError("output_file_path cannot be None or empty")
        
        formatted_content = TonFormatter.format_file(input_file_path, style)
        
        with open(output_file_path, 'w', encoding='utf-8') as f:
            f.write(formatted_content)
    
    @staticmethod
    async def format_file_to_file_async(input_file_path: str, output_file_path: str,
                                       style: TonFormatStyle = TonFormatStyle.PRETTY) -> None:
        """Formats TON content to a new file using the specified style asynchronously"""
        import aiofiles
        
        if not input_file_path:
            raise ValueError("input_file_path cannot be None or empty")
        if not output_file_path:
            raise ValueError("output_file_path cannot be None or empty")
        
        formatted_content = await TonFormatter.format_file_async(input_file_path, style)
        
        async with aiofiles.open(output_file_path, 'w', encoding='utf-8') as f:
            await f.write(formatted_content)
    
    @staticmethod
    def pretty(content: str) -> str:
        """Format TON content with pretty style"""
        return TonFormatter.format_string(content, TonFormatStyle.PRETTY)
    
    @staticmethod
    def compact(content: str) -> str:
        """Format TON content with compact style"""
        return TonFormatter.format_string(content, TonFormatStyle.COMPACT)
    
    @staticmethod
    def sorted(content: str) -> str:
        """Format and sort properties alphabetically"""
        options = TonSerializeOptions.pretty()
        options.sort_properties = True
        
        formatter = TonFormatter(options)
        return formatter.format(content)
