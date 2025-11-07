package com.liyaqa.liyaqa_internal_app.features.facility.domain.usecase

import com.liyaqa.liyaqa_internal_app.core.domain.BaseUseCase
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.facility.data.repository.FacilityRepository
import com.liyaqa.liyaqa_internal_app.features.facility.domain.model.FacilityBranch

class GetBranchByIdUseCase(
    private val repository: FacilityRepository
) : BaseUseCase<String, FacilityBranch>() {
    override suspend fun execute(params: String): Result<FacilityBranch> {
        if (params.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Branch ID cannot be empty"),
                "Invalid branch ID"
            )
        }
        return repository.getBranchById(params)
    }
}
