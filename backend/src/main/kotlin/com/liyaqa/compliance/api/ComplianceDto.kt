package com.liyaqa.compliance.api

import com.liyaqa.compliance.domain.model.*
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

// ===== Compliance Framework DTOs =====

data class FrameworkResponse(
    val id: UUID,
    val code: String,
    val name: String,
    val nameAr: String?,
    val description: String?,
    val descriptionAr: String?,
    val version: String?,
    val issuingBody: String?,
    val certificationValidityMonths: Int?
) {
    companion object {
        fun from(framework: ComplianceFramework) = FrameworkResponse(
            id = framework.id,
            code = framework.code,
            name = framework.name,
            nameAr = framework.nameAr,
            description = framework.description,
            descriptionAr = framework.descriptionAr,
            version = framework.version,
            issuingBody = framework.issuingBody,
            certificationValidityMonths = framework.certificationValidityMonths
        )
    }
}

data class RequirementResponse(
    val id: UUID,
    val frameworkId: UUID,
    val controlNumber: String,
    val title: String,
    val titleAr: String?,
    val description: String?,
    val descriptionAr: String?,
    val category: String?,
    val isMandatory: Boolean,
    val evidenceRequired: Boolean
) {
    companion object {
        fun from(req: ComplianceRequirement) = RequirementResponse(
            id = req.id,
            frameworkId = req.framework.id,
            controlNumber = req.controlNumber,
            title = req.title,
            titleAr = req.titleAr,
            description = req.description,
            descriptionAr = req.descriptionAr,
            category = req.category,
            isMandatory = req.isMandatory,
            evidenceRequired = req.evidenceRequired
        )
    }
}

data class ComplianceStatusResponse(
    val id: UUID,
    val organizationId: UUID,
    val frameworkId: UUID,
    val frameworkCode: String,
    val frameworkName: String,
    val status: ComplianceStatus,
    val complianceScore: BigDecimal,
    val totalControls: Int,
    val implementedControls: Int,
    val certificationDate: LocalDate?,
    val certificationExpiryDate: LocalDate?,
    val lastAssessmentDate: LocalDate?,
    val auditorName: String?,
    val auditorCompany: String?
) {
    companion object {
        fun from(status: OrganizationComplianceStatus) = ComplianceStatusResponse(
            id = status.id,
            organizationId = status.organizationId,
            frameworkId = status.framework.id,
            frameworkCode = status.framework.code,
            frameworkName = status.framework.name,
            status = status.status,
            complianceScore = status.complianceScore,
            totalControls = status.totalControls,
            implementedControls = status.implementedControls,
            certificationDate = status.certificationDate,
            certificationExpiryDate = status.certificationExpiryDate,
            lastAssessmentDate = status.lastAssessmentDate,
            auditorName = status.auditorName,
            auditorCompany = status.auditorCompany
        )
    }
}

data class ControlImplementationResponse(
    val id: UUID,
    val requirementId: UUID,
    val controlNumber: String,
    val controlTitle: String,
    val status: ControlStatus,
    val implementationDate: LocalDate?,
    val implementationNotes: String?,
    val responsibleUserId: UUID?,
    val effectiveness: ControlEffectiveness?,
    val nextReviewDate: LocalDate?
) {
    companion object {
        fun from(impl: ControlImplementation) = ControlImplementationResponse(
            id = impl.id,
            requirementId = impl.requirement.id,
            controlNumber = impl.requirement.controlNumber,
            controlTitle = impl.requirement.title,
            status = impl.status,
            implementationDate = impl.implementationDate,
            implementationNotes = impl.implementationNotes,
            responsibleUserId = impl.responsibleUserId,
            effectiveness = impl.effectiveness,
            nextReviewDate = impl.nextReviewDate
        )
    }
}

data class UpdateControlRequest(
    val status: ControlStatus,
    val notes: String? = null,
    val responsibleUserId: UUID? = null
)

data class ReviewControlRequest(
    val effectiveness: ControlEffectiveness,
    val nextReviewDate: LocalDate?
)

data class CertifyRequest(
    val certificationDate: LocalDate,
    val expiryDate: LocalDate,
    val auditorName: String?,
    val auditorCompany: String?
)

// ===== Evidence DTOs =====

data class EvidenceResponse(
    val id: UUID,
    val controlImplementationId: UUID,
    val title: String,
    val description: String?,
    val evidenceType: EvidenceType,
    val fileName: String?,
    val fileSize: Long?,
    val mimeType: String?,
    val uploadedBy: UUID,
    val validFrom: LocalDate?,
    val validUntil: LocalDate?,
    val isCurrent: Boolean,
    val createdAt: Instant
) {
    companion object {
        fun from(evidence: ComplianceEvidence) = EvidenceResponse(
            id = evidence.id,
            controlImplementationId = evidence.controlImplementation.id,
            title = evidence.title,
            description = evidence.description,
            evidenceType = evidence.evidenceType,
            fileName = evidence.fileName,
            fileSize = evidence.fileSize,
            mimeType = evidence.mimeType,
            uploadedBy = evidence.uploadedBy,
            validFrom = evidence.validFrom,
            validUntil = evidence.validUntil,
            isCurrent = evidence.isCurrent,
            createdAt = evidence.createdAt
        )
    }
}

data class UploadEvidenceRequest(
    val controlImplementationId: UUID,
    val title: String,
    val description: String? = null,
    val evidenceType: EvidenceType,
    val validFrom: LocalDate? = null,
    val validUntil: LocalDate? = null
)

// ===== Report DTOs =====

data class ReportResponse(
    val id: UUID,
    val frameworkId: UUID?,
    val frameworkName: String?,
    val reportType: ReportType,
    val title: String,
    val description: String?,
    val periodStart: LocalDate?,
    val periodEnd: LocalDate?,
    val generatedBy: UUID,
    val generatedAt: Instant?,
    val fileName: String?,
    val fileSize: Long?,
    val format: ReportFormat,
    val status: ReportStatus
) {
    companion object {
        fun from(report: ComplianceReport) = ReportResponse(
            id = report.id,
            frameworkId = report.framework?.id,
            frameworkName = report.framework?.name,
            reportType = report.reportType,
            title = report.title,
            description = report.description,
            periodStart = report.reportPeriodStart,
            periodEnd = report.reportPeriodEnd,
            generatedBy = report.generatedBy,
            generatedAt = report.generatedAt,
            fileName = report.fileName,
            fileSize = report.fileSize,
            format = report.format,
            status = report.status
        )
    }
}

data class GenerateReportRequest(
    val frameworkId: UUID? = null,
    val reportType: ReportType,
    val title: String,
    val description: String? = null,
    val periodStart: LocalDate? = null,
    val periodEnd: LocalDate? = null,
    val format: ReportFormat = ReportFormat.PDF
)
