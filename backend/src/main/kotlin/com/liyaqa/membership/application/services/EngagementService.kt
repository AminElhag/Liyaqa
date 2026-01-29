package com.liyaqa.membership.application.services

import com.liyaqa.membership.domain.model.ActionCodes
import com.liyaqa.membership.domain.model.MemberEngagementScore
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.model.RecommendedAction
import com.liyaqa.membership.domain.model.RiskFactor
import com.liyaqa.membership.domain.model.RiskFactorCodes
import com.liyaqa.membership.domain.model.RiskLevel
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.membership.domain.ports.MemberCheckInRepository
import com.liyaqa.membership.domain.ports.MemberEngagementRepository
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.time.temporal.ChronoUnit
import java.util.UUID

data class EngagementOverview(
    val averageScore: Double,
    val scoreDistribution: Map<String, Long>,
    val riskDistribution: Map<RiskLevel, Long>,
    val atRiskCount: Long,
    val criticalCount: Long
)

@Service
@Transactional
class EngagementService(
    private val engagementRepository: MemberEngagementRepository,
    private val memberRepository: MemberRepository,
    private val subscriptionRepository: SubscriptionRepository,
    private val checkInRepository: MemberCheckInRepository
) {
    private val logger = LoggerFactory.getLogger(EngagementService::class.java)

    // Weights for score calculation
    companion object {
        const val VISIT_WEIGHT = 0.35
        const val RECENCY_WEIGHT = 0.25
        const val PAYMENT_WEIGHT = 0.20
        const val CLASS_WEIGHT = 0.10
        const val TENURE_WEIGHT = 0.10

        const val EXPECTED_VISITS_PER_WEEK = 3.0
        const val MAX_DAYS_SINCE_VISIT = 30
        const val HIGH_RISK_THRESHOLD = 40
        const val CRITICAL_RISK_THRESHOLD = 25
        const val MEDIUM_RISK_THRESHOLD = 60
    }

    /**
     * Calculates and updates engagement score for a member.
     */
    fun calculateEngagementScore(memberId: UUID): MemberEngagementScore {
        val member = memberRepository.findById(memberId).orElseThrow {
            NoSuchElementException("Member not found: $memberId")
        }

        // Only calculate for active members
        if (member.status != MemberStatus.ACTIVE) {
            logger.debug("Skipping engagement calculation for non-active member: $memberId")
            return engagementRepository.findByMemberId(memberId).orElseGet {
                MemberEngagementScore.create(
                    memberId = memberId,
                    overallScore = 0,
                    visitScore = 0,
                    recencyScore = 0,
                    paymentScore = 0,
                    classScore = 0,
                    tenureScore = 0,
                    riskLevel = RiskLevel.LOW,
                    riskFactors = null,
                    recommendedActions = null
                )
            }
        }

        val subscription = subscriptionRepository.findActiveByMemberId(memberId).orElse(null)

        // Calculate individual scores
        val visitScore = calculateVisitScore(memberId)
        val recencyScore = calculateRecencyScore(memberId)
        val paymentScore = calculatePaymentScore(subscription)
        val classScore = calculateClassScore(subscription)
        val tenureScore = calculateTenureScore(member.createdAt)

        // Calculate weighted overall score
        val overallScore = (
            visitScore * VISIT_WEIGHT +
            recencyScore * RECENCY_WEIGHT +
            paymentScore * PAYMENT_WEIGHT +
            classScore * CLASS_WEIGHT +
            tenureScore * TENURE_WEIGHT
        ).toInt()

        // Determine risk factors
        val riskFactors = determineRiskFactors(
            memberId = memberId,
            visitScore = visitScore,
            recencyScore = recencyScore,
            paymentScore = paymentScore,
            subscription = subscription
        )

        // Determine risk level
        val riskLevel = determineRiskLevel(overallScore, riskFactors)

        // Generate recommended actions
        val recommendedActions = generateRecommendedActions(riskFactors, subscription)

        // Save or update score
        val engagementScore = engagementRepository.findByMemberId(memberId).orElseGet {
            MemberEngagementScore.create(
                memberId = memberId,
                overallScore = overallScore,
                visitScore = visitScore,
                recencyScore = recencyScore,
                paymentScore = paymentScore,
                classScore = classScore,
                tenureScore = tenureScore,
                riskLevel = riskLevel,
                riskFactors = riskFactors,
                recommendedActions = recommendedActions
            )
        }

        engagementScore.updateScores(
            overallScore = overallScore,
            visitScore = visitScore,
            recencyScore = recencyScore,
            paymentScore = paymentScore,
            classScore = classScore,
            tenureScore = tenureScore,
            riskLevel = riskLevel,
            riskFactors = riskFactors,
            recommendedActions = recommendedActions
        )

        val saved = engagementRepository.save(engagementScore)
        logger.debug("Updated engagement score for member $memberId: $overallScore (risk: $riskLevel)")
        return saved
    }

    private fun calculateVisitScore(memberId: UUID): Int {
        val avgVisitsPerWeek = checkInRepository.getAverageVisitsPerWeek(memberId, 4)
        val ratio = avgVisitsPerWeek / EXPECTED_VISITS_PER_WEEK
        return (ratio * 100).coerceIn(0.0, 100.0).toInt()
    }

    private fun calculateRecencyScore(memberId: UUID): Int {
        val lastCheckIn = checkInRepository.findLastCheckIn(memberId).orElse(null)
        if (lastCheckIn == null) return 0

        val daysSinceVisit = ChronoUnit.DAYS.between(lastCheckIn.checkInTime, Instant.now())
        return when {
            daysSinceVisit <= 2 -> 100
            daysSinceVisit <= 5 -> 85
            daysSinceVisit <= 7 -> 70
            daysSinceVisit <= 14 -> 50
            daysSinceVisit <= 21 -> 30
            daysSinceVisit <= 30 -> 15
            else -> 0
        }
    }

    private fun calculatePaymentScore(subscription: com.liyaqa.membership.domain.model.Subscription?): Int {
        if (subscription == null) return 50 // No subscription, neutral score

        return when (subscription.status) {
            SubscriptionStatus.ACTIVE -> 100
            SubscriptionStatus.PAST_DUE -> 40
            SubscriptionStatus.SUSPENDED -> 20
            SubscriptionStatus.PENDING_PAYMENT -> 60
            else -> 50
        }
    }

    private fun calculateClassScore(subscription: com.liyaqa.membership.domain.model.Subscription?): Int {
        // For now, return neutral score. Can be enhanced with class booking data.
        return 70
    }

    private fun calculateTenureScore(memberSince: Instant): Int {
        val monthsAsMember = ChronoUnit.MONTHS.between(
            memberSince.atZone(ZoneOffset.UTC).toLocalDate(),
            LocalDate.now()
        )
        return when {
            monthsAsMember >= 24 -> 100 // 2+ years
            monthsAsMember >= 12 -> 85  // 1-2 years
            monthsAsMember >= 6 -> 70   // 6mo-1yr
            monthsAsMember >= 3 -> 55   // 3-6mo
            monthsAsMember >= 1 -> 40   // 1-3mo
            else -> 25                  // New member
        }
    }

    private fun determineRiskFactors(
        memberId: UUID,
        visitScore: Int,
        recencyScore: Int,
        paymentScore: Int,
        subscription: com.liyaqa.membership.domain.model.Subscription?
    ): List<RiskFactor> {
        val factors = mutableListOf<RiskFactor>()

        if (visitScore < 40) {
            factors.add(RiskFactor(
                code = RiskFactorCodes.LOW_VISIT_FREQUENCY,
                title = "Low visit frequency",
                description = "Member is visiting less than expected",
                severity = if (visitScore < 20) "HIGH" else "MEDIUM",
                impact = 20
            ))
        }

        if (recencyScore < 30) {
            factors.add(RiskFactor(
                code = RiskFactorCodes.NO_RECENT_VISIT,
                title = "No recent visits",
                description = "Member hasn't visited in over 2 weeks",
                severity = if (recencyScore < 15) "HIGH" else "MEDIUM",
                impact = 25
            ))
        }

        if (paymentScore < 50) {
            factors.add(RiskFactor(
                code = RiskFactorCodes.PAYMENT_OVERDUE,
                title = "Payment issues",
                description = "Member has outstanding payment issues",
                severity = if (paymentScore < 30) "HIGH" else "MEDIUM",
                impact = 20
            ))
        }

        subscription?.let {
            val daysUntilExpiry = it.daysRemaining()
            if (daysUntilExpiry in 0..14 && it.status != SubscriptionStatus.PENDING_CANCELLATION) {
                factors.add(RiskFactor(
                    code = RiskFactorCodes.SUBSCRIPTION_EXPIRING,
                    title = "Subscription expiring soon",
                    description = "Subscription expires in $daysUntilExpiry days",
                    severity = if (daysUntilExpiry <= 7) "HIGH" else "MEDIUM",
                    impact = 15
                ))
            }
        }

        return factors
    }

    private fun determineRiskLevel(overallScore: Int, riskFactors: List<RiskFactor>): RiskLevel {
        val highSeverityCount = riskFactors.count { it.severity == "HIGH" }

        return when {
            overallScore < CRITICAL_RISK_THRESHOLD || highSeverityCount >= 3 -> RiskLevel.CRITICAL
            overallScore < HIGH_RISK_THRESHOLD || highSeverityCount >= 2 -> RiskLevel.HIGH
            overallScore < MEDIUM_RISK_THRESHOLD || highSeverityCount >= 1 -> RiskLevel.MEDIUM
            else -> RiskLevel.LOW
        }
    }

    private fun generateRecommendedActions(
        riskFactors: List<RiskFactor>,
        subscription: com.liyaqa.membership.domain.model.Subscription?
    ): List<RecommendedAction> {
        val actions = mutableListOf<RecommendedAction>()
        var priority = 1

        riskFactors.forEach { factor ->
            when (factor.code) {
                RiskFactorCodes.NO_RECENT_VISIT -> {
                    actions.add(RecommendedAction(
                        code = ActionCodes.OUTREACH_CALL,
                        title = "Outreach call",
                        description = "Call member to check in and understand barriers to visiting",
                        priority = priority++,
                        actionType = "CALL"
                    ))
                    actions.add(RecommendedAction(
                        code = ActionCodes.INVITE_TO_CLASS,
                        title = "Invite to group class",
                        description = "Send invitation to an upcoming group fitness class",
                        priority = priority++,
                        actionType = "EMAIL"
                    ))
                }
                RiskFactorCodes.LOW_VISIT_FREQUENCY -> {
                    actions.add(RecommendedAction(
                        code = ActionCodes.OFFER_FREE_PT,
                        title = "Offer free PT session",
                        description = "Offer a complimentary personal training session",
                        priority = priority++,
                        actionType = "OFFER"
                    ))
                }
                RiskFactorCodes.PAYMENT_OVERDUE -> {
                    actions.add(RecommendedAction(
                        code = ActionCodes.COLLECT_PAYMENT,
                        title = "Collect payment",
                        description = "Contact member to resolve payment issue",
                        priority = priority++,
                        actionType = "CALL"
                    ))
                }
                RiskFactorCodes.SUBSCRIPTION_EXPIRING -> {
                    actions.add(RecommendedAction(
                        code = ActionCodes.OFFER_DISCOUNT,
                        title = "Renewal discount",
                        description = "Offer early renewal discount",
                        priority = priority++,
                        actionType = "OFFER"
                    ))
                }
            }
        }

        return actions.take(5) // Max 5 actions
    }

    /**
     * Gets engagement score for a member.
     */
    @Transactional(readOnly = true)
    fun getEngagementScore(memberId: UUID): MemberEngagementScore? {
        return engagementRepository.findByMemberId(memberId).orElse(null)
    }

    /**
     * Gets engagement score for a member, calculating if not exists or stale.
     */
    fun getOrCalculateEngagementScore(memberId: UUID): MemberEngagementScore {
        val existing = engagementRepository.findByMemberId(memberId).orElse(null)
        return if (existing == null || existing.isStale()) {
            calculateEngagementScore(memberId)
        } else {
            existing
        }
    }

    /**
     * Gets at-risk members.
     */
    @Transactional(readOnly = true)
    fun getAtRiskMembers(riskLevels: List<RiskLevel>? = null, pageable: Pageable): Page<MemberEngagementScore> {
        val levels = riskLevels ?: listOf(RiskLevel.HIGH, RiskLevel.CRITICAL)
        return engagementRepository.findByRiskLevelIn(levels, pageable)
    }

    /**
     * Gets engagement overview statistics.
     */
    @Transactional(readOnly = true)
    fun getEngagementOverview(): EngagementOverview {
        val averageScore = engagementRepository.getAverageScore()
        val scoreDistribution = engagementRepository.getScoreDistribution()
        val riskDistribution = engagementRepository.getRiskLevelDistribution()
        val atRiskCount = engagementRepository.countByRiskLevelIn(listOf(RiskLevel.HIGH, RiskLevel.CRITICAL))
        val criticalCount = engagementRepository.countByRiskLevel(RiskLevel.CRITICAL)

        return EngagementOverview(
            averageScore = averageScore,
            scoreDistribution = scoreDistribution,
            riskDistribution = riskDistribution,
            atRiskCount = atRiskCount,
            criticalCount = criticalCount
        )
    }

    /**
     * Scheduled job to recalculate stale engagement scores.
     * Runs daily at 3 AM.
     */
    @Scheduled(cron = "0 0 3 * * *")
    fun recalculateStaleScores() {
        logger.info("Starting scheduled engagement score recalculation")
        val staleThreshold = Instant.now().minus(24, ChronoUnit.HOURS)
        var processed = 0

        // Process stale scores in batches
        var page = engagementRepository.findStaleScores(staleThreshold, PageRequest.of(0, 100))
        while (page.hasContent()) {
            page.content.forEach { score ->
                try {
                    calculateEngagementScore(score.memberId)
                    processed++
                } catch (e: Exception) {
                    logger.error("Failed to recalculate engagement for member ${score.memberId}: ${e.message}")
                }
            }
            if (page.hasNext()) {
                page = engagementRepository.findStaleScores(staleThreshold, page.nextPageable())
            } else {
                break
            }
        }

        // Calculate scores for members without one
        val membersWithoutScore = engagementRepository.findAllMemberIdsWithoutScore()
        membersWithoutScore.forEach { memberId ->
            try {
                calculateEngagementScore(memberId)
                processed++
            } catch (e: Exception) {
                logger.error("Failed to calculate engagement for member $memberId: ${e.message}")
            }
        }

        logger.info("Completed engagement score recalculation. Processed: $processed")
    }
}
