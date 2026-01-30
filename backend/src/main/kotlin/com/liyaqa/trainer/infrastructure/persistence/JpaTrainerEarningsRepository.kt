package com.liyaqa.trainer.infrastructure.persistence

import com.liyaqa.trainer.domain.model.EarningStatus
import com.liyaqa.trainer.domain.model.TrainerEarnings
import com.liyaqa.trainer.domain.ports.TrainerEarningsRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.math.BigDecimal
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository for TrainerEarnings entity.
 */
interface SpringDataTrainerEarningsRepository : JpaRepository<TrainerEarnings, UUID> {
    /**
     * Find all earnings for a trainer.
     */
    fun findByTrainerId(trainerId: UUID, pageable: Pageable): Page<TrainerEarnings>

    /**
     * Find earnings by trainer and status.
     */
    fun findByTrainerIdAndStatus(trainerId: UUID, status: EarningStatus, pageable: Pageable): Page<TrainerEarnings>

    /**
     * Find earnings by trainer and date range.
     */
    fun findByTrainerIdAndEarningDateBetween(
        trainerId: UUID,
        startDate: LocalDate,
        endDate: LocalDate,
        pageable: Pageable
    ): Page<TrainerEarnings>

    /**
     * Find earnings by trainer, status, and date range.
     */
    fun findByTrainerIdAndStatusAndEarningDateBetween(
        trainerId: UUID,
        status: EarningStatus,
        startDate: LocalDate,
        endDate: LocalDate,
        pageable: Pageable
    ): Page<TrainerEarnings>

    /**
     * Find pending or approved earnings for a trainer (awaiting payment).
     */
    @Query("""
        SELECT te FROM TrainerEarnings te
        WHERE te.trainerId = :trainerId
        AND te.status IN ('PENDING', 'APPROVED')
        ORDER BY te.earningDate DESC
    """)
    fun findPendingPaymentByTrainerId(@Param("trainerId") trainerId: UUID, pageable: Pageable): Page<TrainerEarnings>

    /**
     * Find earnings by session ID.
     */
    fun findBySessionId(sessionId: UUID): Optional<TrainerEarnings>

    /**
     * Check if earnings exist for a session.
     */
    fun existsBySessionId(sessionId: UUID): Boolean

    /**
     * Find all pending earnings (across all trainers) - for admin approval.
     */
    fun findByStatus(status: EarningStatus, pageable: Pageable): Page<TrainerEarnings>

    /**
     * Find earnings by organization ID (for admin reports).
     */
    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<TrainerEarnings>

    /**
     * Calculate total earnings for a trainer (optionally filtered by status).
     */
    @Query("""
        SELECT COALESCE(SUM(te.netAmount.amount), 0)
        FROM TrainerEarnings te
        WHERE te.trainerId = :trainerId
        AND (:status IS NULL OR te.status = :status)
    """)
    fun calculateTotalEarnings(
        @Param("trainerId") trainerId: UUID,
        @Param("status") status: EarningStatus?
    ): BigDecimal
}

/**
 * Adapter implementing TrainerEarningsRepository using Spring Data JPA.
 */
@Repository
class JpaTrainerEarningsRepository(
    private val springDataRepository: SpringDataTrainerEarningsRepository
) : TrainerEarningsRepository {

    override fun save(earnings: TrainerEarnings): TrainerEarnings {
        return springDataRepository.save(earnings)
    }

    override fun findById(id: UUID): Optional<TrainerEarnings> {
        return springDataRepository.findById(id)
    }

    override fun findAll(pageable: Pageable): Page<TrainerEarnings> {
        return springDataRepository.findAll(pageable)
    }

    override fun existsById(id: UUID): Boolean {
        return springDataRepository.existsById(id)
    }

    override fun deleteById(id: UUID) {
        springDataRepository.deleteById(id)
    }

    override fun count(): Long {
        return springDataRepository.count()
    }

    override fun findByTrainerId(trainerId: UUID, pageable: Pageable): Page<TrainerEarnings> {
        return springDataRepository.findByTrainerId(trainerId, pageable)
    }

    override fun findByTrainerIdAndStatus(trainerId: UUID, status: EarningStatus, pageable: Pageable): Page<TrainerEarnings> {
        return springDataRepository.findByTrainerIdAndStatus(trainerId, status, pageable)
    }

    override fun findByTrainerIdAndEarningDateBetween(
        trainerId: UUID,
        startDate: LocalDate,
        endDate: LocalDate,
        pageable: Pageable
    ): Page<TrainerEarnings> {
        return springDataRepository.findByTrainerIdAndEarningDateBetween(trainerId, startDate, endDate, pageable)
    }

    override fun findByTrainerIdAndStatusAndEarningDateBetween(
        trainerId: UUID,
        status: EarningStatus,
        startDate: LocalDate,
        endDate: LocalDate,
        pageable: Pageable
    ): Page<TrainerEarnings> {
        return springDataRepository.findByTrainerIdAndStatusAndEarningDateBetween(trainerId, status, startDate, endDate, pageable)
    }

    override fun findPendingPaymentByTrainerId(trainerId: UUID, pageable: Pageable): Page<TrainerEarnings> {
        return springDataRepository.findPendingPaymentByTrainerId(trainerId, pageable)
    }

    override fun findBySessionId(sessionId: UUID): Optional<TrainerEarnings> {
        return springDataRepository.findBySessionId(sessionId)
    }

    override fun findByStatus(status: EarningStatus, pageable: Pageable): Page<TrainerEarnings> {
        return springDataRepository.findByStatus(status, pageable)
    }

    override fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<TrainerEarnings> {
        return springDataRepository.findByOrganizationId(organizationId, pageable)
    }

    override fun findAllByIds(ids: List<UUID>): List<TrainerEarnings> {
        return springDataRepository.findAllById(ids).toList()
    }

    override fun calculateTotalEarnings(trainerId: UUID, status: EarningStatus?): BigDecimal {
        return springDataRepository.calculateTotalEarnings(trainerId, status)
    }
}
