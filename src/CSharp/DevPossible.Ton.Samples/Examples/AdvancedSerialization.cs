using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DevPossible.Ton;

namespace DevPossible.Ton.Samples.Examples
{
    public static class AdvancedSerialization
    {
        public static async Task RunAsync()
        {
            Console.WriteLine("=== Advanced Serialization Example ===\n");

            // Create a complex document for demonstration
            var document = CreateComplexDocument();

            // Example 1: Compact format
            Console.WriteLine("1. Compact format (minified):");
            var compactSerializer = new TonSerializer();
            var compactOptions = TonSerializeOptions.Compact;

            var compact = compactSerializer.SerializeDocument(document, compactOptions);
            Console.WriteLine($"   Length: {compact.Length} characters");
            Console.WriteLine($"   Preview: {compact.Substring(0, Math.Min(100, compact.Length))}...");

            // Example 2: Pretty format with full features
            Console.WriteLine("\n2. Pretty format with all features:");
            var prettySerializer = new TonSerializer();
            var prettyOptions = TonSerializeOptions.Pretty;

            var pretty = prettySerializer.SerializeDocument(document, prettyOptions);
            Console.WriteLine($"   Length: {pretty.Length} characters");
            Console.WriteLine("   First few lines:");
            var lines = pretty.Split('\n');
            for (int i = 0; i < Math.Min(15, lines.Length); i++)
            {
                Console.WriteLine("   " + lines[i]);
            }

            // Example 3: Standard format
            Console.WriteLine("\n3. Standard format:");
            var standardSerializer = new TonSerializer();
            var standardOptions = TonSerializeOptions.Default;

            var standard = standardSerializer.SerializeDocument(document, standardOptions);
            Console.WriteLine($"   Length: {standard.Length} characters");

            // Example 4: Custom options
            Console.WriteLine("\n4. Custom serialization options:");
            var customOptions = new TonSerializeOptions
            {
                Indentation = "  ",  // 2 spaces
                QuoteChar = '"',     // Use double quotes
                SortProperties = true,
                OmitNullValues = true,
                IncludeTypeHints = true
            };

            var simpleDoc = new TonDocument
            {
                RootObject = new TonObject
                {
                    Properties = new Dictionary<string, TonValue>
                    {
                        ["user-name"] = TonValue.From("John Doe"),
                        ["api_key"] = TonValue.From("abc123"),
                        ["2024config"] = TonValue.From(true),
                        ["nullValue"] = TonValue.From(null)
                    }
                }
            };

            var customSerialized = standardSerializer.SerializeDocument(simpleDoc, customOptions);
            Console.WriteLine("   With custom options:");
            Console.WriteLine("   " + customSerialized.Replace("\n", "\n   "));

            // Example 5: Type hint control
            Console.WriteLine("\n5. Type hint control:");
            var arrayDoc = new TonDocument
            {
                RootObject = new TonObject
                {
                    Properties = new Dictionary<string, TonValue>
                    {
                        ["integers"] = new TonValue(new List<TonValue>
                        {
                            TonValue.From(1),
                            TonValue.From(2),
                            TonValue.From(3)
                        }, TonValueType.Array)
                        {
                            TypeHint = '%'
                        },
                        ["floats"] = new TonValue(new List<TonValue>
                        {
                            TonValue.From(1.1),
                            TonValue.From(2.2),
                            TonValue.From(3.3)
                        }, TonValueType.Array)
                        {
                            TypeHint = '^'
                        },
                        ["strings"] = new TonValue(new List<TonValue>
                        {
                            TonValue.From("a"),
                            TonValue.From("b"),
                            TonValue.From("c")
                        }, TonValueType.Array)
                        {
                            TypeHint = '$'
                        }
                    }
                }
            };

            var withHintsOptions = new TonSerializeOptions
            {
                Indentation = "    ",
                IncludeTypeHints = true
            };
            var withHints = standardSerializer.SerializeDocument(arrayDoc, withHintsOptions);

            var withoutHintsOptions = new TonSerializeOptions
            {
                Indentation = "    ",
                IncludeTypeHints = false
            };
            var withoutHints = standardSerializer.SerializeDocument(arrayDoc, withoutHintsOptions);

            Console.WriteLine("   With type hints:");
            Console.WriteLine("   " + withHints.Replace("\n", "\n   "));
            Console.WriteLine("\n   Without type hints:");
            Console.WriteLine("   " + withoutHints.Replace("\n", "\n   "));

            // Example 6: Header and version
            Console.WriteLine("\n6. Headers and versions:");
            var headerOptions = new TonSerializeOptions
            {
                IncludeHeader = true,
                TonVersion = "1.0",
                Indentation = "    "
            };

            var headerDoc = new TonDocument
            {
                RootObject = new TonObject
                {
                    Properties = new Dictionary<string, TonValue>
                    {
                        ["version"] = TonValue.From(1.0),
                        ["author"] = TonValue.From("DevTeam")
                    }
                }
            };

            var withHeader = standardSerializer.SerializeDocument(headerDoc, headerOptions);
            Console.WriteLine("   With header:");
            Console.WriteLine("   " + withHeader.Replace("\n", "\n   "));

            // Example 7: Round-trip serialization
            Console.WriteLine("\n7. Round-trip serialization test:");
            var originalTon = @"{(Settings)
                theme = 'dark',
                fontSize = 14,
                plugins = ['spell-check', 'linter'],
                shortcuts = {
                    save = 'Ctrl+S',
                    quit = 'Ctrl+Q'
                }
            }";

