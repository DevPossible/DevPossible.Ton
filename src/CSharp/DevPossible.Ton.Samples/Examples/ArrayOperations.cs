using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DevPossible.Ton;

namespace DevPossible.Ton.Samples.Examples
{
    public static class ArrayOperations
    {
        public static async Task RunAsync()
        {
            Console.WriteLine("=== Array Operations Example ===\n");

            // Example 1: Basic array parsing
            Console.WriteLine("1. Basic array parsing:");
            var arrayTon = @"{
                numbers = [1, 2, 3, 4, 5],
                strings = ['apple', 'banana', 'cherry'],
                mixed = [42, 'text', true, null, 3.14]
            }";

            var parser = new TonParser();
            var doc = parser.Parse(arrayTon);

            var numbers = doc.RootObject.GetProperty("numbers")?.Value as List<TonValue>;
            Console.WriteLine($"   Numbers array: [{string.Join(", ", numbers?.Select(e => e.Value?.ToString()) ?? new string[0])}]");

            var strings = doc.RootObject.GetProperty("strings")?.Value as List<TonValue>;
            Console.WriteLine($"   Strings array: [{string.Join(", ", strings?.Select(e => $"'{e.Value}'") ?? new string[0])}]");

            var mixed = doc.RootObject.GetProperty("mixed")?.Value as List<TonValue>;
            Console.WriteLine($"   Mixed array has {mixed?.Count} elements of different types");

            // Example 2: Arrays with type hints
            Console.WriteLine("\n2. Arrays with type hints:");
            var typedArrayTon = @"{
                integers = [%1, 2, 3, 4, 5],            // Integer array
                floats = [^1.1, 2.2, 3.3, 4.4],        // Float array
                strings = ['$hello', 'world'],          // String array
                booleans = [&true, false, true]         // Boolean array
            }";

            var typedDoc = parser.Parse(typedArrayTon);

            var integers = typedDoc.RootObject.GetProperty("integers");
            Console.WriteLine($"   Integer array type hint: {integers?.TypeHint ?? ' '}");

            var floats = typedDoc.RootObject.GetProperty("floats");
            Console.WriteLine($"   Float array type hint: {floats?.TypeHint ?? ' '}");

