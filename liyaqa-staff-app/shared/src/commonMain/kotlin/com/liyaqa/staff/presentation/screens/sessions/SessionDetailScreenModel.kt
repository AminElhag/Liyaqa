package com.liyaqa.staff.presentation.screens.sessions

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.liyaqa.staff.domain.model.ClassSession
import com.liyaqa.staff.domain.model.SessionBooking
import com.liyaqa.staff.domain.repository.SessionRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class SessionDetailUiState(
    val isLoading: Boolean = true,
    val session: ClassSession? = null,
    val bookings: List<SessionBooking> = emptyList(),
    val error: String? = null,
    val actionInProgress: String? = null,
    val actionSuccess: String? = null
)

class SessionDetailScreenModel(
    private val sessionId: String,
    private val sessionRepository: SessionRepository
) : ScreenModel {

    private val _uiState = MutableStateFlow(SessionDetailUiState())
    val uiState: StateFlow<SessionDetailUiState> = _uiState.asStateFlow()

    init {
        loadSessionDetails()
    }

    fun loadSessionDetails() {
        screenModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            val sessionResult = sessionRepository.getSessionById(sessionId)
            val bookingsResult = sessionRepository.getSessionBookings(sessionId)

            _uiState.value = when {
                sessionResult.isSuccess && bookingsResult.isSuccess -> _uiState.value.copy(
                    isLoading = false,
                    session = sessionResult.getOrNull(),
                    bookings = bookingsResult.getOrNull() ?: emptyList()
                )
                else -> _uiState.value.copy(
                    isLoading = false,
                    error = sessionResult.exceptionOrNull()?.message
                        ?: bookingsResult.exceptionOrNull()?.message
                        ?: "Failed to load session"
                )
            }
        }
    }

    fun markAttended(bookingId: String) {
        screenModelScope.launch {
            _uiState.value = _uiState.value.copy(
                actionInProgress = bookingId,
                actionSuccess = null
            )

            val result = sessionRepository.markBookingAttended(bookingId)

            if (result.isSuccess) {
                _uiState.value = _uiState.value.copy(
                    actionInProgress = null,
                    actionSuccess = "Marked as attended",
                    bookings = _uiState.value.bookings.map {
                        if (it.id == bookingId) result.getOrNull() ?: it else it
                    }
                )
            } else {
                _uiState.value = _uiState.value.copy(
                    actionInProgress = null,
                    error = result.exceptionOrNull()?.message ?: "Failed to mark attended"
                )
            }
        }
    }

    fun markNoShow(bookingId: String) {
        screenModelScope.launch {
            _uiState.value = _uiState.value.copy(
                actionInProgress = bookingId,
                actionSuccess = null
            )

            val result = sessionRepository.markBookingNoShow(bookingId)

            if (result.isSuccess) {
                _uiState.value = _uiState.value.copy(
                    actionInProgress = null,
                    actionSuccess = "Marked as no-show",
                    bookings = _uiState.value.bookings.map {
                        if (it.id == bookingId) result.getOrNull() ?: it else it
                    }
                )
            } else {
                _uiState.value = _uiState.value.copy(
                    actionInProgress = null,
                    error = result.exceptionOrNull()?.message ?: "Failed to mark no-show"
                )
            }
        }
    }

    fun clearMessages() {
        _uiState.value = _uiState.value.copy(error = null, actionSuccess = null)
    }
}
