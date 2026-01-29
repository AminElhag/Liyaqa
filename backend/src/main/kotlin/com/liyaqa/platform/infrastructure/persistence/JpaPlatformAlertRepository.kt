package com.liyaqa.platform.infrastructure.persistence

import com.liyaqa.platform.domain.model.AlertSeverity
import com.liyaqa.platform.domain.model.AlertType
import com.liyaqa.platform.domain.model.PlatformAlert
import com.liyaqa.platform.domain.ports.PlatformAlertRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataPlatformAlertRepository : JpaRepository<PlatformAlert, UUID> {

    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<PlatformAlert>

    @Query("""
        SELECT pa FROM PlatformAlert pa
        WHERE pa.organizationId = :organizationId
        AND pa.resolvedAt IS NULL
        AND (pa.expiresAt IS NULL OR pa.expiresAt > CURRENT_TIMESTAMP)
        ORDER BY
            CASE pa.severity
                WHEN 'CRITICAL' THEN 1
                WHEN 'WARNING' THEN 2
                WHEN 'INFO' THEN 3
                WHEN 'SUCCESS' THEN 4
            END,
            pa.createdAt DESC
    """)
    fun findActiveByOrganizationId(
        @Param("organizationId") organizationId: UUID,
        pageable: Pageable
    ): Page<PlatformAlert>

    fun findByClubId(clubId: UUID, pageable: Pageable): Page<PlatformAlert>

    @Query("""
        SELECT pa FROM PlatformAlert pa
        WHERE pa.resolvedAt IS NULL
        AND (pa.expiresAt IS NULL OR pa.expiresAt > CURRENT_TIMESTAMP)
        ORDER BY
            CASE pa.severity
                WHEN 'CRITICAL' THEN 1
                WHEN 'WARNING' THEN 2
                WHEN 'INFO' THEN 3
                WHEN 'SUCCESS' THEN 4
            END,
            pa.createdAt DESC
    """)
    fun findActive(pageable: Pageable): Page<PlatformAlert>

    fun findByType(type: AlertType, pageable: Pageable): Page<PlatformAlert>

    fun findBySeverity(severity: AlertSeverity, pageable: Pageable): Page<PlatformAlert>

    @Query("""
        SELECT pa FROM PlatformAlert pa
        WHERE pa.acknowledgedAt IS NULL
        AND pa.resolvedAt IS NULL
        AND (pa.expiresAt IS NULL OR pa.expiresAt > CURRENT_TIMESTAMP)
        ORDER BY pa.createdAt ASC
    """)
    fun findUnacknowledged(pageable: Pageable): Page<PlatformAlert>

    @Query("""
        SELECT pa FROM PlatformAlert pa
        WHERE pa.severity = 'CRITICAL'
        AND pa.acknowledgedAt IS NULL
        AND pa.resolvedAt IS NULL
        AND (pa.expiresAt IS NULL OR pa.expiresAt > CURRENT_TIMESTAMP)
        ORDER BY pa.createdAt ASC
    """)
    fun findCriticalUnacknowledged(pageable: Pageable): Page<PlatformAlert>

    @Query("""
        SELECT pa FROM PlatformAlert pa
        WHERE pa.organizationId = :organizationId
        AND pa.visibleToClient = true
        AND pa.clientDismissed = false
        AND pa.resolvedAt IS NULL
        AND (pa.expiresAt IS NULL OR pa.expiresAt > CURRENT_TIMESTAMP)
        ORDER BY pa.createdAt DESC
    """)
    fun findVisibleToClient(
        @Param("organizationId") organizationId: UUID,
        pageable: Pageable
    ): Page<PlatformAlert>

    fun findByTypeAndOrganizationId(type: AlertType, organizationId: UUID): List<PlatformAlert>

    @Query("""
        SELECT CASE WHEN COUNT(pa) > 0 THEN true ELSE false END
        FROM PlatformAlert pa
        WHERE pa.type = :type
        AND pa.organizationId = :organizationId
        AND pa.resolvedAt IS NULL
        AND (pa.expiresAt IS NULL OR pa.expiresAt > CURRENT_TIMESTAMP)
    """)
    fun existsActiveByTypeAndOrganizationId(
        @Param("type") type: AlertType,
        @Param("organizationId") organizationId: UUID
    ): Boolean

    @Modifying
    @Query("""
        DELETE FROM PlatformAlert pa
        WHERE pa.expiresAt IS NOT NULL
        AND pa.expiresAt < CURRENT_TIMESTAMP
    """)
    fun deleteExpired(): Int

    @Query("""
        SELECT COUNT(pa) FROM PlatformAlert pa
        WHERE pa.resolvedAt IS NULL
        AND (pa.expiresAt IS NULL OR pa.expiresAt > CURRENT_TIMESTAMP)
    """)
    fun countActive(): Long

    fun countBySeverity(severity: AlertSeverity): Long

    @Query("""
        SELECT COUNT(pa) FROM PlatformAlert pa
        WHERE pa.acknowledgedAt IS NULL
        AND pa.resolvedAt IS NULL
        AND (pa.expiresAt IS NULL OR pa.expiresAt > CURRENT_TIMESTAMP)
    """)
    fun countUnacknowledged(): Long

    @Query("""
        SELECT COUNT(pa) FROM PlatformAlert pa
        WHERE pa.organizationId = :organizationId
        AND pa.resolvedAt IS NULL
        AND (pa.expiresAt IS NULL OR pa.expiresAt > CURRENT_TIMESTAMP)
    """)
    fun countActiveByOrganizationId(@Param("organizationId") organizationId: UUID): Long
}

