package com.liyaqa.platform.domain.model

/**
 * Status of a client subscription to the Liyaqa platform.
 */
enum class ClientSubscriptionStatus {
    /** Trial period active */
    TRIAL,

    /** Subscription is active and paid */
    ACTIVE,

    /** Subscription suspended (non-payment or violation) */
    SUSPENDED,

    /** Subscription cancelled by client or sales */
    CANCELLED,

    /** Subscription expired (end date passed) */
    EXPIRED
}

/**
 * Billing cycle for client subscriptions.
 */
enum class BillingCycle {
    MONTHLY,
    QUARTERLY,
    ANNUAL
}

/**
 * Status of a sales deal in the pipeline.
 */
enum class DealStatus {
    /** Initial lead, not yet qualified */
    LEAD,

    /** Qualified lead, confirmed interest */
    QUALIFIED,

    /** Proposal sent to prospect */
    PROPOSAL,

    /** Negotiating terms */
    NEGOTIATION,

    /** Deal won, converted to client */
    WON,

    /** Deal lost */
    LOST
}

/**
 * Source of a sales deal.
 */
enum class DealSource {
    /** Inbound from website */
    WEBSITE,

    /** Referral from existing client */
    REFERRAL,

    /** Outbound cold call */
    COLD_CALL,

    /** Marketing campaign */
    MARKETING_CAMPAIGN,

    /** Trade show or event */
    EVENT,

    /** Partner referral */
    PARTNER,

    /** Other source */
    OTHER
}

/**
 * Status of a client invoice.
 */
enum class ClientInvoiceStatus {
    /** Invoice created but not sent */
    DRAFT,

    /** Invoice sent to client */
    ISSUED,

    /** Invoice fully paid */
    PAID,

    /** Invoice partially paid */
    PARTIALLY_PAID,

    /** Invoice overdue */
    OVERDUE,

    /** Invoice cancelled/voided */
    CANCELLED
}

/**
 * Type of line item on a client invoice.
 */
enum class ClientInvoiceLineItemType {
    /** Platform subscription fee */
    SUBSCRIPTION,

    /** Setup or onboarding fee */
    SETUP_FEE,

    /** Additional services */
    SERVICE,

    /** Custom integration work */
    INTEGRATION,

    /** Discount line item */
    DISCOUNT,

    /** Other charges */
    OTHER
}

/**
 * Payment method for client invoices.
 */
enum class ClientPaymentMethod {
    BANK_TRANSFER,
    CREDIT_CARD,
    CASH,
    CHECK,
    OTHER
}

// ============================================
// Platform Users Enums
// ============================================

/**
 * Role of a platform team user.
 */
enum class PlatformUserRole {
    /** Full platform admin with all permissions */
    PLATFORM_ADMIN,

    /** Sales representative */
    SALES_REP,

    /** Support representative */
    SUPPORT_REP
}

/**
 * Status of a platform team user account.
 */
enum class PlatformUserStatus {
    /** Account is active */
    ACTIVE,

    /** Account is inactive (voluntarily disabled) */
    INACTIVE,

    /** Account is suspended (administrative action) */
    SUSPENDED
}

// ============================================
// Support Ticket Enums
// ============================================

/**
 * Status of a support ticket.
 */
enum class TicketStatus {
    /** Ticket created, awaiting response */
    OPEN,

    /** Ticket being worked on */
    IN_PROGRESS,

    /** Waiting for client to respond */
    WAITING_ON_CLIENT,

    /** Issue resolved */
    RESOLVED,

    /** Ticket closed */
    CLOSED
}

/**
 * Priority of a support ticket.
 */
enum class TicketPriority {
    LOW,
    MEDIUM,
    HIGH,
    URGENT
}

/**
 * Category of a support ticket.
 */
enum class TicketCategory {
    /** Billing and payment issues */
    BILLING,

    /** Technical problems */
    TECHNICAL,

    /** Account and registration issues */
    ACCOUNT,

    /** Feature requests */
    FEATURE_REQUEST,

    /** Bug reports */
    BUG_REPORT,

    /** General inquiries */
    GENERAL
}

// ============================================
// Client Notes Enums
// ============================================

/**
 * Category of a client note.
 */
enum class NoteCategory {
    /** General notes */
    GENERAL,

    /** Technical support notes */
    TECHNICAL,

    /** Billing-related notes */
    BILLING,

    /** Relationship management notes */
    RELATIONSHIP,

    /** Troubleshooting notes */
    TROUBLESHOOTING
}
