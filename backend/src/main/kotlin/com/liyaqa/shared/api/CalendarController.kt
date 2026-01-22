package com.liyaqa.shared.api

import com.liyaqa.shared.domain.model.HijriDate
import com.liyaqa.shared.domain.model.IslamicEvent
import com.liyaqa.shared.infrastructure.calendar.HijriDateConverter
import com.liyaqa.shared.infrastructure.calendar.HijriMonthInfo
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate

@RestController
@RequestMapping("/api/calendar")
@Tag(name = "Calendar", description = "Islamic calendar conversion and events for Saudi Arabia market")
class CalendarController(
    private val hijriDateConverter: HijriDateConverter
) {

    /**
     * Gets today's date in Hijri calendar.
     */
    @GetMapping("/hijri/today")
    @Operation(summary = "Get today's date in Hijri calendar")
    fun getTodayHijri(): ResponseEntity<HijriDateResponse> {
        val hijriDate = hijriDateConverter.todayHijri()
        val monthInfo = hijriDateConverter.getCurrentMonthInfo()
        return ResponseEntity.ok(
            HijriDateResponse.from(hijriDate, LocalDate.now(), monthInfo)
        )
    }

    /**
     * Converts a Gregorian date to Hijri.
     */
    @GetMapping("/convert/to-hijri")
    @Operation(summary = "Convert Gregorian date to Hijri")
    fun convertToHijri(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) date: LocalDate
    ): ResponseEntity<HijriDateResponse> {
        val hijriDate = hijriDateConverter.toHijri(date)
        return ResponseEntity.ok(
            HijriDateResponse.from(hijriDate, date, null)
        )
    }

    /**
     * Converts a Hijri date to Gregorian.
     */
    @GetMapping("/convert/to-gregorian")
    @Operation(summary = "Convert Hijri date to Gregorian")
    fun convertToGregorian(
        @RequestParam year: Int,
        @RequestParam month: Int,
        @RequestParam day: Int
    ): ResponseEntity<GregorianDateResponse> {
        return try {
            val hijriDate = HijriDate(year, month, day)
            val gregorianDate = hijriDateConverter.toGregorian(hijriDate)
            ResponseEntity.ok(
                GregorianDateResponse(
                    gregorianDate = gregorianDate.toString(),
                    dayOfWeek = gregorianDate.dayOfWeek.name,
                    hijriDateFormatted = hijriDate.formatEn(),
                    hijriDateFormattedAr = hijriDate.formatAr()
                )
            )
        } catch (e: Exception) {
            ResponseEntity.badRequest().build()
        }
    }

    /**
     * Gets Islamic events for a given Hijri year.
     */
    @GetMapping("/islamic-events")
    @Operation(summary = "Get Islamic events for a Hijri year")
    fun getIslamicEvents(
        @RequestParam(required = false) year: Int?
    ): ResponseEntity<IslamicEventsResponse> {
        val hijriYear = year ?: hijriDateConverter.currentHijriYear()
        val events = hijriDateConverter.getIslamicEventsForYear(hijriYear)

        return ResponseEntity.ok(
            IslamicEventsResponse(
                hijriYear = hijriYear,
                events = events.map { eventInfo ->
                    IslamicEventDto(
                        code = eventInfo.event.name,
                        nameEn = eventInfo.event.nameEn,
                        nameAr = eventInfo.event.nameAr,
                        hijriDate = eventInfo.hijriDate.toIsoString(),
                        hijriDateFormattedEn = eventInfo.hijriDate.formatEn(),
                        hijriDateFormattedAr = eventInfo.hijriDate.formatAr(),
                        gregorianDate = eventInfo.gregorianDate?.toString(),
                        isPublicHoliday = eventInfo.isPublicHoliday
                    )
                }
            )
        )
    }

    /**
     * Gets upcoming Islamic events within the specified number of days.
     */
    @GetMapping("/islamic-events/upcoming")
    @Operation(summary = "Get upcoming Islamic events")
    fun getUpcomingEvents(
        @RequestParam(defaultValue = "30") daysAhead: Int
    ): ResponseEntity<List<IslamicEventDto>> {
        val events = hijriDateConverter.getUpcomingEvents(daysAhead)

        return ResponseEntity.ok(
            events.map { eventInfo ->
                IslamicEventDto(
                    code = eventInfo.event.name,
                    nameEn = eventInfo.event.nameEn,
                    nameAr = eventInfo.event.nameAr,
                    hijriDate = eventInfo.hijriDate.toIsoString(),
                    hijriDateFormattedEn = eventInfo.hijriDate.formatEn(),
                    hijriDateFormattedAr = eventInfo.hijriDate.formatAr(),
                    gregorianDate = eventInfo.gregorianDate?.toString(),
                    isPublicHoliday = eventInfo.isPublicHoliday
                )
            }
        )
    }

    /**
     * Gets current month information in Hijri calendar.
     */
    @GetMapping("/hijri/month")
    @Operation(summary = "Get current Hijri month information")
    fun getCurrentMonthInfo(): ResponseEntity<HijriMonthInfoResponse> {
        val monthInfo = hijriDateConverter.getCurrentMonthInfo()
        return ResponseEntity.ok(
            HijriMonthInfoResponse(
                year = monthInfo.year,
                month = monthInfo.month,
                monthNameEn = monthInfo.monthNameEn,
                monthNameAr = monthInfo.monthNameAr,
                daysInMonth = monthInfo.daysInMonth,
                currentDay = monthInfo.currentDay
            )
        )
    }

    /**
     * Checks if currently in Ramadan and gets Ramadan-related info.
     */
    @GetMapping("/ramadan")
    @Operation(summary = "Get Ramadan information")
    fun getRamadanInfo(): ResponseEntity<RamadanInfoResponse> {
        val isRamadan = hijriDateConverter.isRamadan()
        val daysUntil = hijriDateConverter.getDaysUntilRamadan()
        val currentYear = hijriDateConverter.currentHijriYear()

        val (startDate, endDate) = if (isRamadan || daysUntil > 0) {
            hijriDateConverter.getRamadanDates(currentYear)
        } else {
            // Ramadan passed, get next year's dates
            hijriDateConverter.getRamadanDates(currentYear + 1)
        }

        return ResponseEntity.ok(
            RamadanInfoResponse(
                isCurrentlyRamadan = isRamadan,
                daysUntilRamadan = if (isRamadan) 0 else daysUntil,
                hijriYear = if (isRamadan || daysUntil > 0) currentYear else currentYear + 1,
                startDate = startDate.toString(),
                endDate = endDate.toString(),
                messageEn = when {
                    isRamadan -> "Ramadan Mubarak! We are currently in the blessed month of Ramadan."
                    daysUntil in 1..30 -> "$daysUntil days until Ramadan. May it bring you blessings."
                    else -> "Ramadan is coming. Prepare your heart and soul."
                },
                messageAr = when {
                    isRamadan -> "رمضان مبارك! نحن الآن في شهر رمضان المبارك."
                    daysUntil in 1..30 -> "باقي $daysUntil يوم على رمضان. نسأل الله أن يبارك لكم."
                    else -> "رمضان قادم. استعدوا بقلوبكم وأرواحكم."
                }
            )
        )
    }

    /**
     * Gets list of all Hijri months with their names.
     */
    @GetMapping("/hijri/months")
    @Operation(summary = "Get list of Hijri months")
    fun getHijriMonths(): ResponseEntity<List<HijriMonthName>> {
        return ResponseEntity.ok(
            HijriDate.HIJRI_MONTHS_EN.mapIndexed { index, nameEn ->
                HijriMonthName(
                    number = index + 1,
                    nameEn = nameEn,
                    nameAr = HijriDate.HIJRI_MONTHS_AR[index]
                )
            }
        )
    }
}

