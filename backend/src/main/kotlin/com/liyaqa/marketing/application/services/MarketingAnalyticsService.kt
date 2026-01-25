package com.liyaqa.marketing.application.services

import com.liyaqa.marketing.domain.model.CampaignStatus
import com.liyaqa.marketing.domain.model.EnrollmentStatus
import com.liyaqa.marketing.domain.model.MessageStatus
import com.liyaqa.marketing.domain.ports.CampaignMessageStats
import com.liyaqa.marketing.domain.ports.CampaignRepository
import com.liyaqa.marketing.domain.ports.CampaignStepRepository
import com.liyaqa.marketing.domain.ports.EnrollmentRepository
import com.liyaqa.marketing.domain.ports.MessageLogRepository
import com.liyaqa.marketing.domain.ports.StepMessageStats
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.UUID

@Service
@Transactional(readOnly = true)
class MarketingAnalyticsService(
    private val campaignRepository: CampaignRepository,
    private val stepRepository: CampaignStepRepository,
    private val enrollmentRepository: EnrollmentRepository,
    private val messageLogRepository: MessageLogRepository
) {

    /**
     * Get marketing overview statistics.
     */
    fun getOverview(): MarketingOverview {
        val activeCampaigns = campaignRepository.countByStatus(CampaignStatus.ACTIVE)
        val draftCampaigns = campaignRepository.countByStatus(CampaignStatus.DRAFT)
        val pausedCampaigns = campaignRepository.countByStatus(CampaignStatus.PAUSED)

        // Get message stats for last 30 days
        val thirtyDaysAgo = Instant.now().minusSeconds(30 * 24 * 3600L)
        val recentMessages = messageLogRepository.findBySentAtBetween(
            thirtyDaysAgo,
            Instant.now(),
            PageRequest.of(0, 10000)
        )

        val totalSent = recentMessages.content.count { it.sentAt != null }
        val totalDelivered = recentMessages.content.count { it.deliveredAt != null }
        val totalOpened = recentMessages.content.count { it.openedAt != null }
        val totalClicked = recentMessages.content.count { it.clickedAt != null }

        return MarketingOverview(
            activeCampaigns = activeCampaigns,
            draftCampaigns = draftCampaigns,
            pausedCampaigns = pausedCampaigns,
            messagesSentLast30Days = totalSent.toLong(),
            deliveryRate = if (totalSent > 0) totalDelivered.toDouble() / totalSent else 0.0,
            openRate = if (totalDelivered > 0) totalOpened.toDouble() / totalDelivered else 0.0,
            clickRate = if (totalOpened > 0) totalClicked.toDouble() / totalOpened else 0.0
        )
    }

    /**
     * Get detailed campaign analytics.
     */
    fun getCampaignAnalytics(campaignId: UUID): CampaignAnalytics {
        val campaign = campaignRepository.findById(campaignId)
            .orElseThrow { NoSuchElementException("Campaign not found: $campaignId") }

        val messageStats = messageLogRepository.getCampaignStats(campaignId)

        val totalEnrolled = enrollmentRepository.countByCampaignId(campaignId)
        val activeEnrollments = enrollmentRepository.countByCampaignIdAndStatus(campaignId, EnrollmentStatus.ACTIVE)
        val completedEnrollments = enrollmentRepository.countByCampaignIdAndStatus(campaignId, EnrollmentStatus.COMPLETED)

        return CampaignAnalytics(
            campaignId = campaignId,
            campaignName = campaign.name,
            status = campaign.status,
            totalEnrolled = totalEnrolled,
            activeEnrollments = activeEnrollments,
            completedEnrollments = completedEnrollments,
            completionRate = if (totalEnrolled > 0) completedEnrollments.toDouble() / totalEnrolled else 0.0,
            messageStats = messageStats
        )
    }

    /**
     * Get A/B test results for a campaign.
     */
    fun getAbTestResults(campaignId: UUID): List<AbTestResult> {
        val steps = stepRepository.findByCampaignIdOrderByStepNumber(campaignId)
        val abSteps = steps.filter { it.isAbTest }.groupBy { it.stepNumber }

        return abSteps.map { (stepNumber, variants) ->
            val variantStats = variants.map { variant ->
                val stats = messageLogRepository.getStepStats(variant.id)
                AbTestVariantStats(
                    variant = variant.abVariant ?: '?',
                    stepId = variant.id,
                    sent = stats.sent,
                    delivered = stats.delivered,
                    opened = stats.opened,
                    clicked = stats.clicked,
                    openRate = if (stats.delivered > 0) stats.opened.toDouble() / stats.delivered else 0.0,
                    clickRate = if (stats.opened > 0) stats.clicked.toDouble() / stats.opened else 0.0
                )
            }

            AbTestResult(
                stepNumber = stepNumber,
                stepName = variants.first().name,
                variants = variantStats,
                winner = determineWinner(variantStats)
            )
        }
    }

    /**
     * Determine the winning variant based on click rate.
     */
    private fun determineWinner(variants: List<AbTestVariantStats>): Char? {
        if (variants.size < 2) return null
        val minSampleSize = 100 // Minimum messages to determine winner

        val eligibleVariants = variants.filter { it.sent >= minSampleSize }
        if (eligibleVariants.size < 2) return null

        return eligibleVariants.maxByOrNull { it.clickRate }?.variant
    }

    /**
     * Get campaign timeline (messages sent over time).
     */
    fun getCampaignTimeline(campaignId: UUID, days: Int = 30): List<TimelineDataPoint> {
        val endDate = LocalDate.now()
        val startDate = endDate.minusDays(days.toLong())

        val messages = messageLogRepository.findByCampaignId(campaignId, PageRequest.of(0, 10000))

        return (0 until days).map { dayOffset ->
            val date = startDate.plusDays(dayOffset.toLong())
            val dayStart = date.atStartOfDay(ZoneId.systemDefault()).toInstant()
            val dayEnd = date.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant()

            val dayMessages = messages.content.filter { msg ->
                msg.sentAt != null && msg.sentAt!!.isAfter(dayStart) && msg.sentAt!!.isBefore(dayEnd)
            }

            TimelineDataPoint(
                date = date,
                sent = dayMessages.count { it.sentAt != null }.toLong(),
                delivered = dayMessages.count { it.deliveredAt != null }.toLong(),
                opened = dayMessages.count { it.openedAt != null }.toLong(),
                clicked = dayMessages.count { it.clickedAt != null }.toLong()
            )
        }
    }

    /**
     * Get step-by-step analytics for a campaign.
     */
    fun getStepAnalytics(campaignId: UUID): List<StepMessageStats> {
        val steps = stepRepository.findByCampaignIdOrderByStepNumber(campaignId)
        return steps.map { step -> messageLogRepository.getStepStats(step.id) }
    }
}

data class MarketingOverview(
    val activeCampaigns: Long,
    val draftCampaigns: Long,
    val pausedCampaigns: Long,
    val messagesSentLast30Days: Long,
    val deliveryRate: Double,
    val openRate: Double,
    val clickRate: Double
)

data class CampaignAnalytics(
    val campaignId: UUID,
    val campaignName: String,
    val status: CampaignStatus,
    val totalEnrolled: Long,
    val activeEnrollments: Long,
    val completedEnrollments: Long,
    val completionRate: Double,
    val messageStats: CampaignMessageStats
)

data class AbTestResult(
    val stepNumber: Int,
    val stepName: String,
    val variants: List<AbTestVariantStats>,
    val winner: Char?
)

data class AbTestVariantStats(
    val variant: Char,
    val stepId: UUID,
    val sent: Long,
    val delivered: Long,
    val opened: Long,
    val clicked: Long,
    val openRate: Double,
    val clickRate: Double
)

data class TimelineDataPoint(
    val date: LocalDate,
    val sent: Long,
    val delivered: Long,
    val opened: Long,
    val clicked: Long
)
