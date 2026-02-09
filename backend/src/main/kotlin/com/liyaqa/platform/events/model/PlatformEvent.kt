package com.liyaqa.platform.events.model

import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

sealed class PlatformEvent(
    val eventId: UUID = UUID.randomUUID(),
    val occurredAt: Instant = Instant.now()
) {
    // --- Deal Events ---
    data class DealCreated(val dealId: UUID, val facilityName: String?, val contactName: String, val source: String) : PlatformEvent()
    data class DealStageChanged(val dealId: UUID, val fromStage: String, val toStage: String, val facilityName: String?, val contactEmail: String) : PlatformEvent()
    data class DealWon(val dealId: UUID, val facilityName: String?, val contactName: String, val contactEmail: String, val estimatedValue: BigDecimal) : PlatformEvent()
    data class DealLost(val dealId: UUID, val facilityName: String?, val reason: String?) : PlatformEvent()

    // --- Subscription Events ---
    data class SubscriptionCreated(val tenantId: UUID, val subscriptionId: UUID, val planId: UUID, val status: String) : PlatformEvent()
    data class SubscriptionPlanChanged(val tenantId: UUID, val subscriptionId: UUID, val oldPlanId: UUID, val newPlanId: UUID) : PlatformEvent()
    data class SubscriptionCancelled(val tenantId: UUID, val subscriptionId: UUID, val reason: String?) : PlatformEvent()
    data class SubscriptionRenewed(val tenantId: UUID, val subscriptionId: UUID, val newPeriodEnd: LocalDate) : PlatformEvent()

    // --- Invoice Events ---
    data class InvoiceGenerated(val tenantId: UUID, val invoiceId: UUID, val invoiceNumber: String, val amount: BigDecimal) : PlatformEvent()
    data class InvoicePaid(val tenantId: UUID, val invoiceId: UUID, val invoiceNumber: String, val amount: BigDecimal) : PlatformEvent()
    data class InvoiceOverdue(val tenantId: UUID, val invoiceId: UUID, val invoiceNumber: String, val amount: BigDecimal) : PlatformEvent()

    // --- Ticket Events ---
    data class TicketCreated(val ticketId: UUID, val tenantId: UUID, val ticketNumber: String, val subject: String, val priority: String) : PlatformEvent()
    data class TicketStatusChanged(val ticketId: UUID, val tenantId: UUID, val ticketNumber: String, val fromStatus: String, val toStatus: String) : PlatformEvent()
    data class TicketEscalated(val ticketId: UUID, val tenantId: UUID, val ticketNumber: String, val reason: String?, val escalatedBy: UUID) : PlatformEvent()
    data class TicketAssigned(val ticketId: UUID, val tenantId: UUID, val ticketNumber: String, val assignedToId: UUID) : PlatformEvent()

    // --- Access Events ---
    data class ImpersonationStarted(val sessionId: UUID, val platformUserId: UUID, val platformUserEmail: String, val targetUserId: UUID, val targetTenantId: UUID, val purpose: String) : PlatformEvent()
    data class ImpersonationEnded(val sessionId: UUID, val platformUserId: UUID, val actionsCount: Int) : PlatformEvent()
    data class ApiKeyCreated(val keyId: UUID, val tenantId: UUID, val keyName: String, val createdBy: UUID) : PlatformEvent()
    data class ApiKeyRevoked(val keyId: UUID, val tenantId: UUID, val keyName: String, val revokedBy: UUID) : PlatformEvent()
}
