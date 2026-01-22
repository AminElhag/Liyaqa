package com.liyaqa.member.presentation.viewmodel

import com.liyaqa.member.domain.model.Booking
import com.liyaqa.member.domain.model.BookingStatus
import com.liyaqa.member.domain.repository.BookingRepository
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.base.MviViewModel

/**
 * User intents for the My Bookings screen.
 */
sealed interface BookingsIntent {
    /** Initial load of bookings */
    data object LoadBookings : BookingsIntent

    /** Pull-to-refresh action */
    data object Refresh : BookingsIntent

    /** Load more bookings (pagination) */
    data object LoadMore : BookingsIntent

    /** Switch between Upcoming and Past tabs */
    data class SwitchTab(val tab: BookingsTab) : BookingsIntent

    /** Filter bookings by status */
    data class FilterByStatus(val status: BookingStatus?) : BookingsIntent

    /** Request to cancel a booking */
    data class RequestCancelBooking(val booking: Booking) : BookingsIntent

    /** Confirm booking cancellation */
    data object ConfirmCancelBooking : BookingsIntent

    /** Dismiss cancel booking dialog */
    data object DismissCancelDialog : BookingsIntent

    /** Navigate to booking detail */
    data class ViewBookingDetail(val bookingId: String) : BookingsIntent

    /** Navigate to new booking screen */
    data object NavigateToNewBooking : BookingsIntent
}

/**
 * Tab enum for bookings screen.
 */
enum class BookingsTab {
    UPCOMING,
    PAST
}

/**
 * UI state for the My Bookings screen.
 */
data class BookingsState(
    val loading: LoadingState = LoadingState.Idle,
    val activeTab: BookingsTab = BookingsTab.UPCOMING,
    val upcomingBookings: List<Booking> = emptyList(),
    val pastBookings: List<Booking> = emptyList(),
    val hasMoreUpcoming: Boolean = false,
    val hasMorePast: Boolean = false,
    val upcomingPage: Int = 0,
    val pastPage: Int = 0,
    val isRefreshing: Boolean = false,
    val isLoadingMore: Boolean = false,
    val statusFilter: BookingStatus? = null,
    val bookingToCancel: Booking? = null,
    val isCancelling: Boolean = false
) {
    val currentBookings: List<Booking>
        get() {
            val bookings = if (activeTab == BookingsTab.UPCOMING) upcomingBookings else pastBookings
            return if (statusFilter != null) {
                bookings.filter { it.status == statusFilter }
            } else {
                bookings
            }
        }

    val hasMore: Boolean
        get() = if (activeTab == BookingsTab.UPCOMING) hasMoreUpcoming else hasMorePast

    val isEmpty: Boolean
        get() = currentBookings.isEmpty() && loading !is LoadingState.Loading

    val showCancelDialog: Boolean
        get() = bookingToCancel != null
}

/**
 * One-time effects for the My Bookings screen.
 */
sealed interface BookingsEffect {
    /** Show error message */
    data class ShowError(val message: String) : BookingsEffect

    /** Booking cancelled successfully */
    data class BookingCancelled(val message: String) : BookingsEffect

    /** Navigate to booking detail */
    data class NavigateToDetail(val bookingId: String) : BookingsEffect

    /** Navigate to new booking screen */
    data object NavigateToNewBooking : BookingsEffect
}

/**
 * ViewModel for the My Bookings screen.
 *
 * Manages:
 * - Upcoming and past bookings lists
 * - Tab switching
 * - Pagination (load more)
 * - Pull-to-refresh
 * - Booking cancellation with confirmation
 * - Status filtering
 */
