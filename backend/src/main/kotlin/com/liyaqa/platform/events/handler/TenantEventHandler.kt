package com.liyaqa.platform.events.handler

import com.liyaqa.platform.tenant.model.TenantDeactivatedEvent
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

@Component
class TenantEventHandler {
    private val logger = LoggerFactory.getLogger(TenantEventHandler::class.java)

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    fun handleTenantDeactivated(event: TenantDeactivatedEvent) {
        logger.info(
            "Tenant {} deactivated (reason: {}). Subscription cancellation should be triggered.",
            event.tenantId, event.reason
        )
    }
}
