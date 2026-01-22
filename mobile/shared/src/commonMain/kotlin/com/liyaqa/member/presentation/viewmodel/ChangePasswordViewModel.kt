package com.liyaqa.member.presentation.viewmodel

import com.liyaqa.member.domain.repository.ProfileRepository
import com.liyaqa.member.presentation.base.MviViewModel

/**
 * User intents for the Change Password screen.
 */
sealed interface ChangePasswordIntent {
    /** Update current password field */
    data class UpdateCurrentPassword(val value: String) : ChangePasswordIntent

    /** Update new password field */
    data class UpdateNewPassword(val value: String) : ChangePasswordIntent

    /** Update confirm password field */
    data class UpdateConfirmPassword(val value: String) : ChangePasswordIntent

    /** Toggle current password visibility */
    data object ToggleCurrentPasswordVisibility : ChangePasswordIntent

    /** Toggle new password visibility */
    data object ToggleNewPasswordVisibility : ChangePasswordIntent

    /** Toggle confirm password visibility */
    data object ToggleConfirmPasswordVisibility : ChangePasswordIntent

    /** Submit password change */
    data object Submit : ChangePasswordIntent

    /** Navigate back */
    data object NavigateBack : ChangePasswordIntent
}

/**
 * Password strength levels.
 */
enum class PasswordStrength {
    NONE,
    WEAK,
    FAIR,
    GOOD,
    STRONG
}

/**
 * Password requirement check result.
 */
data class PasswordRequirement(
    val description: String,
    val descriptionAr: String,
    val isMet: Boolean
)

/**
 * UI state for the Change Password screen.
 */
data class ChangePasswordState(
    val currentPassword: String = "",
    val newPassword: String = "",
    val confirmPassword: String = "",
    val showCurrentPassword: Boolean = false,
    val showNewPassword: Boolean = false,
    val showConfirmPassword: Boolean = false,
    val currentPasswordError: String? = null,
    val newPasswordError: String? = null,
    val confirmPasswordError: String? = null,
    val isSubmitting: Boolean = false
) {
    /**
     * Password strength based on new password.
     */
    val passwordStrength: PasswordStrength
        get() = calculatePasswordStrength(newPassword)

    /**
     * Password requirements check.
     */
    val requirements: List<PasswordRequirement>
        get() = listOf(
            PasswordRequirement(
                description = "At least 8 characters",
                descriptionAr = "8 أحرف على الأقل",
                isMet = newPassword.length >= 8
            ),
            PasswordRequirement(
                description = "Contains uppercase letter",
                descriptionAr = "يحتوي على حرف كبير",
                isMet = newPassword.any { it.isUpperCase() }
            ),
            PasswordRequirement(
                description = "Contains lowercase letter",
                descriptionAr = "يحتوي على حرف صغير",
                isMet = newPassword.any { it.isLowerCase() }
            ),
            PasswordRequirement(
                description = "Contains a number",
                descriptionAr = "يحتوي على رقم",
                isMet = newPassword.any { it.isDigit() }
            ),
            PasswordRequirement(
                description = "Contains special character",
                descriptionAr = "يحتوي على رمز خاص",
                isMet = newPassword.any { !it.isLetterOrDigit() }
            )
        )

    /**
     * Whether passwords match.
     */
    val passwordsMatch: Boolean
        get() = newPassword.isNotEmpty() && newPassword == confirmPassword

    /**
     * Whether form is valid for submission.
     */
    val canSubmit: Boolean
        get() = currentPassword.isNotEmpty() &&
                newPassword.length >= 8 &&
                passwordsMatch &&
                requirements.take(4).all { it.isMet } // At least first 4 requirements

    /**
     * Strength progress (0-100).
     */
    val strengthProgress: Float
        get() = when (passwordStrength) {
            PasswordStrength.NONE -> 0f
            PasswordStrength.WEAK -> 25f
            PasswordStrength.FAIR -> 50f
            PasswordStrength.GOOD -> 75f
            PasswordStrength.STRONG -> 100f
        }

    private fun calculatePasswordStrength(password: String): PasswordStrength {
        if (password.isEmpty()) return PasswordStrength.NONE

        var score = 0

        // Length
        if (password.length >= 8) score++
        if (password.length >= 12) score++

        // Character types
        if (password.any { it.isUpperCase() }) score++
        if (password.any { it.isLowerCase() }) score++
        if (password.any { it.isDigit() }) score++
        if (password.any { !it.isLetterOrDigit() }) score++

        return when {
            score <= 2 -> PasswordStrength.WEAK
            score == 3 -> PasswordStrength.FAIR
            score == 4 -> PasswordStrength.GOOD
            else -> PasswordStrength.STRONG
        }
    }
}

