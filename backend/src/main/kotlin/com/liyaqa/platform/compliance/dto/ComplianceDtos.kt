package com.liyaqa.platform.compliance.dto

import com.liyaqa.platform.compliance.model.ContractStatus
import com.liyaqa.platform.compliance.model.ContractType
import com.liyaqa.platform.compliance.model.DataExportRequest
import com.liyaqa.platform.compliance.model.DataExportRequestStatus
import com.liyaqa.platform.compliance.model.TenantContract
import com.liyaqa.platform.compliance.model.ZatcaSubmission
import com.liyaqa.platform.compliance.model.ZatcaSubmissionStatus
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

// ============================================
// Contract DTOs
// ============================================

data class CreateContractRequest(
    val tenantId: UUID,
    val contractNumber: String,
    val type: ContractType,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val autoRenew: Boolean = false,
    val documentUrl: String? = null,
    val value: BigDecimal? = null,
    val currency: String = "SAR",
    val terms: Map<String, String> = emptyMap()
)

data class UpdateContractRequest(
    val type: ContractType? = null,
    val status: ContractStatus? = null,
    val startDate: LocalDate? = null,
    val endDate: LocalDate? = null,
    val autoRenew: Boolean? = null,
    val documentUrl: String? = null,
    val value: BigDecimal? = null,
    val currency: String? = null,
    val terms: Map<String, String>? = null
)

data class RenewContractRequest(
    val newEndDate: LocalDate? = null
)

data class ContractResponse(
    val id: UUID,
    val tenantId: UUID,
    val tenantName: String? = null,
    val tenantNameAr: String? = null,
    val contractNumber: String,
    val type: ContractType,
    val status: ContractStatus,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val autoRenew: Boolean,
    val value: BigDecimal? = null,
    val currency: String? = null,
    val documentUrl: String?,
    val signedAt: Instant?,
    val signedBy: UUID?,
    val terms: Map<String, String>,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(
            contract: TenantContract,
            tenantName: String? = null,
            tenantNameAr: String? = null
        ) = ContractResponse(
            id = contract.id,
            tenantId = contract.tenantId,
            tenantName = tenantName,
            tenantNameAr = tenantNameAr,
            contractNumber = contract.contractNumber,
            type = contract.type,
            status = contract.status,
            startDate = contract.startDate,
            endDate = contract.endDate,
            autoRenew = contract.autoRenew,
            value = contract.value,
            currency = contract.currency,
            documentUrl = contract.documentUrl,
            signedAt = contract.signedAt,
            signedBy = contract.signedBy,
            terms = contract.terms,
            createdAt = contract.createdAt,
            updatedAt = contract.updatedAt
        )
    }
}

// ============================================
// ZATCA DTOs
// ============================================

data class ZatcaComplianceStatusResponse(
    val totalInvoices: Long,
    val submittedCount: Long,
    val acceptedCount: Long,
    val rejectedCount: Long,
    val pendingCount: Long,
    val failedCount: Long,
    val complianceRate: Double,
    val issuesByTenant: List<ZatcaTenantIssue>
)

data class ZatcaTenantIssue(
    val tenantId: UUID,
    val tenantName: String?,
    val tenantNameAr: String? = null,
    val rejectedCount: Long,
    val failedCount: Long,
    val pendingCount: Long
)

data class ZatcaTenantDetailResponse(
    val tenantId: UUID,
    val totalInvoices: Long,
    val submittedCount: Long,
    val acceptedCount: Long,
    val rejectedCount: Long,
    val pendingCount: Long,
    val failedCount: Long,
    val complianceRate: Double,
    val submissions: List<ZatcaSubmissionResponse>
)

data class ZatcaSubmissionResponse(
    val id: UUID,
    val tenantId: UUID,
    val invoiceId: UUID,
    val invoiceNumber: String,
    val status: ZatcaSubmissionStatus,
    val submittedAt: Instant?,
    val responseCode: String?,
    val responseMessage: String?,
    val retryCount: Int,
    val lastRetryAt: Instant?,
    val zatcaHash: String?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(submission: ZatcaSubmission) = ZatcaSubmissionResponse(
            id = submission.id,
            tenantId = submission.tenantId,
            invoiceId = submission.invoiceId,
            invoiceNumber = submission.invoiceNumber,
            status = submission.status,
            submittedAt = submission.submittedAt,
            responseCode = submission.responseCode,
            responseMessage = submission.responseMessage,
            retryCount = submission.retryCount,
            lastRetryAt = submission.lastRetryAt,
            zatcaHash = submission.zatcaHash,
            createdAt = submission.createdAt,
            updatedAt = submission.updatedAt
        )
    }
}

data class ZatcaMonthlyTrendPoint(
    val month: String,
    val compliant: Long,
    val failed: Long
)

data class ZatcaIssueResponse(
    val id: UUID,
    val invoiceId: UUID,
    val invoiceNumber: String,
    val tenantId: UUID,
    val tenantName: String? = null,
    val tenantNameAr: String? = null,
    val status: ZatcaSubmissionStatus,
    val responseMessage: String?,
    val responseCode: String?,
    val submittedAt: Instant?,
    val createdAt: Instant
)

// ============================================
// Data Export DTOs
// ============================================

data class DataExportRequestResponse(
    val id: UUID,
    val tenantId: UUID,
    val requestNumber: String,
    val requesterName: String,
    val requesterEmail: String,
    val reason: String?,
    val status: DataExportRequestStatus,
    val approvedBy: UUID?,
    val approvedAt: Instant?,
    val rejectedBy: UUID?,
    val rejectedAt: Instant?,
    val rejectionReason: String?,
    val completedAt: Instant?,
    val exportJobId: UUID?,
    val fileUrl: String?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(request: DataExportRequest) = DataExportRequestResponse(
            id = request.id,
            tenantId = request.tenantId,
            requestNumber = request.requestNumber,
            requesterName = request.requesterName,
            requesterEmail = request.requesterEmail,
            reason = request.reason,
            status = request.status,
            approvedBy = request.approvedBy,
            approvedAt = request.approvedAt,
            rejectedBy = request.rejectedBy,
            rejectedAt = request.rejectedAt,
            rejectionReason = request.rejectionReason,
            completedAt = request.completedAt,
            exportJobId = request.exportJobId,
            fileUrl = request.fileUrl,
            createdAt = request.createdAt,
            updatedAt = request.updatedAt
        )
    }
}

data class RejectDataExportRequest(
    val reason: String
)
