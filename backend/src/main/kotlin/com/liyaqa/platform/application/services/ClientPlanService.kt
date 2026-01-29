package com.liyaqa.platform.application.services

import com.liyaqa.platform.application.commands.CreateClientPlanCommand
import com.liyaqa.platform.application.commands.UpdateClientPlanCommand
import com.liyaqa.platform.domain.model.ClientPlan
import com.liyaqa.platform.domain.ports.ClientPlanRepository
import com.liyaqa.platform.domain.ports.ClientSubscriptionRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Service for managing B2B client plans (pricing tiers).
 * Only accessible by platform users (internal Liyaqa team).
 */
@Service
@Transactional
class ClientPlanService(
    private val clientPlanRepository: ClientPlanRepository,
    private val clientSubscriptionRepository: ClientSubscriptionRepository
) {
    /**
     * Creates a new client plan.
     */
    fun createPlan(command: CreateClientPlanCommand): ClientPlan {
        val plan = ClientPlan(
            name = command.name,
            description = command.description,
            monthlyPrice = command.monthlyPrice,
            annualPrice = command.annualPrice,
            billingCycle = command.billingCycle,
            maxClubs = command.maxClubs,
            maxLocationsPerClub = command.maxLocationsPerClub,
            maxMembers = command.maxMembers,
            maxStaffUsers = command.maxStaffUsers,
            // Legacy features
            hasAdvancedReporting = command.hasAdvancedReporting,
            hasApiAccess = command.hasApiAccess,
            hasPrioritySupport = command.hasPrioritySupport,
            hasWhiteLabeling = command.hasWhiteLabeling,
            hasCustomIntegrations = command.hasCustomIntegrations,
            // Member Engagement features
            hasMemberPortal = command.hasMemberPortal,
            hasMobileApp = command.hasMobileApp,
            hasWearablesIntegration = command.hasWearablesIntegration,
            // Marketing & Loyalty features
            hasMarketingAutomation = command.hasMarketingAutomation,
            hasLoyaltyProgram = command.hasLoyaltyProgram,
            // Operations features
            hasAccessControl = command.hasAccessControl,
            hasFacilityBooking = command.hasFacilityBooking,
            hasPersonalTraining = command.hasPersonalTraining,
            // Accounts & Payments features
            hasCorporateAccounts = command.hasCorporateAccounts,
            hasFamilyGroups = command.hasFamilyGroups,
            hasOnlinePayments = command.hasOnlinePayments,
            sortOrder = command.sortOrder,
            isActive = true
        )

        // Validate feature dependencies
        plan.validateFeatureDependencies()

        return clientPlanRepository.save(plan)
    }

    /**
     * Gets a client plan by ID.
     */
    @Transactional(readOnly = true)
    fun getPlan(id: UUID): ClientPlan {
        return clientPlanRepository.findById(id)
            .orElseThrow { NoSuchElementException("Client plan not found: $id") }
    }

    /**
     * Gets all client plans with pagination.
     */
    @Transactional(readOnly = true)
    fun getAllPlans(pageable: Pageable): Page<ClientPlan> {
        return clientPlanRepository.findAll(pageable)
    }

    /**
     * Gets only active client plans.
     */
    @Transactional(readOnly = true)
    fun getActivePlans(pageable: Pageable): Page<ClientPlan> {
        return clientPlanRepository.findByIsActive(true, pageable)
    }

    /**
     * Gets all active plans ordered by sort order.
     * Used for display in UI without pagination.
     */
    @Transactional(readOnly = true)
    fun getActivePlansOrdered(): List<ClientPlan> {
        return clientPlanRepository.findAllActive()
    }

    /**
     * Updates a client plan.
     */
    fun updatePlan(id: UUID, command: UpdateClientPlanCommand): ClientPlan {
        val plan = clientPlanRepository.findById(id)
            .orElseThrow { NoSuchElementException("Client plan not found: $id") }

        command.name?.let { plan.name = it }
        command.description?.let { plan.description = it }

        // Update pricing if provided
        if (command.monthlyPrice != null && command.annualPrice != null) {
            plan.updatePricing(command.monthlyPrice, command.annualPrice)
        } else {
            command.monthlyPrice?.let { plan.monthlyPrice = it }
            command.annualPrice?.let { plan.annualPrice = it }
        }

        command.billingCycle?.let { plan.billingCycle = it }

        // Update limits
        plan.updateLimits(
            maxClubs = command.maxClubs,
            maxLocationsPerClub = command.maxLocationsPerClub,
            maxMembers = command.maxMembers,
            maxStaffUsers = command.maxStaffUsers
        )

        // Update all features (legacy + new) with dependency validation
        plan.updateAllFeatures(
            // Legacy features
            advancedReporting = command.hasAdvancedReporting,
            apiAccess = command.hasApiAccess,
            prioritySupport = command.hasPrioritySupport,
            whiteLabeling = command.hasWhiteLabeling,
            customIntegrations = command.hasCustomIntegrations,
            // Member Engagement features
            memberPortal = command.hasMemberPortal,
            mobileApp = command.hasMobileApp,
            wearablesIntegration = command.hasWearablesIntegration,
            // Marketing & Loyalty features
            marketingAutomation = command.hasMarketingAutomation,
            loyaltyProgram = command.hasLoyaltyProgram,
            // Operations features
            accessControl = command.hasAccessControl,
            facilityBooking = command.hasFacilityBooking,
            personalTraining = command.hasPersonalTraining,
            // Accounts & Payments features
            corporateAccounts = command.hasCorporateAccounts,
            familyGroups = command.hasFamilyGroups,
            onlinePayments = command.hasOnlinePayments
        )

        command.sortOrder?.let { plan.sortOrder = it }

        return clientPlanRepository.save(plan)
    }

    /**
     * Activates a client plan, making it available for new subscriptions.
     */
    fun activatePlan(id: UUID): ClientPlan {
        val plan = clientPlanRepository.findById(id)
            .orElseThrow { NoSuchElementException("Client plan not found: $id") }

        plan.activate()
        return clientPlanRepository.save(plan)
    }

    /**
     * Deactivates a client plan, preventing new subscriptions.
     * Existing subscriptions are not affected.
     */
    fun deactivatePlan(id: UUID): ClientPlan {
        val plan = clientPlanRepository.findById(id)
            .orElseThrow { NoSuchElementException("Client plan not found: $id") }

        plan.deactivate()
        return clientPlanRepository.save(plan)
    }

    /**
     * Deletes a client plan.
     * Only allowed if no subscriptions reference this plan.
     */
    fun deletePlan(id: UUID) {
        if (!clientPlanRepository.existsById(id)) {
            throw NoSuchElementException("Client plan not found: $id")
        }

        // Check for subscriptions using this plan
        val subscriptions = clientSubscriptionRepository.findByClientPlanId(id, PageRequest.of(0, 1))
        if (subscriptions.hasContent()) {
            throw IllegalStateException(
                "Cannot delete client plan with existing subscriptions. " +
                "Please cancel or change plan for all subscriptions first."
            )
        }

        clientPlanRepository.deleteById(id)
    }

    /**
     * Checks if a plan exists.
     */
    @Transactional(readOnly = true)
    fun existsById(id: UUID): Boolean {
        return clientPlanRepository.existsById(id)
    }
}
