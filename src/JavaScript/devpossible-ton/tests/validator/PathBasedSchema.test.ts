import { TonParser } from '../../src/parser/TonParser';
import { TonValidator } from '../../src/validator/TonValidator';

describe('PathBasedSchemaTests', () => {
    test('should validate deep nested path properties', () => {
        // Arrange
        const parser = new TonParser();
        const ton = `{
            name = "John",
            email = "john@example.com",
            details = {
                bio = "Software engineer",
                avatar = "avatar.jpg"
            }
        }`;

        const document = parser.parse(ton);

        // Define schema with path-based validation
        const schema = {
            type: 'object',
            properties: {
                name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
                email: { type: 'string', required: true },
                details: {
                    type: 'object',
                    properties: {
                        bio: { type: 'string', maxLength: 1000 },
                        avatar: { type: 'string', maxLength: 255 }
                    }
                }
            }
        };

        const validator = new TonValidator(schema as any);

        // Act
        const result = validator.validate(document);

        // Assert
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    test('should fail validation for missing required property', () => {
        // Arrange
        const parser = new TonParser();
        const ton = `{
            name = "John",
            details = {
                avatar = "avatar.jpg"
            }
        }`;

        const document = parser.parse(ton);

        const schema = {
            type: 'object',
            properties: {
                name: { type: 'string', required: true },
                email: { type: 'string', required: true },
                details: {
                    type: 'object',
                    properties: {
                        bio: { type: 'string', required: true },
                        avatar: { type: 'string' }
                    }
                }
            }
        };

        const validator = new TonValidator(schema as any);

        // Act
        const result = validator.validate(document);

        // Assert
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should validate array elements', () => {
        // Arrange
        const parser = new TonParser();
        const ton = `{
            servers = [
                {
                    host = "server1.example.com",
                    port = 8080,
                    ssl = true
                },
                {
                    host = "server2.example.com",
                    port = 8081,
                    ssl = false
                }
            ]
        }`;

        const document = parser.parse(ton);

        const schema = {
            type: 'object',
            properties: {
                servers: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            host: { type: 'string', required: true },
                            port: { type: 'number', required: true, min: 1, max: 65535 },
                            ssl: { type: 'boolean', required: true }
                        }
                    }
                }
            }
        };

        const validator = new TonValidator(schema as any);

        // Act
        const result = validator.validate(document);

        // Assert
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    test('should validate nested object properties', () => {
        // Arrange
        const parser = new TonParser();
        const ton = `{
            config = {
                database = {
                    primary = {
                        host = "db1.example.com",
                        port = 5432
                    }
                }
            }
        }`;

        const document = parser.parse(ton);

        const schema = {
            type: 'object',
            properties: {
                config: {
                    type: 'object',
                    properties: {
                        database: {
                            type: 'object',
                            properties: {
                                primary: {
                                    type: 'object',
                                    properties: {
                                        host: { type: 'string', required: true },
                                        port: { type: 'number', required: true, min: 1, max: 65535 }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };

        const validator = new TonValidator(schema as any);

        // Act
        const result = validator.validate(document);

        // Assert
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    test('should handle optional properties', () => {
        // Arrange
        const parser = new TonParser();
        const ton = `{
            username = "johndoe",
            personalInfo = {
                firstName = "John",
                lastName = "Doe"
            }
        }`;

        const document = parser.parse(ton);

        const schema = {
            type: 'object',
            properties: {
                username: { type: 'string', required: true },
                personalInfo: {
                    type: 'object',
                    properties: {
                        firstName: { type: 'string', required: true },
                        lastName: { type: 'string', required: true },
                        middleName: { type: 'string', required: false },
                        phone: { type: 'string', required: false }
                    }
                },
                settings: {
                    type: 'object',
                    required: false,
                    properties: {
                        theme: { type: 'string', default: 'light' }
                    }
                }
            }
        };

        const validator = new TonValidator(schema as any);

        // Act
        const result = validator.validate(document);

        // Assert
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    test('should validate enum constraints', () => {
        // Arrange
        const parser = new TonParser();
        const ton = `{
            environment = {
                name = "production",
                status = |active|,
                tier = |gold|
            }
        }`;

        const document = parser.parse(ton);

        const schema = {
            type: 'object',
            properties: {
                environment: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', required: true },
                        status: { type: 'enum', required: true, values: ['active', 'inactive', 'maintenance'] },
                        tier: { type: 'enum', required: true, values: ['gold', 'silver', 'bronze'] }
                    }
                }
            }
        };

        const validator = new TonValidator(schema as any);

        // Act
        const result = validator.validate(document);

        // Assert
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    test('should fail validation for invalid enum value', () => {
        // Arrange
        const parser = new TonParser();
        const ton = `{
            environment = {
                name = "test",
                status = |invalid|
            }
        }`;

        const document = parser.parse(ton);

        const schema = {
            type: 'object',
            properties: {
                environment: {
                    type: 'object',
                    properties: {
                        status: { type: 'enum', required: true, values: ['active', 'inactive'] }
                    }
                }
            }
        };

        const validator = new TonValidator(schema as any);

        // Act
        const result = validator.validate(document);

        // Assert
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should validate numeric constraints', () => {
        // Arrange
        const parser = new TonParser();
        const ton = `{
            performance = {
                cpu = {
                    usage = 45.5,
                    threshold = 80
                },
                memory = {
                    usage = 2048,
                    threshold = 4096
                }
            }
        }`;

        const document = parser.parse(ton);

        const schema = {
            type: 'object',
            properties: {
                performance: {
                    type: 'object',
                    properties: {
                        cpu: {
                            type: 'object',
                            properties: {
                                usage: { type: 'number', required: true, min: 0, max: 100 },
                                threshold: { type: 'number', required: true, min: 0, max: 100 }
                            }
                        },
                        memory: {
                            type: 'object',
                            properties: {
                                usage: { type: 'number', required: true, min: 0 },
                                threshold: { type: 'number', required: true, min: 0 }
                            }
                        }
                    }
                }
            }
        };

        const validator = new TonValidator(schema as any);

        // Act
        const result = validator.validate(document);

        // Assert
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    test('should fail validation for out-of-range values', () => {
        // Arrange
        const parser = new TonParser();
        const ton = `{
            performance = {
                cpu = {
                    usage = 150.5,
                    threshold = -10
                }
            }
        }`;

        const document = parser.parse(ton);

        const schema = {
            type: 'object',
            properties: {
                performance: {
                    type: 'object',
                    properties: {
                        cpu: {
                            type: 'object',
                            properties: {
                                usage: { type: 'number', required: true, min: 0, max: 100 },
                                threshold: { type: 'number', required: true, min: 0, max: 100 }
                            }
                        }
                    }
                }
            }
        };

        const validator = new TonValidator(schema as any);

        // Act
        const result = validator.validate(document);

        // Assert
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should validate string patterns', () => {
        // Arrange
        const parser = new TonParser();
        const ton = `{
            contact = {
                email = "john@example.com",
                phone = "+1-555-1234"
            }
        }`;

        const document = parser.parse(ton);

        const schema = {
            type: 'object',
            properties: {
                contact: {
                    type: 'object',
                    properties: {
                        email: { type: 'string', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
                        phone: { type: 'string', required: true, pattern: /^\+\d{1,3}-/ }
                    }
                }
            }
        };

        const validator = new TonValidator(schema as any);

        // Act
        const result = validator.validate(document);

        // Assert
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    test('should validate mixed types', () => {
        // Arrange
        const parser = new TonParser();
        const ton = `{
            version = "1.0.0",
            endpoints = [
                {
                    path = "/users",
                    methods = ["GET", "POST"],
                    auth = true
                },
                {
                    path = "/health",
                    methods = ["GET"],
                    auth = false
                }
            ],
            config = {
                rateLimit = 1000,
                timeout = 30
            }
        }`;

        const document = parser.parse(ton);

        const schema = {
            type: 'object',
            properties: {
                version: { type: 'string', required: true, pattern: /^\d+\.\d+\.\d+$/ },
                endpoints: {
                    type: 'array',
                    minItems: 1,
                    items: {
                        type: 'object',
                        properties: {
                            path: { type: 'string', required: true, pattern: /^\// },
                            methods: { type: 'array', required: true, minItems: 1 },
                            auth: { type: 'boolean', required: true }
                        }
                    }
                },
                config: {
                    type: 'object',
                    properties: {
                        rateLimit: { type: 'number', required: true, min: 1 },
                        timeout: { type: 'number', required: true, min: 1, max: 300 }
                    }
                }
            }
        };

        const validator = new TonValidator(schema as any);

        // Act
        const result = validator.validate(document);

        // Assert
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });
});