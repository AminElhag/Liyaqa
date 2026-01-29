package com.liyaqa.membership.application.services

import com.liyaqa.membership.domain.model.CancellationType
import com.liyaqa.membership.domain.model.ContractStatus
import com.liyaqa.membership.domain.model.ContractTerm
import com.liyaqa.membership.domain.model.ContractType
import com.liyaqa.membership.domain.model.MembershipContract
import com.liyaqa.membership.domain.model.MembershipPlan
import com.liyaqa.membership.domain.model.TerminationFeeType
import com.liyaqa.membership.domain.ports.ContractPricingTierRepository
import com.liyaqa.membership.domain.ports.MembershipContractRepository
import com.liyaqa.membership.domain.ports.MembershipPlanRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.shared.domain.Money
import com.liyaqa.shared.domain.TaxableFee
import com.liyaqa.shared.domain.TenantContext
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import java.time.Year
import java.util.UUID

/**
 * Command to create a new membership contract.
 */
data class CreateContractCommand(
    val memberId: UUID,
    val planId: UUID,
    val contractType: ContractType,
    val contractTerm: ContractTerm,
    val startDate: LocalDate = LocalDate.now(),
    val noticePeriodDays: Int = 30,
    val earlyTerminationFeeType: TerminationFeeType = TerminationFeeType.REMAINING_MONTHS,
    val earlyTerminationFeeValue: BigDecimal? = null,
    val categoryId: UUID? = null
)

/**
 * Result of contract creation.
 */
data class ContractCreationResult(
    val contract: MembershipContract,
    val contractNumber: String,
    val coolingOffEndDate: LocalDate,
    val commitmentEndDate: LocalDate?,
    val lockedMonthlyFee: Money
)

/**
 * Preview of contract cancellation.
 */
data class CancellationPreview(
    val contractId: UUID,
    val isWithinCoolingOff: Boolean,
    val coolingOffDaysRemaining: Long,
    val isWithinCommitment: Boolean,
    val commitmentMonthsRemaining: Int,
    val noticePeriodDays: Int,
    val effectiveDate: LocalDate,
    val earlyTerminationFee: Money,
    val refundAmount: Money?
)

