package com.liyaqa.liyaqa_internal_app.features.tenant.presentation.detail

import androidx.lifecycle.viewModelScope
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.core.presentation.BaseViewModel
import com.liyaqa.liyaqa_internal_app.core.presentation.UiEvent
import com.liyaqa.liyaqa_internal_app.core.presentation.UiState
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.model.Tenant
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.usecase.GetTenantByIdUseCase
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.usecase.SuspendTenantUseCase
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.usecase.ReactivateTenantUseCase
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.usecase.ChangeTenantPlanUseCase
import kotlinx.coroutines.launch

/**
 * ViewModel for Tenant Detail Screen.
 * Loads and displays comprehensive tenant information.
 */
class TenantDetailViewModel(
    private val getTenantByIdUseCase: GetTenantByIdUseCase,
    private val suspendTenantUseCase: SuspendTenantUseCase,
    private val reactivateTenantUseCase: ReactivateTenantUseCase,
    private val changeTenantPlanUseCase: ChangeTenantPlanUseCase,
    private val tenantId: String
) : BaseViewModel<TenantDetailUiState, TenantDetailUiEvent>() {

    override fun initialState(): TenantDetailUiState = TenantDetailUiState()

    init {
        loadTenantDetails()
    }

    override fun onEvent(event: TenantDetailUiEvent) {
        when (event) {
            is TenantDetailUiEvent.Refresh -> loadTenantDetails()
            is TenantDetailUiEvent.ClearError -> setState { copy(error = null) }
            is TenantDetailUiEvent.SuspendTenant -> suspendTenant()
            is TenantDetailUiEvent.ReactivateTenant -> reactivateTenant()
            is TenantDetailUiEvent.ChangePlan -> changePlan(event.newTier)
        }
    }

    private fun loadTenantDetails() {
        viewModelScope.launch {
            setState { copy(isLoading = true, error = null) }

            when (val result = getTenantByIdUseCase(tenantId)) {
                is Result.Success -> {
                    setState {
                        copy(
                            isLoading = false,
                            tenant = result.data,
                            error = null
                        )
                    }
                }

                is Result.Error -> {
                    setState {
                        copy(
                            isLoading = false,
                            error = result.message ?: "Failed to load tenant details"
                        )
                    }
                }

                is Result.Loading -> {
                    // Already handled
                }
            }
        }
    }

    private fun suspendTenant() {
        viewModelScope.launch {
            setState { copy(isProcessing = true, error = null) }
            handleResult(
                result = suspendTenantUseCase(tenantId),
                onSuccess = { updatedTenant ->
                    setState { copy(isProcessing = false, tenant = updatedTenant) }
                },
                onError = { error ->
                    setState { copy(isProcessing = false, error = error.message ?: "Failed to suspend tenant") }
                }
            )
        }
    }

    private fun reactivateTenant() {
        viewModelScope.launch {
            setState { copy(isProcessing = true, error = null) }
            handleResult(
                result = reactivateTenantUseCase(tenantId),
                onSuccess = { updatedTenant ->
                    setState { copy(isProcessing = false, tenant = updatedTenant) }
                },
                onError = { error ->
                    setState { copy(isProcessing = false, error = error.message ?: "Failed to reactivate tenant") }
                }
            )
        }
    }

    private fun changePlan(newTier: String) {
        viewModelScope.launch {
            setState { copy(isProcessing = true, error = null) }
            handleResult(
                result = changeTenantPlanUseCase(ChangeTenantPlanUseCase.Params(tenantId, newTier)),
                onSuccess = { updatedTenant ->
                    setState { copy(isProcessing = false, tenant = updatedTenant) }
                },
                onError = { error ->
                    setState { copy(isProcessing = false, error = error.message ?: "Failed to change plan") }
                }
            )
        }
    }
}

/**
 * UI State for Tenant Detail Screen
 */
data class TenantDetailUiState(
    val isLoading: Boolean = false,
    val isProcessing: Boolean = false,
    val tenant: Tenant? = null,
    val error: String? = null
) : UiState

/**
 * UI Events for Tenant Detail Screen
 */
sealed interface TenantDetailUiEvent : UiEvent {
    data object Refresh : TenantDetailUiEvent
    data object ClearError : TenantDetailUiEvent
    data object SuspendTenant : TenantDetailUiEvent
    data object ReactivateTenant : TenantDetailUiEvent
    data class ChangePlan(val newTier: String) : TenantDetailUiEvent
}
