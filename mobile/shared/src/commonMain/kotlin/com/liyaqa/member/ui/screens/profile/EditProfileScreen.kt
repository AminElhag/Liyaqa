package com.liyaqa.member.ui.screens.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.viewmodel.EditProfileEffect
import com.liyaqa.member.presentation.viewmodel.EditProfileIntent
import com.liyaqa.member.presentation.viewmodel.EditProfileState
import com.liyaqa.member.presentation.viewmodel.EditProfileViewModel
import com.liyaqa.member.presentation.viewmodel.ProfileFormData
import com.liyaqa.member.presentation.viewmodel.ProfileFormErrors
import com.liyaqa.member.ui.theme.LocalAppLocale
import liyaqamember.shared.generated.resources.Res
import liyaqamember.shared.generated.resources.btn_cancel
import liyaqamember.shared.generated.resources.btn_edit_profile
import liyaqamember.shared.generated.resources.btn_retry
import liyaqamember.shared.generated.resources.btn_save
import liyaqamember.shared.generated.resources.common_loading
import liyaqamember.shared.generated.resources.profile_address
import liyaqamember.shared.generated.resources.profile_city
import liyaqamember.shared.generated.resources.profile_country
import liyaqamember.shared.generated.resources.profile_date_of_birth
import liyaqamember.shared.generated.resources.profile_email
import liyaqamember.shared.generated.resources.profile_emergency_contact
import liyaqamember.shared.generated.resources.profile_emergency_name
import liyaqamember.shared.generated.resources.profile_emergency_phone
import liyaqamember.shared.generated.resources.profile_first_name
import liyaqamember.shared.generated.resources.profile_last_name
import liyaqamember.shared.generated.resources.profile_personal_info
import liyaqamember.shared.generated.resources.profile_phone
import liyaqamember.shared.generated.resources.profile_postal_code
import liyaqamember.shared.generated.resources.profile_state
import liyaqamember.shared.generated.resources.profile_street
import org.jetbrains.compose.resources.stringResource
import org.koin.compose.viewmodel.koinViewModel

/**
 * Screen for editing member profile information.
 *
 * Features:
 * - Personal info form (name, phone, DOB)
 * - Address form with bilingual street support
 * - Emergency contact form
 * - Validation errors display
 * - Loading state during save
 */
class EditProfileScreen : Screen {

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel: EditProfileViewModel = koinViewModel()
        val state by viewModel.state.collectAsState()

        // Handle effects
        LaunchedEffect(Unit) {
            viewModel.effect.collect { effect ->
                when (effect) {
                    is EditProfileEffect.ProfileSaved -> {
                        // Show success toast (handled by parent)
                    }
                    is EditProfileEffect.NavigateBack -> {
                        navigator.pop()
                    }
                    is EditProfileEffect.ShowError -> {
                        // TODO: Show snackbar
                    }
                }
            }
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(stringResource(Res.string.btn_edit_profile)) },
                    navigationIcon = {
                        IconButton(
                            onClick = { viewModel.onIntent(EditProfileIntent.NavigateBack) },
                            enabled = !state.isSaving
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Back"
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    )
                )
            }
        ) { paddingValues ->
            when {
                state.loading is LoadingState.Loading -> {
                    LoadingContent()
                }
                state.loading is LoadingState.Error -> {
                    ErrorContent(
                        message = (state.loading as LoadingState.Error).message,
                        onRetry = { viewModel.onIntent(EditProfileIntent.LoadProfile) }
                    )
                }
                else -> {
                    EditProfileContent(
                        state = state,
                        onIntent = viewModel::onIntent,
                        modifier = Modifier.padding(paddingValues)
                    )
                }
            }
        }
    }
}

