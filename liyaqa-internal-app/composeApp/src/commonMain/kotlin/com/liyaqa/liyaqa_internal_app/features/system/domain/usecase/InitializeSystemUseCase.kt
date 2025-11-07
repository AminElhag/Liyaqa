package com.liyaqa.liyaqa_internal_app.features.system.domain.usecase

import com.liyaqa.liyaqa_internal_app.core.domain.BaseUseCase
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.system.data.dto.SystemInitializationRequest
import com.liyaqa.liyaqa_internal_app.features.system.data.dto.SystemInitializationResponse
import com.liyaqa.liyaqa_internal_app.features.system.data.repository.SystemRepository

class InitializeSystemUseCase(
    private val repository: SystemRepository
) : BaseUseCase<SystemInitializationRequest, SystemInitializationResponse>() {
    override suspend fun execute(params: SystemInitializationRequest): Result<SystemInitializationResponse> {
        // Validate inputs
        if (params.adminEmail.isBlank() || !params.adminEmail.contains("@")) {
            return Result.Error(
                IllegalArgumentException("Invalid email"),
                "Please enter a valid email address"
            )
        }
        if (params.adminPassword.length < 8) {
            return Result.Error(
                IllegalArgumentException("Password too short"),
                "Password must be at least 8 characters"
            )
        }
        if (params.adminFirstName.isBlank()) {
            return Result.Error(
                IllegalArgumentException("First name required"),
                "Please enter administrator's first name"
            )
        }
        if (params.adminLastName.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Last name required"),
                "Please enter administrator's last name"
            )
        }

        return repository.initializeSystem(params)
    }
}
