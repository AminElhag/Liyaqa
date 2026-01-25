package com.liyaqa.webhook.domain.ports

import com.liyaqa.webhook.domain.model.DeliveryStatus
import com.liyaqa.webhook.domain.model.WebhookDelivery
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.Optional
import java.util.UUID

/**
 * Port interface for webhook delivery persistence operations.
 */
interface WebhookDeliveryRepository {
    fun save(delivery: WebhookDelivery): WebhookDelivery
    fun saveAll(deliveries: List<WebhookDelivery>): List<WebhookDelivery>
    fun findById(id: UUID): Optional<WebhookDelivery>
    fun findByWebhookId(webhookId: UUID, pageable: Pageable): Page<WebhookDelivery>
    fun findByStatus(status: DeliveryStatus, pageable: Pageable): Page<WebhookDelivery>
    fun findPendingDeliveries(limit: Int): List<WebhookDelivery>
    fun findDeliveriesForRetry(now: Instant, limit: Int): List<WebhookDelivery>
    fun countByWebhookId(webhookId: UUID): Long
    fun countByWebhookIdAndStatus(webhookId: UUID, status: DeliveryStatus): Long
    fun deleteByWebhookId(webhookId: UUID)
}
