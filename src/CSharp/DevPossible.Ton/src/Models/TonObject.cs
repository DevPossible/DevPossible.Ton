using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace TONfile
{
    /// <summary>
    /// Represents a TON object with properties and child objects
    /// </summary>
    public class TonObject
    {
        /// <summary>
        /// The class type of this object (case-insensitive)
        /// </summary>
        public string? ClassName { get; set; }

        /// <summary>
        /// Properties of this object (with optional @ prefix)
        /// </summary>
        public Dictionary<string, TonValue> Properties { get; set; } = new Dictionary<string, TonValue>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Child objects contained within this object
        /// </summary>
        public List<TonObject> Children { get; set; } = new List<TonObject>();

        /// <summary>
        /// Gets or sets a property value
        /// </summary>
        public TonValue? this[string propertyName]
        {
            get => GetProperty(propertyName);
            set => SetProperty(propertyName, value);
        }

        /// <summary>
        /// Gets a property value, checking both with and without @ prefix
        /// </summary>
        public TonValue? GetProperty(string name)
        {
            if (Properties.TryGetValue(name, out var value))
                return value;

            // Try with @ prefix if not already present
            if (!name.StartsWith("@"))
            {
                var atName = "@" + name;
                if (Properties.TryGetValue(atName, out value))
                    return value;
            }
            // Try without @ prefix if present
            else if (name.StartsWith("@"))
            {
                var plainName = name.Substring(1);
                if (Properties.TryGetValue(plainName, out value))
                    return value;
            }

            return null;
        }

        /// <summary>
        /// Sets a property value
        /// </summary>
        public void SetProperty(string name, TonValue? value)
        {
            if (value == null)
            {
                Properties.Remove(name);
                if (name.StartsWith("@"))
                    Properties.Remove(name.Substring(1));
                else
                    Properties.Remove("@" + name);
            }
            else
            {
                Properties[name] = value;
            }
        }

        /// <summary>
        /// Adds a child object
        /// </summary>
        public void AddChild(TonObject child)
        {
            if (child == null)
                throw new ArgumentNullException(nameof(child));
            Children.Add(child);
        }

        /// <summary>
        /// Gets child objects of a specific class type
        /// </summary>
        public IEnumerable<TonObject> GetChildren(string? className = null)
        {
            if (string.IsNullOrWhiteSpace(className))
                return Children;

            return Children.Where(c =>
                string.Equals(c.ClassName, className, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Gets the first child object of a specific class type
        /// </summary>
        public TonObject? GetChild(string className)
        {
            return GetChildren(className).FirstOrDefault();
        }

        /// <summary>
        /// Gets a value using path segments
        /// </summary>
        internal object? GetValue(string[] segments)
        {
            if (segments.Length == 0)
                return this;

            var property = GetProperty(segments[0]);
            if (segments.Length == 1)
                return property?.Value;

            // Navigate to child object
            var child = GetChild(segments[0]);
            if (child != null && segments.Length > 1)
            {
                return child.GetValue(segments.Skip(1).ToArray());
            }

            return null;
        }

        /// <summary>
        /// Sets a value using path segments
        /// </summary>
        internal void SetValue(string[] segments, object? value)
        {
            if (segments.Length == 0)
                throw new ArgumentException("Path segments cannot be empty");

            if (segments.Length == 1)
            {
                SetProperty(segments[0], TonValue.From(value));
                return;
            }

            // Navigate or create child object
            var child = GetChild(segments[0]);
            if (child == null)
            {
                child = new TonObject { ClassName = segments[0] };
                AddChild(child);
            }

            child.SetValue(segments.Skip(1).ToArray(), value);
        }

        private static bool IsSimpleType(Type type)
        {
            return type.IsPrimitive ||
                   type == typeof(string) ||
                   type == typeof(decimal) ||
                   type == typeof(DateTime) ||
                   type == typeof(DateTimeOffset) ||
                   type == typeof(TimeSpan) ||
                   type == typeof(Guid) ||
                   type.IsEnum ||
                   (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(Nullable<>) && IsSimpleType(type.GetGenericArguments()[0]));
        }

        private static object? ConvertValue(object value, Type targetType)
        {
            if (value == null) return null;

            if (targetType == typeof(string))
                return value.ToString();

            if (targetType == typeof(int) || targetType == typeof(int?))
                return Convert.ToInt32(value);

            if (targetType == typeof(long) || targetType == typeof(long?))
                return Convert.ToInt64(value);

            if (targetType == typeof(double) || targetType == typeof(double?))
                return Convert.ToDouble(value);

            if (targetType == typeof(bool) || targetType == typeof(bool?))
                return Convert.ToBoolean(value);

            if (targetType == typeof(Guid) || targetType == typeof(Guid?))
            {
                if (value is string str)
                    return Guid.Parse(str);
                return value;
            }

            return value;
        }

        /// <summary>
        /// Converts this TON object to a typed object
        /// </summary>
        public T ToObject<T>() where T : new()
        {
            var result = new T();
            var type = typeof(T);

            // Map properties
            foreach (var prop in Properties)
            {
                var propertyName = prop.Key.TrimStart('@');
                var propertyInfo = type.GetProperty(propertyName,
                    BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);

                if (propertyInfo != null && propertyInfo.CanWrite)
                {
                    try
                    {
                        var value = prop.Value.ConvertTo(propertyInfo.PropertyType);
                        propertyInfo.SetValue(result, value);
                    }
                    catch
                    {
                        // Skip properties that can't be converted
                    }
                }
            }

            // Map child objects to collection properties
            var collectionProperties = type.GetProperties()
                .Where(p => p.PropertyType != typeof(string) &&
                           typeof(IEnumerable).IsAssignableFrom(p.PropertyType));

            foreach (var collProp in collectionProperties)
            {
                // Check if property has an array value
                var propValue = GetProperty(collProp.Name);
                if (propValue != null && propValue.Type == TonValueType.Array && propValue.Value is List<object> arrayList)
                {
                    var elementType = collProp.PropertyType.IsArray
                        ? collProp.PropertyType.GetElementType()
                        : collProp.PropertyType.IsGenericType
                            ? collProp.PropertyType.GetGenericArguments()[0]
                            : typeof(object);

                    if (collProp.PropertyType.IsArray)
                    {
                        // Create array
                        var array = Array.CreateInstance(elementType!, arrayList.Count);
                        for (int i = 0; i < arrayList.Count; i++)
                        {
                            var convertedValue = ConvertValue(arrayList[i], elementType!);
                            array.SetValue(convertedValue, i);
                        }
                        collProp.SetValue(result, array);
                    }
                    else
                    {
                        // Create list
                        var listType = typeof(List<>).MakeGenericType(elementType!);
                        var list = Activator.CreateInstance(listType) as IList;
                        foreach (var item in arrayList)
                        {
                            var convertedValue = ConvertValue(item, elementType!);
                            list?.Add(convertedValue);
                        }
                        collProp.SetValue(result, list);
                    }
                }
                else
                {
                    // Handle child objects as collection items (legacy support)
                    var elementType = collProp.PropertyType.IsArray
                        ? collProp.PropertyType.GetElementType()
                        : collProp.PropertyType.IsGenericType
                            ? collProp.PropertyType.GetGenericArguments()[0]
                            : typeof(object);

                    var childrenOfType = GetChildren(collProp.Name);
                    if (childrenOfType.Any())
                    {
                        if (collProp.PropertyType.IsArray)
                        {
                            // Create array
                            var array = Array.CreateInstance(elementType!, childrenOfType.Count());
                            int index = 0;
                            foreach (var child in childrenOfType)
                            {
                                var childObj = Activator.CreateInstance(elementType!);
                                // Recursively convert child
                                // This would need more implementation for complex types
                                array.SetValue(childObj, index++);
                            }
                            collProp.SetValue(result, array);
                        }
                        else
                        {
                            // Create list
                            var listType = typeof(List<>).MakeGenericType(elementType!);
                            var list = Activator.CreateInstance(listType) as IList;

                            foreach (var child in childrenOfType)
                            {
                                var childObj = Activator.CreateInstance(elementType!);
                                // Recursively convert child
                                // This would need more implementation for complex types
                                list?.Add(childObj);
                            }
                            collProp.SetValue(result, list);
                        }
                    }
                }
            }

            return result;
        }

        /// <summary>
        /// Creates a TON object from a typed object
        /// </summary>
        public static TonObject FromObject(object obj)
        {
            if (obj == null)
                throw new ArgumentNullException(nameof(obj));

            var tonObject = new TonObject();
            var type = obj.GetType();

            // Set class name from type
            tonObject.ClassName = type.Name;

            // Map properties
            foreach (var prop in type.GetProperties(BindingFlags.Public | BindingFlags.Instance))
            {
                if (!prop.CanRead)
                    continue;

                // Skip indexers
                if (prop.GetIndexParameters().Length > 0)
                    continue;

                var value = prop.GetValue(obj);
                if (value == null)
                    continue;

                // Check if it's a collection
                if (value is IEnumerable enumerable && !(value is string))
                {
                    // Check if items are simple types (not custom objects)
                    var itemType = value.GetType().IsArray
                        ? value.GetType().GetElementType()
                        : value.GetType().IsGenericType
                            ? value.GetType().GetGenericArguments().FirstOrDefault()
                            : null;

                    if (itemType != null && IsSimpleType(itemType))
                    {
                        // Convert to array property
                        var list = new List<object>();
                        foreach (var item in enumerable)
                        {
                            list.Add(item);
                        }
                        tonObject.SetProperty(prop.Name, TonValue.From(list));
                    }
                    else
                    {
                        // Complex objects - add as children
                        foreach (var item in enumerable)
                        {
                            if (item != null)
                            {
                                var childObject = FromObject(item);
                                childObject.ClassName = prop.Name;
                                tonObject.AddChild(childObject);
                            }
                        }
                    }
                }
                else
                {
                    // Regular property
                    tonObject.SetProperty(prop.Name, TonValue.From(value));
                }
            }

            return tonObject;
        }
    }
}