package com.liyaqa.member.presentation.screens.trainers

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.liyaqa.member.domain.model.PTBookingRequest
import com.liyaqa.member.domain.model.PTSession
import com.liyaqa.member.domain.model.TimeSlot
import com.liyaqa.member.domain.model.Trainer
import com.liyaqa.member.domain.repository.TrainerRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class PTBookingState(
    val isLoading: Boolean = false,
    val isLoadingSlots: Boolean = false,
    val isBooking: Boolean = false,
    val isBookingSuccess: Boolean = false,
    val trainer: Trainer? = null,
    val trainerId: String = "",
    val selectedDate: String = "",
    val availableDates: List<String> = emptyList(),
    val timeSlots: List<TimeSlot> = emptyList(),
    val selectedSlot: TimeSlot? = null,
    val notes: String = "",
    val bookedSession: PTSession? = null,
    val error: PTBookingError? = null
) {
    val canBook: Boolean
        get() = selectedDate.isNotEmpty() && selectedSlot != null && !isBooking
}

data class PTBookingError(
    val message: String,
    val messageAr: String? = null
)

class PTBookingScreenModel(
    private val trainerRepository: TrainerRepository
) : ScreenModel {

    private val _state = MutableStateFlow(PTBookingState())
    val state: StateFlow<PTBookingState> = _state.asStateFlow()

    private var weekOffset = 0

    fun initialize(trainerId: String) {
        _state.update { it.copy(trainerId = trainerId, isLoading = true) }
        loadTrainer(trainerId)
        generateAvailableDates()
    }

    private fun loadTrainer(trainerId: String) {
        screenModelScope.launch {
            trainerRepository.getTrainer(trainerId)
                .onSuccess { trainer ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            trainer = trainer
                        )
                    }
                }
                .onError { error ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            error = PTBookingError(
                                message = error.message ?: "Failed to load trainer",
                                messageAr = error.messageAr
                            )
                        )
                    }
                }
        }
    }

    private fun generateAvailableDates() {
        // Generate next 7 days from current week offset
        // In production, use kotlinx-datetime
        val baseOffset = weekOffset * 7
        val dates = (0..6).map { day ->
            // Simple date generation - should use proper date library
            val totalDays = 25 + baseOffset + day // Starting from Jan 25, 2026
            val month = if (totalDays > 31) 2 else 1
            val dayOfMonth = if (totalDays > 31) totalDays - 31 else totalDays
            "2026-${month.toString().padStart(2, '0')}-${dayOfMonth.toString().padStart(2, '0')}"
        }

        val firstDate = dates.firstOrNull() ?: ""
        _state.update {
            it.copy(
                availableDates = dates,
                selectedDate = firstDate,
                selectedSlot = null
            )
        }

        if (firstDate.isNotEmpty()) {
            loadAvailability(firstDate)
        }
    }

    fun selectDate(date: String) {
        _state.update {
            it.copy(
                selectedDate = date,
                selectedSlot = null,
                timeSlots = emptyList()
            )
        }
        loadAvailability(date)
    }

    private fun loadAvailability(date: String) {
        val trainerId = _state.value.trainerId
        if (trainerId.isEmpty()) return

        screenModelScope.launch {
            _state.update { it.copy(isLoadingSlots = true) }

            trainerRepository.getTrainerAvailability(trainerId, date)
                .onSuccess { availability ->
                    _state.update {
                        it.copy(
                            isLoadingSlots = false,
                            timeSlots = availability.slots
                        )
                    }
                }
                .onError { error ->
                    _state.update {
                        it.copy(
                            isLoadingSlots = false,
                            timeSlots = emptyList(),
                            error = PTBookingError(
                                message = error.message ?: "Failed to load availability",
                                messageAr = error.messageAr
                            )
                        )
                    }
                }
        }
    }

    fun selectSlot(slot: TimeSlot) {
        if (slot.isAvailable) {
            _state.update { it.copy(selectedSlot = slot) }
        }
    }

    fun updateNotes(notes: String) {
        _state.update { it.copy(notes = notes) }
    }

    fun previousWeek() {
        if (weekOffset > 0) {
            weekOffset--
            generateAvailableDates()
        }
    }

    fun nextWeek() {
        if (weekOffset < 4) { // Max 4 weeks ahead
            weekOffset++
            generateAvailableDates()
        }
    }

    fun bookSession() {
        val currentState = _state.value
        if (!currentState.canBook) return

        val selectedSlot = currentState.selectedSlot ?: return

        screenModelScope.launch {
            _state.update { it.copy(isBooking = true, error = null) }

            val request = PTBookingRequest(
                trainerId = currentState.trainerId,
                date = currentState.selectedDate,
                startTime = selectedSlot.startTime,
                notes = currentState.notes.takeIf { it.isNotBlank() }
            )

            trainerRepository.bookPTSession(request)
                .onSuccess { session ->
                    _state.update {
                        it.copy(
                            isBooking = false,
                            isBookingSuccess = true,
                            bookedSession = session
                        )
                    }
                }
                .onError { error ->
                    _state.update {
                        it.copy(
                            isBooking = false,
                            error = PTBookingError(
                                message = error.message ?: "Failed to book session",
                                messageAr = error.messageAr
                            )
                        )
                    }
                }
        }
    }

    fun clearError() {
        _state.update { it.copy(error = null) }
    }
}
