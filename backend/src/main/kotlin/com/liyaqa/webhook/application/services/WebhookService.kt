package com.liyaqa.webhook.application.services

import com.liyaqa.webhook.application.commands.CreateWebhookCommand
import com.liyaqa.webhook.application.commands.UpdateWebhookCommand
import com.liyaqa.webhook.domain.model.Webhook
import com.liyaqa.webhook.domain.model.WebhookEventType
import com.liyaqa.webhook.domain.ports.WebhookRepository
import com.liyaqa.webhook.infrastructure.crypto.WebhookSignatureService
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Service for managing webhook subscriptions.
 */
@Service
@Transactional
class WebhookService(
    private val webhookRepository: WebhookRepository,
    private val signatureService: WebhookSignatureService
) {
    private val logger = LoggerFactory.getLogger(WebhookService::class.java)

    /**
     * Create a new webhook subscription.
     */
    fun createWebhook(command: CreateWebhookCommand): Webhook {
        validateUrl(command.url)
        validateEvents(command.events)

        val webhook = Webhook(
            name = command.name,
            url = command.url,
            secret = signatureService.generateSecret(),
            events = command.events,
            headers = command.headers,
            rateLimitPerMinute = command.rateLimitPerMinute
        )

        val saved = webhookRepository.save(webhook)
        logger.info("Created webhook ${saved.id} for events: ${command.events}")
        return saved
    }

    /**
     * Update an existing webhook.
     */
    fun updateWebhook(command: UpdateWebhookCommand): Webhook {
        val webhook = webhookRepository.findById(command.id)
            .orElseThrow { NoSuchElementException("Webhook not found: ${command.id}") }

        command.url?.let { validateUrl(it) }
        command.events?.let { validateEvents(it) }

        webhook.update(
            name = command.name,
            url = command.url,
            events = command.events,
            headers = command.headers,
            rateLimitPerMinute = command.rateLimitPerMinute
        )

        command.isActive?.let {
            if (it) webhook.activate() else webhook.deactivate()
        }

        val saved = webhookRepository.save(webhook)
        logger.info("Updated webhook ${saved.id}")
        return saved
    }

    /**
     * Get a webhook by ID.
     */
    @Transactional(readOnly = true)
    fun getWebhook(id: UUID): Webhook {
        return webhookRepository.findById(id)
            .orElseThrow { NoSuchElementException("Webhook not found: $id") }
    }

    /**
     * List all webhooks with pagination.
     */
    @Transactional(readOnly = true)
    fun listWebhooks(pageable: Pageable): Page<Webhook> {
        return webhookRepository.findAll(pageable)
    }

    /**
     * Delete a webhook.
     */
    fun deleteWebhook(id: UUID) {
        if (!webhookRepository.existsById(id)) {
            throw NoSuchElementException("Webhook not found: $id")
        }
        webhookRepository.deleteById(id)
        logger.info("Deleted webhook $id")
    }

    /**
     * Activate a webhook.
     */
    fun activateWebhook(id: UUID): Webhook {
        val webhook = getWebhook(id)
        webhook.activate()
        return webhookRepository.save(webhook)
    }

    /**
     * Deactivate a webhook.
     */
    fun deactivateWebhook(id: UUID): Webhook {
        val webhook = getWebhook(id)
        webhook.deactivate()
        return webhookRepository.save(webhook)
    }

    /**
     * Regenerate webhook secret.
     */
    fun regenerateSecret(id: UUID): Webhook {
        val webhook = getWebhook(id)
        webhook.regenerateSecret(signatureService.generateSecret())
        val saved = webhookRepository.save(webhook)
        logger.info("Regenerated secret for webhook $id")
        return saved
    }

    /**
     * Find all active webhooks subscribed to a specific event type.
     */
    @Transactional(readOnly = true)
    fun findActiveWebhooksForEvent(eventType: String): List<Webhook> {
        return webhookRepository.findActiveByEventType(eventType)
    }

    /**
     * Get all available event types.
     */
    fun getAvailableEventTypes(): List<String> {
        return WebhookEventType.allValues()
    }

    private fun validateUrl(url: String) {
        require(url.startsWith("https://") || url.startsWith("http://localhost")) {
            "Webhook URL must use HTTPS (except for localhost)"
        }
        require(url.length <= 2000) {
            "Webhook URL must not exceed 2000 characters"
        }
    }

    private fun validateEvents(events: List<String>) {
        require(events.isNotEmpty()) {
            "At least one event type must be specified"
        }
        val validEvents = WebhookEventType.allValues() + "*"
        events.forEach { event ->
            require(event in validEvents) {
                "Invalid event type: $event. Valid types are: $validEvents"
            }
        }
    }
}
