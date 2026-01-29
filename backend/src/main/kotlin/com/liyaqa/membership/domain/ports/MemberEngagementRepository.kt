package com.liyaqa.membership.domain.ports

import com.liyaqa.membership.domain.model.MemberEngagementScore
import com.liyaqa.membership.domain.model.RiskLevel
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface MemberEngagementRepository {

    fun save(score: MemberEngagementScore): MemberEngagementScore

    fun saveAll(scores: List<MemberEngagementScore>): List<MemberEngagementScore>

    fun findById(id: UUID): Optional<MemberEngagementScore>

    fun findByMemberId(memberId: UUID): Optional<MemberEngagementScore>

    fun findByRiskLevel(riskLevel: RiskLevel, pageable: Pageable): Page<MemberEngagementScore>

    fun findByRiskLevelIn(riskLevels: List<RiskLevel>, pageable: Pageable): Page<MemberEngagementScore>

    fun findByScoreRange(minScore: Int, maxScore: Int, pageable: Pageable): Page<MemberEngagementScore>

    fun findStaleScores(olderThan: Instant, pageable: Pageable): Page<MemberEngagementScore>

    fun findAllMemberIdsWithoutScore(): List<UUID>

    fun countByRiskLevel(riskLevel: RiskLevel): Long

    fun countByRiskLevelIn(riskLevels: List<RiskLevel>): Long

    fun getAverageScore(): Double

    fun getScoreDistribution(): Map<String, Long>

    fun getRiskLevelDistribution(): Map<RiskLevel, Long>

    fun deleteByMemberId(memberId: UUID)

    fun existsByMemberId(memberId: UUID): Boolean
}
