package com.liyaqa.member.core.localization

import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import com.liyaqa.member.ui.theme.LocalAppLocale
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlinx.datetime.LocalTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime

/**
 * Gets the current app locale from composition local.
 */
val currentLocale: String
    @Composable
    @ReadOnlyComposable
    get() = LocalAppLocale.current

/**
 * Extension to get localized string based on current locale.
 */
@Composable
@ReadOnlyComposable
fun LocalizedText.localized(): String {
    return localized(currentLocale)
}

/**
 * Formats a date for display based on locale.
 * Arabic uses YYYY/MM/DD format.
 * English uses DD/MM/YYYY format.
 */
fun LocalDate.formatForDisplay(locale: String): String {
    val day = dayOfMonth.toString().padStart(2, '0')
    val month = monthNumber.toString().padStart(2, '0')
    val year = year.toString()

    return when (locale) {
        "ar" -> "$year/$month/$day" // Arabic format: YYYY/MM/DD
        else -> "$day/$month/$year" // English format: DD/MM/YYYY
    }
}

/**
 * Formats a time for display based on locale.
 * Uses 12-hour format with AM/PM for English and ص/م for Arabic.
 */
fun LocalTime.formatForDisplay(locale: String): String {
    val hourValue = hour
    val minuteValue = minute.toString().padStart(2, '0')

    return when (locale) {
        "ar" -> {
            val period = if (hourValue < 12) "ص" else "م"
            val displayHour = when {
                hourValue == 0 -> 12
                hourValue > 12 -> hourValue - 12
                else -> hourValue
            }
            "$displayHour:$minuteValue $period"
        }
        else -> {
            val period = if (hourValue < 12) "AM" else "PM"
            val displayHour = when {
                hourValue == 0 -> 12
                hourValue > 12 -> hourValue - 12
                else -> hourValue
            }
            "$displayHour:$minuteValue $period"
        }
    }
}

/**
 * Formats an Instant for display based on locale.
 * Combines date and time formatting.
 */
fun Instant.formatForDisplay(
    locale: String,
    timeZone: TimeZone = TimeZone.currentSystemDefault()
): String {
    val localDateTime = this.toLocalDateTime(timeZone)
    val date = localDateTime.date.formatForDisplay(locale)
    val time = localDateTime.time.formatForDisplay(locale)
    return "$date $time"
}

/**
 * Formats date only from an Instant.
 */
fun Instant.formatDateOnly(
    locale: String,
    timeZone: TimeZone = TimeZone.currentSystemDefault()
): String {
    return this.toLocalDateTime(timeZone).date.formatForDisplay(locale)
}

/**
 * Formats time only from an Instant.
 */
fun Instant.formatTimeOnly(
    locale: String,
    timeZone: TimeZone = TimeZone.currentSystemDefault()
): String {
    return this.toLocalDateTime(timeZone).time.formatForDisplay(locale)
}

/**
 * Formats duration in minutes for display.
 * Returns "X min" in English and "X دقيقة" in Arabic.
 */
fun formatDuration(minutes: Int, locale: String): String {
    return when (locale) {
        "ar" -> "$minutes دقيقة"
        else -> "$minutes min"
    }
}

/**
 * Formats duration from hours and minutes.
 */
fun formatDurationHoursMinutes(hours: Int, minutes: Int, locale: String): String {
    return when (locale) {
        "ar" -> when {
            hours > 0 && minutes > 0 -> "$hours ساعة و $minutes دقيقة"
            hours > 0 -> "$hours ساعة"
            else -> "$minutes دقيقة"
        }
        else -> when {
            hours > 0 && minutes > 0 -> "${hours}h ${minutes}m"
            hours > 0 -> "${hours}h"
            else -> "${minutes}m"
        }
    }
}

/**
 * Formats currency amount for display.
 * Returns "SAR X.XX" in English and "X.XX ريال" in Arabic.
 */
fun formatCurrency(amount: Double, currency: String = "SAR", locale: String): String {
    val formattedAmount = formatDecimal(amount, 2)
    return when (locale) {
        "ar" -> "$formattedAmount ريال"
        else -> "$currency $formattedAmount"
    }
}

/**
 * Formats currency amount with integer when no decimal needed.
 */
fun formatCurrencyCompact(amount: Double, currency: String = "SAR", locale: String): String {
    val formattedAmount = if (amount % 1.0 == 0.0) {
        amount.toInt().toString()
    } else {
        formatDecimal(amount, 2)
    }
    return when (locale) {
        "ar" -> "$formattedAmount ريال"
        else -> "$currency $formattedAmount"
    }
}

