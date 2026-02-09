package com.liyaqa.platform.events.listener

import com.liyaqa.platform.events.model.PlatformEvent
import com.liyaqa.platform.tenant.model.TenantDeactivatedEvent
import com.liyaqa.platform.tenant.model.TenantProvisionedEvent
import com.liyaqa.platform.tenant.model.TenantSuspendedEvent
import com.liyaqa.platform.tenant.model.TenantArchivedEvent
import com.liyaqa.shared.domain.AuditAction
import com.liyaqa.shared.infrastructure.audit.AuditService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

@Component
class EventAuditListener(
    private val auditService: AuditService
) {
    private val logger = LoggerFactory.getLogger(EventAuditListener::class.java)

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    fun handlePlatformEvent(event: PlatformEvent) {
        try {
            when (event) {
                is PlatformEvent.DealCreated -> auditService.logAsync(
                    action = AuditAction.CREATE,
                    entityType = "Deal",
                    entityId = event.dealId,
                    description = "Deal created: ${event.facilityName ?: event.contactName} (source: ${event.source})"
                )
                is PlatformEvent.DealStageChanged -> auditService.logAsync(
                    action = AuditAction.STATUS_CHANGE,
                    entityType = "Deal",
                    entityId = event.dealId,
                    description = "Deal stage changed from ${event.fromStage} to ${event.toStage}"
                )
                is PlatformEvent.DealWon -> auditService.logAsync(
                    action = AuditAction.STATUS_CHANGE,
                    entityType = "Deal",
                    entityId = event.dealId,
                    description = "Deal won: ${event.facilityName ?: event.contactName} (value: ${event.estimatedValue})"
                )
                is PlatformEvent.DealLost -> auditService.logAsync(
                    action = AuditAction.STATUS_CHANGE,
                    entityType = "Deal",
                    entityId = event.dealId,
                    description = "Deal lost: ${event.facilityName}. Reason: ${event.reason ?: "not specified"}"
                )
                is PlatformEvent.SubscriptionCreated -> auditService.logAsync(
                    action = AuditAction.SUBSCRIPTION_ACTIVATE,
                    entityType = "TenantSubscription",
                    entityId = event.subscriptionId,
                    description = "Subscription created for tenant ${event.tenantId} (status: ${event.status})"
                )
                is PlatformEvent.SubscriptionPlanChanged -> auditService.logAsync(
                    action = AuditAction.UPDATE,
                    entityType = "TenantSubscription",
                    entityId = event.subscriptionId,
                    description = "Subscription plan changed from ${event.oldPlanId} to ${event.newPlanId}"
                )
                is PlatformEvent.SubscriptionCancelled -> auditService.logAsync(
                    action = AuditAction.SUBSCRIPTION_CANCEL,
                    entityType = "TenantSubscription",
                    entityId = event.subscriptionId,
                    description = "Subscription cancelled for tenant ${event.tenantId}. Reason: ${event.reason ?: "not specified"}"
                )
                is PlatformEvent.SubscriptionRenewed -> auditService.logAsync(
                    action = AuditAction.SUBSCRIPTION_RENEW,
                    entityType = "TenantSubscription",
                    entityId = event.subscriptionId,
                    description = "Subscription renewed for tenant ${event.tenantId} until ${event.newPeriodEnd}"
                )
                is PlatformEvent.InvoiceGenerated -> auditService.logAsync(
                    action = AuditAction.INVOICE_ISSUE,
                    entityType = "Invoice",
                    entityId = event.invoiceId,
                    description = "Invoice ${event.invoiceNumber} generated for tenant ${event.tenantId}: ${event.amount} SAR"
                )
                is PlatformEvent.InvoicePaid -> auditService.logAsync(
                    action = AuditAction.PAYMENT,
                    entityType = "Invoice",
                    entityId = event.invoiceId,
                    description = "Invoice ${event.invoiceNumber} paid: ${event.amount} SAR"
                )
                is PlatformEvent.InvoiceOverdue -> auditService.logAsync(
                    action = AuditAction.STATUS_CHANGE,
                    entityType = "Invoice",
                    entityId = event.invoiceId,
                    description = "Invoice ${event.invoiceNumber} is overdue: ${event.amount} SAR"
                )
                is PlatformEvent.TicketCreated -> auditService.logAsync(
                    action = AuditAction.CREATE,
                    entityType = "Ticket",
                    entityId = event.ticketId,
                    description = "Ticket ${event.ticketNumber} created: ${event.subject} (priority: ${event.priority})"
                )
                is PlatformEvent.TicketStatusChanged -> auditService.logAsync(
                    action = AuditAction.STATUS_CHANGE,
                    entityType = "Ticket",
                    entityId = event.ticketId,
                    description = "Ticket ${event.ticketNumber} status changed from ${event.fromStatus} to ${event.toStatus}"
                )
                is PlatformEvent.TicketEscalated -> auditService.logAsync(
                    action = AuditAction.STATUS_CHANGE,
                    entityType = "Ticket",
                    entityId = event.ticketId,
                    description = "Ticket ${event.ticketNumber} escalated. Reason: ${event.reason ?: "not specified"}"
                )
                is PlatformEvent.TicketAssigned -> auditService.logAsync(
                    action = AuditAction.UPDATE,
                    entityType = "Ticket",
                    entityId = event.ticketId,
                    description = "Ticket ${event.ticketNumber} assigned to ${event.assignedToId}"
                )
                is PlatformEvent.ImpersonationStarted -> auditService.logAsync(
                    action = AuditAction.IMPERSONATE_START,
                    entityType = "ImpersonationSession",
                    entityId = event.sessionId,
                    description = "Impersonation started by ${event.platformUserEmail} for user ${event.targetUserId} in tenant ${event.targetTenantId}. Purpose: ${event.purpose}"
                )
                is PlatformEvent.ImpersonationEnded -> auditService.logAsync(
                    action = AuditAction.IMPERSONATE_END,
                    entityType = "ImpersonationSession",
                    entityId = event.sessionId,
                    description = "Impersonation ended. Actions performed: ${event.actionsCount}"
                )
                is PlatformEvent.ApiKeyCreated -> auditService.logAsync(
                    action = AuditAction.API_KEY_CREATE,
                    entityType = "TenantApiKey",
                    entityId = event.keyId,
                    description = "API key '${event.keyName}' created for tenant ${event.tenantId}"
                )
                is PlatformEvent.ApiKeyRevoked -> auditService.logAsync(
                    action = AuditAction.API_KEY_REVOKE,
                    entityType = "TenantApiKey",
                    entityId = event.keyId,
                    description = "API key '${event.keyName}' revoked for tenant ${event.tenantId}"
                )
            }
        } catch (e: Exception) {
            logger.error("Failed to audit log platform event: ${event::class.simpleName}", e)
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    fun handleTenantProvisionedEvent(event: TenantProvisionedEvent) {
        try {
            auditService.logAsync(
                action = AuditAction.CREATE,
                entityType = "Tenant",
                entityId = event.tenantId,
                description = "Tenant provisioned: ${event.facilityName} (contact: ${event.contactEmail})"
            )
        } catch (e: Exception) {
            logger.error("Failed to audit log TenantProvisionedEvent", e)
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    fun handleTenantDeactivatedEvent(event: TenantDeactivatedEvent) {
        try {
            auditService.logAsync(
                action = AuditAction.STATUS_CHANGE,
                entityType = "Tenant",
                entityId = event.tenantId,
                description = "Tenant deactivated. Reason: ${event.reason}"
            )
        } catch (e: Exception) {
            logger.error("Failed to audit log TenantDeactivatedEvent", e)
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    fun handleTenantSuspendedEvent(event: TenantSuspendedEvent) {
        try {
            auditService.logAsync(
                action = AuditAction.STATUS_CHANGE,
                entityType = "Tenant",
                entityId = event.tenantId,
                description = "Tenant suspended by user ${event.suspendedBy}"
            )
        } catch (e: Exception) {
            logger.error("Failed to audit log TenantSuspendedEvent", e)
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    fun handleTenantArchivedEvent(event: TenantArchivedEvent) {
        try {
            auditService.logAsync(
                action = AuditAction.STATUS_CHANGE,
                entityType = "Tenant",
                entityId = event.tenantId,
                description = "Tenant archived. Data retained until ${event.dataRetentionUntil}"
            )
        } catch (e: Exception) {
            logger.error("Failed to audit log TenantArchivedEvent", e)
        }
    }
}
