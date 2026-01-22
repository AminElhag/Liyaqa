package com.liyaqa.platform.api.dto

import com.liyaqa.organization.domain.model.Club
import com.liyaqa.organization.domain.model.ClubStatus
import com.liyaqa.organization.domain.model.Organization
import com.liyaqa.organization.domain.model.OrganizationStatus
import com.liyaqa.organization.domain.model.OrganizationType
import com.liyaqa.platform.application.services.ClientStats
import com.liyaqa.platform.application.services.OnboardClientCommand
import com.liyaqa.platform.application.services.OnboardingResult
import com.liyaqa.platform.application.services.SetupAdminCommand
import com.liyaqa.platform.domain.model.BillingCycle
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.PositiveOrZero
import jakarta.validation.constraints.Size
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

// ============================================
// Request DTOs
// ============================================

data class OnboardClientRequest(
    // Organization
    @field:NotBlank(message = "Organization name (English) is required")
    val organizationNameEn: String,

    val organizationNameAr: String? = null,

    val organizationTradeNameEn: String? = null,
    val organizationTradeNameAr: String? = null,

    val organizationType: OrganizationType? = null,

    @field:Email(message = "Organization email must be valid")
    val organizationEmail: String? = null,

    val organizationPhone: String? = null,
    val organizationWebsite: String? = null,

    @field:Pattern(regexp = "^[0-9]{15}$", message = "VAT number must be 15 digits")
    val vatRegistrationNumber: String? = null,

    val commercialRegistrationNumber: String? = null,

    // Club
    @field:NotBlank(message = "Club name (English) is required")
    val clubNameEn: String,

    val clubNameAr: String? = null,

    val clubDescriptionEn: String? = null,
    val clubDescriptionAr: String? = null,

    /**
     * Optional subdomain slug for the club (e.g., "fitness-gym" for fitness-gym.liyaqa.com).
     * If not provided, auto-generated from club name.
     * Must be 3-63 lowercase alphanumeric characters with hyphens.
     */
    @field:Size(min = 3, max = 63, message = "Slug must be 3-63 characters")
    @field:Pattern(
        regexp = "^[a-z0-9][a-z0-9-]*[a-z0-9]$",
        message = "Slug must be lowercase alphanumeric with hyphens, cannot start/end with hyphen"
    )
    val clubSlug: String? = null,

    // Admin User
    @field:NotBlank(message = "Admin email is required")
    @field:Email(message = "Admin email must be valid")
    val adminEmail: String,

    @field:NotBlank(message = "Admin password is required")
    @field:Size(min = 8, message = "Password must be at least 8 characters")
    val adminPassword: String,

    @field:NotBlank(message = "Admin display name (English) is required")
    val adminDisplayNameEn: String,

    val adminDisplayNameAr: String? = null,

    // Subscription (optional)
    val clientPlanId: UUID? = null,

    @field:Positive(message = "Agreed price must be positive")
    val agreedPriceAmount: BigDecimal? = null,

    val agreedPriceCurrency: String = "SAR",

    val billingCycle: BillingCycle? = null,

    @field:Positive(message = "Contract months must be positive")
    val contractMonths: Int? = null,

    val startWithTrial: Boolean? = null,

    @field:Positive(message = "Trial days must be positive")
    val trialDays: Int? = null,

    @field:PositiveOrZero(message = "Discount percentage must be zero or positive")
    @field:Max(value = 100, message = "Discount percentage cannot exceed 100")
    val discountPercentage: BigDecimal? = null,

    // Sales attribution
    val salesRepId: UUID? = null,
    val dealId: UUID? = null
) {
    fun toCommand() = OnboardClientCommand(
        organizationName = LocalizedText(en = organizationNameEn, ar = organizationNameAr),
        organizationTradeName = if (organizationTradeNameEn != null) {
            LocalizedText(en = organizationTradeNameEn, ar = organizationTradeNameAr)
        } else null,
        organizationType = organizationType ?: OrganizationType.LLC,
        organizationEmail = organizationEmail,
        organizationPhone = organizationPhone,
        organizationWebsite = organizationWebsite,
        vatRegistrationNumber = vatRegistrationNumber,
        commercialRegistrationNumber = commercialRegistrationNumber,
        clubName = LocalizedText(en = clubNameEn, ar = clubNameAr),
        clubDescription = if (clubDescriptionEn != null) {
            LocalizedText(en = clubDescriptionEn, ar = clubDescriptionAr)
        } else null,
        clubSlug = clubSlug,
        adminEmail = adminEmail,
        adminPassword = adminPassword,
        adminDisplayName = LocalizedText(en = adminDisplayNameEn, ar = adminDisplayNameAr),
        clientPlanId = clientPlanId,
        agreedPrice = if (agreedPriceAmount != null) Money(agreedPriceAmount, agreedPriceCurrency) else null,
        billingCycle = billingCycle ?: BillingCycle.MONTHLY,
        contractMonths = contractMonths ?: 12,
        startWithTrial = startWithTrial ?: true,
        trialDays = trialDays ?: 14,
        discountPercentage = discountPercentage,
        salesRepId = salesRepId,
        dealId = dealId
    )
}

