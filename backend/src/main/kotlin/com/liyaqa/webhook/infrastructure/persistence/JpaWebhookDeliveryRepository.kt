package com.liyaqa.webhook.infrastructure.persistence

import com.liyaqa.webhook.domain.model.DeliveryStatus
import com.liyaqa.webhook.domain.model.WebhookDelivery
import com.liyaqa.webhook.domain.ports.WebhookDeliveryRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository interface for WebhookDelivery.
 */
interface SpringDataWebhookDeliveryRepository : JpaRepository<WebhookDelivery, UUID> {
    fun findByWebhookId(webhookId: UUID, pageable: Pageable): Page<WebhookDelivery>
    fun findByStatus(status: DeliveryStatus, pageable: Pageable): Page<WebhookDelivery>
    fun countByWebhookId(webhookId: UUID): Long
    fun countByWebhookIdAndStatus(webhookId: UUID, status: DeliveryStatus): Long

    @Query("""
        SELECT d FROM WebhookDelivery d
        WHERE d.status = 'PENDING'
        ORDER BY d.createdAt ASC
    """)
    fun findPendingDeliveries(pageable: Pageable): List<WebhookDelivery>

    @Query("""
        SELECT d FROM WebhookDelivery d
        WHERE d.status = 'FAILED'
        AND d.nextRetryAt IS NOT NULL
        AND d.nextRetryAt <= :now
        ORDER BY d.nextRetryAt ASC
    """)
    fun findDeliveriesForRetry(@Param("now") now: Instant, pageable: Pageable): List<WebhookDelivery>

    @Modifying
    @Query("DELETE FROM WebhookDelivery d WHERE d.webhookId = :webhookId")
    fun deleteByWebhookId(@Param("webhookId") webhookId: UUID)
}

/**
 * JPA adapter implementing the domain port.
 */
@Repository
class JpaWebhookDeliveryRepository(
    private val springDataRepository: SpringDataWebhookDeliveryRepository
) : WebhookDeliveryRepository {

    override fun save(delivery: WebhookDelivery): WebhookDelivery {
        return springDataRepository.save(delivery)
    }

    override fun saveAll(deliveries: List<WebhookDelivery>): List<WebhookDelivery> {
        return springDataRepository.saveAll(deliveries)
    }

    override fun findById(id: UUID): Optional<WebhookDelivery> {
        return springDataRepository.findById(id)
    }

    override fun findByWebhookId(webhookId: UUID, pageable: Pageable): Page<WebhookDelivery> {
        return springDataRepository.findByWebhookId(webhookId, pageable)
    }

    override fun findByStatus(status: DeliveryStatus, pageable: Pageable): Page<WebhookDelivery> {
        return springDataRepository.findByStatus(status, pageable)
    }

    override fun findPendingDeliveries(limit: Int): List<WebhookDelivery> {
        return springDataRepository.findPendingDeliveries(PageRequest.of(0, limit))
    }

    override fun findDeliveriesForRetry(now: Instant, limit: Int): List<WebhookDelivery> {
        return springDataRepository.findDeliveriesForRetry(now, PageRequest.of(0, limit))
    }

    override fun countByWebhookId(webhookId: UUID): Long {
        return springDataRepository.countByWebhookId(webhookId)
    }

    override fun countByWebhookIdAndStatus(webhookId: UUID, status: DeliveryStatus): Long {
        return springDataRepository.countByWebhookIdAndStatus(webhookId, status)
    }

    override fun deleteByWebhookId(webhookId: UUID) {
        springDataRepository.deleteByWebhookId(webhookId)
    }
}
