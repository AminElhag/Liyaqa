package com.liyaqa.liyaqa_internal_app.features.employee.domain.usecase

import com.liyaqa.liyaqa_internal_app.core.domain.BaseUseCase
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.employee.data.dto.CreateEmployeeRequest
import com.liyaqa.liyaqa_internal_app.features.employee.data.repository.EmployeeRepository
import com.liyaqa.liyaqa_internal_app.features.employee.domain.model.Employee

/**
 * Use case for creating a new employee
 */
class CreateEmployeeUseCase(
    private val repository: EmployeeRepository
) : BaseUseCase<CreateEmployeeRequest, Employee>() {

    override suspend fun execute(params: CreateEmployeeRequest): Result<Employee> {
        // Validation
        if (params.email.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Email cannot be empty"),
                "Email is required"
            )
        }

        if (!params.email.contains("@")) {
            return Result.Error(
                IllegalArgumentException("Invalid email format"),
                "Please enter a valid email address"
            )
        }

        if (params.firstName.isBlank()) {
            return Result.Error(
                IllegalArgumentException("First name cannot be empty"),
                "First name is required"
            )
        }

        if (params.lastName.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Last name cannot be empty"),
                "Last name is required"
            )
        }

        if (params.password.length < 8) {
            return Result.Error(
                IllegalArgumentException("Password too short"),
                "Password must be at least 8 characters"
            )
        }

        return repository.createEmployee(params)
    }
}
