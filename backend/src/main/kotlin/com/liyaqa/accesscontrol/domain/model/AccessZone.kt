package com.liyaqa.accesscontrol.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.util.*

@Entity
@Table(name = "access_zones")
@FilterDef(name = "tenantFilter", parameters = [ParamDef(name = "tenantId", type = UUID::class)])
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class AccessZone(
    @Column(name = "location_id", nullable = false)
    var locationId: UUID,

    @Column(name = "name", nullable = false, length = 100)
    var name: String,

    @Column(name = "name_ar", length = 100)
    var nameAr: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "zone_type", nullable = false, length = 30)
    var zoneType: ZoneType,

    @Column(name = "max_occupancy")
    var maxOccupancy: Int? = null,

    @Column(name = "current_occupancy")
    var currentOccupancy: Int = 0,

    @Enumerated(EnumType.STRING)
    @Column(name = "gender_restriction", length = 10)
    var genderRestriction: GenderRestriction? = null,

    @Column(name = "require_specific_plans")
    var requireSpecificPlans: String? = null, // JSON array of plan IDs

    @Column(name = "is_active")
    var isActive: Boolean = true
) : BaseEntity() {

    fun isAtCapacity(): Boolean {
        return maxOccupancy != null && currentOccupancy >= maxOccupancy!!
    }

    fun incrementOccupancy() {
        currentOccupancy++
    }

    fun decrementOccupancy() {
        if (currentOccupancy > 0) {
            currentOccupancy--
        }
    }
}
