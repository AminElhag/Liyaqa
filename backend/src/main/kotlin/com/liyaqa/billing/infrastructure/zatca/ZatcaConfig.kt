package com.liyaqa.billing.infrastructure.zatca

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Configuration

/**
 * Configuration properties for Zatca e-invoicing compliance.
 *
 * ZATCA (Zakat, Tax and Customs Authority) is the Saudi tax authority.
 * Phase 1 compliance requires generating QR codes with seller information.
 */
@Configuration
@ConfigurationProperties(prefix = "liyaqa.zatca")
class ZatcaConfig {
    /**
     * Seller/business name to display on invoices.
     */
    var sellerName: String = ""

    /**
     * VAT registration number (required for Zatca compliance).
     */
    var vatRegistrationNumber: String = ""

    /**
     * Whether Zatca compliance is enabled.
     */
    var enabled: Boolean = false

    /**
     * Checks if Zatca is properly configured.
     * Returns true if enabled and VAT registration number is set.
     */
    fun isConfigured(): Boolean {
        return enabled && vatRegistrationNumber.isNotBlank()
    }
}
