package com.liyaqa.crm.application.commands

import com.liyaqa.crm.domain.model.LeadActivityType
import com.liyaqa.crm.domain.model.LeadPriority
import com.liyaqa.crm.domain.model.LeadSource
import com.liyaqa.crm.domain.model.LeadStatus
import java.time.LocalDate
import java.util.UUID

/**
 * Command to create a new lead.
 */
data class CreateLeadCommand(
    val name: String,
    val email: String,
    val phone: String? = null,
    val source: LeadSource,
    val assignedToUserId: UUID? = null,
    val notes: String? = null,
    val priority: LeadPriority? = null,
    val expectedConversionDate: LocalDate? = null,
    val campaignSource: String? = null,
    val campaignMedium: String? = null,
    val campaignName: String? = null,
    val formId: UUID? = null
)

/**
 * Command to update an existing lead.
 */
data class UpdateLeadCommand(
    val name: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val source: LeadSource? = null,
    val assignedToUserId: UUID? = null,
    val notes: String? = null,
    val priority: LeadPriority? = null,
    val expectedConversionDate: LocalDate? = null
)

/**
 * Command to transition a lead's status.
 */
data class TransitionLeadStatusCommand(
    val leadId: UUID,
    val newStatus: LeadStatus,
    val reason: String? = null,
    val memberId: UUID? = null // For WON status
)

/**
 * Command to assign a lead to a user.
 */
data class AssignLeadCommand(
    val leadId: UUID,
    val assignToUserId: UUID?
)

/**
 * Command to log an activity for a lead.
 */
data class LogLeadActivityCommand(
    val leadId: UUID,
    val type: LeadActivityType,
    val notes: String? = null,
    val contactMethod: String? = null,
    val outcome: String? = null,
    val followUpDate: LocalDate? = null,
    val durationMinutes: Int? = null,
    val performedByUserId: UUID? = null
)

/**
 * Command to complete a follow-up activity.
 */
data class CompleteFollowUpCommand(
    val activityId: UUID,
    val outcome: String? = null,
    val notes: String? = null
)

/**
 * Command to convert a lead to a member.
 */
data class ConvertLeadCommand(
    val leadId: UUID,
    val memberId: UUID
)

/**
 * Command to bulk assign leads.
 */
data class BulkAssignLeadsCommand(
    val leadIds: List<UUID>,
    val assignToUserId: UUID
)

/**
 * Command to import leads.
 */
data class ImportLeadsCommand(
    val leads: List<CreateLeadCommand>
)
