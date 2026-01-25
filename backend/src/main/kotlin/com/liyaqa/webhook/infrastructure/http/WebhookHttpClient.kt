package com.liyaqa.webhook.infrastructure.http

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.webhook.domain.model.Webhook
import com.liyaqa.webhook.domain.model.WebhookDelivery
import com.liyaqa.webhook.infrastructure.crypto.WebhookSignatureService
import org.slf4j.LoggerFactory
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration
import java.time.Instant

/**
 * Result of a webhook delivery attempt.
 */
data class DeliveryResult(
    val success: Boolean,
    val statusCode: Int?,
    val responseBody: String?,
    val error: String?
)

/**
 * HTTP client for delivering webhooks to external endpoints.
 */
@Service
class WebhookHttpClient(
    private val signatureService: WebhookSignatureService,
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(WebhookHttpClient::class.java)

    private val httpClient: HttpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10))
        .followRedirects(HttpClient.Redirect.NEVER)
        .build()

    companion object {
        private val REQUEST_TIMEOUT = Duration.ofSeconds(30)
        private const val USER_AGENT = "Liyaqa-Webhook/1.0"
    }

    /**
     * Deliver a webhook to the specified endpoint.
     */
    fun deliver(webhook: Webhook, delivery: WebhookDelivery): DeliveryResult {
        return try {
            val payload = objectMapper.writeValueAsString(mapOf(
                "id" to delivery.eventId.toString(),
                "type" to delivery.eventType,
                "created_at" to Instant.now().toString(),
                "data" to delivery.payload
            ))

            val signature = signatureService.generateSignature(payload, webhook.secret)

            val requestBuilder = HttpRequest.newBuilder()
                .uri(URI.create(webhook.url))
                .timeout(REQUEST_TIMEOUT)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .header(HttpHeaders.USER_AGENT, USER_AGENT)
                .header("X-Webhook-Signature", signature)
                .header("X-Webhook-Id", webhook.id.toString())
                .header("X-Webhook-Delivery-Id", delivery.id.toString())
                .header("X-Webhook-Event", delivery.eventType)
                .POST(HttpRequest.BodyPublishers.ofString(payload))

            // Add custom headers if configured
            webhook.headers?.forEach { (key, value) ->
                requestBuilder.header(key, value)
            }

            val request = requestBuilder.build()
            val response = httpClient.send(request, HttpResponse.BodyHandlers.ofString())

            val success = response.statusCode() in 200..299

            if (success) {
                logger.debug("Webhook delivered successfully to ${webhook.url}: ${response.statusCode()}")
            } else {
                logger.warn("Webhook delivery failed to ${webhook.url}: ${response.statusCode()}")
            }

            DeliveryResult(
                success = success,
                statusCode = response.statusCode(),
                responseBody = response.body()?.take(10000),
                error = if (!success) "HTTP ${response.statusCode()}" else null
            )
        } catch (e: Exception) {
            logger.error("Error delivering webhook to ${webhook.url}: ${e.message}")
            DeliveryResult(
                success = false,
                statusCode = null,
                responseBody = null,
                error = e.message ?: "Unknown error"
            )
        }
    }
}
