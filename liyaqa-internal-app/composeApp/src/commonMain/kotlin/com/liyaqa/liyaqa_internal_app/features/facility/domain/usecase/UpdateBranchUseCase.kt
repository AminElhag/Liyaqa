package com.liyaqa.liyaqa_internal_app.features.facility.domain.usecase

import com.liyaqa.liyaqa_internal_app.core.domain.BaseUseCase
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.facility.data.dto.UpdateBranchRequest
import com.liyaqa.liyaqa_internal_app.features.facility.data.repository.FacilityRepository
import com.liyaqa.liyaqa_internal_app.features.facility.domain.model.FacilityBranch

class UpdateBranchUseCase(
    private val repository: FacilityRepository
) : BaseUseCase<UpdateBranchUseCase.Params, FacilityBranch>() {
    data class Params(val branchId: String, val request: UpdateBranchRequest)

    override suspend fun execute(params: Params): Result<FacilityBranch> {
        if (params.branchId.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Branch ID cannot be empty"),
                "Invalid branch ID"
            )
        }
        return repository.updateBranch(params.branchId, params.request)
    }
}
