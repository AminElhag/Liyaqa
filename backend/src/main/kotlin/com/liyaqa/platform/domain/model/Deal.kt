package com.liyaqa.platform.domain.model

import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

/**
 * Represents a sales deal in the 9-stage pipeline.
 * Tracks leads from initial contact through conversion to client.
 */
@Entity
@Table(name = "deals")
class Deal(
    id: UUID = UUID.randomUUID(),

    @Column(name = "facility_name")
    var facilityName: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "stage", nullable = false)
    var stage: DealStage = DealStage.LEAD,

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false)
    var source: DealSource = DealSource.WEBSITE,

    @Column(name = "contact_name", nullable = false)
    var contactName: String,

    @Column(name = "contact_email", nullable = false)
    var contactEmail: String,

    @Column(name = "contact_phone")
    var contactPhone: String? = null,

    @Column(name = "estimated_value_amount", nullable = false)
    var estimatedValue: BigDecimal = BigDecimal.ZERO,

    @Column(name = "currency", nullable = false)
    var currency: String = "SAR",

    @Column(name = "expected_close_date")
    var expectedCloseDate: LocalDate? = null,

    @Column(name = "closed_at")
    var closedAt: LocalDate? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_rep_id", nullable = false)
    var assignedTo: PlatformUser,

    @Column(name = "notes")
    var notes: String? = null,

    @Column(name = "lost_reason")
    var lostReason: String? = null

) : OrganizationLevelEntity(id) {

    // ============================================
    // Stage Transitions
    // ============================================

    fun changeStage(newStage: DealStage) {
        val allowed = VALID_TRANSITIONS[stage]
            ?: throw IllegalStateException("No transitions defined for stage: $stage")
        require(newStage in allowed) {
            "Invalid transition from $stage to $newStage. Allowed: $allowed"
        }
        stage = newStage
        if (newStage in TERMINAL_STAGES) {
            closedAt = LocalDate.now()
        }
        if (newStage == DealStage.LEAD) {
            // Reopening — clear close data
            closedAt = null
            lostReason = null
        }
    }

    // ============================================
    // Queries
    // ============================================

    fun isOpen(): Boolean = stage !in TERMINAL_STAGES

    fun isWon(): Boolean = stage == DealStage.WON

    fun isLost(): Boolean = stage == DealStage.LOST

    companion object {
        val TERMINAL_STAGES = setOf(DealStage.WON, DealStage.LOST, DealStage.CHURNED)

        val VALID_TRANSITIONS: Map<DealStage, Set<DealStage>> = mapOf(
            DealStage.LEAD to setOf(DealStage.CONTACTED, DealStage.LOST),
            DealStage.CONTACTED to setOf(DealStage.DEMO_SCHEDULED, DealStage.PROPOSAL_SENT, DealStage.LOST),
            DealStage.DEMO_SCHEDULED to setOf(DealStage.DEMO_DONE, DealStage.LOST),
            DealStage.DEMO_DONE to setOf(DealStage.PROPOSAL_SENT, DealStage.LOST),
            DealStage.PROPOSAL_SENT to setOf(DealStage.NEGOTIATION, DealStage.LOST),
            DealStage.NEGOTIATION to setOf(DealStage.WON, DealStage.LOST),
            DealStage.WON to setOf(DealStage.CHURNED),
            DealStage.LOST to setOf(DealStage.LEAD),
            DealStage.CHURNED to setOf(DealStage.LEAD)
        )

        fun create(
            facilityName: String?,
            source: DealSource,
            contactName: String,
            contactEmail: String,
            assignedTo: PlatformUser,
            contactPhone: String? = null,
            estimatedValue: BigDecimal = BigDecimal.ZERO,
            currency: String = "SAR",
            expectedCloseDate: LocalDate? = null,
            notes: String? = null
        ): Deal {
            return Deal(
                facilityName = facilityName,
                source = source,
                contactName = contactName,
                contactEmail = contactEmail,
                assignedTo = assignedTo,
                contactPhone = contactPhone,
                estimatedValue = estimatedValue,
                currency = currency,
                expectedCloseDate = expectedCloseDate,
                notes = notes
            )
        }
    }
}
