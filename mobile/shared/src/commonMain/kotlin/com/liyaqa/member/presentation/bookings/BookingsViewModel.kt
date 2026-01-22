package com.liyaqa.member.presentation.bookings

import androidx.lifecycle.viewModelScope
import com.liyaqa.member.domain.model.Booking
import com.liyaqa.member.domain.repository.BookingRepository
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.base.MviViewModel
import com.liyaqa.member.presentation.base.PaginationState
import com.liyaqa.member.presentation.base.DEFAULT_PAGE_SIZE
import kotlinx.coroutines.launch

/**
 * Tab selection for bookings list.
 */
enum class BookingsTab {
    UPCOMING,
    PAST
}

/**
 * User intents for the Bookings screen.
 */
sealed interface BookingsIntent {
    /** Load upcoming bookings. */
    data object LoadUpcoming : BookingsIntent

    /** Load past bookings. */
    data object LoadPast : BookingsIntent

    /** Load more items for the active tab. */
    data object LoadMore : BookingsIntent

    /** Cancel a booking. */
    data class CancelBooking(val bookingId: String) : BookingsIntent

    /** Pull-to-refresh. */
    data object Refresh : BookingsIntent

    /** Switch tabs. */
    data class SwitchTab(val tab: BookingsTab) : BookingsIntent

    /** Navigate to booking detail. */
    data class ViewBookingDetail(val bookingId: String) : BookingsIntent

    /** Navigate to new booking screen. */
    data object NavigateToNewBooking : BookingsIntent
}

/**
 * UI state for the Bookings screen.
 */
data class BookingsState(
    /** Loading state for initial load. */
    val loading: LoadingState = LoadingState.Idle,

    /** Pagination state for upcoming bookings. */
    val upcomingBookings: PaginationState<Booking> = PaginationState(),

    /** Pagination state for past bookings. */
    val pastBookings: PaginationState<Booking> = PaginationState(),

    /** Currently active tab. */
    val activeTab: BookingsTab = BookingsTab.UPCOMING,

    /** ID of booking currently being cancelled. */
    val cancellingBookingId: String? = null
) {
    /** Get bookings for the active tab. */
    val activeBookings: PaginationState<Booking>
        get() = when (activeTab) {
            BookingsTab.UPCOMING -> upcomingBookings
            BookingsTab.PAST -> pastBookings
        }

    /** Whether a cancel operation is in progress. */
    val isCancelling: Boolean get() = cancellingBookingId != null
}

/**
 * One-time effects from the Bookings screen.
 */
sealed interface BookingsEffect {
    /** Booking was successfully cancelled. */
    data class BookingCancelled(val bookingId: String) : BookingsEffect

    /** Show error message. */
    data class ShowError(val message: String) : BookingsEffect

    /** Navigate to booking detail. */
    data class NavigateToDetail(val bookingId: String) : BookingsEffect

    /** Navigate to new booking screen. */
    data object NavigateToNewBooking : BookingsEffect

    /** Show cancel confirmation dialog. */
    data class ShowCancelConfirmation(val booking: Booking) : BookingsEffect
}

/**
 * ViewModel for the Bookings screen.
 *
 * Features:
 * - Upcoming and past bookings tabs
 * - Pagination with load more
 * - Cancel booking with confirmation
 * - Pull-to-refresh
 */
