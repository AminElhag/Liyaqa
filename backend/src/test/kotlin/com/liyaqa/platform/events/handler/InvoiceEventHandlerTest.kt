package com.liyaqa.platform.events.handler

import com.liyaqa.platform.events.model.PlatformEvent
import com.liyaqa.platform.support.dto.CreateTicketCommand
import com.liyaqa.platform.support.model.CreatedByUserType
import com.liyaqa.platform.support.model.Ticket
import com.liyaqa.platform.support.model.TicketCategory
import com.liyaqa.platform.support.model.TicketPriority
import com.liyaqa.platform.support.service.TicketService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.check
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import java.math.BigDecimal
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class InvoiceEventHandlerTest {

    @Mock
    private lateinit var ticketService: TicketService

    @Mock
    private lateinit var mockTicket: Ticket

    private lateinit var handler: InvoiceEventHandler

    @BeforeEach
    fun setUp() {
        handler = InvoiceEventHandler(ticketService)
        whenever(mockTicket.ticketNumber).thenReturn("TKT-2026-001")
        whenever(ticketService.createTicket(any())).thenReturn(mockTicket)
    }

    @Test
    fun `handleInvoiceOverdue creates ticket with correct tenantId`() {
        val tenantId = UUID.randomUUID()
        val event = PlatformEvent.InvoiceOverdue(
            tenantId = tenantId,
            invoiceId = UUID.randomUUID(),
            invoiceNumber = "INV-2026-042",
            amount = BigDecimal("5000")
        )

        handler.handleInvoiceOverdue(event)

        verify(ticketService).createTicket(check { cmd ->
            assertEquals(tenantId, cmd.tenantId)
            assertEquals(CreatedByUserType.PLATFORM_AGENT, cmd.createdByUserType)
        })
    }

    @Test
    fun `handleInvoiceOverdue uses BILLING category and HIGH priority`() {
        val event = PlatformEvent.InvoiceOverdue(
            tenantId = UUID.randomUUID(),
            invoiceId = UUID.randomUUID(),
            invoiceNumber = "INV-2026-001",
            amount = BigDecimal("3000")
        )

        handler.handleInvoiceOverdue(event)

        verify(ticketService).createTicket(check { cmd ->
            assertEquals(TicketCategory.BILLING, cmd.category)
            assertEquals(TicketPriority.HIGH, cmd.priority)
        })
    }

    @Test
    fun `handleInvoiceOverdue includes invoice number in subject`() {
        val event = PlatformEvent.InvoiceOverdue(
            tenantId = UUID.randomUUID(),
            invoiceId = UUID.randomUUID(),
            invoiceNumber = "INV-2026-099",
            amount = BigDecimal("7500")
        )

        handler.handleInvoiceOverdue(event)

        verify(ticketService).createTicket(check { cmd ->
            assertTrue(cmd.subject.contains("INV-2026-099"))
            assertEquals("Overdue Invoice: INV-2026-099", cmd.subject)
        })
    }
}
