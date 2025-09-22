using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;

namespace TONfile
{
    /// <summary>
    /// Represents a value in a TON document with type information
    /// </summary>
    public class TonValue
    {
        private static readonly Regex GuidPattern = new Regex(
            @"^(\{)?[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(\})?$",
            RegexOptions.Compiled);

        /// <summary>
        /// Singleton marker for undefined values
        /// </summary>
        public static readonly object UndefinedMarker = new UndefinedValue();

        /// <summary>
        /// Internal class to represent undefined values
        /// </summary>
        private class UndefinedValue
        {
            public override string ToString() => "undefined";
        }

        /// <summary>
        /// The actual value
        /// </summary>
        public object? Value { get; set; }

        /// <summary>
        /// The type of the value
        /// </summary>
        public TonValueType Type { get; set; }

        /// <summary>
        /// Optional type hint prefix ($, %, &)
        /// </summary>
        public char? TypeHint { get; set; }

        /// <summary>
        /// Creates an empty TON value
        /// </summary>
        public TonValue()
        {
            Type = TonValueType.Null;
        }

        /// <summary>
        /// Creates a TON value with the specified value and type
        /// </summary>
        public TonValue(object? value, TonValueType type)
        {
            Value = value;
            Type = type;
        }

        /// <summary>
        /// Creates a TON value from a .NET object
        /// </summary>
        public static TonValue From(object? value)
        {
            if (value == null)
                return new TonValue(null, TonValueType.Null);

            if (ReferenceEquals(value, UndefinedMarker))
                return new TonValue(UndefinedMarker, TonValueType.Undefined);

            // Check for GuidValue marker (internal class from parser)
            if (value.GetType().Name == "GuidValue")
            {
                var guidStr = value.GetType().GetProperty("Value")?.GetValue(value)?.ToString() ?? "";
                return new TonValue(guidStr, TonValueType.Guid);
            }

            return value switch
            {
                string s => new TonValue(s, TonValueType.String),
                bool b => new TonValue(b, TonValueType.Boolean),
                int i => new TonValue(i, TonValueType.Integer),
                long l => new TonValue(l, TonValueType.Integer),
                float f => new TonValue(f, TonValueType.Float),
                double d => new TonValue(d, TonValueType.Float),
                decimal dec => new TonValue(dec, TonValueType.Float),
                DateTime dt => new TonValue(dt.ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss'Z'"), TonValueType.Date),
                Guid g => new TonValue(g.ToString(), TonValueType.Guid),
                TonEnum e => new TonValue(e, TonValueType.Enum),
                TonEnumSet es => new TonValue(es, TonValueType.EnumSet),
                List<TonValue> arr => new TonValue(arr, TonValueType.Array),
                TonValue[] arr2 => new TonValue(arr2.ToList(), TonValueType.Array),
                TonObject obj => new TonValue(obj, TonValueType.Object),
                _ => new TonValue(value.ToString(), TonValueType.String)
            };
        }

        /// <summary>
        /// Creates a TON array value from a collection of values
        /// </summary>
        public static TonValue FromArray(params object?[] values)
        {
            var tonValues = values.Select(v => From(v)).ToList();
            return new TonValue(tonValues, TonValueType.Array);
        }

        /// <summary>
        /// Creates a TON array value from a collection of TonValues
        /// </summary>
        public static TonValue FromArray(IEnumerable<TonValue> values)
        {
            return new TonValue(values.ToList(), TonValueType.Array);
        }

        /// <summary>
        /// Converts the value to the specified type
        /// </summary>
        public object? ConvertTo(Type targetType)
        {
            if (Value == null)
                return null;

            if (targetType == typeof(string))
                return ToString();

            if (targetType == typeof(bool) || targetType == typeof(bool?))
                return ToBoolean();

            if (targetType == typeof(int) || targetType == typeof(int?))
                return ToInt32();

            if (targetType == typeof(long) || targetType == typeof(long?))
                return ToInt64();

            if (targetType == typeof(float) || targetType == typeof(float?))
                return ToSingle();

            if (targetType == typeof(double) || targetType == typeof(double?))
                return ToDouble();

            if (targetType == typeof(decimal) || targetType == typeof(decimal?))
                return ToDecimal();

            if (targetType == typeof(DateTime) || targetType == typeof(DateTime?))
                return ToDateTime();

            if (targetType == typeof(Guid) || targetType == typeof(Guid?))
                return ToGuid();

            return Value;
        }

        /// <summary>
        /// Converts the value to a string
        /// </summary>
        public override string? ToString()
        {
            return Value?.ToString();
        }

        /// <summary>
        /// Converts the value to a boolean
        /// </summary>
        public bool ToBoolean()
        {
            if (Value == null) return false;
            if (Value is bool b) return b;
            if (bool.TryParse(Value.ToString(), out var result)) return result;
            return false;
        }

        /// <summary>
        /// Converts the value to an integer
        /// </summary>
        public int ToInt32()
        {
            if (Value == null) return 0;
            if (Value is int i) return i;
            if (Value is long l) return (int)l;
            if (Value is float f) return (int)f;
            if (Value is double d) return (int)d;
            if (Value is decimal dec) return (int)dec;

            var str = Value.ToString()!;

            // Handle hexadecimal
            if (str.StartsWith("0x", StringComparison.OrdinalIgnoreCase))
            {
                if (int.TryParse(str.Substring(2), NumberStyles.HexNumber, null, out var hexResult))
                    return hexResult;
            }

            // Handle binary
            if (str.StartsWith("0b", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    return Convert.ToInt32(str.Substring(2), 2);
                }
                catch { }
            }

            if (int.TryParse(str, out var result))
                return result;

            return 0;
        }

        /// <summary>
        /// Converts the value to a long
        /// </summary>
        public long ToInt64()
        {
            if (Value == null) return 0;
            if (Value is long l) return l;
            if (Value is int i) return i;
            if (Value is float f) return (long)f;
            if (Value is double d) return (long)d;
            if (Value is decimal dec) return (long)dec;

            var str = Value.ToString()!;

            // Handle hexadecimal
            if (str.StartsWith("0x", StringComparison.OrdinalIgnoreCase))
            {
                if (long.TryParse(str.Substring(2), NumberStyles.HexNumber, null, out var hexResult))
                    return hexResult;
            }

            // Handle binary
            if (str.StartsWith("0b", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    return Convert.ToInt64(str.Substring(2), 2);
                }
                catch { }
            }

            if (long.TryParse(str, out var result))
                return result;

            return 0;
        }

        /// <summary>
        /// Converts the value to a float
        /// </summary>
        public float ToSingle()
        {
            if (Value == null) return 0f;
            if (Value is float f) return f;
            if (Value is double d) return (float)d;
            if (Value is decimal dec) return (float)dec;
            if (Value is int i) return i;
            if (Value is long l) return l;

            if (float.TryParse(Value.ToString(), out var result))
                return result;

            return 0f;
        }

        /// <summary>
        /// Converts the value to a double
        /// </summary>
        public double ToDouble()
        {
            if (Value == null) return 0d;
            if (Value is double d) return d;
            if (Value is float f) return f;
            if (Value is decimal dec) return (double)dec;
            if (Value is int i) return i;
            if (Value is long l) return l;

            if (double.TryParse(Value.ToString(), out var result))
                return result;

            return 0d;
        }

        /// <summary>
        /// Converts the value to a decimal
        /// </summary>
        public decimal ToDecimal()
        {
            if (Value == null) return 0m;
            if (Value is decimal dec) return dec;
            if (Value is double d) return (decimal)d;
            if (Value is float f) return (decimal)f;
            if (Value is int i) return i;
            if (Value is long l) return l;

            if (decimal.TryParse(Value.ToString(), out var result))
                return result;

            return 0m;
        }

        /// <summary>
        /// Converts the value to a DateTime
        /// </summary>
        public DateTime ToDateTime()
        {
            if (Value == null) return DateTime.MinValue;
            if (Value is DateTime dt) return dt;

            if (DateTime.TryParse(Value.ToString(), null, DateTimeStyles.RoundtripKind, out var result))
                return result;

            return DateTime.MinValue;
        }

        /// <summary>
        /// Converts the value to a Guid
        /// </summary>
        public Guid ToGuid()
        {
            if (Value == null) return Guid.Empty;
            if (Value is Guid g) return g;

            var str = Value.ToString()!;

            // Remove braces if present
            if (str.StartsWith("{") && str.EndsWith("}"))
                str = str.Substring(1, str.Length - 2);

            if (Guid.TryParse(str, out var result))
                return result;

            return Guid.Empty;
        }

        /// <summary>
        /// Converts the value to an array of TonValues
        /// </summary>
        public List<TonValue>? ToArray()
        {
            if (Value == null) return null;
            if (Value is List<TonValue> arr) return arr;
            // Single value becomes single-element array
            return new List<TonValue> { this };
        }

        /// <summary>
        /// Gets the array element at the specified index
        /// </summary>
        public TonValue? GetArrayElement(int index)
        {
            if (Type != TonValueType.Array || Value is not List<TonValue> arr)
                return null;

            if (index < 0 || index >= arr.Count)
                return null;

            return arr[index];
        }

        /// <summary>
        /// Gets the count of array elements
        /// </summary>
        public int GetArrayCount()
        {
            if (Type != TonValueType.Array || Value is not List<TonValue> arr)
                return 0;

            return arr.Count;
        }

        /// <summary>
        /// Checks if the value represents undefined
        /// </summary>
        public bool IsUndefined => Type == TonValueType.Undefined;

        /// <summary>
        /// Checks if the value is null
        /// </summary>
        public bool IsNull => Type == TonValueType.Null || Value == null;

        /// <summary>
        /// Checks if the value is empty based on type-specific rules
        /// </summary>
        public bool IsEmpty()
        {
            if (IsNull || IsUndefined)
                return true;

            return Type switch
            {
                TonValueType.String => string.IsNullOrWhiteSpace(Value?.ToString()),
                TonValueType.Integer => ToInt64() == 0,
                TonValueType.Float => Math.Abs(ToDouble()) < double.Epsilon,
                TonValueType.Guid => ToGuid() == Guid.Empty,
                TonValueType.EnumSet => Value is TonEnumSet es && es.Values.Count == 0,
                TonValueType.Array => Value is List<TonValue> arr && arr.Count == 0,
                _ => false
            };
        }

        /// <summary>
        /// Parses a string value with proper type detection
        /// </summary>
        public static TonValue Parse(string text)
        {
            if (text == null)
                throw new ArgumentNullException(nameof(text));

            // Check for undefined
            if (text.Equals("undefined", StringComparison.OrdinalIgnoreCase))
                return new TonValue(null, TonValueType.Undefined);

            // Check for null
            if (text.Equals("null", StringComparison.OrdinalIgnoreCase))
                return new TonValue(null, TonValueType.Null);

            // Check for boolean
            if (text.Equals("true", StringComparison.OrdinalIgnoreCase))
                return new TonValue(true, TonValueType.Boolean);
            if (text.Equals("false", StringComparison.OrdinalIgnoreCase))
                return new TonValue(false, TonValueType.Boolean);

            // Check for GUID
            if (GuidPattern.IsMatch(text))
                return new TonValue(text, TonValueType.Guid);

            // Check for hexadecimal
            if (text.StartsWith("0x", StringComparison.OrdinalIgnoreCase))
            {
                if (long.TryParse(text.Substring(2), NumberStyles.HexNumber, null, out var hexValue))
                    return new TonValue(hexValue, TonValueType.Integer);
            }

            // Check for binary
            if (text.StartsWith("0b", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    var binValue = Convert.ToInt64(text.Substring(2), 2);
                    return new TonValue(binValue, TonValueType.Integer);
                }
                catch { }
            }

            // Check for enum (pipe-delimited)
            if (text.StartsWith("|") && text.EndsWith("|"))
            {
                var enumContent = text.Substring(1, text.Length - 2);
                if (enumContent.Contains("|"))
                {
                    // EnumSet
                    var values = enumContent.Split('|', StringSplitOptions.RemoveEmptyEntries);
                    return new TonValue(new TonEnumSet(values), TonValueType.EnumSet);
                }
                else
                {
                    // Single enum
                    return new TonValue(new TonEnum(enumContent), TonValueType.Enum);
                }
            }

            // Check for number
            if (double.TryParse(text, NumberStyles.Float | NumberStyles.AllowThousands, CultureInfo.InvariantCulture, out var doubleValue))
            {
                // Check if it's an integer
                if (!text.Contains('.') && long.TryParse(text, out var intValue))
                    return new TonValue(intValue, TonValueType.Integer);

                return new TonValue(doubleValue, TonValueType.Float);
            }

            // Default to string
            return new TonValue(text, TonValueType.String);
        }
    }

    /// <summary>
    /// Represents the type of a TON value
    /// </summary>
    public enum TonValueType
    {
        String,
        Integer,
        Float,
        Boolean,
        Null,
        Undefined,
        Guid,
        Date,
        Enum,
        EnumSet,
        Array,
        Object
    }
}