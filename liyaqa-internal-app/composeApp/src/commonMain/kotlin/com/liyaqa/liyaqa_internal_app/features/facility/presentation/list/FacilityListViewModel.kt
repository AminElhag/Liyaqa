package com.liyaqa.liyaqa_internal_app.features.facility.presentation.list

import androidx.lifecycle.viewModelScope
import com.liyaqa.liyaqa_internal_app.core.presentation.BaseViewModel
import com.liyaqa.liyaqa_internal_app.core.presentation.UiEvent
import com.liyaqa.liyaqa_internal_app.core.presentation.UiState
import com.liyaqa.liyaqa_internal_app.features.facility.data.dto.toDomain
import com.liyaqa.liyaqa_internal_app.features.facility.domain.model.Facility
import com.liyaqa.liyaqa_internal_app.features.facility.domain.model.FacilityStatus
import com.liyaqa.liyaqa_internal_app.features.facility.domain.usecase.DeleteFacilityUseCase
import com.liyaqa.liyaqa_internal_app.features.facility.domain.usecase.GetFacilitiesUseCase
import kotlinx.coroutines.launch

class FacilityListViewModel(
    private val getFacilitiesUseCase: GetFacilitiesUseCase,
    private val deleteFacilityUseCase: DeleteFacilityUseCase
) : BaseViewModel<FacilityListUiState, FacilityListUiEvent>() {

    override fun initialState() = FacilityListUiState()

    init {
        loadFacilities()
    }

    override fun onEvent(event: FacilityListUiEvent) {
        when (event) {
            is FacilityListUiEvent.SearchChanged -> setState { copy(searchQuery = event.query) }
            is FacilityListUiEvent.StatusFilterChanged -> {
                setState { copy(statusFilter = event.status) }
                loadFacilities()
            }
            is FacilityListUiEvent.SearchSubmitted -> loadFacilities()
            is FacilityListUiEvent.Refresh -> loadFacilities()
            is FacilityListUiEvent.LoadMore -> {
                if (!currentState.isLoadingMore && !currentState.isLastPage) {
                    loadFacilities(currentState.currentPage + 1, append = true)
                }
            }
            is FacilityListUiEvent.DeleteFacility -> deleteFacility(event.facilityId)
            is FacilityListUiEvent.ClearError -> setState { copy(error = null) }
        }
    }

    private fun loadFacilities(page: Int = 0, append: Boolean = false) {
        viewModelScope.launch {
            setState { copy(isLoading = !append, isLoadingMore = append, error = null) }

            val result = getFacilitiesUseCase(
                GetFacilitiesUseCase.Params(
                    page = page,
                    size = 20,
                    searchTerm = currentState.searchQuery.ifBlank { null },
                    status = currentState.statusFilter?.name
                )
            )

            handleResult(
                result = result,
                onSuccess = { response ->
                    val newFacilities = response.content.map { it.toDomain() }
                    setState {
                        copy(
                            facilities = if (append) facilities + newFacilities else newFacilities,
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
                            error = error.message ?: "Failed to load facilities"
                        )
                    }
                }
            )
        }
    }

    private fun deleteFacility(facilityId: String) {
        viewModelScope.launch {
            setState { copy(deletingFacilityId = facilityId) }

            val result = deleteFacilityUseCase(facilityId)

            handleResult(
                result = result,
                onSuccess = {
                    setState {
                        copy(
                            facilities = facilities.filterNot { it.id == facilityId },
                            deletingFacilityId = null,
                            totalElements = totalElements - 1
                        )
                    }
                },
                onError = { error ->
                    setState {
                        copy(
                            deletingFacilityId = null,
                            error = error.message ?: "Failed to delete facility"
                        )
                    }
                }
            )
        }
    }
}

data class FacilityListUiState(
    val facilities: List<Facility> = emptyList(),
    val searchQuery: String = "",
    val statusFilter: FacilityStatus? = null,
    val isLoading: Boolean = false,
    val isLoadingMore: Boolean = false,
    val currentPage: Int = 0,
    val totalPages: Int = 0,
    val totalElements: Long = 0,
    val isLastPage: Boolean = false,
    val deletingFacilityId: String? = null,
    val error: String? = null
) : UiState

sealed class FacilityListUiEvent : UiEvent {
    data class SearchChanged(val query: String) : FacilityListUiEvent()
    data class StatusFilterChanged(val status: FacilityStatus?) : FacilityListUiEvent()
    data object SearchSubmitted : FacilityListUiEvent()
    data object Refresh : FacilityListUiEvent()
    data object LoadMore : FacilityListUiEvent()
    data class DeleteFacility(val facilityId: String) : FacilityListUiEvent()
    data object ClearError : FacilityListUiEvent()
}
