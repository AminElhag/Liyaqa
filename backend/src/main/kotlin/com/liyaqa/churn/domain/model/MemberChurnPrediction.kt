package com.liyaqa.churn.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.Instant
import java.util.*

@Entity
@Table(name = "member_churn_predictions")
@FilterDef(name = "tenantFilter", parameters = [ParamDef(name = "tenantId", type = UUID::class)])
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class MemberChurnPrediction(
    id: UUID = UUID.randomUUID(),

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Column(name = "model_id", nullable = false)
    val modelId: UUID,

    @Column(name = "churn_score", nullable = false)
    val churnScore: Int, // 0-100

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false, length = 20)
    val riskLevel: RiskLevel,

    @Column(name = "top_risk_factors", columnDefinition = "JSONB")
    val topRiskFactors: String? = null,

    @Column(name = "recommended_interventions", columnDefinition = "JSONB")
    val recommendedInterventions: String? = null,

    @Column(name = "prediction_date", nullable = false)
    val predictionDate: Instant = Instant.now(),

    @Column(name = "valid_until")
    val validUntil: Instant? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "intervention_status", nullable = false, length = 30)
    var interventionStatus: InterventionStatus = InterventionStatus.PENDING,

    @Enumerated(EnumType.STRING)
    @Column(name = "actual_outcome", length = 20)
    var actualOutcome: ChurnOutcome? = null,

    @Column(name = "outcome_date")
    var outcomeDate: Instant? = null
) : BaseEntity(id) {

    fun startIntervention() {
        interventionStatus = InterventionStatus.IN_PROGRESS
    }

    fun completeIntervention() {
        interventionStatus = InterventionStatus.COMPLETED
    }

    fun ignoreIntervention() {
        interventionStatus = InterventionStatus.IGNORED
    }

    fun recordOutcome(outcome: ChurnOutcome) {
        actualOutcome = outcome
        outcomeDate = Instant.now()
    }

    fun isExpired(): Boolean =
        validUntil != null && Instant.now().isAfter(validUntil)

    companion object {
        fun calculateRiskLevel(score: Int): RiskLevel = when {
            score <= 25 -> RiskLevel.LOW
            score <= 50 -> RiskLevel.MEDIUM
            score <= 75 -> RiskLevel.HIGH
            else -> RiskLevel.CRITICAL
        }
    }
}
