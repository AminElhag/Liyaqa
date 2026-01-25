package com.liyaqa.member.data.repository

import com.liyaqa.member.data.remote.api.MemberApi
import com.liyaqa.member.data.remote.api.MobileApi
import com.liyaqa.member.domain.model.DevicePlatform
import com.liyaqa.member.domain.model.Notification
import com.liyaqa.member.domain.model.PagedResponse
import com.liyaqa.member.domain.repository.NotificationRepository
import com.liyaqa.member.util.Result
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flow

class NotificationRepositoryImpl(
    private val memberApi: MemberApi,
    private val mobileApi: MobileApi
) : NotificationRepository {

    private val _unreadCount = MutableStateFlow(0)
    override val unreadCount: Flow<Int> = _unreadCount.asStateFlow()

    private var cachedNotifications: List<Notification>? = null

    override fun getNotifications(
        unreadOnly: Boolean,
        page: Int,
        size: Int
    ): Flow<Result<PagedResponse<Notification>>> = flow {
        // Emit cached data for first page if available
        if (page == 0 && !unreadOnly && cachedNotifications != null) {
            emit(Result.success(PagedResponse(
                items = cachedNotifications!!,
                itemCount = cachedNotifications!!.size,
                hasMore = false,
                totalCount = cachedNotifications!!.size
            )))
        }

        // Fetch fresh data
        memberApi.getNotifications(unreadOnly, page, size)
            .onSuccess { response ->
                if (page == 0 && !unreadOnly) {
                    cachedNotifications = response.items
                }
                // Update unread count
                refreshUnreadCount()
                emit(Result.success(response))
            }
            .onError { error ->
                if (cachedNotifications == null || page > 0) {
                    emit(Result.error(
                        exception = error.exception,
                        message = error.message,
                        messageAr = error.messageAr
                    ))
                }
            }
    }

    override suspend fun getUnreadCount(): Result<Int> {
        return memberApi.getUnreadCount().map { it.unreadCount }.also { result ->
            result.onSuccess { count ->
                _unreadCount.value = count
            }
        }
    }

    override suspend fun markAsRead(notificationId: String): Result<Unit> {
        // Note: If backend supports individual mark as read, implement here
        // For now, this will mark all as read since individual endpoint may not exist
        return markAllAsRead()
    }

    override suspend fun markAllAsRead(): Result<Unit> {
        return memberApi.markAllNotificationsAsRead().map { }.also {
            it.onSuccess {
                _unreadCount.value = 0
                // Update cached notifications to mark all as read
                val now = kotlinx.datetime.Clock.System.now().toString()
                cachedNotifications = cachedNotifications?.map { notification ->
                    notification.copy(readAt = now)
                }
            }
        }
    }

    override suspend fun registerDeviceToken(token: String, platform: DevicePlatform): Result<Unit> {
        return mobileApi.registerDeviceToken(token, platform)
    }

    override suspend fun unregisterDeviceToken(token: String): Result<Unit> {
        return mobileApi.unregisterDeviceToken(token)
    }

    override suspend fun refreshNotifications(): Result<List<Notification>> {
        return memberApi.getNotifications(unreadOnly = false, page = 0, size = 50)
            .map { it.items }
            .also { result ->
                result.onSuccess { notifications ->
                    cachedNotifications = notifications
                    refreshUnreadCount()
                }
            }
    }

    private suspend fun refreshUnreadCount() {
        memberApi.getUnreadCount().onSuccess { response ->
            _unreadCount.value = response.unreadCount
        }
    }
}
