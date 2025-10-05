using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DevPossible.Ton;

namespace DevPossible.Ton.Samples.Examples
{
    public static class SchemaValidation
    {
        public static async Task RunAsync()
        {
            Console.WriteLine("=== Schema Validation Example ===\n");
            Console.WriteLine("Note: Schema validation is not yet implemented in the DevPossible.Ton library.");
            Console.WriteLine("This example demonstrates the intended API design for future implementation.\n");

            // Example 1: Basic schema validation (simulated)
            Console.WriteLine("1. Basic schema validation (simulated):");

            var parser = new TonParser();

            // Valid document
            var validTon = @"{
                username = 'john_doe',
                age = 30,
                email = 'john@example.com',
                premium = true
            }";

            var validDoc = parser.Parse(validTon);
            Console.WriteLine("   Valid document parsed successfully");

            // Invalid document
            var invalidTon = @"{
                username = 'jo',  // Too short
                age = 200,        // Too old
                email = 'invalid-email'  // Invalid format
            }";

            var invalidDoc = parser.Parse(invalidTon);
            Console.WriteLine("   Invalid document parsed (would fail validation if implemented)");
            Console.WriteLine("   Expected errors:");
            Console.WriteLine("     - username: Too short (min 3 characters)");
            Console.WriteLine("     - age: Too old (max 150)");
            Console.WriteLine("     - email: Invalid format");

            // Example 2: Demonstrate parsing with type annotations
            Console.WriteLine("\n2. Parsing with type annotations:");
            var productTon = @"{(Product)
                name = 'Laptop',
                price = 999.99,
                category = |electronics|,
                quantity = 2
            }";

            var productDoc = parser.Parse(productTon);
            Console.WriteLine($"   Product parsed: {productDoc.RootObject.GetProperty("name")}");
            Console.WriteLine($"   Class name: {productDoc.RootObject.ClassName}");

            // Example 3: Arrays with type hints
            Console.WriteLine("\n3. Arrays with type hints:");
            var arrayTon = @"{
                tags = [$'tech', 'programming', 'dotnet'],
                scores = [%85, 92, 78, 95]
            }";

            var arrayDoc = parser.Parse(arrayTon);
            var tags = arrayDoc.RootObject.GetProperty("tags")?.Value as List<TonValue>;
            var scores = arrayDoc.RootObject.GetProperty("scores")?.Value as List<TonValue>;

            var tagsValue = arrayDoc.RootObject.GetProperty("tags");
            var scoresValue = arrayDoc.RootObject.GetProperty("scores");
            Console.WriteLine($"   Tags array type hint: {tagsValue?.TypeHint ?? ' '}");
            Console.WriteLine($"   Scores array type hint: {scoresValue?.TypeHint ?? ' '}");

            // Example 4: Business logic validation (manual)
            Console.WriteLine("\n4. Manual business logic validation:");

            var dateRangeTon = @"{
                startDate = '2024-01-01',
                endDate = '2024-12-31'
            }";

            var dateDoc = parser.Parse(dateRangeTon);
            var start = dateDoc.RootObject.GetProperty("startDate")?.ToString();
            var end = dateDoc.RootObject.GetProperty("endDate")?.ToString();

            if (DateTime.TryParse(start, out var startDate) && DateTime.TryParse(end, out var endDate))
            {
                if (endDate >= startDate)
                {
                    Console.WriteLine("   ✓ Date range is valid");
                }
                else
                {
                    Console.WriteLine("   ✗ End date must be after start date");
                }
            }

            // Example 5: Demonstrate schema structure in TON format
            Console.WriteLine("\n5. Schema structure (as TON):");
            var schemaTon = @"{(Schema)
                properties = {
                    username = {
                        type = 'string',
                        required = true,
                        minLength = 3,
                        maxLength = 20,
                        pattern = '^[a-zA-Z0-9_]+$'
                    },
                    age = {
                        type = 'integer',
                        required = true,
                        minValue = 0,
                        maxValue = 150
                    },
                    email = {
                        type = 'string',
                        required = true,
                        pattern = '^[^@\s]+@[^@\s]+\.[^@\s]+$'
                    }
                }
            }";

            var schemaDoc = parser.Parse(schemaTon);
            var properties = schemaDoc.RootObject.GetProperty("properties")?.Value as TonObject;

            Console.WriteLine("   Schema properties:");
            foreach (var prop in properties?.Properties ?? new Dictionary<string, TonValue>())
            {
                var propSchema = prop.Value.Value as TonObject;
                var type = propSchema?.GetProperty("type");
                var required = propSchema?.GetProperty("required");
                Console.WriteLine($"     - {prop.Key}: type={type}, required={required}");
            }

            // Example 6: Demonstrate validation results structure
            Console.WriteLine("\n6. Validation results structure:");
            Console.WriteLine("   When schema validation is implemented, results would include:");
            Console.WriteLine("     - IsValid: boolean indicating overall validation status");
            Console.WriteLine("     - Errors: array of error messages with property paths");
            Console.WriteLine("     - Warnings: optional array of non-critical issues");

            await Task.CompletedTask;
        }
    }
}
