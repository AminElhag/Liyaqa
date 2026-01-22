package com.liyaqa.shared.infrastructure.audit

import com.liyaqa.shared.domain.AuditAction
import com.liyaqa.shared.domain.AuditLog
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.UUID

interface SpringDataAuditLogRepository : JpaRepository<AuditLog, UUID> {
    fun findByEntityTypeAndEntityId(entityType: String, entityId: UUID, pageable: Pageable): Page<AuditLog>
    fun findByUserId(userId: UUID, pageable: Pageable): Page<AuditLog>
    fun findByAction(action: AuditAction, pageable: Pageable): Page<AuditLog>
    fun findByCreatedAtBetween(start: Instant, end: Instant, pageable: Pageable): Page<AuditLog>
    fun findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType: String, entityId: UUID): List<AuditLog>
    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<AuditLog>
    fun findByOrganizationIdAndAction(organizationId: UUID, action: AuditAction, pageable: Pageable): Page<AuditLog>
    fun findByOrganizationIdAndCreatedAtBetween(organizationId: UUID, start: Instant, end: Instant, pageable: Pageable): Page<AuditLog>
}

/**
 * Repository interface for audit logs.
 */
interface AuditLogRepository {
    fun save(auditLog: AuditLog): AuditLog
    fun findById(id: UUID): AuditLog?
    fun findByEntityTypeAndEntityId(entityType: String, entityId: UUID, pageable: Pageable): Page<AuditLog>
    fun findByUserId(userId: UUID, pageable: Pageable): Page<AuditLog>
    fun findByAction(action: AuditAction, pageable: Pageable): Page<AuditLog>
    fun findByCreatedAtBetween(start: Instant, end: Instant, pageable: Pageable): Page<AuditLog>
    fun getEntityHistory(entityType: String, entityId: UUID): List<AuditLog>
    fun findAll(pageable: Pageable): Page<AuditLog>
    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<AuditLog>
    fun findByOrganizationIdAndAction(organizationId: UUID, action: AuditAction, pageable: Pageable): Page<AuditLog>
    fun findByOrganizationIdAndCreatedAtBetween(organizationId: UUID, start: Instant, end: Instant, pageable: Pageable): Page<AuditLog>
}

@Repository
class JpaAuditLogRepository(
    private val springDataRepository: SpringDataAuditLogRepository
) : AuditLogRepository {

    override fun save(auditLog: AuditLog): AuditLog =
        springDataRepository.save(auditLog)

    override fun findById(id: UUID): AuditLog? =
        springDataRepository.findById(id).orElse(null)

    override fun findByEntityTypeAndEntityId(entityType: String, entityId: UUID, pageable: Pageable): Page<AuditLog> =
        springDataRepository.findByEntityTypeAndEntityId(entityType, entityId, pageable)

    override fun findByUserId(userId: UUID, pageable: Pageable): Page<AuditLog> =
        springDataRepository.findByUserId(userId, pageable)

    override fun findByAction(action: AuditAction, pageable: Pageable): Page<AuditLog> =
        springDataRepository.findByAction(action, pageable)

    override fun findByCreatedAtBetween(start: Instant, end: Instant, pageable: Pageable): Page<AuditLog> =
        springDataRepository.findByCreatedAtBetween(start, end, pageable)

    override fun getEntityHistory(entityType: String, entityId: UUID): List<AuditLog> =
        springDataRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId)

    override fun findAll(pageable: Pageable): Page<AuditLog> =
        springDataRepository.findAll(pageable)

    override fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<AuditLog> =
        springDataRepository.findByOrganizationId(organizationId, pageable)

    override fun findByOrganizationIdAndAction(organizationId: UUID, action: AuditAction, pageable: Pageable): Page<AuditLog> =
        springDataRepository.findByOrganizationIdAndAction(organizationId, action, pageable)

    override fun findByOrganizationIdAndCreatedAtBetween(organizationId: UUID, start: Instant, end: Instant, pageable: Pageable): Page<AuditLog> =
        springDataRepository.findByOrganizationIdAndCreatedAtBetween(organizationId, start, end, pageable)
}
