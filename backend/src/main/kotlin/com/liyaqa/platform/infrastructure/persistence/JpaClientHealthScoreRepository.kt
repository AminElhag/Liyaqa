package com.liyaqa.platform.infrastructure.persistence

import com.liyaqa.platform.domain.model.ClientHealthScore
import com.liyaqa.platform.domain.model.HealthTrend
import com.liyaqa.platform.domain.model.RiskLevel
import com.liyaqa.platform.domain.ports.ClientHealthScoreRepository
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

interface SpringDataClientHealthScoreRepository : JpaRepository<ClientHealthScore, UUID> {

    @Query("""
        SELECT chs FROM ClientHealthScore chs
        WHERE chs.organizationId = :organizationId
        ORDER BY chs.calculatedAt DESC
        LIMIT 1
    """)
    fun findLatestByOrganizationId(@Param("organizationId") organizationId: UUID): Optional<ClientHealthScore>

    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<ClientHealthScore>

    fun findByRiskLevel(riskLevel: RiskLevel, pageable: Pageable): Page<ClientHealthScore>

    @Query("""
        SELECT chs FROM ClientHealthScore chs
        WHERE chs.riskLevel IN ('HIGH', 'CRITICAL')
        AND chs.calculatedAt = (
            SELECT MAX(chs2.calculatedAt) FROM ClientHealthScore chs2
            WHERE chs2.organizationId = chs.organizationId
        )
        ORDER BY chs.overallScore ASC
    """)
    fun findAtRisk(pageable: Pageable): Page<ClientHealthScore>

    @Query("""
        SELECT chs FROM ClientHealthScore chs
        WHERE chs.riskLevel = 'LOW'
        AND chs.calculatedAt = (
            SELECT MAX(chs2.calculatedAt) FROM ClientHealthScore chs2
            WHERE chs2.organizationId = chs.organizationId
        )
        ORDER BY chs.overallScore DESC
    """)
    fun findHealthy(pageable: Pageable): Page<ClientHealthScore>

    @Query("""
        SELECT chs FROM ClientHealthScore chs
        WHERE chs.trend = 'DECLINING'
        AND chs.calculatedAt = (
            SELECT MAX(chs2.calculatedAt) FROM ClientHealthScore chs2
            WHERE chs2.organizationId = chs.organizationId
        )
        ORDER BY chs.scoreChange ASC
    """)
    fun findDeclining(pageable: Pageable): Page<ClientHealthScore>

    @Query("""
        SELECT chs FROM ClientHealthScore chs
        WHERE chs.overallScore >= :minScore
        AND chs.overallScore <= :maxScore
        AND chs.calculatedAt = (
            SELECT MAX(chs2.calculatedAt) FROM ClientHealthScore chs2
            WHERE chs2.organizationId = chs.organizationId
        )
    """)
    fun findByScoreRange(
        @Param("minScore") minScore: Int,
        @Param("maxScore") maxScore: Int,
        pageable: Pageable
    ): Page<ClientHealthScore>

    @Query("""
        SELECT chs FROM ClientHealthScore chs
        WHERE chs.organizationId = :organizationId
        AND chs.calculatedAt >= :since
        ORDER BY chs.calculatedAt DESC
    """)
    fun findHistoryByOrganizationId(
        @Param("organizationId") organizationId: UUID,
        @Param("since") since: Instant,
        pageable: Pageable
    ): Page<ClientHealthScore>

    @Modifying
    @Query("""
        DELETE FROM ClientHealthScore chs
        WHERE chs.organizationId = :organizationId
        AND chs.calculatedAt < :before
    """)
    fun deleteByOrganizationIdAndCalculatedAtBefore(
        @Param("organizationId") organizationId: UUID,
        @Param("before") before: Instant
    ): Int

    fun countByRiskLevel(riskLevel: RiskLevel): Long

    @Query("SELECT AVG(chs.overallScore) FROM ClientHealthScore chs")
    fun getAverageScore(): Double?

    @Query("""
        SELECT chs.riskLevel, COUNT(chs) FROM ClientHealthScore chs
        WHERE chs.calculatedAt = (
            SELECT MAX(chs2.calculatedAt) FROM ClientHealthScore chs2
            WHERE chs2.organizationId = chs.organizationId
        )
        GROUP BY chs.riskLevel
    """)
    fun getScoreDistributionRaw(): List<Array<Any>>
}

@Repository
class JpaClientHealthScoreRepository(
    private val springDataRepository: SpringDataClientHealthScoreRepository
) : ClientHealthScoreRepository {

    override fun save(score: ClientHealthScore): ClientHealthScore =
        springDataRepository.save(score)

    override fun saveAll(scores: List<ClientHealthScore>): List<ClientHealthScore> =
        springDataRepository.saveAll(scores)

    override fun findById(id: UUID): Optional<ClientHealthScore> =
        springDataRepository.findById(id)

    override fun findLatestByOrganizationId(organizationId: UUID): Optional<ClientHealthScore> =
        springDataRepository.findLatestByOrganizationId(organizationId)

    override fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<ClientHealthScore> =
        springDataRepository.findByOrganizationId(organizationId, pageable)

    override fun findAll(pageable: Pageable): Page<ClientHealthScore> =
        springDataRepository.findAll(pageable)

    override fun findByRiskLevel(riskLevel: RiskLevel, pageable: Pageable): Page<ClientHealthScore> =
        springDataRepository.findByRiskLevel(riskLevel, pageable)

    override fun findAtRisk(pageable: Pageable): Page<ClientHealthScore> =
        springDataRepository.findAtRisk(pageable)

    override fun findHealthy(pageable: Pageable): Page<ClientHealthScore> =
        springDataRepository.findHealthy(pageable)

    override fun findDeclining(pageable: Pageable): Page<ClientHealthScore> =
        springDataRepository.findDeclining(pageable)

    override fun findByScoreRange(minScore: Int, maxScore: Int, pageable: Pageable): Page<ClientHealthScore> =
        springDataRepository.findByScoreRange(minScore, maxScore, pageable)

    override fun findHistoryByOrganizationId(
        organizationId: UUID,
        since: Instant,
        pageable: Pageable
    ): Page<ClientHealthScore> =
        springDataRepository.findHistoryByOrganizationId(organizationId, since, pageable)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun deleteByOrganizationIdAndCalculatedAtBefore(organizationId: UUID, before: Instant): Int =
        springDataRepository.deleteByOrganizationIdAndCalculatedAtBefore(organizationId, before)

    override fun count(): Long =
        springDataRepository.count()

    override fun countByRiskLevel(riskLevel: RiskLevel): Long =
        springDataRepository.countByRiskLevel(riskLevel)

    override fun getAverageScore(): Double =
        springDataRepository.getAverageScore() ?: 0.0

    override fun getScoreDistribution(): Map<RiskLevel, Long> {
        val rawResults = springDataRepository.getScoreDistributionRaw()
        return rawResults.associate { row ->
            (row[0] as RiskLevel) to (row[1] as Long)
        }
    }
}
