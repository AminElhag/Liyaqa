package com.liyaqa.member.domain.model

/**
 * Payment initiation response from PayTabs.
 * Contains the redirect URL and transaction details for processing payment.
 */
data class PaymentInitiation(
    val paymentId: String,
    val redirectUrl: String,
    val transactionRef: String,
    val amount: Double,
    val currency: String
) {
    /**
     * Formatted amount with currency.
     * Uses simple string formatting compatible with KMP.
     */
    val formattedAmount: String
        get() {
            val intPart = amount.toLong()
            val decPart = ((amount - intPart) * 100).toLong().let {
                if (it < 10) "0$it" else "$it"
            }
            return "$currency $intPart.$decPart"
        }
}
