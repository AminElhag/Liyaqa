package com.liyaqa.membership.api

import com.liyaqa.membership.application.services.EngagementOverview
import com.liyaqa.membership.domain.model.MemberEngagementScore
import com.liyaqa.membership.domain.model.RecommendedAction
import com.liyaqa.membership.domain.model.RiskFactor
import com.liyaqa.membership.domain.model.RiskLevel
import java.time.Instant
import java.util.UUID

data class EngagementScoreResponse(
    val id: UUID,
    val memberId: UUID,
    val overallScore: Int,
    val visitScore: Int,
    val recencyScore: Int,
    val paymentScore: Int,
    val classScore: Int,
    val tenureScore: Int,
    val riskLevel: RiskLevel,
    val riskFactors: List<RiskFactorResponse>?,
    val recommendedActions: List<RecommendedActionResponse>?,
    val calculatedAt: Instant,
    val isStale: Boolean
) {
    companion object {
        fun from(score: MemberEngagementScore): EngagementScoreResponse = EngagementScoreResponse(
            id = score.id,
            memberId = score.memberId,
            overallScore = score.overallScore,
            visitScore = score.visitScore,
            recencyScore = score.recencyScore,
            paymentScore = score.paymentScore,
            classScore = score.classScore,
            tenureScore = score.tenureScore,
            riskLevel = score.riskLevel,
            riskFactors = score.riskFactors?.map { RiskFactorResponse.from(it) },
            recommendedActions = score.recommendedActions?.map { RecommendedActionResponse.from(it) },
            calculatedAt = score.calculatedAt,
            isStale = score.isStale()
        )
    }
}

data class RiskFactorResponse(
    val code: String,
    val title: String,
    val description: String,
    val severity: String,
    val impact: Int
) {
    companion object {
        fun from(factor: RiskFactor): RiskFactorResponse = RiskFactorResponse(
            code = factor.code,
            title = factor.title,
            description = factor.description,
            severity = factor.severity,
            impact = factor.impact
        )
    }
}

data class RecommendedActionResponse(
    val code: String,
    val title: String,
    val description: String,
    val priority: Int,
    val actionType: String
) {
    companion object {
        fun from(action: RecommendedAction): RecommendedActionResponse = RecommendedActionResponse(
            code = action.code,
            title = action.title,
            description = action.description,
            priority = action.priority,
            actionType = action.actionType
        )
    }
}

data class EngagementOverviewResponse(
    val averageScore: Double,
    val scoreDistribution: Map<String, Long>,
    val riskDistribution: Map<String, Long>,
    val atRiskCount: Long,
    val criticalCount: Long
) {
    companion object {
        fun from(overview: EngagementOverview): EngagementOverviewResponse = EngagementOverviewResponse(
            averageScore = overview.averageScore,
            scoreDistribution = overview.scoreDistribution,
            riskDistribution = overview.riskDistribution.mapKeys { it.key.name },
            atRiskCount = overview.atRiskCount,
            criticalCount = overview.criticalCount
        )
    }
}

data class AtRiskMemberResponse(
    val memberId: UUID,
    val memberName: String?,
    val memberEmail: String?,
    val overallScore: Int,
    val riskLevel: RiskLevel,
    val riskFactors: List<RiskFactorResponse>?,
    val recommendedActions: List<RecommendedActionResponse>?,
    val calculatedAt: Instant
)

data class EngagementBadgeResponse(
    val score: Int,
    val riskLevel: RiskLevel,
    val color: String,
    val label: String
) {
    companion object {
        fun from(score: MemberEngagementScore): EngagementBadgeResponse {
            val (color, label) = when {
                score.overallScore >= 80 -> "green" to "Excellent"
                score.overallScore >= 60 -> "blue" to "Good"
                score.overallScore >= 40 -> "yellow" to "Fair"
                score.overallScore >= 20 -> "orange" to "Poor"
                else -> "red" to "Critical"
            }
            return EngagementBadgeResponse(
                score = score.overallScore,
                riskLevel = score.riskLevel,
                color = color,
                label = label
            )
        }
    }
}
