using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using DevPossible.Ton;

namespace DevPossible.Ton.Samples.Examples
{
    public static class PerformanceTest
    {
        public static async Task RunAsync()
        {
            Console.WriteLine("=== Performance Test Example ===\n");

            // Example 1: Parse performance with different document sizes
            Console.WriteLine("1. Parse performance test:");
            await TestParsePerformance();

            // Example 2: Serialization performance
            Console.WriteLine("\n2. Serialization performance test:");
            await TestSerializationPerformance();

            // Example 3: Large array performance
            Console.WriteLine("\n3. Large array handling:");
            await TestLargeArrayPerformance();

            // Example 4: Deep nesting performance
            Console.WriteLine("\n4. Deep nesting performance:");
            await TestDeepNestingPerformance();

            // Example 5: Memory efficiency
            Console.WriteLine("\n5. Memory efficiency test:");
            await TestMemoryEfficiency();

            // Example 6: Concurrent operations
            Console.WriteLine("\n6. Concurrent operations:");
            await TestConcurrentOperations();

            // Example 7: File I/O performance
            Console.WriteLine("\n7. File I/O performance:");
            await TestFileIOPerformance();
        }

        private static async Task TestParsePerformance()
        {
            var sizes = new[] { 10, 100, 1000, 5000 };
            var parser = new TonParser();

            foreach (var size in sizes)
            {
                var ton = GenerateLargeTon(size);
                var sw = Stopwatch.StartNew();

                var doc = parser.Parse(ton);

                sw.Stop();
                Console.WriteLine($"   {size} properties: {sw.ElapsedMilliseconds}ms ({ton.Length:N0} chars)");
            }

            await Task.CompletedTask;
        }

        private static async Task TestSerializationPerformance()
        {
            var sizes = new[] { 10, 100, 1000, 5000 };
            var serializer = new TonSerializer();
            var serializerOptions = new[]
            {
                ("Compact", TonSerializeOptions.Compact),
                ("Pretty", TonSerializeOptions.Pretty),
                ("Standard", TonSerializeOptions.Default)
            };

            foreach (var size in sizes)
            {
                var doc = GenerateLargeDocument(size);
                Console.WriteLine($"\n   Document with {size} properties:");

                foreach (var (name, options) in serializerOptions)
                {
                    var sw = Stopwatch.StartNew();

                    var output = serializer.SerializeDocument(doc, options);

                    sw.Stop();
                    Console.WriteLine($"     {name}: {sw.ElapsedMilliseconds}ms ({output.Length:N0} chars)");
                }
            }

            await Task.CompletedTask;
        }

        private static async Task TestLargeArrayPerformance()
        {
            var arraySizes = new[] { 100, 1000, 10000, 50000 };
            var parser = new TonParser();
            var serializer = new TonSerializer();
            var options = TonSerializeOptions.Compact;

            foreach (var size in arraySizes)
            {
                // Generate array
                var array = new List<TonValue>();
                for (int i = 0; i < size; i++)
                {
                    array.Add(TonValue.From(i));
                }

                var doc = new TonDocument
                {
                    RootObject = new TonObject
                    {
                        Properties = new Dictionary<string, TonValue>
                        {
                            ["data"] = TonValue.From(array)
                        }
                    }
                };

                // Test serialization
                var swSerialize = Stopwatch.StartNew();
                var serialized = serializer.SerializeDocument(doc, options);
                swSerialize.Stop();

                // Test parsing
                var swParse = Stopwatch.StartNew();
                var parsed = parser.Parse(serialized);
                swParse.Stop();

                // Test array operations
                var parsedArray = parsed.RootObject.GetProperty("data")?.Value as List<TonValue>;

                var swAccess = Stopwatch.StartNew();
                var sum = parsedArray?.Sum(e => Convert.ToInt32(e.Value ?? 0)) ?? 0;
                swAccess.Stop();

                Console.WriteLine($"   Array size {size:N0}:");
                Console.WriteLine($"     Serialize: {swSerialize.ElapsedMilliseconds}ms");
                Console.WriteLine($"     Parse: {swParse.ElapsedMilliseconds}ms");
                Console.WriteLine($"     Sum elements: {swAccess.ElapsedMilliseconds}ms (sum = {sum:N0})");
            }

            await Task.CompletedTask;
        }

