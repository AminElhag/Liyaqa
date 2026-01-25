package com.liyaqa.marketing.domain.ports

import com.liyaqa.marketing.domain.model.MessageLog
import com.liyaqa.marketing.domain.model.MessageStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.Optional
import java.util.UUID

/**
 * Port for message log persistence operations.
 */
interface MessageLogRepository {
    fun save(messageLog: MessageLog): MessageLog
    fun findById(id: UUID): Optional<MessageLog>
    fun findAll(pageable: Pageable): Page<MessageLog>
    fun deleteById(id: UUID)

    /**
     * Find messages by campaign.
     */
    fun findByCampaignId(campaignId: UUID, pageable: Pageable): Page<MessageLog>

    /**
     * Find messages by enrollment.
     */
    fun findByEnrollmentId(enrollmentId: UUID): List<MessageLog>

    /**
     * Find messages by step.
     */
    fun findByStepId(stepId: UUID, pageable: Pageable): Page<MessageLog>

    /**
     * Find messages by member.
     */
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<MessageLog>

    /**
     * Find messages by status.
     */
    fun findByStatus(status: MessageStatus, pageable: Pageable): Page<MessageLog>

    /**
     * Count messages by campaign and status.
     */
    fun countByCampaignIdAndStatus(campaignId: UUID, status: MessageStatus): Long

    /**
     * Count messages by step and status.
     */
    fun countByStepIdAndStatus(stepId: UUID, status: MessageStatus): Long

    /**
     * Count opened messages by campaign.
     */
    fun countOpenedByCampaignId(campaignId: UUID): Long

    /**
     * Count clicked messages by campaign.
     */
    fun countClickedByCampaignId(campaignId: UUID): Long

    /**
     * Find messages sent within time range.
     */
    fun findBySentAtBetween(start: Instant, end: Instant, pageable: Pageable): Page<MessageLog>

    /**
     * Get analytics summary for a campaign.
     */
    fun getCampaignStats(campaignId: UUID): CampaignMessageStats

    /**
     * Get analytics summary for a step.
     */
    fun getStepStats(stepId: UUID): StepMessageStats
}

/**
 * Statistics for campaign messages.
 */
data class CampaignMessageStats(
    val total: Long,
    val sent: Long,
    val delivered: Long,
    val failed: Long,
    val bounced: Long,
    val opened: Long,
    val clicked: Long
) {
    val deliveryRate: Double get() = if (sent > 0) delivered.toDouble() / sent else 0.0
    val openRate: Double get() = if (delivered > 0) opened.toDouble() / delivered else 0.0
    val clickRate: Double get() = if (opened > 0) clicked.toDouble() / opened else 0.0
}

/**
 * Statistics for step messages.
 */
data class StepMessageStats(
    val stepId: UUID,
    val total: Long,
    val sent: Long,
    val delivered: Long,
    val failed: Long,
    val opened: Long,
    val clicked: Long,
    val abVariant: Char? = null
)
