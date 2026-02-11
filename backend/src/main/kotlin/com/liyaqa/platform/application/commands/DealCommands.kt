package com.liyaqa.platform.application.commands

import com.liyaqa.organization.domain.model.OrganizationType
import com.liyaqa.platform.domain.model.BillingCycle
import com.liyaqa.platform.domain.model.DealActivityType
import com.liyaqa.platform.domain.model.DealSource
import com.liyaqa.platform.domain.model.DealStage
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

data class CreateDealCommand(
    val facilityName: String?,
    val contactName: String,
    val contactEmail: String,
    val contactPhone: String? = null,
    val source: DealSource = DealSource.WEBSITE,
    val notes: String? = null,
    val assignedToId: UUID?,
    val estimatedValue: BigDecimal? = null,
    val currency: String = "SAR",
    val expectedCloseDate: LocalDate? = null
)

data class UpdateDealCommand(
    val facilityName: String? = null,
    val contactName: String? = null,
    val contactEmail: String? = null,
    val contactPhone: String? = null,
    val notes: String? = null,
    val estimatedValue: BigDecimal? = null,
    val expectedCloseDate: LocalDate? = null
)

data class ChangeStageCommand(
    val newStage: DealStage,
    val reason: String? = null
)

data class CreateDealActivityCommand(
    val type: DealActivityType,
    val content: String
)

data class ConvertDealCommand(
    // Organization
    val organizationNameEn: String,
    val organizationNameAr: String? = null,
    val organizationTradeNameEn: String? = null,
    val organizationTradeNameAr: String? = null,
    val organizationType: OrganizationType? = null,
    val organizationEmail: String? = null,
    val organizationPhone: String? = null,
    val organizationWebsite: String? = null,
    val vatRegistrationNumber: String? = null,
    val commercialRegistrationNumber: String? = null,

    // Club
    val clubNameEn: String,
    val clubNameAr: String? = null,
    val clubDescriptionEn: String? = null,
    val clubDescriptionAr: String? = null,

    // Admin user
    val adminEmail: String,
    val adminPassword: String,
    val adminDisplayNameEn: String,
    val adminDisplayNameAr: String? = null,

    // Subscription (optional)
    val clientPlanId: UUID? = null,
    val agreedPriceAmount: BigDecimal? = null,
    val agreedPriceCurrency: String? = null,
    val billingCycle: BillingCycle? = null,
    val contractMonths: Int? = null,
    val startWithTrial: Boolean? = null,
    val trialDays: Int? = null,
    val discountPercentage: BigDecimal? = null
)
