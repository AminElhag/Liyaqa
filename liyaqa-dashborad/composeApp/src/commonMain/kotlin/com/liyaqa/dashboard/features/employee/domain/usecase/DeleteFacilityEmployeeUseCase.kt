package com.liyaqa.dashboard.features.employee.domain.usecase

import com.liyaqa.dashboard.core.domain.BaseUseCase
import com.liyaqa.dashboard.core.domain.Result

import com.liyaqa.dashboard.features.employee.data.repository.FacilityEmployeeRepository

class DeleteFacilityEmployeeUseCase(
    private val repository: FacilityEmployeeRepository
) : BaseUseCase<DeleteFacilityEmployeeUseCase.Params, Unit>() {

    data class Params(val id: String)

    override suspend fun execute(params: Params): Result<Unit> {
        if (params.id.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Employee ID cannot be blank"),
                "Employee ID cannot be blank"
            )
        }
        return repository.deleteEmployee(params.id)
    }
}
