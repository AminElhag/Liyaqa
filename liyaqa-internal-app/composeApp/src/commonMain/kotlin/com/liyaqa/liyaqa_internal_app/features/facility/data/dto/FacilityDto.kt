package com.liyaqa.liyaqa_internal_app.features.facility.data.dto

import com.liyaqa.liyaqa_internal_app.features.facility.domain.model.*
import kotlinx.serialization.Serializable

@Serializable
data class FacilityDto(
    val id: String,
    val tenantId: String,
    val name: String,
    val slug: String,
    val facilityType: String,
    val description: String? = null,
    val logoUrl: String? = null,
    val coverImageUrl: String? = null,
    val contactEmail: String,
    val contactPhone: String? = null,
    val website: String? = null,
    val timezone: String,
    val currency: String,
    val status: String,
    val settings: Map<String, String> = emptyMap(),
    val features: List<String> = emptyList(),
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class FacilityBranchDto(
    val id: String,
    val facilityId: String,
    val tenantId: String,
    val name: String,
    val slug: String,
    val address: String,
    val city: String,
    val state: String? = null,
    val country: String,
    val postalCode: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val contactPhone: String? = null,
    val contactEmail: String? = null,
    val status: String,
    val operatingHours: Map<String, String> = emptyMap(),
    val amenities: List<String> = emptyList(),
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class CreateFacilityRequest(
    val tenantId: String,
    val name: String,
    val facilityType: String,
    val description: String? = null,
    val contactEmail: String,
    val contactPhone: String? = null,
    val timezone: String = "UTC",
    val currency: String = "USD"
)

@Serializable
data class UpdateFacilityRequest(
    val name: String? = null,
    val description: String? = null,
    val contactEmail: String? = null,
    val contactPhone: String? = null,
    val website: String? = null,
    val status: String? = null
)

@Serializable
data class FacilityPageResponse(
    val content: List<FacilityDto>,
    val totalElements: Long,
    val totalPages: Int,
    val size: Int,
    val number: Int,
    val first: Boolean,
    val last: Boolean
)

fun FacilityDto.toDomain() = Facility(
    id, tenantId, name, slug,
    FacilityType.valueOf(facilityType),
    description, logoUrl, coverImageUrl,
    contactEmail, contactPhone, website,
    timezone, currency,
    FacilityStatus.valueOf(status),
    settings, features, createdAt, updatedAt
)

fun FacilityBranchDto.toDomain() = FacilityBranch(
    id, facilityId, tenantId, name, slug,
    address, city, state, country, postalCode,
    latitude, longitude, contactPhone, contactEmail,
    BranchStatus.valueOf(status),
    operatingHours, amenities, createdAt, updatedAt
)
