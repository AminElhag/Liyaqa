package com.liyaqa.notification.infrastructure.sms

/**
 * Interface for SMS sending services.
 * Implementations can use different providers (Twilio, Unifonic, etc.)
 */
interface SmsService {
    /**
     * Sends an SMS message to the specified phone number.
     * @param to The recipient phone number (E.164 format, e.g., +966501234567)
     * @param message The message content
     * @return The message ID from the provider, or null if unavailable
     * @throws SmsSendException if sending fails
     */
    fun send(to: String, message: String): String?

    /**
     * Checks if the SMS service is available and configured.
     */
    fun isAvailable(): Boolean

    /**
     * Gets the name of the SMS provider.
     */
    fun getProviderName(): String
}

/**
 * Exception thrown when SMS sending fails.
 */
class SmsSendException(
    message: String,
    cause: Throwable? = null
) : RuntimeException(message, cause)

/**
 * Result of sending an SMS.
 */
data class SmsResult(
    val success: Boolean,
    val messageId: String? = null,
    val errorMessage: String? = null
)
