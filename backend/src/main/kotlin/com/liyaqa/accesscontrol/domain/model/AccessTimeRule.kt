package com.liyaqa.accesscontrol.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.LocalDate
import java.time.LocalTime
import java.util.*

@Entity
@Table(name = "access_time_rules")
@FilterDef(name = "tenantFilter", parameters = [ParamDef(name = "tenantId", type = UUID::class)])
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class AccessTimeRule(
    @Column(name = "zone_id")
    var zoneId: UUID? = null,

    @Column(name = "plan_id")
    var planId: UUID? = null,

    @Column(name = "member_id")
    var memberId: UUID? = null,

    @Column(name = "name", nullable = false, length = 100)
    var name: String,

    @Column(name = "name_ar", length = 100)
    var nameAr: String? = null,

    @Column(name = "day_of_week")
    var dayOfWeek: Int? = null, // 0=Sunday, 1=Monday, ..., 6=Saturday

    @Column(name = "start_time", nullable = false)
    var startTime: LocalTime,

    @Column(name = "end_time", nullable = false)
    var endTime: LocalTime,

    @Enumerated(EnumType.STRING)
    @Column(name = "access_type", nullable = false, length = 20)
    var accessType: AccessRuleType,

    @Column(name = "priority")
    var priority: Int = 0,

    @Column(name = "is_active")
    var isActive: Boolean = true,

    @Column(name = "valid_from")
    var validFrom: LocalDate? = null,

    @Column(name = "valid_until")
    var validUntil: LocalDate? = null
) : BaseEntity() {

    fun isApplicableAt(dateTime: java.time.LocalDateTime): Boolean {
        if (!isActive) return false

        val date = dateTime.toLocalDate()
        val time = dateTime.toLocalTime()

        // Check date validity
        if (validFrom != null && date.isBefore(validFrom)) return false
        if (validUntil != null && date.isAfter(validUntil)) return false

        // Check day of week
        if (dayOfWeek != null && dateTime.dayOfWeek.value % 7 != dayOfWeek) return false

        // Check time range
        return time >= startTime && time <= endTime
    }
}
