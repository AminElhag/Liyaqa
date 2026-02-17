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

/**
 * ZATCA invoice type code (Phase 1).
 * SIMPLIFIED: B2C invoices (gym members) - most common
 * STANDARD: B2B invoices (corporate memberships)
 */
enum class InvoiceTypeCode {
    SIMPLIFIED,
    STANDARD
}

/**
 * ZATCA document type code (UN/CEFACT 1001).
 */
enum class DocumentTypeCode {
    INVOICE_388,       // Standard invoice
    CREDIT_NOTE_381,   // Credit note (refund)
    DEBIT_NOTE_383     // Debit note (additional charge)
}

/**
 * ZATCA VAT category code per line item.
 * S: Standard rate (15%)
 * Z: Zero-rated
 * E: Exempt
 * O: Out of scope
 */
enum class VatCategoryCode {
    S,  // Standard rate (15%)
    Z,  // Zero-rated
    E,  // Exempt from VAT
    O   // Out of scope of VAT
}
