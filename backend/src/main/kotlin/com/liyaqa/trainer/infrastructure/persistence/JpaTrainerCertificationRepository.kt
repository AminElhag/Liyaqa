package com.liyaqa.trainer.infrastructure.persistence

import com.liyaqa.trainer.domain.model.CertificationStatus
import com.liyaqa.trainer.domain.model.TrainerCertification
import com.liyaqa.trainer.domain.ports.TrainerCertificationRepository
import jakarta.transaction.Transactional
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository for TrainerCertification entity.
 */
interface SpringDataTrainerCertificationRepository : JpaRepository<TrainerCertification, UUID> {
    /**
     * Find all certifications for a trainer.
     */
    fun findByTrainerId(trainerId: UUID, pageable: Pageable): Page<TrainerCertification>

    /**
     * Find active certifications for a trainer.
     */
    @Query("""
        SELECT tc FROM TrainerCertification tc
        WHERE tc.trainerId = :trainerId
        AND tc.status = 'ACTIVE'
        ORDER BY tc.expiryDate ASC NULLS LAST
    """)
    fun findActiveByTrainerId(@Param("trainerId") trainerId: UUID, pageable: Pageable): Page<TrainerCertification>

    /**
     * Find certifications by trainer and status.
     */
    fun findByTrainerIdAndStatus(
        trainerId: UUID,
        status: CertificationStatus,
        pageable: Pageable
    ): Page<TrainerCertification>

    /**
     * Find certifications expiring soon (within specified days).
     */
    @Query("""
        SELECT tc FROM TrainerCertification tc
        WHERE tc.status = 'ACTIVE'
        AND tc.expiryDate IS NOT NULL
        AND tc.expiryDate BETWEEN :now AND :threshold
        ORDER BY tc.expiryDate ASC
    """)
    fun findExpiringSoon(
        @Param("now") now: LocalDate,
        @Param("threshold") threshold: LocalDate,
        pageable: Pageable
    ): Page<TrainerCertification>

    /**
     * Find certifications expiring soon for a specific trainer.
     */
    @Query("""
        SELECT tc FROM TrainerCertification tc
        WHERE tc.trainerId = :trainerId
        AND tc.status = 'ACTIVE'
        AND tc.expiryDate IS NOT NULL
        AND tc.expiryDate BETWEEN :now AND :threshold
        ORDER BY tc.expiryDate ASC
    """)
    fun findExpiringSoonByTrainerId(
        @Param("trainerId") trainerId: UUID,
        @Param("now") now: LocalDate,
        @Param("threshold") threshold: LocalDate
    ): List<TrainerCertification>

    /**
     * Find unverified certifications (for admin verification queue).
     */
    @Query("""
        SELECT tc FROM TrainerCertification tc
        WHERE tc.isVerified = false
        ORDER BY tc.createdAt ASC
    """)
    fun findUnverified(pageable: Pageable): Page<TrainerCertification>

    /**
     * Find certifications by organization ID.
     */
    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<TrainerCertification>

    /**
     * Update expired certifications (set status to EXPIRED).
     */
    @Modifying(clearAutomatically = true)
    @Query("""
        UPDATE TrainerCertification tc
        SET tc.status = 'EXPIRED'
        WHERE tc.status = 'ACTIVE'
        AND tc.expiryDate < :now
    """)
    fun updateExpiredCertifications(@Param("now") now: LocalDate): Int
}

/**
 * Adapter implementing TrainerCertificationRepository using Spring Data JPA.
 */
@Repository
class JpaTrainerCertificationRepository(
    private val springDataRepository: SpringDataTrainerCertificationRepository
) : TrainerCertificationRepository {

    override fun save(certification: TrainerCertification): TrainerCertification {
        return springDataRepository.save(certification)
    }

    override fun findById(id: UUID): Optional<TrainerCertification> {
        return springDataRepository.findById(id)
    }

    override fun findAll(pageable: Pageable): Page<TrainerCertification> {
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

    override fun findByTrainerId(trainerId: UUID, pageable: Pageable): Page<TrainerCertification> {
        return springDataRepository.findByTrainerId(trainerId, pageable)
    }

    override fun findActiveByTrainerId(trainerId: UUID, pageable: Pageable): Page<TrainerCertification> {
        return springDataRepository.findActiveByTrainerId(trainerId, pageable)
    }

    override fun findByTrainerIdAndStatus(
        trainerId: UUID,
        status: CertificationStatus,
        pageable: Pageable
    ): Page<TrainerCertification> {
        return springDataRepository.findByTrainerIdAndStatus(trainerId, status, pageable)
    }

    override fun findExpiringSoon(daysThreshold: Int, pageable: Pageable): Page<TrainerCertification> {
        val now = LocalDate.now()
        val threshold = now.plusDays(daysThreshold.toLong())
        return springDataRepository.findExpiringSoon(now, threshold, pageable)
    }

    override fun findExpiringSoonByTrainerId(trainerId: UUID, daysThreshold: Int): List<TrainerCertification> {
        val now = LocalDate.now()
        val threshold = now.plusDays(daysThreshold.toLong())
        return springDataRepository.findExpiringSoonByTrainerId(trainerId, now, threshold)
    }

    override fun findUnverified(pageable: Pageable): Page<TrainerCertification> {
        return springDataRepository.findUnverified(pageable)
    }

    override fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<TrainerCertification> {
        return springDataRepository.findByOrganizationId(organizationId, pageable)
    }

    override fun findAllByIds(ids: List<UUID>): List<TrainerCertification> {
        return springDataRepository.findAllById(ids).toList()
    }

    @Transactional
    override fun updateExpiredCertifications(): Int {
        return springDataRepository.updateExpiredCertifications(LocalDate.now())
    }
}
