package com.liyaqa.liyaqa_internal_app.features.employee.domain.usecase

import com.liyaqa.liyaqa_internal_app.core.domain.BaseUseCase
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.employee.data.repository.EmployeeRepository
import com.liyaqa.liyaqa_internal_app.features.employee.domain.model.Employee

class GetCurrentEmployeeUseCase(
    private val repository: EmployeeRepository
) : BaseUseCase<Unit, Employee>() {
    override suspend fun execute(params: Unit): Result<Employee> {
        return repository.getCurrentEmployee()
    }
}
