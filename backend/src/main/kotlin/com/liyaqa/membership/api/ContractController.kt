package com.liyaqa.membership.api

import com.liyaqa.membership.application.services.CancellationService
import com.liyaqa.membership.application.services.ContractService
import com.liyaqa.membership.application.services.CreateContractCommand
import com.liyaqa.membership.domain.model.CancellationType
import com.liyaqa.membership.domain.model.ContractPricingTier
import com.liyaqa.membership.domain.model.ContractStatus
import com.liyaqa.membership.domain.model.MembershipCategory
import com.liyaqa.membership.domain.model.MembershipCategoryType
import com.liyaqa.membership.domain.ports.CancellationRequestRepository
import com.liyaqa.membership.domain.ports.ContractPricingTierRepository
import com.liyaqa.membership.domain.ports.ExitSurveyRepository
import com.liyaqa.membership.domain.ports.MembershipCategoryRepository
import com.liyaqa.membership.domain.ports.MembershipContractRepository
import com.liyaqa.membership.domain.ports.MembershipPlanRepository
import com.liyaqa.membership.domain.ports.RetentionOfferRepository
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.util.UUID

/**
 * Admin controller for contract management.
 */
@RestController
@RequestMapping("/api/admin/contracts")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
class ContractController(
    private val contractService: ContractService,
    private val contractRepository: MembershipContractRepository,
    private val cancellationService: CancellationService
) {

    /**
     * Create a new contract.
     */
    @PostMapping
    fun createContract(@Valid @RequestBody request: CreateContractRequest): ResponseEntity<ContractResponse> {
        val result = contractService.createContract(CreateContractCommand(
            memberId = request.memberId,
            planId = request.planId,
            contractType = request.contractType,
            contractTerm = request.contractTerm,
            startDate = request.startDate ?: java.time.LocalDate.now(),
            noticePeriodDays = request.noticePeriodDays,
            earlyTerminationFeeType = request.earlyTerminationFeeType,
            earlyTerminationFeeValue = request.earlyTerminationFeeValue,
            categoryId = request.categoryId
        ))

        return ResponseEntity.ok(ContractResponse.from(result.contract))
    }

    /**
     * Get contract by ID.
     */
    @GetMapping("/{id}")
    fun getContract(@PathVariable id: UUID): ResponseEntity<ContractResponse> {
        val contract = contractService.getContract(id)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(ContractResponse.from(contract))
    }

    /**
     * Get contract by contract number.
     */
    @GetMapping("/by-number/{contractNumber}")
    fun getContractByNumber(@PathVariable contractNumber: String): ResponseEntity<ContractResponse> {
        val contract = contractService.getContractByNumber(contractNumber)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(ContractResponse.from(contract))
    }

    /**
     * Get all contracts.
     */
    @GetMapping
    fun getAllContracts(pageable: Pageable): Page<ContractResponse> {
        return contractRepository.findAll(pageable).map { ContractResponse.from(it) }
    }

    /**
     * Get contracts by status.
     */
    @GetMapping("/status/{status}")
    fun getContractsByStatus(
        @PathVariable status: ContractStatus,
        pageable: Pageable
    ): Page<ContractResponse> {
        return contractService.getContractsByStatus(status, pageable).map { ContractResponse.from(it) }
    }

    /**
     * Get member's contracts.
     */
    @GetMapping("/member/{memberId}")
    fun getMemberContracts(
        @PathVariable memberId: UUID,
        pageable: Pageable
    ): Page<ContractResponse> {
        return contractService.getMemberContracts(memberId, pageable).map { ContractResponse.from(it) }
    }

    /**
     * Get contracts in notice period.
     */
    @GetMapping("/in-notice-period")
    fun getContractsInNoticePeriod(pageable: Pageable): Page<ContractResponse> {
        return contractService.getContractsInNoticePeriod(pageable).map { ContractResponse.from(it) }
    }

    /**
     * Get contracts within cooling-off period.
     */
    @GetMapping("/within-cooling-off")
    fun getContractsWithinCoolingOff(pageable: Pageable): Page<ContractResponse> {
        return contractService.getContractsWithinCoolingOff(pageable).map { ContractResponse.from(it) }
    }

    /**
     * Get pending signature contracts.
     */
    @GetMapping("/pending-signature")
    fun getPendingSignatureContracts(pageable: Pageable): Page<ContractResponse> {
        return contractRepository.findPendingSignature(pageable).map { ContractResponse.from(it) }
    }

    /**
     * Staff approves a contract.
     */
    @PostMapping("/{id}/approve")
    fun approveContract(
        @PathVariable id: UUID,
        @RequestParam staffUserId: UUID
    ): ResponseEntity<ContractResponse> {
        val contract = contractService.approveContract(id, staffUserId)
        return ResponseEntity.ok(ContractResponse.from(contract))
    }

    /**
     * Link subscription to contract.
     */
    @PostMapping("/{id}/link-subscription")
    fun linkSubscription(
        @PathVariable id: UUID,
        @RequestParam subscriptionId: UUID
    ): ResponseEntity<ContractResponse> {
        val contract = contractService.linkSubscription(id, subscriptionId)
        return ResponseEntity.ok(ContractResponse.from(contract))
    }

    /**
     * Get cancellation preview.
     */
    @GetMapping("/{id}/cancellation-preview")
    fun getCancellationPreview(@PathVariable id: UUID): ResponseEntity<CancellationPreviewResponse> {
        val preview = contractService.previewCancellation(id)
        return ResponseEntity.ok(CancellationPreviewResponse(
            contractId = preview.contractId,
            isWithinCoolingOff = preview.isWithinCoolingOff,
            coolingOffDaysRemaining = preview.coolingOffDaysRemaining,
            isWithinCommitment = preview.isWithinCommitment,
            commitmentMonthsRemaining = preview.commitmentMonthsRemaining,
            noticePeriodDays = preview.noticePeriodDays,
            effectiveDate = preview.effectiveDate,
            earlyTerminationFee = preview.earlyTerminationFee.amount,
            earlyTerminationFeeCurrency = preview.earlyTerminationFee.currency,
            refundAmount = preview.refundAmount?.amount,
            refundCurrency = preview.refundAmount?.currency
        ))
    }

    /**
     * Request cancellation.
     */
    @PostMapping("/{id}/cancel")
    fun requestCancellation(
        @PathVariable id: UUID,
        @RequestParam cancellationType: CancellationType,
        @RequestParam(required = false) reason: String?
    ): ResponseEntity<ContractResponse> {
        val contract = contractService.requestCancellation(id, cancellationType, reason)
        return ResponseEntity.ok(ContractResponse.from(contract))
    }

    /**
     * Cancel within cooling-off period.
     */
    @PostMapping("/{id}/cancel-cooling-off")
    fun cancelWithinCoolingOff(
        @PathVariable id: UUID,
        @RequestParam(required = false) reason: String?
    ): ResponseEntity<ContractResponse> {
        val contract = contractService.cancelWithinCoolingOff(id, reason)
        return ResponseEntity.ok(ContractResponse.from(contract))
    }

    /**
     * Withdraw cancellation.
     */
    @PostMapping("/{id}/withdraw-cancellation")
    fun withdrawCancellation(@PathVariable id: UUID): ResponseEntity<ContractResponse> {
        val contract = contractService.withdrawCancellation(id)
        return ResponseEntity.ok(ContractResponse.from(contract))
    }

    /**
     * Search contracts.
     */
    @GetMapping("/search")
    fun searchContracts(
        @RequestParam(required = false) memberId: UUID?,
        @RequestParam(required = false) planId: UUID?,
        @RequestParam(required = false) status: ContractStatus?,
        pageable: Pageable
    ): Page<ContractResponse> {
        return contractService.searchContracts(memberId, planId, status, pageable)
            .map { ContractResponse.from(it) }
    }
}

