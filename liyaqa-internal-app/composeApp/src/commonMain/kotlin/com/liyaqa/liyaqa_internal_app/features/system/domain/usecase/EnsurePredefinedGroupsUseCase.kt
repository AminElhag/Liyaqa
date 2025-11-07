package com.liyaqa.liyaqa_internal_app.features.system.domain.usecase

import com.liyaqa.liyaqa_internal_app.core.domain.BaseUseCase
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.system.data.dto.MessageResponse
import com.liyaqa.liyaqa_internal_app.features.system.data.repository.SystemRepository

class EnsurePredefinedGroupsUseCase(
    private val repository: SystemRepository
) : BaseUseCase<Unit, MessageResponse>() {
    override suspend fun execute(params: Unit): Result<MessageResponse> {
        return repository.ensurePredefinedGroups()
    }
}
