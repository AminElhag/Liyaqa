package com.liyaqa.dashboard.features.employee.domain.usecase

import com.liyaqa.dashboard.core.domain.BaseUseCase
import com.liyaqa.dashboard.core.domain.Result
import com.liyaqa.dashboard.features.employee.data.dto.FacilityEmployeePageResponse
import com.liyaqa.dashboard.features.employee.data.repository.FacilityEmployeeRepository

class GetFacilityEmployeesUseCase(
    private val repository: FacilityEmployeeRepository
) : BaseUseCase<GetFacilityEmployeesUseCase.Params, FacilityEmployeePageResponse>() {

    data class Params(
        val page: Int = 0,
        val size: Int = 20,
        val search: String? = null,
        val status: String? = null,
        val branchId: String? = null
    )

    override suspend fun execute(params: Params): Result<FacilityEmployeePageResponse> {
        return repository.getEmployees(
            page = params.page,
            size = params.size,
            search = params.search,
            status = params.status,
            branchId = params.branchId
        )
    }
}
