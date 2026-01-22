package com.liyaqa.platform.api.dto

import com.fasterxml.jackson.annotation.JsonProperty
import com.liyaqa.organization.domain.model.OrganizationType
import com.liyaqa.platform.application.commands.ConvertDealCommand
import com.liyaqa.platform.application.commands.CreateDealCommand
import com.liyaqa.platform.application.commands.LoseDealCommand
import com.liyaqa.platform.application.commands.ReassignDealCommand
import com.liyaqa.platform.application.commands.UpdateDealCommand
import com.liyaqa.platform.application.services.DealConversionResult
import com.liyaqa.platform.application.services.DealStats
import com.liyaqa.platform.application.services.SalesRepDealStats
import com.liyaqa.platform.domain.model.BillingCycle
import com.liyaqa.platform.domain.model.Deal
import com.liyaqa.platform.domain.model.DealSource
import com.liyaqa.platform.domain.model.DealStatus
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.PositiveOrZero
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

// ============================================
// Request DTOs
// ============================================

data class CreateDealRequest(
    @field:NotBlank(message = "Title (English) is required")
    val titleEn: String,
    val titleAr: String? = null,

    val source: DealSource = DealSource.WEBSITE,

    @field:NotBlank(message = "Contact name is required")
    val contactName: String,

    @field:NotBlank(message = "Contact email is required")
    @field:Email(message = "Invalid email format")
    val contactEmail: String,

    val contactPhone: String? = null,

    val companyName: String? = null,

    @field:PositiveOrZero(message = "Estimated value must be zero or positive")
    val estimatedValueAmount: BigDecimal = BigDecimal.ZERO,

    val estimatedValueCurrency: String = "SAR",

    @field:Min(value = 0, message = "Probability must be between 0 and 100")
    @field:Max(value = 100, message = "Probability must be between 0 and 100")
    val probability: Int = 10,

    val expectedCloseDate: LocalDate? = null,

    val interestedPlanId: UUID? = null,

    @field:NotNull(message = "Sales rep ID is required")
    val salesRepId: UUID,

    val notesEn: String? = null,
    val notesAr: String? = null
) {
    fun toCommand() = CreateDealCommand(
        title = LocalizedText(en = titleEn, ar = titleAr),
        source = source,
        contactName = contactName,
        contactEmail = contactEmail,
        contactPhone = contactPhone,
        companyName = companyName,
        estimatedValue = Money(estimatedValueAmount, estimatedValueCurrency),
        probability = probability,
        expectedCloseDate = expectedCloseDate,
        interestedPlanId = interestedPlanId,
        salesRepId = salesRepId,
        notes = if (notesEn != null) LocalizedText(en = notesEn, ar = notesAr) else null
    )
}

data class UpdateDealRequest(
    val titleEn: String? = null,
    val titleAr: String? = null,

    val source: DealSource? = null,

    val contactName: String? = null,

    @field:Email(message = "Invalid email format")
    val contactEmail: String? = null,

    val contactPhone: String? = null,

    val companyName: String? = null,

    @field:PositiveOrZero(message = "Estimated value must be zero or positive")
    val estimatedValueAmount: BigDecimal? = null,

    val estimatedValueCurrency: String? = null,

    @field:Min(value = 0, message = "Probability must be between 0 and 100")
    @field:Max(value = 100, message = "Probability must be between 0 and 100")
    val probability: Int? = null,

    val expectedCloseDate: LocalDate? = null,

    val interestedPlanId: UUID? = null,

    val notesEn: String? = null,
    val notesAr: String? = null
) {
    fun toCommand(): UpdateDealCommand {
        val title = if (titleEn != null) LocalizedText(en = titleEn, ar = titleAr) else null
        val estimatedValue = if (estimatedValueAmount != null) {
            Money(estimatedValueAmount, estimatedValueCurrency ?: "SAR")
        } else null
        val notes = if (notesEn != null) LocalizedText(en = notesEn, ar = notesAr) else null

        return UpdateDealCommand(
            title = title,
            source = source,
            contactName = contactName,
            contactEmail = contactEmail,
            contactPhone = contactPhone,
            companyName = companyName,
            estimatedValue = estimatedValue,
            probability = probability,
            expectedCloseDate = expectedCloseDate,
            interestedPlanId = interestedPlanId,
            notes = notes
        )
    }
}

