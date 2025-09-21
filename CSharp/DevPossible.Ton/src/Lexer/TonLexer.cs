using System;
using System.Collections.Generic;
using System.Text;
using System.Text.RegularExpressions;

namespace TONfile.Lexer
{
    /// <summary>
    /// Lexer for tokenizing TON syntax
    /// </summary>
    public class TonLexer
    {
        private readonly string _input;
        private int _position;
        private int _line;
        private int _column;

        private static readonly Regex GuidPattern = new Regex(
            @"^(\{[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\}|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})(?![0-9a-fA-F-])",
            RegexOptions.Compiled);

        private static readonly Regex IdentifierPattern = new Regex(
            @"^[a-zA-Z_][a-zA-Z0-9_]*",
            RegexOptions.Compiled);

        /// <summary>
        /// Creates a new lexer for the given input
        /// </summary>
        public TonLexer(string input)
        {
            _input = input ?? throw new ArgumentNullException(nameof(input));
            _position = 0;
            _line = 1;
            _column = 1;
        }

        /// <summary>
        /// Gets all tokens from the input
        /// </summary>
        public List<TonToken> GetAllTokens()
        {
            var tokens = new List<TonToken>();
            TonToken? token;

            while ((token = GetNextToken()) != null && token.Type != TonTokenType.EndOfFile)
            {
                tokens.Add(token);
            }

            return tokens;
        }

