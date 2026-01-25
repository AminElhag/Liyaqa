package com.liyaqa.member.domain.model

import kotlinx.serialization.Serializable

/**
 * Prayer time information
 */
@Serializable
data class PrayerTime(
    val name: String,
    val nameAr: String,
    val time: String,
    val iqamaTime: String? = null
) {
    val localizedName: LocalizedText get() = LocalizedText(name, nameAr)
}

/**
 * Daily prayer times
 */
@Serializable
data class DailyPrayerTimes(
    val date: String,
    val fajr: PrayerTime,
    val sunrise: PrayerTime,
    val dhuhr: PrayerTime,
    val asr: PrayerTime,
    val maghrib: PrayerTime,
    val isha: PrayerTime
) {
    val allPrayers: List<PrayerTime>
        get() = listOf(fajr, sunrise, dhuhr, asr, maghrib, isha)

    fun nextPrayer(currentTime: String): PrayerTime? {
        return allPrayers.firstOrNull { it.time > currentTime }
    }
}

/**
 * Next prayer information
 */
@Serializable
data class NextPrayer(
    val name: String,
    val nameAr: String,
    val time: String,
    val remainingMinutes: Int
) {
    val localizedName: LocalizedText get() = LocalizedText(name, nameAr)

    val remainingDisplay: String get() = when {
        remainingMinutes < 1 -> "Now"
        remainingMinutes < 60 -> "${remainingMinutes}m"
        else -> {
            val hours = remainingMinutes / 60
            val mins = remainingMinutes % 60
            if (mins > 0) "${hours}h ${mins}m" else "${hours}h"
        }
    }

    val remainingDisplayAr: String get() = when {
        remainingMinutes < 1 -> "الآن"
        remainingMinutes < 60 -> "${remainingMinutes}د"
        else -> {
            val hours = remainingMinutes / 60
            val mins = remainingMinutes % 60
            if (mins > 0) "${hours}س ${mins}د" else "${hours}س"
        }
    }
}

/**
 * Check-in status during prayer time
 */
@Serializable
data class CheckInStatus(
    val isBlocked: Boolean,
    val reason: String? = null,
    val reasonAr: String? = null,
    val blockedUntil: String? = null
)
