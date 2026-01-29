package com.liyaqa.platform.domain.ports

import com.liyaqa.platform.domain.model.AlertSeverity
import com.liyaqa.platform.domain.model.AlertType
import com.liyaqa.platform.domain.model.PlatformAlert
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.Optional
import java.util.UUID

/**
 * Repository port for PlatformAlert entity.
 * Manages proactive alerts for client management.
 */
interface PlatformAlertRepository {
    fun save(alert: PlatformAlert): PlatformAlert
    fun saveAll(alerts: List<PlatformAlert>): List<PlatformAlert>
    fun findById(id: UUID): Optional<PlatformAlert>
    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<PlatformAlert>
    fun findActiveByOrganizationId(organizationId: UUID, pageable: Pageable): Page<PlatformAlert>
    fun findByClubId(clubId: UUID, pageable: Pageable): Page<PlatformAlert>
    fun findAll(pageable: Pageable): Page<PlatformAlert>
    fun findActive(pageable: Pageable): Page<PlatformAlert>
    fun findByType(type: AlertType, pageable: Pageable): Page<PlatformAlert>
    fun findBySeverity(severity: AlertSeverity, pageable: Pageable): Page<PlatformAlert>
    fun findUnacknowledged(pageable: Pageable): Page<PlatformAlert>
    fun findCriticalUnacknowledged(pageable: Pageable): Page<PlatformAlert>
    fun findVisibleToClient(organizationId: UUID, pageable: Pageable): Page<PlatformAlert>
    fun findByTypeAndOrganizationId(type: AlertType, organizationId: UUID): List<PlatformAlert>
    fun existsById(id: UUID): Boolean
    fun existsActiveByTypeAndOrganizationId(type: AlertType, organizationId: UUID): Boolean
    fun deleteById(id: UUID)
    fun deleteExpired(): Int
    fun count(): Long
    fun countActive(): Long
    fun countBySeverity(severity: AlertSeverity): Long
    fun countUnacknowledged(): Long
    fun countActiveByOrganizationId(organizationId: UUID): Long
}
