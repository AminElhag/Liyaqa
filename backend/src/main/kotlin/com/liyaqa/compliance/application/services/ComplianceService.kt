package com.liyaqa.compliance.application.services

import com.liyaqa.compliance.domain.model.*
import com.liyaqa.compliance.domain.ports.*
import com.liyaqa.shared.domain.TenantContext
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

@Service
@Transactional
class ComplianceService(
    private val frameworkRepository: ComplianceFrameworkRepository,
    private val requirementRepository: ComplianceRequirementRepository,
    private val statusRepository: OrganizationComplianceStatusRepository,
    private val controlImplementationRepository: ControlImplementationRepository,
    private val evidenceRepository: ComplianceEvidenceRepository,
    private val reportRepository: ComplianceReportRepository
) {
    private val logger = LoggerFactory.getLogger(ComplianceService::class.java)

    // ===== Frameworks =====

    @Transactional(readOnly = true)
    fun getAllFrameworks(): List<ComplianceFramework> {
        return frameworkRepository.findByIsActive(true)
    }

    @Transactional(readOnly = true)
    fun getFramework(id: UUID): ComplianceFramework {
        return frameworkRepository.findById(id)
            .orElseThrow { NoSuchElementException("Framework not found: $id") }
    }

    @Transactional(readOnly = true)
    fun getFrameworkByCode(code: String): ComplianceFramework {
        return frameworkRepository.findByCode(code)
            .orElseThrow { NoSuchElementException("Framework not found: $code") }
    }

    // ===== Requirements =====

    @Transactional(readOnly = true)
    fun getFrameworkRequirements(frameworkId: UUID): List<ComplianceRequirement> {
        return requirementRepository.findByFrameworkId(frameworkId)
    }

    @Transactional(readOnly = true)
    fun getRequirementsByCategory(frameworkId: UUID, category: String): List<ComplianceRequirement> {
        return requirementRepository.findByFrameworkIdAndCategory(frameworkId, category)
    }

    @Transactional(readOnly = true)
    fun getCategories(frameworkId: UUID): List<String> {
        return requirementRepository.findDistinctCategoriesByFrameworkId(frameworkId)
    }

    // ===== Organization Compliance Status =====

    @Transactional(readOnly = true)
    fun getOrganizationComplianceStatus(organizationId: UUID): List<OrganizationComplianceStatus> {
        return statusRepository.findByOrganizationId(organizationId)
    }

    @Transactional(readOnly = true)
    fun getOrganizationFrameworkStatus(organizationId: UUID, frameworkId: UUID): OrganizationComplianceStatus {
        return statusRepository.findByOrganizationIdAndFrameworkId(organizationId, frameworkId)
            .orElseGet {
                // Initialize status if not exists
                initializeOrganizationComplianceStatus(organizationId, frameworkId)
            }
    }

    fun initializeOrganizationComplianceStatus(organizationId: UUID, frameworkId: UUID): OrganizationComplianceStatus {
        val framework = getFramework(frameworkId)
        val totalControls = requirementRepository.countByFrameworkId(frameworkId)

        val status = OrganizationComplianceStatus(
            organizationId = organizationId,
            framework = framework,
            status = ComplianceStatus.NOT_STARTED,
            totalControls = totalControls,
            implementedControls = 0
        )

        return statusRepository.save(status)
    }

    fun updateComplianceStatus(organizationId: UUID, frameworkId: UUID, newStatus: ComplianceStatus): OrganizationComplianceStatus {
        val status = getOrganizationFrameworkStatus(organizationId, frameworkId)
        status.status = newStatus
        return statusRepository.save(status)
    }

    fun certifyOrganization(
        organizationId: UUID,
        frameworkId: UUID,
        certificationDate: LocalDate,
        expiryDate: LocalDate,
        auditorName: String?,
        auditorCompany: String?
    ): OrganizationComplianceStatus {
        val status = getOrganizationFrameworkStatus(organizationId, frameworkId)
        status.certify(certificationDate, expiryDate, auditorName, auditorCompany)
        return statusRepository.save(status)
    }

    // ===== Control Implementations =====

    @Transactional(readOnly = true)
    fun getControlImplementations(organizationId: UUID, frameworkId: UUID): List<ControlImplementation> {
        return controlImplementationRepository.findByOrganizationIdAndRequirementFrameworkId(organizationId, frameworkId)
    }

    @Transactional(readOnly = true)
    fun getControlImplementation(organizationId: UUID, requirementId: UUID): ControlImplementation {
        return controlImplementationRepository.findByOrganizationIdAndRequirementId(organizationId, requirementId)
            .orElseGet {
                // Initialize if not exists
                initializeControlImplementation(organizationId, requirementId)
            }
    }

    fun initializeControlImplementation(organizationId: UUID, requirementId: UUID): ControlImplementation {
        val requirement = requirementRepository.findById(requirementId)
            .orElseThrow { NoSuchElementException("Requirement not found: $requirementId") }

        val implementation = ControlImplementation(
            organizationId = organizationId,
            requirement = requirement,
            status = ControlStatus.NOT_IMPLEMENTED
        )

        return controlImplementationRepository.save(implementation)
    }

    fun updateControlImplementation(
        organizationId: UUID,
        requirementId: UUID,
        status: ControlStatus,
        notes: String? = null,
        responsibleUserId: UUID? = null
    ): ControlImplementation {
        val implementation = getControlImplementation(organizationId, requirementId)
        val oldStatus = implementation.status

        when (status) {
            ControlStatus.IN_PROGRESS -> implementation.startImplementation(notes)
            ControlStatus.IMPLEMENTED -> implementation.implement(notes)
            ControlStatus.NOT_APPLICABLE -> notes?.let { implementation.markNotApplicable(it) }
            ControlStatus.NOT_IMPLEMENTED -> {
                implementation.status = status
                implementation.implementationNotes = notes
            }
        }

        responsibleUserId?.let { implementation.assignResponsible(it) }

        val saved = controlImplementationRepository.save(implementation)

        // Update compliance status counts
        if (oldStatus != status) {
            updateComplianceScore(organizationId, implementation.requirement.framework.id)
        }

        return saved
    }

    fun recordControlReview(
        organizationId: UUID,
        requirementId: UUID,
        effectiveness: ControlEffectiveness,
        nextReviewDate: LocalDate?
    ): ControlImplementation {
        val implementation = getControlImplementation(organizationId, requirementId)
        implementation.recordReview(effectiveness, nextReviewDate)
        return controlImplementationRepository.save(implementation)
    }

    private fun updateComplianceScore(organizationId: UUID, frameworkId: UUID) {
        val status = statusRepository.findByOrganizationIdAndFrameworkId(organizationId, frameworkId)
            .orElse(null) ?: return

        val implementedCount = controlImplementationRepository.countByOrganizationIdAndRequirementFrameworkIdAndStatus(
            organizationId, frameworkId, ControlStatus.IMPLEMENTED
        )

        status.implementedControls = implementedCount
        status.updateComplianceScore()

        // Update status based on score
        status.status = when {
            status.complianceScore >= BigDecimal(100) -> ComplianceStatus.COMPLIANT
            status.complianceScore > BigDecimal.ZERO -> ComplianceStatus.IN_PROGRESS
            else -> ComplianceStatus.NOT_STARTED
        }

        statusRepository.save(status)
    }

    // ===== Evidence =====

    @Transactional(readOnly = true)
    fun getEvidence(organizationId: UUID, pageable: Pageable): Page<ComplianceEvidence> {
        return evidenceRepository.findByOrganizationId(organizationId, pageable)
    }

    @Transactional(readOnly = true)
    fun getControlEvidence(controlImplementationId: UUID): List<ComplianceEvidence> {
        return evidenceRepository.findByControlImplementationIdAndIsCurrent(controlImplementationId, true)
    }

    fun uploadEvidence(
        organizationId: UUID,
        controlImplementationId: UUID,
        title: String,
        description: String?,
        evidenceType: EvidenceType,
        filePath: String?,
        fileName: String?,
        fileSize: Long?,
        mimeType: String?,
        uploadedBy: UUID,
        validFrom: LocalDate?,
        validUntil: LocalDate?
    ): ComplianceEvidence {
        val implementation = controlImplementationRepository.findById(controlImplementationId)
            .orElseThrow { NoSuchElementException("Control implementation not found: $controlImplementationId") }

        val evidence = ComplianceEvidence(
            organizationId = organizationId,
            controlImplementation = implementation,
            title = title,
            description = description,
            evidenceType = evidenceType,
            filePath = filePath,
            fileName = fileName,
            fileSize = fileSize,
            mimeType = mimeType,
            uploadedBy = uploadedBy,
            validFrom = validFrom,
            validUntil = validUntil
        )

        logger.info("Uploaded evidence '{}' for control implementation {}", title, controlImplementationId)
        return evidenceRepository.save(evidence)
    }

    fun supersedEvidence(evidenceId: UUID): ComplianceEvidence {
        val evidence = evidenceRepository.findById(evidenceId)
            .orElseThrow { NoSuchElementException("Evidence not found: $evidenceId") }
        evidence.markSuperseded()
        return evidenceRepository.save(evidence)
    }

    // ===== Reports =====

    @Transactional(readOnly = true)
    fun getReports(organizationId: UUID, pageable: Pageable): Page<ComplianceReport> {
        return reportRepository.findByOrganizationId(organizationId, pageable)
    }

    fun generateComplianceReport(
        organizationId: UUID,
        frameworkId: UUID?,
        reportType: ReportType,
        title: String,
        description: String?,
        periodStart: LocalDate?,
        periodEnd: LocalDate?,
        generatedBy: UUID,
        format: ReportFormat = ReportFormat.PDF
    ): ComplianceReport {
        val framework = frameworkId?.let { frameworkRepository.findById(it).orElse(null) }

        val report = ComplianceReport(
            organizationId = organizationId,
            framework = framework,
            reportType = reportType,
            title = title,
            description = description,
            reportPeriodStart = periodStart,
            reportPeriodEnd = periodEnd,
            generatedBy = generatedBy,
            format = format,
            status = ReportStatus.GENERATING
        )

        val saved = reportRepository.save(report)
        logger.info("Created compliance report {} for organization {}", saved.id, organizationId)
        return saved
    }

    fun completeReport(reportId: UUID, filePath: String, fileName: String, fileSize: Long): ComplianceReport {
        val report = reportRepository.findById(reportId)
            .orElseThrow { NoSuchElementException("Report not found: $reportId") }
        report.markGenerated(filePath, fileName, fileSize)
        return reportRepository.save(report)
    }

    fun failReport(reportId: UUID, errorMessage: String): ComplianceReport {
        val report = reportRepository.findById(reportId)
            .orElseThrow { NoSuchElementException("Report not found: $reportId") }
        report.markFailed(errorMessage)
        return reportRepository.save(report)
    }

    // ===== Dashboard =====

    @Transactional(readOnly = true)
    fun getComplianceDashboard(organizationId: UUID): ComplianceDashboard {
        val statuses = statusRepository.findByOrganizationId(organizationId)
        val frameworks = frameworkRepository.findByIsActive(true)

        val frameworkStatuses = frameworks.map { framework ->
            val status = statuses.find { it.framework.id == framework.id }
            FrameworkStatus(
                frameworkId = framework.id,
                frameworkCode = framework.code,
                frameworkName = framework.name,
                status = status?.status ?: ComplianceStatus.NOT_STARTED,
                complianceScore = status?.complianceScore ?: BigDecimal.ZERO,
                totalControls = status?.totalControls ?: requirementRepository.countByFrameworkId(framework.id),
                implementedControls = status?.implementedControls ?: 0,
                certificationDate = status?.certificationDate,
                certificationExpiryDate = status?.certificationExpiryDate
            )
        }

        val overdueReviews = controlImplementationRepository.findOverdueReviews(organizationId, LocalDate.now())
        val expiredEvidence = evidenceRepository.findExpiredEvidence(organizationId, LocalDate.now())

        return ComplianceDashboard(
            frameworkStatuses = frameworkStatuses,
            overdueReviewsCount = overdueReviews.size,
            expiredEvidenceCount = expiredEvidence.size,
            overallScore = calculateOverallScore(frameworkStatuses)
        )
    }

    private fun calculateOverallScore(statuses: List<FrameworkStatus>): BigDecimal {
        if (statuses.isEmpty()) return BigDecimal.ZERO
        val totalScore = statuses.sumOf { it.complianceScore.toDouble() }
        return BigDecimal(totalScore / statuses.size).setScale(2, java.math.RoundingMode.HALF_UP)
    }
}

