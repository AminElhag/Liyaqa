package com.liyaqa.member.domain.model

/**
 * All status enums for the member app.
 * Values are aligned exactly with backend enums for proper serialization.
 */

// Member Status
enum class MemberStatus {
    ACTIVE,
    SUSPENDED,
    FROZEN,
    CANCELLED,
    PENDING
}

// Subscription Status
enum class SubscriptionStatus {
    ACTIVE,
    EXPIRED,
    CANCELLED,
    FROZEN,
    PENDING_PAYMENT
}

// Invoice Status
enum class InvoiceStatus {
    DRAFT,
    ISSUED,
    PAID,
    PARTIALLY_PAID,
    OVERDUE,
    CANCELLED,
    REFUNDED
}

// Booking Status
enum class BookingStatus {
    CONFIRMED,
    WAITLISTED,
    CHECKED_IN,
    NO_SHOW,
    CANCELLED
}

// Attendance Status
enum class AttendanceStatus {
    CHECKED_IN,
    CHECKED_OUT,
    AUTO_CHECKED_OUT
}

// Check-in Method
enum class CheckInMethod {
    MANUAL,
    QR_CODE,
    CARD,
    BIOMETRIC
}

// Notification Type
enum class NotificationType {
    // Subscription notifications
    SUBSCRIPTION_CREATED,
    SUBSCRIPTION_EXPIRING_7_DAYS,
    SUBSCRIPTION_EXPIRING_3_DAYS,
    SUBSCRIPTION_EXPIRING_1_DAY,
    SUBSCRIPTION_EXPIRED,
    SUBSCRIPTION_FROZEN,
    SUBSCRIPTION_UNFROZEN,
    SUBSCRIPTION_CANCELLED,
    SUBSCRIPTION_RENEWED,
    LOW_CLASSES_REMAINING,

    // Invoice notifications
    INVOICE_CREATED,
    INVOICE_DUE_SOON,
    INVOICE_OVERDUE,
    INVOICE_PAID,

    // Booking notifications
    CLASS_BOOKING_CONFIRMED,
    CLASS_BOOKING_CANCELLED,
    CLASS_BOOKING_REMINDER_24H,
    CLASS_BOOKING_REMINDER_1H,
    CLASS_WAITLIST_PROMOTED,
    CLASS_SESSION_CANCELLED,

    // Attendance notifications
    CHECK_IN_CONFIRMATION,

    // Account notifications
    WELCOME,
    PASSWORD_RESET,
    PASSWORD_CHANGED,
    ACCOUNT_LOCKED,
    MEMBER_SUSPENDED,
    MEMBER_REACTIVATED,

    // Other
    CUSTOM
}

// Notification Channel
enum class NotificationChannel {
    EMAIL,
    SMS,
    PUSH,
    IN_APP
}
