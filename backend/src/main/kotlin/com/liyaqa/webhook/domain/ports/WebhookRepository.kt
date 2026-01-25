package com.liyaqa.webhook.domain.ports

import com.liyaqa.webhook.domain.model.Webhook
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

/**
 * Port interface for webhook persistence operations.
 */
interface WebhookRepository {
    fun save(webhook: Webhook): Webhook
    fun findById(id: UUID): Optional<Webhook>
    fun findAll(pageable: Pageable): Page<Webhook>
    fun findAllActive(): List<Webhook>
    fun findActiveByEventType(eventType: String): List<Webhook>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long
}
