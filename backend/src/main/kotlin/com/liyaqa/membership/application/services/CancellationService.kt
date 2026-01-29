package com.liyaqa.membership.application.services

import com.liyaqa.membership.domain.model.CancellationReasonCategory
import com.liyaqa.membership.domain.model.CancellationRequest
import com.liyaqa.membership.domain.model.CancellationRequestStatus
import com.liyaqa.membership.domain.model.ExitSurvey
import com.liyaqa.membership.domain.model.RetentionOffer
import com.liyaqa.membership.domain.model.RetentionOfferType
import com.liyaqa.membership.domain.model.Subscription
import com.liyaqa.membership.domain.ports.CancellationRequestRepository
import com.liyaqa.membership.domain.ports.ExitSurveyRepository
import com.liyaqa.membership.domain.ports.MembershipContractRepository
import com.liyaqa.membership.domain.ports.MembershipPlanRepository
import com.liyaqa.membership.domain.ports.RetentionOfferRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.util.UUID

/**
 * Command to request cancellation.
 */
data class CancellationCommand(
    val subscriptionId: UUID,
    val reasonCategory: CancellationReasonCategory,
    val reasonDetail: String? = null
)

/**
 * Preview of cancellation with fees and retention offers.
 */
data class CancellationPreviewResult(
    val subscriptionId: UUID,
    val isWithinCoolingOff: Boolean,
    val coolingOffDaysRemaining: Long,
    val isWithinCommitment: Boolean,
    val commitmentMonthsRemaining: Int,
    val noticePeriodDays: Int,
    val noticePeriodEndDate: LocalDate,
    val effectiveDate: LocalDate,
    val earlyTerminationFee: Money,
    val refundAmount: Money?,
    val retentionOffers: List<RetentionOfferPreview>
)

/**
 * Preview of a retention offer.
 */
data class RetentionOfferPreview(
    val offerId: UUID,
    val offerType: RetentionOfferType,
    val title: LocalizedText,
    val description: LocalizedText?,
    val value: Money?,
    val discountPercentage: BigDecimal?,
    val durationDays: Int?,
    val durationMonths: Int?,
    val alternativePlanName: LocalizedText?
)

/**
 * Result of cancellation request.
 */
data class CancellationResult(
    val cancellationRequest: CancellationRequest,
    val subscription: Subscription,
    val retentionOffers: List<RetentionOffer>,
    val wasImmediate: Boolean
)

/**
 * Result of accepting a retention offer.
 */
data class RetentionOfferAcceptanceResult(
    val offer: RetentionOffer,
    val cancellationRequest: CancellationRequest,
    val subscription: Subscription,
    val memberSaved: Boolean
)

/**
 * Exit survey submission command.
 */
