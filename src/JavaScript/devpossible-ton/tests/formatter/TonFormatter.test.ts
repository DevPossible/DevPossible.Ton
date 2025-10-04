import { TonFormatter, TonFormatStyle } from '../../src/formatter/TonFormatter';
import { TonParser } from '../../src/parser/TonParser';

describe('TonFormatter', () => {
    const sampleTonContent = `{
name='TestApp',version=1.5,enabled=true,database={host='localhost',port=5432,ssl=true},features=|auth|logging|,endpoints=[{path='/api/users',method='GET',auth=true},{path='/api/health',method='GET',auth=false}]
}`;

    const multiLineTonContent = `{
    description = 'Simple description',
    value = 42
}`;

    describe('formatString', () => {
        test('should format with Pretty style correctly', () => {
            // Act
            const result = TonFormatter.formatString(sampleTonContent, TonFormatStyle.Pretty);

            // Assert
            expect(result).toBeTruthy();
            expect(result).toContain('#@ tonVersion = \'1\''); // Should include header
            expect(result).toContain('    '); // Should have indentation
            expect(result).toContain('enabled = true');
            expect(result).toContain('database = {'); // Should have proper structure
        });

        test('should format with Compact style correctly', () => {
            // Act
            const result = TonFormatter.formatString(sampleTonContent, TonFormatStyle.Compact);

            // Assert
            expect(result).toBeTruthy();
            expect(result).not.toContain('#@'); // Should not include header
            expect(result).not.toContain('    '); // Should not have indentation
            expect(result).not.toMatch(/\n/); // Should be on single line
            expect(result).toContain('enabled = true'); // Should have compact format
        });

        test('should use Pretty style as default', () => {
            // Act
            const result = TonFormatter.formatString(sampleTonContent);
            const prettyResult = TonFormatter.formatString(sampleTonContent, TonFormatStyle.Pretty);

            // Assert
            expect(result).toBe(prettyResult);
        });

        test('should preserve multi-line content structure', () => {
            // Act
            const result = TonFormatter.formatString(multiLineTonContent, TonFormatStyle.Pretty);

            // Assert
            expect(result).toContain('description');
            expect(result).toContain('value');
            expect(result).toContain('42');
        });

        test('should handle empty object', () => {
            // Act
            const result = TonFormatter.formatString('{}', TonFormatStyle.Pretty);

            // Assert
            expect(result).toContain('{');
            expect(result).toContain('}');
        });

        test('should handle complex nested structures', () => {
            const complexContent = `{
                app = {
                    name = 'MyApp',
                    config = {
                        database = {
                            host = 'localhost',
                            port = 5432,
                            credentials = {
                                user = 'admin',
                                encrypted = true
                            }
                        },
                        cache = {
                            enabled = true,
                            ttl = 3600
                        }
                    },
                    features = ['auth', 'logging', 'metrics']
                }
            }`;

            // Act
            const compactResult = TonFormatter.formatString(complexContent, TonFormatStyle.Compact);
            const prettyResult = TonFormatter.formatString(complexContent, TonFormatStyle.Pretty);

            // Assert - Compact should be single line
            expect(compactResult).not.toContain('\n');
            expect(compactResult).toContain('host = \'localhost\'');

            // Assert - Pretty should have proper indentation
            expect(prettyResult).toContain('    ');
            expect(prettyResult.split('\n').length).toBeGreaterThan(5);
        });

        test('should handle arrays with different styles', () => {
            const arrayContent = `{
                numbers = [1, 2, 3, 4, 5],
                strings = ['one', 'two', 'three'],
                mixed = [1, 'two', true, null]
            }`;

            // Act
            const compactResult = TonFormatter.formatString(arrayContent, TonFormatStyle.Compact);
            const prettyResult = TonFormatter.formatString(arrayContent, TonFormatStyle.Pretty);

            // Assert
            expect(compactResult).toContain('[1, 2, 3, 4, 5]');
            expect(prettyResult).toContain('[1, 2, 3, 4, 5]'); // Arrays should stay inline even in pretty mode
        });

        test('should handle enums and enum sets', () => {
            const enumContent = `{
                status = |active|,
                roles = |admin|user|moderator|,
                permissions = |read|write|
            }`;

            // Act
            const result = TonFormatter.formatString(enumContent, TonFormatStyle.Pretty);

            // Assert
            expect(result).toContain('|active|');
            expect(result).toContain('|admin|user|moderator|');
            expect(result).toContain('|read|write|');
        });

        test('should handle comments in formatting', () => {
            const contentWithComments = `{
                // This is a comment
                name = 'Test', // Inline comment
                /* Multi-line
                   comment */
                value = 42
            }`;

            // Act
            const result = TonFormatter.formatString(contentWithComments, TonFormatStyle.Pretty);

            // Assert
            expect(result).toContain('name = \'Test\'');
            expect(result).toContain('value = 42');
            // Comments may or may not be preserved depending on implementation
        });

        test('should handle special number formats', () => {
            const numberContent = `{
                decimal = 42,
                hex = 0xFF,
                binary = 0b1010,
                scientific = 1.5e10,
                negative = -123.456
            }`;

            // Act
            const result = TonFormatter.formatString(numberContent, TonFormatStyle.Pretty);

            // Assert
            expect(result).toContain('42');
            expect(result).toContain('255'); // 0xFF converted to decimal
            expect(result).toContain('10'); // 0b1010 converted to decimal
            expect(result).toContain('15000000000'); // 1.5e10 expanded
            expect(result).toContain('-123.456');
        });

        test('should handle GUIDs', () => {
            const guidContent = `{
                id1 = {550e8400-e29b-41d4-a716-446655440000},
                id2 = 550e8400-e29b-41d4-a716-446655440001
            }`;

            // Act
            const result = TonFormatter.formatString(guidContent, TonFormatStyle.Pretty);

            // Assert
            expect(result).toContain('550e8400-e29b-41d4-a716-446655440000');
            expect(result).toContain('550e8400-e29b-41d4-a716-446655440001');
        });

        test('should handle type annotations and hints', () => {
            const annotatedContent = `{
                name:string = 'John',
                age:int = 30,
                score:float = 95.5,
                active:bool = true
            }`;

            // Act
            const result = TonFormatter.formatString(annotatedContent, TonFormatStyle.Pretty);

            // Assert
            expect(result).toContain('name');
            expect(result).toContain('John');
            expect(result).toContain('age');
            expect(result).toContain('30');
            expect(result).toContain('score');
            expect(result).toContain('95.5');
            expect(result).toContain('active');
            expect(result).toContain('true');
        });

        test('should handle class names and instance counts', () => {
            const classContent = `(User#1){
                name = 'Alice',
                profile = (Profile){
                    bio = 'Developer'
                }
            }`;

            // Act
            const result = TonFormatter.formatString(classContent, TonFormatStyle.Pretty);

            // Assert
            expect(result).toContain('name');
            expect(result).toContain('Alice');
            expect(result).toContain('bio');
            expect(result).toContain('Developer');
        });

        test('should throw error for invalid input', () => {
            // Act & Assert
            expect(() => {
                TonFormatter.formatString('{ invalid: }', TonFormatStyle.Pretty);
            }).toThrow();
        });

        test('should handle null and undefined values', () => {
            const nullContent = `{
                nullValue = null,
                undefinedValue = undefined
            }`;

            // Act
            const prettyResult = TonFormatter.formatString(nullContent, TonFormatStyle.Pretty);

            // Assert - Pretty format includes nulls
            expect(prettyResult).toContain('null');
            expect(prettyResult).toContain('undefined');
        });

        test('should round-trip format correctly', () => {
            const parser = new TonParser();

            // Parse original
            const doc1 = parser.parse(sampleTonContent);

            // Format and parse again
            const formatted = TonFormatter.formatString(sampleTonContent, TonFormatStyle.Pretty);
            const doc2 = parser.parse(formatted);

            // Should have same data - compare actual values, not TonValue objects
            expect(doc2.asObject()?.get('name')?.value).toBe(doc1.asObject()?.get('name')?.value);
            expect(doc2.asObject()?.get('version')?.value).toBe(doc1.asObject()?.get('version')?.value);
            expect(doc2.asObject()?.get('enabled')?.value).toBe(doc1.asObject()?.get('enabled')?.value);
        });
    });

    describe('formatFile', () => {
        test('should format file content', async () => {
            // This would require file system mocking
            // Skipping for now as it would need additional setup
        });
    });
});