package com.liyaqa.liyaqa_internal_app.features.auth.domain.usecase

import com.liyaqa.liyaqa_internal_app.core.domain.BaseUseCase
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.auth.data.repository.AuthRepository

class CompletePasswordResetUseCase(
    private val repository: AuthRepository
) : BaseUseCase<CompletePasswordResetUseCase.Params, Unit>() {
    data class Params(val token: String, val newPassword: String)

    override suspend fun execute(params: Params): Result<Unit> {
        if (params.token.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Token cannot be empty"),
                "Invalid reset token"
            )
        }
        if (params.newPassword.length < 8) {
            return Result.Error(
                IllegalArgumentException("Password too short"),
                "Password must be at least 8 characters"
            )
        }
        return repository.completePasswordReset(params.token, params.newPassword)
    }
}
