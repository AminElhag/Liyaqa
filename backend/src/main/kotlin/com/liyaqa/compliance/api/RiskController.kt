package com.liyaqa.compliance.api

import com.liyaqa.compliance.application.services.RiskAssessmentService
import com.liyaqa.compliance.application.services.RiskStats
import com.liyaqa.compliance.domain.model.*
import com.liyaqa.shared.domain.TenantContext
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

// ===== DTOs =====

data class RiskAssessmentResponse(
    val id: UUID,
    val organizationId: UUID,
    val title: String,
    val description: String?,
    val assessmentDate: LocalDate,
    val status: RiskAssessmentStatus,
    val scope: String?,
    val methodology: String?,
    val assessorId: UUID?,
    val approvedBy: UUID?,
    val approvedAt: Instant?,
    val totalRisks: Int,
    val highRisks: Int,
    val mediumRisks: Int,
    val lowRisks: Int,
    val nextReviewDate: LocalDate?,
    val createdAt: Instant
) {
    companion object {
        fun from(assessment: RiskAssessment) = RiskAssessmentResponse(
            id = assessment.id,
            organizationId = assessment.organizationId,
            title = assessment.title,
            description = assessment.description,
            assessmentDate = assessment.assessmentDate,
            status = assessment.status,
            scope = assessment.scope,
            methodology = assessment.methodology,
            assessorId = assessment.assessorId,
            approvedBy = assessment.approvedBy,
            approvedAt = assessment.approvedAt,
            totalRisks = assessment.totalRisks,
            highRisks = assessment.highRisks,
            mediumRisks = assessment.mediumRisks,
            lowRisks = assessment.lowRisks,
            nextReviewDate = assessment.nextReviewDate,
            createdAt = assessment.createdAt
        )
    }
}

data class IdentifiedRiskResponse(
    val id: UUID,
    val assessmentId: UUID,
    val riskNumber: String,
    val title: String,
    val description: String?,
    val category: RiskCategory?,
    val assetAffected: String?,
    val threatSource: String?,
    val vulnerability: String?,
    val likelihood: RiskLikelihood,
    val impact: RiskImpact,
    val inherentRiskScore: Int,
    val inherentRiskLevel: RiskLevel,
    val existingControls: String?,
    val treatmentOption: RiskTreatment,
    val treatmentPlan: String?,
    val treatmentOwnerId: UUID?,
    val treatmentDueDate: LocalDate?,
    val treatmentStatus: TreatmentStatus,
    val residualLikelihood: RiskLikelihood?,
    val residualImpact: RiskImpact?,
    val residualRiskScore: Int?,
    val residualRiskLevel: RiskLevel?,
    val relatedRequirementIds: List<UUID>?,
    val createdAt: Instant
) {
    companion object {
        fun from(risk: IdentifiedRisk) = IdentifiedRiskResponse(
            id = risk.id,
            assessmentId = risk.assessment.id,
            riskNumber = risk.riskNumber,
            title = risk.title,
            description = risk.description,
            category = risk.category,
            assetAffected = risk.assetAffected,
            threatSource = risk.threatSource,
            vulnerability = risk.vulnerability,
            likelihood = risk.likelihood,
            impact = risk.impact,
            inherentRiskScore = risk.inherentRiskScore,
            inherentRiskLevel = risk.inherentRiskLevel,
            existingControls = risk.existingControls,
            treatmentOption = risk.treatmentOption,
            treatmentPlan = risk.treatmentPlan,
            treatmentOwnerId = risk.treatmentOwnerId,
            treatmentDueDate = risk.treatmentDueDate,
            treatmentStatus = risk.treatmentStatus,
            residualLikelihood = risk.residualLikelihood,
            residualImpact = risk.residualImpact,
            residualRiskScore = risk.residualRiskScore,
            residualRiskLevel = risk.residualRiskLevel,
            relatedRequirementIds = risk.relatedRequirementIds,
            createdAt = risk.createdAt
        )
    }
}

data class CreateAssessmentRequest(
    val title: String,
    val description: String? = null,
    val assessmentDate: LocalDate = LocalDate.now(),
    val scope: String? = null,
    val methodology: String? = null,
    val nextReviewDate: LocalDate? = null
)

data class AddRiskRequest(
    val riskNumber: String,
    val title: String,
    val description: String? = null,
    val category: RiskCategory? = null,
    val assetAffected: String? = null,
    val threatSource: String? = null,
    val vulnerability: String? = null,
    val likelihood: RiskLikelihood,
    val impact: RiskImpact,
    val existingControls: String? = null,
    val treatmentOption: RiskTreatment,
    val treatmentPlan: String? = null,
    val treatmentOwnerId: UUID? = null,
    val treatmentDueDate: LocalDate? = null,
    val relatedRequirementIds: List<UUID>? = null
)

