package com.liyaqa.billing.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.util.UUID

/**
 * Saved payment method entity for storing member payment methods.
 * Supports multiple providers (Stripe, Moyasar, HyperPay) and payment types (Card, STC Pay, Mada).
 */
@Entity
@Table(name = "saved_payment_methods")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class SavedPaymentMethod(
    id: UUID = UUID.randomUUID(),

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_type", nullable = false)
    var paymentType: PaymentMethodType,

    // Card details
    @Column(name = "card_last_four")
    var cardLastFour: String? = null,

    @Column(name = "card_brand")
    var cardBrand: String? = null,

    @Column(name = "card_exp_month")
    var cardExpMonth: Int? = null,

    @Column(name = "card_exp_year")
    var cardExpYear: Int? = null,

    // Provider details
    @Column(name = "provider_token", columnDefinition = "TEXT")
    var providerToken: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "provider_type", nullable = false)
    var providerType: PaymentProviderType,

    @Column(name = "provider_customer_id")
    var providerCustomerId: String? = null,

    // User preferences
    @Column(name = "nickname")
    var nickname: String? = null,

    @Column(name = "is_default", nullable = false)
    var isDefault: Boolean = false,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    // Billing address
    @Column(name = "billing_name")
    var billingName: String? = null,

    @Column(name = "billing_country")
    var billingCountry: String? = null,

    @Column(name = "billing_city")
    var billingCity: String? = null

) : BaseEntity(id) {

    /**
     * Set this as the default payment method
     */
    fun setAsDefault() {
        isDefault = true
    }

    /**
     * Remove default status
     */
    fun removeDefault() {
        isDefault = false
    }

    /**
     * Deactivate this payment method (soft delete)
     */
    fun deactivate() {
        isActive = false
        isDefault = false
    }

    /**
     * Reactivate this payment method
     */
    fun activate() {
        isActive = true
    }

    /**
     * Update nickname
     */
    fun updateNickname(newNickname: String?) {
        nickname = newNickname
    }

    /**
     * Check if the card is expired
     */
    fun isExpired(): Boolean {
        if (cardExpMonth == null || cardExpYear == null) return false

        val now = java.time.LocalDate.now()
        val expDate = java.time.LocalDate.of(cardExpYear!!, cardExpMonth!!, 1)
            .plusMonths(1)
            .minusDays(1) // Last day of expiry month

        return now.isAfter(expDate)
    }

    /**
     * Get display name (nickname or generated name)
     */
    fun getDisplayName(): String {
        if (!nickname.isNullOrBlank()) return nickname!!

        return when (paymentType) {
            PaymentMethodType.CARD, PaymentMethodType.MADA -> {
                val brand = cardBrand ?: "Card"
                "$brand •••• $cardLastFour"
            }
            PaymentMethodType.STCPAY -> "STC Pay"
            PaymentMethodType.APPLE_PAY -> "Apple Pay"
        }
    }

    /**
     * Get masked card number for display
     */
    fun getMaskedCardNumber(): String? {
        return cardLastFour?.let { "•••• •••• •••• $it" }
    }
}

/**
 * Payment method types
 */
enum class PaymentMethodType {
    CARD,       // Credit/Debit card
    MADA,       // Saudi Mada card
    STCPAY,     // STC Pay
    APPLE_PAY   // Apple Pay
}

/**
 * Payment provider types
 */
enum class PaymentProviderType {
    STRIPE,     // Stripe
    MOYASAR,    // Moyasar (Saudi Arabia)
    HYPERPAY,   // HyperPay
    MANUAL      // Manually recorded
}
