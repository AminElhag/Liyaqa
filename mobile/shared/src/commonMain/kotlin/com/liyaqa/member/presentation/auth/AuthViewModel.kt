package com.liyaqa.member.presentation.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.liyaqa.member.data.api.ApiClient
import com.liyaqa.member.data.api.AuthEvent
import com.liyaqa.member.data.auth.AuthTokenProviderImpl
import com.liyaqa.member.data.auth.TokenProviderEvent
import com.liyaqa.member.data.auth.repository.AuthRepository
import com.liyaqa.member.data.auth.repository.AuthResult
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * ViewModel for managing authentication state across the app.
 * Observes both ApiClient auth events and TokenProvider events.
 */
class AuthViewModel(
    private val authRepository: AuthRepository,
    private val tokenProvider: AuthTokenProviderImpl,
    private val apiClient: ApiClient
) : ViewModel() {

    private val _authState = MutableStateFlow<AuthState>(AuthState.Loading)
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    private val _loginUiState = MutableStateFlow(LoginUiState())
    val loginUiState: StateFlow<LoginUiState> = _loginUiState.asStateFlow()

    private val _loginEvents = MutableSharedFlow<LoginEvent>()
    val loginEvents: SharedFlow<LoginEvent> = _loginEvents.asSharedFlow()

    init {
        checkAuthStatus()
        observeAuthEvents()
        observeTokenProviderEvents()
    }

    /**
     * Checks current authentication status on startup.
     */
    private fun checkAuthStatus() {
        viewModelScope.launch {
            val user = authRepository.getCurrentUser()
            _authState.value = if (user != null) {
                AuthState.Authenticated(user)
            } else {
                AuthState.Unauthenticated
            }
        }
    }

    /**
     * Observes auth events from ApiClient (401/403 responses).
     */
    private fun observeAuthEvents() {
        viewModelScope.launch {
            apiClient.authEvents.collect { event ->
                when (event) {
                    is AuthEvent.Unauthorized -> {
                        // Token refresh will be handled by TokenProvider
                    }
                    is AuthEvent.Forbidden -> {
                        // Handle forbidden access
                    }
                    is AuthEvent.TokenRefreshed -> {
                        // Token was refreshed, update user if needed
                        val user = authRepository.getCurrentUser()
                        if (user != null) {
                            _authState.value = AuthState.Authenticated(user)
                        }
                    }
                }
            }
        }
    }

    /**
     * Observes events from TokenProvider (session expiry, refresh).
     */
    private fun observeTokenProviderEvents() {
        viewModelScope.launch {
            tokenProvider.events.collect { event ->
                when (event) {
                    is TokenProviderEvent.SessionExpired -> {
                        _authState.value = AuthState.Unauthenticated
                    }
                    is TokenProviderEvent.AccessForbidden -> {
                        // Handle forbidden - could show error message
                    }
                    is TokenProviderEvent.TokenRefreshed -> {
                        // Token refreshed successfully
                        val user = authRepository.getCurrentUser()
                        if (user != null) {
                            _authState.value = AuthState.Authenticated(user)
                        }
                    }
                    is TokenProviderEvent.RefreshFailed -> {
                        // Refresh failed but not session expiry
                        // Could be network error - keep current state
                    }
                }
            }
        }
    }

    /**
     * Updates the email field in login form.
     */
    fun updateEmail(email: String) {
        _loginUiState.update { it.copy(email = email, emailError = null, errorMessage = null) }
    }

    /**
     * Updates the password field in login form.
     */
    fun updatePassword(password: String) {
        _loginUiState.update { it.copy(password = password, passwordError = null, errorMessage = null) }
    }

    /**
     * Updates the tenant ID field in login form.
     */
    fun updateTenantId(tenantId: String) {
        _loginUiState.update { it.copy(tenantId = tenantId, tenantIdError = null, errorMessage = null) }
    }

    /**
     * Performs login with current form values.
     */
    fun login() {
        val currentState = _loginUiState.value

        // Validate inputs
        val emailError = validateEmail(currentState.email)
        val passwordError = validatePassword(currentState.password)
        val tenantIdError = validateTenantId(currentState.tenantId)

        if (emailError != null || passwordError != null || tenantIdError != null) {
            _loginUiState.update {
                it.copy(
                    emailError = emailError,
                    passwordError = passwordError,
                    tenantIdError = tenantIdError
                )
            }
            return
        }

        viewModelScope.launch {
            _loginUiState.update { it.copy(isLoading = true, errorMessage = null) }

            val result = authRepository.login(
                email = currentState.email,
                password = currentState.password,
                tenantId = currentState.tenantId
            )

            when (result) {
                is AuthResult.Success -> {
                    _authState.value = AuthState.Authenticated(result.user)
                    _loginUiState.update { it.copy(isLoading = false) }
                    _loginEvents.emit(LoginEvent.LoginSuccess)
                    _loginEvents.emit(LoginEvent.NavigateToHome)
                }
                is AuthResult.Error -> {
                    _loginUiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = result.message
                        )
                    }
                    _loginEvents.emit(LoginEvent.LoginError(result.message))
                }
                is AuthResult.NetworkError -> {
                    _loginUiState.update {
                        it.copy(
                            isLoading = false,
                            errorMessage = "Network error. Please check your connection."
                        )
                    }
                    _loginEvents.emit(LoginEvent.LoginError("Network error"))
                }
            }
        }
    }

    /**
     * Logs out the current user.
     */
    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
            _authState.value = AuthState.Unauthenticated
            // Clear login form
            _loginUiState.value = LoginUiState()
        }
    }

    /**
     * Clears any login error message.
     */
    fun clearError() {
        _loginUiState.update { it.copy(errorMessage = null) }
    }

    private fun validateEmail(email: String): String? {
        return when {
            email.isBlank() -> "Email is required"
            !email.contains("@") -> "Invalid email format"
            else -> null
        }
    }

    private fun validatePassword(password: String): String? {
        return when {
            password.isBlank() -> "Password is required"
            password.length < 6 -> "Password must be at least 6 characters"
            else -> null
        }
    }

    private fun validateTenantId(tenantId: String): String? {
        return when {
            tenantId.isBlank() -> "Tenant ID is required"
            else -> null
        }
    }
}
