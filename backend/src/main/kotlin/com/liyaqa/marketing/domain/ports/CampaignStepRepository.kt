package com.liyaqa.marketing.domain.ports

import com.liyaqa.marketing.domain.model.CampaignStep
import java.util.Optional
import java.util.UUID

/**
 * Port for campaign step persistence operations.
 */
interface CampaignStepRepository {
    fun save(step: CampaignStep): CampaignStep
    fun saveAll(steps: List<CampaignStep>): List<CampaignStep>
    fun findById(id: UUID): Optional<CampaignStep>
    fun deleteById(id: UUID)
    fun existsById(id: UUID): Boolean

    /**
     * Find all steps for a campaign, ordered by step number.
     */
    fun findByCampaignIdOrderByStepNumber(campaignId: UUID): List<CampaignStep>

    /**
     * Find active steps for a campaign, ordered by step number.
     */
    fun findActiveByCampaignId(campaignId: UUID): List<CampaignStep>

    /**
     * Find step by campaign ID and step number.
     */
    fun findByCampaignIdAndStepNumber(campaignId: UUID, stepNumber: Int): Optional<CampaignStep>

    /**
     * Find A/B test variants for a step.
     */
    fun findAbVariants(campaignId: UUID, stepNumber: Int): List<CampaignStep>

    /**
     * Delete all steps for a campaign.
     */
    fun deleteByCampaignId(campaignId: UUID)

    /**
     * Count steps for a campaign.
     */
    fun countByCampaignId(campaignId: UUID): Long

    /**
     * Get max step number for a campaign.
     */
    fun getMaxStepNumber(campaignId: UUID): Int?
}
