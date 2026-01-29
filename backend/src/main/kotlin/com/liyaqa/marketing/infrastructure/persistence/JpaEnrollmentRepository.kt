package com.liyaqa.marketing.infrastructure.persistence

import com.liyaqa.marketing.domain.model.CampaignEnrollment
import com.liyaqa.marketing.domain.model.EnrollmentStatus
import com.liyaqa.marketing.domain.ports.EnrollmentRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface SpringDataEnrollmentRepository : JpaRepository<CampaignEnrollment, UUID> {

    fun findByCampaignId(campaignId: UUID, pageable: Pageable): Page<CampaignEnrollment>

    @Query("""
        SELECT e FROM CampaignEnrollment e
        WHERE e.campaignId = :campaignId
        AND e.status = 'ACTIVE'
    """)
    fun findActiveByCampaignId(
        @Param("campaignId") campaignId: UUID,
        pageable: Pageable
    ): Page<CampaignEnrollment>

    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<CampaignEnrollment>

    @Query("""
        SELECT e FROM CampaignEnrollment e
        WHERE e.memberId = :memberId
        AND e.campaignId = :campaignId
        AND e.status = 'ACTIVE'
    """)
    fun findActiveByMemberIdAndCampaignId(
        @Param("memberId") memberId: UUID,
        @Param("campaignId") campaignId: UUID
    ): Optional<CampaignEnrollment>

    fun existsByMemberIdAndCampaignIdAndStatus(
        memberId: UUID,
        campaignId: UUID,
        status: EnrollmentStatus
    ): Boolean

    @Query("""
        SELECT e FROM CampaignEnrollment e
        WHERE e.nextStepDueAt IS NOT NULL
        AND e.nextStepDueAt <= :dueTime
    """)
    fun findWithNextStepDueBefore(
        @Param("dueTime") dueTime: Instant,
        pageable: Pageable
    ): Page<CampaignEnrollment>

    @Query("""
        SELECT e FROM CampaignEnrollment e
        WHERE e.status = 'ACTIVE'
        AND e.nextStepDueAt IS NOT NULL
        AND e.nextStepDueAt <= :dueTime
    """)
    fun findActiveWithNextStepDueBefore(
        @Param("dueTime") dueTime: Instant,
        pageable: Pageable
    ): Page<CampaignEnrollment>

    fun countByCampaignIdAndStatus(campaignId: UUID, status: EnrollmentStatus): Long

    fun countByCampaignId(campaignId: UUID): Long

    fun findByStatus(status: EnrollmentStatus, pageable: Pageable): Page<CampaignEnrollment>

    @Modifying
    @Query("""
        UPDATE CampaignEnrollment e
        SET e.status = 'CANCELLED', e.cancelledAt = :now, e.nextStepDueAt = NULL
        WHERE e.campaignId = :campaignId
        AND e.status = 'ACTIVE'
    """)
    fun cancelAllByCampaignId(@Param("campaignId") campaignId: UUID, @Param("now") now: Instant): Int
}

@Repository
class JpaEnrollmentRepository(
    private val springDataRepository: SpringDataEnrollmentRepository
) : EnrollmentRepository {

    override fun save(enrollment: CampaignEnrollment): CampaignEnrollment =
        springDataRepository.save(enrollment)

    override fun saveAll(enrollments: List<CampaignEnrollment>): List<CampaignEnrollment> =
        springDataRepository.saveAll(enrollments)

    override fun findById(id: UUID): Optional<CampaignEnrollment> = springDataRepository.findById(id)

    override fun deleteById(id: UUID) = springDataRepository.deleteById(id)

    override fun existsById(id: UUID): Boolean = springDataRepository.existsById(id)

    override fun findByCampaignId(campaignId: UUID, pageable: Pageable): Page<CampaignEnrollment> =
        springDataRepository.findByCampaignId(campaignId, pageable)

    override fun findActiveByCampaignId(campaignId: UUID, pageable: Pageable): Page<CampaignEnrollment> =
        springDataRepository.findActiveByCampaignId(campaignId, pageable)

    override fun findByMemberId(memberId: UUID, pageable: Pageable): Page<CampaignEnrollment> =
        springDataRepository.findByMemberId(memberId, pageable)

    override fun findActiveByMemberIdAndCampaignId(
        memberId: UUID,
        campaignId: UUID
    ): Optional<CampaignEnrollment> =
        springDataRepository.findActiveByMemberIdAndCampaignId(memberId, campaignId)

    override fun existsByMemberIdAndCampaignIdAndStatus(
        memberId: UUID,
        campaignId: UUID,
        status: EnrollmentStatus
    ): Boolean = springDataRepository.existsByMemberIdAndCampaignIdAndStatus(memberId, campaignId, status)

    override fun findWithNextStepDueBefore(dueTime: Instant, pageable: Pageable): Page<CampaignEnrollment> =
        springDataRepository.findWithNextStepDueBefore(dueTime, pageable)

    override fun findActiveWithNextStepDueBefore(
        dueTime: Instant,
        pageable: Pageable
    ): Page<CampaignEnrollment> =
        springDataRepository.findActiveWithNextStepDueBefore(dueTime, pageable)

    override fun countByCampaignIdAndStatus(campaignId: UUID, status: EnrollmentStatus): Long =
        springDataRepository.countByCampaignIdAndStatus(campaignId, status)

    override fun countByCampaignId(campaignId: UUID): Long = springDataRepository.countByCampaignId(campaignId)

    override fun findByStatus(status: EnrollmentStatus, pageable: Pageable): Page<CampaignEnrollment> =
        springDataRepository.findByStatus(status, pageable)

    override fun cancelAllByCampaignId(campaignId: UUID): Int =
        springDataRepository.cancelAllByCampaignId(campaignId, Instant.now())
}
