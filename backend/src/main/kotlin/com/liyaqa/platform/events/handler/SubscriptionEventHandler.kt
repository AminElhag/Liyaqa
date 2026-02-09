package com.liyaqa.platform.events.handler

import com.liyaqa.platform.events.model.PlatformEvent
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

@Component
class SubscriptionEventHandler {
    private val logger = LoggerFactory.getLogger(SubscriptionEventHandler::class.java)

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    fun handleSubscriptionCancelled(event: PlatformEvent.SubscriptionCancelled) {
        logger.info(
            "Subscription cancelled for tenant {} (subscription: {}). Reason: {}. Account manager notification pending.",
            event.tenantId, event.subscriptionId, event.reason ?: "not specified"
        )
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Async
    fun handleSubscriptionRenewed(event: PlatformEvent.SubscriptionRenewed) {
        logger.info(
            "Subscription renewed for tenant {} (subscription: {}) until {}.",
            event.tenantId, event.subscriptionId, event.newPeriodEnd
        )
    }
}
