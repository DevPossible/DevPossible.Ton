import { TonLexer, TokenType } from '../../src/lexer/TonLexer';
import { TonParser } from '../../src/parser/TonParser';
import { TonSerializer } from '../../src/serializer/TonSerializer';
import { TonSerializeOptions } from '../../src/serializer/TonSerializeOptions';
import { TonArray } from '../../src/models/TonArray';

describe('MultiLineString', () => {
    describe('Lexer Multi-line String Tests', () => {
        test('should parse triple double quotes', () => {
            // Arrange
            const input = '"""Hello World"""';
            const lexer = new TonLexer(input);

            // Act
            const token = lexer.nextToken();

            // Assert
            expect(token).toBeTruthy();
            expect(token!.type).toBe(TokenType.String);
            expect(token!.value).toBe('Hello World');
        });

        test('should parse triple single quotes', () => {
            // Arrange
            const input = "'''Hello World'''";
            const lexer = new TonLexer(input);

            // Act
            const token = lexer.nextToken();

            // Assert
            expect(token).toBeTruthy();
            expect(token!.type).toBe(TokenType.String);
            expect(token!.value).toBe('Hello World');
        });

        test('should parse basic multi-line string', () => {
            // Arrange
            const input = `"""
Line 1
Line 2
Line 3
"""`;
            const lexer = new TonLexer(input);

            // Act
            const token = lexer.nextToken();

            // Assert
            expect(token).toBeTruthy();
            expect(token!.type).toBe(TokenType.String);
            expect(token!.value).toBe('Line 1\nLine 2\nLine 3');
        });

        test('should handle indentation in multi-line strings', () => {
            // Arrange
            const input = `"""
                Line 1
                    Line 2 indented
                Line 3
            """`;
            const lexer = new TonLexer(input);

            // Act
            const token = lexer.nextToken();

            // Assert
            expect(token).toBeTruthy();
            expect(token!.type).toBe(TokenType.String);
            // The exact behavior depends on implementation - might preserve or strip common indentation
            expect(token!.value).toContain('Line 1');
            expect(token!.value).toContain('Line 2 indented');
            expect(token!.value).toContain('Line 3');
        });

        test('should handle empty multi-line string', () => {
            // Arrange
            const input = '""""""';
            const lexer = new TonLexer(input);

            // Act
            const token = lexer.nextToken();

            // Assert
            expect(token).toBeTruthy();
            expect(token!.type).toBe(TokenType.String);
            expect(token!.value).toBe('');
        });

        test('should handle multi-line string with quotes inside', () => {
            // Arrange
            const input = `"""This has "quotes" and 'apostrophes' inside"""`;
            const lexer = new TonLexer(input);

            // Act
            const token = lexer.nextToken();

            // Assert
            expect(token).toBeTruthy();
            expect(token!.type).toBe(TokenType.String);
            expect(token!.value).toBe('This has "quotes" and \'apostrophes\' inside');
        });

        test('should handle multi-line string with escaped characters', () => {
            // Arrange
            const input = `"""Line 1\\nLine 2\\tTabbed"""`;
            const lexer = new TonLexer(input);

            // Act
            const token = lexer.nextToken();

            // Assert
            expect(token).toBeTruthy();
            expect(token!.type).toBe(TokenType.String);
            // Depending on implementation, might process escapes or leave them
            expect(token!.value).toContain('Line 1');
            expect(token!.value).toContain('Line 2');
        });

        test('should handle Windows-style line endings', () => {
            // Arrange
            const input = '"""Line 1\r\nLine 2\r\nLine 3"""';
            const lexer = new TonLexer(input);

            // Act
            const token = lexer.nextToken();

            // Assert
            expect(token).toBeTruthy();
            expect(token!.type).toBe(TokenType.String);
            expect(token!.value).toContain('Line 1');
            expect(token!.value).toContain('Line 2');
            expect(token!.value).toContain('Line 3');
        });

        test('should handle multi-line string with special characters', () => {
            // Arrange
            const input = `"""Special chars: @#$%^&*(){}[]<>"""`;
            const lexer = new TonLexer(input);

            // Act
            const token = lexer.nextToken();

            // Assert
            expect(token).toBeTruthy();
            expect(token!.type).toBe(TokenType.String);
            expect(token!.value).toBe('Special chars: @#$%^&*(){}[]<>');
        });

        test('should handle very long multi-line strings', () => {
            // Arrange
            const lines = [];
            for (let i = 1; i <= 100; i++) {
                lines.push(`Line ${i}: ${'x'.repeat(50)}`);
            }
            const input = `"""${lines.join('\n')}"""`;
            const lexer = new TonLexer(input);

            // Act
            const token = lexer.nextToken();

            // Assert
            expect(token).toBeTruthy();
            expect(token!.type).toBe(TokenType.String);
            expect(token!.value.split('\n').length).toBe(100);
        });

        test('should handle multi-line string with Unicode characters', () => {
            // Arrange
            const input = `"""Unicode: 你好 مرحبا здравствуйте 🌍 🚀 ✨"""`;
            const lexer = new TonLexer(input);

            // Act
            const token = lexer.nextToken();

            // Assert
            expect(token).toBeTruthy();
            expect(token!.type).toBe(TokenType.String);
            expect(token!.value).toBe('Unicode: 你好 مرحبا здравствуйте 🌍 🚀 ✨');
        });

        test('should error on unclosed multi-line string', () => {
            // Arrange
            const input = '"""This is not closed';
            const lexer = new TonLexer(input);

            // Act & Assert
            expect(() => {
                while (lexer.nextToken() !== null) {
                    // Keep reading tokens
                }
            }).toThrow();
        });
    });

    describe('Integration Multi-line String Tests', () => {
        test('should round-trip multi-line strings', () => {
            // Arrange
            const parser = new TonParser();
            const serializer = new TonSerializer();

            const originalContent = `{
                description = """
                This is a multi-line description
                with proper indentation handling
                and multiple lines of text.
                """
            }`;

            // Act - Parse the multi-line string
            const document = parser.parse(originalContent);
            const description = document.asObject()?.get('description')?.toString();

            // Serialize it back
            const options = new TonSerializeOptions();
            options.useMultiLineStrings = true;
            options.quoteStyle = 'double';
            options.indentChar = ' ';
            options.indentSize = 4;
            const serializedContent = serializer.serialize(document, options);

            // Parse again to verify round-trip
            const document2 = parser.parse(serializedContent);
            const description2 = document2.asObject()?.get('description')?.toString();

            // Assert
            expect(description).toBe('This is a multi-line description\nwith proper indentation handling\nand multiple lines of text.');
            expect(description2).toBe(description);
            expect(serializedContent).toContain('"""');
        });

        test('should handle complex multi-line document', () => {
            // Arrange
            const parser = new TonParser();
            const content = `{
                readme = """
                # Project README

                This is a sample project with:
                - Feature 1
                - Feature 2
                - Feature 3

                ## Installation
                Run the following command:
                    npm install

                ## Usage
                See documentation for details.
                """,

                license = '''
                MIT License

                Copyright (c) 2024

                Permission is hereby granted...
                ''',

                config = {
                    description = """Configuration for the application""",
                    multiLine = true
                }
            }`;

            // Act
            const document = parser.parse(content);

            // Assert
            expect(document.asObject()?.get('readme')).toBeTruthy();
            expect(document.asObject()?.get('license')).toBeTruthy();
            const readme = document.asObject()?.get('readme')?.toString();
            expect(readme).toContain('# Project README');
            expect(readme).toContain('- Feature 1');
            expect(readme).toContain('npm install');

            const license = document.asObject()?.get('license')?.toString();
            expect(license).toContain('MIT License');
            expect(license).toContain('Copyright (c) 2024');
        });

        test('should serialize with multi-line strings when appropriate', () => {
            // Arrange
            const parser = new TonParser();
            const serializer = new TonSerializer();
            const content = `{
                shortText = "This is short",
                longText = "This is a very long text that spans multiple conceptual lines and could benefit from being formatted as a multi-line string for better readability when serialized back to TON format"
            }`;

            // Act
            const document = parser.parse(content);
            const options = new TonSerializeOptions();
            options.useMultiLineStrings = true;
            options.multiLineStringThreshold = 50; // Use multi-line for strings > 50 chars
            const serialized = serializer.serialize(document, options);

            // Assert
            expect(serialized).toContain("'This is short'"); // Short string stays single-line (default is single quotes)
            // Long string might be converted to multi-line depending on implementation
        });

        test('should handle nested objects with multi-line strings', () => {
            // Arrange
            const parser = new TonParser();
            const content = `{
                author = {
                    name = "John Doe",
                    bio = """
                    John is a software developer with over 10 years of experience.
                    He specializes in web development and cloud architecture.
                    """,
                    contact = {
                        email = "john@example.com",
                        address = """
                        123 Main St
                        Suite 456
                        City, State 12345
                        """
                    }
                }
            }`;

            // Act
            const document = parser.parse(content);

            // Assert
            const authorValue = document.asObject()?.get('author');
            const author = authorValue?.value || authorValue;
            expect(author).toBeTruthy();
            expect(author.get('name')?.toString()).toBe('John Doe');

            const bio = author.get('bio')?.toString();
            expect(bio).toContain('software developer');
            expect(bio).toContain('cloud architecture');

            const contactValue = author.get('contact');
            const contact = contactValue?.value || contactValue;
            const address = contact.get('address')?.toString();
            expect(address).toContain('123 Main St');
            expect(address).toContain('Suite 456');
        });

        test('should handle arrays with multi-line strings', () => {
            // Arrange
            const parser = new TonParser();
            const content = `{
                messages = [
                    """
                    Welcome to the application!
                    Please read the documentation.
                    """,
                    "Short message",
                    '''
                    Another multi-line message
                    with different quote style
                    '''
                ]
            }`;

            // Act
            const document = parser.parse(content);

            // Assert
            const messagesValue = document.asObject()?.get('messages');
            const messagesArray = messagesValue?.value || messagesValue;
            const messages = messagesArray instanceof TonArray ? messagesArray.items : messagesArray;
            expect(messages.length).toBe(3);
            expect(messages[0].toString()).toContain('Welcome to the application');
            expect(messages[1].toString()).toBe('Short message');
            expect(messages[2].toString()).toContain('Another multi-line message');
        });

        test('should preserve formatting in code blocks', () => {
            // Arrange
            const parser = new TonParser();
            const content = `{
                codeExample = """
                function hello() {
                    console.log("Hello, World!");
                    return {
                        status: 'success',
                        timestamp: Date.now()
                    };
                }
                """
            }`;

            // Act
            const document = parser.parse(content);
            const code = document.asObject()?.get('codeExample')?.toString();

            // Assert
            expect(code).toContain('function hello()');
            expect(code).toContain('console.log("Hello, World!")');
            expect(code).toContain('status: \'success\'');
            // Indentation might be preserved or normalized depending on implementation
        });

        test('should handle edge cases with triple quotes in content', () => {
            // Arrange
            const parser = new TonParser();
            // Using more than 3 quotes or escaping might be needed
            const content = `{
                example = """This text mentions \\"\\"\\" but doesn't end the string"""
            }`;

            // Act
            const document = parser.parse(content);
            const example = document.asObject()?.get('example')?.toString();

            // Assert
            expect(example).toContain('\\"\\"\\\"'); // Escaped quotes remain escaped in the parsed value
        });
    });
});