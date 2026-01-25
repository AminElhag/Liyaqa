package com.liyaqa.member.presentation.screens.profile

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.liyaqa.member.domain.model.UpdateProfileRequest
import com.liyaqa.member.domain.repository.MemberRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class EditProfileState(
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val isSaved: Boolean = false,
    val firstName: String = "",
    val lastName: String = "",
    val phone: String = "",
    val dateOfBirth: String = "",
    val emergencyContactName: String = "",
    val emergencyContactPhone: String = "",
    val originalFirstName: String = "",
    val originalLastName: String = "",
    val originalPhone: String = "",
    val originalDateOfBirth: String = "",
    val originalEmergencyContactName: String = "",
    val originalEmergencyContactPhone: String = "",
    val loadError: EditProfileError? = null,
    val saveError: EditProfileError? = null
) {
    val hasChanges: Boolean
        get() = firstName != originalFirstName ||
                lastName != originalLastName ||
                phone != originalPhone ||
                dateOfBirth != originalDateOfBirth ||
                emergencyContactName != originalEmergencyContactName ||
                emergencyContactPhone != originalEmergencyContactPhone
}

data class EditProfileError(
    val message: String,
    val messageAr: String? = null
)

class EditProfileScreenModel(
    private val memberRepository: MemberRepository
) : ScreenModel {

    private val _state = MutableStateFlow(EditProfileState())
    val state: StateFlow<EditProfileState> = _state.asStateFlow()

    fun loadProfile() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true, loadError = null) }

            memberRepository.getProfile().collect { result ->
                result.onSuccess { member ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            firstName = member.firstName,
                            lastName = member.lastName,
                            phone = member.phone ?: "",
                            dateOfBirth = member.dateOfBirth ?: "",
                            emergencyContactName = member.emergencyContactName ?: "",
                            emergencyContactPhone = member.emergencyContactPhone ?: "",
                            originalFirstName = member.firstName,
                            originalLastName = member.lastName,
                            originalPhone = member.phone ?: "",
                            originalDateOfBirth = member.dateOfBirth ?: "",
                            originalEmergencyContactName = member.emergencyContactName ?: "",
                            originalEmergencyContactPhone = member.emergencyContactPhone ?: ""
                        )
                    }
                }.onError { error ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            loadError = EditProfileError(
                                message = error.message ?: "Failed to load profile",
                                messageAr = error.messageAr
                            )
                        )
                    }
                }
            }
        }
    }

    fun updateFirstName(value: String) {
        _state.update { it.copy(firstName = value) }
    }

    fun updateLastName(value: String) {
        _state.update { it.copy(lastName = value) }
    }

    fun updatePhone(value: String) {
        _state.update { it.copy(phone = value) }
    }

    fun updateDateOfBirth(value: String) {
        _state.update { it.copy(dateOfBirth = value) }
    }

    fun updateEmergencyContactName(value: String) {
        _state.update { it.copy(emergencyContactName = value) }
    }

    fun updateEmergencyContactPhone(value: String) {
        _state.update { it.copy(emergencyContactPhone = value) }
    }

    fun saveProfile() {
        val currentState = _state.value
        if (!currentState.hasChanges) return

        screenModelScope.launch {
            _state.update { it.copy(isSaving = true, saveError = null) }

            val request = UpdateProfileRequest(
                firstName = currentState.firstName.takeIf { it != currentState.originalFirstName },
                lastName = currentState.lastName.takeIf { it != currentState.originalLastName },
                phone = currentState.phone.takeIf { it != currentState.originalPhone },
                dateOfBirth = currentState.dateOfBirth.takeIf { it != currentState.originalDateOfBirth },
                emergencyContactName = currentState.emergencyContactName.takeIf { it != currentState.originalEmergencyContactName },
                emergencyContactPhone = currentState.emergencyContactPhone.takeIf { it != currentState.originalEmergencyContactPhone }
            )

            memberRepository.updateProfile(request)
                .onSuccess {
                    _state.update { it.copy(isSaving = false, isSaved = true) }
                }
                .onError { error ->
                    _state.update {
                        it.copy(
                            isSaving = false,
                            saveError = EditProfileError(
                                message = error.message ?: "Failed to save profile",
                                messageAr = error.messageAr
                            )
                        )
                    }
                }
        }
    }

    fun clearError() {
        _state.update { it.copy(saveError = null) }
    }
}
