package com.liyaqa.liyaqa_internal_app.features.tenant.presentation.detail

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
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.model.Tenant
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.model.TenantStatus

/**
 * Tenant Detail Screen - Displays comprehensive tenant information.
 * Shows subscription details, contact info, settings, and current status.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TenantDetailScreen(
    viewModel: TenantDetailViewModel,
    onNavigateBack: () -> Unit,
    onNavigateToEdit: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(uiState.tenant?.name ?: "Tenant Details") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.onEvent(TenantDetailUiEvent.Refresh) }) {
                        Icon(Icons.Default.Refresh, "Refresh")
                    }
                    uiState.tenant?.let { tenant ->
                        IconButton(onClick = { onNavigateToEdit(tenant.id) }) {
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
                        onRetry = { viewModel.onEvent(TenantDetailUiEvent.Refresh) },
                        modifier = Modifier.align(Alignment.Center)
                    )
                }

                uiState.tenant != null -> {
                    TenantDetailContent(
                        tenant = uiState.tenant!!,
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
private fun TenantDetailContent(
    tenant: Tenant,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Status Card
        StatusCard(tenant = tenant)

        // Basic Information
        InfoSection(
            title = "Basic Information",
            icon = Icons.Default.Info
        ) {
            InfoRow(label = "Name", value = tenant.name)
            InfoRow(label = "Slug", value = tenant.slug)
            InfoRow(label = "Contact Email", value = tenant.contactEmail)
            tenant.contactPhone?.let {
                InfoRow(label = "Contact Phone", value = it)
            }
        }

        // Address Information
        if (tenant.address != null || tenant.city != null) {
            InfoSection(
                title = "Address",
                icon = Icons.Default.Place
            ) {
                tenant.address?.let { InfoRow(label = "Street", value = it) }
                tenant.city?.let { InfoRow(label = "City", value = it) }
                tenant.state?.let { InfoRow(label = "State", value = it) }
                InfoRow(label = "Country", value = tenant.country)
                tenant.postalCode?.let { InfoRow(label = "Postal Code", value = it) }
            }
        }

        // Subscription Information
        InfoSection(
            title = "Subscription",
            icon = Icons.Default.Star
        ) {
            InfoRow(label = "Plan Tier", value = tenant.subscriptionTier.name)
            InfoRow(label = "Status", value = tenant.subscriptionStatus.name)
            InfoRow(label = "Start Date", value = tenant.subscriptionStartDate)
            tenant.subscriptionEndDate?.let {
                InfoRow(label = "End Date", value = it)
            }
        }

        // Limits & Quotas
        InfoSection(
            title = "Limits & Quotas",
            icon = Icons.Default.DateRange
        ) {
            InfoRow(label = "Max Facilities", value = tenant.maxFacilities.toString())
            InfoRow(label = "Max Employees", value = tenant.maxEmployees.toString())
            InfoRow(label = "Max Members", value = tenant.maxMembers.toString())
        }

        // Features
        if (tenant.features.isNotEmpty()) {
            InfoSection(
                title = "Features",
                icon = Icons.Default.Check
            ) {
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    tenant.features.forEach { feature ->
                        AssistChip(
                            onClick = {},
                            label = { Text(feature) },
                            leadingIcon = {
                                Icon(
                                    Icons.Default.Check,
                                    contentDescription = null,
                                    modifier = Modifier.size(18.dp)
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
            icon = Icons.Default.LocationOn
        ) {
            InfoRow(label = "Timezone", value = tenant.timezone)
            InfoRow(label = "Locale", value = tenant.locale)
            InfoRow(label = "Currency", value = tenant.currency)
        }

        // Timestamps
        InfoSection(
            title = "Timestamps",
            icon = Icons.Default.DateRange
        ) {
            InfoRow(label = "Created", value = tenant.createdAt)
            InfoRow(label = "Last Updated", value = tenant.updatedAt)
        }
    }
}

@Composable
private fun StatusCard(tenant: Tenant) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = when (tenant.status) {
                TenantStatus.ACTIVE -> MaterialTheme.colorScheme.primaryContainer
                TenantStatus.SUSPENDED -> MaterialTheme.colorScheme.errorContainer
                TenantStatus.TRIAL -> MaterialTheme.colorScheme.tertiaryContainer
                else -> MaterialTheme.colorScheme.surfaceVariant
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
                    tenant.status.name,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
                )
            }
            Icon(
                when (tenant.status) {
                    TenantStatus.ACTIVE -> Icons.Default.Check
                    TenantStatus.SUSPENDED -> Icons.Default.Warning
                    TenantStatus.TRIAL -> Icons.Default.Info
                    else -> Icons.Default.Info
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
