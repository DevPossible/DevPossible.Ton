namespace TONfile.Lexer
{
    /// <summary>
    /// Represents a token in the TON syntax
    /// </summary>
    public class TonToken
    {
        /// <summary>
        /// The type of the token
        /// </summary>
        public TonTokenType Type { get; set; }

        /// <summary>
        /// The text value of the token
        /// </summary>
        public string Value { get; set; }

        /// <summary>
        /// The line number where the token appears
        /// </summary>
        public int Line { get; set; }

        /// <summary>
        /// The column number where the token starts
        /// </summary>
        public int Column { get; set; }

        /// <summary>
        /// Creates a new token
        /// </summary>
        public TonToken(TonTokenType type, string value, int line, int column)
        {
            Type = type;
            Value = value;
            Line = line;
            Column = column;
        }

        /// <summary>
        /// Gets a string representation of the token
        /// </summary>
        public override string ToString()
        {
            return $"{Type}:{Value} at {Line}:{Column}";
        }
    }

    /// <summary>
    /// Types of tokens in TON syntax
    /// </summary>
    public enum TonTokenType
    {
        // Structural tokens
        LeftBrace,          // {
        RightBrace,         // }
        LeftParen,          // (
        RightParen,         // )
        LeftBracket,        // [
        RightBracket,       // ]

        // Operators
        Equals,             // =
        Comma,              // ,
        AtSign,             // @
        Pipe,               // |
        ForwardSlash,       // /

        // Prefixes
        HeaderPrefix,       // #@
        SchemaPrefix,       // #!
        StringHint,         // $
        NumberHint,         // %
        GuidHint,           // &
        ArrayHint,          // ^

        // Literals
        String,             // Quoted strings
        Number,             // Numeric values (decimal, hex, binary)
        Boolean,            // true, false
        Null,               // null
        Undefined,          // undefined
        Guid,               // GUID values
        Enum,               // |value| or |value1|value2|

        // Identifiers
        Identifier,         // Property names, class names, etc.
        QuotedIdentifier,   // Quoted property names

        // Keywords
        EnumKeyword,        // enum
        EnumSetKeyword,     // enumSet

        // Comments (usually skipped by parser)
        SingleLineComment,  // // comment
        MultiLineComment,   // /* comment */

        // Special
        EndOfFile,
        Unknown
    }
}