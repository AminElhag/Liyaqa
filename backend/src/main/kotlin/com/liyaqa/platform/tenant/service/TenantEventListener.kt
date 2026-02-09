package com.liyaqa.platform.tenant.service

import com.liyaqa.platform.tenant.model.DataExportCompletedEvent
import com.liyaqa.platform.tenant.model.DataExportRequestedEvent
import com.liyaqa.platform.tenant.model.OnboardingStepCompletedEvent
import com.liyaqa.platform.tenant.model.TenantArchivedEvent
import com.liyaqa.platform.tenant.model.TenantDeactivatedEvent
import com.liyaqa.platform.tenant.model.TenantProvisionedEvent
import com.liyaqa.platform.tenant.model.TenantStatusChangedEvent
import com.liyaqa.platform.tenant.model.TenantSuspendedEvent
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

@Component
class TenantEventListener {

    private val logger = LoggerFactory.getLogger(TenantEventListener::class.java)

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    fun handleTenantProvisioned(event: TenantProvisionedEvent) {
        logger.info(
            "Tenant provisioned: {} - {} (deal: {})",
            event.tenantId, event.facilityName, event.dealId
        )
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    fun handleTenantStatusChanged(event: TenantStatusChangedEvent) {
        logger.info(
            "Tenant {} status changed: {} -> {}",
            event.tenantId, event.previousStatus, event.newStatus
        )
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    fun handleOnboardingStepCompleted(event: OnboardingStepCompletedEvent) {
        logger.info(
            "Tenant {} onboarding step completed: {} (all done: {})",
            event.tenantId, event.step, event.allStepsComplete
        )
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    fun handleTenantDeactivated(event: TenantDeactivatedEvent) {
        logger.info(
            "Tenant {} deactivated: reason={}, by={}",
            event.tenantId, event.reason, event.deactivatedBy
        )
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    fun handleTenantSuspended(event: TenantSuspendedEvent) {
        logger.info(
            "Tenant {} suspended by {}",
            event.tenantId, event.suspendedBy
        )
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    fun handleTenantArchived(event: TenantArchivedEvent) {
        logger.info(
            "Tenant {} archived by {}, data retention until {}",
            event.tenantId, event.archivedBy, event.dataRetentionUntil
        )
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    fun handleDataExportRequested(event: DataExportRequestedEvent) {
        logger.info(
            "Data export requested for tenant {}: jobId={}, format={}, by={}",
            event.tenantId, event.exportJobId, event.format, event.requestedBy
        )
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    fun handleDataExportCompleted(event: DataExportCompletedEvent) {
        logger.info(
            "Data export completed for tenant {}: jobId={}, fileUrl={}, size={}",
            event.tenantId, event.exportJobId, event.fileUrl, event.fileSizeBytes
        )
    }
}