            var parser = new TonParser();
            var parsed = parser.Parse(originalTon);

            var serializer = new TonSerializer();
            var roundTripOptions = new TonSerializeOptions
            {
                Indentation = "    "
            };

            var serialized = serializer.SerializeDocument(parsed, roundTripOptions);
            var reparsed = parser.Parse(serialized);

            Console.WriteLine("   Original properties: " + parsed.RootObject.Properties.Count);
            Console.WriteLine("   After round-trip: " + reparsed.RootObject.Properties.Count);
            Console.WriteLine("   Class name preserved: " + (parsed.RootObject.ClassName == reparsed.RootObject.ClassName));

            // Example 8: Optimized format
            Console.WriteLine("\n8. Optimized format:");
            var optimizedOptions = TonSerializeOptions.Optimized;
            var optimizedDoc = CreateComplexDocument();

            var optimized = standardSerializer.SerializeDocument(optimizedDoc, optimizedOptions);
            Console.WriteLine($"   Optimized length: {optimized.Length} characters");
            Console.WriteLine($"   Pretty length: {pretty.Length} characters");
            Console.WriteLine($"   Compact length: {compact.Length} characters");
            Console.WriteLine($"   Size reduction from pretty: {(1 - (double)optimized.Length / pretty.Length) * 100:F1}%");

            await Task.CompletedTask;
        }

        private static TonDocument CreateComplexDocument()
        {
            return new TonDocument
            {
                RootObject = new TonObject
                {
                    ClassName = "ApplicationConfig",
                    Properties = new Dictionary<string, TonValue>
                    {
                        ["application"] = TonValue.From("MyApp"),
                        ["version"] = TonValue.From(2.1),
                        ["environment"] = TonValue.From(new TonEnum("production")),
                        ["features"] = TonValue.From(new TonEnumSet(new[] { "auth", "logging", "caching" })),
                        ["database"] = TonValue.From(new TonObject
                        {
                            ClassName = "DatabaseConfig",
                            Properties = new Dictionary<string, TonValue>
                            {
                                ["host"] = TonValue.From("db.example.com"),
                                ["port"] = TonValue.From(5432),
                                ["ssl"] = TonValue.From(true),
                                ["pools"] = new TonValue(new List<TonValue>
                                {
                                    TonValue.From(10),
                                    TonValue.From(20),
                                    TonValue.From(30)
                                }, TonValueType.Array)
                                {
                                    TypeHint = '%'
                                }
                            }
                        }),
                        ["servers"] = TonValue.From(new List<TonValue>
                        {
                            TonValue.From(new TonObject
                            {
                                Properties = new Dictionary<string, TonValue>
                                {
                                    ["name"] = TonValue.From("web1"),
                                    ["ip"] = TonValue.From("192.168.1.10")
                                }
                            }),
                            TonValue.From(new TonObject
                            {
                                Properties = new Dictionary<string, TonValue>
                                {
                                    ["name"] = TonValue.From("web2"),
                                    ["ip"] = TonValue.From("192.168.1.11")
                                }
                            })
                        })
                    }
                }
            };
        }
    }
}