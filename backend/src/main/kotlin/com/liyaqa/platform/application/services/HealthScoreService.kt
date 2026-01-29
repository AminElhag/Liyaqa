package com.liyaqa.platform.application.services

import com.liyaqa.platform.domain.model.ClientHealthScore
import com.liyaqa.platform.domain.model.RiskLevel
import com.liyaqa.platform.domain.ports.ClientHealthScoreRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

/**
 * Service for calculating and managing client health scores.
 * Health scores help identify at-risk clients for proactive engagement.
 */
@Service
@Transactional
class HealthScoreService(
    private val healthScoreRepository: ClientHealthScoreRepository
) {
    /**
     * Creates or updates a health score for an organization.
     */
    fun calculateAndSaveScore(
        organizationId: UUID,
        metrics: HealthMetrics
    ): ClientHealthScore {
        // Get previous score for trend calculation
        val previousScore = healthScoreRepository.findLatestByOrganizationId(organizationId).orElse(null)

        val score = if (previousScore != null) {
            ClientHealthScore.createFromPrevious(organizationId, previousScore)
        } else {
            ClientHealthScore.createForOrganization(organizationId)
        }

        // Set usage metrics
        score.adminLogins30d = metrics.adminLogins30d
        score.featuresUsed30d = metrics.featuresUsed30d
        score.apiCalls30d = metrics.apiCalls30d

        // Set engagement metrics
        score.memberGrowth30d = metrics.memberGrowth30d
        score.checkins30d = metrics.checkins30d
        score.bookings30d = metrics.bookings30d

        // Set payment metrics
        score.paymentSuccessRate = metrics.paymentSuccessRate
        score.failedPayments30d = metrics.failedPayments30d
        score.daysSincePayment = metrics.daysSincePayment

        // Set support metrics
        score.openTickets = metrics.openTickets
        score.tickets30d = metrics.tickets30d
        score.avgSatisfaction = metrics.avgSatisfaction

        // Calculate all scores
        score.calculateAllScores()

        return healthScoreRepository.save(score)
    }

    /**
     * Gets the latest health score for an organization.
     */
    @Transactional(readOnly = true)
    fun getLatestScore(organizationId: UUID): ClientHealthScore {
        return healthScoreRepository.findLatestByOrganizationId(organizationId)
            .orElseThrow { NoSuchElementException("No health score found for organization: $organizationId") }
    }

    /**
     * Gets health score history for an organization.
     */
    @Transactional(readOnly = true)
    fun getScoreHistory(
        organizationId: UUID,
        days: Int = 30,
        pageable: Pageable
    ): Page<ClientHealthScore> {
        val since = Instant.now().minus(days.toLong(), ChronoUnit.DAYS)
        return healthScoreRepository.findHistoryByOrganizationId(organizationId, since, pageable)
    }

    /**
     * Gets all clients at risk (health score < 60).
     */
    @Transactional(readOnly = true)
    fun getAtRiskClients(pageable: Pageable): Page<ClientHealthScore> {
        return healthScoreRepository.findAtRisk(pageable)
    }

    /**
     * Gets all healthy clients (health score >= 80).
     */
    @Transactional(readOnly = true)
    fun getHealthyClients(pageable: Pageable): Page<ClientHealthScore> {
        return healthScoreRepository.findHealthy(pageable)
    }

    /**
     * Gets clients with declining health scores.
     */
    @Transactional(readOnly = true)
    fun getDecliningClients(pageable: Pageable): Page<ClientHealthScore> {
        return healthScoreRepository.findDeclining(pageable)
    }

    /**
     * Gets clients by risk level.
     */
    @Transactional(readOnly = true)
    fun getByRiskLevel(riskLevel: RiskLevel, pageable: Pageable): Page<ClientHealthScore> {
        return healthScoreRepository.findByRiskLevel(riskLevel, pageable)
    }

    /**
     * Gets health score distribution across risk levels.
     */
    @Transactional(readOnly = true)
    fun getScoreDistribution(): Map<RiskLevel, Long> {
        return healthScoreRepository.getScoreDistribution()
    }

    /**
     * Gets health score statistics for the platform.
     */
    @Transactional(readOnly = true)
    fun getStatistics(): HealthStatistics {
        val distribution = getScoreDistribution()
        return HealthStatistics(
            totalClients = healthScoreRepository.count(),
            averageScore = healthScoreRepository.getAverageScore(),
            healthyCount = distribution[RiskLevel.LOW] ?: 0,
            monitorCount = distribution[RiskLevel.MEDIUM] ?: 0,
            atRiskCount = (distribution[RiskLevel.HIGH] ?: 0) + (distribution[RiskLevel.CRITICAL] ?: 0),
            criticalCount = distribution[RiskLevel.CRITICAL] ?: 0
        )
    }

    /**
     * Cleans up old health score history (keeps last 90 days).
     */
    fun cleanupOldScores(organizationId: UUID, keepDays: Int = 90): Int {
        val cutoff = Instant.now().minus(keepDays.toLong(), ChronoUnit.DAYS)
        return healthScoreRepository.deleteByOrganizationIdAndCalculatedAtBefore(organizationId, cutoff)
    }

    /**
     * Gets a health report for an organization.
     */
    @Transactional(readOnly = true)
    fun getHealthReport(organizationId: UUID): HealthReport {
        val score = healthScoreRepository.findLatestByOrganizationId(organizationId)
            .orElseThrow { NoSuchElementException("No health score found for organization: $organizationId") }

        val recommendations = mutableListOf<String>()

        // Generate recommendations based on scores
        if (score.usageScore < 50) {
            recommendations.add("Low admin activity detected. Consider scheduling a check-in call.")
        }
        if (score.engagementScore < 50) {
            recommendations.add("Member engagement is below average. Review class schedules and promotions.")
        }
        if (score.paymentScore < 50) {
            recommendations.add("Payment issues detected. Review dunning status and reach out proactively.")
        }
        if (score.supportScore < 50) {
            recommendations.add("High support ticket volume. Consider dedicated CSM assignment.")
        }

        return HealthReport(
            organizationId = organizationId,
            overallScore = score.overallScore,
            riskLevel = score.riskLevel,
            trend = score.trend,
            componentScores = mapOf(
                "Usage" to score.usageScore,
                "Engagement" to score.engagementScore,
                "Payment" to score.paymentScore,
                "Support" to score.supportScore
            ),
            weakestArea = score.getWeakestArea(),
            strongestArea = score.getStrongestArea(),
            recommendations = recommendations,
            calculatedAt = score.calculatedAt
        )
    }
}

