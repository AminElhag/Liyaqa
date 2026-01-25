package com.liyaqa.staff.presentation.screens.sessions

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.getScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.liyaqa.staff.domain.model.ClassSession
import com.liyaqa.staff.presentation.theme.LocalIsArabic
import com.liyaqa.staff.presentation.theme.Strings

object SessionsScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val screenModel = getScreenModel<SessionsScreenModel>()
        val uiState by screenModel.uiState.collectAsState()
        val navigator = LocalNavigator.currentOrThrow
        val isArabic = LocalIsArabic.current

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(Strings.sessions.get(isArabic)) },
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
                uiState.sessions.isEmpty() -> {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                Icons.Default.EventBusy,
                                contentDescription = null,
                                modifier = Modifier.size(64.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = Strings.noSessionsToday.get(isArabic),
                                style = MaterialTheme.typography.bodyLarge,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
                else -> {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues)
                            .padding(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        item {
                            // Stats Summary
                            uiState.todaySessions?.let { stats ->
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = CardDefaults.cardColors(
                                        containerColor = MaterialTheme.colorScheme.primaryContainer
                                    )
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(16.dp),
                                        horizontalArrangement = Arrangement.SpaceEvenly
                                    ) {
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            Text(
                                                text = "${stats.sessions.size}",
                                                style = MaterialTheme.typography.headlineMedium
                                            )
                                            Text(
                                                text = Strings.sessions.get(isArabic),
                                                style = MaterialTheme.typography.labelSmall
                                            )
                                        }
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            Text(
                                                text = "${stats.totalBookings}",
                                                style = MaterialTheme.typography.headlineMedium
                                            )
                                            Text(
                                                text = Strings.bookings.get(isArabic),
                                                style = MaterialTheme.typography.labelSmall
                                            )
                                        }
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            Text(
                                                text = "${stats.totalAttended}",
                                                style = MaterialTheme.typography.headlineMedium
                                            )
                                            Text(
                                                text = Strings.attended.get(isArabic),
                                                style = MaterialTheme.typography.labelSmall
                                            )
                                        }
                                    }
                                }
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                        }

                        items(uiState.sessions) { session ->
                            SessionCard(
                                session = session,
                                isArabic = isArabic,
                                onClick = { navigator.push(SessionDetailScreen(session.id)) }
                            )
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
private fun SessionCard(
    session: ClassSession,
    isArabic: Boolean,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = session.className.get(isArabic),
                        style = MaterialTheme.typography.titleMedium
                    )
                    Text(
                        text = session.trainerName,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Surface(
                    color = if (session.isFull)
                        MaterialTheme.colorScheme.errorContainer
                    else
                        MaterialTheme.colorScheme.primaryContainer,
                    shape = MaterialTheme.shapes.small
                ) {
                    Text(
                        text = "${session.bookedCount}/${session.capacity}",
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelMedium
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.Schedule,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "${session.startTime} - ${session.endTime}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                session.roomName?.let { room ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Default.Room,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = room.get(isArabic),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "${Strings.attended.get(isArabic)}: ${session.attendedCount}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary
                )
                if (session.waitlistCount > 0) {
                    Text(
                        text = "${Strings.waitlist.get(isArabic)}: ${session.waitlistCount}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.tertiary
                    )
                }
            }
        }
    }
}
