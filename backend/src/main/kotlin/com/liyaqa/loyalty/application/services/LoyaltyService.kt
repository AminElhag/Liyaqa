package com.liyaqa.loyalty.application.services

import com.liyaqa.loyalty.application.commands.*
import com.liyaqa.loyalty.domain.model.*
import com.liyaqa.loyalty.domain.ports.*
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.shared.domain.TenantContext
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.*

@Service
@Transactional
class LoyaltyService(
    private val memberPointsRepository: MemberPointsRepository,
    private val transactionRepository: PointsTransactionRepository,
    private val configRepository: LoyaltyConfigRepository,
    private val memberRepository: MemberRepository
) {
    private val logger = LoggerFactory.getLogger(LoyaltyService::class.java)

    // ========== Configuration ==========

    fun getOrCreateConfig(): LoyaltyConfig {
        val tenantId = TenantContext.getCurrentTenantId()
        return configRepository.findByTenantId(tenantId)
            .orElseGet {
                logger.info("Creating default loyalty config for tenant: $tenantId")
                configRepository.save(LoyaltyConfig.createDefault())
            }
    }

    fun updateConfig(command: UpdateLoyaltyConfigCommand): LoyaltyConfig {
        val config = getOrCreateConfig()

        command.enabled?.let { config.enabled = it }
        command.pointsPerCheckin?.let { config.pointsPerCheckin = it }
        command.pointsPerReferral?.let { config.pointsPerReferral = it }
        command.pointsPerSarSpent?.let { config.pointsPerSarSpent = it }
        command.redemptionRateSar?.let { config.redemptionRateSar = it }
        command.bronzeThreshold?.let { config.bronzeThreshold = it }
        command.silverThreshold?.let { config.silverThreshold = it }
        command.goldThreshold?.let { config.goldThreshold = it }
        command.platinumThreshold?.let { config.platinumThreshold = it }
        command.pointsExpiryMonths?.let { config.pointsExpiryMonths = it }

        logger.info("Updated loyalty config")
        return configRepository.save(config)
    }

    @Transactional(readOnly = true)
    fun isLoyaltyEnabled(): Boolean {
        return getOrCreateConfig().enabled
    }

    // ========== Member Points ==========

    fun getOrCreateMemberPoints(memberId: UUID): MemberPoints {
        return memberPointsRepository.findByMemberId(memberId)
            .orElseGet {
                if (!memberRepository.existsById(memberId)) {
                    throw NoSuchElementException("Member not found: $memberId")
                }
                logger.info("Creating points account for member: $memberId")
                memberPointsRepository.save(MemberPoints(memberId = memberId))
            }
    }

    @Transactional(readOnly = true)
    fun getMemberPoints(memberId: UUID): MemberPoints? =
        memberPointsRepository.findByMemberId(memberId).orElse(null)

    @Transactional(readOnly = true)
    fun getMemberPointsTransactions(memberId: UUID, pageable: Pageable): Page<PointsTransaction> =
        transactionRepository.findByMemberId(memberId, pageable)

    // ========== Earn Points ==========

    fun earnPoints(command: EarnPointsCommand): MemberPoints {
        val config = getOrCreateConfig()
        if (!config.enabled) {
            throw IllegalStateException("Loyalty program is not enabled")
        }

        val memberPoints = getOrCreateMemberPoints(command.memberId)
        val expiresAt = Instant.now().plus(config.pointsExpiryMonths.toLong(), ChronoUnit.MONTHS)

        val balanceAfter = memberPoints.earnPoints(command.points)
        memberPoints.updateTier(config)

        val transaction = PointsTransaction.earn(
            memberId = command.memberId,
            points = command.points,
            source = command.source,
            balanceAfter = balanceAfter,
            referenceType = command.referenceType,
            referenceId = command.referenceId,
            description = command.description,
            descriptionAr = command.descriptionAr,
            expiresAt = expiresAt
        )

        transactionRepository.save(transaction)
        logger.info("Earned ${command.points} points for member ${command.memberId}, source: ${command.source}")

        return memberPointsRepository.save(memberPoints)
    }

    fun earnPointsForCheckin(memberId: UUID, attendanceId: UUID): MemberPoints? {
        val config = getOrCreateConfig()
        if (!config.enabled || config.pointsPerCheckin <= 0) {
            return null
        }

        return earnPoints(
            EarnPointsCommand(
                memberId = memberId,
                points = config.pointsPerCheckin.toLong(),
                source = PointsSource.ATTENDANCE,
                referenceType = "attendance",
                referenceId = attendanceId,
                description = "Points earned for check-in",
                descriptionAr = "نقاط مكتسبة للتسجيل"
            )
        )
    }

    fun earnPointsForReferral(memberId: UUID, referralId: UUID): MemberPoints? {
        val config = getOrCreateConfig()
        if (!config.enabled || config.pointsPerReferral <= 0) {
            return null
        }

        return earnPoints(
            EarnPointsCommand(
                memberId = memberId,
                points = config.pointsPerReferral.toLong(),
                source = PointsSource.REFERRAL,
                referenceType = "referral",
                referenceId = referralId,
                description = "Points earned for successful referral",
                descriptionAr = "نقاط مكتسبة للإحالة الناجحة"
            )
        )
    }

    fun earnPointsForPurchase(memberId: UUID, invoiceId: UUID, amountSar: java.math.BigDecimal): MemberPoints? {
        val config = getOrCreateConfig()
        if (!config.enabled || config.pointsPerSarSpent <= 0) {
            return null
        }

        val points = config.calculatePointsForSpend(amountSar)
        if (points <= 0) {
            return null
        }

        return earnPoints(
            EarnPointsCommand(
                memberId = memberId,
                points = points,
                source = PointsSource.PURCHASE,
                referenceType = "invoice",
                referenceId = invoiceId,
                description = "Points earned for purchase",
                descriptionAr = "نقاط مكتسبة للشراء"
            )
        )
    }

    // ========== Redeem Points ==========

    fun redeemPoints(command: RedeemPointsCommand): MemberPoints {
        val config = getOrCreateConfig()
        if (!config.enabled) {
            throw IllegalStateException("Loyalty program is not enabled")
        }

        val memberPoints = getOrCreateMemberPoints(command.memberId)

        if (memberPoints.pointsBalance < command.points) {
            throw IllegalArgumentException("Insufficient points balance. Available: ${memberPoints.pointsBalance}, Requested: ${command.points}")
        }

        val balanceAfter = memberPoints.redeemPoints(command.points)

        val transaction = PointsTransaction.redeem(
            memberId = command.memberId,
            points = command.points,
            source = command.source,
            balanceAfter = balanceAfter,
            referenceType = command.referenceType,
            referenceId = command.referenceId,
            description = command.description,
            descriptionAr = command.descriptionAr
        )

        transactionRepository.save(transaction)
        logger.info("Redeemed ${command.points} points for member ${command.memberId}")

        return memberPointsRepository.save(memberPoints)
    }

    // ========== Adjust Points ==========

    fun adjustPoints(command: AdjustPointsCommand): MemberPoints {
        val config = getOrCreateConfig()
        val memberPoints = getOrCreateMemberPoints(command.memberId)

        val balanceAfter = memberPoints.adjustPoints(command.points)
        memberPoints.updateTier(config)

        val transaction = PointsTransaction.adjustment(
            memberId = command.memberId,
            points = command.points,
            balanceAfter = balanceAfter,
            description = command.description,
            descriptionAr = command.descriptionAr
        )

        transactionRepository.save(transaction)
        logger.info("Adjusted ${command.points} points for member ${command.memberId}")

        return memberPointsRepository.save(memberPoints)
    }

    // ========== Leaderboard ==========

    @Transactional(readOnly = true)
    fun getLeaderboard(limit: Int = 10): Page<MemberPoints> {
        val pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "pointsBalance"))
        return memberPointsRepository.findTopByPointsBalance(pageable)
    }

    @Transactional(readOnly = true)
    fun getMembersByTier(tier: LoyaltyTier, pageable: Pageable): Page<MemberPoints> =
        memberPointsRepository.findByTier(tier, pageable)

    // ========== Points Expiry (for scheduled job) ==========

    fun processExpiredPoints() {
        val config = getOrCreateConfig()
        if (!config.enabled) {
            return
        }

        val now = Instant.now()
        val pageable = PageRequest.of(0, 100)
        var page = transactionRepository.findExpiredTransactions(now, pageable)

        while (page.hasContent()) {
            val memberIds = page.content.map { it.memberId }.distinct()

            for (memberId in memberIds) {
                val expiredForMember = page.content.filter { it.memberId == memberId }
                val totalExpired = expiredForMember.sumOf { it.points }

                if (totalExpired > 0) {
                    val memberPoints = memberPointsRepository.findByMemberId(memberId).orElse(null)
                    if (memberPoints != null && memberPoints.pointsBalance > 0) {
                        val actualExpired = minOf(totalExpired, memberPoints.pointsBalance)
                        val balanceAfter = memberPoints.expirePoints(actualExpired)

                        val transaction = PointsTransaction.expire(
                            memberId = memberId,
                            points = actualExpired,
                            balanceAfter = balanceAfter,
                            description = "Points expired",
                            descriptionAr = "انتهت صلاحية النقاط"
                        )

                        transactionRepository.save(transaction)
                        memberPointsRepository.save(memberPoints)
                        logger.info("Expired $actualExpired points for member $memberId")
                    }
                }
            }

            if (page.hasNext()) {
                page = transactionRepository.findExpiredTransactions(now, page.nextPageable())
            } else {
                break
            }
        }
    }
}
