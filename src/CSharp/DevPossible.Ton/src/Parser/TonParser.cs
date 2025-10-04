using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TONfile.Lexer;

namespace TONfile
{
    /// <summary>
    /// Parser for TON documents
    /// </summary>
    public class TonParser : ITonParser
    {
        /// <summary>
        /// Parses TON content from a string
        /// </summary>
        public TonDocument Parse(string content, TonParseOptions? options = null)
        {
            if (string.IsNullOrWhiteSpace(content))
                throw new ArgumentException("Content cannot be empty", nameof(content));

            options ??= TonParseOptions.Default;
            var lexer = new TonLexer(content);
            var tokens = lexer.GetAllTokens();
            var parser = new TonDocumentParser(tokens, options);
            return parser.ParseDocument();
        }

        /// <summary>
        /// Parses TON content from a file
        /// </summary>
        public TonDocument ParseFile(string filePath, TonParseOptions? options = null)
        {
            if (!File.Exists(filePath))
                throw new FileNotFoundException($"File not found: {filePath}", filePath);

            var content = File.ReadAllText(filePath, Encoding.UTF8);
            var document = Parse(content, options);
            document.Source = filePath;
            return document;
        }

        /// <summary>
        /// Asynchronously parses TON content from a file
        /// </summary>
        public async Task<TonDocument> ParseFileAsync(string filePath, TonParseOptions? options = null)
        {
            if (!File.Exists(filePath))
                throw new FileNotFoundException($"File not found: {filePath}", filePath);

            var content = await File.ReadAllTextAsync(filePath, Encoding.UTF8);
            var document = Parse(content, options);
            document.Source = filePath;
            return document;
        }

        /// <summary>
        /// Parses TON content from a stream
        /// </summary>
        public TonDocument ParseStream(Stream stream, TonParseOptions? options = null)
        {
            using var reader = new StreamReader(stream, Encoding.UTF8);
            var content = reader.ReadToEnd();
            return Parse(content, options);
        }

        /// <summary>
        /// Asynchronously parses TON content from a stream
        /// </summary>
        public async Task<TonDocument> ParseStreamAsync(Stream stream, TonParseOptions? options = null)
        {
            using var reader = new StreamReader(stream, Encoding.UTF8);
            var content = await reader.ReadToEndAsync();
            return Parse(content, options);
        }
    }

    /// <summary>
    /// Internal document parser
    /// </summary>
    internal class TonDocumentParser
    {
        private readonly List<TonToken> _tokens;
        private readonly TonParseOptions _options;
        private int _position;
        private int _depth;

        public TonDocumentParser(List<TonToken> tokens, TonParseOptions options)
        {
            _tokens = tokens;
            _options = options;
            _position = 0;
            _depth = 0;
        }

        public TonDocument ParseDocument()
        {
            var document = new TonDocument();

            // Parse header if present
            if (CurrentToken?.Type == TonTokenType.HeaderPrefix)
            {
                document.Header = ParseHeader();
            }

            // Parse root object
            if (CurrentToken?.Type != TonTokenType.LeftBrace)
            {
                throw new TonParseException("Expected '{' at start of document", CurrentToken);
            }

            document.RootObject = ParseObject();

            // Parse schema definitions if present
            if (CurrentToken?.Type == TonTokenType.SchemaPrefix)
            {
                document.Schemas = ParseSchemas();
            }

            return document;
        }

        private TonHeader ParseHeader()
        {
            var header = new TonHeader();
            Consume(TonTokenType.HeaderPrefix);

            while (CurrentToken != null && CurrentToken.Type != TonTokenType.LeftBrace)
            {
                if (CurrentToken.Type == TonTokenType.AtSign)
                {
                    Advance();
                    if (CurrentToken?.Type != TonTokenType.Identifier)
                        throw new TonParseException("Expected identifier after @", CurrentToken);

                    var attrName = CurrentToken.Value;
                    Advance();

                    if (CurrentToken?.Type == TonTokenType.Equals)
                    {
                        Advance();
                        var value = ParseValue();

                        // Check with @ prefix
                        if (attrName == "schemaFile")
                            header.SchemaFile = value?.ToString();
                        else
                            header.Attributes["@" + attrName] = value;
                    }
                }
                else if (CurrentToken.Type == TonTokenType.Identifier)
                {
                    var attrName = CurrentToken.Value;
                    Advance();

                    if (CurrentToken?.Type == TonTokenType.Equals)
                    {
                        Advance();
                        var value = ParseValue();

                        // Check without @ prefix
                        if (attrName == "tonVersion")
                            header.TonVersion = value?.ToString();
                        else
                            header.Attributes[attrName] = value;
                    }
                }
                else
                {
                    Advance();
                }

                if (CurrentToken?.Type == TonTokenType.Comma)
                    Advance();
            }

            return header;
        }

