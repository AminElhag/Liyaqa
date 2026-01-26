package com.liyaqa.member.presentation.screens.wearables

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.DirectionsWalk
import androidx.compose.material.icons.filled.Bedtime
import androidx.compose.material.icons.filled.DirectionsRun
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.getScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.liyaqa.member.domain.model.WearableActivityType
import com.liyaqa.member.domain.model.WearableWorkout
import com.liyaqa.member.presentation.components.ErrorView
import com.liyaqa.member.presentation.components.LoadingView
import com.liyaqa.member.presentation.theme.CustomShapes
import com.liyaqa.member.presentation.theme.LocalIsArabic

object ActivityDashboardScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val screenModel = getScreenModel<ActivityDashboardScreenModel>()
        val state by screenModel.state.collectAsState()
        val isArabic = LocalIsArabic.current

        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Text(
                            text = if (isArabic) "لوحة النشاط" else "Activity Dashboard",
                            fontWeight = FontWeight.Bold
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = if (isArabic) "رجوع" else "Back"
                            )
                        }
                    },
                    actions = {
                        if (!state.isLoading && !state.isRefreshing) {
                            IconButton(onClick = { screenModel.refresh() }) {
                                Icon(
                                    imageVector = Icons.Default.Refresh,
                                    contentDescription = if (isArabic) "تحديث" else "Refresh"
                                )
                            }
                        }
                    }
                )
            }
        ) { paddingValues ->
            when {
                state.isLoading && state.activityStats == null -> {
                    LoadingView(modifier = Modifier.padding(paddingValues))
                }
                state.error != null && state.activityStats == null -> {
                    val errorMessage = if (isArabic) {
                        state.error?.messageAr ?: state.error?.message
                    } else {
                        state.error?.message
                    }
                    ErrorView(
                        message = errorMessage ?: "Error loading activity data",
                        onRetry = screenModel::loadData,
                        modifier = Modifier.padding(paddingValues)
                    )
                }
                else -> {
                    PullToRefreshBox(
                        isRefreshing = state.isRefreshing,
                        onRefresh = { screenModel.refresh() },
                        modifier = Modifier.padding(paddingValues)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .verticalScroll(rememberScrollState())
                                .padding(16.dp)
                        ) {
                            // Period Selector
                            PeriodSelector(
                                selectedDays = state.selectedPeriodDays,
                                onSelectPeriod = screenModel::selectPeriod,
                                isArabic = isArabic
                            )

                            Spacer(modifier = Modifier.height(16.dp))

                            // Today's Steps Progress
                            StepProgressCard(
                                steps = state.todaySteps,
                                goal = state.stepGoal,
                                progress = screenModel.stepProgress,
                                isArabic = isArabic
                            )

                            Spacer(modifier = Modifier.height(16.dp))

                            // Activity Stats Grid
                            state.activityStats?.let { stats ->
                                ActivityStatsGrid(
                                    stats = stats,
                                    formatNumber = screenModel::formatNumber,
                                    formatDurationHours = screenModel::formatDurationHours,
                                    isArabic = isArabic
                                )
                            }

                            // Workout Stats
                            state.workoutStats?.let { stats ->
                                if (stats.totalWorkouts > 0) {
                                    Spacer(modifier = Modifier.height(24.dp))
                                    WorkoutStatsCard(
                                        stats = stats,
                                        formatDurationHours = screenModel::formatDurationHours,
                                        isArabic = isArabic
                                    )
                                }
                            }

                            // Recent Workouts
                            if (state.recentWorkouts.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(24.dp))
                                Text(
                                    text = if (isArabic) "التمارين الأخيرة" else "Recent Workouts",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Spacer(modifier = Modifier.height(12.dp))

                                state.recentWorkouts.forEach { workout ->
                                    WorkoutCard(
                                        workout = workout,
                                        formatDuration = screenModel::formatDuration,
                                        isArabic = isArabic
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                }
                            }

                            Spacer(modifier = Modifier.height(32.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PeriodSelector(
    selectedDays: Int,
    onSelectPeriod: (Int) -> Unit,
    isArabic: Boolean
) {
    val periods = listOf(7, 14, 30, 60, 90)

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        periods.forEach { days ->
            FilterChip(
                selected = selectedDays == days,
                onClick = { onSelectPeriod(days) },
                label = {
                    Text(
                        text = if (isArabic) "$days يوم" else "${days}d"
                    )
                }
            )
        }
    }
}

@Composable
private fun StepProgressCard(
    steps: Int,
    goal: Int,
    progress: Float,
    isArabic: Boolean
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = CustomShapes.card,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.DirectionsWalk,
                    contentDescription = null,
                    modifier = Modifier.size(32.dp),
                    tint = MaterialTheme.colorScheme.onPrimaryContainer
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = if (isArabic) "خطوات اليوم" else "Today's Steps",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                    )
                    Text(
                        text = "$steps / $goal",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp),
                trackColor = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.2f)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "${(progress * 100).toInt()}%",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
            )
        }
    }
}

@Composable
private fun ActivityStatsGrid(
    stats: com.liyaqa.member.domain.model.WearableActivityStats,
    formatNumber: (Long) -> String,
    formatDurationHours: (Double) -> String,
    isArabic: Boolean
) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            StatCard(
                icon = Icons.AutoMirrored.Filled.DirectionsWalk,
                label = if (isArabic) "إجمالي الخطوات" else "Total Steps",
                value = formatNumber(stats.totalSteps),
                modifier = Modifier.weight(1f)
            )
            StatCard(
                icon = Icons.Default.LocalFireDepartment,
                label = if (isArabic) "السعرات" else "Calories",
                value = formatNumber(stats.totalCalories),
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            StatCard(
                icon = Icons.Default.Timer,
                label = if (isArabic) "الوقت النشط" else "Active Time",
                value = formatDurationHours(stats.totalActiveHours),
                modifier = Modifier.weight(1f)
            )
            StatCard(
                icon = Icons.Default.Bedtime,
                label = if (isArabic) "متوسط النوم" else "Avg Sleep",
                value = formatDurationHours(stats.averageSleepHours),
                modifier = Modifier.weight(1f)
            )
        }

        stats.averageRestingHeartRate?.let { hr ->
            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                StatCard(
                    icon = Icons.Default.Favorite,
                    label = if (isArabic) "معدل القلب" else "Resting HR",
                    value = "${hr.toInt()} bpm",
                    modifier = Modifier.weight(1f)
                )
                Spacer(modifier = Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun StatCard(
    icon: ImageVector,
    label: String,
    value: String,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = CustomShapes.card
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(24.dp),
                tint = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun WorkoutStatsCard(
    stats: com.liyaqa.member.domain.model.WearableWorkoutStats,
    formatDurationHours: (Double) -> String,
    isArabic: Boolean
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = CustomShapes.card
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.FitnessCenter,
                    contentDescription = null,
                    modifier = Modifier.size(24.dp),
                    tint = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = if (isArabic) "إحصائيات التمارين" else "Workout Stats",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
            }
            Spacer(modifier = Modifier.height(16.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceAround
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = stats.totalWorkouts.toString(),
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = if (isArabic) "تمارين" else "Workouts",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = formatDurationHours(stats.totalDurationHours),
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = if (isArabic) "الوقت" else "Duration",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = stats.totalCalories.toString(),
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = if (isArabic) "سعرة" else "Calories",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
private fun WorkoutCard(
    workout: WearableWorkout,
    formatDuration: (Int) -> String,
    isArabic: Boolean
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = CustomShapes.card
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = getWorkoutIcon(workout.activityTypeEnum),
                contentDescription = null,
                modifier = Modifier.size(32.dp),
                tint = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = workout.activityName ?: workout.activityTypeEnum.getLabel(isArabic),
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium
                )
                Row(
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    workout.durationSeconds?.let { duration ->
                        Text(
                            text = formatDuration(duration / 60),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    workout.caloriesBurned?.let { calories ->
                        Text(
                            text = "$calories ${if (isArabic) "سعرة" else "cal"}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun getWorkoutIcon(activityType: WearableActivityType): ImageVector {
    return when (activityType) {
        WearableActivityType.RUNNING -> Icons.Default.DirectionsRun
        WearableActivityType.WALKING -> Icons.AutoMirrored.Filled.DirectionsWalk
        WearableActivityType.STRENGTH_TRAINING -> Icons.Default.FitnessCenter
        WearableActivityType.GYM_WORKOUT -> Icons.Default.FitnessCenter
        else -> Icons.Default.FitnessCenter
    }
}
