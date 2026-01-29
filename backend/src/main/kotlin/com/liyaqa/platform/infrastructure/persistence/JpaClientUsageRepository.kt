package com.liyaqa.platform.infrastructure.persistence

import com.liyaqa.platform.domain.model.ClientUsage
import com.liyaqa.platform.domain.model.UsageLevel
import com.liyaqa.platform.domain.ports.ClientUsageRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataClientUsageRepository : JpaRepository<ClientUsage, UUID> {

    fun findByOrganizationId(organizationId: UUID): Optional<ClientUsage>

    @Query("""
        SELECT cu FROM ClientUsage cu
        WHERE cu.isExceeded = true
        ORDER BY cu.lastUpdated DESC
    """)
    fun findExceeded(pageable: Pageable): Page<ClientUsage>

    @Query("""
        SELECT cu FROM ClientUsage cu
        WHERE (cu.currentMembers * 100.0 / cu.maxMembers) >= :threshold
        OR (cu.currentStaff * 100.0 / cu.maxStaffUsers) >= :threshold
        OR (cu.currentClubs * 100.0 / cu.maxClubs) >= :threshold
        ORDER BY cu.lastUpdated DESC
    """)
    fun findApproachingLimits(
        @Param("threshold") threshold: Int,
        pageable: Pageable
    ): Page<ClientUsage>

    @Query("""
        SELECT cu FROM ClientUsage cu
        WHERE cu.gracePeriodEnds IS NOT NULL
        AND cu.gracePeriodEnds > CURRENT_TIMESTAMP
        ORDER BY cu.gracePeriodEnds ASC
    """)
    fun findInGracePeriod(pageable: Pageable): Page<ClientUsage>

    fun existsByOrganizationId(organizationId: UUID): Boolean

    @Query("SELECT COUNT(cu) FROM ClientUsage cu WHERE cu.isExceeded = true")
    fun countExceeded(): Long

    @Query("""
        SELECT COUNT(cu) FROM ClientUsage cu
        WHERE (cu.currentMembers * 100.0 / cu.maxMembers) >= :threshold
        OR (cu.currentStaff * 100.0 / cu.maxStaffUsers) >= :threshold
        OR (cu.currentClubs * 100.0 / cu.maxClubs) >= :threshold
    """)
    fun countApproachingLimits(@Param("threshold") threshold: Int): Long
}

@Repository
class JpaClientUsageRepository(
    private val springDataRepository: SpringDataClientUsageRepository
) : ClientUsageRepository {

    override fun save(usage: ClientUsage): ClientUsage =
        springDataRepository.save(usage)

    override fun findById(id: UUID): Optional<ClientUsage> =
        springDataRepository.findById(id)

    override fun findByOrganizationId(organizationId: UUID): Optional<ClientUsage> =
        springDataRepository.findByOrganizationId(organizationId)

    override fun findAll(pageable: Pageable): Page<ClientUsage> =
        springDataRepository.findAll(pageable)

    override fun findExceeded(pageable: Pageable): Page<ClientUsage> =
        springDataRepository.findExceeded(pageable)

    override fun findByMemberUsageLevel(level: UsageLevel, pageable: Pageable): Page<ClientUsage> {
        // Filter in application since UsageLevel is calculated
        val all = springDataRepository.findAll(pageable)
        return all // Would need custom implementation for filtering
    }

    override fun findApproachingLimits(warningThresholdPercent: Int, pageable: Pageable): Page<ClientUsage> =
        springDataRepository.findApproachingLimits(warningThresholdPercent, pageable)

    override fun findInGracePeriod(pageable: Pageable): Page<ClientUsage> =
        springDataRepository.findInGracePeriod(pageable)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun existsByOrganizationId(organizationId: UUID): Boolean =
        springDataRepository.existsByOrganizationId(organizationId)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()

    override fun countExceeded(): Long =
        springDataRepository.countExceeded()

    override fun countApproachingLimits(warningThresholdPercent: Int): Long =
        springDataRepository.countApproachingLimits(warningThresholdPercent)
}