        private TonObject ParseObject()
        {
            _depth++;
            if (_depth > _options.MaxNestingDepth)
                throw new TonParseException($"Maximum nesting depth ({_options.MaxNestingDepth}) exceeded", CurrentToken);

            var obj = new TonObject();
            Consume(TonTokenType.LeftBrace);

            // Parse class type if present
            if (CurrentToken?.Type == TonTokenType.LeftParen)
            {
                Advance();
                if (CurrentToken?.Type != TonTokenType.Identifier)
                    throw new TonParseException("Expected class name", CurrentToken);

                obj.ClassName = CurrentToken.Value;
                Advance();
                Consume(TonTokenType.RightParen);
            }

            bool hasSeenChildObject = false;

            // Parse properties and child objects
            while (CurrentToken != null && CurrentToken.Type != TonTokenType.RightBrace)
            {
                if (CurrentToken.Type == TonTokenType.LeftBrace)
                {
                    // Child object
                    hasSeenChildObject = true;
                    obj.AddChild(ParseObject());
                }
                else if (CurrentToken.Type == TonTokenType.AtSign || CurrentToken.Type == TonTokenType.Identifier ||
                         CurrentToken.Type == TonTokenType.String || CurrentToken.Type == TonTokenType.QuotedIdentifier ||
                         CurrentToken.Type == TonTokenType.Number)
                {
                    // Property
                    if (hasSeenChildObject && _options.EnforcePropertyOrdering)
                        throw new TonParseException("Properties must appear before child objects", CurrentToken);

                    ParseProperty(obj);
                }
                else
                {
                    throw new TonParseException($"Unexpected token: {CurrentToken.Type}", CurrentToken);
                }

                if (CurrentToken?.Type == TonTokenType.Comma)
                    Advance();
            }

            Consume(TonTokenType.RightBrace);
            _depth--;
            return obj;
        }

        private void ParseProperty(TonObject obj)
        {
            string propertyName;

            // Handle @ prefix
            bool hasAtPrefix = false;
            if (CurrentToken?.Type == TonTokenType.AtSign)
            {
                hasAtPrefix = true;
                Advance();
            }

            // Get property name
            if (CurrentToken?.Type == TonTokenType.String || CurrentToken?.Type == TonTokenType.QuotedIdentifier)
            {
                propertyName = CurrentToken.Value;
                Advance();
            }
            else if (CurrentToken?.Type == TonTokenType.Identifier)
            {
                propertyName = CurrentToken.Value;
                Advance();
            }
            else if (CurrentToken?.Type == TonTokenType.Number)
            {
                // Allow numbers as property names
                propertyName = CurrentToken.Value;
                Advance();
            }
            else
            {
                throw new TonParseException("Expected property name", CurrentToken);
            }

            if (hasAtPrefix)
                propertyName = "@" + propertyName;

            // Expect equals
            Consume(TonTokenType.Equals);

            // Parse value
            var value = ParseValue();
            var tonValue = TonValue.From(value);

            obj.SetProperty(propertyName, tonValue);
        }

        private object? ParseValue()
        {
            char? typeHint = null;

            // Check for type hints
            if (CurrentToken?.Type == TonTokenType.StringHint ||
                CurrentToken?.Type == TonTokenType.NumberHint ||
                CurrentToken?.Type == TonTokenType.GuidHint ||
                CurrentToken?.Type == TonTokenType.ArrayHint)
            {
                typeHint = CurrentToken.Value[0];
                Advance();
            }

            if (CurrentToken == null)
                throw new TonParseException("Expected value", null);

            object? value = null;