@Service
class ContractService(
    private val contractRepository: MembershipContractRepository,
    private val planRepository: MembershipPlanRepository,
    private val pricingTierRepository: ContractPricingTierRepository,
    private val subscriptionRepository: SubscriptionRepository
) {

    /**
     * Create a new membership contract.
     */
    @Transactional
    fun createContract(command: CreateContractCommand): ContractCreationResult {
        val plan = planRepository.findById(command.planId)
            .orElseThrow { IllegalArgumentException("Plan not found: ${command.planId}") }

        // Generate contract number
        val contractNumber = generateContractNumber()

        // Calculate commitment months based on term
        val commitmentMonths = when (command.contractType) {
            ContractType.MONTH_TO_MONTH -> 0
            ContractType.FIXED_TERM -> command.contractTerm.toMonths()
        }

        // Calculate commitment end date
        val commitmentEndDate = if (commitmentMonths > 0) {
            command.startDate.plusMonths(commitmentMonths.toLong())
        } else null

        // Calculate cooling-off end date (Saudi regulation: 7 days)
        val coolingOffEndDate = command.startDate.plusDays(MembershipContract.DEFAULT_COOLING_OFF_DAYS.toLong())

        // Get locked pricing (with tier discount if applicable)
        val lockedFees = calculateLockedPricing(plan, command.contractTerm)

        val contract = MembershipContract(
            contractNumber = contractNumber,
            memberId = command.memberId,
            planId = command.planId,
            categoryId = command.categoryId,
            contractType = command.contractType,
            contractTerm = command.contractTerm,
            commitmentMonths = commitmentMonths,
            noticePeriodDays = command.noticePeriodDays,
            startDate = command.startDate,
            commitmentEndDate = commitmentEndDate,
            coolingOffEndDate = coolingOffEndDate,
            lockedMembershipFee = lockedFees.membershipFee,
            lockedAdminFee = lockedFees.adminFee,
            lockedJoinFee = lockedFees.joinFee,
            earlyTerminationFeeType = command.earlyTerminationFeeType,
            earlyTerminationFeeValue = command.earlyTerminationFeeValue,
            status = ContractStatus.PENDING_SIGNATURE
        )

        val savedContract = contractRepository.save(contract)

        return ContractCreationResult(
            contract = savedContract,
            contractNumber = contractNumber,
            coolingOffEndDate = coolingOffEndDate,
            commitmentEndDate = commitmentEndDate,
            lockedMonthlyFee = lockedFees.membershipFee.getGrossAmount() + lockedFees.adminFee.getGrossAmount()
        )
    }

    /**
     * Sign contract with digital signature.
     */
    @Transactional
    fun signContract(contractId: UUID, signatureData: String): MembershipContract {
        val contract = contractRepository.findById(contractId)
            .orElseThrow { IllegalArgumentException("Contract not found: $contractId") }

        require(contract.status == ContractStatus.PENDING_SIGNATURE) {
            "Contract is not pending signature"
        }

        contract.signByMember(signatureData)
        return contractRepository.save(contract)
    }

    /**
     * Approve contract by staff.
     */
    @Transactional
    fun approveContract(contractId: UUID, staffUserId: UUID): MembershipContract {
        val contract = contractRepository.findById(contractId)
            .orElseThrow { IllegalArgumentException("Contract not found: $contractId") }

        contract.approveByStaff(staffUserId)
        return contractRepository.save(contract)
    }

    /**
     * Get cancellation preview for a contract.
     */
    fun previewCancellation(contractId: UUID): CancellationPreview {
        val contract = contractRepository.findById(contractId)
            .orElseThrow { IllegalArgumentException("Contract not found: $contractId") }

        require(contract.status == ContractStatus.ACTIVE) {
            "Contract is not active"
        }

        val isWithinCoolingOff = contract.isWithinCoolingOff()
        val coolingOffDaysRemaining = contract.coolingOffDaysRemaining()
        val isWithinCommitment = contract.isWithinCommitment()
        val commitmentMonthsRemaining = contract.commitmentMonthsRemaining()

        // Calculate effective date
        val effectiveDate = if (isWithinCoolingOff) {
            LocalDate.now() // Immediate for cooling-off
        } else {
            LocalDate.now().plusDays(contract.noticePeriodDays.toLong())
        }

        // Calculate early termination fee
        val earlyTerminationFee = if (isWithinCoolingOff) {
            Money.ZERO
        } else {
            Money.of(contract.calculateEarlyTerminationFee(), "SAR")
        }

        // Calculate refund for cooling-off
        val refundAmount = if (isWithinCoolingOff) {
            // Full refund of join fee and prorated membership
            contract.lockedJoinFee.getGrossAmount() + contract.lockedMembershipFee.getGrossAmount()
        } else null

        return CancellationPreview(
            contractId = contractId,
            isWithinCoolingOff = isWithinCoolingOff,
            coolingOffDaysRemaining = coolingOffDaysRemaining,
            isWithinCommitment = isWithinCommitment,
            commitmentMonthsRemaining = commitmentMonthsRemaining,
            noticePeriodDays = if (isWithinCoolingOff) 0 else contract.noticePeriodDays,
            effectiveDate = effectiveDate,
            earlyTerminationFee = earlyTerminationFee,
            refundAmount = refundAmount
        )
    }

    /**
     * Cancel contract within cooling-off period.
     */
    @Transactional
    fun cancelWithinCoolingOff(contractId: UUID, reason: String? = null): MembershipContract {
        val contract = contractRepository.findById(contractId)
            .orElseThrow { IllegalArgumentException("Contract not found: $contractId") }

        require(contract.isWithinCoolingOff()) {
            "Cooling-off period has expired"
        }

        contract.cancelWithinCoolingOff(reason)

        // Also cancel the linked subscription if exists
        contract.subscriptionId?.let { subscriptionId ->
            subscriptionRepository.findById(subscriptionId).ifPresent { subscription ->
                subscription.cancel()
                subscriptionRepository.save(subscription)
            }
        }

        return contractRepository.save(contract)
    }

    /**
     * Request cancellation with notice period.
     */
    @Transactional
    fun requestCancellation(
        contractId: UUID,
        cancellationType: CancellationType,
        reason: String? = null
    ): MembershipContract {
        val contract = contractRepository.findById(contractId)
            .orElseThrow { IllegalArgumentException("Contract not found: $contractId") }

        require(contract.status == ContractStatus.ACTIVE) {
            "Contract is not active"
        }

        contract.requestCancellation(cancellationType, reason)
        return contractRepository.save(contract)
    }

    /**
     * Withdraw cancellation request.
     */
    @Transactional
    fun withdrawCancellation(contractId: UUID): MembershipContract {
        val contract = contractRepository.findById(contractId)
            .orElseThrow { IllegalArgumentException("Contract not found: $contractId") }

        contract.withdrawCancellationRequest()

        // Also update the linked subscription
        contract.subscriptionId?.let { subscriptionId ->
            subscriptionRepository.findById(subscriptionId).ifPresent { subscription ->
                subscription.withdrawCancellation()
                subscriptionRepository.save(subscription)
            }
        }

        return contractRepository.save(contract)
    }

    /**
     * Complete cancellation after notice period.
     */
    @Transactional
    fun completeCancellation(contractId: UUID): MembershipContract {
        val contract = contractRepository.findById(contractId)
            .orElseThrow { IllegalArgumentException("Contract not found: $contractId") }

        require(contract.status == ContractStatus.IN_NOTICE_PERIOD) {
            "Contract is not in notice period"
        }

        contract.completeCancellation()

        // Also complete the subscription cancellation
        contract.subscriptionId?.let { subscriptionId ->
            subscriptionRepository.findById(subscriptionId).ifPresent { subscription ->
                subscription.completeCancellation()
                subscriptionRepository.save(subscription)
            }
        }

        return contractRepository.save(contract)
    }

    /**
     * Link subscription to contract.
     */
    @Transactional
    fun linkSubscription(contractId: UUID, subscriptionId: UUID): MembershipContract {
        val contract = contractRepository.findById(contractId)
            .orElseThrow { IllegalArgumentException("Contract not found: $contractId") }

        contract.linkSubscription(subscriptionId)

        // Also link the contract to the subscription
        subscriptionRepository.findById(subscriptionId).ifPresent { subscription ->
            subscription.linkContract(contractId)
            subscriptionRepository.save(subscription)
        }

        return contractRepository.save(contract)
    }

    /**
     * Get contract by ID.
     */
    fun getContract(id: UUID): MembershipContract? =
        contractRepository.findById(id).orElse(null)

    /**
     * Get contract by contract number.
     */
    fun getContractByNumber(contractNumber: String): MembershipContract? =
        contractRepository.findByContractNumber(contractNumber).orElse(null)

    /**
     * Get active contract for a member.
     */
    fun getActiveContract(memberId: UUID): MembershipContract? =
        contractRepository.findActiveByMemberId(memberId).orElse(null)

    /**
     * Get all contracts for a member.
     */
    fun getMemberContracts(memberId: UUID, pageable: Pageable): Page<MembershipContract> =
        contractRepository.findByMemberId(memberId, pageable)

    /**
     * Get contracts by status.
     */
    fun getContractsByStatus(status: ContractStatus, pageable: Pageable): Page<MembershipContract> =
        contractRepository.findByStatus(status, pageable)

    /**
     * Get contracts in notice period.
     */
    fun getContractsInNoticePeriod(pageable: Pageable): Page<MembershipContract> =
        contractRepository.findContractsInNoticePeriod(pageable)

    /**
     * Get contracts within cooling-off period.
     */
    fun getContractsWithinCoolingOff(pageable: Pageable): Page<MembershipContract> =
        contractRepository.findContractsWithinCoolingOff(LocalDate.now(), pageable)

    /**
     * Search contracts.
     */
    fun searchContracts(
        memberId: UUID?,
        planId: UUID?,
        status: ContractStatus?,
        pageable: Pageable
    ): Page<MembershipContract> =
        contractRepository.search(memberId, planId, status, pageable)

    // ==========================================
    // PRIVATE HELPERS
    // ==========================================

    private fun generateContractNumber(): String {
        val tenantId = TenantContext.getCurrentTenant().value
        val year = Year.now().value
        val sequence = contractRepository.getNextContractSequence(tenantId, year)
        return "LYQ-$year-${sequence.toString().padStart(6, '0')}"
    }

    private data class LockedFees(
        val membershipFee: TaxableFee,
        val adminFee: TaxableFee,
        val joinFee: TaxableFee
    )

    private fun calculateLockedPricing(plan: MembershipPlan, term: ContractTerm): LockedFees {
        // Check for pricing tier discount
        val pricingTier = pricingTierRepository.findByPlanIdAndContractTerm(plan.id, term).orElse(null)

        val membershipFee = if (pricingTier != null && pricingTier.isActive) {
            val effectiveFee = pricingTier.calculateEffectiveMonthlyFee(plan.membershipFee.getNetAmount())
            TaxableFee.of(effectiveFee.amount, plan.membershipFee.currency, plan.membershipFee.taxRate)
        } else {
            plan.membershipFee
        }

        return LockedFees(
            membershipFee = membershipFee,
            adminFee = plan.administrationFee,
            joinFee = plan.joinFee
        )
    }
}
