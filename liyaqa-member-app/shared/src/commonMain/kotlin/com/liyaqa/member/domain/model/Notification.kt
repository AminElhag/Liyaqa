package com.liyaqa.member.domain.model

import kotlinx.serialization.Serializable

/**
 * Notification item
 */
@Serializable
data class Notification(
    val id: String,
    val type: NotificationType,
    val title: LocalizedText,
    val message: LocalizedText,
    val readAt: String? = null,
    val createdAt: String,
    val actionUrl: String? = null,
    val actionData: Map<String, String>? = null
) {
    val isRead: Boolean get() = readAt != null

    val isUnread: Boolean get() = !isRead

    /**
     * Deep link destination based on notification type
     */
    val deepLinkDestination: String? get() = when (type) {
        NotificationType.BOOKING_CONFIRMED,
        NotificationType.BOOKING_REMINDER,
        NotificationType.BOOKING_CANCELLED -> actionData?.get("bookingId")?.let { "/bookings/$it" }

        NotificationType.SUBSCRIPTION_EXPIRING,
        NotificationType.SUBSCRIPTION_EXPIRED -> "/subscription"

        NotificationType.PAYMENT_RECEIVED,
        NotificationType.PAYMENT_DUE -> actionData?.get("invoiceId")?.let { "/invoices/$it" }

        NotificationType.PROMOTION,
        NotificationType.GENERAL -> actionUrl
    }
}

/**
 * Notification preferences
 */
@Serializable
data class NotificationPreferences(
    val bookingReminders: Boolean = true,
    val subscriptionAlerts: Boolean = true,
    val paymentReminders: Boolean = true,
    val promotions: Boolean = true,
    val generalAnnouncements: Boolean = true
)

/**
 * Unread notification count
 */
@Serializable
data class UnreadCount(
    val unreadCount: Int
)
