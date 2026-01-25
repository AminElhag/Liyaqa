package com.liyaqa.webhook.application.services

import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import com.liyaqa.webhook.application.commands.WebhookEventData
import com.liyaqa.webhook.domain.model.DeliveryStatus
import com.liyaqa.webhook.domain.model.WebhookDelivery
import com.liyaqa.webhook.domain.ports.WebhookDeliveryRepository
import com.liyaqa.webhook.domain.ports.WebhookRepository
import com.liyaqa.webhook.infrastructure.http.WebhookHttpClient
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

/**
 * Service for managing webhook deliveries and event dispatching.
 */
@Service
class WebhookDeliveryService(
    private val webhookRepository: WebhookRepository,
    private val deliveryRepository: WebhookDeliveryRepository,
    private val httpClient: WebhookHttpClient
) {
    private val logger = LoggerFactory.getLogger(WebhookDeliveryService::class.java)

    /**
     * Queue a webhook event for delivery to all subscribed webhooks.
     */
    @Transactional
    fun queueEvent(eventData: WebhookEventData) {
        // Set tenant context for async processing
        TenantContext.setCurrentTenant(TenantId(eventData.tenantId))

        try {
            val webhooks = webhookRepository.findActiveByEventType(eventData.eventType)

            if (webhooks.isEmpty()) {
                logger.debug("No webhooks subscribed to event: ${eventData.eventType}")
                return
            }

            val deliveries = webhooks.map { webhook ->
                WebhookDelivery(
                    webhookId = webhook.id,
                    eventType = eventData.eventType,
                    eventId = eventData.eventId,
                    payload = eventData.payload
                )
            }

            deliveryRepository.saveAll(deliveries)
            logger.info("Queued ${deliveries.size} webhook deliveries for event ${eventData.eventType}")
        } finally {
            TenantContext.clear()
        }
    }

    /**
     * Process pending webhook deliveries.
     * Called by scheduled job.
     */
    @Transactional
    fun processPendingDeliveries(batchSize: Int = 100): Int {
        val deliveries = deliveryRepository.findPendingDeliveries(batchSize)
        var processedCount = 0

        for (delivery in deliveries) {
            try {
                processDelivery(delivery)
                processedCount++
            } catch (e: Exception) {
                logger.error("Error processing delivery ${delivery.id}: ${e.message}")
            }
        }

        return processedCount
    }

    /**
     * Process deliveries eligible for retry.
     * Called by scheduled job.
     */
    @Transactional
    fun processRetries(batchSize: Int = 100): Int {
        val deliveries = deliveryRepository.findDeliveriesForRetry(Instant.now(), batchSize)
        var processedCount = 0

        for (delivery in deliveries) {
            try {
                processDelivery(delivery)
                processedCount++
            } catch (e: Exception) {
                logger.error("Error retrying delivery ${delivery.id}: ${e.message}")
            }
        }

        return processedCount
    }

    /**
     * Process a single webhook delivery.
     */
    @Transactional
    fun processDelivery(delivery: WebhookDelivery) {
        val webhook = webhookRepository.findById(delivery.webhookId).orElse(null)

        if (webhook == null) {
            logger.warn("Webhook ${delivery.webhookId} not found, marking delivery as exhausted")
            delivery.markFailed(null, null, "Webhook not found")
            deliveryRepository.save(delivery)
            return
        }

        if (!webhook.isActive) {
            logger.debug("Webhook ${webhook.id} is inactive, skipping delivery")
            delivery.markFailed(null, null, "Webhook is inactive")
            deliveryRepository.save(delivery)
            return
        }

        delivery.startDelivery()
        deliveryRepository.save(delivery)

        val result = httpClient.deliver(webhook, delivery)

        if (result.success) {
            delivery.markDelivered(result.statusCode!!, result.responseBody)
        } else {
            delivery.markFailed(result.statusCode, result.responseBody, result.error)
        }

        deliveryRepository.save(delivery)
    }

    /**
     * Send a test webhook to verify endpoint connectivity.
     */
    @Transactional
    fun sendTestWebhook(webhookId: UUID, eventType: String = "test.ping"): WebhookDelivery {
        val webhook = webhookRepository.findById(webhookId)
            .orElseThrow { NoSuchElementException("Webhook not found: $webhookId") }

        val delivery = WebhookDelivery(
            webhookId = webhook.id,
            eventType = eventType,
            eventId = UUID.randomUUID(),
            payload = mapOf(
                "message" to "This is a test webhook delivery",
                "timestamp" to Instant.now().toString()
            )
        )

        deliveryRepository.save(delivery)

        // Process immediately
        processDelivery(delivery)

        return deliveryRepository.findById(delivery.id).orElse(delivery)
    }

    /**
     * Manually retry a failed delivery.
     */
    @Transactional
    fun retryDelivery(deliveryId: UUID): WebhookDelivery {
        val delivery = deliveryRepository.findById(deliveryId)
            .orElseThrow { NoSuchElementException("Delivery not found: $deliveryId") }

        require(delivery.status == DeliveryStatus.FAILED || delivery.status == DeliveryStatus.EXHAUSTED) {
            "Only failed deliveries can be retried"
        }

        delivery.scheduleManualRetry()
        deliveryRepository.save(delivery)

        // Process immediately
        processDelivery(delivery)

        return deliveryRepository.findById(delivery.id).orElse(delivery)
    }

    /**
     * Get delivery history for a webhook.
     */
    @Transactional(readOnly = true)
    fun getDeliveryHistory(webhookId: UUID, pageable: Pageable): Page<WebhookDelivery> {
        return deliveryRepository.findByWebhookId(webhookId, pageable)
    }

    /**
     * Get a specific delivery by ID.
     */
    @Transactional(readOnly = true)
    fun getDelivery(deliveryId: UUID): WebhookDelivery {
        return deliveryRepository.findById(deliveryId)
            .orElseThrow { NoSuchElementException("Delivery not found: $deliveryId") }
    }

    /**
     * Get delivery statistics for a webhook.
     */
    @Transactional(readOnly = true)
    fun getDeliveryStats(webhookId: UUID): Map<String, Long> {
        return mapOf(
            "total" to deliveryRepository.countByWebhookId(webhookId),
            "delivered" to deliveryRepository.countByWebhookIdAndStatus(webhookId, DeliveryStatus.DELIVERED),
            "pending" to deliveryRepository.countByWebhookIdAndStatus(webhookId, DeliveryStatus.PENDING),
            "failed" to deliveryRepository.countByWebhookIdAndStatus(webhookId, DeliveryStatus.FAILED),
            "exhausted" to deliveryRepository.countByWebhookIdAndStatus(webhookId, DeliveryStatus.EXHAUSTED)
        )
    }
}
