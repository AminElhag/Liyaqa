package com.liyaqa.membership.domain.model

import com.liyaqa.shared.domain.BaseEntity
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import com.liyaqa.shared.domain.TaxableFee
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.LocalDate
import java.util.UUID

@Entity
@Table(name = "membership_plans")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class MembershipPlan(
    id: UUID = UUID.randomUUID(),

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "name_en", nullable = false)),
        AttributeOverride(name = "ar", column = Column(name = "name_ar"))
    )
    var name: LocalizedText,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "description_en")),
        AttributeOverride(name = "ar", column = Column(name = "description_ar"))
    )
    var description: LocalizedText? = null,

    // === DATE RESTRICTIONS ===
    @Column(name = "available_from")
    var availableFrom: LocalDate? = null,

    @Column(name = "available_until")
    var availableUntil: LocalDate? = null,

    // === AGE RESTRICTIONS ===
    @Column(name = "minimum_age")
    var minimumAge: Int? = null,

    @Column(name = "maximum_age")
    var maximumAge: Int? = null,

    // === FEE STRUCTURE ===
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "membership_fee_amount", nullable = false)),
        AttributeOverride(name = "currency", column = Column(name = "membership_fee_currency", nullable = false)),
        AttributeOverride(name = "taxRate", column = Column(name = "membership_fee_tax_rate", nullable = false))
    )
    var membershipFee: TaxableFee = TaxableFee(),

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "admin_fee_amount", nullable = false)),
        AttributeOverride(name = "currency", column = Column(name = "admin_fee_currency", nullable = false)),
        AttributeOverride(name = "taxRate", column = Column(name = "admin_fee_tax_rate", nullable = false))
    )
    var administrationFee: TaxableFee = TaxableFee(),

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "join_fee_amount", nullable = false)),
        AttributeOverride(name = "currency", column = Column(name = "join_fee_currency", nullable = false)),
        AttributeOverride(name = "taxRate", column = Column(name = "join_fee_tax_rate", nullable = false))
    )
    var joinFee: TaxableFee = TaxableFee(),

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_period", nullable = false)
    var billingPeriod: BillingPeriod = BillingPeriod.MONTHLY,

    @Column(name = "duration_days")
    var durationDays: Int? = null,

    @Column(name = "max_classes_per_period")
    var maxClassesPerPeriod: Int? = null,

    @Column(name = "has_guest_passes", nullable = false)
    var hasGuestPasses: Boolean = false,

    @Column(name = "guest_passes_count", nullable = false)
    var guestPassesCount: Int = 0,

    @Column(name = "has_locker_access", nullable = false)
    var hasLockerAccess: Boolean = false,

    @Column(name = "has_sauna_access", nullable = false)
    var hasSaunaAccess: Boolean = false,

    @Column(name = "has_pool_access", nullable = false)
    var hasPoolAccess: Boolean = false,

    @Column(name = "freeze_days_allowed", nullable = false)
    var freezeDaysAllowed: Int = 0,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0,

    // === CONTRACT CONFIGURATION ===
    @Column(name = "category_id")
    var categoryId: UUID? = null,

    @Column(name = "contract_type", length = 20)
    var contractType: String = "MONTH_TO_MONTH",

    @Column(name = "supported_terms")
    var supportedTerms: String = "MONTHLY",  // Comma-separated values

    @Column(name = "default_commitment_months")
    var defaultCommitmentMonths: Int = 1,

    @Column(name = "minimum_commitment_months")
    var minimumCommitmentMonths: Int? = null,

    @Column(name = "default_notice_period_days")
    var defaultNoticePeriodDays: Int = 30,

    @Column(name = "early_termination_fee_type", length = 30)
    var earlyTerminationFeeType: String = "NONE",

    @Column(name = "early_termination_fee_value")
    var earlyTerminationFeeValue: java.math.BigDecimal? = null,

    @Column(name = "cooling_off_days")
    var coolingOffDays: Int = 14

) : BaseEntity(id) {

    /**
     * Deactivates the plan so it cannot be used for new subscriptions.
     */
    fun deactivate() {
        isActive = false
    }

    /**
     * Activates the plan so it can be used for new subscriptions.
     */
    fun activate() {
        isActive = true
    }

    /**
     * Check if the plan is currently available based on date restrictions and active status.
     */
    fun isCurrentlyAvailable(): Boolean {
        val today = LocalDate.now()
        val afterStart = availableFrom == null || !today.isBefore(availableFrom)
        val beforeEnd = availableUntil == null || !today.isAfter(availableUntil)
        return isActive && afterStart && beforeEnd
    }

    /**
     * Check if the plan has any date restrictions (start or end date).
     */
    fun hasDateRestriction(): Boolean = availableFrom != null || availableUntil != null

    /**
     * Check if a member's age is eligible for this plan.
     */
    fun isAgeEligible(memberAge: Int): Boolean {
        val meetsMinimum = minimumAge == null || memberAge >= minimumAge!!
        val meetsMaximum = maximumAge == null || memberAge <= maximumAge!!
        return meetsMinimum && meetsMaximum
    }

    /**
     * Check if the plan has any age restrictions.
     */
    fun hasAgeRestriction(): Boolean = minimumAge != null || maximumAge != null

    /**
     * Calculate total recurring fees (membership + admin).
     * This is the amount charged on each billing cycle.
     */
    fun getRecurringTotal(): Money {
        return membershipFee.getGrossAmount() + administrationFee.getGrossAmount()
    }

    /**
     * Calculate total price including join fee.
     * This is the amount for the first subscription.
     */
    fun getTotalPrice(): Money {
        return membershipFee.getGrossAmount() + administrationFee.getGrossAmount() + joinFee.getGrossAmount()
    }

    /**
     * Get the legacy price for backward compatibility.
     * Returns the membership fee net amount (before tax).
     */
    fun getLegacyPrice(): Money {
        return membershipFee.getNetAmount()
    }

    /**
     * Calculates the duration in days based on billing period if not explicitly set.
     */
    fun getEffectiveDurationDays(): Int {
        return durationDays ?: when (billingPeriod) {
            BillingPeriod.DAILY -> 1
            BillingPeriod.WEEKLY -> 7
            BillingPeriod.BIWEEKLY -> 14
            BillingPeriod.MONTHLY -> 30
            BillingPeriod.QUARTERLY -> 90
            BillingPeriod.YEARLY -> 365
            BillingPeriod.ONE_TIME -> 365 // Default to 1 year for one-time
        }
    }

    /**
     * Checks if this plan has unlimited classes.
     */
    fun hasUnlimitedClasses(): Boolean = maxClassesPerPeriod == null

    /**
     * Get supported contract terms as a list.
     */
    fun getSupportedTermsList(): List<String> {
        return supportedTerms.split(",").map { it.trim() }.filter { it.isNotEmpty() }
    }

    /**
     * Set supported contract terms from a list.
     */
    fun setSupportedTermsList(terms: List<String>) {
        supportedTerms = terms.joinToString(",")
    }
}

enum class BillingPeriod {
    DAILY,
    WEEKLY,
    BIWEEKLY,
    MONTHLY,
    QUARTERLY,
    YEARLY,
    ONE_TIME
}
