package com.liyaqa.liyaqa_internal_app.features.auth.domain.usecase

import com.liyaqa.liyaqa_internal_app.core.domain.BaseUseCase
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.auth.data.dto.LoginResponse
import com.liyaqa.liyaqa_internal_app.features.auth.data.repository.AuthRepository

class RefreshTokenUseCase(
    private val repository: AuthRepository
) : BaseUseCase<String, LoginResponse>() {
    override suspend fun execute(params: String): Result<LoginResponse> {
        if (params.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Refresh token cannot be empty"),
                "Invalid refresh token"
            )
        }
        return repository.refreshToken(params)
    }
}
