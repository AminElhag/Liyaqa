package com.liyaqa.webhook.domain.model

/**
 * Types of events that can trigger webhook deliveries.
 */
enum class WebhookEventType(val value: String) {
    // Member events
    MEMBER_CREATED("member.created"),
    MEMBER_UPDATED("member.updated"),
    MEMBER_DELETED("member.deleted"),

    // Subscription events
    SUBSCRIPTION_CREATED("subscription.created"),
    SUBSCRIPTION_ACTIVATED("subscription.activated"),
    SUBSCRIPTION_RENEWED("subscription.renewed"),
    SUBSCRIPTION_EXPIRED("subscription.expired"),
    SUBSCRIPTION_CANCELLED("subscription.cancelled"),
    SUBSCRIPTION_FROZEN("subscription.frozen"),
    SUBSCRIPTION_UNFROZEN("subscription.unfrozen"),

    // Invoice events
    INVOICE_CREATED("invoice.created"),
    INVOICE_ISSUED("invoice.issued"),
    INVOICE_PAID("invoice.paid"),
    INVOICE_VOIDED("invoice.voided"),
    INVOICE_OVERDUE("invoice.overdue"),

    // Attendance events
    ATTENDANCE_CHECKIN("attendance.checkin"),
    ATTENDANCE_CHECKOUT("attendance.checkout"),

    // Booking events
    BOOKING_CREATED("booking.created"),
    BOOKING_CONFIRMED("booking.confirmed"),
    BOOKING_CANCELLED("booking.cancelled"),
    BOOKING_COMPLETED("booking.completed"),
    BOOKING_NO_SHOW("booking.no_show"),

    // Class events
    CLASS_SESSION_CREATED("class_session.created"),
    CLASS_SESSION_CANCELLED("class_session.cancelled"),

    // Shop events
    ORDER_CREATED("order.created"),
    ORDER_PAID("order.paid"),
    ORDER_COMPLETED("order.completed"),

    // Wallet events
    WALLET_CREDITED("wallet.credited"),
    WALLET_DEBITED("wallet.debited"),

    // Lead/CRM events
    LEAD_CREATED("lead.created"),
    LEAD_UPDATED("lead.updated"),
    LEAD_STATUS_CHANGED("lead.status_changed"),
    LEAD_CONVERTED("lead.converted"),
    LEAD_ASSIGNED("lead.assigned");

    companion object {
        fun fromValue(value: String): WebhookEventType? {
            return entries.find { it.value == value }
        }

        fun allValues(): List<String> = entries.map { it.value }
    }
}

/**
 * Status of a webhook delivery attempt.
 */
enum class DeliveryStatus {
    PENDING,
    IN_PROGRESS,
    DELIVERED,
    FAILED,
    EXHAUSTED  // Max retries reached
}