        private static async Task TestDeepNestingPerformance()
        {
            var depths = new[] { 10, 20, 50, 100 };
            var parser = new TonParser();
            var serializer = new TonSerializer();
            var options = TonSerializeOptions.Compact;

            foreach (var depth in depths)
            {
                // Generate deeply nested structure
                TonObject current = new TonObject
                {
                    Properties = new Dictionary<string, TonValue>
                    {
                        ["value"] = TonValue.From($"depth_{depth}")
                    }
                };

                TonObject root = current;
                for (int i = 1; i < depth; i++)
                {
                    var next = new TonObject
                    {
                        Properties = new Dictionary<string, TonValue>
                        {
                            ["value"] = TonValue.From($"depth_{depth - i}"),
                            ["nested"] = TonValue.From(current)
                        }
                    };
                    current = next;
                }
                root = current;

                var doc = new TonDocument { RootObject = root };

                // Test operations
                var swSerialize = Stopwatch.StartNew();
                var serialized = serializer.SerializeDocument(doc, options);
                swSerialize.Stop();

                var swParse = Stopwatch.StartNew();
                var parsed = parser.Parse(serialized);
                swParse.Stop();

                // Navigate to deepest level
                var swNavigate = Stopwatch.StartNew();
                var nav = parsed.RootObject;
                int actualDepth = 0;
                while (nav != null)
                {
                    actualDepth++;
                    nav = nav.GetProperty("nested")?.Value as TonObject;
                }
                swNavigate.Stop();

                Console.WriteLine($"   Nesting depth {depth}:");
                Console.WriteLine($"     Serialize: {swSerialize.ElapsedMilliseconds}ms");
                Console.WriteLine($"     Parse: {swParse.ElapsedMilliseconds}ms");
                Console.WriteLine($"     Navigate: {swNavigate.ElapsedMilliseconds}ms (depth verified: {actualDepth})");
            }

            await Task.CompletedTask;
        }

        private static async Task TestMemoryEfficiency()
        {
            var initialMemory = GC.GetTotalMemory(true);
            Console.WriteLine($"   Initial memory: {initialMemory / 1024:N0} KB");

            // Create large document
            var doc = GenerateLargeDocument(10000);
            var afterCreation = GC.GetTotalMemory(false);
            Console.WriteLine($"   After creating 10K properties: {afterCreation / 1024:N0} KB (+{(afterCreation - initialMemory) / 1024:N0} KB)");

            // Serialize
            var serializer = new TonSerializer();
            var options = TonSerializeOptions.Compact;
            var serialized = serializer.SerializeDocument(doc, options);
            var afterSerialization = GC.GetTotalMemory(false);
            Console.WriteLine($"   After serialization: {afterSerialization / 1024:N0} KB (+{(afterSerialization - afterCreation) / 1024:N0} KB)");

            // Parse
            var parser = new TonParser();
            var parsed = parser.Parse(serialized);
            var afterParsing = GC.GetTotalMemory(false);
            Console.WriteLine($"   After parsing: {afterParsing / 1024:N0} KB (+{(afterParsing - afterSerialization) / 1024:N0} KB)");

            // Force garbage collection
            doc = null;
            parsed = null;
            serialized = null;
            GC.Collect();
            GC.WaitForPendingFinalizers();
            GC.Collect();

            var afterGC = GC.GetTotalMemory(true);
            Console.WriteLine($"   After GC: {afterGC / 1024:N0} KB (released: {(afterParsing - afterGC) / 1024:N0} KB)");

            await Task.CompletedTask;
        }

        private static async Task TestConcurrentOperations()
        {
            var parser = new TonParser();
            var serializer = new TonSerializer();
            var options = TonSerializeOptions.Compact;

            var documents = new List<string>();
            for (int i = 0; i < 100; i++)
            {
                documents.Add(GenerateLargeTon(100));
            }

            // Sequential processing
            var swSequential = Stopwatch.StartNew();
            foreach (var ton in documents)
            {
                var doc = parser.Parse(ton);
                var output = serializer.SerializeDocument(doc, options);
            }
            swSequential.Stop();
            Console.WriteLine($"   Sequential (100 docs): {swSequential.ElapsedMilliseconds}ms");

            // Parallel processing
            var swParallel = Stopwatch.StartNew();
            await Task.Run(() =>
            {
                System.Threading.Tasks.Parallel.ForEach(documents, ton =>
                {
                    var localParser = new TonParser();
                    var localSerializer = new TonSerializer();
                    var localOptions = TonSerializeOptions.Compact;

                    var doc = localParser.Parse(ton);
                    var output = localSerializer.SerializeDocument(doc, localOptions);
                });
            });
            swParallel.Stop();
            Console.WriteLine($"   Parallel (100 docs): {swParallel.ElapsedMilliseconds}ms");
            Console.WriteLine($"   Speedup: {(double)swSequential.ElapsedMilliseconds / swParallel.ElapsedMilliseconds:F2}x");
        }

