package com.liyaqa.liyaqa_internal_app.features.facility.presentation.create

import androidx.lifecycle.viewModelScope
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.core.presentation.BaseViewModel
import com.liyaqa.liyaqa_internal_app.core.presentation.UiEvent
import com.liyaqa.liyaqa_internal_app.core.presentation.UiState
import com.liyaqa.liyaqa_internal_app.features.facility.data.dto.CreateFacilityRequest
import com.liyaqa.liyaqa_internal_app.features.facility.data.dto.UpdateFacilityRequest
import com.liyaqa.liyaqa_internal_app.features.facility.domain.model.Facility
import com.liyaqa.liyaqa_internal_app.features.facility.domain.model.FacilityType
import com.liyaqa.liyaqa_internal_app.features.facility.domain.usecase.CreateFacilityUseCase
import com.liyaqa.liyaqa_internal_app.features.facility.domain.usecase.GetFacilityByIdUseCase
import com.liyaqa.liyaqa_internal_app.features.facility.domain.usecase.UpdateFacilityUseCase
import kotlinx.coroutines.launch

class FacilityFormViewModel(
    private val createFacilityUseCase: CreateFacilityUseCase,
    private val updateFacilityUseCase: UpdateFacilityUseCase,
    private val getFacilityByIdUseCase: GetFacilityByIdUseCase,
    private val facilityId: String? = null
) : BaseViewModel<FacilityFormUiState, FacilityFormUiEvent>() {

    override fun initialState() = FacilityFormUiState()

    val isEditMode = facilityId != null

    init {
        if (facilityId != null) {
            loadFacility(facilityId)
        }
    }

    override fun onEvent(event: FacilityFormUiEvent) {
        when (event) {
            is FacilityFormUiEvent.TenantIdChanged -> setState { copy(tenantId = event.value, tenantIdError = null) }
            is FacilityFormUiEvent.NameChanged -> setState { copy(name = event.value, nameError = null) }
            is FacilityFormUiEvent.FacilityTypeChanged -> setState { copy(facilityType = event.value, facilityTypeError = null) }
            is FacilityFormUiEvent.DescriptionChanged -> setState { copy(description = event.value) }
            is FacilityFormUiEvent.ContactEmailChanged -> setState { copy(contactEmail = event.value, contactEmailError = null) }
            is FacilityFormUiEvent.ContactPhoneChanged -> setState { copy(contactPhone = event.value) }
            is FacilityFormUiEvent.WebsiteChanged -> setState { copy(website = event.value) }
            is FacilityFormUiEvent.TimezoneChanged -> setState { copy(timezone = event.value) }
            is FacilityFormUiEvent.CurrencyChanged -> setState { copy(currency = event.value) }
            is FacilityFormUiEvent.Submit -> if (isEditMode) updateFacility() else createFacility()
            is FacilityFormUiEvent.ClearError -> setState { copy(error = null) }
        }
    }

    private fun loadFacility(id: String) {
        viewModelScope.launch {
            setState { copy(isLoading = true) }
            when (val result = getFacilityByIdUseCase(id)) {
                is Result.Success -> {
                    val facility = result.data
                    setState {
                        copy(
                            isLoading = false,
                            tenantId = facility.tenantId,
                            name = facility.name,
                            facilityType = facility.facilityType,
                            description = facility.description ?: "",
                            contactEmail = facility.contactEmail,
                            contactPhone = facility.contactPhone ?: "",
                            website = facility.website ?: "",
                            timezone = facility.timezone,
                            currency = facility.currency
                        )
                    }
                }
                is Result.Error -> setState {
                    copy(isLoading = false, error = result.message ?: "Failed to load facility")
                }
                is Result.Loading -> {}
            }
        }
    }

    private fun createFacility() {
        if (!validate()) return

        viewModelScope.launch {
            setState { copy(isSaving = true, error = null) }

            val request = CreateFacilityRequest(
                tenantId = uiState.value.tenantId,
                name = uiState.value.name,
                facilityType = uiState.value.facilityType.name,
                description = uiState.value.description.ifBlank { null },
                contactEmail = uiState.value.contactEmail,
                contactPhone = uiState.value.contactPhone.ifBlank { null },
                timezone = uiState.value.timezone,
                currency = uiState.value.currency
            )

            when (val result = createFacilityUseCase(request)) {
                is Result.Success -> setState { copy(isSaving = false, success = true) }
                is Result.Error -> setState {
                    copy(isSaving = false, error = result.message ?: "Failed to create facility")
                }
                is Result.Loading -> {}
            }
        }
    }

    private fun updateFacility() {
        if (!validate() || facilityId == null) return

        viewModelScope.launch {
            setState { copy(isSaving = true, error = null) }

            val request = UpdateFacilityRequest(
                name = uiState.value.name,
                description = uiState.value.description.ifBlank { null },
                contactEmail = uiState.value.contactEmail,
                contactPhone = uiState.value.contactPhone.ifBlank { null },
                website = uiState.value.website.ifBlank { null }
            )

            when (val result = updateFacilityUseCase(UpdateFacilityUseCase.Params(facilityId, request))) {
                is Result.Success -> setState { copy(isSaving = false, success = true) }
                is Result.Error -> setState {
                    copy(isSaving = false, error = result.message ?: "Failed to update facility")
                }
                is Result.Loading -> {}
            }
        }
    }

    private fun validate(): Boolean {
        val state = uiState.value
        var isValid = true

        if (state.name.isBlank()) {
            setState { copy(nameError = "Name is required") }
            isValid = false
        }

        if (state.contactEmail.isBlank()) {
            setState { copy(contactEmailError = "Email is required") }
            isValid = false
        } else if (!state.contactEmail.contains("@")) {
            setState { copy(contactEmailError = "Invalid email format") }
            isValid = false
        }

        if (!isEditMode && state.tenantId.isBlank()) {
            setState { copy(tenantIdError = "Tenant ID is required") }
            isValid = false
        }

        return isValid
    }
}

data class FacilityFormUiState(
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val success: Boolean = false,
    val error: String? = null,
    val tenantId: String = "",
    val tenantIdError: String? = null,
    val name: String = "",
    val nameError: String? = null,
    val facilityType: FacilityType = FacilityType.MULTI_SPORT,
    val facilityTypeError: String? = null,
    val description: String = "",
    val contactEmail: String = "",
    val contactEmailError: String? = null,
    val contactPhone: String = "",
    val website: String = "",
    val timezone: String = "UTC",
    val currency: String = "USD"
) : UiState

sealed interface FacilityFormUiEvent : UiEvent {
    data class TenantIdChanged(val value: String) : FacilityFormUiEvent
    data class NameChanged(val value: String) : FacilityFormUiEvent
    data class FacilityTypeChanged(val value: FacilityType) : FacilityFormUiEvent
    data class DescriptionChanged(val value: String) : FacilityFormUiEvent
    data class ContactEmailChanged(val value: String) : FacilityFormUiEvent
    data class ContactPhoneChanged(val value: String) : FacilityFormUiEvent
    data class WebsiteChanged(val value: String) : FacilityFormUiEvent
    data class TimezoneChanged(val value: String) : FacilityFormUiEvent
    data class CurrencyChanged(val value: String) : FacilityFormUiEvent
    data object Submit : FacilityFormUiEvent
    data object ClearError : FacilityFormUiEvent
}
