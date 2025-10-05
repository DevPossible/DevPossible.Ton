using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DevPossible.Ton;

namespace DevPossible.Ton.Samples.Examples
{
    public static class ObjectConversion
    {
        // Sample classes for demonstration
        public class User
        {
            public string? FirstName { get; set; }
            public string? LastName { get; set; }
            public string? Email { get; set; }
            public int Age { get; set; }
            public bool IsActive { get; set; }
            public DateTime CreatedAt { get; set; }
            public List<string>? Roles { get; set; }
            public Address? Address { get; set; }
        }

        public class Address
        {
            public string? Street { get; set; }
            public string? City { get; set; }
            public string? State { get; set; }
            public string? ZipCode { get; set; }
            public string? Country { get; set; }
        }

        public static async Task RunAsync()
        {
            Console.WriteLine("=== Object Conversion Example ===\n");

            // Example 1: Convert C# object to TON
            Console.WriteLine("1. Converting C# object to TON:");
            var user = new User
            {
                FirstName = "John",
                LastName = "Doe",
                Email = "john.doe@example.com",
                Age = 35,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                Roles = new List<string> { "admin", "developer", "reviewer" },
                Address = new Address
                {
                    Street = "123 Main St",
                    City = "Springfield",
                    State = "IL",
                    ZipCode = "62701",
                    Country = "USA"
                }
            };

            var tonObject = TonObject.FromObject(user);
            Console.WriteLine($"   User converted to TON with {tonObject.Properties.Count} properties");
            Console.WriteLine($"   Name: {tonObject.GetProperty("FirstName")?.Value} {tonObject.GetProperty("LastName")?.Value}");
            Console.WriteLine($"   Has Address: {tonObject.GetProperty("Address") != null}");

            // Example 2: Serialize the converted object
            Console.WriteLine("\n2. Serializing the converted object:");
            var serializer = new TonSerializer();
            var options = TonSerializeOptions.Pretty;

            var document = new TonDocument { RootObject = tonObject };
            var tonString = serializer.SerializeDocument(document, options);
            Console.WriteLine("   TON Output:");
            Console.WriteLine("   " + tonString.Replace("\n", "\n   "));

            // Example 3: Convert TON back to C# object
            Console.WriteLine("\n3. Converting TON back to C# object:");
            var parser = new TonParser();
            var parsedDoc = parser.Parse(tonString);
            var reconstructedUser = parsedDoc.RootObject.ToObject<User>();

            Console.WriteLine($"   Reconstructed User: {reconstructedUser.FirstName} {reconstructedUser.LastName}");
            Console.WriteLine($"   Email: {reconstructedUser.Email}");
            Console.WriteLine($"   Age: {reconstructedUser.Age}");
            Console.WriteLine($"   Active: {reconstructedUser.IsActive}");
            Console.WriteLine($"   Roles Count: {reconstructedUser.Roles?.Count}");
            Console.WriteLine($"   City: {reconstructedUser.Address?.City}");

            // Example 4: Convert with type annotations
            Console.WriteLine("\n4. Working with type annotations:");
            tonObject.ClassName = "User";

            var addressObject = tonObject.GetProperty("Address")?.Value as TonObject;
            if (addressObject != null)
            {
                addressObject.ClassName = "Address";
            }

            var annotatedString = serializer.SerializeDocument(new TonDocument { RootObject = tonObject }, options);
            Console.WriteLine("   TON with type annotations:");
            var lines = annotatedString.Split('\n');
            for (int i = 0; i < Math.Min(10, lines.Length); i++)
            {
                Console.WriteLine("   " + lines[i]);
            }
            if (lines.Length > 10)
            {
                Console.WriteLine("   ...");
            }

            // Example 5: Partial object conversion
            Console.WriteLine("\n5. Partial object conversion:");
            var partialTon = @"{
                FirstName = 'Jane',
                Email = 'jane@example.com',
                Roles = ['user', 'editor']
            }";

            var partialDoc = parser.Parse(partialTon);
            var partialUser = partialDoc.RootObject.ToObject<User>();

            Console.WriteLine($"   Partial User: {partialUser.FirstName}");
            Console.WriteLine($"   Email: {partialUser.Email}");
            Console.WriteLine($"   Age (default): {partialUser.Age}");
            Console.WriteLine($"   Roles: {string.Join(", ", partialUser.Roles ?? new List<string>())}");

            // Example 6: Dictionary conversion
            Console.WriteLine("\n6. Dictionary conversion:");
            var settings = new Dictionary<string, object>
            {
                ["theme"] = "dark",
                ["fontSize"] = 14,
                ["autoSave"] = true,
                ["plugins"] = new List<string> { "spell-check", "formatter", "linter" }
            };

            var settingsTon = TonObject.FromObject(settings);
            Console.WriteLine($"   Settings converted with {settingsTon.Properties.Count} properties");

            var settingsBack = settingsTon.ToObject<Dictionary<string, object>>();
            Console.WriteLine($"   Theme: {settingsBack["theme"]}");
            Console.WriteLine($"   Font Size: {settingsBack["fontSize"]}");

            await Task.CompletedTask;
        }
    }
}