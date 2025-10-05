using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DevPossible.Ton;

namespace DevPossible.Ton.Samples.Examples
{
    public static class ComplexDocument
    {
        public static async Task RunAsync()
        {
            Console.WriteLine("=== Complex Document Example ===\n");

            // Example 1: Parse a complex nested document
            Console.WriteLine("1. Complex nested structure:");
            var complexTon = @"{(Company)
                name = 'TechCorp International',
                founded = 2010,
                public = true,
                ticker = 'TECH',

                headquarters = {(Office)
                    street = '123 Silicon Valley Blvd',
                    city = 'San Francisco',
                    state = 'CA',
                    zipCode = '94105',
                    country = 'USA',
                    coordinates = {
                        latitude = 37.7749,
                        longitude = -122.4194
                    }
                },

                departments = [
                    {(Department)
                        name = 'Engineering',
                        headcount = 250,
                        budget = 50000000.00,
                        manager = {
                            firstName = 'Alice',
                            lastName = 'Johnson',
                            employeeId = 'EMP001',
                            email = 'alice.johnson@techcorp.com'
                        },
                        teams = [
                            { name = 'Backend', size = 45 },
                            { name = 'Frontend', size = 38 },
                            { name = 'DevOps', size = 22 },
                            { name = 'QA', size = 30 }
                        ],
                        technologies = |java|python|javascript|kubernetes|docker|
                    },
                    {(Department)
                        name = 'Sales',
                        headcount = 120,
                        budget = 25000000.00,
                        manager = {
                            firstName = 'Bob',
                            lastName = 'Smith',
                            employeeId = 'EMP002',
                            email = 'bob.smith@techcorp.com'
                        },
                        regions = ['North America', 'Europe', 'Asia Pacific'],
                        targets = {
                            q1 = 10000000,
                            q2 = 12000000,
                            q3 = 11000000,
                            q4 = 15000000
                        }
                    }
                ],

                financials = {
                    revenue = {
                        2022 = 450000000,
                        2023 = 520000000,
                        2024 = 380000000
                    },
                    expenses = {
                        2022 = 400000000,
                        2023 = 450000000,
                        2024 = 320000000
                    }
                }
            }";

            var parser = new TonParser();
            var doc = parser.Parse(complexTon);

            Console.WriteLine($"   Company: {doc.RootObject.GetProperty("name")?.Value}");
            Console.WriteLine($"   Founded: {doc.RootObject.GetProperty("founded")?.Value}");
            Console.WriteLine($"   Public: {doc.RootObject.GetProperty("public")?.Value}");

            // Navigate nested structure
            var headquarters = doc.RootObject.GetProperty("headquarters")?.Value as TonObject;
            Console.WriteLine($"   HQ City: {headquarters?.GetProperty("city")?.Value}, {headquarters?.GetProperty("state")?.Value}");

            var departments = doc.RootObject.GetProperty("departments")?.Value as List<TonValue>;
            Console.WriteLine($"   Departments: {departments?.Count}");

            foreach (var dept in departments ?? new List<TonValue>())
            {
                var deptObj = dept.Value as TonObject;
                if (deptObj != null)
                {
                    Console.WriteLine($"     - {deptObj.GetProperty("name")?.Value}: {deptObj.GetProperty("headcount")?.Value} employees");
                }
            }

            // Example 2: Navigate using property paths
            Console.WriteLine("\n2. Property path navigation:");

            // Access nested properties
            var coords = headquarters?.GetProperty("coordinates")?.Value as TonObject;
            if (coords != null)
            {
                var latitude = coords.GetProperty("latitude")?.Value;
                var longitude = coords.GetProperty("longitude")?.Value;
                Console.WriteLine($"   Coordinates: ({latitude}, {longitude})");
            }

            // Example 3: Extract and transform data
            Console.WriteLine("\n3. Data extraction and transformation:");

            var financials = doc.RootObject.GetProperty("financials")?.Value as TonObject;
            var revenue = financials?.GetProperty("revenue")?.Value as TonObject;
            var expenses = financials?.GetProperty("expenses")?.Value as TonObject;

            if (revenue != null && expenses != null)
            {
                Console.WriteLine("   Profit/Loss by year:");
                foreach (var yearKey in revenue.Properties.Keys)
                {
                    var rev = Convert.ToDouble(revenue.GetProperty(yearKey)?.Value ?? 0);
                    var exp = Convert.ToDouble(expenses.GetProperty(yearKey)?.Value ?? 0);
                    var profit = rev - exp;
                    Console.WriteLine($"     {yearKey}: ${profit:N0} ({(profit >= 0 ? "Profit" : "Loss")})");
                }
            }

            // Example 4: Work with enums and enum sets
            Console.WriteLine("\n4. Enum and EnumSet handling:");

            if (departments != null && departments.Count > 0)
            {
                var engDept = (departments[0].Value as TonObject);
                var technologies = engDept?.GetProperty("technologies")?.Value as TonEnumSet;

                if (technologies != null)
                {
                    Console.WriteLine($"   Engineering Technologies: {string.Join(", ", technologies.GetNames())}");
                    Console.WriteLine($"   Has Docker: {technologies.Contains("docker")}");
                    Console.WriteLine($"   Has AWS: {technologies.Contains("aws")}");
                }
            }

