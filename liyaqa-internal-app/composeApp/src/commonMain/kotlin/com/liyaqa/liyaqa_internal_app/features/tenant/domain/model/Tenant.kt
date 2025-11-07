package com.liyaqa.liyaqa_internal_app.features.tenant.domain.model

/**
 * Tenant domain model representing customer organizations (sports facilities).
 * Manages subscription and settings for multi-tenant architecture.
 */
data class Tenant(
    val id: String,
    val name: String,
    val slug: String,
    val contactEmail: String,
    val contactPhone: String?,
    val address: String?,
    val city: String?,
    val state: String?,
    val country: String,
    val postalCode: String?,
    val status: TenantStatus,
    val subscriptionTier: SubscriptionTier,
    val subscriptionStatus: SubscriptionStatus,
    val subscriptionStartDate: String,
    val subscriptionEndDate: String?,
    val maxFacilities: Int,
    val maxEmployees: Int,
    val maxMembers: Int,
    val features: List<String> = emptyList(),
    val timezone: String,
    val locale: String,
    val currency: String,
    val createdAt: String,
    val updatedAt: String
) {
    val isActive: Boolean
        get() = status == TenantStatus.ACTIVE

    val hasActiveSubscription: Boolean
        get() = subscriptionStatus == SubscriptionStatus.ACTIVE
}

/**
 * Tenant status enum
 */
enum class TenantStatus {
    ACTIVE,
    INACTIVE,
    SUSPENDED,
    TRIAL
}

/**
 * Subscription tier enum
 */
enum class SubscriptionTier {
    FREE,
    BASIC,
    PREMIUM,
    ENTERPRISE
}

/**
 * Subscription status enum
 */
enum class SubscriptionStatus {
    ACTIVE,
    EXPIRED,
    CANCELLED,
    SUSPENDED,
    TRIAL
}
