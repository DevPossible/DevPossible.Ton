using System;
using System.Collections.Generic;
using System.Linq;

namespace TONfile
{
    /// <summary>
    /// Represents a single enum value in TON format
    /// </summary>
    public class TonEnum
    {
        /// <summary>
        /// The enum value (can be a name or index)
        /// </summary>
        public string Value { get; set; }

        /// <summary>
        /// The index if the value is numeric
        /// </summary>
        public int? Index { get; private set; }

        /// <summary>
        /// Creates a new TON enum value
        /// </summary>
        public TonEnum(string value)
        {
            Value = value ?? throw new ArgumentNullException(nameof(value));

            // Check if it's an index
            if (int.TryParse(value, out var index))
            {
                Index = index;
            }
        }

        /// <summary>
        /// Checks if this is an index-based enum value
        /// </summary>
        public bool IsIndex => Index.HasValue;

        /// <summary>
        /// Gets the name value (returns null if this is an index)
        /// </summary>
        public string? Name => IsIndex ? null : Value;

        /// <summary>
        /// Converts to TON format string
        /// </summary>
        public override string ToString()
        {
            return $"|{Value}|";
        }

        /// <summary>
        /// Parses a TON enum string
        /// </summary>
        public static TonEnum Parse(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                throw new ArgumentException("Enum value cannot be empty", nameof(text));

            // Remove pipe delimiters if present
            var value = text.Trim('|');
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("Enum value cannot be empty", nameof(text));

            return new TonEnum(value);
        }
    }

    /// <summary>
    /// Represents a set of enum values in TON format
    /// </summary>
    public class TonEnumSet
    {
        /// <summary>
        /// The collection of enum values
        /// </summary>
        public List<TonEnum> Values { get; set; } = new List<TonEnum>();

        /// <summary>
        /// Creates an empty enum set
        /// </summary>
        public TonEnumSet()
        {
        }

        /// <summary>
        /// Creates an enum set from string values
        /// </summary>
        public TonEnumSet(params string[] values)
        {
            foreach (var value in values)
            {
                if (!string.IsNullOrWhiteSpace(value))
                {
                    Values.Add(new TonEnum(value));
                }
            }
        }

        /// <summary>
        /// Creates an enum set from TonEnum values
        /// </summary>
        public TonEnumSet(IEnumerable<TonEnum> values)
        {
            Values.AddRange(values);
        }

        /// <summary>
        /// Adds a value to the set
        /// </summary>
        public void Add(string value)
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                Values.Add(new TonEnum(value));
            }
        }

        /// <summary>
        /// Adds a TonEnum value to the set
        /// </summary>
        public void Add(TonEnum value)
        {
            if (value != null)
            {
                Values.Add(value);
            }
        }

        /// <summary>
        /// Checks if the set contains a specific value
        /// </summary>
        public bool Contains(string value)
        {
            return Values.Any(v => v.Value == value);
        }

        /// <summary>
        /// Checks if the set contains a specific index
        /// </summary>
        public bool ContainsIndex(int index)
        {
            return Values.Any(v => v.Index == index);
        }

        /// <summary>
        /// Gets all name values (excludes index-based values)
        /// </summary>
        public IEnumerable<string> GetNames()
        {
            return Values.Where(v => !v.IsIndex).Select(v => v.Value);
        }

        /// <summary>
        /// Gets all index values
        /// </summary>
        public IEnumerable<int> GetIndices()
        {
            return Values.Where(v => v.IsIndex).Select(v => v.Index!.Value);
        }

        /// <summary>
        /// Converts to TON format string
        /// </summary>
        public override string ToString()
        {
            if (Values.Count == 0)
                return "||";

            return "|" + string.Join("|", Values.Select(v => v.Value)) + "|";
        }

        /// <summary>
        /// Parses a TON enum set string
        /// </summary>
        public static TonEnumSet Parse(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return new TonEnumSet();

            // Remove outer pipe delimiters
            text = text.Trim('|');
            if (string.IsNullOrWhiteSpace(text))
                return new TonEnumSet();

            var values = text.Split('|', StringSplitOptions.RemoveEmptyEntries);
            return new TonEnumSet(values);
        }
    }

    /// <summary>
    /// Represents an enum definition in the schema
    /// </summary>
    public class TonEnumDefinition
    {
        /// <summary>
        /// The name of the enum (case-insensitive)
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Whether this is an enumSet (allows multiple values)
        /// </summary>
        public bool IsEnumSet { get; set; }

        /// <summary>
        /// The defined values for this enum
        /// </summary>
        public List<string> Values { get; set; } = new List<string>();

        /// <summary>
        /// Creates a new enum definition
        /// </summary>
        public TonEnumDefinition(string name, bool isEnumSet = false)
        {
            Name = name ?? throw new ArgumentNullException(nameof(name));
            IsEnumSet = isEnumSet;
        }

        /// <summary>
        /// Validates if a value is valid for this enum
        /// </summary>
        public bool IsValidValue(string value)
        {
            // Check if it's an index
            if (int.TryParse(value, out var index))
            {
                return index >= 0 && index < Values.Count;
            }

            // Check if it's a valid name
            return Values.Contains(value, StringComparer.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Gets the value at the specified index
        /// </summary>
        public string? GetValueAt(int index)
        {
            if (index >= 0 && index < Values.Count)
                return Values[index];
            return null;
        }

        /// <summary>
        /// Gets the index of a value
        /// </summary>
        public int GetIndexOf(string value)
        {
            for (int i = 0; i < Values.Count; i++)
            {
                if (string.Equals(Values[i], value, StringComparison.OrdinalIgnoreCase))
                    return i;
            }
            return -1;
        }
    }
}