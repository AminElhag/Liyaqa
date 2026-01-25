package com.liyaqa.webhook.domain.model

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.AttributeConverter
import jakarta.persistence.Column
import jakarta.persistence.Convert
import jakarta.persistence.Converter
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * Converter for storing a map as JSON string.
 */
@Converter
class PayloadMapConverter : AttributeConverter<Map<String, Any?>, String> {
    private val objectMapper = ObjectMapper()

    override fun convertToDatabaseColumn(attribute: Map<String, Any?>?): String {
        return attribute?.let { objectMapper.writeValueAsString(it) } ?: "{}"
    }

    override fun convertToEntityAttribute(dbData: String?): Map<String, Any?> {
        return dbData?.let {
            objectMapper.readValue(it, object : TypeReference<Map<String, Any?>>() {})
        } ?: emptyMap()
    }
}

/**
 * Tracks individual webhook delivery attempts.
 * Supports retry logic with exponential backoff.
 */
@Entity
@Table(name = "webhook_deliveries")
class WebhookDelivery(
    @Column(name = "webhook_id", nullable = false)
    val webhookId: UUID,

    @Column(name = "event_type", nullable = false, length = 100)
    val eventType: String,

    @Column(name = "event_id", nullable = false)
    val eventId: UUID,

    @Convert(converter = PayloadMapConverter::class)
    @Column(name = "payload", columnDefinition = "text", nullable = false)
    val payload: Map<String, Any?>,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    var status: DeliveryStatus = DeliveryStatus.PENDING,

    @Column(name = "attempt_count", nullable = false)
    var attemptCount: Int = 0,

    @Column(name = "next_retry_at")
    var nextRetryAt: Instant? = null,

    @Column(name = "last_response_code")
    var lastResponseCode: Int? = null,

    @Column(name = "last_response_body", columnDefinition = "TEXT")
    var lastResponseBody: String? = null,

    @Column(name = "last_error", columnDefinition = "TEXT")
    var lastError: String? = null,

    @Column(name = "delivered_at")
    var deliveredAt: Instant? = null,

    id: UUID = UUID.randomUUID()
) : BaseEntity(id) {

    companion object {
        const val MAX_RETRY_ATTEMPTS = 5
        private val RETRY_DELAYS_SECONDS = listOf(60L, 300L, 900L, 3600L, 7200L) // 1min, 5min, 15min, 1hr, 2hr
    }

    /**
     * Mark delivery as in progress.
     */
    fun startDelivery() {
        status = DeliveryStatus.IN_PROGRESS
        attemptCount++
    }

    /**
     * Mark delivery as successful.
     */
    fun markDelivered(responseCode: Int, responseBody: String?) {
        status = DeliveryStatus.DELIVERED
        lastResponseCode = responseCode
        lastResponseBody = responseBody?.take(10000) // Limit stored response
        deliveredAt = Instant.now()
        nextRetryAt = null
        lastError = null
    }

    /**
     * Mark delivery as failed and schedule retry if applicable.
     */
    fun markFailed(responseCode: Int?, responseBody: String?, error: String?) {
        lastResponseCode = responseCode
        lastResponseBody = responseBody?.take(10000)
        lastError = error?.take(2000)

        if (attemptCount >= MAX_RETRY_ATTEMPTS) {
            status = DeliveryStatus.EXHAUSTED
            nextRetryAt = null
        } else {
            status = DeliveryStatus.FAILED
            // Exponential backoff
            val delayIndex = (attemptCount - 1).coerceIn(0, RETRY_DELAYS_SECONDS.size - 1)
            nextRetryAt = Instant.now().plusSeconds(RETRY_DELAYS_SECONDS[delayIndex])
        }
    }

    /**
     * Check if this delivery is eligible for retry.
     */
    fun isEligibleForRetry(): Boolean {
        return status == DeliveryStatus.FAILED &&
            attemptCount < MAX_RETRY_ATTEMPTS &&
            nextRetryAt != null &&
            Instant.now().isAfter(nextRetryAt)
    }

    /**
     * Reset for manual retry.
     */
    fun scheduleManualRetry() {
        if (status == DeliveryStatus.EXHAUSTED || status == DeliveryStatus.FAILED) {
            status = DeliveryStatus.PENDING
            nextRetryAt = Instant.now()
        }
    }
}
