package com.liyaqa.crm.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.LocalDate
import java.util.UUID

/**
 * Lead entity representing a potential member in the CRM pipeline.
 * Follows the sales lifecycle: NEW → CONTACTED → TOUR_SCHEDULED → TRIAL → NEGOTIATION → WON/LOST
 */
@Entity
@Table(name = "leads")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class Lead(
    id: UUID = UUID.randomUUID(),

    @Column(name = "name", nullable = false)
    var name: String,

    @Column(name = "email", nullable = false)
    var email: String,

    @Column(name = "phone")
    var phone: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: LeadStatus = LeadStatus.NEW,

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false)
    var source: LeadSource,

    @Column(name = "assigned_to_user_id")
    var assignedToUserId: UUID? = null,

    @Column(name = "notes", columnDefinition = "TEXT")
    var notes: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "priority")
    var priority: LeadPriority? = null,

    @Column(name = "score")
    var score: Int = 0,

    // Lifecycle timestamps
    @Column(name = "contacted_at")
    var contactedAt: LocalDate? = null,

    @Column(name = "tour_scheduled_at")
    var tourScheduledAt: LocalDate? = null,

    @Column(name = "trial_started_at")
    var trialStartedAt: LocalDate? = null,

    @Column(name = "negotiation_started_at")
    var negotiationStartedAt: LocalDate? = null,

    @Column(name = "won_at")
    var wonAt: LocalDate? = null,

    @Column(name = "lost_at")
    var lostAt: LocalDate? = null,

    @Column(name = "loss_reason", columnDefinition = "TEXT")
    var lossReason: String? = null,

    @Column(name = "expected_conversion_date")
    var expectedConversionDate: LocalDate? = null,

    // Conversion tracking
    @Column(name = "converted_member_id")
    var convertedMemberId: UUID? = null,

    // Campaign attribution
    @Column(name = "campaign_source")
    var campaignSource: String? = null,

    @Column(name = "campaign_medium")
    var campaignMedium: String? = null,

    @Column(name = "campaign_name")
    var campaignName: String? = null,

    // Lead capture form reference
    @Column(name = "form_id")
    var formId: UUID? = null

) : BaseEntity(id) {

    /**
     * Marks the lead as contacted.
     */
    fun markContacted() {
        require(status == LeadStatus.NEW || status == LeadStatus.CONTACTED) {
            "Can only mark contacted from NEW or CONTACTED status, current: $status"
        }
        status = LeadStatus.CONTACTED
        contactedAt = contactedAt ?: LocalDate.now()
    }

    /**
     * Schedules a tour for the lead.
     */
    fun scheduleTour(tourDate: LocalDate? = null) {
        require(status in listOf(LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.TOUR_SCHEDULED)) {
            "Can only schedule tour from NEW, CONTACTED, or TOUR_SCHEDULED status, current: $status"
        }
        status = LeadStatus.TOUR_SCHEDULED
        tourScheduledAt = tourDate ?: LocalDate.now()
        if (contactedAt == null) contactedAt = LocalDate.now()
    }

    /**
     * Starts a trial for the lead.
     */
    fun startTrial() {
        require(status in listOf(LeadStatus.CONTACTED, LeadStatus.TOUR_SCHEDULED, LeadStatus.TRIAL)) {
            "Can only start trial from CONTACTED, TOUR_SCHEDULED, or TRIAL status, current: $status"
        }
        status = LeadStatus.TRIAL
        trialStartedAt = trialStartedAt ?: LocalDate.now()
    }

    /**
     * Moves the lead to negotiation phase.
     */
    fun moveToNegotiation() {
        require(status in listOf(LeadStatus.TRIAL, LeadStatus.TOUR_SCHEDULED, LeadStatus.NEGOTIATION)) {
            "Can only move to negotiation from TRIAL, TOUR_SCHEDULED, or NEGOTIATION status, current: $status"
        }
        status = LeadStatus.NEGOTIATION
        negotiationStartedAt = negotiationStartedAt ?: LocalDate.now()
    }

    /**
     * Marks the lead as won (converted to member).
     */
    fun markWon(memberId: UUID? = null) {
        require(status !in listOf(LeadStatus.WON, LeadStatus.LOST)) {
            "Cannot mark as won from $status status"
        }
        status = LeadStatus.WON
        wonAt = LocalDate.now()
        convertedMemberId = memberId
    }

    /**
     * Marks the lead as lost with an optional reason.
     */
    fun markLost(reason: String? = null) {
        require(status != LeadStatus.WON) {
            "Cannot mark a won lead as lost"
        }
        status = LeadStatus.LOST
        lostAt = LocalDate.now()
        lossReason = reason
    }

    /**
     * Reopen a lost lead to try again.
     */
    fun reopen() {
        require(status == LeadStatus.LOST) {
            "Can only reopen lost leads, current: $status"
        }
        status = LeadStatus.NEW
        lostAt = null
        lossReason = null
    }

    /**
     * Assign the lead to a user.
     */
    fun assignTo(userId: UUID) {
        assignedToUserId = userId
    }

    /**
     * Unassign the lead.
     */
    fun unassign() {
        assignedToUserId = null
    }

    /**
     * Increase the lead score.
     */
    fun increaseScore(points: Int) {
        require(points >= 0) { "Points must be non-negative" }
        score += points
    }

    /**
     * Decrease the lead score.
     */
    fun decreaseScore(points: Int) {
        require(points >= 0) { "Points must be non-negative" }
        score = maxOf(0, score - points)
    }

    /**
     * Check if lead is in an active (non-terminal) state.
     */
    fun isActive(): Boolean = status !in listOf(LeadStatus.WON, LeadStatus.LOST)

    /**
     * Check if lead was converted to a member.
     */
    fun isConverted(): Boolean = status == LeadStatus.WON && convertedMemberId != null
}
