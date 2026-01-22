package com.liyaqa.notification.infrastructure.whatsapp

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.notification.domain.model.NotificationStatus
import com.liyaqa.notification.domain.ports.NotificationRepository
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

/**
 * Webhook controller for receiving WhatsApp status updates and incoming messages.
 * Meta sends webhook events for message delivery status, read receipts, and incoming messages.
 */
@RestController
@RequestMapping("/api/webhooks/whatsapp")
@Tag(name = "WhatsApp Webhook", description = "WhatsApp Business API webhook endpoints")
class WhatsAppWebhookController(
    private val config: WhatsAppConfig,
    private val notificationRepository: NotificationRepository,
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(WhatsAppWebhookController::class.java)

    /**
     * Webhook verification endpoint.
     * Meta sends a GET request to verify the webhook URL during setup.
     */
    @GetMapping
    @Operation(summary = "Verify WhatsApp webhook")
    fun verifyWebhook(
        @RequestParam("hub.mode") mode: String?,
        @RequestParam("hub.verify_token") verifyToken: String?,
        @RequestParam("hub.challenge") challenge: String?
    ): ResponseEntity<String> {
        logger.info("WhatsApp webhook verification request: mode=$mode")

        if (mode == "subscribe" && verifyToken == config.webhookVerifyToken) {
            logger.info("WhatsApp webhook verified successfully")
            return ResponseEntity.ok(challenge ?: "")
        }

        logger.warn("WhatsApp webhook verification failed: invalid token")
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Verification failed")
    }

    /**
     * Webhook event handler.
     * Receives message status updates and incoming messages from Meta.
     */
    @PostMapping
    @Operation(summary = "Handle WhatsApp webhook events")
    fun handleWebhook(@RequestBody payload: String): ResponseEntity<String> {
        logger.debug("WhatsApp webhook received: $payload")

        try {
            val json = objectMapper.readTree(payload)
            val entries = json.get("entry") ?: return ResponseEntity.ok("OK")

            for (entry in entries) {
                val changes = entry.get("changes") ?: continue

                for (change in changes) {
                    val value = change.get("value") ?: continue
                    val field = change.get("field")?.asText()

                    when (field) {
                        "messages" -> handleMessages(value)
                        else -> logger.debug("Unhandled webhook field: $field")
                    }
                }
            }

            return ResponseEntity.ok("OK")
        } catch (e: Exception) {
            logger.error("Error processing WhatsApp webhook: ${e.message}", e)
            // Return 200 to prevent Meta from retrying
            return ResponseEntity.ok("OK")
        }
    }

    /**
     * Handles incoming messages and status updates.
     */
    private fun handleMessages(value: JsonNode) {
        // Handle message status updates
        val statuses = value.get("statuses")
        if (statuses != null) {
            for (status in statuses) {
                handleStatusUpdate(status)
            }
        }

        // Handle incoming messages (for future interactive features)
        val messages = value.get("messages")
        if (messages != null) {
            for (message in messages) {
                handleIncomingMessage(message)
            }
        }
    }

    /**
     * Handles message status updates (sent, delivered, read, failed).
     */
    private fun handleStatusUpdate(status: JsonNode) {
        val messageId = status.get("id")?.asText() ?: return
        val statusType = status.get("status")?.asText() ?: return
        val timestamp = status.get("timestamp")?.asText()

        logger.info("WhatsApp status update: messageId=$messageId, status=$statusType")

        // Find notification by WhatsApp message ID and update status
        val notification = notificationRepository.findByWhatsAppMessageId(messageId)
        if (notification != null) {
            when (statusType) {
                "sent" -> {
                    notification.whatsappStatus = "SENT"
                    // Already marked as sent when we received the API response
                }
                "delivered" -> {
                    notification.whatsappStatus = "DELIVERED"
                    if (notification.status == NotificationStatus.SENT) {
                        notification.markDelivered()
                    }
                }
                "read" -> {
                    notification.whatsappStatus = "READ"
                    if (notification.status == NotificationStatus.SENT ||
                        notification.status == NotificationStatus.DELIVERED) {
                        notification.markRead()
                    }
                }
                "failed" -> {
                    notification.whatsappStatus = "FAILED"
                    val errors = status.get("errors")
                    val errorMessage = errors?.firstOrNull()?.get("message")?.asText() ?: "Unknown error"
                    notification.markFailed("WhatsApp delivery failed: $errorMessage")
                }
            }
            notificationRepository.save(notification)
            logger.debug("Updated notification ${notification.id} status to ${notification.status}")
        } else {
            logger.debug("No notification found for WhatsApp message: $messageId")
        }
    }

    /**
     * Handles incoming messages from users.
     * Can be extended to support interactive features like:
     * - Booking confirmations
     * - Quick replies
     * - Button responses
     */
    private fun handleIncomingMessage(message: JsonNode) {
        val messageId = message.get("id")?.asText()
        val from = message.get("from")?.asText()
        val type = message.get("type")?.asText()
        val timestamp = message.get("timestamp")?.asText()

        logger.info("Incoming WhatsApp message: from=$from, type=$type, id=$messageId")

        when (type) {
            "text" -> {
                val text = message.get("text")?.get("body")?.asText()
                logger.info("Received text message from $from: $text")
                // Future: Process text commands or auto-replies
            }
            "button" -> {
                val button = message.get("button")
                val buttonText = button?.get("text")?.asText()
                val buttonPayload = button?.get("payload")?.asText()
                logger.info("Received button response from $from: $buttonText (payload: $buttonPayload)")
                // Future: Process button responses for confirmations
            }
            "interactive" -> {
                val interactive = message.get("interactive")
                val interactiveType = interactive?.get("type")?.asText()
                logger.info("Received interactive response from $from: type=$interactiveType")
                // Future: Process interactive list/button responses
            }
            else -> {
                logger.debug("Unhandled message type: $type")
            }
        }

        // Future enhancements:
        // 1. Auto-reply during business hours
        // 2. Process booking confirmations ("CONFIRM" / "CANCEL")
        // 3. Handle membership inquiries
        // 4. Forward to support staff
    }
}
