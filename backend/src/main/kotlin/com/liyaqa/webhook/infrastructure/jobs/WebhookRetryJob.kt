package com.liyaqa.webhook.infrastructure.jobs

import com.liyaqa.webhook.application.services.WebhookDeliveryService
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional

/**
 * Scheduled jobs for webhook delivery and retry processing.
 * Uses ShedLock to ensure jobs run only once across multiple instances.
 */
@Component
class WebhookRetryJob(
    private val deliveryService: WebhookDeliveryService
) {
    private val logger = LoggerFactory.getLogger(WebhookRetryJob::class.java)

    /**
     * Process pending webhook deliveries.
     * Runs every 30 seconds.
     */
    @Scheduled(fixedRate = 30000) // 30 seconds
    @SchedulerLock(name = "processWebhookDeliveries", lockAtLeastFor = "10s", lockAtMostFor = "5m")
    @Transactional
    fun processPendingDeliveries() {
        try {
            val processed = deliveryService.processPendingDeliveries(100)
            if (processed > 0) {
                logger.info("Processed $processed pending webhook deliveries")
            }
        } catch (e: Exception) {
            logger.error("Error processing pending webhook deliveries: ${e.message}", e)
        }
    }

    /**
     * Retry failed webhook deliveries.
     * Runs every minute.
     */
    @Scheduled(fixedRate = 60000) // 1 minute
    @SchedulerLock(name = "retryWebhookDeliveries", lockAtLeastFor = "10s", lockAtMostFor = "5m")
    @Transactional
    fun retryFailedDeliveries() {
        try {
            val retried = deliveryService.processRetries(50)
            if (retried > 0) {
                logger.info("Retried $retried failed webhook deliveries")
            }
        } catch (e: Exception) {
            logger.error("Error retrying failed webhook deliveries: ${e.message}", e)
        }
    }
}
