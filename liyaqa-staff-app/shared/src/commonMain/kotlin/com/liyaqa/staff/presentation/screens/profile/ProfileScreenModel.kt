package com.liyaqa.staff.presentation.screens.profile

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.liyaqa.staff.domain.model.StaffProfile
import com.liyaqa.staff.domain.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ProfileUiState(
    val profile: StaffProfile? = null,
    val isLoggingOut: Boolean = false,
    val showLogoutDialog: Boolean = false,
    val loggedOut: Boolean = false
)

class ProfileScreenModel(
    private val authRepository: AuthRepository
) : ScreenModel {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        screenModelScope.launch {
            authRepository.getStaffProfile().collect { profile ->
                _uiState.value = _uiState.value.copy(profile = profile)
            }
        }
    }

    fun showLogoutDialog() {
        _uiState.value = _uiState.value.copy(showLogoutDialog = true)
    }

    fun hideLogoutDialog() {
        _uiState.value = _uiState.value.copy(showLogoutDialog = false)
    }

    fun logout() {
        screenModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isLoggingOut = true,
                showLogoutDialog = false
            )
            authRepository.logout()
            _uiState.value = _uiState.value.copy(
                isLoggingOut = false,
                loggedOut = true
            )
        }
    }
}
