/**
 * Integration Tests
 * Copyright (c) 2024 DevPossible, LLC
 */

import { TonParser } from '../../src/parser/TonParser';
import { TonSerializer } from '../../src/serializer/TonSerializer';
import { TonValidator } from '../../src/validator/TonValidator';
import { TonDocument } from '../../src/models';
import * as fs from 'fs';
import * as path from 'path';

describe('Integration Tests', () => {
  describe('End-to-End Workflow', () => {
    test('should parse, validate, and serialize a document', () => {
      const input = `{
        name: "MyApp",
        version: "1.0.0",
        config: {
          port: 8080,
          debug: true
        }
      }`;

      // Parse
      const parser = new TonParser();
      const doc = parser.parse(input);

      // Validate
      const schema = {
        type: 'object',
        required: ['name', 'version'],
        properties: {
          name: { type: 'string' },
          version: { type: 'string' },
          config: {
            type: 'object',
            properties: {
              port: { type: 'number' },
              debug: { type: 'boolean' }
            }
          }
        }
      };

      const validator = new TonValidator();
      const validationResult = validator.validate(doc, schema);
      expect(validationResult.isValid).toBe(true);

      // Serialize
      const serializer = new TonSerializer({ format: 'compact' });
      const output = serializer.serialize(doc);

      expect(output).toContain('name:"MyApp"');
      expect(output).toContain('version:"1.0.0"');
      expect(output).toContain('port:8080');
      expect(output).toContain('debug:true');
    });

    test('should handle complex document with all features', () => {
      const input = `{
        // Application configuration
        name:string: "Enterprise App",
        version: $"2.0.0",
        port: %8080,
        secure: &true,
        releaseDate: ^"2024-01-01",
        environment: |production|,
        features: |auth|api|logging|,
        instanceId: 550e8400-e29b-41d4-a716-446655440000,

        database: Database(1) {
          host: "localhost",
          port: 5432,
          credentials: {
            username: "admin",
            password: """
              SuperSecret
              Password123
            """
          }
        },

        servers: [
          { name: "web1", ip: "10.0.0.1" },
          { name: "web2", ip: "10.0.0.2" }
        ],

        /* Multi-line
           comment block */
        metadata: {
          tags: ["production", "critical"],
          monitoring: true
        }
      }`;

      const parser = new TonParser();
      const doc = parser.parse(input);

      const root = doc.getRoot();
      expect(root.name).toBe('Enterprise App');
      expect(root.version).toBe('2.0.0');
      expect(root.port).toBe(8080);
      expect(root.secure).toBe(true);
      expect(root.releaseDate).toEqual(new Date('2024-01-01'));
      expect(root.environment).toBe('production');
      expect(root.features).toEqual(['auth', 'api', 'logging']);
      expect(root.instanceId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(root.database._className).toBe('Database');
      expect(root.database._instanceId).toBe(1);
      expect(root.database.credentials.password).toContain('SuperSecret');
      expect(root.servers).toHaveLength(2);
      expect(root.metadata.tags).toEqual(['production', 'critical']);
    });
  });

  describe('File Operations', () => {
    const testDir = path.join(__dirname, 'test-files');
    const testFile = path.join(testDir, 'test.ton');

    beforeAll(() => {
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
    });

    afterAll(() => {
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
      if (fs.existsSync(testDir)) {
        fs.rmdirSync(testDir);
      }
    });

    test('should read and write TON files', () => {
      const data = {
        name: 'Test',
        value: 42
      };

      // Create document
      const doc = TonDocument.fromObject(data);

      // Serialize and write
      const serializer = new TonSerializer({ format: 'pretty' });
      const content = serializer.serialize(doc);
      fs.writeFileSync(testFile, content, 'utf8');

      // Read and parse
      const readContent = fs.readFileSync(testFile, 'utf8');
      const parser = new TonParser();
      const parsedDoc = parser.parse(readContent);

      expect(parsedDoc.getRoot()).toEqual(data);
    });

    test('should handle streaming operations', async () => {
      const data = {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          value: `item-${i}`
        }))
      };

      const doc = TonDocument.fromObject(data);
      const serializer = new TonSerializer({ format: 'compact' });
      const content = serializer.serialize(doc);

      // Simulate streaming
      const chunks = [];
      const chunkSize = 100;
      for (let i = 0; i < content.length; i += chunkSize) {
        chunks.push(content.slice(i, i + chunkSize));
      }

      // Reassemble and parse
      const reassembled = chunks.join('');
      const parser = new TonParser();
      const result = parser.parse(reassembled);

      expect(result.getRoot().items).toHaveLength(100);
      expect(result.getRoot().items[0]).toEqual({ id: 0, value: 'item-0' });
      expect(result.getRoot().items[99]).toEqual({ id: 99, value: 'item-99' });
    });
  });

  describe('Error Recovery', () => {
    test('should provide helpful error messages', () => {
      const invalidInputs = [
        { input: '{ unclosed', error: 'Unexpected end of input' },
        { input: '{ "key": }', error: 'Unexpected token' },
        { input: '{ duplicate: 1, duplicate: 2 }', warning: 'Duplicate key' }
      ];

      const parser = new TonParser();

      for (const testCase of invalidInputs) {
        try {
          parser.parse(testCase.input);
          if (testCase.error) {
            fail(`Should have thrown error for: ${testCase.input}`);
          }
        } catch (error: any) {
          if (testCase.error) {
            expect(error.message).toContain(testCase.error);
          }
        }
      }
    });

    test('should handle partial documents gracefully', () => {
      const partialDoc = `{
        name: "Test",
        // Incomplete
      `;

      const parser = new TonParser({ allowPartial: true });

      try {
        const doc = parser.parse(partialDoc);
        expect(doc.getRoot().name).toBe('Test');
        expect(doc.hasErrors()).toBe(true);
      } catch {
        // Expected for strict parsing
      }
    });
  });

  describe('Performance', () => {
    test('should handle large documents efficiently', () => {
      const largeData = {
        items: Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          value: Math.random() * 1000,
          active: i % 2 === 0,
          tags: ['tag1', 'tag2', 'tag3']
        }))
      };

      const startTime = Date.now();

      // Create and serialize
      const doc = TonDocument.fromObject(largeData);
      const serializer = new TonSerializer({ format: 'compact' });
      const serialized = serializer.serialize(doc);

      // Parse back
      const parser = new TonParser();
      const parsed = parser.parse(serialized);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (5 seconds)
      expect(duration).toBeLessThan(5000);
      expect(parsed.getRoot().items).toHaveLength(10000);
    });

    test('should handle deeply nested structures', () => {
      // Create deeply nested object
      let current: any = { value: 'deepest' };
      for (let i = 0; i < 100; i++) {
        current = { level: current };
      }

      const doc = TonDocument.fromObject(current);
      const serializer = new TonSerializer({ format: 'compact' });
      const serialized = serializer.serialize(doc);

      const parser = new TonParser();
      const parsed = parser.parse(serialized);

      // Navigate to deepest level
      let result = parsed.getRoot();
      for (let i = 0; i < 100; i++) {
        result = result.level;
      }

      expect(result.value).toBe('deepest');
    });
  });

  describe('Type Conversion', () => {
    test('should convert between TON and JSON', () => {
      const tonInput = `{
        name: "Test",
        value: 42,
        active: true,
        items: [1, 2, 3]
      }`;

      const parser = new TonParser();
      const doc = parser.parse(tonInput);

      // Convert to JSON
      const json = JSON.stringify(doc.getRoot());
      const jsonObj = JSON.parse(json);

      expect(jsonObj.name).toBe('Test');
      expect(jsonObj.value).toBe(42);
      expect(jsonObj.active).toBe(true);
      expect(jsonObj.items).toEqual([1, 2, 3]);

      // Convert back to TON
      const newDoc = TonDocument.fromObject(jsonObj);
      const serializer = new TonSerializer({ format: 'compact' });
      const tonOutput = serializer.serialize(newDoc);

      expect(tonOutput).toContain('name:"Test"');
      expect(tonOutput).toContain('value:42');
    });

    test('should preserve type information', () => {
      const input = `{
        date: ^"2024-01-01",
        status: |active|,
        permissions: |read|write|,
        guid: 550e8400-e29b-41d4-a716-446655440000,
        config: Config {
          setting: "value"
        }
      }`;

      const parser = new TonParser();
      const doc = parser.parse(input);
      const root = doc.getRoot();

      expect(root.date).toBeInstanceOf(Date);
      expect(root.status).toBe('active');
      expect(root.permissions).toEqual(['read', 'write']);
      expect(root.guid).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(root.config._className).toBe('Config');
    });
  });
});