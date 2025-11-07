package com.liyaqa.liyaqa_internal_app.features.audit.data.repository

import com.liyaqa.liyaqa_internal_app.core.data.BaseRepository
import com.liyaqa.liyaqa_internal_app.core.domain.Result
import com.liyaqa.liyaqa_internal_app.features.audit.data.dto.AuditLogPageResponse
import io.ktor.client.*

class AuditRepository(httpClient: HttpClient) : BaseRepository(httpClient) {
    private val basePath = "/internal/audit"

    suspend fun getAuditLogs(
        page: Int = 0,
        size: Int = 20,
        action: String? = null,
        entityType: String? = null,
        employeeId: String? = null
    ): Result<AuditLogPageResponse> {
        val params = mutableMapOf<String, Any?>("page" to page, "size" to size)
        action?.let { params["action"] = it }
        entityType?.let { params["entityType"] = it }
        employeeId?.let { params["employeeId"] = it }
        return get(basePath, params)
    }
}
