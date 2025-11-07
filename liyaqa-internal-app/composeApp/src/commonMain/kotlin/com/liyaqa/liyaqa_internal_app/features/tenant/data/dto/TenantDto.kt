package com.liyaqa.liyaqa_internal_app.features.tenant.data.dto

import com.liyaqa.liyaqa_internal_app.features.tenant.domain.model.Tenant
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.model.TenantStatus
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.model.SubscriptionTier
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.model.SubscriptionStatus
import kotlinx.serialization.Serializable

@Serializable
data class TenantDto(
    val id: String,
    val name: String,
    val slug: String,
    val contactEmail: String,
    val contactPhone: String? = null,
    val address: String? = null,
    val city: String? = null,
    val state: String? = null,
    val country: String,
    val postalCode: String? = null,
    val status: String,
    val subscriptionTier: String,
    val subscriptionStatus: String,
    val subscriptionStartDate: String,
    val subscriptionEndDate: String? = null,
    val maxFacilities: Int,
    val maxEmployees: Int,
    val maxMembers: Int,
    val features: List<String> = emptyList(),
    val timezone: String,
    val locale: String,
    val currency: String,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class CreateTenantRequest(
    val name: String,
    val contactEmail: String,
    val contactPhone: String? = null,
    val address: String? = null,
    val city: String? = null,
    val state: String? = null,
    val country: String,
    val postalCode: String? = null,
    val subscriptionTier: String,
    val timezone: String = "UTC",
    val locale: String = "en_US",
    val currency: String = "USD"
)

@Serializable
data class UpdateTenantRequest(
    val name: String? = null,
    val contactEmail: String? = null,
    val contactPhone: String? = null,
    val address: String? = null,
    val city: String? = null,
    val state: String? = null,
    val postalCode: String? = null,
    val status: String? = null
)

@Serializable
data class TenantPageResponse(
    val content: List<TenantDto>,
    val totalElements: Long,
    val totalPages: Int,
    val size: Int,
    val number: Int,
    val first: Boolean,
    val last: Boolean
)

fun TenantDto.toDomain(): Tenant {
    return Tenant(
        id = id,
        name = name,
        slug = slug,
        contactEmail = contactEmail,
        contactPhone = contactPhone,
        address = address,
        city = city,
        state = state,
        country = country,
        postalCode = postalCode,
        status = TenantStatus.valueOf(status),
        subscriptionTier = SubscriptionTier.valueOf(subscriptionTier),
        subscriptionStatus = SubscriptionStatus.valueOf(subscriptionStatus),
        subscriptionStartDate = subscriptionStartDate,
        subscriptionEndDate = subscriptionEndDate,
        maxFacilities = maxFacilities,
        maxEmployees = maxEmployees,
        maxMembers = maxMembers,
        features = features,
        timezone = timezone,
        locale = locale,
        currency = currency,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}
