package com.liyaqa.liyaqa_internal_app.features.tenant.presentation.create

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
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.model.SubscriptionTier

/**
 * Tenant Form Screen - Create or edit tenant information.
 * Provides comprehensive form with validation for tenant management.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TenantFormScreen(
    viewModel: TenantFormViewModel,
    onNavigateBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()
    val snackbarHostState = remember { SnackbarHostState() }

    // Handle success state
    LaunchedEffect(uiState.success) {
        if (uiState.success) {
            snackbarHostState.showSnackbar(
                message = if (viewModel.isEditMode) "Tenant updated successfully" else "Tenant created successfully",
                duration = SnackbarDuration.Short
            )
            onNavigateBack()
        }
    }

    // Handle error state
    LaunchedEffect(uiState.error) {
        uiState.error?.let { error ->
            snackbarHostState.showSnackbar(
                message = error,
                duration = SnackbarDuration.Long
            )
            viewModel.onEvent(TenantFormUiEvent.ClearError)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(if (viewModel.isEditMode) "Edit Tenant" else "Create Tenant")
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        modifier = modifier
    ) { paddingValues ->
        Box(modifier = Modifier.fillMaxSize().padding(paddingValues)) {
            if (uiState.isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center)
                )
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(scrollState)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(24.dp)
                ) {
                    // Basic Information Section
                    FormSection(
                        title = "Basic Information",
                        icon = Icons.Default.Info
                    ) {
                        OutlinedTextField(
                            value = uiState.name,
                            onValueChange = { viewModel.onEvent(TenantFormUiEvent.NameChanged(it)) },
                            label = { Text("Name") },
                            placeholder = { Text("e.g., Acme Sports Center") },
                            isError = uiState.nameError != null,
                            supportingText = uiState.nameError?.let { { Text(it) } },
                            enabled = !uiState.isSaving,
                            modifier = Modifier.fillMaxWidth()
                        )

                        OutlinedTextField(
                            value = uiState.contactEmail,
                            onValueChange = { viewModel.onEvent(TenantFormUiEvent.ContactEmailChanged(it)) },
                            label = { Text("Contact Email") },
                            placeholder = { Text("contact@example.com") },
                            isError = uiState.contactEmailError != null,
                            supportingText = uiState.contactEmailError?.let { { Text(it) } },
                            enabled = !uiState.isSaving,
                            modifier = Modifier.fillMaxWidth()
                        )

                        OutlinedTextField(
                            value = uiState.contactPhone,
                            onValueChange = { viewModel.onEvent(TenantFormUiEvent.ContactPhoneChanged(it)) },
                            label = { Text("Contact Phone (Optional)") },
                            placeholder = { Text("+1 (555) 123-4567") },
                            enabled = !uiState.isSaving,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }

                    // Address Section
                    FormSection(
                        title = "Address",
                        icon = Icons.Default.Place
                    ) {
                        OutlinedTextField(
                            value = uiState.address,
                            onValueChange = { viewModel.onEvent(TenantFormUiEvent.AddressChanged(it)) },
                            label = { Text("Street Address (Optional)") },
                            placeholder = { Text("123 Main Street") },
                            enabled = !uiState.isSaving,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            OutlinedTextField(
                                value = uiState.city,
                                onValueChange = { viewModel.onEvent(TenantFormUiEvent.CityChanged(it)) },
                                label = { Text("City (Optional)") },
                                placeholder = { Text("New York") },
                                enabled = !uiState.isSaving,
                                modifier = Modifier.weight(1f)
                            )

                            OutlinedTextField(
                                value = uiState.state,
                                onValueChange = { viewModel.onEvent(TenantFormUiEvent.StateChanged(it)) },
                                label = { Text("State (Optional)") },
                                placeholder = { Text("NY") },
                                enabled = !uiState.isSaving,
                                modifier = Modifier.weight(1f)
                            )
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            OutlinedTextField(
                                value = uiState.country,
                                onValueChange = { viewModel.onEvent(TenantFormUiEvent.CountryChanged(it)) },
                                label = { Text("Country") },
                                placeholder = { Text("United States") },
                                isError = uiState.countryError != null,
                                supportingText = uiState.countryError?.let { { Text(it) } },
                                enabled = !uiState.isSaving,
                                modifier = Modifier.weight(1f)
                            )

                            OutlinedTextField(
                                value = uiState.postalCode,
                                onValueChange = { viewModel.onEvent(TenantFormUiEvent.PostalCodeChanged(it)) },
                                label = { Text("Postal Code (Optional)") },
                                placeholder = { Text("10001") },
                                enabled = !uiState.isSaving,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    // Subscription Section
                    FormSection(
                        title = "Subscription",
                        icon = Icons.Default.Star
                    ) {
                        SubscriptionTierDropdown(
                            selectedTier = uiState.subscriptionTier,
                            onTierSelected = { viewModel.onEvent(TenantFormUiEvent.SubscriptionTierChanged(it)) },
                            enabled = !uiState.isSaving && !viewModel.isEditMode
                        )

                        if (viewModel.isEditMode) {
                            Text(
                                "Subscription tier cannot be changed in edit mode",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    // Regional Settings Section
                    FormSection(
                        title = "Regional Settings",
                        icon = Icons.Default.LocationOn
                    ) {
                        OutlinedTextField(
                            value = uiState.timezone,
                            onValueChange = { viewModel.onEvent(TenantFormUiEvent.TimezoneChanged(it)) },
                            label = { Text("Timezone") },
                            placeholder = { Text("UTC") },
                            enabled = !uiState.isSaving,
                            modifier = Modifier.fillMaxWidth()
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            OutlinedTextField(
                                value = uiState.locale,
                                onValueChange = { viewModel.onEvent(TenantFormUiEvent.LocaleChanged(it)) },
                                label = { Text("Locale") },
                                placeholder = { Text("en_US") },
                                enabled = !uiState.isSaving,
                                modifier = Modifier.weight(1f)
                            )

                            OutlinedTextField(
                                value = uiState.currency,
                                onValueChange = { viewModel.onEvent(TenantFormUiEvent.CurrencyChanged(it)) },
                                label = { Text("Currency") },
                                placeholder = { Text("USD") },
                                enabled = !uiState.isSaving,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    // Submit Button
                    Button(
                        onClick = { viewModel.onEvent(TenantFormUiEvent.Submit) },
                        enabled = !uiState.isSaving,
                        modifier = Modifier.fillMaxWidth().height(56.dp)
                    ) {
                        if (uiState.isSaving) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(24.dp),
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                            Spacer(Modifier.width(8.dp))
                        }
                        Text(
                            if (uiState.isSaving) {
                                if (viewModel.isEditMode) "Updating..." else "Creating..."
                            } else {
                                if (viewModel.isEditMode) "Update Tenant" else "Create Tenant"
                            }
                        )
                    }

                    // Bottom padding for better scrolling
                    Spacer(Modifier.height(16.dp))
                }
            }
        }
    }
}

/**
 * Form section with title and icon header
 */
