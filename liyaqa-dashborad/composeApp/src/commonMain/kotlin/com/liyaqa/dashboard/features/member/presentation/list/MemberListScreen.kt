package com.liyaqa.dashboard.features.member.presentation.list

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
import com.liyaqa.dashboard.features.member.domain.model.Member
import com.liyaqa.dashboard.features.member.domain.model.MemberStatus

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MemberListScreen(
    viewModel: MemberListViewModel,
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
            viewModel.onEvent(MemberListUiEvent.ClearError)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Members") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.onEvent(MemberListUiEvent.Refresh) }) {
                        Icon(Icons.Default.Refresh, "Refresh")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = onNavigateToCreate) {
                Icon(Icons.Default.Add, "Add Member")
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
                    viewModel.onEvent(MemberListUiEvent.SearchQueryChanged(it))
                },
                onStatusFilterChanged = {
                    viewModel.onEvent(MemberListUiEvent.StatusFilterChanged(it))
                }
            )

            // Member List
            if (state.isLoading && state.members.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else if (state.members.isEmpty()) {
                EmptyState()
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(state.members) { member ->
                        MemberCard(
                            member = member,
                            onClick = { onNavigateToDetail(member.id) },
                            onDelete = {
                                viewModel.onEvent(MemberListUiEvent.ShowDeleteDialog(member))
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
                                viewModel.onEvent(MemberListUiEvent.LoadMore)
                            }
                        }
                    }
                }
            }
        }
    }

    // Delete Confirmation Dialog
    if (state.showDeleteDialog && state.memberToDelete != null) {
        AlertDialog(
            onDismissRequest = {
                viewModel.onEvent(MemberListUiEvent.HideDeleteDialog)
            },
            title = { Text("Delete Member") },
            text = {
                Text("Are you sure you want to delete ${state.memberToDelete!!.fullName}?")
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.onEvent(MemberListUiEvent.ConfirmDelete)
                    }
                ) {
                    Text("Delete", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        viewModel.onEvent(MemberListUiEvent.HideDeleteDialog)
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
    selectedStatus: MemberStatus?,
    onSearchQueryChanged: (String) -> Unit,
    onStatusFilterChanged: (MemberStatus?) -> Unit
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
            placeholder = { Text("Search members...") },
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
            MemberStatus.entries.forEach { status ->
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
private fun MemberCard(
    member: Member,
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
                    text = member.fullName,
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = member.email,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.padding(top = 4.dp)
                ) {
                    AssistChip(
                        onClick = {},
                        label = { Text(member.membershipNumber) },
                        leadingIcon = { Icon(Icons.Default.Badge, null, modifier = Modifier.size(16.dp)) }
                    )
                    AssistChip(
                        onClick = {},
                        label = { Text(member.status.name) },
                        colors = AssistChipDefaults.assistChipColors(
                            containerColor = when (member.status) {
                                MemberStatus.ACTIVE -> MaterialTheme.colorScheme.primaryContainer
                                MemberStatus.INACTIVE -> MaterialTheme.colorScheme.secondaryContainer
                                MemberStatus.SUSPENDED -> MaterialTheme.colorScheme.errorContainer
                                MemberStatus.EXPIRED -> MaterialTheme.colorScheme.errorContainer
                            }
                        )
                    )
                    if (member.currentMembership != null) {
                        AssistChip(
                            onClick = {},
                            label = { Text(member.currentMembership.planName) },
                            leadingIcon = { Icon(Icons.Default.CardMembership, null, modifier = Modifier.size(16.dp)) }
                        )
                    }
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
                "No members found",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                "Register your first member to get started",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