data class SetupAdminRequest(
    @field:NotNull(message = "Club ID is required")
    val clubId: UUID,

    @field:NotBlank(message = "Admin email is required")
    @field:Email(message = "Admin email must be valid")
    val adminEmail: String,

    @field:NotBlank(message = "Admin password is required")
    @field:Size(min = 8, message = "Password must be at least 8 characters")
    val adminPassword: String,

    @field:NotBlank(message = "Admin display name (English) is required")
    val adminDisplayNameEn: String,

    val adminDisplayNameAr: String? = null
) {
    fun toCommand(organizationId: UUID) = SetupAdminCommand(
        organizationId = organizationId,
        clubId = clubId,
        adminEmail = adminEmail,
        adminPassword = adminPassword,
        adminDisplayName = LocalizedText(en = adminDisplayNameEn, ar = adminDisplayNameAr)
    )
}

data class CreateClientClubRequest(
    @field:NotBlank(message = "Club name (English) is required")
    val nameEn: String,

    val nameAr: String? = null,

    val descriptionEn: String? = null,
    val descriptionAr: String? = null
)

// ============================================
// Response DTOs
// ============================================

data class ClientResponse(
    val id: UUID,
    val name: LocalizedTextResponse,
    val tradeName: LocalizedTextResponse?,
    val organizationType: OrganizationType,
    val email: String?,
    val phone: String?,
    val website: String?,
    val vatRegistrationNumber: String?,
    val commercialRegistrationNumber: String?,
    val status: OrganizationStatus,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(org: Organization) = ClientResponse(
            id = org.id,
            name = LocalizedTextResponse.from(org.name),
            tradeName = org.tradeName?.let { LocalizedTextResponse.from(it) },
            organizationType = org.organizationType,
            email = org.email,
            phone = org.phone,
            website = org.website,
            vatRegistrationNumber = org.zatcaInfo?.vatRegistrationNumber,
            commercialRegistrationNumber = org.zatcaInfo?.commercialRegistrationNumber,
            status = org.status,
            createdAt = org.createdAt,
            updatedAt = org.updatedAt
        )
    }
}

data class ClientClubResponse(
    val id: UUID,
    val organizationId: UUID,
    val name: LocalizedTextResponse,
    val description: LocalizedTextResponse?,
    /**
     * Subdomain slug for this club (e.g., "fitness-gym" for fitness-gym.liyaqa.com).
     */
    val slug: String?,
    val status: ClubStatus,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(club: Club) = ClientClubResponse(
            id = club.id,
            organizationId = club.organizationId,
            name = LocalizedTextResponse.from(club.name),
            description = club.description?.let { LocalizedTextResponse.from(it) },
            slug = club.slug,
            status = club.status,
            createdAt = club.createdAt,
            updatedAt = club.updatedAt
        )
    }
}

data class OnboardingResultResponse(
    val organization: ClientResponse,
    val club: ClientClubResponse,
    val adminUserId: UUID,
    val adminEmail: String,
    val subscriptionId: UUID?,
    /**
     * Full subdomain URL for the club (e.g., "https://fitness-gym.liyaqa.com").
     * Null if club has no slug.
     */
    val subdomainUrl: String?
) {
    companion object {
        private const val DEFAULT_BASE_DOMAIN = "liyaqa.com"

        fun from(result: OnboardingResult, baseDomain: String = DEFAULT_BASE_DOMAIN) = OnboardingResultResponse(
            organization = ClientResponse.from(result.organization),
            club = ClientClubResponse.from(result.club),
            adminUserId = result.adminUser.id,
            adminEmail = result.adminUser.email,
            subscriptionId = result.subscription?.id,
            subdomainUrl = result.club.slug?.let { "https://$it.$baseDomain" }
        )
    }
}

data class AdminUserResponse(
    val id: UUID,
    val email: String,
    val displayName: LocalizedTextResponse,
    val createdAt: Instant
)

data class ClientStatsResponse(
    val total: Long,
    val pending: Long,
    val active: Long,
    val suspended: Long,
    val closed: Long
) {
    companion object {
        fun from(stats: ClientStats) = ClientStatsResponse(
            total = stats.total,
            pending = stats.pending,
            active = stats.active,
            suspended = stats.suspended,
            closed = stats.closed
        )
    }
}

/**
 * Health indicators for a client organization.
 */
data class ClientHealthResponse(
    /** Last activity timestamp from audit logs */
    val lastActiveAt: Instant?,
    /** Last login timestamp */
    val lastLoginAt: Instant?,
    /** Number of open support tickets */
    val openTicketsCount: Int,
    /** Number of active subscriptions */
    val activeSubscriptionsCount: Int,
    /** Total number of clubs */
    val totalClubs: Int,
    /** Total number of notes */
    val totalNotes: Int,
    /** Calculated health score (0-100) */
    val healthScore: Int,
    /** List of health alerts/issues */
    val alerts: List<HealthAlert>
)

/**
 * A health alert/issue for a client.
 */
data class HealthAlert(
    val type: HealthAlertType,
    val message: String,
    val severity: HealthAlertSeverity
)

enum class HealthAlertType {
    NO_RECENT_ACTIVITY,
    OPEN_TICKETS,
    NO_ACTIVE_SUBSCRIPTION,
    SUBSCRIPTION_EXPIRING_SOON,
    OVERDUE_INVOICE
}

enum class HealthAlertSeverity {
    INFO,
    WARNING,
    CRITICAL
}
