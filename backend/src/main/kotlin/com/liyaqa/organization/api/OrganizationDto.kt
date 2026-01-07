package com.liyaqa.organization.api

import com.liyaqa.organization.domain.model.Club
import com.liyaqa.organization.domain.model.ClubStatus
import com.liyaqa.organization.domain.model.Location
import com.liyaqa.organization.domain.model.LocationStatus
import com.liyaqa.organization.domain.model.Organization
import com.liyaqa.organization.domain.model.OrganizationStatus
import com.liyaqa.organization.domain.model.OrganizationType
import com.liyaqa.shared.domain.LocalizedAddress
import com.liyaqa.shared.domain.LocalizedText
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import java.time.Instant
import java.util.UUID

// === LocalizedText DTOs ===

data class LocalizedTextResponse(
    val en: String,
    val ar: String?
) {
    companion object {
        fun from(text: LocalizedText) = LocalizedTextResponse(text.en, text.ar)
        fun fromNullable(text: LocalizedText?) = text?.let { from(it) }
    }
}

data class LocalizedAddressResponse(
    val street: LocalizedTextResponse?,
    val building: LocalizedTextResponse?,
    val city: LocalizedTextResponse?,
    val district: LocalizedTextResponse?,
    val postalCode: String?,
    val countryCode: String?,
    val formatted: String
) {
    companion object {
        fun from(addr: LocalizedAddress) = LocalizedAddressResponse(
            street = addr.street?.let { LocalizedTextResponse.from(it) },
            building = addr.building?.let { LocalizedTextResponse.from(it) },
            city = addr.city?.let { LocalizedTextResponse.from(it) },
            district = addr.district?.let { LocalizedTextResponse.from(it) },
            postalCode = addr.postalCode,
            countryCode = addr.countryCode,
            formatted = addr.toFormattedString()
        )

        fun fromNullable(addr: LocalizedAddress?) = addr?.let { from(it) }
    }
}

// === Organization DTOs ===

data class CreateOrganizationRequest(
    @field:NotBlank(message = "Organization name (English) is required")
    val nameEn: String,
    val nameAr: String? = null,
    val tradeNameEn: String? = null,
    val tradeNameAr: String? = null,
    val organizationType: OrganizationType = OrganizationType.LLC,
    @field:Email(message = "Email must be valid")
    val email: String? = null,
    val phone: String? = null,
    val website: String? = null,
    @field:Pattern(regexp = "^[0-9]{15}$", message = "VAT number must be 15 digits")
    val vatRegistrationNumber: String? = null,
    val commercialRegistrationNumber: String? = null
)

data class UpdateOrganizationRequest(
    val nameEn: String? = null,
    val nameAr: String? = null,
    val tradeNameEn: String? = null,
    val tradeNameAr: String? = null,
    val organizationType: OrganizationType? = null,
    @field:Email(message = "Email must be valid")
    val email: String? = null,
    val phone: String? = null,
    val website: String? = null,
    @field:Pattern(regexp = "^[0-9]{15}$", message = "VAT number must be 15 digits")
    val vatRegistrationNumber: String? = null,
    val commercialRegistrationNumber: String? = null
)

data class OrganizationResponse(
    val id: UUID,
    val name: LocalizedTextResponse,
    val tradeName: LocalizedTextResponse?,
    val organizationType: OrganizationType,
    val status: OrganizationStatus,
    val email: String?,
    val phone: String?,
    val website: String?,
    val zatcaEnabled: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(org: Organization) = OrganizationResponse(
            id = org.id,
            name = LocalizedTextResponse.from(org.name),
            tradeName = LocalizedTextResponse.fromNullable(org.tradeName),
            organizationType = org.organizationType,
            status = org.status,
            email = org.email,
            phone = org.phone,
            website = org.website,
            zatcaEnabled = org.isZatcaEnabled(),
            createdAt = org.createdAt,
            updatedAt = org.updatedAt
        )
    }
}

// === Club DTOs ===

data class CreateClubRequest(
    val organizationId: UUID,
    @field:NotBlank(message = "Club name (English) is required")
    val nameEn: String,
    val nameAr: String? = null,
    val descriptionEn: String? = null,
    val descriptionAr: String? = null
)

data class UpdateClubRequest(
    val nameEn: String? = null,
    val nameAr: String? = null,
    val descriptionEn: String? = null,
    val descriptionAr: String? = null
)

data class ClubResponse(
    val id: UUID,
    val organizationId: UUID,
    val name: LocalizedTextResponse,
    val description: LocalizedTextResponse?,
    val status: ClubStatus,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(club: Club) = ClubResponse(
            id = club.id,
            organizationId = club.organizationId,
            name = LocalizedTextResponse.from(club.name),
            description = LocalizedTextResponse.fromNullable(club.description),
            status = club.status,
            createdAt = club.createdAt,
            updatedAt = club.updatedAt
        )
    }
}

// === Location DTOs ===

data class CreateLocationRequest(
    val clubId: UUID,
    @field:NotBlank(message = "Location name (English) is required")
    val nameEn: String,
    val nameAr: String? = null,
    val streetEn: String? = null,
    val streetAr: String? = null,
    val buildingEn: String? = null,
    val buildingAr: String? = null,
    val cityEn: String? = null,
    val cityAr: String? = null,
    val districtEn: String? = null,
    val districtAr: String? = null,
    val postalCode: String? = null,
    val countryCode: String? = null,
    val phone: String? = null,
    @field:Email(message = "Email must be valid")
    val email: String? = null
)

data class UpdateLocationRequest(
    val nameEn: String? = null,
    val nameAr: String? = null,
    val streetEn: String? = null,
    val streetAr: String? = null,
    val buildingEn: String? = null,
    val buildingAr: String? = null,
    val cityEn: String? = null,
    val cityAr: String? = null,
    val districtEn: String? = null,
    val districtAr: String? = null,
    val postalCode: String? = null,
    val countryCode: String? = null,
    val phone: String? = null,
    @field:Email(message = "Email must be valid")
    val email: String? = null
)

data class LocationResponse(
    val id: UUID,
    val clubId: UUID,
    val organizationId: UUID,
    val name: LocalizedTextResponse,
    val address: LocalizedAddressResponse?,
    val phone: String?,
    val email: String?,
    val status: LocationStatus,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(location: Location) = LocationResponse(
            id = location.id,
            clubId = location.clubId,
            organizationId = location.organizationId,
            name = LocalizedTextResponse.from(location.name),
            address = LocalizedAddressResponse.fromNullable(location.address),
            phone = location.phone,
            email = location.email,
            status = location.status,
            createdAt = location.createdAt,
            updatedAt = location.updatedAt
        )
    }
}

// === Shared DTOs ===

data class PageResponse<T>(
    val content: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val first: Boolean,
    val last: Boolean
)