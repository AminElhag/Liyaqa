# Infrastructure Components Guide

Complete catalog of all utility classes, helpers, infrastructure code, and supporting components in the Liyaqa backend.

**Last Updated:** 2026-02-04
**Backend Version:** Spring Boot 3.4.1 | Kotlin 2.2.0

---

## Table of Contents

1. [Utility Classes & Helpers](#utility-classes--helpers)
2. [Value Objects](#value-objects)
3. [Mappers](#mappers)
4. [Validators](#validators)
5. [Formatters](#formatters)
6. [Constants & Enums](#constants--enums)
7. [Event Listeners & Publishers](#event-listeners--publishers)
8. [Converters](#converters)
9. [Infrastructure Patterns](#infrastructure-patterns)

---

## Utility Classes & Helpers

### 1.1 Security & User Management

#### CurrentUserService

**Location:** `backend/src/main/kotlin/com/liyaqa/shared/infrastructure/security/CurrentUserService.kt`

**Purpose:** Provides convenient access to current authenticated user information.

**Key Methods:**

```kotlin
@Service
class CurrentUserService(private val securityService: SecurityService) {

    // Require methods (throw exception if not available)
    fun requireCurrentMemberId(): UUID
    fun requireCurrentUserId(): UUID
    fun requireCurrentTenantId(): UUID

    // Nullable getters (return null if not available)
    fun getCurrentMemberId(): UUID?
    fun getCurrentUserId(): UUID?
    fun getCurrentTenantId(): UUID?
}
```

**Usage Example:**
```kotlin
@Service
class SubscriptionService(
    private val currentUserService: CurrentUserService
) {
    fun createSubscription(command: CreateSubscriptionCommand): Subscription {
        val memberId = currentUserService.requireCurrentMemberId()
        val tenantId = currentUserService.requireCurrentTenantId()

        // ... create subscription
    }
}
```

#### SecurityService

**Location:** `backend/src/main/kotlin/com/liyaqa/shared/infrastructure/security/SecurityService.kt`

**Purpose:** Authorization checks for use in `@PreAuthorize` expressions and service layer.

**Key Methods:**

```kotlin
@Service
class SecurityService {
    // Self-access validation
    fun isSelf(memberId: UUID): Boolean
    fun isSelfUser(userId: UUID): Boolean
    fun ownsSubscription(subscriptionMemberId: UUID): Boolean

    // Role checks
    fun hasAnyRole(vararg roles: String): Boolean
    fun isAdmin(): Boolean
    fun isStaffOrAbove(): Boolean
    fun isSuperAdmin(): Boolean

    // Context getters
    fun getCurrentPrincipal(): JwtPrincipal?
    fun getCurrentUserId(): UUID?
    fun getCurrentMemberId(): UUID?
    fun getCurrentTenantId(): UUID?
}
```

**Usage in Controllers:**
```kotlin
@RestController
class SubscriptionController {

    @PreAuthorize("@securityService.isSelf(#memberId) or hasRole('STAFF')")
    @GetMapping("/members/{memberId}/subscriptions")
    fun getMemberSubscriptions(@PathVariable memberId: UUID): List<SubscriptionDto> {
        // Only member themselves or staff can access
    }

    @PreAuthorize("@securityService.ownsSubscription(#subscriptionId)")
    @PutMapping("/subscriptions/{subscriptionId}/freeze")
    fun freezeSubscription(@PathVariable subscriptionId: UUID) {
        // Only subscription owner can freeze
    }
}
```

#### CurrentUser

**Location:** `backend/src/main/kotlin/com/liyaqa/shared/infrastructure/security/CurrentUser.kt`

**Purpose:** Represents authenticated user for controller method injection.

**Properties:**
```kotlin
data class CurrentUser(
    val id: UUID,
    val tenantId: UUID?,
    val email: String,
    val role: Role,
    val permissions: Set<String>
) {
    fun hasPermission(permission: String): Boolean
    fun hasAnyPermission(vararg perms: String): Boolean
    fun hasRole(checkRole: Role): Boolean
    fun isAdmin(): Boolean = role == Role.CLUB_ADMIN || role == Role.SUPER_ADMIN
}
```

**Usage in Controllers:**
```kotlin
@RestController
class ProfileController {

    @GetMapping("/me")
    fun getProfile(@AuthenticationPrincipal currentUser: CurrentUser): ProfileDto {
        // Access authenticated user directly
        return profileService.getProfile(currentUser.id)
    }
}
```

---

### 1.2 File Storage Services

#### FileStorageService (Interface)

**Location:** `backend/src/main/kotlin/com/liyaqa/shared/infrastructure/storage/FileStorageService.kt`

**Purpose:** Abstract interface for pluggable file storage implementations.

```kotlin
interface FileStorageService {
    fun store(file: MultipartFile, category: FileCategory, referenceId: UUID?): StoredFile
    fun load(fileId: UUID): Resource
    fun getMetadata(fileId: UUID): StoredFile
    fun delete(fileId: UUID)
    fun getUrl(fileId: UUID): String
    fun validate(file: MultipartFile): FileValidationResult
}

enum class FileCategory {
    MEMBER_PROFILE, INVOICE_RECEIPT, DOCUMENT, CLUB_LOGO,
    CLASS_IMAGE, PRODUCT_IMAGE, OTHER
}
```

#### LocalFileStorageService

**Location:** `backend/src/main/kotlin/com/liyaqa/shared/infrastructure/storage/LocalFileStorageService.kt`

**Purpose:** Local filesystem implementation (development/testing).

**Directory Structure:**
```
{uploadDir}/
  ├── MEMBER_PROFILE/
  │   └── {referenceId}/
  │       ├── {uuid}.jpg
  │       └── {uuid}.png
  ├── INVOICE_RECEIPT/
  │   └── {referenceId}/
  │       └── {uuid}.pdf
  └── CLUB_LOGO/
      └── {uuid}.png
```

**Configuration:**
```yaml
liyaqa:
  storage:
    type: local
    max-file-size: 10485760  # 10MB
    allowed-types:
      - image/jpeg
      - image/png
      - image/gif
      - image/webp
      - application/pdf
    local:
      upload-dir: ./uploads
```

#### S3FileStorageService

**Location:** `backend/src/main/kotlin/com/liyaqa/shared/infrastructure/storage/S3FileStorageService.kt`

**Purpose:** AWS S3 implementation for production.

**S3 Key Structure:**
```
{bucket}/
  └── {tenantId}/
      └── {category}/
          └── {referenceId}/
              └── {uuid}.{extension}
```

**Features:**
- Presigned URLs (7-day validity)
- Server-side AES256 encryption
- Multi-tenant isolation via S3 key prefix
- Object metadata tags (tenant_id, category, reference_id)

**Configuration:**
```yaml
liyaqa:
  storage:
    type: s3
    s3:
      bucket: liyaqa-files-prod
      region: eu-central-1
```

**Usage Example:**
```kotlin
@Service
class MemberService(
    private val fileStorageService: FileStorageService
) {
    fun uploadProfilePicture(memberId: UUID, file: MultipartFile): StoredFile {
        // Validate file
        val validation = fileStorageService.validate(file)
        if (!validation.valid) {
            throw IllegalArgumentException(validation.error)
        }

        // Store file
        return fileStorageService.store(
            file = file,
            category = FileCategory.MEMBER_PROFILE,
            referenceId = memberId
        )
    }
}
```

---

### 1.3 QR Code Generation

#### QrCodeService

**Location:** `backend/src/main/kotlin/com/liyaqa/shared/infrastructure/qr/QrCodeService.kt`

**Purpose:** QR code generation and validation for check-ins.

**Key Methods:**

```kotlin
@Service
class QrCodeService {

    // Token generation
    fun generateMemberQrToken(
        memberId: UUID,
        expirationMinutes: Long = 1440  // 24 hours
    ): String

    fun generateSessionQrToken(
        sessionId: UUID,
        expirationMinutes: Long = 240  // 4 hours
    ): String

    // Token validation
    fun validateQrToken(token: String): QrTokenPayload?

    // Image generation
    fun generateQrCodeImage(
        content: String,
        width: Int = 300,
        height: Int = 300
    ): ByteArray

    fun generateQrCodeDataUrl(
        content: String,
        width: Int = 300,
        height: Int = 300
    ): String  // Returns: data:image/png;base64,...
}

data class QrTokenPayload(
    val id: UUID,
    val type: String,  // "check_in" or "session_check_in"
    val expiresAt: Instant
)
```

**Token Format (JWT):**
```json
{
  "sub": "123e4567-e89b-12d3-a456-426614174000",
  "type": "check_in",
  "iat": 1675512345,
  "exp": 1675598745
}
```

**QR Code Settings:**
- Format: QR_CODE (ZXing library)
- Charset: UTF-8
- Error Correction: Level M (15% redundancy)
- Margin: 2 pixels

**Usage Example:**
```kotlin
@RestController
class MemberController(
    private val qrCodeService: QrCodeService
) {
    @GetMapping("/members/{memberId}/qr-code")
    fun getMemberQrCode(@PathVariable memberId: UUID): ResponseEntity<ByteArray> {
        // Generate token
        val token = qrCodeService.generateMemberQrToken(memberId)

        // Generate QR code image
        val qrImage = qrCodeService.generateQrCodeImage(token, 400, 400)

        return ResponseEntity.ok()
            .contentType(MediaType.IMAGE_PNG)
            .body(qrImage)
    }

    @PostMapping("/attendance/qr-check-in")
    fun checkInWithQr(@RequestBody request: QrCheckInRequest): AttendanceDto {
        // Validate QR token
        val payload = qrCodeService.validateQrToken(request.token)
            ?: throw IllegalArgumentException("Invalid or expired QR code")

        if (payload.type != "check_in") {
            throw IllegalArgumentException("Invalid QR code type")
        }

        // Process check-in
        return attendanceService.checkInWithMemberId(payload.id)
    }
}
```

---

### 1.4 Prayer Time Calculation

#### PrayerTimeService

**Location:** `backend/src/main/kotlin/com/liyaqa/shared/infrastructure/prayer/PrayerTimeService.kt`

**Purpose:** Islamic prayer time calculations using Adhan library.

**Key Methods:**

```kotlin
@Service
class PrayerTimeService {

    // Club-based methods (uses club location settings)
    fun getPrayerTimesForClub(clubId: UUID, date: LocalDate): PrayerTime
    fun getWeeklyPrayerTimes(clubId: UUID, startDate: LocalDate): List<PrayerTime>
    fun shouldBlockCheckIn(clubId: UUID, currentTime: LocalDateTime): Boolean
    fun getCurrentPrayerPeriod(clubId: UUID, currentTime: LocalDateTime): String?

    // Direct calculation
    fun calculatePrayerTimes(
        latitude: Double,
        longitude: Double,
        date: LocalDate,
        method: PrayerCalculationMethod = PrayerCalculationMethod.UMM_AL_QURA
    ): PrayerTime

    // City lookup
    fun getCityCoordinates(cityName: String): Pair<Double, Double>?
    fun getSupportedCities(): List<String>
}

data class PrayerTime(
    val date: LocalDate,
    val fajr: LocalTime,
    val sunrise: LocalTime,
    val dhuhr: LocalTime,
    val asr: LocalTime,
    val maghrib: LocalTime,
    val isha: LocalTime
)

enum class PrayerCalculationMethod {
    UMM_AL_QURA,          // Saudi official method
    MUSLIM_WORLD_LEAGUE,
    EGYPTIAN,
    KARACHI,
    ISNA,                 // North America
    UOIF,
    DUBAI,
    QATAR,
    KUWAIT,
    SINGAPORE
}
```

**Pre-configured Saudi Cities (20+):**
- Riyadh (24.7136°N, 46.6753°E)
- Jeddah (21.5433°N, 39.1728°E)
- Makkah (21.4225°N, 39.8262°E)
- Madinah (24.4672°N, 39.6111°E)
- Dammam, Khobar, Dhahran, Abha, Taif, Tabuk, etc.

**Usage Example:**
```kotlin
// Get prayer times for club
val prayerTimes = prayerTimeService.getPrayerTimesForClub(clubId, LocalDate.now())

// Check if check-in should be blocked
val shouldBlock = prayerTimeService.shouldBlockCheckIn(clubId, LocalDateTime.now())
if (shouldBlock) {
    val prayerName = prayerTimeService.getCurrentPrayerPeriod(clubId, LocalDateTime.now())
    throw IllegalStateException("Check-in blocked during $prayerName prayer time")
}

// Get weekly schedule
val weeklyPrayers = prayerTimeService.getWeeklyPrayerTimes(clubId, LocalDate.now())
```

**Club Configuration:**
```kotlin
@Entity
class Club {
    // Prayer time settings
    var city: String? = null
    var latitude: Double? = null
    var longitude: Double? = null
    var prayerCalculationMethod: PrayerCalculationMethod = UMM_AL_QURA
    var prayerBufferMinutes: Int = 30  // Block check-in 30min before/after
    var blockCheckinDuringPrayer: Boolean = false
}
```

---

### 1.5 Islamic Calendar (Hijri) Conversion

#### HijriDateConverter

**Location:** `backend/src/main/kotlin/com/liyaqa/shared/infrastructure/calendar/HijriDateConverter.kt`

**Purpose:** Convert between Gregorian and Hijri (Umm Al-Qura) calendars.

**Key Methods:**

```kotlin
@Service
class HijriDateConverter {

    // Conversion
    fun toHijri(gregorianDate: LocalDate): HijriDate
    fun toGregorian(hijriDate: HijriDate): LocalDate

    // Current date helpers
    fun todayHijri(): HijriDate
    fun currentHijriYear(): Int

    // Islamic events
    fun getIslamicEventsForYear(hijriYear: Int): List<IslamicEvent>
    fun getIslamicEventsThisYear(): List<IslamicEvent>
    fun getUpcomingEvents(daysAhead: Int = 90): List<IslamicEvent>

    // Calendar utilities
    fun getDaysInMonth(hijriYear: Int, hijriMonth: Int): Int
    fun isLeapYear(hijriYear: Int): Boolean

    // Ramadan helpers
    fun isRamadan(): Boolean
    fun getRamadanDates(hijriYear: Int): Pair<LocalDate, LocalDate>
    fun getDaysUntilRamadan(): Long
    fun getCurrentMonthInfo(): HijriMonthInfo
}

data class HijriDate(
    val year: Int,
    val month: Int,  // 1-12
    val day: Int     // 1-29/30
) {
    fun toGregorian(): LocalDate
    override fun toString(): String  // Format: "1445-09-15"
}

data class IslamicEvent(
    val name: LocalizedText,
    val hijriDate: HijriDate,
    val gregorianDate: LocalDate,
    val isPublicHoliday: Boolean
)
```

**Islamic Events (Automatically Detected):**
- Ramadan Start/End (Month 9)
- Eid al-Fitr (1 Shawwal)
- Eid al-Adha (10 Dhul Hijjah)
- Islamic New Year (1 Muharram)
- Ashura (10 Muharram)
- Mawlid al-Nabi (12 Rabi' al-Awwal)
- Laylat al-Qadr (27 Ramadan, estimated)
- Day of Arafah (9 Dhul Hijjah)

**Usage Example:**
```kotlin
// Convert today to Hijri
val todayHijri = hijriDateConverter.todayHijri()
println("Today (Hijri): $todayHijri")  // "1445-09-15"

// Check if Ramadan
if (hijriDateConverter.isRamadan()) {
    println("It's Ramadan! Special hours apply.")
}

// Get upcoming events
val upcomingEvents = hijriDateConverter.getUpcomingEvents(daysAhead = 30)
upcomingEvents.forEach { event ->
    println("${event.name.en} on ${event.gregorianDate}")
}

// Convert specific Hijri date to Gregorian
val eidDate = HijriDate(year = 1446, month = 10, day = 1)  // Eid al-Adha
val eidGregorian = hijriDateConverter.toGregorian(eidDate)
```

---

### 1.6 Export/Reporting Services

#### ExportService

**Location:** `backend/src/main/kotlin/com/liyaqa/shared/infrastructure/export/ExportService.kt`

**Purpose:** Generates CSV exports of business data with bilingual headers.

**Export Methods:**

```kotlin
@Service
class ExportService {

    fun exportMembers(
        status: MemberStatus? = null,
        joinedAfter: LocalDate? = null,
        joinedBefore: LocalDate? = null
    ): ByteArray

    fun exportSubscriptions(
        status: SubscriptionStatus? = null,
        planId: UUID? = null,
        expiringBefore: LocalDate? = null
    ): ByteArray

    fun exportInvoices(
        status: InvoiceStatus? = null,
        dateFrom: LocalDate? = null,
        dateTo: LocalDate? = null
    ): ByteArray

    fun exportAttendance(
        locationId: UUID? = null,
        dateFrom: LocalDate,
        dateTo: LocalDate
    ): ByteArray

    fun exportBookings(
        classId: UUID? = null,
        status: BookingStatus? = null,
        dateFrom: LocalDate,
        dateTo: LocalDate
    ): ByteArray

    fun generateFilename(exportType: ExportType): String
}

enum class ExportType(
    val filenamePrefix: String,
    val displayName: String,
    val displayNameAr: String
) {
    MEMBERS("members", "Members Export", "تصدير الأعضاء"),
    SUBSCRIPTIONS("subscriptions", "Subscriptions Export", "تصدير الاشتراكات"),
    INVOICES("invoices", "Invoices Export", "تصدير الفواتير"),
    ATTENDANCE("attendance", "Attendance Export", "تصدير الحضور"),
    BOOKINGS("bookings", "Bookings Export", "تصدير الحجوزات")
}
```

**Features:**
- Bilingual column headers (English/Arabic)
- UTF-8 BOM for Excel compatibility
- Pre-fetching to prevent N+1 queries
- Max 10,000 rows per export
- Paginated queries for efficiency
- Timestamped filenames

**CSV Format Example:**
```csv
Member ID,Email,First Name,Last Name,Status,Joined Date
معرف العضو,البريد الإلكتروني,الاسم الأول,اسم العائلة,الحالة,تاريخ الانضمام
123e4567-...,john@example.com,John,Doe,ACTIVE,2024-01-15
456e7890-...,ahmed@example.com,Ahmed,Ali,ACTIVE,2024-02-20
```

**Usage Example:**
```kotlin
@RestController
class ExportController(
    private val exportService: ExportService
) {
    @GetMapping("/export/members")
    fun exportMembers(
        @RequestParam status: MemberStatus?,
        @RequestParam joinedAfter: LocalDate?
    ): ResponseEntity<ByteArray> {
        val csvBytes = exportService.exportMembers(status, joinedAfter)
        val filename = exportService.generateFilename(ExportType.MEMBERS)

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"$filename\"")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(csvBytes)
    }
}
```

#### CsvExportWriter

**Location:** `backend/src/main/kotlin/com/liyaqa/shared/infrastructure/export/CsvExportWriter.kt`

**Purpose:** Low-level CSV generation utility.

```kotlin
object CsvExportWriter {

    fun write(headers: List<String>, rows: List<List<Any?>>): ByteArray

    fun writeWithBilingualHeaders(
        headersEn: List<String>,
        headersAr: List<String>,
        rows: List<List<Any?>>
    ): ByteArray

    private fun formatValue(value: Any?): String
    private fun escapeValue(value: String): String
}
```

**Features:**
- UTF-8 BOM prefix (0xEF, 0xBB, 0xBF)
- Proper CSV escaping (quotes, commas, newlines)
- Automatic type formatting:
  - Dates: ISO-8601 format
  - Booleans: true/false
  - Enums: name
  - Nulls: empty string

---

## Value Objects

**Location:** `backend/src/main/kotlin/com/liyaqa/shared/domain/ValueObjects.kt`

Value objects are immutable, embeddable objects representing domain concepts.

### LocalizedText

**Purpose:** Bilingual text fields (Arabic/English).

```kotlin
@Embeddable
data class LocalizedText(
    @Column(name = "_en", nullable = false)
    val en: String,

    @Column(name = "_ar")
    val ar: String? = null
) {
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

**Usage:**
```kotlin
@Entity
class MembershipPlan {
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "name_en")),
        AttributeOverride(name = "ar", column = Column(name = "name_ar"))
    )
    var name: LocalizedText

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "description_en")),
        AttributeOverride(name = "ar", column = Column(name = "description_ar"))
    )
    var description: LocalizedText?
}
```

### LocalizedTextInput

**Purpose:** Input DTO for receiving bilingual text.

```kotlin
data class LocalizedTextInput(
    @field:NotBlank(message = "English text is required")
    val en: String,
    val ar: String? = null
) {
    fun toLocalizedText() = LocalizedText(en, ar)
}
```

### FlexibleLocalizedTextInput

**Purpose:** Flexible input allowing either English OR Arabic (at least one required).

```kotlin
@AtLeastOneLanguage
data class FlexibleLocalizedTextInput(
    val en: String? = null,
    val ar: String? = null
) {
    fun toLocalizedText() = LocalizedText(en ?: "", ar)
}

// Custom validation annotation
@AtLeastOneLanguage
annotation class AtLeastOneLanguage(
    val message: String = "At least one language (English or Arabic) is required",
    val messageAr: String = "مطلوب لغة واحدة على الأقل (إنجليزي أو عربي)"
)
```

### LocalizedAddress

**Purpose:** Zatca-compliant bilingual address.

```kotlin
@Embeddable
data class LocalizedAddress(
    @Embedded val street: LocalizedText? = null,
    @Embedded val building: LocalizedText? = null,
    @Embedded val city: LocalizedText? = null,
    @Embedded val district: LocalizedText? = null,
    @Column(name = "postal_code") val postalCode: String? = null,
    @Column(name = "country_code", length = 2) val countryCode: String? = null  // ISO 3166-1
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

### Money

**Purpose:** Monetary amounts with safe arithmetic.

```kotlin
@Embeddable
data class Money(
    val amount: BigDecimal,
    val currency: String = "USD"
) : Comparable<Money> {

    init {
        require(amount.scale() <= 2) { "Money amount cannot have more than 2 decimal places" }
    }

    companion object {
        val ZERO = Money(BigDecimal.ZERO)

        fun of(amount: Double, currency: String = "USD"): Money
        fun of(amount: BigDecimal, currency: String = "USD"): Money
    }

    // Arithmetic operators
    operator fun plus(other: Money): Money
    operator fun minus(other: Money): Money
    operator fun times(multiplier: Int): Money
    operator fun times(multiplier: BigDecimal): Money

    // Predicates
    fun isPositive(): Boolean = amount > BigDecimal.ZERO
    fun isNegative(): Boolean = amount < BigDecimal.ZERO
    fun isZero(): Boolean = amount.compareTo(BigDecimal.ZERO) == 0

    override fun compareTo(other: Money): Int
    override fun toString(): String = "$currency $amount"
}
```

**Usage:**
```kotlin
val price = Money.of(99.99, "SAR")
val discount = Money.of(10.00, "SAR")
val total = price - discount  // Money(89.99, "SAR")

if (total.isPositive()) {
    println("Total: $total")  // "SAR 89.99"
}
```

### Email

**Purpose:** Validated email address.

```kotlin
@JvmInline
value class Email(val value: String) {
    init {
        require(value.matches(EMAIL_REGEX)) { "Invalid email format: $value" }
    }

    companion object {
        private val EMAIL_REGEX = Regex("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")
    }

    override fun toString(): String = value
}
```

### PhoneNumber

**Purpose:** Validated phone number (E.164 format).

```kotlin
@JvmInline
value class PhoneNumber(val value: String) {
    init {
        require(value.matches(PHONE_REGEX)) { "Invalid phone number format: $value" }
    }

    companion object {
        private val PHONE_REGEX = Regex("^\\+?[1-9]\\d{1,14}$")
    }

    override fun toString(): String = value
}
```

### TaxableFee

**Purpose:** Fee with automatic tax calculation (Saudi VAT).

```kotlin
@Embeddable
data class TaxableFee(
    @Column(name = "_amount", nullable = false)
    val amount: BigDecimal = BigDecimal.ZERO,

    @Column(name = "_currency", nullable = false)
    val currency: String = "SAR",

    @Column(name = "_tax_rate", nullable = false)
    val taxRate: BigDecimal = BigDecimal.ZERO  // Percentage 0-100
) {
    init {
        require(amount >= BigDecimal.ZERO) { "Fee amount cannot be negative" }
        require(taxRate >= BigDecimal.ZERO && taxRate <= BigDecimal("100")) {
            "Tax rate must be between 0 and 100"
        }
    }

    fun getNetAmount(): Money
    fun getTaxAmount(): Money
    fun getGrossAmount(): Money = getNetAmount() + getTaxAmount()
    fun isZero(): Boolean

    companion object {
        val ZERO = TaxableFee()

        fun of(
            amount: BigDecimal,
            currency: String = "SAR",
            taxRate: BigDecimal = BigDecimal("15.00")  // Saudi VAT
        ): TaxableFee
    }
}
```

**Usage:**
```kotlin
@Entity
class MembershipPlan {
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "_amount", column = Column(name = "membership_fee_amount")),
        AttributeOverride(name = "_currency", column = Column(name = "membership_fee_currency")),
        AttributeOverride(name = "_tax_rate", column = Column(name = "membership_fee_tax_rate"))
    )
    var membershipFee: TaxableFee = TaxableFee.ZERO
}

// Calculate totals
val net = plan.membershipFee.getNetAmount()      // SAR 100.00
val tax = plan.membershipFee.getTaxAmount()      // SAR 15.00
val gross = plan.membershipFee.getGrossAmount()  // SAR 115.00
```

---

## Mappers

**Pattern:** The codebase does NOT use dedicated mapper classes (no MapStruct). Instead, it uses:

1. **Companion Object Mappers in DTOs**
2. **Extension Functions**
3. **Inline Service Mapping**

**Example Patterns:**

```kotlin
// Pattern 1: Companion object mapper
data class MemberDto(
    val id: UUID,
    val email: String,
    val firstName: String,
    val lastName: String,
    val status: MemberStatus
) {
    companion object {
        fun from(member: Member): MemberDto {
            return MemberDto(
                id = member.id,
                email = member.email,
                firstName = member.firstName,
                lastName = member.lastName,
                status = member.status
            )
        }
    }
}

// Usage in controller
@GetMapping("/{id}")
fun getMember(@PathVariable id: UUID): MemberDto {
    val member = memberService.getMember(id)
    return MemberDto.from(member)
}

// Pattern 2: Extension function
fun Member.toDto(): MemberDto = MemberDto(
    id = id,
    email = email,
    firstName = firstName,
    lastName = lastName,
    status = status
)

// Pattern 3: Inline mapping
fun createMember(request: CreateMemberRequest): Member {
    return Member(
        email = request.email,
        firstName = request.firstName,
        lastName = request.lastName
    )
}
```

---

## Validators

### ProductionConfigValidator

**Location:** `backend/src/main/kotlin/com/liyaqa/config/ProductionConfigValidator.kt`

**Purpose:** Validates production environment configuration on startup.

**Profile:** `@Profile("prod")` - Only runs in production

**Validation Categories:**

#### 1. Required Variables
- DATABASE_URL, DATABASE_USERNAME, DATABASE_PASSWORD
- JWT_SECRET (min 32 chars, not development defaults)
- CORS_ALLOWED_ORIGINS
- STORAGE_TYPE (must be s3 or minio in prod)

#### 2. Conditional Variables

**If Payments Enabled:**
- PAYTABS_PROFILE_ID
- PAYTABS_SERVER_KEY

**If ZATCA Enabled:**
- ZATCA_SELLER_NAME
- ZATCA_VAT_NUMBER (15 digits)

**If Email Enabled:**
- SMTP_HOST
- SMTP_USERNAME
- SMTP_PASSWORD

**If SMS Enabled:**
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_FROM_NUMBER

**If Storage Type = S3:**
- S3_BUCKET
- S3_REGION

**If Storage Type = MinIO:**
- MINIO_ENDPOINT
- MINIO_ACCESS_KEY
- MINIO_SECRET_KEY
- MINIO_BUCKET

#### 3. Recommended Variables (Warnings)
- HSTS_ENABLED (should be true in production)
- EMAIL_BASE_URL
- PAYTABS_CALLBACK_URL
- PAYTABS_RETURN_URL

#### 4. Security Checks
- Detects default/development values
- Validates JWT_SECRET length
- Prevents default database passwords
- Rejects local storage in production

**Implementation:**
```kotlin
@Component
@Profile("prod")
class ProductionConfigValidator : ApplicationListener<ApplicationReadyEvent> {

    @Value("\${DATABASE_URL:}")
    private lateinit var databaseUrl: String

    @Value("\${JWT_SECRET:}")
    private lateinit var jwtSecret: String

    // ... other properties

    override fun onApplicationEvent(event: ApplicationReadyEvent) {
        val errors = mutableListOf<String>()
        val warnings = mutableListOf<String>()

        // Required checks
        if (databaseUrl.isBlank()) {
            errors.add("DATABASE_URL is required in production")
        }

        if (jwtSecret.length < 32) {
            errors.add("JWT_SECRET must be at least 32 characters")
        }

        if (jwtSecret.contains("development") || jwtSecret.contains("default")) {
            errors.add("JWT_SECRET contains development/default value")
        }

        // Conditional checks
        if (zatcaEnabled && zatcaVatNumber.isBlank()) {
            errors.add("ZATCA_VAT_NUMBER required when ZATCA_ENABLED=true")
        }

        // Fail fast if errors
        if (errors.isNotEmpty()) {
            errors.forEach { logger.error(it) }
            throw IllegalStateException(
                "Production configuration validation failed. See logs for details."
            )
        }

        // Log warnings
        warnings.forEach { logger.warn(it) }
    }
}
```

---

## Formatters

**Pattern:** No dedicated formatter classes. The codebase uses:

1. **Built-in Java/Kotlin formatters**: `DateTimeFormatter`, `DecimalFormat`
2. **Value object `toString()` methods**: `Money`, `LocalizedText`
3. **CsvExportWriter.formatValue()**: Handles CSV-specific formatting

**Common Patterns:**

```kotlin
// Date formatting
val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
val dateString = LocalDate.now().format(formatter)

// Money formatting (via toString)
val money = Money.of(99.99, "SAR")
println(money.toString())  // "SAR 99.99"

// Localized text formatting
val text = LocalizedText(en = "Welcome", ar = "أهلاً")
println(text.get("ar"))  // "أهلاً"
println(text.get("en"))  // "Welcome"

// Address formatting
val address = LocalizedAddress(...)
println(address.toFormattedString("en"))  // "Building 123, Main St, Downtown, Riyadh, 12345, SA"
```

---

## Constants & Enums

### Domain Enums (by Module)

#### Attendance
```kotlin
enum class CheckInMethod {
    MANUAL, QR_CODE, CARD, BIOMETRIC
}

enum class AttendanceStatus {
    CHECKED_IN, CHECKED_OUT, AUTO_CHECKED_OUT
}
```

#### Organization
```kotlin
enum class OrganizationType {
    LLC, SOLE_PROPRIETORSHIP, PARTNERSHIP, CORPORATION, OTHER
}

enum class OrganizationStatus {
    PENDING, ACTIVE, SUSPENDED, CLOSED
}

enum class ClubStatus {
    ACTIVE, SUSPENDED, CLOSED
}

enum class LocationStatus {
    ACTIVE, TEMPORARILY_CLOSED, PERMANENTLY_CLOSED
}
```

#### Gender Policy
```kotlin
enum class GenderPolicy {
    MIXED, MALE_ONLY, FEMALE_ONLY
}

enum class GenderSegregationType {
    NONE, TIME_BASED, SPACE_BASED, COMPLETE
}
```

#### Authentication & Authorization
```kotlin
enum class Role {
    // Platform roles
    PLATFORM_ADMIN, SALES_REP, MARKETING, SUPPORT,

    // Client roles
    SUPER_ADMIN, CLUB_ADMIN, STAFF, TRAINER, MEMBER
}

enum class UserStatus {
    ACTIVE, INACTIVE, LOCKED, PENDING_VERIFICATION
}
```

#### Notifications
```kotlin
enum class NotificationType {
    // Subscription
    SUBSCRIPTION_CREATED, SUBSCRIPTION_EXPIRING_7_DAYS,
    SUBSCRIPTION_EXPIRING_3_DAYS, SUBSCRIPTION_EXPIRING_1_DAY,
    SUBSCRIPTION_EXPIRED, LOW_CLASSES_REMAINING,

    // Invoice
    INVOICE_CREATED, INVOICE_DUE_SOON, INVOICE_OVERDUE, INVOICE_PAID,

    // Booking
    CLASS_BOOKING_CONFIRMED, CLASS_BOOKING_CANCELLED,
    CLASS_BOOKING_REMINDER_24H, CLASS_BOOKING_REMINDER_1H,
    CLASS_WAITLIST_PROMOTED, CLASS_SESSION_CANCELLED,

    // Attendance
    CHECK_IN_CONFIRMATION,

    // Account
    WELCOME, PASSWORD_RESET, PASSWORD_CHANGED, ACCOUNT_LOCKED,

    // Member status
    MEMBER_SUSPENDED, MEMBER_REACTIVATED,

    CUSTOM
}

enum class NotificationChannel {
    EMAIL, SMS, WHATSAPP, PUSH, IN_APP
}

enum class NotificationStatus {
    PENDING, SENT, DELIVERED, FAILED, READ
}

enum class NotificationPriority {
    LOW, NORMAL, HIGH, URGENT
}
```

#### Scheduling
```kotlin
enum class GymClassStatus {
    ACTIVE, INACTIVE, ARCHIVED
}

enum class SessionStatus {
    SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
}

enum class BookingStatus {
    CONFIRMED, WAITLISTED, CHECKED_IN, NO_SHOW, CANCELLED
}

enum class DayOfWeek {
    SUNDAY, MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY
}

enum class DifficultyLevel {
    BEGINNER, INTERMEDIATE, ADVANCED, ALL_LEVELS
}

enum class ClassType {
    GROUP_FITNESS, PERSONAL_TRAINING, YOGA, PILATES, SPINNING,
    CROSSFIT, SWIMMING, MARTIAL_ARTS, DANCE, OTHER
}

enum class ClassPricingModel {
    INCLUDED_IN_MEMBERSHIP, PAY_PER_ENTRY, CLASS_PACK_ONLY, HYBRID
}
```

#### Billing
```kotlin
enum class InvoiceStatus {
    DRAFT, ISSUED, PAID, PARTIALLY_PAID, OVERDUE, CANCELLED, REFUNDED
}

enum class PaymentMethod {
    CASH, CARD, BANK_TRANSFER, ONLINE,
    MADA, APPLE_PAY, STC_PAY, SADAD, TAMARA, PAYTABS,
    OTHER
}

enum class LineItemType {
    SUBSCRIPTION, CLASS_PACKAGE, GUEST_PASS, PERSONAL_TRAINING,
    MERCHANDISE, LOCKER_RENTAL, PENALTY, DISCOUNT, OTHER
}
```

#### CRM/Leads
```kotlin
enum class LeadStatus {
    NEW, CONTACTED, TOUR_SCHEDULED, TRIAL, NEGOTIATION, WON, LOST
}

enum class LeadSource {
    REFERRAL, WALK_IN, SOCIAL_MEDIA, PAID_ADS, WEBSITE,
    PHONE_CALL, EMAIL, PARTNER, EVENT, OTHER
}

enum class LeadActivityType {
    CALL, EMAIL, SMS, WHATSAPP, MEETING, TOUR, NOTE,
    STATUS_CHANGE, ASSIGNMENT, FOLLOW_UP_SCHEDULED, FOLLOW_UP_COMPLETED
}

enum class LeadPriority {
    LOW, MEDIUM, HIGH, URGENT
}
```

#### Webhooks
```kotlin
enum class WebhookEventType(val value: String) {
    // Member events
    MEMBER_CREATED("member.created"),
    MEMBER_UPDATED("member.updated"),
    MEMBER_DELETED("member.deleted"),

    // Subscription events
    SUBSCRIPTION_CREATED("subscription.created"),
    SUBSCRIPTION_ACTIVATED("subscription.activated"),
    SUBSCRIPTION_RENEWED("subscription.renewed"),
    SUBSCRIPTION_EXPIRED("subscription.expired"),
    SUBSCRIPTION_CANCELLED("subscription.cancelled"),
    SUBSCRIPTION_FROZEN("subscription.frozen"),
    SUBSCRIPTION_UNFROZEN("subscription.unfrozen"),

    // Invoice events
    INVOICE_CREATED("invoice.created"),
    INVOICE_ISSUED("invoice.issued"),
    INVOICE_PAID("invoice.paid"),
    INVOICE_VOIDED("invoice.voided"),
    INVOICE_OVERDUE("invoice.overdue"),

    // Attendance events
    ATTENDANCE_CHECKIN("attendance.checkin"),
    ATTENDANCE_CHECKOUT("attendance.checkout"),

    // Booking events
    BOOKING_CREATED("booking.created"),
    BOOKING_CONFIRMED("booking.confirmed"),
    BOOKING_CANCELLED("booking.cancelled"),
    BOOKING_COMPLETED("booking.completed"),
    BOOKING_NO_SHOW("booking.no_show"),

    // Class events
    CLASS_SESSION_CREATED("class_session.created"),
    CLASS_SESSION_CANCELLED("class_session.cancelled"),

    // Shop events
    ORDER_CREATED("order.created"),
    ORDER_PAID("order.paid"),
    ORDER_COMPLETED("order.completed"),

    // Lead events
    LEAD_CREATED("lead.created"),
    LEAD_UPDATED("lead.updated"),
    LEAD_STATUS_CHANGED("lead.status_changed"),
    LEAD_CONVERTED("lead.converted"),
    LEAD_ASSIGNED("lead.assigned")
}

enum class DeliveryStatus {
    PENDING, IN_PROGRESS, DELIVERED, FAILED, EXHAUSTED
}
```

#### Compliance (40+ enums)

**Security Events:**
```kotlin
enum class SecurityEventType {
    AUTH_FAILURE, INTRUSION_ATTEMPT, PII_ACCESS, SUSPICIOUS_ACTIVITY,
    PASSWORD_CHANGE, ROLE_CHANGE, DATA_EXPORT, CONFIG_CHANGE,
    LOGIN_SUCCESS, LOGOUT, SESSION_EXPIRED, MFA_CHALLENGE,
    API_ACCESS, PERMISSION_DENIED
}

enum class SecuritySeverity { LOW, MEDIUM, HIGH, CRITICAL }
enum class SecurityOutcome { SUCCESS, FAILURE, BLOCKED }
```

**Compliance Framework:**
```kotlin
enum class FrameworkCode { ISO_27001, SOC_2, PCI_DSS, PDPL }

enum class ComplianceStatus {
    NOT_STARTED, IN_PROGRESS, COMPLIANT, NON_COMPLIANT, CERTIFIED
}

enum class ControlStatus {
    NOT_IMPLEMENTED, IN_PROGRESS, IMPLEMENTED, NOT_APPLICABLE
}

enum class ControlEffectiveness {
    EFFECTIVE, PARTIALLY_EFFECTIVE, NOT_EFFECTIVE, NOT_TESTED
}
```

**Risk Assessment:**
```kotlin
enum class RiskCategory {
    STRATEGIC, OPERATIONAL, FINANCIAL, COMPLIANCE,
    IT_SECURITY, DATA_PRIVACY, REPUTATIONAL, THIRD_PARTY
}

enum class RiskLikelihood {
    RARE, UNLIKELY, POSSIBLE, LIKELY, ALMOST_CERTAIN
}

enum class RiskImpact {
    INSIGNIFICANT, MINOR, MODERATE, MAJOR, CATASTROPHIC
}

enum class RiskLevel { LOW, MEDIUM, HIGH, CRITICAL }
enum class RiskTreatment { ACCEPT, MITIGATE, TRANSFER, AVOID }
```

**PDPL/Privacy:**
```kotlin
enum class LegalBasis {
    CONSENT, CONTRACT, LEGAL_OBLIGATION, VITAL_INTEREST,
    PUBLIC_INTEREST, LEGITIMATE_INTEREST
}

enum class ConsentType {
    MARKETING, DATA_PROCESSING, THIRD_PARTY_SHARING, PROFILING,
    BIOMETRIC, HEALTH_DATA, LOCATION_TRACKING, CROSS_BORDER_TRANSFER
}

enum class DataSubjectRequestType {
    ACCESS, RECTIFICATION, ERASURE, PORTABILITY, RESTRICTION, OBJECTION
}

enum class DSRStatus {
    RECEIVED, IDENTITY_PENDING, IN_PROGRESS, PENDING_APPROVAL,
    COMPLETED, REJECTED, EXTENDED
}
```

#### Access Control
```kotlin
enum class DeviceType {
    TURNSTILE, SPEED_GATE, BIOMETRIC_TERMINAL, RFID_READER, QR_SCANNER
}

enum class DeviceManufacturer {
    GUNNEBO, SUPREMA, HID, ZKTECO, BOON_EDAM, CUSTOM
}

enum class ZoneType {
    GYM_FLOOR, LOCKER_ROOM, POOL, STUDIO, SPA, RESTRICTED,
    LOBBY, CAFE, KIDS_AREA
}

enum class CardType { RFID, NFC, MIFARE, HID_PROX, HID_ICLASS }
enum class BiometricType { FINGERPRINT, FACE, PALM, IRIS }

enum class AccessMethod { RFID, BIOMETRIC, QR_CODE, PIN, MANUAL }
enum class AccessResult { GRANTED, DENIED }

enum class DenialReason {
    EXPIRED_MEMBERSHIP, INVALID_CARD, TIME_RESTRICTED, ZONE_RESTRICTED,
    CAPACITY_FULL, UNKNOWN_CREDENTIAL, SUSPENDED_CARD,
    BIOMETRIC_MISMATCH, MAINTENANCE_MODE
}
```

#### Shop
```kotlin
enum class ProductType { GOODS, SERVICE, BUNDLE }
enum class ProductStatus { DRAFT, ACTIVE, INACTIVE, DISCONTINUED }

enum class Department {
    FOOD_AND_BEVERAGE, MERCHANDISE, EQUIPMENT, SERVICES,
    SUPPLEMENTS, RENTALS, OTHER
}
```

#### Marketing
```kotlin
enum class CampaignType {
    WELCOME_SEQUENCE, EXPIRY_REMINDER, WIN_BACK, BIRTHDAY,
    INACTIVITY_ALERT, PAYMENT_FOLLOWUP, CUSTOM
}

enum class TriggerType {
    MEMBER_CREATED, DAYS_BEFORE_EXPIRY, DAYS_AFTER_EXPIRY,
    BIRTHDAY, DAYS_INACTIVE, PAYMENT_FAILED, MANUAL
}

enum class CampaignStatus { DRAFT, ACTIVE, PAUSED, COMPLETED, ARCHIVED }
```

---

## Event Listeners & Publishers

### DomainEventWebhookListener

**Location:** `backend/src/main/kotlin/com/liyaqa/webhook/application/listeners/DomainEventWebhookListener.kt`

**Purpose:** Listens for domain events and queues webhook deliveries.

**Key Features:**
- Uses `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`
- Ensures webhooks only sent after transaction commits
- Async processing with `@Async`
- Error handling (doesn't fail main transaction)

**Marker Interface:**
```kotlin
interface WebhookTriggerEvent {
    val webhookEventType: WebhookEventType
    fun toWebhookPayload(): Map<String, Any?>
}
```

**Implementation:**
```kotlin
@Component
class DomainEventWebhookListener(
    private val webhookDeliveryService: WebhookDeliveryService
) {

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun handleWebhookTriggerEvent(event: WebhookTriggerEvent) {
        try {
            val eventData = WebhookEventData(
                tenantId = TenantContext.getCurrentTenant().value,
                eventType = event.webhookEventType,
                eventId = UUID.randomUUID(),
                payload = event.toWebhookPayload()
            )

            webhookDeliveryService.queueEvent(eventData)
        } catch (e: Exception) {
            logger.error("Failed to queue webhook event: ${e.message}", e)
        }
    }
}
```

**Domain Event Examples:**
```kotlin
// Member created event
data class MemberCreatedEvent(
    val member: Member
) : WebhookTriggerEvent {
    override val webhookEventType = WebhookEventType.MEMBER_CREATED

    override fun toWebhookPayload() = mapOf(
        "memberId" to member.id,
        "email" to member.email,
        "firstName" to member.firstName,
        "lastName" to member.lastName,
        "status" to member.status,
        "joinedDate" to member.createdAt
    )
}

// Publishing the event
@Service
class MemberService(
    private val applicationEventPublisher: ApplicationEventPublisher
) {
    fun createMember(command: CreateMemberCommand): Member {
        val member = Member(...)
        val saved = memberRepository.save(member)

        // Publish domain event
        applicationEventPublisher.publishEvent(MemberCreatedEvent(saved))

        return saved
    }
}
```

### WebhookEventPublisher

**Location:** `backend/src/main/kotlin/com/liyaqa/webhook/application/services/WebhookEventPublisher.kt`

**Purpose:** Programmatic webhook publishing service.

**Method Groups:**

```kotlin
@Service
class WebhookEventPublisher(
    private val webhookDeliveryService: WebhookDeliveryService
) {

    // Member Events
    @Async
    fun publishMemberCreated(member: Member)

    @Async
    fun publishMemberUpdated(member: Member)

    @Async
    fun publishMemberDeleted(memberId: UUID, tenantId: UUID)

    // Subscription Events
    @Async
    fun publishSubscriptionCreated(subscription: Subscription)

    @Async
    fun publishSubscriptionActivated(subscription: Subscription)

    @Async
    fun publishSubscriptionRenewed(subscription: Subscription)

    @Async
    fun publishSubscriptionExpired(subscription: Subscription)

    @Async
    fun publishSubscriptionCancelled(subscription: Subscription)

    // Invoice Events
    @Async
    fun publishInvoiceCreated(invoice: Invoice)

    @Async
    fun publishInvoiceIssued(invoice: Invoice)

    @Async
    fun publishInvoicePaid(invoice: Invoice)

    // Attendance Events
    @Async
    fun publishAttendanceCheckIn(attendance: AttendanceRecord)

    @Async
    fun publishAttendanceCheckOut(attendance: AttendanceRecord)

    // Booking Events
    @Async
    fun publishBookingCreated(booking: Booking, tenantId: UUID)

    @Async
    fun publishBookingCancelled(booking: Booking, tenantId: UUID)

    // Lead Events
    @Async
    fun publishLeadCreated(leadId: UUID, tenantId: UUID, payload: Map<String, Any?>)

    @Async
    fun publishLeadStatusChanged(leadId: UUID, tenantId: UUID, payload: Map<String, Any?>)
}
```

**Usage Example:**
```kotlin
@Service
class InvoiceService(
    private val webhookPublisher: WebhookEventPublisher
) {
    fun markInvoiceAsPaid(invoiceId: UUID): Invoice {
        val invoice = getInvoice(invoiceId)

        invoice.markAsPaid()
        val saved = invoiceRepository.save(invoice)

        // Publish webhook asynchronously
        webhookPublisher.publishInvoicePaid(saved)

        return saved
    }
}
```

---

## Converters

### EncryptionAttributeConverter

**Location:** `backend/src/main/kotlin/com/liyaqa/compliance/infrastructure/encryption/EncryptionAttributeConverter.kt`

**Purpose:** Transparent field-level encryption for JPA entities.

```kotlin
@Converter
class EncryptionAttributeConverter(
    private val encryptionService: EncryptionService
) : AttributeConverter<String?, String?> {

    override fun convertToDatabaseColumn(attribute: String?): String? {
        return attribute?.let { encryptionService.encrypt(it) }
    }

    override fun convertToEntityAttribute(dbData: String?): String? {
        return dbData?.let { encryptionService.decrypt(it) }
    }
}

// Marker annotation (documentation only)
@Target(AnnotationTarget.FIELD)
@Retention(AnnotationRetention.RUNTIME)
annotation class Encrypted
```

**Usage:**
```kotlin
@Entity
class Member {
    @Convert(converter = EncryptionAttributeConverter::class)
    @Encrypted
    var nationalId: String? = null

    @Convert(converter = EncryptionAttributeConverter::class)
    @Encrypted
    var taxId: String? = null
}
```

### HijriDateConverter

Covered in section 1.5 above.

---

## Infrastructure Patterns

### 8.1 Multi-Tenant Data Isolation

#### TenantFilterAspect

**Location:** `backend/src/main/kotlin/com/liyaqa/shared/infrastructure/TenantFilterAspect.kt`

**Purpose:** AOP aspect that automatically enables Hibernate tenant filter on READ operations.

```kotlin
@Aspect
@Component
class TenantFilterAspect(
    private val entityManager: EntityManager
) {

    @Before(
        "execution(* org.springframework.data.jpa.repository.JpaRepository+.find*(..)) || " +
        "execution(* org.springframework.data.jpa.repository.JpaRepository+.get*(..)) || " +
        "execution(* org.springframework.data.jpa.repository.JpaRepository+.exists*(..)) || " +
        "execution(* org.springframework.data.jpa.repository.JpaRepository+.count*(..))"
    )
    fun enableTenantFilter() {
        TenantFilter.enableContextualFilter(entityManager)
    }
}
```

**Scope:** READ operations only (find*, get*, exists*, count*)
**Why Not Write?** Avoid JPA merge() interference during save/update

#### TenantFilter Utility

**Location:** `backend/src/main/kotlin/com/liyaqa/shared/infrastructure/TenantAwareRepository.kt`

```kotlin
object TenantFilter {

    // Standard club access (club-level tenant filter)
    fun enableTenantFilter(entityManager: EntityManager) {
        val tenantId = TenantContext.getCurrentTenantOrNull()?.value
            ?: return

        entityManager.unwrap(Session::class.java)
            .enableFilter("tenantFilter")
            .setParameter("tenantId", tenantId)
    }

    // Super-tenant mode (organization-level filter)
    fun enableOrganizationFilter(entityManager: EntityManager) {
        val orgId = TenantContext.getCurrentOrganizationOrNull()?.value
            ?: return

        entityManager.unwrap(Session::class.java)
            .enableFilter("organizationFilter")
            .setParameter("organizationId", orgId)
    }

    // Contextual (auto-detects super-tenant mode)
    fun enableContextualFilter(entityManager: EntityManager) {
        if (TenantContext.isSuperTenantMode()) {
            enableOrganizationFilter(entityManager)
        } else {
            enableTenantFilter(entityManager)
        }
    }

    fun disableAllFilters(entityManager: EntityManager) {
        val session = entityManager.unwrap(Session::class.java)
        session.disableFilter("tenantFilter")
        session.disableFilter("organizationFilter")
    }
}
```

**Entity Filter Annotations:**
```kotlin
@Entity
@Table(name = "members")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class Member : BaseEntity() {
    // tenantId automatically filtered
}

@Entity
@Table(name = "clubs")
@Filter(name = "organizationFilter", condition = "organization_id = :organizationId")
class Club {
    // organization filter for super-tenant queries
}
```

#### TenantInterceptor

**Location:** `backend/src/main/kotlin/com/liyaqa/shared/infrastructure/TenantInterceptor.kt`

**Purpose:** HTTP interceptor that extracts and validates tenant context.

**Tenant Resolution Priority:**
1. `X-Tenant-ID` header (highest priority)
2. Subdomain slug (e.g., `gymname.liyaqa.com`)
3. JWT token claim (validation only)

```kotlin
@Component
class TenantInterceptor(
    private val clubRepository: ClubRepository
) : HandlerInterceptor {

    override fun preHandle(
        request: HttpServletRequest,
        response: HttpServletResponse,
        handler: Any
    ): Boolean {
        // 1. Extract subdomain and resolve club
        val subdomain = extractSubdomain(request.serverName)
        if (subdomain != null) {
            val club = clubRepository.findBySlug(subdomain)
            if (club != null) {
                TenantContext.setCurrentTenant(TenantId(club.id))
            }
        }

        // 2. Extract tenant from header (overrides subdomain)
        val tenantId = request.getHeader("X-Tenant-ID")
        if (tenantId != null) {
            TenantContext.setCurrentTenant(TenantId(UUID.fromString(tenantId)))
        }

        // 3. Extract organization context
        val organizationId = request.getHeader("X-Organization-ID")
        if (organizationId != null) {
            TenantContext.setCurrentOrganization(OrganizationId(UUID.fromString(organizationId)))
        }

        // 4. Super-tenant mode (admin only)
        val superTenant = request.getHeader("X-Super-Tenant")
        if (superTenant == "true") {
            val auth = SecurityContextHolder.getContext().authentication
            if (auth is JwtAuthenticationToken && auth.hasRole("SUPER_ADMIN")) {
                TenantContext.enableSuperTenantMode()
            }
        }

        // 5. Validate tenant access (prevent cross-tenant attacks)
        val currentTenantId = TenantContext.getCurrentTenantOrNull()
        if (currentTenantId != null && !validateTenantAccess(currentTenantId, auth)) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Tenant access denied")
            return false
        }

        return true
    }

    override fun afterCompletion(
        request: HttpServletRequest,
        response: HttpServletResponse,
        handler: Any,
        ex: Exception?
    ) {
        TenantContext.clear()  // CRITICAL cleanup
    }

    private fun extractSubdomain(serverName: String): String? {
        // Parse subdomain from host: {subdomain}.liyaqa.com
        val parts = serverName.split(".")
        if (parts.size >= 3 && !isDevHost(serverName)) {
            return parts[0]
        }
        return null
    }
}
```

**Excluded Paths (No Tenant Validation):**
- `/api/auth/*`
- `/api/health`
- `/swagger-ui/**`
- `/api-docs/**`
- `/h2-console/**`
- `/actuator/**`

---

### 8.2 Audit & Compliance

#### EnhancedAuditAspect

**Location:** `backend/src/main/kotlin/com/liyaqa/compliance/infrastructure/security/EnhancedAuditAspect.kt`

**Purpose:** Compliance-focused AOP audit logging.

**Annotations:**

```kotlin
// Admin action audit
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class AuditAdminAction(
    val action: String,
    val resourceType: String,
    val severity: SecuritySeverity = SecuritySeverity.MEDIUM,
    val description: String = ""
)

// PII access tracking
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class AuditPiiAccess(
    val dataType: String,
    val legalBasis: LegalBasis = LegalBasis.LEGITIMATE_INTEREST,
    val description: String = ""
)
```

**Usage:**
```kotlin
@Service
class MemberService {

    @AuditAdminAction(
        action = "DELETE_MEMBER",
        resourceType = "Member",
        severity = SecuritySeverity.HIGH,
        description = "Permanent member deletion"
    )
    fun deleteMember(memberId: UUID) {
        // Automatically logged with context
        memberRepository.deleteById(memberId)
    }

    @AuditPiiAccess(
        dataType = "Member PII",
        legalBasis = LegalBasis.LEGITIMATE_INTEREST,
        description = "View member profile"
    )
    fun getMemberProfile(memberId: UUID): Member {
        // PII access logged
        return memberRepository.findById(memberId).orElseThrow()
    }
}
```

**Logged Information:**
- User ID, email, IP address
- Timestamp, tenant context
- Action details, resource type/ID
- Severity level
- Legal basis (for PII access)
- Success/failure status

---

## Summary of Key Patterns

1. **Value Objects**: Immutable domain concepts (Money, LocalizedText, Email, PhoneNumber)
2. **Multi-Tenancy**: Hibernate filters + ThreadLocal context + HTTP interceptor
3. **Security**: JWT-based with SecurityService for authorization checks
4. **File Storage**: Pluggable backends (Local, S3, MinIO) with validation
5. **QR Codes**: JWT-signed tokens with ZXing image generation
6. **Prayer Times**: Adhan library with Saudi city presets
7. **Hijri Calendar**: Umm Al-Qura conversion with Islamic events
8. **Audit Trail**: AOP-based with automatic context capture
9. **Event Publishing**: Spring events trigger async webhook deliveries
10. **Localization**: Bilingual value objects throughout domain model
11. **Validation**: Jakarta Bean Validation + custom annotations
12. **Enums**: 20+ enum files covering all domains (40+ compliance enums)
13. **Export**: CSV generation with bilingual headers and UTF-8 BOM

---

**End of Infrastructure Components Guide**
