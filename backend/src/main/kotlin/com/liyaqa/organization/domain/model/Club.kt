package com.liyaqa.organization.domain.model

import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.model.PrayerCalculationMethod
import com.liyaqa.shared.domain.model.PrayerSettings
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.EntityListeners
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import jakarta.persistence.Version
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.Instant
import java.util.UUID

/**
 * Club entity - serves as the tenant for all data isolation.
 * Club.id IS the tenant_id for all entities under this club.
 *
 * A club belongs to an organization and can have multiple locations.
 * Each club can have a unique slug for subdomain-based access (e.g., fitness-gym.liyaqa.com).
 */
@Entity
@Table(name = "clubs")
@EntityListeners(AuditingEntityListener::class)
@Filter(name = "organizationFilter", condition = "organization_id = :organizationId")
class Club(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    val id: UUID = UUID.randomUUID(),

    @Column(name = "organization_id", nullable = false, updatable = false)
    val organizationId: UUID,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "name_en", nullable = false)),
        AttributeOverride(name = "ar", column = Column(name = "name_ar"))
    )
    var name: LocalizedText,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "description_en")),
        AttributeOverride(name = "ar", column = Column(name = "description_ar"))
    )
    var description: LocalizedText? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: ClubStatus = ClubStatus.ACTIVE,

    /**
     * URL-friendly slug for subdomain-based tenant access.
     * Must be 3-63 lowercase alphanumeric characters with hyphens.
     * Example: fitness-gym, downtown-club, acme-sports-123
     */
    @Column(name = "slug", length = 63, unique = true)
    var slug: String? = null,

    // ==================== PRAYER TIME SETTINGS (Saudi Market) ====================

    /**
     * City name for prayer time calculation (e.g., Riyadh, Jeddah).
     */
    @Column(name = "city", length = 100)
    var city: String? = null,

    /**
     * Latitude coordinate for accurate prayer time calculation.
     */
    @Column(name = "latitude")
    var latitude: Double? = null,

    /**
     * Longitude coordinate for accurate prayer time calculation.
     */
    @Column(name = "longitude")
    var longitude: Double? = null,

    /**
     * Prayer calculation method. UMM_AL_QURA is the official Saudi method.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "prayer_calculation_method", length = 50)
    var prayerCalculationMethod: PrayerCalculationMethod = PrayerCalculationMethod.UMM_AL_QURA,

    /**
     * Minutes to add before/after prayer for closing time (default 30).
     */
    @Column(name = "prayer_buffer_minutes")
    var prayerBufferMinutes: Int = 30,

    /**
     * If true, block member check-in during prayer times.
     */
    @Column(name = "block_checkin_during_prayer")
    var blockCheckinDuringPrayer: Boolean = false,

    // ==================== WHATSAPP SETTINGS (Saudi Market) ====================

    /**
     * Whether WhatsApp notifications are enabled for this club.
     */
    @Column(name = "whatsapp_enabled")
    var whatsappEnabled: Boolean = false,

    /**
     * WhatsApp Business Phone Number ID from Meta Business Manager.
     */
    @Column(name = "whatsapp_phone_number_id", length = 50)
    var whatsappPhoneNumberId: String? = null,

    /**
     * WhatsApp Business Account ID.
     */
    @Column(name = "whatsapp_business_id", length = 50)
    var whatsappBusinessId: String? = null,

    // ==================== STC PAY SETTINGS (Saudi Market) ====================

    /**
     * Whether STC Pay payments are enabled for this club.
     */
    @Column(name = "stcpay_enabled")
    var stcpayEnabled: Boolean = false,

    /**
     * STC Pay Merchant ID.
     */
    @Column(name = "stcpay_merchant_id", length = 50)
    var stcpayMerchantId: String? = null,

    // ==================== SADAD SETTINGS (Saudi Market) ====================

    /**
     * Whether SADAD bill payments are enabled for this club.
     */
    @Column(name = "sadad_enabled")
    var sadadEnabled: Boolean = false,

    /**
     * SADAD Biller Code assigned by SAMA.
     */
    @Column(name = "sadad_biller_code", length = 50)
    var sadadBillerCode: String? = null,

    /**
     * SADAD Bank Code.
     */
    @Column(name = "sadad_bank_code", length = 10)
    var sadadBankCode: String? = null,

    // ==================== TAMARA SETTINGS (Saudi Market) ====================

    /**
     * Whether Tamara BNPL is enabled for this club.
     */
    @Column(name = "tamara_enabled")
    var tamaraEnabled: Boolean = false,

    /**
     * Tamara Merchant URL for webhooks.
     */
    @Column(name = "tamara_merchant_url")
    var tamaraMerchantUrl: String? = null,

    /**
     * Tamara Notification Token.
     */
    @Column(name = "tamara_notification_token")
    var tamaraNotificationToken: String? = null

) {

    /**
     * Gets the prayer settings as a data class for convenience.
     */
    fun getPrayerSettings(): PrayerSettings = PrayerSettings(
        city = city,
        latitude = latitude,
        longitude = longitude,
        calculationMethod = prayerCalculationMethod,
        bufferMinutes = prayerBufferMinutes,
        blockCheckinDuringPrayer = blockCheckinDuringPrayer
    )

    /**
     * Updates prayer settings from a PrayerSettings data class.
     */
    fun updatePrayerSettings(settings: PrayerSettings) {
        this.city = settings.city
        this.latitude = settings.latitude
        this.longitude = settings.longitude
        this.prayerCalculationMethod = settings.calculationMethod
        this.prayerBufferMinutes = settings.bufferMinutes
        this.blockCheckinDuringPrayer = settings.blockCheckinDuringPrayer
    }

    companion object {
        /**
         * Reserved slugs that cannot be used as subdomains.
         */
        val RESERVED_SLUGS = setOf(
            "api", "www", "admin", "platform", "app", "mail", "ftp", "docs",
            "help", "support", "status", "blog", "demo", "staging", "test", "dev",
            "static", "assets", "cdn", "media", "images", "files", "download",
            "login", "register", "auth", "oauth", "signup", "signin", "dashboard",
            "billing", "payment", "checkout", "cart", "account", "settings",
            "mobile", "m", "web", "ws", "wss", "http", "https", "ftp", "sftp"
        )

        private val SLUG_REGEX = Regex("^[a-z0-9][a-z0-9-]*[a-z0-9]$")

        /**
         * Validates if a slug is valid.
         * Valid slugs are 3-63 lowercase alphanumeric characters with single hyphens.
         */
        fun isValidSlug(slug: String): Boolean {
            return slug.length >= 3 &&
                   slug.length <= 63 &&
                   SLUG_REGEX.matches(slug) &&
                   !slug.contains("--")
        }

        /**
         * Checks if a slug is reserved and cannot be used.
         */
        fun isReservedSlug(slug: String): Boolean {
            return RESERVED_SLUGS.contains(slug.lowercase())
        }

        /**
         * Generates a URL-friendly slug from a name.
         * Converts to lowercase, replaces spaces/special chars with hyphens,
         * removes consecutive hyphens, trims hyphens from ends.
         */
        fun generateSlug(name: String): String {
            return name
                .lowercase()
                .replace(Regex("[^a-z0-9\\s-]"), "")  // Remove special chars
                .replace(Regex("\\s+"), "-")          // Spaces to hyphens
                .replace(Regex("-+"), "-")            // Collapse multiple hyphens
                .trim('-')                            // Remove leading/trailing hyphens
                .take(63)                             // Max length
                .trimEnd('-')                         // Clean up if truncation left trailing hyphen
        }
    }

    /**
     * Sets the slug with validation.
     * @throws IllegalArgumentException if slug is invalid or reserved
     */
    fun setSlugValidated(newSlug: String) {
        val normalizedSlug = newSlug.lowercase().trim()
        require(isValidSlug(normalizedSlug)) {
            "Invalid slug format: must be 3-63 lowercase alphanumeric characters with hyphens, " +
            "cannot start/end with hyphen or contain consecutive hyphens"
        }
        require(!isReservedSlug(normalizedSlug)) {
            "Slug '$normalizedSlug' is reserved and cannot be used"
        }
        this.slug = normalizedSlug
    }

    /**
     * Sets the slug, generating from name if not provided.
     * @param providedSlug Optional slug to use. If null, generates from English name.
     * @throws IllegalArgumentException if generated/provided slug is invalid or reserved
     */
    fun setSlugOrGenerate(providedSlug: String? = null) {
        val slugToUse = providedSlug?.lowercase()?.trim() ?: generateSlug(name.en)
        setSlugValidated(slugToUse)
    }
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant = Instant.now()
        protected set

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
        protected set

    @Version
    @Column(name = "version")
    var version: Long = 0
        protected set

    /**
     * The tenant ID for this club - used for data isolation.
     * This is the same as the club ID.
     */
    val tenantId: UUID
        get() = id

    @PrePersist
    fun clubPrePersist() {
        this.createdAt = Instant.now()
        this.updatedAt = Instant.now()
    }

    @PreUpdate
    fun clubPreUpdate() {
        this.updatedAt = Instant.now()
    }

    /**
     * Suspend the club.
     * Only active clubs can be suspended.
     */
    fun suspend() {
        require(status == ClubStatus.ACTIVE) {
            "Only active clubs can be suspended"
        }
        status = ClubStatus.SUSPENDED
    }

    /**
     * Activate the club.
     * Only suspended clubs can be activated.
     */
    fun activate() {
        require(status == ClubStatus.SUSPENDED) {
            "Only suspended clubs can be activated"
        }
        status = ClubStatus.ACTIVE
    }

    /**
     * Permanently close the club.
     */
    fun close() {
        require(status != ClubStatus.CLOSED) {
            "Club is already closed"
        }
        status = ClubStatus.CLOSED
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Club) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}