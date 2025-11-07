package com.liyaqa.liyaqa_internal_app.features.audit.presentation.list

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.liyaqa.liyaqa_internal_app.features.audit.domain.model.AuditLog

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuditLogListScreen(
    viewModel: AuditLogListViewModel,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Audit Logs") },
                actions = {
                    IconButton(onClick = { viewModel.onEvent(AuditLogListUiEvent.Refresh) }) {
                        Icon(Icons.Default.Refresh, "Refresh")
                    }
                }
            )
        },
        modifier = modifier
    ) { paddingValues ->
        Column(Modifier.fillMaxSize().padding(paddingValues)) {
            if (!uiState.isLoading) {
                Text(
                    "${uiState.totalElements} audit logs",
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(16.dp)
                )
            }

            when {
                uiState.isLoading && uiState.auditLogs.isEmpty() -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
                uiState.auditLogs.isEmpty() -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("No audit logs found")
                    }
                }
                else -> {
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(uiState.auditLogs, key = { it.id }) { log ->
                            AuditLogCard(log)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AuditLogCard(log: AuditLog, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(Modifier.fillMaxWidth().padding(16.dp)) {
            Text(log.action, style = MaterialTheme.typography.titleMedium)
            Text("${log.entityType} • ${log.employeeName}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
            if (log.entityId != null) {
                Text("Entity ID: ${log.entityId}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Text(log.timestamp, style = MaterialTheme.typography.labelSmall)
        }
    }
}
