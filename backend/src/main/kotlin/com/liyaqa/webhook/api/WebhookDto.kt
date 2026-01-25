package com.liyaqa.webhook.api

import com.liyaqa.webhook.application.commands.CreateWebhookCommand
import com.liyaqa.webhook.application.commands.UpdateWebhookCommand
import com.liyaqa.webhook.domain.model.DeliveryStatus
import com.liyaqa.webhook.domain.model.Webhook
import com.liyaqa.webhook.domain.model.WebhookDelivery
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.Size
import java.time.Instant
import java.util.UUID

// ============ Request DTOs ============

data class CreateWebhookRequest(
    @field:NotBlank(message = "Name is required")
    @field:Size(max = 255, message = "Name must not exceed 255 characters")
    val name: String,

    @field:NotBlank(message = "URL is required")
    @field:Size(max = 2000, message = "URL must not exceed 2000 characters")
    val url: String,

    @field:NotEmpty(message = "At least one event must be selected")
    val events: List<String>,

    val headers: Map<String, String>? = null,

    val rateLimitPerMinute: Int = 60
) {
    fun toCommand() = CreateWebhookCommand(
        name = name,
        url = url,
        events = events,
        headers = headers,
        rateLimitPerMinute = rateLimitPerMinute
    )
}

data class UpdateWebhookRequest(
    @field:Size(max = 255, message = "Name must not exceed 255 characters")
    val name: String? = null,

    @field:Size(max = 2000, message = "URL must not exceed 2000 characters")
    val url: String? = null,

    val events: List<String>? = null,

    val headers: Map<String, String>? = null,

    val rateLimitPerMinute: Int? = null,

    val isActive: Boolean? = null
) {
    fun toCommand(id: UUID) = UpdateWebhookCommand(
        id = id,
        name = name,
        url = url,
        events = events,
        headers = headers,
        rateLimitPerMinute = rateLimitPerMinute,
        isActive = isActive
    )
}

data class TestWebhookRequest(
    val eventType: String? = null
)

// ============ Response DTOs ============

data class WebhookResponse(
    val id: UUID,
    val name: String,
    val url: String,
    val events: List<String>,
    val isActive: Boolean,
    val headers: Map<String, String>?,
    val rateLimitPerMinute: Int,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(webhook: Webhook) = WebhookResponse(
            id = webhook.id,
            name = webhook.name,
            url = webhook.url,
            events = webhook.events,
            isActive = webhook.isActive,
            headers = webhook.headers,
            rateLimitPerMinute = webhook.rateLimitPerMinute,
            createdAt = webhook.createdAt,
            updatedAt = webhook.updatedAt
        )
    }
}

data class WebhookWithSecretResponse(
    val id: UUID,
    val name: String,
    val url: String,
    val secret: String,
    val events: List<String>,
    val isActive: Boolean,
    val headers: Map<String, String>?,
    val rateLimitPerMinute: Int,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(webhook: Webhook) = WebhookWithSecretResponse(
            id = webhook.id,
            name = webhook.name,
            url = webhook.url,
            secret = webhook.secret,
            events = webhook.events,
            isActive = webhook.isActive,
            headers = webhook.headers,
            rateLimitPerMinute = webhook.rateLimitPerMinute,
            createdAt = webhook.createdAt,
            updatedAt = webhook.updatedAt
        )
    }
}

data class WebhookDeliveryResponse(
    val id: UUID,
    val webhookId: UUID,
    val eventType: String,
    val eventId: UUID,
    val status: DeliveryStatus,
    val attemptCount: Int,
    val nextRetryAt: Instant?,
    val lastResponseCode: Int?,
    val lastResponseBody: String?,
    val lastError: String?,
    val deliveredAt: Instant?,
    val createdAt: Instant
) {
    companion object {
        fun from(delivery: WebhookDelivery) = WebhookDeliveryResponse(
            id = delivery.id,
            webhookId = delivery.webhookId,
            eventType = delivery.eventType,
            eventId = delivery.eventId,
            status = delivery.status,
            attemptCount = delivery.attemptCount,
            nextRetryAt = delivery.nextRetryAt,
            lastResponseCode = delivery.lastResponseCode,
            lastResponseBody = delivery.lastResponseBody,
            lastError = delivery.lastError,
            deliveredAt = delivery.deliveredAt,
            createdAt = delivery.createdAt
        )
    }
}

data class WebhookDeliveryDetailResponse(
    val id: UUID,
    val webhookId: UUID,
    val eventType: String,
    val eventId: UUID,
    val payload: Map<String, Any?>,
    val status: DeliveryStatus,
    val attemptCount: Int,
    val nextRetryAt: Instant?,
    val lastResponseCode: Int?,
    val lastResponseBody: String?,
    val lastError: String?,
    val deliveredAt: Instant?,
    val createdAt: Instant
) {
    companion object {
        fun from(delivery: WebhookDelivery) = WebhookDeliveryDetailResponse(
            id = delivery.id,
            webhookId = delivery.webhookId,
            eventType = delivery.eventType,
            eventId = delivery.eventId,
            payload = delivery.payload,
            status = delivery.status,
            attemptCount = delivery.attemptCount,
            nextRetryAt = delivery.nextRetryAt,
            lastResponseCode = delivery.lastResponseCode,
            lastResponseBody = delivery.lastResponseBody,
            lastError = delivery.lastError,
            deliveredAt = delivery.deliveredAt,
            createdAt = delivery.createdAt
        )
    }
}

data class WebhookStatsResponse(
    val total: Long,
    val delivered: Long,
    val pending: Long,
    val failed: Long,
    val exhausted: Long
)

data class EventTypesResponse(
    val eventTypes: List<String>
)
