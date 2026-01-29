package com.liyaqa.membership.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.annotations.ParamDef
import org.hibernate.type.SqlTypes
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "member_engagement_scores")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class MemberEngagementScore(
    id: UUID = UUID.randomUUID(),

    @Column(name = "member_id", nullable = false, unique = true)
    val memberId: UUID,

    @Column(name = "overall_score", nullable = false)
    var overallScore: Int,

    @Column(name = "visit_score", nullable = false)
    var visitScore: Int,

    @Column(name = "recency_score", nullable = false)
    var recencyScore: Int,

    @Column(name = "payment_score", nullable = false)
    var paymentScore: Int,

    @Column(name = "class_score", nullable = false)
    var classScore: Int,

    @Column(name = "tenure_score", nullable = false)
    var tenureScore: Int,

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false)
    var riskLevel: RiskLevel,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "risk_factors", columnDefinition = "jsonb")
    var riskFactors: List<RiskFactor>? = null,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "recommended_actions", columnDefinition = "jsonb")
    var recommendedActions: List<RecommendedAction>? = null,

    @Column(name = "calculated_at", nullable = false)
    var calculatedAt: Instant = Instant.now()

) : BaseEntity(id) {

    /**
     * Updates the engagement score with new values.
     */
    fun updateScores(
        overallScore: Int,
        visitScore: Int,
        recencyScore: Int,
        paymentScore: Int,
        classScore: Int,
        tenureScore: Int,
        riskLevel: RiskLevel,
        riskFactors: List<RiskFactor>?,
        recommendedActions: List<RecommendedAction>?
    ) {
        this.overallScore = overallScore.coerceIn(0, 100)
        this.visitScore = visitScore.coerceIn(0, 100)
        this.recencyScore = recencyScore.coerceIn(0, 100)
        this.paymentScore = paymentScore.coerceIn(0, 100)
        this.classScore = classScore.coerceIn(0, 100)
        this.tenureScore = tenureScore.coerceIn(0, 100)
        this.riskLevel = riskLevel
        this.riskFactors = riskFactors
        this.recommendedActions = recommendedActions
        this.calculatedAt = Instant.now()
    }

    /**
     * Determines if the score is stale and needs recalculation.
     */
    fun isStale(maxAgeHours: Long = 24): Boolean {
        return calculatedAt.isBefore(Instant.now().minusSeconds(maxAgeHours * 3600))
    }

    companion object {
        /**
         * Creates a new engagement score with calculated values.
         */
        fun create(
            memberId: UUID,
            overallScore: Int,
            visitScore: Int,
            recencyScore: Int,
            paymentScore: Int,
            classScore: Int,
            tenureScore: Int,
            riskLevel: RiskLevel,
            riskFactors: List<RiskFactor>? = null,
            recommendedActions: List<RecommendedAction>? = null
        ): MemberEngagementScore = MemberEngagementScore(
            memberId = memberId,
            overallScore = overallScore.coerceIn(0, 100),
            visitScore = visitScore.coerceIn(0, 100),
            recencyScore = recencyScore.coerceIn(0, 100),
            paymentScore = paymentScore.coerceIn(0, 100),
            classScore = classScore.coerceIn(0, 100),
            tenureScore = tenureScore.coerceIn(0, 100),
            riskLevel = riskLevel,
            riskFactors = riskFactors,
            recommendedActions = recommendedActions,
            calculatedAt = Instant.now()
        )
    }
}

enum class RiskLevel {
    LOW,      // Score >= 70, no concerning factors
    MEDIUM,   // Score 50-69 or some concerning factors
    HIGH,     // Score 30-49 or multiple concerning factors
    CRITICAL  // Score < 30 or critical factors (imminent churn)
}

data class RiskFactor(
    val code: String,
    val title: String,
    val description: String,
    val severity: String, // LOW, MEDIUM, HIGH
    val impact: Int // How much this factor affects the score
)

data class RecommendedAction(
    val code: String,
    val title: String,
    val description: String,
    val priority: Int, // 1 = highest
    val actionType: String // CALL, EMAIL, OFFER, FREEZE, DOWNGRADE, etc.
)

// Common risk factor codes
object RiskFactorCodes {
    const val LOW_VISIT_FREQUENCY = "LOW_VISIT_FREQUENCY"
    const val NO_RECENT_VISIT = "NO_RECENT_VISIT"
    const val PAYMENT_FAILED = "PAYMENT_FAILED"
    const val PAYMENT_OVERDUE = "PAYMENT_OVERDUE"
    const val SUBSCRIPTION_EXPIRING = "SUBSCRIPTION_EXPIRING"
    const val LOW_CLASS_ATTENDANCE = "LOW_CLASS_ATTENDANCE"
    const val CANCELLATION_PAGE_VIEWED = "CANCELLATION_PAGE_VIEWED"
    const val NEGATIVE_FEEDBACK = "NEGATIVE_FEEDBACK"
    const val ENGAGEMENT_DROPPED = "ENGAGEMENT_DROPPED"
    const val NEW_MEMBER_NOT_ENGAGED = "NEW_MEMBER_NOT_ENGAGED"
}

// Common recommended action codes
object ActionCodes {
    const val OUTREACH_CALL = "OUTREACH_CALL"
    const val SEND_EMAIL = "SEND_EMAIL"
    const val OFFER_DISCOUNT = "OFFER_DISCOUNT"
    const val OFFER_FREE_PT = "OFFER_FREE_PT"
    const val OFFER_FREEZE = "OFFER_FREEZE"
    const val OFFER_DOWNGRADE = "OFFER_DOWNGRADE"
    const val SCHEDULE_TOUR = "SCHEDULE_TOUR"
    const val INVITE_TO_CLASS = "INVITE_TO_CLASS"
    const val COLLECT_PAYMENT = "COLLECT_PAYMENT"
}
