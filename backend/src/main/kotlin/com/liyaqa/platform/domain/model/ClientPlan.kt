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
import jakarta.persistence.Table
import java.util.UUID

/**
 * Represents a B2B pricing tier for the Liyaqa platform.
 * Clients (organizations) subscribe to these plans.
 *
 * This is a platform-level entity (no tenant_id) as it defines
 * global pricing options managed by the Liyaqa internal team.
 */
@Entity
@Table(name = "client_plans")
class ClientPlan(
    id: UUID = UUID.randomUUID(),

    /**
     * Plan name (localized)
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "name_en", nullable = false)),
        AttributeOverride(name = "ar", column = Column(name = "name_ar"))
    )
    var name: LocalizedText,

    /**
     * Plan description (localized)
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "description_en")),
        AttributeOverride(name = "ar", column = Column(name = "description_ar"))
    )
    var description: LocalizedText? = null,

    /**
     * Monthly subscription price
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "monthly_price_amount", nullable = false)),
        AttributeOverride(name = "currency", column = Column(name = "monthly_price_currency", nullable = false))
    )
    var monthlyPrice: Money,

    /**
     * Annual subscription price (typically discounted)
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "annual_price_amount", nullable = false)),
        AttributeOverride(name = "currency", column = Column(name = "annual_price_currency", nullable = false))
    )
    var annualPrice: Money,

    /**
     * Default billing cycle for this plan
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "billing_cycle", nullable = false)
    var billingCycle: BillingCycle = BillingCycle.MONTHLY,

    // ============================================
    // Usage Limits
    // ============================================

    /**
     * Maximum number of clubs allowed
     */
    @Column(name = "max_clubs", nullable = false)
    var maxClubs: Int = 1,

    /**
     * Maximum locations per club
     */
    @Column(name = "max_locations_per_club", nullable = false)
    var maxLocationsPerClub: Int = 1,

    /**
     * Maximum total members
     */
    @Column(name = "max_members", nullable = false)
    var maxMembers: Int = 100,

    /**
     * Maximum staff/admin users
     */
    @Column(name = "max_staff_users", nullable = false)
    var maxStaffUsers: Int = 5,

    // ============================================
    // Feature Flags
    // ============================================

    /**
     * Access to advanced reporting features
     */
    @Column(name = "has_advanced_reporting", nullable = false)
    var hasAdvancedReporting: Boolean = false,

    /**
     * API access for integrations
     */
    @Column(name = "has_api_access", nullable = false)
    var hasApiAccess: Boolean = false,

    /**
     * Priority support included
     */
    @Column(name = "has_priority_support", nullable = false)
    var hasPrioritySupport: Boolean = false,

    /**
     * White labeling / custom branding
     */
    @Column(name = "has_white_labeling", nullable = false)
    var hasWhiteLabeling: Boolean = false,

    /**
     * Custom integrations support
     */
    @Column(name = "has_custom_integrations", nullable = false)
    var hasCustomIntegrations: Boolean = false,

    // ============================================
    // Status & Display
    // ============================================

    /**
     * Whether this plan is available for new subscriptions
     */
    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    /**
     * Display order (lower = higher priority)
     */
    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0

) : OrganizationLevelEntity(id) {

    // ============================================
    // Domain Methods
    // ============================================

    /**
     * Activates this plan, making it available for new subscriptions.
     */
    fun activate() {
        isActive = true
    }

    /**
     * Deactivates this plan, preventing new subscriptions.
     * Existing subscriptions are not affected.
     */
    fun deactivate() {
        isActive = false
    }

    /**
     * Gets the price for a specific billing cycle.
     */
    fun getPriceForCycle(cycle: BillingCycle): Money {
        return when (cycle) {
            BillingCycle.MONTHLY -> monthlyPrice
            BillingCycle.QUARTERLY -> Money.of(monthlyPrice.amount * 3.toBigDecimal(), monthlyPrice.currency)
            BillingCycle.ANNUAL -> annualPrice
        }
    }

    /**
     * Calculates the monthly effective price for a billing cycle.
     * Used to show savings for longer commitments.
     */
    fun getEffectiveMonthlyPrice(cycle: BillingCycle): Money {
        return when (cycle) {
            BillingCycle.MONTHLY -> monthlyPrice
            BillingCycle.QUARTERLY -> Money.of(monthlyPrice.amount, monthlyPrice.currency) // Same as monthly
            BillingCycle.ANNUAL -> Money.of(
                annualPrice.amount.divide(12.toBigDecimal(), 2, java.math.RoundingMode.HALF_UP),
                annualPrice.currency
            )
        }
    }

    /**
     * Calculates the annual savings compared to monthly billing.
     * Returns zero if currencies don't match (data inconsistency).
     */
    fun getAnnualSavings(): Money {
        // Handle currency mismatch gracefully (legacy data)
        if (monthlyPrice.currency != annualPrice.currency) {
            return Money.of(java.math.BigDecimal.ZERO, monthlyPrice.currency)
        }
        val annualIfMonthly = Money.of(monthlyPrice.amount * 12.toBigDecimal(), monthlyPrice.currency)
        return annualIfMonthly - annualPrice
    }

    /**
     * Checks if the plan supports unlimited clubs (enterprise-level).
     */
    fun hasUnlimitedClubs(): Boolean = maxClubs >= 999

    /**
     * Checks if the plan supports unlimited members.
     */
    fun hasUnlimitedMembers(): Boolean = maxMembers >= 999999

    /**
     * Updates the pricing for this plan.
     */
    fun updatePricing(monthly: Money, annual: Money) {
        require(annual <= Money.of(monthly.amount * 12.toBigDecimal(), monthly.currency)) {
            "Annual price should not exceed 12 months of monthly pricing"
        }
        this.monthlyPrice = monthly
        this.annualPrice = annual
    }

    /**
     * Updates the usage limits for this plan.
     */
    fun updateLimits(
        maxClubs: Int? = null,
        maxLocationsPerClub: Int? = null,
        maxMembers: Int? = null,
        maxStaffUsers: Int? = null
    ) {
        maxClubs?.let {
            require(it > 0) { "Max clubs must be positive" }
            this.maxClubs = it
        }
        maxLocationsPerClub?.let {
            require(it > 0) { "Max locations per club must be positive" }
            this.maxLocationsPerClub = it
        }
        maxMembers?.let {
            require(it > 0) { "Max members must be positive" }
            this.maxMembers = it
        }
        maxStaffUsers?.let {
            require(it > 0) { "Max staff users must be positive" }
            this.maxStaffUsers = it
        }
    }

    /**
     * Updates feature flags for this plan.
     */
    fun updateFeatures(
        advancedReporting: Boolean? = null,
        apiAccess: Boolean? = null,
        prioritySupport: Boolean? = null,
        whiteLabeling: Boolean? = null,
        customIntegrations: Boolean? = null
    ) {
        advancedReporting?.let { this.hasAdvancedReporting = it }
        apiAccess?.let { this.hasApiAccess = it }
        prioritySupport?.let { this.hasPrioritySupport = it }
        whiteLabeling?.let { this.hasWhiteLabeling = it }
        customIntegrations?.let { this.hasCustomIntegrations = it }
    }
}
