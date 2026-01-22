package com.liyaqa.member.presentation.viewmodel

import com.liyaqa.member.domain.model.AvailableSession
import com.liyaqa.member.domain.model.Booking
import com.liyaqa.member.domain.repository.BookingRepository
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.base.MviViewModel
import kotlinx.datetime.Clock
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.plus
import kotlinx.datetime.todayIn

/**
 * User intents for the New Booking screen.
 */
sealed interface NewBookingIntent {
    /** Initial load of available sessions */
    data object LoadSessions : NewBookingIntent

    /** Refresh available sessions */
    data object Refresh : NewBookingIntent

    /** Select a date */
    data class SelectDate(val date: LocalDate) : NewBookingIntent

    /** Filter by class ID */
    data class FilterByClass(val classId: String?) : NewBookingIntent

    /** Filter by location ID */
    data class FilterByLocation(val locationId: String?) : NewBookingIntent

    /** Request to book a session */
    data class RequestBookSession(val session: AvailableSession) : NewBookingIntent

    /** Confirm the booking */
    data object ConfirmBooking : NewBookingIntent

    /** Dismiss booking confirmation dialog */
    data object DismissBookingDialog : NewBookingIntent

    /** Navigate back */
    data object NavigateBack : NewBookingIntent
}

/**
 * UI state for the New Booking screen.
 */
data class NewBookingState(
    val loading: LoadingState = LoadingState.Idle,
    val isRefreshing: Boolean = false,
    val availableDates: List<LocalDate> = emptyList(),
    val selectedDate: LocalDate? = null,
    val allSessions: List<AvailableSession> = emptyList(),
    val classFilter: String? = null,
    val locationFilter: String? = null,
    val sessionToBook: AvailableSession? = null,
    val isBooking: Boolean = false
) {
    /**
     * Sessions filtered by selected date and filters.
     */
    val filteredSessions: List<AvailableSession>
        get() {
            var sessions = allSessions

            // Filter by selected date
            selectedDate?.let { date ->
                sessions = sessions.filter { it.sessionDate == date }
            }

            // Filter by class
            classFilter?.let { classId ->
                sessions = sessions.filter {
                    // Using class name as ID proxy since we don't have explicit classId
                    it.className.en.equals(classId, ignoreCase = true) ||
                    it.className.ar?.equals(classId, ignoreCase = true) == true
                }
            }

            // Filter by location
            locationFilter?.let { locationId ->
                sessions = sessions.filter { it.locationId == locationId }
            }

            return sessions.sortedWith(compareBy({ it.sessionDate }, { it.startTime }))
        }

    /**
     * Sessions for the selected date, grouped by start time.
     */
    val sessionsGroupedByTime: Map<String, List<AvailableSession>>
        get() = filteredSessions.groupBy { session ->
            "${session.startTime.hour.toString().padStart(2, '0')}:${session.startTime.minute.toString().padStart(2, '0')}"
        }

    /**
     * Unique class names from all sessions (for filter dropdown).
     */
    val availableClasses: List<String>
        get() = allSessions.map { it.className.en }.distinct().sorted()

    /**
     * Unique locations from all sessions (for filter dropdown).
     */
    val availableLocations: List<Pair<String?, String?>>
        get() = allSessions
            .mapNotNull { session ->
                session.locationId?.let { id ->
                    id to session.locationName
                }
            }
            .distinctBy { it.first }
            .sortedBy { it.second }

    val isEmpty: Boolean
        get() = filteredSessions.isEmpty() && loading !is LoadingState.Loading

    val showBookingDialog: Boolean
        get() = sessionToBook != null
}

/**
 * One-time effects for the New Booking screen.
 */
sealed interface NewBookingEffect {
    /** Show error message */
    data class ShowError(val message: String) : NewBookingEffect

    /** Booking was successful */
    data class BookingSuccess(val booking: Booking) : NewBookingEffect

    /** Navigate back to bookings list */
    data object NavigateBack : NewBookingEffect
}

/**
 * ViewModel for the New Booking screen.
 *
 * Manages:
 * - Loading available sessions for the next 7-14 days
 * - Date selection with horizontal date picker
 * - Class and location filtering
 * - Booking confirmation dialog
 * - Booking submission with success/error handling
 */
