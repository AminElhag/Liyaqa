package com.liyaqa.liyaqa_internal_app.features.employee.domain.usecase

import com.liyaqa.liyaqa_internal_app.core.domain.BaseUseCase
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.employee.data.dto.UpdateEmployeeRequest
import com.liyaqa.liyaqa_internal_app.features.employee.data.repository.EmployeeRepository
import com.liyaqa.liyaqa_internal_app.features.employee.domain.model.Employee

class UpdateCurrentEmployeeUseCase(
    private val repository: EmployeeRepository
) : BaseUseCase<UpdateEmployeeRequest, Employee>() {
    override suspend fun execute(params: UpdateEmployeeRequest): Result<Employee> {
        return repository.updateCurrentEmployee(params)
    }
}
