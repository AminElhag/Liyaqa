package com.liyaqa.dashboard.features.booking.presentation.list

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
import com.liyaqa.dashboard.features.booking.domain.model.Booking
import com.liyaqa.dashboard.features.booking.domain.model.BookingStatus

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BookingListScreen(
    viewModel: BookingListViewModel,
    onNavigateToDetail: (String) -> Unit,
    onNavigateToCreate: () -> Unit,
    onNavigateBack: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    // Show error snackbar
    LaunchedEffect(state.error) {
        state.error?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.onEvent(BookingListUiEvent.ClearError)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Bookings") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.onEvent(BookingListUiEvent.Refresh) }) {
                        Icon(Icons.Default.Refresh, "Refresh")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = onNavigateToCreate) {
                Icon(Icons.Default.Add, "New Booking")
            }
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Status Filter Section
            StatusFilterSection(
                selectedStatus = state.selectedStatus,
                onStatusFilterChanged = {
                    viewModel.onEvent(BookingListUiEvent.StatusFilterChanged(it))
                }
            )

            // Booking List
            if (state.isLoading && state.bookings.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else if (state.bookings.isEmpty()) {
                EmptyState()
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(state.bookings) { booking ->
                        BookingCard(
                            booking = booking,
                            onClick = { onNavigateToDetail(booking.id) },
                            onCancel = {
                                viewModel.onEvent(BookingListUiEvent.ShowCancelDialog(booking))
                            },
                            onCheckIn = {
                                viewModel.onEvent(BookingListUiEvent.CheckIn(booking))
                            }
                        )
                    }

                    if (state.hasMore) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                CircularProgressIndicator()
                            }
                            LaunchedEffect(Unit) {
                                viewModel.onEvent(BookingListUiEvent.LoadMore)
                            }
                        }
                    }
                }
            }
        }
    }

    // Cancel Confirmation Dialog
    if (state.showCancelDialog && state.bookingToCancel != null) {
        AlertDialog(
            onDismissRequest = {
                viewModel.onEvent(BookingListUiEvent.HideCancelDialog)
            },
            title = { Text("Cancel Booking") },
            text = {
                Text("Are you sure you want to cancel this booking for ${state.bookingToCancel!!.memberName}?")
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.onEvent(BookingListUiEvent.ConfirmCancel)
                    }
                ) {
                    Text("Cancel Booking", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        viewModel.onEvent(BookingListUiEvent.HideCancelDialog)
                    }
                ) {
                    Text("Keep Booking")
                }
            }
        )
    }
}

@Composable
private fun StatusFilterSection(
    selectedStatus: BookingStatus?,
    onStatusFilterChanged: (BookingStatus?) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text("Filter by Status", style = MaterialTheme.typography.labelMedium)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            FilterChip(
                selected = selectedStatus == null,
                onClick = { onStatusFilterChanged(null) },
                label = { Text("All") }
            )
            BookingStatus.entries.forEach { status ->
                FilterChip(
                    selected = selectedStatus == status,
                    onClick = { onStatusFilterChanged(status) },
                    label = { Text(status.name) }
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun BookingCard(
    booking: Booking,
    onClick: () -> Unit,
    onCancel: () -> Unit,
    onCheckIn: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = booking.resourceName,
                        style = MaterialTheme.typography.titleMedium
                    )
                    Text(
                        text = booking.memberName,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                AssistChip(
                    onClick = {},
                    label = { Text(booking.status.name) },
                    colors = AssistChipDefaults.assistChipColors(
                        containerColor = when (booking.status) {
                            BookingStatus.CONFIRMED -> MaterialTheme.colorScheme.primaryContainer
                            BookingStatus.IN_PROGRESS -> MaterialTheme.colorScheme.tertiaryContainer
                            BookingStatus.COMPLETED -> MaterialTheme.colorScheme.secondaryContainer
                            BookingStatus.CANCELLED -> MaterialTheme.colorScheme.errorContainer
                            BookingStatus.NO_SHOW -> MaterialTheme.colorScheme.errorContainer
                            BookingStatus.PENDING -> MaterialTheme.colorScheme.surfaceVariant
                        }
                    )
                )
            }

            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                AssistChip(
                    onClick = {},
                    label = { Text(booking.resourceType.name) },
                    leadingIcon = {
                        Icon(
                            when (booking.resourceType) {
                                com.liyaqa.dashboard.features.booking.domain.model.ResourceType.COURT -> Icons.Default.Sports
                                com.liyaqa.dashboard.features.booking.domain.model.ResourceType.EQUIPMENT -> Icons.Default.FitnessCenter
                                com.liyaqa.dashboard.features.booking.domain.model.ResourceType.ROOM -> Icons.Default.MeetingRoom
                                else -> Icons.Default.Category
                            },
                            null,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                )
                AssistChip(
                    onClick = {},
                    label = { Text("${booking.startTime} - ${booking.endTime}") },
                    leadingIcon = { Icon(Icons.Default.Schedule, null, modifier = Modifier.size(16.dp)) }
                )
                AssistChip(
                    onClick = {},
                    label = { Text("$${booking.price}") },
                    leadingIcon = { Icon(Icons.Default.Payment, null, modifier = Modifier.size(16.dp)) }
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (booking.canCheckIn()) {
                    FilledTonalButton(
                        onClick = onCheckIn,
                        modifier = Modifier.padding(end = 8.dp)
                    ) {
                        Icon(Icons.Default.Login, null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("Check In")
                    }
                }
                if (booking.status == BookingStatus.CONFIRMED || booking.status == BookingStatus.PENDING) {
                    OutlinedButton(onClick = onCancel) {
                        Icon(Icons.Default.Cancel, null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("Cancel")
                    }
                }
            }
        }
    }
}

@Composable
private fun EmptyState() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                Icons.Default.EventBusy,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                "No bookings found",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                "Create a new booking to get started",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
