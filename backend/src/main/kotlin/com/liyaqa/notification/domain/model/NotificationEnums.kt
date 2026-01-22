package com.liyaqa.notification.domain.model

/**
 * Types of notifications the system can send.
 */
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

    // Class booking notifications
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

    // Member status notifications
    MEMBER_SUSPENDED,
    MEMBER_REACTIVATED,

    // General
    CUSTOM
}

/**
 * Delivery channel for notifications.
 */
enum class NotificationChannel {
    EMAIL,
    SMS,
    WHATSAPP,  // WhatsApp Business API - primary channel in Saudi Arabia
    PUSH,      // For future mobile app
    IN_APP     // For future in-app notifications
}

/**
 * Status of a notification.
 */
enum class NotificationStatus {
    PENDING,
    SENT,
    DELIVERED,
    FAILED,
    READ
}

/**
 * Priority levels for notifications.
 */
enum class NotificationPriority {
    LOW,
    NORMAL,
    HIGH,
    URGENT
}
