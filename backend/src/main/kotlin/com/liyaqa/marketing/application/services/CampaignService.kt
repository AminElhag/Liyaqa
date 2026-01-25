package com.liyaqa.marketing.application.services

import com.liyaqa.marketing.application.commands.CreateCampaignCommand
import com.liyaqa.marketing.application.commands.CreateCampaignStepCommand
import com.liyaqa.marketing.application.commands.DuplicateCampaignCommand
import com.liyaqa.marketing.application.commands.UpdateCampaignCommand
import com.liyaqa.marketing.application.commands.UpdateCampaignStepCommand
import com.liyaqa.marketing.domain.model.Campaign
import com.liyaqa.marketing.domain.model.CampaignStatus
import com.liyaqa.marketing.domain.model.CampaignStep
import com.liyaqa.marketing.domain.model.CampaignType
import com.liyaqa.marketing.domain.ports.CampaignRepository
import com.liyaqa.marketing.domain.ports.CampaignStepRepository
import com.liyaqa.marketing.domain.ports.EnrollmentRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class CampaignService(
    private val campaignRepository: CampaignRepository,
    private val stepRepository: CampaignStepRepository,
    private val enrollmentRepository: EnrollmentRepository
) {
    private val logger = LoggerFactory.getLogger(CampaignService::class.java)

    // ==================== CAMPAIGN CRUD ====================

    /**
     * Create a new campaign.
     */
    fun createCampaign(command: CreateCampaignCommand): Campaign {
        val campaign = Campaign.create(
            name = command.name,
            description = command.description,
            campaignType = command.campaignType,
            triggerType = command.triggerType,
            triggerConfig = command.triggerConfig,
            segmentId = command.segmentId,
            startDate = command.startDate,
            endDate = command.endDate
        )
        val saved = campaignRepository.save(campaign)
        logger.info("Created campaign: ${saved.id} - ${saved.name}")
        return saved
    }

    /**
     * Get campaign by ID.
     */
    @Transactional(readOnly = true)
    fun getCampaign(id: UUID): Campaign {
        return campaignRepository.findById(id)
            .orElseThrow { NoSuchElementException("Campaign not found: $id") }
    }

    /**
     * List campaigns with pagination.
     */
    @Transactional(readOnly = true)
    fun listCampaigns(pageable: Pageable): Page<Campaign> {
        return campaignRepository.findAll(pageable)
    }

    /**
     * Search campaigns.
     */
    @Transactional(readOnly = true)
    fun searchCampaigns(
        search: String?,
        status: CampaignStatus?,
        campaignType: CampaignType?,
        pageable: Pageable
    ): Page<Campaign> {
        return campaignRepository.search(search, status, campaignType, pageable)
    }

    /**
     * Update a campaign.
     */
    fun updateCampaign(id: UUID, command: UpdateCampaignCommand): Campaign {
        val campaign = getCampaign(id)
        require(campaign.status == CampaignStatus.DRAFT || campaign.status == CampaignStatus.PAUSED) {
            "Can only update campaigns in DRAFT or PAUSED status"
        }

        campaign.update(
            name = command.name,
            description = command.description,
            triggerConfig = command.triggerConfig,
            segmentId = command.segmentId,
            startDate = command.startDate,
            endDate = command.endDate
        )

        val saved = campaignRepository.save(campaign)
        logger.info("Updated campaign: ${saved.id}")
        return saved
    }

    /**
     * Delete a campaign.
     */
    fun deleteCampaign(id: UUID) {
        val campaign = getCampaign(id)
        require(campaign.status == CampaignStatus.DRAFT || campaign.status == CampaignStatus.ARCHIVED) {
            "Can only delete campaigns in DRAFT or ARCHIVED status"
        }

        stepRepository.deleteByCampaignId(id)
        campaignRepository.deleteById(id)
        logger.info("Deleted campaign: $id")
    }

    // ==================== CAMPAIGN LIFECYCLE ====================

    /**
     * Activate a campaign.
     */
    fun activateCampaign(id: UUID): Campaign {
        val campaign = getCampaign(id)
        val stepCount = stepRepository.countByCampaignId(id)
        require(stepCount > 0) { "Campaign must have at least one step before activation" }

        campaign.activate()
        val saved = campaignRepository.save(campaign)
        logger.info("Activated campaign: ${saved.id}")
        return saved
    }

    /**
     * Pause a campaign.
     */
    fun pauseCampaign(id: UUID): Campaign {
        val campaign = getCampaign(id)
        campaign.pause()
        val saved = campaignRepository.save(campaign)
        logger.info("Paused campaign: ${saved.id}")
        return saved
    }

    /**
     * Archive a campaign.
     */
    fun archiveCampaign(id: UUID): Campaign {
        val campaign = getCampaign(id)
        enrollmentRepository.cancelAllByCampaignId(id)
        campaign.archive()
        val saved = campaignRepository.save(campaign)
        logger.info("Archived campaign: ${saved.id}")
        return saved
    }

    /**
     * Duplicate a campaign.
     */
    fun duplicateCampaign(command: DuplicateCampaignCommand): Campaign {
        val source = getCampaign(command.sourceCampaignId)

        // Create new campaign
        val newCampaign = Campaign.create(
            name = command.newName,
            description = source.description,
            campaignType = source.campaignType,
            triggerType = source.triggerType,
            triggerConfig = source.triggerConfig,
            segmentId = source.segmentId,
            startDate = null,
            endDate = null
        )
        val saved = campaignRepository.save(newCampaign)

        // Copy steps
        val sourceSteps = stepRepository.findByCampaignIdOrderByStepNumber(command.sourceCampaignId)
        val newSteps = sourceSteps.map { step ->
            CampaignStep.create(
                campaignId = saved.id,
                stepNumber = step.stepNumber,
                name = step.name,
                channel = step.channel,
                bodyEn = step.bodyEn,
                bodyAr = step.bodyAr,
                subjectEn = step.subjectEn,
                subjectAr = step.subjectAr,
                delayDays = step.delayDays,
                delayHours = step.delayHours
            )
        }
        stepRepository.saveAll(newSteps)

        logger.info("Duplicated campaign ${command.sourceCampaignId} to ${saved.id}")
        return saved
    }

    // ==================== CAMPAIGN STEPS ====================

    /**
     * Add a step to a campaign.
     */
    fun addStep(command: CreateCampaignStepCommand): CampaignStep {
        val campaign = getCampaign(command.campaignId)
        require(campaign.status == CampaignStatus.DRAFT || campaign.status == CampaignStatus.PAUSED) {
            "Can only add steps to campaigns in DRAFT or PAUSED status"
        }

        val maxStepNumber = stepRepository.getMaxStepNumber(command.campaignId) ?: 0

        val step = CampaignStep.create(
            campaignId = command.campaignId,
            stepNumber = maxStepNumber + 1,
            name = command.name,
            channel = command.channel,
            bodyEn = command.bodyEn,
            bodyAr = command.bodyAr,
            subjectEn = command.subjectEn,
            subjectAr = command.subjectAr,
            delayDays = command.delayDays,
            delayHours = command.delayHours
        )

        if (command.isAbTest && command.abVariant != null && command.abSplitPercentage != null) {
            step.configureAbTest(command.abVariant, command.abSplitPercentage)
        }

        val saved = stepRepository.save(step)
        logger.info("Added step ${saved.stepNumber} to campaign ${command.campaignId}")
        return saved
    }

    /**
     * Update a campaign step.
     */
    fun updateStep(stepId: UUID, command: UpdateCampaignStepCommand): CampaignStep {
        val step = stepRepository.findById(stepId)
            .orElseThrow { NoSuchElementException("Step not found: $stepId") }

        val campaign = getCampaign(step.campaignId)
        require(campaign.status == CampaignStatus.DRAFT || campaign.status == CampaignStatus.PAUSED) {
            "Can only update steps of campaigns in DRAFT or PAUSED status"
        }

        step.update(
            name = command.name,
            delayDays = command.delayDays,
            delayHours = command.delayHours,
            channel = command.channel,
            subjectEn = command.subjectEn,
            subjectAr = command.subjectAr,
            bodyEn = command.bodyEn,
            bodyAr = command.bodyAr
        )

        val saved = stepRepository.save(step)
        logger.info("Updated step $stepId")
        return saved
    }

    /**
     * Delete a campaign step.
     */
    fun deleteStep(stepId: UUID) {
        val step = stepRepository.findById(stepId)
            .orElseThrow { NoSuchElementException("Step not found: $stepId") }

        val campaign = getCampaign(step.campaignId)
        require(campaign.status == CampaignStatus.DRAFT) {
            "Can only delete steps from campaigns in DRAFT status"
        }

        stepRepository.deleteById(stepId)
        logger.info("Deleted step $stepId from campaign ${step.campaignId}")
    }

    /**
     * Get steps for a campaign.
     */
    @Transactional(readOnly = true)
    fun getSteps(campaignId: UUID): List<CampaignStep> {
        return stepRepository.findByCampaignIdOrderByStepNumber(campaignId)
    }

    /**
     * Get step by ID.
     */
    @Transactional(readOnly = true)
    fun getStep(stepId: UUID): CampaignStep {
        return stepRepository.findById(stepId)
            .orElseThrow { NoSuchElementException("Step not found: $stepId") }
    }

    // ==================== TEMPLATES ====================

    /**
     * List all campaign templates.
     */
    @Transactional(readOnly = true)
    fun listTemplates(pageable: Pageable): Page<Campaign> {
        return campaignRepository.findTemplates(pageable)
    }

    /**
     * Create a campaign from a template.
     */
    fun createCampaignFromTemplate(templateId: UUID, newName: String): Campaign {
        val template = getCampaign(templateId)
        require(template.isTemplate) { "Campaign $templateId is not a template" }

        return duplicateCampaign(
            DuplicateCampaignCommand(
                sourceCampaignId = templateId,
                newName = newName
            )
        )
    }
}
