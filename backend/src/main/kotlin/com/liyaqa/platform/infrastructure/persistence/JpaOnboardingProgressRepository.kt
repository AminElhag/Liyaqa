package com.liyaqa.platform.infrastructure.persistence

import com.liyaqa.platform.domain.model.OnboardingPhase
import com.liyaqa.platform.domain.model.OnboardingProgress
import com.liyaqa.platform.domain.ports.OnboardingProgressRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface SpringDataOnboardingProgressRepository : JpaRepository<OnboardingProgress, UUID> {

    fun findByOrganizationId(organizationId: UUID): Optional<OnboardingProgress>

    fun findByClubId(clubId: UUID): Optional<OnboardingProgress>

    fun findByCurrentPhase(phase: OnboardingPhase, pageable: Pageable): Page<OnboardingProgress>

    @Query("""
        SELECT op FROM OnboardingProgress op
        WHERE op.completedAt IS NULL
        ORDER BY op.startedAt DESC
    """)
    fun findIncomplete(pageable: Pageable): Page<OnboardingProgress>

    @Query("""
        SELECT op FROM OnboardingProgress op
        WHERE op.completedAt IS NOT NULL
        ORDER BY op.completedAt DESC
    """)
    fun findComplete(pageable: Pageable): Page<OnboardingProgress>

    @Query("""
        SELECT op FROM OnboardingProgress op
        WHERE op.completedAt IS NULL
        AND (op.lastActivityAt IS NULL OR op.lastActivityAt < :stalledSince)
        ORDER BY op.lastActivityAt ASC
    """)
    fun findStalled(
        @Param("stalledSince") stalledSince: Instant,
        pageable: Pageable
    ): Page<OnboardingProgress>

    fun existsByOrganizationId(organizationId: UUID): Boolean

    fun countByCurrentPhase(phase: OnboardingPhase): Long

    @Query("SELECT COUNT(op) FROM OnboardingProgress op WHERE op.completedAt IS NOT NULL")
    fun countComplete(): Long

    @Query("SELECT COUNT(op) FROM OnboardingProgress op WHERE op.completedAt IS NULL")
    fun countIncomplete(): Long
}

@Repository
class JpaOnboardingProgressRepository(
    private val springDataRepository: SpringDataOnboardingProgressRepository
) : OnboardingProgressRepository {

    override fun save(progress: OnboardingProgress): OnboardingProgress =
        springDataRepository.save(progress)

    override fun findById(id: UUID): Optional<OnboardingProgress> =
        springDataRepository.findById(id)

    override fun findByOrganizationId(organizationId: UUID): Optional<OnboardingProgress> =
        springDataRepository.findByOrganizationId(organizationId)

    override fun findByClubId(clubId: UUID): Optional<OnboardingProgress> =
        springDataRepository.findByClubId(clubId)

    override fun findAll(pageable: Pageable): Page<OnboardingProgress> =
        springDataRepository.findAll(pageable)

    override fun findByCurrentPhase(phase: OnboardingPhase, pageable: Pageable): Page<OnboardingProgress> =
        springDataRepository.findByCurrentPhase(phase, pageable)

    override fun findIncomplete(pageable: Pageable): Page<OnboardingProgress> =
        springDataRepository.findIncomplete(pageable)

    override fun findComplete(pageable: Pageable): Page<OnboardingProgress> =
        springDataRepository.findComplete(pageable)

    override fun findStalled(stalledSince: Instant, pageable: Pageable): Page<OnboardingProgress> =
        springDataRepository.findStalled(stalledSince, pageable)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun existsByOrganizationId(organizationId: UUID): Boolean =
        springDataRepository.existsByOrganizationId(organizationId)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()

    override fun countByCurrentPhase(phase: OnboardingPhase): Long =
        springDataRepository.countByCurrentPhase(phase)

    override fun countComplete(): Long =
        springDataRepository.countComplete()

    override fun countIncomplete(): Long =
        springDataRepository.countIncomplete()
}
