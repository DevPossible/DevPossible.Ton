namespace DevPossible.Ton
{
    /// <summary>
    /// Options for parsing TON documents
    /// </summary>
    public class TonParseOptions
    {
        /// <summary>
        /// Whether to validate against embedded or referenced schemas during parsing
        /// </summary>
        public bool ValidateSchema { get; set; } = true;

        /// <summary>
        /// Whether to load external schema files referenced in the document header
        /// </summary>
        public bool LoadExternalSchemas { get; set; } = true;

        /// <summary>
        /// Whether to apply default values from schema during parsing
        /// </summary>
        public bool ApplyDefaults { get; set; } = true;

        /// <summary>
        /// Whether to preserve comments in the parsed document
        /// </summary>
        public bool PreserveComments { get; set; } = false;

        /// <summary>
        /// Whether to strict mode for parsing (fail on any syntax errors)
        /// </summary>
        public bool StrictMode { get; set; } = true;

        /// <summary>
        /// Whether to allow unknown properties not defined in the schema
        /// </summary>
        public bool AllowUnknownProperties { get; set; } = true;

        /// <summary>
        /// Whether to enforce property ordering (properties before child objects)
        /// </summary>
        public bool EnforcePropertyOrdering { get; set; } = true;

        /// <summary>
        /// Whether to validate enum values against their definitions
        /// </summary>
        public bool ValidateEnums { get; set; } = true;

        /// <summary>
        /// Maximum depth for nested objects (to prevent stack overflow)
        /// </summary>
        public int MaxNestingDepth { get; set; } = 100;

        /// <summary>
        /// Creates default parsing options
        /// </summary>
        public static TonParseOptions Default => new TonParseOptions();

        /// <summary>
        /// Creates lenient parsing options that are more forgiving
        /// </summary>
        public static TonParseOptions Lenient => new TonParseOptions
        {
            ValidateSchema = false,
            StrictMode = false,
            EnforcePropertyOrdering = false,
            ValidateEnums = false,
            AllowUnknownProperties = true
        };

        /// <summary>
        /// Creates strict parsing options that enforce all rules
        /// </summary>
        public static TonParseOptions Strict => new TonParseOptions
        {
            ValidateSchema = true,
            StrictMode = true,
            EnforcePropertyOrdering = true,
            ValidateEnums = true,
            AllowUnknownProperties = false,
            ApplyDefaults = true
        };
    }
}