package com.liyaqa.compliance.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * Consent record for PDPL Article 6 compliance.
 */
@Entity
@Table(name = "consent_records")
class ConsentRecord(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    val id: UUID = UUID.randomUUID(),

    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,

    @Column(name = "member_id")
    var memberId: UUID? = null,

    @Column(name = "lead_id")
    var leadId: UUID? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "consent_type", nullable = false)
    var consentType: ConsentType,

    @Column(name = "purpose", nullable = false, length = 500)
    var purpose: String,

    @Column(name = "purpose_ar", length = 500)
    var purposeAr: String? = null,

    @Column(name = "version")
    var version: String = "1.0",

    @Column(name = "consent_text", columnDefinition = "TEXT")
    var consentText: String? = null,

    @Column(name = "consent_given", nullable = false)
    var consentGiven: Boolean,

    @Enumerated(EnumType.STRING)
    @Column(name = "consent_method", nullable = false)
    var consentMethod: ConsentMethod,

    @Column(name = "given_at")
    var givenAt: Instant? = null,

    @Column(name = "expires_at")
    var expiresAt: Instant? = null,

    @Column(name = "withdrawn_at")
    var withdrawnAt: Instant? = null,

    @Column(name = "withdrawal_reason", columnDefinition = "TEXT")
    var withdrawalReason: String? = null,

    @Column(name = "ip_address")
    var ipAddress: String? = null,

    @Column(name = "user_agent", columnDefinition = "TEXT")
    var userAgent: String? = null,

    @Column(name = "proof_document_path")
    var proofDocumentPath: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
) {
    /**
     * Grant consent.
     */
    fun grantConsent() {
        consentGiven = true
        givenAt = Instant.now()
        withdrawnAt = null
        withdrawalReason = null
        updatedAt = Instant.now()
    }

    /**
     * Withdraw consent.
     */
    fun withdrawConsent(reason: String? = null) {
        consentGiven = false
        withdrawnAt = Instant.now()
        withdrawalReason = reason
        updatedAt = Instant.now()
    }

    /**
     * Check if consent is valid (given and not expired or withdrawn).
     */
    fun isValid(): Boolean {
        if (!consentGiven) return false
        if (withdrawnAt != null) return false
        if (expiresAt != null && expiresAt!!.isBefore(Instant.now())) return false
        return true
    }

    /**
     * Check if consent has expired.
     */
    fun isExpired(): Boolean {
        return expiresAt?.isBefore(Instant.now()) == true
    }

    /**
     * Check if consent was withdrawn.
     */
    fun isWithdrawn(): Boolean {
        return withdrawnAt != null
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is ConsentRecord) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
