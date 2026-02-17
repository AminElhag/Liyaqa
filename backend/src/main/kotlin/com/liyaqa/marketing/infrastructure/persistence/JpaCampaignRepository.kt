package com.liyaqa.marketing.infrastructure.persistence

import com.liyaqa.marketing.domain.model.Campaign
import com.liyaqa.marketing.domain.model.CampaignStatus
import com.liyaqa.marketing.domain.model.CampaignType
import com.liyaqa.marketing.domain.model.TriggerType
import com.liyaqa.marketing.domain.ports.CampaignRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataCampaignRepository : JpaRepository<Campaign, UUID> {

    fun findByStatus(status: CampaignStatus, pageable: Pageable): Page<Campaign>

    @Query("""
        SELECT c FROM Campaign c
        WHERE c.status = 'ACTIVE'
        AND c.triggerType = :triggerType
        AND (c.startDate IS NULL OR c.startDate <= CURRENT_DATE)
        AND (c.endDate IS NULL OR c.endDate >= CURRENT_DATE)
    """)
    fun findActiveByTriggerType(@Param("triggerType") triggerType: TriggerType): List<Campaign>

    @Query("""
        SELECT c FROM Campaign c
        WHERE c.status = 'ACTIVE'
        AND c.campaignType = :campaignType
        AND (c.startDate IS NULL OR c.startDate <= CURRENT_DATE)
        AND (c.endDate IS NULL OR c.endDate >= CURRENT_DATE)
    """)
    fun findActiveByCampaignType(@Param("campaignType") campaignType: CampaignType): List<Campaign>

    @Query("""
        SELECT c FROM Campaign c
        WHERE (CAST(:search AS string) IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
        AND (CAST(:status AS string) IS NULL OR c.status = :status)
        AND (CAST(:campaignType AS string) IS NULL OR c.campaignType = :campaignType)
    """)
    fun search(
        @Param("search") search: String?,
        @Param("status") status: CampaignStatus?,
        @Param("campaignType") campaignType: CampaignType?,
        pageable: Pageable
    ): Page<Campaign>

    fun countByStatus(status: CampaignStatus): Long

    fun findByIsTemplateTrue(pageable: Pageable): Page<Campaign>

    fun countByIsTemplateTrue(): Long
}

@Repository
class JpaCampaignRepository(
    private val springDataRepository: SpringDataCampaignRepository
) : CampaignRepository {

    override fun save(campaign: Campaign): Campaign = springDataRepository.save(campaign)

    override fun findById(id: UUID): Optional<Campaign> = springDataRepository.findById(id)

    override fun findAll(pageable: Pageable): Page<Campaign> = springDataRepository.findAll(pageable)

    override fun deleteById(id: UUID) = springDataRepository.deleteById(id)

    override fun existsById(id: UUID): Boolean = springDataRepository.existsById(id)

    override fun findByStatus(status: CampaignStatus, pageable: Pageable): Page<Campaign> =
        springDataRepository.findByStatus(status, pageable)

    override fun findActiveByTriggerType(triggerType: TriggerType): List<Campaign> =
        springDataRepository.findActiveByTriggerType(triggerType)

    override fun findActiveByTriggerTypeAndDays(triggerType: TriggerType, days: Int): List<Campaign> {
        return springDataRepository.findActiveByTriggerType(triggerType)
            .filter { it.getTriggerDays() == days }
    }

    override fun findActiveByCampaignType(campaignType: CampaignType): List<Campaign> =
        springDataRepository.findActiveByCampaignType(campaignType)

    override fun search(
        search: String?,
        status: CampaignStatus?,
        campaignType: CampaignType?,
        pageable: Pageable
    ): Page<Campaign> = springDataRepository.search(search, status, campaignType, pageable)

    override fun countByStatus(status: CampaignStatus): Long = springDataRepository.countByStatus(status)

    override fun findTemplates(pageable: Pageable): Page<Campaign> =
        springDataRepository.findByIsTemplateTrue(pageable)

    override fun countTemplates(): Long = springDataRepository.countByIsTemplateTrue()
}
