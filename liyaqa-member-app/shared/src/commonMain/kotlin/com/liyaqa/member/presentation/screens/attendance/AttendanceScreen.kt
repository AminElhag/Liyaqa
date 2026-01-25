package com.liyaqa.member.presentation.screens.attendance

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.getScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.liyaqa.member.presentation.components.AttendanceCalendar
import com.liyaqa.member.presentation.components.AttendanceCard
import com.liyaqa.member.presentation.components.EmptyView
import com.liyaqa.member.presentation.components.ErrorView
import com.liyaqa.member.presentation.components.LoadingView
import com.liyaqa.member.presentation.components.SectionHeader
import com.liyaqa.member.presentation.theme.LocalIsArabic
import com.liyaqa.member.presentation.theme.Strings
import com.liyaqa.member.presentation.theme.localized

object AttendanceScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val screenModel = getScreenModel<AttendanceScreenModel>()
        val state by screenModel.state.collectAsState()
        val isArabic = LocalIsArabic.current

        LaunchedEffect(Unit) {
            screenModel.loadAttendance()
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Text(
                            text = Strings.attendanceHistory.localized(),
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
                        IconButton(onClick = {
                            navigator.push(AttendanceStatsScreen)
                        }) {
                            Icon(
                                imageVector = Icons.Default.BarChart,
                                contentDescription = if (isArabic) "الإحصائيات" else "Statistics"
                            )
                        }
                    }
                )
            }
        ) { paddingValues ->
            PullToRefreshBox(
                isRefreshing = state.isRefreshing,
                onRefresh = screenModel::refresh,
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                when {
                    state.isLoading && state.attendance.isEmpty() -> {
                        LoadingView()
                    }
                    state.error != null && state.attendance.isEmpty() -> {
                        val errorMessage = if (isArabic) {
                            state.error?.messageAr ?: state.error?.message
                        } else {
                            state.error?.message
                        }
                        ErrorView(
                            message = errorMessage ?: "Error loading attendance",
                            onRetry = screenModel::loadAttendance
                        )
                    }
                    state.attendance.isEmpty() -> {
                        EmptyView(
                            message = if (isArabic) {
                                "لا يوجد سجل حضور"
                            } else {
                                "No attendance records"
                            }
                        )
                    }
                    else -> {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // Calendar view
                            item {
                                AttendanceCalendar(
                                    month = state.currentMonth,
                                    attendedDays = state.attendedDays,
                                    totalDays = state.totalDaysInMonth,
                                    onPreviousMonth = screenModel::previousMonth,
                                    onNextMonth = screenModel::nextMonth
                                )
                            }

                            // Recent attendance section
                            item {
                                SectionHeader(
                                    title = if (isArabic) "السجل الأخير" else "Recent History"
                                )
                            }

                            items(
                                items = state.attendance,
                                key = { it.id }
                            ) { attendance ->
                                AttendanceCard(attendance = attendance)
                            }
                        }
                    }
                }
            }
        }
    }
}
