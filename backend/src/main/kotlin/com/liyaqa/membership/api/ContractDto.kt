package com.liyaqa.membership.api

import com.liyaqa.membership.domain.model.CancellationReasonCategory
import com.liyaqa.membership.domain.model.CancellationType
import com.liyaqa.membership.domain.model.ContractPricingTier
import com.liyaqa.membership.domain.model.ContractStatus
import com.liyaqa.membership.domain.model.ContractTerm
import com.liyaqa.membership.domain.model.ContractType
import com.liyaqa.membership.domain.model.MembershipContract
import com.liyaqa.membership.domain.model.PlanChangeType
import com.liyaqa.membership.domain.model.ProrationMode
import com.liyaqa.membership.domain.model.RetentionOfferStatus
import com.liyaqa.membership.domain.model.RetentionOfferType
import com.liyaqa.membership.domain.model.TerminationFeeType
import com.liyaqa.shared.domain.LocalizedTextInput
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

// ==========================================
// CONTRACT DTOs
// ==========================================

data class CreateContractRequest(
    @field:NotNull val memberId: UUID,
    @field:NotNull val planId: UUID,
    @field:NotNull val contractType: ContractType,
    @field:NotNull val contractTerm: ContractTerm,
    val startDate: LocalDate? = null,
    val noticePeriodDays: Int = 30,
    val earlyTerminationFeeType: TerminationFeeType = TerminationFeeType.REMAINING_MONTHS,
    val earlyTerminationFeeValue: BigDecimal? = null,
    val categoryId: UUID? = null
)

data class SignContractRequest(
    @field:NotNull val signatureData: String
)

data class ContractResponse(
    val id: UUID,
    val contractNumber: String,
    val memberId: UUID,
    val planId: UUID,
    val subscriptionId: UUID?,
    val categoryId: UUID?,
    val contractType: ContractType,
    val contractTerm: ContractTerm,
    val commitmentMonths: Int,
    val noticePeriodDays: Int,
    val startDate: LocalDate,
    val commitmentEndDate: LocalDate?,
    val effectiveEndDate: LocalDate?,
    val lockedMonthlyFee: BigDecimal,
    val lockedCurrency: String,
    val earlyTerminationFeeType: TerminationFeeType,
    val coolingOffDays: Int,
    val coolingOffEndDate: LocalDate,
    val isWithinCoolingOff: Boolean,
    val status: ContractStatus,
    val memberSignedAt: Instant?,
    val staffApprovedBy: UUID?,
    val cancellationRequestedAt: LocalDate?,
    val cancellationEffectiveDate: LocalDate?,
    val cancellationType: CancellationType?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(contract: MembershipContract) = ContractResponse(
            id = contract.id,
            contractNumber = contract.contractNumber,
            memberId = contract.memberId,
            planId = contract.planId,
            subscriptionId = contract.subscriptionId,
            categoryId = contract.categoryId,
            contractType = contract.contractType,
            contractTerm = contract.contractTerm,
            commitmentMonths = contract.commitmentMonths,
            noticePeriodDays = contract.noticePeriodDays,
            startDate = contract.startDate,
            commitmentEndDate = contract.commitmentEndDate,
            effectiveEndDate = contract.effectiveEndDate,
            lockedMonthlyFee = contract.getLockedMonthlyTotal().amount,
            lockedCurrency = contract.lockedMembershipFee.currency,
            earlyTerminationFeeType = contract.earlyTerminationFeeType,
            coolingOffDays = contract.coolingOffDays,
            coolingOffEndDate = contract.coolingOffEndDate,
            isWithinCoolingOff = contract.isWithinCoolingOff(),
            status = contract.status,
            memberSignedAt = contract.memberSignedAt,
            staffApprovedBy = contract.staffApprovedBy,
            cancellationRequestedAt = contract.cancellationRequestedAt,
            cancellationEffectiveDate = contract.cancellationEffectiveDate,
            cancellationType = contract.cancellationType,
            createdAt = contract.createdAt,
            updatedAt = contract.updatedAt
        )
    }
}

data class CancellationPreviewResponse(
    val contractId: UUID,
    val isWithinCoolingOff: Boolean,
    val coolingOffDaysRemaining: Long,
    val isWithinCommitment: Boolean,
    val commitmentMonthsRemaining: Int,
    val noticePeriodDays: Int,
    val effectiveDate: LocalDate,
    val earlyTerminationFee: BigDecimal,
    val earlyTerminationFeeCurrency: String,
    val refundAmount: BigDecimal?,
    val refundCurrency: String?
)

