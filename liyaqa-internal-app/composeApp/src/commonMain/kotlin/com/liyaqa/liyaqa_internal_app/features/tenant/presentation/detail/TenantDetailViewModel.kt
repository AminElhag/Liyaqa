package com.liyaqa.liyaqa_internal_app.features.tenant.presentation.detail

import androidx.lifecycle.viewModelScope
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.core.presentation.BaseViewModel
import com.liyaqa.liyaqa_internal_app.core.presentation.UiEvent
import com.liyaqa.liyaqa_internal_app.core.presentation.UiState
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.model.Tenant
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.usecase.GetTenantByIdUseCase
import kotlinx.coroutines.launch

/**
 * ViewModel for Tenant Detail Screen.
 * Loads and displays comprehensive tenant information.
 */
class TenantDetailViewModel(
    private val getTenantByIdUseCase: GetTenantByIdUseCase,
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
}

/**
 * UI State for Tenant Detail Screen
 */
data class TenantDetailUiState(
    val isLoading: Boolean = false,
    val tenant: Tenant? = null,
    val error: String? = null
) : UiState

/**
 * UI Events for Tenant Detail Screen
 */
sealed interface TenantDetailUiEvent : UiEvent {
    data object Refresh : TenantDetailUiEvent
    data object ClearError : TenantDetailUiEvent
}
