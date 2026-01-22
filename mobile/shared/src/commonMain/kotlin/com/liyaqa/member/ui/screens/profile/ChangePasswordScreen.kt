package com.liyaqa.member.ui.screens.profile

import androidx.compose.animation.animateColorAsState
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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.liyaqa.member.presentation.viewmodel.ChangePasswordEffect
import com.liyaqa.member.presentation.viewmodel.ChangePasswordIntent
import com.liyaqa.member.presentation.viewmodel.ChangePasswordState
import com.liyaqa.member.presentation.viewmodel.ChangePasswordViewModel
import com.liyaqa.member.presentation.viewmodel.PasswordRequirement
import com.liyaqa.member.presentation.viewmodel.PasswordStrength
import com.liyaqa.member.ui.theme.LocalAppLocale
import liyaqamember.shared.generated.resources.Res
import liyaqamember.shared.generated.resources.btn_change_password
import liyaqamember.shared.generated.resources.btn_submit
import liyaqamember.shared.generated.resources.profile_confirm_password
import liyaqamember.shared.generated.resources.profile_current_password
import liyaqamember.shared.generated.resources.profile_new_password
import org.jetbrains.compose.resources.stringResource
import org.koin.compose.viewmodel.koinViewModel

/**
 * Screen for changing member password.
 *
 * Features:
 * - Current password verification
 * - New password with strength indicator
 * - Confirm password matching
 * - Password requirements checklist
 * - Loading state during submission
 * - Error handling
 */
class ChangePasswordScreen : Screen {

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel: ChangePasswordViewModel = koinViewModel()
        val state by viewModel.state.collectAsState()

        // Handle effects
        LaunchedEffect(Unit) {
            viewModel.effect.collect { effect ->
                when (effect) {
                    is ChangePasswordEffect.PasswordChanged -> {
                        // Success - navigate back (toast handled by parent)
                    }
                    is ChangePasswordEffect.NavigateBack -> {
                        navigator.pop()
                    }
                    is ChangePasswordEffect.ShowError -> {
                        // TODO: Show snackbar with error.message
                    }
                }
            }
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(stringResource(Res.string.btn_change_password)) },
                    navigationIcon = {
                        IconButton(
                            onClick = { viewModel.onIntent(ChangePasswordIntent.NavigateBack) },
                            enabled = !state.isSubmitting
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
            ChangePasswordContent(
                state = state,
                onIntent = viewModel::onIntent,
                modifier = Modifier.padding(paddingValues)
            )
        }
    }
}

