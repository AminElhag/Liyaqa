package com.liyaqa.shared.domain.model

import java.time.LocalDate

/**
 * Value object representing a Hijri (Islamic) calendar date.
 * Based on Umm Al-Qura calendar, the official calendar of Saudi Arabia.
 */
data class HijriDate(
    val year: Int,
    val month: Int,
    val day: Int
) {
    init {
        require(year in 1 .. 2000) { "Hijri year must be between 1 and 2000" }
        require(month in 1..12) { "Hijri month must be between 1 and 12" }
        require(day in 1..30) { "Hijri day must be between 1 and 30" }
    }

    /**
     * Returns the Hijri month name in English.
     */
    fun getMonthNameEn(): String = HIJRI_MONTHS_EN[month - 1]

    /**
     * Returns the Hijri month name in Arabic.
     */
    fun getMonthNameAr(): String = HIJRI_MONTHS_AR[month - 1]

    /**
     * Returns formatted date string in English (e.g., "15 Ramadan 1445").
     */
    fun formatEn(): String = "$day ${getMonthNameEn()} $year"

    /**
     * Returns formatted date string in Arabic (e.g., "١٥ رمضان ١٤٤٥").
     */
    fun formatAr(): String = "${toArabicNumerals(day)} ${getMonthNameAr()} ${toArabicNumerals(year)}"

    /**
     * Returns ISO-style format (e.g., "1445-09-15").
     */
    fun toIsoString(): String = String.format("%04d-%02d-%02d", year, month, day)

    companion object {
        val HIJRI_MONTHS_EN = listOf(
            "Muharram",
            "Safar",
            "Rabi' al-Awwal",
            "Rabi' al-Thani",
            "Jumada al-Awwal",
            "Jumada al-Thani",
            "Rajab",
            "Sha'ban",
            "Ramadan",
            "Shawwal",
            "Dhu al-Qi'dah",
            "Dhu al-Hijjah"
        )

        val HIJRI_MONTHS_AR = listOf(
            "محرم",
            "صفر",
            "ربيع الأول",
            "ربيع الثاني",
            "جمادى الأولى",
            "جمادى الآخرة",
            "رجب",
            "شعبان",
            "رمضان",
            "شوال",
            "ذو القعدة",
            "ذو الحجة"
        )

        private val ARABIC_NUMERALS = listOf('٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩')

        private fun toArabicNumerals(number: Int): String {
            return number.toString().map { ARABIC_NUMERALS[it - '0'] }.joinToString("")
        }
    }
}

/**
 * Islamic events that occur on fixed Hijri dates.
 */
enum class IslamicEvent(
    val month: Int,
    val day: Int,
    val nameEn: String,
    val nameAr: String,
    val isPublicHoliday: Boolean = false
) {
    // Muharram (month 1)
    ISLAMIC_NEW_YEAR(1, 1, "Islamic New Year", "رأس السنة الهجرية", true),
    ASHURA(1, 10, "Day of Ashura", "يوم عاشوراء"),

    // Rabi' al-Awwal (month 3)
    MAWLID_NABI(3, 12, "Prophet's Birthday", "المولد النبوي الشريف", true),

    // Rajab (month 7)
    ISRA_MIRAJ(7, 27, "Isra and Mi'raj", "الإسراء والمعراج"),

    // Sha'ban (month 8)
    MID_SHABAN(8, 15, "Mid-Sha'ban", "ليلة النصف من شعبان"),

    // Ramadan (month 9)
    RAMADAN_START(9, 1, "First Day of Ramadan", "بداية شهر رمضان"),
    LAYLAT_AL_QADR(9, 27, "Laylat al-Qadr", "ليلة القدر"),

    // Shawwal (month 10)
    EID_AL_FITR(10, 1, "Eid al-Fitr", "عيد الفطر", true),

    // Dhu al-Hijjah (month 12)
    DAY_OF_ARAFAH(12, 9, "Day of Arafah", "يوم عرفة"),
    EID_AL_ADHA(12, 10, "Eid al-Adha", "عيد الأضحى", true);

    /**
     * Returns the HijriDate for this event in a given Hijri year.
     */
    fun getDateForYear(hijriYear: Int): HijriDate = HijriDate(hijriYear, month, day)
}

/**
 * Result of Islamic event query.
 */
data class IslamicEventInfo(
    val event: IslamicEvent,
    val hijriDate: HijriDate,
    val gregorianDate: LocalDate?,
    val isPublicHoliday: Boolean = false
)
