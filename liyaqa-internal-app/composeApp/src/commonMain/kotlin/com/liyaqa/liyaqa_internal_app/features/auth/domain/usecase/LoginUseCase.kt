package com.liyaqa.liyaqa_internal_app.features.auth.domain.usecase

import com.liyaqa.liyaqa_internal_app.core.domain.BaseUseCase
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.auth.data.repository.AuthRepository
import com.liyaqa.liyaqa_internal_app.features.auth.domain.model.User

/**
 * Use case for user login.
 * Encapsulates business logic for authentication.
 * Follows clean architecture principles.
 */
class LoginUseCase(
    private val authRepository: AuthRepository
) : BaseUseCase<LoginUseCase.Params, Pair<User, String>>() {

    data class Params(
        val email: String,
        val password: String
    )

    override suspend fun execute(params: Params): Result<Pair<User, String>> {
        // Validate email
        if (params.email.isBlank()) {
            return Result.Error(
                exception = IllegalArgumentException("Email cannot be empty"),
                message = "Email cannot be empty"
            )
        }

        // Validate password
        if (params.password.isBlank()) {
            return Result.Error(
                exception = IllegalArgumentException("Password cannot be empty"),
                message = "Password cannot be empty"
            )
        }

        // Basic email format validation
        if (!params.email.contains("@")) {
            return Result.Error(
                exception = IllegalArgumentException("Invalid email format"),
                message = "Invalid email format"
            )
        }

        // Call repository
        return authRepository.login(params.email, params.password)
    }
}
