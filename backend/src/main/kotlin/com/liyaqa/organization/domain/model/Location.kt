package com.liyaqa.organization.domain.model

import com.liyaqa.shared.domain.LocalizedAddress
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.OrganizationAwareEntity
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

/**
 * Location entity - represents a physical location/branch of a club.
 * A club can have multiple locations.
 *
 * Supports both tenant-level filtering (club) and organization-level filtering.
 */
@Entity
@Table(name = "locations")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
@FilterDef(
    name = "organizationFilter",
    parameters = [ParamDef(name = "organizationId", type = UUID::class)]
)
@Filter(name = "organizationFilter", condition = "organization_id = :organizationId")
class Location(
    id: UUID = UUID.randomUUID(),

    @Column(name = "club_id", nullable = false, updatable = false)
    val clubId: UUID,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "name_en", nullable = false)),
        AttributeOverride(name = "ar", column = Column(name = "name_ar"))
    )
    var name: LocalizedText,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "street.en", column = Column(name = "street_en")),
        AttributeOverride(name = "street.ar", column = Column(name = "street_ar")),
        AttributeOverride(name = "building.en", column = Column(name = "building_en")),
        AttributeOverride(name = "building.ar", column = Column(name = "building_ar")),
        AttributeOverride(name = "city.en", column = Column(name = "city_en")),
        AttributeOverride(name = "city.ar", column = Column(name = "city_ar")),
        AttributeOverride(name = "district.en", column = Column(name = "district_en")),
        AttributeOverride(name = "district.ar", column = Column(name = "district_ar")),
        AttributeOverride(name = "postalCode", column = Column(name = "postal_code")),
        AttributeOverride(name = "countryCode", column = Column(name = "country_code"))
    )
    var address: LocalizedAddress? = null,

    @Column(name = "phone", length = 20)
    var phone: String? = null,

    @Column(name = "email")
    var email: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: LocationStatus = LocationStatus.ACTIVE

) : OrganizationAwareEntity(id) {

    /**
     * Initialize tenant and organization IDs from the parent club.
     * Must be called when creating a new location.
     */
    fun initializeFromClub(club: Club) {
        setTenantAndOrganization(club.id, club.organizationId)
    }

    /**
     * Temporarily close the location (e.g., for renovation).
     */
    fun temporarilyClose() {
        require(status == LocationStatus.ACTIVE) {
            "Only active locations can be temporarily closed"
        }
        status = LocationStatus.TEMPORARILY_CLOSED
    }

    /**
     * Reopen a temporarily closed location.
     */
    fun reopen() {
        require(status == LocationStatus.TEMPORARILY_CLOSED) {
            "Only temporarily closed locations can be reopened"
        }
        status = LocationStatus.ACTIVE
    }

    /**
     * Permanently close the location.
     */
    fun permanentlyClose() {
        require(status != LocationStatus.PERMANENTLY_CLOSED) {
            "Location is already permanently closed"
        }
        status = LocationStatus.PERMANENTLY_CLOSED
    }
}