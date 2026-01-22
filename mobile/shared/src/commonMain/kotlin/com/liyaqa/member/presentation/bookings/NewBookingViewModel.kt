package com.liyaqa.member.presentation.bookings

import androidx.lifecycle.viewModelScope
import com.liyaqa.member.domain.model.AvailableSession
import com.liyaqa.member.domain.repository.BookingRepository
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.base.MviViewModel
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import kotlinx.datetime.DatePeriod
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.plus
import kotlinx.datetime.todayIn

/**
 * User intents for the New Booking screen.
 */
sealed interface NewBookingIntent {
    /** Load available sessions for a number of days. */
    data class LoadSessions(val days: Int = 7) : NewBookingIntent

    /** Select a date to filter sessions. */
    data class SelectDate(val date: LocalDate) : NewBookingIntent

    /** Book a session. */
    data class BookSession(val sessionId: String) : NewBookingIntent

    /** Filter by class ID. */
    data class FilterByClass(val classId: String?) : NewBookingIntent

    /** Filter by location ID. */
    data class FilterByLocation(val locationId: String?) : NewBookingIntent

    /** Clear all filters. */
    data object ClearFilters : NewBookingIntent

    /** Refresh sessions. */
    data object Refresh : NewBookingIntent
}

/**
 * Filters for available sessions.
 */
data class SessionFilters(
    val classId: String? = null,
    val locationId: String? = null
) {
    val hasFilters: Boolean get() = classId != null || locationId != null
}

/**
 * UI state for the New Booking screen.
 */
data class NewBookingState(
    /** Loading state. */
    val loading: LoadingState = LoadingState.Idle,

    /** Selected date for filtering. */
    val selectedDate: LocalDate = Clock.System.todayIn(TimeZone.currentSystemDefault()),

    /** All available sessions. */
    val sessions: List<AvailableSession> = emptyList(),

    /** Sessions grouped by date. */
    val groupedSessions: Map<LocalDate, List<AvailableSession>> = emptyMap(),

    /** Current filters. */
    val filters: SessionFilters = SessionFilters(),

    /** ID of session currently being booked. */
    val bookingSessionId: String? = null,

    /** Number of days to load. */
    val daysToLoad: Int = 7,

    /** Available dates (for date selector). */
    val availableDates: List<LocalDate> = emptyList(),

    /** Whether currently refreshing. */
    val isRefreshing: Boolean = false
) {
    /** Sessions filtered by selected date. */
    val sessionsForSelectedDate: List<AvailableSession>
        get() = groupedSessions[selectedDate] ?: emptyList()

    /** Whether booking is in progress. */
    val isBooking: Boolean get() = bookingSessionId != null

    /** Unique class names for filter dropdown. */
    val uniqueClassNames: List<Pair<String, String>>
        get() = sessions
            .distinctBy { it.className.en }
            .map { it.className.en to (it.className.ar ?: it.className.en) }

    /** Unique locations for filter dropdown. */
    val uniqueLocations: List<Pair<String?, String?>>
        get() = sessions
            .filter { it.locationId != null }
            .distinctBy { it.locationId }
            .map { it.locationId to it.locationName }
}

/**
 * One-time effects from the New Booking screen.
 */
sealed interface NewBookingEffect {
    /** Booking was successful. */
    data class BookingSuccess(val sessionId: String, val className: String) : NewBookingEffect

    /** Show error message. */
    data class ShowError(val message: String) : NewBookingEffect

    /** Navigate back. */
    data object NavigateBack : NewBookingEffect
}

/**
 * ViewModel for the New Booking screen.
 *
 * Features:
 * - Load available sessions for next N days
 * - Date selector with horizontal scroll
 * - Filter by class and location
 * - Book session with confirmation
 */