@Repository
class JpaPlatformAlertRepository(
    private val springDataRepository: SpringDataPlatformAlertRepository
) : PlatformAlertRepository {

    override fun save(alert: PlatformAlert): PlatformAlert =
        springDataRepository.save(alert)

    override fun saveAll(alerts: List<PlatformAlert>): List<PlatformAlert> =
        springDataRepository.saveAll(alerts)

    override fun findById(id: UUID): Optional<PlatformAlert> =
        springDataRepository.findById(id)

    override fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<PlatformAlert> =
        springDataRepository.findByOrganizationId(organizationId, pageable)

    override fun findActiveByOrganizationId(organizationId: UUID, pageable: Pageable): Page<PlatformAlert> =
        springDataRepository.findActiveByOrganizationId(organizationId, pageable)

    override fun findByClubId(clubId: UUID, pageable: Pageable): Page<PlatformAlert> =
        springDataRepository.findByClubId(clubId, pageable)

    override fun findAll(pageable: Pageable): Page<PlatformAlert> =
        springDataRepository.findAll(pageable)

    override fun findActive(pageable: Pageable): Page<PlatformAlert> =
        springDataRepository.findActive(pageable)

    override fun findByType(type: AlertType, pageable: Pageable): Page<PlatformAlert> =
        springDataRepository.findByType(type, pageable)

    override fun findBySeverity(severity: AlertSeverity, pageable: Pageable): Page<PlatformAlert> =
        springDataRepository.findBySeverity(severity, pageable)

    override fun findUnacknowledged(pageable: Pageable): Page<PlatformAlert> =
        springDataRepository.findUnacknowledged(pageable)

    override fun findCriticalUnacknowledged(pageable: Pageable): Page<PlatformAlert> =
        springDataRepository.findCriticalUnacknowledged(pageable)

    override fun findVisibleToClient(organizationId: UUID, pageable: Pageable): Page<PlatformAlert> =
        springDataRepository.findVisibleToClient(organizationId, pageable)

    override fun findByTypeAndOrganizationId(type: AlertType, organizationId: UUID): List<PlatformAlert> =
        springDataRepository.findByTypeAndOrganizationId(type, organizationId)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun existsActiveByTypeAndOrganizationId(type: AlertType, organizationId: UUID): Boolean =
        springDataRepository.existsActiveByTypeAndOrganizationId(type, organizationId)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun deleteExpired(): Int =
        springDataRepository.deleteExpired()

    override fun count(): Long =
        springDataRepository.count()

    override fun countActive(): Long =
        springDataRepository.countActive()

    override fun countBySeverity(severity: AlertSeverity): Long =
        springDataRepository.countBySeverity(severity)

    override fun countUnacknowledged(): Long =
        springDataRepository.countUnacknowledged()

    override fun countActiveByOrganizationId(organizationId: UUID): Long =
        springDataRepository.countActiveByOrganizationId(organizationId)
}
