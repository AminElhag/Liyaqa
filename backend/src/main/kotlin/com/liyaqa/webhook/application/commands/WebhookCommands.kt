package com.liyaqa.webhook.application.commands

import java.util.UUID

/**
 * Command to create a new webhook subscription.
 */
data class CreateWebhookCommand(
    val name: String,
    val url: String,
    val events: List<String>,
    val headers: Map<String, String>? = null,
    val rateLimitPerMinute: Int = 60
)

/**
 * Command to update an existing webhook.
 */
data class UpdateWebhookCommand(
    val id: UUID,
    val name: String? = null,
    val url: String? = null,
    val events: List<String>? = null,
    val headers: Map<String, String>? = null,
    val rateLimitPerMinute: Int? = null,
    val isActive: Boolean? = null
)

/**
 * Command to trigger a test webhook delivery.
 */
data class TestWebhookCommand(
    val webhookId: UUID,
    val eventType: String? = null
)

/**
 * Data representing a webhook event to be delivered.
 */
data class WebhookEventData(
    val eventType: String,
    val eventId: UUID,
    val payload: Map<String, Any?>,
    val tenantId: UUID
)
