package com.liyaqa.liyaqa_internal_app.features.auth.presentation.login

import androidx.lifecycle.viewModelScope
import com.liyaqa.liyaqa_internal_app.core.presentation.BaseViewModel
import com.liyaqa.liyaqa_internal_app.core.presentation.UiEvent
import com.liyaqa.liyaqa_internal_app.core.presentation.UiState
import com.liyaqa.liyaqa_internal_app.features.auth.domain.model.User
import com.liyaqa.liyaqa_internal_app.features.auth.domain.usecase.LoginUseCase
import kotlinx.coroutines.launch

/**
 * ViewModel for Login screen.
 * Follows MVVM pattern with Material 3 design guidelines.
 */
class LoginViewModel(
    private val loginUseCase: LoginUseCase
) : BaseViewModel<LoginUiState, LoginUiEvent>() {

    override fun initialState() = LoginUiState()

    override fun onEvent(event: LoginUiEvent) {
        when (event) {
            is LoginUiEvent.EmailChanged -> {
                setState { copy(email = event.email, emailError = null) }
            }
            is LoginUiEvent.PasswordChanged -> {
                setState { copy(password = event.password, passwordError = null) }
            }
            is LoginUiEvent.LoginClicked -> {
                performLogin()
            }
            is LoginUiEvent.TogglePasswordVisibility -> {
                setState { copy(isPasswordVisible = !isPasswordVisible) }
            }
            is LoginUiEvent.ClearError -> {
                setState { copy(error = null) }
            }
        }
    }

    private fun performLogin() {
        val currentEmail = currentState.email
        val currentPassword = currentState.password

        // Client-side validation
        if (currentEmail.isBlank()) {
            setState { copy(emailError = "Email cannot be empty") }
            return
        }

        if (currentPassword.isBlank()) {
            setState { copy(passwordError = "Password cannot be empty") }
            return
        }

        viewModelScope.launch {
            setState { copy(isLoading = true, error = null) }

            val result = loginUseCase(
                LoginUseCase.Params(
                    email = currentEmail,
                    password = currentPassword
                )
            )

            handleResult(
                result = result,
                onSuccess = { (user, token) ->
                    setState {
                        copy(
                            isLoading = false,
                            isLoggedIn = true,
                            currentUser = user,
                            token = token
                        )
                    }
                },
                onError = { error ->
                    setState {
                        copy(
                            isLoading = false,
                            error = error.message ?: "Login failed"
                        )
                    }
                }
            )
        }
    }

    override fun handleError(throwable: Throwable) {
        setState {
            copy(
                isLoading = false,
                error = throwable.message ?: "An unexpected error occurred"
            )
        }
    }
}

/**
 * UI State for Login screen
 */
data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val isPasswordVisible: Boolean = false,
    val isLoading: Boolean = false,
    val emailError: String? = null,
    val passwordError: String? = null,
    val error: String? = null,
    val isLoggedIn: Boolean = false,
    val currentUser: User? = null,
    val token: String? = null
) : UiState

/**
 * UI Events for Login screen
 */
sealed class LoginUiEvent : UiEvent {
    data class EmailChanged(val email: String) : LoginUiEvent()
    data class PasswordChanged(val password: String) : LoginUiEvent()
    data object LoginClicked : LoginUiEvent()
    data object TogglePasswordVisibility : LoginUiEvent()
    data object ClearError : LoginUiEvent()
}
