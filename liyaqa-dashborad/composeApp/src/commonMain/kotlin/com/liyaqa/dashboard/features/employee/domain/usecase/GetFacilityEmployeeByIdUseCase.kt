package com.liyaqa.dashboard.features.employee.domain.usecase

import com.liyaqa.dashboard.core.domain.BaseUseCase
import com.liyaqa.dashboard.core.domain.Result
import com.liyaqa.dashboard.features.employee.data.repository.FacilityEmployeeRepository
import com.liyaqa.dashboard.features.employee.domain.model.FacilityEmployee

class GetFacilityEmployeeByIdUseCase(
    private val repository: FacilityEmployeeRepository
) : BaseUseCase<GetFacilityEmployeeByIdUseCase.Params, FacilityEmployee>() {

    data class Params(val id: String)

    override suspend fun execute(params: Params): Result<FacilityEmployee> {
        if (params.id.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Employee ID cannot be blank"),
                "Employee ID cannot be blank"
            )
        }
        return repository.getEmployeeById(params.id)
    }
}
