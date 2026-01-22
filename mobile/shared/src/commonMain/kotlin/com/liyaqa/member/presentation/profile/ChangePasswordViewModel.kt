package com.liyaqa.member.presentation.profile

import androidx.lifecycle.viewModelScope
import com.liyaqa.member.domain.repository.ProfileRepository
import com.liyaqa.member.presentation.base.MviViewModel
import kotlinx.coroutines.launch

/**
 * Password form field identifiers.
 */
enum class PasswordField {
    CURRENT_PASSWORD,
    NEW_PASSWORD,
    CONFIRM_PASSWORD
}

/**
 * User intents for the Change Password screen.
 */
sealed interface ChangePasswordIntent {
    /** Update a form field. */
    data class UpdateField(val field: PasswordField, val value: String) : ChangePasswordIntent

    /** Submit the password change. */
    data object Submit : ChangePasswordIntent

    /** Toggle password visibility. */
    data class ToggleVisibility(val field: PasswordField) : ChangePasswordIntent

    /** Navigate back without saving. */
    data object NavigateBack : ChangePasswordIntent
}

/**
 * Validation errors for password form.
 */
data class PasswordValidationErrors(
    val currentPassword: String? = null,
    val newPassword: String? = null,
    val confirmPassword: String? = null
) {
    val hasErrors: Boolean
        get() = listOfNotNull(currentPassword, newPassword, confirmPassword).isNotEmpty()
}

/**
 * UI state for the Change Password screen.
 */
data class ChangePasswordState(
    /** Current password value. */
    val currentPassword: String = "",

    /** New password value. */
    val newPassword: String = "",

    /** Confirm password value. */
    val confirmPassword: String = "",

    /** Validation errors. */
    val validationErrors: PasswordValidationErrors = PasswordValidationErrors(),

    /** Whether saving is in progress. */
    val saving: Boolean = false,

    /** Password visibility states. */
    val currentPasswordVisible: Boolean = false,
    val newPasswordVisible: Boolean = false,
    val confirmPasswordVisible: Boolean = false
) {
    /** Password strength indicator (0-100). */
    val passwordStrength: Int
        get() {
            if (newPassword.isEmpty()) return 0
            var score = 0
            // Length
            score += minOf(newPassword.length * 5, 25)
            // Has uppercase
            if (newPassword.any { it.isUpperCase() }) score += 15
            // Has lowercase
            if (newPassword.any { it.isLowerCase() }) score += 15
            // Has digit
            if (newPassword.any { it.isDigit() }) score += 20
            // Has special char
            if (newPassword.any { !it.isLetterOrDigit() }) score += 25
            return minOf(score, 100)
        }

    /** Password strength label. */
    val passwordStrengthLabel: String
        get() = when {
            passwordStrength < 30 -> "Weak"
            passwordStrength < 60 -> "Fair"
            passwordStrength < 80 -> "Good"
            else -> "Strong"
        }

    /** Whether form is valid for submission. */
    val canSubmit: Boolean
        get() = currentPassword.isNotEmpty() &&
                newPassword.isNotEmpty() &&
                confirmPassword.isNotEmpty() &&
                !saving
}

/**
 * One-time effects from the Change Password screen.
 */
sealed interface ChangePasswordEffect {
    /** Password changed successfully. */
    data object PasswordChanged : ChangePasswordEffect

    /** Show error message. */
    data class ShowError(val message: String) : ChangePasswordEffect

    /** Navigate back. */
    data object NavigateBack : ChangePasswordEffect
}

/**
 * ViewModel for the Change Password screen.
 *
 * Features:
 * - Password fields with visibility toggle
 * - Password strength indicator
 * - Validation (min length, match confirmation)
 * - Submit password change
 */
class ChangePasswordViewModel(
    private val profileRepository: ProfileRepository
) : MviViewModel<ChangePasswordIntent, ChangePasswordState, ChangePasswordEffect>(ChangePasswordState()) {

    companion object {
        private const val MIN_PASSWORD_LENGTH = 8
    }

    override fun onIntent(intent: ChangePasswordIntent) {
        when (intent) {
            is ChangePasswordIntent.UpdateField -> updateField(intent.field, intent.value)
            is ChangePasswordIntent.Submit -> submit()
            is ChangePasswordIntent.ToggleVisibility -> toggleVisibility(intent.field)
            is ChangePasswordIntent.NavigateBack -> sendEffect(ChangePasswordEffect.NavigateBack)
        }
    }

    private fun updateField(field: PasswordField, value: String) {
        updateState {
            when (field) {
                PasswordField.CURRENT_PASSWORD -> copy(
                    currentPassword = value,
                    validationErrors = validationErrors.copy(currentPassword = null)
                )
                PasswordField.NEW_PASSWORD -> copy(
                    newPassword = value,
                    validationErrors = validationErrors.copy(newPassword = null)
                )
                PasswordField.CONFIRM_PASSWORD -> copy(
                    confirmPassword = value,
                    validationErrors = validationErrors.copy(confirmPassword = null)
                )
            }
        }
    }

    private fun toggleVisibility(field: PasswordField) {
        updateState {
            when (field) {
                PasswordField.CURRENT_PASSWORD -> copy(currentPasswordVisible = !currentPasswordVisible)
                PasswordField.NEW_PASSWORD -> copy(newPasswordVisible = !newPasswordVisible)
                PasswordField.CONFIRM_PASSWORD -> copy(confirmPasswordVisible = !confirmPasswordVisible)
            }
        }
    }

    private fun submit() {
        val state = currentState

        // Validate
        val errors = validate(state)
        if (errors.hasErrors) {
            updateState { copy(validationErrors = errors) }
            return
        }

        updateState { copy(saving = true) }

        viewModelScope.launch {
            profileRepository.changePassword(
                currentPassword = state.currentPassword,
                newPassword = state.newPassword
            )
                .onSuccess {
                    updateState { copy(saving = false) }
                    sendEffect(ChangePasswordEffect.PasswordChanged)
                }
                .onFailure { error ->
                    updateState { copy(saving = false) }
                    // Check if it's a wrong password error
                    val message = when {
                        error.message?.contains("incorrect", ignoreCase = true) == true ||
                        error.message?.contains("wrong", ignoreCase = true) == true ->
                            "Current password is incorrect"
                        else -> error.message ?: "Failed to change password"
                    }
                    sendEffect(ChangePasswordEffect.ShowError(message))
                }
        }
    }

    private fun validate(state: ChangePasswordState): PasswordValidationErrors {
        return PasswordValidationErrors(
            currentPassword = if (state.currentPassword.isBlank()) {
                "Current password is required"
            } else null,
            newPassword = when {
                state.newPassword.isBlank() -> "New password is required"
                state.newPassword.length < MIN_PASSWORD_LENGTH ->
                    "Password must be at least $MIN_PASSWORD_LENGTH characters"
                state.newPassword == state.currentPassword ->
                    "New password must be different from current password"
                else -> null
            },
            confirmPassword = when {
                state.confirmPassword.isBlank() -> "Please confirm your password"
                state.confirmPassword != state.newPassword -> "Passwords do not match"
                else -> null
            }
        )
    }
}
