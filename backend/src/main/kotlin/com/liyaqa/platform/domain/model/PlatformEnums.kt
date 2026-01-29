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

// ============================================
// Onboarding Enums
// ============================================

/**
 * Steps in the client onboarding checklist.
 * Each step has associated points for gamification.
 */
enum class OnboardingStep(val points: Int, val category: OnboardingCategory) {
    // Account setup (25 points total)
    ACCOUNT_CREATED(10, OnboardingCategory.ACCOUNT),
    EMAIL_VERIFIED(5, OnboardingCategory.ACCOUNT),
    PROFILE_COMPLETED(10, OnboardingCategory.ACCOUNT),

    // Core setup (35 points total)
    FIRST_LOCATION_ADDED(15, OnboardingCategory.SETUP),
    MEMBERSHIP_PLANS_CREATED(20, OnboardingCategory.SETUP),

    // Members (25 points total)
    FIRST_MEMBER_ADDED(10, OnboardingCategory.MEMBERS),
    MEMBERS_IMPORTED(15, OnboardingCategory.MEMBERS),

    // Payments (30 points total)
    PAYMENT_GATEWAY_CONNECTED(20, OnboardingCategory.PAYMENTS),
    FIRST_PAYMENT_RECEIVED(10, OnboardingCategory.PAYMENTS),

    // Operations (35 points total)
    ACCESS_CONTROL_CONFIGURED(15, OnboardingCategory.OPERATIONS),
    FIRST_CLASS_SCHEDULED(10, OnboardingCategory.OPERATIONS),
    STAFF_INVITED(10, OnboardingCategory.TEAM),

    // Engagement (15 points total)
    MOBILE_APP_CONFIGURED(15, OnboardingCategory.ENGAGEMENT)
}

/**
 * Categories of onboarding steps.
 */
enum class OnboardingCategory {
    ACCOUNT,
    SETUP,
    MEMBERS,
    PAYMENTS,
    OPERATIONS,
    TEAM,
    ENGAGEMENT
}

/**
 * Phases of onboarding progress.
 */
enum class OnboardingPhase {
    /** 0-30% complete */
    GETTING_STARTED,

    /** 31-60% complete */
    CORE_SETUP,

    /** 61-90% complete */
    OPERATIONS,

    /** 100% complete */
    COMPLETE
}

// ============================================
// Health Score Enums
// ============================================

/**
 * Risk level based on health score.
 */
enum class RiskLevel(val minScore: Int, val maxScore: Int) {
    CRITICAL(0, 39),
    HIGH(40, 59),
    MEDIUM(60, 79),
    LOW(80, 100);

    companion object {
        fun fromScore(score: Int): RiskLevel {
            return entries.first { score in it.minScore..it.maxScore }
        }
    }
}

/**
 * Trend direction for health scores.
 */
enum class HealthTrend {
    IMPROVING,
    STABLE,
    DECLINING
}

/**
 * Types of health signals that contribute to the score.
 */
enum class SignalType {
    // Positive signals
    DAILY_ACTIVE_USAGE,
    MEMBER_GROWTH,
    ON_TIME_PAYMENT,
    HIGH_FEATURE_ADOPTION,
    LOW_SUPPORT_TICKETS,
    ONBOARDING_COMPLETE,

    // Negative signals
    DECLINING_LOGINS,
    MEMBER_CHURN,
    FAILED_PAYMENTS,
    SUPPORT_TICKET_SPIKE,
    APPROACHING_LIMITS,
    INACTIVITY,
    INCOMPLETE_ONBOARDING
}

// ============================================
// Platform Alert Enums
// ============================================

/**
 * Types of platform alerts.
 */
enum class AlertType {
    // Usage alerts
    USAGE_LIMIT_WARNING,
    USAGE_LIMIT_CRITICAL,
    USAGE_LIMIT_EXCEEDED,

    // Payment alerts
    PAYMENT_FAILED,
    PAYMENT_RECOVERED,
    SUBSCRIPTION_SUSPENDED,

    // Lifecycle alerts
    TRIAL_ENDING,
    TRIAL_EXPIRED,
    SUBSCRIPTION_EXPIRING,
    SUBSCRIPTION_RENEWED,

    // Engagement alerts
    CHURN_RISK,
    INACTIVITY_WARNING,
    FEATURE_UNUSED,
    ONBOARDING_STALLED,

    // Positive alerts
    MILESTONE_REACHED,
    GROWTH_DETECTED,
    HEALTH_IMPROVED
}

/**
 * Severity levels for alerts.
 */
enum class AlertSeverity {
    /** Blue - informational */
    INFO,

    /** Yellow - attention needed */
    WARNING,

    /** Red - urgent action required */
    CRITICAL,

    /** Green - positive news */
    SUCCESS
}

// ============================================
// Dunning Enums
// ============================================

/**
 * Status of a dunning attempt.
 */
enum class DunningStatus {
    /** Dunning process active */
    ACTIVE,

    /** Payment recovered */
    RECOVERED,

    /** Subscription suspended */
    SUSPENDED,

    /** Account deactivated */
    DEACTIVATED,

    /** Manually resolved */
    RESOLVED
}

/**
 * Notification channels for dunning.
 */
enum class NotificationChannel {
    EMAIL,
    SMS,
    PUSH,
    IN_APP,
    PHONE_CALL
}

// ============================================
// Usage Enums
// ============================================

/**
 * Usage level status for limit tracking.
 */
enum class UsageLevel {
    /** < 80% of limit */
    NORMAL,

    /** 80-95% of limit */
    WARNING,

    /** 95-100% of limit */
    CRITICAL,

    /** > 100% of limit */
    EXCEEDED
}
