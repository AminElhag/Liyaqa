package com.liyaqa.liyaqa_internal_app.features.employee.domain.usecase

import com.liyaqa.liyaqa_internal_app.core.domain.BaseUseCase
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.employee.data.dto.EmployeePageResponse
import com.liyaqa.liyaqa_internal_app.features.employee.data.repository.EmployeeRepository

/**
 * Use case for fetching paginated list of employees
 */
class GetEmployeesUseCase(
    private val repository: EmployeeRepository
) : BaseUseCase<GetEmployeesUseCase.Params, EmployeePageResponse>() {

    data class Params(
        val page: Int = 0,
        val size: Int = 20,
        val searchTerm: String? = null,
        val status: String? = null,
        val department: String? = null
    )

    override suspend fun execute(params: Params): Result<EmployeePageResponse> {
        return repository.getEmployees(
            page = params.page,
            size = params.size,
            searchTerm = params.searchTerm,
            status = params.status,
            department = params.department
        )
    }
}