class BookingsViewModel(
    private val bookingRepository: BookingRepository
) : MviViewModel<BookingsIntent, BookingsState, BookingsEffect>(BookingsState()) {

    init {
        onIntent(BookingsIntent.LoadUpcoming)
    }

    override fun onIntent(intent: BookingsIntent) {
        when (intent) {
            is BookingsIntent.LoadUpcoming -> loadUpcomingBookings()
            is BookingsIntent.LoadPast -> loadPastBookings()
            is BookingsIntent.LoadMore -> loadMore()
            is BookingsIntent.CancelBooking -> cancelBooking(intent.bookingId)
            is BookingsIntent.Refresh -> refresh()
            is BookingsIntent.SwitchTab -> switchTab(intent.tab)
            is BookingsIntent.ViewBookingDetail -> sendEffect(BookingsEffect.NavigateToDetail(intent.bookingId))
            is BookingsIntent.NavigateToNewBooking -> sendEffect(BookingsEffect.NavigateToNewBooking)
        }
    }

    private fun loadUpcomingBookings() {
        if (currentState.upcomingBookings.isInitialLoading) return

        updateState { copy(upcomingBookings = upcomingBookings.withInitialLoading()) }

        viewModelScope.launch {
            bookingRepository.getUpcomingBookings(page = 0, size = DEFAULT_PAGE_SIZE)
                .onSuccess { result ->
                    updateState {
                        copy(
                            loading = LoadingState.Success,
                            upcomingBookings = upcomingBookings.withInitialItems(
                                newItems = result.items,
                                hasMore = result.hasMore,
                                totalCount = result.totalCount
                            )
                        )
                    }
                }
                .onFailure { error ->
                    updateState {
                        copy(upcomingBookings = upcomingBookings.withError(
                            error.message ?: "Failed to load bookings"
                        ))
                    }
                }
        }
    }

    private fun loadPastBookings() {
        if (currentState.pastBookings.isInitialLoading) return

        updateState { copy(pastBookings = pastBookings.withInitialLoading()) }

        viewModelScope.launch {
            bookingRepository.getPastBookings(page = 0, size = DEFAULT_PAGE_SIZE)
                .onSuccess { result ->
                    updateState {
                        copy(
                            pastBookings = pastBookings.withInitialItems(
                                newItems = result.items,
                                hasMore = result.hasMore,
                                totalCount = result.totalCount
                            )
                        )
                    }
                }
                .onFailure { error ->
                    updateState {
                        copy(pastBookings = pastBookings.withError(
                            error.message ?: "Failed to load bookings"
                        ))
                    }
                }
        }
    }

    private fun loadMore() {
        when (currentState.activeTab) {
            BookingsTab.UPCOMING -> loadMoreUpcoming()
            BookingsTab.PAST -> loadMorePast()
        }
    }

    private fun loadMoreUpcoming() {
        val pagination = currentState.upcomingBookings
        if (!pagination.canLoadMore) return

        updateState { copy(upcomingBookings = upcomingBookings.withLoadingMore()) }

        viewModelScope.launch {
            bookingRepository.getUpcomingBookings(
                page = pagination.nextPage,
                size = DEFAULT_PAGE_SIZE
            )
                .onSuccess { result ->
                    updateState {
                        copy(upcomingBookings = upcomingBookings.withNewItems(
                            newItems = result.items,
                            hasMore = result.hasMore,
                            totalCount = result.totalCount
                        ))
                    }
                }
                .onFailure { error ->
                    updateState {
                        copy(upcomingBookings = upcomingBookings.withError(
                            error.message ?: "Failed to load more"
                        ))
                    }
                }
        }
    }

    private fun loadMorePast() {
        val pagination = currentState.pastBookings
        if (!pagination.canLoadMore) return

        updateState { copy(pastBookings = pastBookings.withLoadingMore()) }

        viewModelScope.launch {
            bookingRepository.getPastBookings(
                page = pagination.nextPage,
                size = DEFAULT_PAGE_SIZE
            )
                .onSuccess { result ->
                    updateState {
                        copy(pastBookings = pastBookings.withNewItems(
                            newItems = result.items,
                            hasMore = result.hasMore,
                            totalCount = result.totalCount
                        ))
                    }
                }
                .onFailure { error ->
                    updateState {
                        copy(pastBookings = pastBookings.withError(
                            error.message ?: "Failed to load more"
                        ))
                    }
                }
        }
    }

    private fun cancelBooking(bookingId: String) {
        updateState { copy(cancellingBookingId = bookingId) }

        viewModelScope.launch {
            bookingRepository.cancelBooking(bookingId)
                .onSuccess {
                    updateState {
                        copy(
                            cancellingBookingId = null,
                            upcomingBookings = upcomingBookings.withItemRemoved { it.id == bookingId }
                        )
                    }
                    sendEffect(BookingsEffect.BookingCancelled(bookingId))
                }
                .onFailure { error ->
                    updateState { copy(cancellingBookingId = null) }
                    sendEffect(BookingsEffect.ShowError(
                        error.message ?: "Failed to cancel booking"
                    ))
                }
        }
    }

    private fun refresh() {
        when (currentState.activeTab) {
            BookingsTab.UPCOMING -> {
                updateState { copy(upcomingBookings = upcomingBookings.withRefreshing()) }
                viewModelScope.launch {
                    bookingRepository.getUpcomingBookings(page = 0, size = DEFAULT_PAGE_SIZE)
                        .onSuccess { result ->
                            updateState {
                                copy(upcomingBookings = upcomingBookings.withRefreshedItems(
                                    newItems = result.items,
                                    hasMore = result.hasMore,
                                    totalCount = result.totalCount
                                ))
                            }
                        }
                        .onFailure { error ->
                            updateState {
                                copy(upcomingBookings = upcomingBookings.copy(isRefreshing = false))
                            }
                            sendEffect(BookingsEffect.ShowError(
                                error.message ?: "Failed to refresh"
                            ))
                        }
                }
            }
            BookingsTab.PAST -> {
                updateState { copy(pastBookings = pastBookings.withRefreshing()) }
                viewModelScope.launch {
                    bookingRepository.getPastBookings(page = 0, size = DEFAULT_PAGE_SIZE)
                        .onSuccess { result ->
                            updateState {
                                copy(pastBookings = pastBookings.withRefreshedItems(
                                    newItems = result.items,
                                    hasMore = result.hasMore,
                                    totalCount = result.totalCount
                                ))
                            }
                        }
                        .onFailure { error ->
                            updateState {
                                copy(pastBookings = pastBookings.copy(isRefreshing = false))
                            }
                            sendEffect(BookingsEffect.ShowError(
                                error.message ?: "Failed to refresh"
                            ))
                        }
                }
            }
        }
    }

    private fun switchTab(tab: BookingsTab) {
        updateState { copy(activeTab = tab) }

        // Load data for the new tab if not already loaded
        when (tab) {
            BookingsTab.UPCOMING -> {
                if (currentState.upcomingBookings.items.isEmpty() &&
                    !currentState.upcomingBookings.isInitialLoading) {
                    loadUpcomingBookings()
                }
            }
            BookingsTab.PAST -> {
                if (currentState.pastBookings.items.isEmpty() &&
                    !currentState.pastBookings.isInitialLoading) {
                    loadPastBookings()
                }
            }
        }
    }
}
