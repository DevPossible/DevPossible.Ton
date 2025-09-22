using System;
using System.IO;
using System.Threading.Tasks;

namespace TONfile
{
    /// <summary>
    /// Provides utility methods for formatting TON file content
    /// </summary>
    public static class TonFormatter
    {
        /// <summary>
        /// Formats TON content from a string using the specified style
        /// </summary>
        /// <param name="content">The TON content to format</param>
        /// <param name="style">The formatting style to apply</param>
        /// <returns>The formatted TON content</returns>
        /// <exception cref="ArgumentNullException">Thrown when content is null</exception>
        /// <exception cref="TonParseException">Thrown when the content cannot be parsed</exception>
        public static string FormatString(string content, TonFormatStyle style = TonFormatStyle.Pretty)
        {
            if (content == null)
                throw new ArgumentNullException(nameof(content));

            var parser = new TonParser();
            var serializer = new TonSerializer();

            // Parse the content
            var document = parser.Parse(content);

            // Get appropriate serialization options
            var options = GetSerializationOptions(style);

            // Serialize with formatting
            return serializer.SerializeDocument(document, options);
        }

        /// <summary>
        /// Formats TON content from a string using the specified style asynchronously
        /// </summary>
        /// <param name="content">The TON content to format</param>
        /// <param name="style">The formatting style to apply</param>
        /// <returns>A task that represents the asynchronous format operation</returns>
        /// <exception cref="ArgumentNullException">Thrown when content is null</exception>
        /// <exception cref="TonParseException">Thrown when the content cannot be parsed</exception>
        public static Task<string> FormatStringAsync(string content, TonFormatStyle style = TonFormatStyle.Pretty)
        {
            return Task.Run(() => FormatString(content, style));
        }

        /// <summary>
        /// Formats a TON file using the specified style
        /// </summary>
        /// <param name="filePath">The path to the TON file to format</param>
        /// <param name="style">The formatting style to apply</param>
        /// <returns>The formatted TON content</returns>
        /// <exception cref="ArgumentNullException">Thrown when filePath is null</exception>
        /// <exception cref="FileNotFoundException">Thrown when the file does not exist</exception>
        /// <exception cref="TonParseException">Thrown when the file content cannot be parsed</exception>
        public static string FormatFile(string filePath, TonFormatStyle style = TonFormatStyle.Pretty)
        {
            if (filePath == null)
                throw new ArgumentNullException(nameof(filePath));

            if (!File.Exists(filePath))
                throw new FileNotFoundException($"File not found: {filePath}");

            var parser = new TonParser();
            var serializer = new TonSerializer();

            // Parse the file
            var document = parser.ParseFile(filePath);

            // Get appropriate serialization options
            var options = GetSerializationOptions(style);

            // Serialize with formatting
            return serializer.SerializeDocument(document, options);
        }

        /// <summary>
        /// Formats a TON file using the specified style asynchronously
        /// </summary>
        /// <param name="filePath">The path to the TON file to format</param>
        /// <param name="style">The formatting style to apply</param>
        /// <returns>A task that represents the asynchronous format operation</returns>
        /// <exception cref="ArgumentNullException">Thrown when filePath is null</exception>
        /// <exception cref="FileNotFoundException">Thrown when the file does not exist</exception>
        /// <exception cref="TonParseException">Thrown when the file content cannot be parsed</exception>
        public static async Task<string> FormatFileAsync(string filePath, TonFormatStyle style = TonFormatStyle.Pretty)
        {
            if (filePath == null)
                throw new ArgumentNullException(nameof(filePath));

            if (!File.Exists(filePath))
                throw new FileNotFoundException($"File not found: {filePath}");

            var parser = new TonParser();
            var serializer = new TonSerializer();

            // Parse the file asynchronously
            var document = await parser.ParseFileAsync(filePath);

            // Get appropriate serialization options
            var options = GetSerializationOptions(style);

            // Serialize with formatting
            return serializer.SerializeDocument(document, options);
        }

