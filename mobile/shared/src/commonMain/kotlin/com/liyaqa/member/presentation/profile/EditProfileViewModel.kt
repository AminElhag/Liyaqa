package com.liyaqa.member.presentation.profile

import androidx.lifecycle.viewModelScope
import com.liyaqa.member.core.localization.LocalizedText
import com.liyaqa.member.domain.model.Address
import com.liyaqa.member.domain.model.EmergencyContact
import com.liyaqa.member.domain.repository.ProfileRepository
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.base.MviViewModel
import kotlinx.coroutines.launch

/**
 * Form field identifiers for profile editing.
 */
enum class ProfileField {
    FIRST_NAME,
    LAST_NAME,
    PHONE,
    DATE_OF_BIRTH,
    STREET_EN,
    STREET_AR,
    CITY,
    STATE,
    POSTAL_CODE,
    COUNTRY,
    EMERGENCY_NAME,
    EMERGENCY_PHONE
}

/**
 * User intents for the Edit Profile screen.
 */
sealed interface EditProfileIntent {
    /** Load existing profile data. */
    data object LoadProfile : EditProfileIntent

    /** Update a form field. */
    data class UpdateField(val field: ProfileField, val value: String) : EditProfileIntent

    /** Save the profile. */
    data object SaveProfile : EditProfileIntent

    /** Navigate back without saving. */
    data object NavigateBack : EditProfileIntent
}

/**
 * Form data for profile editing.
 */
data class ProfileFormData(
    val firstName: String = "",
    val lastName: String = "",
    val phone: String = "",
    val dateOfBirth: String = "",
    val streetEn: String = "",
    val streetAr: String = "",
    val city: String = "",
    val state: String = "",
    val postalCode: String = "",
    val country: String = "",
    val emergencyName: String = "",
    val emergencyPhone: String = ""
)

/**
 * Validation errors for profile form.
 */
data class ProfileValidationErrors(
    val firstName: String? = null,
    val lastName: String? = null,
    val phone: String? = null,
    val dateOfBirth: String? = null,
    val emergencyPhone: String? = null
) {
    val hasErrors: Boolean
        get() = listOfNotNull(firstName, lastName, phone, dateOfBirth, emergencyPhone).isNotEmpty()
}

/**
 * UI state for the Edit Profile screen.
 */
data class EditProfileState(
    /** Loading state. */
    val loading: LoadingState = LoadingState.Idle,

    /** Form data. */
    val formData: ProfileFormData = ProfileFormData(),

    /** Validation errors. */
    val validationErrors: ProfileValidationErrors = ProfileValidationErrors(),

    /** Whether saving is in progress. */
    val saving: Boolean = false,

    /** Whether form has been modified. */
    val isDirty: Boolean = false
)

/**
 * One-time effects from the Edit Profile screen.
 */
sealed interface EditProfileEffect {
    /** Profile saved successfully. */
    data object ProfileSaved : EditProfileEffect

    /** Show error message. */
    data class ShowError(val message: String) : EditProfileEffect

    /** Navigate back. */
    data object NavigateBack : EditProfileEffect
}