            switch (CurrentToken.Type)
            {
                case TonTokenType.String:
                    value = CurrentToken.Value;
                    Advance();
                    break;

                case TonTokenType.Number:
                    var numStr = CurrentToken.Value;
                    if (numStr.Contains('.') || numStr.Contains('e') || numStr.Contains('E'))
                    {
                        if (double.TryParse(numStr, out var doubleVal))
                            value = doubleVal;
                    }
                    else if (numStr.StartsWith("0x", StringComparison.OrdinalIgnoreCase))
                    {
                        if (long.TryParse(numStr.Substring(2), System.Globalization.NumberStyles.HexNumber, null, out var hexVal))
                            value = hexVal;
                    }
                    else if (numStr.StartsWith("0b", StringComparison.OrdinalIgnoreCase))
                    {
                        try
                        {
                            value = Convert.ToInt64(numStr.Substring(2), 2);
                        }
                        catch
                        {
                            value = 0;
                        }
                    }
                    else
                    {
                        if (long.TryParse(numStr, out var intVal))
                            value = intVal;
                    }
                    Advance();
                    break;

                case TonTokenType.Boolean:
                    value = bool.Parse(CurrentToken.Value);
                    Advance();
                    break;

                case TonTokenType.Null:
                    value = null;
                    Advance();
                    break;

                case TonTokenType.Undefined:
                    value = TonValue.UndefinedMarker;
                    Advance();
                    break;

                case TonTokenType.Guid:
                    value = new GuidValue(CurrentToken.Value);
                    Advance();
                    break;

                case TonTokenType.Enum:
                    var enumText = CurrentToken.Value;
                    // Check for empty enum ||
                    if (enumText == "||")
                    {
                        value = new TonEnumSet();
                    }
                    else if (enumText.Count(c => c == '|') > 2)
                    {
                        value = TonEnumSet.Parse(enumText);
                    }
                    else
                    {
                        value = TonEnum.Parse(enumText);
                    }
                    Advance();
                    break;

                case TonTokenType.LeftBracket:
                    // Parse array
                    value = ParseArray();
                    break;

                case TonTokenType.LeftBrace:
                    // Parse nested object as value
                    value = ParseObject();
                    break;

                case TonTokenType.Identifier:
                    // Could be a keyword or unquoted value
                    value = CurrentToken.Value;
                    Advance();
                    break;

                default:
                    throw new TonParseException($"Unexpected value token: {CurrentToken.Type}", CurrentToken);
            }

            return value;
        }

        private List<TonValue> ParseArray()
        {
            var array = new List<TonValue>();
            Consume(TonTokenType.LeftBracket);

            // Handle empty array
            if (CurrentToken?.Type == TonTokenType.RightBracket)
            {
                Advance();
                return array;
            }

            while (CurrentToken != null && CurrentToken.Type != TonTokenType.RightBracket)
            {
                var element = ParseValue();
                array.Add(TonValue.From(element));

                if (CurrentToken?.Type == TonTokenType.Comma)
                {
                    Advance();

                    // Check for trailing comma
                    if (CurrentToken?.Type == TonTokenType.RightBracket)
                    {
                        throw new TonParseException("Trailing comma not allowed in arrays", CurrentToken);
                    }
                }
                else if (CurrentToken?.Type != TonTokenType.RightBracket)
                {
                    throw new TonParseException("Expected ',' or ']' in array", CurrentToken);
                }
            }

            Consume(TonTokenType.RightBracket);
            return array;
        }

        private TonSchemaCollection ParseSchemas()
        {
            var schemas = new TonSchemaCollection();

            while (CurrentToken?.Type == TonTokenType.SchemaPrefix)
            {
                Advance();

                // Parse enum/enumSet definitions
                if (CurrentToken?.Type == TonTokenType.EnumKeyword || CurrentToken?.Type == TonTokenType.EnumSetKeyword)
                {
                    var isEnumSet = CurrentToken.Type == TonTokenType.EnumSetKeyword;
                    Advance();

                    Consume(TonTokenType.LeftParen);
                    if (CurrentToken?.Type != TonTokenType.Identifier)
                        throw new TonParseException("Expected enum name", CurrentToken);

                    var enumName = CurrentToken.Value;
                    Advance();
                    Consume(TonTokenType.RightParen);

                    var enumDef = new TonEnumDefinition(enumName, isEnumSet);

                    Consume(TonTokenType.LeftBracket);
                    while (CurrentToken != null && CurrentToken.Type != TonTokenType.RightBracket)
                    {
                        if (CurrentToken.Type == TonTokenType.Identifier)
                        {
                            enumDef.Values.Add(CurrentToken.Value);
                            Advance();
                        }

                        if (CurrentToken?.Type == TonTokenType.Comma)
                            Advance();
                    }
                    Consume(TonTokenType.RightBracket);

                    schemas.AddEnum(enumDef);
                }
                // Parse object schema
                else if (CurrentToken?.Type == TonTokenType.LeftBrace)
                {
                    var schema = ParseSchemaDefinition();
                    schemas.AddSchema(schema);
                }
            }

            return schemas;
        }

