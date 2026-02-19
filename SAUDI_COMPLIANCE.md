# Liyaqa Backend - Saudi Arabia Compliance & Market Features

**Complete Guide to Saudi-Specific Implementation**

**Project:** Liyaqa Gym Management System
**Version:** 1.0
**Last Updated:** 2026-02-04
**Market:** Kingdom of Saudi Arabia (KSA)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [ZATCA E-Invoicing Compliance](#zatca-e-invoicing-compliance)
3. [VAT Calculation & Tax Compliance](#vat-calculation--tax-compliance)
4. [Arabic Language Support (i18n)](#arabic-language-support-i18n)
5. [Hijri Calendar Implementation](#hijri-calendar-implementation)
6. [Prayer Times Integration](#prayer-times-integration)
7. [Saudi Payment Methods](#saudi-payment-methods)
8. [Cultural & Business Rules](#cultural--business-rules)
9. [Configuration Guide](#configuration-guide)
10. [API Examples](#api-examples)

---

## Executive Summary

Liyaqa is purpose-built for the Saudi Arabian fitness and wellness market with comprehensive support for:

- ✅ **ZATCA Phase 1 E-Invoicing** - TLV-encoded QR codes on all invoices
- ✅ **15% VAT Calculation** - Automatic tax computation per Saudi tax law
- ✅ **Bilingual Support** - Arabic/English throughout (LocalizedText)
- ✅ **Hijri Calendar** - Umm Al-Qura calendar integration
- ✅ **Prayer Times** - Adhan library with check-in blocking
- ✅ **Local Payment Methods** - STC Pay, SADAD, Tamara BNPL, PayTabs
- ✅ **Gender Segregation** - Location and class-level policies
- ✅ **WhatsApp Business** - Notification integration
- ✅ **Cultural Considerations** - Ramadan hours, Islamic holidays

### Compliance Standards

| Standard | Status | Implementation |
|----------|--------|----------------|
| ZATCA E-Invoicing Phase 1 | ✓ Compliant | QR codes with TLV encoding |
| VAT Law (15%) | ✓ Compliant | Automatic calculation |
| Umm Al-Qura Calendar | ✓ Implemented | Java HijrahChronology |
| SAMA Payment Regulations | ✓ Compliant | Multiple local gateways |
| Arabic Language Law | ✓ Compliant | Bilingual throughout |

---

## ZATCA E-Invoicing Compliance

### Overview

**ZATCA** (Zakat, Tax and Customs Authority) is the Saudi tax authority that regulates e-invoicing. Phase 1 requires all invoices to contain a QR code with seller and transaction information.

**Reference:** https://zatca.gov.sa/en/E-Invoicing/Introduction/Pages/What-is-E-invoicing.aspx

### Implementation Files

| Component | File Location |
|-----------|---------------|
| **Service** | `com.liyaqa.billing.infrastructure.zatca.ZatcaService` |
| **QR Generator** | `com.liyaqa.billing.infrastructure.zatca.ZatcaQrCodeGenerator` |
| **Config** | `com.liyaqa.billing.infrastructure.zatca.ZatcaConfig` |
| **Domain Model** | `com.liyaqa.organization.domain.model.ZatcaInfo` |

### ZATCA QR Code Format

**TLV (Tag-Length-Value) Encoding:**

```
Tag 1: Seller Name          (Business name)
Tag 2: VAT Number           (15-digit VAT registration)
Tag 3: Timestamp            (ISO 8601 format)
Tag 4: Total with VAT       (Invoice total including tax)
Tag 5: VAT Amount           (Tax amount)
```

### Code Example: QR Code Generation

```kotlin
@Service
class ZatcaQrCodeGenerator {
    companion object {
        const val TAG_SELLER_NAME = 1
        const val TAG_VAT_NUMBER = 2
        const val TAG_TIMESTAMP = 3
        const val TAG_TOTAL_WITH_VAT = 4
        const val TAG_VAT_AMOUNT = 5
        const val QR_CODE_SIZE = 200
    }

    fun generateZatcaQrCode(
        sellerName: String,
        vatNumber: String,
        timestamp: ZonedDateTime,
        totalWithVat: BigDecimal,
        vatAmount: BigDecimal
    ): String {
        // 1. Generate TLV data
        val tlvData = generateTlvData(
            sellerName, vatNumber, timestamp,
            totalWithVat, vatAmount
        )

        // 2. Encode TLV as Base64
        val base64TlvData = Base64.getEncoder().encodeToString(tlvData)

        // 3. Generate QR code containing Base64 TLV
        val qrCodeWriter = QRCodeWriter()
        val bitMatrix = qrCodeWriter.encode(
            base64TlvData,
            BarcodeFormat.QR_CODE,
            QR_CODE_SIZE,
            QR_CODE_SIZE
        )

        // 4. Convert to PNG and return as Base64
        val pngBytes = matrixToPng(bitMatrix)
        return Base64.getEncoder().encodeToString(pngBytes)
    }

    private fun generateTlvData(
        sellerName: String,
        vatNumber: String,
        timestamp: ZonedDateTime,
        totalWithVat: BigDecimal,
        vatAmount: BigDecimal
    ): ByteArray {
        val outputStream = ByteArrayOutputStream()

        // Tag 1: Seller name
        writeTlv(outputStream, TAG_SELLER_NAME,
            sellerName.toByteArray(Charsets.UTF_8))

        // Tag 2: VAT registration number
        writeTlv(outputStream, TAG_VAT_NUMBER,
            vatNumber.toByteArray(Charsets.UTF_8))

        // Tag 3: Invoice timestamp (ISO 8601)
        val formattedTimestamp = timestamp.format(
            DateTimeFormatter.ISO_OFFSET_DATE_TIME
        )
        writeTlv(outputStream, TAG_TIMESTAMP,
            formattedTimestamp.toByteArray(Charsets.UTF_8))

        // Tag 4: Total with VAT
        val totalString = totalWithVat.setScale(2).toPlainString()
        writeTlv(outputStream, TAG_TOTAL_WITH_VAT,
            totalString.toByteArray(Charsets.UTF_8))

        // Tag 5: VAT amount
        val vatString = vatAmount.setScale(2).toPlainString()
        writeTlv(outputStream, TAG_VAT_AMOUNT,
            vatString.toByteArray(Charsets.UTF_8))

        return outputStream.toByteArray()
    }

    private fun writeTlv(
        outputStream: ByteArrayOutputStream,
        tag: Int,
        value: ByteArray
    ) {
        outputStream.write(tag)          // 1 byte: tag
        outputStream.write(value.size)   // 1 byte: length
        outputStream.write(value)        // n bytes: value
    }
}
```

### ZATCA Info Configuration

```kotlin
@Embeddable
data class ZatcaInfo(
    /**
     * VAT Registration Number (15 digits).
     * Format: 3XXXXXXXXXX00003
     */
    @Column(name = "vat_registration_number", length = 15)
    val vatRegistrationNumber: String? = null,

    /**
     * Commercial Registration Number (CR number).
     * Issued by Ministry of Commerce.
     */
    @Column(name = "commercial_registration_number", length = 20)
    val commercialRegistrationNumber: String? = null,

    /**
     * Full business address (bilingual).
     * Required: street, city, postal code, country code
     */
    @Embedded
    val address: LocalizedAddress? = null
) {
    init {
        vatRegistrationNumber?.let {
            require(it.matches(Regex("^[0-9]{15}$"))) {
                "VAT Registration Number must be exactly 15 digits"
            }
        }
    }

    fun isComplete(): Boolean {
        val addr = address ?: return false
        return vatRegistrationNumber != null &&
               commercialRegistrationNumber != null &&
               addr.street != null &&
               addr.city != null &&
               addr.postalCode != null
    }
}
```

### Invoice Integration

```kotlin
@Entity
@Table(name = "invoices")
class Invoice(
    // ... other fields ...

    @Column(name = "zatca_invoice_hash")
    var zatcaInvoiceHash: String? = null,

    @Column(name = "zatca_qr_code", columnDefinition = "TEXT")
    var zatcaQrCode: String? = null
) : OrganizationAwareEntity(id)
```

### Configuration

**application.yml:**
```yaml
liyaqa:
  zatca:
    enabled: ${ZATCA_ENABLED:false}
    seller-name: ${ZATCA_SELLER_NAME:}
    vat-registration-number: ${ZATCA_VAT_NUMBER:}
```

**Environment Variables:**
```bash
ZATCA_ENABLED=true
ZATCA_SELLER_NAME="Your Fitness Company LLC"
ZATCA_VAT_NUMBER="300000000000003"
```

---

## VAT Calculation & Tax Compliance

### Saudi VAT Rate

**Current Rate:** 15% (effective July 1, 2020)
**Previous Rate:** 5% (Jan 2018 - June 2020)

### Default Configuration

```kotlin
@Configuration
@ConfigurationProperties(prefix = "liyaqa.billing")
class BillingConfig {
    /**
     * Default VAT rate for Saudi Arabia.
     */
    var defaultVatRate: BigDecimal = BigDecimal("15.00")

    fun getVatRateMultiplier(): BigDecimal =
        defaultVatRate.divide(BigDecimal("100"))
}
```

**application.yml:**
```yaml
liyaqa:
  billing:
    default-vat-rate: 15.00  # Saudi Arabia VAT
```

### Invoice VAT Calculation

```kotlin
@Entity
@Table(name = "invoices")
class Invoice(
    // Subtotal (before tax)
    @Embedded
    var subtotal: Money,

    // VAT rate (percentage)
    @Column(name = "vat_rate", nullable = false)
    var vatRate: BigDecimal = BigDecimal("15.00"),

    // Calculated VAT amount
    @Embedded
    var vatAmount: Money,

    // Total (subtotal + VAT)
    @Embedded
    var totalAmount: Money
) {
    companion object {
        fun create(
            invoiceNumber: String,
            memberId: UUID,
            lineItems: List<InvoiceLineItem>,
            vatRate: BigDecimal = BigDecimal("15.00")
        ): Invoice {
            // 1. Calculate subtotal from line items
            val currency = lineItems.first().unitPrice.currency
            var subtotal = Money.of(BigDecimal.ZERO, currency)

            for (item in lineItems) {
                subtotal = subtotal + item.lineTotal()
            }

            // 2. Calculate VAT amount
            val vatAmount = Money.of(
                subtotal.amount
                    .multiply(vatRate)
                    .divide(BigDecimal("100"), 2, RoundingMode.HALF_UP),
                currency
            )

            // 3. Calculate total
            val totalAmount = subtotal + vatAmount

            return Invoice(
                invoiceNumber = invoiceNumber,
                memberId = memberId,
                subtotal = subtotal,
                vatRate = vatRate,
                vatAmount = vatAmount,
                totalAmount = totalAmount
            )
        }
    }
}
```

### Per-Item VAT Support

```kotlin
@Embeddable
data class InvoiceLineItem(
    @Embedded
    val description: LocalizedText,

    @Column(name = "line_quantity", nullable = false)
    val quantity: Int = 1,

    @Embedded
    val unitPrice: Money,

    /**
     * Per-item tax rate (default 15% for Saudi Arabia).
     */
    @Column(name = "line_tax_rate", nullable = false)
    val taxRate: BigDecimal = BigDecimal("15.00")
) {
    fun lineTotal(): Money = unitPrice * quantity

    fun lineTaxAmount(): Money {
        val total = lineTotal()
        val taxAmount = total.amount
            .multiply(taxRate)
            .divide(BigDecimal("100"), 2, RoundingMode.HALF_UP)
        return Money.of(taxAmount, total.currency)
    }

    fun lineGrossTotal(): Money = lineTotal() + lineTaxAmount()
}
```

### TaxableFee Value Object

```kotlin
@Embeddable
data class TaxableFee(
    @Column(name = "_amount", nullable = false)
    val amount: BigDecimal = BigDecimal.ZERO,

    @Column(name = "_currency", nullable = false)
    val currency: String = "SAR",

    @Column(name = "_tax_rate", nullable = false)
    val taxRate: BigDecimal = BigDecimal("15.00")  // 15% default
) {
    /**
     * Get net amount (before tax).
     */
    fun getNetAmount(): Money =
        Money(amount.setScale(2, RoundingMode.HALF_UP), currency)

    /**
     * Calculate tax amount.
     */
    fun getTaxAmount(): Money = Money(
        amount.multiply(taxRate)
            .divide(BigDecimal("100"), 2, RoundingMode.HALF_UP),
        currency
    )

    /**
     * Get gross amount (net + tax).
     */
    fun getGrossAmount(): Money = getNetAmount() + getTaxAmount()

    companion object {
        val ZERO = TaxableFee()

        fun of(
            amount: BigDecimal,
            currency: String = "SAR",
            taxRate: BigDecimal = BigDecimal("15.00")
        ): TaxableFee = TaxableFee(
            amount.setScale(2, RoundingMode.HALF_UP),
            currency,
            taxRate
        )
    }
}
```

### VAT Reporting

```sql
-- Query for VAT report
SELECT
    DATE_TRUNC('month', issue_date) as tax_period,
    COUNT(*) as invoice_count,
    SUM(subtotal_amount) as total_sales,
    SUM(vat_amount) as total_vat_collected,
    SUM(total_amount) as total_with_vat
FROM invoices
WHERE status IN ('ISSUED', 'PAID')
    AND issue_date >= '2024-01-01'
    AND tenant_id = ?
GROUP BY DATE_TRUNC('month', issue_date)
ORDER BY tax_period DESC;
```

---

## Arabic Language Support (i18n)

### LocalizedText Value Object

**Core Implementation:**

```kotlin
@Embeddable
data class LocalizedText(
    @Column(name = "_en", nullable = false)
    val en: String,

    @Column(name = "_ar")
    val ar: String? = null
) {
    /**
     * Get localized value based on locale preference.
     * Falls back to English if Arabic not available.
     */
    fun get(locale: String = "en"): String {
        return when (locale.lowercase()) {
            "ar" -> ar ?: en
            else -> en
        }
    }

    companion object {
        fun of(en: String, ar: String? = null) = LocalizedText(en, ar)
    }
}
```

### Usage in Entities

```kotlin
@Entity
@Table(name = "clubs")
class Club(
    // Bilingual club name
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "name_en")),
        AttributeOverride(name = "ar", column = Column(name = "name_ar"))
    )
    var name: LocalizedText,

    // Bilingual description
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "description_en")),
        AttributeOverride(name = "ar", column = Column(name = "description_ar"))
    )
    var description: LocalizedText? = null
)
```

### Request DTOs

```kotlin
/**
 * Standard input DTO (English required).
 */
data class LocalizedTextInput(
    @field:NotBlank(message = "English text is required")
    val en: String,
    val ar: String? = null
) {
    fun toLocalizedText() = LocalizedText(en, ar)
}

/**
 * Flexible input (at least one language required).
 */
@AtLeastOneLanguage
data class FlexibleLocalizedTextInput(
    val en: String? = null,
    val ar: String? = null
) {
    fun toLocalizedText() = LocalizedText(en ?: "", ar)
}
```

### Localized Address

```kotlin
@Embeddable
data class LocalizedAddress(
    @Embedded
    val street: LocalizedText? = null,

    @Embedded
    val building: LocalizedText? = null,

    @Embedded
    val city: LocalizedText? = null,

    @Embedded
    val district: LocalizedText? = null,

    @Column(name = "postal_code")
    val postalCode: String? = null,

    @Column(name = "country_code", length = 2)
    val countryCode: String? = null  // "SA" for Saudi Arabia
) {
    fun toFormattedString(locale: String = "en"): String {
        return listOfNotNull(
            building?.get(locale),
            street?.get(locale),
            district?.get(locale),
            city?.get(locale),
            postalCode,
            countryCode
        ).filter { it.isNotBlank() }.joinToString(", ")
    }
}
```

### Arabic Number Formatting

```kotlin
data class HijriDate(
    val year: Int,
    val month: Int,
    val day: Int
) {
    /**
     * Format date in Arabic with Arabic numerals.
     * Example: "١٥ رمضان ١٤٤٥"
     */
    fun formatAr(): String =
        "${toArabicNumerals(day)} ${getMonthNameAr()} ${toArabicNumerals(year)}"

    companion object {
        private val ARABIC_NUMERALS = listOf(
            '٠', '١', '٢', '٣', '٤',
            '٥', '٦', '٧', '٨', '٩'
        )

        private fun toArabicNumerals(number: Int): String {
            return number.toString()
                .map { ARABIC_NUMERALS[it - '0'] }
                .joinToString("")
        }
    }
}
```

### PDF Generation with Arabic Support

```kotlin
@Service
class InvoicePdfGenerator {
    private val arabicFontPaths = listOf(
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",  // macOS
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",      // Linux
        "C:/Windows/Fonts/arialuni.ttf"                          // Windows
    )

    private fun initializeFonts() {
        for (fontPath in arabicFontPaths) {
            try {
                val file = java.io.File(fontPath)
                if (file.exists()) {
                    baseFont = BaseFont.createFont(
                        fontPath,
                        BaseFont.IDENTITY_H,  // Unicode encoding
                        BaseFont.EMBEDDED
                    )
                    useUnicodeFont = true
                    logger.info("Using Unicode font for Arabic: $fontPath")
                    break
                }
            } catch (e: Exception) {
                logger.debug("Font not available: $fontPath")
            }
        }
    }

    fun generateInvoicePdf(invoice: Invoice, locale: String = "en"): ByteArray {
        val document = Document(PageSize.A4)
        val outputStream = ByteArrayOutputStream()
        val writer = PdfWriter.getInstance(document, outputStream)

        document.open()

        // Title in selected language
        val title = if (locale == "ar") "فاتورة" else "Invoice"
        val titleFont = Font(baseFont, 18f, Font.BOLD)
        val titleParagraph = Paragraph(title, titleFont)
        titleParagraph.alignment = if (locale == "ar")
            Element.ALIGN_RIGHT else Element.ALIGN_LEFT
        document.add(titleParagraph)

        // ... rest of PDF generation

        document.close()
        return outputStream.toByteArray()
    }
}
```

### Database Schema

**All bilingual fields:**
```sql
CREATE TABLE clubs (
    id UUID PRIMARY KEY,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    description_en TEXT,
    description_ar TEXT,
    -- ...
);

CREATE TABLE invoices (
    id UUID PRIMARY KEY,
    notes_en TEXT,
    notes_ar TEXT,
    -- ...
);

CREATE TABLE invoice_line_items (
    invoice_id UUID NOT NULL,
    line_description_en VARCHAR(500) NOT NULL,
    line_description_ar VARCHAR(500),
    -- ...
);
```

---

## Hijri Calendar Implementation

### Overview

Liyaqa uses Java's built-in `HijrahChronology` which implements the **Umm Al-Qura calendar**, the official calendar of Saudi Arabia.

### HijriDate Value Object

```kotlin
data class HijriDate(
    val year: Int,
    val month: Int,
    val day: Int
) {
    init {
        require(year in 1..2000) { "Hijri year must be between 1 and 2000" }
        require(month in 1..12) { "Hijri month must be between 1 and 12" }
        require(day in 1..30) { "Hijri day must be between 1 and 30" }
    }

    fun getMonthNameEn(): String = HIJRI_MONTHS_EN[month - 1]
    fun getMonthNameAr(): String = HIJRI_MONTHS_AR[month - 1]

    fun formatEn(): String = "$day ${getMonthNameEn()} $year"
    fun formatAr(): String =
        "${toArabicNumerals(day)} ${getMonthNameAr()} ${toArabicNumerals(year)}"

    fun toIsoString(): String =
        String.format("%04d-%02d-%02d", year, month, day)

    companion object {
        val HIJRI_MONTHS_EN = listOf(
            "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani",
            "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
            "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
        )

        val HIJRI_MONTHS_AR = listOf(
            "محرم", "صفر", "ربيع الأول", "ربيع الثاني",
            "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
            "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
        )
    }
}
```

### HijriDateConverter Service

```kotlin
@Service
class HijriDateConverter {
    /**
     * Converts Gregorian to Hijri date.
     */
    fun toHijri(gregorianDate: LocalDate): HijriDate {
        val hijrahDate = HijrahDate.from(gregorianDate)
        return HijriDate(
            year = hijrahDate.get(ChronoField.YEAR),
            month = hijrahDate.get(ChronoField.MONTH_OF_YEAR),
            day = hijrahDate.get(ChronoField.DAY_OF_MONTH)
        )
    }

    /**
     * Converts Hijri to Gregorian date.
     */
    fun toGregorian(hijriDate: HijriDate): LocalDate {
        val hijrahDate = HijrahChronology.INSTANCE.date(
            hijriDate.year,
            hijriDate.month,
            hijriDate.day
        )
        return LocalDate.from(hijrahDate)
    }

    /**
     * Gets today's date in Hijri.
     */
    fun todayHijri(): HijriDate = toHijri(LocalDate.now())

    /**
     * Checks if currently in Ramadan.
     */
    fun isRamadan(): Boolean {
        val today = todayHijri()
        return today.month == 9  // Ramadan is month 9
    }

    /**
     * Gets Ramadan dates for a given Hijri year.
     */
    fun getRamadanDates(hijriYear: Int): Pair<LocalDate, LocalDate> {
        val start = toGregorian(HijriDate(hijriYear, 9, 1))
        val daysInRamadan = getDaysInMonth(hijriYear, 9)
        val end = toGregorian(HijriDate(hijriYear, 9, daysInRamadan))
        return Pair(start, end)
    }

    /**
     * Gets days until Ramadan.
     */
    fun getDaysUntilRamadan(): Int {
        val today = todayHijri()
        val currentYear = today.year

        return when {
            today.month < 9 -> {
                val ramadanStart = toGregorian(HijriDate(currentYear, 9, 1))
                ChronoUnit.DAYS.between(LocalDate.now(), ramadanStart).toInt()
            }
            today.month == 9 -> 0  // Currently in Ramadan
            else -> {
                val nextRamadanStart = toGregorian(HijriDate(currentYear + 1, 9, 1))
                ChronoUnit.DAYS.between(LocalDate.now(), nextRamadanStart).toInt()
            }
        }
    }
}
```

### Islamic Events

```kotlin
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

    // Ramadan (month 9)
    RAMADAN_START(9, 1, "First Day of Ramadan", "بداية شهر رمضان"),
    LAYLAT_AL_QADR(9, 27, "Laylat al-Qadr", "ليلة القدر"),

    // Shawwal (month 10)
    EID_AL_FITR(10, 1, "Eid al-Fitr", "عيد الفطر", true),

    // Dhu al-Hijjah (month 12)
    DAY_OF_ARAFAH(12, 9, "Day of Arafah", "يوم عرفة"),
    EID_AL_ADHA(12, 10, "Eid al-Adha", "عيد الأضحى", true);

    fun getDateForYear(hijriYear: Int): HijriDate =
        HijriDate(hijriYear, month, day)
}

data class IslamicEventInfo(
    val event: IslamicEvent,
    val hijriDate: HijriDate,
    val gregorianDate: LocalDate?,
    val isPublicHoliday: Boolean = false
)
```

### API Controller

```kotlin
@RestController
@RequestMapping("/api/calendar")
class CalendarController(
    private val hijriDateConverter: HijriDateConverter
) {
    @GetMapping("/hijri/today")
    fun getTodayHijri(): HijriDate = hijriDateConverter.todayHijri()

    @GetMapping("/hijri/convert")
    fun convertToHijri(@RequestParam date: LocalDate): HijriDate =
        hijriDateConverter.toHijri(date)

    @GetMapping("/hijri/ramadan")
    fun getRamadanInfo(): RamadanInfoResponse {
        val isRamadan = hijriDateConverter.isRamadan()
        val daysUntil = hijriDateConverter.getDaysUntilRamadan()
        val currentYear = hijriDateConverter.currentHijriYear()
        val (start, end) = hijriDateConverter.getRamadanDates(currentYear)

        return RamadanInfoResponse(
            isCurrentlyRamadan = isRamadan,
            daysUntilRamadan = daysUntil,
            ramadanStartDate = start,
            ramadanEndDate = end
        )
    }

    @GetMapping("/islamic-events")
    fun getUpcomingEvents(): List<IslamicEventInfo> =
        hijriDateConverter.getUpcomingEvents(daysAhead = 30)
}
```

---

## Prayer Times Integration

### Overview

Liyaqa uses the **Adhan library** (`com.batoulapps.adhan`) for accurate prayer time calculations. The default method is **UMM_AL_QURA**, the official Saudi method.

### Prayer Time Service

```kotlin
@Service
class PrayerTimeService(
    private val clubRepository: ClubRepository
) {
    companion object {
        private val SAUDI_TIMEZONE = ZoneId.of("Asia/Riyadh")

        val SAUDI_CITIES = mapOf(
            "Riyadh" to Pair(24.7136, 46.6753),
            "Jeddah" to Pair(21.4858, 39.1925),
            "Makkah" to Pair(21.4225, 39.8262),
            "Madinah" to Pair(24.5247, 39.5692),
            "Dammam" to Pair(26.4207, 50.0888),
            "Khobar" to Pair(26.2172, 50.1971),
            // ... 20 Saudi cities total
        )
    }

    fun getPrayerTimesForClub(
        clubId: UUID,
        date: LocalDate = LocalDate.now()
    ): PrayerTime? {
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

    fun calculatePrayerTimes(
        latitude: Double,
        longitude: Double,
        date: LocalDate,
        method: PrayerCalculationMethod = PrayerCalculationMethod.UMM_AL_QURA
    ): PrayerTime {
        val coordinates = Coordinates(latitude, longitude)
        val params = getCalculationParameters(method)
        val dateComponents = DateComponents(
            date.year,
            date.monthValue,
            date.dayOfMonth
        )

        val prayerTimes = PrayerTimes(coordinates, dateComponents, params)
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

    fun shouldBlockCheckIn(
        clubId: UUID,
        currentTime: LocalTime = LocalTime.now()
    ): Boolean {
        val club = clubRepository.findById(clubId).orElse(null) ?: return false

        if (!club.blockCheckinDuringPrayer) return false

        val prayerTimes = getPrayerTimesForClub(clubId) ?: return false
        return prayerTimes.isDuringPrayerTime(
            currentTime,
            club.prayerBufferMinutes
        )
    }
}
```

### Prayer Time Model

```kotlin
data class PrayerTime(
    val date: LocalDate,
    val fajr: LocalTime,     // Dawn prayer
    val sunrise: LocalTime,  // Not a prayer, but needed for calculations
    val dhuhr: LocalTime,    // Noon prayer
    val asr: LocalTime,      // Afternoon prayer
    val maghrib: LocalTime,  // Sunset prayer
    val isha: LocalTime      // Night prayer
) {
    /**
     * Check if current time is during prayer period (including buffer).
     */
    fun isDuringPrayerTime(
        currentTime: LocalTime,
        bufferMinutes: Int = 30
    ): Boolean {
        val prayers = listOf(fajr, dhuhr, asr, maghrib, isha)

        for (prayerTime in prayers) {
            val start = prayerTime.minusMinutes(bufferMinutes.toLong())
            val end = prayerTime.plusMinutes(bufferMinutes.toLong())

            if (currentTime in start..end) {
                return true
            }
        }

        return false
    }

    fun getCurrentPrayerPeriod(
        currentTime: LocalTime,
        bufferMinutes: Int = 30
    ): String? {
        val prayerMap = mapOf(
            "Fajr" to fajr,
            "Dhuhr" to dhuhr,
            "Asr" to asr,
            "Maghrib" to maghrib,
            "Isha" to isha
        )

        for ((name, prayerTime) in prayerMap) {
            val start = prayerTime.minusMinutes(bufferMinutes.toLong())
            val end = prayerTime.plusMinutes(bufferMinutes.toLong())

            if (currentTime in start..end) {
                return name
            }
        }

        return null
    }
}
```

### Club Prayer Configuration

```kotlin
@Entity
@Table(name = "clubs")
class Club(
    // ... other fields ...

    @Column(name = "city", length = 100)
    var city: String? = null,

    @Column(name = "latitude")
    var latitude: Double? = null,

    @Column(name = "longitude")
    var longitude: Double? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "prayer_calculation_method", length = 50)
    var prayerCalculationMethod: PrayerCalculationMethod =
        PrayerCalculationMethod.UMM_AL_QURA,

    @Column(name = "prayer_buffer_minutes")
    var prayerBufferMinutes: Int = 30,

    @Column(name = "block_checkin_during_prayer")
    var blockCheckinDuringPrayer: Boolean = false
)

enum class PrayerCalculationMethod {
    UMM_AL_QURA,          // Official Saudi method
    MUSLIM_WORLD_LEAGUE,
    EGYPTIAN,
    KARACHI,
    ISNA,
    UOIF,
    DUBAI,
    QATAR,
    KUWAIT,
    SINGAPORE
}
```

### API Controller

```kotlin
@RestController
@RequestMapping("/api/prayer-times")
class PrayerTimeController(
    private val prayerTimeService: PrayerTimeService
) {
    @GetMapping
    fun getPrayerTimes(
        @RequestParam clubId: UUID,
        @RequestParam(required = false) date: LocalDate?
    ): PrayerTime? {
        return prayerTimeService.getPrayerTimesForClub(
            clubId,
            date ?: LocalDate.now()
        )
    }

    @GetMapping("/weekly")
    fun getWeeklyPrayerTimes(
        @RequestParam clubId: UUID,
        @RequestParam(required = false) startDate: LocalDate?
    ): List<PrayerTime> {
        return prayerTimeService.getWeeklyPrayerTimes(
            clubId,
            startDate ?: LocalDate.now()
        )
    }

    @GetMapping("/check-restriction")
    fun checkPrayerRestriction(
        @RequestParam clubId: UUID
    ): PrayerRestrictionResponse {
        val shouldBlock = prayerTimeService.shouldBlockCheckIn(clubId)
        val currentPrayer = prayerTimeService.getCurrentPrayerPeriod(clubId)

        return PrayerRestrictionResponse(
            checkInBlocked = shouldBlock,
            currentPrayerPeriod = currentPrayer
        )
    }
}
```

---

## Saudi Payment Methods

### 1. STC Pay (Mobile Wallet)

**Configuration:**
```yaml
liyaqa:
  payment:
    stcpay:
      enabled: ${STCPAY_ENABLED:false}
      api-url: "https://api.stcpay.com.sa/v1"
      merchant-id: ${STCPAY_MERCHANT_ID:}
      api-key: ${STCPAY_API_KEY:}
      secret-key: ${STCPAY_SECRET_KEY:}
      callback-url: ${STCPAY_CALLBACK_URL:}
      otp-expiry-seconds: 300
```

**Invoice Fields:**
```sql
ALTER TABLE invoices ADD COLUMN stcpay_transaction_id VARCHAR(100);
ALTER TABLE invoices ADD COLUMN stcpay_otp_reference VARCHAR(100);
ALTER TABLE invoices ADD COLUMN stcpay_payment_reference VARCHAR(100);
```

### 2. SADAD (Bill Payment System)

**Configuration:**
```yaml
liyaqa:
  payment:
    sadad:
      enabled: ${SADAD_ENABLED:false}
      api-url: "https://api.sadad.com/v1"
      biller-code: ${SADAD_BILLER_CODE:}
      api-key: ${SADAD_API_KEY:}
      secret-key: ${SADAD_SECRET_KEY:}
      bank-code: ${SADAD_BANK_CODE:}
      bill-validity-days: 30
```

**Invoice Fields:**
```sql
ALTER TABLE invoices ADD COLUMN sadad_bill_number VARCHAR(50);
ALTER TABLE invoices ADD COLUMN sadad_bill_account VARCHAR(50);
ALTER TABLE invoices ADD COLUMN sadad_due_date DATE;
ALTER TABLE invoices ADD COLUMN sadad_status VARCHAR(30);
```

### 3. Tamara (Buy Now Pay Later)

**Configuration:**
```yaml
liyaqa:
  payment:
    tamara:
      enabled: ${TAMARA_ENABLED:false}
      api-url: "https://api.tamara.co"
      api-token: ${TAMARA_API_TOKEN:}
      public-key: ${TAMARA_PUBLIC_KEY:}
      min-amount: 100    # SAR
      max-amount: 5000   # SAR
      default-instalments: 3
```

**Invoice Fields:**
```sql
ALTER TABLE invoices ADD COLUMN tamara_order_id VARCHAR(100);
ALTER TABLE invoices ADD COLUMN tamara_checkout_id VARCHAR(100);
ALTER TABLE invoices ADD COLUMN tamara_status VARCHAR(30);
ALTER TABLE invoices ADD COLUMN tamara_instalments INT;
```

### 4. PayTabs (Credit Cards)

**Configuration:**
```yaml
liyaqa:
  payment:
    paytabs:
      profile-id: ${PAYTABS_PROFILE_ID:}
      server-key: ${PAYTABS_SERVER_KEY:}
      region: SAU  # Saudi Arabia
      currency: SAR
      callback-url: ${PAYTABS_CALLBACK_URL:}
      return-url: ${PAYTABS_RETURN_URL:}
```

### Payment Methods Enum

```kotlin
enum class PaymentMethod {
    CASH,
    CARD,
    BANK_TRANSFER,
    ONLINE,
    MADA,           // Saudi debit card
    APPLE_PAY,
    STC_PAY,        // Saudi mobile wallet
    SADAD,          // Saudi bill payment
    TAMARA,         // BNPL
    PAYTABS,        // PayTabs gateway
    OTHER
}
```

---

## Cultural & Business Rules

### 1. Gender Segregation

```kotlin
enum class GenderPolicy {
    /** Open to all genders */
    MIXED,

    /** Male members only */
    MALE_ONLY,

    /** Female members only */
    FEMALE_ONLY,

    /** Time-based segregation */
    TIME_BASED
}

@Entity
@Table(name = "locations")
class Location(
    @Enumerated(EnumType.STRING)
    @Column(name = "gender_policy")
    var genderPolicy: GenderPolicy = GenderPolicy.MIXED
)

@Entity
@Table(name = "gym_classes")
class GymClass(
    @Enumerated(EnumType.STRING)
    @Column(name = "gender_restriction")
    var genderRestriction: GenderRestriction =
        GenderRestriction.MIXED
)
```

### 2. WhatsApp Business Integration

```kotlin
@Entity
@Table(name = "clubs")
class Club(
    @Column(name = "whatsapp_enabled")
    var whatsappEnabled: Boolean = false,

    @Column(name = "whatsapp_phone_number_id", length = 50)
    var whatsappPhoneNumberId: String? = null,

    @Column(name = "whatsapp_business_id", length = 50)
    var whatsappBusinessId: String? = null
)
```

### 3. Ramadan Business Hours

**Recommendation:** Clubs should adjust operating hours during Ramadan:
- Open after Iftar (breaking fast)
- Special Taraweeh prayer considerations
- Reduced daytime hours

**Implementation via Club Settings:**
```kotlin
fun isRamadanScheduleActive(): Boolean {
    return hijriDateConverter.isRamadan()
}

fun getOperatingHours(): OperatingHours {
    return if (isRamadanScheduleActive()) {
        ramadanOperatingHours
    } else {
        regularOperatingHours
    }
}
```

### 4. Islamic Holidays

Clubs automatically aware of Islamic holidays:
- Eid al-Fitr (3 days)
- Eid al-Adha (4 days)
- Islamic New Year
- Prophet's Birthday (Mawlid)

---

## Configuration Guide

### Complete Configuration Example

```yaml
# application.yml
liyaqa:
  # Billing & VAT
  billing:
    default-vat-rate: 15.00

  # ZATCA E-Invoicing
  zatca:
    enabled: ${ZATCA_ENABLED:false}
    seller-name: ${ZATCA_SELLER_NAME:}
    vat-registration-number: ${ZATCA_VAT_NUMBER:}

  # Payment Gateways
  payment:
    stcpay:
      enabled: ${STCPAY_ENABLED:false}
      merchant-id: ${STCPAY_MERCHANT_ID:}
      api-key: ${STCPAY_API_KEY:}

    sadad:
      enabled: ${SADAD_ENABLED:false}
      biller-code: ${SADAD_BILLER_CODE:}
      api-key: ${SADAD_API_KEY:}

    tamara:
      enabled: ${TAMARA_ENABLED:false}
      api-token: ${TAMARA_API_TOKEN:}
      min-amount: 100
      max-amount: 5000

    paytabs:
      profile-id: ${PAYTABS_PROFILE_ID:}
      server-key: ${PAYTABS_SERVER_KEY:}
      region: SAU
      currency: SAR
```

### Environment Variables

```bash
# ZATCA
ZATCA_ENABLED=true
ZATCA_SELLER_NAME="Your Fitness Company LLC"
ZATCA_VAT_NUMBER="300000000000003"

# STC Pay
STCPAY_ENABLED=true
STCPAY_MERCHANT_ID="YOUR_MERCHANT_ID"
STCPAY_API_KEY="YOUR_API_KEY"
STCPAY_SECRET_KEY="YOUR_SECRET_KEY"

# SADAD
SADAD_ENABLED=true
SADAD_BILLER_CODE="YOUR_BILLER_CODE"
SADAD_API_KEY="YOUR_API_KEY"

# Tamara
TAMARA_ENABLED=true
TAMARA_API_TOKEN="YOUR_API_TOKEN"
TAMARA_PUBLIC_KEY="YOUR_PUBLIC_KEY"

# PayTabs
PAYTABS_PROFILE_ID="YOUR_PROFILE_ID"
PAYTABS_SERVER_KEY="YOUR_SERVER_KEY"
```

---

## API Examples

### Get Prayer Times

```bash
GET /api/prayer-times?clubId=123e4567-e89b-12d3-a456-426614174000

Response:
{
  "date": "2024-01-15",
  "fajr": "05:30:00",
  "sunrise": "06:45:00",
  "dhuhr": "12:15:00",
  "asr": "15:30:00",
  "maghrib": "17:45:00",
  "isha": "19:15:00"
}
```

### Convert to Hijri Date

```bash
GET /api/calendar/hijri/convert?date=2024-01-15

Response:
{
  "year": 1445,
  "month": 7,
  "day": 4,
  "monthNameEn": "Rajab",
  "monthNameAr": "رجب",
  "formattedEn": "4 Rajab 1445",
  "formattedAr": "٤ رجب ١٤٤٥"
}
```

### Get Ramadan Info

```bash
GET /api/calendar/hijri/ramadan

Response:
{
  "isCurrentlyRamadan": false,
  "daysUntilRamadan": 45,
  "ramadanStartDate": "2024-03-11",
  "ramadanEndDate": "2024-04-09"
}
```

### Create Invoice with ZATCA

```bash
POST /api/invoices
{
  "memberId": "123e4567-e89b-12d3-a456-426614174000",
  "items": [
    {
      "description": {
        "en": "Monthly Membership",
        "ar": "اشتراك شهري"
      },
      "quantity": 1,
      "unitPrice": 500.00,
      "taxRate": 15.00
    }
  ]
}

Response:
{
  "id": "...",
  "invoiceNumber": "INV-2024-0001",
  "subtotal": {
    "amount": 500.00,
    "currency": "SAR"
  },
  "vatAmount": {
    "amount": 75.00,
    "currency": "SAR"
  },
  "totalAmount": {
    "amount": 575.00,
    "currency": "SAR"
  },
  "zatcaQrCode": "data:image/png;base64,iVBORw0KG...",
  "zatcaInvoiceHash": "a3f2b1..."
}
```

---

## Summary

Liyaqa provides **comprehensive Saudi Arabia compliance** with:

✅ **ZATCA Phase 1** - QR codes with TLV encoding
✅ **15% VAT** - Automatic calculation and reporting
✅ **Bilingual Support** - Arabic/English throughout
✅ **Hijri Calendar** - Umm Al-Qura implementation
✅ **Prayer Times** - Adhan library integration
✅ **Local Payments** - STC Pay, SADAD, Tamara, PayTabs
✅ **Cultural Features** - Gender policies, Ramadan support, Islamic holidays
✅ **WhatsApp Business** - Direct customer communication

All features are production-ready and follow Saudi regulatory requirements.

---

**Document Version:** 1.0
**Last Updated:** 2026-02-04
**Maintained By:** Liyaqa Development Team