        /// <summary>
        /// Formats a TON file in place using the specified style
        /// </summary>
        /// <param name="filePath">The path to the TON file to format in place</param>
        /// <param name="style">The formatting style to apply</param>
        /// <exception cref="ArgumentNullException">Thrown when filePath is null</exception>
        /// <exception cref="FileNotFoundException">Thrown when the file does not exist</exception>
        /// <exception cref="TonParseException">Thrown when the file content cannot be parsed</exception>
        /// <exception cref="UnauthorizedAccessException">Thrown when the file cannot be written</exception>
        public static void FormatFileInPlace(string filePath, TonFormatStyle style = TonFormatStyle.Pretty)
        {
            if (filePath == null)
                throw new ArgumentNullException(nameof(filePath));

            var formattedContent = FormatFile(filePath, style);
            File.WriteAllText(filePath, formattedContent);
        }

        /// <summary>
        /// Formats a TON file in place using the specified style asynchronously
        /// </summary>
        /// <param name="filePath">The path to the TON file to format in place</param>
        /// <param name="style">The formatting style to apply</param>
        /// <returns>A task that represents the asynchronous format operation</returns>
        /// <exception cref="ArgumentNullException">Thrown when filePath is null</exception>
        /// <exception cref="FileNotFoundException">Thrown when the file does not exist</exception>
        /// <exception cref="TonParseException">Thrown when the file content cannot be parsed</exception>
        /// <exception cref="UnauthorizedAccessException">Thrown when the file cannot be written</exception>
        public static async Task FormatFileInPlaceAsync(string filePath, TonFormatStyle style = TonFormatStyle.Pretty)
        {
            if (filePath == null)
                throw new ArgumentNullException(nameof(filePath));

            var formattedContent = await FormatFileAsync(filePath, style);
            await File.WriteAllTextAsync(filePath, formattedContent);
        }

        /// <summary>
        /// Formats TON content to a new file using the specified style
        /// </summary>
        /// <param name="inputFilePath">The path to the input TON file</param>
        /// <param name="outputFilePath">The path to the output file</param>
        /// <param name="style">The formatting style to apply</param>
        /// <exception cref="ArgumentNullException">Thrown when inputFilePath or outputFilePath is null</exception>
        /// <exception cref="FileNotFoundException">Thrown when the input file does not exist</exception>
        /// <exception cref="TonParseException">Thrown when the file content cannot be parsed</exception>
        /// <exception cref="UnauthorizedAccessException">Thrown when the output file cannot be written</exception>
        public static void FormatFileToFile(string inputFilePath, string outputFilePath, TonFormatStyle style = TonFormatStyle.Pretty)
        {
            if (inputFilePath == null)
                throw new ArgumentNullException(nameof(inputFilePath));
            if (outputFilePath == null)
                throw new ArgumentNullException(nameof(outputFilePath));

            var formattedContent = FormatFile(inputFilePath, style);
            File.WriteAllText(outputFilePath, formattedContent);
        }

        /// <summary>
        /// Formats TON content to a new file using the specified style asynchronously
        /// </summary>
        /// <param name="inputFilePath">The path to the input TON file</param>
        /// <param name="outputFilePath">The path to the output file</param>
        /// <param name="style">The formatting style to apply</param>
        /// <returns>A task that represents the asynchronous format operation</returns>
        /// <exception cref="ArgumentNullException">Thrown when inputFilePath or outputFilePath is null</exception>
        /// <exception cref="FileNotFoundException">Thrown when the input file does not exist</exception>
        /// <exception cref="TonParseException">Thrown when the file content cannot be parsed</exception>
        /// <exception cref="UnauthorizedAccessException">Thrown when the output file cannot be written</exception>
        public static async Task FormatFileToFileAsync(string inputFilePath, string outputFilePath, TonFormatStyle style = TonFormatStyle.Pretty)
        {
            if (inputFilePath == null)
                throw new ArgumentNullException(nameof(inputFilePath));
            if (outputFilePath == null)
                throw new ArgumentNullException(nameof(outputFilePath));

            var formattedContent = await FormatFileAsync(inputFilePath, style);
            await File.WriteAllTextAsync(outputFilePath, formattedContent);
        }

        /// <summary>
        /// Gets the appropriate serialization options for the specified format style
        /// </summary>
        /// <param name="style">The format style</param>
        /// <returns>Serialization options configured for the specified style</returns>
        private static TonSerializeOptions GetSerializationOptions(TonFormatStyle style)
        {
            return style switch
            {
                TonFormatStyle.Compact => TonSerializeOptions.Compact,
                TonFormatStyle.Pretty => TonSerializeOptions.Pretty,
                _ => TonSerializeOptions.Pretty
            };
        }
    }
}