            // Example 3: Nested arrays
            Console.WriteLine("\n3. Nested arrays:");
            var nestedTon = @"{
                matrix = [
                    [1, 2, 3],
                    [4, 5, 6],
                    [7, 8, 9]
                ],
                jagged = [
                    [1],
                    [2, 3],
                    [4, 5, 6],
                    [7, 8, 9, 10]
                ]
            }";

            var nestedDoc = parser.Parse(nestedTon);
            var matrix = nestedDoc.RootObject.GetProperty("matrix")?.Value as List<TonValue>;

            if (matrix != null && matrix.Count > 0)
            {
                var firstRow = matrix[0].Value as List<TonValue>;
                Console.WriteLine($"   Matrix dimensions: {matrix.Count}x{firstRow?.Count}");
            }

            var jagged = nestedDoc.RootObject.GetProperty("jagged")?.Value as List<TonValue>;
            Console.WriteLine("   Jagged array row lengths:");
            foreach (var row in jagged ?? new List<TonValue>())
            {
                var rowArray = row.Value as List<TonValue>;
                Console.WriteLine($"     Row with {rowArray?.Count} elements");
            }

            // Example 4: Arrays of objects
            Console.WriteLine("\n4. Arrays of objects:");
            var objectArrayTon = @"{
                users = [
                    { name = 'Alice', age = 30, role = |admin| },
                    { name = 'Bob', age = 25, role = |user| },
                    { name = 'Charlie', age = 35, role = |moderator| }
                ],
                products = [
                    {(Product) id = 1, name = 'Laptop', price = 999.99 },
                    {(Product) id = 2, name = 'Mouse', price = 29.99 },
                    {(Product) id = 3, name = 'Keyboard', price = 79.99 }
                ]
            }";

            var objectArrayDoc = parser.Parse(objectArrayTon);
            var users = objectArrayDoc.RootObject.GetProperty("users")?.Value as List<TonValue>;

            Console.WriteLine("   Users:");
            foreach (var user in users ?? new List<TonValue>())
            {
                var userObj = user.Value as TonObject;
                if (userObj != null)
                {
                    Console.WriteLine($"     - {userObj.GetProperty("name")?.Value}, Age: {userObj.GetProperty("age")?.Value}, Role: {userObj.GetProperty("role")?.Value}");
                }
            }

            var products = objectArrayDoc.RootObject.GetProperty("products")?.Value as List<TonValue>;
            Console.WriteLine("\n   Products:");
            foreach (var product in products ?? new List<TonValue>())
            {
                var prodObj = product.Value as TonObject;
                if (prodObj != null)
                {
                    Console.WriteLine($"     - [{prodObj.ClassName ?? "Product"}] {prodObj.GetProperty("name")?.Value}: ${prodObj.GetProperty("price")?.Value}");
                }
            }

            // Example 5: Array manipulation
            Console.WriteLine("\n5. Array manipulation:");
            var array = new List<TonValue>();

            // Add elements
            array.Add(TonValue.From(10));
            array.Add(TonValue.From(20));
            array.Add(TonValue.From(30));
            Console.WriteLine($"   Initial array: [{string.Join(", ", array.Select(e => e.Value?.ToString()))}]");

            // Insert element
            array.Insert(1, TonValue.From(15));
            Console.WriteLine($"   After insert at index 1: [{string.Join(", ", array.Select(e => e.Value?.ToString()))}]");

            // Remove element
            array.RemoveAt(2);
            Console.WriteLine($"   After remove at index 2: [{string.Join(", ", array.Select(e => e.Value?.ToString()))}]");

            // Convert to C# array
            var intArray = array.Select(v => Convert.ToInt32(v.Value)).ToArray();
            Console.WriteLine($"   As int[]: [{string.Join(", ", intArray)}]");

            // Example 6: Array serialization options
            Console.WriteLine("\n6. Array serialization:");
            var testDoc = new TonDocument
            {
                RootObject = new TonObject
                {
                    Properties = new Dictionary<string, TonValue>
                    {
                        ["compact"] = TonValue.From(new List<TonValue>
                        {
                            TonValue.From(1),
                            TonValue.From(2),
                            TonValue.From(3)
                        }),
                        ["typed"] = new TonValue(new List<TonValue>
                        {
                            TonValue.From(100),
                            TonValue.From(200),
                            TonValue.From(300)
                        }, TonValueType.Array)
                        {
                            TypeHint = '%'
                        },
                        ["multiline"] = TonValue.From(new List<TonValue>
                        {
                            TonValue.From(new TonObject
                            {
                                Properties = new Dictionary<string, TonValue>
                                {
                                    ["id"] = TonValue.From(1),
                                    ["name"] = TonValue.From("Item 1")
                                }
                            }),
                            TonValue.From(new TonObject
                            {
                                Properties = new Dictionary<string, TonValue>
                                {
                                    ["id"] = TonValue.From(2),
                                    ["name"] = TonValue.From("Item 2")
                                }
                            })
                        })
                    }
                }
            };

            var serializer = new TonSerializer();
            var options = TonSerializeOptions.Pretty;
            options.IncludeTypeHints = true;

            var serialized = serializer.SerializeDocument(testDoc, options);
            Console.WriteLine("   Serialized arrays:");
            Console.WriteLine("   " + serialized.Replace("\n", "\n   "));

            // Example 7: Array validation
            Console.WriteLine("\n7. Array validation:");
            var validationTon = @"{
                homogeneous = [%1, 2, 3, 4, 5],
                heterogeneous = [1, 'two', true, null]
            }";

            var valDoc = parser.Parse(validationTon);
            var homogeneous = valDoc.RootObject.GetProperty("homogeneous")?.Value as List<TonValue>;

            if (homogeneous != null && homogeneous.Count > 0)
            {
                bool isHomogeneous = homogeneous.All(e => e.Type == homogeneous[0].Type);
                Console.WriteLine($"   Homogeneous array is uniform: {isHomogeneous}");
            }

            var heterogeneous = valDoc.RootObject.GetProperty("heterogeneous")?.Value as List<TonValue>;
            if (heterogeneous != null)
            {
                var types = heterogeneous.Select(e => e.Type).Distinct().ToList();
                Console.WriteLine($"   Heterogeneous array has {types.Count} different types");
            }

            await Task.CompletedTask;
        }
    }
}