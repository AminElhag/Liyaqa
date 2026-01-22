package com.liyaqa.member.presentation.viewmodel

import com.liyaqa.member.core.localization.LocalizedText
import com.liyaqa.member.domain.model.Address
import com.liyaqa.member.domain.model.EmergencyContact
import com.liyaqa.member.domain.model.Member
import com.liyaqa.member.domain.repository.ProfileRepository
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.base.MviViewModel

/**
 * User intents for the Edit Profile screen.
 */
sealed interface EditProfileIntent {
    /** Load current profile data */
    data object LoadProfile : EditProfileIntent

    /** Update first name */
    data class UpdateFirstName(val value: String) : EditProfileIntent

    /** Update last name */
    data class UpdateLastName(val value: String) : EditProfileIntent

    /** Update phone number */
    data class UpdatePhone(val value: String) : EditProfileIntent

    /** Update date of birth */
    data class UpdateDateOfBirth(val value: String?) : EditProfileIntent

    /** Update street address (English) */
    data class UpdateStreetEn(val value: String) : EditProfileIntent

    /** Update street address (Arabic) */
    data class UpdateStreetAr(val value: String) : EditProfileIntent

    /** Update city */
    data class UpdateCity(val value: String) : EditProfileIntent

    /** Update state/region */
    data class UpdateState(val value: String) : EditProfileIntent

    /** Update postal code */
    data class UpdatePostalCode(val value: String) : EditProfileIntent

    /** Update country */
    data class UpdateCountry(val value: String) : EditProfileIntent

    /** Update emergency contact name */
    data class UpdateEmergencyName(val value: String) : EditProfileIntent

    /** Update emergency contact phone */
    data class UpdateEmergencyPhone(val value: String) : EditProfileIntent

    /** Save profile */
    data object SaveProfile : EditProfileIntent

    /** Navigate back */
    data object NavigateBack : EditProfileIntent
}

/**
 * Form data for profile editing.
 */
data class ProfileFormData(
    val firstName: String = "",
    val lastName: String = "",
    val email: String = "",
    val phone: String = "",
    val dateOfBirth: String? = null,
    val streetEn: String = "",
    val streetAr: String = "",
    val city: String = "",
    val state: String = "",
    val postalCode: String = "",
    val country: String = "",
    val emergencyName: String = "",
    val emergencyPhone: String = ""
) {
    companion object {
        fun fromMember(member: Member): ProfileFormData {
            return ProfileFormData(
                firstName = member.firstName,
                lastName = member.lastName,
                email = member.email,
                phone = member.phone ?: "",
                dateOfBirth = member.dateOfBirth?.toString(),
                streetEn = member.address?.street?.en ?: "",
                streetAr = member.address?.street?.ar ?: "",
                city = member.address?.city ?: "",
                state = member.address?.state ?: "",
                postalCode = member.address?.postalCode ?: "",
                country = member.address?.country ?: "",
                emergencyName = member.emergencyContact?.name ?: "",
                emergencyPhone = member.emergencyContact?.phone ?: ""
            )
        }
    }
}

/**
 * Validation errors for form fields.
 */
data class ProfileFormErrors(
    val firstName: String? = null,
    val lastName: String? = null,
    val phone: String? = null,
    val dateOfBirth: String? = null,
    val emergencyPhone: String? = null
) {
    val hasErrors: Boolean
        get() = firstName != null || lastName != null || phone != null ||
                dateOfBirth != null || emergencyPhone != null
}

/**
 * UI state for the Edit Profile screen.
 */
data class EditProfileState(
    val loading: LoadingState = LoadingState.Idle,
    val formData: ProfileFormData = ProfileFormData(),
    val errors: ProfileFormErrors = ProfileFormErrors(),
    val isSaving: Boolean = false
)

/**
 * One-time effects for the Edit Profile screen.
 */
sealed interface EditProfileEffect {
    /** Show error message */
    data class ShowError(val message: String) : EditProfileEffect

    /** Profile saved successfully */
    data object ProfileSaved : EditProfileEffect

    /** Navigate back */
    data object NavigateBack : EditProfileEffect
}

/**
 * ViewModel for the Edit Profile screen.
 *
 * Manages:
 * - Loading current profile data
 * - Form field updates with validation
 * - Profile save operation
 */
