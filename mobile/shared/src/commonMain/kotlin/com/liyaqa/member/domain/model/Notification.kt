package com.liyaqa.member.domain.model

import com.liyaqa.member.core.localization.LocalizedText
import kotlinx.datetime.Instant

/**
 * Notification domain model representing a notification for the member.
 * Aligned with backend NotificationLiteResponse.
 */
data class Notification(
    val id: String,
    val type: NotificationType,
    val subject: LocalizedText,
    val body: LocalizedText,
    val channel: NotificationChannel,
    val isRead: Boolean,
    val createdAt: Instant
) {
    /**
     * Returns the notification category based on type.
     */
    val category: NotificationCategory
        get() = when (type) {
            NotificationType.SUBSCRIPTION_CREATED,
            NotificationType.SUBSCRIPTION_EXPIRING_7_DAYS,
            NotificationType.SUBSCRIPTION_EXPIRING_3_DAYS,
            NotificationType.SUBSCRIPTION_EXPIRING_1_DAY,
            NotificationType.SUBSCRIPTION_EXPIRED,
            NotificationType.SUBSCRIPTION_FROZEN,
            NotificationType.SUBSCRIPTION_UNFROZEN,
            NotificationType.SUBSCRIPTION_CANCELLED,
            NotificationType.SUBSCRIPTION_RENEWED,
            NotificationType.LOW_CLASSES_REMAINING -> NotificationCategory.SUBSCRIPTION

            NotificationType.INVOICE_CREATED,
            NotificationType.INVOICE_DUE_SOON,
            NotificationType.INVOICE_OVERDUE,
            NotificationType.INVOICE_PAID -> NotificationCategory.INVOICE

            NotificationType.CLASS_BOOKING_CONFIRMED,
            NotificationType.CLASS_BOOKING_CANCELLED,
            NotificationType.CLASS_BOOKING_REMINDER_24H,
            NotificationType.CLASS_BOOKING_REMINDER_1H,
            NotificationType.CLASS_WAITLIST_PROMOTED,
            NotificationType.CLASS_SESSION_CANCELLED -> NotificationCategory.BOOKING

            NotificationType.CHECK_IN_CONFIRMATION -> NotificationCategory.ATTENDANCE

            NotificationType.WELCOME,
            NotificationType.PASSWORD_RESET,
            NotificationType.PASSWORD_CHANGED,
            NotificationType.ACCOUNT_LOCKED,
            NotificationType.MEMBER_SUSPENDED,
            NotificationType.MEMBER_REACTIVATED -> NotificationCategory.ACCOUNT

            NotificationType.CUSTOM -> NotificationCategory.GENERAL
        }
}

/**
 * Notification category for grouping and filtering.
 */
enum class NotificationCategory {
    SUBSCRIPTION,
    INVOICE,
    BOOKING,
    ATTENDANCE,
    ACCOUNT,
    GENERAL
}
