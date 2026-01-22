package com.liyaqa.billing.domain.model

/**
 * Status of an invoice in its lifecycle.
 */
enum class InvoiceStatus {
    DRAFT,           // Invoice created but not yet issued
    ISSUED,          // Invoice issued to member
    PAID,            // Invoice fully paid
    PARTIALLY_PAID,  // Invoice partially paid
    OVERDUE,         // Payment past due date
    CANCELLED,       // Invoice cancelled
    REFUNDED         // Invoice refunded
}

/**
 * Method of payment used.
 */
enum class PaymentMethod {
    CASH,
    CARD,
    BANK_TRANSFER,
    ONLINE,         // Generic online payment
    MADA,           // Saudi debit card
    APPLE_PAY,
    STC_PAY,        // Saudi telecom payment (mobile wallet)
    SADAD,          // Saudi bill payment system
    TAMARA,         // Buy Now Pay Later (BNPL)
    PAYTABS,        // PayTabs online payment
    OTHER
}

/**
 * Type of line item on an invoice.
 */
enum class LineItemType {
    SUBSCRIPTION,    // Membership subscription
    CLASS_PACKAGE,   // Class/session package
    GUEST_PASS,      // Guest pass purchase
    PERSONAL_TRAINING, // Personal training sessions
    MERCHANDISE,     // Retail items
    LOCKER_RENTAL,   // Locker rental fee
    PENALTY,         // Late payment or other penalty
    DISCOUNT,        // Discount (negative amount)
    OTHER            // Other charges
}