@Composable
private fun ChangePasswordContent(
    state: ChangePasswordState,
    onIntent: (ChangePasswordIntent) -> Unit,
    modifier: Modifier = Modifier
) {
    val locale = LocalAppLocale.current

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Password Fields Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface
            )
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Current password
                OutlinedTextField(
                    value = state.currentPassword,
                    onValueChange = { onIntent(ChangePasswordIntent.UpdateCurrentPassword(it)) },
                    label = { Text(stringResource(Res.string.profile_current_password)) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    visualTransformation = if (state.showCurrentPassword)
                        VisualTransformation.None
                    else
                        PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    trailingIcon = {
                        IconButton(onClick = { onIntent(ChangePasswordIntent.ToggleCurrentPasswordVisibility) }) {
                            Icon(
                                imageVector = if (state.showCurrentPassword)
                                    Icons.Filled.VisibilityOff
                                else
                                    Icons.Filled.Visibility,
                                contentDescription = if (state.showCurrentPassword) "Hide" else "Show"
                            )
                        }
                    },
                    isError = state.currentPasswordError != null,
                    supportingText = state.currentPasswordError?.let { { Text(it) } },
                    enabled = !state.isSubmitting
                )

                // New password
                OutlinedTextField(
                    value = state.newPassword,
                    onValueChange = { onIntent(ChangePasswordIntent.UpdateNewPassword(it)) },
                    label = { Text(stringResource(Res.string.profile_new_password)) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    visualTransformation = if (state.showNewPassword)
                        VisualTransformation.None
                    else
                        PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    trailingIcon = {
                        IconButton(onClick = { onIntent(ChangePasswordIntent.ToggleNewPasswordVisibility) }) {
                            Icon(
                                imageVector = if (state.showNewPassword)
                                    Icons.Filled.VisibilityOff
                                else
                                    Icons.Filled.Visibility,
                                contentDescription = if (state.showNewPassword) "Hide" else "Show"
                            )
                        }
                    },
                    isError = state.newPasswordError != null,
                    supportingText = state.newPasswordError?.let { { Text(it) } },
                    enabled = !state.isSubmitting
                )

                // Password Strength Indicator
                if (state.newPassword.isNotEmpty()) {
                    PasswordStrengthIndicator(
                        strength = state.passwordStrength,
                        progress = state.strengthProgress,
                        locale = locale
                    )
                }

                // Confirm password
                OutlinedTextField(
                    value = state.confirmPassword,
                    onValueChange = { onIntent(ChangePasswordIntent.UpdateConfirmPassword(it)) },
                    label = { Text(stringResource(Res.string.profile_confirm_password)) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    visualTransformation = if (state.showConfirmPassword)
                        VisualTransformation.None
                    else
                        PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    trailingIcon = {
                        IconButton(onClick = { onIntent(ChangePasswordIntent.ToggleConfirmPasswordVisibility) }) {
                            Icon(
                                imageVector = if (state.showConfirmPassword)
                                    Icons.Filled.VisibilityOff
                                else
                                    Icons.Filled.Visibility,
                                contentDescription = if (state.showConfirmPassword) "Hide" else "Show"
                            )
                        }
                    },
                    isError = state.confirmPasswordError != null,
                    supportingText = state.confirmPasswordError?.let { { Text(it) } },
                    enabled = !state.isSubmitting
                )
            }
        }

        // Password Requirements Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
            )
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = if (locale == "ar") "متطلبات كلمة المرور" else "Password Requirements",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold
                )

                Spacer(modifier = Modifier.height(4.dp))

                state.requirements.forEach { requirement ->
                    PasswordRequirementRow(
                        requirement = requirement,
                        locale = locale
                    )
                }

                // Passwords match indicator
                if (state.confirmPassword.isNotEmpty()) {
                    PasswordRequirementRow(
                        requirement = PasswordRequirement(
                            description = "Passwords match",
                            descriptionAr = "كلمات المرور متطابقة",
                            isMet = state.passwordsMatch
                        ),
                        locale = locale
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Submit Button
        Button(
            onClick = { onIntent(ChangePasswordIntent.Submit) },
            modifier = Modifier.fillMaxWidth(),
            enabled = state.canSubmit && !state.isSubmitting
        ) {
            if (state.isSubmitting) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    color = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.dp
                )
            } else {
                Text(stringResource(Res.string.btn_submit))
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}

@Composable
private fun PasswordStrengthIndicator(
    strength: PasswordStrength,
    progress: Float,
    locale: String
) {
    val strengthColor by animateColorAsState(
        targetValue = when (strength) {
            PasswordStrength.NONE -> MaterialTheme.colorScheme.outline
            PasswordStrength.WEAK -> Color(0xFFDC2626) // Red
            PasswordStrength.FAIR -> Color(0xFFF59E0B) // Amber
            PasswordStrength.GOOD -> Color(0xFF10B981) // Emerald
            PasswordStrength.STRONG -> Color(0xFF059669) // Green
        },
        label = "strengthColor"
    )

    val strengthLabel = when (strength) {
        PasswordStrength.NONE -> if (locale == "ar") "" else ""
        PasswordStrength.WEAK -> if (locale == "ar") "ضعيفة" else "Weak"
        PasswordStrength.FAIR -> if (locale == "ar") "متوسطة" else "Fair"
        PasswordStrength.GOOD -> if (locale == "ar") "جيدة" else "Good"
        PasswordStrength.STRONG -> if (locale == "ar") "قوية" else "Strong"
    }

    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = if (locale == "ar") "قوة كلمة المرور" else "Password Strength",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = strengthLabel,
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.Medium,
                color = strengthColor
            )
        }

        LinearProgressIndicator(
            progress = { progress / 100f },
            modifier = Modifier.fillMaxWidth(),
            color = strengthColor,
            trackColor = MaterialTheme.colorScheme.surfaceVariant
        )
    }
}

@Composable
private fun PasswordRequirementRow(
    requirement: PasswordRequirement,
    locale: String
) {
    val iconColor by animateColorAsState(
        targetValue = if (requirement.isMet) {
            Color(0xFF059669) // Green
        } else {
            MaterialTheme.colorScheme.outline
        },
        label = "requirementIconColor"
    )

    val textColor by animateColorAsState(
        targetValue = if (requirement.isMet) {
            MaterialTheme.colorScheme.onSurface
        } else {
            MaterialTheme.colorScheme.onSurfaceVariant
        },
        label = "requirementTextColor"
    )

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = if (requirement.isMet) Icons.Filled.Check else Icons.Filled.Close,
            contentDescription = null,
            modifier = Modifier.size(16.dp),
            tint = iconColor
        )

        Text(
            text = if (locale == "ar") requirement.descriptionAr else requirement.description,
            style = MaterialTheme.typography.bodySmall,
            color = textColor
        )
    }
}