class EditProfileViewModel(
    private val profileRepository: ProfileRepository
) : MviViewModel<EditProfileIntent, EditProfileState, EditProfileEffect>(EditProfileState()) {

    init {
        onIntent(EditProfileIntent.LoadProfile)
    }

    override fun onIntent(intent: EditProfileIntent) {
        when (intent) {
            is EditProfileIntent.LoadProfile -> loadProfile()
            is EditProfileIntent.UpdateFirstName -> updateField { copy(firstName = intent.value) }
            is EditProfileIntent.UpdateLastName -> updateField { copy(lastName = intent.value) }
            is EditProfileIntent.UpdatePhone -> updateField { copy(phone = intent.value) }
            is EditProfileIntent.UpdateDateOfBirth -> updateField { copy(dateOfBirth = intent.value) }
            is EditProfileIntent.UpdateStreetEn -> updateField { copy(streetEn = intent.value) }
            is EditProfileIntent.UpdateStreetAr -> updateField { copy(streetAr = intent.value) }
            is EditProfileIntent.UpdateCity -> updateField { copy(city = intent.value) }
            is EditProfileIntent.UpdateState -> updateField { copy(state = intent.value) }
            is EditProfileIntent.UpdatePostalCode -> updateField { copy(postalCode = intent.value) }
            is EditProfileIntent.UpdateCountry -> updateField { copy(country = intent.value) }
            is EditProfileIntent.UpdateEmergencyName -> updateField { copy(emergencyName = intent.value) }
            is EditProfileIntent.UpdateEmergencyPhone -> updateField { copy(emergencyPhone = intent.value) }
            is EditProfileIntent.SaveProfile -> saveProfile()
            is EditProfileIntent.NavigateBack -> sendEffect(EditProfileEffect.NavigateBack)
        }
    }

    private fun loadProfile() {
        launch {
            updateState { copy(loading = LoadingState.Loading()) }

            // Try cached profile first
            profileRepository.getCachedProfile()?.let { member ->
                updateState {
                    copy(
                        loading = LoadingState.Success,
                        formData = ProfileFormData.fromMember(member)
                    )
                }
                return@launch
            }

            // Fetch from API
            profileRepository.getProfile()
                .onSuccess { member ->
                    updateState {
                        copy(
                            loading = LoadingState.Success,
                            formData = ProfileFormData.fromMember(member)
                        )
                    }
                }
                .onFailure { error ->
                    updateState {
                        copy(loading = LoadingState.Error(error.message ?: "Failed to load profile"))
                    }
                }
        }
    }

    private fun updateField(update: ProfileFormData.() -> ProfileFormData) {
        updateState {
            copy(
                formData = formData.update(),
                errors = ProfileFormErrors() // Clear errors on field update
            )
        }
    }

    private fun saveProfile() {
        val formData = currentState.formData

        // Validate
        val errors = validateForm(formData)
        if (errors.hasErrors) {
            updateState { copy(errors = errors) }
            return
        }

        launch {
            updateState { copy(isSaving = true) }

            val address = if (formData.streetEn.isNotBlank() || formData.city.isNotBlank()) {
                Address(
                    street = if (formData.streetEn.isNotBlank() || formData.streetAr.isNotBlank()) {
                        LocalizedText(
                            en = formData.streetEn.ifBlank { null } ?: "",
                            ar = formData.streetAr.ifBlank { null }
                        )
                    } else null,
                    city = formData.city.ifBlank { null },
                    state = formData.state.ifBlank { null },
                    postalCode = formData.postalCode.ifBlank { null },
                    country = formData.country.ifBlank { null }
                )
            } else null

            val emergencyContact = if (formData.emergencyName.isNotBlank() || formData.emergencyPhone.isNotBlank()) {
                EmergencyContact(
                    name = formData.emergencyName.ifBlank { null },
                    phone = formData.emergencyPhone.ifBlank { null }
                )
            } else null

            profileRepository.updateProfile(
                firstName = formData.firstName.ifBlank { null },
                lastName = formData.lastName.ifBlank { null },
                phone = formData.phone.ifBlank { null },
                dateOfBirth = formData.dateOfBirth,
                address = address,
                emergencyContact = emergencyContact
            )
                .onSuccess {
                    updateState { copy(isSaving = false) }
                    sendEffect(EditProfileEffect.ProfileSaved)
                    sendEffect(EditProfileEffect.NavigateBack)
                }
                .onFailure { error ->
                    updateState { copy(isSaving = false) }
                    sendEffect(EditProfileEffect.ShowError(error.message ?: "Failed to save profile"))
                }
        }
    }

    private fun validateForm(formData: ProfileFormData): ProfileFormErrors {
        return ProfileFormErrors(
            firstName = if (formData.firstName.isBlank()) "First name is required" else null,
            lastName = if (formData.lastName.isBlank()) "Last name is required" else null,
            phone = validatePhone(formData.phone),
            emergencyPhone = if (formData.emergencyPhone.isNotBlank()) validatePhone(formData.emergencyPhone) else null
        )
    }

    private fun validatePhone(phone: String): String? {
        if (phone.isBlank()) return null
        // Basic phone validation - should contain only digits, +, -, (, ), and spaces
        val phoneRegex = Regex("^[+\\d\\s()-]{7,20}$")
        return if (!phoneRegex.matches(phone)) "Invalid phone number format" else null
    }
}
