package com.liyaqa.referral.application.services

import com.liyaqa.referral.domain.model.Referral
import com.liyaqa.referral.domain.model.ReferralStatus
import com.liyaqa.referral.domain.ports.ReferralCodeRepository
import com.liyaqa.referral.domain.ports.ReferralConfigRepository
import com.liyaqa.referral.domain.ports.ReferralRepository
import com.liyaqa.shared.domain.TenantContext
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Service for tracking referrals from click to conversion.
 */
@Service
@Transactional
class ReferralTrackingService(
    private val referralRepository: ReferralRepository,
    private val codeRepository: ReferralCodeRepository,
    private val configRepository: ReferralConfigRepository,
    private val codeService: ReferralCodeService
) {
    private val logger = LoggerFactory.getLogger(ReferralTrackingService::class.java)

    /**
     * Track a referral link click.
     * Returns the referral if tracking was successful, null if the code is invalid or inactive.
     */
    fun trackClick(code: String): Referral? {
        val referralCode = codeRepository.findByCode(code).orElse(null)
            ?: return null

        if (!referralCode.isActive) {
            logger.debug("Referral code $code is inactive")
            return null
        }

        // Check if referral program is enabled
        val tenantId = TenantContext.getCurrentTenant().value
        val config = configRepository.findByTenantId(tenantId).orElse(null)
        if (config == null || !config.isEnabled) {
            logger.debug("Referral program is disabled for tenant $tenantId")
            return null
        }

        // Check max referrals limit
        if (config.maxReferralsPerMember != null) {
            val currentCount = referralRepository.countByReferrerMemberIdAndStatus(
                referralCode.memberId,
                ReferralStatus.CONVERTED
            )
            if (currentCount >= config.maxReferralsPerMember!!) {
                logger.debug("Member ${referralCode.memberId} has reached max referrals limit")
                return null
            }
        }

        // Record the click
        codeService.recordClick(code)

        // Create a new referral tracking entry
        val referral = Referral(
            referralCodeId = referralCode.id,
            referrerMemberId = referralCode.memberId
        )

        val saved = referralRepository.save(referral)
        logger.info("Tracked referral click for code $code, referral id: ${saved.id}")
        return saved
    }

    /**
     * Mark that a referred person has signed up.
     */
    fun markSignedUp(referralId: UUID, refereeMemberId: UUID): Referral {
        val referral = referralRepository.findById(referralId)
            .orElseThrow { NoSuchElementException("Referral not found: $referralId") }

        require(referral.canConvert()) {
            "Referral cannot be converted from status ${referral.status}"
        }

        referral.markSignedUp(refereeMemberId)
        val saved = referralRepository.save(referral)
        logger.info("Marked referral $referralId as signed up for member $refereeMemberId")
        return saved
    }

    /**
     * Convert a referral when the referred member purchases a subscription.
     * Returns the referral if conversion was successful.
     */
    fun convertReferral(refereeMemberId: UUID, subscriptionId: UUID): Referral? {
        // Find the referral for this member
        val referral = referralRepository.findByRefereeMemberId(refereeMemberId).orElse(null)
            ?: return null

        if (!referral.canConvert()) {
            logger.debug("Referral ${referral.id} cannot be converted from status ${referral.status}")
            return null
        }

        // Get the referral code to update conversion count
        val referralCode = codeRepository.findById(referral.referralCodeId).orElse(null)
        if (referralCode != null) {
            codeService.recordConversion(referralCode.code)
        }

        // Mark the referral as converted
        referral.markConverted(subscriptionId)
        val saved = referralRepository.save(referral)
        logger.info("Converted referral ${referral.id} for member $refereeMemberId with subscription $subscriptionId")
        return saved
    }

    /**
     * Validate a referral code for use during signup.
     */
    @Transactional(readOnly = true)
    fun validateCode(code: String): Boolean {
        val referralCode = codeRepository.findByCode(code).orElse(null)
            ?: return false

        if (!referralCode.isActive) {
            return false
        }

        val tenantId = TenantContext.getCurrentTenant().value
        val config = configRepository.findByTenantId(tenantId).orElse(null)
        if (config == null || !config.isEnabled) {
            return false
        }

        // Check max referrals limit
        if (config.maxReferralsPerMember != null) {
            val currentCount = referralRepository.countByReferrerMemberIdAndStatus(
                referralCode.memberId,
                ReferralStatus.CONVERTED
            )
            if (currentCount >= config.maxReferralsPerMember!!) {
                return false
            }
        }

        return true
    }

    /**
     * Get referrals by referrer.
     */
    @Transactional(readOnly = true)
    fun getReferralsByReferrer(memberId: UUID, pageable: Pageable): Page<Referral> {
        return referralRepository.findByReferrerMemberId(memberId, pageable)
    }

    /**
     * Get referrals by status.
     */
    @Transactional(readOnly = true)
    fun getReferralsByStatus(status: ReferralStatus, pageable: Pageable): Page<Referral> {
        return referralRepository.findByStatus(status, pageable)
    }

    /**
     * Get referral statistics for a member.
     */
    @Transactional(readOnly = true)
    fun getMemberStats(memberId: UUID): ReferralStats {
        val code = codeRepository.findByMemberId(memberId).orElse(null)
        val totalReferrals = referralRepository.countByReferrerMemberId(memberId)
        val conversions = referralRepository.countByReferrerMemberIdAndStatus(memberId, ReferralStatus.CONVERTED)

        return ReferralStats(
            code = code?.code,
            clickCount = code?.clickCount ?: 0,
            totalReferrals = totalReferrals,
            conversions = conversions,
            conversionRate = if (code?.clickCount ?: 0 > 0) {
                conversions.toDouble() / code!!.clickCount.toDouble()
            } else 0.0
        )
    }
}

/**
 * Statistics for a member's referral performance.
 */
data class ReferralStats(
    val code: String?,
    val clickCount: Int,
    val totalReferrals: Long,
    val conversions: Long,
    val conversionRate: Double
)
