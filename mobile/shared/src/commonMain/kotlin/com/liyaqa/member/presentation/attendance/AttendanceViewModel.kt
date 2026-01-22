package com.liyaqa.member.presentation.attendance

import androidx.lifecycle.viewModelScope
import com.liyaqa.member.domain.model.AttendanceRecord
import com.liyaqa.member.domain.model.AttendanceStats
import com.liyaqa.member.domain.repository.AttendanceRepository
import com.liyaqa.member.domain.repository.DashboardRepository
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.base.MviViewModel
import com.liyaqa.member.presentation.base.PaginationState
import com.liyaqa.member.presentation.base.DEFAULT_PAGE_SIZE
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import kotlinx.datetime.todayIn

/**
 * Date range filter for attendance history.
 */
data class DateRange(
    val startDate: LocalDate? = null,
    val endDate: LocalDate? = null
) {
    val isSet: Boolean get() = startDate != null && endDate != null

    fun toStartDateString(): String? = startDate?.toString()
    fun toEndDateString(): String? = endDate?.toString()
}

/**
 * User intents for the Attendance History screen.
 */
sealed interface AttendanceIntent {
    /** Load initial attendance records. */
    data object LoadAttendance : AttendanceIntent

    /** Load more attendance records. */
    data object LoadMore : AttendanceIntent

    /** Filter attendance by date range. */
    data class FilterByDateRange(val startDate: LocalDate, val endDate: LocalDate) : AttendanceIntent

    /** Clear date range filter. */
    data object ClearDateFilter : AttendanceIntent

    /** Refresh attendance records. */
    data object Refresh : AttendanceIntent
}

/**
 * UI state for the Attendance History screen.
 */
data class AttendanceState(
    /** Loading state. */
    val loading: LoadingState = LoadingState.Idle,

    /** Pagination state for attendance records. */
    val attendance: PaginationState<AttendanceRecord> = PaginationState(),

    /** Attendance statistics. */
    val stats: AttendanceStats? = null,

    /** Current date range filter. */
    val dateRange: DateRange = DateRange()
) {
    /** Whether stats are loaded. */
    val hasStats: Boolean get() = stats != null

    /** Total visits count. */
    val totalVisits: Int get() = stats?.totalVisits ?: 0

    /** This month's visits. */
    val thisMonthVisits: Int get() = stats?.thisMonthVisits ?: 0

    /** Last month's visits. */
    val lastMonthVisits: Int get() = stats?.lastMonthVisits ?: 0

    /** Average visits per month. */
    val averageVisitsPerMonth: Float get() = stats?.averageVisitsPerMonth ?: 0f

    /** Formatted average visits. */
    val formattedAverageVisits: String
        get() {
            val avg = averageVisitsPerMonth
            return if (avg == avg.toLong().toFloat()) {
                avg.toLong().toString()
            } else {
                // Format to 1 decimal place
                val intPart = avg.toLong()
                val decPart = ((avg - intPart) * 10).toLong()
                "$intPart.$decPart"
            }
        }

    /** Grouped attendance records by date. */
    val groupedByDate: Map<LocalDate, List<AttendanceRecord>>
        get() = attendance.items.groupBy { record ->
            kotlinx.datetime.TimeZone.currentSystemDefault().let { tz ->
                record.checkInTime.toLocalDateTime(tz).date
            }
        }
}

/**
 * One-time effects from the Attendance History screen.
 */
sealed interface AttendanceEffect {
    /** Show error message. */
    data class ShowError(val message: String) : AttendanceEffect
}

/**
 * ViewModel for the Attendance History screen.
 *
 * Features:
 * - List attendance records with pagination
 * - Display attendance statistics
 * - Filter by date range
 * - Group records by date
 */