        private TonSchemaDefinition ParseSchemaDefinition()
        {
            Consume(TonTokenType.LeftBrace);
            Consume(TonTokenType.LeftParen);

            if (CurrentToken?.Type != TonTokenType.Identifier)
                throw new TonParseException("Expected class name in schema", CurrentToken);

            var className = CurrentToken.Value;
            var schema = new TonSchemaDefinition(className);
            Advance();
            Consume(TonTokenType.RightParen);

            // Parse property rules
            while (CurrentToken != null && CurrentToken.Type != TonTokenType.RightBrace)
            {
                if (CurrentToken.Type == TonTokenType.ForwardSlash)
                {
                    var propSchema = ParsePropertySchema();
                    schema.AddProperty(propSchema.Path, propSchema);
                }
                else if (CurrentToken?.Type != TonTokenType.Comma)
                {
                    // Skip unexpected tokens
                    Advance();
                }

                if (CurrentToken?.Type == TonTokenType.Comma)
                    Advance();
            }

            Consume(TonTokenType.RightBrace);
            return schema;
        }

        private TonPropertySchema ParsePropertySchema()
        {
            Consume(TonTokenType.ForwardSlash);

            // Parse the property path (can be deep like /details/bio or numeric like /123)
            var pathBuilder = new System.Text.StringBuilder("/");

            // Parse path segments
            while (CurrentToken != null && CurrentToken.Type != TonTokenType.Equals)
            {
                if (CurrentToken.Type == TonTokenType.ForwardSlash)
                {
                    pathBuilder.Append('/');
                    Advance();
                }
                else if (CurrentToken.Type == TonTokenType.Identifier ||
                         CurrentToken.Type == TonTokenType.Number)
                {
                    pathBuilder.Append(CurrentToken.Value);
                    Advance();
                }
                else
                {
                    break;
                }
            }

            var path = pathBuilder.ToString();

            // Consume the = sign
            Consume(TonTokenType.Equals);

            // Parse the type (string, int, float, array:baseType, enum:name, etc.)
            string type;
            if (CurrentToken?.Type == TonTokenType.Identifier ||
                CurrentToken?.Type == TonTokenType.EnumKeyword ||
                CurrentToken?.Type == TonTokenType.EnumSetKeyword)
            {
                type = CurrentToken.Value;
                Advance();

                // Check for array:baseType or enum:name syntax
                // The identifier might already contain the colon (e.g., "enum:userStatus")
                // or it might be tokenized separately
                if (!type.Contains(":") && (type == "array" || type == "enum" || type == "enumSet"))
                {
                    // Look for a colon followed by another identifier
                    // The colon is tokenized as Unknown token with value ":"
                    if (CurrentToken?.Type == TonTokenType.Unknown && CurrentToken?.Value == ":")
                    {
                        Advance(); // Skip the colon

                        // Now expect an identifier for the subtype
                        if (CurrentToken?.Type == TonTokenType.Identifier)
                        {
                            type = type + ":" + CurrentToken.Value;
                            Advance();
                        }
                    }
                }
            }
            else
            {
                throw new TonParseException("Expected property type", CurrentToken);
            }

            var propSchema = new TonPropertySchema(path, type);

            // Parse validation rules if present
            if (CurrentToken?.Type == TonTokenType.LeftParen)
            {
                Advance();
                ParseValidationRules(propSchema);
                Consume(TonTokenType.RightParen);
            }

            return propSchema;
        }

        private void ParseValidationRules(TonPropertySchema propSchema)
        {
            while (CurrentToken != null && CurrentToken.Type != TonTokenType.RightParen)
            {
                if (CurrentToken.Type == TonTokenType.Identifier)
                {
                    var ruleName = CurrentToken.Value;
                    Advance();

                    var rule = ParseValidationRule(ruleName);
                    if (rule != null)
                    {
                        propSchema.AddValidation(rule);
                    }
                }

                if (CurrentToken?.Type == TonTokenType.Comma)
                    Advance();
            }
        }

