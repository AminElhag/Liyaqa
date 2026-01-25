package com.liyaqa.staff.presentation.screens.login

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.liyaqa.staff.domain.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val isLoggedIn: Boolean = false
)

class LoginScreenModel(
    private val authRepository: AuthRepository
) : ScreenModel {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun onEmailChange(email: String) {
        _uiState.value = _uiState.value.copy(email = email, error = null)
    }

    fun onPasswordChange(password: String) {
        _uiState.value = _uiState.value.copy(password = password, error = null)
    }

    fun login() {
        val state = _uiState.value
        if (state.email.isBlank() || state.password.isBlank()) {
            _uiState.value = state.copy(error = "Please enter email and password")
            return
        }

        screenModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            val result = authRepository.login(
                email = state.email,
                password = state.password,
                tenantId = null
            )

            _uiState.value = when {
                result.isSuccess -> _uiState.value.copy(
                    isLoading = false,
                    isLoggedIn = true
                )
                else -> _uiState.value.copy(
                    isLoading = false,
                    error = result.exceptionOrNull()?.message ?: "Login failed"
                )
            }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
