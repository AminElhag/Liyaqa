package com.liyaqa.liyaqa_internal_app.features.employee.domain.usecase

import com.liyaqa.liyaqa_internal_app.core.domain.BaseUseCase
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.employee.data.repository.EmployeeRepository

class ChangePasswordUseCase(
    private val repository: EmployeeRepository
) : BaseUseCase<ChangePasswordUseCase.Params, Unit>() {
    data class Params(val currentPassword: String, val newPassword: String)

    override suspend fun execute(params: Params): Result<Unit> {
        if (params.currentPassword.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Current password cannot be empty"),
                "Please enter your current password"
            )
        }
        if (params.newPassword.length < 8) {
            return Result.Error(
                IllegalArgumentException("Password too short"),
                "New password must be at least 8 characters"
            )
        }
        if (params.currentPassword == params.newPassword) {
            return Result.Error(
                IllegalArgumentException("Same password"),
                "New password must be different from current password"
            )
        }
        return repository.changePassword(params.currentPassword, params.newPassword)
    }
}