// ==========================================
// PLAN CHANGE DTOs
// ==========================================

data class PlanChangePreviewRequest(
    @field:NotNull val newPlanId: UUID
)

data class PlanChangeRequest(
    @field:NotNull val newPlanId: UUID,
    val preferredProrationMode: ProrationMode? = null,
    val notes: String? = null
)

data class PlanChangePreviewResponse(
    val subscriptionId: UUID,
    val currentPlanId: UUID,
    val currentPlanName: String,
    val newPlanId: UUID,
    val newPlanName: String,
    val changeType: PlanChangeType,
    val prorationMode: ProrationMode,
    val effectiveDate: LocalDate,
    val credit: BigDecimal,
    val charge: BigDecimal,
    val netAmount: BigDecimal,
    val currency: String,
    val daysRemaining: Int,
    val summary: String
)

data class PlanChangeResponse(
    val subscriptionId: UUID,
    val changeType: PlanChangeType,
    val effectiveDate: LocalDate,
    val wasImmediate: Boolean,
    val scheduledChangeId: UUID?,
    val historyId: UUID?,
    val netAmount: BigDecimal?,
    val currency: String?
)

data class ScheduledChangeResponse(
    val id: UUID,
    val subscriptionId: UUID,
    val currentPlanId: UUID,
    val newPlanId: UUID,
    val changeType: PlanChangeType,
    val scheduledDate: LocalDate,
    val status: String,
    val daysUntilChange: Long
)

// ==========================================
// CANCELLATION DTOs
// ==========================================

data class CancellationRequest(
    @field:NotNull val reasonCategory: CancellationReasonCategory,
    val reasonDetail: String? = null
)

data class MemberCancellationPreviewResponse(
    val subscriptionId: UUID,
    val isWithinCoolingOff: Boolean,
    val coolingOffDaysRemaining: Long,
    val isWithinCommitment: Boolean,
    val commitmentMonthsRemaining: Int,
    val noticePeriodDays: Int,
    val noticePeriodEndDate: LocalDate,
    val effectiveDate: LocalDate,
    val earlyTerminationFee: BigDecimal,
    val earlyTerminationFeeCurrency: String,
    val refundAmount: BigDecimal?,
    val retentionOffers: List<RetentionOfferResponse>
)

data class RetentionOfferResponse(
    val id: UUID,
    val offerType: RetentionOfferType,
    val titleEn: String,
    val titleAr: String?,
    val descriptionEn: String?,
    val descriptionAr: String?,
    val valueAmount: BigDecimal?,
    val valueCurrency: String?,
    val discountPercentage: BigDecimal?,
    val durationDays: Int?,
    val durationMonths: Int?,
    val alternativePlanId: UUID?,
    val status: RetentionOfferStatus,
    val expiresAt: Instant?,
    val priority: Int
)

data class CancellationResponse(
    val cancellationRequestId: UUID,
    val subscriptionId: UUID,
    val status: String,
    val noticePeriodEndDate: LocalDate,
    val effectiveDate: LocalDate,
    val earlyTerminationFee: BigDecimal?,
    val earlyTerminationFeeCurrency: String?,
    val feeWaived: Boolean,
    val retentionOffers: List<RetentionOfferResponse>,
    val wasImmediate: Boolean
)

data class AcceptRetentionOfferResponse(
    val offerId: UUID,
    val offerType: RetentionOfferType,
    val memberSaved: Boolean,
    val message: String
)

// ==========================================
// EXIT SURVEY DTOs
// ==========================================

data class ExitSurveyRequest(
    @field:NotNull val reasonCategory: CancellationReasonCategory,
    val reasonDetail: String? = null,
    val feedback: String? = null,
    val npsScore: Int? = null,
    val wouldRecommend: Boolean? = null,
    val overallSatisfaction: Int? = null,
    val dissatisfactionAreas: List<String>? = null,
    val whatWouldBringBack: String? = null,
    val openToFutureOffers: Boolean = true,
    val competitorName: String? = null,
    val competitorReason: String? = null
)

data class ExitSurveyResponse(
    val id: UUID,
    val memberId: UUID,
    val subscriptionId: UUID,
    val reasonCategory: CancellationReasonCategory,
    val reasonDetail: String?,
    val feedback: String?,
    val npsScore: Int?,
    val wouldRecommend: Boolean?,
    val overallSatisfaction: Int?,
    val dissatisfactionAreas: List<String>?,
    val openToFutureOffers: Boolean,
    val createdAt: Instant
)

