package com.liyaqa.platform.tenant.dto

import com.liyaqa.platform.tenant.model.DataExportFormat
import com.liyaqa.platform.tenant.model.DataExportJob
import com.liyaqa.platform.tenant.model.DataExportStatus
import com.liyaqa.platform.tenant.model.DeactivationReason
import com.liyaqa.platform.tenant.model.OnboardingChecklist
import com.liyaqa.platform.tenant.model.ProvisioningStep
import com.liyaqa.platform.tenant.model.Tenant
import com.liyaqa.platform.tenant.model.TenantDeactivationLog
import com.liyaqa.platform.tenant.model.TenantStatus
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import java.time.Instant
import java.util.UUID

// ============================================
// Request DTOs
// ============================================

data class ProvisionTenantRequest(
    @field:NotBlank(message = "Facility name is required")
    val facilityName: String,
    val facilityNameAr: String? = null,
    val subdomain: String? = null,
    val crNumber: String? = null,
    val vatNumber: String? = null,
    @field:NotBlank(message = "Contact email is required")
    @field:Email(message = "Invalid email format")
    val contactEmail: String,
    val contactPhone: String? = null,
    val address: String? = null,
    val city: String? = null,
    val region: String? = null,
    val country: String? = null,
    val subscriptionPlanId: UUID? = null,
    val metadata: String? = null
) {
    fun toCommand() = ProvisionTenantCommand(
        facilityName = facilityName,
        facilityNameAr = facilityNameAr,
        subdomain = subdomain,
        crNumber = crNumber,
        vatNumber = vatNumber,
        contactEmail = contactEmail,
        contactPhone = contactPhone,
        address = address,
        city = city,
        region = region,
        country = country ?: "SA",
        subscriptionPlanId = subscriptionPlanId,
        metadata = metadata
    )
}

data class UpdateTenantRequest(
    val facilityName: String? = null,
    val facilityNameAr: String? = null,
    val subdomain: String? = null,
    val crNumber: String? = null,
    val vatNumber: String? = null,
    @field:Email(message = "Invalid email format")
    val contactEmail: String? = null,
    val contactPhone: String? = null,
    val address: String? = null,
    val city: String? = null,
    val region: String? = null,
    val country: String? = null,
    val subscriptionPlanId: UUID? = null,
    val metadata: String? = null
) {
    fun toCommand() = UpdateTenantCommand(
        facilityName = facilityName,
        facilityNameAr = facilityNameAr,
        subdomain = subdomain,
        crNumber = crNumber,
        vatNumber = vatNumber,
        contactEmail = contactEmail,
        contactPhone = contactPhone,
        address = address,
        city = city,
        region = region,
        country = country,
        subscriptionPlanId = subscriptionPlanId,
        metadata = metadata
    )
}

data class ChangeStatusRequest(
    val status: TenantStatus,
    val reason: String? = null
) {
    fun toCommand() = ChangeStatusCommand(
        newStatus = status,
        reason = reason
    )
}

data class CompleteStepRequest(
    val notes: String? = null
)

data class ProvisionFromDealRequest(
    @field:NotBlank(message = "Admin email is required")
    @field:Email(message = "Invalid email format")
    val adminEmail: String,
    @field:NotBlank(message = "Admin password is required")
    val adminPassword: String,
    @field:NotBlank(message = "Admin display name (English) is required")
    val adminDisplayNameEn: String,
    val adminDisplayNameAr: String? = null,
    val clubName: String? = null,
    val subscriptionPlanId: UUID? = null
) {
    fun toCommand() = ProvisionFromDealCommand(
        adminEmail = adminEmail,
        adminPassword = adminPassword,
        adminDisplayNameEn = adminDisplayNameEn,
        adminDisplayNameAr = adminDisplayNameAr,
        clubName = clubName,
        subscriptionPlanId = subscriptionPlanId
    )
}

data class DeactivateTenantRequest(
    val reason: DeactivationReason,
    val notes: String? = null
) {
    fun toCommand() = DeactivateTenantCommand(
        reason = reason,
        notes = notes
    )
}

data class SuspendTenantRequest(
    val reason: String? = null
) {
    fun toCommand() = SuspendTenantCommand(
        reason = reason
    )
}

data class RequestDataExportRequest(
    val format: DataExportFormat = DataExportFormat.JSON
) {
    fun toCommand() = RequestDataExportCommand(
        format = format
    )
}

// ============================================
// Response DTOs
// ============================================

