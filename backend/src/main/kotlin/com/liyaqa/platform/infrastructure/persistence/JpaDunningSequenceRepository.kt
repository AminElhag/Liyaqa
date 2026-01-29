package com.liyaqa.platform.infrastructure.persistence

import com.liyaqa.platform.domain.model.DunningSequence
import com.liyaqa.platform.domain.model.DunningStatus
import com.liyaqa.platform.domain.ports.DunningSequenceRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

interface SpringDataDunningSequenceRepository : JpaRepository<DunningSequence, UUID> {

    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<DunningSequence>

    fun findBySubscriptionId(subscriptionId: UUID): Optional<DunningSequence>

    fun findByInvoiceId(invoiceId: UUID): Optional<DunningSequence>

    fun findByStatus(status: DunningStatus, pageable: Pageable): Page<DunningSequence>

    @Query("""
        SELECT ds FROM DunningSequence ds
        WHERE ds.status = 'ACTIVE'
        ORDER BY ds.failedAt ASC
    """)
    fun findActive(pageable: Pageable): Page<DunningSequence>

    @Query("""
        SELECT ds FROM DunningSequence ds
        WHERE ds.organizationId = :organizationId
        AND ds.status = 'ACTIVE'
    """)
    fun findActiveByOrganizationId(@Param("organizationId") organizationId: UUID): Optional<DunningSequence>

    @Query("""
        SELECT ds FROM DunningSequence ds
        WHERE ds.status = 'ACTIVE'
        AND ds.nextRetryDate IS NOT NULL
        AND ds.nextRetryDate <= :dueDate
    """)
    fun findWithRetryDue(@Param("dueDate") dueDate: LocalDate): List<DunningSequence>

    @Query(value = """
        SELECT * FROM dunning_sequences ds
        WHERE ds.status = 'ACTIVE'
        AND ds.is_suspended = false
        AND DATEDIFF(day, ds.failed_at, CURRENT_TIMESTAMP) >= :suspensionDay
    """, nativeQuery = true)
    fun findReadyForSuspension(@Param("suspensionDay") suspensionDay: Int): List<DunningSequence>

    @Query(value = """
        SELECT * FROM dunning_sequences ds
        WHERE ds.status = 'SUSPENDED'
        AND DATEDIFF(day, ds.failed_at, CURRENT_TIMESTAMP) >= :deactivationDay
    """, nativeQuery = true)
    fun findReadyForDeactivation(@Param("deactivationDay") deactivationDay: Int): List<DunningSequence>

    @Query("""
        SELECT ds FROM DunningSequence ds
        WHERE ds.csmEscalated = true
        ORDER BY ds.csmEscalatedAt DESC
    """)
    fun findEscalatedToCsm(pageable: Pageable): Page<DunningSequence>

    fun findByCsmId(csmId: UUID, pageable: Pageable): Page<DunningSequence>

    @Query("""
        SELECT CASE WHEN COUNT(ds) > 0 THEN true ELSE false END
        FROM DunningSequence ds
        WHERE ds.organizationId = :organizationId
        AND ds.status = 'ACTIVE'
    """)
    fun existsActiveByOrganizationId(@Param("organizationId") organizationId: UUID): Boolean

    fun countByStatus(status: DunningStatus): Long

    @Query("SELECT COUNT(ds) FROM DunningSequence ds WHERE ds.status = 'ACTIVE'")
    fun countActive(): Long

    @Query("""
        SELECT
            CAST(COUNT(CASE WHEN ds.status = 'RECOVERED' THEN 1 END) AS DOUBLE) /
            NULLIF(CAST(COUNT(*) AS DOUBLE), 0)
        FROM DunningSequence ds
    """)
    fun getRecoveryRate(): Double?
}

@Repository
class JpaDunningSequenceRepository(
    private val springDataRepository: SpringDataDunningSequenceRepository
) : DunningSequenceRepository {

    override fun save(dunning: DunningSequence): DunningSequence =
        springDataRepository.save(dunning)

    override fun findById(id: UUID): Optional<DunningSequence> =
        springDataRepository.findById(id)

    override fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<DunningSequence> =
        springDataRepository.findByOrganizationId(organizationId, pageable)

    override fun findBySubscriptionId(subscriptionId: UUID): Optional<DunningSequence> =
        springDataRepository.findBySubscriptionId(subscriptionId)

    override fun findByInvoiceId(invoiceId: UUID): Optional<DunningSequence> =
        springDataRepository.findByInvoiceId(invoiceId)

    override fun findAll(pageable: Pageable): Page<DunningSequence> =
        springDataRepository.findAll(pageable)

    override fun findByStatus(status: DunningStatus, pageable: Pageable): Page<DunningSequence> =
        springDataRepository.findByStatus(status, pageable)

    override fun findActive(pageable: Pageable): Page<DunningSequence> =
        springDataRepository.findActive(pageable)

    override fun findActiveByOrganizationId(organizationId: UUID): Optional<DunningSequence> =
        springDataRepository.findActiveByOrganizationId(organizationId)

    override fun findWithRetryDue(dueDate: LocalDate): List<DunningSequence> =
        springDataRepository.findWithRetryDue(dueDate)

    override fun findReadyForSuspension(suspensionDay: Int): List<DunningSequence> =
        springDataRepository.findReadyForSuspension(suspensionDay)

    override fun findReadyForDeactivation(deactivationDay: Int): List<DunningSequence> =
        springDataRepository.findReadyForDeactivation(deactivationDay)

    override fun findEscalatedToCsm(pageable: Pageable): Page<DunningSequence> =
        springDataRepository.findEscalatedToCsm(pageable)

    override fun findByCsmId(csmId: UUID, pageable: Pageable): Page<DunningSequence> =
        springDataRepository.findByCsmId(csmId, pageable)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun existsActiveByOrganizationId(organizationId: UUID): Boolean =
        springDataRepository.existsActiveByOrganizationId(organizationId)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()

    override fun countByStatus(status: DunningStatus): Long =
        springDataRepository.countByStatus(status)

    override fun countActive(): Long =
        springDataRepository.countActive()

    override fun getRecoveryRate(): Double =
        springDataRepository.getRecoveryRate() ?: 0.0
}
