package com.liyaqa.member.domain.repository

import com.liyaqa.member.domain.model.DevicePlatform
import com.liyaqa.member.domain.model.Notification
import com.liyaqa.member.domain.model.PagedResponse
import com.liyaqa.member.util.Result
import kotlinx.coroutines.flow.Flow

/**
 * Repository for notification operations
 */
interface NotificationRepository {
    /**
     * Observable unread notification count
     */
    val unreadCount: Flow<Int>

    /**
     * Get notifications (offline-first)
     */
    fun getNotifications(
        unreadOnly: Boolean = false,
        page: Int = 0,
        size: Int = 20
    ): Flow<Result<PagedResponse<Notification>>>

    /**
     * Get unread notification count
     */
    suspend fun getUnreadCount(): Result<Int>

    /**
     * Mark notification as read
     */
    suspend fun markAsRead(notificationId: String): Result<Unit>

    /**
     * Mark all notifications as read
     */
    suspend fun markAllAsRead(): Result<Unit>

    /**
     * Register device token for push notifications
     */
    suspend fun registerDeviceToken(token: String, platform: DevicePlatform): Result<Unit>

    /**
     * Unregister device token
     */
    suspend fun unregisterDeviceToken(token: String): Result<Unit>

    /**
     * Force refresh notifications from server
     */
    suspend fun refreshNotifications(): Result<List<Notification>>
}
