package com.liyaqa.shared.infrastructure.export

import org.springframework.stereotype.Component
import java.io.ByteArrayOutputStream
import java.io.OutputStreamWriter
import java.nio.charset.StandardCharsets
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

/**
 * Utility class for generating CSV exports.
 *
 * Features:
 * - UTF-8 encoding with BOM for Excel compatibility
 * - Proper escaping of special characters
 * - Bilingual header support (English/Arabic)
 * - Consistent date/time formatting
 */
@Component
class CsvExportWriter {

    companion object {
        private const val CSV_SEPARATOR = ","
        private const val CSV_QUOTE = "\""
        private const val CSV_NEW_LINE = "\r\n"
        private val UTF8_BOM = byteArrayOf(0xEF.toByte(), 0xBB.toByte(), 0xBF.toByte())

        private val DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd")
        private val DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
    }

    /**
     * Generates a CSV file with UTF-8 BOM for Excel compatibility.
     *
     * @param headers List of column headers
     * @param rows List of rows, each row is a list of values
     * @return ByteArray containing the CSV content
     */
    fun write(headers: List<String>, rows: List<List<Any?>>): ByteArray {
        val outputStream = ByteArrayOutputStream()

        // Write UTF-8 BOM for Excel compatibility
        outputStream.write(UTF8_BOM)

        OutputStreamWriter(outputStream, StandardCharsets.UTF_8).use { writer ->
            // Write headers
            writer.write(headers.joinToString(CSV_SEPARATOR) { escapeValue(it) })
            writer.write(CSV_NEW_LINE)

            // Write data rows
            for (row in rows) {
                writer.write(row.joinToString(CSV_SEPARATOR) { escapeValue(formatValue(it)) })
                writer.write(CSV_NEW_LINE)
            }
        }

        return outputStream.toByteArray()
    }

    /**
     * Generates a CSV with bilingual headers (English on first row, Arabic on second).
     *
     * @param headersEn English headers
     * @param headersAr Arabic headers
     * @param rows Data rows
     * @return ByteArray containing the CSV content
     */
    fun writeWithBilingualHeaders(
        headersEn: List<String>,
        headersAr: List<String>,
        rows: List<List<Any?>>
    ): ByteArray {
        val outputStream = ByteArrayOutputStream()

        // Write UTF-8 BOM
        outputStream.write(UTF8_BOM)

        OutputStreamWriter(outputStream, StandardCharsets.UTF_8).use { writer ->
            // Write English headers
            writer.write(headersEn.joinToString(CSV_SEPARATOR) { escapeValue(it) })
            writer.write(CSV_NEW_LINE)

            // Write Arabic headers
            writer.write(headersAr.joinToString(CSV_SEPARATOR) { escapeValue(it) })
            writer.write(CSV_NEW_LINE)

            // Write data rows
            for (row in rows) {
                writer.write(row.joinToString(CSV_SEPARATOR) { escapeValue(formatValue(it)) })
                writer.write(CSV_NEW_LINE)
            }
        }

        return outputStream.toByteArray()
    }

    /**
     * Formats a value for CSV output.
     */
    private fun formatValue(value: Any?): String {
        return when (value) {
            null -> ""
            is LocalDate -> value.format(DATE_FORMATTER)
            is LocalDateTime -> value.format(DATETIME_FORMATTER)
            is java.time.Instant -> DATETIME_FORMATTER.format(value.atZone(java.time.ZoneId.systemDefault()))
            is Boolean -> if (value) "Yes" else "No"
            is Number -> value.toString()
            is Enum<*> -> value.name
            else -> value.toString()
        }
    }

    /**
     * Escapes a value for CSV (handles quotes, commas, newlines).
     */
    private fun escapeValue(value: String): String {
        // If the value contains special characters, wrap in quotes and escape existing quotes
        return if (value.contains(CSV_SEPARATOR) ||
            value.contains(CSV_QUOTE) ||
            value.contains("\n") ||
            value.contains("\r")
        ) {
            CSV_QUOTE + value.replace(CSV_QUOTE, CSV_QUOTE + CSV_QUOTE) + CSV_QUOTE
        } else {
            value
        }
    }
}

/**
 * Enum representing available export types.
 */
enum class ExportType(val filenamePrefix: String, val displayName: String, val displayNameAr: String) {
    MEMBERS("members", "Members Export", "تصدير الأعضاء"),
    SUBSCRIPTIONS("subscriptions", "Subscriptions Export", "تصدير الاشتراكات"),
    INVOICES("invoices", "Invoices Export", "تصدير الفواتير"),
    ATTENDANCE("attendance", "Attendance Export", "تصدير الحضور"),
    BOOKINGS("bookings", "Bookings Export", "تصدير الحجوزات"),
    CLASSES("classes", "Classes Export", "تصدير الحصص"),
    PAYMENTS("payments", "Payments Export", "تصدير المدفوعات")
}
