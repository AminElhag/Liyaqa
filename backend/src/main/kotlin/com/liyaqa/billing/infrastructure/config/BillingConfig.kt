package com.liyaqa.billing.infrastructure.config

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.context.annotation.Configuration
import java.math.BigDecimal

/**
 * Configuration properties for billing module.
 * VAT rate is configurable per deployment (Saudi Arabia default: 15%).
 */
@Configuration
@ConfigurationProperties(prefix = "liyaqa.billing")
class BillingConfig {
    /**
     * Default VAT rate percentage for invoices.
     * Saudi Arabia standard VAT rate is 15%.
     */
    var defaultVatRate: BigDecimal = BigDecimal("15.00")

    /**
     * Gets the VAT rate as a decimal multiplier (e.g., 0.15 for 15%).
     */
    fun getVatRateMultiplier(): BigDecimal = defaultVatRate.divide(BigDecimal("100"))
}