        private static async Task TestFileIOPerformance()
        {
            var tempDir = Path.Combine(Path.GetTempPath(), "DevPossible.Ton_PerfTest");
            Directory.CreateDirectory(tempDir);

            try
            {
                var doc = GenerateLargeDocument(1000);
                var serializer = new TonSerializer();
                var options = TonSerializeOptions.Pretty;
                var parser = new TonParser();

                // Test write performance
                var filePath = Path.Combine(tempDir, "perf_test.ton");

                var swWrite = Stopwatch.StartNew();
                var content = serializer.SerializeDocument(doc, options);
                await File.WriteAllTextAsync(filePath, content);
                swWrite.Stop();

                var fileInfo = new FileInfo(filePath);
                Console.WriteLine($"   Write 1K properties: {swWrite.ElapsedMilliseconds}ms ({fileInfo.Length / 1024:N0} KB)");

                // Test read performance
                var swRead = Stopwatch.StartNew();
                var readContent = await File.ReadAllTextAsync(filePath);
                var readDoc = parser.Parse(readContent);
                swRead.Stop();
                Console.WriteLine($"   Read 1K properties: {swRead.ElapsedMilliseconds}ms");

                // Test stream operations
                using (var stream = new MemoryStream())
                {
                    var swStreamWrite = Stopwatch.StartNew();
                    var writer = new StreamWriter(stream);
                    await writer.WriteAsync(content);
                    await writer.FlushAsync();
                    swStreamWrite.Stop();

                    stream.Position = 0;

                    var swStreamRead = Stopwatch.StartNew();
                    var reader = new StreamReader(stream);
                    var streamContent = await reader.ReadToEndAsync();
                    var streamDoc = parser.Parse(streamContent);
                    swStreamRead.Stop();

                    Console.WriteLine($"   Stream write: {swStreamWrite.ElapsedMilliseconds}ms");
                    Console.WriteLine($"   Stream read: {swStreamRead.ElapsedMilliseconds}ms");
                }

                // Test multiple small files
                var swMultiWrite = Stopwatch.StartNew();
                for (int i = 0; i < 100; i++)
                {
                    var smallDoc = GenerateLargeDocument(10);
                    var smallPath = Path.Combine(tempDir, $"small_{i}.ton");
                    var smallContent = serializer.SerializeDocument(smallDoc, options);
                    await File.WriteAllTextAsync(smallPath, smallContent);
                }
                swMultiWrite.Stop();

                var swMultiRead = Stopwatch.StartNew();
                for (int i = 0; i < 100; i++)
                {
                    var smallPath = Path.Combine(tempDir, $"small_{i}.ton");
                    var smallContent = await File.ReadAllTextAsync(smallPath);
                    var smallDoc = parser.Parse(smallContent);
                }
                swMultiRead.Stop();

                Console.WriteLine($"   Write 100 small files: {swMultiWrite.ElapsedMilliseconds}ms");
                Console.WriteLine($"   Read 100 small files: {swMultiRead.ElapsedMilliseconds}ms");
            }
            finally
            {
                if (Directory.Exists(tempDir))
                {
                    Directory.Delete(tempDir, true);
                }
            }
        }

        private static string GenerateLargeTon(int propertyCount)
        {
            var sb = new StringBuilder();
            sb.AppendLine("{");

            for (int i = 0; i < propertyCount; i++)
            {
                sb.AppendLine($"    property_{i} = 'value_{i}',");

                if (i % 10 == 0)
                {
                    sb.AppendLine($"    number_{i} = {i * 1.5},");
                    sb.AppendLine($"    bool_{i} = {(i % 2 == 0).ToString().ToLower()},");
                }

                if (i % 20 == 0)
                {
                    sb.AppendLine($"    array_{i} = [{i}, {i + 1}, {i + 2}],");
                    sb.AppendLine($"    nested_{i} = {{");
                    sb.AppendLine($"        child = 'nested_value_{i}',");
                    sb.AppendLine($"        index = {i}");
                    sb.AppendLine($"    }},");
                }
            }

            // Remove last comma
            if (sb.Length > 3)
            {
                sb.Length -= 3;
                sb.AppendLine();
            }

            sb.AppendLine("}");
            return sb.ToString();
        }

        private static TonDocument GenerateLargeDocument(int propertyCount)
        {
            var properties = new Dictionary<string, TonValue>();

            for (int i = 0; i < propertyCount; i++)
            {
                properties[$"property_{i}"] = TonValue.From($"value_{i}");

                if (i % 10 == 0)
                {
                    properties[$"number_{i}"] = TonValue.From(i * 1.5);
                    properties[$"bool_{i}"] = TonValue.From(i % 2 == 0);
                }

                if (i % 20 == 0)
                {
                    properties[$"array_{i}"] = TonValue.From(new List<TonValue>
                    {
                        TonValue.From(i),
                        TonValue.From(i + 1),
                        TonValue.From(i + 2)
                    });

                    properties[$"nested_{i}"] = TonValue.From(new TonObject
                    {
                        Properties = new Dictionary<string, TonValue>
                        {
                            ["child"] = TonValue.From($"nested_value_{i}"),
                            ["index"] = TonValue.From(i)
                        }
                    });
                }
            }

            return new TonDocument
            {
                RootObject = new TonObject
                {
                    Properties = properties
                }
            };
        }
    }
}
