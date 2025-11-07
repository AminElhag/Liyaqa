package com.liyaqa.liyaqa_internal_app.features.tenant.domain.usecase

import com.liyaqa.liyaqa_internal_app.core.domain.BaseUseCase
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.tenant.data.dto.TenantAnalyticsDto
import com.liyaqa.liyaqa_internal_app.features.tenant.data.repository.TenantRepository

class GetTenantAnalyticsUseCase(
    private val repository: TenantRepository
) : BaseUseCase<Unit, TenantAnalyticsDto>() {
    override suspend fun execute(params: Unit): Result<TenantAnalyticsDto> {
        return repository.getTenantAnalytics()
    }
}