class NewBookingViewModel(
    private val bookingRepository: BookingRepository,
    private val daysAhead: Int = 14
) : MviViewModel<NewBookingIntent, NewBookingState, NewBookingEffect>(
    NewBookingState(availableDates = generateDates(daysAhead))
) {

    init {
        onIntent(NewBookingIntent.LoadSessions)
    }

    override fun onIntent(intent: NewBookingIntent) {
        when (intent) {
            is NewBookingIntent.LoadSessions -> loadSessions()
            is NewBookingIntent.Refresh -> refresh()
            is NewBookingIntent.SelectDate -> selectDate(intent.date)
            is NewBookingIntent.FilterByClass -> filterByClass(intent.classId)
            is NewBookingIntent.FilterByLocation -> filterByLocation(intent.locationId)
            is NewBookingIntent.RequestBookSession -> requestBookSession(intent.session)
            is NewBookingIntent.ConfirmBooking -> confirmBooking()
            is NewBookingIntent.DismissBookingDialog -> dismissBookingDialog()
            is NewBookingIntent.NavigateBack -> sendEffect(NewBookingEffect.NavigateBack)
        }
    }

    private fun loadSessions() {
        if (currentState.loading is LoadingState.Loading) return

        launch {
            updateState { copy(loading = LoadingState.Loading()) }

            bookingRepository.getAvailableSessions(
                days = daysAhead,
                classId = null,
                locationId = null
            )
                .onSuccess { sessions ->
                    val dates = generateDates(daysAhead)
                    val selectedDate = currentState.selectedDate ?: dates.firstOrNull()

                    updateState {
                        copy(
                            loading = LoadingState.Success,
                            allSessions = sessions,
                            availableDates = dates,
                            selectedDate = selectedDate
                        )
                    }
                }
                .onFailure { error ->
                    updateState {
                        copy(loading = LoadingState.Error(error.message ?: "Failed to load sessions"))
                    }
                }
        }
    }

    private fun refresh() {
        launch {
            updateState { copy(isRefreshing = true) }

            bookingRepository.getAvailableSessions(
                days = daysAhead,
                classId = null,
                locationId = null
            )
                .onSuccess { sessions ->
                    updateState {
                        copy(
                            isRefreshing = false,
                            loading = LoadingState.Success,
                            allSessions = sessions
                        )
                    }
                }
                .onFailure { error ->
                    updateState { copy(isRefreshing = false) }
                    sendEffect(NewBookingEffect.ShowError(error.message ?: "Failed to refresh"))
                }
        }
    }

    private fun selectDate(date: LocalDate) {
        updateState { copy(selectedDate = date) }
    }

    private fun filterByClass(classId: String?) {
        updateState { copy(classFilter = classId) }
    }

    private fun filterByLocation(locationId: String?) {
        updateState { copy(locationFilter = locationId) }
    }

    private fun requestBookSession(session: AvailableSession) {
        if (!session.isBookable && !session.isFull) {
            sendEffect(NewBookingEffect.ShowError(session.bookingError ?: "Cannot book this session"))
            return
        }
        updateState { copy(sessionToBook = session) }
    }

    private fun dismissBookingDialog() {
        updateState { copy(sessionToBook = null) }
    }

    private fun confirmBooking() {
        val session = currentState.sessionToBook ?: return

        launch {
            updateState { copy(isBooking = true) }

            bookingRepository.bookSession(session.id)
                .onSuccess { booking ->
                    updateState { copy(isBooking = false, sessionToBook = null) }

                    // Update the session in the list to reflect the booking
                    val updatedSessions = currentState.allSessions.map {
                        if (it.id == session.id) {
                            it.copy(
                                isBooked = true,
                                bookingId = booking.id,
                                spotsRemaining = (it.spotsRemaining - 1).coerceAtLeast(0)
                            )
                        } else {
                            it
                        }
                    }
                    updateState { copy(allSessions = updatedSessions) }

                    sendEffect(NewBookingEffect.BookingSuccess(booking))
                }
                .onFailure { error ->
                    updateState { copy(isBooking = false, sessionToBook = null) }
                    sendEffect(NewBookingEffect.ShowError(error.message ?: "Failed to book session"))
                }
        }
    }

    companion object {
        /**
         * Generate a list of dates from today to [daysAhead] days in the future.
         */
        private fun generateDates(daysAhead: Int): List<LocalDate> {
            val today = Clock.System.todayIn(TimeZone.currentSystemDefault())
            return (0 until daysAhead).map { offset ->
                today.plus(offset, DateTimeUnit.DAY)
            }
        }
    }
}
