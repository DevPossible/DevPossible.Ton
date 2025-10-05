namespace DevPossible.Ton
{
    /// <summary>
    /// Options for serializing objects to TON format
    /// </summary>
    public class TonSerializeOptions
    {
        /// <summary>
        /// Whether to include the document header
        /// </summary>
        public bool IncludeHeader { get; set; } = false;

        /// <summary>
        /// TON version to include in the header
        /// </summary>
        public string? TonVersion { get; set; } = "1";

        /// <summary>
        /// Whether to include embedded schema definitions
        /// </summary>
        public bool IncludeSchema { get; set; } = false;

        /// <summary>
        /// External schema file path to reference in the header
        /// </summary>
        public string? SchemaFile { get; set; }

        /// <summary>
        /// Indentation string for formatting (null for compact output)
        /// </summary>
        public string? Indentation { get; set; } = "    ";

        /// <summary>
        /// Whether to use @ prefix for properties
        /// </summary>
        public bool UseAtPrefix { get; set; } = false;

        /// <summary>
        /// Whether to include type hints for optimization
        /// </summary>
        public bool IncludeTypeHints { get; set; } = false;

        /// <summary>
        /// Whether to sort properties alphabetically
        /// </summary>
        public bool SortProperties { get; set; } = false;

        /// <summary>
        /// Quote character to use for strings (" or ')
        /// </summary>
        public char QuoteChar { get; set; } = '\'';

        /// <summary>
        /// Whether to use lowercase for hexadecimal numbers
        /// </summary>
        public bool LowercaseHex { get; set; } = true;

        /// <summary>
        /// Whether to use lowercase for GUIDs
        /// </summary>
        public bool LowercaseGuids { get; set; } = true;

        /// <summary>
        /// Whether to use enum names instead of indices where possible
        /// </summary>
        public bool PreferEnumNames { get; set; } = true;

        /// <summary>
        /// Whether to omit null values
        /// </summary>
        public bool OmitNullValues { get; set; } = false;

        /// <summary>
        /// Whether to omit undefined values
        /// </summary>
        public bool OmitUndefinedValues { get; set; } = true;

        /// <summary>
        /// Whether to omit empty collections
        /// </summary>
        public bool OmitEmptyCollections { get; set; } = false;

        /// <summary>
        /// Maximum line length for wrapping (0 for no limit)
        /// </summary>
        public int MaxLineLength { get; set; } = 0;

        /// <summary>
        /// Whether to use multi-line string literals for strings containing newlines
        /// </summary>
        public bool UseMultiLineStrings { get; set; } = true;

        /// <summary>
        /// Minimum number of lines to trigger multi-line string formatting
        /// </summary>
        public int MultiLineStringThreshold { get; set; } = 2;

        /// <summary>
        /// Creates default serialization options
        /// </summary>
        public static TonSerializeOptions Default => new TonSerializeOptions();

        /// <summary>
        /// Creates compact serialization options (no formatting)
        /// </summary>
        public static TonSerializeOptions Compact => new TonSerializeOptions
        {
            Indentation = null,
            IncludeHeader = false,
            IncludeSchema = false,
            OmitNullValues = true,
            OmitUndefinedValues = true,
            OmitEmptyCollections = true,
            UseMultiLineStrings = false
        };

        /// <summary>
        /// Creates pretty-print serialization options
        /// </summary>
        public static TonSerializeOptions Pretty => new TonSerializeOptions
        {
            Indentation = "    ",
            SortProperties = true,
            IncludeHeader = true,
            PreferEnumNames = true,
            IncludeTypeHints = true
        };

        /// <summary>
        /// Creates optimized serialization options with hints
        /// </summary>
        public static TonSerializeOptions Optimized => new TonSerializeOptions
        {
            IncludeTypeHints = true,
            SortProperties = true
        };
    }
}