/**
 * One-time effects for the Change Password screen.
 */
sealed interface ChangePasswordEffect {
    /** Show error message */
    data class ShowError(val message: String) : ChangePasswordEffect

    /** Password changed successfully */
    data object PasswordChanged : ChangePasswordEffect

    /** Navigate back */
    data object NavigateBack : ChangePasswordEffect
}

/**
 * ViewModel for the Change Password screen.
 *
 * Manages:
 * - Password field updates
 * - Password strength calculation
 * - Requirements validation
 * - Password change submission
 */
class ChangePasswordViewModel(
    private val profileRepository: ProfileRepository
) : MviViewModel<ChangePasswordIntent, ChangePasswordState, ChangePasswordEffect>(ChangePasswordState()) {

    override fun onIntent(intent: ChangePasswordIntent) {
        when (intent) {
            is ChangePasswordIntent.UpdateCurrentPassword -> updateCurrentPassword(intent.value)
            is ChangePasswordIntent.UpdateNewPassword -> updateNewPassword(intent.value)
            is ChangePasswordIntent.UpdateConfirmPassword -> updateConfirmPassword(intent.value)
            is ChangePasswordIntent.ToggleCurrentPasswordVisibility -> toggleCurrentPasswordVisibility()
            is ChangePasswordIntent.ToggleNewPasswordVisibility -> toggleNewPasswordVisibility()
            is ChangePasswordIntent.ToggleConfirmPasswordVisibility -> toggleConfirmPasswordVisibility()
            is ChangePasswordIntent.Submit -> submit()
            is ChangePasswordIntent.NavigateBack -> sendEffect(ChangePasswordEffect.NavigateBack)
        }
    }

    private fun updateCurrentPassword(value: String) {
        updateState {
            copy(
                currentPassword = value,
                currentPasswordError = null
            )
        }
    }

    private fun updateNewPassword(value: String) {
        updateState {
            copy(
                newPassword = value,
                newPasswordError = null,
                confirmPasswordError = if (confirmPassword.isNotEmpty() && value != confirmPassword) {
                    "Passwords do not match"
                } else null
            )
        }
    }

    private fun updateConfirmPassword(value: String) {
        updateState {
            copy(
                confirmPassword = value,
                confirmPasswordError = if (value.isNotEmpty() && value != newPassword) {
                    "Passwords do not match"
                } else null
            )
        }
    }

    private fun toggleCurrentPasswordVisibility() {
        updateState { copy(showCurrentPassword = !showCurrentPassword) }
    }

    private fun toggleNewPasswordVisibility() {
        updateState { copy(showNewPassword = !showNewPassword) }
    }

    private fun toggleConfirmPasswordVisibility() {
        updateState { copy(showConfirmPassword = !showConfirmPassword) }
    }

    private fun submit() {
        val state = currentState

        // Validate
        if (state.currentPassword.isEmpty()) {
            updateState { copy(currentPasswordError = "Current password is required") }
            return
        }

        if (state.newPassword.length < 8) {
            updateState { copy(newPasswordError = "Password must be at least 8 characters") }
            return
        }

        if (!state.passwordsMatch) {
            updateState { copy(confirmPasswordError = "Passwords do not match") }
            return
        }

        launch {
            updateState { copy(isSubmitting = true) }

            profileRepository.changePassword(
                currentPassword = state.currentPassword,
                newPassword = state.newPassword
            )
                .onSuccess {
                    updateState { copy(isSubmitting = false) }
                    sendEffect(ChangePasswordEffect.PasswordChanged)
                    sendEffect(ChangePasswordEffect.NavigateBack)
                }
                .onFailure { error ->
                    updateState {
                        copy(
                            isSubmitting = false,
                            currentPasswordError = if (error.message?.contains("incorrect", ignoreCase = true) == true ||
                                error.message?.contains("wrong", ignoreCase = true) == true
                            ) {
                                "Current password is incorrect"
                            } else null
                        )
                    }
                    sendEffect(ChangePasswordEffect.ShowError(error.message ?: "Failed to change password"))
                }
        }
    }
}
