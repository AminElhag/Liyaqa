package com.liyaqa.shared.infrastructure.calendar

import com.liyaqa.shared.domain.model.HijriDate
import com.liyaqa.shared.domain.model.IslamicEvent
import com.liyaqa.shared.domain.model.IslamicEventInfo
import org.springframework.stereotype.Service
import java.time.LocalDate
import java.time.chrono.HijrahChronology
import java.time.chrono.HijrahDate

/**
 * Service for converting between Gregorian and Hijri (Islamic) calendar dates.
 * Uses Java's built-in HijrahChronology which implements the Umm Al-Qura calendar,
 * the official calendar of Saudi Arabia.
 */
@Service
class HijriDateConverter {

    /**
     * Converts a Gregorian date to Hijri date.
     */
    fun toHijri(gregorianDate: LocalDate): HijriDate {
        val hijrahDate = HijrahDate.from(gregorianDate)
        return HijriDate(
            year = hijrahDate.get(java.time.temporal.ChronoField.YEAR),
            month = hijrahDate.get(java.time.temporal.ChronoField.MONTH_OF_YEAR),
            day = hijrahDate.get(java.time.temporal.ChronoField.DAY_OF_MONTH)
        )
    }

    /**
     * Converts a Hijri date to Gregorian date.
     */
    fun toGregorian(hijriDate: HijriDate): LocalDate {
        val hijrahDate = HijrahChronology.INSTANCE.date(hijriDate.year, hijriDate.month, hijriDate.day)
        return LocalDate.from(hijrahDate)
    }

    /**
     * Gets today's date in Hijri calendar.
     */
    fun todayHijri(): HijriDate = toHijri(LocalDate.now())

    /**
     * Gets the current Hijri year.
     */
    fun currentHijriYear(): Int = todayHijri().year

    /**
     * Gets Islamic events for a given Hijri year.
     */
    fun getIslamicEventsForYear(hijriYear: Int): List<IslamicEventInfo> {
        return IslamicEvent.entries.map { event ->
            val hijriDate = event.getDateForYear(hijriYear)
            val gregorianDate = try {
                toGregorian(hijriDate)
            } catch (e: Exception) {
                null // Date might be out of supported range
            }
            IslamicEventInfo(
                event = event,
                hijriDate = hijriDate,
                gregorianDate = gregorianDate,
                isPublicHoliday = event.isPublicHoliday
            )
        }
    }

    /**
     * Gets Islamic events for the current Hijri year.
     */
    fun getIslamicEventsThisYear(): List<IslamicEventInfo> {
        return getIslamicEventsForYear(currentHijriYear())
    }

    /**
     * Gets upcoming Islamic events within the next N days.
     */
    fun getUpcomingEvents(daysAhead: Int = 30): List<IslamicEventInfo> {
        val today = LocalDate.now()
        val endDate = today.plusDays(daysAhead.toLong())
        val currentYear = currentHijriYear()

        // Check current year and next year for events
        val allEvents = getIslamicEventsForYear(currentYear) + getIslamicEventsForYear(currentYear + 1)

        return allEvents
            .filter { it.gregorianDate != null }
            .filter { it.gregorianDate!! in today..endDate }
            .sortedBy { it.gregorianDate }
            .distinctBy { it.event } // Remove duplicates across years
    }

    /**
     * Gets the number of days in a Hijri month.
     * In the Umm Al-Qura calendar, months alternate between 29 and 30 days,
     * but this can vary based on moon sighting calculations.
     */
    fun getDaysInMonth(hijriYear: Int, hijriMonth: Int): Int {
        return try {
            val hijrahDate = HijrahChronology.INSTANCE.date(hijriYear, hijriMonth, 1)
            hijrahDate.lengthOfMonth()
        } catch (e: Exception) {
            // Default to 30 if date is out of range
            if (hijriMonth % 2 == 1) 30 else 29
        }
    }

    /**
     * Checks if a Hijri year is a leap year.
     * In the Umm Al-Qura calendar, leap years have an extra day in Dhu al-Hijjah.
     */
    fun isLeapYear(hijriYear: Int): Boolean {
        return try {
            val hijrahDate = HijrahChronology.INSTANCE.date(hijriYear, 1, 1)
            hijrahDate.isLeapYear
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Checks if the current period is Ramadan.
     */
    fun isRamadan(): Boolean {
        val today = todayHijri()
        return today.month == 9 // Ramadan is month 9
    }

    /**
     * Gets the start and end dates of Ramadan for a given Hijri year in Gregorian.
     */
    fun getRamadanDates(hijriYear: Int): Pair<LocalDate, LocalDate> {
        val start = toGregorian(HijriDate(hijriYear, 9, 1))
        val daysInRamadan = getDaysInMonth(hijriYear, 9)
        val end = toGregorian(HijriDate(hijriYear, 9, daysInRamadan))
        return Pair(start, end)
    }

    /**
     * Gets the days remaining until Ramadan.
     * Returns 0 if currently in Ramadan, negative if Ramadan has passed this year.
     */
    fun getDaysUntilRamadan(): Int {
        val today = todayHijri()
        val currentYear = today.year

        return when {
            today.month < 9 -> {
                // Ramadan hasn't started yet
                val ramadanStart = toGregorian(HijriDate(currentYear, 9, 1))
                java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), ramadanStart).toInt()
            }
            today.month == 9 -> {
                // Currently in Ramadan
                0
            }
            else -> {
                // Ramadan passed, calculate for next year
                val nextRamadanStart = toGregorian(HijriDate(currentYear + 1, 9, 1))
                java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), nextRamadanStart).toInt()
            }
        }
    }

    /**
     * Gets the current Hijri month info for display.
     */
    fun getCurrentMonthInfo(): HijriMonthInfo {
        val today = todayHijri()
        return HijriMonthInfo(
            year = today.year,
            month = today.month,
            monthNameEn = today.getMonthNameEn(),
            monthNameAr = today.getMonthNameAr(),
            daysInMonth = getDaysInMonth(today.year, today.month),
            currentDay = today.day
        )
    }
}

/**
 * Information about a Hijri month.
 */
data class HijriMonthInfo(
    val year: Int,
    val month: Int,
    val monthNameEn: String,
    val monthNameAr: String,
    val daysInMonth: Int,
    val currentDay: Int
)
