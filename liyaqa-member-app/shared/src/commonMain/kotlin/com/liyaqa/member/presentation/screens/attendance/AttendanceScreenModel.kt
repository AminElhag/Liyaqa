package com.liyaqa.member.presentation.screens.attendance

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.liyaqa.member.domain.model.Attendance
import com.liyaqa.member.domain.repository.AttendanceRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AttendanceState(
    val isLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    val attendance: List<Attendance> = emptyList(),
    val currentMonth: String = "January 2026",
    val attendedDays: Set<Int> = emptySet(),
    val totalDaysInMonth: Int = 31,
    val error: AttendanceError? = null
)

data class AttendanceError(
    val message: String,
    val messageAr: String? = null
)

class AttendanceScreenModel(
    private val attendanceRepository: AttendanceRepository
) : ScreenModel {

    private val _state = MutableStateFlow(AttendanceState())
    val state: StateFlow<AttendanceState> = _state.asStateFlow()

    private var currentMonthIndex = 0 // 0 = current month, -1 = previous, etc.

    fun loadAttendance() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            attendanceRepository.getAttendanceHistory(0, 50).collect { result ->
                result.onSuccess { response ->
                    val attendedDays = extractAttendedDays(response.items)
                    _state.update {
                        it.copy(
                            isLoading = false,
                            isRefreshing = false,
                            attendance = response.items,
                            attendedDays = attendedDays
                        )
                    }
                }.onError { error ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            isRefreshing = false,
                            error = AttendanceError(
                                message = error.message ?: "Failed to load attendance",
                                messageAr = error.messageAr
                            )
                        )
                    }
                }
            }
        }
    }

    fun refresh() {
        screenModelScope.launch {
            _state.update { it.copy(isRefreshing = true) }

            attendanceRepository.refreshAttendance().onSuccess { attendance ->
                val attendedDays = extractAttendedDays(attendance)
                _state.update {
                    it.copy(
                        isRefreshing = false,
                        attendance = attendance,
                        attendedDays = attendedDays
                    )
                }
            }.onError { error ->
                _state.update {
                    it.copy(
                        isRefreshing = false,
                        error = AttendanceError(
                            message = error.message ?: "Failed to refresh",
                            messageAr = error.messageAr
                        )
                    )
                }
            }
        }
    }

    fun previousMonth() {
        if (currentMonthIndex > -12) { // Limit to 12 months back
            currentMonthIndex--
            updateMonth()
        }
    }

    fun nextMonth() {
        if (currentMonthIndex < 0) {
            currentMonthIndex++
            updateMonth()
        }
    }

    private fun updateMonth() {
        // Simple month calculation - in production use kotlinx-datetime
        val months = listOf(
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        )
        val daysInMonth = listOf(31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)

        // Current month is January 2026 (index 0)
        val baseMonth = 0 // January
        val baseYear = 2026

        var month = baseMonth + currentMonthIndex
        var year = baseYear

        while (month < 0) {
            month += 12
            year--
        }
        while (month >= 12) {
            month -= 12
            year++
        }

        val monthName = months[month]
        _state.update {
            it.copy(
                currentMonth = "$monthName $year",
                totalDaysInMonth = daysInMonth[month],
                attendedDays = extractAttendedDaysForMonth(
                    _state.value.attendance,
                    month + 1,
                    year
                )
            )
        }
    }

    private fun extractAttendedDays(attendance: List<Attendance>): Set<Int> {
        // Extract days from current month
        return attendance
            .filter { it.checkInTime.startsWith("2026-01") } // Current month filter
            .mapNotNull { record ->
                // Extract day from datetime string (e.g., "2026-01-25T10:30:00" -> 25)
                record.checkInTime.substring(8, 10).toIntOrNull()
            }
            .toSet()
    }

    private fun extractAttendedDaysForMonth(
        attendance: List<Attendance>,
        month: Int,
        year: Int
    ): Set<Int> {
        val prefix = "$year-${month.toString().padStart(2, '0')}"
        return attendance
            .filter { it.checkInTime.startsWith(prefix) }
            .mapNotNull { record ->
                record.checkInTime.substring(8, 10).toIntOrNull()
            }
            .toSet()
    }
}
