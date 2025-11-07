package com.liyaqa.liyaqa_internal_app.features.employee.presentation.detail

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.liyaqa.liyaqa_internal_app.features.employee.domain.model.Employee
import com.liyaqa.liyaqa_internal_app.features.employee.domain.model.EmployeeStatus

/**
 * Employee Detail Screen - Displays comprehensive employee information.
 * Shows employee details, groups, permissions, status, and account info.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EmployeeDetailScreen(
    viewModel: EmployeeDetailViewModel,
    onNavigateBack: () -> Unit,
    onNavigateToEdit: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(uiState.employee?.fullName ?: "Employee Details") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.onEvent(EmployeeDetailUiEvent.Refresh) }) {
                        Icon(Icons.Default.Refresh, "Refresh")
                    }
                    uiState.employee?.let { employee ->
                        IconButton(onClick = { onNavigateToEdit(employee.id) }) {
                            Icon(Icons.Default.Edit, "Edit")
                        }
                    }
                }
            )
        },
        modifier = modifier
    ) { paddingValues ->
        Box(modifier = Modifier.fillMaxSize().padding(paddingValues)) {
            when {
                uiState.isLoading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center)
                    )
                }

                uiState.error != null -> {
                    ErrorView(
                        error = uiState.error!!,
                        onRetry = { viewModel.onEvent(EmployeeDetailUiEvent.Refresh) },
                        modifier = Modifier.align(Alignment.Center)
                    )
                }

                uiState.employee != null -> {
                    EmployeeDetailContent(
                        employee = uiState.employee!!,
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(scrollState)
                            .padding(16.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun EmployeeDetailContent(
    employee: Employee,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Status Card
        StatusCard(employee = employee)

        // Basic Information
        InfoSection(
            title = "Basic Information",
            icon = Icons.Default.Person
        ) {
            InfoRow(label = "Full Name", value = employee.fullName)
            InfoRow(label = "Email", value = employee.email)
            InfoRow(label = "Employee Number", value = employee.employeeNumber)
            employee.phoneNumber?.let {
                InfoRow(label = "Phone", value = it)
            }
        }

        // Employment Details
        InfoSection(
            title = "Employment Details",
            icon = Icons.Default.Work
        ) {
            employee.department?.let {
                InfoRow(label = "Department", value = it)
            }
            employee.jobTitle?.let {
                InfoRow(label = "Job Title", value = it)
            }
            employee.hireDate?.let {
                InfoRow(label = "Hire Date", value = it)
            }
            InfoRow(
                label = "System Account",
                value = if (employee.isSystemAccount) "Yes" else "No"
            )
        }

        // Account Status
        InfoSection(
            title = "Account Status",
            icon = Icons.Default.Security
        ) {
            InfoRow(label = "Status", value = employee.status.name)
            InfoRow(
                label = "Account Locked",
                value = if (employee.isLocked) "Yes" else "No"
            )
            employee.lockedUntil?.let {
                InfoRow(label = "Locked Until", value = it)
            }
            InfoRow(
                label = "Failed Login Attempts",
                value = employee.failedLoginAttempts.toString()
            )
            employee.lastLoginAt?.let {
                InfoRow(label = "Last Login", value = it)
            }
        }

        // Groups
        if (employee.groups.isNotEmpty()) {
            InfoSection(
                title = "Groups",
                icon = Icons.Default.Group
            ) {
                Column(
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    employee.groups.forEach { group ->
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.secondaryContainer
                            )
                        ) {
                            Column(
                                modifier = Modifier.fillMaxWidth().padding(12.dp)
                            ) {
                                Text(
                                    group.name,
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold
                                )
                                group.description?.let {
                                    Text(
                                        it,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Permissions
        if (employee.permissions.isNotEmpty()) {
            InfoSection(
                title = "Permissions (${employee.permissions.size})",
                icon = Icons.Default.Shield
            ) {
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    employee.permissions.forEach { permission ->
                        AssistChip(
                            onClick = {},
                            label = {
                                Text(
                                    permission.name.replace("_", " "),
                                    style = MaterialTheme.typography.labelSmall
                                )
                            },
                            leadingIcon = {
                                Icon(
                                    Icons.Default.Check,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        )
                    }
                }
            }
        }

        // Regional Settings
        InfoSection(
            title = "Regional Settings",
            icon = Icons.Default.Language
        ) {
            InfoRow(label = "Locale", value = employee.locale)
            InfoRow(label = "Timezone", value = employee.timezone)
        }

        // Timestamps
        InfoSection(
            title = "Timestamps",
            icon = Icons.Default.DateRange
        ) {
            InfoRow(label = "Created", value = employee.createdAt)
            InfoRow(label = "Last Updated", value = employee.updatedAt)
        }
    }
}

@Composable
private fun StatusCard(employee: Employee) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = when (employee.status) {
                EmployeeStatus.ACTIVE -> MaterialTheme.colorScheme.primaryContainer
                EmployeeStatus.INACTIVE -> MaterialTheme.colorScheme.surfaceVariant
                EmployeeStatus.SUSPENDED -> MaterialTheme.colorScheme.errorContainer
            }
        ),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(
                    "Status",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    employee.status.name,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
                )
            }
            Icon(
                when (employee.status) {
                    EmployeeStatus.ACTIVE -> Icons.Default.Check
                    EmployeeStatus.INACTIVE -> Icons.Default.Close
                    EmployeeStatus.SUSPENDED -> Icons.Default.Warning
                },
                contentDescription = null,
                modifier = Modifier.size(40.dp)
            )
        }
    }
}

@Composable
private fun InfoSection(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(modifier = modifier.fillMaxWidth()) {
        Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.padding(bottom = 12.dp)
            ) {
                Icon(
                    icon,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
                Text(
                    title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
            content()
        }
    }
}

@Composable
private fun InfoRow(
    label: String,
    value: String,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxWidth().padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(0.4f)
        )
        Text(
            value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.weight(0.6f)
        )
    }
}

@Composable
private fun ErrorView(
    error: String,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Icon(
            Icons.Default.Warning,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.error
        )
        Text(
            "Error",
            style = MaterialTheme.typography.headlineSmall
        )
        Text(
            error,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Button(onClick = onRetry) {
            Icon(Icons.Default.Refresh, "Retry")
            Spacer(Modifier.width(8.dp))
            Text("Retry")
        }
    }
}
