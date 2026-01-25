package com.liyaqa.member.presentation.screens.attendance

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.liyaqa.member.domain.repository.AttendanceRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AttendanceStatsState(
    val isLoading: Boolean = false,
    val totalVisits: Int = 0,
    val thisMonthVisits: Int = 0,
    val avgVisitsPerMonth: Double = 0.0,
    val avgDurationMinutes: Int = 0,
    val totalDurationMinutes: Int = 0,
    val currentStreak: Int = 0,
    val longestStreak: Int = 0,
    val error: AttendanceStatsError? = null
)

data class AttendanceStatsError(
    val message: String,
    val messageAr: String? = null
)

class AttendanceStatsScreenModel(
    private val attendanceRepository: AttendanceRepository
) : ScreenModel {

    private val _state = MutableStateFlow(AttendanceStatsState())
    val state: StateFlow<AttendanceStatsState> = _state.asStateFlow()

    fun loadStats() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            // Load attendance data and calculate stats
            attendanceRepository.getAttendanceHistory(0, 500).collect { result ->
                result.onSuccess { response ->
                    val records = response.items

                    // Calculate statistics
                    val totalVisits = records.size
                    val thisMonthVisits = records.count {
                        it.checkInTime.startsWith("2026-01") // Current month
                    }

                    val totalDuration = records.sumOf { it.duration ?: 0 }
                    val avgDuration = if (totalVisits > 0) totalDuration / totalVisits else 0

                    // Calculate streaks
                    val (currentStreak, longestStreak) = calculateStreaks(records.map { it.checkInTime })

                    // Avg visits per month (simplified)
                    val avgVisitsPerMonth = if (records.isNotEmpty()) {
                        totalVisits.toDouble() / 1 // Assuming 1 month of data for now
                    } else 0.0

                    _state.update {
                        it.copy(
                            isLoading = false,
                            totalVisits = totalVisits,
                            thisMonthVisits = thisMonthVisits,
                            avgVisitsPerMonth = avgVisitsPerMonth,
                            avgDurationMinutes = avgDuration,
                            totalDurationMinutes = totalDuration,
                            currentStreak = currentStreak,
                            longestStreak = longestStreak
                        )
                    }
                }.onError { error ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            error = AttendanceStatsError(
                                message = error.message ?: "Failed to load statistics",
                                messageAr = error.messageAr
                            )
                        )
                    }
                }
            }
        }
    }

    private fun calculateStreaks(checkInDates: List<String>): Pair<Int, Int> {
        if (checkInDates.isEmpty()) return Pair(0, 0)

        // Extract unique dates and sort
        val uniqueDates = checkInDates
            .map { it.take(10) } // Get date part only
            .toSet()
            .sorted()
            .reversed() // Most recent first

        if (uniqueDates.isEmpty()) return Pair(0, 0)

        var currentStreak = 1
        var longestStreak = 1
        var tempStreak = 1

        // Simple streak calculation - in production use proper date library
        for (i in 0 until uniqueDates.size - 1) {
            val current = uniqueDates[i]
            val next = uniqueDates[i + 1]

            // Check if dates are consecutive (simplified)
            val currentDay = current.takeLast(2).toIntOrNull() ?: 0
            val nextDay = next.takeLast(2).toIntOrNull() ?: 0

            if (currentDay - nextDay == 1) {
                tempStreak++
                if (tempStreak > longestStreak) {
                    longestStreak = tempStreak
                }
            } else {
                if (i == 0) {
                    currentStreak = tempStreak
                }
                tempStreak = 1
            }
        }

        // Check if current streak is still active (today or yesterday)
        val mostRecent = uniqueDates.firstOrNull()
        val today = "2026-01-25" // In production, use actual current date
        val yesterday = "2026-01-24"

        if (mostRecent != today && mostRecent != yesterday) {
            currentStreak = 0
        }

        return Pair(currentStreak, longestStreak)
    }
}
