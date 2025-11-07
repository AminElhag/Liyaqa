package com.liyaqa.liyaqa_internal_app.features.employee.domain.usecase

import com.liyaqa.liyaqa_internal_app.core.domain.BaseUseCase
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.employee.data.repository.EmployeeRepository
import com.liyaqa.liyaqa_internal_app.features.employee.domain.model.Employee

/**
 * Use case for fetching employee by ID
 */
class GetEmployeeByIdUseCase(
    private val repository: EmployeeRepository
) : BaseUseCase<String, Employee>() {

    override suspend fun execute(params: String): Result<Employee> {
        if (params.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Employee ID cannot be empty"),
                "Invalid employee ID"
            )
        }

        return repository.getEmployeeById(params)
    }
}
