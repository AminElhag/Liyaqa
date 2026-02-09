package com.liyaqa.platform.monitoring.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.platform.monitoring.dto.AuditActionResponse
import com.liyaqa.platform.monitoring.dto.AuditResourceTypeResponse
import com.liyaqa.platform.monitoring.model.PlatformAuditAction
import com.liyaqa.platform.monitoring.model.PlatformAuditActorType
import com.liyaqa.platform.monitoring.model.PlatformAuditLog
import com.liyaqa.platform.monitoring.model.PlatformAuditResourceType
import com.liyaqa.platform.monitoring.repository.PlatformAuditLogRepository
import com.liyaqa.shared.infrastructure.export.CsvExportWriter
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Propagation
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

@Service
class PlatformAuditLogService(
    private val repository: PlatformAuditLogRepository,
    private val csvExportWriter: CsvExportWriter,
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(PlatformAuditLogService::class.java)

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun log(
        action: PlatformAuditAction,
        resourceType: PlatformAuditResourceType,
        resourceId: UUID? = null,
        tenantId: UUID? = null,
        details: Map<String, Any?>? = null
    ) {
        try {
            val context = AuditContext.get() ?: AuditContext.fromCurrentRequest()
            val auditLog = PlatformAuditLog.create(
                action = action,
                resourceType = resourceType,
                actorId = context?.actorId,
                actorType = context?.actorType ?: PlatformAuditActorType.SYSTEM,
                actorName = context?.actorName,
                resourceId = resourceId,
                tenantId = tenantId,
                details = details,
                ipAddress = context?.ipAddress,
                userAgent = context?.userAgent,
                correlationId = context?.correlationId,
                objectMapper = objectMapper
            )
            repository.save(auditLog)
            logger.debug("Platform audit log created: {} {} {}", action, resourceType, resourceId)
        } catch (e: Exception) {
            logger.error("Failed to create platform audit log: ${e.message}", e)
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    fun logSync(
        action: PlatformAuditAction,
        resourceType: PlatformAuditResourceType,
        resourceId: UUID? = null,
        tenantId: UUID? = null,
        details: Map<String, Any?>? = null
    ): PlatformAuditLog {
        val context = AuditContext.get() ?: AuditContext.fromCurrentRequest()
        val auditLog = PlatformAuditLog.create(
            action = action,
            resourceType = resourceType,
            actorId = context?.actorId,
            actorType = context?.actorType ?: PlatformAuditActorType.SYSTEM,
            actorName = context?.actorName,
            resourceId = resourceId,
            tenantId = tenantId,
            details = details,
            ipAddress = context?.ipAddress,
            userAgent = context?.userAgent,
            correlationId = context?.correlationId,
            objectMapper = objectMapper
        )
        return repository.save(auditLog)
    }

    @Transactional(readOnly = true)
    fun search(
        action: PlatformAuditAction?,
        actorId: UUID?,
        resourceType: PlatformAuditResourceType?,
        tenantId: UUID?,
        dateFrom: Instant?,
        dateTo: Instant?,
        search: String?,
        pageable: Pageable
    ): Page<PlatformAuditLog> {
        return repository.findByFilters(action, actorId, resourceType, tenantId, dateFrom, dateTo, search, pageable)
    }

    @Transactional(readOnly = true)
    fun exportCsv(
        action: PlatformAuditAction?,
        actorId: UUID?,
        resourceType: PlatformAuditResourceType?,
        tenantId: UUID?,
        dateFrom: Instant?,
        dateTo: Instant?,
        search: String?
    ): ByteArray {
        val results = repository.findByFilters(
            action, actorId, resourceType, tenantId, dateFrom, dateTo, search,
            Pageable.unpaged()
        )

        val headers = listOf(
            "Timestamp", "Action", "Actor", "Actor Type",
            "Resource Type", "Resource ID", "Tenant ID", "IP Address", "Details"
        )

        val rows = results.content.map { log ->
            listOf(
                log.createdAt,
                log.action.name,
                log.actorName ?: "",
                log.actorType.name,
                log.resourceType.name,
                log.resourceId?.toString() ?: "",
                log.tenantId?.toString() ?: "",
                log.ipAddress ?: "",
                log.details ?: ""
            )
        }

        return csvExportWriter.write(headers, rows)
    }

    fun getAvailableActions(): List<AuditActionResponse> {
        return PlatformAuditAction.entries.map { action ->
            AuditActionResponse(
                name = action.name,
                displayName = action.name.replace("_", " ").lowercase()
                    .replaceFirstChar { it.uppercase() }
            )
        }
    }

    fun getAvailableResourceTypes(): List<AuditResourceTypeResponse> {
        return PlatformAuditResourceType.entries.map { type ->
            AuditResourceTypeResponse(
                name = type.name,
                displayName = type.name.replace("_", " ").lowercase()
                    .replaceFirstChar { it.uppercase() }
            )
        }
    }
}
