package com.liyaqa.platform.monitoring.repository

import com.liyaqa.platform.monitoring.model.PlatformAuditAction
import com.liyaqa.platform.monitoring.model.PlatformAuditLog
import com.liyaqa.platform.monitoring.model.PlatformAuditResourceType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.UUID

interface PlatformAuditLogRepository {
    fun save(log: PlatformAuditLog): PlatformAuditLog
    fun findById(id: UUID): PlatformAuditLog?
    fun findByFilters(
        action: PlatformAuditAction?,
        actorId: UUID?,
        resourceType: PlatformAuditResourceType?,
        tenantId: UUID?,
        dateFrom: Instant?,
        dateTo: Instant?,
        search: String?,
        pageable: Pageable
    ): Page<PlatformAuditLog>
    fun findAll(pageable: Pageable): Page<PlatformAuditLog>
}
