using System;
using System.IO;
using System.Threading.Tasks;
using DevPossible.Ton.Samples.Examples;

namespace DevPossible.Ton.Samples
{
    class Program
    {
        static async Task Main(string[] args)
        {
            Console.WriteLine("============================================");
            Console.WriteLine("       TONfile Library Sample Programs      ");
            Console.WriteLine("============================================\n");

            bool exit = false;
            while (!exit)
            {
                Console.WriteLine("\nSelect a sample to run:");
                Console.WriteLine("1. Basic Parsing - Parse simple TON content");
                Console.WriteLine("2. File Operations - Read and write TON files");
                Console.WriteLine("3. Object Conversion - Convert between C# objects and TON");
                Console.WriteLine("4. Schema Validation - Validate TON with schemas");
                Console.WriteLine("5. Array Operations - Work with arrays in TON");
                Console.WriteLine("6. Advanced Serialization - Customize output format");
                Console.WriteLine("7. Complex Document - Handle nested structures");
                Console.WriteLine("8. Error Handling - Demonstrate error scenarios");
                Console.WriteLine("9. Performance Test - Process large documents");
                Console.WriteLine("0. Exit");
                Console.Write("\nEnter your choice: ");

                var choice = Console.ReadLine();
                Console.WriteLine();

                try
                {
                    switch (choice)
                    {
                        case "1":
                            await BasicParsing.RunAsync();
                            break;
                        case "2":
                            await FileOperations.RunAsync();
                            break;
                        case "3":
                            await ObjectConversion.RunAsync();
                            break;
                        case "4":
                            await SchemaValidation.RunAsync();
                            break;
                        case "5":
                            await ArrayOperations.RunAsync();
                            break;
                        case "6":
                            await AdvancedSerialization.RunAsync();
                            break;
                        case "7":
                            await ComplexDocument.RunAsync();
                            break;
                        case "8":
                            await ErrorHandling.RunAsync();
                            break;
                        case "9":
                            await PerformanceTest.RunAsync();
                            break;
                        case "0":
                            exit = true;
                            Console.WriteLine("Exiting samples. Thank you!");
                            break;
                        default:
                            Console.WriteLine("Invalid choice. Please try" +
                                " again.");
                            break;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"\nError: {ex.Message}");
                }

                if (!exit)
                {
                    Console.WriteLine("\nPress any key to continue...");
                    Console.ReadKey();
                    Console.Clear();
                }
            }
        }
    }
}