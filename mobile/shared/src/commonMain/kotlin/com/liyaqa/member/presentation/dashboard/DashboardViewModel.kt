package com.liyaqa.member.presentation.dashboard

import androidx.lifecycle.viewModelScope
import com.liyaqa.member.domain.model.AttendanceStats
import com.liyaqa.member.domain.model.Booking
import com.liyaqa.member.domain.model.Member
import com.liyaqa.member.domain.model.PendingInvoicesSummary
import com.liyaqa.member.domain.model.Subscription
import com.liyaqa.member.domain.repository.DashboardRepository
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.base.MviViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * User intents/actions for the Dashboard screen.
 */
sealed interface DashboardIntent {
    /**
     * Load or reload dashboard data.
     */
    data object LoadDashboard : DashboardIntent

    /**
     * Pull-to-refresh action.
     */
    data object Refresh : DashboardIntent

    /**
     * Navigate to QR code screen.
     */
    data object NavigateToQr : DashboardIntent

    /**
     * Navigate to notifications screen.
     */
    data object NavigateToNotifications : DashboardIntent

    /**
     * Navigate to booking detail.
     */
    data class NavigateToBooking(val bookingId: String) : DashboardIntent

    /**
     * Navigate to invoice detail.
     */
    data class NavigateToInvoice(val invoiceId: String) : DashboardIntent

    /**
     * Start auto-refresh timer (when screen becomes active).
     */
    data object StartAutoRefresh : DashboardIntent

    /**
     * Stop auto-refresh timer (when screen becomes inactive).
     */
    data object StopAutoRefresh : DashboardIntent

    /**
     * Clear any error state.
     */
    data object ClearError : DashboardIntent
}

/**
 * UI state for the Dashboard screen.
 */
data class DashboardState(
    /**
     * Loading state for the main content.
     */
    val loading: LoadingState = LoadingState.Idle,

    /**
     * Current member information.
     */
    val member: Member? = null,

    /**
     * Current active subscription.
     */
    val subscription: Subscription? = null,

    /**
     * Attendance statistics (total visits, this month, etc.).
     */
    val attendanceStats: AttendanceStats? = null,

    /**
     * List of upcoming class bookings.
     */
    val upcomingClasses: List<Booking> = emptyList(),

    /**
     * Summary of pending invoices.
     */
    val pendingInvoices: PendingInvoicesSummary? = null,

    /**
     * Count of unread notifications.
     */
    val unreadNotifications: Int = 0,

    /**
     * Whether pull-to-refresh is in progress.
     */
    val isRefreshing: Boolean = false,

    /**
     * Timestamp of last successful refresh.
     */
    val lastRefreshedAt: Long? = null
) {
    /**
     * Whether the dashboard has loaded data.
     */
    val hasData: Boolean
        get() = member != null

    /**
     * Whether there are upcoming classes to display.
     */
    val hasUpcomingClasses: Boolean
        get() = upcomingClasses.isNotEmpty()

    /**
     * Whether there are pending invoices requiring attention.
     */
    val hasPendingInvoices: Boolean
        get() = (pendingInvoices?.count ?: 0) > 0

    /**
     * Whether there are overdue invoices.
     */
    val hasOverdueInvoices: Boolean
        get() = (pendingInvoices?.overdueCount ?: 0) > 0

    /**
     * Whether member has an active subscription.
     */
    val hasActiveSubscription: Boolean
        get() = subscription != null

    /**
     * Whether the subscription is expiring soon.
     */
    val isSubscriptionExpiringSoon: Boolean
        get() = subscription?.isExpiringSoon == true

    /**
     * Whether there are unread notifications.
     */
    val hasUnreadNotifications: Boolean
        get() = unreadNotifications > 0
}

/**
 * One-time effects/events from the Dashboard screen.
 */
sealed interface DashboardEffect {
    /**
     * Navigate to QR code screen.
     */
    data object NavigateToQr : DashboardEffect

