package com.liyaqa.platform.domain.ports

import com.liyaqa.platform.domain.model.ClientHealthScore
import com.liyaqa.platform.domain.model.RiskLevel
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.Optional
import java.util.UUID

/**
 * Repository port for ClientHealthScore entity.
 * Tracks client health metrics for proactive management.
 */
interface ClientHealthScoreRepository {
    fun save(score: ClientHealthScore): ClientHealthScore
    fun saveAll(scores: List<ClientHealthScore>): List<ClientHealthScore>
    fun findById(id: UUID): Optional<ClientHealthScore>
    fun findLatestByOrganizationId(organizationId: UUID): Optional<ClientHealthScore>
    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<ClientHealthScore>
    fun findAll(pageable: Pageable): Page<ClientHealthScore>
    fun findByRiskLevel(riskLevel: RiskLevel, pageable: Pageable): Page<ClientHealthScore>
    fun findAtRisk(pageable: Pageable): Page<ClientHealthScore>
    fun findHealthy(pageable: Pageable): Page<ClientHealthScore>
    fun findDeclining(pageable: Pageable): Page<ClientHealthScore>
    fun findByScoreRange(minScore: Int, maxScore: Int, pageable: Pageable): Page<ClientHealthScore>
    fun findHistoryByOrganizationId(organizationId: UUID, since: Instant, pageable: Pageable): Page<ClientHealthScore>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun deleteByOrganizationIdAndCalculatedAtBefore(organizationId: UUID, before: Instant): Int
    fun count(): Long
    fun countByRiskLevel(riskLevel: RiskLevel): Long
    fun getAverageScore(): Double
    fun getScoreDistribution(): Map<RiskLevel, Long>
}
