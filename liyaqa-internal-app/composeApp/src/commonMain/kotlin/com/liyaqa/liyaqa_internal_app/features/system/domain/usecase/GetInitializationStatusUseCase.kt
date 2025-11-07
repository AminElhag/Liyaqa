package com.liyaqa.liyaqa_internal_app.features.system.domain.usecase

import com.liyaqa.liyaqa_internal_app.core.domain.BaseUseCase
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.system.data.dto.InitializationStatusResponse
import com.liyaqa.liyaqa_internal_app.features.system.data.repository.SystemRepository

class GetInitializationStatusUseCase(
    private val repository: SystemRepository
) : BaseUseCase<Unit, InitializationStatusResponse>() {
    override suspend fun execute(params: Unit): Result<InitializationStatusResponse> {
        return repository.getInitializationStatus()
    }
}
