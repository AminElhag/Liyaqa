package com.liyaqa.member.presentation.notifications

import androidx.lifecycle.viewModelScope
import com.liyaqa.member.domain.model.Notification
import com.liyaqa.member.domain.repository.NotificationRepository
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.base.MviViewModel
import com.liyaqa.member.presentation.base.PaginationState
import com.liyaqa.member.presentation.base.DEFAULT_PAGE_SIZE
import kotlinx.coroutines.launch

/**
 * User intents for the Notifications screen.
 */
sealed interface NotificationsIntent {
    /** Load notifications. */
    data object LoadNotifications : NotificationsIntent

    /** Load more notifications. */
    data object LoadMore : NotificationsIntent

    /** Mark a notification as read. */
    data class MarkAsRead(val notificationId: String) : NotificationsIntent

    /** Mark all notifications as read. */
    data object MarkAllAsRead : NotificationsIntent

    /** Toggle unread only filter. */
    data object ToggleUnreadOnly : NotificationsIntent

    /** Refresh notifications. */
    data object Refresh : NotificationsIntent

    /** Navigate to notification detail/action. */
    data class ViewNotification(val notification: Notification) : NotificationsIntent
}

/**
 * UI state for the Notifications screen.
 */
data class NotificationsState(
    /** Loading state. */
    val loading: LoadingState = LoadingState.Idle,

    /** Pagination state for notifications. */
    val notifications: PaginationState<Notification> = PaginationState(),

    /** Whether showing unread only. */
    val unreadOnly: Boolean = false,

    /** Unread count. */
    val unreadCount: Int = 0,

    /** Whether marking all as read. */
    val isMarkingAllRead: Boolean = false
) {
    /** Whether there are unread notifications. */
    val hasUnread: Boolean get() = unreadCount > 0

    /** Get unread notifications from the list. */
    val unreadNotifications: List<Notification>
        get() = notifications.items.filter { !it.isRead }
}

/**
 * One-time effects from the Notifications screen.
 */
sealed interface NotificationsEffect {
    /** Show error message. */
    data class ShowError(val message: String) : NotificationsEffect

    /** Navigate based on notification type. */
    data class NavigateToAction(val notification: Notification) : NotificationsEffect

    /** All notifications marked as read. */
    data object AllMarkedAsRead : NotificationsEffect
}

/**
 * ViewModel for the Notifications screen.
 *
 * Features:
 * - List notifications with pagination
 * - Filter by unread only
 * - Mark as read (individual and all)
 * - Navigate to relevant screen based on notification type
 */