        /// <summary>
        /// Gets the next token from the input
        /// </summary>
        public TonToken? GetNextToken()
        {
            SkipWhitespaceAndComments();

            if (_position >= _input.Length)
                return new TonToken(TonTokenType.EndOfFile, "", _line, _column);

            var startLine = _line;
            var startColumn = _column;

            // Check for two-character tokens first
            if (_position + 1 < _input.Length)
            {
                var twoChar = _input.Substring(_position, 2);
                switch (twoChar)
                {
                    case "#@":
                        _position += 2;
                        _column += 2;
                        return new TonToken(TonTokenType.HeaderPrefix, twoChar, startLine, startColumn);

                    case "#!":
                        _position += 2;
                        _column += 2;
                        return new TonToken(TonTokenType.SchemaPrefix, twoChar, startLine, startColumn);
                }
            }

            var ch = _input[_position];

            // Check for GUID with braces before single character tokens
            if (ch == '{' && _position < _input.Length)
            {
                var guidMatch = GuidPattern.Match(_input.Substring(_position));
                if (guidMatch.Success && guidMatch.Value.StartsWith('{'))
                {
                    var guidValue = guidMatch.Value;
                    _position += guidValue.Length;
                    _column += guidValue.Length;
                    return new TonToken(TonTokenType.Guid, guidValue, startLine, startColumn);
                }
            }

            // Single character tokens
            switch (ch)
            {
                case '{':
                    _position++;
                    _column++;
                    return new TonToken(TonTokenType.LeftBrace, "{", startLine, startColumn);

                case '}':
                    _position++;
                    _column++;
                    return new TonToken(TonTokenType.RightBrace, "}", startLine, startColumn);

                case '(':
                    _position++;
                    _column++;
                    return new TonToken(TonTokenType.LeftParen, "(", startLine, startColumn);

                case ')':
                    _position++;
                    _column++;
                    return new TonToken(TonTokenType.RightParen, ")", startLine, startColumn);

                case '[':
                    _position++;
                    _column++;
                    return new TonToken(TonTokenType.LeftBracket, "[", startLine, startColumn);

                case ']':
                    _position++;
                    _column++;
                    return new TonToken(TonTokenType.RightBracket, "]", startLine, startColumn);

                case '=':
                    _position++;
                    _column++;
                    return new TonToken(TonTokenType.Equals, "=", startLine, startColumn);

                case ',':
                    _position++;
                    _column++;
                    return new TonToken(TonTokenType.Comma, ",", startLine, startColumn);

                case '@':
                    _position++;
                    _column++;
                    return new TonToken(TonTokenType.AtSign, "@", startLine, startColumn);

                case '/':
                    _position++;
                    _column++;
                    return new TonToken(TonTokenType.ForwardSlash, "/", startLine, startColumn);

                case '$':
                    _position++;
                    _column++;
                    return new TonToken(TonTokenType.StringHint, "$", startLine, startColumn);

                case '%':
                    _position++;
                    _column++;
                    return new TonToken(TonTokenType.NumberHint, "%", startLine, startColumn);

                case '&':
                    _position++;
                    _column++;
                    return new TonToken(TonTokenType.GuidHint, "&", startLine, startColumn);

                case '^':
                    _position++;
                    _column++;
                    return new TonToken(TonTokenType.ArrayHint, "^", startLine, startColumn);

                case '|':
                    // Parse enum value(s)
                    return ParseEnum(startLine, startColumn);

                case '"':
                case '\'':
                    // Check for triple quotes (multi-line string)
                    if (IsTripleQuote(ch))
                    {
                        return ParseMultiLineString(ch, startLine, startColumn);
                    }
                    // Parse regular string
                    return ParseString(ch, startLine, startColumn);
            }

            // Check for GUID first (before numbers, since GUIDs can start with digits)
            // But skip if we're at a left brace (handled separately for braced GUIDs)
            if (_position < _input.Length && ch != '{')
            {
                var guidMatch = GuidPattern.Match(_input.Substring(_position));
                if (guidMatch.Success)
                {
                    var guidValue = guidMatch.Value;
                    _position += guidValue.Length;
                    _column += guidValue.Length;
                    return new TonToken(TonTokenType.Guid, guidValue, startLine, startColumn);
                }
            }

            // Check for numbers - but only if not followed by a letter (to allow identifiers like 1property)
            if (char.IsDigit(ch) || (ch == '-' && _position + 1 < _input.Length && char.IsDigit(_input[_position + 1])))
            {
                // Look ahead to see if this is actually an identifier starting with a digit
                var isIdentifier = false;
                var lookahead = _position;

                // Check for hex/binary prefixes which are definitely numbers
                if (ch == '0' && lookahead + 1 < _input.Length)
                {
                    var nextChar = char.ToLower(_input[lookahead + 1]);
                    if (nextChar == 'x' || nextChar == 'b')
                    {
                        // This is definitely a hex or binary number, not an identifier
                        return ParseNumber(startLine, startColumn);
                    }
                }

                // Skip past initial digits
                while (lookahead < _input.Length && char.IsDigit(_input[lookahead]))
                {
                    lookahead++;
                }

                // Check what follows the digits
                if (lookahead < _input.Length)
                {
                    var nextChar = _input[lookahead];
                    // Check if followed by a letter or underscore (making it an identifier)
                    // But exclude decimal point, 'e'/'E' for scientific notation
                    if ((char.IsLetter(nextChar) || nextChar == '_') &&
                        nextChar != '.' &&
                        char.ToLower(nextChar) != 'e')
                    {
                        isIdentifier = true;
                    }
                    // Special case for scientific notation like 5E-3
                    else if (char.ToLower(nextChar) == 'e')
                    {
                        // This is scientific notation, not an identifier
                        isIdentifier = false;
                    }
                }

                if (!isIdentifier)
                {
                    return ParseNumber(startLine, startColumn);
                }
            }

            // Check for identifiers and keywords (including those starting with digits)
            if (char.IsLetterOrDigit(ch) || ch == '_')
            {
                return ParseIdentifierOrKeyword(startLine, startColumn);
            }

            // Unknown character
            _position++;
            _column++;
            return new TonToken(TonTokenType.Unknown, ch.ToString(), startLine, startColumn);
        }

