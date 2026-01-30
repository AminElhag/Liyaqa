package com.liyaqa.trainer.domain.model

import com.liyaqa.shared.domain.OrganizationAwareEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.Instant
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.util.UUID

/**
 * TrainerCertification entity representing professional certifications.
 *
 * Key features:
 * - Replaces JSON-based certification storage for better querying
 * - Tracks certification expiry dates with automated status updates
 * - Supports admin verification of certification authenticity
 * - Stores uploaded certificate documents (PDF, images)
 * - Bilingual certification names (English/Arabic)
 */
@Entity
@Table(name = "trainer_certifications")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(
    name = "tenantFilter",
    condition = "tenant_id = :tenantId OR organization_id = (SELECT c.organization_id FROM clubs c WHERE c.id = :tenantId)"
)
class TrainerCertification(
    id: UUID = UUID.randomUUID(),

    /**
     * Reference to the Trainer who holds this certification.
     */
    @Column(name = "trainer_id", nullable = false)
    var trainerId: UUID,

    /**
     * Certification name in English.
     */
    @Column(name = "name_en", nullable = false, length = 255)
    var nameEn: String,

    /**
     * Certification name in Arabic.
     */
    @Column(name = "name_ar", nullable = false, length = 255)
    var nameAr: String,

    /**
     * Organization that issued the certification.
     */
    @Column(name = "issuing_organization", nullable = false, length = 255)
    var issuingOrganization: String,

    /**
     * Date when the certification was issued.
     */
    @Column(name = "issued_date")
    var issuedDate: LocalDate? = null,

    /**
     * Date when the certification expires (null if no expiry).
     */
    @Column(name = "expiry_date")
    var expiryDate: LocalDate? = null,

    /**
     * Certification number or ID assigned by issuing organization.
     */
    @Column(name = "certificate_number", length = 100)
    var certificateNumber: String? = null,

    /**
     * URL to uploaded certificate document (S3 bucket path).
     * Can be PDF, JPG, PNG, etc.
     */
    @Column(name = "certificate_file_url", columnDefinition = "TEXT")
    var certificateFileUrl: String? = null,

    /**
     * Current status of the certification.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    var status: CertificationStatus = CertificationStatus.ACTIVE,

    /**
     * Whether the certification has been verified by admin.
     */
    @Column(name = "is_verified", nullable = false)
    var isVerified: Boolean = false,

    /**
     * ID of the user (admin) who verified this certification.
     */
    @Column(name = "verified_by")
    var verifiedBy: UUID? = null,

    /**
     * Timestamp when the certification was verified.
     */
    @Column(name = "verified_at")
    var verifiedAt: Instant? = null

) : OrganizationAwareEntity(id) {

    // ========== Domain Methods ==========

    /**
     * Verify the certification by an admin.
     */
    fun verify(verifiedBy: UUID) {
        this.isVerified = true
        this.verifiedBy = verifiedBy
        this.verifiedAt = Instant.now()
    }

    /**
     * Revoke verification (if found to be invalid).
     */
    fun revokeVerification() {
        this.isVerified = false
        this.verifiedBy = null
        this.verifiedAt = null
    }

    /**
     * Mark certification as expired.
     */
    fun markAsExpired() {
        this.status = CertificationStatus.EXPIRED
    }

    /**
     * Revoke the certification.
     */
    fun revoke() {
        this.status = CertificationStatus.REVOKED
    }

    /**
     * Reactivate the certification (e.g., after renewal).
     */
    fun reactivate(newExpiryDate: LocalDate? = null) {
        this.status = CertificationStatus.ACTIVE
        if (newExpiryDate != null) {
            this.expiryDate = newExpiryDate
        }
    }

    /**
     * Update expiry date (e.g., after renewal).
     */
    fun renew(newExpiryDate: LocalDate) {
        this.expiryDate = newExpiryDate
        if (status == CertificationStatus.EXPIRED) {
            reactivate()
        }
    }

    // ========== Query Helpers ==========

    /**
     * Check if certification has expired.
     */
    fun isExpired(): Boolean {
        return expiryDate?.isBefore(LocalDate.now()) == true
    }

    /**
     * Check if certification is expiring soon (within specified days).
     */
    fun isExpiringSoon(daysThreshold: Long = 30): Boolean {
        val expiry = expiryDate ?: return false
        val today = LocalDate.now()
        if (expiry.isBefore(today)) return false // Already expired

        val daysUntilExpiry = ChronoUnit.DAYS.between(today, expiry)
        return daysUntilExpiry <= daysThreshold
    }

    /**
     * Get days until expiry (negative if expired).
     */
    fun getDaysUntilExpiry(): Long? {
        val expiry = expiryDate ?: return null
        return ChronoUnit.DAYS.between(LocalDate.now(), expiry)
    }

    /**
     * Check if certification is active and valid.
     */
    fun isValid(): Boolean {
        return status == CertificationStatus.ACTIVE && !isExpired()
    }

    /**
     * Check if certification has a document uploaded.
     */
    fun hasDocument(): Boolean {
        return !certificateFileUrl.isNullOrBlank()
    }

    /**
     * Get certification name in specified language.
     */
    fun getName(language: String): String {
        return when (language.lowercase()) {
            "ar" -> nameAr
            else -> nameEn
        }
    }

    /**
     * Auto-update status based on expiry date.
     * Should be called periodically or when accessing certifications.
     */
    fun updateStatusBasedOnExpiry() {
        if (status == CertificationStatus.ACTIVE && isExpired()) {
            markAsExpired()
        }
    }
}
