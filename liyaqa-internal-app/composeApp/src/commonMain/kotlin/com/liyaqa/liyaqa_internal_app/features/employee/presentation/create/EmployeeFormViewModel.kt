package com.liyaqa.liyaqa_internal_app.features.employee.presentation.create

import androidx.lifecycle.viewModelScope
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.core.presentation.BaseViewModel
import com.liyaqa.liyaqa_internal_app.core.presentation.UiEvent
import com.liyaqa.liyaqa_internal_app.core.presentation.UiState
import com.liyaqa.liyaqa_internal_app.features.employee.data.dto.CreateEmployeeRequest
import com.liyaqa.liyaqa_internal_app.features.employee.data.dto.UpdateEmployeeRequest
import com.liyaqa.liyaqa_internal_app.features.employee.domain.model.EmployeeGroup
import com.liyaqa.liyaqa_internal_app.features.employee.domain.usecase.CreateEmployeeUseCase
import com.liyaqa.liyaqa_internal_app.features.employee.domain.usecase.GetEmployeeByIdUseCase
import com.liyaqa.liyaqa_internal_app.features.employee.domain.usecase.UpdateEmployeeUseCase
import com.liyaqa.liyaqa_internal_app.features.employee.data.repository.EmployeeRepository
import kotlinx.coroutines.launch

/**
 * ViewModel for Employee Create/Edit form.
 * Follows TenantFormViewModel pattern.
 * Supports both Create and Edit modes based on employeeId parameter.
 */
class EmployeeFormViewModel(
    private val createEmployeeUseCase: CreateEmployeeUseCase,
    private val updateEmployeeUseCase: UpdateEmployeeUseCase,
    private val getEmployeeByIdUseCase: GetEmployeeByIdUseCase,
    private val employeeRepository: EmployeeRepository,
    private val employeeId: String? = null
) : BaseViewModel<EmployeeFormUiState, EmployeeFormUiEvent>() {

    override fun initialState() = EmployeeFormUiState()

    val isEditMode = employeeId != null

    init {
        loadEmployeeGroups()
        if (employeeId != null) {
            loadEmployee(employeeId)
        }
    }

    override fun onEvent(event: EmployeeFormUiEvent) {
        when (event) {
            is EmployeeFormUiEvent.EmailChanged -> setState {
                copy(email = event.value, emailError = null)
            }
            is EmployeeFormUiEvent.FirstNameChanged -> setState {
                copy(firstName = event.value, firstNameError = null)
            }
            is EmployeeFormUiEvent.LastNameChanged -> setState {
                copy(lastName = event.value, lastNameError = null)
            }
            is EmployeeFormUiEvent.PasswordChanged -> setState {
                copy(password = event.value, passwordError = null)
            }
            is EmployeeFormUiEvent.PhoneNumberChanged -> setState {
                copy(phoneNumber = event.value)
            }
            is EmployeeFormUiEvent.DepartmentChanged -> setState {
                copy(department = event.value)
            }
            is EmployeeFormUiEvent.JobTitleChanged -> setState {
                copy(jobTitle = event.value)
            }
            is EmployeeFormUiEvent.HireDateChanged -> setState {
                copy(hireDate = event.value)
            }
            is EmployeeFormUiEvent.LocaleChanged -> setState {
                copy(locale = event.value)
            }
            is EmployeeFormUiEvent.TimezoneChanged -> setState {
                copy(timezone = event.value)
            }
            is EmployeeFormUiEvent.GroupIdsChanged -> setState {
                copy(selectedGroupIds = event.value)
            }
            is EmployeeFormUiEvent.TogglePasswordVisibility -> setState {
                copy(isPasswordVisible = !uiState.value.isPasswordVisible)
            }
            is EmployeeFormUiEvent.Submit -> if (isEditMode) updateEmployee() else createEmployee()
            is EmployeeFormUiEvent.ClearError -> setState { copy(error = null) }
        }
    }

    private fun loadEmployeeGroups() {
        viewModelScope.launch {
            setState { copy(isLoadingGroups = true) }
            when (val result = employeeRepository.getEmployeeGroups()) {
                is Result.Success -> setState {
                    copy(
                        isLoadingGroups = false,
                        availableGroups = result.data
                    )
                }
                is Result.Error -> setState {
                    copy(
                        isLoadingGroups = false,
                        error = result.message ?: "Failed to load employee groups"
                    )
                }
                is Result.Loading -> {}
            }
        }
    }

    private fun loadEmployee(id: String) {
        viewModelScope.launch {
            setState { copy(isLoading = true) }
            when (val result = getEmployeeByIdUseCase(id)) {
                is Result.Success -> {
                    val employee = result.data
                    setState {
                        copy(
                            isLoading = false,
                            email = employee.email,
                            firstName = employee.firstName,
                            lastName = employee.lastName,
                            phoneNumber = employee.phoneNumber ?: "",
                            department = employee.department ?: "",
                            jobTitle = employee.jobTitle ?: "",
                            hireDate = employee.hireDate ?: "",
                            locale = employee.locale,
                            timezone = employee.timezone,
                            selectedGroupIds = employee.groups.map { it.id }
                        )
                    }
                }
                is Result.Error -> setState {
                    copy(isLoading = false, error = result.message ?: "Failed to load employee")
                }
                is Result.Loading -> {}
            }
        }
    }

    private fun createEmployee() {
        if (!validate()) return

        viewModelScope.launch {
            setState { copy(isSaving = true, error = null) }

            val request = CreateEmployeeRequest(
                email = uiState.value.email,
                firstName = uiState.value.firstName,
                lastName = uiState.value.lastName,
                password = uiState.value.password,
                phoneNumber = uiState.value.phoneNumber.ifBlank { null },
                department = uiState.value.department.ifBlank { null },
                jobTitle = uiState.value.jobTitle.ifBlank { null },
                hireDate = uiState.value.hireDate.ifBlank { null },
                locale = uiState.value.locale,
                timezone = uiState.value.timezone,
                groupIds = uiState.value.selectedGroupIds
            )

            when (val result = createEmployeeUseCase(request)) {
                is Result.Success -> setState { copy(isSaving = false, success = true) }
                is Result.Error -> setState {
                    copy(isSaving = false, error = result.message ?: "Failed to create employee")
                }
                is Result.Loading -> {}
            }
        }
    }

    private fun updateEmployee() {
        if (!validateForUpdate() || employeeId == null) return

        viewModelScope.launch {
            setState { copy(isSaving = true, error = null) }

            val request = UpdateEmployeeRequest(
                firstName = uiState.value.firstName,
                lastName = uiState.value.lastName,
                phoneNumber = uiState.value.phoneNumber.ifBlank { null },
                department = uiState.value.department.ifBlank { null },
                jobTitle = uiState.value.jobTitle.ifBlank { null },
                locale = uiState.value.locale,
                timezone = uiState.value.timezone
            )

            when (val result = updateEmployeeUseCase(UpdateEmployeeUseCase.Params(employeeId, request))) {
                is Result.Success -> {
                    // If groups have changed, update them separately
                    if (hasGroupsChanged(result.data.groups.map { it.id })) {
                        updateEmployeeGroups(employeeId)
                    } else {
                        setState { copy(isSaving = false, success = true) }
                    }
                }
                is Result.Error -> setState {
                    copy(isSaving = false, error = result.message ?: "Failed to update employee")
                }
                is Result.Loading -> {}
            }
        }
    }

    private fun updateEmployeeGroups(id: String) {
        viewModelScope.launch {
            when (val result = employeeRepository.assignGroups(id, uiState.value.selectedGroupIds)) {
                is Result.Success -> setState { copy(isSaving = false, success = true) }
                is Result.Error -> setState {
                    copy(isSaving = false, error = result.message ?: "Failed to update employee groups")
                }
                is Result.Loading -> {}
            }
        }
    }

    private fun hasGroupsChanged(currentGroupIds: List<String>): Boolean {
        val selected = uiState.value.selectedGroupIds.toSet()
        val current = currentGroupIds.toSet()
        return selected != current
    }

    private fun validate(): Boolean {
        val state = uiState.value
        var isValid = true

        // Email validation
        if (state.email.isBlank()) {
            setState { copy(emailError = "Email is required") }
            isValid = false
        } else if (!state.email.contains("@")) {
            setState { copy(emailError = "Invalid email format") }
            isValid = false
        }

        // First name validation
        if (state.firstName.isBlank()) {
            setState { copy(firstNameError = "First name is required") }
            isValid = false
        }

        // Last name validation
        if (state.lastName.isBlank()) {
            setState { copy(lastNameError = "Last name is required") }
            isValid = false
        }

        // Password validation (only for create mode)
        if (!isEditMode) {
            if (state.password.isBlank()) {
                setState { copy(passwordError = "Password is required") }
                isValid = false
            } else if (state.password.length < 8) {
                setState { copy(passwordError = "Password must be at least 8 characters") }
                isValid = false
            }
        }

        return isValid
    }

    private fun validateForUpdate(): Boolean {
        val state = uiState.value
        var isValid = true

        // First name validation
        if (state.firstName.isBlank()) {
            setState { copy(firstNameError = "First name is required") }
            isValid = false
        }

        // Last name validation
        if (state.lastName.isBlank()) {
            setState { copy(lastNameError = "Last name is required") }
            isValid = false
        }

        return isValid
    }
}

