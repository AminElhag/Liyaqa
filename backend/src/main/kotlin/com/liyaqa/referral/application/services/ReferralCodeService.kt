package com.liyaqa.referral.application.services

import com.liyaqa.referral.domain.model.ReferralCode
import com.liyaqa.referral.domain.ports.ReferralCodeRepository
import com.liyaqa.referral.domain.ports.ReferralConfigRepository
import com.liyaqa.shared.domain.TenantContext
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Service for managing referral codes.
 */
@Service
@Transactional
class ReferralCodeService(
    private val codeRepository: ReferralCodeRepository,
    private val configRepository: ReferralConfigRepository
) {
    private val logger = LoggerFactory.getLogger(ReferralCodeService::class.java)

    /**
     * Get or create a referral code for a member.
     */
    fun getOrCreateCode(memberId: UUID): ReferralCode {
        // Check if member already has a code
        val existing = codeRepository.findByMemberId(memberId)
        if (existing.isPresent) {
            return existing.get()
        }

        // Get config to use correct prefix
        val tenantId = TenantContext.getCurrentTenant().value
        val config = configRepository.findByTenantId(tenantId).orElse(null)
        val prefix = config?.codePrefix ?: "REF"

        // Generate a unique code
        var code: String
        var attempts = 0
        do {
            code = ReferralCode.generateCode(prefix)
            attempts++
            if (attempts > 10) {
                throw IllegalStateException("Could not generate unique referral code after 10 attempts")
            }
        } while (codeRepository.existsByCode(code))

        val referralCode = ReferralCode(
            memberId = memberId,
            code = code
        )

        val saved = codeRepository.save(referralCode)
        logger.info("Created referral code $code for member $memberId")
        return saved
    }

    /**
     * Get a referral code by its code string.
     */
    @Transactional(readOnly = true)
    fun getByCode(code: String): ReferralCode? {
        return codeRepository.findByCode(code).orElse(null)
    }

    /**
     * Get a referral code by member ID.
     */
    @Transactional(readOnly = true)
    fun getByMemberId(memberId: UUID): ReferralCode? {
        return codeRepository.findByMemberId(memberId).orElse(null)
    }

    /**
     * Get all referral codes with pagination.
     */
    @Transactional(readOnly = true)
    fun listCodes(pageable: Pageable): Page<ReferralCode> {
        return codeRepository.findAll(pageable)
    }

    /**
     * Get top referrers by conversion count.
     */
    @Transactional(readOnly = true)
    fun getTopReferrers(limit: Int = 10): List<ReferralCode> {
        return codeRepository.findTopReferrers(limit)
    }

    /**
     * Activate a referral code.
     */
    fun activateCode(codeId: UUID): ReferralCode {
        val code = codeRepository.findById(codeId)
            .orElseThrow { NoSuchElementException("Referral code not found: $codeId") }
        code.activate()
        return codeRepository.save(code)
    }

    /**
     * Deactivate a referral code.
     */
    fun deactivateCode(codeId: UUID): ReferralCode {
        val code = codeRepository.findById(codeId)
            .orElseThrow { NoSuchElementException("Referral code not found: $codeId") }
        code.deactivate()
        return codeRepository.save(code)
    }

    /**
     * Record a click on a referral code.
     */
    fun recordClick(code: String) {
        val referralCode = codeRepository.findByCode(code).orElse(null)
        if (referralCode != null && referralCode.isActive) {
            referralCode.recordClick()
            codeRepository.save(referralCode)
        }
    }

    /**
     * Record a conversion on a referral code.
     */
    fun recordConversion(code: String) {
        val referralCode = codeRepository.findByCode(code).orElse(null)
        if (referralCode != null) {
            referralCode.recordConversion()
            codeRepository.save(referralCode)
        }
    }
}
