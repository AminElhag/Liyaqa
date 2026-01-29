package com.liyaqa.compliance.application.services

import com.liyaqa.compliance.domain.model.ConsentMethod
import com.liyaqa.compliance.domain.model.ConsentRecord
import com.liyaqa.compliance.domain.model.ConsentType
import com.liyaqa.compliance.domain.ports.ConsentRecordRepository
import com.liyaqa.shared.domain.TenantContext
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

@Service
@Transactional
class ConsentService(
    private val consentRepository: ConsentRecordRepository
) {
    private val logger = LoggerFactory.getLogger(ConsentService::class.java)

    /**
     * Record consent given by a member.
     */
    fun recordConsent(
        memberId: UUID? = null,
        leadId: UUID? = null,
        consentType: ConsentType,
        purpose: String,
        purposeAr: String? = null,
        consentGiven: Boolean,
        consentMethod: ConsentMethod,
        consentText: String? = null,
        expiresAt: Instant? = null,
        ipAddress: String? = null,
        userAgent: String? = null
    ): ConsentRecord {
        require(memberId != null || leadId != null) { "Either memberId or leadId must be provided" }

        val tenantId = TenantContext.getCurrentTenant().value

        // Check for existing consent of same type
        val existingConsent = memberId?.let {
            consentRepository.findByMemberIdAndConsentType(it, consentType).orElse(null)
        }

        val consent = existingConsent?.apply {
            if (consentGiven) {
                grantConsent()
            } else {
                withdrawConsent()
            }
            this.consentMethod = consentMethod
            this.consentText = consentText
            this.expiresAt = expiresAt
            this.ipAddress = ipAddress
            this.userAgent = userAgent
        } ?: ConsentRecord(
            tenantId = tenantId,
            memberId = memberId,
            leadId = leadId,
            consentType = consentType,
            purpose = purpose,
            purposeAr = purposeAr,
            consentGiven = consentGiven,
            consentMethod = consentMethod,
            consentText = consentText,
            givenAt = if (consentGiven) Instant.now() else null,
            expiresAt = expiresAt,
            ipAddress = ipAddress,
            userAgent = userAgent
        )

        val saved = consentRepository.save(consent)
        logger.info("Recorded {} consent for {} type={}",
            if (consentGiven) "granted" else "withheld",
            memberId ?: leadId,
            consentType)
        return saved
    }

    /**
     * Withdraw consent.
     */
    fun withdrawConsent(consentId: UUID, reason: String? = null): ConsentRecord {
        val consent = consentRepository.findById(consentId)
            .orElseThrow { NoSuchElementException("Consent record not found: $consentId") }

        consent.withdrawConsent(reason)
        logger.info("Withdrew consent {} for {}", consentId, consent.memberId ?: consent.leadId)
        return consentRepository.save(consent)
    }

    /**
     * Get all consents for a member.
     */
    @Transactional(readOnly = true)
    fun getMemberConsents(memberId: UUID): List<ConsentRecord> {
        return consentRepository.findByMemberId(memberId)
    }

    /**
     * Get active (valid) consents for a member.
     */
    @Transactional(readOnly = true)
    fun getActiveConsents(memberId: UUID): List<ConsentRecord> {
        return consentRepository.findActiveConsents(memberId, Instant.now())
    }

    /**
     * Check if member has given specific consent.
     */
    @Transactional(readOnly = true)
    fun hasConsent(memberId: UUID, consentType: ConsentType): Boolean {
        val consent = consentRepository.findByMemberIdAndConsentType(memberId, consentType)
            .orElse(null)
        return consent?.isValid() == true
    }

    /**
     * Get consents by type for the tenant.
     */
    @Transactional(readOnly = true)
    fun getConsentsByType(consentType: ConsentType, pageable: Pageable): Page<ConsentRecord> {
        val tenantId = TenantContext.getCurrentTenant().value
        return consentRepository.findByTenantIdAndConsentType(tenantId, consentType, pageable)
    }

    /**
     * Get all consents for the tenant.
     */
    @Transactional(readOnly = true)
    fun getAllConsents(pageable: Pageable): Page<ConsentRecord> {
        val tenantId = TenantContext.getCurrentTenant().value
        return consentRepository.findByTenantId(tenantId, pageable)
    }

    /**
     * Bulk record consent for multiple members.
     */
    fun bulkRecordConsent(
        memberIds: List<UUID>,
        consentType: ConsentType,
        purpose: String,
        consentGiven: Boolean,
        consentMethod: ConsentMethod
    ): List<ConsentRecord> {
        return memberIds.map { memberId ->
            recordConsent(
                memberId = memberId,
                consentType = consentType,
                purpose = purpose,
                consentGiven = consentGiven,
                consentMethod = consentMethod
            )
        }
    }

    /**
     * Get consent statistics.
     */
    @Transactional(readOnly = true)
    fun getConsentStats(memberId: UUID): ConsentStats {
        val consents = consentRepository.findByMemberId(memberId)
        val activeConsents = consents.filter { it.isValid() }
        val withdrawnConsents = consents.filter { it.isWithdrawn() }

        return ConsentStats(
            totalConsents = consents.size,
            activeConsents = activeConsents.size,
            withdrawnConsents = withdrawnConsents.size,
            consentsByType = consents.groupBy { it.consentType }
                .mapValues { (_, list) -> list.any { it.isValid() } }
        )
    }
}

data class ConsentStats(
    val totalConsents: Int,
    val activeConsents: Int,
    val withdrawnConsents: Int,
    val consentsByType: Map<ConsentType, Boolean>
)