/**
 * UI State for Employee Form
 */
data class EmployeeFormUiState(
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val isLoadingGroups: Boolean = false,
    val success: Boolean = false,
    val error: String? = null,

    // Form fields
    val email: String = "",
    val emailError: String? = null,
    val firstName: String = "",
    val firstNameError: String? = null,
    val lastName: String = "",
    val lastNameError: String? = null,
    val password: String = "",
    val passwordError: String? = null,
    val isPasswordVisible: Boolean = false,
    val phoneNumber: String = "",
    val department: String = "",
    val jobTitle: String = "",
    val hireDate: String = "",
    val locale: String = "en_US",
    val timezone: String = "UTC",

    // Groups
    val selectedGroupIds: List<String> = emptyList(),
    val availableGroups: List<EmployeeGroup> = emptyList()
) : UiState

/**
 * UI Events for Employee Form
 */
sealed interface EmployeeFormUiEvent : UiEvent {
    data class EmailChanged(val value: String) : EmployeeFormUiEvent
    data class FirstNameChanged(val value: String) : EmployeeFormUiEvent
    data class LastNameChanged(val value: String) : EmployeeFormUiEvent
    data class PasswordChanged(val value: String) : EmployeeFormUiEvent
    data class PhoneNumberChanged(val value: String) : EmployeeFormUiEvent
    data class DepartmentChanged(val value: String) : EmployeeFormUiEvent
    data class JobTitleChanged(val value: String) : EmployeeFormUiEvent
    data class HireDateChanged(val value: String) : EmployeeFormUiEvent
    data class LocaleChanged(val value: String) : EmployeeFormUiEvent
    data class TimezoneChanged(val value: String) : EmployeeFormUiEvent
    data class GroupIdsChanged(val value: List<String>) : EmployeeFormUiEvent
    data object TogglePasswordVisibility : EmployeeFormUiEvent
    data object Submit : EmployeeFormUiEvent
    data object ClearError : EmployeeFormUiEvent
}
