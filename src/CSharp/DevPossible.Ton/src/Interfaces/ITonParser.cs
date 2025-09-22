using System.IO;
using System.Threading.Tasks;

namespace TONfile
{
    /// <summary>
    /// Interface for parsing TON (Text Object Notation) files and strings
    /// </summary>
    public interface ITonParser
    {
        /// <summary>
        /// Parses TON content from a string
        /// </summary>
        /// <param name="content">The TON formatted string to parse</param>
        /// <param name="options">Optional parsing options</param>
        /// <returns>The parsed TON document</returns>
        TonDocument Parse(string content, TonParseOptions? options = null);

        /// <summary>
        /// Parses TON content from a file
        /// </summary>
        /// <param name="filePath">Path to the TON file</param>
        /// <param name="options">Optional parsing options</param>
        /// <returns>The parsed TON document</returns>
        TonDocument ParseFile(string filePath, TonParseOptions? options = null);

        /// <summary>
        /// Asynchronously parses TON content from a file
        /// </summary>
        /// <param name="filePath">Path to the TON file</param>
        /// <param name="options">Optional parsing options</param>
        /// <returns>The parsed TON document</returns>
        Task<TonDocument> ParseFileAsync(string filePath, TonParseOptions? options = null);

        /// <summary>
        /// Parses TON content from a stream
        /// </summary>
        /// <param name="stream">The stream containing TON content</param>
        /// <param name="options">Optional parsing options</param>
        /// <returns>The parsed TON document</returns>
        TonDocument ParseStream(Stream stream, TonParseOptions? options = null);

        /// <summary>
        /// Asynchronously parses TON content from a stream
        /// </summary>
        /// <param name="stream">The stream containing TON content</param>
        /// <param name="options">Optional parsing options</param>
        /// <returns>The parsed TON document</returns>
        Task<TonDocument> ParseStreamAsync(Stream stream, TonParseOptions? options = null);
    }
}