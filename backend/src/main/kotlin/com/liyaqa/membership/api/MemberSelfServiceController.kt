package com.liyaqa.membership.api

import com.liyaqa.membership.application.services.CancellationCommand
import com.liyaqa.membership.application.services.CancellationService
import com.liyaqa.membership.application.services.ContractService
import com.liyaqa.membership.application.services.ExitSurveyCommand
import com.liyaqa.membership.application.services.PlanChangeCommand
import com.liyaqa.membership.application.services.PlanChangeService
import com.liyaqa.membership.domain.model.RetentionOffer
import com.liyaqa.membership.domain.ports.MembershipContractRepository
import com.liyaqa.membership.domain.ports.RetentionOfferRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import org.springframework.http.ResponseEntity
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

/**
 * Self-service API endpoints for members to manage their subscriptions.
 */
@RestController
@RequestMapping("/api/member")
class MemberSelfServiceController(
    private val subscriptionRepository: SubscriptionRepository,
    private val contractRepository: MembershipContractRepository,
    private val contractService: ContractService,
    private val planChangeService: PlanChangeService,
    private val cancellationService: CancellationService,
    private val retentionOfferRepository: RetentionOfferRepository
) {

    /**
     * Get the authenticated member's active subscription.
     */
    @GetMapping("/subscription")
    fun getMySubscription(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<SubscriptionResponse> {
        val memberId = principal.userId
        val subscription = subscriptionRepository.findActiveByMemberId(memberId)
            .orElse(null) ?: return ResponseEntity.notFound().build()

        return ResponseEntity.ok(SubscriptionResponse.from(subscription, null, null))
    }

    /**
     * Get the authenticated member's contract.
     */
    @GetMapping("/contract")
    fun getMyContract(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<ContractResponse> {
        val memberId = principal.userId
        val contract = contractRepository.findActiveByMemberId(memberId)
            .orElse(null) ?: return ResponseEntity.notFound().build()

        return ResponseEntity.ok(ContractResponse.from(contract))
    }

    /**
     * Sign a pending contract.
     */
    @PostMapping("/contract/{contractId}/sign")
    fun signContract(
        @PathVariable contractId: UUID,
        @RequestBody request: SignContractRequest,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<ContractResponse> {
        val memberId = principal.userId

        // Verify contract belongs to member
        val contract = contractRepository.findById(contractId)
            .orElse(null) ?: return ResponseEntity.notFound().build()

        if (contract.memberId != memberId) {
            return ResponseEntity.status(403).build()
        }

        val signedContract = contractService.signContract(contractId, request.signatureData)
        return ResponseEntity.ok(ContractResponse.from(signedContract))
    }

    // ==========================================
    // PLAN CHANGE ENDPOINTS
    // ==========================================

    /**
     * Preview a plan change (upgrade/downgrade).
     */
    @GetMapping("/subscription/change/preview")
    fun previewPlanChange(
        @RequestParam newPlanId: UUID,
        @RequestHeader("Accept-Language", defaultValue = "en") locale: String,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<PlanChangePreviewResponse> {
        val memberId = principal.userId
        val subscription = subscriptionRepository.findActiveByMemberId(memberId)
            .orElse(null) ?: return ResponseEntity.notFound().build()

        val preview = planChangeService.previewPlanChange(subscription.id, newPlanId, locale)

        return ResponseEntity.ok(PlanChangePreviewResponse(
            subscriptionId = preview.subscriptionId,
            currentPlanId = preview.currentPlanId,
            currentPlanName = preview.currentPlanName,
            newPlanId = preview.newPlanId,
            newPlanName = preview.newPlanName,
            changeType = preview.changeType,
            prorationMode = preview.prorationMode,
            effectiveDate = preview.effectiveDate,
            credit = preview.credit.amount,
            charge = preview.charge.amount,
            netAmount = preview.netAmount.amount,
            currency = preview.netAmount.currency,
            daysRemaining = preview.daysRemaining,
            summary = preview.summary
        ))
    }

    /**
     * Upgrade subscription (immediate with proration).
     */
    @PostMapping("/subscription/upgrade")
    fun upgradePlan(
        @RequestBody request: PlanChangeRequest,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<PlanChangeResponse> {
        val memberId = principal.userId
        val subscription = subscriptionRepository.findActiveByMemberId(memberId)
            .orElse(null) ?: return ResponseEntity.notFound().build()

        val result = planChangeService.changePlan(PlanChangeCommand(
            subscriptionId = subscription.id,
            newPlanId = request.newPlanId,
            preferredProrationMode = request.preferredProrationMode,
            initiatedByMember = true,
            notes = request.notes
        ))

        return ResponseEntity.ok(PlanChangeResponse(
            subscriptionId = subscription.id,
            changeType = result.changeType,
            effectiveDate = result.effectiveDate,
            wasImmediate = result.wasImmediate,
            scheduledChangeId = result.scheduledChange?.id,
            historyId = result.history?.id,
            netAmount = result.history?.netAmount?.amount,
            currency = result.history?.netAmount?.currency
        ))
    }

    /**
     * Downgrade subscription (scheduled for end of period).
     */
    @PostMapping("/subscription/downgrade")
    fun downgradePlan(
        @RequestBody request: PlanChangeRequest,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<PlanChangeResponse> {
        // Same as upgrade, but proration mode will be END_OF_PERIOD by default for downgrades
        return upgradePlan(request, principal)
    }

    /**
     * Cancel a scheduled plan change.
     */
    @PostMapping("/subscription/scheduled-change/{changeId}/cancel")
    fun cancelScheduledChange(
        @PathVariable changeId: UUID,
        @RequestParam(required = false) reason: String?,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<ScheduledChangeResponse> {
        @Suppress("UNUSED_VARIABLE")
        val memberId = principal.userId

        val scheduledChange = planChangeService.cancelScheduledChange(changeId, reason)

        return ResponseEntity.ok(ScheduledChangeResponse(
            id = scheduledChange.id,
            subscriptionId = scheduledChange.subscriptionId,
            currentPlanId = scheduledChange.currentPlanId,
            newPlanId = scheduledChange.newPlanId,
            changeType = scheduledChange.changeType,
            scheduledDate = scheduledChange.scheduledDate,
            status = scheduledChange.status.name,
            daysUntilChange = scheduledChange.daysUntilChange()
        ))
    }

    // ==========================================
    // CANCELLATION ENDPOINTS
    // ==========================================

    /**
     * Preview cancellation with fees and retention offers.
     */
    @GetMapping("/subscription/cancel/preview")
    fun previewCancellation(
        @RequestHeader("Accept-Language", defaultValue = "en") locale: String,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<MemberCancellationPreviewResponse> {
        val memberId = principal.userId
        val subscription = subscriptionRepository.findActiveByMemberId(memberId)
            .orElse(null) ?: return ResponseEntity.notFound().build()

        val preview = cancellationService.previewCancellation(subscription.id, locale)

        return ResponseEntity.ok(MemberCancellationPreviewResponse(
            subscriptionId = preview.subscriptionId,
            isWithinCoolingOff = preview.isWithinCoolingOff,
            coolingOffDaysRemaining = preview.coolingOffDaysRemaining,
            isWithinCommitment = preview.isWithinCommitment,
            commitmentMonthsRemaining = preview.commitmentMonthsRemaining,
            noticePeriodDays = preview.noticePeriodDays,
            noticePeriodEndDate = preview.noticePeriodEndDate,
            effectiveDate = preview.effectiveDate,
            earlyTerminationFee = preview.earlyTerminationFee.amount,
            earlyTerminationFeeCurrency = preview.earlyTerminationFee.currency,
            refundAmount = preview.refundAmount?.amount,
            retentionOffers = preview.retentionOffers.map { offer ->
                RetentionOfferResponse(
                    id = offer.offerId,
                    offerType = offer.offerType,
                    titleEn = offer.title.en,
                    titleAr = offer.title.ar,
                    descriptionEn = offer.description?.en,
                    descriptionAr = offer.description?.ar,
                    valueAmount = offer.value?.amount,
                    valueCurrency = offer.value?.currency,
                    discountPercentage = offer.discountPercentage,
                    durationDays = offer.durationDays,
                    durationMonths = offer.durationMonths,
                    alternativePlanId = null,
                    status = com.liyaqa.membership.domain.model.RetentionOfferStatus.PENDING,
                    expiresAt = null,
                    priority = 0
                )
            }
        ))
    }

    /**
     * Request subscription cancellation.
     */
    @PostMapping("/subscription/cancel")
    fun requestCancellation(
        @RequestBody request: CancellationRequest,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<CancellationResponse> {
        @Suppress("UNUSED_VARIABLE")
        val memberId = principal.userId
        val subscription = subscriptionRepository.findActiveByMemberId(memberId)
            .orElse(null) ?: return ResponseEntity.notFound().build()

        val result = cancellationService.requestCancellation(CancellationCommand(
            subscriptionId = subscription.id,
            reasonCategory = request.reasonCategory,
            reasonDetail = request.reasonDetail
        ))

        return ResponseEntity.ok(CancellationResponse(
            cancellationRequestId = result.cancellationRequest.id,
            subscriptionId = subscription.id,
            status = result.cancellationRequest.status.name,
            noticePeriodEndDate = result.cancellationRequest.noticePeriodEndDate,
            effectiveDate = result.cancellationRequest.effectiveDate,
            earlyTerminationFee = result.cancellationRequest.earlyTerminationFee?.amount,
            earlyTerminationFeeCurrency = result.cancellationRequest.earlyTerminationFee?.currency,
            feeWaived = result.cancellationRequest.feeWaived,
            retentionOffers = result.retentionOffers.map { mapRetentionOffer(it) },
            wasImmediate = result.wasImmediate
        ))
    }

    /**
     * Accept a retention offer.
     */
    @PostMapping("/subscription/cancel/accept-offer/{offerId}")
    fun acceptRetentionOffer(
        @PathVariable offerId: UUID,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<AcceptRetentionOfferResponse> {
        val result = cancellationService.acceptRetentionOffer(offerId)

        return ResponseEntity.ok(AcceptRetentionOfferResponse(
            offerId = result.offer.id,
            offerType = result.offer.offerType,
            memberSaved = result.memberSaved,
            message = "Your cancellation has been cancelled and the offer has been applied to your account."
        ))
    }

    /**
     * Withdraw cancellation request.
     */
    @PostMapping("/subscription/cancel/withdraw")
    fun withdrawCancellation(
        @RequestParam(required = false) reason: String?,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<Map<String, Any>> {
        val memberId = principal.userId
        val subscription = subscriptionRepository.findActiveByMemberId(memberId)
            .orElse(null) ?: return ResponseEntity.notFound().build()

        val pendingCancellation = cancellationService.getPendingCancellation(subscription.id)
            ?: return ResponseEntity.badRequest().body(mapOf("error" to "No pending cancellation found"))

        cancellationService.withdrawCancellation(pendingCancellation.id, reason)

        return ResponseEntity.ok(mapOf(
            "success" to true,
            "message" to "Your cancellation request has been withdrawn."
        ))
    }

    /**
     * Submit exit survey.
     */
    @PostMapping("/subscription/exit-survey")
    fun submitExitSurvey(
        @RequestBody request: ExitSurveyRequest,
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<ExitSurveyResponse> {
        @Suppress("UNUSED_VARIABLE")
        val memberId = principal.userId
        val subscription = subscriptionRepository.findActiveByMemberId(memberId)
            .orElse(null) ?: return ResponseEntity.notFound().build()

        val survey = cancellationService.submitExitSurvey(ExitSurveyCommand(
            subscriptionId = subscription.id,
            reasonCategory = request.reasonCategory,
            reasonDetail = request.reasonDetail,
            feedback = request.feedback,
            npsScore = request.npsScore,
            wouldRecommend = request.wouldRecommend,
            overallSatisfaction = request.overallSatisfaction,
            dissatisfactionAreas = request.dissatisfactionAreas,
            whatWouldBringBack = request.whatWouldBringBack,
            openToFutureOffers = request.openToFutureOffers,
            competitorName = request.competitorName,
            competitorReason = request.competitorReason
        ))

        return ResponseEntity.ok(ExitSurveyResponse(
            id = survey.id,
            memberId = survey.memberId,
            subscriptionId = survey.subscriptionId,
            reasonCategory = survey.reasonCategory,
            reasonDetail = survey.reasonDetail,
            feedback = survey.feedback,
            npsScore = survey.npsScore,
            wouldRecommend = survey.wouldRecommend,
            overallSatisfaction = survey.overallSatisfaction,
            dissatisfactionAreas = survey.dissatisfactionAreas,
            openToFutureOffers = survey.openToFutureOffers,
            createdAt = survey.createdAt
        ))
    }

    // ==========================================
    // FREEZE ENDPOINTS (already exist, adding for completeness)
    // ==========================================

    /**
     * Get freeze days balance.
     */
    @GetMapping("/subscription/freeze-balance")
    fun getFreezeBalance(
        @AuthenticationPrincipal principal: JwtUserPrincipal
    ): ResponseEntity<Map<String, Any>> {
        val memberId = principal.userId
        val subscription = subscriptionRepository.findActiveByMemberId(memberId)
            .orElse(null) ?: return ResponseEntity.notFound().build()

        return ResponseEntity.ok(mapOf(
            "freezeDaysRemaining" to subscription.freezeDaysRemaining,
            "totalFreezeDaysUsed" to subscription.totalFreezeDaysUsed
        ))
    }

    // ==========================================
    // PRIVATE HELPERS
    // ==========================================

    private fun mapRetentionOffer(offer: RetentionOffer) = RetentionOfferResponse(
        id = offer.id,
        offerType = offer.offerType,
        titleEn = offer.title.en,
        titleAr = offer.title.ar,
        descriptionEn = offer.description?.en,
        descriptionAr = offer.description?.ar,
        valueAmount = offer.value?.amount,
        valueCurrency = offer.value?.currency,
        discountPercentage = offer.discountPercentage,
        durationDays = offer.durationDays,
        durationMonths = offer.durationMonths,
        alternativePlanId = offer.alternativePlanId,
        status = offer.status,
        expiresAt = offer.expiresAt,
        priority = offer.priority
    )
}
