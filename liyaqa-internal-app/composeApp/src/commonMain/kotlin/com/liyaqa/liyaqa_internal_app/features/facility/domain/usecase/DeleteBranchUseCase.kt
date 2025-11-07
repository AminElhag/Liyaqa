package com.liyaqa.liyaqa_internal_app.features.facility.domain.usecase

import com.liyaqa.liyaqa_internal_app.core.domain.BaseUseCase
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.facility.data.repository.FacilityRepository

class DeleteBranchUseCase(
    private val repository: FacilityRepository
) : BaseUseCase<String, Unit>() {
    override suspend fun execute(params: String): Result<Unit> {
        if (params.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Branch ID cannot be empty"),
                "Invalid branch ID"
            )
        }
        return repository.deleteBranch(params)
    }
}