class BookingsViewModel(
    private val bookingRepository: BookingRepository
) : MviViewModel<BookingsIntent, BookingsState, BookingsEffect>(BookingsState()) {

    companion object {
        private const val PAGE_SIZE = 20
    }

    init {
        onIntent(BookingsIntent.LoadBookings)
    }

    override fun onIntent(intent: BookingsIntent) {
        when (intent) {
            is BookingsIntent.LoadBookings -> loadBookings()
            is BookingsIntent.Refresh -> refresh()
            is BookingsIntent.LoadMore -> loadMore()
            is BookingsIntent.SwitchTab -> switchTab(intent.tab)
            is BookingsIntent.FilterByStatus -> filterByStatus(intent.status)
            is BookingsIntent.RequestCancelBooking -> requestCancelBooking(intent.booking)
            is BookingsIntent.ConfirmCancelBooking -> confirmCancelBooking()
            is BookingsIntent.DismissCancelDialog -> dismissCancelDialog()
            is BookingsIntent.ViewBookingDetail -> sendEffect(BookingsEffect.NavigateToDetail(intent.bookingId))
            is BookingsIntent.NavigateToNewBooking -> sendEffect(BookingsEffect.NavigateToNewBooking)
        }
    }

    private fun loadBookings() {
        if (currentState.loading is LoadingState.Loading) return

        launch {
            updateState { copy(loading = LoadingState.Loading()) }

            // Load both tabs initially
            val upcomingResult = bookingRepository.getUpcomingBookings(page = 0, size = PAGE_SIZE)
            val pastResult = bookingRepository.getPastBookings(page = 0, size = PAGE_SIZE)

            upcomingResult
                .onSuccess { upcoming ->
                    updateState {
                        copy(
                            upcomingBookings = upcoming.items,
                            hasMoreUpcoming = upcoming.hasMore,
                            upcomingPage = 0
                        )
                    }
                }
                .onFailure { error ->
                    updateState {
                        copy(loading = LoadingState.Error(error.message ?: "Failed to load bookings"))
                    }
                    return@launch
                }

            pastResult
                .onSuccess { past ->
                    updateState {
                        copy(
                            loading = LoadingState.Success,
                            pastBookings = past.items,
                            hasMorePast = past.hasMore,
                            pastPage = 0
                        )
                    }
                }
                .onFailure { error ->
                    updateState {
                        copy(loading = LoadingState.Error(error.message ?: "Failed to load bookings"))
                    }
                }
        }
    }

    private fun refresh() {
        launch {
            updateState { copy(isRefreshing = true) }

            val result = if (currentState.activeTab == BookingsTab.UPCOMING) {
                bookingRepository.getUpcomingBookings(page = 0, size = PAGE_SIZE)
            } else {
                bookingRepository.getPastBookings(page = 0, size = PAGE_SIZE)
            }

            result
                .onSuccess { paged ->
                    updateState {
                        if (activeTab == BookingsTab.UPCOMING) {
                            copy(
                                isRefreshing = false,
                                loading = LoadingState.Success,
                                upcomingBookings = paged.items,
                                hasMoreUpcoming = paged.hasMore,
                                upcomingPage = 0
                            )
                        } else {
                            copy(
                                isRefreshing = false,
                                loading = LoadingState.Success,
                                pastBookings = paged.items,
                                hasMorePast = paged.hasMore,
                                pastPage = 0
                            )
                        }
                    }
                }
                .onFailure { error ->
                    updateState { copy(isRefreshing = false) }
                    sendEffect(BookingsEffect.ShowError(error.message ?: "Failed to refresh"))
                }
        }
    }

    private fun loadMore() {
        if (currentState.isLoadingMore || !currentState.hasMore) return

        launch {
            updateState { copy(isLoadingMore = true) }

            val isUpcoming = currentState.activeTab == BookingsTab.UPCOMING
            val page = if (isUpcoming) currentState.upcomingPage + 1 else currentState.pastPage + 1

            val result = if (isUpcoming) {
                bookingRepository.getUpcomingBookings(page = page, size = PAGE_SIZE)
            } else {
                bookingRepository.getPastBookings(page = page, size = PAGE_SIZE)
            }

            result
                .onSuccess { paged ->
                    updateState {
                        if (isUpcoming) {
                            copy(
                                isLoadingMore = false,
                                upcomingBookings = upcomingBookings + paged.items,
                                hasMoreUpcoming = paged.hasMore,
                                upcomingPage = page
                            )
                        } else {
                            copy(
                                isLoadingMore = false,
                                pastBookings = pastBookings + paged.items,
                                hasMorePast = paged.hasMore,
                                pastPage = page
                            )
                        }
                    }
                }
                .onFailure { error ->
                    updateState { copy(isLoadingMore = false) }
                    sendEffect(BookingsEffect.ShowError(error.message ?: "Failed to load more"))
                }
        }
    }

    private fun switchTab(tab: BookingsTab) {
        updateState { copy(activeTab = tab) }
    }

    private fun filterByStatus(status: BookingStatus?) {
        updateState { copy(statusFilter = status) }
    }

    private fun requestCancelBooking(booking: Booking) {
        updateState { copy(bookingToCancel = booking) }
    }

    private fun dismissCancelDialog() {
        updateState { copy(bookingToCancel = null) }
    }

    private fun confirmCancelBooking() {
        val booking = currentState.bookingToCancel ?: return

        launch {
            updateState { copy(isCancelling = true) }

            bookingRepository.cancelBooking(booking.id)
                .onSuccess {
                    // Remove from list
                    updateState {
                        copy(
                            isCancelling = false,
                            bookingToCancel = null,
                            upcomingBookings = upcomingBookings.filter { it.id != booking.id },
                            pastBookings = pastBookings.filter { it.id != booking.id }
                        )
                    }
                    sendEffect(BookingsEffect.BookingCancelled("Booking cancelled successfully"))
                }
                .onFailure { error ->
                    updateState { copy(isCancelling = false, bookingToCancel = null) }
                    sendEffect(BookingsEffect.ShowError(error.message ?: "Failed to cancel booking"))
                }
        }
    }
}