/**
 * Input metrics for health score calculation.
 */
data class HealthMetrics(
    // Usage metrics
    val adminLogins30d: Int = 0,
    val featuresUsed30d: Int = 0,
    val apiCalls30d: Long = 0,

    // Engagement metrics
    val memberGrowth30d: Int = 0,
    val checkins30d: Long = 0,
    val bookings30d: Long = 0,

    // Payment metrics
    val paymentSuccessRate: Int = 100,
    val failedPayments30d: Int = 0,
    val daysSincePayment: Int? = null,

    // Support metrics
    val openTickets: Int = 0,
    val tickets30d: Int = 0,
    val avgSatisfaction: Double? = null
)

/**
 * Health score statistics for platform dashboard.
 */
data class HealthStatistics(
    val totalClients: Long,
    val averageScore: Double,
    val healthyCount: Long,
    val monitorCount: Long,
    val atRiskCount: Long,
    val criticalCount: Long
) {
    val healthyPercent: Double
        get() = if (totalClients > 0) healthyCount.toDouble() / totalClients * 100 else 0.0

    val atRiskPercent: Double
        get() = if (totalClients > 0) atRiskCount.toDouble() / totalClients * 100 else 0.0
}

/**
 * Detailed health report for an organization.
 */
data class HealthReport(
    val organizationId: UUID,
    val overallScore: Int,
    val riskLevel: RiskLevel,
    val trend: com.liyaqa.platform.domain.model.HealthTrend,
    val componentScores: Map<String, Int>,
    val weakestArea: Pair<String, Int>,
    val strongestArea: Pair<String, Int>,
    val recommendations: List<String>,
    val calculatedAt: Instant
)
