package com.liyaqa.platform.tenant.service

import com.liyaqa.platform.domain.ports.ClientSubscriptionRepository
import com.liyaqa.platform.tenant.dto.DeactivateTenantCommand
import com.liyaqa.platform.tenant.dto.RequestDataExportCommand
import com.liyaqa.platform.tenant.dto.SuspendTenantCommand
import com.liyaqa.platform.tenant.exception.ActiveSubscriptionExistsException
import com.liyaqa.platform.tenant.exception.DataExportInProgressException
import com.liyaqa.platform.tenant.exception.DataExportNotFoundException
import com.liyaqa.platform.tenant.exception.DataExportRequiredException
import com.liyaqa.platform.tenant.exception.TenantNotFoundException
import com.liyaqa.platform.tenant.model.DataExportJob
import com.liyaqa.platform.tenant.model.DataExportStatus
import com.liyaqa.platform.tenant.model.DataExportRequestedEvent
import com.liyaqa.platform.tenant.model.Tenant
import com.liyaqa.platform.tenant.model.TenantArchivedEvent
import com.liyaqa.platform.tenant.model.TenantDeactivatedEvent
import com.liyaqa.platform.tenant.model.TenantDeactivationLog
import com.liyaqa.platform.tenant.model.TenantStatus
import com.liyaqa.platform.tenant.model.TenantSuspendedEvent
import com.liyaqa.platform.tenant.repository.DataExportJobRepository
import com.liyaqa.platform.tenant.repository.TenantDeactivationLogRepository
import com.liyaqa.platform.tenant.repository.TenantRepository
import com.liyaqa.shared.infrastructure.security.SecurityService
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

@Service
@Transactional
class TenantOffboardingService(
    private val tenantRepository: TenantRepository,
    private val deactivationLogRepository: TenantDeactivationLogRepository,
    private val dataExportJobRepository: DataExportJobRepository,
    private val clientSubscriptionRepository: ClientSubscriptionRepository,
    private val securityService: SecurityService,
    private val eventPublisher: ApplicationEventPublisher
) {
    private val logger = LoggerFactory.getLogger(TenantOffboardingService::class.java)

    fun deactivateTenant(id: UUID, command: DeactivateTenantCommand): Tenant {
        val tenant = findTenant(id)

        // Check for active subscription if tenant has an organizationId
        if (tenant.organizationId != null &&
            clientSubscriptionRepository.existsActiveByOrganizationId(tenant.organizationId!!)
        ) {
            throw ActiveSubscriptionExistsException(id)
        }

        val previousStatus = tenant.status
        tenant.changeStatus(TenantStatus.DEACTIVATED)
        val saved = tenantRepository.save(tenant)

        val currentUserId = securityService.getCurrentUserId()!!
        val log = TenantDeactivationLog.create(
            tenantId = id,
            reason = command.reason,
            notes = command.notes,
            deactivatedBy = currentUserId,
            previousStatus = previousStatus
        )
        deactivationLogRepository.save(log)

        eventPublisher.publishEvent(
            TenantDeactivatedEvent(
                tenantId = id,
                reason = command.reason,
                deactivatedBy = currentUserId
            )
        )

        logger.info("Tenant {} deactivated: reason={}, previousStatus={}", id, command.reason, previousStatus)
        return saved
    }

    fun suspendTenant(id: UUID, command: SuspendTenantCommand): Tenant {
        val tenant = findTenant(id)
        val previousStatus = tenant.status
        tenant.changeStatus(TenantStatus.SUSPENDED)
        val saved = tenantRepository.save(tenant)

        val currentUserId = securityService.getCurrentUserId()!!

        eventPublisher.publishEvent(
            TenantSuspendedEvent(
                tenantId = id,
                suspendedBy = currentUserId
            )
        )

        logger.info("Tenant {} suspended: reason={}, previousStatus={}", id, command.reason, previousStatus)
        return saved
    }

    fun requestDataExport(id: UUID, command: RequestDataExportCommand): DataExportJob {
        val tenant = findTenant(id)

        // Check no PENDING or IN_PROGRESS export exists
        val activeStatuses = listOf(DataExportStatus.PENDING, DataExportStatus.IN_PROGRESS)
        if (dataExportJobRepository.existsByTenantIdAndStatusIn(tenant.id, activeStatuses)) {
            throw DataExportInProgressException(id)
        }

        val currentUserId = securityService.getCurrentUserId()!!
        val job = DataExportJob.create(
            tenantId = tenant.id,
            format = command.format,
            requestedBy = currentUserId
        )
        val saved = dataExportJobRepository.save(job)

        eventPublisher.publishEvent(
            DataExportRequestedEvent(
                tenantId = tenant.id,
                exportJobId = saved.id,
                format = command.format,
                requestedBy = currentUserId
            )
        )

        logger.info("Data export requested for tenant {}: jobId={}, format={}", id, saved.id, command.format)
        return saved
    }

    @Transactional(readOnly = true)
    fun getDataExports(tenantId: UUID): List<DataExportJob> {
        if (!tenantRepository.existsById(tenantId)) {
            throw TenantNotFoundException(tenantId)
        }
        return dataExportJobRepository.findByTenantId(tenantId)
    }

    @Transactional(readOnly = true)
    fun getDataExport(exportId: UUID): DataExportJob {
        return dataExportJobRepository.findById(exportId)
            .orElseThrow { DataExportNotFoundException(exportId) }
    }

    fun archiveTenant(id: UUID): Tenant {
        val tenant = findTenant(id)

        // Must be DEACTIVATED to archive (enforced by changeStatus, but explicit for clarity)
        require(tenant.status == TenantStatus.DEACTIVATED) {
            "Tenant must be DEACTIVATED before archiving. Current status: ${tenant.status}"
        }

        // Verify a completed export exists
        val completedExports = dataExportJobRepository.findByTenantIdAndStatus(id, DataExportStatus.COMPLETED)
        if (completedExports.isEmpty()) {
            throw DataExportRequiredException(id)
        }

        tenant.changeStatus(TenantStatus.ARCHIVED)
        tenant.dataRetentionUntil = Instant.now().plusSeconds(90L * 24 * 60 * 60) // 90 days
        val saved = tenantRepository.save(tenant)

        val currentUserId = securityService.getCurrentUserId()!!

        eventPublisher.publishEvent(
            TenantArchivedEvent(
                tenantId = id,
                archivedBy = currentUserId,
                dataRetentionUntil = saved.dataRetentionUntil!!
            )
        )

        logger.info("Tenant {} archived, data retention until {}", id, saved.dataRetentionUntil)
        return saved
    }

    @Transactional(readOnly = true)
    fun getDeactivationHistory(tenantId: UUID): List<TenantDeactivationLog> {
        if (!tenantRepository.existsById(tenantId)) {
            throw TenantNotFoundException(tenantId)
        }
        return deactivationLogRepository.findByTenantId(tenantId)
    }

    private fun findTenant(id: UUID): Tenant {
        return tenantRepository.findById(id)
            .orElseThrow { TenantNotFoundException(id) }
    }
}
