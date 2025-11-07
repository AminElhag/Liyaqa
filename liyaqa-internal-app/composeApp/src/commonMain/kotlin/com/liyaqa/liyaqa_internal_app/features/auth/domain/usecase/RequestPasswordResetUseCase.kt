package com.liyaqa.liyaqa_internal_app.features.auth.domain.usecase

import com.liyaqa.liyaqa_internal_app.core.domain.BaseUseCase
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.auth.data.repository.AuthRepository

class RequestPasswordResetUseCase(
    private val repository: AuthRepository
) : BaseUseCase<String, Unit>() {
    override suspend fun execute(params: String): Result<Unit> {
        if (params.isBlank() || !params.contains("@")) {
            return Result.Error(
                IllegalArgumentException("Invalid email"),
                "Please enter a valid email address"
            )
        }
        return repository.requestPasswordReset(params)
    }
}