/**
 * Admin controller for membership categories.
 */
@RestController
@RequestMapping("/api/admin/membership-categories")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
class MembershipCategoryController(
    private val categoryRepository: MembershipCategoryRepository
) {

    @PostMapping
    fun createCategory(@Valid @RequestBody request: CreateCategoryRequest): ResponseEntity<CategoryResponse> {
        val category = MembershipCategory(
            name = request.name.toLocalizedText(),
            description = request.description?.toLocalizedText(),
            categoryType = MembershipCategoryType.valueOf(request.categoryType),
            minimumAge = request.minimumAge,
            maximumAge = request.maximumAge,
            requiresVerification = request.requiresVerification,
            verificationDocumentType = request.verificationDocumentType,
            maxFamilyMembers = request.maxFamilyMembers,
            defaultDiscountPercentage = request.defaultDiscountPercentage
        )

        val saved = categoryRepository.save(category)
        return ResponseEntity.ok(mapCategory(saved))
    }

    @GetMapping
    fun getAllCategories(pageable: Pageable): Page<CategoryResponse> {
        return categoryRepository.findAll(pageable).map { mapCategory(it) }
    }

    @GetMapping("/active")
    fun getActiveCategories(): List<CategoryResponse> {
        return categoryRepository.findAllActive().map { mapCategory(it) }
    }

    @GetMapping("/{id}")
    fun getCategory(@PathVariable id: UUID): ResponseEntity<CategoryResponse> {
        return categoryRepository.findById(id)
            .map { ResponseEntity.ok(mapCategory(it)) }
            .orElse(ResponseEntity.notFound().build())
    }

    @PostMapping("/{id}/deactivate")
    fun deactivateCategory(@PathVariable id: UUID): ResponseEntity<CategoryResponse> {
        val category = categoryRepository.findById(id)
            .orElse(null) ?: return ResponseEntity.notFound().build()

        category.deactivate()
        val saved = categoryRepository.save(category)
        return ResponseEntity.ok(mapCategory(saved))
    }

    @PostMapping("/{id}/activate")
    fun activateCategory(@PathVariable id: UUID): ResponseEntity<CategoryResponse> {
        val category = categoryRepository.findById(id)
            .orElse(null) ?: return ResponseEntity.notFound().build()

        category.activate()
        val saved = categoryRepository.save(category)
        return ResponseEntity.ok(mapCategory(saved))
    }

    @PutMapping("/{id}")
    fun updateCategory(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateCategoryRequest
    ): ResponseEntity<CategoryResponse> {
        val category = categoryRepository.findById(id)
            .orElse(null) ?: return ResponseEntity.notFound().build()

        // Update fields
        request.name?.let { category.name = it.toLocalizedText() }
        request.description?.let { category.description = it.toLocalizedText() }
        request.categoryType?.let { category.categoryType = MembershipCategoryType.valueOf(it) }
        request.minimumAge?.let { category.minimumAge = it }
        request.maximumAge?.let { category.maximumAge = it }
        request.requiresVerification?.let { category.requiresVerification = it }
        request.verificationDocumentType?.let { category.verificationDocumentType = it }
        request.maxFamilyMembers?.let { category.maxFamilyMembers = it }
        request.defaultDiscountPercentage?.let { category.defaultDiscountPercentage = it }

        val saved = categoryRepository.save(category)
        return ResponseEntity.ok(mapCategory(saved))
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    fun deleteCategory(@PathVariable id: UUID): ResponseEntity<Void> {
        if (!categoryRepository.existsById(id)) {
            return ResponseEntity.notFound().build()
        }

        // Check if category is in use
        val usageStats = getCategoryUsageStats(id)
        if (usageStats.totalMembers > 0 || usageStats.plansUsingCategory > 0) {
            return ResponseEntity.badRequest().build()
        }

        categoryRepository.deleteById(id)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/{id}/usage-stats")
    fun getUsageStats(@PathVariable id: UUID): ResponseEntity<CategoryUsageStatsResponse> {
        if (!categoryRepository.existsById(id)) {
            return ResponseEntity.notFound().build()
        }
        val stats = getCategoryUsageStats(id)
        return ResponseEntity.ok(stats)
    }

    private fun getCategoryUsageStats(categoryId: UUID): CategoryUsageStatsResponse {
        val memberCount = categoryRepository.countMembersByCategory(categoryId)
        val activeMembers = categoryRepository.countActiveMembersByCategory(categoryId)
        val plansCount = categoryRepository.countPlansByCategory(categoryId)

        return CategoryUsageStatsResponse(
            categoryId = categoryId,
            totalMembers = memberCount.toInt(),
            activeMembers = activeMembers.toInt(),
            plansUsingCategory = plansCount.toInt()
        )
    }

    private fun mapCategory(category: MembershipCategory) = CategoryResponse(
        id = category.id,
        nameEn = category.name.en,
        nameAr = category.name.ar,
        descriptionEn = category.description?.en,
        descriptionAr = category.description?.ar,
        categoryType = category.categoryType.name,
        minimumAge = category.minimumAge,
        maximumAge = category.maximumAge,
        requiresVerification = category.requiresVerification,
        verificationDocumentType = category.verificationDocumentType,
        maxFamilyMembers = category.maxFamilyMembers,
        defaultDiscountPercentage = category.defaultDiscountPercentage,
        isActive = category.isActive
    )
}

/**
 * Admin controller for cancellation management.
 */
@RestController
@RequestMapping("/api/admin/cancellations")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
class CancellationManagementController(
    private val cancellationService: CancellationService,
    private val cancellationRequestRepository: CancellationRequestRepository
) {

    /**
     * Get pending cancellations.
     */
    @GetMapping("/pending")
    fun getPendingCancellations(pageable: Pageable): Page<Map<String, Any>> {
        return cancellationRequestRepository.findByStatus(
            com.liyaqa.membership.domain.model.CancellationRequestStatus.IN_NOTICE,
            pageable
        ).map { request ->
            mapOf(
                "id" to request.id,
                "memberId" to request.memberId,
                "subscriptionId" to request.subscriptionId,
                "reasonCategory" to request.reasonCategory,
                "reasonDetail" to (request.reasonDetail ?: ""),
                "noticePeriodEndDate" to request.noticePeriodEndDate,
                "effectiveDate" to request.effectiveDate,
                "earlyTerminationFee" to (request.earlyTerminationFee?.amount ?: java.math.BigDecimal.ZERO),
                "feeWaived" to request.feeWaived,
                "daysRemaining" to request.daysRemainingInNoticePeriod(),
                "requestedAt" to request.requestedAt
            )
        }
    }

    /**
     * Waive early termination fee.
     */
    @PostMapping("/{id}/waive-fee")
    fun waiveFee(
        @PathVariable id: UUID,
        @RequestParam waivedBy: UUID,
        @RequestParam reason: String
    ): ResponseEntity<Map<String, Any>> {
        val request = cancellationService.waiveTerminationFee(id, waivedBy, reason)
        return ResponseEntity.ok(mapOf(
            "id" to request.id,
            "feeWaived" to request.feeWaived,
            "feeWaivedReason" to (request.feeWaivedReason ?: "")
        ))
    }

    /**
     * Get retention rate.
     */
    @GetMapping("/retention-rate")
    fun getRetentionRate(): ResponseEntity<Map<String, Any>> {
        val rate = cancellationService.getRetentionRate()
        val saved = cancellationRequestRepository.countSaved()
        return ResponseEntity.ok(mapOf(
            "retentionRate" to rate,
            "membersSaved" to saved
        ))
    }
}

/**
 * Admin controller for exit survey analytics.
 */
@RestController
@RequestMapping("/api/admin/exit-surveys")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
class ExitSurveyController(
    private val cancellationService: CancellationService,
    private val exitSurveyRepository: ExitSurveyRepository
) {

    /**
     * Get all exit surveys.
     */
    @GetMapping
    fun getAllSurveys(pageable: Pageable): Page<ExitSurveyResponse> {
        return exitSurveyRepository.findAll(pageable).map { survey ->
            ExitSurveyResponse(
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
            )
        }
    }

    /**
     * Get exit survey analytics.
     */
    @GetMapping("/analytics")
    fun getAnalytics(
        @RequestParam(required = false) startDate: String?,
        @RequestParam(required = false) endDate: String?
    ): ResponseEntity<ExitSurveyAnalyticsResponse> {
        val start = startDate?.let { LocalDate.parse(it).atStartOfDay().toInstant(ZoneOffset.UTC) }
            ?: Instant.now().minus(java.time.Duration.ofDays(365))
        val end = endDate?.let { LocalDate.parse(it).plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC) }
            ?: Instant.now()

        val analytics = cancellationService.getFullExitSurveyAnalytics(start, end)
        return ResponseEntity.ok(analytics)
    }
}

/**
 * Admin controller for retention metrics.
 */
@RestController
@RequestMapping("/api/admin/retention")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
class RetentionMetricsController(
    private val cancellationRequestRepository: CancellationRequestRepository,
    private val retentionOfferRepository: RetentionOfferRepository
) {

    @GetMapping("/metrics")
    fun getMetrics(): ResponseEntity<RetentionMetricsResponse> {
        val totalRequests = cancellationRequestRepository.count()
        val savedMembers = cancellationRequestRepository.countSaved()
        val retentionRate = cancellationRequestRepository.getRetentionRate()

        val offerStats = retentionOfferRepository.getOfferAcceptanceStats()
        val offerAcceptanceRate = (offerStats["acceptanceRate"] as? Number)?.toDouble() ?: 0.0

        val acceptedOfferTypes = try {
            retentionOfferRepository.getAcceptedOfferTypeStats().map { row ->
                AcceptedOfferTypeDto(
                    offerType = row[0].toString(),
                    count = (row[1] as Number).toLong()
                )
            }
        } catch (e: Exception) {
            emptyList()
        }

        return ResponseEntity.ok(RetentionMetricsResponse(
            totalCancellationRequests = totalRequests,
            savedMembers = savedMembers,
            retentionRate = retentionRate,
            averageTimeToSave = 0.0,
            offerAcceptanceRate = offerAcceptanceRate,
            topAcceptedOfferTypes = acceptedOfferTypes
        ))
    }
}

/**
 * Admin controller for contract pricing tiers.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
class PricingTierController(
    private val pricingTierRepository: ContractPricingTierRepository,
    private val planRepository: MembershipPlanRepository
) {

    @GetMapping("/pricing-tiers")
    fun getAll(): List<PricingTierResponse> {
        val tiers = pricingTierRepository.findAll(Pageable.unpaged()).content
        val planIds = tiers.map { it.planId }.distinct()
        val planNames = planIds.associateWith { planId ->
            planRepository.findById(planId).map { it.name.en }.orElse("Unknown Plan")
        }
        return tiers.map { PricingTierResponse.from(it, planNames[it.planId] ?: "Unknown Plan") }
    }

    @GetMapping("/plans/{planId}/pricing-tiers")
    fun getByPlan(@PathVariable planId: UUID): List<PricingTierResponse> {
        val planName = planRepository.findById(planId).map { it.name.en }.orElse("Unknown Plan")
        val tiers = pricingTierRepository.findActiveByPlanId(planId)
        return tiers.map { PricingTierResponse.from(it, planName) }
    }

    @PostMapping("/plans/{planId}/pricing-tiers")
    fun create(
        @PathVariable planId: UUID,
        @Valid @RequestBody request: CreatePricingTierRequest
    ): ResponseEntity<PricingTierResponse> {
        val plan = planRepository.findById(planId)
            .orElse(null) ?: return ResponseEntity.notFound().build()

        val overrideFee = request.overrideMonthlyFeeAmount?.let {
            Money(it, plan.membershipFee.currency)
        }

        val tier = ContractPricingTier(
            planId = planId,
            contractTerm = request.contractTerm,
            discountPercentage = request.discountPercentage,
            overrideMonthlyFee = overrideFee
        )

        val saved = pricingTierRepository.save(tier)
        return ResponseEntity.ok(PricingTierResponse.from(saved, plan.name.en))
    }

    @PutMapping("/pricing-tiers/{id}")
    fun update(
        @PathVariable id: UUID,
        @Valid @RequestBody request: CreatePricingTierRequest
    ): ResponseEntity<PricingTierResponse> {
        val tier = pricingTierRepository.findById(id)
            .orElse(null) ?: return ResponseEntity.notFound().build()

        val plan = planRepository.findById(tier.planId)
            .orElse(null) ?: return ResponseEntity.notFound().build()

        request.discountPercentage?.let { tier.discountPercentage = it }
        request.overrideMonthlyFeeAmount?.let {
            tier.overrideMonthlyFee = Money(it, plan.membershipFee.currency)
        }

        val saved = pricingTierRepository.save(tier)
        return ResponseEntity.ok(PricingTierResponse.from(saved, plan.name.en))
    }

    @DeleteMapping("/pricing-tiers/{id}")
    fun delete(@PathVariable id: UUID): ResponseEntity<Void> {
        if (!pricingTierRepository.existsById(id)) {
            return ResponseEntity.notFound().build()
        }
        pricingTierRepository.deleteById(id)
        return ResponseEntity.noContent().build()
    }
}