class AttendanceViewModel(
    private val attendanceRepository: AttendanceRepository,
    private val dashboardRepository: DashboardRepository
) : MviViewModel<AttendanceIntent, AttendanceState, AttendanceEffect>(AttendanceState()) {

    init {
        onIntent(AttendanceIntent.LoadAttendance)
        loadStats()
    }

    override fun onIntent(intent: AttendanceIntent) {
        when (intent) {
            is AttendanceIntent.LoadAttendance -> loadAttendance()
            is AttendanceIntent.LoadMore -> loadMore()
            is AttendanceIntent.FilterByDateRange -> filterByDateRange(intent.startDate, intent.endDate)
            is AttendanceIntent.ClearDateFilter -> clearDateFilter()
            is AttendanceIntent.Refresh -> refresh()
        }
    }

    private fun loadAttendance() {
        if (currentState.attendance.isInitialLoading) return

        updateState { copy(attendance = attendance.withInitialLoading()) }

        viewModelScope.launch {
            val dateRange = currentState.dateRange
            val result = if (dateRange.isSet) {
                attendanceRepository.getAttendanceRange(
                    startDate = dateRange.toStartDateString()!!,
                    endDate = dateRange.toEndDateString()!!,
                    page = 0,
                    size = DEFAULT_PAGE_SIZE
                )
            } else {
                attendanceRepository.getAttendance(
                    page = 0,
                    size = DEFAULT_PAGE_SIZE
                )
            }

            result
                .onSuccess { pagedResult ->
                    updateState {
                        copy(
                            loading = LoadingState.Success,
                            attendance = attendance.withInitialItems(
                                newItems = pagedResult.items,
                                hasMore = pagedResult.hasMore,
                                totalCount = pagedResult.totalCount
                            )
                        )
                    }
                }
                .onFailure { error ->
                    updateState {
                        copy(attendance = attendance.withError(
                            error.message ?: "Failed to load attendance"
                        ))
                    }
                }
        }
    }

    private fun loadMore() {
        val pagination = currentState.attendance
        if (!pagination.canLoadMore) return

        updateState { copy(attendance = attendance.withLoadingMore()) }

        viewModelScope.launch {
            val dateRange = currentState.dateRange
            val result = if (dateRange.isSet) {
                attendanceRepository.getAttendanceRange(
                    startDate = dateRange.toStartDateString()!!,
                    endDate = dateRange.toEndDateString()!!,
                    page = pagination.nextPage,
                    size = DEFAULT_PAGE_SIZE
                )
            } else {
                attendanceRepository.getAttendance(
                    page = pagination.nextPage,
                    size = DEFAULT_PAGE_SIZE
                )
            }

            result
                .onSuccess { pagedResult ->
                    updateState {
                        copy(attendance = attendance.withNewItems(
                            newItems = pagedResult.items,
                            hasMore = pagedResult.hasMore,
                            totalCount = pagedResult.totalCount
                        ))
                    }
                }
                .onFailure { error ->
                    updateState {
                        copy(attendance = attendance.withError(
                            error.message ?: "Failed to load more"
                        ))
                    }
                }
        }
    }

    private fun filterByDateRange(startDate: LocalDate, endDate: LocalDate) {
        updateState {
            copy(
                dateRange = DateRange(startDate, endDate),
                attendance = PaginationState() // Reset pagination
            )
        }
        loadAttendance()
    }

    private fun clearDateFilter() {
        updateState {
            copy(
                dateRange = DateRange(),
                attendance = PaginationState()
            )
        }
        loadAttendance()
    }

    private fun refresh() {
        updateState { copy(attendance = attendance.withRefreshing()) }

        viewModelScope.launch {
            val dateRange = currentState.dateRange
            val result = if (dateRange.isSet) {
                attendanceRepository.getAttendanceRange(
                    startDate = dateRange.toStartDateString()!!,
                    endDate = dateRange.toEndDateString()!!,
                    page = 0,
                    size = DEFAULT_PAGE_SIZE
                )
            } else {
                attendanceRepository.getAttendance(
                    page = 0,
                    size = DEFAULT_PAGE_SIZE
                )
            }

            result
                .onSuccess { pagedResult ->
                    updateState {
                        copy(attendance = attendance.withRefreshedItems(
                            newItems = pagedResult.items,
                            hasMore = pagedResult.hasMore,
                            totalCount = pagedResult.totalCount
                        ))
                    }
                }
                .onFailure { error ->
                    updateState { copy(attendance = attendance.copy(isRefreshing = false)) }
                    sendEffect(AttendanceEffect.ShowError(
                        error.message ?: "Failed to refresh"
                    ))
                }

            // Reload stats as well
            loadStats()
        }
    }

    private fun loadStats() {
        viewModelScope.launch {
            dashboardRepository.getDashboard()
                .onSuccess { dashboard ->
                    updateState { copy(stats = dashboard.attendanceStats) }
                }
        }
    }
}
