package com.liyaqa.membership.application.services

import com.liyaqa.membership.application.commands.CreateMembershipPlanCommand
import com.liyaqa.membership.application.commands.UpdateMembershipPlanCommand
import com.liyaqa.membership.domain.model.MembershipPlan
import com.liyaqa.membership.domain.ports.MembershipPlanRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional
class MembershipPlanService(
    private val membershipPlanRepository: MembershipPlanRepository
) {
    /**
     * Creates a new membership plan.
     */
    fun createPlan(command: CreateMembershipPlanCommand): MembershipPlan {
        val plan = MembershipPlan(
            name = command.name,
            description = command.description,
            price = command.price,
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
            isActive = true
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
     * Updates a membership plan.
     */
    fun updatePlan(id: UUID, command: UpdateMembershipPlanCommand): MembershipPlan {
        val plan = membershipPlanRepository.findById(id)
            .orElseThrow { NoSuchElementException("Membership plan not found: $id") }

        command.name?.let { plan.name = it }
        command.description?.let { plan.description = it }
        command.price?.let { plan.price = it }
        command.billingPeriod?.let { plan.billingPeriod = it }
        command.durationDays?.let { plan.durationDays = it }
        command.maxClassesPerPeriod?.let { plan.maxClassesPerPeriod = it }
        command.hasGuestPasses?.let { plan.hasGuestPasses = it }
        command.guestPassesCount?.let { plan.guestPassesCount = it }
        command.hasLockerAccess?.let { plan.hasLockerAccess = it }
        command.hasSaunaAccess?.let { plan.hasSaunaAccess = it }
        command.hasPoolAccess?.let { plan.hasPoolAccess = it }
        command.freezeDaysAllowed?.let { plan.freezeDaysAllowed = it }
        command.sortOrder?.let { plan.sortOrder = it }

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
}