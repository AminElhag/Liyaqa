package com.liyaqa.liyaqa_internal_app.features.facility.presentation.create

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.liyaqa.liyaqa_internal_app.features.facility.domain.model.FacilityType

/**
 * Facility Form Screen - Create or Edit facility.
 * Supports both create and edit modes with comprehensive validation.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FacilityFormScreen(
    viewModel: FacilityFormViewModel,
    onNavigateBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()

    // Navigate back on successful save
    LaunchedEffect(uiState.success) {
        if (uiState.success) {
            onNavigateBack()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(if (viewModel.isEditMode) "Edit Facility" else "Create Facility")
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                }
            )
        },
        modifier = modifier
    ) { paddingValues ->
        Box(modifier = Modifier.fillMaxSize().padding(paddingValues)) {
            if (uiState.isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center)
                )
            } else {
                FacilityFormContent(
                    uiState = uiState,
                    isEditMode = viewModel.isEditMode,
                    onEvent = viewModel::onEvent,
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(scrollState)
                        .padding(16.dp)
                )
            }

            if (uiState.error != null) {
                Snackbar(
                    action = {
                        TextButton(onClick = { viewModel.onEvent(FacilityFormUiEvent.ClearError) }) {
                            Text("Dismiss")
                        }
                    },
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(16.dp)
                ) {
                    Text(uiState.error!!)
                }
            }
        }
    }
}

@Composable
private fun FacilityFormContent(
    uiState: FacilityFormUiState,
    isEditMode: Boolean,
    onEvent: (FacilityFormUiEvent) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Basic Information Section
        SectionHeader(title = "Basic Information")

        if (!isEditMode) {
            OutlinedTextField(
                value = uiState.tenantId,
                onValueChange = { onEvent(FacilityFormUiEvent.TenantIdChanged(it)) },
                label = { Text("Tenant ID") },
                isError = uiState.tenantIdError != null,
                supportingText = {
                    if (uiState.tenantIdError != null) {
                        Text(uiState.tenantIdError)
                    }
                },
                enabled = !uiState.isSaving,
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
        }

        OutlinedTextField(
            value = uiState.name,
            onValueChange = { onEvent(FacilityFormUiEvent.NameChanged(it)) },
            label = { Text("Facility Name *") },
            isError = uiState.nameError != null,
            supportingText = {
                if (uiState.nameError != null) {
                    Text(uiState.nameError)
                }
            },
            enabled = !uiState.isSaving,
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        // Facility Type Dropdown
        var expandedFacilityType by remember { mutableStateOf(false) }
        ExposedDropdownMenuBox(
            expanded = expandedFacilityType,
            onExpandedChange = { expandedFacilityType = !expandedFacilityType && !uiState.isSaving }
        ) {
            OutlinedTextField(
                value = uiState.facilityType.name.replace("_", " "),
                onValueChange = {},
                readOnly = true,
                label = { Text("Facility Type *") },
                isError = uiState.facilityTypeError != null,
                supportingText = {
                    if (uiState.facilityTypeError != null) {
                        Text(uiState.facilityTypeError)
                    }
                },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedFacilityType) },
                enabled = !uiState.isSaving && !isEditMode,
                modifier = Modifier
                    .fillMaxWidth()
                    .menuAnchor()
            )
            ExposedDropdownMenu(
                expanded = expandedFacilityType,
                onDismissRequest = { expandedFacilityType = false }
            ) {
                FacilityType.entries.forEach { type ->
                    DropdownMenuItem(
                        text = { Text(type.name.replace("_", " ")) },
                        onClick = {
                            onEvent(FacilityFormUiEvent.FacilityTypeChanged(type))
                            expandedFacilityType = false
                        }
                    )
                }
            }
        }

        OutlinedTextField(
            value = uiState.description,
            onValueChange = { onEvent(FacilityFormUiEvent.DescriptionChanged(it)) },
            label = { Text("Description") },
            enabled = !uiState.isSaving,
            minLines = 3,
            maxLines = 5,
            modifier = Modifier.fillMaxWidth()
        )

        // Contact Information Section
        SectionHeader(title = "Contact Information")

        OutlinedTextField(
            value = uiState.contactEmail,
            onValueChange = { onEvent(FacilityFormUiEvent.ContactEmailChanged(it)) },
            label = { Text("Contact Email *") },
            isError = uiState.contactEmailError != null,
            supportingText = {
                if (uiState.contactEmailError != null) {
                    Text(uiState.contactEmailError)
                }
            },
            enabled = !uiState.isSaving,
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        OutlinedTextField(
            value = uiState.contactPhone,
            onValueChange = { onEvent(FacilityFormUiEvent.ContactPhoneChanged(it)) },
            label = { Text("Contact Phone") },
            enabled = !uiState.isSaving,
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        OutlinedTextField(
            value = uiState.website,
            onValueChange = { onEvent(FacilityFormUiEvent.WebsiteChanged(it)) },
            label = { Text("Website") },
            enabled = !uiState.isSaving,
            singleLine = true,
            placeholder = { Text("https://example.com") },
            modifier = Modifier.fillMaxWidth()
        )

        // Regional Settings Section
        SectionHeader(title = "Regional Settings")

        OutlinedTextField(
            value = uiState.timezone,
            onValueChange = { onEvent(FacilityFormUiEvent.TimezoneChanged(it)) },
            label = { Text("Timezone") },
            enabled = !uiState.isSaving && !isEditMode,
            singleLine = true,
            placeholder = { Text("UTC") },
            modifier = Modifier.fillMaxWidth()
        )

        OutlinedTextField(
            value = uiState.currency,
            onValueChange = { onEvent(FacilityFormUiEvent.CurrencyChanged(it)) },
            label = { Text("Currency") },
            enabled = !uiState.isSaving && !isEditMode,
            singleLine = true,
            placeholder = { Text("USD") },
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Submit Button
        Button(
            onClick = { onEvent(FacilityFormUiEvent.Submit) },
            enabled = !uiState.isSaving,
            modifier = Modifier.fillMaxWidth()
        ) {
            if (uiState.isSaving) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    color = MaterialTheme.colorScheme.onPrimary
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("Saving...")
            } else {
                Text(if (isEditMode) "Update Facility" else "Create Facility")
            }
        }

        Text(
            "* Required fields",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(top = 8.dp)
        )
    }
}

@Composable
private fun SectionHeader(
    title: String,
    modifier: Modifier = Modifier
) {
    Text(
        text = title,
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.Bold,
        color = MaterialTheme.colorScheme.primary,
        modifier = modifier.padding(top = 8.dp, bottom = 4.dp)
    )
}
