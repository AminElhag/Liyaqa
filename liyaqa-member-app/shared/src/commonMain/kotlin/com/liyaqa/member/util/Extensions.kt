package com.liyaqa.member.util

import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.LocalTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime

/**
 * Extension functions for common operations across the app.
 */

// DateTime extensions
// Note: Instant.toLocalDateTime(TimeZone) is already provided by kotlinx-datetime stdlib

fun LocalDate.Companion.now(timeZone: TimeZone = TimeZone.currentSystemDefault()): LocalDate =
    Clock.System.now().toLocalDateTime(timeZone).date

fun LocalDateTime.Companion.now(timeZone: TimeZone = TimeZone.currentSystemDefault()): LocalDateTime =
    Clock.System.now().toLocalDateTime(timeZone)

fun LocalDate.formatDisplay(): String = "$dayOfMonth/${monthNumber}/$year"

fun LocalTime.formatDisplay(): String {
    val hour = hour.toString().padStart(2, '0')
    val minute = minute.toString().padStart(2, '0')
    return "$hour:$minute"
}

fun LocalDateTime.formatDisplay(): String = "${date.formatDisplay()} ${time.formatDisplay()}"

// String extensions
fun String?.orEmpty(): String = this ?: ""

fun String.capitalizeFirst(): String =
    if (isEmpty()) this else this[0].uppercaseChar() + substring(1)

// List extensions
fun <T> List<T>.safeGet(index: Int): T? = if (index in indices) get(index) else null

// Money formatting (KMP-compatible, no String.format)
fun Double.formatMoney(currency: String = "SAR"): String {
    val formatted = ((this * 100).toLong() / 100.0).toString()
    val parts = formatted.split(".")
    val decimal = parts.getOrElse(1) { "00" }.padEnd(2, '0').take(2)
    return "$currency ${parts[0]}.$decimal"
}

fun Long.formatMoney(currency: String = "SAR"): String {
    val value = this.toDouble() / 100
    val formatted = ((value * 100).toLong() / 100.0).toString()
    val parts = formatted.split(".")
    val decimal = parts.getOrElse(1) { "00" }.padEnd(2, '0').take(2)
    return "$currency ${parts[0]}.$decimal"
}

// Duration formatting
fun Int.formatDuration(): String {
    val hours = this / 60
    val minutes = this % 60
    return when {
        hours > 0 && minutes > 0 -> "${hours}h ${minutes}m"
        hours > 0 -> "${hours}h"
        else -> "${minutes}m"
    }
}

// Days remaining
fun Int.formatDaysRemaining(): String = when {
    this <= 0 -> "Expired"
    this == 1 -> "1 day"
    else -> "$this days"
}

fun Int.formatDaysRemainingAr(): String = when {
    this <= 0 -> "منتهية"
    this == 1 -> "يوم واحد"
    this == 2 -> "يومان"
    this in 3..10 -> "$this أيام"
    else -> "$this يوماً"
}
