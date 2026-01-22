package com.liyaqa.notification.infrastructure.whatsapp

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.notification.domain.model.Notification
import com.liyaqa.notification.domain.model.NotificationChannel
import com.liyaqa.notification.domain.model.NotificationType
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate

/**
 * Service for sending WhatsApp messages via Meta's WhatsApp Cloud API.
 * WhatsApp is a critical communication channel in Saudi Arabia with 73%+ penetration.
 */
@Service
@ConditionalOnProperty(name = ["whatsapp.enabled"], havingValue = "true", matchIfMissing = false)
class WhatsAppService(
    private val config: WhatsAppConfig,
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(WhatsAppService::class.java)
    private val restTemplate = RestTemplate()

    /**
     * Sends a templated WhatsApp message.
     *
     * @param phoneNumber Recipient phone number with country code (e.g., "966501234567")
     * @param templateName Pre-approved Meta template name
     * @param language Language code (ar, en)
     * @param variables Template variable values
     * @return Message ID if successful, null if failed
     */
    fun sendTemplateMessage(
        phoneNumber: String,
        templateName: String,
        language: String = "ar",
        variables: WhatsAppTemplates.TemplateVariables
    ): String? {
        if (!config.enabled) {
            logger.debug("WhatsApp is disabled, skipping message to $phoneNumber")
            return null
        }

        val formattedPhone = formatPhoneNumber(phoneNumber)

        val requestBody = buildTemplateRequest(formattedPhone, templateName, language, variables)

        return try {
            val response = sendRequest(requestBody)
            val messageId = extractMessageId(response)
            logger.info("WhatsApp template message sent successfully: $messageId to $formattedPhone")
            messageId
        } catch (e: Exception) {
            logger.error("Failed to send WhatsApp message to $formattedPhone: ${e.message}", e)
            null
        }
    }

    /**
     * Sends a direct text message (only allowed within 24h customer service window).
     *
     * @param phoneNumber Recipient phone number
     * @param text Message text
     * @return Message ID if successful, null if failed
     */
    fun sendTextMessage(phoneNumber: String, text: String): String? {
        if (!config.enabled) {
            logger.debug("WhatsApp is disabled, skipping text message to $phoneNumber")
            return null
        }

        val formattedPhone = formatPhoneNumber(phoneNumber)

        val requestBody = mapOf(
            "messaging_product" to "whatsapp",
            "recipient_type" to "individual",
            "to" to formattedPhone,
            "type" to "text",
            "text" to mapOf(
                "preview_url" to false,
                "body" to text
            )
        )

        return try {
            val response = sendRequest(requestBody)
            val messageId = extractMessageId(response)
            logger.info("WhatsApp text message sent successfully: $messageId to $formattedPhone")
            messageId
        } catch (e: Exception) {
            logger.error("Failed to send WhatsApp text message to $formattedPhone: ${e.message}", e)
            null
        }
    }

    /**
     * Sends a notification via WhatsApp if appropriate template exists.
     */
    fun sendNotification(
        notification: Notification,
        variables: WhatsAppTemplates.TemplateVariables,
        language: String = "ar"
    ): String? {
        val templateName = WhatsAppTemplates.getTemplateName(notification.notificationType, language)
            ?: run {
                logger.debug("No WhatsApp template for notification type: ${notification.notificationType}")
                return null
            }

        val phoneNumber = notification.recipientPhone ?: run {
            logger.warn("No phone number for notification: ${notification.id}")
            return null
        }

        return sendTemplateMessage(phoneNumber, templateName, language, variables)
    }

    /**
     * Formats phone number for WhatsApp API.
     * Ensures it has country code and removes any special characters.
     */
    private fun formatPhoneNumber(phone: String): String {
        var formatted = phone.replace(Regex("[^0-9]"), "")

        // If starts with 0, assume Saudi and add country code
        if (formatted.startsWith("0")) {
            formatted = "966" + formatted.substring(1)
        }

        // If doesn't start with country code, assume Saudi
        if (!formatted.startsWith("966") && formatted.length == 9) {
            formatted = "966$formatted"
        }

        return formatted
    }

    /**
     * Builds the template message request body.
     */
    private fun buildTemplateRequest(
        phoneNumber: String,
        templateName: String,
        language: String,
        variables: WhatsAppTemplates.TemplateVariables
    ): Map<String, Any> {
        val components = mutableListOf<Map<String, Any>>()

        val params = variables.toComponentList()
        if (params.isNotEmpty()) {
            components.add(
                mapOf(
                    "type" to "body",
                    "parameters" to params
                )
            )
        }

        return mapOf(
            "messaging_product" to "whatsapp",
            "recipient_type" to "individual",
            "to" to phoneNumber,
            "type" to "template",
            "template" to mapOf(
                "name" to templateName,
                "language" to mapOf("code" to language),
                "components" to components
            )
        )
    }

    /**
     * Sends request to WhatsApp Cloud API.
     */
    private fun sendRequest(requestBody: Map<String, Any>): Map<*, *> {
        val url = "${config.apiUrl}/${config.phoneNumberId}/messages"

        val headers = HttpHeaders().apply {
            contentType = MediaType.APPLICATION_JSON
            setBearerAuth(config.accessToken)
        }

        val jsonBody = objectMapper.writeValueAsString(requestBody)
        val entity = HttpEntity(jsonBody, headers)

        val response = restTemplate.exchange(url, HttpMethod.POST, entity, Map::class.java)

        return response.body ?: throw RuntimeException("Empty response from WhatsApp API")
    }

    /**
     * Extracts message ID from API response.
     */
    @Suppress("UNCHECKED_CAST")
    private fun extractMessageId(response: Map<*, *>): String? {
        val messages = response["messages"] as? List<Map<String, Any>> ?: return null
        return messages.firstOrNull()?.get("id") as? String
    }

    /**
     * Marks a message as read in WhatsApp.
     */
    fun markAsRead(messageId: String): Boolean {
        if (!config.enabled) return false

        val requestBody = mapOf(
            "messaging_product" to "whatsapp",
            "status" to "read",
            "message_id" to messageId
        )

        return try {
            sendRequest(requestBody)
            logger.debug("Marked WhatsApp message as read: $messageId")
            true
        } catch (e: Exception) {
            logger.warn("Failed to mark message as read: $messageId", e)
            false
        }
    }
}

/**
 * Fallback service when WhatsApp is disabled.
 */
@Service
@ConditionalOnProperty(name = ["whatsapp.enabled"], havingValue = "false", matchIfMissing = true)
class WhatsAppServiceDisabled : WhatsAppServiceInterface {
    private val logger = LoggerFactory.getLogger(WhatsAppServiceDisabled::class.java)

    override fun sendTemplateMessage(
        phoneNumber: String,
        templateName: String,
        language: String,
        variables: WhatsAppTemplates.TemplateVariables
    ): String? {
        logger.debug("WhatsApp is disabled, skipping message to $phoneNumber")
        return null
    }

    override fun sendTextMessage(phoneNumber: String, text: String): String? {
        logger.debug("WhatsApp is disabled, skipping text message to $phoneNumber")
        return null
    }
}

/**
 * Interface for WhatsApp service (enables dependency injection with disabled fallback).
 */
interface WhatsAppServiceInterface {
    fun sendTemplateMessage(
        phoneNumber: String,
        templateName: String,
        language: String = "ar",
        variables: WhatsAppTemplates.TemplateVariables
    ): String?

    fun sendTextMessage(phoneNumber: String, text: String): String?
}
