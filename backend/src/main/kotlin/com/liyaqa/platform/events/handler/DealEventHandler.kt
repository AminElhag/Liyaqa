package com.liyaqa.platform.events.handler

import com.liyaqa.platform.events.model.PlatformEvent
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

@Component
class DealEventHandler {
    private val logger = LoggerFactory.getLogger(DealEventHandler::class.java)

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    fun handleDealWon(event: PlatformEvent.DealWon) {
        logger.info(
            "Deal won: {} (facility: {}, contact: {}, value: {}). Tenant provisioning can be triggered.",
            event.dealId, event.facilityName, event.contactName, event.estimatedValue
        )
    }
}
