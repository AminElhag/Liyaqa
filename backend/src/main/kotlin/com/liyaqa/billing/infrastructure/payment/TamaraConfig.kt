package com.liyaqa.billing.infrastructure.payment

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Configuration

/**
 * Configuration properties for Tamara BNPL (Buy Now Pay Later) integration.
 *
 * Tamara is Saudi Arabia's leading BNPL service, allowing customers to:
 * - Split payments into 3 or 4 interest-free installments
 * - Pay over 30 days (Pay in 30)
 * - Spread larger purchases over longer terms
 *
 * Popular for:
 * - Annual gym memberships (split into manageable payments)
 * - Personal training packages
 * - Premium membership upgrades
 */
@Configuration
@ConfigurationProperties(prefix = "liyaqa.payment.tamara")
class TamaraConfig {
    /**
     * Whether Tamara is globally enabled.
     */
    var enabled: Boolean = false

    /**
     * Tamara API base URL.
     */
    var apiUrl: String = "https://api.tamara.co"

    /**
     * Tamara API Token.
     */
    var apiToken: String = ""

    /**
     * Tamara Merchant Public Key.
     */
    var publicKey: String = ""

    /**
     * Webhook notification URL.
     */
    var notificationUrl: String = ""

    /**
     * Success redirect URL after payment.
     */
    var successUrl: String = ""

    /**
     * Failure redirect URL after payment.
     */
    var failureUrl: String = ""

    /**
     * Cancel redirect URL.
     */
    var cancelUrl: String = ""

    /**
     * Minimum order amount for Tamara (in SAR).
     */
    var minAmount: Int = 100

    /**
     * Maximum order amount for Tamara (in SAR).
     */
    var maxAmount: Int = 5000

    /**
     * Default number of installments.
     */
    var defaultInstalments: Int = 3

    /**
     * Checks if Tamara is configured.
     */
    fun isConfigured(): Boolean {
        return enabled && apiToken.isNotBlank() && publicKey.isNotBlank()
    }

    /**
     * Checks if an amount is eligible for Tamara.
     */
    fun isAmountEligible(amount: Int): Boolean {
        return amount >= minAmount && amount <= maxAmount
    }
}
