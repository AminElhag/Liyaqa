package com.liyaqa.shared.domain.model

import java.time.LocalDate
import java.time.LocalTime

/**
 * Prayer calculation methods supported for prayer time calculation.
 * UMM_AL_QURA is the official Saudi method.
 */
enum class PrayerCalculationMethod {
    /** Umm Al-Qura University, Makkah - Official Saudi Arabia method */
    UMM_AL_QURA,
    /** Muslim World League */
    MUSLIM_WORLD_LEAGUE,
    /** Egyptian General Authority of Survey */
    EGYPTIAN,
    /** University of Islamic Sciences, Karachi */
    KARACHI,
    /** Islamic Society of North America */
    ISNA,
    /** Union of Islamic Organizations of France */
    UOIF,
    /** Dubai - UAE */
    DUBAI,
    /** Qatar */
    QATAR,
    /** Kuwait */
    KUWAIT,
    /** Singapore */
    SINGAPORE
}

/**
 * Represents prayer times for a specific date and location.
 */
data class PrayerTime(
    val date: LocalDate,
    val fajr: LocalTime,
    val sunrise: LocalTime,
    val dhuhr: LocalTime,
    val asr: LocalTime,
    val maghrib: LocalTime,
    val isha: LocalTime
) {
    /**
     * Returns the next prayer time from the given current time.
     */
    fun getNextPrayer(currentTime: LocalTime): NextPrayer {
        return when {
            currentTime.isBefore(fajr) -> NextPrayer("FAJR", fajr)
            currentTime.isBefore(sunrise) -> NextPrayer("SUNRISE", sunrise)
            currentTime.isBefore(dhuhr) -> NextPrayer("DHUHR", dhuhr)
            currentTime.isBefore(asr) -> NextPrayer("ASR", asr)
            currentTime.isBefore(maghrib) -> NextPrayer("MAGHRIB", maghrib)
            currentTime.isBefore(isha) -> NextPrayer("ISHA", isha)
            else -> NextPrayer("FAJR", fajr) // Next day's Fajr
        }
    }

    /**
     * Checks if the given time is during prayer time.
     * @param currentTime The time to check
     * @param bufferMinutes Minutes before and after prayer to consider as "during prayer"
     */
    fun isDuringPrayerTime(currentTime: LocalTime, bufferMinutes: Int = 30): Boolean {
        val prayers = listOf(fajr, dhuhr, asr, maghrib, isha)
        return prayers.any { prayerTime ->
            val start = prayerTime.minusMinutes(5)
            val end = prayerTime.plusMinutes(bufferMinutes.toLong())
            !currentTime.isBefore(start) && !currentTime.isAfter(end)
        }
    }

    /**
     * Returns the current prayer period or null if not during prayer.
     */
    fun getCurrentPrayerPeriod(currentTime: LocalTime, bufferMinutes: Int = 30): String? {
        val prayers = listOf(
            "FAJR" to fajr,
            "DHUHR" to dhuhr,
            "ASR" to asr,
            "MAGHRIB" to maghrib,
            "ISHA" to isha
        )

        for ((name, prayerTime) in prayers) {
            val start = prayerTime.minusMinutes(5)
            val end = prayerTime.plusMinutes(bufferMinutes.toLong())
            if (!currentTime.isBefore(start) && !currentTime.isAfter(end)) {
                return name
            }
        }
        return null
    }
}

/**
 * Represents the next upcoming prayer.
 */
data class NextPrayer(
    val name: String,
    val time: LocalTime
)

/**
 * Prayer settings embedded in Club entity.
 */
data class PrayerSettings(
    val city: String?,
    val latitude: Double?,
    val longitude: Double?,
    val calculationMethod: PrayerCalculationMethod,
    val bufferMinutes: Int,
    val blockCheckinDuringPrayer: Boolean
) {
    fun isConfigured(): Boolean = latitude != null && longitude != null
}
