package com.liyaqa.facilities.domain.model

import com.liyaqa.shared.domain.BaseEntity
import com.liyaqa.shared.domain.LocalizedText
import jakarta.persistence.*
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.math.BigDecimal
import java.util.*

@Entity
@Table(name = "facilities")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class Facility(
    id: UUID = UUID.randomUUID(),

    @Column(name = "location_id", nullable = false)
    val locationId: UUID,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "name_en", nullable = false, length = 100)),
        AttributeOverride(name = "ar", column = Column(name = "name_ar", length = 100))
    )
    var name: LocalizedText,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "description_en")),
        AttributeOverride(name = "ar", column = Column(name = "description_ar"))
    )
    var description: LocalizedText? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    var type: FacilityType,

    @Column(name = "capacity", nullable = false)
    var capacity: Int = 1,

    @Column(name = "hourly_rate", precision = 10, scale = 2)
    var hourlyRate: BigDecimal? = null,

    @Column(name = "hourly_rate_currency", length = 3)
    var hourlyRateCurrency: String = "SAR",

    @Column(name = "requires_subscription", nullable = false)
    var requiresSubscription: Boolean = true,

    @Column(name = "booking_window_days", nullable = false)
    var bookingWindowDays: Int = 7,

    @Column(name = "min_booking_minutes", nullable = false)
    var minBookingMinutes: Int = 30,

    @Column(name = "max_booking_minutes", nullable = false)
    var maxBookingMinutes: Int = 120,

    @Column(name = "buffer_minutes", nullable = false)
    var bufferMinutes: Int = 15,

    @Enumerated(EnumType.STRING)
    @Column(name = "gender_restriction", length = 20)
    var genderRestriction: GenderRestriction? = null,

    @Column(name = "image_url")
    var imageUrl: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    var status: FacilityStatus = FacilityStatus.ACTIVE,

    @OneToMany(mappedBy = "facility", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.EAGER)
    val operatingHours: MutableList<FacilityOperatingHours> = mutableListOf()
) : BaseEntity(id) {

    fun activate() {
        status = FacilityStatus.ACTIVE
    }

    fun deactivate() {
        status = FacilityStatus.INACTIVE
    }

    fun setMaintenance() {
        status = FacilityStatus.MAINTENANCE
    }

    fun addOperatingHours(hours: FacilityOperatingHours) {
        operatingHours.removeIf { it.dayOfWeek == hours.dayOfWeek }
        hours.facility = this
        operatingHours.add(hours)
    }

    fun isOpenOn(dayOfWeek: Int): Boolean {
        return operatingHours.any { it.dayOfWeek == dayOfWeek && !it.isClosed }
    }
}
