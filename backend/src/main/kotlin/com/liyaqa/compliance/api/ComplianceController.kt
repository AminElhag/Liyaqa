package com.liyaqa.compliance.api

import com.liyaqa.compliance.application.services.ComplianceService
import com.liyaqa.compliance.domain.model.ComplianceStatus
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
import java.util.UUID

@RestController
@RequestMapping("/api/compliance")
@Tag(name = "Compliance", description = "Security compliance management - ISO 27001, SOC 2, PCI DSS, PDPL")
class ComplianceController(
    private val complianceService: ComplianceService
) {
    // ===== Frameworks =====

    @GetMapping("/frameworks")
    @PreAuthorize("hasAuthority('compliance_view')")
    @Operation(summary = "Get all compliance frameworks")
    fun getFrameworks(): ResponseEntity<List<FrameworkResponse>> {
        val frameworks = complianceService.getAllFrameworks()
        return ResponseEntity.ok(frameworks.map { FrameworkResponse.from(it) })
    }

    @GetMapping("/frameworks/{id}")
    @PreAuthorize("hasAuthority('compliance_view')")
    @Operation(summary = "Get framework by ID")
    fun getFramework(@PathVariable id: UUID): ResponseEntity<FrameworkResponse> {
        val framework = complianceService.getFramework(id)
        return ResponseEntity.ok(FrameworkResponse.from(framework))
    }

    @GetMapping("/frameworks/{id}/requirements")
    @PreAuthorize("hasAuthority('compliance_view')")
    @Operation(summary = "Get requirements for a framework")
    fun getFrameworkRequirements(@PathVariable id: UUID): ResponseEntity<List<RequirementResponse>> {
        val requirements = complianceService.getFrameworkRequirements(id)
        return ResponseEntity.ok(requirements.map { RequirementResponse.from(it) })
    }

    @GetMapping("/frameworks/{id}/categories")
    @PreAuthorize("hasAuthority('compliance_view')")
    @Operation(summary = "Get requirement categories for a framework")
    fun getCategories(@PathVariable id: UUID): ResponseEntity<List<String>> {
        val categories = complianceService.getCategories(id)
        return ResponseEntity.ok(categories)
    }

    // ===== Organization Compliance Status =====

    @GetMapping("/status")
    @PreAuthorize("hasAuthority('compliance_view')")
    @Operation(summary = "Get compliance status for all frameworks")
    fun getComplianceStatus(): ResponseEntity<List<ComplianceStatusResponse>> {
        val organizationId = getOrganizationId()
        val statuses = complianceService.getOrganizationComplianceStatus(organizationId)
        return ResponseEntity.ok(statuses.map { ComplianceStatusResponse.from(it) })
    }

    @GetMapping("/status/{frameworkId}")
    @PreAuthorize("hasAuthority('compliance_view')")
    @Operation(summary = "Get compliance status for a specific framework")
    fun getFrameworkStatus(@PathVariable frameworkId: UUID): ResponseEntity<ComplianceStatusResponse> {
        val organizationId = getOrganizationId()
        val status = complianceService.getOrganizationFrameworkStatus(organizationId, frameworkId)
        return ResponseEntity.ok(ComplianceStatusResponse.from(status))
    }

    @PostMapping("/status/{frameworkId}/initialize")
    @PreAuthorize("hasAuthority('compliance_manage')")
    @Operation(summary = "Initialize compliance tracking for a framework")
    fun initializeFramework(@PathVariable frameworkId: UUID): ResponseEntity<ComplianceStatusResponse> {
        val organizationId = getOrganizationId()
        val status = complianceService.initializeOrganizationComplianceStatus(organizationId, frameworkId)
        return ResponseEntity.status(HttpStatus.CREATED).body(ComplianceStatusResponse.from(status))
    }

    @PutMapping("/status/{frameworkId}")
    @PreAuthorize("hasAuthority('compliance_manage')")
    @Operation(summary = "Update compliance status")
    fun updateStatus(
        @PathVariable frameworkId: UUID,
        @RequestParam status: ComplianceStatus
    ): ResponseEntity<ComplianceStatusResponse> {
        val organizationId = getOrganizationId()
        val updated = complianceService.updateComplianceStatus(organizationId, frameworkId, status)
        return ResponseEntity.ok(ComplianceStatusResponse.from(updated))
    }

    @PostMapping("/status/{frameworkId}/certify")
    @PreAuthorize("hasAuthority('compliance_manage')")
    @Operation(summary = "Record certification for a framework")
    fun certify(
        @PathVariable frameworkId: UUID,
        @Valid @RequestBody request: CertifyRequest
    ): ResponseEntity<ComplianceStatusResponse> {
        val organizationId = getOrganizationId()
        val status = complianceService.certifyOrganization(
            organizationId = organizationId,
            frameworkId = frameworkId,
            certificationDate = request.certificationDate,
            expiryDate = request.expiryDate,
            auditorName = request.auditorName,
            auditorCompany = request.auditorCompany
        )
        return ResponseEntity.ok(ComplianceStatusResponse.from(status))
    }

    // ===== Control Implementations =====

    @GetMapping("/controls")
    @PreAuthorize("hasAuthority('compliance_view')")
    @Operation(summary = "Get control implementations for a framework")
    fun getControls(@RequestParam frameworkId: UUID): ResponseEntity<List<ControlImplementationResponse>> {
        val organizationId = getOrganizationId()
        val controls = complianceService.getControlImplementations(organizationId, frameworkId)
        return ResponseEntity.ok(controls.map { ControlImplementationResponse.from(it) })
    }

    @GetMapping("/controls/{requirementId}")
    @PreAuthorize("hasAuthority('compliance_view')")
    @Operation(summary = "Get control implementation for a requirement")
    fun getControl(@PathVariable requirementId: UUID): ResponseEntity<ControlImplementationResponse> {
        val organizationId = getOrganizationId()
        val control = complianceService.getControlImplementation(organizationId, requirementId)
        return ResponseEntity.ok(ControlImplementationResponse.from(control))
    }

    @PutMapping("/controls/{requirementId}")
    @PreAuthorize("hasAuthority('compliance_manage')")
    @Operation(summary = "Update control implementation status")
    fun updateControl(
        @PathVariable requirementId: UUID,
        @Valid @RequestBody request: UpdateControlRequest
    ): ResponseEntity<ControlImplementationResponse> {
        val organizationId = getOrganizationId()
        val control = complianceService.updateControlImplementation(
            organizationId = organizationId,
            requirementId = requirementId,
            status = request.status,
            notes = request.notes,
            responsibleUserId = request.responsibleUserId
        )
        return ResponseEntity.ok(ControlImplementationResponse.from(control))
    }

    @PostMapping("/controls/{requirementId}/review")
    @PreAuthorize("hasAuthority('compliance_manage')")
    @Operation(summary = "Record control effectiveness review")
    fun reviewControl(
        @PathVariable requirementId: UUID,
        @Valid @RequestBody request: ReviewControlRequest
    ): ResponseEntity<ControlImplementationResponse> {
        val organizationId = getOrganizationId()
        val control = complianceService.recordControlReview(
            organizationId = organizationId,
            requirementId = requirementId,
            effectiveness = request.effectiveness,
            nextReviewDate = request.nextReviewDate
        )
        return ResponseEntity.ok(ControlImplementationResponse.from(control))
    }

    // ===== Evidence =====

    @GetMapping("/evidence")
    @PreAuthorize("hasAuthority('compliance_view')")
    @Operation(summary = "Get all evidence")
    fun getEvidence(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<List<EvidenceResponse>> {
        val organizationId = getOrganizationId()
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val evidence = complianceService.getEvidence(organizationId, pageable)
        return ResponseEntity.ok(evidence.content.map { EvidenceResponse.from(it) })
    }

    @GetMapping("/evidence/control/{controlId}")
    @PreAuthorize("hasAuthority('compliance_view')")
    @Operation(summary = "Get evidence for a control")
    fun getControlEvidence(@PathVariable controlId: UUID): ResponseEntity<List<EvidenceResponse>> {
        val evidence = complianceService.getControlEvidence(controlId)
        return ResponseEntity.ok(evidence.map { EvidenceResponse.from(it) })
    }

    @PostMapping("/evidence/{evidenceId}/supersede")
    @PreAuthorize("hasAuthority('compliance_manage')")
    @Operation(summary = "Mark evidence as superseded")
    fun supersedeEvidence(@PathVariable evidenceId: UUID): ResponseEntity<EvidenceResponse> {
        val evidence = complianceService.supersedEvidence(evidenceId)
        return ResponseEntity.ok(EvidenceResponse.from(evidence))
    }

    // ===== Reports =====

    @GetMapping("/reports")
    @PreAuthorize("hasAuthority('compliance_reports')")
    @Operation(summary = "Get compliance reports")
    fun getReports(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<List<ReportResponse>> {
        val organizationId = getOrganizationId()
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val reports = complianceService.getReports(organizationId, pageable)
        return ResponseEntity.ok(reports.content.map { ReportResponse.from(it) })
    }

    @PostMapping("/reports/generate")
    @PreAuthorize("hasAuthority('compliance_reports')")
    @Operation(summary = "Generate a compliance report")
    fun generateReport(@Valid @RequestBody request: GenerateReportRequest): ResponseEntity<ReportResponse> {
        val organizationId = getOrganizationId()
        val userId = getCurrentUserId()
        val report = complianceService.generateComplianceReport(
            organizationId = organizationId,
            frameworkId = request.frameworkId,
            reportType = request.reportType,
            title = request.title,
            description = request.description,
            periodStart = request.periodStart,
            periodEnd = request.periodEnd,
            generatedBy = userId,
            format = request.format
        )
        return ResponseEntity.status(HttpStatus.CREATED).body(ReportResponse.from(report))
    }

    // ===== Dashboard =====

    @GetMapping("/dashboard")
    @PreAuthorize("hasAuthority('compliance_view')")
    @Operation(summary = "Get compliance dashboard data")
    fun getDashboard(): ResponseEntity<com.liyaqa.compliance.application.services.ComplianceDashboard> {
        val organizationId = getOrganizationId()
        val dashboard = complianceService.getComplianceDashboard(organizationId)
        return ResponseEntity.ok(dashboard)
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
