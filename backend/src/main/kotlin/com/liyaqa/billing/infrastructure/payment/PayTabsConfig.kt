package com.liyaqa.billing.infrastructure.payment

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Configuration

/**
 * Configuration properties for PayTabs payment gateway.
 *
 * PayTabs is a Saudi-focused payment gateway supporting:
 * - Credit/Debit cards (Visa, MasterCard)
 * - Mada (Saudi debit cards)
 * - Apple Pay
 * - STC Pay
 */
@Configuration
@ConfigurationProperties(prefix = "liyaqa.payment.paytabs")
class PayTabsConfig {
    /**
     * PayTabs merchant profile ID.
     */
    var profileId: String = ""

    /**
     * PayTabs server key for API authentication.
     */
    var serverKey: String = ""

    /**
     * PayTabs region (e.g., SAU for Saudi Arabia).
     */
    var region: String = "SAU"

    /**
     * Currency code for transactions (e.g., SAR).
     */
    var currency: String = "SAR"

    /**
     * Callback URL for payment notifications.
     */
    var callbackUrl: String = ""

    /**
     * Return URL after payment completion.
     */
    var returnUrl: String = ""

    /**
     * PayTabs API base URL based on region.
     */
    fun getApiBaseUrl(): String {
        return when (region.uppercase()) {
            "SAU" -> "https://secure.paytabs.sa"
            "ARE" -> "https://secure.paytabs.com"
            "EGY" -> "https://secure-egypt.paytabs.com"
            "OMN" -> "https://secure-oman.paytabs.com"
            "JOR" -> "https://secure-jordan.paytabs.com"
            "GLOBAL" -> "https://secure-global.paytabs.com"
            else -> "https://secure.paytabs.sa"
        }
    }

    /**
     * Checks if PayTabs is configured.
     */
    fun isConfigured(): Boolean {
        return profileId.isNotBlank() && serverKey.isNotBlank()
    }
}