@Composable
private fun FormSection(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Section Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.padding(bottom = 8.dp)
            ) {
                Icon(
                    icon,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
                Text(
                    title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }

            // Section Content
            content()
        }
    }
}

/**
 * Dropdown menu for selecting subscription tier
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SubscriptionTierDropdown(
    selectedTier: SubscriptionTier,
    onTierSelected: (SubscriptionTier) -> Unit,
    enabled: Boolean,
    modifier: Modifier = Modifier
) {
    var expanded by remember { mutableStateOf(false) }

    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { if (enabled) expanded = it },
        modifier = modifier
    ) {
        OutlinedTextField(
            value = selectedTier.name,
            onValueChange = {},
            readOnly = true,
            label = { Text("Subscription Tier") },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(),
            enabled = enabled,
            modifier = Modifier
                .fillMaxWidth()
                .menuAnchor()
        )

        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            SubscriptionTier.entries.forEach { tier ->
                DropdownMenuItem(
                    text = {
                        Column {
                            Text(
                                tier.name,
                                style = MaterialTheme.typography.bodyLarge
                            )
                            Text(
                                getTierDescription(tier),
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    },
                    onClick = {
                        onTierSelected(tier)
                        expanded = false
                    },
                    leadingIcon = {
                        Icon(
                            getTierIcon(tier),
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }
                )
            }
        }
    }
}

/**
 * Get description for subscription tier
 */
private fun getTierDescription(tier: SubscriptionTier): String {
    return when (tier) {
        SubscriptionTier.FREE -> "Basic features for small operations"
        SubscriptionTier.BASIC -> "Enhanced features for growing facilities"
        SubscriptionTier.PREMIUM -> "Advanced features for established centers"
        SubscriptionTier.ENTERPRISE -> "Full-featured plan for large organizations"
    }
}

/**
 * Get icon for subscription tier
 */
private fun getTierIcon(tier: SubscriptionTier): androidx.compose.ui.graphics.vector.ImageVector {
    return when (tier) {
        SubscriptionTier.FREE -> Icons.Default.Star
        SubscriptionTier.BASIC -> Icons.Default.Star
        SubscriptionTier.PREMIUM -> Icons.Default.Star
        SubscriptionTier.ENTERPRISE -> Icons.Default.Star
    }
}
