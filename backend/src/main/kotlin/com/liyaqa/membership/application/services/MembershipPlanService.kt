package com.liyaqa.membership.application.services

import com.liyaqa.membership.application.commands.CreateMembershipPlanCommand
import com.liyaqa.membership.application.commands.UpdateMembershipPlanCommand
import com.liyaqa.membership.domain.model.MembershipPlan
import com.liyaqa.membership.domain.model.MembershipPlanStatus
import com.liyaqa.membership.domain.model.MembershipPlanType
import com.liyaqa.membership.domain.ports.MembershipPlanRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

@Service
@Transactional
class MembershipPlanService(
    private val membershipPlanRepository: MembershipPlanRepository
) {
    /**
     * Creates a new membership plan.
     * @throws IllegalArgumentException if a plan with the same name already exists
     * @throws IllegalArgumentException if date/age/fee validation fails
     */
    fun createPlan(command: CreateMembershipPlanCommand): MembershipPlan {
        // Check for duplicate name
        if (membershipPlanRepository.existsByNameEn(command.name.en)) {
            throw IllegalArgumentException("A membership plan with this name already exists")
        }

        // Validate date range
        if (command.availableFrom != null && command.availableUntil != null) {
            require(command.availableFrom <= command.availableUntil) {
                "Available from date must be before or equal to available until date"
            }
        }

        // Validate age range
        if (command.minimumAge != null && command.maximumAge != null) {
            require(command.minimumAge <= command.maximumAge) {
                "Minimum age must be less than or equal to maximum age"
            }
        }

        // Type-specific validation
        when (command.planType) {
            MembershipPlanType.CLASS_PACK -> {
                require(command.sessionCount != null && command.sessionCount > 0) {
                    "Class pack plans require a positive session count"
                }
            }
            MembershipPlanType.TRIAL -> {
                require(command.durationDays != null && command.durationDays > 0) {
                    "Trial plans require a duration in days"
                }
            }
            MembershipPlanType.RECURRING -> {
                // Validate at least one fee is set for recurring
                require(!command.membershipFee.isZero() || !command.administrationFee.isZero()) {
                    "At least membership fee or administration fee must be set"
                }
            }
            MembershipPlanType.DAY_PASS -> {
                // Day passes require a membership fee
                require(!command.membershipFee.isZero()) {
                    "Day pass plans require a membership fee"
                }
            }
        }

        // Sync isActive with status
        val isActive = command.status == MembershipPlanStatus.ACTIVE

        val plan = MembershipPlan(
            name = command.name,
            description = command.description,
            planType = command.planType,
            status = command.status,
            availableFrom = command.availableFrom,
            availableUntil = command.availableUntil,
            minimumAge = command.minimumAge,
            maximumAge = command.maximumAge,
            membershipFee = command.membershipFee,
            administrationFee = command.administrationFee,
            joinFee = command.joinFee,
            billingPeriod = command.billingPeriod,
            durationDays = command.durationDays,
            maxClassesPerPeriod = command.maxClassesPerPeriod,
            hasGuestPasses = command.hasGuestPasses,
            guestPassesCount = command.guestPassesCount,
            hasLockerAccess = command.hasLockerAccess,
            hasSaunaAccess = command.hasSaunaAccess,
            hasPoolAccess = command.hasPoolAccess,
            freezeDaysAllowed = command.freezeDaysAllowed,
            sortOrder = command.sortOrder,
            isActive = isActive,
            // Contract configuration
            categoryId = command.categoryId,
            contractType = command.contractType,
            supportedTerms = command.supportedTerms.joinToString(","),
            defaultCommitmentMonths = command.defaultCommitmentMonths,
            minimumCommitmentMonths = command.minimumCommitmentMonths,
            defaultNoticePeriodDays = command.defaultNoticePeriodDays,
            earlyTerminationFeeType = command.earlyTerminationFeeType,
            earlyTerminationFeeValue = command.earlyTerminationFeeValue,
            coolingOffDays = command.coolingOffDays,
            // Class pack & trial
            sessionCount = command.sessionCount,
            expiryDays = command.expiryDays,
            convertsToPlanId = command.convertsToPlanId
        )

        return membershipPlanRepository.save(plan)
    }

    /**
     * Gets a membership plan by ID.
     */
    @Transactional(readOnly = true)
    fun getPlan(id: UUID): MembershipPlan {
        return membershipPlanRepository.findById(id)
            .orElseThrow { NoSuchElementException("Membership plan not found: $id") }
    }

    /**
     * Gets all membership plans with pagination.
     */
    @Transactional(readOnly = true)
    fun getAllPlans(pageable: Pageable): Page<MembershipPlan> {
        return membershipPlanRepository.findAll(pageable)
    }

    /**
     * Gets only active membership plans.
     */
    @Transactional(readOnly = true)
    fun getActivePlans(pageable: Pageable): Page<MembershipPlan> {
        return membershipPlanRepository.findByIsActive(true, pageable)
    }

    /**
     * Gets only currently available membership plans.
     * A plan is available if it's active and within its date range.
     */
    @Transactional(readOnly = true)
    fun getAvailablePlans(pageable: Pageable): Page<MembershipPlan> {
        val today = LocalDate.now()
        return membershipPlanRepository.findAvailablePlans(today, pageable)
    }

    /**
     * Gets membership plans filtered by active status.
     */
    @Transactional(readOnly = true)
    fun getPlansByActiveStatus(isActive: Boolean, pageable: Pageable): Page<MembershipPlan> {
        return membershipPlanRepository.findByIsActive(isActive, pageable)
    }

    /**
     * Updates a membership plan.
     */
    fun updatePlan(id: UUID, command: UpdateMembershipPlanCommand): MembershipPlan {
        val plan = membershipPlanRepository.findById(id)
            .orElseThrow { NoSuchElementException("Membership plan not found: $id") }

        // Update basic fields
        command.name?.let { plan.name = it }
        command.description?.let { plan.description = it }

        // Update date restrictions
        if (command.clearAvailableFrom) {
            plan.availableFrom = null
        } else {
            command.availableFrom?.let { plan.availableFrom = it }
        }

        if (command.clearAvailableUntil) {
            plan.availableUntil = null
        } else {
            command.availableUntil?.let { plan.availableUntil = it }
        }

        // Validate date range after updates
        if (plan.availableFrom != null && plan.availableUntil != null) {
            require(plan.availableFrom!! <= plan.availableUntil!!) {
                "Available from date must be before or equal to available until date"
            }
        }

        // Update age restrictions
        if (command.clearMinimumAge) {
            plan.minimumAge = null
        } else {
            command.minimumAge?.let { plan.minimumAge = it }
        }

        if (command.clearMaximumAge) {
            plan.maximumAge = null
        } else {
            command.maximumAge?.let { plan.maximumAge = it }
        }

        // Validate age range after updates
        if (plan.minimumAge != null && plan.maximumAge != null) {
            require(plan.minimumAge!! <= plan.maximumAge!!) {
                "Minimum age must be less than or equal to maximum age"
            }
        }

        // Update fee structure
        command.membershipFee?.let { plan.membershipFee = it }
        command.administrationFee?.let { plan.administrationFee = it }
        command.joinFee?.let { plan.joinFee = it }

        // Validate at least one fee is set after updates
        require(!plan.membershipFee.isZero() || !plan.administrationFee.isZero()) {
            "At least membership fee or administration fee must be set"
        }

        // Update billing & duration
        command.billingPeriod?.let { plan.billingPeriod = it }
        command.durationDays?.let { plan.durationDays = it }
        command.maxClassesPerPeriod?.let { plan.maxClassesPerPeriod = it }

        // Update features
        command.hasGuestPasses?.let { plan.hasGuestPasses = it }
        command.guestPassesCount?.let { plan.guestPassesCount = it }
        command.hasLockerAccess?.let { plan.hasLockerAccess = it }
        command.hasSaunaAccess?.let { plan.hasSaunaAccess = it }
        command.hasPoolAccess?.let { plan.hasPoolAccess = it }
        command.freezeDaysAllowed?.let { plan.freezeDaysAllowed = it }
        command.sortOrder?.let { plan.sortOrder = it }

        // Update contract configuration
        if (command.clearCategoryId) {
            plan.categoryId = null
        } else {
            command.categoryId?.let { plan.categoryId = it }
        }
        command.contractType?.let { plan.contractType = it }
        command.supportedTerms?.let { plan.setSupportedTermsList(it) }
        command.defaultCommitmentMonths?.let { plan.defaultCommitmentMonths = it }
        command.minimumCommitmentMonths?.let { plan.minimumCommitmentMonths = it }
        command.defaultNoticePeriodDays?.let { plan.defaultNoticePeriodDays = it }
        command.earlyTerminationFeeType?.let { plan.earlyTerminationFeeType = it }
        command.earlyTerminationFeeValue?.let { plan.earlyTerminationFeeValue = it }
        command.coolingOffDays?.let { plan.coolingOffDays = it }

        // Update class pack & trial fields
        command.sessionCount?.let { plan.sessionCount = it }
        command.expiryDays?.let { plan.expiryDays = it }
        command.convertsToPlanId?.let { plan.convertsToPlanId = it }

        return membershipPlanRepository.save(plan)
    }

    /**
     * Activates a membership plan.
     */
    fun activatePlan(id: UUID): MembershipPlan {
        val plan = membershipPlanRepository.findById(id)
            .orElseThrow { NoSuchElementException("Membership plan not found: $id") }

        plan.activate()
        return membershipPlanRepository.save(plan)
    }

    /**
     * Deactivates a membership plan.
     */
    fun deactivatePlan(id: UUID): MembershipPlan {
        val plan = membershipPlanRepository.findById(id)
            .orElseThrow { NoSuchElementException("Membership plan not found: $id") }

        plan.deactivate()
        return membershipPlanRepository.save(plan)
    }

    /**
     * Deletes a membership plan.
     * Note: Consider soft-delete or checking for active subscriptions before deletion.
     */
    fun deletePlan(id: UUID) {
        if (!membershipPlanRepository.existsById(id)) {
            throw NoSuchElementException("Membership plan not found: $id")
        }
        membershipPlanRepository.deleteById(id)
    }

    /**
     * Archives a membership plan. Existing subscribers keep their contract terms.
     */
    fun archivePlan(id: UUID): MembershipPlan {
        val plan = membershipPlanRepository.findById(id)
            .orElseThrow { NoSuchElementException("Membership plan not found: $id") }

        plan.archive()
        return membershipPlanRepository.save(plan)
    }

    /**
     * Reactivates an archived membership plan.
     */
    fun reactivatePlan(id: UUID): MembershipPlan {
        val plan = membershipPlanRepository.findById(id)
            .orElseThrow { NoSuchElementException("Membership plan not found: $id") }

        plan.reactivate()
        return membershipPlanRepository.save(plan)
    }

    /**
     * Publishes a draft plan (transitions DRAFT -> ACTIVE).
     */
    fun publishPlan(id: UUID): MembershipPlan {
        val plan = membershipPlanRepository.findById(id)
            .orElseThrow { NoSuchElementException("Membership plan not found: $id") }

        plan.publish()
        return membershipPlanRepository.save(plan)
    }

    /**
     * Gets plans filtered by status (DRAFT, ACTIVE, ARCHIVED).
     */
    @Transactional(readOnly = true)
    fun getPlansByStatus(status: MembershipPlanStatus, pageable: Pageable): Page<MembershipPlan> {
        return membershipPlanRepository.findByStatus(status, pageable)
    }

    /**
     * Gets plans filtered by plan type.
     */
    @Transactional(readOnly = true)
    fun getPlansByType(planType: MembershipPlanType, pageable: Pageable): Page<MembershipPlan> {
        return membershipPlanRepository.findByPlanType(planType, pageable)
    }

    /**
     * Gets plan statistics: total, active, draft, archived counts.
     */
    @Transactional(readOnly = true)
    fun getPlanStats(): Map<String, Long> {
        val total = membershipPlanRepository.count()
        val active = membershipPlanRepository.countByStatus(MembershipPlanStatus.ACTIVE)
        val draft = membershipPlanRepository.countByStatus(MembershipPlanStatus.DRAFT)
        val archived = membershipPlanRepository.countByStatus(MembershipPlanStatus.ARCHIVED)
        return mapOf(
            "totalPlans" to total,
            "activePlans" to active,
            "draftPlans" to draft,
            "archivedPlans" to archived
        )
    }

    /**
     * Finds and deactivates all plans that have passed their availability end date.
     * Called by the scheduled job.
     */
    fun deactivateExpiredPlans(): List<MembershipPlan> {
        val today = LocalDate.now()
        val expiredPlans = membershipPlanRepository.findByAvailableUntilBeforeAndIsActive(today, true)

        return expiredPlans.map { plan ->
            plan.deactivate()
            membershipPlanRepository.save(plan)
        }
    }
}
