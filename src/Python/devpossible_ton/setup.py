"""
DevPossible.Ton - Python Package Setup
Copyright (c) 2024 DevPossible, LLC. All rights reserved.
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="devpossible-ton",
    version="0.1.1",
    author="DevPossible, LLC",
    author_email="support@devpossible.com",
    description="Python library for parsing, validating, and serializing TON (Text Object Notation) files. Full specification at https://tonspec.com. ALPHA RELEASE: Core functionality is complete but API may change before stable 1.0 release.",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://tonspec.com",
    project_urls={
        "Bug Tracker": "https://github.com/DevPossible/DevPossible.Ton/issues",
        "Documentation": "https://tonspec.com",
        "Source Code": "https://github.com/DevPossible/DevPossible.Ton",
        "Specification": "https://tonspec.com",
    },
    packages=find_packages(),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.8",
    install_requires=[],
    extras_require={
        "dev": [
            "pytest>=7.0",
            "pytest-cov>=4.0",
            "black>=22.0",
            "flake8>=5.0",
            "mypy>=1.0",
            "isort>=5.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "ton-validate=devpossible_ton.cli:validate",
            "ton-format=devpossible_ton.cli:format",
        ],
    },
)




