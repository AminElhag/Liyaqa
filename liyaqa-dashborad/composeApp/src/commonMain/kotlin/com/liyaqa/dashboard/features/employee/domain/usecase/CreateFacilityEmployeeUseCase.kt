package com.liyaqa.dashboard.features.employee.domain.usecase

import com.liyaqa.dashboard.core.domain.BaseUseCase
import com.liyaqa.dashboard.core.domain.Result
import com.liyaqa.dashboard.features.employee.data.dto.CreateFacilityEmployeeRequest
import com.liyaqa.dashboard.features.employee.data.repository.FacilityEmployeeRepository
import com.liyaqa.dashboard.features.employee.domain.model.FacilityEmployee

class CreateFacilityEmployeeUseCase(
    private val repository: FacilityEmployeeRepository
) : BaseUseCase<CreateFacilityEmployeeUseCase.Params, FacilityEmployee>() {

    data class Params(
        val email: String,
        val firstName: String,
        val lastName: String,
        val phoneNumber: String? = null,
        val employeeNumber: String,
        val position: String? = null,
        val branchId: String? = null,
        val permissions: List<String> = emptyList()
    )

    override suspend fun execute(params: Params): Result<FacilityEmployee> {
        // Validation
        if (params.email.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Email cannot be blank"),
                "Email cannot be blank"
            )
        }
        if (params.firstName.isBlank()) {
            return Result.Error(
                IllegalArgumentException("First name cannot be blank"),
                "First name cannot be blank"
            )
        }
        if (params.lastName.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Last name cannot be blank"),
                "Last name cannot be blank"
            )
        }
        if (params.employeeNumber.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Employee number cannot be blank"),
                "Employee number cannot be blank"
            )
        }

        val request = CreateFacilityEmployeeRequest(
            email = params.email,
            firstName = params.firstName,
            lastName = params.lastName,
            phoneNumber = params.phoneNumber,
            employeeNumber = params.employeeNumber,
            position = params.position,
            branchId = params.branchId,
            permissions = params.permissions
        )

        return repository.createEmployee(request)
    }
}
