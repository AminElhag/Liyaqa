package com.liyaqa.membership.domain.model

import com.liyaqa.shared.domain.BaseEntity
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

    @Column(name = "name", nullable = false)
    var name: String,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "price_amount")),
        AttributeOverride(name = "currency", column = Column(name = "price_currency"))
    )
    var price: Money,

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_period", nullable = false)
    var billingPeriod: BillingPeriod = BillingPeriod.MONTHLY,

    @Column(name = "duration_days")
    var durationDays: Int? = null,

    @Column(name = "max_classes_per_period")
    var maxClassesPerPeriod: Int? = null,

    @Column(name = "has_guest_passes")
    var hasGuestPasses: Boolean = false,

    @Column(name = "guest_passes_count")
    var guestPassesCount: Int = 0,

    @Column(name = "has_locker_access")
    var hasLockerAccess: Boolean = false,

    @Column(name = "has_sauna_access")
    var hasSaunaAccess: Boolean = false,

    @Column(name = "has_pool_access")
    var hasPoolAccess: Boolean = false,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Column(name = "sort_order")
    var sortOrder: Int = 0

) : BaseEntity(id) {

    fun deactivate() {
        isActive = false
    }

    fun activate() {
        isActive = true
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
