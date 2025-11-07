package com.liyaqa.liyaqa_internal_app.features.tenant.domain.usecase

import com.liyaqa.liyaqa_internal_app.core.domain.BaseUseCase
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.tenant.data.repository.TenantRepository
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.model.Tenant

class SuspendTenantUseCase(
    private val repository: TenantRepository
) : BaseUseCase<String, Tenant>() {
    override suspend fun execute(params: String): Result<Tenant> {
        if (params.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Tenant ID cannot be empty"),
                "Invalid tenant ID"
            )
        }
        return repository.suspendTenant(params)
    }
}
