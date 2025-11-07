package com.liyaqa.liyaqa_internal_app.features.tenant.presentation.list

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
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.model.Tenant
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.model.TenantStatus

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TenantListScreen(
    viewModel: TenantListViewModel,
    onNavigateToDetail: (String) -> Unit,
    onNavigateToCreate: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val listState = rememberLazyListState()

    LaunchedEffect(listState) {
        snapshotFlow { listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index }
            .collect { lastIndex ->
                if (lastIndex != null && lastIndex >= uiState.tenants.size - 3 &&
                    !uiState.isLoadingMore && !uiState.isLastPage
                ) {
                    viewModel.onEvent(TenantListUiEvent.LoadMore)
                }
            }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Tenants") },
                actions = {
                    IconButton(onClick = { viewModel.onEvent(TenantListUiEvent.Refresh) }) {
                        Icon(Icons.Default.Refresh, "Refresh")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = onNavigateToCreate) {
                Icon(Icons.Default.Add, "Add Tenant")
            }
        },
        modifier = modifier
    ) { paddingValues ->
        Column(modifier = Modifier.fillMaxSize().padding(paddingValues)) {
            // Search bar
            OutlinedTextField(
                value = uiState.searchQuery,
                onValueChange = { viewModel.onEvent(TenantListUiEvent.SearchChanged(it)) },
                placeholder = { Text("Search tenants...") },
                leadingIcon = { Icon(Icons.Default.Search, "Search") },
                modifier = Modifier.fillMaxWidth().padding(16.dp)
            )

            if (!uiState.isLoading) {
                Text(
                    "${uiState.totalElements} tenants",
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )
            }

            when {
                uiState.isLoading && uiState.tenants.isEmpty() -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }

                uiState.tenants.isEmpty() -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("No tenants found")
                    }
                }

                else -> {
                    LazyColumn(
                        state = listState,
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(uiState.tenants, key = { it.id }) { tenant ->
                            TenantCard(
                                tenant = tenant,
                                isDeleting = uiState.deletingTenantId == tenant.id,
                                onClick = { onNavigateToDetail(tenant.id) },
                                onDelete = { viewModel.onEvent(TenantListUiEvent.DeleteTenant(tenant.id)) }
                            )
                        }

                        if (uiState.isLoadingMore) {
                            item {
                                Box(Modifier.fillMaxWidth().padding(16.dp), contentAlignment = Alignment.Center) {
                                    CircularProgressIndicator()
                                }
                            }
                        }
                    }
                }
            }
        }

        if (uiState.error != null) {
            Snackbar(
                action = {
                    TextButton(onClick = { viewModel.onEvent(TenantListUiEvent.ClearError) }) {
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
private fun TenantCard(
    tenant: Tenant,
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
                Text(tenant.name, style = MaterialTheme.typography.titleMedium)
                Text(tenant.contactEmail, style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.height(4.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AssistChip(
                        onClick = {},
                        label = { Text(tenant.status.name, style = MaterialTheme.typography.labelSmall) },
                        colors = AssistChipDefaults.assistChipColors(
                            containerColor = when (tenant.status) {
                                TenantStatus.ACTIVE -> MaterialTheme.colorScheme.primaryContainer
                                else -> MaterialTheme.colorScheme.surfaceVariant
                            }
                        )
                    )
                    AssistChip(
                        onClick = {},
                        label = { Text(tenant.subscriptionTier.name, style = MaterialTheme.typography.labelSmall) }
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
            title = { Text("Delete Tenant") },
            text = { Text("Delete ${tenant.name}? This action cannot be undone.") },
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
