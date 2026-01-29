package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.membership.domain.model.MemberEngagementScore
import com.liyaqa.membership.domain.model.RiskLevel
import com.liyaqa.membership.domain.ports.MemberEngagementRepository
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

interface SpringDataMemberEngagementRepository : JpaRepository<MemberEngagementScore, UUID> {

    fun findByMemberId(memberId: UUID): Optional<MemberEngagementScore>

    fun findByRiskLevel(riskLevel: RiskLevel, pageable: Pageable): Page<MemberEngagementScore>

    fun findByRiskLevelIn(riskLevels: List<RiskLevel>, pageable: Pageable): Page<MemberEngagementScore>

    @Query("""
        SELECT e FROM MemberEngagementScore e
        WHERE e.overallScore >= :minScore AND e.overallScore <= :maxScore
        ORDER BY e.overallScore ASC
    """)
    fun findByScoreRange(
        @Param("minScore") minScore: Int,
        @Param("maxScore") maxScore: Int,
        pageable: Pageable
    ): Page<MemberEngagementScore>

    @Query("SELECT e FROM MemberEngagementScore e WHERE e.calculatedAt < :olderThan")
    fun findStaleScores(@Param("olderThan") olderThan: Instant, pageable: Pageable): Page<MemberEngagementScore>

    @Query("""
        SELECT m.id FROM Member m
        WHERE m.id NOT IN (SELECT e.memberId FROM MemberEngagementScore e)
        AND m.status = 'ACTIVE'
    """)
    fun findAllMemberIdsWithoutScore(): List<UUID>

    fun countByRiskLevel(riskLevel: RiskLevel): Long

    fun countByRiskLevelIn(riskLevels: List<RiskLevel>): Long

    @Query("SELECT AVG(e.overallScore) FROM MemberEngagementScore e")
    fun getAverageScore(): Double?

    @Query("""
        SELECT
            CASE
                WHEN e.overallScore >= 80 THEN 'excellent'
                WHEN e.overallScore >= 60 THEN 'good'
                WHEN e.overallScore >= 40 THEN 'fair'
                WHEN e.overallScore >= 20 THEN 'poor'
                ELSE 'critical'
            END as category,
            COUNT(e) as count
        FROM MemberEngagementScore e
        GROUP BY
            CASE
                WHEN e.overallScore >= 80 THEN 'excellent'
                WHEN e.overallScore >= 60 THEN 'good'
                WHEN e.overallScore >= 40 THEN 'fair'
                WHEN e.overallScore >= 20 THEN 'poor'
                ELSE 'critical'
            END
    """)
    fun getScoreDistribution(): List<ScoreDistributionProjection>

    @Query("SELECT e.riskLevel as riskLevel, COUNT(e) as count FROM MemberEngagementScore e GROUP BY e.riskLevel")
    fun getRiskLevelDistribution(): List<RiskDistributionProjection>

    @Modifying
    @Query("DELETE FROM MemberEngagementScore e WHERE e.memberId = :memberId")
    fun deleteByMemberId(@Param("memberId") memberId: UUID)

    fun existsByMemberId(memberId: UUID): Boolean
}

interface ScoreDistributionProjection {
    val category: String
    val count: Long
}

interface RiskDistributionProjection {
    val riskLevel: RiskLevel
    val count: Long
}

@Repository
class JpaMemberEngagementRepository(
    private val springDataRepository: SpringDataMemberEngagementRepository
) : MemberEngagementRepository {

    override fun save(score: MemberEngagementScore): MemberEngagementScore {
        return springDataRepository.save(score)
    }

    override fun saveAll(scores: List<MemberEngagementScore>): List<MemberEngagementScore> {
        return springDataRepository.saveAll(scores)
    }

    override fun findById(id: UUID): Optional<MemberEngagementScore> {
        return springDataRepository.findById(id)
    }

    override fun findByMemberId(memberId: UUID): Optional<MemberEngagementScore> {
        return springDataRepository.findByMemberId(memberId)
    }

    override fun findByRiskLevel(riskLevel: RiskLevel, pageable: Pageable): Page<MemberEngagementScore> {
        return springDataRepository.findByRiskLevel(riskLevel, pageable)
    }

    override fun findByRiskLevelIn(riskLevels: List<RiskLevel>, pageable: Pageable): Page<MemberEngagementScore> {
        return springDataRepository.findByRiskLevelIn(riskLevels, pageable)
    }

    override fun findByScoreRange(minScore: Int, maxScore: Int, pageable: Pageable): Page<MemberEngagementScore> {
        return springDataRepository.findByScoreRange(minScore, maxScore, pageable)
    }

    override fun findStaleScores(olderThan: Instant, pageable: Pageable): Page<MemberEngagementScore> {
        return springDataRepository.findStaleScores(olderThan, pageable)
    }

    override fun findAllMemberIdsWithoutScore(): List<UUID> {
        return springDataRepository.findAllMemberIdsWithoutScore()
    }

    override fun countByRiskLevel(riskLevel: RiskLevel): Long {
        return springDataRepository.countByRiskLevel(riskLevel)
    }

    override fun countByRiskLevelIn(riskLevels: List<RiskLevel>): Long {
        return springDataRepository.countByRiskLevelIn(riskLevels)
    }

    override fun getAverageScore(): Double {
        return springDataRepository.getAverageScore() ?: 0.0
    }

    override fun getScoreDistribution(): Map<String, Long> {
        return springDataRepository.getScoreDistribution().associate { it.category to it.count }
    }

    override fun getRiskLevelDistribution(): Map<RiskLevel, Long> {
        return springDataRepository.getRiskLevelDistribution().associate { it.riskLevel to it.count }
    }

    override fun deleteByMemberId(memberId: UUID) {
        springDataRepository.deleteByMemberId(memberId)
    }

    override fun existsByMemberId(memberId: UUID): Boolean {
        return springDataRepository.existsByMemberId(memberId)
    }
}
