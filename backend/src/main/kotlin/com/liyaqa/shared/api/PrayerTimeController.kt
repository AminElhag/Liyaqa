package com.liyaqa.shared.api

import com.liyaqa.organization.application.services.ClubService
import com.liyaqa.shared.domain.model.PrayerCalculationMethod
import com.liyaqa.shared.domain.model.PrayerSettings
import com.liyaqa.shared.domain.model.PrayerTime
import com.liyaqa.shared.infrastructure.prayer.PrayerTimeService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

@RestController
@RequestMapping("/api/prayer-times")
@Tag(name = "Prayer Times", description = "Prayer time calculation and settings for Saudi Arabia market")
class PrayerTimeController(
    private val prayerTimeService: PrayerTimeService,
    private val clubService: ClubService
) {

    /**
     * Gets today's prayer times for a club.
     */
    @GetMapping("/today")
    @Operation(summary = "Get today's prayer times for a club")
    fun getTodayPrayerTimes(
        @RequestParam clubId: UUID
    ): ResponseEntity<PrayerTimeResponse> {
        val prayerTimes = prayerTimeService.getPrayerTimesForClub(clubId)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(PrayerTimeResponse.from(prayerTimes))
    }

    /**
     * Gets prayer times for a specific date.
     */
    @GetMapping("/date")
    @Operation(summary = "Get prayer times for a specific date")
    fun getPrayerTimesByDate(
        @RequestParam clubId: UUID,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) date: LocalDate
    ): ResponseEntity<PrayerTimeResponse> {
        val prayerTimes = prayerTimeService.getPrayerTimesForClub(clubId, date)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(PrayerTimeResponse.from(prayerTimes))
    }

    /**
     * Gets prayer times for a week starting from the given date.
     */
    @GetMapping("/week")
    @Operation(summary = "Get prayer times for a week")
    fun getWeeklyPrayerTimes(
        @RequestParam clubId: UUID,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate?
    ): ResponseEntity<List<PrayerTimeResponse>> {
        val start = startDate ?: LocalDate.now()
        val prayerTimes = prayerTimeService.getWeeklyPrayerTimes(clubId, start)
        if (prayerTimes.isEmpty()) {
            return ResponseEntity.notFound().build()
        }
        return ResponseEntity.ok(prayerTimes.map { PrayerTimeResponse.from(it) })
    }

    /**
     * Gets the next prayer for a club.
     */
    @GetMapping("/next")
    @Operation(summary = "Get the next prayer time for a club")
    fun getNextPrayer(
        @RequestParam clubId: UUID
    ): ResponseEntity<NextPrayerResponse> {
        val prayerTimes = prayerTimeService.getPrayerTimesForClub(clubId)
            ?: return ResponseEntity.notFound().build()
        val nextPrayer = prayerTimes.getNextPrayer(LocalTime.now())
        return ResponseEntity.ok(NextPrayerResponse(nextPrayer.name, nextPrayer.time.toString()))
    }

    /**
     * Checks if check-in is currently blocked due to prayer time.
     */
    @GetMapping("/check-in-status")
    @Operation(summary = "Check if check-in is blocked due to prayer time")
    fun getCheckInStatus(
        @RequestParam clubId: UUID
    ): ResponseEntity<CheckInStatusResponse> {
        val isBlocked = prayerTimeService.shouldBlockCheckIn(clubId)
        val currentPrayer = if (isBlocked) prayerTimeService.getCurrentPrayerPeriod(clubId) else null
        return ResponseEntity.ok(CheckInStatusResponse(
            blocked = isBlocked,
            currentPrayer = currentPrayer,
            messageEn = if (isBlocked) "Check-in is temporarily paused during $currentPrayer prayer" else null,
            messageAr = if (isBlocked) "تسجيل الدخول متوقف مؤقتاً خلال صلاة ${getPrayerNameAr(currentPrayer)}" else null
        ))
    }

    /**
     * Gets prayer settings for a club.
     */
    @GetMapping("/clubs/{clubId}/settings")
    @PreAuthorize("hasAuthority('organization_manage')")
    @Operation(summary = "Get prayer settings for a club")
    fun getPrayerSettings(@PathVariable clubId: UUID): ResponseEntity<PrayerSettingsResponse> {
        val club = clubService.getClub(clubId)
        return ResponseEntity.ok(PrayerSettingsResponse.from(club.getPrayerSettings()))
    }

    /**
     * Updates prayer settings for a club.
     */
    @PutMapping("/clubs/{clubId}/settings")
    @PreAuthorize("hasAuthority('organization_manage')")
    @Operation(summary = "Update prayer settings for a club")
    fun updatePrayerSettings(
        @PathVariable clubId: UUID,
        @Valid @RequestBody request: UpdatePrayerSettingsRequest
    ): ResponseEntity<PrayerSettingsResponse> {
        val club = clubService.getClub(clubId)

        // If city is provided, try to get coordinates from predefined list
        val coordinates = request.city?.let { prayerTimeService.getCityCoordinates(it) }

        club.city = request.city
        club.latitude = request.latitude ?: coordinates?.first
        club.longitude = request.longitude ?: coordinates?.second
        club.prayerCalculationMethod = request.calculationMethod ?: PrayerCalculationMethod.UMM_AL_QURA
        club.prayerBufferMinutes = request.bufferMinutes ?: 30
        club.blockCheckinDuringPrayer = request.blockCheckinDuringPrayer ?: false

        val updatedClub = clubService.saveClub(club)
        return ResponseEntity.ok(PrayerSettingsResponse.from(updatedClub.getPrayerSettings()))
    }

    /**
     * Gets list of supported Saudi cities with their coordinates.
     */
    @GetMapping("/cities")
    @Operation(summary = "Get list of supported Saudi cities")
    fun getSupportedCities(): ResponseEntity<SupportedCitiesResponse> {
        val cities = prayerTimeService.getSupportedCities().map { cityName ->
            val coords = prayerTimeService.getCityCoordinates(cityName)!!
            CityInfo(
                name = cityName,
                nameAr = getCityNameAr(cityName),
                latitude = coords.first,
                longitude = coords.second
            )
        }
        return ResponseEntity.ok(SupportedCitiesResponse(cities))
    }

    /**
     * Gets list of supported calculation methods.
     */
    @GetMapping("/calculation-methods")
    @Operation(summary = "Get list of supported prayer calculation methods")
    fun getCalculationMethods(): ResponseEntity<List<CalculationMethodInfo>> {
        return ResponseEntity.ok(PrayerCalculationMethod.entries.map {
            CalculationMethodInfo(
                code = it.name,
                nameEn = getMethodNameEn(it),
                nameAr = getMethodNameAr(it),
                description = getMethodDescription(it)
            )
        })
    }

    // Helper functions for Arabic translations
    private fun getPrayerNameAr(prayer: String?): String = when (prayer) {
        "FAJR" -> "الفجر"
        "DHUHR" -> "الظهر"
        "ASR" -> "العصر"
        "MAGHRIB" -> "المغرب"
        "ISHA" -> "العشاء"
        else -> ""
    }

    private fun getCityNameAr(city: String): String = when (city) {
        "Riyadh" -> "الرياض"
        "Jeddah" -> "جدة"
        "Makkah" -> "مكة المكرمة"
        "Madinah" -> "المدينة المنورة"
        "Dammam" -> "الدمام"
        "Khobar" -> "الخبر"
        "Dhahran" -> "الظهران"
        "Tabuk" -> "تبوك"
        "Abha" -> "أبها"
        "Taif" -> "الطائف"
        "Hofuf" -> "الأحساء"
        "Jubail" -> "الجبيل"
        "Yanbu" -> "ينبع"
        "Buraidah" -> "بريدة"
        "Najran" -> "نجران"
        "Jizan" -> "جازان"
        "Hail" -> "حائل"
        "Arar" -> "عرعر"
        "Sakaka" -> "سكاكا"
        "Al Bahah" -> "الباحة"
        else -> city
    }

    private fun getMethodNameEn(method: PrayerCalculationMethod): String = when (method) {
        PrayerCalculationMethod.UMM_AL_QURA -> "Umm Al-Qura (Saudi Arabia)"
        PrayerCalculationMethod.MUSLIM_WORLD_LEAGUE -> "Muslim World League"
        PrayerCalculationMethod.EGYPTIAN -> "Egyptian General Authority"
        PrayerCalculationMethod.KARACHI -> "University of Karachi"
        PrayerCalculationMethod.ISNA -> "Islamic Society of North America"
        PrayerCalculationMethod.UOIF -> "Union of Islamic Orgs (France)"
        PrayerCalculationMethod.DUBAI -> "Dubai"
        PrayerCalculationMethod.QATAR -> "Qatar"
        PrayerCalculationMethod.KUWAIT -> "Kuwait"
        PrayerCalculationMethod.SINGAPORE -> "Singapore"
    }

    private fun getMethodNameAr(method: PrayerCalculationMethod): String = when (method) {
        PrayerCalculationMethod.UMM_AL_QURA -> "أم القرى (السعودية)"
        PrayerCalculationMethod.MUSLIM_WORLD_LEAGUE -> "رابطة العالم الإسلامي"
        PrayerCalculationMethod.EGYPTIAN -> "الهيئة المصرية العامة للمساحة"
        PrayerCalculationMethod.KARACHI -> "جامعة كراتشي"
        PrayerCalculationMethod.ISNA -> "الجمعية الإسلامية لأمريكا الشمالية"
        PrayerCalculationMethod.UOIF -> "اتحاد المنظمات الإسلامية (فرنسا)"
        PrayerCalculationMethod.DUBAI -> "دبي"
        PrayerCalculationMethod.QATAR -> "قطر"
        PrayerCalculationMethod.KUWAIT -> "الكويت"
        PrayerCalculationMethod.SINGAPORE -> "سنغافورة"
    }

    private fun getMethodDescription(method: PrayerCalculationMethod): String = when (method) {
        PrayerCalculationMethod.UMM_AL_QURA -> "Official method used in Saudi Arabia"
        PrayerCalculationMethod.MUSLIM_WORLD_LEAGUE -> "Used in Europe, Far East, parts of US"
        PrayerCalculationMethod.EGYPTIAN -> "Used in Africa, Syria, Lebanon, Malaysia"
        PrayerCalculationMethod.KARACHI -> "Used in Pakistan, Bangladesh, India, Afghanistan"
        PrayerCalculationMethod.ISNA -> "Used in North America"
        PrayerCalculationMethod.UOIF -> "Used in France"
        PrayerCalculationMethod.DUBAI -> "Used in UAE"
        PrayerCalculationMethod.QATAR -> "Used in Qatar"
        PrayerCalculationMethod.KUWAIT -> "Used in Kuwait"
        PrayerCalculationMethod.SINGAPORE -> "Used in Singapore"
    }
}

