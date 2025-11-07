package com.liyaqa.dashboard.features.employee.presentation.list

import androidx.lifecycle.viewModelScope
import com.liyaqa.dashboard.core.domain.Result
import com.liyaqa.dashboard.core.presentation.BaseViewModel
import com.liyaqa.dashboard.core.presentation.UiEvent
import com.liyaqa.dashboard.core.presentation.UiState
import com.liyaqa.dashboard.features.employee.data.dto.toDomain
import com.liyaqa.dashboard.features.employee.domain.model.EmployeeStatus
import com.liyaqa.dashboard.features.employee.domain.model.FacilityEmployee
import com.liyaqa.dashboard.features.employee.domain.usecase.DeleteFacilityEmployeeUseCase
import com.liyaqa.dashboard.features.employee.domain.usecase.GetFacilityEmployeesUseCase
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

data class FacilityEmployeeListUiState(
    val employees: List<FacilityEmployee> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val searchQuery: String = "",
    val selectedStatus: EmployeeStatus? = null,
    val currentPage: Int = 0,
    val totalPages: Int = 0,
    val hasMore: Boolean = false,
    val showDeleteDialog: Boolean = false,
    val employeeToDelete: FacilityEmployee? = null
) : UiState

sealed class FacilityEmployeeListUiEvent : UiEvent {
    data class SearchQueryChanged(val query: String) : FacilityEmployeeListUiEvent()
    data class StatusFilterChanged(val status: EmployeeStatus?) : FacilityEmployeeListUiEvent()
    data object LoadMore : FacilityEmployeeListUiEvent()
    data object Refresh : FacilityEmployeeListUiEvent()
    data class ShowDeleteDialog(val employee: FacilityEmployee) : FacilityEmployeeListUiEvent()
    data object HideDeleteDialog : FacilityEmployeeListUiEvent()
    data object ConfirmDelete : FacilityEmployeeListUiEvent()
    data object ClearError : FacilityEmployeeListUiEvent()
}

class FacilityEmployeeListViewModel(
    private val getFacilityEmployeesUseCase: GetFacilityEmployeesUseCase,
    private val deleteFacilityEmployeeUseCase: DeleteFacilityEmployeeUseCase
) : BaseViewModel<FacilityEmployeeListUiState, FacilityEmployeeListUiEvent>() {

    private var searchJob: Job? = null

    init {
        loadEmployees()
    }

    override fun initialState() = FacilityEmployeeListUiState()

    override fun onEvent(event: FacilityEmployeeListUiEvent) {
        when (event) {
            is FacilityEmployeeListUiEvent.SearchQueryChanged -> handleSearchQueryChanged(event.query)
            is FacilityEmployeeListUiEvent.StatusFilterChanged -> handleStatusFilterChanged(event.status)
            is FacilityEmployeeListUiEvent.LoadMore -> loadMore()
            is FacilityEmployeeListUiEvent.Refresh -> refresh()
            is FacilityEmployeeListUiEvent.ShowDeleteDialog -> showDeleteDialog(event.employee)
            is FacilityEmployeeListUiEvent.HideDeleteDialog -> hideDeleteDialog()
            is FacilityEmployeeListUiEvent.ConfirmDelete -> confirmDelete()
            is FacilityEmployeeListUiEvent.ClearError -> clearError()
        }
    }

    private fun handleSearchQueryChanged(query: String) {
        updateState { copy(searchQuery = query) }
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(300) // Debounce
            loadEmployees(reset = true)
        }
    }

    private fun handleStatusFilterChanged(status: EmployeeStatus?) {
        updateState { copy(selectedStatus = status) }
        loadEmployees(reset = true)
    }

    private fun loadMore() {
        val currentState = uiState.value
        if (!currentState.isLoading && currentState.hasMore) {
            loadEmployees(page = currentState.currentPage + 1)
        }
    }

    private fun refresh() {
        loadEmployees(reset = true)
    }

    private fun loadEmployees(page: Int = 0, reset: Boolean = false) {
        viewModelScope.launch {
            updateState { copy(isLoading = true, error = null) }

            val params = GetFacilityEmployeesUseCase.Params(
                page = page,
                size = 20,
                search = uiState.value.searchQuery.ifBlank { null },
                status = uiState.value.selectedStatus?.name
            )

            when (val result = getFacilityEmployeesUseCase(params)) {
                is Result.Success -> {
                    val data = result.data
                    updateState {
                        copy(
                            employees = if (reset) data.content.map { it.toDomain() }
                            else employees + data.content.map { it.toDomain() },
                            currentPage = data.page,
                            totalPages = data.totalPages,
                            hasMore = data.page < data.totalPages - 1,
                            isLoading = false
                        )
                    }
                }
                is Result.Error -> {
                    updateState {
                        copy(
                            isLoading = false,
                            error = result.message ?: "Failed to load employees"
                        )
                    }
                }
                is Result.Loading -> {
                    // Already handled above
                }
            }
        }
    }

    private fun showDeleteDialog(employee: FacilityEmployee) {
        updateState {
            copy(showDeleteDialog = true, employeeToDelete = employee)
        }
    }

    private fun hideDeleteDialog() {
        updateState {
            copy(showDeleteDialog = false, employeeToDelete = null)
        }
    }

    private fun confirmDelete() {
        val employee = uiState.value.employeeToDelete ?: return

        viewModelScope.launch {
            hideDeleteDialog()
            updateState { copy(isLoading = true, error = null) }

            when (val result = deleteFacilityEmployeeUseCase(DeleteFacilityEmployeeUseCase.Params(employee.id))) {
                is Result.Success -> {
                    updateState {
                        copy(
                            employees = employees.filter { it.id != employee.id },
                            isLoading = false
                        )
                    }
                }
                is Result.Error -> {
                    updateState {
                        copy(
                            isLoading = false,
                            error = result.message ?: "Failed to delete employee"
                        )
                    }
                }
                is Result.Loading -> {
                    // Already handled above
                }
            }
        }
    }

    private fun clearError() {
        updateState { copy(error = null) }
    }
}
