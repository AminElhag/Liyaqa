package com.liyaqa.liyaqa_internal_app.features.facility.presentation.list

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
import com.liyaqa.liyaqa_internal_app.features.facility.domain.model.Facility
import com.liyaqa.liyaqa_internal_app.features.facility.domain.model.FacilityStatus

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FacilityListScreen(
    viewModel: FacilityListViewModel,
    onNavigateToDetail: (String) -> Unit,
    onNavigateToCreate: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Facilities") },
                actions = {
                    IconButton(onClick = { viewModel.onEvent(FacilityListUiEvent.Refresh) }) {
                        Icon(Icons.Default.Refresh, "Refresh")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = onNavigateToCreate) {
                Icon(Icons.Default.Add, "Add Facility")
            }
        },
        modifier = modifier
    ) { paddingValues ->
        Column(Modifier.fillMaxSize().padding(paddingValues)) {
            OutlinedTextField(
                value = uiState.searchQuery,
                onValueChange = { viewModel.onEvent(FacilityListUiEvent.SearchChanged(it)) },
                placeholder = { Text("Search facilities...") },
                leadingIcon = { Icon(Icons.Default.Search, "Search") },
                modifier = Modifier.fillMaxWidth().padding(16.dp)
            )

            if (!uiState.isLoading) {
                Text(
                    "${uiState.totalElements} facilities",
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )
            }

            when {
                uiState.isLoading && uiState.facilities.isEmpty() -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
                uiState.facilities.isEmpty() -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("No facilities found")
                    }
                }
                else -> {
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(uiState.facilities, key = { it.id }) { facility ->
                            FacilityCard(
                                facility = facility,
                                isDeleting = uiState.deletingFacilityId == facility.id,
                                onClick = { onNavigateToDetail(facility.id) },
                                onDelete = { viewModel.onEvent(FacilityListUiEvent.DeleteFacility(facility.id)) }
                            )
                        }
                    }
                }
            }
        }

        if (uiState.error != null) {
            Snackbar(
                action = {
                    TextButton(onClick = { viewModel.onEvent(FacilityListUiEvent.ClearError) }) {
                        Text("Dismiss")
                    }
                },
                modifier = Modifier.padding(16.dp)
            ) {
                Text(uiState.error!!)
            }
        }
    }
}

@Composable
private fun FacilityCard(
    facility: Facility,
    isDeleting: Boolean,
    onClick: () -> Unit,
    onDelete: () -> Unit,
    modifier: Modifier = Modifier
) {
    var showDeleteDialog by remember { mutableStateOf(false) }

    Card(
        modifier = modifier.fillMaxWidth().clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(Modifier.weight(1f)) {
                Text(facility.name, style = MaterialTheme.typography.titleMedium)
                Text(facility.contactEmail, style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.height(4.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AssistChip(
                        onClick = {},
                        label = { Text(facility.status.name, style = MaterialTheme.typography.labelSmall) },
                        colors = AssistChipDefaults.assistChipColors(
                            containerColor = when (facility.status) {
                                FacilityStatus.ACTIVE -> MaterialTheme.colorScheme.primaryContainer
                                else -> MaterialTheme.colorScheme.surfaceVariant
                            }
                        )
                    )
                    AssistChip(
                        onClick = {},
                        label = { Text(facility.facilityType.name, style = MaterialTheme.typography.labelSmall) }
                    )
                }
            }

            if (isDeleting) {
                CircularProgressIndicator(Modifier.size(24.dp))
            } else {
                IconButton(onClick = { showDeleteDialog = true }) {
                    Icon(Icons.Default.Delete, "Delete", tint = MaterialTheme.colorScheme.error)
                }
            }
        }
    }

    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete Facility") },
            text = { Text("Delete ${facility.name}? This action cannot be undone.") },
            confirmButton = {
                TextButton(onClick = { onDelete(); showDeleteDialog = false }) {
                    Text("Delete", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}
