package com.liyaqa.liyaqa_internal_app.features.tenant.presentation.list

import androidx.lifecycle.viewModelScope
import com.liyaqa.liyaqa_internal_app.core.presentation.BaseViewModel
import com.liyaqa.liyaqa_internal_app.core.presentation.UiEvent
import com.liyaqa.liyaqa_internal_app.core.presentation.UiState
import com.liyaqa.liyaqa_internal_app.features.tenant.data.dto.toDomain
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.model.Tenant
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.model.TenantStatus
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.usecase.DeleteTenantUseCase
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.usecase.GetTenantsUseCase
import kotlinx.coroutines.launch

class TenantListViewModel(
    private val getTenantsUseCase: GetTenantsUseCase,
    private val deleteTenantUseCase: DeleteTenantUseCase
) : BaseViewModel<TenantListUiState, TenantListUiEvent>() {

    override fun initialState() = TenantListUiState()

    init {
        loadTenants()
    }

    override fun onEvent(event: TenantListUiEvent) {
        when (event) {
            is TenantListUiEvent.SearchChanged -> setState { copy(searchQuery = event.query) }
            is TenantListUiEvent.StatusFilterChanged -> {
                setState { copy(statusFilter = event.status) }
                loadTenants()
            }
            is TenantListUiEvent.SearchSubmitted -> loadTenants()
            is TenantListUiEvent.Refresh -> loadTenants()
            is TenantListUiEvent.LoadMore -> {
                if (!currentState.isLoadingMore && !currentState.isLastPage) {
                    loadTenants(currentState.currentPage + 1, append = true)
                }
            }
            is TenantListUiEvent.DeleteTenant -> deleteTenant(event.tenantId)
            is TenantListUiEvent.ClearError -> setState { copy(error = null) }
        }
    }

    private fun loadTenants(page: Int = 0, append: Boolean = false) {
        viewModelScope.launch {
            setState { copy(isLoading = !append, isLoadingMore = append, error = null) }

            val result = getTenantsUseCase(
                GetTenantsUseCase.Params(
                    page = page,
                    size = 20,
                    searchTerm = currentState.searchQuery.ifBlank { null },
                    status = currentState.statusFilter?.name
                )
            )

            handleResult(
                result = result,
                onSuccess = { response ->
                    val newTenants = response.content.map { it.toDomain() }
                    setState {
                        copy(
                            tenants = if (append) tenants + newTenants else newTenants,
                            isLoading = false,
                            isLoadingMore = false,
                            currentPage = response.number,
                            totalPages = response.totalPages,
                            totalElements = response.totalElements,
                            isLastPage = response.last
                        )
                    }
                },
                onError = { error ->
                    setState {
                        copy(
                            isLoading = false,
                            isLoadingMore = false,
                            error = error.message ?: "Failed to load tenants"
                        )
                    }
                }
            )
        }
    }

    private fun deleteTenant(tenantId: String) {
        viewModelScope.launch {
            setState { copy(deletingTenantId = tenantId) }

            val result = deleteTenantUseCase(tenantId)

            handleResult(
                result = result,
                onSuccess = {
                    setState {
                        copy(
                            tenants = tenants.filterNot { it.id == tenantId },
                            deletingTenantId = null,
                            totalElements = totalElements - 1
                        )
                    }
                },
                onError = { error ->
                    setState {
                        copy(
                            deletingTenantId = null,
                            error = error.message ?: "Failed to delete tenant"
                        )
                    }
                }
            )
        }
    }
}

data class TenantListUiState(
    val tenants: List<Tenant> = emptyList(),
    val searchQuery: String = "",
    val statusFilter: TenantStatus? = null,
    val isLoading: Boolean = false,
    val isLoadingMore: Boolean = false,
    val currentPage: Int = 0,
    val totalPages: Int = 0,
    val totalElements: Long = 0,
    val isLastPage: Boolean = false,
    val deletingTenantId: String? = null,
    val error: String? = null
) : UiState

sealed class TenantListUiEvent : UiEvent {
    data class SearchChanged(val query: String) : TenantListUiEvent()
    data class StatusFilterChanged(val status: TenantStatus?) : TenantListUiEvent()
    data object SearchSubmitted : TenantListUiEvent()
    data object Refresh : TenantListUiEvent()
    data object LoadMore : TenantListUiEvent()
    data class DeleteTenant(val tenantId: String) : TenantListUiEvent()
    data object ClearError : TenantListUiEvent()
}
