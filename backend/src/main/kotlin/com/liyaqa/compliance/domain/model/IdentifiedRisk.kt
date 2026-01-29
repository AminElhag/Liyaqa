package com.liyaqa.compliance.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import jakarta.persistence.Version
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

/**
 * Individual identified risk with treatment plan.
 */
@Entity
@Table(name = "identified_risks")
class IdentifiedRisk(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    val id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    val assessment: RiskAssessment,

    @Column(name = "risk_number", nullable = false)
    var riskNumber: String,

    @Column(name = "title", nullable = false)
    var title: String,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "category")
    var category: RiskCategory? = null,

    @Column(name = "asset_affected")
    var assetAffected: String? = null,

    @Column(name = "threat_source")
    var threatSource: String? = null,

    @Column(name = "vulnerability")
    var vulnerability: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "likelihood", nullable = false)
    var likelihood: RiskLikelihood,

    @Enumerated(EnumType.STRING)
    @Column(name = "impact", nullable = false)
    var impact: RiskImpact,

    @Column(name = "inherent_risk_score", nullable = false)
    var inherentRiskScore: Int,

    @Enumerated(EnumType.STRING)
    @Column(name = "inherent_risk_level", nullable = false)
    var inherentRiskLevel: RiskLevel,

    @Column(name = "existing_controls", columnDefinition = "TEXT")
    var existingControls: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "treatment_option", nullable = false)
    var treatmentOption: RiskTreatment,

    @Column(name = "treatment_plan", columnDefinition = "TEXT")
    var treatmentPlan: String? = null,

    @Column(name = "treatment_owner_id")
    var treatmentOwnerId: UUID? = null,

    @Column(name = "treatment_due_date")
    var treatmentDueDate: LocalDate? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "treatment_status")
    var treatmentStatus: TreatmentStatus = TreatmentStatus.OPEN,

    @Enumerated(EnumType.STRING)
    @Column(name = "residual_likelihood")
    var residualLikelihood: RiskLikelihood? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "residual_impact")
    var residualImpact: RiskImpact? = null,

    @Column(name = "residual_risk_score")
    var residualRiskScore: Int? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "residual_risk_level")
    var residualRiskLevel: RiskLevel? = null,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "related_requirement_ids")
    var relatedRequirementIds: List<UUID>? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),

    @Version
    @Column(name = "version")
    var version: Long = 0
) {
    companion object {
        /**
         * Calculate risk score from likelihood and impact (5x5 matrix).
         */
        fun calculateRiskScore(likelihood: RiskLikelihood, impact: RiskImpact): Int {
            val likelihoodValue = when (likelihood) {
                RiskLikelihood.RARE -> 1
                RiskLikelihood.UNLIKELY -> 2
                RiskLikelihood.POSSIBLE -> 3
                RiskLikelihood.LIKELY -> 4
                RiskLikelihood.ALMOST_CERTAIN -> 5
            }
            val impactValue = when (impact) {
                RiskImpact.INSIGNIFICANT -> 1
                RiskImpact.MINOR -> 2
                RiskImpact.MODERATE -> 3
                RiskImpact.MAJOR -> 4
                RiskImpact.CATASTROPHIC -> 5
            }
            return likelihoodValue * impactValue
        }

        /**
         * Determine risk level from score.
         */
        fun determineRiskLevel(score: Int): RiskLevel {
            return when {
                score >= 15 -> RiskLevel.CRITICAL
                score >= 10 -> RiskLevel.HIGH
                score >= 5 -> RiskLevel.MEDIUM
                else -> RiskLevel.LOW
            }
        }
    }

    /**
     * Calculate and set inherent risk.
     */
    fun calculateInherentRisk() {
        inherentRiskScore = calculateRiskScore(likelihood, impact)
        inherentRiskLevel = determineRiskLevel(inherentRiskScore)
        updatedAt = Instant.now()
    }

    /**
     * Calculate and set residual risk.
     */
    fun calculateResidualRisk() {
        if (residualLikelihood != null && residualImpact != null) {
            residualRiskScore = calculateRiskScore(residualLikelihood!!, residualImpact!!)
            residualRiskLevel = determineRiskLevel(residualRiskScore!!)
        }
        updatedAt = Instant.now()
    }

    /**
     * Start treatment implementation.
     */
    fun startTreatment() {
        treatmentStatus = TreatmentStatus.IN_PROGRESS
        updatedAt = Instant.now()
    }

    /**
     * Complete treatment.
     */
    fun completeTreatment(resLikelihood: RiskLikelihood? = null, resImpact: RiskImpact? = null) {
        treatmentStatus = TreatmentStatus.COMPLETED
        if (resLikelihood != null && resImpact != null) {
            residualLikelihood = resLikelihood
            residualImpact = resImpact
            calculateResidualRisk()
        }
        updatedAt = Instant.now()
    }

    /**
     * Check if treatment is overdue.
     */
    fun checkOverdue() {
        if (treatmentDueDate?.isBefore(LocalDate.now()) == true &&
            treatmentStatus !in listOf(TreatmentStatus.COMPLETED)) {
            treatmentStatus = TreatmentStatus.OVERDUE
            updatedAt = Instant.now()
        }
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is IdentifiedRisk) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
