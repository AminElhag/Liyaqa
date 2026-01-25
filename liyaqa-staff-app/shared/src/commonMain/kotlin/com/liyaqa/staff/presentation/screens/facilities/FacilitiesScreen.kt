package com.liyaqa.staff.presentation.screens.facilities

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
import com.liyaqa.staff.domain.model.BookingStatus
import com.liyaqa.staff.domain.model.FacilityBooking
import com.liyaqa.staff.presentation.theme.LocalIsArabic
import com.liyaqa.staff.presentation.theme.Strings

object FacilitiesScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val screenModel = getScreenModel<FacilitiesScreenModel>()
        val uiState by screenModel.uiState.collectAsState()
        val isArabic = LocalIsArabic.current

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(Strings.facilities.get(isArabic)) },
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
                uiState.bookings.isEmpty() -> {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                Icons.Default.MeetingRoom,
                                contentDescription = null,
                                modifier = Modifier.size(64.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = Strings.noBookingsToday.get(isArabic),
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
                        // Stats Summary
                        item {
                            uiState.todayBookings?.let { stats ->
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

                        items(uiState.bookings) { booking ->
                            FacilityBookingCard(
                                booking = booking,
                                isArabic = isArabic,
                                isActionInProgress = uiState.actionInProgress == booking.id,
                                onCheckIn = { screenModel.checkInBooking(booking.id) },
                                onCancel = { screenModel.cancelBooking(booking.id) }
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
private fun FacilityBookingCard(
    booking: FacilityBooking,
    isArabic: Boolean,
    isActionInProgress: Boolean,
    onCheckIn: () -> Unit,
    onCancel: () -> Unit
) {
    Card(modifier = Modifier.fillMaxWidth()) {
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
                        text = booking.facilityName.get(isArabic),
                        style = MaterialTheme.typography.titleMedium
                    )
                    Text(
                        text = booking.facilityType,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                FacilityStatusChip(status = booking.status)
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.Schedule,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "${booking.startTime} - ${booking.endTime}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.Person,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "${booking.memberName} (${booking.memberNumber})",
                    style = MaterialTheme.typography.bodyMedium
                )
            }

            booking.memberPhone?.let { phone ->
                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.Phone,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = phone,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            if (booking.status == BookingStatus.CONFIRMED && !isActionInProgress) {
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = onCheckIn,
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Login, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(Strings.facilityCheckIn.get(isArabic))
                    }
                    OutlinedButton(
                        onClick = onCancel,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = MaterialTheme.colorScheme.error
                        )
                    ) {
                        Icon(Icons.Default.Close, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(Strings.cancel.get(isArabic))
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
private fun FacilityStatusChip(status: BookingStatus) {
    val (color, text) = when (status) {
        BookingStatus.CONFIRMED -> MaterialTheme.colorScheme.primary to "Confirmed"
        BookingStatus.ATTENDED -> MaterialTheme.colorScheme.tertiary to "Checked In"
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
