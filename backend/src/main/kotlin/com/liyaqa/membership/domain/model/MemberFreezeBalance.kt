package com.liyaqa.membership.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.util.UUID

@Entity
@Table(name = "member_freeze_balances")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class MemberFreezeBalance(
    id: UUID = UUID.randomUUID(),

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Column(name = "subscription_id", nullable = false)
    val subscriptionId: UUID,

    @Column(name = "total_freeze_days", nullable = false)
    var totalFreezeDays: Int = 0,

    @Column(name = "used_freeze_days", nullable = false)
    var usedFreezeDays: Int = 0,

    @Column(name = "source")
    @Enumerated(EnumType.STRING)
    var source: FreezeSource = FreezeSource.PURCHASED

) : BaseEntity(id) {

    fun availableDays(): Int = totalFreezeDays - usedFreezeDays

    fun useDays(days: Int) {
        require(days > 0) { "Days must be positive" }
        require(days <= availableDays()) { "Insufficient freeze days. Available: ${availableDays()}, Requested: $days" }
        usedFreezeDays += days
    }

    fun addDays(days: Int, newSource: FreezeSource) {
        require(days > 0) { "Days must be positive" }
        totalFreezeDays += days
        source = newSource
    }

    fun hasAvailableDays(): Boolean = availableDays() > 0
}

enum class FreezeSource {
    NONE,            // No freeze balance yet (used for empty response)
    PURCHASED,       // Bought a freeze package
    PLAN_INCLUDED,   // Included in membership plan
    PROMOTIONAL,     // Given as promotion
    COMPENSATION     // Given as compensation for issues
}