class NewBookingViewModel(
    private val bookingRepository: BookingRepository
) : MviViewModel<NewBookingIntent, NewBookingState, NewBookingEffect>(NewBookingState()) {

    init {
        onIntent(NewBookingIntent.LoadSessions())
    }

    override fun onIntent(intent: NewBookingIntent) {
        when (intent) {
            is NewBookingIntent.LoadSessions -> loadSessions(intent.days)
            is NewBookingIntent.SelectDate -> selectDate(intent.date)
            is NewBookingIntent.BookSession -> bookSession(intent.sessionId)
            is NewBookingIntent.FilterByClass -> filterByClass(intent.classId)
            is NewBookingIntent.FilterByLocation -> filterByLocation(intent.locationId)
            is NewBookingIntent.ClearFilters -> clearFilters()
            is NewBookingIntent.Refresh -> refresh()
        }
    }

    private fun loadSessions(days: Int) {
        updateState { copy(loading = LoadingState.Loading(), daysToLoad = days) }

        viewModelScope.launch {
            bookingRepository.getAvailableSessions(
                days = days,
                classId = currentState.filters.classId,
                locationId = currentState.filters.locationId
            )
                .onSuccess { sessions ->
                    val grouped = sessions.groupBy { it.sessionDate }
                    val dates = generateDateRange(days)

                    updateState {
                        copy(
                            loading = LoadingState.Success,
                            sessions = sessions,
                            groupedSessions = grouped,
                            availableDates = dates,
                            isRefreshing = false
                        )
                    }
                }
                .onFailure { error ->
                    updateState {
                        copy(
                            loading = LoadingState.Error(
                                message = error.message ?: "Failed to load sessions",
                                throwable = error
                            ),
                            isRefreshing = false
                        )
                    }
                }
        }
    }

    private fun selectDate(date: LocalDate) {
        updateState { copy(selectedDate = date) }
    }

    private fun bookSession(sessionId: String) {
        val session = currentState.sessions.find { it.id == sessionId }
        if (session == null || !session.isBookable) {
            sendEffect(NewBookingEffect.ShowError(
                session?.bookingError ?: "Session is not available for booking"
            ))
            return
        }

        updateState { copy(bookingSessionId = sessionId) }

        viewModelScope.launch {
            bookingRepository.bookSession(sessionId)
                .onSuccess { booking ->
                    updateState {
                        copy(
                            bookingSessionId = null,
                            // Update the session to show it's now booked
                            sessions = sessions.map {
                                if (it.id == sessionId) {
                                    it.copy(
                                        isBooked = true,
                                        bookingId = booking.id,
                                        spotsRemaining = it.spotsRemaining - 1,
                                        isBookable = false
                                    )
                                } else it
                            },
                            groupedSessions = sessions.map {
                                if (it.id == sessionId) {
                                    it.copy(
                                        isBooked = true,
                                        bookingId = booking.id,
                                        spotsRemaining = it.spotsRemaining - 1,
                                        isBookable = false
                                    )
                                } else it
                            }.groupBy { it.sessionDate }
                        )
                    }
                    sendEffect(NewBookingEffect.BookingSuccess(
                        sessionId = sessionId,
                        className = session.className.en
                    ))
                }
                .onFailure { error ->
                    updateState { copy(bookingSessionId = null) }
                    sendEffect(NewBookingEffect.ShowError(
                        error.message ?: "Failed to book session"
                    ))
                }
        }
    }

    private fun filterByClass(classId: String?) {
        updateState { copy(filters = filters.copy(classId = classId)) }
        loadSessions(currentState.daysToLoad)
    }

    private fun filterByLocation(locationId: String?) {
        updateState { copy(filters = filters.copy(locationId = locationId)) }
        loadSessions(currentState.daysToLoad)
    }

    private fun clearFilters() {
        updateState { copy(filters = SessionFilters()) }
        loadSessions(currentState.daysToLoad)
    }

    private fun refresh() {
        updateState { copy(isRefreshing = true) }
        loadSessions(currentState.daysToLoad)
    }

    private fun generateDateRange(days: Int): List<LocalDate> {
        val today = Clock.System.todayIn(TimeZone.currentSystemDefault())
        return (0 until days).map { today.plus(kotlinx.datetime.DatePeriod(days = it)) }
    }
}