@Composable
private fun EditProfileContent(
    state: EditProfileState,
    onIntent: (EditProfileIntent) -> Unit,
    modifier: Modifier = Modifier
) {
    val locale = LocalAppLocale.current
    val formData = state.formData
    val errors = state.errors

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Personal Info Section
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface
            )
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = stringResource(Res.string.profile_personal_info),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )

                OutlinedTextField(
                    value = formData.firstName,
                    onValueChange = { onIntent(EditProfileIntent.UpdateFirstName(it)) },
                    label = { Text(stringResource(Res.string.profile_first_name)) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    isError = errors.firstName != null,
                    supportingText = errors.firstName?.let { { Text(it) } },
                    enabled = !state.isSaving
                )

                OutlinedTextField(
                    value = formData.lastName,
                    onValueChange = { onIntent(EditProfileIntent.UpdateLastName(it)) },
                    label = { Text(stringResource(Res.string.profile_last_name)) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    isError = errors.lastName != null,
                    supportingText = errors.lastName?.let { { Text(it) } },
                    enabled = !state.isSaving
                )

                OutlinedTextField(
                    value = formData.email,
                    onValueChange = { },
                    label = { Text(stringResource(Res.string.profile_email)) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    enabled = false // Email typically can't be changed
                )

                OutlinedTextField(
                    value = formData.phone,
                    onValueChange = { onIntent(EditProfileIntent.UpdatePhone(it)) },
                    label = { Text(stringResource(Res.string.profile_phone)) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    isError = errors.phone != null,
                    supportingText = errors.phone?.let { { Text(it) } },
                    enabled = !state.isSaving
                )

                OutlinedTextField(
                    value = formData.dateOfBirth ?: "",
                    onValueChange = { onIntent(EditProfileIntent.UpdateDateOfBirth(it.ifBlank { null })) },
                    label = { Text(stringResource(Res.string.profile_date_of_birth)) },
                    placeholder = { Text("YYYY-MM-DD") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    isError = errors.dateOfBirth != null,
                    supportingText = errors.dateOfBirth?.let { { Text(it) } },
                    enabled = !state.isSaving
                )
            }
        }

        // Address Section
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface
            )
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = stringResource(Res.string.profile_address),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )

                // Street (English)
                OutlinedTextField(
                    value = formData.streetEn,
                    onValueChange = { onIntent(EditProfileIntent.UpdateStreetEn(it)) },
                    label = { Text("${stringResource(Res.string.profile_street)} (EN)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    enabled = !state.isSaving
                )

                // Street (Arabic)
                OutlinedTextField(
                    value = formData.streetAr,
                    onValueChange = { onIntent(EditProfileIntent.UpdateStreetAr(it)) },
                    label = { Text("${stringResource(Res.string.profile_street)} (AR)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    enabled = !state.isSaving
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedTextField(
                        value = formData.city,
                        onValueChange = { onIntent(EditProfileIntent.UpdateCity(it)) },
                        label = { Text(stringResource(Res.string.profile_city)) },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        enabled = !state.isSaving
                    )

                    OutlinedTextField(
                        value = formData.state,
                        onValueChange = { onIntent(EditProfileIntent.UpdateState(it)) },
                        label = { Text(stringResource(Res.string.profile_state)) },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        enabled = !state.isSaving
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedTextField(
                        value = formData.postalCode,
                        onValueChange = { onIntent(EditProfileIntent.UpdatePostalCode(it)) },
                        label = { Text(stringResource(Res.string.profile_postal_code)) },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        enabled = !state.isSaving
                    )

                    OutlinedTextField(
                        value = formData.country,
                        onValueChange = { onIntent(EditProfileIntent.UpdateCountry(it)) },
                        label = { Text(stringResource(Res.string.profile_country)) },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        enabled = !state.isSaving
                    )
                }
            }
        }

        // Emergency Contact Section
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface
            )
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = stringResource(Res.string.profile_emergency_contact),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )

                OutlinedTextField(
                    value = formData.emergencyName,
                    onValueChange = { onIntent(EditProfileIntent.UpdateEmergencyName(it)) },
                    label = { Text(stringResource(Res.string.profile_emergency_name)) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    enabled = !state.isSaving
                )

                OutlinedTextField(
                    value = formData.emergencyPhone,
                    onValueChange = { onIntent(EditProfileIntent.UpdateEmergencyPhone(it)) },
                    label = { Text(stringResource(Res.string.profile_emergency_phone)) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    isError = errors.emergencyPhone != null,
                    supportingText = errors.emergencyPhone?.let { { Text(it) } },
                    enabled = !state.isSaving
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Action Buttons
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedButton(
                onClick = { onIntent(EditProfileIntent.NavigateBack) },
                modifier = Modifier.weight(1f),
                enabled = !state.isSaving
            ) {
                Text(stringResource(Res.string.btn_cancel))
            }

            Button(
                onClick = { onIntent(EditProfileIntent.SaveProfile) },
                modifier = Modifier.weight(1f),
                enabled = !state.isSaving
            ) {
                if (state.isSaving) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = MaterialTheme.colorScheme.onPrimary,
                        strokeWidth = 2.dp
                    )
                } else {
                    Text(stringResource(Res.string.btn_save))
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}

@Composable
private fun LoadingContent() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            CircularProgressIndicator()
            Text(
                text = stringResource(Res.string.common_loading),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun ErrorContent(
    message: String,
    onRetry: () -> Unit
) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.padding(32.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = null,
                modifier = Modifier.size(48.dp),
                tint = MaterialTheme.colorScheme.error
            )
            Text(
                text = message,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            TextButton(onClick = onRetry) {
                Text(stringResource(Res.string.btn_retry))
            }
        }
    }
}
