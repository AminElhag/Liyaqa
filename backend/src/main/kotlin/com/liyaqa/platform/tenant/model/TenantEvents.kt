package com.liyaqa.platform.tenant.model

import java.time.Instant
import java.util.UUID

data class TenantProvisionedEvent(
    val tenantId: UUID,
    val facilityName: String,
    val contactEmail: String,
    val dealId: UUID? = null,
    val occurredAt: Instant = Instant.now()
)

data class TenantStatusChangedEvent(
    val tenantId: UUID,
    val previousStatus: TenantStatus,
    val newStatus: TenantStatus,
    val occurredAt: Instant = Instant.now()
)

data class OnboardingStepCompletedEvent(
    val tenantId: UUID,
    val step: ProvisioningStep,
    val allStepsComplete: Boolean,
    val occurredAt: Instant = Instant.now()
)

data class TenantDeactivatedEvent(
    val tenantId: UUID,
    val reason: DeactivationReason,
    val deactivatedBy: UUID,
    val occurredAt: Instant = Instant.now()
)

data class TenantSuspendedEvent(
    val tenantId: UUID,
    val suspendedBy: UUID,
    val occurredAt: Instant = Instant.now()
)

data class TenantArchivedEvent(
    val tenantId: UUID,
    val archivedBy: UUID,
    val dataRetentionUntil: Instant,
    val occurredAt: Instant = Instant.now()
)

data class DataExportRequestedEvent(
    val tenantId: UUID,
    val exportJobId: UUID,
    val format: DataExportFormat,
    val requestedBy: UUID,
    val occurredAt: Instant = Instant.now()
)

data class DataExportCompletedEvent(
    val tenantId: UUID,
    val exportJobId: UUID,
    val fileUrl: String,
    val fileSizeBytes: Long,
    val occurredAt: Instant = Instant.now()
)
