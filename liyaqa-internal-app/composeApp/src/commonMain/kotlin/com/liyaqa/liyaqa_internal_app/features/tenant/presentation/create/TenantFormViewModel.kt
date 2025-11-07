package com.liyaqa.liyaqa_internal_app.features.tenant.presentation.create

import androidx.lifecycle.viewModelScope
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.core.presentation.BaseViewModel
import com.liyaqa.liyaqa_internal_app.core.presentation.UiEvent
import com.liyaqa.liyaqa_internal_app.core.presentation.UiState
import com.liyaqa.liyaqa_internal_app.features.tenant.data.dto.CreateTenantRequest
import com.liyaqa.liyaqa_internal_app.features.tenant.data.dto.UpdateTenantRequest
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.model.Tenant
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.model.SubscriptionTier
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.usecase.CreateTenantUseCase
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.usecase.GetTenantByIdUseCase
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.usecase.UpdateTenantUseCase
import kotlinx.coroutines.launch

class TenantFormViewModel(
    private val createTenantUseCase: CreateTenantUseCase,
    private val updateTenantUseCase: UpdateTenantUseCase,
    private val getTenantByIdUseCase: GetTenantByIdUseCase,
    private val tenantId: String? = null
) : BaseViewModel<TenantFormUiState, TenantFormUiEvent>() {

    override fun initialState() = TenantFormUiState()

    val isEditMode = tenantId != null

    init {
        if (tenantId != null) {
            loadTenant(tenantId)
        }
    }

    override fun onEvent(event: TenantFormUiEvent) {
        when (event) {
            is TenantFormUiEvent.NameChanged -> setState { copy(name = event.value, nameError = null) }
            is TenantFormUiEvent.ContactEmailChanged -> setState { copy(contactEmail = event.value, contactEmailError = null) }
            is TenantFormUiEvent.ContactPhoneChanged -> setState { copy(contactPhone = event.value) }
            is TenantFormUiEvent.AddressChanged -> setState { copy(address = event.value) }
            is TenantFormUiEvent.CityChanged -> setState { copy(city = event.value) }
            is TenantFormUiEvent.StateChanged -> setState { copy(state = event.value) }
            is TenantFormUiEvent.CountryChanged -> setState { copy(country = event.value, countryError = null) }
            is TenantFormUiEvent.PostalCodeChanged -> setState { copy(postalCode = event.value) }
            is TenantFormUiEvent.SubscriptionTierChanged -> setState { copy(subscriptionTier = event.value) }
            is TenantFormUiEvent.TimezoneChanged -> setState { copy(timezone = event.value) }
            is TenantFormUiEvent.LocaleChanged -> setState { copy(locale = event.value) }
            is TenantFormUiEvent.CurrencyChanged -> setState { copy(currency = event.value) }
            is TenantFormUiEvent.Submit -> if (isEditMode) updateTenant() else createTenant()
            is TenantFormUiEvent.ClearError -> setState { copy(error = null) }
        }
    }

    private fun loadTenant(id: String) {
        viewModelScope.launch {
            setState { copy(isLoading = true) }
            when (val result = getTenantByIdUseCase(id)) {
                is Result.Success -> {
                    val tenant = result.data
                    setState {
                        copy(
                            isLoading = false,
                            name = tenant.name,
                            contactEmail = tenant.contactEmail,
                            contactPhone = tenant.contactPhone ?: "",
                            address = tenant.address ?: "",
                            city = tenant.city ?: "",
                            state = tenant.state ?: "",
                            country = tenant.country,
                            postalCode = tenant.postalCode ?: "",
                            subscriptionTier = tenant.subscriptionTier,
                            timezone = tenant.timezone,
                            locale = tenant.locale,
                            currency = tenant.currency
                        )
                    }
                }
                is Result.Error -> setState {
                    copy(isLoading = false, error = result.message ?: "Failed to load tenant")
                }
                is Result.Loading -> {}
            }
        }
    }

    private fun createTenant() {
        if (!validate()) return

        viewModelScope.launch {
            setState { copy(isSaving = true, error = null) }

            val request = CreateTenantRequest(
                name = uiState.value.name,
                contactEmail = uiState.value.contactEmail,
                contactPhone = uiState.value.contactPhone.ifBlank { null },
                address = uiState.value.address.ifBlank { null },
                city = uiState.value.city.ifBlank { null },
                state = uiState.value.state.ifBlank { null },
                country = uiState.value.country,
                postalCode = uiState.value.postalCode.ifBlank { null },
                subscriptionTier = uiState.value.subscriptionTier.name,
                timezone = uiState.value.timezone,
                locale = uiState.value.locale,
                currency = uiState.value.currency
            )

            when (val result = createTenantUseCase(request)) {
                is Result.Success -> setState { copy(isSaving = false, success = true) }
                is Result.Error -> setState {
                    copy(isSaving = false, error = result.message ?: "Failed to create tenant")
                }
                is Result.Loading -> {}
            }
        }
    }

    private fun updateTenant() {
        if (!validate() || tenantId == null) return

        viewModelScope.launch {
            setState { copy(isSaving = true, error = null) }

            val request = UpdateTenantRequest(
                name = uiState.value.name,
                contactEmail = uiState.value.contactEmail,
                contactPhone = uiState.value.contactPhone.ifBlank { null },
                address = uiState.value.address.ifBlank { null },
                city = uiState.value.city.ifBlank { null },
                state = uiState.value.state.ifBlank { null },
                postalCode = uiState.value.postalCode.ifBlank { null }
            )

            when (val result = updateTenantUseCase(UpdateTenantUseCase.Params(tenantId, request))) {
                is Result.Success -> setState { copy(isSaving = false, success = true) }
                is Result.Error -> setState {
                    copy(isSaving = false, error = result.message ?: "Failed to update tenant")
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

        if (state.country.isBlank()) {
            setState { copy(countryError = "Country is required") }
            isValid = false
        }

        return isValid
    }
}

data class TenantFormUiState(
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val success: Boolean = false,
    val error: String? = null,
    val name: String = "",
    val nameError: String? = null,
    val contactEmail: String = "",
    val contactEmailError: String? = null,
    val contactPhone: String = "",
    val address: String = "",
    val city: String = "",
    val state: String = "",
    val country: String = "United States",
    val countryError: String? = null,
    val postalCode: String = "",
    val subscriptionTier: SubscriptionTier = SubscriptionTier.FREE,
    val timezone: String = "UTC",
    val locale: String = "en_US",
    val currency: String = "USD"
) : UiState

sealed interface TenantFormUiEvent : UiEvent {
    data class NameChanged(val value: String) : TenantFormUiEvent
    data class ContactEmailChanged(val value: String) : TenantFormUiEvent
    data class ContactPhoneChanged(val value: String) : TenantFormUiEvent
    data class AddressChanged(val value: String) : TenantFormUiEvent
    data class CityChanged(val value: String) : TenantFormUiEvent
    data class StateChanged(val value: String) : TenantFormUiEvent
    data class CountryChanged(val value: String) : TenantFormUiEvent
    data class PostalCodeChanged(val value: String) : TenantFormUiEvent
    data class SubscriptionTierChanged(val value: SubscriptionTier) : TenantFormUiEvent
    data class TimezoneChanged(val value: String) : TenantFormUiEvent
    data class LocaleChanged(val value: String) : TenantFormUiEvent
    data class CurrencyChanged(val value: String) : TenantFormUiEvent
    data object Submit : TenantFormUiEvent
    data object ClearError : TenantFormUiEvent
}
