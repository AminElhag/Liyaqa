package com.liyaqa.liyaqa_internal_app.features.employee.domain.usecase

import com.liyaqa.liyaqa_internal_app.core.domain.BaseUseCase
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.employee.data.dto.UpdateEmployeeRequest
import com.liyaqa.liyaqa_internal_app.features.employee.data.repository.EmployeeRepository
import com.liyaqa.liyaqa_internal_app.features.employee.domain.model.Employee

/**
 * Use case for updating an existing employee
 */
class UpdateEmployeeUseCase(
    private val repository: EmployeeRepository
) : BaseUseCase<UpdateEmployeeUseCase.Params, Employee>() {

    data class Params(val id: String, val request: UpdateEmployeeRequest)

    override suspend fun execute(params: Params): Result<Employee> {
        if (params.id.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Employee ID cannot be empty"),
                "Invalid employee ID"
            )
        }

        return repository.updateEmployee(params.id, params.request)
    }
}
