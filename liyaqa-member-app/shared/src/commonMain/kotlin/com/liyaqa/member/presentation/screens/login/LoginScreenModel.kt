package com.liyaqa.member.presentation.screens.login

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.liyaqa.member.domain.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class LoginState(
    val email: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val isLoggedIn: Boolean = false,
    val error: LoginError? = null
) {
    val isValid: Boolean
        get() = email.isNotBlank() && password.length >= 8
}

data class LoginError(
    val message: String,
    val messageAr: String? = null
)

class LoginScreenModel(
    private val authRepository: AuthRepository
) : ScreenModel {

    private val _state = MutableStateFlow(LoginState())
    val state: StateFlow<LoginState> = _state.asStateFlow()

    fun onEmailChange(email: String) {
        _state.update { it.copy(email = email.trim(), error = null) }
    }

    fun onPasswordChange(password: String) {
        _state.update { it.copy(password = password, error = null) }
    }

    fun login() {
        val currentState = _state.value
        if (!currentState.isValid || currentState.isLoading) return

        screenModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            authRepository.login(
                email = currentState.email,
                password = currentState.password
            ).onSuccess {
                _state.update { it.copy(isLoading = false, isLoggedIn = true) }
            }.onError { error ->
                _state.update {
                    it.copy(
                        isLoading = false,
                        error = LoginError(
                            message = error.message ?: "Login failed",
                            messageAr = error.messageAr
                        )
                    )
                }
            }
        }
    }

    fun clearError() {
        _state.update { it.copy(error = null) }
    }
}