            // Example 5: Build complex document programmatically
            Console.WriteLine("\n5. Building complex document:");

            var newDoc = new TonDocument
            {
                RootObject = new TonObject
                {
                    ClassName = "Organization",
                    Properties = new Dictionary<string, TonValue>
                    {
                        ["name"] = TonValue.From("New Organization"),
                        ["structure"] = TonValue.From(new TonObject
                        {
                            Properties = new Dictionary<string, TonValue>
                            {
                                ["levels"] = TonValue.From(new List<TonValue>
                                {
                                    TonValue.From("Executive"),
                                    TonValue.From("Management"),
                                    TonValue.From("Staff")
                                }),
                                ["matrix"] = TonValue.From(true)
                            }
                        })
                    }
                }
            };

            // Add nested array of objects
            var divisions = new List<TonValue>();
            for (int i = 1; i <= 3; i++)
            {
                divisions.Add(TonValue.From(new TonObject
                {
                    Properties = new Dictionary<string, TonValue>
                    {
                        ["id"] = TonValue.From($"DIV{i:D3}"),
                        ["name"] = TonValue.From($"Division {i}"),
                        ["budget"] = TonValue.From(1000000 * i)
                    }
                }));
            }
            newDoc.RootObject.SetProperty("divisions", TonValue.From(divisions));

            var serializer = new TonSerializer();
            var options = TonSerializeOptions.Pretty;

            var built = serializer.SerializeDocument(newDoc, options);
            Console.WriteLine("   Built document preview:");
            var builtLines = built.Split('\n');
            for (int i = 0; i < Math.Min(10, builtLines.Length); i++)
            {
                Console.WriteLine("   " + builtLines[i]);
            }

            // Example 6: Statistics about complex document
            Console.WriteLine("\n6. Document statistics:");

            int totalProperties = CountProperties(doc.RootObject);
            int totalArrays = CountArrays(doc.RootObject);
            int totalObjects = CountObjects(doc.RootObject);
            int maxDepth = CalculateMaxDepth(doc.RootObject);

            Console.WriteLine($"   Total properties: {totalProperties}");
            Console.WriteLine($"   Total arrays: {totalArrays}");
            Console.WriteLine($"   Total nested objects: {totalObjects}");
            Console.WriteLine($"   Maximum nesting depth: {maxDepth}");

            await Task.CompletedTask;
        }

        private static int CountProperties(TonObject obj, bool recursive = true)
        {
            int count = obj.Properties.Count;

            if (recursive)
            {
                foreach (var prop in obj.Properties.Values)
                {
                    if (prop.Value is TonObject nestedObj)
                    {
                        count += CountProperties(nestedObj, true);
                    }
                    else if (prop.Value is List<TonValue> array)
                    {
                        foreach (var element in array)
                        {
                            if (element.Value is TonObject elementObj)
                            {
                                count += CountProperties(elementObj, true);
                            }
                        }
                    }
                }
            }

            return count;
        }

        private static int CountArrays(TonObject obj)
        {
            int count = 0;

            foreach (var prop in obj.Properties.Values)
            {
                if (prop.Value is List<TonValue>)
                {
                    count++;
                    var array = prop.Value as List<TonValue>;
                    if (array != null)
                    {
                        foreach (var element in array)
                        {
                            if (element.Value is TonObject elementObj)
                            {
                                count += CountArrays(elementObj);
                            }
                        }
                    }
                }
                else if (prop.Value is TonObject nestedObj)
                {
                    count += CountArrays(nestedObj);
                }
            }

            return count;
        }

        private static int CountObjects(TonObject obj)
        {
            int count = 0;

            foreach (var prop in obj.Properties.Values)
            {
                if (prop.Value is TonObject nestedObj)
                {
                    count++;
                    count += CountObjects(nestedObj);
                }
                else if (prop.Value is List<TonValue> array)
                {
                    foreach (var element in array)
                    {
                        if (element.Value is TonObject elementObj)
                        {
                            count++;
                            count += CountObjects(elementObj);
                        }
                    }
                }
            }

            return count;
        }

        private static int CalculateMaxDepth(TonObject obj, int currentDepth = 1)
        {
            int maxDepth = currentDepth;

            foreach (var prop in obj.Properties.Values)
            {
                if (prop.Value is TonObject nestedObj)
                {
                    int depth = CalculateMaxDepth(nestedObj, currentDepth + 1);
                    maxDepth = Math.Max(maxDepth, depth);
                }
                else if (prop.Value is List<TonValue> array)
                {
                    foreach (var element in array)
                    {
                        if (element.Value is TonObject elementObj)
                        {
                            int depth = CalculateMaxDepth(elementObj, currentDepth + 1);
                            maxDepth = Math.Max(maxDepth, depth);
                        }
                    }
                }
            }

            return maxDepth;
        }
    }
}