data class ExitSurveyCommand(
    val subscriptionId: UUID,
    val reasonCategory: CancellationReasonCategory,
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

@Service
class CancellationService(
    private val subscriptionRepository: SubscriptionRepository,
    private val contractRepository: MembershipContractRepository,
    private val planRepository: MembershipPlanRepository,
    private val cancellationRequestRepository: CancellationRequestRepository,
    private val retentionOfferRepository: RetentionOfferRepository,
    private val exitSurveyRepository: ExitSurveyRepository
) {

    companion object {
        private const val DEFAULT_NOTICE_PERIOD_DAYS = 30
        private const val RETENTION_OFFER_EXPIRY_HOURS = 72L
        private const val FREE_FREEZE_DAYS = 30
        private const val LOYALTY_DISCOUNT_PERCENTAGE = 25.0
        private const val LOYALTY_DISCOUNT_MONTHS = 3
    }

    /**
     * Preview cancellation with fees and retention offers.
     */
    fun previewCancellation(subscriptionId: UUID, locale: String = "en"): CancellationPreviewResult {
        val subscription = subscriptionRepository.findById(subscriptionId)
            .orElseThrow { IllegalArgumentException("Subscription not found: $subscriptionId") }

        // Check for active contract
        val contract = subscription.contractId?.let { contractId ->
            contractRepository.findById(contractId).orElse(null)
        }

        // Determine cooling-off status
        val isWithinCoolingOff = contract?.isWithinCoolingOff() ?: false
        val coolingOffDaysRemaining = contract?.coolingOffDaysRemaining() ?: 0

        // Determine commitment status
        val isWithinCommitment = contract?.isWithinCommitment() ?: false
        val commitmentMonthsRemaining = contract?.commitmentMonthsRemaining() ?: 0

        // Calculate notice period
        val noticePeriodDays = contract?.noticePeriodDays ?: DEFAULT_NOTICE_PERIOD_DAYS
        val noticePeriodEndDate = LocalDate.now().plusDays(noticePeriodDays.toLong())
        val effectiveDate = if (isWithinCoolingOff) LocalDate.now() else noticePeriodEndDate.plusDays(1)

        // Calculate early termination fee
        val earlyTerminationFee = if (isWithinCoolingOff) {
            Money.ZERO
        } else {
            contract?.let { Money.of(it.calculateEarlyTerminationFee(), "SAR") } ?: Money.ZERO
        }

        // Calculate refund for cooling-off
        val refundAmount = if (isWithinCoolingOff && contract != null) {
            contract.lockedJoinFee.getGrossAmount() + contract.lockedMembershipFee.getGrossAmount()
        } else null

        // Generate retention offers
        val retentionOffers = generateRetentionOfferPreviews(subscription, locale)

        return CancellationPreviewResult(
            subscriptionId = subscriptionId,
            isWithinCoolingOff = isWithinCoolingOff,
            coolingOffDaysRemaining = coolingOffDaysRemaining,
            isWithinCommitment = isWithinCommitment,
            commitmentMonthsRemaining = commitmentMonthsRemaining,
            noticePeriodDays = noticePeriodDays,
            noticePeriodEndDate = noticePeriodEndDate,
            effectiveDate = effectiveDate,
            earlyTerminationFee = earlyTerminationFee,
            refundAmount = refundAmount,
            retentionOffers = retentionOffers
        )
    }

    /**
     * Initiate cancellation request.
     */
    @Transactional
    fun requestCancellation(command: CancellationCommand): CancellationResult {
        val subscription = subscriptionRepository.findById(command.subscriptionId)
            .orElseThrow { IllegalArgumentException("Subscription not found: ${command.subscriptionId}") }

        require(subscription.status.canCancel()) {
            "Cannot cancel subscription in status: ${subscription.status}"
        }

        // Check for existing pending cancellation
        cancellationRequestRepository.findPendingBySubscriptionId(subscription.id).ifPresent {
            throw IllegalStateException("Subscription already has a pending cancellation request")
        }

        // Get contract for fee calculation
        val contract = subscription.contractId?.let { contractId ->
            contractRepository.findById(contractId).orElse(null)
        }

        val isWithinCoolingOff = contract?.isWithinCoolingOff() ?: false
        val isWithinCommitment = contract?.isWithinCommitment() ?: false
        val noticePeriodDays = contract?.noticePeriodDays ?: DEFAULT_NOTICE_PERIOD_DAYS

        // Calculate early termination fee
        val earlyTerminationFee = if (!isWithinCoolingOff && isWithinCommitment) {
            contract?.let { Money.of(it.calculateEarlyTerminationFee(), "SAR") }
        } else null

        // Create cancellation request
        val cancellationRequest = CancellationRequest.create(
            memberId = subscription.memberId,
            subscriptionId = subscription.id,
            reasonCategory = command.reasonCategory,
            reasonDetail = command.reasonDetail,
            noticePeriodDays = if (isWithinCoolingOff) 0 else noticePeriodDays,
            isWithinCommitment = isWithinCommitment,
            earlyTerminationFee = earlyTerminationFee,
            isWithinCoolingOff = isWithinCoolingOff,
            contractId = contract?.id
        )

        val savedRequest = cancellationRequestRepository.save(cancellationRequest)

        // Generate and save retention offers
        val retentionOffers = if (!isWithinCoolingOff) {
            generateAndSaveRetentionOffers(subscription, savedRequest)
        } else emptyList()

        // Update subscription status
        if (isWithinCoolingOff) {
            // Immediate cancellation for cooling-off
            subscription.cancel()
            savedRequest.complete()
            cancellationRequestRepository.save(savedRequest)
        } else {
            // Start notice period
            subscription.requestCancellation(
                savedRequest.noticePeriodEndDate,
                savedRequest.effectiveDate,
                savedRequest.id
            )
            savedRequest.startNoticePeriod()
            cancellationRequestRepository.save(savedRequest)
        }

        val savedSubscription = subscriptionRepository.save(subscription)

        return CancellationResult(
            cancellationRequest = savedRequest,
            subscription = savedSubscription,
            retentionOffers = retentionOffers,
            wasImmediate = isWithinCoolingOff
        )
    }

    /**
     * Accept a retention offer (saves the member).
     */
    @Transactional
    fun acceptRetentionOffer(offerId: UUID): RetentionOfferAcceptanceResult {
        val offer = retentionOfferRepository.findById(offerId)
            .orElseThrow { IllegalArgumentException("Offer not found: $offerId") }

        require(offer.canBeAccepted()) { "Offer cannot be accepted (expired or already responded)" }

        val subscription = subscriptionRepository.findById(offer.subscriptionId)
            .orElseThrow { IllegalArgumentException("Subscription not found") }

        val cancellationRequest = cancellationRequestRepository.findPendingBySubscriptionId(subscription.id)
            .orElseThrow { IllegalArgumentException("No pending cancellation request found") }

        // Accept the offer
        offer.accept()
        val savedOffer = retentionOfferRepository.save(offer)

        // Mark cancellation as saved
        cancellationRequest.markSaved(offer.id)
        val savedRequest = cancellationRequestRepository.save(cancellationRequest)

        // Withdraw cancellation from subscription
        subscription.withdrawCancellation()
        val savedSubscription = subscriptionRepository.save(subscription)

        // Apply the offer benefit
        applyRetentionOfferBenefit(savedOffer, savedSubscription)

        // Decline other pending offers
        declineOtherOffers(offer.subscriptionId, offerId)

        return RetentionOfferAcceptanceResult(
            offer = savedOffer,
            cancellationRequest = savedRequest,
            subscription = savedSubscription,
            memberSaved = true
        )
    }

    /**
     * Decline a retention offer.
     */
    @Transactional
    fun declineRetentionOffer(offerId: UUID): RetentionOffer {
        val offer = retentionOfferRepository.findById(offerId)
            .orElseThrow { IllegalArgumentException("Offer not found: $offerId") }

        require(offer.isPending()) { "Can only decline pending offers" }

        offer.decline()
        return retentionOfferRepository.save(offer)
    }

    /**
     * Withdraw cancellation request (member changed mind).
     */
    @Transactional
    fun withdrawCancellation(cancellationRequestId: UUID, reason: String? = null): CancellationRequest {
        val request = cancellationRequestRepository.findById(cancellationRequestId)
            .orElseThrow { IllegalArgumentException("Cancellation request not found: $cancellationRequestId") }

        require(request.isPending() || request.isInNoticePeriod()) {
            "Can only withdraw pending or in-notice cancellation requests"
        }

        val subscription = subscriptionRepository.findById(request.subscriptionId)
            .orElseThrow { IllegalArgumentException("Subscription not found") }

        // Withdraw the request
        request.withdraw(reason)
        val savedRequest = cancellationRequestRepository.save(request)

        // Restore subscription status
        subscription.withdrawCancellation()
        subscriptionRepository.save(subscription)

        // Expire all pending offers
        expireOffers(request.subscriptionId)

        return savedRequest
    }

    /**
     * Submit exit survey.
     */
    @Transactional
    fun submitExitSurvey(command: ExitSurveyCommand): ExitSurvey {
        val subscription = subscriptionRepository.findById(command.subscriptionId)
            .orElseThrow { IllegalArgumentException("Subscription not found: ${command.subscriptionId}") }

        // Check if survey already exists
        exitSurveyRepository.findBySubscriptionId(subscription.id).ifPresent {
            throw IllegalStateException("Exit survey already submitted for this subscription")
        }

        val survey = ExitSurvey.create(
            memberId = subscription.memberId,
            subscriptionId = subscription.id,
            reasonCategory = command.reasonCategory,
            reasonDetail = command.reasonDetail,
            feedback = command.feedback,
            npsScore = command.npsScore,
            wouldRecommend = command.wouldRecommend,
            overallSatisfaction = command.overallSatisfaction,
            dissatisfactionAreas = command.dissatisfactionAreas,
            whatWouldBringBack = command.whatWouldBringBack,
            openToFutureOffers = command.openToFutureOffers,
            competitorName = command.competitorName,
            competitorReason = command.competitorReason,
            contractId = subscription.contractId
        )

        val savedSurvey = exitSurveyRepository.save(survey)

        // Link to cancellation request if exists
        cancellationRequestRepository.findPendingBySubscriptionId(subscription.id).ifPresent { request ->
            request.linkExitSurvey(savedSurvey.id)
            cancellationRequestRepository.save(request)
        }

        return savedSurvey
    }

    /**
     * Complete cancellations that have finished their notice period.
     * Should be called by a scheduled job.
     */
    @Transactional
    fun processCompletedCancellations(): List<CancellationRequest> {
        val dueRequests = cancellationRequestRepository.findRequestsDueForCompletion(
            LocalDate.now(),
            PageRequest.of(0, 100)
        )

        return dueRequests.content.mapNotNull { request ->
            try {
                completeCancellation(request.id)
            } catch (e: Exception) {
                null
            }
        }
    }

    /**
     * Complete a specific cancellation.
     */
    @Transactional
    fun completeCancellation(cancellationRequestId: UUID): CancellationRequest {
        val request = cancellationRequestRepository.findById(cancellationRequestId)
            .orElseThrow { IllegalArgumentException("Cancellation request not found") }

        require(request.isInNoticePeriod()) { "Cancellation is not in notice period" }

        val subscription = subscriptionRepository.findById(request.subscriptionId)
            .orElseThrow { IllegalArgumentException("Subscription not found") }

        // Complete the request
        request.complete()
        val savedRequest = cancellationRequestRepository.save(request)

        // Complete subscription cancellation
        subscription.completeCancellation()
        subscription.setReactivationWindow(90) // 90-day win-back window
        subscriptionRepository.save(subscription)

        // Update contract if exists
        subscription.contractId?.let { contractId ->
            contractRepository.findById(contractId).ifPresent { contract ->
                contract.completeCancellation()
                contractRepository.save(contract)
            }
        }

        return savedRequest
    }

    /**
     * Waive early termination fee.
     */
    @Transactional
    fun waiveTerminationFee(cancellationRequestId: UUID, waivedBy: UUID, reason: String): CancellationRequest {
        val request = cancellationRequestRepository.findById(cancellationRequestId)
            .orElseThrow { IllegalArgumentException("Cancellation request not found") }

        request.waiveFee(waivedBy, reason)
        return cancellationRequestRepository.save(request)
    }

    /**
     * Get cancellation request by ID.
     */
    fun getCancellationRequest(id: UUID): CancellationRequest? =
        cancellationRequestRepository.findById(id).orElse(null)

    /**
     * Get pending cancellation for subscription.
     */
    fun getPendingCancellation(subscriptionId: UUID): CancellationRequest? =
        cancellationRequestRepository.findPendingBySubscriptionId(subscriptionId).orElse(null)

    /**
     * Get cancellations by status.
     */
    fun getCancellationsByStatus(status: CancellationRequestStatus, pageable: Pageable): Page<CancellationRequest> =
        cancellationRequestRepository.findByStatus(status, pageable)

    /**
     * Get retention rate.
     */
    fun getRetentionRate(): Double =
        cancellationRequestRepository.getRetentionRate()

    /**
     * Get exit survey analytics.
     */
    fun getExitSurveyAnalytics(): Map<String, Any> {
        val reasonStats = exitSurveyRepository.getReasonCategoryStats()
        val avgNps = exitSurveyRepository.getAverageNpsScore()
        val npsDistribution = exitSurveyRepository.getNpsDistribution()

        return mapOf(
            "reasonStats" to reasonStats,
            "averageNps" to (avgNps ?: 0.0),
            "npsDistribution" to npsDistribution,
            "totalSurveys" to exitSurveyRepository.count()
        )
    }

    // ==========================================
    // PRIVATE HELPERS
    // ==========================================

    private fun generateRetentionOfferPreviews(
        subscription: Subscription,
        locale: String
    ): List<RetentionOfferPreview> {
        val offers = mutableListOf<RetentionOfferPreview>()

        // Offer 1: Free freeze days
        offers.add(RetentionOfferPreview(
            offerId = UUID.randomUUID(), // Placeholder, actual ID generated when saved
            offerType = RetentionOfferType.FREE_FREEZE,
            title = LocalizedText(
                en = "Take a Break",
                ar = "خذ استراحة"
            ),
            description = LocalizedText(
                en = "Get $FREE_FREEZE_DAYS FREE freeze days to pause your membership",
                ar = "احصل على $FREE_FREEZE_DAYS يوم تجميد مجاني لإيقاف عضويتك مؤقتاً"
            ),
            value = null,
            discountPercentage = null,
            durationDays = FREE_FREEZE_DAYS,
            durationMonths = null,
            alternativePlanName = null
        ))

        // Offer 2: Loyalty discount
        val memberTenure = ChronoUnit.DAYS.between(subscription.startDate, LocalDate.now())
        if (memberTenure >= 90) { // Only for members with 90+ days tenure
            offers.add(RetentionOfferPreview(
                offerId = UUID.randomUUID(),
                offerType = RetentionOfferType.DISCOUNT,
                title = LocalizedText(
                    en = "Loyalty Discount",
                    ar = "خصم الولاء"
                ),
                description = LocalizedText(
                    en = "${LOYALTY_DISCOUNT_PERCENTAGE.toInt()}% off your next $LOYALTY_DISCOUNT_MONTHS months",
                    ar = "خصم ${LOYALTY_DISCOUNT_PERCENTAGE.toInt()}% على الأشهر الـ $LOYALTY_DISCOUNT_MONTHS القادمة"
                ),
                value = null,
                discountPercentage = BigDecimal.valueOf(LOYALTY_DISCOUNT_PERCENTAGE),
                durationDays = null,
                durationMonths = LOYALTY_DISCOUNT_MONTHS,
                alternativePlanName = null
            ))
        }

        // Offer 3: Downgrade to cheaper plan (if available)
        val cheaperPlan = findCheaperPlan(subscription.planId)
        cheaperPlan?.let { plan ->
            offers.add(RetentionOfferPreview(
                offerId = UUID.randomUUID(),
                offerType = RetentionOfferType.DOWNGRADE,
                title = LocalizedText(
                    en = "Try ${plan.name.get(locale)}",
                    ar = "جرب ${plan.name.get("ar") ?: plan.name.get("en")}"
                ),
                description = LocalizedText(
                    en = "Switch to ${plan.name.get(locale)} at ${plan.getRecurringTotal().currency} ${plan.getRecurringTotal().amount}/month",
                    ar = "انتقل إلى ${plan.name.get("ar") ?: plan.name.get("en")} بسعر ${plan.getRecurringTotal().amount} ${plan.getRecurringTotal().currency}/شهرياً"
                ),
                value = plan.getRecurringTotal(),
                discountPercentage = null,
                durationDays = null,
                durationMonths = null,
                alternativePlanName = plan.name
            ))
        }

        return offers
    }

    private fun generateAndSaveRetentionOffers(
        subscription: Subscription,
        cancellationRequest: CancellationRequest
    ): List<RetentionOffer> {
        val expiresAt = Instant.now().plus(java.time.Duration.ofHours(RETENTION_OFFER_EXPIRY_HOURS))
        val offers = mutableListOf<RetentionOffer>()

        // Offer 1: Free freeze days
        offers.add(RetentionOffer.createFreeFreezeOffer(
            memberId = subscription.memberId,
            subscriptionId = subscription.id,
            freezeDays = FREE_FREEZE_DAYS,
            expiresAt = expiresAt,
            contractId = subscription.contractId
        ))

        // Offer 2: Loyalty discount (for tenured members)
        val memberTenure = ChronoUnit.DAYS.between(subscription.startDate, LocalDate.now())
        if (memberTenure >= 90) {
            offers.add(RetentionOffer.createDiscountOffer(
                memberId = subscription.memberId,
                subscriptionId = subscription.id,
                discountPercentage = BigDecimal.valueOf(LOYALTY_DISCOUNT_PERCENTAGE),
                durationMonths = LOYALTY_DISCOUNT_MONTHS,
                expiresAt = expiresAt,
                contractId = subscription.contractId
            ))
        }

        // Offer 3: Downgrade
        val cheaperPlan = findCheaperPlan(subscription.planId)
        cheaperPlan?.let { plan ->
            offers.add(RetentionOffer.createDowngradeOffer(
                memberId = subscription.memberId,
                subscriptionId = subscription.id,
                alternativePlanId = plan.id,
                alternativePlanName = plan.name,
                alternativePlanPrice = plan.getRecurringTotal(),
                expiresAt = expiresAt,
                contractId = subscription.contractId
            ))
        }

        return retentionOfferRepository.saveAll(offers)
    }

    private fun findCheaperPlan(currentPlanId: UUID): com.liyaqa.membership.domain.model.MembershipPlan? {
        val currentPlan = planRepository.findById(currentPlanId).orElse(null) ?: return null
        val currentPrice = currentPlan.getRecurringTotal()

        // Find active plans cheaper than current
        return planRepository.findByIsActive(true, org.springframework.data.domain.Pageable.unpaged())
            .content
            .filter { it.id != currentPlanId }
            .filter { it.getRecurringTotal() < currentPrice }
            .maxByOrNull { it.getRecurringTotal().amount } // Get the most expensive of the cheaper plans
    }

    private fun applyRetentionOfferBenefit(offer: RetentionOffer, subscription: Subscription) {
        when (offer.offerType) {
            RetentionOfferType.FREE_FREEZE -> {
                // Add freeze days to subscription
                offer.durationDays?.let { days ->
                    subscription.freezeDaysRemaining += days
                    subscriptionRepository.save(subscription)
                }
            }
            RetentionOfferType.DISCOUNT -> {
                // Apply discount (would typically create a wallet credit or future discount)
                // Implementation depends on billing system
            }
            RetentionOfferType.DOWNGRADE -> {
                // Trigger plan change
                // Implementation would call PlanChangeService
            }
            else -> { /* Handle other offer types */ }
        }
    }

    private fun declineOtherOffers(subscriptionId: UUID, acceptedOfferId: UUID) {
        val pendingOffers = retentionOfferRepository.findPendingBySubscriptionId(subscriptionId)
        pendingOffers.filter { it.id != acceptedOfferId }.forEach { offer ->
            offer.decline()
            retentionOfferRepository.save(offer)
        }
    }

    private fun expireOffers(subscriptionId: UUID) {
        val pendingOffers = retentionOfferRepository.findPendingBySubscriptionId(subscriptionId)
        pendingOffers.forEach { offer ->
            offer.markExpired()
            retentionOfferRepository.save(offer)
        }
    }
}
