package com.liyaqa.member.presentation.auth

import com.liyaqa.member.data.auth.model.User

/**
 * Sealed class representing the authentication state of the app.
 */
sealed class AuthState {
    /**
     * User is authenticated with valid credentials.
     */
    data class Authenticated(val user: User) : AuthState()

    /**
     * User is not authenticated or session expired.
     */
    data object Unauthenticated : AuthState()

    /**
     * Authentication state is being checked (app startup).
     */
    data object Loading : AuthState()
}

/**
 * UI state for the login screen.
 */
data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val tenantId: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val emailError: String? = null,
    val passwordError: String? = null,
    val tenantIdError: String? = null
) {
    val isValid: Boolean
        get() = email.isNotBlank() &&
                password.isNotBlank() &&
                tenantId.isNotBlank() &&
                emailError == null &&
                passwordError == null &&
                tenantIdError == null
}

/**
 * Events that can occur during login.
 */
sealed interface LoginEvent {
    data object LoginSuccess : LoginEvent
    data class LoginError(val message: String) : LoginEvent
    data object NavigateToHome : LoginEvent
}
