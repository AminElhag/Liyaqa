package com.liyaqa.dashboard.features.employee.domain.usecase

import com.liyaqa.dashboard.core.domain.BaseUseCase
import com.liyaqa.dashboard.core.domain.Result
import com.liyaqa.dashboard.features.employee.data.dto.UpdateFacilityEmployeeRequest
import com.liyaqa.dashboard.features.employee.data.repository.FacilityEmployeeRepository
import com.liyaqa.dashboard.features.employee.domain.model.FacilityEmployee

class UpdateFacilityEmployeeUseCase(
    private val repository: FacilityEmployeeRepository
) : BaseUseCase<UpdateFacilityEmployeeUseCase.Params, FacilityEmployee>() {

    data class Params(
        val id: String,
        val firstName: String? = null,
        val lastName: String? = null,
        val phoneNumber: String? = null,
        val position: String? = null,
        val status: String? = null,
        val permissions: List<String>? = null
    )

    override suspend fun execute(params: Params): Result<FacilityEmployee> {
        if (params.id.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Employee ID cannot be blank"),
                "Employee ID cannot be blank"
            )
        }

        val request = UpdateFacilityEmployeeRequest(
            firstName = params.firstName,
            lastName = params.lastName,
            phoneNumber = params.phoneNumber,
            position = params.position,
            status = params.status,
            permissions = params.permissions
        )

        return repository.updateEmployee(params.id, request)
    }
}