data class ConvertDealRequest(
    // Organization details
    @field:NotBlank(message = "Organization name (English) is required")
    val organizationNameEn: String,
    val organizationNameAr: String? = null,

    val organizationTradeNameEn: String? = null,
    val organizationTradeNameAr: String? = null,

    val organizationType: OrganizationType = OrganizationType.LLC,

    @field:Email(message = "Invalid organization email format")
    val organizationEmail: String? = null,

    val organizationPhone: String? = null,
    val organizationWebsite: String? = null,
    val vatRegistrationNumber: String? = null,
    val commercialRegistrationNumber: String? = null,

    // First club details
    @field:NotBlank(message = "Club name (English) is required")
    val clubNameEn: String,
    val clubNameAr: String? = null,

    val clubDescriptionEn: String? = null,
    val clubDescriptionAr: String? = null,

    // Admin user details
    @field:NotBlank(message = "Admin email is required")
    @field:Email(message = "Invalid admin email format")
    val adminEmail: String,

    @field:NotBlank(message = "Admin password is required")
    val adminPassword: String,

    @field:NotBlank(message = "Admin display name (English) is required")
    val adminDisplayNameEn: String,
    val adminDisplayNameAr: String? = null,

    // Subscription details (optional)
    val clientPlanId: UUID? = null,

    @field:Positive(message = "Agreed price must be positive")
    val agreedPriceAmount: BigDecimal? = null,
    val agreedPriceCurrency: String? = "SAR",

    val billingCycle: BillingCycle? = BillingCycle.MONTHLY,

    @field:Positive(message = "Contract months must be positive")
    val contractMonths: Int? = null,

    val startWithTrial: Boolean? = null,

    @field:Positive(message = "Trial days must be positive")
    val trialDays: Int? = null,

    @field:PositiveOrZero(message = "Discount percentage must be zero or positive")
    @field:Max(value = 100, message = "Discount percentage cannot exceed 100")
    val discountPercentage: BigDecimal? = null
) {
    fun toCommand() = ConvertDealCommand(
        organizationName = LocalizedText(en = organizationNameEn, ar = organizationNameAr),
        organizationTradeName = if (organizationTradeNameEn != null) {
            LocalizedText(en = organizationTradeNameEn, ar = organizationTradeNameAr)
        } else null,
        organizationType = organizationType,
        organizationEmail = organizationEmail,
        organizationPhone = organizationPhone,
        organizationWebsite = organizationWebsite,
        vatRegistrationNumber = vatRegistrationNumber,
        commercialRegistrationNumber = commercialRegistrationNumber,
        clubName = LocalizedText(en = clubNameEn, ar = clubNameAr),
        clubDescription = if (clubDescriptionEn != null) {
            LocalizedText(en = clubDescriptionEn, ar = clubDescriptionAr)
        } else null,
        adminEmail = adminEmail,
        adminPassword = adminPassword,
        adminDisplayName = LocalizedText(en = adminDisplayNameEn, ar = adminDisplayNameAr),
        clientPlanId = clientPlanId,
        agreedPrice = if (agreedPriceAmount != null) Money(agreedPriceAmount, agreedPriceCurrency ?: "SAR") else null,
        billingCycle = billingCycle ?: BillingCycle.MONTHLY,
        contractMonths = contractMonths ?: 12,
        startWithTrial = startWithTrial ?: true,
        trialDays = trialDays ?: 14,
        discountPercentage = discountPercentage
    )
}

data class LoseDealRequest(
    @field:NotBlank(message = "Lost reason (English) is required")
    val reasonEn: String,
    val reasonAr: String? = null
) {
    fun toCommand() = LoseDealCommand(
        reason = LocalizedText(en = reasonEn, ar = reasonAr)
    )
}

data class ReassignDealRequest(
    @field:NotNull(message = "New sales rep ID is required")
    val newSalesRepId: UUID
) {
    fun toCommand() = ReassignDealCommand(newSalesRepId = newSalesRepId)
}

// ============================================
// Response DTOs
// ============================================

data class DealResponse(
    val id: UUID,
    val title: LocalizedTextResponse,
    val status: DealStatus,
    val source: DealSource,
    val contactName: String,
    val contactEmail: String,
    val contactPhone: String?,
    val companyName: String?,
    val estimatedValue: MoneyResponse,
    val probability: Int,
    val expectedCloseDate: LocalDate?,
    val actualCloseDate: LocalDate?,
    val interestedPlanId: UUID?,
    val salesRepId: UUID,
    val convertedOrganizationId: UUID?,
    val convertedSubscriptionId: UUID?,
    val notes: LocalizedTextResponse?,
    val lostReason: LocalizedTextResponse?,

    // Calculated fields
    @get:JsonProperty("isOpen")
    val isOpen: Boolean,
    @get:JsonProperty("isWon")
    val isWon: Boolean,
    @get:JsonProperty("isLost")
    val isLost: Boolean,
    val canAdvance: Boolean,
    val nextStage: DealStatus?,
    val weightedValue: MoneyResponse,
    val daysToClose: Long?,
    @get:JsonProperty("isOverdue")
    val isOverdue: Boolean,

    // Timestamps
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(deal: Deal) = DealResponse(
            id = deal.id,
            title = LocalizedTextResponse.from(deal.title),
            status = deal.status,
            source = deal.source,
            contactName = deal.contactName,
            contactEmail = deal.contactEmail,
            contactPhone = deal.contactPhone,
            companyName = deal.companyName,
            estimatedValue = MoneyResponse.from(deal.estimatedValue),
            probability = deal.probability,
            expectedCloseDate = deal.expectedCloseDate,
            actualCloseDate = deal.actualCloseDate,
            interestedPlanId = deal.interestedPlanId,
            salesRepId = deal.salesRepId,
            convertedOrganizationId = deal.convertedOrganizationId,
            convertedSubscriptionId = deal.convertedSubscriptionId,
            notes = deal.notes?.let { LocalizedTextResponse.from(it) },
            lostReason = deal.lostReason?.let { LocalizedTextResponse.from(it) },
            isOpen = deal.isOpen(),
            isWon = deal.isWon(),
            isLost = deal.isLost(),
            canAdvance = deal.canAdvance(),
            nextStage = deal.getNextStage(),
            weightedValue = MoneyResponse.from(deal.getWeightedValue()),
            daysToClose = deal.getDaysToClose(),
            isOverdue = deal.isOverdue(),
            createdAt = deal.createdAt,
            updatedAt = deal.updatedAt
        )
    }
}

