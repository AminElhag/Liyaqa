package com.liyaqa.dashboard.features.trainer.presentation.list

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
import com.liyaqa.dashboard.features.trainer.domain.model.Trainer
import com.liyaqa.dashboard.features.trainer.domain.model.TrainerStatus

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TrainerListScreen(
    viewModel: TrainerListViewModel,
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
            viewModel.onEvent(TrainerListUiEvent.ClearError)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Personal Trainers") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.onEvent(TrainerListUiEvent.Refresh) }) {
                        Icon(Icons.Default.Refresh, "Refresh")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = onNavigateToCreate) {
                Icon(Icons.Default.Add, "Add Trainer")
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
                    viewModel.onEvent(TrainerListUiEvent.StatusFilterChanged(it))
                }
            )

            // Trainer List
            if (state.isLoading && state.trainers.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else if (state.trainers.isEmpty()) {
                EmptyState()
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(state.trainers) { trainer ->
                        TrainerCard(
                            trainer = trainer,
                            onClick = { onNavigateToDetail(trainer.id) },
                            onDelete = {
                                viewModel.onEvent(TrainerListUiEvent.ShowDeleteDialog(trainer))
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
                                viewModel.onEvent(TrainerListUiEvent.LoadMore)
                            }
                        }
                    }
                }
            }
        }
    }

    // Delete Confirmation Dialog
    if (state.showDeleteDialog && state.trainerToDelete != null) {
        AlertDialog(
            onDismissRequest = {
                viewModel.onEvent(TrainerListUiEvent.HideDeleteDialog)
            },
            title = { Text("Delete Trainer") },
            text = {
                Text("Are you sure you want to remove ${state.trainerToDelete!!.fullName} from the trainer list?")
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.onEvent(TrainerListUiEvent.ConfirmDelete)
                    }
                ) {
                    Text("Delete", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        viewModel.onEvent(TrainerListUiEvent.HideDeleteDialog)
                    }
                ) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
private fun StatusFilterSection(
    selectedStatus: TrainerStatus?,
    onStatusFilterChanged: (TrainerStatus?) -> Unit
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
            TrainerStatus.entries.forEach { status ->
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
private fun TrainerCard(
    trainer: Trainer,
    onClick: () -> Unit,
    onDelete: () -> Unit
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
                        text = trainer.fullName,
                        style = MaterialTheme.typography.titleMedium
                    )
                    Text(
                        text = trainer.email,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    if (trainer.bio != null) {
                        Text(
                            text = trainer.bio,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 2,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                }

                Column(horizontalAlignment = Alignment.End) {
                    AssistChip(
                        onClick = {},
                        label = { Text(trainer.status.name) },
                        colors = AssistChipDefaults.assistChipColors(
                            containerColor = when (trainer.status) {
                                TrainerStatus.ACTIVE -> MaterialTheme.colorScheme.primaryContainer
                                TrainerStatus.INACTIVE -> MaterialTheme.colorScheme.secondaryContainer
                                TrainerStatus.ON_LEAVE -> MaterialTheme.colorScheme.tertiaryContainer
                                TrainerStatus.TERMINATED -> MaterialTheme.colorScheme.errorContainer
                            }
                        )
                    )
                }
            }

            // Rating and Stats
            Row(
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.Star,
                        null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = "%.1f".format(trainer.averageRating),
                        style = MaterialTheme.typography.labelMedium
                    )
                    Text(
                        text = "(${trainer.totalReviews})",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Text(
                    text = "${trainer.totalSessions} sessions",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Specializations
            if (trainer.specializations.isNotEmpty()) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.padding(top = 4.dp)
                ) {
                    trainer.specializations.take(3).forEach { spec ->
                        AssistChip(
                            onClick = {},
                            label = { Text(spec, style = MaterialTheme.typography.labelSmall) }
                        )
                    }
                    if (trainer.specializations.size > 3) {
                        AssistChip(
                            onClick = {},
                            label = { Text("+${trainer.specializations.size - 3}", style = MaterialTheme.typography.labelSmall) }
                        )
                    }
                }
            }

            // Rates
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    trainer.sessionRate30Min?.let {
                        Text("30min: $${it}", style = MaterialTheme.typography.labelMedium)
                    }
                    trainer.sessionRate60Min?.let {
                        Text("60min: $${it}", style = MaterialTheme.typography.labelMedium)
                    }
                }

                IconButton(onClick = onDelete) {
                    Icon(Icons.Default.Delete, "Delete", tint = MaterialTheme.colorScheme.error)
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
                Icons.Default.FitnessCenter,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                "No trainers found",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                "Add your first trainer to get started",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
