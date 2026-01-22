package com.liyaqa.platform.domain.model

import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.LocalDate
import java.util.UUID

/**
 * Represents a sales deal in the pipeline.
 * Tracks leads from initial contact through conversion to client.
 *
 * This is a platform-level entity that enables sales reps to manage
 * their pipeline and convert won deals into clients.
 */
@Entity
@Table(name = "deals")
class Deal(
    id: UUID = UUID.randomUUID(),

    /**
     * Deal title/name.
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "title_en", nullable = false)),
        AttributeOverride(name = "ar", column = Column(name = "title_ar"))
    )
    var title: LocalizedText,

    /**
     * Current status in the sales pipeline.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: DealStatus = DealStatus.LEAD,

    /**
     * Source of the deal/lead.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false)
    var source: DealSource = DealSource.WEBSITE,

    /**
     * Primary contact person name.
     */
    @Column(name = "contact_name", nullable = false)
    var contactName: String,

    /**
     * Contact email address.
     */
    @Column(name = "contact_email", nullable = false)
    var contactEmail: String,

    /**
     * Contact phone number (optional).
     */
    @Column(name = "contact_phone")
    var contactPhone: String? = null,

    /**
     * Company/organization name (optional).
     */
    @Column(name = "company_name")
    var companyName: String? = null,

    /**
     * Estimated deal value.
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "estimated_value_amount", nullable = false)),
        AttributeOverride(name = "currency", column = Column(name = "estimated_value_currency", nullable = false))
    )
    var estimatedValue: Money = Money.ZERO,

    /**
     * Win probability (0-100%).
     */
    @Column(name = "probability", nullable = false)
    var probability: Int = 0,

    /**
     * Target date to close the deal.
     */
    @Column(name = "expected_close_date")
    var expectedCloseDate: LocalDate? = null,

    /**
     * Actual date the deal was closed (won or lost).
     */
    @Column(name = "actual_close_date")
    var actualCloseDate: LocalDate? = null,

    /**
     * The plan the prospect is interested in.
     */
    @Column(name = "interested_plan_id")
    var interestedPlanId: UUID? = null,

    /**
     * Reference to the ClientPlan entity (lazy loaded).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interested_plan_id", insertable = false, updatable = false)
    var interestedPlan: ClientPlan? = null,

    /**
     * Sales rep assigned to this deal.
     */
    @Column(name = "sales_rep_id", nullable = false)
    var salesRepId: UUID,

    /**
     * Organization created when deal is won (null until conversion).
     */
    @Column(name = "converted_organization_id")
    var convertedOrganizationId: UUID? = null,

    /**
     * Subscription created when deal is won (null until conversion).
     */
    @Column(name = "converted_subscription_id")
    var convertedSubscriptionId: UUID? = null,

    /**
     * Internal notes about the deal.
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "notes_en")),
        AttributeOverride(name = "ar", column = Column(name = "notes_ar"))
    )
    var notes: LocalizedText? = null,

    /**
     * Reason for losing the deal (only set when status is LOST).
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "lost_reason_en")),
        AttributeOverride(name = "ar", column = Column(name = "lost_reason_ar"))
    )
    var lostReason: LocalizedText? = null

) : OrganizationLevelEntity(id) {

    // Store previous status for reopening lost deals
    @Transient
    private var previousStatus: DealStatus? = null

    // ============================================
    // Domain Methods - Status Transitions
    // ============================================

    /**
     * Advances the deal to the next stage in the pipeline.
     * LEAD → QUALIFIED → PROPOSAL → NEGOTIATION
     */
    fun advance() {
        require(canAdvance()) {
            "Cannot advance deal from status: $status"
        }
        previousStatus = status
        status = getNextStage()!!
    }

    /**
     * Qualifies the deal (moves from LEAD to QUALIFIED).
     */
    fun qualify() {
        require(status == DealStatus.LEAD) {
            "Can only qualify deals in LEAD status, current: $status"
        }
        previousStatus = status
        status = DealStatus.QUALIFIED
    }

    /**
     * Sends a proposal (moves from QUALIFIED to PROPOSAL).
     */
    fun sendProposal() {
        require(status == DealStatus.QUALIFIED) {
            "Can only send proposal for deals in QUALIFIED status, current: $status"
        }
        previousStatus = status
        status = DealStatus.PROPOSAL
    }

    /**
     * Starts negotiation (moves from PROPOSAL to NEGOTIATION).
     */
    fun startNegotiation() {
        require(status == DealStatus.PROPOSAL) {
            "Can only start negotiation for deals in PROPOSAL status, current: $status"
        }
        previousStatus = status
        status = DealStatus.NEGOTIATION
    }

    /**
     * Marks the deal as won and links conversion data.
     * Can only be called from NEGOTIATION status.
     */
    fun win(organizationId: UUID, subscriptionId: UUID?) {
        require(status == DealStatus.NEGOTIATION) {
            "Can only win deals in NEGOTIATION status, current: $status"
        }
        previousStatus = status
        status = DealStatus.WON
        actualCloseDate = LocalDate.now()
        convertedOrganizationId = organizationId
        convertedSubscriptionId = subscriptionId
        probability = 100
    }

    /**
     * Marks the deal as lost with a reason.
     * Can be called from any open status.
     */
    fun lose(reason: LocalizedText) {
        require(isOpen()) {
            "Can only lose open deals, current status: $status"
        }
        previousStatus = status
        status = DealStatus.LOST
        actualCloseDate = LocalDate.now()
        lostReason = reason
        probability = 0
    }

    /**
     * Reopens a lost deal back to LEAD status.
     * Clears the lost reason and actual close date.
     */
    fun reopen() {
        require(status == DealStatus.LOST) {
            "Can only reopen deals in LOST status, current: $status"
        }
        status = DealStatus.LEAD
        actualCloseDate = null
        lostReason = null
        // Reset probability to a reasonable default
        probability = 10
    }

    // ============================================
    // Domain Methods - Updates
    // ============================================

    /**
     * Updates the win probability.
     * Validates that the value is between 0 and 100.
     */
    fun updateProbability(value: Int) {
        require(value in 0..100) {
            "Probability must be between 0 and 100, got: $value"
        }
        require(isOpen()) {
            "Cannot update probability for closed deals"
        }
        probability = value
    }

    /**
     * Updates the estimated deal value.
     */
    fun updateEstimatedValue(value: Money) {
        require(isOpen()) {
            "Cannot update estimated value for closed deals"
        }
        estimatedValue = value
    }

    /**
     * Reassigns the deal to a different sales rep.
     */
    fun reassign(newSalesRepId: UUID) {
        require(isOpen()) {
            "Cannot reassign closed deals"
        }
        salesRepId = newSalesRepId
    }

    /**
     * Updates the interested plan.
     */
    fun updateInterestedPlan(planId: UUID?) {
        require(isOpen()) {
            "Cannot update interested plan for closed deals"
        }
        interestedPlanId = planId
    }

    // ============================================
    // Domain Methods - Queries
    // ============================================

    /**
     * Checks if the deal is still open (not WON or LOST).
     */
    fun isOpen(): Boolean = status !in listOf(DealStatus.WON, DealStatus.LOST)

    /**
     * Checks if the deal has been won.
     */
    fun isWon(): Boolean = status == DealStatus.WON

    /**
     * Checks if the deal has been lost.
     */
    fun isLost(): Boolean = status == DealStatus.LOST

    /**
     * Checks if the deal can be advanced to the next stage.
     */
    fun canAdvance(): Boolean = getNextStage() != null

    /**
     * Gets the next logical stage for the deal.
     * Returns null if the deal cannot be advanced.
     */
    fun getNextStage(): DealStatus? {
        return when (status) {
            DealStatus.LEAD -> DealStatus.QUALIFIED
            DealStatus.QUALIFIED -> DealStatus.PROPOSAL
            DealStatus.PROPOSAL -> DealStatus.NEGOTIATION
            DealStatus.NEGOTIATION -> null // Next step is win() or lose()
            DealStatus.WON -> null
            DealStatus.LOST -> null
        }
    }

    /**
     * Checks if the deal can be converted to a client.
     * Must be in NEGOTIATION status.
     */
    fun canConvert(): Boolean = status == DealStatus.NEGOTIATION

    /**
     * Checks if the deal is overdue (past expected close date).
     */
    fun isOverdue(): Boolean {
        if (!isOpen()) return false
        return expectedCloseDate?.isBefore(LocalDate.now()) == true
    }

    /**
     * Gets the number of days until expected close (or days overdue if negative).
     */
    fun getDaysToClose(): Long? {
        if (expectedCloseDate == null) return null
        return java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), expectedCloseDate)
    }

    /**
     * Gets the weighted value (estimated value * probability/100).
     * Used for pipeline forecasting.
     */
    fun getWeightedValue(): Money {
        if (probability == 0) return Money.ZERO
        val weightedAmount = estimatedValue.amount
            .multiply(java.math.BigDecimal(probability))
            .divide(java.math.BigDecimal(100), 2, java.math.RoundingMode.HALF_UP)
        return Money.of(weightedAmount, estimatedValue.currency)
    }

    /**
     * Checks if the deal is expected to close within the given days.
     */
    fun isExpectedToCloseWithin(days: Int): Boolean {
        if (!isOpen()) return false
        if (expectedCloseDate == null) return false
        val threshold = LocalDate.now().plusDays(days.toLong())
        return expectedCloseDate!!.isAfter(LocalDate.now().minusDays(1)) &&
               expectedCloseDate!!.isBefore(threshold.plusDays(1))
    }

    companion object {
        /**
         * Creates a new deal in LEAD status.
         */
        fun create(
            title: LocalizedText,
            source: DealSource,
            contactName: String,
            contactEmail: String,
            salesRepId: UUID,
            contactPhone: String? = null,
            companyName: String? = null,
            estimatedValue: Money = Money.ZERO,
            probability: Int = 10,
            expectedCloseDate: LocalDate? = null,
            interestedPlanId: UUID? = null,
            notes: LocalizedText? = null
        ): Deal {
            require(probability in 0..100) {
                "Probability must be between 0 and 100"
            }
            return Deal(
                title = title,
                source = source,
                contactName = contactName,
                contactEmail = contactEmail,
                salesRepId = salesRepId,
                contactPhone = contactPhone,
                companyName = companyName,
                estimatedValue = estimatedValue,
                probability = probability,
                expectedCloseDate = expectedCloseDate,
                interestedPlanId = interestedPlanId,
                notes = notes
            )
        }
    }
}
