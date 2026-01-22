package com.liyaqa.shared.infrastructure.prayer

import com.batoulapps.adhan.CalculationMethod
import com.batoulapps.adhan.CalculationParameters
import com.batoulapps.adhan.Coordinates
import com.batoulapps.adhan.PrayerTimes
import com.batoulapps.adhan.data.DateComponents
import com.liyaqa.organization.domain.model.Club
import com.liyaqa.organization.domain.ports.ClubRepository
import com.liyaqa.shared.domain.model.PrayerCalculationMethod
import com.liyaqa.shared.domain.model.PrayerTime
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.util.TimeZone
import java.util.UUID

/**
 * Service for calculating Islamic prayer times using the Adhan library.
 * Supports multiple calculation methods including the official Saudi Umm Al-Qura method.
 */
@Service
class PrayerTimeService(
    private val clubRepository: ClubRepository
) {
    private val logger = LoggerFactory.getLogger(PrayerTimeService::class.java)

    companion object {
        /** Saudi Arabia timezone */
        private val SAUDI_TIMEZONE = ZoneId.of("Asia/Riyadh")

        /** Pre-configured Saudi cities with their coordinates */
        val SAUDI_CITIES = mapOf(
            "Riyadh" to Pair(24.7136, 46.6753),
            "Jeddah" to Pair(21.4858, 39.1925),
            "Makkah" to Pair(21.4225, 39.8262),
            "Madinah" to Pair(24.5247, 39.5692),
            "Dammam" to Pair(26.4207, 50.0888),
            "Khobar" to Pair(26.2172, 50.1971),
            "Dhahran" to Pair(26.2361, 50.0393),
            "Tabuk" to Pair(28.3998, 36.5715),
            "Abha" to Pair(18.2164, 42.5053),
            "Taif" to Pair(21.4373, 40.5127),
            "Hofuf" to Pair(25.3648, 49.5878),
            "Jubail" to Pair(27.0046, 49.6225),
            "Yanbu" to Pair(24.0895, 38.0618),
            "Buraidah" to Pair(26.3260, 43.9750),
            "Najran" to Pair(17.4933, 44.1277),
            "Jizan" to Pair(16.8893, 42.5611),
            "Hail" to Pair(27.5114, 41.7208),
            "Arar" to Pair(30.9753, 41.0382),
            "Sakaka" to Pair(29.9697, 40.2064),
            "Al Bahah" to Pair(20.0129, 41.4677)
        )
    }

    /**
     * Calculates prayer times for a club on a specific date.
     * @param clubId The club ID to get settings from
     * @param date The date to calculate prayer times for (defaults to today)
     * @return PrayerTime object or null if club not configured
     */
    fun getPrayerTimesForClub(clubId: UUID, date: LocalDate = LocalDate.now()): PrayerTime? {
        val club = clubRepository.findById(clubId).orElse(null) ?: return null

        val latitude = club.latitude ?: return null
        val longitude = club.longitude ?: return null

        return calculatePrayerTimes(
            latitude = latitude,
            longitude = longitude,
            date = date,
            method = club.prayerCalculationMethod
        )
    }

    /**
     * Calculates prayer times for a week starting from the given date.
     */
    fun getWeeklyPrayerTimes(clubId: UUID, startDate: LocalDate = LocalDate.now()): List<PrayerTime> {
        val club = clubRepository.findById(clubId).orElse(null) ?: return emptyList()

        val latitude = club.latitude ?: return emptyList()
        val longitude = club.longitude ?: return emptyList()

        return (0L until 7).map { offset ->
            calculatePrayerTimes(
                latitude = latitude,
                longitude = longitude,
                date = startDate.plusDays(offset),
                method = club.prayerCalculationMethod
            )
        }
    }

    /**
     * Calculates prayer times for a specific location and date.
     */
    fun calculatePrayerTimes(
        latitude: Double,
        longitude: Double,
        date: LocalDate,
        method: PrayerCalculationMethod = PrayerCalculationMethod.UMM_AL_QURA
    ): PrayerTime {
        val coordinates = Coordinates(latitude, longitude)
        val params = getCalculationParameters(method)
        val dateComponents = DateComponents(date.year, date.monthValue, date.dayOfMonth)

        val prayerTimes = PrayerTimes(coordinates, dateComponents, params)

        // Convert to LocalTime using Saudi timezone
        val timezone = TimeZone.getTimeZone(SAUDI_TIMEZONE)

        return PrayerTime(
            date = date,
            fajr = convertToLocalTime(prayerTimes.fajr, timezone),
            sunrise = convertToLocalTime(prayerTimes.sunrise, timezone),
            dhuhr = convertToLocalTime(prayerTimes.dhuhr, timezone),
            asr = convertToLocalTime(prayerTimes.asr, timezone),
            maghrib = convertToLocalTime(prayerTimes.maghrib, timezone),
            isha = convertToLocalTime(prayerTimes.isha, timezone)
        )
    }

    /**
     * Checks if check-in should be blocked for a club at the given time.
     */
    fun shouldBlockCheckIn(clubId: UUID, currentTime: LocalTime = LocalTime.now()): Boolean {
        val club = clubRepository.findById(clubId).orElse(null) ?: return false

        if (!club.blockCheckinDuringPrayer) return false

        val prayerTimes = getPrayerTimesForClub(clubId) ?: return false
        return prayerTimes.isDuringPrayerTime(currentTime, club.prayerBufferMinutes)
    }

    /**
     * Gets the current prayer period for a club, or null if not during prayer.
     */
    fun getCurrentPrayerPeriod(clubId: UUID, currentTime: LocalTime = LocalTime.now()): String? {
        val club = clubRepository.findById(clubId).orElse(null) ?: return null
        val prayerTimes = getPrayerTimesForClub(clubId) ?: return null
        return prayerTimes.getCurrentPrayerPeriod(currentTime, club.prayerBufferMinutes)
    }

    /**
     * Gets coordinates for a known Saudi city.
     */
    fun getCityCoordinates(cityName: String): Pair<Double, Double>? {
        return SAUDI_CITIES[cityName]
    }

    /**
     * Returns list of supported Saudi cities.
     */
    fun getSupportedCities(): List<String> = SAUDI_CITIES.keys.toList().sorted()

    private fun getCalculationParameters(method: PrayerCalculationMethod): CalculationParameters {
        return when (method) {
            PrayerCalculationMethod.UMM_AL_QURA -> CalculationMethod.UMM_AL_QURA.parameters
            PrayerCalculationMethod.MUSLIM_WORLD_LEAGUE -> CalculationMethod.MUSLIM_WORLD_LEAGUE.parameters
            PrayerCalculationMethod.EGYPTIAN -> CalculationMethod.EGYPTIAN.parameters
            PrayerCalculationMethod.KARACHI -> CalculationMethod.KARACHI.parameters
            PrayerCalculationMethod.ISNA -> CalculationMethod.NORTH_AMERICA.parameters
            PrayerCalculationMethod.UOIF -> CalculationMethod.OTHER.parameters.also {
                it.fajrAngle = 12.0
                it.ishaAngle = 12.0
            }
            PrayerCalculationMethod.DUBAI -> CalculationMethod.DUBAI.parameters
            PrayerCalculationMethod.QATAR -> CalculationMethod.QATAR.parameters
            PrayerCalculationMethod.KUWAIT -> CalculationMethod.KUWAIT.parameters
            PrayerCalculationMethod.SINGAPORE -> CalculationMethod.SINGAPORE.parameters
        }
    }

    private fun convertToLocalTime(date: java.util.Date, timezone: TimeZone): LocalTime {
        val instant = date.toInstant()
        val zonedDateTime = instant.atZone(timezone.toZoneId())
        return zonedDateTime.toLocalTime()
    }
}
