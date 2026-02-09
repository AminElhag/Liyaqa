package com.liyaqa.platform.events.listener

import com.liyaqa.platform.events.model.PlatformEvent
import com.liyaqa.shared.domain.AuditAction
import com.liyaqa.shared.infrastructure.audit.AuditService
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.anyOrNull
import org.mockito.kotlin.check
import org.mockito.kotlin.eq
import org.mockito.kotlin.verify
import org.mockito.quality.Strictness
import java.math.BigDecimal
import java.util.UUID
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EventAuditListenerTest {

    @Mock
    private lateinit var auditService: AuditService

    private lateinit var listener: EventAuditListener

    @BeforeEach
    fun setUp() {
        listener = EventAuditListener(auditService)
    }

    @Test
    fun `DealCreated should log CREATE audit`() {
        val dealId = UUID.randomUUID()
        val event = PlatformEvent.DealCreated(
            dealId = dealId,
            facilityName = "Test Gym",
            contactName = "John",
            source = "WEBSITE"
        )

        listener.handlePlatformEvent(event)

        verify(auditService).logAsync(
            action = eq(AuditAction.CREATE),
            entityType = eq("Deal"),
            entityId = eq(dealId),
            description = check { assertTrue(it!!.contains("Test Gym")) },
            oldValue = anyOrNull(),
            newValue = anyOrNull()
        )
    }

    @Test
    fun `DealWon should log STATUS_CHANGE audit`() {
        val dealId = UUID.randomUUID()
        val event = PlatformEvent.DealWon(
            dealId = dealId,
            facilityName = "Fit Club",
            contactName = "Jane",
            contactEmail = "jane@example.com",
            estimatedValue = BigDecimal("50000")
        )

        listener.handlePlatformEvent(event)

        verify(auditService).logAsync(
            action = eq(AuditAction.STATUS_CHANGE),
            entityType = eq("Deal"),
            entityId = eq(dealId),
            description = check { assertTrue(it!!.contains("Deal won")) },
            oldValue = anyOrNull(),
            newValue = anyOrNull()
        )
    }

    @Test
    fun `DealLost should log STATUS_CHANGE audit`() {
        val dealId = UUID.randomUUID()
        val event = PlatformEvent.DealLost(
            dealId = dealId,
            facilityName = "Lost Gym",
            reason = "Budget constraints"
        )

        listener.handlePlatformEvent(event)

        verify(auditService).logAsync(
            action = eq(AuditAction.STATUS_CHANGE),
            entityType = eq("Deal"),
            entityId = eq(dealId),
            description = check { assertTrue(it!!.contains("Budget constraints")) },
            oldValue = anyOrNull(),
            newValue = anyOrNull()
        )
    }

    @Test
    fun `SubscriptionCreated should log SUBSCRIPTION_ACTIVATE audit`() {
        val subscriptionId = UUID.randomUUID()
        val tenantId = UUID.randomUUID()
        val event = PlatformEvent.SubscriptionCreated(
            tenantId = tenantId,
            subscriptionId = subscriptionId,
            planId = UUID.randomUUID(),
            status = "ACTIVE"
        )

        listener.handlePlatformEvent(event)

        verify(auditService).logAsync(
            action = eq(AuditAction.SUBSCRIPTION_ACTIVATE),
            entityType = eq("TenantSubscription"),
            entityId = eq(subscriptionId),
            description = check { assertTrue(it!!.contains("ACTIVE")) },
            oldValue = anyOrNull(),
            newValue = anyOrNull()
        )
    }

    @Test
    fun `SubscriptionCancelled should log SUBSCRIPTION_CANCEL audit`() {
        val subscriptionId = UUID.randomUUID()
        val tenantId = UUID.randomUUID()
        val event = PlatformEvent.SubscriptionCancelled(
            tenantId = tenantId,
            subscriptionId = subscriptionId,
            reason = "Too expensive"
        )

        listener.handlePlatformEvent(event)

        verify(auditService).logAsync(
            action = eq(AuditAction.SUBSCRIPTION_CANCEL),
            entityType = eq("TenantSubscription"),
            entityId = eq(subscriptionId),
            description = check { assertTrue(it!!.contains("Too expensive")) },
            oldValue = anyOrNull(),
            newValue = anyOrNull()
        )
    }

    @Test
    fun `InvoiceGenerated should log INVOICE_ISSUE audit`() {
        val invoiceId = UUID.randomUUID()
        val tenantId = UUID.randomUUID()
        val event = PlatformEvent.InvoiceGenerated(
            tenantId = tenantId,
            invoiceId = invoiceId,
            invoiceNumber = "INV-2026-001",
            amount = BigDecimal("1500")
        )

        listener.handlePlatformEvent(event)

        verify(auditService).logAsync(
            action = eq(AuditAction.INVOICE_ISSUE),
            entityType = eq("Invoice"),
            entityId = eq(invoiceId),
            description = check { assertTrue(it!!.contains("INV-2026-001")) },
            oldValue = anyOrNull(),
            newValue = anyOrNull()
        )
    }

    @Test
    fun `InvoicePaid should log PAYMENT audit`() {
        val invoiceId = UUID.randomUUID()
        val event = PlatformEvent.InvoicePaid(
            tenantId = UUID.randomUUID(),
            invoiceId = invoiceId,
            invoiceNumber = "INV-2026-002",
            amount = BigDecimal("2000")
        )

        listener.handlePlatformEvent(event)

        verify(auditService).logAsync(
            action = eq(AuditAction.PAYMENT),
            entityType = eq("Invoice"),
            entityId = eq(invoiceId),
            description = check { assertTrue(it!!.contains("INV-2026-002")) },
            oldValue = anyOrNull(),
            newValue = anyOrNull()
        )
    }

    @Test
    fun `InvoiceOverdue should log STATUS_CHANGE audit`() {
        val invoiceId = UUID.randomUUID()
        val event = PlatformEvent.InvoiceOverdue(
            tenantId = UUID.randomUUID(),
            invoiceId = invoiceId,
            invoiceNumber = "INV-2026-003",
            amount = BigDecimal("3000")
        )

        listener.handlePlatformEvent(event)

        verify(auditService).logAsync(
            action = eq(AuditAction.STATUS_CHANGE),
            entityType = eq("Invoice"),
            entityId = eq(invoiceId),
            description = check { assertTrue(it!!.contains("overdue")) },
            oldValue = anyOrNull(),
            newValue = anyOrNull()
        )
    }

    @Test
    fun `TicketCreated should log CREATE audit`() {
        val ticketId = UUID.randomUUID()
        val event = PlatformEvent.TicketCreated(
            ticketId = ticketId,
            tenantId = UUID.randomUUID(),
            ticketNumber = "TKT-2026-001",
            subject = "Login issue",
            priority = "HIGH"
        )

        listener.handlePlatformEvent(event)

        verify(auditService).logAsync(
            action = eq(AuditAction.CREATE),
            entityType = eq("Ticket"),
            entityId = eq(ticketId),
            description = check { assertTrue(it!!.contains("TKT-2026-001")) },
            oldValue = anyOrNull(),
            newValue = anyOrNull()
        )
    }

    @Test
    fun `TicketEscalated should log STATUS_CHANGE audit`() {
        val ticketId = UUID.randomUUID()
        val event = PlatformEvent.TicketEscalated(
            ticketId = ticketId,
            tenantId = UUID.randomUUID(),
            ticketNumber = "TKT-2026-002",
            reason = "Unresponsive for 48h",
            escalatedBy = UUID.randomUUID()
        )

        listener.handlePlatformEvent(event)

        verify(auditService).logAsync(
            action = eq(AuditAction.STATUS_CHANGE),
            entityType = eq("Ticket"),
            entityId = eq(ticketId),
            description = check { assertTrue(it!!.contains("escalated")) },
            oldValue = anyOrNull(),
            newValue = anyOrNull()
        )
    }

    @Test
    fun `ImpersonationStarted should log IMPERSONATE_START audit`() {
        val sessionId = UUID.randomUUID()
        val targetUserId = UUID.randomUUID()
        val targetTenantId = UUID.randomUUID()
        val event = PlatformEvent.ImpersonationStarted(
            sessionId = sessionId,
            platformUserId = UUID.randomUUID(),
            platformUserEmail = "admin@liyaqa.com",
            targetUserId = targetUserId,
            targetTenantId = targetTenantId,
            purpose = "Debugging login issue"
        )

        listener.handlePlatformEvent(event)

        verify(auditService).logAsync(
            action = eq(AuditAction.IMPERSONATE_START),
            entityType = eq("ImpersonationSession"),
            entityId = eq(sessionId),
            description = check { assertTrue(it!!.contains("admin@liyaqa.com")) },
            oldValue = anyOrNull(),
            newValue = anyOrNull()
        )
    }

    @Test
    fun `ApiKeyRevoked should log API_KEY_REVOKE audit`() {
        val keyId = UUID.randomUUID()
        val tenantId = UUID.randomUUID()
        val event = PlatformEvent.ApiKeyRevoked(
            keyId = keyId,
            tenantId = tenantId,
            keyName = "Production Key",
            revokedBy = UUID.randomUUID()
        )

        listener.handlePlatformEvent(event)

        verify(auditService).logAsync(
            action = eq(AuditAction.API_KEY_REVOKE),
            entityType = eq("TenantApiKey"),
            entityId = eq(keyId),
            description = check { assertTrue(it!!.contains("Production Key")) },
            oldValue = anyOrNull(),
            newValue = anyOrNull()
        )
    }
}
