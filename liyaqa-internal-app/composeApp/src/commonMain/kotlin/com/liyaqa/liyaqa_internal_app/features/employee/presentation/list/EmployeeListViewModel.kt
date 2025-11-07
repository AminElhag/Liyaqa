package com.liyaqa.liyaqa_internal_app.features.employee.presentation.list

import androidx.lifecycle.viewModelScope
import com.liyaqa.liyaqa_internal_app.core.presentation.BaseViewModel
import com.liyaqa.liyaqa_internal_app.core.presentation.UiEvent
import com.liyaqa.liyaqa_internal_app.core.presentation.UiState
import com.liyaqa.liyaqa_internal_app.features.employee.data.dto.toDomain
import com.liyaqa.liyaqa_internal_app.features.employee.domain.model.Employee
import com.liyaqa.liyaqa_internal_app.features.employee.domain.model.EmployeeStatus
import com.liyaqa.liyaqa_internal_app.features.employee.domain.usecase.DeleteEmployeeUseCase
import com.liyaqa.liyaqa_internal_app.features.employee.domain.usecase.GetEmployeesUseCase
import kotlinx.coroutines.launch

/**
 * ViewModel for Employee List screen
 */
class EmployeeListViewModel(
    private val getEmployeesUseCase: GetEmployeesUseCase,
    private val deleteEmployeeUseCase: DeleteEmployeeUseCase
) : BaseViewModel<EmployeeListUiState, EmployeeListUiEvent>() {

    override fun initialState() = EmployeeListUiState()

    init {
        loadEmployees()
    }

    override fun onEvent(event: EmployeeListUiEvent) {
        when (event) {
            is EmployeeListUiEvent.SearchChanged -> {
                setState { copy(searchQuery = event.query) }
            }
            is EmployeeListUiEvent.StatusFilterChanged -> {
                setState { copy(statusFilter = event.status) }
                loadEmployees()
            }
            is EmployeeListUiEvent.DepartmentFilterChanged -> {
                setState { copy(departmentFilter = event.department) }
                loadEmployees()
            }
            is EmployeeListUiEvent.SearchSubmitted -> {
                loadEmployees()
            }
            is EmployeeListUiEvent.Refresh -> {
                loadEmployees()
            }
            is EmployeeListUiEvent.LoadMore -> {
                if (!currentState.isLoadingMore && !currentState.isLastPage) {
                    loadEmployees(currentState.currentPage + 1, append = true)
                }
            }
            is EmployeeListUiEvent.DeleteEmployee -> {
                deleteEmployee(event.employeeId)
            }
            is EmployeeListUiEvent.ClearError -> {
                setState { copy(error = null) }
            }
        }
    }

    private fun loadEmployees(page: Int = 0, append: Boolean = false) {
        viewModelScope.launch {
            setState {
                copy(
                    isLoading = !append,
                    isLoadingMore = append,
                    error = null
                )
            }

            val result = getEmployeesUseCase(
                GetEmployeesUseCase.Params(
                    page = page,
                    size = 20,
                    searchTerm = currentState.searchQuery.ifBlank { null },
                    status = currentState.statusFilter?.name,
                    department = currentState.departmentFilter
                )
            )

            handleResult(
                result = result,
                onSuccess = { response ->
                    val newEmployees = response.content.map { it.toDomain() }
                    setState {
                        copy(
                            employees = if (append) employees + newEmployees else newEmployees,
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
                            error = error.message ?: "Failed to load employees"
                        )
                    }
                }
            )
        }
    }

    private fun deleteEmployee(employeeId: String) {
        viewModelScope.launch {
            setState { copy(deletingEmployeeId = employeeId) }

            val result = deleteEmployeeUseCase(employeeId)

            handleResult(
                result = result,
                onSuccess = {
                    setState {
                        copy(
                            employees = employees.filterNot { it.id == employeeId },
                            deletingEmployeeId = null,
                            totalElements = totalElements - 1
                        )
                    }
                },
                onError = { error ->
                    setState {
                        copy(
                            deletingEmployeeId = null,
                            error = error.message ?: "Failed to delete employee"
                        )
                    }
                }
            )
        }
    }
}

/**
 * UI State for Employee List
 */
data class EmployeeListUiState(
    val employees: List<Employee> = emptyList(),
    val searchQuery: String = "",
    val statusFilter: EmployeeStatus? = null,
    val departmentFilter: String? = null,
    val isLoading: Boolean = false,
    val isLoadingMore: Boolean = false,
    val currentPage: Int = 0,
    val totalPages: Int = 0,
    val totalElements: Long = 0,
    val isLastPage: Boolean = false,
    val deletingEmployeeId: String? = null,
    val error: String? = null
) : UiState

/**
 * UI Events for Employee List
 */
sealed class EmployeeListUiEvent : UiEvent {
    data class SearchChanged(val query: String) : EmployeeListUiEvent()
    data class StatusFilterChanged(val status: EmployeeStatus?) : EmployeeListUiEvent()
    data class DepartmentFilterChanged(val department: String?) : EmployeeListUiEvent()
    data object SearchSubmitted : EmployeeListUiEvent()
    data object Refresh : EmployeeListUiEvent()
    data object LoadMore : EmployeeListUiEvent()
    data class DeleteEmployee(val employeeId: String) : EmployeeListUiEvent()
    data object ClearError : EmployeeListUiEvent()
}