    /**
     * Navigate to notifications screen.
     */
    data object NavigateToNotifications : DashboardEffect

    /**
     * Navigate to booking detail screen.
     */
    data class NavigateToBooking(val bookingId: String) : DashboardEffect

    /**
     * Navigate to invoice detail screen.
     */
    data class NavigateToInvoice(val invoiceId: String) : DashboardEffect

    /**
     * Show error message to user.
     */
    data class ShowError(val message: String) : DashboardEffect

    /**
     * Refresh completed (for pull-to-refresh indicator).
     */
    data object RefreshCompleted : DashboardEffect
}

/**
 * ViewModel for the Dashboard/Home screen.
 *
 * Features:
 * - Loads aggregated dashboard data (member, subscription, stats, upcoming classes, invoices)
 * - Supports pull-to-refresh
 * - Auto-refreshes every 30 seconds when screen is active
 * - Handles navigation to detail screens
 *
 * Usage:
 * ```kotlin
 * @Composable
 * fun DashboardScreen(viewModel: DashboardViewModel = koinViewModel()) {
 *     val state by viewModel.state.collectAsStateWithLifecycle()
 *
 *     // Start/stop auto-refresh based on lifecycle
 *     DisposableEffect(Unit) {
 *         viewModel.onIntent(DashboardIntent.StartAutoRefresh)
 *         onDispose { viewModel.onIntent(DashboardIntent.StopAutoRefresh) }
 *     }
 *
 *     // Handle effects
 *     CollectEffects(viewModel.effect) { effect ->
 *         when (effect) {
 *             is DashboardEffect.NavigateToQr -> navigateToQr()
 *             is DashboardEffect.ShowError -> showSnackbar(effect.message)
 *             // ...
 *         }
 *     }
 *
 *     // Render UI based on state
 *     DashboardContent(
 *         state = state,
 *         onRefresh = { viewModel.onIntent(DashboardIntent.Refresh) },
 *         onQrClick = { viewModel.onIntent(DashboardIntent.NavigateToQr) }
 *     )
 * }
 * ```
 */
