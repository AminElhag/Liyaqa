package com.liyaqa.member.presentation.screens.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.getScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.liyaqa.member.presentation.components.ErrorView
import com.liyaqa.member.presentation.components.LoadingView
import com.liyaqa.member.presentation.components.PrimaryButton
import com.liyaqa.member.presentation.theme.LocalIsArabic
import com.liyaqa.member.presentation.theme.Strings
import com.liyaqa.member.presentation.theme.localized

object EditProfileScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val screenModel = getScreenModel<EditProfileScreenModel>()
        val state by screenModel.state.collectAsState()
        val isArabic = LocalIsArabic.current
        val snackbarHostState = remember { SnackbarHostState() }

        LaunchedEffect(Unit) {
            screenModel.loadProfile()
        }

        LaunchedEffect(state.isSaved) {
            if (state.isSaved) {
                navigator.pop()
            }
        }

        LaunchedEffect(state.saveError) {
            state.saveError?.let { error ->
                val message = if (isArabic) error.messageAr ?: error.message else error.message
                snackbarHostState.showSnackbar(message)
                screenModel.clearError()
            }
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Text(
                            text = Strings.editProfile.localized(),
                            fontWeight = FontWeight.Bold
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = if (isArabic) "رجوع" else "Back"
                            )
                        }
                    }
                )
            },
            snackbarHost = { SnackbarHost(snackbarHostState) }
        ) { paddingValues ->
            when {
                state.isLoading && state.firstName.isEmpty() -> {
                    LoadingView(modifier = Modifier.padding(paddingValues))
                }
                state.loadError != null && state.firstName.isEmpty() -> {
                    val errorMessage = if (isArabic) {
                        state.loadError?.messageAr ?: state.loadError?.message
                    } else {
                        state.loadError?.message
                    }
                    ErrorView(
                        message = errorMessage ?: "Error loading profile",
                        onRetry = screenModel::loadProfile,
                        modifier = Modifier.padding(paddingValues)
                    )
                }
                else -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(paddingValues)
                            .verticalScroll(rememberScrollState())
                            .padding(16.dp)
                            .imePadding(),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // First Name
                        OutlinedTextField(
                            value = state.firstName,
                            onValueChange = screenModel::updateFirstName,
                            label = { Text(Strings.firstName.localized()) },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next)
                        )

                        // Last Name
                        OutlinedTextField(
                            value = state.lastName,
                            onValueChange = screenModel::updateLastName,
                            label = { Text(Strings.lastName.localized()) },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next)
                        )

                        // Phone
                        OutlinedTextField(
                            value = state.phone,
                            onValueChange = screenModel::updatePhone,
                            label = { Text(Strings.phone.localized()) },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Phone,
                                imeAction = ImeAction.Next
                            )
                        )

                        // Date of Birth
                        OutlinedTextField(
                            value = state.dateOfBirth,
                            onValueChange = screenModel::updateDateOfBirth,
                            label = { Text(Strings.dateOfBirth.localized()) },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            placeholder = { Text("YYYY-MM-DD") },
                            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next)
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        // Emergency Contact Section
                        Text(
                            text = Strings.emergencyContact.localized(),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )

                        OutlinedTextField(
                            value = state.emergencyContactName,
                            onValueChange = screenModel::updateEmergencyContactName,
                            label = { Text(if (isArabic) "اسم جهة الاتصال" else "Contact Name") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next)
                        )

                        OutlinedTextField(
                            value = state.emergencyContactPhone,
                            onValueChange = screenModel::updateEmergencyContactPhone,
                            label = { Text(if (isArabic) "رقم الهاتف" else "Contact Phone") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Phone,
                                imeAction = ImeAction.Done
                            )
                        )

                        Spacer(modifier = Modifier.height(24.dp))

                        // Save Button
                        PrimaryButton(
                            text = Strings.saveChanges.localized(),
                            onClick = screenModel::saveProfile,
                            isLoading = state.isSaving,
                            enabled = state.hasChanges && !state.isSaving
                        )

                        Spacer(modifier = Modifier.height(32.dp))
                    }
                }
            }
        }
    }
}
