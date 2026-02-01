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
import java.time.LocalDate
import java.util.UUID

@Entity
@Table(name = "subscription_freeze_history")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class FreezeHistory(
    id: UUID = UUID.randomUUID(),

    @Column(name = "subscription_id", nullable = false)
    val subscriptionId: UUID,

    @Column(name = "freeze_start_date", nullable = false)
    val freezeStartDate: LocalDate,

    @Column(name = "freeze_end_date")
    var freezeEndDate: LocalDate? = null,

    @Column(name = "freeze_days", nullable = false)
    val freezeDays: Int,

    @Column(name = "freeze_type", nullable = false)
    @Enumerated(EnumType.STRING)
    val freezeType: FreezeType,

    @Column(name = "reason")
    val reason: String? = null,

    @Column(name = "document_path")
    val documentPath: String? = null,

    @Column(name = "freeze_package_id")
    val freezePackageId: UUID? = null,

    @Column(name = "created_by_user_id")
    val createdByUserId: UUID? = null,

    @Column(name = "contract_extended")
    val contractExtended: Boolean = true,

    @Column(name = "original_end_date")
    val originalEndDate: LocalDate? = null,

    @Column(name = "new_end_date")
    val newEndDate: LocalDate? = null

) : BaseEntity(id) {

    fun endFreeze(endDate: LocalDate = LocalDate.now()) {
        freezeEndDate = endDate
    }

    fun isActive(): Boolean = freezeEndDate == null
}

enum class FreezeType {
    MEDICAL,    // Medical reason - may require documentation
    TRAVEL,     // Vacation/travel
    PERSONAL,   // Personal reasons
    MILITARY,   // Military service
    OTHER       // Other reasons
}
