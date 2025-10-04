using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace TONfile
{
    /// <summary>
    /// Serializer for converting objects to TON format
    /// </summary>
    public class TonSerializer : ITonSerializer
    {
        /// <summary>
        /// Serializes an object to TON format string
        /// </summary>
        public string Serialize(object obj, TonSerializeOptions? options = null)
        {
            if (obj == null)
                throw new ArgumentNullException(nameof(obj));

            options ??= TonSerializeOptions.Default;

            TonDocument document;
            if (obj is TonDocument doc)
            {
                document = doc;
            }
            else if (obj is TonObject tonObj)
            {
                document = new TonDocument(tonObj);
            }
            else
            {
                document = TonDocument.FromObject(obj);
            }

            return SerializeDocument(document, options);
        }

        /// <summary>
        /// Serializes a TonDocument to TON format string
        /// </summary>
        public string SerializeDocument(TonDocument document, TonSerializeOptions? options = null)
        {
            if (document == null)
                throw new ArgumentNullException(nameof(document));

            options ??= TonSerializeOptions.Default;

            var writer = new TonWriter(options);
            return writer.WriteDocument(document);
        }

        /// <summary>
        /// Serializes an object to a TON file
        /// </summary>
        public void SerializeToFile(object obj, string filePath, TonSerializeOptions? options = null)
        {
            var content = Serialize(obj, options);
            File.WriteAllText(filePath, content, Encoding.UTF8);
        }

        /// <summary>
        /// Asynchronously serializes an object to a TON file
        /// </summary>
        public async Task SerializeToFileAsync(object obj, string filePath, TonSerializeOptions? options = null)
        {
            var content = Serialize(obj, options);
            await File.WriteAllTextAsync(filePath, content, Encoding.UTF8);
        }

        /// <summary>
        /// Serializes an object to a stream
        /// </summary>
        public void SerializeToStream(object obj, Stream stream, TonSerializeOptions? options = null)
        {
            var content = Serialize(obj, options);
            using var writer = new StreamWriter(stream, Encoding.UTF8, 1024, leaveOpen: true);
            writer.Write(content);
        }

        /// <summary>
        /// Asynchronously serializes an object to a stream
        /// </summary>
        public async Task SerializeToStreamAsync(object obj, Stream stream, TonSerializeOptions? options = null)
        {
            var content = Serialize(obj, options);
            using var writer = new StreamWriter(stream, Encoding.UTF8, 1024, leaveOpen: true);
            await writer.WriteAsync(content);
        }
    }

    /// <summary>
    /// Internal writer for generating TON format
    /// </summary>
    internal class TonWriter
    {
        private readonly TonSerializeOptions _options;
        private readonly StringBuilder _sb;
        private int _indentLevel;

        public TonWriter(TonSerializeOptions options)
        {
            _options = options;
            _sb = new StringBuilder();
            _indentLevel = 0;
        }

        public string WriteDocument(TonDocument document)
        {
            // Write header if requested
            if (_options.IncludeHeader && (document.Header != null || _options.TonVersion != null))
            {
                WriteHeader(document.Header);
            }

            // Write root object
            WriteObject(document.RootObject);

            // Write schemas if requested
            if (_options.IncludeSchema && document.Schemas != null)
            {
                WriteNewLine();
                WriteSchemas(document.Schemas);
            }

            return _sb.ToString();
        }

        private void WriteHeader(TonHeader? header)
        {
            _sb.Append("#@");

            var attributes = new Dictionary<string, object?>();

            // Add TonVersion from options or header
            if (_options.TonVersion != null)
                attributes["tonVersion"] = _options.TonVersion;
            else if (header?.TonVersion != null)
                attributes["tonVersion"] = header.TonVersion;

            // Add SchemaFile
            if (_options.SchemaFile != null)
                attributes["@schemaFile"] = _options.SchemaFile;
            else if (header?.SchemaFile != null)
                attributes["@schemaFile"] = header.SchemaFile;

            // Add other attributes from header
            if (header != null)
            {
                foreach (var attr in header.Attributes)
                {
                    attributes[attr.Key] = attr.Value;
                }
            }

            bool first = true;
            foreach (var attr in attributes)
            {
                if (!first)
                    _sb.Append(", ");
                else
                    _sb.Append(' ');

                _sb.Append(attr.Key);
                _sb.Append(" = ");
                WriteValue(attr.Value, false);
                first = false;
            }

            WriteNewLine();
            WriteNewLine();
        }

        private void WriteObject(TonObject obj)
        {
            WriteIndent();
            _sb.Append('{');

            // Write class type if present
            if (!string.IsNullOrWhiteSpace(obj.ClassName))
            {
                _sb.Append('(').Append(obj.ClassName).Append(')');
            }

            _indentLevel++;

            // Sort properties if requested
            var properties = obj.Properties;
            if (_options.SortProperties)
            {
                properties = properties.OrderBy(p => p.Key).ToDictionary(p => p.Key, p => p.Value);
            }

            bool hasContent = false;

            // Write properties
            foreach (var prop in properties)
            {
                var value = prop.Value;

                // Skip null/undefined if requested
                if (value.IsNull && _options.OmitNullValues)
                    continue;
                if (value.IsUndefined && _options.OmitUndefinedValues)
                    continue;

                if (hasContent)
                    _sb.Append(',');

                WriteNewLine();
                WriteProperty(prop.Key, value);
                hasContent = true;
            }

            // Write child objects
            foreach (var child in obj.Children)
            {
                if (hasContent)
                    _sb.Append(',');

                WriteNewLine();
                WriteObject(child);
                hasContent = true;
            }

            _indentLevel--;

            if (hasContent)
            {
                WriteNewLine();
                WriteIndent();
            }

            _sb.Append('}');
        }

        private void WriteProperty(string name, TonValue value)
        {
            WriteIndent();

            // Handle @ prefix
            if (_options.UseAtPrefix && !name.StartsWith("@"))
                name = "@" + name;

            // Quote property name if needed
            if (NeedsQuoting(name))
            {
                WriteQuotedString(name);
            }
            else
            {
                _sb.Append(name);
            }

            _sb.Append(" = ");

            // Write type hint if requested
            if (_options.IncludeTypeHints)
            {
                WriteTypeHint(value);
            }

            WriteValueWithType(value);
        }

        private void WriteValueWithType(TonValue tonValue)
        {
            // Special handling based on TonValue type
            if (tonValue.Type == TonValueType.Guid && tonValue.Value is string guidStr)
            {
                // Write GUID without quotes
                if (_options.LowercaseGuids)
                    guidStr = guidStr.ToLowerInvariant();
                _sb.Append(guidStr);
            }
            else
            {
                WriteValue(tonValue.Value, true);
            }
        }

        private void WriteValue(object? value, bool includeTypeInfo)
        {
            if (value == null)
            {
                _sb.Append("null");
                return;
            }

            switch (value)
            {
                case string s:
                    WriteQuotedString(s);
                    break;

                case bool b:
                    _sb.Append(b ? "true" : "false");
                    break;

                case int i:
                    _sb.Append(i);
                    break;

                case long l:
                    _sb.Append(l);
                    break;

                case float f:
                    _sb.Append(f.ToString(CultureInfo.InvariantCulture));
                    break;

                case double d:
                    _sb.Append(d.ToString(CultureInfo.InvariantCulture));
                    break;

                case decimal dec:
                    _sb.Append(dec.ToString(CultureInfo.InvariantCulture));
                    break;

                case DateTime dt:
                    WriteQuotedString(dt.ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss'Z'"));
                    break;

                case Guid g:
                    var guidStr = g.ToString();
                    if (_options.LowercaseGuids)
                        guidStr = guidStr.ToLowerInvariant();
                    _sb.Append(guidStr);
                    break;

                case TonEnum e:
                    _sb.Append(e.ToString());
                    break;

                case TonEnumSet es:
                    _sb.Append(es.ToString());
                    break;

                case List<TonValue> arr:
                    WriteArray(arr);
                    break;

                case TonObject obj:
                    WriteObject(obj);
                    break;

                default:
                    // Check for undefined marker
                    if (ReferenceEquals(value, TonValue.UndefinedMarker))
                    {
                        _sb.Append("undefined");
                    }
                    else
                    {
                        WriteQuotedString(value.ToString() ?? "");
                    }
                    break;
            }
        }

        private void WriteArray(List<TonValue> array)
        {
            _sb.Append('[');

            for (int i = 0; i < array.Count; i++)
            {
                if (i > 0)
                    _sb.Append(", ");

                // Write array element value directly
                WriteValue(array[i].Value, true);
            }

            _sb.Append(']');
        }

        private void WriteTypeHint(TonValue value)
        {
            switch (value.Type)
            {
                case TonValueType.String:
                    _sb.Append('$');
                    break;
                case TonValueType.Integer:
                case TonValueType.Float:
                    _sb.Append('%');
                    break;
                case TonValueType.Guid:
                    _sb.Append('&');
                    break;
                case TonValueType.Array:
                    _sb.Append('^');
                    break;
            }
        }

        private bool NeedsQuoting(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return true;

            // Check for @ prefix
            var checkName = name.StartsWith("@") ? name.Substring(1) : name;

            // Check if it starts with reserved characters
            if (checkName.Length > 0)
            {
                var firstChar = checkName[0];
                if (firstChar == '#' || char.IsDigit(firstChar) ||
                    firstChar == '{' || firstChar == '}' ||
                    firstChar == '[' || firstChar == ']' ||
                    firstChar == '(' || firstChar == ')')
                {
                    return true;
                }
            }

            // Check for special characters or spaces
            foreach (var ch in checkName)
            {
                if (!char.IsLetterOrDigit(ch) && ch != '_' && ch != '-')
                    return true;
            }

            return false;
        }

        private void WriteQuotedString(string text)
        {
            // Check if we should use multi-line string format
            if (_options.UseMultiLineStrings && ShouldUseMultiLineFormat(text))
            {
                WriteMultiLineString(text);
            }
            else
            {
                WriteSingleLineString(text);
            }
        }

        private bool ShouldUseMultiLineFormat(string text)
        {
            // Count newlines in the text
            var lineCount = text.Split('\n').Length;
            return lineCount >= _options.MultiLineStringThreshold;
        }

        private void WriteMultiLineString(string text)
        {
            // Use triple quotes for multi-line strings
            var quoteSequence = new string(_options.QuoteChar, 3);
            _sb.Append(quoteSequence);

            // Split the text into lines
            var lines = text.Split('\n');

            if (lines.Length > 0)
            {
                _sb.Append('\n');

                for (int i = 0; i < lines.Length; i++)
                {
                    // Write content with base indentation (no extra indentation for multi-line content)
                    var line = lines[i];

                    // Escape special characters within multi-line strings
                    foreach (var ch in line)
                    {
                        switch (ch)
                        {
                            case '"' when _options.QuoteChar == '"':
                                // Only escape if we have triple quotes in the content
                                if (line.Contains("\"\"\""))
                                    _sb.Append("\\\"");
                                else
                                    _sb.Append(ch);
                                break;
                            case '\'' when _options.QuoteChar == '\'':
                                // Only escape if we have triple quotes in the content
                                if (line.Contains("'''"))
                                    _sb.Append("\\'");
                                else
                                    _sb.Append(ch);
                                break;
                            case '\\':
                                _sb.Append("\\\\");
                                break;
                            case '\r':
                                _sb.Append("\\r");
                                break;
                            case '\t':
                                _sb.Append("\\t");
                                break;
                            case '\b':
                                _sb.Append("\\b");
                                break;
                            case '\f':
                                _sb.Append("\\f");
                                break;
                            default:
                                if (ch < 32 || ch > 127)
                                {
                                    _sb.Append($"\\u{(int)ch:x4}");
                                }
                                else
                                {
                                    _sb.Append(ch);
                                }
                                break;
                        }
                    }

                    // Add newline for all but the last line
                    if (i < lines.Length - 1)
                    {
                        _sb.Append('\n');
                    }
                }

                _sb.Append('\n');
            }

            _sb.Append(quoteSequence);
        }

        private void WriteSingleLineString(string text)
        {
            _sb.Append(_options.QuoteChar);

            foreach (var ch in text)
            {
                switch (ch)
                {
                    case '"' when _options.QuoteChar == '"':
                        _sb.Append("\\\"");
                        break;
                    case '\'' when _options.QuoteChar == '\'':
                        _sb.Append("\\'");
                        break;
                    case '\\':
                        _sb.Append("\\\\");
                        break;
                    case '\n':
                        _sb.Append("\\n");
                        break;
                    case '\r':
                        _sb.Append("\\r");
                        break;
                    case '\t':
                        _sb.Append("\\t");
                        break;
                    case '\b':
                        _sb.Append("\\b");
                        break;
                    case '\f':
                        _sb.Append("\\f");
                        break;
                    default:
                        if (ch < 32 || ch > 127)
                        {
                            _sb.Append($"\\u{(int)ch:x4}");
                        }
                        else
                        {
                            _sb.Append(ch);
                        }
                        break;
                }
            }

            _sb.Append(_options.QuoteChar);
        }

        private void WriteSchemas(TonSchemaCollection schemas)
        {
            // Write enum definitions
            foreach (var enumDef in schemas.Enums)
            {
                WriteNewLine();
                _sb.Append("#! ");
                _sb.Append(enumDef.IsEnumSet ? "enumSet" : "enum");
                _sb.Append('(').Append(enumDef.Name).Append(") [");

                bool first = true;
                foreach (var value in enumDef.Values)
                {
                    if (!first)
                        _sb.Append(", ");
                    _sb.Append(value);
                    first = false;
                }

                _sb.Append(']');
            }

            // Write schema definitions
            foreach (var schema in schemas.Schemas)
            {
                WriteNewLine();
                WriteNewLine();
                _sb.Append("#! {(").Append(schema.ClassName).Append(')');

                if (schema.Properties.Count > 0)
                {
                    WriteNewLine();
                    _indentLevel++;

                    bool first = true;
                    foreach (var prop in schema.Properties)
                    {
                        if (!first)
                        {
                            _sb.Append(',');
                            WriteNewLine();
                        }

                        WriteIndent();
                        _sb.Append(prop.Key).Append(" = ").Append(prop.Value.Type);

                        if (prop.Value.Validations.Count > 0)
                        {
                            _sb.Append('(');
                            WriteValidations(prop.Value.Validations);
                            _sb.Append(')');
                        }

                        first = false;
                    }

                    _indentLevel--;
                    WriteNewLine();
                }

                _sb.Append('}');
            }
        }

        private void WriteValidations(List<TonValidationRule> validations)
        {
            bool first = true;
            foreach (var rule in validations)
            {
                if (!first)
                    _sb.Append(", ");

                _sb.Append(rule.Type.ToString().ToLowerInvariant());

                if (rule.Parameters != null && rule.Parameters.Length > 0)
                {
                    _sb.Append('(');
                    for (int i = 0; i < rule.Parameters.Length; i++)
                    {
                        if (i > 0)
                            _sb.Append(", ");
                        WriteValue(rule.Parameters[i], false);
                    }
                    _sb.Append(')');
                }

                first = false;
            }
        }

        private void WriteIndent()
        {
            if (_options.Indentation != null)
            {
                for (int i = 0; i < _indentLevel; i++)
                {
                    _sb.Append(_options.Indentation);
                }
            }
        }

        private void WriteNewLine()
        {
            if (_options.Indentation != null)
            {
                _sb.AppendLine();
            }
        }
    }
}
