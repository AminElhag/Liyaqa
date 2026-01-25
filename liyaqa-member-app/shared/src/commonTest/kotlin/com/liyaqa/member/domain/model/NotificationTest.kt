package com.liyaqa.member.domain.model

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class NotificationTest {

    private fun createNotification(
        id: String = "notification-1",
        type: NotificationType = NotificationType.GENERAL,
        title: LocalizedText = LocalizedText("Title", "العنوان"),
        message: LocalizedText = LocalizedText("Message", "الرسالة"),
        readAt: String? = null,
        createdAt: String = "2024-01-15T10:00:00Z",
        actionUrl: String? = null,
        actionData: Map<String, String>? = null
    ) = Notification(
        id = id,
        type = type,
        title = title,
        message = message,
        readAt = readAt,
        createdAt = createdAt,
        actionUrl = actionUrl,
        actionData = actionData
    )

    @Test
    fun `isRead returns true when readAt is not null`() {
        val notification = createNotification(readAt = "2024-01-15T11:00:00Z")

        assertTrue(notification.isRead)
        assertFalse(notification.isUnread)
    }

    @Test
    fun `isUnread returns true when readAt is null`() {
        val notification = createNotification(readAt = null)

        assertTrue(notification.isUnread)
        assertFalse(notification.isRead)
    }

    @Test
    fun `deepLinkDestination returns booking path for booking notifications`() {
        val bookingConfirmed = createNotification(
            type = NotificationType.BOOKING_CONFIRMED,
            actionData = mapOf("bookingId" to "booking-123")
        )
        assertEquals("/bookings/booking-123", bookingConfirmed.deepLinkDestination)

        val bookingReminder = createNotification(
            type = NotificationType.BOOKING_REMINDER,
            actionData = mapOf("bookingId" to "booking-456")
        )
        assertEquals("/bookings/booking-456", bookingReminder.deepLinkDestination)

        val bookingCancelled = createNotification(
            type = NotificationType.BOOKING_CANCELLED,
            actionData = mapOf("bookingId" to "booking-789")
        )
        assertEquals("/bookings/booking-789", bookingCancelled.deepLinkDestination)
    }

    @Test
    fun `deepLinkDestination returns subscription path for subscription notifications`() {
        val subscriptionExpiring = createNotification(
            type = NotificationType.SUBSCRIPTION_EXPIRING
        )
        assertEquals("/subscription", subscriptionExpiring.deepLinkDestination)

        val subscriptionExpired = createNotification(
            type = NotificationType.SUBSCRIPTION_EXPIRED
        )
        assertEquals("/subscription", subscriptionExpired.deepLinkDestination)
    }

    @Test
    fun `deepLinkDestination returns invoice path for payment notifications`() {
        val paymentReceived = createNotification(
            type = NotificationType.PAYMENT_RECEIVED,
            actionData = mapOf("invoiceId" to "invoice-123")
        )
        assertEquals("/invoices/invoice-123", paymentReceived.deepLinkDestination)

        val paymentDue = createNotification(
            type = NotificationType.PAYMENT_DUE,
            actionData = mapOf("invoiceId" to "invoice-456")
        )
        assertEquals("/invoices/invoice-456", paymentDue.deepLinkDestination)
    }

    @Test
    fun `deepLinkDestination returns actionUrl for promotion and general notifications`() {
        val promotion = createNotification(
            type = NotificationType.PROMOTION,
            actionUrl = "https://example.com/promo"
        )
        assertEquals("https://example.com/promo", promotion.deepLinkDestination)

        val general = createNotification(
            type = NotificationType.GENERAL,
            actionUrl = "https://example.com/general"
        )
        assertEquals("https://example.com/general", general.deepLinkDestination)
    }

    @Test
    fun `deepLinkDestination returns null when no actionData or actionUrl provided`() {
        val notification = createNotification(
            type = NotificationType.BOOKING_CONFIRMED,
            actionData = null
        )
        assertNull(notification.deepLinkDestination)

        val general = createNotification(
            type = NotificationType.GENERAL,
            actionUrl = null
        )
        assertNull(general.deepLinkDestination)
    }
}
