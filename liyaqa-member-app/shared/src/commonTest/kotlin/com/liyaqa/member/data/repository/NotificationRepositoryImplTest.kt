package com.liyaqa.member.data.repository

import com.liyaqa.member.domain.model.LocalizedText
import com.liyaqa.member.domain.model.Notification
import com.liyaqa.member.domain.model.NotificationType
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/**
 * Tests for notification-related data transformation and model behavior.
 * Note: Full repository tests require integration testing with actual API mocks.
 */
class NotificationRepositoryImplTest {

    @Test
    fun `notification list filtering for unread works correctly`() {
        val notifications = listOf(
            createNotification(id = "1", readAt = null),
            createNotification(id = "2", readAt = "2024-01-15T10:00:00Z"),
            createNotification(id = "3", readAt = null),
            createNotification(id = "4", readAt = "2024-01-15T11:00:00Z")
        )

        val unread = notifications.filter { it.isUnread }

        assertEquals(2, unread.size)
        assertEquals("1", unread[0].id)
        assertEquals("3", unread[1].id)
    }

    @Test
    fun `notification list filtering for read works correctly`() {
        val notifications = listOf(
            createNotification(id = "1", readAt = null),
            createNotification(id = "2", readAt = "2024-01-15T10:00:00Z"),
            createNotification(id = "3", readAt = null)
        )

        val read = notifications.filter { it.isRead }

        assertEquals(1, read.size)
        assertEquals("2", read[0].id)
    }

    @Test
    fun `notification unread count calculation is accurate`() {
        val notifications = listOf(
            createNotification(id = "1", readAt = null),
            createNotification(id = "2", readAt = "2024-01-15T10:00:00Z"),
            createNotification(id = "3", readAt = null),
            createNotification(id = "4", readAt = null),
            createNotification(id = "5", readAt = "2024-01-15T12:00:00Z")
        )

        val unreadCount = notifications.count { it.isUnread }

        assertEquals(3, unreadCount)
    }

    @Test
    fun `mark as read simulation updates notification state`() {
        val notification = createNotification(id = "1", readAt = null)

        assertTrue(notification.isUnread)

        val markedAsRead = notification.copy(readAt = "2024-01-15T15:00:00Z")

        assertTrue(markedAsRead.isRead)
        assertFalse(markedAsRead.isUnread)
    }

    @Test
    fun `notification sorting by creation date works`() {
        val notifications = listOf(
            createNotification(id = "1", createdAt = "2024-01-15T08:00:00Z"),
            createNotification(id = "2", createdAt = "2024-01-15T12:00:00Z"),
            createNotification(id = "3", createdAt = "2024-01-15T10:00:00Z")
        )

        val sorted = notifications.sortedByDescending { it.createdAt }

        assertEquals("2", sorted[0].id)
        assertEquals("3", sorted[1].id)
        assertEquals("1", sorted[2].id)
    }

    @Test
    fun `notification type grouping works correctly`() {
        val notifications = listOf(
            createNotification(id = "1", type = NotificationType.BOOKING_CONFIRMED),
            createNotification(id = "2", type = NotificationType.PAYMENT_DUE),
            createNotification(id = "3", type = NotificationType.BOOKING_REMINDER),
            createNotification(id = "4", type = NotificationType.GENERAL),
            createNotification(id = "5", type = NotificationType.BOOKING_CONFIRMED)
        )

        val grouped = notifications.groupBy { it.type }

        assertEquals(4, grouped.size)
        assertEquals(2, grouped[NotificationType.BOOKING_CONFIRMED]?.size)
        assertEquals(1, grouped[NotificationType.PAYMENT_DUE]?.size)
        assertEquals(1, grouped[NotificationType.BOOKING_REMINDER]?.size)
        assertEquals(1, grouped[NotificationType.GENERAL]?.size)
    }

    @Test
    fun `batch mark as read updates all notifications`() {
        val notifications = listOf(
            createNotification(id = "1", readAt = null),
            createNotification(id = "2", readAt = null),
            createNotification(id = "3", readAt = null)
        )

        val now = "2024-01-15T16:00:00Z"
        val markedAsRead = notifications.map { it.copy(readAt = now) }

        assertTrue(markedAsRead.all { it.isRead })
        assertEquals(0, markedAsRead.count { it.isUnread })
    }

    private fun createNotification(
        id: String,
        type: NotificationType = NotificationType.GENERAL,
        readAt: String? = null,
        createdAt: String = "2024-01-15T10:00:00Z"
    ) = Notification(
        id = id,
        type = type,
        title = LocalizedText("Title", "العنوان"),
        message = LocalizedText("Message", "الرسالة"),
        readAt = readAt,
        createdAt = createdAt
    )
}
