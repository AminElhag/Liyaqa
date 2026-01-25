package com.liyaqa.crm.application.services

import com.liyaqa.crm.application.commands.AssignLeadCommand
import com.liyaqa.crm.application.commands.BulkAssignLeadsCommand
import com.liyaqa.crm.application.commands.ConvertLeadCommand
import com.liyaqa.crm.application.commands.CreateLeadCommand
import com.liyaqa.crm.application.commands.LogLeadActivityCommand
import com.liyaqa.crm.application.commands.TransitionLeadStatusCommand
import com.liyaqa.crm.application.commands.UpdateLeadCommand
import com.liyaqa.crm.domain.model.Lead
import com.liyaqa.crm.domain.model.LeadActivity
import com.liyaqa.crm.domain.model.LeadActivityType
import com.liyaqa.crm.domain.model.LeadSource
import com.liyaqa.crm.domain.model.LeadStatus
import com.liyaqa.crm.domain.ports.LeadActivityRepository
import com.liyaqa.crm.domain.ports.LeadAssignmentRuleRepository
import com.liyaqa.crm.domain.ports.LeadRepository
import com.liyaqa.crm.domain.ports.LeadScoringRuleRepository
import com.liyaqa.webhook.application.services.WebhookEventPublisher
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

@Service
@Transactional
class LeadService(
    private val leadRepository: LeadRepository,
    private val leadActivityRepository: LeadActivityRepository,
    private val webhookPublisher: WebhookEventPublisher,
    private val scoringService: LeadScoringService,
    private val assignmentService: LeadAssignmentService
) {
    private val logger = LoggerFactory.getLogger(LeadService::class.java)

    /**
     * Create a new lead.
     */
    fun createLead(command: CreateLeadCommand): Lead {
        // Check for duplicate email
        if (leadRepository.existsByEmail(command.email)) {
            throw IllegalArgumentException("A lead with email ${command.email} already exists")
        }

        val lead = Lead(
            name = command.name,
            email = command.email,
            phone = command.phone,
            source = command.source,
            assignedToUserId = command.assignedToUserId,
            notes = command.notes,
            priority = command.priority,
            expectedConversionDate = command.expectedConversionDate,
            campaignSource = command.campaignSource,
            campaignMedium = command.campaignMedium,
            campaignName = command.campaignName,
            formId = command.formId
        )

        // Apply source-based scoring before saving
        try {
            scoringService.applySourceScoring(lead)
            logger.debug("Applied source scoring to lead: score=${lead.score}")
        } catch (e: Exception) {
            logger.warn("Failed to apply source scoring: ${e.message}", e)
        }

        // Auto-assign if no assignee specified
        if (lead.assignedToUserId == null) {
            try {
                val assignedUserId = assignmentService.autoAssign(lead)
                if (assignedUserId != null) {
                    logger.debug("Auto-assigned lead to user $assignedUserId")
                }
            } catch (e: Exception) {
                logger.warn("Failed to auto-assign lead: ${e.message}", e)
            }
        }

        val savedLead = leadRepository.save(lead)
        logger.info("Created lead ${savedLead.id} with email ${savedLead.email}, score=${savedLead.score}, assignee=${savedLead.assignedToUserId}")

        // Publish webhook event
        try {
            webhookPublisher.publishLeadCreated(
                leadId = savedLead.id,
                tenantId = savedLead.tenantId,
                payload = mapOf(
                    "id" to savedLead.id.toString(),
                    "name" to savedLead.name,
                    "email" to savedLead.email,
                    "source" to savedLead.source.name,
                    "status" to savedLead.status.name,
                    "score" to savedLead.score.toString(),
                    "assignedToUserId" to (savedLead.assignedToUserId?.toString() ?: "")
                )
            )
        } catch (e: Exception) {
            logger.error("Failed to publish lead.created webhook: ${e.message}", e)
        }

        return savedLead
    }

    /**
     * Get a lead by ID.
     */
    @Transactional(readOnly = true)
    fun getLead(id: UUID): Lead {
        return leadRepository.findById(id)
            .orElseThrow { NoSuchElementException("Lead not found: $id") }
    }

    /**
     * Get a lead by email.
     */
    @Transactional(readOnly = true)
    fun getLeadByEmail(email: String): Lead? {
        return leadRepository.findByEmail(email).orElse(null)
    }

    /**
     * Update an existing lead.
     */
    fun updateLead(id: UUID, command: UpdateLeadCommand): Lead {
        val lead = getLead(id)

        command.name?.let { lead.name = it }
        command.email?.let {
            if (it != lead.email && leadRepository.existsByEmail(it)) {
                throw IllegalArgumentException("A lead with email $it already exists")
            }
            lead.email = it
        }
        command.phone?.let { lead.phone = it }
        command.source?.let { lead.source = it }
        command.assignedToUserId?.let { lead.assignedToUserId = it }
        command.notes?.let { lead.notes = it }
        command.priority?.let { lead.priority = it }
        command.expectedConversionDate?.let { lead.expectedConversionDate = it }

        val savedLead = leadRepository.save(lead)
        logger.info("Updated lead ${savedLead.id}")

        return savedLead
    }

    /**
     * Delete a lead.
     */
    fun deleteLead(id: UUID) {
        val lead = getLead(id)
        leadActivityRepository.deleteByLeadId(id)
        leadRepository.deleteById(id)
        logger.info("Deleted lead $id with email ${lead.email}")
    }

    /**
     * Transition a lead's status in the pipeline.
     */
    fun transitionStatus(command: TransitionLeadStatusCommand): Lead {
        val lead = getLead(command.leadId)
        val oldStatus = lead.status

        when (command.newStatus) {
            LeadStatus.NEW -> {
                if (lead.status == LeadStatus.LOST) {
                    lead.reopen()
                }
            }
            LeadStatus.CONTACTED -> lead.markContacted()
            LeadStatus.TOUR_SCHEDULED -> lead.scheduleTour()
            LeadStatus.TRIAL -> lead.startTrial()
            LeadStatus.NEGOTIATION -> lead.moveToNegotiation()
            LeadStatus.WON -> lead.markWon(command.memberId)
            LeadStatus.LOST -> lead.markLost(command.reason)
        }

        val savedLead = leadRepository.save(lead)
        logger.info("Transitioned lead ${lead.id} from $oldStatus to ${command.newStatus}")

        // Log status change activity
        logActivity(LogLeadActivityCommand(
            leadId = lead.id,
            type = LeadActivityType.STATUS_CHANGE,
            notes = "Status changed from $oldStatus to ${command.newStatus}" +
                    (command.reason?.let { ". Reason: $it" } ?: "")
        ))

        // Publish webhook event
        try {
            webhookPublisher.publishLeadStatusChanged(
                leadId = savedLead.id,
                tenantId = savedLead.tenantId,
                payload = mapOf(
                    "id" to savedLead.id.toString(),
                    "oldStatus" to oldStatus.name,
                    "newStatus" to command.newStatus.name,
                    "reason" to (command.reason ?: "")
                )
            )
        } catch (e: Exception) {
            logger.error("Failed to publish lead.status_changed webhook: ${e.message}", e)
        }

        return savedLead
    }

    /**
     * Assign a lead to a user.
     */
    fun assignLead(command: AssignLeadCommand): Lead {
        val lead = getLead(command.leadId)
        val previousAssignee = lead.assignedToUserId

        if (command.assignToUserId != null) {
            lead.assignTo(command.assignToUserId)
        } else {
            lead.unassign()
        }

        val savedLead = leadRepository.save(lead)
        logger.info("Assigned lead ${lead.id} from $previousAssignee to ${command.assignToUserId}")

        // Log assignment activity
        logActivity(LogLeadActivityCommand(
            leadId = lead.id,
            type = LeadActivityType.ASSIGNMENT,
            notes = if (command.assignToUserId != null) {
                "Lead assigned to user ${command.assignToUserId}"
            } else {
                "Lead unassigned"
            }
        ))

        return savedLead
    }

    /**
     * Bulk assign leads to a user.
     */
    fun bulkAssignLeads(command: BulkAssignLeadsCommand): List<Lead> {
        val leads = leadRepository.findAllByIds(command.leadIds)

        leads.forEach { lead ->
            lead.assignTo(command.assignToUserId)
        }

        val savedLeads = leads.map { leadRepository.save(it) }
        logger.info("Bulk assigned ${savedLeads.size} leads to user ${command.assignToUserId}")

        return savedLeads
    }

    /**
     * Convert a lead to a member.
     */
    fun convertLead(command: ConvertLeadCommand): Lead {
        val lead = getLead(command.leadId)

        lead.markWon(command.memberId)
        val savedLead = leadRepository.save(lead)
        logger.info("Converted lead ${lead.id} to member ${command.memberId}")

        // Publish webhook event
        try {
            webhookPublisher.publishLeadConverted(
                leadId = savedLead.id,
                tenantId = savedLead.tenantId,
                payload = mapOf(
                    "id" to savedLead.id.toString(),
                    "memberId" to command.memberId.toString()
                )
            )
        } catch (e: Exception) {
            logger.error("Failed to publish lead.converted webhook: ${e.message}", e)
        }

        return savedLead
    }

    /**
     * Log an activity for a lead.
     */
    fun logActivity(command: LogLeadActivityCommand): LeadActivity {
        // Verify lead exists and get it for scoring
        val lead = getLead(command.leadId)

        val activity = LeadActivity(
            leadId = command.leadId,
            type = command.type,
            notes = command.notes,
            contactMethod = command.contactMethod,
            outcome = command.outcome,
            followUpDate = command.followUpDate,
            durationMinutes = command.durationMinutes,
            performedByUserId = command.performedByUserId
        )

        val savedActivity = leadActivityRepository.save(activity)
        logger.debug("Logged activity ${savedActivity.id} for lead ${command.leadId}")

        // Apply activity-based scoring
        try {
            val scoreChange = scoringService.applyActivityScoring(lead, command.type)
            if (scoreChange != 0) {
                logger.debug("Applied activity scoring to lead ${lead.id}: ${scoreChange} points for ${command.type}")
            }
        } catch (e: Exception) {
            logger.warn("Failed to apply activity scoring: ${e.message}", e)
        }

        return savedActivity
    }

    /**
     * Get activities for a lead.
     */
    @Transactional(readOnly = true)
    fun getLeadActivities(leadId: UUID, pageable: Pageable): Page<LeadActivity> {
        return leadActivityRepository.findByLeadId(leadId, pageable)
    }

    /**
     * Get all activities for a lead, ordered by most recent.
     */
    @Transactional(readOnly = true)
    fun getAllLeadActivities(leadId: UUID): List<LeadActivity> {
        return leadActivityRepository.findByLeadIdOrderByCreatedAtDesc(leadId)
    }

    /**
     * Search leads with filters.
     */
    @Transactional(readOnly = true)
    fun searchLeads(
        search: String?,
        status: LeadStatus?,
        source: LeadSource?,
        assignedToUserId: UUID?,
        createdAfter: LocalDate?,
        createdBefore: LocalDate?,
        pageable: Pageable
    ): Page<Lead> {
        return leadRepository.search(
            search = search,
            status = status,
            source = source,
            assignedToUserId = assignedToUserId,
            createdAfter = createdAfter,
            createdBefore = createdBefore,
            pageable = pageable
        )
    }

    /**
     * Get all leads with pagination.
     */
    @Transactional(readOnly = true)
    fun getAllLeads(pageable: Pageable): Page<Lead> {
        return leadRepository.findAll(pageable)
    }

    /**
     * Get leads by status.
     */
    @Transactional(readOnly = true)
    fun getLeadsByStatus(status: LeadStatus, pageable: Pageable): Page<Lead> {
        return leadRepository.findByStatus(status, pageable)
    }

    /**
     * Get leads assigned to a user.
     */
    @Transactional(readOnly = true)
    fun getLeadsAssignedTo(userId: UUID, pageable: Pageable): Page<Lead> {
        return leadRepository.findByAssignedToUserId(userId, pageable)
    }

    /**
     * Get unassigned leads.
     */
    @Transactional(readOnly = true)
    fun getUnassignedLeads(pageable: Pageable): Page<Lead> {
        return leadRepository.findUnassigned(pageable)
    }

    /**
     * Get active (non-terminal) leads.
     */
    @Transactional(readOnly = true)
    fun getActiveLeads(pageable: Pageable): Page<Lead> {
        return leadRepository.findActiveLeads(pageable)
    }

    /**
     * Get pipeline statistics.
     */
    @Transactional(readOnly = true)
    fun getPipelineStats(): Map<LeadStatus, Long> {
        return LeadStatus.entries.associateWith { status ->
            leadRepository.countByStatus(status)
        }
    }

    /**
     * Get source statistics.
     */
    @Transactional(readOnly = true)
    fun getSourceStats(): Map<LeadSource, Long> {
        return LeadSource.entries.associateWith { source ->
            leadRepository.countBySource(source)
        }
    }

    /**
     * Get conversion rate for a date range.
     */
    @Transactional(readOnly = true)
    fun getConversionRate(startDate: LocalDate, endDate: LocalDate): Double {
        val converted = leadRepository.findConvertedBetween(startDate, endDate).size
        val total = leadRepository.count()
        return if (total > 0) (converted.toDouble() / total) * 100 else 0.0
    }

    /**
     * Check if lead exists.
     */
    @Transactional(readOnly = true)
    fun leadExists(id: UUID): Boolean {
        return leadRepository.existsById(id)
    }

    /**
     * Increase lead score.
     */
    fun increaseScore(leadId: UUID, points: Int): Lead {
        val lead = getLead(leadId)
        lead.increaseScore(points)
        return leadRepository.save(lead)
    }

    /**
     * Decrease lead score.
     */
    fun decreaseScore(leadId: UUID, points: Int): Lead {
        val lead = getLead(leadId)
        lead.decreaseScore(points)
        return leadRepository.save(lead)
    }
}
