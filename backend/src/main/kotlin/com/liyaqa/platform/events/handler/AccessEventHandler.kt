package com.liyaqa.platform.events.handler

import com.liyaqa.platform.events.model.PlatformEvent
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

@Component
class AccessEventHandler {
    private val logger = LoggerFactory.getLogger(AccessEventHandler::class.java)

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    fun handleImpersonationStarted(event: PlatformEvent.ImpersonationStarted) {
        logger.info(
            "Impersonation started: platform user {} ({}) impersonating user {} in tenant {}. Purpose: {}. Facility admin notification pending.",
            event.platformUserId, event.platformUserEmail, event.targetUserId, event.targetTenantId, event.purpose
        )
    }
}
