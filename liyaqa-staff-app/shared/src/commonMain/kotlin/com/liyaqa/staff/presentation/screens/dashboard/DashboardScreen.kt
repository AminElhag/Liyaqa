package com.liyaqa.staff.presentation.screens.dashboard

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.getScreenModel
import com.liyaqa.staff.domain.model.ClassSession
import com.liyaqa.staff.domain.model.RecentCheckIn
import com.liyaqa.staff.presentation.theme.LocalIsArabic
import com.liyaqa.staff.presentation.theme.Strings

object DashboardScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val screenModel = getScreenModel<DashboardScreenModel>()
        val uiState by screenModel.uiState.collectAsState()
        val isArabic = LocalIsArabic.current

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(Strings.dashboard.get(isArabic)) },
                    actions = {
                        IconButton(onClick = screenModel::refresh) {
                            Icon(Icons.Default.Refresh, contentDescription = null)
                        }
                    }
                )
            }
        ) { paddingValues ->
            when {
                uiState.isLoading -> {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }
                uiState.error != null -> {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = uiState.error!!,
                                color = MaterialTheme.colorScheme.error
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(onClick = screenModel::refresh) {
                                Text(Strings.retry.get(isArabic))
                            }
                        }
                    }
                }
                else -> {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues)
                            .padding(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        item {
                            Spacer(modifier = Modifier.height(8.dp))
                        }

                        // Stats Cards
                        item {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                StatCard(
                                    modifier = Modifier.weight(1f),
                                    title = Strings.todayCheckIns.get(isArabic),
                                    value = uiState.dashboard?.todayCheckIns?.toString() ?: "0",
                                    icon = Icons.Default.Login
                                )
                                StatCard(
                                    modifier = Modifier.weight(1f),
                                    title = Strings.activeMembers.get(isArabic),
                                    value = uiState.dashboard?.activeMembers?.toString() ?: "0",
                                    icon = Icons.Default.People
                                )
                            }
                        }

                        item {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                StatCard(
                                    modifier = Modifier.weight(1f),
                                    title = Strings.todaySessions.get(isArabic),
                                    value = uiState.dashboard?.todaySessions?.toString() ?: "0",
                                    icon = Icons.Default.CalendarMonth
                                )
                                StatCard(
                                    modifier = Modifier.weight(1f),
                                    title = Strings.facilityBookings.get(isArabic),
                                    value = uiState.dashboard?.todayFacilityBookings?.toString() ?: "0",
                                    icon = Icons.Default.MeetingRoom
                                )
                            }
                        }

                        // Upcoming Sessions
                        val upcomingSessions = uiState.dashboard?.upcomingSessions ?: emptyList()
                        if (upcomingSessions.isNotEmpty()) {
                            item {
                                Text(
                                    text = Strings.upcomingSessions.get(isArabic),
                                    style = MaterialTheme.typography.titleMedium
                                )
                            }
                            items(upcomingSessions.take(3)) { session ->
                                SessionCard(session = session, isArabic = isArabic)
                            }
                        }

                        // Recent Check-ins
                        val recentCheckIns = uiState.dashboard?.recentCheckIns ?: emptyList()
                        if (recentCheckIns.isNotEmpty()) {
                            item {
                                Text(
                                    text = Strings.recentCheckIns.get(isArabic),
                                    style = MaterialTheme.typography.titleMedium
                                )
                            }
                            items(recentCheckIns.take(5)) { checkIn ->
                                CheckInCard(checkIn = checkIn)
                            }
                        }

                        item {
                            Spacer(modifier = Modifier.height(16.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StatCard(
    modifier: Modifier = Modifier,
    title: String,
    value: String,
    icon: ImageVector
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onPrimaryContainer
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
            Text(
                text = title,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
            )
        }
    }
}

@Composable
private fun SessionCard(session: ClassSession, isArabic: Boolean) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = session.className.get(isArabic),
                    style = MaterialTheme.typography.titleSmall
                )
                Text(
                    text = "${session.startTime} - ${session.endTime}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = session.trainerName,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "${session.bookedCount}/${session.capacity}",
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = Strings.bookings.get(isArabic),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun CheckInCard(checkIn: RecentCheckIn) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Person,
                contentDescription = null,
                modifier = Modifier.size(40.dp),
                tint = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = checkIn.memberName,
                    style = MaterialTheme.typography.bodyMedium
                )
                Text(
                    text = checkIn.memberNumber,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Text(
                text = checkIn.checkedInAt.substringAfter("T").take(5),
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