// ==================== DTOs ====================

data class PrayerTimeResponse(
    val date: String,
    val fajr: String,
    val sunrise: String,
    val dhuhr: String,
    val asr: String,
    val maghrib: String,
    val isha: String
) {
    companion object {
        fun from(prayerTime: PrayerTime) = PrayerTimeResponse(
            date = prayerTime.date.toString(),
            fajr = prayerTime.fajr.toString(),
            sunrise = prayerTime.sunrise.toString(),
            dhuhr = prayerTime.dhuhr.toString(),
            asr = prayerTime.asr.toString(),
            maghrib = prayerTime.maghrib.toString(),
            isha = prayerTime.isha.toString()
        )
    }
}

data class NextPrayerResponse(
    val name: String,
    val time: String
)

data class CheckInStatusResponse(
    val blocked: Boolean,
    val currentPrayer: String?,
    val messageEn: String?,
    val messageAr: String?
)

data class PrayerSettingsResponse(
    val city: String?,
    val latitude: Double?,
    val longitude: Double?,
    val calculationMethod: PrayerCalculationMethod,
    val bufferMinutes: Int,
    val blockCheckinDuringPrayer: Boolean,
    val isConfigured: Boolean
) {
    companion object {
        fun from(settings: PrayerSettings) = PrayerSettingsResponse(
            city = settings.city,
            latitude = settings.latitude,
            longitude = settings.longitude,
            calculationMethod = settings.calculationMethod,
            bufferMinutes = settings.bufferMinutes,
            blockCheckinDuringPrayer = settings.blockCheckinDuringPrayer,
            isConfigured = settings.isConfigured()
        )
    }
}

data class UpdatePrayerSettingsRequest(
    val city: String?,

    @field:DecimalMin("-90.0")
    @field:DecimalMax("90.0")
    val latitude: Double?,

    @field:DecimalMin("-180.0")
    @field:DecimalMax("180.0")
    val longitude: Double?,

    val calculationMethod: PrayerCalculationMethod?,

    @field:Min(0)
    @field:Max(60)
    val bufferMinutes: Int?,

    val blockCheckinDuringPrayer: Boolean?
)

data class SupportedCitiesResponse(
    val cities: List<CityInfo>
)

data class CityInfo(
    val name: String,
    val nameAr: String,
    val latitude: Double,
    val longitude: Double
)

data class CalculationMethodInfo(
    val code: String,
    val nameEn: String,
    val nameAr: String,
    val description: String
)
