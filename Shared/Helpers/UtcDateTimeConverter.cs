using System.Text.Json;
using System.Text.Json.Serialization;

namespace IntelliFit.Shared.Helpers
{
    /// <summary>
    /// JSON Converter that ensures all DateTime values are treated as UTC for PostgreSQL compatibility
    /// </summary>
    public class UtcDateTimeConverter : JsonConverter<DateTime>
    {
        public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var dateTime = reader.GetDateTime();

            // If DateTime is already UTC, return as-is
            if (dateTime.Kind == DateTimeKind.Utc)
                return dateTime;

            // If DateTime is Unspecified, assume it's meant to be UTC
            if (dateTime.Kind == DateTimeKind.Unspecified)
                return DateTime.SpecifyKind(dateTime, DateTimeKind.Utc);

            // If DateTime is Local, convert to UTC
            return dateTime.ToUniversalTime();
        }

        public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
        {
            // Always write DateTime as UTC in ISO 8601 format
            var utcDateTime = value.Kind == DateTimeKind.Utc ? value : value.ToUniversalTime();
            writer.WriteStringValue(utcDateTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"));
        }
    }
}