/**
 * ViewModel for the Edit Profile screen.
 *
 * Features:
 * - Load existing profile data into form
 * - Validate form fields
 * - Save profile changes
 * - Track form dirty state
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
            is EditProfileIntent.UpdateField -> updateField(intent.field, intent.value)
            is EditProfileIntent.SaveProfile -> saveProfile()
            is EditProfileIntent.NavigateBack -> sendEffect(EditProfileEffect.NavigateBack)
        }
    }

    private fun loadProfile() {
        updateState { copy(loading = LoadingState.Loading()) }

        viewModelScope.launch {
            profileRepository.getProfile()
                .onSuccess { member ->
                    updateState {
                        copy(
                            loading = LoadingState.Success,
                            formData = ProfileFormData(
                                firstName = member.firstName,
                                lastName = member.lastName,
                                phone = member.phone ?: "",
                                dateOfBirth = member.dateOfBirth?.toString() ?: "",
                                streetEn = member.address?.street?.en ?: "",
                                streetAr = member.address?.street?.ar ?: "",
                                city = member.address?.city ?: "",
                                state = member.address?.state ?: "",
                                postalCode = member.address?.postalCode ?: "",
                                country = member.address?.country ?: "",
                                emergencyName = member.emergencyContact?.name ?: "",
                                emergencyPhone = member.emergencyContact?.phone ?: ""
                            )
                        )
                    }
                }
                .onFailure { error ->
                    updateState {
                        copy(loading = LoadingState.Error(
                            message = error.message ?: "Failed to load profile",
                            throwable = error
                        ))
                    }
                }
        }
    }

    private fun updateField(field: ProfileField, value: String) {
        updateState {
            copy(
                formData = when (field) {
                    ProfileField.FIRST_NAME -> formData.copy(firstName = value)
                    ProfileField.LAST_NAME -> formData.copy(lastName = value)
                    ProfileField.PHONE -> formData.copy(phone = value)
                    ProfileField.DATE_OF_BIRTH -> formData.copy(dateOfBirth = value)
                    ProfileField.STREET_EN -> formData.copy(streetEn = value)
                    ProfileField.STREET_AR -> formData.copy(streetAr = value)
                    ProfileField.CITY -> formData.copy(city = value)
                    ProfileField.STATE -> formData.copy(state = value)
                    ProfileField.POSTAL_CODE -> formData.copy(postalCode = value)
                    ProfileField.COUNTRY -> formData.copy(country = value)
                    ProfileField.EMERGENCY_NAME -> formData.copy(emergencyName = value)
                    ProfileField.EMERGENCY_PHONE -> formData.copy(emergencyPhone = value)
                },
                validationErrors = clearFieldError(field),
                isDirty = true
            )
        }
    }

    private fun clearFieldError(field: ProfileField): ProfileValidationErrors {
        val errors = currentState.validationErrors
        return when (field) {
            ProfileField.FIRST_NAME -> errors.copy(firstName = null)
            ProfileField.LAST_NAME -> errors.copy(lastName = null)
            ProfileField.PHONE -> errors.copy(phone = null)
            ProfileField.DATE_OF_BIRTH -> errors.copy(dateOfBirth = null)
            ProfileField.EMERGENCY_PHONE -> errors.copy(emergencyPhone = null)
            else -> errors
        }
    }

    private fun saveProfile() {
        val formData = currentState.formData

        // Validate
        val errors = validate(formData)
        if (errors.hasErrors) {
            updateState { copy(validationErrors = errors) }
            return
        }

        updateState { copy(saving = true) }

        viewModelScope.launch {
            profileRepository.updateProfile(
                firstName = formData.firstName.ifBlank { null },
                lastName = formData.lastName.ifBlank { null },
                phone = formData.phone.ifBlank { null },
                dateOfBirth = formData.dateOfBirth.ifBlank { null },
                address = buildAddress(formData),
                emergencyContact = buildEmergencyContact(formData)
            )
                .onSuccess {
                    updateState { copy(saving = false, isDirty = false) }
                    sendEffect(EditProfileEffect.ProfileSaved)
                }
                .onFailure { error ->
                    updateState { copy(saving = false) }
                    sendEffect(EditProfileEffect.ShowError(
                        error.message ?: "Failed to save profile"
                    ))
                }
        }
    }

    private fun validate(formData: ProfileFormData): ProfileValidationErrors {
        return ProfileValidationErrors(
            firstName = if (formData.firstName.isBlank()) "First name is required" else null,
            lastName = if (formData.lastName.isBlank()) "Last name is required" else null,
            phone = validatePhone(formData.phone),
            emergencyPhone = validatePhone(formData.emergencyPhone, required = false)
        )
    }

    private fun validatePhone(phone: String, required: Boolean = false): String? {
        if (phone.isBlank()) {
            return if (required) "Phone is required" else null
        }
        // Simple validation - should be enhanced for Saudi phone numbers
        if (phone.length < 9) {
            return "Invalid phone number"
        }
        return null
    }

    private fun buildAddress(formData: ProfileFormData): Address? {
        if (formData.streetEn.isBlank() && formData.city.isBlank()) {
            return null
        }
        return Address(
            street = if (formData.streetEn.isNotBlank()) {
                LocalizedText(
                    en = formData.streetEn,
                    ar = formData.streetAr.ifBlank { null }
                )
            } else null,
            city = formData.city.ifBlank { null },
            state = formData.state.ifBlank { null },
            postalCode = formData.postalCode.ifBlank { null },
            country = formData.country.ifBlank { null }
        )
    }

    private fun buildEmergencyContact(formData: ProfileFormData): EmergencyContact? {
        if (formData.emergencyName.isBlank() && formData.emergencyPhone.isBlank()) {
            return null
        }
        return EmergencyContact(
            name = formData.emergencyName.ifBlank { null },
            phone = formData.emergencyPhone.ifBlank { null }
        )
    }
}
