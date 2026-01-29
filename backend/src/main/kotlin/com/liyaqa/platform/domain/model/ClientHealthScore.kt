package com.liyaqa.platform.domain.model

import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * Represents a client's health score at a point in time.
 * Health scores are calculated daily and track the overall health
 * of the client relationship.
 *
 * Score Components (0-100 total):
 * - Usage (40%): Admin logins, feature adoption, API calls
 * - Engagement (25%): Member growth, check-ins, class bookings
 * - Payment (20%): On-time payments, failed payment resolution
 * - Support (15%): Ticket volume, sentiment, resolution satisfaction
 */
@Entity
@Table(name = "client_health_scores")
class ClientHealthScore(
    id: UUID = UUID.randomUUID(),

    /**
     * The organization this health score belongs to.
     */
    @Column(name = "organization_id", nullable = false)
    var organizationId: UUID,

    /**
     * Overall health score (0-100).
     */
    @Column(name = "overall_score", nullable = false)
    var overallScore: Int = 0,

    /**
     * Usage score component (0-100, weighted 40%).
     */
    @Column(name = "usage_score", nullable = false)
    var usageScore: Int = 0,

    /**
     * Engagement score component (0-100, weighted 25%).
     */
    @Column(name = "engagement_score", nullable = false)
    var engagementScore: Int = 0,

    /**
     * Payment score component (0-100, weighted 20%).
     */
    @Column(name = "payment_score", nullable = false)
    var paymentScore: Int = 0,

    /**
     * Support score component (0-100, weighted 15%).
     */
    @Column(name = "support_score", nullable = false)
    var supportScore: Int = 0,

    /**
     * Score trend compared to previous period.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "trend", nullable = false)
    var trend: HealthTrend = HealthTrend.STABLE,

    /**
     * Risk level based on overall score.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false)
    var riskLevel: RiskLevel = RiskLevel.LOW,

    /**
     * When this score was calculated.
     */
    @Column(name = "calculated_at", nullable = false)
    var calculatedAt: Instant = Instant.now(),

    /**
     * Previous overall score for trend calculation.
     */
    @Column(name = "previous_score")
    var previousScore: Int? = null,

    /**
     * Score change from previous period.
     */
    @Column(name = "score_change")
    var scoreChange: Int? = null,

    // ============================================
    // Usage Metrics (for score calculation)
    // ============================================

    /**
     * Admin logins in the past 30 days.
     */
    @Column(name = "admin_logins_30d", nullable = false)
    var adminLogins30d: Int = 0,

    /**
     * Distinct features used in the past 30 days.
     */
    @Column(name = "features_used_30d", nullable = false)
    var featuresUsed30d: Int = 0,

    /**
     * API calls in the past 30 days.
     */
    @Column(name = "api_calls_30d", nullable = false)
    var apiCalls30d: Long = 0,

    // ============================================
    // Engagement Metrics
    // ============================================

    /**
     * Net member growth in the past 30 days.
     */
    @Column(name = "member_growth_30d", nullable = false)
    var memberGrowth30d: Int = 0,

    /**
     * Total check-ins in the past 30 days.
     */
    @Column(name = "checkins_30d", nullable = false)
    var checkins30d: Long = 0,

    /**
     * Class bookings in the past 30 days.
     */
    @Column(name = "bookings_30d", nullable = false)
    var bookings30d: Long = 0,

    // ============================================
    // Payment Metrics
    // ============================================

    /**
     * Payment success rate (0-100) in the past 90 days.
     */
    @Column(name = "payment_success_rate", nullable = false)
    var paymentSuccessRate: Int = 100,

    /**
     * Number of failed payments in the past 30 days.
     */
    @Column(name = "failed_payments_30d", nullable = false)
    var failedPayments30d: Int = 0,

    /**
     * Days since last on-time payment.
     */
    @Column(name = "days_since_payment")
    var daysSincePayment: Int? = null,

    // ============================================
    // Support Metrics
    // ============================================

    /**
     * Open support tickets.
     */
    @Column(name = "open_tickets", nullable = false)
    var openTickets: Int = 0,

    /**
     * Tickets created in the past 30 days.
     */
    @Column(name = "tickets_30d", nullable = false)
    var tickets30d: Int = 0,

    /**
     * Average ticket resolution satisfaction (1-5, null if no data).
     */
    @Column(name = "avg_satisfaction")
    var avgSatisfaction: Double? = null

) : OrganizationLevelEntity(id) {

    companion object {
        // Score weights
        const val USAGE_WEIGHT = 0.40
        const val ENGAGEMENT_WEIGHT = 0.25
        const val PAYMENT_WEIGHT = 0.20
        const val SUPPORT_WEIGHT = 0.15

        // Thresholds for trend calculation
        const val IMPROVING_THRESHOLD = 5
        const val DECLINING_THRESHOLD = -5

        /**
         * Creates a new health score for an organization.
         */
        fun createForOrganization(organizationId: UUID): ClientHealthScore {
            return ClientHealthScore(
                organizationId = organizationId,
                calculatedAt = Instant.now()
            )
        }

        /**
         * Creates a new health score from a previous score.
         */
        fun createFromPrevious(
            organizationId: UUID,
            previousScore: ClientHealthScore
        ): ClientHealthScore {
            return ClientHealthScore(
                organizationId = organizationId,
                previousScore = previousScore.overallScore,
                calculatedAt = Instant.now()
            )
        }
    }

    // ============================================
    // Domain Methods - Score Calculation
    // ============================================

    /**
     * Calculates and updates the overall health score.
     */
    fun calculateOverallScore() {
        overallScore = (
            (usageScore * USAGE_WEIGHT) +
            (engagementScore * ENGAGEMENT_WEIGHT) +
            (paymentScore * PAYMENT_WEIGHT) +
            (supportScore * SUPPORT_WEIGHT)
        ).toInt().coerceIn(0, 100)

        // Update risk level
        riskLevel = RiskLevel.fromScore(overallScore)

        // Update trend if we have previous score
        if (previousScore != null) {
            scoreChange = overallScore - previousScore!!
            trend = when {
                scoreChange!! >= IMPROVING_THRESHOLD -> HealthTrend.IMPROVING
                scoreChange!! <= DECLINING_THRESHOLD -> HealthTrend.DECLINING
                else -> HealthTrend.STABLE
            }
        }

        calculatedAt = Instant.now()
    }

    /**
     * Calculates the usage score based on metrics.
     */
    fun calculateUsageScore() {
        var score = 0

        // Admin logins (max 40 points)
        score += when {
            adminLogins30d >= 20 -> 40
            adminLogins30d >= 10 -> 30
            adminLogins30d >= 5 -> 20
            adminLogins30d >= 1 -> 10
            else -> 0
        }

        // Features used (max 40 points)
        score += when {
            featuresUsed30d >= 10 -> 40
            featuresUsed30d >= 7 -> 30
            featuresUsed30d >= 4 -> 20
            featuresUsed30d >= 1 -> 10
            else -> 0
        }

        // API usage (max 20 points, for API-enabled plans)
        score += when {
            apiCalls30d >= 1000 -> 20
            apiCalls30d >= 500 -> 15
            apiCalls30d >= 100 -> 10
            apiCalls30d > 0 -> 5
            else -> 0
        }

        usageScore = score.coerceIn(0, 100)
    }

    /**
     * Calculates the engagement score based on metrics.
     */
    fun calculateEngagementScore() {
        var score = 0

        // Member growth (max 40 points)
        score += when {
            memberGrowth30d >= 20 -> 40
            memberGrowth30d >= 10 -> 30
            memberGrowth30d >= 5 -> 20
            memberGrowth30d > 0 -> 15
            memberGrowth30d == 0 -> 10
            else -> 0 // Negative growth
        }

        // Check-ins (max 30 points)
        score += when {
            checkins30d >= 500 -> 30
            checkins30d >= 200 -> 25
            checkins30d >= 100 -> 20
            checkins30d >= 50 -> 15
            checkins30d > 0 -> 10
            else -> 0
        }

        // Bookings (max 30 points)
        score += when {
            bookings30d >= 200 -> 30
            bookings30d >= 100 -> 25
            bookings30d >= 50 -> 20
            bookings30d >= 20 -> 15
            bookings30d > 0 -> 10
            else -> 0
        }

        engagementScore = score.coerceIn(0, 100)
    }

    /**
     * Calculates the payment score based on metrics.
     */
    fun calculatePaymentScore() {
        var score = 0

        // Payment success rate (max 60 points)
        score += when {
            paymentSuccessRate >= 98 -> 60
            paymentSuccessRate >= 95 -> 50
            paymentSuccessRate >= 90 -> 40
            paymentSuccessRate >= 80 -> 25
            else -> 10
        }

        // Failed payments penalty (max -30 points)
        score -= when {
            failedPayments30d >= 5 -> 30
            failedPayments30d >= 3 -> 20
            failedPayments30d >= 1 -> 10
            else -> 0
        }

        // Recent payment bonus (max 40 points)
        score += when {
            daysSincePayment == null -> 30 // No payment due yet
            daysSincePayment!! <= 7 -> 40
            daysSincePayment!! <= 30 -> 30
            daysSincePayment!! <= 60 -> 20
            else -> 0
        }

        paymentScore = score.coerceIn(0, 100)
    }

    /**
     * Calculates the support score based on metrics.
     */
    fun calculateSupportScore() {
        var score = 100 // Start with perfect score

        // Open tickets penalty (max -40 points)
        score -= when {
            openTickets >= 5 -> 40
            openTickets >= 3 -> 25
            openTickets >= 1 -> 10
            else -> 0
        }

        // Ticket volume penalty (max -30 points)
        score -= when {
            tickets30d >= 10 -> 30
            tickets30d >= 5 -> 20
            tickets30d >= 3 -> 10
            else -> 0
        }

        // Satisfaction bonus/penalty (max ±30 points)
        avgSatisfaction?.let { sat ->
            score += when {
                sat >= 4.5 -> 30
                sat >= 4.0 -> 20
                sat >= 3.5 -> 10
                sat >= 3.0 -> 0
                sat >= 2.0 -> -15
                else -> -30
            }
        }

        supportScore = score.coerceIn(0, 100)
    }

    /**
     * Calculates all component scores and the overall score.
     */
    fun calculateAllScores() {
        calculateUsageScore()
        calculateEngagementScore()
        calculatePaymentScore()
        calculateSupportScore()
        calculateOverallScore()
    }

    // ============================================
    // Domain Methods - Queries
    // ============================================

    /**
     * Checks if the client is at risk (health score < 60).
     */
    fun isAtRisk(): Boolean = riskLevel in listOf(RiskLevel.HIGH, RiskLevel.CRITICAL)

    /**
     * Checks if the client is healthy (health score >= 80).
     */
    fun isHealthy(): Boolean = riskLevel == RiskLevel.LOW

    /**
     * Checks if the score is declining.
     */
    fun isDeclining(): Boolean = trend == HealthTrend.DECLINING

    /**
     * Gets the lowest component score.
     */
    fun getWeakestArea(): Pair<String, Int> {
        val scores = mapOf(
            "Usage" to usageScore,
            "Engagement" to engagementScore,
            "Payment" to paymentScore,
            "Support" to supportScore
        )
        return scores.minByOrNull { it.value }?.toPair() ?: ("Unknown" to 0)
    }

    /**
     * Gets the highest component score.
     */
    fun getStrongestArea(): Pair<String, Int> {
        val scores = mapOf(
            "Usage" to usageScore,
            "Engagement" to engagementScore,
            "Payment" to paymentScore,
            "Support" to supportScore
        )
        return scores.maxByOrNull { it.value }?.toPair() ?: ("Unknown" to 100)
    }

}

/**
 * Represents an individual health signal that contributed to the score.
 * Used for detailed reporting.
 */
data class HealthSignal(
    val type: SignalType,
    val value: Any,
    val impact: Int,
    val description: String
)
