package com.liyaqa.marketing.domain.ports

import com.liyaqa.marketing.domain.model.Campaign
import com.liyaqa.marketing.domain.model.CampaignStatus
import com.liyaqa.marketing.domain.model.CampaignType
import com.liyaqa.marketing.domain.model.TriggerType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

/**
 * Port for campaign persistence operations.
 */
interface CampaignRepository {
    fun save(campaign: Campaign): Campaign
    fun findById(id: UUID): Optional<Campaign>
    fun findAll(pageable: Pageable): Page<Campaign>
    fun deleteById(id: UUID)
    fun existsById(id: UUID): Boolean

    /**
     * Find campaigns by status.
     */
    fun findByStatus(status: CampaignStatus, pageable: Pageable): Page<Campaign>

    /**
     * Find active campaigns by trigger type.
     */
    fun findActiveByTriggerType(triggerType: TriggerType): List<Campaign>

    /**
     * Find active campaigns by trigger type and days.
     */
    fun findActiveByTriggerTypeAndDays(triggerType: TriggerType, days: Int): List<Campaign>

    /**
     * Find active campaigns by campaign type.
     */
    fun findActiveByCampaignType(campaignType: CampaignType): List<Campaign>

    /**
     * Search campaigns by name.
     */
    fun search(
        search: String?,
        status: CampaignStatus?,
        campaignType: CampaignType?,
        pageable: Pageable
    ): Page<Campaign>

    /**
     * Count campaigns by status.
     */
    fun countByStatus(status: CampaignStatus): Long

    /**
     * Find all templates.
     */
    fun findTemplates(pageable: Pageable): Page<Campaign>

    /**
     * Count templates.
     */
    fun countTemplates(): Long
}
