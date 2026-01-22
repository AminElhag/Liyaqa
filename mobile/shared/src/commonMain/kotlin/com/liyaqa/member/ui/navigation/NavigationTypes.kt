package com.liyaqa.member.ui.navigation

/**
 * Payment status for payment completion screen.
 */
enum class PaymentStatus {
    SUCCESS,
    FAILED,
    CANCELLED,
    PENDING
}

/**
 * Deep link routes for the app.
 * Used for payment callbacks and other external navigation.
 */
object DeepLinkRoutes {
    const val PAYMENT_COMPLETE = "liyaqa://payment/complete"
    const val BOOKING_DETAIL = "liyaqa://booking"
    const val INVOICE_DETAIL = "liyaqa://invoice"
}
