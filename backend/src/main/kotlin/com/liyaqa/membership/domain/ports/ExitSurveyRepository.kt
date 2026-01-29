package com.liyaqa.membership.domain.ports

import com.liyaqa.membership.domain.model.CancellationReasonCategory
import com.liyaqa.membership.domain.model.ExitSurvey
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.Optional
import java.util.UUID

/**
 * Repository port for ExitSurvey entity.
 * Exit surveys are tenant-scoped (belong to a club).
 */
interface ExitSurveyRepository {
    fun save(survey: ExitSurvey): ExitSurvey
    fun findById(id: UUID): Optional<ExitSurvey>
    fun findByMemberId(memberId: UUID): Optional<ExitSurvey>
    fun findBySubscriptionId(subscriptionId: UUID): Optional<ExitSurvey>
    fun findByReasonCategory(category: CancellationReasonCategory, pageable: Pageable): Page<ExitSurvey>
    fun findAll(pageable: Pageable): Page<ExitSurvey>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long

    /**
     * Find surveys within a date range.
     */
    fun findByCreatedAtBetween(startDate: Instant, endDate: Instant, pageable: Pageable): Page<ExitSurvey>

    /**
     * Count surveys by reason category.
     */
    fun countByReasonCategory(category: CancellationReasonCategory): Long

    /**
     * Get reason category statistics.
     */
    fun getReasonCategoryStats(): List<Map<String, Any>>

    /**
     * Get average NPS score.
     */
    fun getAverageNpsScore(): Double?

    /**
     * Get NPS score distribution.
     */
    fun getNpsDistribution(): Map<String, Long>
}
