package com.liyaqa.webhook.domain.model

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.AttributeConverter
import jakarta.persistence.Column
import jakarta.persistence.Convert
import jakarta.persistence.Converter
import jakarta.persistence.Entity
import jakarta.persistence.Table
import java.util.UUID

/**
 * Converter for storing a list of strings as a comma-separated string.
 */
@Converter
class StringListConverter : AttributeConverter<List<String>, String> {
    override fun convertToDatabaseColumn(attribute: List<String>?): String? {
        return attribute?.joinToString(",")
    }

    override fun convertToEntityAttribute(dbData: String?): List<String> {
        return dbData?.takeIf { it.isNotEmpty() }?.split(",") ?: emptyList()
    }
}

/**
 * Converter for storing a map as JSON string.
 */
@Converter
class StringMapConverter : AttributeConverter<Map<String, String>?, String?> {
    private val objectMapper = ObjectMapper()

    override fun convertToDatabaseColumn(attribute: Map<String, String>?): String? {
        return attribute?.let { objectMapper.writeValueAsString(it) }
    }

    override fun convertToEntityAttribute(dbData: String?): Map<String, String>? {
        return dbData?.let {
            objectMapper.readValue(it, object : TypeReference<Map<String, String>>() {})
        }
    }
}

/**
 * Webhook subscription for receiving event notifications.
 * Clubs can configure webhooks to receive real-time updates about various events.
 */
@Entity
@Table(name = "webhooks")
class Webhook(
    @Column(name = "name", nullable = false)
    var name: String,

    @Column(name = "url", nullable = false, length = 2000)
    var url: String,

    @Column(name = "secret", nullable = false)
    var secret: String,

    @Convert(converter = StringListConverter::class)
    @Column(name = "events", columnDefinition = "text", nullable = false)
    var events: List<String>,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Convert(converter = StringMapConverter::class)
    @Column(name = "headers", columnDefinition = "text")
    var headers: Map<String, String>? = null,

    @Column(name = "rate_limit_per_minute")
    var rateLimitPerMinute: Int = 60,

    id: UUID = UUID.randomUUID()
) : BaseEntity(id) {

    /**
     * Check if this webhook is subscribed to a specific event type.
     */
    fun isSubscribedTo(eventType: WebhookEventType): Boolean {
        return events.contains(eventType.value) || events.contains("*")
    }

    /**
     * Check if this webhook is subscribed to a specific event type string.
     */
    fun isSubscribedTo(eventTypeValue: String): Boolean {
        return events.contains(eventTypeValue) || events.contains("*")
    }

    /**
     * Activate the webhook.
     */
    fun activate() {
        isActive = true
    }

    /**
     * Deactivate the webhook.
     */
    fun deactivate() {
        isActive = false
    }

    /**
     * Update webhook configuration.
     */
    fun update(
        name: String? = null,
        url: String? = null,
        events: List<String>? = null,
        headers: Map<String, String>? = null,
        rateLimitPerMinute: Int? = null
    ) {
        name?.let { this.name = it }
        url?.let { this.url = it }
        events?.let { this.events = it }
        headers?.let { this.headers = it }
        rateLimitPerMinute?.let { this.rateLimitPerMinute = it }
    }

    /**
     * Regenerate the webhook secret.
     */
    fun regenerateSecret(newSecret: String) {
        this.secret = newSecret
    }
}
