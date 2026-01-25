package com.liyaqa.member.presentation.screens.schedule

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.liyaqa.member.domain.model.BookingRequest
import com.liyaqa.member.domain.model.Session
import com.liyaqa.member.domain.repository.BookingRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ScheduleState(
    val isLoading: Boolean = false,
    val sessions: List<Session> = emptyList(),
    val selectedDate: String? = null,
    val isBooking: Boolean = false,
    val bookingSuccess: Boolean = false,
    val error: ScheduleError? = null
)

data class ScheduleError(
    val message: String,
    val messageAr: String? = null
)

class ScheduleScreenModel(
    private val bookingRepository: BookingRepository
) : ScreenModel {

    private val _state = MutableStateFlow(ScheduleState())
    val state: StateFlow<ScheduleState> = _state.asStateFlow()

    fun loadSessions(days: Int = 7) {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            bookingRepository.getAvailableSessions(days = days).onSuccess { sessions ->
                _state.update {
                    it.copy(
                        isLoading = false,
                        sessions = sessions.sortedWith(
                            compareBy({ it.date }, { it.startTime })
                        )
                    )
                }
            }.onError { error ->
                _state.update {
                    it.copy(
                        isLoading = false,
                        error = ScheduleError(
                            message = error.message ?: "Failed to load sessions",
                            messageAr = error.messageAr
                        )
                    )
                }
            }
        }
    }

    fun bookSession(sessionId: String) {
        screenModelScope.launch {
            _state.update { it.copy(isBooking = true, error = null) }

            bookingRepository.bookSession(BookingRequest(sessionId)).onSuccess {
                _state.update {
                    it.copy(
                        isBooking = false,
                        bookingSuccess = true
                    )
                }
                // Reload sessions to update availability
                loadSessions()
            }.onError { error ->
                _state.update {
                    it.copy(
                        isBooking = false,
                        error = ScheduleError(
                            message = error.message ?: "Failed to book session",
                            messageAr = error.messageAr
                        )
                    )
                }
            }
        }
    }

    fun clearBookingSuccess() {
        _state.update { it.copy(bookingSuccess = false) }
    }
}
