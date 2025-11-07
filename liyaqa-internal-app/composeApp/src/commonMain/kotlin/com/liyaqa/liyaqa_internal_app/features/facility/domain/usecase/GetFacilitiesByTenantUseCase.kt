package com.liyaqa.liyaqa_internal_app.features.facility.domain.usecase

import com.liyaqa.liyaqa_internal_app.core.domain.BaseUseCase
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.facility.data.repository.FacilityRepository
import com.liyaqa.liyaqa_internal_app.features.facility.domain.model.Facility

class GetFacilitiesByTenantUseCase(
    private val repository: FacilityRepository
) : BaseUseCase<String, List<Facility>>() {
    override suspend fun execute(params: String): Result<List<Facility>> {
        if (params.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Tenant ID cannot be empty"),
                "Invalid tenant ID"
            )
        }
        return repository.getFacilitiesByTenant(params)
    }
}
