package com.liyaqa.staff.presentation.screens.sessions

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
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
import com.liyaqa.staff.domain.model.BookingStatus
import com.liyaqa.staff.domain.model.SessionBooking
import com.liyaqa.staff.presentation.theme.LocalIsArabic
import com.liyaqa.staff.presentation.theme.Strings
import org.koin.core.parameter.parametersOf

data class SessionDetailScreen(val sessionId: String) : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val screenModel = getScreenModel<SessionDetailScreenModel> { parametersOf(sessionId) }
        val uiState by screenModel.uiState.collectAsState()
        val navigator = LocalNavigator.currentOrThrow
        val isArabic = LocalIsArabic.current

        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Text(uiState.session?.className?.get(isArabic) ?: Strings.sessions.get(isArabic))
                    },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                        }
                    },
                    actions = {
                        IconButton(onClick = screenModel::loadSessionDetails) {
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
                            Button(onClick = screenModel::loadSessionDetails) {
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
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Session Info Card
                        item {
                            uiState.session?.let { session ->
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = CardDefaults.cardColors(
                                        containerColor = MaterialTheme.colorScheme.primaryContainer
                                    )
                                ) {
                                    Column(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(16.dp)
                                    ) {
                                        Text(
                                            text = session.trainerName,
                                            style = MaterialTheme.typography.titleMedium
                                        )
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(
                                                Icons.Default.Schedule,
                                                contentDescription = null,
                                                modifier = Modifier.size(16.dp)
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(
                                                text = "${session.startTime} - ${session.endTime}",
                                                style = MaterialTheme.typography.bodyMedium
                                            )
                                        }
                                        session.roomName?.let { room ->
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Icon(
                                                    Icons.Default.Room,
                                                    contentDescription = null,
                                                    modifier = Modifier.size(16.dp)
                                                )
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text(
                                                    text = room.get(isArabic),
                                                    style = MaterialTheme.typography.bodyMedium
                                                )
                                            }
                                        }
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Text(
                                            text = "${Strings.capacity.get(isArabic)}: ${session.bookedCount}/${session.capacity}",
                                            style = MaterialTheme.typography.bodySmall
                                        )
                                    }
                                }
                            }
                        }

                        // Bookings Header
                        item {
                            Text(
                                text = "${Strings.bookings.get(isArabic)} (${uiState.bookings.size})",
                                style = MaterialTheme.typography.titleMedium
                            )
                        }

                        // Booking List
                        if (uiState.bookings.isEmpty()) {
                            item {
                                Text(
                                    text = "No bookings",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        } else {
                            items(uiState.bookings) { booking ->
                                BookingCard(
                                    booking = booking,
                                    isArabic = isArabic,
                                    isActionInProgress = uiState.actionInProgress == booking.id,
                                    onMarkAttended = { screenModel.markAttended(booking.id) },
                                    onMarkNoShow = { screenModel.markNoShow(booking.id) }
                                )
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
private fun BookingCard(
    booking: SessionBooking,
    isArabic: Boolean,
    isActionInProgress: Boolean,
    onMarkAttended: () -> Unit,
    onMarkNoShow: () -> Unit
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = booking.memberName,
                        style = MaterialTheme.typography.bodyLarge
                    )
                    Text(
                        text = booking.memberNumber,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    booking.memberPhone?.let {
                        Text(
                            text = it,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                BookingStatusChip(status = booking.status)
            }

            if (booking.status == BookingStatus.CONFIRMED && !isActionInProgress) {
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = onMarkAttended,
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(Strings.attended.get(isArabic), style = MaterialTheme.typography.labelMedium)
                    }
                    OutlinedButton(
                        onClick = onMarkNoShow,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = MaterialTheme.colorScheme.error
                        )
                    ) {
                        Icon(Icons.Default.Close, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(Strings.noShow.get(isArabic), style = MaterialTheme.typography.labelMedium)
                    }
                }
            }

            if (isActionInProgress) {
                Spacer(modifier = Modifier.height(12.dp))
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
            }
        }
    }
}

@Composable
private fun BookingStatusChip(status: BookingStatus) {
    val (color, text) = when (status) {
        BookingStatus.CONFIRMED -> MaterialTheme.colorScheme.primary to "Confirmed"
        BookingStatus.ATTENDED -> MaterialTheme.colorScheme.tertiary to "Attended"
        BookingStatus.NO_SHOW -> MaterialTheme.colorScheme.error to "No Show"
        BookingStatus.CANCELLED -> MaterialTheme.colorScheme.outline to "Cancelled"
    }

    Surface(
        color = color.copy(alpha = 0.12f),
        shape = MaterialTheme.shapes.small
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall,
            color = color
        )
    }
}
