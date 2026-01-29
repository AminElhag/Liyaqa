package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.membership.domain.model.CancellationReasonCategory
import com.liyaqa.membership.domain.model.ExitSurvey
import com.liyaqa.membership.domain.ports.ExitSurveyRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface SpringDataExitSurveyRepository : JpaRepository<ExitSurvey, UUID> {
    fun findByMemberId(memberId: UUID): Optional<ExitSurvey>

    fun findBySubscriptionId(subscriptionId: UUID): Optional<ExitSurvey>

    fun findByReasonCategory(category: CancellationReasonCategory, pageable: Pageable): Page<ExitSurvey>

    @Query("SELECT s FROM ExitSurvey s WHERE s.createdAt BETWEEN :startDate AND :endDate")
    fun findByCreatedAtBetween(
        @Param("startDate") startDate: Instant,
        @Param("endDate") endDate: Instant,
        pageable: Pageable
    ): Page<ExitSurvey>

    fun countByReasonCategory(category: CancellationReasonCategory): Long

    @Query("""
        SELECT s.reasonCategory as category, COUNT(s) as count
        FROM ExitSurvey s
        GROUP BY s.reasonCategory
    """)
    fun getReasonCategoryStatsRaw(): List<Array<Any>>

    @Query("SELECT AVG(s.npsScore) FROM ExitSurvey s WHERE s.npsScore IS NOT NULL")
    fun getAverageNpsScore(): Double?

    @Query("""
        SELECT
            SUM(CASE WHEN s.npsScore >= 9 THEN 1 ELSE 0 END) as promoters,
            SUM(CASE WHEN s.npsScore >= 7 AND s.npsScore <= 8 THEN 1 ELSE 0 END) as passives,
            SUM(CASE WHEN s.npsScore <= 6 THEN 1 ELSE 0 END) as detractors
        FROM ExitSurvey s WHERE s.npsScore IS NOT NULL
    """)
    fun getNpsDistributionRaw(): Array<Any>
}

@Repository
class JpaExitSurveyRepository(
    private val springDataRepository: SpringDataExitSurveyRepository
) : ExitSurveyRepository {

    override fun save(survey: ExitSurvey): ExitSurvey =
        springDataRepository.save(survey)

    override fun findById(id: UUID): Optional<ExitSurvey> =
        springDataRepository.findById(id)

    override fun findByMemberId(memberId: UUID): Optional<ExitSurvey> =
        springDataRepository.findByMemberId(memberId)

    override fun findBySubscriptionId(subscriptionId: UUID): Optional<ExitSurvey> =
        springDataRepository.findBySubscriptionId(subscriptionId)

    override fun findByReasonCategory(category: CancellationReasonCategory, pageable: Pageable): Page<ExitSurvey> =
        springDataRepository.findByReasonCategory(category, pageable)

    override fun findAll(pageable: Pageable): Page<ExitSurvey> =
        springDataRepository.findAll(pageable)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()

    override fun findByCreatedAtBetween(startDate: Instant, endDate: Instant, pageable: Pageable): Page<ExitSurvey> =
        springDataRepository.findByCreatedAtBetween(startDate, endDate, pageable)

    override fun countByReasonCategory(category: CancellationReasonCategory): Long =
        springDataRepository.countByReasonCategory(category)

    override fun getReasonCategoryStats(): List<Map<String, Any>> {
        val results = springDataRepository.getReasonCategoryStatsRaw()
        return results.map { row ->
            mapOf(
                "category" to row[0] as CancellationReasonCategory,
                "count" to (row[1] as Number).toLong()
            )
        }
    }

    override fun getAverageNpsScore(): Double? =
        springDataRepository.getAverageNpsScore()

    override fun getNpsDistribution(): Map<String, Long> {
        val result = springDataRepository.getNpsDistributionRaw()
        return mapOf(
            "promoters" to ((result[0] as? Number)?.toLong() ?: 0L),
            "passives" to ((result[1] as? Number)?.toLong() ?: 0L),
            "detractors" to ((result[2] as? Number)?.toLong() ?: 0L)
        )
    }
}
