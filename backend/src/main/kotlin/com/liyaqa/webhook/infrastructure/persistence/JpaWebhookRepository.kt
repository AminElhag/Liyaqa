package com.liyaqa.webhook.infrastructure.persistence

import com.liyaqa.webhook.domain.model.Webhook
import com.liyaqa.webhook.domain.ports.WebhookRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository interface for Webhook.
 */
interface SpringDataWebhookRepository : JpaRepository<Webhook, UUID> {
    fun findByIsActiveTrue(): List<Webhook>

    /**
     * Find all active webhooks subscribed to the given event type.
     * Events are stored as comma-separated values, so we use LIKE for matching.
     * Also matches webhooks subscribed to all events (*).
     */
    @Query("""
        SELECT w FROM Webhook w
        WHERE w.isActive = true
        AND (w.events LIKE CONCAT('%', :eventType, '%') OR w.events LIKE '%*%')
    """)
    fun findActiveByEventType(@Param("eventType") eventType: String): List<Webhook>
}

/**
 * JPA adapter implementing the domain port.
 */
@Repository
class JpaWebhookRepository(
    private val springDataRepository: SpringDataWebhookRepository
) : WebhookRepository {

    override fun save(webhook: Webhook): Webhook {
        return springDataRepository.save(webhook)
    }

    override fun findById(id: UUID): Optional<Webhook> {
        return springDataRepository.findById(id)
    }

    override fun findAll(pageable: Pageable): Page<Webhook> {
        return springDataRepository.findAll(pageable)
    }

    override fun findAllActive(): List<Webhook> {
        return springDataRepository.findByIsActiveTrue()
    }

    override fun findActiveByEventType(eventType: String): List<Webhook> {
        return springDataRepository.findActiveByEventType(eventType)
    }

    override fun existsById(id: UUID): Boolean {
        return springDataRepository.existsById(id)
    }

    override fun deleteById(id: UUID) {
        springDataRepository.deleteById(id)
    }

    override fun count(): Long {
        return springDataRepository.count()
    }
}