data class ExitSurveyAnalyticsResponse(
    val totalResponses: Long,
    val periodStart: String,
    val periodEnd: String,
    val reasonBreakdown: List<ReasonBreakdownDto>,
    val npsDistribution: NpsDistributionDto,
    val averageNps: Double,
    val satisfactionDistribution: SatisfactionDistributionDto,
    val averageSatisfaction: Double,
    val wouldRecommendPercentage: Double,
    val openToFutureOffersPercentage: Double,
    val topDissatisfactionAreas: List<DissatisfactionAreaDto>,
    val competitorAnalysis: List<CompetitorAnalysisDto>,
    val trendsOverTime: List<Any> = emptyList()
)

data class ReasonBreakdownDto(
    val category: String,
    val count: Long,
    val percentage: Double
)

data class NpsDistributionDto(
    val promoters: Long,
    val passives: Long,
    val detractors: Long
)

data class SatisfactionDistributionDto(
    val veryDissatisfied: Long,
    val dissatisfied: Long,
    val neutral: Long,
    val satisfied: Long,
    val verySatisfied: Long
)

data class DissatisfactionAreaDto(
    val area: String,
    val count: Long,
    val percentage: Double
)

data class CompetitorAnalysisDto(
    val competitorName: String,
    val count: Long,
    val topReasons: List<String>
)

data class RetentionMetricsResponse(
    val totalCancellationRequests: Long,
    val savedMembers: Long,
    val retentionRate: Double,
    val averageTimeToSave: Double,
    val offerAcceptanceRate: Double,
    val topAcceptedOfferTypes: List<AcceptedOfferTypeDto>
)

data class AcceptedOfferTypeDto(
    val offerType: String,
    val count: Long
)

// ==========================================
// CATEGORY DTOs
// ==========================================

data class CreateCategoryRequest(
    @field:NotNull val name: LocalizedTextInput,
    val description: LocalizedTextInput? = null,
    @field:NotNull val categoryType: String,
    val minimumAge: Int? = null,
    val maximumAge: Int? = null,
    val requiresVerification: Boolean = false,
    val verificationDocumentType: String? = null,
    val maxFamilyMembers: Int? = null,
    val defaultDiscountPercentage: BigDecimal = BigDecimal.ZERO
)

data class CategoryResponse(
    val id: UUID,
    val nameEn: String,
    val nameAr: String?,
    val descriptionEn: String?,
    val descriptionAr: String?,
    val categoryType: String,
    val minimumAge: Int?,
    val maximumAge: Int?,
    val requiresVerification: Boolean,
    val verificationDocumentType: String?,
    val maxFamilyMembers: Int?,
    val defaultDiscountPercentage: BigDecimal,
    val isActive: Boolean
)

data class UpdateCategoryRequest(
    val name: LocalizedTextInput? = null,
    val description: LocalizedTextInput? = null,
    val categoryType: String? = null,
    val minimumAge: Int? = null,
    val maximumAge: Int? = null,
    val requiresVerification: Boolean? = null,
    val verificationDocumentType: String? = null,
    val maxFamilyMembers: Int? = null,
    val defaultDiscountPercentage: BigDecimal? = null
)

data class CategoryUsageStatsResponse(
    val categoryId: UUID,
    val totalMembers: Int,
    val activeMembers: Int,
    val plansUsingCategory: Int
)

// ==========================================
// PRICING TIER DTOs
// ==========================================

data class CreatePricingTierRequest(
    @field:NotNull val planId: UUID,
    @field:NotNull val contractTerm: ContractTerm,
    val discountPercentage: BigDecimal? = null,
    val overrideMonthlyFeeAmount: BigDecimal? = null
)

data class PricingTierResponse(
    val id: UUID,
    val planId: UUID,
    val planName: String,
    val contractTerm: ContractTerm,
    val discountPercentage: BigDecimal?,
    val overrideMonthlyFeeAmount: BigDecimal?,
    val overrideMonthlyFeeCurrency: String?,
    val isActive: Boolean,
    val createdAt: Instant?
) {
    companion object {
        fun from(tier: ContractPricingTier, planName: String) = PricingTierResponse(
            id = tier.id,
            planId = tier.planId,
            planName = planName,
            contractTerm = tier.contractTerm,
            discountPercentage = tier.discountPercentage,
            overrideMonthlyFeeAmount = tier.overrideMonthlyFee?.amount,
            overrideMonthlyFeeCurrency = tier.overrideMonthlyFee?.currency,
            isActive = tier.isActive,
            createdAt = tier.createdAt
        )
    }
}
