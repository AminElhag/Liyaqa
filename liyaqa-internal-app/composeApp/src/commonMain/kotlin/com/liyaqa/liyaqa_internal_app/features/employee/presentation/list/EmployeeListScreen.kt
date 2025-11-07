package com.liyaqa.liyaqa_internal_app.features.employee.presentation.list

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.liyaqa.liyaqa_internal_app.features.employee.domain.model.Employee
import com.liyaqa.liyaqa_internal_app.features.employee.domain.model.EmployeeStatus

/**
 * Employee List Screen with Material 3 design
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EmployeeListScreen(
    viewModel: EmployeeListViewModel,
    onNavigateToDetail: (String) -> Unit,
    onNavigateToCreate: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val listState = rememberLazyListState()

    // Load more when reaching end
    LaunchedEffect(listState) {
        snapshotFlow { listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index }
            .collect { lastVisibleIndex ->
                if (lastVisibleIndex != null &&
                    lastVisibleIndex >= uiState.employees.size - 3 &&
                    !uiState.isLoadingMore &&
                    !uiState.isLastPage
                ) {
                    viewModel.onEvent(EmployeeListUiEvent.LoadMore)
                }
            }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Employees") },
                actions = {
                    IconButton(onClick = { viewModel.onEvent(EmployeeListUiEvent.Refresh) }) {
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
        snackbarHost = {
            if (uiState.error != null) {
                Snackbar(
                    action = {
                        TextButton(onClick = { viewModel.onEvent(EmployeeListUiEvent.ClearError) }) {
                            Text("Dismiss")
                        }
                    }
                ) {
                    Text(uiState.error!!)
                }
            }
        },
        modifier = modifier
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Search and filters
            SearchAndFilters(
                searchQuery = uiState.searchQuery,
                statusFilter = uiState.statusFilter,
                onSearchChanged = { viewModel.onEvent(EmployeeListUiEvent.SearchChanged(it)) },
                onSearchSubmitted = { viewModel.onEvent(EmployeeListUiEvent.SearchSubmitted) },
                onStatusFilterChanged = { viewModel.onEvent(EmployeeListUiEvent.StatusFilterChanged(it)) }
            )

            // Results info
            if (!uiState.isLoading) {
                Text(
                    text = "${uiState.totalElements} employees found",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                )
            }

            // Employee list
            when {
                uiState.isLoading && uiState.employees.isEmpty() -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }

                uiState.employees.isEmpty() -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            "No employees found",
                            style = MaterialTheme.typography.bodyLarge
                        )
                    }
                }

                else -> {
                    LazyColumn(
                        state = listState,
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(
                            items = uiState.employees,
                            key = { it.id }
                        ) { employee ->
                            EmployeeCard(
                                employee = employee,
                                isDeleting = uiState.deletingEmployeeId == employee.id,
                                onClick = { onNavigateToDetail(employee.id) },
                                onDelete = { viewModel.onEvent(EmployeeListUiEvent.DeleteEmployee(employee.id)) }
                            )
                        }

                        if (uiState.isLoadingMore) {
                            item {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(16.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    CircularProgressIndicator()
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SearchAndFilters(
    searchQuery: String,
    statusFilter: EmployeeStatus?,
    onSearchChanged: (String) -> Unit,
    onSearchSubmitted: () -> Unit,
    onStatusFilterChanged: (EmployeeStatus?) -> Unit,
    modifier: Modifier = Modifier
) {
    var showFilterMenu by remember { mutableStateOf(false) }

    Column(modifier = modifier.padding(16.dp)) {
        // Search bar
        OutlinedTextField(
            value = searchQuery,
            onValueChange = onSearchChanged,
            placeholder = { Text("Search employees...") },
            leadingIcon = { Icon(Icons.Default.Search, "Search") },
            trailingIcon = {
                if (searchQuery.isNotEmpty()) {
                    IconButton(onClick = { onSearchChanged("") }) {
                        Icon(Icons.Default.Clear, "Clear")
                    }
                }
            },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Filter chips
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            FilterChip(
                selected = statusFilter != null,
                onClick = { showFilterMenu = true },
                label = {
                    Text(
                        statusFilter?.name ?: "All Status",
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                },
                leadingIcon = {
                    Icon(
                        Icons.Default.FilterList,
                        "Filter by status",
                        modifier = Modifier.size(16.dp)
                    )
                }
            )

            if (statusFilter != null) {
                FilterChip(
                    selected = false,
                    onClick = { onStatusFilterChanged(null) },
                    label = { Text("Clear") },
                    leadingIcon = {
                        Icon(
                            Icons.Default.Clear,
                            "Clear filter",
                            modifier = Modifier.size(16.dp)
                        )
                    }
                )
            }

            // Status filter dropdown
            DropdownMenu(
                expanded = showFilterMenu,
                onDismissRequest = { showFilterMenu = false }
            ) {
                EmployeeStatus.entries.forEach { status ->
                    DropdownMenuItem(
                        text = { Text(status.name) },
                        onClick = {
                            onStatusFilterChanged(status)
                            showFilterMenu = false
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun EmployeeCard(
    employee: Employee,
    isDeleting: Boolean,
    onClick: () -> Unit,
    onDelete: () -> Unit,
    modifier: Modifier = Modifier
) {
    var showDeleteDialog by remember { mutableStateOf(false) }

    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
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
                Text(
                    text = employee.employeeNumber,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(4.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    // Status badge
                    AssistChip(
                        onClick = {},
                        label = { Text(employee.status.name, style = MaterialTheme.typography.labelSmall) },
                        colors = AssistChipDefaults.assistChipColors(
                            containerColor = when (employee.status) {
                                EmployeeStatus.ACTIVE -> MaterialTheme.colorScheme.primaryContainer
                                EmployeeStatus.INACTIVE -> MaterialTheme.colorScheme.surfaceVariant
                                EmployeeStatus.SUSPENDED -> MaterialTheme.colorScheme.errorContainer
                            }
                        )
                    )

                    if (employee.department != null) {
                        AssistChip(
                            onClick = {},
                            label = { Text(employee.department, style = MaterialTheme.typography.labelSmall) }
                        )
                    }
                }
            }

            if (isDeleting) {
                CircularProgressIndicator(modifier = Modifier.size(24.dp))
            } else if (!employee.isSystemAccount) {
                IconButton(onClick = { showDeleteDialog = true }) {
                    Icon(Icons.Default.Delete, "Delete", tint = MaterialTheme.colorScheme.error)
                }
            }
        }
    }

    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete Employee") },
            text = { Text("Are you sure you want to delete ${employee.fullName}? This action cannot be undone.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        onDelete()
                        showDeleteDialog = false
                    }
                ) {
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
