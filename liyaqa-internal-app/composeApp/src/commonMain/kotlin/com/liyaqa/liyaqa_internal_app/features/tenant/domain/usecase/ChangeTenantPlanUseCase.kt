package com.liyaqa.liyaqa_internal_app.features.tenant.domain.usecase

import com.liyaqa.liyaqa_internal_app.core.domain.BaseUseCase
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.tenant.data.repository.TenantRepository
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.model.Tenant

class ChangeTenantPlanUseCase(
    private val repository: TenantRepository
) : BaseUseCase<ChangeTenantPlanUseCase.Params, Tenant>() {
    data class Params(val tenantId: String, val newTier: String)

    override suspend fun execute(params: Params): Result<Tenant> {
        if (params.tenantId.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Tenant ID cannot be empty"),
                "Invalid tenant ID"
            )
        }
        if (params.newTier.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Subscription tier cannot be empty"),
                "Please select a valid subscription tier"
            )
        }
        return repository.changePlan(params.tenantId, params.newTier)
    }
}
