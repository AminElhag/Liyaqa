package com.liyaqa.liyaqa_internal_app.features.employee.presentation.detail

import androidx.lifecycle.viewModelScope
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.core.presentation.BaseViewModel
import com.liyaqa.liyaqa_internal_app.core.presentation.UiEvent
import com.liyaqa.liyaqa_internal_app.core.presentation.UiState
import com.liyaqa.liyaqa_internal_app.features.employee.domain.model.Employee
import com.liyaqa.liyaqa_internal_app.features.employee.domain.usecase.GetEmployeeByIdUseCase
import kotlinx.coroutines.launch

/**
 * ViewModel for Employee Detail Screen.
 * Loads and displays comprehensive employee information.
 */
class EmployeeDetailViewModel(
    private val getEmployeeByIdUseCase: GetEmployeeByIdUseCase,
    private val employeeId: String
) : BaseViewModel<EmployeeDetailUiState, EmployeeDetailUiEvent>() {

    override fun initialState(): EmployeeDetailUiState = EmployeeDetailUiState()

    init {
        loadEmployeeDetails()
    }

    override fun onEvent(event: EmployeeDetailUiEvent) {
        when (event) {
            is EmployeeDetailUiEvent.Refresh -> loadEmployeeDetails()
            is EmployeeDetailUiEvent.ClearError -> setState { copy(error = null) }
        }
    }

    private fun loadEmployeeDetails() {
        viewModelScope.launch {
            setState { copy(isLoading = true, error = null) }

            when (val result = getEmployeeByIdUseCase(employeeId)) {
                is Result.Success -> {
                    setState {
                        copy(
                            isLoading = false,
                            employee = result.data,
                            error = null
                        )
                    }
                }

                is Result.Error -> {
                    setState {
                        copy(
                            isLoading = false,
                            error = result.message ?: "Failed to load employee details"
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
 * UI State for Employee Detail Screen
 */
data class EmployeeDetailUiState(
    val isLoading: Boolean = false,
    val employee: Employee? = null,
    val error: String? = null
) : UiState

/**
 * UI Events for Employee Detail Screen
 */
sealed interface EmployeeDetailUiEvent : UiEvent {
    data object Refresh : EmployeeDetailUiEvent
    data object ClearError : EmployeeDetailUiEvent
}
