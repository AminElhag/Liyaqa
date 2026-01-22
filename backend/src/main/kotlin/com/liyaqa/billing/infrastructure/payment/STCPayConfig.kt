package com.liyaqa.billing.infrastructure.payment

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Configuration

/**
 * Configuration properties for STC Pay payment integration.
 *
 * STC Pay is Saudi Arabia's leading mobile wallet with 8+ million users.
 * It offers QR payments, P2P transfers, and merchant payments.
 */
@Configuration
@ConfigurationProperties(prefix = "liyaqa.payment.stcpay")
class STCPayConfig {
    /**
     * Whether STC Pay is globally enabled.
     */
    var enabled: Boolean = false

    /**
     * STC Pay API base URL.
     */
    var apiUrl: String = "https://api.stcpay.com.sa/v1"

    /**
     * STC Pay Merchant ID (global, can be overridden per club).
     */
    var merchantId: String = ""

    /**
     * STC Pay API Key.
     */
    var apiKey: String = ""

    /**
     * STC Pay Secret Key for HMAC signing.
     */
    var secretKey: String = ""

    /**
     * Callback URL for payment notifications.
     */
    var callbackUrl: String = ""

    /**
     * OTP expiry time in seconds.
     */
    var otpExpirySeconds: Int = 300

    /**
     * Checks if STC Pay is configured.
     */
    fun isConfigured(): Boolean {
        return enabled && merchantId.isNotBlank() && apiKey.isNotBlank() && secretKey.isNotBlank()
    }
}
