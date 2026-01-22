package com.liyaqa.member.presentation.viewmodel

import androidx.lifecycle.viewModelScope
import com.liyaqa.member.domain.model.AttendanceStats
import com.liyaqa.member.domain.model.Booking
import com.liyaqa.member.domain.model.DashboardData
import com.liyaqa.member.domain.model.Member
import com.liyaqa.member.domain.model.PendingInvoicesSummary
import com.liyaqa.member.domain.model.Subscription
import com.liyaqa.member.domain.repository.DashboardRepository
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.base.MviViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * User intents for the Dashboard screen.
 */
sealed interface DashboardIntent {
    /** Initial load of dashboard data */
    data object LoadDashboard : DashboardIntent

    /** Pull-to-refresh action */
    data object Refresh : DashboardIntent

    /** Navigate to QR code screen */
    data object NavigateToQr : DashboardIntent

    /** Navigate to notifications screen */
    data object NavigateToNotifications : DashboardIntent

    /** Navigate to booking detail */
    data class NavigateToBooking(val bookingId: String) : DashboardIntent

    /** Navigate to invoice list/detail */
    data class NavigateToInvoices(val invoiceId: String? = null) : DashboardIntent
}

/**
 * UI state for the Dashboard screen.
 */
data class DashboardState(
    val loading: LoadingState = LoadingState.Idle,
    val isRefreshing: Boolean = false,
    val member: Member? = null,
    val subscription: Subscription? = null,
    val attendanceStats: AttendanceStats? = null,
    val upcomingClasses: List<Booking> = emptyList(),
    val pendingInvoices: PendingInvoicesSummary? = null,
    val unreadNotifications: Int = 0
) {
    val hasData: Boolean
        get() = member != null

    val hasActiveSubscription: Boolean
        get() = subscription != null

    val hasPendingInvoices: Boolean
        get() = (pendingInvoices?.count ?: 0) > 0

    val hasUpcomingClasses: Boolean
        get() = upcomingClasses.isNotEmpty()
}

/**
 * One-time effects for the Dashboard screen.
 */
sealed interface DashboardEffect {
    /** Navigate to QR code screen */
    data object NavigateToQr : DashboardEffect

    /** Navigate to notifications screen */
    data object NavigateToNotifications : DashboardEffect

    /** Navigate to booking detail */
    data class NavigateToBooking(val bookingId: String) : DashboardEffect

    /** Navigate to invoices screen */
    data class NavigateToInvoices(val invoiceId: String? = null) : DashboardEffect

    /** Show error message */
    data class ShowError(val message: String) : DashboardEffect
}

/**
 * ViewModel for the Dashboard (Home) screen.
 *
 * Manages dashboard data including:
 * - Member profile summary
 * - Subscription status
 * - Attendance statistics
 * - Upcoming classes
 * - Pending invoices
 * - Unread notifications count
 *
 * Features auto-refresh every 30 seconds when screen is active.
 */
class DashboardViewModel(
    private val dashboardRepository: DashboardRepository
) : MviViewModel<DashboardIntent, DashboardState, DashboardEffect>(DashboardState()) {

    companion object {
        private const val AUTO_REFRESH_INTERVAL_MS = 30_000L
    }

    init {
        // Load dashboard on initialization
        onIntent(DashboardIntent.LoadDashboard)
        // Start auto-refresh
        startAutoRefresh()
    }

    override fun onIntent(intent: DashboardIntent) {
        when (intent) {
            is DashboardIntent.LoadDashboard -> loadDashboard()
            is DashboardIntent.Refresh -> refresh()
            is DashboardIntent.NavigateToQr -> sendEffect(DashboardEffect.NavigateToQr)
            is DashboardIntent.NavigateToNotifications -> sendEffect(DashboardEffect.NavigateToNotifications)
            is DashboardIntent.NavigateToBooking -> sendEffect(DashboardEffect.NavigateToBooking(intent.bookingId))
            is DashboardIntent.NavigateToInvoices -> sendEffect(DashboardEffect.NavigateToInvoices(intent.invoiceId))
        }
    }

    private fun loadDashboard() {
        if (currentState.loading is LoadingState.Loading) return

        launch {
            updateState { copy(loading = LoadingState.Loading()) }

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
                            unreadNotifications = dashboard.unreadNotifications
                        )
                    }
                }
                .onFailure { error ->
                    updateState {
                        copy(loading = LoadingState.Error(error.message ?: "Failed to load dashboard"))
                    }
                }
        }
    }

    private fun refresh() {
        launch {
            updateState { copy(isRefreshing = true) }

            dashboardRepository.getDashboard()
                .onSuccess { dashboard ->
                    updateState {
                        copy(
                            isRefreshing = false,
                            loading = LoadingState.Success,
                            member = dashboard.member,
                            subscription = dashboard.subscription,
                            attendanceStats = dashboard.attendanceStats,
                            upcomingClasses = dashboard.upcomingClasses,
                            pendingInvoices = dashboard.pendingInvoices,
                            unreadNotifications = dashboard.unreadNotifications
                        )
                    }
                }
                .onFailure { error ->
                    updateState { copy(isRefreshing = false) }
                    sendEffect(DashboardEffect.ShowError(error.message ?: "Failed to refresh"))
                }
        }
    }

    private fun startAutoRefresh() {
        viewModelScope.launch {
            while (isActive) {
                delay(AUTO_REFRESH_INTERVAL_MS)
                // Only refresh if not currently loading and has data
                if (currentState.loading !is LoadingState.Loading && currentState.hasData) {
                    silentRefresh()
                }
            }
        }
    }

    private suspend fun silentRefresh() {
        dashboardRepository.getDashboard()
            .onSuccess { dashboard ->
                updateState {
                    copy(
                        member = dashboard.member,
                        subscription = dashboard.subscription,
                        attendanceStats = dashboard.attendanceStats,
                        upcomingClasses = dashboard.upcomingClasses,
                        pendingInvoices = dashboard.pendingInvoices,
                        unreadNotifications = dashboard.unreadNotifications
                    )
                }
            }
        // Silently ignore errors on auto-refresh
    }
}
