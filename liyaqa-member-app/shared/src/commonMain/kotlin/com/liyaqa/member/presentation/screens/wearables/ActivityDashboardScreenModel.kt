package com.liyaqa.member.presentation.screens.wearables

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.liyaqa.member.data.health.HealthDataManager
import com.liyaqa.member.domain.model.WearableActivityStats
import com.liyaqa.member.domain.model.WearableDailyActivity
import com.liyaqa.member.domain.model.WearableWorkout
import com.liyaqa.member.domain.model.WearableWorkoutStats
import com.liyaqa.member.domain.repository.WearableRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.TimeZone
import kotlinx.datetime.minus
import kotlinx.datetime.toLocalDateTime

data class ActivityDashboardState(
    val isLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    val selectedPeriodDays: Int = 30,
    val activityStats: WearableActivityStats? = null,
    val workoutStats: WearableWorkoutStats? = null,
    val recentActivities: List<WearableDailyActivity> = emptyList(),
    val recentWorkouts: List<WearableWorkout> = emptyList(),
    val todaySteps: Int = 0,
    val stepGoal: Int = 10000,
    val error: ActivityDashboardError? = null
)

data class ActivityDashboardError(
    val message: String,
    val messageAr: String? = null
)

class ActivityDashboardScreenModel(
    private val wearableRepository: WearableRepository,
    private val healthDataManager: HealthDataManager
) : ScreenModel {

    private val _state = MutableStateFlow(ActivityDashboardState())
    val state: StateFlow<ActivityDashboardState> = _state.asStateFlow()

    init {
        loadData()
        observeTodaySteps()
    }

    fun loadData() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            val period = _state.value.selectedPeriodDays
            val endDate = Clock.System.now()
                .toLocalDateTime(TimeZone.currentSystemDefault())
                .date
            val startDate = endDate.minus(period, DateTimeUnit.DAY)

            // Load activity stats
            wearableRepository.getMyActivityStats(
                startDate.toString(),
                endDate.toString()
            ).onSuccess { stats ->
                _state.update { it.copy(activityStats = stats) }
            }

            // Load workout stats
            wearableRepository.getMyWorkoutStats(
                startDate.toString(),
                endDate.toString()
            ).onSuccess { stats ->
                _state.update { it.copy(workoutStats = stats) }
            }

            // Load recent activities
            wearableRepository.getMyActivities(
                startDate.toString(),
                endDate.toString(),
                limit = 7
            ).onSuccess { activities ->
                _state.update { it.copy(recentActivities = activities) }
            }

            // Load recent workouts
            wearableRepository.getMyWorkouts(
                startDate.toString(),
                endDate.toString(),
                limit = 5
            ).onSuccess { workouts ->
                _state.update { it.copy(recentWorkouts = workouts) }
            }

            _state.update { it.copy(isLoading = false) }
        }
    }

    fun refresh() {
        screenModelScope.launch {
            _state.update { it.copy(isRefreshing = true) }
            loadData()
            _state.update { it.copy(isRefreshing = false) }
        }
    }

    fun selectPeriod(days: Int) {
        _state.update { it.copy(selectedPeriodDays = days) }
        loadData()
    }

    private fun observeTodaySteps() {
        screenModelScope.launch {
            healthDataManager.observeTodaySteps()
                .catch { /* Ignore errors in step observation */ }
                .collect { steps ->
                    _state.update { it.copy(todaySteps = steps) }
                }
        }
    }

    // Computed properties
    val stepProgress: Float
        get() = (_state.value.todaySteps.toFloat() / _state.value.stepGoal).coerceIn(0f, 1f)

    fun formatDuration(minutes: Int): String {
        val hours = minutes / 60
        val mins = minutes % 60
        return when {
            hours > 0 && mins > 0 -> "${hours}h ${mins}m"
            hours > 0 -> "${hours}h"
            else -> "${mins}m"
        }
    }

    fun formatDurationHours(hours: Double): String {
        val wholeHours = hours.toInt()
        val minutes = ((hours - wholeHours) * 60).toInt()
        return when {
            wholeHours > 0 && minutes > 0 -> "${wholeHours}h ${minutes}m"
            wholeHours > 0 -> "${wholeHours}h"
            else -> "${minutes}m"
        }
    }

    fun formatNumber(value: Long): String {
        return when {
            value >= 1_000_000 -> {
                val num = value / 1_000_000.0
                "${formatDecimal(num)}M"
            }
            value >= 1_000 -> {
                val num = value / 1_000.0
                "${formatDecimal(num)}K"
            }
            else -> value.toString()
        }
    }

    private fun formatDecimal(value: Double): String {
        val intPart = value.toLong()
        val decPart = ((value - intPart) * 10).toInt()
        return if (decPart == 0) intPart.toString() else "$intPart.$decPart"
    }
}
