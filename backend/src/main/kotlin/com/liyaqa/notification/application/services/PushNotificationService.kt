package com.liyaqa.notification.application.services

import com.google.firebase.messaging.AndroidConfig
import com.google.firebase.messaging.AndroidNotification
import com.google.firebase.messaging.ApnsConfig
import com.google.firebase.messaging.Aps
import com.google.firebase.messaging.BatchResponse
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.messaging.FirebaseMessagingException
import com.google.firebase.messaging.Message
import com.google.firebase.messaging.MessagingErrorCode
import com.google.firebase.messaging.MulticastMessage
import com.google.firebase.messaging.Notification
import com.liyaqa.notification.domain.model.DeviceToken
import com.liyaqa.notification.domain.ports.DeviceTokenRepository
import com.liyaqa.shared.domain.LocalizedText
import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

data class PushPayload(
    val title: LocalizedText,
    val body: LocalizedText,
    val type: String? = null,
    val actionUrl: String? = null,
    val referenceId: UUID? = null,
    val referenceType: String? = null,
    val customData: Map<String, String> = emptyMap()
)

data class PushResult(
    val successCount: Int,
    val failureCount: Int,
    val invalidTokens: List<String>
)

@Service
@ConditionalOnBean(FirebaseMessaging::class)
class PushNotificationService(
    private val firebaseMessaging: FirebaseMessaging,
    private val deviceTokenRepository: DeviceTokenRepository
) {
    private val logger = LoggerFactory.getLogger(PushNotificationService::class.java)

    /**
     * Sends a push notification to a single device token.
     * @return true if sent successfully, false otherwise
     */
    fun sendToToken(token: String, payload: PushPayload, locale: String = "en"): Boolean {
        try {
            val message = buildMessage(token, payload, locale)
            val messageId = firebaseMessaging.send(message)
            logger.info("Push notification sent successfully. Message ID: $messageId")
            return true
        } catch (e: FirebaseMessagingException) {
            logger.error("Failed to send push notification: ${e.message}", e)
            handleMessagingError(e, token)
            return false
        } catch (e: Exception) {
            logger.error("Unexpected error sending push notification: ${e.message}", e)
            return false
        }
    }

    /**
     * Sends a push notification to all devices registered for a member.
     * @return PushResult with success/failure counts and invalid tokens
     */
    fun sendToMember(memberId: UUID, payload: PushPayload, locale: String = "en"): PushResult {
        val deviceTokens = deviceTokenRepository.findByMemberId(memberId)
        if (deviceTokens.isEmpty()) {
            logger.info("No device tokens found for member $memberId")
            return PushResult(0, 0, emptyList())
        }

        return sendToTokens(deviceTokens.map { it.token }, payload, locale)
    }

    /**
     * Sends a push notification to multiple device tokens (batch).
     * Uses Firebase multicast for efficiency.
     * @return PushResult with success/failure counts and invalid tokens
     */
    fun sendToTokens(tokens: List<String>, payload: PushPayload, locale: String = "en"): PushResult {
        if (tokens.isEmpty()) {
            return PushResult(0, 0, emptyList())
        }

        // Firebase multicast has a limit of 500 tokens per request
        val chunks = tokens.chunked(500)
        var totalSuccess = 0
        var totalFailure = 0
        val allInvalidTokens = mutableListOf<String>()

        for (chunk in chunks) {
            val result = sendMulticast(chunk, payload, locale)
            totalSuccess += result.successCount
            totalFailure += result.failureCount
            allInvalidTokens.addAll(result.invalidTokens)
        }

        // Clean up invalid tokens
        if (allInvalidTokens.isNotEmpty()) {
            cleanupInvalidTokens(allInvalidTokens)
        }

        return PushResult(totalSuccess, totalFailure, allInvalidTokens)
    }

    /**
     * Sends a push notification to all devices for a tenant (e.g., broadcast).
     */
    fun sendToTenant(tenantId: UUID, payload: PushPayload, locale: String = "en"): PushResult {
        val deviceTokens = deviceTokenRepository.findByTenantId(tenantId)
        if (deviceTokens.isEmpty()) {
            logger.info("No device tokens found for tenant $tenantId")
            return PushResult(0, 0, emptyList())
        }

        return sendToTokens(deviceTokens.map { it.token }, payload, locale)
    }

    private fun sendMulticast(tokens: List<String>, payload: PushPayload, locale: String): PushResult {
        try {
            val message = buildMulticastMessage(tokens, payload, locale)
            val response: BatchResponse = firebaseMessaging.sendEachForMulticast(message)

            val invalidTokens = mutableListOf<String>()

            response.responses.forEachIndexed { index, sendResponse ->
                if (!sendResponse.isSuccessful) {
                    val error = sendResponse.exception
                    if (error != null && isInvalidTokenError(error)) {
                        invalidTokens.add(tokens[index])
                    }
                    logger.debug("Failed to send to token ${tokens[index]}: ${error?.message}")
                }
            }

            logger.info(
                "Multicast push sent. Success: ${response.successCount}, Failure: ${response.failureCount}"
            )

            return PushResult(
                successCount = response.successCount,
                failureCount = response.failureCount,
                invalidTokens = invalidTokens
            )
        } catch (e: Exception) {
            logger.error("Failed to send multicast push: ${e.message}", e)
            return PushResult(0, tokens.size, emptyList())
        }
    }

    private fun buildMessage(token: String, payload: PushPayload, locale: String): Message {
        val title = payload.title.get(locale)
        val body = payload.body.get(locale)

        return Message.builder()
            .setToken(token)
            .setNotification(
                Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build()
            )
            .setAndroidConfig(buildAndroidConfig(title, body))
            .setApnsConfig(buildApnsConfig(title, body))
            .putAllData(buildDataPayload(payload))
            .build()
    }

    private fun buildMulticastMessage(
        tokens: List<String>,
        payload: PushPayload,
        locale: String
    ): MulticastMessage {
        val title = payload.title.get(locale)
        val body = payload.body.get(locale)

        return MulticastMessage.builder()
            .addAllTokens(tokens)
            .setNotification(
                Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build()
            )
            .setAndroidConfig(buildAndroidConfig(title, body))
            .setApnsConfig(buildApnsConfig(title, body))
            .putAllData(buildDataPayload(payload))
            .build()
    }

    private fun buildAndroidConfig(title: String, body: String): AndroidConfig {
        return AndroidConfig.builder()
            .setPriority(AndroidConfig.Priority.HIGH)
            .setNotification(
                AndroidNotification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .setClickAction("FLUTTER_NOTIFICATION_CLICK")
                    .setChannelId("liyaqa_notifications")
                    .build()
            )
            .build()
    }

    private fun buildApnsConfig(title: String, body: String): ApnsConfig {
        return ApnsConfig.builder()
            .setAps(
                Aps.builder()
                    .setAlert(
                        com.google.firebase.messaging.ApsAlert.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build()
                    )
                    .setSound("default")
                    .setBadge(1)
                    .build()
            )
            .build()
    }

    private fun buildDataPayload(payload: PushPayload): Map<String, String> {
        val data = mutableMapOf<String, String>()

        // Add localized content for client-side handling
        data["title_en"] = payload.title.en
        payload.title.ar?.let { data["title_ar"] = it }
        data["body_en"] = payload.body.en
        payload.body.ar?.let { data["body_ar"] = it }

        // Add notification metadata
        payload.type?.let { data["type"] = it }
        payload.actionUrl?.let { data["actionUrl"] = it }
        payload.referenceId?.let { data["referenceId"] = it.toString() }
        payload.referenceType?.let { data["referenceType"] = it }

        // Add custom data
        data.putAll(payload.customData)

        return data
    }

    private fun handleMessagingError(error: FirebaseMessagingException, token: String) {
        if (isInvalidTokenError(error)) {
            logger.info("Invalid token detected, scheduling for cleanup: $token")
            cleanupInvalidTokens(listOf(token))
        }
    }

    private fun isInvalidTokenError(error: FirebaseMessagingException): Boolean {
        return error.messagingErrorCode == MessagingErrorCode.INVALID_ARGUMENT ||
                error.messagingErrorCode == MessagingErrorCode.UNREGISTERED
    }

    @Transactional
    private fun cleanupInvalidTokens(tokens: List<String>) {
        for (token in tokens) {
            try {
                deviceTokenRepository.deleteByToken(token)
                logger.info("Cleaned up invalid device token")
            } catch (e: Exception) {
                logger.error("Failed to cleanup invalid token: ${e.message}")
            }
        }
    }
}
