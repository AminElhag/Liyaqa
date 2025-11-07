package com.liyaqa.liyaqa_internal_app.features.audit.domain.usecase

import com.liyaqa.liyaqa_internal_app.core.domain.BaseUseCase
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.audit.data.dto.AuditLogPageResponse
import com.liyaqa.liyaqa_internal_app.features.audit.data.repository.AuditRepository

class GetAuditLogsUseCase(
    private val repository: AuditRepository
) : BaseUseCase<GetAuditLogsUseCase.Params, AuditLogPageResponse>() {
    data class Params(
        val page: Int = 0,
        val size: Int = 20,
        val action: String? = null,
        val entityType: String? = null,
        val employeeId: String? = null
    )

    override suspend fun execute(params: Params): Result<AuditLogPageResponse> {
        return repository.getAuditLogs(params.page, params.size, params.action, params.entityType, params.employeeId)
    }
}
