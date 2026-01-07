package com.liyaqa.membership.domain.model

import com.liyaqa.shared.domain.BaseEntity
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
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
import java.util.UUID

@Entity
@Table(name = "membership_plans")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
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

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "price_amount", nullable = false)),
        AttributeOverride(name = "currency", column = Column(name = "price_currency", nullable = false))
    )
    var price: Money,

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
    var sortOrder: Int = 0

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