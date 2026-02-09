package com.liyaqa.platform.events.handler

import com.liyaqa.platform.events.model.PlatformEvent
import com.liyaqa.platform.support.dto.CreateTicketCommand
import com.liyaqa.platform.support.model.CreatedByUserType
import com.liyaqa.platform.support.model.TicketCategory
import com.liyaqa.platform.support.model.TicketPriority
import com.liyaqa.platform.support.service.TicketService
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener
import java.util.UUID

@Component
class InvoiceEventHandler(
    private val ticketService: TicketService
) {
    private val logger = LoggerFactory.getLogger(InvoiceEventHandler::class.java)

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    fun handleInvoiceOverdue(event: PlatformEvent.InvoiceOverdue) {
        try {
            val ticket = ticketService.createTicket(
                CreateTicketCommand(
                    tenantId = event.tenantId,
                    createdByUserId = UUID(0, 0),
                    createdByUserType = CreatedByUserType.PLATFORM_AGENT,
                    subject = "Overdue Invoice: ${event.invoiceNumber}",
                    description = "Invoice ${event.invoiceNumber} for ${event.amount} SAR is overdue. Please follow up with the tenant.",
                    category = TicketCategory.BILLING,
                    priority = TicketPriority.HIGH
                )
            )
            logger.info(
                "Created support ticket {} for overdue invoice {} (tenant: {})",
                ticket.ticketNumber, event.invoiceNumber, event.tenantId
            )
        } catch (e: Exception) {
            logger.error("Failed to create ticket for overdue invoice {}: {}", event.invoiceNumber, e.message, e)
        }
    }
}