data class TenantResponse(
    val id: UUID,
    val facilityName: String,
    val facilityNameAr: String?,
    val subdomain: String?,
    val crNumber: String?,
    val vatNumber: String?,
    val contactEmail: String,
    val contactPhone: String?,
    val address: String?,
    val city: String?,
    val region: String?,
    val country: String,
    val status: TenantStatus,
    val subscriptionPlanId: UUID?,
    val dealId: UUID?,
    val organizationId: UUID?,
    val clubId: UUID?,
    val onboardedBy: UUID?,
    val onboardedAt: Instant?,
    val deactivatedAt: Instant?,
    val dataRetentionUntil: Instant?,
    val metadata: String?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(tenant: Tenant) = TenantResponse(
            id = tenant.id,
            facilityName = tenant.facilityName,
            facilityNameAr = tenant.facilityNameAr,
            subdomain = tenant.subdomain,
            crNumber = tenant.crNumber,
            vatNumber = tenant.vatNumber,
            contactEmail = tenant.contactEmail,
            contactPhone = tenant.contactPhone,
            address = tenant.address,
            city = tenant.city,
            region = tenant.region,
            country = tenant.country,
            status = tenant.status,
            subscriptionPlanId = tenant.subscriptionPlanId,
            dealId = tenant.dealId,
            organizationId = tenant.organizationId,
            clubId = tenant.clubId,
            onboardedBy = tenant.onboardedBy,
            onboardedAt = tenant.onboardedAt,
            deactivatedAt = tenant.deactivatedAt,
            dataRetentionUntil = tenant.dataRetentionUntil,
            metadata = tenant.metadata,
            createdAt = tenant.createdAt,
            updatedAt = tenant.updatedAt
        )
    }
}

data class TenantSummaryResponse(
    val id: UUID,
    val facilityName: String,
    val status: TenantStatus,
    val contactEmail: String,
    val createdAt: Instant
) {
    companion object {
        fun from(tenant: Tenant) = TenantSummaryResponse(
            id = tenant.id,
            facilityName = tenant.facilityName,
            status = tenant.status,
            contactEmail = tenant.contactEmail,
            createdAt = tenant.createdAt
        )
    }
}

data class OnboardingChecklistResponse(
    val step: ProvisioningStep,
    val completed: Boolean,
    val completedAt: Instant?,
    val completedBy: UUID?,
    val notes: String?
) {
    companion object {
        fun from(item: OnboardingChecklist) = OnboardingChecklistResponse(
            step = item.step,
            completed = item.completed,
            completedAt = item.completedAt,
            completedBy = item.completedBy,
            notes = item.notes
        )
    }
}

data class OnboardingProgressSummaryResponse(
    val totalSteps: Int,
    val completedSteps: Long,
    val percentage: Int,
    val items: List<OnboardingChecklistResponse>
)

data class DeactivationLogResponse(
    val id: UUID,
    val tenantId: UUID,
    val reason: DeactivationReason,
    val notes: String?,
    val deactivatedBy: UUID,
    val previousStatus: TenantStatus,
    val createdAt: Instant
) {
    companion object {
        fun from(log: TenantDeactivationLog) = DeactivationLogResponse(
            id = log.id,
            tenantId = log.tenantId,
            reason = log.reason,
            notes = log.notes,
            deactivatedBy = log.deactivatedBy,
            previousStatus = log.previousStatus,
            createdAt = log.createdAt
        )
    }
}

data class DataExportJobResponse(
    val id: UUID,
    val tenantId: UUID,
    val status: DataExportStatus,
    val format: DataExportFormat,
    val requestedBy: UUID,
    val startedAt: Instant?,
    val completedAt: Instant?,
    val fileUrl: String?,
    val fileSizeBytes: Long?,
    val errorMessage: String?,
    val expiresAt: Instant?,
    val createdAt: Instant
) {
    companion object {
        fun from(job: DataExportJob) = DataExportJobResponse(
            id = job.id,
            tenantId = job.tenantId,
            status = job.status,
            format = job.format,
            requestedBy = job.requestedBy,
            startedAt = job.startedAt,
            completedAt = job.completedAt,
            fileUrl = job.fileUrl,
            fileSizeBytes = job.fileSizeBytes,
            errorMessage = job.errorMessage,
            expiresAt = job.expiresAt,
            createdAt = job.createdAt
        )
    }
}

// ============================================
// Commands (internal)
// ============================================

data class ProvisionTenantCommand(
    val facilityName: String,
    val facilityNameAr: String? = null,
    val subdomain: String? = null,
    val crNumber: String? = null,
    val vatNumber: String? = null,
    val contactEmail: String,
    val contactPhone: String? = null,
    val address: String? = null,
    val city: String? = null,
    val region: String? = null,
    val country: String = "SA",
    val subscriptionPlanId: UUID? = null,
    val metadata: String? = null
)

data class UpdateTenantCommand(
    val facilityName: String? = null,
    val facilityNameAr: String? = null,
    val subdomain: String? = null,
    val crNumber: String? = null,
    val vatNumber: String? = null,
    val contactEmail: String? = null,
    val contactPhone: String? = null,
    val address: String? = null,
    val city: String? = null,
    val region: String? = null,
    val country: String? = null,
    val subscriptionPlanId: UUID? = null,
    val metadata: String? = null
)

data class ChangeStatusCommand(
    val newStatus: TenantStatus,
    val reason: String? = null
)

data class ProvisionFromDealCommand(
    val adminEmail: String,
    val adminPassword: String,
    val adminDisplayNameEn: String,
    val adminDisplayNameAr: String? = null,
    val clubName: String? = null,
    val subscriptionPlanId: UUID? = null
)

data class DeactivateTenantCommand(
    val reason: DeactivationReason,
    val notes: String? = null
)

data class SuspendTenantCommand(
    val reason: String? = null
)

data class RequestDataExportCommand(
    val format: DataExportFormat = DataExportFormat.JSON
)
