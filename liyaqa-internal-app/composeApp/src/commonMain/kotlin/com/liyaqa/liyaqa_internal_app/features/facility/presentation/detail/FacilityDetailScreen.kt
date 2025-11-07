package com.liyaqa.liyaqa_internal_app.features.facility.presentation.detail

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
import com.liyaqa.liyaqa_internal_app.features.facility.domain.model.Facility
import com.liyaqa.liyaqa_internal_app.features.facility.domain.model.FacilityStatus

/**
 * Facility Detail Screen - Displays comprehensive facility information.
 * Shows facility type, status, contact info, branches, settings, and features.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FacilityDetailScreen(
    viewModel: FacilityDetailViewModel,
    onNavigateBack: () -> Unit,
    onNavigateToEdit: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(uiState.facility?.name ?: "Facility Details") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.onEvent(FacilityDetailUiEvent.Refresh) }) {
                        Icon(Icons.Default.Refresh, "Refresh")
                    }
                    uiState.facility?.let { facility ->
                        IconButton(onClick = { onNavigateToEdit(facility.id) }) {
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
                        onRetry = { viewModel.onEvent(FacilityDetailUiEvent.Refresh) },
                        modifier = Modifier.align(Alignment.Center)
                    )
                }

                uiState.facility != null -> {
                    FacilityDetailContent(
                        facility = uiState.facility!!,
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
private fun FacilityDetailContent(
    facility: Facility,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Status Card
        StatusCard(facility = facility)

        // Basic Information
        InfoSection(
            title = "Basic Information",
            icon = Icons.Default.Info
        ) {
            InfoRow(label = "Name", value = facility.name)
            InfoRow(label = "Slug", value = facility.slug)
            InfoRow(label = "Tenant ID", value = facility.tenantId)
            InfoRow(label = "Type", value = facility.facilityType.name)
            facility.description?.let {
                InfoRow(label = "Description", value = it)
            }
        }

        // Contact Information
        InfoSection(
            title = "Contact Information",
            icon = Icons.Default.Phone
        ) {
            InfoRow(label = "Email", value = facility.contactEmail)
            facility.contactPhone?.let {
                InfoRow(label = "Phone", value = it)
            }
            facility.website?.let {
                InfoRow(label = "Website", value = it)
            }
        }

        // Images
        if (facility.logoUrl != null || facility.coverImageUrl != null) {
            InfoSection(
                title = "Images",
                icon = Icons.Default.Image
            ) {
                facility.logoUrl?.let {
                    InfoRow(label = "Logo URL", value = it)
                }
                facility.coverImageUrl?.let {
                    InfoRow(label = "Cover Image URL", value = it)
                }
            }
        }

        // Regional Settings
        InfoSection(
            title = "Regional Settings",
            icon = Icons.Default.LocationOn
        ) {
            InfoRow(label = "Timezone", value = facility.timezone)
            InfoRow(label = "Currency", value = facility.currency)
        }

        // Features
        if (facility.features.isNotEmpty()) {
            InfoSection(
                title = "Features",
                icon = Icons.Default.Check
            ) {
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    facility.features.forEach { feature ->
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

        // Settings
        if (facility.settings.isNotEmpty()) {
            InfoSection(
                title = "Settings",
                icon = Icons.Default.Settings
            ) {
                facility.settings.forEach { (key, value) ->
                    InfoRow(label = key, value = value)
                }
            }
        }

        // Timestamps
        InfoSection(
            title = "Timestamps",
            icon = Icons.Default.DateRange
        ) {
            InfoRow(label = "Created", value = facility.createdAt)
            InfoRow(label = "Last Updated", value = facility.updatedAt)
        }
    }
}

@Composable
private fun StatusCard(facility: Facility) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = when (facility.status) {
                FacilityStatus.ACTIVE -> MaterialTheme.colorScheme.primaryContainer
                FacilityStatus.INACTIVE -> MaterialTheme.colorScheme.surfaceVariant
                FacilityStatus.SUSPENDED -> MaterialTheme.colorScheme.errorContainer
                FacilityStatus.MAINTENANCE -> MaterialTheme.colorScheme.tertiaryContainer
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
                    facility.status.name,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
                )
            }
            Icon(
                when (facility.status) {
                    FacilityStatus.ACTIVE -> Icons.Default.Check
                    FacilityStatus.INACTIVE -> Icons.Default.Close
                    FacilityStatus.SUSPENDED -> Icons.Default.Warning
                    FacilityStatus.MAINTENANCE -> Icons.Default.Build
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