data class UpdateRiskRequest(
    val likelihood: RiskLikelihood,
    val impact: RiskImpact,
    val treatmentOption: RiskTreatment? = null,
    val treatmentPlan: String? = null
)

data class CompleteTreatmentRequest(
    val residualLikelihood: RiskLikelihood? = null,
    val residualImpact: RiskImpact? = null
)

@RestController
@RequestMapping("/api/risks")
@Tag(name = "Risk Management", description = "Risk assessments and treatments")
class RiskController(
    private val riskService: RiskAssessmentService
) {
    // ===== Assessments =====

    @GetMapping("/assessments")
    @PreAuthorize("hasAuthority('risk_view')")
    @Operation(summary = "Get risk assessments")
    fun getAssessments(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<List<RiskAssessmentResponse>> {
        val organizationId = getOrganizationId()
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "assessmentDate"))
        val assessments = riskService.getAssessments(organizationId, pageable)
        return ResponseEntity.ok(assessments.content.map { RiskAssessmentResponse.from(it) })
    }

    @GetMapping("/assessments/{id}")
    @PreAuthorize("hasAuthority('risk_view')")
    @Operation(summary = "Get assessment by ID")
    fun getAssessment(@PathVariable id: UUID): ResponseEntity<RiskAssessmentResponse> {
        val assessment = riskService.getAssessment(id)
        return ResponseEntity.ok(RiskAssessmentResponse.from(assessment))
    }

    @GetMapping("/assessments/latest")
    @PreAuthorize("hasAuthority('risk_view')")
    @Operation(summary = "Get latest approved assessment")
    fun getLatestAssessment(): ResponseEntity<*> {
        val organizationId = getOrganizationId()
        val assessment = riskService.getLatestApprovedAssessment(organizationId)
        return if (assessment != null) {
            ResponseEntity.ok(RiskAssessmentResponse.from(assessment))
        } else {
            ResponseEntity.notFound().build<Unit>()
        }
    }

    @PostMapping("/assessments")
    @PreAuthorize("hasAuthority('risk_manage')")
    @Operation(summary = "Create a risk assessment")
    fun createAssessment(@Valid @RequestBody request: CreateAssessmentRequest): ResponseEntity<RiskAssessmentResponse> {
        val organizationId = getOrganizationId()
        val userId = getCurrentUserId()
        val assessment = riskService.createAssessment(
            organizationId = organizationId,
            title = request.title,
            description = request.description,
            assessmentDate = request.assessmentDate,
            scope = request.scope,
            methodology = request.methodology,
            assessorId = userId,
            nextReviewDate = request.nextReviewDate
        )
        return ResponseEntity.status(HttpStatus.CREATED).body(RiskAssessmentResponse.from(assessment))
    }

    @PostMapping("/assessments/{id}/start")
    @PreAuthorize("hasAuthority('risk_manage')")
    @Operation(summary = "Start an assessment")
    fun startAssessment(@PathVariable id: UUID): ResponseEntity<RiskAssessmentResponse> {
        val assessment = riskService.startAssessment(id)
        return ResponseEntity.ok(RiskAssessmentResponse.from(assessment))
    }

    @PostMapping("/assessments/{id}/complete")
    @PreAuthorize("hasAuthority('risk_manage')")
    @Operation(summary = "Complete an assessment")
    fun completeAssessment(@PathVariable id: UUID): ResponseEntity<RiskAssessmentResponse> {
        val assessment = riskService.completeAssessment(id)
        return ResponseEntity.ok(RiskAssessmentResponse.from(assessment))
    }

    @PostMapping("/assessments/{id}/approve")
    @PreAuthorize("hasAuthority('risk_manage')")
    @Operation(summary = "Approve an assessment")
    fun approveAssessment(@PathVariable id: UUID): ResponseEntity<RiskAssessmentResponse> {
        val userId = getCurrentUserId()
        val assessment = riskService.approveAssessment(id, userId)
        return ResponseEntity.ok(RiskAssessmentResponse.from(assessment))
    }

    @PostMapping("/assessments/{id}/archive")
    @PreAuthorize("hasAuthority('risk_manage')")
    @Operation(summary = "Archive an assessment")
    fun archiveAssessment(@PathVariable id: UUID): ResponseEntity<RiskAssessmentResponse> {
        val assessment = riskService.archiveAssessment(id)
        return ResponseEntity.ok(RiskAssessmentResponse.from(assessment))
    }

    // ===== Risks =====

    @GetMapping("/assessments/{assessmentId}/risks")
    @PreAuthorize("hasAuthority('risk_view')")
    @Operation(summary = "Get risks for an assessment")
    fun getAssessmentRisks(@PathVariable assessmentId: UUID): ResponseEntity<List<IdentifiedRiskResponse>> {
        val risks = riskService.getAssessmentRisks(assessmentId)
        return ResponseEntity.ok(risks.map { IdentifiedRiskResponse.from(it) })
    }

    @GetMapping("/risks/{id}")
    @PreAuthorize("hasAuthority('risk_view')")
    @Operation(summary = "Get risk by ID")
    fun getRisk(@PathVariable id: UUID): ResponseEntity<IdentifiedRiskResponse> {
        val risk = riskService.getRisk(id)
        return ResponseEntity.ok(IdentifiedRiskResponse.from(risk))
    }

    @PostMapping("/assessments/{assessmentId}/risks")
    @PreAuthorize("hasAuthority('risk_manage')")
    @Operation(summary = "Add a risk to an assessment")
    fun addRisk(
        @PathVariable assessmentId: UUID,
        @Valid @RequestBody request: AddRiskRequest
    ): ResponseEntity<IdentifiedRiskResponse> {
        val risk = riskService.addRisk(
            assessmentId = assessmentId,
            riskNumber = request.riskNumber,
            title = request.title,
            description = request.description,
            category = request.category,
            assetAffected = request.assetAffected,
            threatSource = request.threatSource,
            vulnerability = request.vulnerability,
            likelihood = request.likelihood,
            impact = request.impact,
            existingControls = request.existingControls,
            treatmentOption = request.treatmentOption,
            treatmentPlan = request.treatmentPlan,
            treatmentOwnerId = request.treatmentOwnerId,
            treatmentDueDate = request.treatmentDueDate,
            relatedRequirementIds = request.relatedRequirementIds
        )
        return ResponseEntity.status(HttpStatus.CREATED).body(IdentifiedRiskResponse.from(risk))
    }

    @PutMapping("/risks/{id}")
    @PreAuthorize("hasAuthority('risk_manage')")
    @Operation(summary = "Update risk assessment")
    fun updateRisk(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateRiskRequest
    ): ResponseEntity<IdentifiedRiskResponse> {
        val risk = riskService.updateRiskAssessment(
            riskId = id,
            likelihood = request.likelihood,
            impact = request.impact,
            treatmentOption = request.treatmentOption,
            treatmentPlan = request.treatmentPlan
        )
        return ResponseEntity.ok(IdentifiedRiskResponse.from(risk))
    }

    @PostMapping("/risks/{id}/start-treatment")
    @PreAuthorize("hasAuthority('risk_manage')")
    @Operation(summary = "Start risk treatment")
    fun startTreatment(@PathVariable id: UUID): ResponseEntity<IdentifiedRiskResponse> {
        val risk = riskService.startTreatment(id)
        return ResponseEntity.ok(IdentifiedRiskResponse.from(risk))
    }

    @PostMapping("/risks/{id}/complete-treatment")
    @PreAuthorize("hasAuthority('risk_manage')")
    @Operation(summary = "Complete risk treatment")
    fun completeTreatment(
        @PathVariable id: UUID,
        @RequestBody request: CompleteTreatmentRequest
    ): ResponseEntity<IdentifiedRiskResponse> {
        val risk = riskService.completeTreatment(id, request.residualLikelihood, request.residualImpact)
        return ResponseEntity.ok(IdentifiedRiskResponse.from(risk))
    }

    @GetMapping("/assessments/{assessmentId}/risks/overdue")
    @PreAuthorize("hasAuthority('risk_view')")
    @Operation(summary = "Get overdue risk treatments")
    fun getOverdueTreatments(@PathVariable assessmentId: UUID): ResponseEntity<List<IdentifiedRiskResponse>> {
        val risks = riskService.getOverdueTreatments(assessmentId)
        return ResponseEntity.ok(risks.map { IdentifiedRiskResponse.from(it) })
    }

    @GetMapping("/assessments/{assessmentId}/stats")
    @PreAuthorize("hasAuthority('risk_view')")
    @Operation(summary = "Get risk statistics for an assessment")
    fun getRiskStats(@PathVariable assessmentId: UUID): ResponseEntity<RiskStats> {
        val stats = riskService.getRiskStats(assessmentId)
        return ResponseEntity.ok(stats)
    }

    private fun getOrganizationId(): UUID {
        return TenantContext.getCurrentOrganizationOrNull()?.value
            ?: TenantContext.getCurrentTenant().value
    }

    private fun getCurrentUserId(): UUID {
        val auth = SecurityContextHolder.getContext().authentication
            ?: throw IllegalStateException("No authentication found")
        return UUID.fromString(auth.name)
    }
}
