using System;
using System.IO;
using System.Threading.Tasks;
using DevPossible.Ton;

namespace DevPossible.Ton.Samples.Examples
{
    public static class ErrorHandling
    {
        public static async Task RunAsync()
        {
            Console.WriteLine("=== Error Handling Example ===\n");

            var parser = new TonParser();

            // Example 1: Syntax errors
            Console.WriteLine("1. Handling syntax errors:");

            var syntaxErrors = new[]
            {
                ("Missing closing brace", "{ name = 'test'"),
                ("Invalid property separator", "{ name : 'test' }"),
                ("Unclosed string", "{ name = 'test }"),
                ("Invalid number format", "{ value = 12.34.56 }"),
                ("Missing array closing bracket", "{ items = [1, 2, 3 }"),
                ("Invalid enum syntax", "{ status = |active }"),
                ("Unexpected token", "{ name = 'test' & }"),
                ("Invalid GUID format", "{ id = 12345-6789 }")
            };

            foreach (var (description, invalidTon) in syntaxErrors)
            {
                try
                {
                    var doc = parser.Parse(invalidTon);
                    Console.WriteLine($"   ✗ {description}: Should have failed but didn't");
                }
                catch (TonParseException ex)
                {
                    Console.WriteLine($"   ✓ {description}: {ex.Message}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"   ? {description}: Unexpected error - {ex.GetType().Name}");
                }
            }

            // Example 2: Type conversion errors
            Console.WriteLine("\n2. Type conversion errors:");

            var conversionTon = @"{
                stringValue = 'hello',
                numberValue = 42,
                boolValue = true,
                nullValue = null,
                arrayValue = [1, 2, 3]
            }";

            var conversionDoc = parser.Parse(conversionTon);

            var conversionTests = new (string description, Action test)[]
            {
                ("String to int", () => conversionDoc.RootObject.GetProperty("stringValue")?.ToInt32()),
                ("Bool to double", () => conversionDoc.RootObject.GetProperty("boolValue")?.ToDouble()),
                ("Null to int", () => conversionDoc.RootObject.GetProperty("nullValue")?.ToInt32()),
                ("Array to string", () => conversionDoc.RootObject.GetProperty("arrayValue")?.ToString()),
                ("String to GUID", () => conversionDoc.RootObject.GetProperty("stringValue")?.ToGuid())
            };

            foreach (var (description, test) in conversionTests)
            {
                try
                {
                    test();
                    Console.WriteLine($"   ✗ {description}: Should have thrown conversion error");
                }
                catch (InvalidCastException ex)
                {
                    Console.WriteLine($"   ✓ {description}: {ex.Message}");
                }
                catch (FormatException ex)
                {
                    Console.WriteLine($"   ✓ {description}: {ex.Message}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"   ? {description}: Unexpected - {ex.GetType().Name}");
                }
            }

            // Example 3: File operation errors
            Console.WriteLine("\n3. File operation errors:");

            var fileTests = new (string description, Func<Task> test)[]
            {
                ("Non-existent file", async () =>
                {
                    await parser.ParseFileAsync("non_existent_file.ton");
                }),
                ("Invalid path characters", async () =>
                {
                    await parser.ParseFileAsync("file<>name.ton");
                }),
                ("Directory instead of file", async () =>
                {
                    await parser.ParseFileAsync(Path.GetTempPath());
                })
            };

            foreach (var (description, test) in fileTests)
            {
                try
                {
                    await test();
                    Console.WriteLine($"   ✗ {description}: Should have thrown file error");
                }
                catch (FileNotFoundException ex)
                {
                    Console.WriteLine($"   ✓ {description}: {ex.GetType().Name}");
                }
                catch (DirectoryNotFoundException ex)
                {
                    Console.WriteLine($"   ✓ {description}: {ex.GetType().Name}");
                }
                catch (UnauthorizedAccessException ex)
                {
                    Console.WriteLine($"   ✓ {description}: {ex.GetType().Name}");
                }
                catch (ArgumentException ex)
                {
                    Console.WriteLine($"   ✓ {description}: {ex.GetType().Name}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"   ? {description}: {ex.GetType().Name}");
                }
            }

            // Example 4: Recovery from errors
            Console.WriteLine("\n4. Error recovery strategies:");

            // Partial document with errors
            var partialTon = @"{
                validProperty = 'This is valid',
                // This property has an error but we can recover
                invalidProperty = ,
                anotherValid = 42,
                nested = {
                    good = true,
                    bad = |invalid|syntax|,
                    recovered = 'ok'
                }
            }";

            Console.WriteLine("   Attempting to parse document with errors...");
            try
            {
                var doc = parser.Parse(partialTon);
                Console.WriteLine("   ✗ Should have failed on invalid syntax");
            }
            catch (TonParseException ex)
            {
                Console.WriteLine($"   ✓ Parse failed as expected: {ex.Message}");

                // Try to extract valid parts
                var lines = partialTon.Split('\n');
                var cleanedTon = string.Join("\n", lines.Where(l => !l.Contains("//")));
                cleanedTon = cleanedTon.Replace("invalidProperty = ,", "")
                                      .Replace("bad = |invalid|syntax|,", "");

                try
                {
                    var recoveredDoc = parser.Parse(cleanedTon);
                    Console.WriteLine($"   ✓ Recovered document with {recoveredDoc.RootObject.Properties.Count} valid properties");
                }
                catch
                {
                    Console.WriteLine("   ✗ Could not recover document");
                }
            }

            // Example 5: Custom validation
            Console.WriteLine("\n5. Custom validation logic:");

            var businessLogicTests = new[]
            {
                ("Valid date range", "{ startDate = '2024-01-01', endDate = '2024-12-31' }"),
                ("Invalid date range", "{ startDate = '2024-12-31', endDate = '2024-01-01' }"),
                ("Valid numeric range", "{ minValue = 10, maxValue = 100 }"),
                ("Invalid numeric range", "{ minValue = 100, maxValue = 10 }")
            };

            foreach (var (description, testTon) in businessLogicTests)
            {
                var doc = parser.Parse(testTon);

                // Manual validation
                var errors = new System.Collections.Generic.List<string>();

                // Check date range
                var start = doc.RootObject.GetProperty("startDate")?.ToString();
                var end = doc.RootObject.GetProperty("endDate")?.ToString();
                if (!string.IsNullOrEmpty(start) && !string.IsNullOrEmpty(end))
                {
                    if (DateTime.TryParse(start, out var startDate) &&
                        DateTime.TryParse(end, out var endDate))
                    {
                        if (endDate < startDate)
                        {
                            errors.Add("End date must be after start date");
                        }
                    }
                }

                // Check numeric range
                var min = doc.RootObject.GetProperty("minValue")?.ToDouble();
                var max = doc.RootObject.GetProperty("maxValue")?.ToDouble();
                if (min.HasValue && max.HasValue && min.Value > max.Value)
                {
                    errors.Add("Min value must be less than max value");
                }

                if (errors.Count == 0)
                {
                    Console.WriteLine($"   ✓ {description}: Passed validation");
                }
                else
                {
                    Console.WriteLine($"   ✗ {description}: {string.Join(", ", errors)}");
                }
            }

            // Example 6: Graceful degradation
            Console.WriteLine("\n6. Graceful degradation:");

            var degradableTon = @"{
                critical = 'Required data',
                optional = 'Nice to have',
                experimental = undefined
            }";

            var degradableDoc = parser.Parse(degradableTon);

            // Safely access properties with defaults
            var critical = degradableDoc.RootObject.GetProperty("critical")?.ToString() ?? "DEFAULT";
            var optional = degradableDoc.RootObject.GetProperty("optional")?.ToString() ?? "DEFAULT";
            var missing = degradableDoc.RootObject.GetProperty("missing")?.ToString() ?? "DEFAULT";
            var experimental = degradableDoc.RootObject.GetProperty("experimental");

            Console.WriteLine($"   Critical: {critical}");
            Console.WriteLine($"   Optional: {optional}");
            Console.WriteLine($"   Missing: {missing}");
            Console.WriteLine($"   Experimental is undefined: {experimental?.IsUndefined}");

            // Example 7: Parse error details
            Console.WriteLine("\n7. Parse error details:");

            var detailedErrorTon = @"{
                line1 = 'ok',
                line2 = 'missing comma'
                line3 = 'error here'
            }";

            try
            {
                var doc = parser.Parse(detailedErrorTon);
            }
            catch (TonParseException ex)
            {
                Console.WriteLine($"   Error: {ex.Message}");
                if (ex.Line > 0)
                {
                    Console.WriteLine($"   Line: {ex.Line}");
                    Console.WriteLine($"   Column: {ex.Column}");
                }
                if (ex.Token != null)
                {
                    Console.WriteLine($"   Near token: {ex.Token.Value}");
                }
            }

            await Task.CompletedTask;
        }
    }
}