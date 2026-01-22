package com.liyaqa.billing.infrastructure.payment

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Configuration

/**
 * Configuration properties for SADAD bill payment integration.
 *
 * SADAD is Saudi Arabia's official bill payment system, regulated by SAMA.
 * It allows customers to pay bills through any Saudi bank's online/mobile banking.
 * Over 170+ billers are registered with SADAD including utilities, government, telecom.
 */
@Configuration
@ConfigurationProperties(prefix = "liyaqa.payment.sadad")
class SadadConfig {
    /**
     * Whether SADAD is globally enabled.
     */
    var enabled: Boolean = false

    /**
     * SADAD API base URL.
     */
    var apiUrl: String = "https://api.sadad.com/v1"

    /**
     * SADAD Biller Code assigned by SAMA (global, can be overridden per club).
     */
    var billerCode: String = ""

    /**
     * SADAD API Key.
     */
    var apiKey: String = ""

    /**
     * SADAD Secret Key for signing.
     */
    var secretKey: String = ""

    /**
     * Bank Code for SADAD integration.
     */
    var bankCode: String = ""

    /**
     * Callback URL for payment notifications.
     */
    var callbackUrl: String = ""

    /**
     * Default bill validity period in days.
     */
    var billValidityDays: Int = 30

    /**
     * Checks if SADAD is configured.
     */
    fun isConfigured(): Boolean {
        return enabled && billerCode.isNotBlank() && apiKey.isNotBlank() && secretKey.isNotBlank()
    }
}