        private TonValidationRule? ParseValidationRule(string ruleName)
        {
            var parameters = new System.Collections.Generic.List<object?>();

            // Parse parameters if present
            if (CurrentToken?.Type == TonTokenType.LeftParen)
            {
                Advance();
                while (CurrentToken != null && CurrentToken.Type != TonTokenType.RightParen)
                {
                    if (CurrentToken.Type == TonTokenType.String)
                    {
                        parameters.Add(CurrentToken.Value);
                        Advance();
                    }
                    else if (CurrentToken.Type == TonTokenType.Number)
                    {
                        // Try to parse as integer first, then float
                        if (long.TryParse(CurrentToken.Value, out var intVal))
                        {
                            parameters.Add(intVal);
                        }
                        else if (double.TryParse(CurrentToken.Value, out var floatVal))
                        {
                            parameters.Add(floatVal);
                        }
                        else
                        {
                            parameters.Add(CurrentToken.Value);
                        }
                        Advance();
                    }
                    else if (CurrentToken.Type == TonTokenType.Boolean)
                    {
                        parameters.Add(bool.Parse(CurrentToken.Value));
                        Advance();
                    }
                    else if (CurrentToken.Type == TonTokenType.LeftBracket)
                    {
                        // Array parameter for default values
                        // For now, skip array literals in schema validation rules
                        var depth = 1;
                        Advance();
                        while (CurrentToken != null && depth > 0)
                        {
                            if (CurrentToken.Type == TonTokenType.LeftBracket)
                                depth++;
                            else if (CurrentToken.Type == TonTokenType.RightBracket)
                                depth--;
                            Advance();
                        }
                        parameters.Add(new List<object>());
                    }
                    else
                    {
                        Advance();
                    }

                    if (CurrentToken?.Type == TonTokenType.Comma)
                        Advance();
                }
                Consume(TonTokenType.RightParen);
            }

            // Map rule name to ValidationRuleType
            var ruleType = MapToValidationRuleType(ruleName);
            if (ruleType.HasValue)
            {
                return new TonValidationRule(ruleType.Value, parameters.ToArray());
            }

            return null;
        }

        private ValidationRuleType? MapToValidationRuleType(string ruleName)
        {
            return ruleName.ToLowerInvariant() switch
            {
                "required" => ValidationRuleType.Required,
                "notnull" => ValidationRuleType.NotNull,
                "default" => ValidationRuleType.Default,
                "defaultwhennull" => ValidationRuleType.DefaultWhenNull,
                "defaultwhenempty" => ValidationRuleType.DefaultWhenEmpty,
                "defaultwheninvalid" => ValidationRuleType.DefaultWhenInvalid,
                "minlength" => ValidationRuleType.MinLength,
                "maxlength" => ValidationRuleType.MaxLength,
                "length" => ValidationRuleType.Length,
                "pattern" => ValidationRuleType.Pattern,
                "format" => ValidationRuleType.Format,
                "enum" => ValidationRuleType.Enum,
                "min" => ValidationRuleType.Min,
                "max" => ValidationRuleType.Max,
                "range" => ValidationRuleType.Range,
                "positive" => ValidationRuleType.Positive,
                "negative" => ValidationRuleType.Negative,
                "nonnegative" => ValidationRuleType.NonNegative,
                "nonpositive" => ValidationRuleType.NonPositive,
                "multipleof" => ValidationRuleType.MultipleOf,
                "bits" => ValidationRuleType.Bits,
                "unsigned" => ValidationRuleType.Unsigned,
                "signed" => ValidationRuleType.Signed,
                "guidformat" => ValidationRuleType.GuidFormat,
                "version" => ValidationRuleType.Version,
                "after" => ValidationRuleType.After,
                "before" => ValidationRuleType.Before,
                "between" => ValidationRuleType.Between,
                "future" => ValidationRuleType.Future,
                "past" => ValidationRuleType.Past,
                "allowindex" => ValidationRuleType.AllowIndex,
                "strictindex" => ValidationRuleType.StrictIndex,
                "mincount" => ValidationRuleType.MinCount,
                "maxcount" => ValidationRuleType.MaxCount,
                "count" => ValidationRuleType.Count,
                "nonempty" => ValidationRuleType.NonEmpty,
                "unique" => ValidationRuleType.Unique,
                "sorted" => ValidationRuleType.Sorted,
                "allowduplicates" => ValidationRuleType.AllowDuplicates,
                _ => null
            };
        }

        private TonToken? CurrentToken => _position < _tokens.Count ? _tokens[_position] : null;

        private void Advance()
        {
            if (_position < _tokens.Count)
                _position++;
        }

        private void Consume(TonTokenType expectedType)
        {
            if (CurrentToken?.Type != expectedType)
                throw new TonParseException($"Expected {expectedType} but got {CurrentToken?.Type}", CurrentToken);
            Advance();
        }

        /// <summary>
        /// Internal class to represent GUID values
        /// </summary>
        internal class GuidValue
        {
            public string Value { get; }
            public GuidValue(string value) => Value = value;
        }
    }

    /// <summary>
    /// Exception thrown during parsing
    /// </summary>
    public class TonParseException : Exception
    {
        public TonToken? Token { get; }
        public int? Line => Token?.Line;
        public int? Column => Token?.Column;

        public TonParseException(string message, TonToken? token)
            : base(FormatMessage(message, token))
        {
            Token = token;
        }

        private static string FormatMessage(string message, TonToken? token)
        {
            if (token != null)
                return $"{message} at line {token.Line}, column {token.Column}";
            return message;
        }
    }
}