package com.liyaqa.notification.infrastructure.whatsapp

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Configuration

/**
 * Configuration properties for WhatsApp Business API integration.
 * WhatsApp is a primary communication channel in Saudi Arabia.
 */
@Configuration
@ConfigurationProperties(prefix = "whatsapp")
class WhatsAppConfig {
    /**
     * Whether WhatsApp notifications are enabled globally.
     */
    var enabled: Boolean = false

    /**
     * WhatsApp Cloud API base URL.
     */
    var apiUrl: String = "https://graph.facebook.com/v18.0"

    /**
     * WhatsApp Business Phone Number ID (from Meta Business Manager).
     */
    var phoneNumberId: String = ""

    /**
     * WhatsApp Cloud API access token.
     */
    var accessToken: String = ""

    /**
     * Webhook verify token for Meta webhook validation.
     */
    var webhookVerifyToken: String = ""

    /**
     * Default language for message templates.
     */
    var defaultLanguage: String = "ar"

    /**
     * Message retry settings.
     */
    var maxRetries: Int = 3

    /**
     * Delay between retries in milliseconds.
     */
    var retryDelayMs: Long = 5000
}
