package com.liyaqa.liyaqa_internal_app.features.employee.presentation.create

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import com.liyaqa.liyaqa_internal_app.features.employee.domain.model.EmployeeGroup

/**
 * Employee Form Screen - Create/Edit employee with Material 3 design.
 * Follows TenantFormScreen pattern.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EmployeeFormScreen(
    viewModel: EmployeeFormViewModel,
    onNavigateBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()

    // Navigate back on success
    LaunchedEffect(uiState.success) {
        if (uiState.success) {
            onNavigateBack()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(if (viewModel.isEditMode) "Edit Employee" else "Create Employee")
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                }
            )
        },
        snackbarHost = {
            if (uiState.error != null) {
                Snackbar(
                    action = {
                        TextButton(onClick = { viewModel.onEvent(EmployeeFormUiEvent.ClearError) }) {
                            Text("Dismiss")
                        }
                    },
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(uiState.error!!)
                }
            }
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

                else -> {
                    EmployeeFormContent(
                        uiState = uiState,
                        isEditMode = viewModel.isEditMode,
                        onEvent = viewModel::onEvent,
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
private fun EmployeeFormContent(
    uiState: EmployeeFormUiState,
    isEditMode: Boolean,
    onEvent: (EmployeeFormUiEvent) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        // Basic Info Section
        SectionHeader(
            title = "Basic Information",
            icon = Icons.Default.Person
        )

        // Email (only in create mode)
        if (!isEditMode) {
            OutlinedTextField(
                value = uiState.email,
                onValueChange = { onEvent(EmployeeFormUiEvent.EmailChanged(it)) },
                label = { Text("Email *") },
                singleLine = true,
                isError = uiState.emailError != null,
                supportingText = {
                    if (uiState.emailError != null) {
                        Text(uiState.emailError)
                    }
                },
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Email,
                    imeAction = ImeAction.Next
                ),
                leadingIcon = {
                    Icon(Icons.Default.Email, contentDescription = null)
                },
                modifier = Modifier.fillMaxWidth()
            )
        }

        // First Name
        OutlinedTextField(
            value = uiState.firstName,
            onValueChange = { onEvent(EmployeeFormUiEvent.FirstNameChanged(it)) },
            label = { Text("First Name *") },
            singleLine = true,
            isError = uiState.firstNameError != null,
            supportingText = {
                if (uiState.firstNameError != null) {
                    Text(uiState.firstNameError)
                }
            },
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Text,
                imeAction = ImeAction.Next
            ),
            modifier = Modifier.fillMaxWidth()
        )

        // Last Name
        OutlinedTextField(
            value = uiState.lastName,
            onValueChange = { onEvent(EmployeeFormUiEvent.LastNameChanged(it)) },
            label = { Text("Last Name *") },
            singleLine = true,
            isError = uiState.lastNameError != null,
            supportingText = {
                if (uiState.lastNameError != null) {
                    Text(uiState.lastNameError)
                }
            },
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Text,
                imeAction = ImeAction.Next
            ),
            modifier = Modifier.fillMaxWidth()
        )

        // Password (only in create mode)
        if (!isEditMode) {
            OutlinedTextField(
                value = uiState.password,
                onValueChange = { onEvent(EmployeeFormUiEvent.PasswordChanged(it)) },
                label = { Text("Password *") },
                singleLine = true,
                isError = uiState.passwordError != null,
                supportingText = {
                    if (uiState.passwordError != null) {
                        Text(uiState.passwordError)
                    } else {
                        Text("Minimum 8 characters")
                    }
                },
                visualTransformation = if (uiState.isPasswordVisible) {
                    VisualTransformation.None
                } else {
                    PasswordVisualTransformation()
                },
                trailingIcon = {
                    IconButton(
                        onClick = { onEvent(EmployeeFormUiEvent.TogglePasswordVisibility) }
                    ) {
                        Icon(
                            imageVector = if (uiState.isPasswordVisible) {
                                Icons.Default.VisibilityOff
                            } else {
                                Icons.Default.Visibility
                            },
                            contentDescription = if (uiState.isPasswordVisible) {
                                "Hide password"
                            } else {
                                "Show password"
                            }
                        )
                    }
                },
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Password,
                    imeAction = ImeAction.Next
                ),
                leadingIcon = {
                    Icon(Icons.Default.Lock, contentDescription = null)
                },
                modifier = Modifier.fillMaxWidth()
            )
        }

        Divider()

        // Contact Section
        SectionHeader(
            title = "Contact Information",
            icon = Icons.Default.Phone
        )

        // Phone Number
        OutlinedTextField(
            value = uiState.phoneNumber,
            onValueChange = { onEvent(EmployeeFormUiEvent.PhoneNumberChanged(it)) },
            label = { Text("Phone Number") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Phone,
                imeAction = ImeAction.Next
            ),
            leadingIcon = {
                Icon(Icons.Default.Phone, contentDescription = null)
            },
            modifier = Modifier.fillMaxWidth()
        )

        Divider()

        // Employment Details Section
        SectionHeader(
            title = "Employment Details",
            icon = Icons.Default.Work
        )

        // Department
        OutlinedTextField(
            value = uiState.department,
            onValueChange = { onEvent(EmployeeFormUiEvent.DepartmentChanged(it)) },
            label = { Text("Department") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Text,
                imeAction = ImeAction.Next
            ),
            modifier = Modifier.fillMaxWidth()
        )

        // Job Title
        OutlinedTextField(
            value = uiState.jobTitle,
            onValueChange = { onEvent(EmployeeFormUiEvent.JobTitleChanged(it)) },
            label = { Text("Job Title") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Text,
                imeAction = ImeAction.Next
            ),
            modifier = Modifier.fillMaxWidth()
        )

        // Hire Date (only in create mode)
        if (!isEditMode) {
            OutlinedTextField(
                value = uiState.hireDate,
                onValueChange = { onEvent(EmployeeFormUiEvent.HireDateChanged(it)) },
                label = { Text("Hire Date") },
                placeholder = { Text("YYYY-MM-DD") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Text,
                    imeAction = ImeAction.Next
                ),
                leadingIcon = {
                    Icon(Icons.Default.DateRange, contentDescription = null)
                },
                modifier = Modifier.fillMaxWidth()
            )
        }

        // Locale
        OutlinedTextField(
            value = uiState.locale,
            onValueChange = { onEvent(EmployeeFormUiEvent.LocaleChanged(it)) },
            label = { Text("Locale") },
            placeholder = { Text("en_US") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Text,
                imeAction = ImeAction.Next
            ),
            modifier = Modifier.fillMaxWidth()
        )

        // Timezone
        OutlinedTextField(
            value = uiState.timezone,
            onValueChange = { onEvent(EmployeeFormUiEvent.TimezoneChanged(it)) },
            label = { Text("Timezone") },
            placeholder = { Text("UTC") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Text,
                imeAction = ImeAction.Done
            ),
            leadingIcon = {
                Icon(Icons.Default.LocationOn, contentDescription = null)
            },
            modifier = Modifier.fillMaxWidth()
        )

        Divider()

        // Groups Section
        SectionHeader(
            title = "Employee Groups",
            icon = Icons.Default.Group
        )

        if (uiState.isLoadingGroups) {
            Box(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(modifier = Modifier.size(24.dp))
            }
        } else if (uiState.availableGroups.isEmpty()) {
            Text(
                "No employee groups available",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        } else {
            GroupsMultiSelect(
                availableGroups = uiState.availableGroups,
                selectedGroupIds = uiState.selectedGroupIds,
                onGroupsChanged = { onEvent(EmployeeFormUiEvent.GroupIdsChanged(it)) }
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Submit Button
        Button(
            onClick = { onEvent(EmployeeFormUiEvent.Submit) },
            enabled = !uiState.isSaving,
            modifier = Modifier.fillMaxWidth()
        ) {
            if (uiState.isSaving) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    color = MaterialTheme.colorScheme.onPrimary
                )
            } else {
                Icon(Icons.Default.Check, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text(if (isEditMode) "Update Employee" else "Create Employee")
            }
        }

        // Required fields note
        Text(
            "* Required fields",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(top = 8.dp)
        )

        Spacer(modifier = Modifier.height(16.dp))
    }
}

@Composable
private fun SectionHeader(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
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
            color = MaterialTheme.colorScheme.primary
        )
    }
}

@Composable
private fun GroupsMultiSelect(
    availableGroups: List<EmployeeGroup>,
    selectedGroupIds: List<String>,
    onGroupsChanged: (List<String>) -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                "Select employee groups to assign:",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            availableGroups.forEach { group ->
                val isSelected = selectedGroupIds.contains(group.id)

                FilterChip(
                    selected = isSelected,
                    onClick = {
                        val newSelection = if (isSelected) {
                            selectedGroupIds - group.id
                        } else {
                            selectedGroupIds + group.id
                        }
                        onGroupsChanged(newSelection)
                    },
                    label = {
                        Column {
                            Text(
                                group.name,
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Medium
                            )
                            group.description?.let {
                                Text(
                                    it,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    },
                    leadingIcon = if (isSelected) {
                        {
                            Icon(
                                Icons.Default.CheckCircle,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    } else null,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            if (selectedGroupIds.isEmpty()) {
                Text(
                    "No groups selected",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 8.dp)
                )
            } else {
                Text(
                    "${selectedGroupIds.size} group(s) selected",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }
        }
    }
}
