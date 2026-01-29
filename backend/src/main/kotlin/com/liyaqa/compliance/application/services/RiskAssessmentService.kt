package com.liyaqa.compliance.application.services

import com.liyaqa.compliance.domain.model.*
import com.liyaqa.compliance.domain.ports.IdentifiedRiskRepository
import com.liyaqa.compliance.domain.ports.RiskAssessmentRepository
import com.liyaqa.shared.domain.TenantContext
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

@Service
@Transactional
class RiskAssessmentService(
    private val assessmentRepository: RiskAssessmentRepository,
    private val riskRepository: IdentifiedRiskRepository
) {
    private val logger = LoggerFactory.getLogger(RiskAssessmentService::class.java)

    // ===== Assessments =====

    /**
     * Create a new risk assessment.
     */
    fun createAssessment(
        organizationId: UUID,
        title: String,
        description: String? = null,
        assessmentDate: LocalDate = LocalDate.now(),
        scope: String? = null,
        methodology: String? = null,
        assessorId: UUID? = null,
        nextReviewDate: LocalDate? = null
    ): RiskAssessment {
        val tenantId = TenantContext.getCurrentTenant().value

        val assessment = RiskAssessment(
            organizationId = organizationId,
            tenantId = tenantId,
            title = title,
            description = description,
            assessmentDate = assessmentDate,
            scope = scope,
            methodology = methodology,
            assessorId = assessorId,
            nextReviewDate = nextReviewDate
        )

        val saved = assessmentRepository.save(assessment)
        logger.info("Created risk assessment {} for organization {}", saved.id, organizationId)
        return saved
    }

    /**
     * Get an assessment by ID.
     */
    @Transactional(readOnly = true)
    fun getAssessment(id: UUID): RiskAssessment {
        return assessmentRepository.findById(id)
            .orElseThrow { NoSuchElementException("Risk assessment not found: $id") }
    }

    /**
     * Get assessments for an organization.
     */
    @Transactional(readOnly = true)
    fun getAssessments(organizationId: UUID, pageable: Pageable): Page<RiskAssessment> {
        return assessmentRepository.findByOrganizationId(organizationId, pageable)
    }

    /**
     * Get the latest approved assessment.
     */
    @Transactional(readOnly = true)
    fun getLatestApprovedAssessment(organizationId: UUID): RiskAssessment? {
        return assessmentRepository.findLatestApproved(organizationId, PageRequest.of(0, 1))
            .content.firstOrNull()
    }

    /**
     * Start an assessment.
     */
    fun startAssessment(assessmentId: UUID): RiskAssessment {
        val assessment = getAssessment(assessmentId)
        assessment.start()
        return assessmentRepository.save(assessment)
    }

    /**
     * Complete an assessment.
     */
    fun completeAssessment(assessmentId: UUID): RiskAssessment {
        val assessment = getAssessment(assessmentId)

        // Update risk counts
        val risks = riskRepository.findByAssessmentId(assessmentId)
        val high = risks.count { it.inherentRiskLevel in listOf(RiskLevel.HIGH, RiskLevel.CRITICAL) }
        val medium = risks.count { it.inherentRiskLevel == RiskLevel.MEDIUM }
        val low = risks.count { it.inherentRiskLevel == RiskLevel.LOW }
        assessment.updateRiskCounts(risks.size, high, medium, low)

        assessment.complete()
        return assessmentRepository.save(assessment)
    }

    /**
     * Approve an assessment.
     */
    fun approveAssessment(assessmentId: UUID, approverId: UUID): RiskAssessment {
        val assessment = getAssessment(assessmentId)
        assessment.approve(approverId)
        logger.info("Risk assessment {} approved by {}", assessmentId, approverId)
        return assessmentRepository.save(assessment)
    }

    /**
     * Archive an assessment.
     */
    fun archiveAssessment(assessmentId: UUID): RiskAssessment {
        val assessment = getAssessment(assessmentId)
        assessment.archive()
        return assessmentRepository.save(assessment)
    }

    // ===== Identified Risks =====

    /**
     * Add a risk to an assessment.
     */
    fun addRisk(
        assessmentId: UUID,
        riskNumber: String,
        title: String,
        description: String? = null,
        category: RiskCategory? = null,
        assetAffected: String? = null,
        threatSource: String? = null,
        vulnerability: String? = null,
        likelihood: RiskLikelihood,
        impact: RiskImpact,
        existingControls: String? = null,
        treatmentOption: RiskTreatment,
        treatmentPlan: String? = null,
        treatmentOwnerId: UUID? = null,
        treatmentDueDate: LocalDate? = null,
        relatedRequirementIds: List<UUID>? = null
    ): IdentifiedRisk {
        val assessment = getAssessment(assessmentId)

        val risk = IdentifiedRisk(
            assessment = assessment,
            riskNumber = riskNumber,
            title = title,
            description = description,
            category = category,
            assetAffected = assetAffected,
            threatSource = threatSource,
            vulnerability = vulnerability,
            likelihood = likelihood,
            impact = impact,
            inherentRiskScore = IdentifiedRisk.calculateRiskScore(likelihood, impact),
            inherentRiskLevel = IdentifiedRisk.determineRiskLevel(IdentifiedRisk.calculateRiskScore(likelihood, impact)),
            existingControls = existingControls,
            treatmentOption = treatmentOption,
            treatmentPlan = treatmentPlan,
            treatmentOwnerId = treatmentOwnerId,
            treatmentDueDate = treatmentDueDate,
            relatedRequirementIds = relatedRequirementIds
        )

        risk.calculateInherentRisk()
        val saved = riskRepository.save(risk)
        logger.info("Added risk {} to assessment {}", riskNumber, assessmentId)
        return saved
    }

    /**
     * Get a risk by ID.
     */
    @Transactional(readOnly = true)
    fun getRisk(id: UUID): IdentifiedRisk {
        return riskRepository.findById(id)
            .orElseThrow { NoSuchElementException("Risk not found: $id") }
    }

    /**
     * Get all risks for an assessment.
     */
    @Transactional(readOnly = true)
    fun getAssessmentRisks(assessmentId: UUID): List<IdentifiedRisk> {
        return riskRepository.findByAssessmentId(assessmentId)
    }

    /**
     * Get risks by level.
     */
    @Transactional(readOnly = true)
    fun getRisksByLevel(assessmentId: UUID, level: RiskLevel): List<IdentifiedRisk> {
        return riskRepository.findByAssessmentIdAndInherentRiskLevel(assessmentId, level)
    }

    /**
     * Get overdue risk treatments.
     */
    @Transactional(readOnly = true)
    fun getOverdueTreatments(assessmentId: UUID): List<IdentifiedRisk> {
        return riskRepository.findOverdueTreatments(assessmentId, LocalDate.now())
    }

    /**
     * Update risk assessment.
     */
    fun updateRiskAssessment(
        riskId: UUID,
        likelihood: RiskLikelihood,
        impact: RiskImpact,
        treatmentOption: RiskTreatment? = null,
        treatmentPlan: String? = null
    ): IdentifiedRisk {
        val risk = getRisk(riskId)
        risk.likelihood = likelihood
        risk.impact = impact
        risk.calculateInherentRisk()
        treatmentOption?.let { risk.treatmentOption = it }
        treatmentPlan?.let { risk.treatmentPlan = it }
        return riskRepository.save(risk)
    }

    /**
     * Start treatment for a risk.
     */
    fun startTreatment(riskId: UUID): IdentifiedRisk {
        val risk = getRisk(riskId)
        risk.startTreatment()
        return riskRepository.save(risk)
    }

    /**
     * Complete treatment for a risk.
     */
    fun completeTreatment(
        riskId: UUID,
        residualLikelihood: RiskLikelihood? = null,
        residualImpact: RiskImpact? = null
    ): IdentifiedRisk {
        val risk = getRisk(riskId)
        risk.completeTreatment(residualLikelihood, residualImpact)
        return riskRepository.save(risk)
    }

    /**
     * Get risk statistics for an assessment.
     */
    @Transactional(readOnly = true)
    fun getRiskStats(assessmentId: UUID): RiskStats {
        val risks = riskRepository.findByAssessmentId(assessmentId)

        return RiskStats(
            totalRisks = risks.size,
            criticalRisks = risks.count { it.inherentRiskLevel == RiskLevel.CRITICAL },
            highRisks = risks.count { it.inherentRiskLevel == RiskLevel.HIGH },
            mediumRisks = risks.count { it.inherentRiskLevel == RiskLevel.MEDIUM },
            lowRisks = risks.count { it.inherentRiskLevel == RiskLevel.LOW },
            openTreatments = risks.count { it.treatmentStatus in listOf(TreatmentStatus.OPEN, TreatmentStatus.IN_PROGRESS) },
            overdueTreatments = risks.count { it.treatmentStatus == TreatmentStatus.OVERDUE },
            completedTreatments = risks.count { it.treatmentStatus == TreatmentStatus.COMPLETED }
        )
    }
}

data class RiskStats(
    val totalRisks: Int,
    val criticalRisks: Int,
    val highRisks: Int,
    val mediumRisks: Int,
    val lowRisks: Int,
    val openTreatments: Int,
    val overdueTreatments: Int,
    val completedTreatments: Int
)