/**
 * Simplified deal response for listings.
 */
data class DealSummaryResponse(
    val id: UUID,
    val title: LocalizedTextResponse,
    val status: DealStatus,
    val source: DealSource,
    val companyName: String?,
    val estimatedValue: MoneyResponse,
    val probability: Int,
    val expectedCloseDate: LocalDate?,
    val salesRepId: UUID,
    @get:JsonProperty("isOverdue")
    val isOverdue: Boolean
) {
    companion object {
        fun from(deal: Deal) = DealSummaryResponse(
            id = deal.id,
            title = LocalizedTextResponse.from(deal.title),
            status = deal.status,
            source = deal.source,
            companyName = deal.companyName,
            estimatedValue = MoneyResponse.from(deal.estimatedValue),
            probability = deal.probability,
            expectedCloseDate = deal.expectedCloseDate,
            salesRepId = deal.salesRepId,
            isOverdue = deal.isOverdue()
        )
    }
}

/**
 * Response for deal pipeline statistics.
 */
data class DealStatsResponse(
    val totalDeals: Long,
    val openDeals: Long,
    val wonDeals: Long,
    val lostDeals: Long,
    val byStatus: Map<DealStatus, Long>,
    val bySource: Map<DealSource, Long>,
    val totalPipelineValue: MoneyResponse,
    val weightedPipelineValue: MoneyResponse,
    val wonValue: MoneyResponse,
    val averageDealSize: MoneyResponse,
    val winRate: Double
) {
    companion object {
        fun from(stats: DealStats) = DealStatsResponse(
            totalDeals = stats.totalDeals,
            openDeals = stats.openDeals,
            wonDeals = stats.wonDeals,
            lostDeals = stats.lostDeals,
            byStatus = stats.byStatus,
            bySource = stats.bySource,
            totalPipelineValue = MoneyResponse.from(stats.totalPipelineValue),
            weightedPipelineValue = MoneyResponse.from(stats.weightedPipelineValue),
            wonValue = MoneyResponse.from(stats.wonValue),
            averageDealSize = MoneyResponse.from(stats.averageDealSize),
            winRate = stats.winRate
        )
    }
}

/**
 * Response for sales rep deal statistics.
 */
data class SalesRepDealStatsResponse(
    val salesRepId: UUID,
    val totalDeals: Long,
    val openDeals: Long,
    val wonDeals: Long,
    val lostDeals: Long,
    val pipelineValue: MoneyResponse,
    val wonValue: MoneyResponse,
    val winRate: Double
) {
    companion object {
        fun from(stats: SalesRepDealStats) = SalesRepDealStatsResponse(
            salesRepId = stats.salesRepId,
            totalDeals = stats.totalDeals,
            openDeals = stats.openDeals,
            wonDeals = stats.wonDeals,
            lostDeals = stats.lostDeals,
            pipelineValue = MoneyResponse.from(stats.pipelineValue),
            wonValue = MoneyResponse.from(stats.wonValue),
            winRate = stats.winRate
        )
    }
}

/**
 * Response for deal conversion result.
 */
data class DealConversionResultResponse(
    val deal: DealResponse,
    val organizationId: UUID,
    val organizationName: LocalizedTextResponse,
    val clubId: UUID,
    val clubName: LocalizedTextResponse,
    val adminUserId: UUID,
    val adminEmail: String,
    val subscriptionId: UUID?,
    val subscriptionStatus: String?
) {
    companion object {
        fun from(result: DealConversionResult) = DealConversionResultResponse(
            deal = DealResponse.from(result.deal),
            organizationId = result.organization.id,
            organizationName = LocalizedTextResponse.from(result.organization.name),
            clubId = result.club.id,
            clubName = LocalizedTextResponse.from(result.club.name),
            adminUserId = result.adminUser.id,
            adminEmail = result.adminUser.email,
            subscriptionId = result.subscription?.id,
            subscriptionStatus = result.subscription?.status?.name
        )
    }
}
