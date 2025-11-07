package com.liyaqa.dashboard.features.employee.presentation.list

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
import com.liyaqa.dashboard.features.employee.domain.model.EmployeeStatus
import com.liyaqa.dashboard.features.employee.domain.model.FacilityEmployee

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FacilityEmployeeListScreen(
    viewModel: FacilityEmployeeListViewModel,
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
            viewModel.onEvent(FacilityEmployeeListUiEvent.ClearError)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Facility Employees") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.onEvent(FacilityEmployeeListUiEvent.Refresh) }) {
                        Icon(Icons.Default.Refresh, "Refresh")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = onNavigateToCreate) {
                Icon(Icons.Default.Add, "Add Employee")
            }
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Search and Filter Section
            SearchAndFilterSection(
                searchQuery = state.searchQuery,
                selectedStatus = state.selectedStatus,
                onSearchQueryChanged = {
                    viewModel.onEvent(FacilityEmployeeListUiEvent.SearchQueryChanged(it))
                },
                onStatusFilterChanged = {
                    viewModel.onEvent(FacilityEmployeeListUiEvent.StatusFilterChanged(it))
                }
            )

            // Employee List
            if (state.isLoading && state.employees.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else if (state.employees.isEmpty()) {
                EmptyState()
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(state.employees) { employee ->
                        EmployeeCard(
                            employee = employee,
                            onClick = { onNavigateToDetail(employee.id) },
                            onDelete = {
                                viewModel.onEvent(FacilityEmployeeListUiEvent.ShowDeleteDialog(employee))
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
                                viewModel.onEvent(FacilityEmployeeListUiEvent.LoadMore)
                            }
                        }
                    }
                }
            }
        }
    }

    // Delete Confirmation Dialog
    if (state.showDeleteDialog && state.employeeToDelete != null) {
        AlertDialog(
            onDismissRequest = {
                viewModel.onEvent(FacilityEmployeeListUiEvent.HideDeleteDialog)
            },
            title = { Text("Delete Employee") },
            text = {
                Text("Are you sure you want to delete ${state.employeeToDelete!!.fullName}?")
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.onEvent(FacilityEmployeeListUiEvent.ConfirmDelete)
                    }
                ) {
                    Text("Delete", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        viewModel.onEvent(FacilityEmployeeListUiEvent.HideDeleteDialog)
                    }
                ) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
private fun SearchAndFilterSection(
    searchQuery: String,
    selectedStatus: EmployeeStatus?,
    onSearchQueryChanged: (String) -> Unit,
    onStatusFilterChanged: (EmployeeStatus?) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // Search Field
        OutlinedTextField(
            value = searchQuery,
            onValueChange = onSearchQueryChanged,
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("Search employees...") },
            leadingIcon = { Icon(Icons.Default.Search, "Search") },
            singleLine = true
        )

        // Status Filter
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            FilterChip(
                selected = selectedStatus == null,
                onClick = { onStatusFilterChanged(null) },
                label = { Text("All") }
            )
            EmployeeStatus.entries.forEach { status ->
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
private fun EmployeeCard(
    employee: FacilityEmployee,
    onClick: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = employee.fullName,
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = employee.email,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.padding(top = 4.dp)
                ) {
                    AssistChip(
                        onClick = {},
                        label = { Text(employee.employeeNumber) },
                        leadingIcon = { Icon(Icons.Default.Badge, null, modifier = Modifier.size(16.dp)) }
                    )
                    if (employee.position != null) {
                        AssistChip(
                            onClick = {},
                            label = { Text(employee.position) },
                            leadingIcon = { Icon(Icons.Default.Work, null, modifier = Modifier.size(16.dp)) }
                        )
                    }
                    AssistChip(
                        onClick = {},
                        label = { Text(employee.status.name) },
                        colors = AssistChipDefaults.assistChipColors(
                            containerColor = when (employee.status) {
                                EmployeeStatus.ACTIVE -> MaterialTheme.colorScheme.primaryContainer
                                EmployeeStatus.INACTIVE -> MaterialTheme.colorScheme.secondaryContainer
                                EmployeeStatus.SUSPENDED -> MaterialTheme.colorScheme.errorContainer
                                EmployeeStatus.TERMINATED -> MaterialTheme.colorScheme.errorContainer
                            }
                        )
                    )
                }
            }

            IconButton(onClick = onDelete) {
                Icon(Icons.Default.Delete, "Delete", tint = MaterialTheme.colorScheme.error)
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
                Icons.Default.People,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                "No employees found",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                "Add your first employee to get started",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