// ==================== DTOs ====================

data class HijriDateResponse(
    val hijriYear: Int,
    val hijriMonth: Int,
    val hijriDay: Int,
    val hijriDateIso: String,
    val hijriDateFormattedEn: String,
    val hijriDateFormattedAr: String,
    val monthNameEn: String,
    val monthNameAr: String,
    val gregorianDate: String,
    val daysInMonth: Int?,
    val currentDayOfMonth: Int?
) {
    companion object {
        fun from(hijriDate: HijriDate, gregorianDate: LocalDate, monthInfo: HijriMonthInfo?): HijriDateResponse {
            return HijriDateResponse(
                hijriYear = hijriDate.year,
                hijriMonth = hijriDate.month,
                hijriDay = hijriDate.day,
                hijriDateIso = hijriDate.toIsoString(),
                hijriDateFormattedEn = hijriDate.formatEn(),
                hijriDateFormattedAr = hijriDate.formatAr(),
                monthNameEn = hijriDate.getMonthNameEn(),
                monthNameAr = hijriDate.getMonthNameAr(),
                gregorianDate = gregorianDate.toString(),
                daysInMonth = monthInfo?.daysInMonth,
                currentDayOfMonth = monthInfo?.currentDay
            )
        }
    }
}

data class GregorianDateResponse(
    val gregorianDate: String,
    val dayOfWeek: String,
    val hijriDateFormatted: String,
    val hijriDateFormattedAr: String
)

data class IslamicEventsResponse(
    val hijriYear: Int,
    val events: List<IslamicEventDto>
)

data class IslamicEventDto(
    val code: String,
    val nameEn: String,
    val nameAr: String,
    val hijriDate: String,
    val hijriDateFormattedEn: String,
    val hijriDateFormattedAr: String,
    val gregorianDate: String?,
    val isPublicHoliday: Boolean
)

data class HijriMonthInfoResponse(
    val year: Int,
    val month: Int,
    val monthNameEn: String,
    val monthNameAr: String,
    val daysInMonth: Int,
    val currentDay: Int
)

data class RamadanInfoResponse(
    val isCurrentlyRamadan: Boolean,
    val daysUntilRamadan: Int,
    val hijriYear: Int,
    val startDate: String,
    val endDate: String,
    val messageEn: String,
    val messageAr: String
)

data class HijriMonthName(
    val number: Int,
    val nameEn: String,
    val nameAr: String
)
