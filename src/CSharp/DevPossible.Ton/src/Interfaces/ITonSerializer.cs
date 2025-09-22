using System.IO;
using System.Threading.Tasks;

namespace TONfile
{
    /// <summary>
    /// Interface for serializing objects to TON format
    /// </summary>
    public interface ITonSerializer
    {
        /// <summary>
        /// Serializes an object to TON format string
        /// </summary>
        /// <param name="obj">The object to serialize</param>
        /// <param name="options">Optional serialization options</param>
        /// <returns>The TON formatted string</returns>
        string Serialize(object obj, TonSerializeOptions? options = null);

        /// <summary>
        /// Serializes a TonDocument to TON format string
        /// </summary>
        /// <param name="document">The document to serialize</param>
        /// <param name="options">Optional serialization options</param>
        /// <returns>The TON formatted string</returns>
        string SerializeDocument(TonDocument document, TonSerializeOptions? options = null);

        /// <summary>
        /// Serializes an object to a TON file
        /// </summary>
        /// <param name="obj">The object to serialize</param>
        /// <param name="filePath">Path where the TON file will be saved</param>
        /// <param name="options">Optional serialization options</param>
        void SerializeToFile(object obj, string filePath, TonSerializeOptions? options = null);

        /// <summary>
        /// Asynchronously serializes an object to a TON file
        /// </summary>
        /// <param name="obj">The object to serialize</param>
        /// <param name="filePath">Path where the TON file will be saved</param>
        /// <param name="options">Optional serialization options</param>
        Task SerializeToFileAsync(object obj, string filePath, TonSerializeOptions? options = null);

        /// <summary>
        /// Serializes an object to a stream
        /// </summary>
        /// <param name="obj">The object to serialize</param>
        /// <param name="stream">The stream to write to</param>
        /// <param name="options">Optional serialization options</param>
        void SerializeToStream(object obj, Stream stream, TonSerializeOptions? options = null);

        /// <summary>
        /// Asynchronously serializes an object to a stream
        /// </summary>
        /// <param name="obj">The object to serialize</param>
        /// <param name="stream">The stream to write to</param>
        /// <param name="options">Optional serialization options</param>
        Task SerializeToStreamAsync(object obj, Stream stream, TonSerializeOptions? options = null);
    }
}