/**
 * Formats a countdown timer for display (e.g., "05:30" for 5 minutes 30 seconds).
 */
fun formatCountdown(totalSeconds: Long): String {
    if (totalSeconds <= 0) return "00:00"
    val minutes = (totalSeconds / 60).toInt()
    val seconds = (totalSeconds % 60).toInt()
    return "${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}"
}

/**
 * Formats countdown with hours when needed.
 */
fun formatCountdownExtended(totalSeconds: Long): String {
    if (totalSeconds <= 0) return "00:00"

    val hours = (totalSeconds / 3600).toInt()
    val minutes = ((totalSeconds % 3600) / 60).toInt()
    val seconds = (totalSeconds % 60).toInt()

    return if (hours > 0) {
        "${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}"
    } else {
        "${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}"
    }
}

/**
 * Returns relative time description (e.g., "2 hours ago", "قبل ساعتين").
 */
fun Instant.relativeTime(locale: String, now: Instant = Clock.System.now()): String {
    val diffSeconds = (now - this).inWholeSeconds
    val diffMinutes = diffSeconds / 60
    val diffHours = diffMinutes / 60
    val diffDays = diffHours / 24

    return when (locale) {
        "ar" -> when {
            diffSeconds < 60 -> "الآن"
            diffMinutes < 60 -> "قبل $diffMinutes دقيقة"
            diffHours < 24 -> "قبل $diffHours ساعة"
            diffDays < 7 -> "قبل $diffDays يوم"
            else -> this.toLocalDateTime(TimeZone.currentSystemDefault()).date.formatForDisplay(locale)
        }
        else -> when {
            diffSeconds < 60 -> "Just now"
            diffMinutes < 60 -> "$diffMinutes min ago"
            diffHours < 24 -> "$diffHours hours ago"
            diffDays < 7 -> "$diffDays days ago"
            else -> this.toLocalDateTime(TimeZone.currentSystemDefault()).date.formatForDisplay(locale)
        }
    }
}

/**
 * Returns future time description (e.g., "in 2 hours", "بعد ساعتين").
 */
fun Instant.futureTime(locale: String, now: Instant = Clock.System.now()): String {
    val diffSeconds = (this - now).inWholeSeconds
    if (diffSeconds <= 0) return relativeTime(locale, now)

    val diffMinutes = diffSeconds / 60
    val diffHours = diffMinutes / 60
    val diffDays = diffHours / 24

    return when (locale) {
        "ar" -> when {
            diffSeconds < 60 -> "الآن"
            diffMinutes < 60 -> "بعد $diffMinutes دقيقة"
            diffHours < 24 -> "بعد $diffHours ساعة"
            diffDays < 7 -> "بعد $diffDays يوم"
            else -> this.toLocalDateTime(TimeZone.currentSystemDefault()).date.formatForDisplay(locale)
        }
        else -> when {
            diffSeconds < 60 -> "Now"
            diffMinutes < 60 -> "in $diffMinutes min"
            diffHours < 24 -> "in $diffHours hours"
            diffDays < 7 -> "in $diffDays days"
            else -> this.toLocalDateTime(TimeZone.currentSystemDefault()).date.formatForDisplay(locale)
        }
    }
}

/**
 * Formats a number with proper pluralization hints.
 * Note: Full pluralization would require more complex rules for Arabic.
 */
fun formatNumber(value: Int, locale: String): String {
    return value.toString()
}

/**
 * Formats percentage for display.
 */
fun formatPercentage(value: Float, locale: String): String {
    val formatted = value.toInt().toString()
    return when (locale) {
        "ar" -> "$formatted٪"
        else -> "$formatted%"
    }
}

/**
 * Helper function to format decimal numbers without using JVM-specific String.format().
 * Works on all Kotlin targets (JVM, Native, JS).
 */
private fun formatDecimal(value: Double, decimalPlaces: Int): String {
    // Calculate factor manually (10^decimalPlaces)
    var factor = 1.0
    repeat(decimalPlaces) { factor *= 10.0 }

    val rounded = kotlin.math.round(value * factor) / factor
    val parts = rounded.toString().split(".")
    val intPart = parts[0]
    val decPart = if (parts.size > 1) parts[1] else ""
    val paddedDecPart = decPart.padEnd(decimalPlaces, '0').take(decimalPlaces)
    return "$intPart.$paddedDecPart"
}
