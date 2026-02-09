package com.liyaqa.platform.events.handler

import com.liyaqa.platform.events.model.PlatformEvent
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

@Component
class TicketEventHandler {
    private val logger = LoggerFactory.getLogger(TicketEventHandler::class.java)

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    fun handleTicketEscalated(event: PlatformEvent.TicketEscalated) {
        logger.info(
            "Ticket {} escalated (tenant: {}). Reason: {}. SUPPORT_LEAD notification pending.",
            event.ticketNumber, event.tenantId, event.reason ?: "not specified"
        )
    }
}
