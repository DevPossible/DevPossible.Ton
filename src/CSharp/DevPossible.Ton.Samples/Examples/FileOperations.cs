using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using TONfile;

namespace TONfile.Samples.Examples
{
    public static class FileOperations
    {
        public static async Task RunAsync()
        {
            Console.WriteLine("=== File Operations Example ===\n");

            // Create a temporary directory for our samples
            var tempDir = Path.Combine(Path.GetTempPath(), "TONfile_Samples");
            Directory.CreateDirectory(tempDir);
            Console.WriteLine($"Working directory: {tempDir}\n");

            try
            {
                // Example 1: Write TON to file
                Console.WriteLine("1. Writing TON content to file:");
                var filePath = Path.Combine(tempDir, "config.ton");

                var document = new TonDocument
                {
                    RootObject = new TonObject
                    {
                        Properties = new Dictionary<string, TonValue>
                        {
                            ["application"] = TonValue.From("TONfile Demo"),
                            ["version"] = TonValue.From(1.0),
                            ["database"] = TonValue.From(new TonObject
                            {
                                ClassName = "DatabaseConfig",
                                Properties = new Dictionary<string, TonValue>
                                {
                                    ["host"] = TonValue.From("localhost"),
                                    ["port"] = TonValue.From(5432),
                                    ["name"] = TonValue.From("myapp_db"),
                                    ["ssl"] = TonValue.From(true)
                                }
                            }),
                            ["features"] = TonValue.From(new List<TonValue>
                            {
                                TonValue.From("authentication"),
                                TonValue.From("logging"),
                                TonValue.From("caching")
                            })
                        }
                    }
                };

                var serializer = new TonSerializer();
                var options = TonSerializeOptions.Pretty;

                var content = serializer.SerializeDocument(document, options);
                await File.WriteAllTextAsync(filePath, content);
                Console.WriteLine($"   Written to: {filePath}");

                // Example 2: Read TON from file
                Console.WriteLine("\n2. Reading TON content from file:");
                var parser = new TonParser();
                var fileContent = await File.ReadAllTextAsync(filePath);
                var readDocument = parser.Parse(fileContent);

                Console.WriteLine($"   Application: {readDocument.RootObject.GetProperty("application")?.Value}");
                Console.WriteLine($"   Version: {readDocument.RootObject.GetProperty("version")?.Value}");

                var database = readDocument.RootObject.GetProperty("database")?.Value as TonObject;
                if (database != null)
                {
                    Console.WriteLine($"   Database Host: {database.GetProperty("host")?.Value}");
                    Console.WriteLine($"   Database Port: {database.GetProperty("port")?.Value}");
                }

                // Example 3: Update and save
                Console.WriteLine("\n3. Updating and saving file:");
                readDocument.RootObject.SetProperty("lastModified", TonValue.From(DateTime.UtcNow.ToString("O")));
                readDocument.RootObject.SetProperty("environment", TonValue.From("production"));

                var updatedContent = serializer.SerializeDocument(readDocument, options);
                await File.WriteAllTextAsync(filePath, updatedContent);
                Console.WriteLine("   File updated with new properties");

                // Example 4: Working with streams
                Console.WriteLine("\n4. Working with streams:");
                var streamPath = Path.Combine(tempDir, "stream_test.ton");

                using (var stream = File.OpenWrite(streamPath))
                using (var writer = new StreamWriter(stream))
                {
                    await writer.WriteAsync(content);
                }
                Console.WriteLine($"   Written via stream to: {streamPath}");

                using (var stream = File.OpenRead(streamPath))
                using (var reader = new StreamReader(stream))
                {
                    var streamContent = await reader.ReadToEndAsync();
                    var streamDoc = parser.Parse(streamContent);
                    Console.WriteLine($"   Read via stream - App: {streamDoc.RootObject.GetProperty("application")?.Value}");
                }

                // Example 5: Handle missing files
                Console.WriteLine("\n5. Handling missing files:");
                try
                {
                    var missingContent = await File.ReadAllTextAsync(Path.Combine(tempDir, "nonexistent.ton"));
                    var missingDoc = parser.Parse(missingContent);
                }
                catch (FileNotFoundException ex)
                {
                    Console.WriteLine($"   Expected error: {ex.Message}");
                }

                // Show final file content
                Console.WriteLine("\n6. Final file content:");
                var finalContent = await File.ReadAllTextAsync(filePath);
                Console.WriteLine("   " + finalContent.Replace("\n", "\n   "));
            }
            finally
            {
                // Cleanup
                if (Directory.Exists(tempDir))
                {
                    Directory.Delete(tempDir, true);
                    Console.WriteLine("\nTemporary files cleaned up.");
                }
            }
        }
    }
}