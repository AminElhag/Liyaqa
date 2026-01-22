package com.liyaqa.member.data.dto

import kotlinx.serialization.Serializable

/**
 * Payment DTOs matching backend PaymentController responses.
 */

/**
 * Payment initiation request for POST /api/payments/initiate.
 * Matches backend InitiatePaymentRequest.
 */
@Serializable
data class InitiatePaymentRequestDto(
    val invoiceId: String,
    val returnUrl: String? = null,
    val callbackUrl: String? = null
)

/**
 * Payment initiation response.
 * Matches backend PaymentInitiateResponse.
 */
@Serializable
data class PaymentInitiateDto(
    val paymentId: String,
    val redirectUrl: String,
    val transactionRef: String,
    val amount: Double,
    val currency: String
)

/**
 * Payment status response.
 * Matches backend PaymentStatusResponse.
 */
@Serializable
data class PaymentStatusDto(
    val paymentId: String,
    val status: String,
    val transactionRef: String,
    val amount: Double,
    val currency: String,
    val paidAt: String? = null
)