        private void SkipWhitespaceAndComments()
        {
            while (_position < _input.Length)
            {
                var ch = _input[_position];

                // Skip whitespace
                if (char.IsWhiteSpace(ch))
                {
                    if (ch == '\n')
                    {
                        _line++;
                        _column = 1;
                    }
                    else
                    {
                        _column++;
                    }
                    _position++;
                    continue;
                }

                // Skip single-line comments
                if (_position + 1 < _input.Length && _input[_position] == '/' && _input[_position + 1] == '/')
                {
                    _position += 2;
                    _column += 2;

                    while (_position < _input.Length && _input[_position] != '\n')
                    {
                        _position++;
                        _column++;
                    }

                    if (_position < _input.Length && _input[_position] == '\n')
                    {
                        _position++;
                        _line++;
                        _column = 1;
                    }
                    continue;
                }

                // Skip multi-line comments
                if (_position + 1 < _input.Length && _input[_position] == '/' && _input[_position + 1] == '*')
                {
                    _position += 2;
                    _column += 2;

                    while (_position + 1 < _input.Length)
                    {
                        if (_input[_position] == '*' && _input[_position + 1] == '/')
                        {
                            _position += 2;
                            _column += 2;
                            break;
                        }

                        if (_input[_position] == '\n')
                        {
                            _line++;
                            _column = 1;
                        }
                        else
                        {
                            _column++;
                        }
                        _position++;
                    }
                    continue;
                }

                break;
            }
        }

        private TonToken ParseString(char quoteChar, int startLine, int startColumn)
        {
            var sb = new StringBuilder();
            _position++; // Skip opening quote
            _column++;

            while (_position < _input.Length && _input[_position] != quoteChar)
            {
                if (_input[_position] == '\\' && _position + 1 < _input.Length)
                {
                    // Handle escape sequences
                    _position++;
                    _column++;

                    if (_position < _input.Length)
                    {
                        var escapeChar = _input[_position];
                        switch (escapeChar)
                        {
                            case 'n': sb.Append('\n'); break;
                            case 'r': sb.Append('\r'); break;
                            case 't': sb.Append('\t'); break;
                            case '\\': sb.Append('\\'); break;
                            case '"': sb.Append('"'); break;
                            case '\'': sb.Append('\''); break;
                            case '/': sb.Append('/'); break;
                            case 'b': sb.Append('\b'); break;
                            case 'f': sb.Append('\f'); break;
                            case 'u':
                                // Unicode escape sequence
                                if (_position + 4 < _input.Length)
                                {
                                    var hex = _input.Substring(_position + 1, 4);
                                    if (int.TryParse(hex, System.Globalization.NumberStyles.HexNumber, null, out var code))
                                    {
                                        sb.Append((char)code);
                                        _position += 4;
                                        _column += 4;
                                    }
                                }
                                break;
                            default:
                                sb.Append(escapeChar);
                                break;
                        }
                    }
                }
                else
                {
                    if (_input[_position] == '\n')
                    {
                        _line++;
                        _column = 1;
                    }
                    else
                    {
                        _column++;
                    }
                    sb.Append(_input[_position]);
                }
                _position++;
            }

            if (_position < _input.Length)
            {
                _position++; // Skip closing quote
                _column++;
            }

            return new TonToken(TonTokenType.String, sb.ToString(), startLine, startColumn);
        }

        private bool IsTripleQuote(char quoteChar)
        {
            // Check if we have three consecutive quote characters
            return _position + 2 < _input.Length &&
                   _input[_position + 1] == quoteChar &&
                   _input[_position + 2] == quoteChar;
        }

