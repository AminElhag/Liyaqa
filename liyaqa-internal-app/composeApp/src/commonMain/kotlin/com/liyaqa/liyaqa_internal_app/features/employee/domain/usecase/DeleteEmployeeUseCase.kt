package com.liyaqa.liyaqa_internal_app.features.employee.domain.usecase

import com.liyaqa.liyaqa_internal_app.core.domain.BaseUseCase
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.employee.data.repository.EmployeeRepository

/**
 * Use case for deleting an employee
 */
class DeleteEmployeeUseCase(
    private val repository: EmployeeRepository
) : BaseUseCase<String, Unit>() {

    override suspend fun execute(params: String): Result<Unit> {
        if (params.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Employee ID cannot be empty"),
                "Invalid employee ID"
            )
        }

        return repository.deleteEmployee(params)
    }
}