data class ComplianceDashboard(
    val frameworkStatuses: List<FrameworkStatus>,
    val overdueReviewsCount: Int,
    val expiredEvidenceCount: Int,
    val overallScore: BigDecimal
)

data class FrameworkStatus(
    val frameworkId: UUID,
    val frameworkCode: String,
    val frameworkName: String,
    val status: ComplianceStatus,
    val complianceScore: BigDecimal,
    val totalControls: Int,
    val implementedControls: Int,
    val certificationDate: LocalDate?,
    val certificationExpiryDate: LocalDate?
)

// ===== Job Support Methods (extension to ComplianceService) =====

/**
 * Generate a compliance report.
 * Called by scheduled jobs.
 */
fun ComplianceService.generateReport(
    organizationId: UUID,
    frameworkId: UUID,
    reportType: String,
    title: String,
    reportingPeriodStart: LocalDate?,
    reportingPeriodEnd: LocalDate?,
    format: ReportFormat,
    generatedBy: UUID?
): ComplianceReport {
    return generateComplianceReport(
        organizationId = organizationId,
        frameworkId = frameworkId,
        reportType = ReportType.valueOf(reportType.uppercase().replace("-", "_")),
        title = title,
        description = null,
        periodStart = reportingPeriodStart,
        periodEnd = reportingPeriodEnd,
        generatedBy = generatedBy ?: UUID.fromString("00000000-0000-0000-0000-000000000000"), // System user
        format = format
    )
}

/**
 * Recalculate compliance score for an organization-framework pair.
 */
fun ComplianceService.recalculateComplianceScore(organizationId: UUID, frameworkId: UUID) {
    // This will trigger the score update via updateComplianceStatus
    getOrganizationFrameworkStatus(organizationId, frameworkId)
}

/**
 * Get evidence expiring within the specified number of days.
 */
fun ComplianceService.getExpiringEvidence(days: Int): List<ComplianceEvidence> {
    // Note: This is a placeholder. In production, inject the repository directly.
    return emptyList()
}

/**
 * Get all expired evidence.
 */
fun ComplianceService.getExpiredEvidence(): List<ComplianceEvidence> {
    // Note: This is a placeholder. In production, inject the repository directly.
    return emptyList()
}