        private TonToken ParseMultiLineString(char quoteChar, int startLine, int startColumn)
        {
            // Skip the three opening quotes
            _position += 3;
            _column += 3;

            var content = new StringBuilder();
            var lines = new List<string>();
            var currentLine = new StringBuilder();

            // Collect all lines of the multi-line string
            while (_position < _input.Length)
            {
                // Check for closing triple quotes
                if (_position + 2 < _input.Length &&
                    _input[_position] == quoteChar &&
                    _input[_position + 1] == quoteChar &&
                    _input[_position + 2] == quoteChar)
                {
                    // Add the current line if not empty or if we have content
                    if (currentLine.Length > 0 || lines.Count > 0)
                    {
                        lines.Add(currentLine.ToString());
                    }

                    // Skip closing quotes
                    _position += 3;
                    _column += 3;
                    break;
                }

                if (_input[_position] == '\\' && _position + 1 < _input.Length)
                {
                    // Handle escape sequences
                    _position++;
                    _column++;

                    if (_position < _input.Length)
                    {
                        var escapeChar = _input[_position];
                        switch (escapeChar)
                        {
                            case 'n': currentLine.Append('\n'); break;
                            case 'r': currentLine.Append('\r'); break;
                            case 't': currentLine.Append('\t'); break;
                            case '\\': currentLine.Append('\\'); break;
                            case '"': currentLine.Append('"'); break;
                            case '\'': currentLine.Append('\''); break;
                            case '/': currentLine.Append('/'); break;
                            case 'b': currentLine.Append('\b'); break;
                            case 'f': currentLine.Append('\f'); break;
                            case 'u':
                                // Unicode escape sequence
                                if (_position + 4 < _input.Length)
                                {
                                    var hex = _input.Substring(_position + 1, 4);
                                    if (int.TryParse(hex, System.Globalization.NumberStyles.HexNumber, null, out var code))
                                    {
                                        currentLine.Append((char)code);
                                        _position += 4;
                                        _column += 4;
                                    }
                                }
                                break;
                            default:
                                currentLine.Append(escapeChar);
                                break;
                        }
                    }
                }
                else if (_input[_position] == '\n')
                {
                    // End of line - add current line to collection and start new line
                    lines.Add(currentLine.ToString());
                    currentLine.Clear();
                    _line++;
                    _column = 1;
                }
                else
                {
                    currentLine.Append(_input[_position]);
                    _column++;
                }

                _position++;
            }

            // Process indentation according to TON specification
            var processedContent = ProcessMultiLineIndentation(lines);

            return new TonToken(TonTokenType.String, processedContent, startLine, startColumn);
        }

        private string ProcessMultiLineIndentation(List<string> lines)
        {
            if (lines.Count == 0)
                return string.Empty;

            if (lines.Count == 1)
                return lines[0];

            // Remove leading and trailing empty lines
            var trimmedLines = new List<string>(lines);

            // Remove leading empty lines
            while (trimmedLines.Count > 0 && string.IsNullOrWhiteSpace(trimmedLines[0]))
            {
                trimmedLines.RemoveAt(0);
            }

            // Remove trailing empty lines
            while (trimmedLines.Count > 0 && string.IsNullOrWhiteSpace(trimmedLines[trimmedLines.Count - 1]))
            {
                trimmedLines.RemoveAt(trimmedLines.Count - 1);
            }

            if (trimmedLines.Count == 0)
                return string.Empty;

            if (trimmedLines.Count == 1)
                return trimmedLines[0];

            // Find the minimum common leading whitespace across all non-empty lines
            int commonIndentation = int.MaxValue;

            foreach (var line in trimmedLines)
            {
                if (string.IsNullOrWhiteSpace(line))
                    continue; // Skip empty lines for indentation calculation

                int indentation = 0;
                foreach (char c in line)
                {
                    if (c == ' ' || c == '\t')
                        indentation++;
                    else
                        break;
                }

                commonIndentation = Math.Min(commonIndentation, indentation);
            }

            // If no non-empty lines found, return original content
            if (commonIndentation == int.MaxValue)
                commonIndentation = 0;

            // Remove common indentation from all lines
            var processedLines = new List<string>();
            foreach (var line in trimmedLines)
            {
                if (string.IsNullOrWhiteSpace(line))
                {
                    // Preserve empty lines as-is
                    processedLines.Add(line);
                }
                else if (line.Length >= commonIndentation)
                {
                    // Remove common indentation
                    processedLines.Add(line.Substring(commonIndentation));
                }
                else
                {
                    // Line is shorter than common indentation (shouldn't happen, but handle gracefully)
                    processedLines.Add(line);
                }
            }

            return string.Join("\n", processedLines);
        }

