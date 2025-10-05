using System;
using System.Threading.Tasks;
using DevPossible.Ton;

namespace DevPossible.Ton.Samples.Examples
{
    public static class BasicParsing
    {
        public static async Task RunAsync()
        {
            Console.WriteLine("=== Basic TON Parsing Example ===\n");

            // Example 1: Parse simple object
            Console.WriteLine("1. Parsing a simple object:");
            var simpleContent = @"{
                name = 'John Doe',
                age = 30,
                active = true
            }";

            var parser = new TonParser();
            var document = parser.Parse(simpleContent);

            Console.WriteLine($"   Name: {document.RootObject.GetProperty("name")?.ToString()}");
            Console.WriteLine($"   Age: {document.RootObject.GetProperty("age")?.ToInt32()}");
            Console.WriteLine($"   Active: {document.RootObject.GetProperty("active")?.ToBoolean()}");

            // Example 2: Parse with class name
            Console.WriteLine("\n2. Parsing object with class name:");
            var classContent = @"{(person)
                firstName = 'Jane',
                lastName = 'Smith',
                email = 'jane@example.com'
            }";

            var doc2 = parser.Parse(classContent);
            Console.WriteLine($"   Class: {doc2.RootObject.ClassName}");
            Console.WriteLine($"   Full Name: {doc2.RootObject.GetProperty("firstName")} {doc2.RootObject.GetProperty("lastName")}");

            // Example 3: Parse with different data types
            Console.WriteLine("\n3. Parsing different data types:");
            var typesContent = @"{
                // String types
                text = 'Single quoted',
                quoted = ""Double quoted"",

                // Number types
                integer = 42,
                decimal = 3.14,
                hex = 0xFF,
                binary = 0b1010,
                scientific = 1.23e-4,

                // Special values
                nothing = null,
                missing = undefined,

                // GUID
                id = 550e8400-e29b-41d4-a716-446655440000,

                // Enum
                status = |active|,
                permissions = |read|write|execute|
            }";

            var doc3 = parser.Parse(typesContent);
            Console.WriteLine($"   Text: {doc3.RootObject.GetProperty("text")}");
            Console.WriteLine($"   Integer: {doc3.RootObject.GetProperty("integer")}");
            Console.WriteLine($"   Hex: {doc3.RootObject.GetProperty("hex")}");
            Console.WriteLine($"   Binary: {doc3.RootObject.GetProperty("binary")}");
            Console.WriteLine($"   Scientific: {doc3.RootObject.GetProperty("scientific")}");
            Console.WriteLine($"   Null value is null: {doc3.RootObject.GetProperty("nothing")?.IsNull}");
            Console.WriteLine($"   Undefined is undefined: {doc3.RootObject.GetProperty("missing")?.IsUndefined}");
            Console.WriteLine($"   GUID: {doc3.RootObject.GetProperty("id")?.ToGuid()}");

            var status = doc3.RootObject.GetProperty("status")?.Value as TonEnum;
            Console.WriteLine($"   Status: {status?.Value}");

            var perms = doc3.RootObject.GetProperty("permissions")?.Value as TonEnumSet;
            Console.WriteLine($"   Permissions: {string.Join(", ", perms?.GetNames() ?? new string[0])}");

            await Task.CompletedTask;
        }
    }
}