class NotificationsViewModel(
    private val notificationRepository: NotificationRepository
) : MviViewModel<NotificationsIntent, NotificationsState, NotificationsEffect>(NotificationsState()) {

    init {
        onIntent(NotificationsIntent.LoadNotifications)
        loadUnreadCount()
    }

    override fun onIntent(intent: NotificationsIntent) {
        when (intent) {
            is NotificationsIntent.LoadNotifications -> loadNotifications()
            is NotificationsIntent.LoadMore -> loadMore()
            is NotificationsIntent.MarkAsRead -> markAsRead(intent.notificationId)
            is NotificationsIntent.MarkAllAsRead -> markAllAsRead()
            is NotificationsIntent.ToggleUnreadOnly -> toggleUnreadOnly()
            is NotificationsIntent.Refresh -> refresh()
            is NotificationsIntent.ViewNotification -> viewNotification(intent.notification)
        }
    }

    private fun loadNotifications() {
        if (currentState.notifications.isInitialLoading) return

        updateState { copy(notifications = notifications.withInitialLoading()) }

        viewModelScope.launch {
            notificationRepository.getNotifications(
                unreadOnly = currentState.unreadOnly,
                page = 0,
                size = DEFAULT_PAGE_SIZE
            )
                .onSuccess { result ->
                    updateState {
                        copy(
                            loading = LoadingState.Success,
                            notifications = notifications.withInitialItems(
                                newItems = result.items,
                                hasMore = result.hasMore,
                                totalCount = result.totalCount
                            )
                        )
                    }
                }
                .onFailure { error ->
                    updateState {
                        copy(notifications = notifications.withError(
                            error.message ?: "Failed to load notifications"
                        ))
                    }
                }
        }
    }

    private fun loadMore() {
        val pagination = currentState.notifications
        if (!pagination.canLoadMore) return

        updateState { copy(notifications = notifications.withLoadingMore()) }

        viewModelScope.launch {
            notificationRepository.getNotifications(
                unreadOnly = currentState.unreadOnly,
                page = pagination.nextPage,
                size = DEFAULT_PAGE_SIZE
            )
                .onSuccess { result ->
                    updateState {
                        copy(notifications = notifications.withNewItems(
                            newItems = result.items,
                            hasMore = result.hasMore,
                            totalCount = result.totalCount
                        ))
                    }
                }
                .onFailure { error ->
                    updateState {
                        copy(notifications = notifications.withError(
                            error.message ?: "Failed to load more"
                        ))
                    }
                }
        }
    }

    private fun markAsRead(notificationId: String) {
        viewModelScope.launch {
            notificationRepository.markAsRead(notificationId)
                .onSuccess {
                    updateState {
                        copy(
                            notifications = notifications.withItemUpdated(
                                predicate = { it.id == notificationId },
                                update = { it.copy(isRead = true) }
                            ),
                            unreadCount = maxOf(0, unreadCount - 1)
                        )
                    }
                }
                .onFailure { error ->
                    sendEffect(NotificationsEffect.ShowError(
                        error.message ?: "Failed to mark as read"
                    ))
                }
        }
    }

    private fun markAllAsRead() {
        updateState { copy(isMarkingAllRead = true) }

        viewModelScope.launch {
            notificationRepository.markAllAsRead()
                .onSuccess {
                    updateState {
                        copy(
                            isMarkingAllRead = false,
                            notifications = notifications.copy(
                                items = notifications.items.map { it.copy(isRead = true) }
                            ),
                            unreadCount = 0
                        )
                    }
                    sendEffect(NotificationsEffect.AllMarkedAsRead)
                }
                .onFailure { error ->
                    updateState { copy(isMarkingAllRead = false) }
                    sendEffect(NotificationsEffect.ShowError(
                        error.message ?: "Failed to mark all as read"
                    ))
                }
        }
    }

    private fun toggleUnreadOnly() {
        updateState {
            copy(
                unreadOnly = !unreadOnly,
                notifications = PaginationState()
            )
        }
        loadNotifications()
    }

    private fun refresh() {
        updateState { copy(notifications = notifications.withRefreshing()) }

        viewModelScope.launch {
            notificationRepository.getNotifications(
                unreadOnly = currentState.unreadOnly,
                page = 0,
                size = DEFAULT_PAGE_SIZE
            )
                .onSuccess { result ->
                    updateState {
                        copy(notifications = notifications.withRefreshedItems(
                            newItems = result.items,
                            hasMore = result.hasMore,
                            totalCount = result.totalCount
                        ))
                    }
                }
                .onFailure { error ->
                    updateState { copy(notifications = notifications.copy(isRefreshing = false)) }
                    sendEffect(NotificationsEffect.ShowError(
                        error.message ?: "Failed to refresh"
                    ))
                }

            loadUnreadCount()
        }
    }

    private fun viewNotification(notification: Notification) {
        // Mark as read when viewing
        if (!notification.isRead) {
            markAsRead(notification.id)
        }
        sendEffect(NotificationsEffect.NavigateToAction(notification))
    }

    private fun loadUnreadCount() {
        viewModelScope.launch {
            notificationRepository.getUnreadCount()
                .onSuccess { count ->
                    updateState { copy(unreadCount = count) }
                }
        }
    }
}
