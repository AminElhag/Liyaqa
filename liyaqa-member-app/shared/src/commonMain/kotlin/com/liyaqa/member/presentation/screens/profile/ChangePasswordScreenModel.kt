package com.liyaqa.member.presentation.screens.profile

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.liyaqa.member.domain.model.ChangePasswordRequest
import com.liyaqa.member.domain.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ChangePasswordState(
    val isLoading: Boolean = false,
    val isSuccess: Boolean = false,
    val currentPassword: String = "",
    val newPassword: String = "",
    val confirmPassword: String = "",
    val error: ChangePasswordError? = null
) {
    val passwordsMatch: Boolean
        get() = newPassword == confirmPassword

    val isValid: Boolean
        get() = currentPassword.isNotEmpty() &&
                newPassword.length >= 8 &&
                passwordsMatch
}

data class ChangePasswordError(
    val message: String,
    val messageAr: String? = null
)

class ChangePasswordScreenModel(
    private val authRepository: AuthRepository
) : ScreenModel {

    private val _state = MutableStateFlow(ChangePasswordState())
    val state: StateFlow<ChangePasswordState> = _state.asStateFlow()

    fun updateCurrentPassword(value: String) {
        _state.update { it.copy(currentPassword = value) }
    }

    fun updateNewPassword(value: String) {
        _state.update { it.copy(newPassword = value) }
    }

    fun updateConfirmPassword(value: String) {
        _state.update { it.copy(confirmPassword = value) }
    }

    fun changePassword() {
        val currentState = _state.value
        if (!currentState.isValid) return

        screenModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            authRepository.changePassword(
                ChangePasswordRequest(
                    currentPassword = currentState.currentPassword,
                    newPassword = currentState.newPassword
                )
            ).onSuccess {
                _state.update { it.copy(isLoading = false, isSuccess = true) }
            }.onError { error ->
                _state.update {
                    it.copy(
                        isLoading = false,
                        error = ChangePasswordError(
                            message = error.message ?: "Failed to change password",
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