        private TonToken ParseNumber(int startLine, int startColumn)
        {
            var sb = new StringBuilder();

            if (_input[_position] == '-')
            {
                sb.Append('-');
                _position++;
                _column++;
            }

            // Check for hexadecimal
            if (_position + 1 < _input.Length && _input[_position] == '0' &&
                (_input[_position + 1] == 'x' || _input[_position + 1] == 'X'))
            {
                sb.Append('0');
                sb.Append(_input[_position + 1]); // Preserve case
                _position += 2;
                _column += 2;

                while (_position < _input.Length &&
                       (char.IsDigit(_input[_position]) ||
                        (_input[_position] >= 'a' && _input[_position] <= 'f') ||
                        (_input[_position] >= 'A' && _input[_position] <= 'F')))
                {
                    sb.Append(_input[_position]);
                    _position++;
                    _column++;
                }
            }
            // Check for binary
            else if (_position + 1 < _input.Length && _input[_position] == '0' &&
                     (_input[_position + 1] == 'b' || _input[_position + 1] == 'B'))
            {
                sb.Append('0');
                sb.Append(_input[_position + 1]); // Preserve case
                _position += 2;
                _column += 2;

                while (_position < _input.Length && (_input[_position] == '0' || _input[_position] == '1'))
                {
                    sb.Append(_input[_position]);
                    _position++;
                    _column++;
                }
            }
            // Decimal number
            else
            {
                while (_position < _input.Length && char.IsDigit(_input[_position]))
                {
                    sb.Append(_input[_position]);
                    _position++;
                    _column++;
                }

                // Check for decimal point
                if (_position < _input.Length && _input[_position] == '.')
                {
                    sb.Append('.');
                    _position++;
                    _column++;

                    while (_position < _input.Length && char.IsDigit(_input[_position]))
                    {
                        sb.Append(_input[_position]);
                        _position++;
                        _column++;
                    }
                }

                // Check for scientific notation
                if (_position < _input.Length && (_input[_position] == 'e' || _input[_position] == 'E'))
                {
                    sb.Append(_input[_position]);
                    _position++;
                    _column++;

                    if (_position < _input.Length && (_input[_position] == '+' || _input[_position] == '-'))
                    {
                        sb.Append(_input[_position]);
                        _position++;
                        _column++;
                    }

                    while (_position < _input.Length && char.IsDigit(_input[_position]))
                    {
                        sb.Append(_input[_position]);
                        _position++;
                        _column++;
                    }
                }
            }

            return new TonToken(TonTokenType.Number, sb.ToString(), startLine, startColumn);
        }

        private TonToken ParseEnum(int startLine, int startColumn)
        {
            var sb = new StringBuilder();
            sb.Append('|');
            _position++;
            _column++;

            while (_position < _input.Length && _input[_position] != '|')
            {
                sb.Append(_input[_position]);
                _position++;
                _column++;
            }

            // Read until we find the closing pipe that's not followed by another value
            while (_position < _input.Length)
            {
                if (_input[_position] == '|')
                {
                    sb.Append('|');
                    _position++;
                    _column++;

                    // Check if there's more content (enumSet)
                    if (_position < _input.Length && IsEnumChar(_input[_position]))
                    {
                        // Continue reading
                        continue;
                    }
                    else
                    {
                        // End of enum
                        break;
                    }
                }
                else if (IsEnumChar(_input[_position]))
                {
                    sb.Append(_input[_position]);
                    _position++;
                    _column++;
                }
                else
                {
                    break;
                }
            }

            return new TonToken(TonTokenType.Enum, sb.ToString(), startLine, startColumn);
        }

        private bool IsEnumChar(char ch)
        {
            return char.IsLetterOrDigit(ch) || ch == '_';
        }

        private TonToken ParseIdentifierOrKeyword(int startLine, int startColumn)
        {
            var sb = new StringBuilder();

            // Parse identifier
            while (_position < _input.Length &&
                   (char.IsLetterOrDigit(_input[_position]) || _input[_position] == '_' || _input[_position] == '-'))
            {
                sb.Append(_input[_position]);
                _position++;
                _column++;
            }

            var text = sb.ToString();

            // Check for keywords
            switch (text.ToLowerInvariant())
            {
                case "true":
                case "false":
                    return new TonToken(TonTokenType.Boolean, text, startLine, startColumn);

                case "null":
                    return new TonToken(TonTokenType.Null, text, startLine, startColumn);

                case "undefined":
                    return new TonToken(TonTokenType.Undefined, text, startLine, startColumn);

                case "enum":
                    return new TonToken(TonTokenType.EnumKeyword, text, startLine, startColumn);

                case "enumset":
                    return new TonToken(TonTokenType.EnumSetKeyword, text, startLine, startColumn);

                default:
                    return new TonToken(TonTokenType.Identifier, text, startLine, startColumn);
            }
        }
    }
}