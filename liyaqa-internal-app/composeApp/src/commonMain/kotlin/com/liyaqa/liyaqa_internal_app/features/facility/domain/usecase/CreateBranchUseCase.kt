package com.liyaqa.liyaqa_internal_app.features.facility.domain.usecase

import com.liyaqa.liyaqa_internal_app.core.domain.BaseUseCase
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.facility.data.dto.CreateBranchRequest
import com.liyaqa.liyaqa_internal_app.features.facility.data.repository.FacilityRepository
import com.liyaqa.liyaqa_internal_app.features.facility.domain.model.FacilityBranch

class CreateBranchUseCase(
    private val repository: FacilityRepository
) : BaseUseCase<CreateBranchRequest, FacilityBranch>() {
    override suspend fun execute(params: CreateBranchRequest): Result<FacilityBranch> {
        if (params.name.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Name cannot be empty"),
                "Branch name is required"
            )
        }
        if (params.address.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Address cannot be empty"),
                "Branch address is required"
            )
        }
        if (params.city.isBlank()) {
            return Result.Error(
                IllegalArgumentException("City cannot be empty"),
                "City is required"
            )
        }
        return repository.createBranch(params)
    }
}
