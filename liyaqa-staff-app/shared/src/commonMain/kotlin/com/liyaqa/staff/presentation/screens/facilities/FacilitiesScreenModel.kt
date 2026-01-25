package com.liyaqa.staff.presentation.screens.facilities

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.liyaqa.staff.domain.model.FacilityBooking
import com.liyaqa.staff.domain.model.TodayFacilityBookings
import com.liyaqa.staff.domain.repository.FacilityBookingRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class FacilitiesUiState(
    val isLoading: Boolean = true,
    val todayBookings: TodayFacilityBookings? = null,
    val bookings: List<FacilityBooking> = emptyList(),
    val error: String? = null,
    val actionInProgress: String? = null,
    val actionSuccess: String? = null
)

class FacilitiesScreenModel(
    private val facilityBookingRepository: FacilityBookingRepository
) : ScreenModel {

    private val _uiState = MutableStateFlow(FacilitiesUiState())
    val uiState: StateFlow<FacilitiesUiState> = _uiState.asStateFlow()

    init {
        loadBookings()
    }

    fun loadBookings() {
        screenModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            val result = facilityBookingRepository.getTodayBookings()

            _uiState.value = when {
                result.isSuccess -> {
                    val todayBookings = result.getOrNull()
                    _uiState.value.copy(
                        isLoading = false,
                        todayBookings = todayBookings,
                        bookings = todayBookings?.bookings ?: emptyList()
                    )
                }
                else -> _uiState.value.copy(
                    isLoading = false,
                    error = result.exceptionOrNull()?.message ?: "Failed to load bookings"
                )
            }
        }
    }

    fun checkInBooking(bookingId: String) {
        screenModelScope.launch {
            _uiState.value = _uiState.value.copy(
                actionInProgress = bookingId,
                actionSuccess = null
            )

            val result = facilityBookingRepository.markBookingCheckedIn(bookingId)

            if (result.isSuccess) {
                _uiState.value = _uiState.value.copy(
                    actionInProgress = null,
                    actionSuccess = "Check-in successful",
                    bookings = _uiState.value.bookings.map {
                        if (it.id == bookingId) result.getOrNull() ?: it else it
                    }
                )
            } else {
                _uiState.value = _uiState.value.copy(
                    actionInProgress = null,
                    error = result.exceptionOrNull()?.message ?: "Check-in failed"
                )
            }
        }
    }

    fun cancelBooking(bookingId: String) {
        screenModelScope.launch {
            _uiState.value = _uiState.value.copy(
                actionInProgress = bookingId,
                actionSuccess = null
            )

            val result = facilityBookingRepository.cancelBooking(bookingId)

            if (result.isSuccess) {
                _uiState.value = _uiState.value.copy(
                    actionInProgress = null,
                    actionSuccess = "Booking cancelled",
                    bookings = _uiState.value.bookings.map {
                        if (it.id == bookingId) result.getOrNull() ?: it else it
                    }
                )
            } else {
                _uiState.value = _uiState.value.copy(
                    actionInProgress = null,
                    error = result.exceptionOrNull()?.message ?: "Cancellation failed"
                )
            }
        }
    }

    fun refresh() {
        loadBookings()
    }

    fun clearMessages() {
        _uiState.value = _uiState.value.copy(error = null, actionSuccess = null)
    }
}
