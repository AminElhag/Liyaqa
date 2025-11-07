package com.liyaqa.dashboard.features.booking.presentation.list

import androidx.lifecycle.viewModelScope
import com.liyaqa.dashboard.core.domain.Result
import com.liyaqa.dashboard.core.presentation.BaseViewModel
import com.liyaqa.dashboard.core.presentation.UiEvent
import com.liyaqa.dashboard.core.presentation.UiState
import com.liyaqa.dashboard.features.booking.data.dto.toDomain
import com.liyaqa.dashboard.features.booking.domain.model.Booking
import com.liyaqa.dashboard.features.booking.domain.model.BookingStatus
import com.liyaqa.dashboard.features.booking.domain.usecase.CancelBookingUseCase
import com.liyaqa.dashboard.features.booking.domain.usecase.CheckInBookingUseCase
import com.liyaqa.dashboard.features.booking.domain.usecase.GetBookingsUseCase
import kotlinx.coroutines.launch

data class BookingListUiState(
    val bookings: List<Booking> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val selectedStatus: BookingStatus? = null,
    val currentPage: Int = 0,
    val totalPages: Int = 0,
    val hasMore: Boolean = false,
    val showCancelDialog: Boolean = false,
    val bookingToCancel: Booking? = null
) : UiState

sealed class BookingListUiEvent : UiEvent {
    data class StatusFilterChanged(val status: BookingStatus?) : BookingListUiEvent()
    data object LoadMore : BookingListUiEvent()
    data object Refresh : BookingListUiEvent()
    data class ShowCancelDialog(val booking: Booking) : BookingListUiEvent()
    data object HideCancelDialog : BookingListUiEvent()
    data object ConfirmCancel : BookingListUiEvent()
    data class CheckIn(val booking: Booking) : BookingListUiEvent()
    data object ClearError : BookingListUiEvent()
}

class BookingListViewModel(
    private val getBookingsUseCase: GetBookingsUseCase,
    private val cancelBookingUseCase: CancelBookingUseCase,
    private val checkInBookingUseCase: CheckInBookingUseCase
) : BaseViewModel<BookingListUiState, BookingListUiEvent>() {

    init {
        loadBookings()
    }

    override fun initialState() = BookingListUiState()

    override fun onEvent(event: BookingListUiEvent) {
        when (event) {
            is BookingListUiEvent.StatusFilterChanged -> handleStatusFilterChanged(event.status)
            is BookingListUiEvent.LoadMore -> loadMore()
            is BookingListUiEvent.Refresh -> refresh()
            is BookingListUiEvent.ShowCancelDialog -> showCancelDialog(event.booking)
            is BookingListUiEvent.HideCancelDialog -> hideCancelDialog()
            is BookingListUiEvent.ConfirmCancel -> confirmCancel()
            is BookingListUiEvent.CheckIn -> checkIn(event.booking)
            is BookingListUiEvent.ClearError -> clearError()
        }
    }

    private fun handleStatusFilterChanged(status: BookingStatus?) {
        updateState { copy(selectedStatus = status) }
        loadBookings(reset = true)
    }

    private fun loadMore() {
        val currentState = uiState.value
        if (!currentState.isLoading && currentState.hasMore) {
            loadBookings(page = currentState.currentPage + 1)
        }
    }

    private fun refresh() {
        loadBookings(reset = true)
    }

    private fun loadBookings(page: Int = 0, reset: Boolean = false) {
        viewModelScope.launch {
            updateState { copy(isLoading = true, error = null) }

            val params = GetBookingsUseCase.Params(
                page = page,
                size = 20,
                status = uiState.value.selectedStatus?.name
            )

            when (val result = getBookingsUseCase(params)) {
                is Result.Success -> {
                    val data = result.data
                    updateState {
                        copy(
                            bookings = if (reset) data.content.map { it.toDomain() }
                            else bookings + data.content.map { it.toDomain() },
                            currentPage = data.page,
                            totalPages = data.totalPages,
                            hasMore = data.page < data.totalPages - 1,
                            isLoading = false
                        )
                    }
                }
                is Result.Error -> {
                    updateState {
                        copy(
                            isLoading = false,
                            error = result.message ?: "Failed to load bookings"
                        )
                    }
                }
                is Result.Loading -> {
                    // Already handled above
                }
            }
        }
    }

    private fun showCancelDialog(booking: Booking) {
        updateState {
            copy(showCancelDialog = true, bookingToCancel = booking)
        }
    }

    private fun hideCancelDialog() {
        updateState {
            copy(showCancelDialog = false, bookingToCancel = null)
        }
    }

    private fun confirmCancel() {
        val booking = uiState.value.bookingToCancel ?: return

        viewModelScope.launch {
            hideCancelDialog()
            updateState { copy(isLoading = true, error = null) }

            when (val result = cancelBookingUseCase(CancelBookingUseCase.Params(booking.id))) {
                is Result.Success -> {
                    updateState {
                        copy(
                            bookings = bookings.map {
                                if (it.id == booking.id) result.data else it
                            },
                            isLoading = false
                        )
                    }
                }
                is Result.Error -> {
                    updateState {
                        copy(
                            isLoading = false,
                            error = result.message ?: "Failed to cancel booking"
                        )
                    }
                }
                is Result.Loading -> {
                    // Already handled above
                }
            }
        }
    }

    private fun checkIn(booking: Booking) {
        viewModelScope.launch {
            updateState { copy(isLoading = true, error = null) }

            when (val result = checkInBookingUseCase(CheckInBookingUseCase.Params(booking.id))) {
                is Result.Success -> {
                    updateState {
                        copy(
                            bookings = bookings.map {
                                if (it.id == booking.id) result.data else it
                            },
                            isLoading = false
                        )
                    }
                }
                is Result.Error -> {
                    updateState {
                        copy(
                            isLoading = false,
                            error = result.message ?: "Failed to check in"
                        )
                    }
                }
                is Result.Loading -> {
                    // Already handled above
                }
            }
        }
    }

    private fun clearError() {
        updateState { copy(error = null) }
    }
}
