package com.liyaqa.member.domain.repository

import com.liyaqa.member.domain.model.Notification
import com.liyaqa.member.domain.model.NotificationPreferences
import com.liyaqa.member.domain.model.PagedResult

/**
 * Repository for notification operations.
 * Handles notification listing, preferences, and read status.
 */
interface NotificationRepository {

    /**
     * Fetches notifications for the current member.
     *
     * @param unreadOnly If true, only returns unread notifications
     * @param page The page number (0-indexed)
     * @param size The number of items per page
     */
    suspend fun getNotifications(
        unreadOnly: Boolean = false,
        page: Int = 0,
        size: Int = 20
    ): Result<PagedResult<Notification>>

    /**
     * Gets the count of unread notifications.
     */
    suspend fun getUnreadCount(): Result<Int>

    /**
     * Marks a notification as read.
     *
     * @param notificationId The notification ID
     */
    suspend fun markAsRead(notificationId: String): Result<Unit>

    /**
     * Marks all notifications as read.
     */
    suspend fun markAllAsRead(): Result<Unit>

    /**
     * Gets notification preferences for a member.
     *
     * @param memberId The member ID
     */
    suspend fun getPreferences(memberId: String): Result<NotificationPreferences>

    /**
     * Updates notification preferences for a member.
     *
     * @param memberId The member ID
     * @param preferences The updated preferences
     */
    suspend fun updatePreferences(
        memberId: String,
        preferences: NotificationPreferences
    ): Result<NotificationPreferences>
}