class DashboardViewModel(
    private val dashboardRepository: DashboardRepository
) : MviViewModel<DashboardIntent, DashboardState, DashboardEffect>(DashboardState()) {

    companion object {
        /**
         * Auto-refresh interval in milliseconds (30 seconds).
         */
        private const val AUTO_REFRESH_INTERVAL_MS = 30_000L

        /**
         * Minimum time between refreshes to prevent spam (5 seconds).
         */
        private const val MIN_REFRESH_INTERVAL_MS = 5_000L
    }

    /**
     * Job for the auto-refresh coroutine.
     */
    private var autoRefreshJob: Job? = null

    init {
        // Load dashboard data on initialization
        onIntent(DashboardIntent.LoadDashboard)
    }

    override fun onIntent(intent: DashboardIntent) {
        when (intent) {
            is DashboardIntent.LoadDashboard -> loadDashboard()
            is DashboardIntent.Refresh -> refresh()
            is DashboardIntent.NavigateToQr -> sendEffect(DashboardEffect.NavigateToQr)
            is DashboardIntent.NavigateToNotifications -> sendEffect(DashboardEffect.NavigateToNotifications)
            is DashboardIntent.NavigateToBooking -> sendEffect(DashboardEffect.NavigateToBooking(intent.bookingId))
            is DashboardIntent.NavigateToInvoice -> sendEffect(DashboardEffect.NavigateToInvoice(intent.invoiceId))
            is DashboardIntent.StartAutoRefresh -> startAutoRefresh()
            is DashboardIntent.StopAutoRefresh -> stopAutoRefresh()
            is DashboardIntent.ClearError -> clearError()
        }
    }

    /**
     * Loads the dashboard data.
     * Shows loading state only if no data has been loaded yet.
     */
    private fun loadDashboard() {
        // Don't show loading spinner if we already have data (background refresh)
        if (!currentState.hasData) {
            updateState { copy(loading = LoadingState.Loading()) }
        }

        viewModelScope.launch {
            dashboardRepository.getDashboard()
                .onSuccess { dashboard ->
                    updateState {
                        copy(
                            loading = LoadingState.Success,
                            member = dashboard.member,
                            subscription = dashboard.subscription,
                            attendanceStats = dashboard.attendanceStats,
                            upcomingClasses = dashboard.upcomingClasses,
                            pendingInvoices = dashboard.pendingInvoices,
                            unreadNotifications = dashboard.unreadNotifications,
                            lastRefreshedAt = currentTimeMillis()
                        )
                    }
                }
                .onFailure { error ->
                    // Only show error state if we have no cached data
                    if (!currentState.hasData) {
                        updateState {
                            copy(
                                loading = LoadingState.Error(
                                    message = error.message ?: "Failed to load dashboard",
                                    throwable = error,
                                    isRetryable = true
                                )
                            )
                        }
                    } else {
                        // We have cached data, just show error toast
                        sendEffect(DashboardEffect.ShowError(
                            error.message ?: "Failed to refresh dashboard"
                        ))
                    }
                }
        }
    }

    /**
     * Refreshes the dashboard data (pull-to-refresh).
     * Respects minimum refresh interval to prevent spam.
     */
    private fun refresh() {
        // Check if we've refreshed recently
        val lastRefresh = currentState.lastRefreshedAt
        if (lastRefresh != null) {
            val timeSinceLastRefresh = currentTimeMillis() - lastRefresh
            if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL_MS) {
                // Too soon, just complete the refresh
                sendEffect(DashboardEffect.RefreshCompleted)
                return
            }
        }

        updateState { copy(isRefreshing = true) }

        viewModelScope.launch {
            dashboardRepository.getDashboard()
                .onSuccess { dashboard ->
                    updateState {
                        copy(
                            loading = LoadingState.Success,
                            member = dashboard.member,
                            subscription = dashboard.subscription,
                            attendanceStats = dashboard.attendanceStats,
                            upcomingClasses = dashboard.upcomingClasses,
                            pendingInvoices = dashboard.pendingInvoices,
                            unreadNotifications = dashboard.unreadNotifications,
                            isRefreshing = false,
                            lastRefreshedAt = currentTimeMillis()
                        )
                    }
                    sendEffect(DashboardEffect.RefreshCompleted)
                }
                .onFailure { error ->
                    updateState { copy(isRefreshing = false) }
                    sendEffect(DashboardEffect.ShowError(
                        error.message ?: "Failed to refresh dashboard"
                    ))
                    sendEffect(DashboardEffect.RefreshCompleted)
                }
        }
    }

    /**
     * Starts the auto-refresh timer.
     * Refreshes dashboard every 30 seconds while active.
     */
    private fun startAutoRefresh() {
        // Cancel any existing job
        autoRefreshJob?.cancel()

        autoRefreshJob = viewModelScope.launch {
            while (isActive) {
                delay(AUTO_REFRESH_INTERVAL_MS)
                // Only auto-refresh if we have data (don't interrupt initial load)
                if (currentState.hasData && !currentState.isRefreshing) {
                    loadDashboard()
                }
            }
        }
    }

    /**
     * Stops the auto-refresh timer.
     */
    private fun stopAutoRefresh() {
        autoRefreshJob?.cancel()
        autoRefreshJob = null
    }

    /**
     * Clears any error state and allows retry.
     */
    private fun clearError() {
        val currentLoading = currentState.loading
        if (currentLoading is LoadingState.Error) {
            updateState { copy(loading = LoadingState.Idle) }
        }
    }

    override fun onCleared() {
        super.onCleared()
        stopAutoRefresh()
    }

    /**
     * Platform-independent current time in milliseconds.
     */
    private fun currentTimeMillis(): Long = kotlinx.datetime.Clock.System.now().toEpochMilliseconds()
}
