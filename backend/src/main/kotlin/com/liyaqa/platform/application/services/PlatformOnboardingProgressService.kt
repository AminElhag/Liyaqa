package com.liyaqa.platform.application.services

import com.liyaqa.platform.domain.model.OnboardingPhase
import com.liyaqa.platform.domain.model.OnboardingProgress
import com.liyaqa.platform.domain.model.OnboardingStep
import com.liyaqa.platform.domain.model.UnlockableFeature
import com.liyaqa.platform.domain.ports.OnboardingProgressRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

/**
 * Service for managing client onboarding progress.
 * Handles gamified onboarding with steps, points, and feature unlocking.
 */
@Service("platformOnboardingProgressService")
@Transactional
class PlatformOnboardingProgressService(
    private val onboardingProgressRepository: OnboardingProgressRepository
) {
    /**
     * Creates onboarding progress for a new organization.
     */
    fun createOnboarding(organizationId: UUID, clubId: UUID? = null): OnboardingProgress {
        // Check if already exists
        if (onboardingProgressRepository.existsByOrganizationId(organizationId)) {
            throw IllegalStateException("Onboarding progress already exists for organization: $organizationId")
        }

        val progress = OnboardingProgress.createForOrganization(organizationId, clubId)
        return onboardingProgressRepository.save(progress)
    }

    /**
     * Gets onboarding progress for an organization.
     */
    @Transactional(readOnly = true)
    fun getByOrganizationId(organizationId: UUID): OnboardingProgress {
        return onboardingProgressRepository.findByOrganizationId(organizationId)
            .orElseThrow { NoSuchElementException("Onboarding progress not found for organization: $organizationId") }
    }

    /**
     * Gets onboarding progress by ID.
     */
    @Transactional(readOnly = true)
    fun getById(id: UUID): OnboardingProgress {
        return onboardingProgressRepository.findById(id)
            .orElseThrow { NoSuchElementException("Onboarding progress not found: $id") }
    }

    /**
     * Completes an onboarding step.
     */
    fun completeStep(organizationId: UUID, step: OnboardingStep): OnboardingProgress {
        val progress = getByOrganizationId(organizationId)
        val wasNewlyCompleted = progress.completeStep(step)

        if (wasNewlyCompleted) {
            progress.updateDaysActive()
            return onboardingProgressRepository.save(progress)
        }

        return progress
    }

    /**
     * Completes multiple onboarding steps at once.
     */
    fun completeSteps(organizationId: UUID, steps: List<OnboardingStep>): OnboardingProgress {
        val progress = getByOrganizationId(organizationId)
        val completedCount = progress.completeSteps(steps)

        if (completedCount > 0) {
            progress.updateDaysActive()
            return onboardingProgressRepository.save(progress)
        }

        return progress
    }

    /**
     * Uncompletes a step (if conditions are no longer met).
     */
    fun uncompleteStep(organizationId: UUID, step: OnboardingStep): OnboardingProgress {
        val progress = getByOrganizationId(organizationId)
        if (progress.uncompleteStep(step)) {
            return onboardingProgressRepository.save(progress)
        }
        return progress
    }

    /**
     * Manually unlocks a feature (admin override).
     */
    fun unlockFeature(organizationId: UUID, feature: UnlockableFeature): OnboardingProgress {
        val progress = getByOrganizationId(organizationId)
        progress.unlockFeature(feature)
        return onboardingProgressRepository.save(progress)
    }

    /**
     * Gets the onboarding summary for an organization.
     */
    @Transactional(readOnly = true)
    fun getOnboardingSummary(organizationId: UUID): OnboardingSummary {
        val progress = getByOrganizationId(organizationId)

        return OnboardingSummary(
            organizationId = organizationId,
            totalPoints = progress.totalPoints,
            maxPoints = OnboardingProgress.MAX_POINTS,
            progressPercent = progress.progressPercent,
            currentPhase = progress.currentPhase,
            completedSteps = progress.completedSteps.toList(),
            remainingSteps = progress.getRemainingSteps().toList(),
            isComplete = progress.isComplete(),
            daysActive = progress.daysActive,
            unlockedFeatures = progress.getUnlockedFeatures().toList(),
            isStalled = progress.isStalled()
        )
    }

    /**
     * Gets all incomplete onboarding records.
     */
    @Transactional(readOnly = true)
    fun getIncomplete(pageable: Pageable): Page<OnboardingProgress> {
        return onboardingProgressRepository.findIncomplete(pageable)
    }

    /**
     * Gets all stalled onboarding records.
     */
    @Transactional(readOnly = true)
    fun getStalled(stalledDays: Int, pageable: Pageable): Page<OnboardingProgress> {
        val stalledSince = Instant.now().minus(stalledDays.toLong(), ChronoUnit.DAYS)
        return onboardingProgressRepository.findStalled(stalledSince, pageable)
    }

    /**
     * Gets onboarding by phase.
     */
    @Transactional(readOnly = true)
    fun getByPhase(phase: OnboardingPhase, pageable: Pageable): Page<OnboardingProgress> {
        return onboardingProgressRepository.findByCurrentPhase(phase, pageable)
    }

    /**
     * Gets onboarding statistics.
     */
    @Transactional(readOnly = true)
    fun getStatistics(): OnboardingStatistics {
        return OnboardingStatistics(
            total = onboardingProgressRepository.count(),
            complete = onboardingProgressRepository.countComplete(),
            incomplete = onboardingProgressRepository.countIncomplete(),
            gettingStarted = onboardingProgressRepository.countByCurrentPhase(OnboardingPhase.GETTING_STARTED),
            coreSetup = onboardingProgressRepository.countByCurrentPhase(OnboardingPhase.CORE_SETUP),
            operations = onboardingProgressRepository.countByCurrentPhase(OnboardingPhase.OPERATIONS)
        )
    }

    /**
     * Checks if email has been verified and updates onboarding.
     */
    fun markEmailVerified(organizationId: UUID): OnboardingProgress {
        return completeStep(organizationId, OnboardingStep.EMAIL_VERIFIED)
    }

    /**
     * Checks if profile is complete and updates onboarding.
     */
    fun markProfileCompleted(organizationId: UUID): OnboardingProgress {
        return completeStep(organizationId, OnboardingStep.PROFILE_COMPLETED)
    }

    /**
     * Updates onboarding when first location is added.
     */
    fun onLocationAdded(organizationId: UUID): OnboardingProgress {
        return completeStep(organizationId, OnboardingStep.FIRST_LOCATION_ADDED)
    }

    /**
     * Updates onboarding when membership plans are created.
     */
    fun onMembershipPlansCreated(organizationId: UUID): OnboardingProgress {
        return completeStep(organizationId, OnboardingStep.MEMBERSHIP_PLANS_CREATED)
    }

    /**
     * Updates onboarding when first member is added.
     */
    fun onFirstMemberAdded(organizationId: UUID): OnboardingProgress {
        return completeStep(organizationId, OnboardingStep.FIRST_MEMBER_ADDED)
    }

    /**
     * Updates onboarding when members are imported.
     */
    fun onMembersImported(organizationId: UUID): OnboardingProgress {
        return completeSteps(organizationId, listOf(
            OnboardingStep.FIRST_MEMBER_ADDED,
            OnboardingStep.MEMBERS_IMPORTED
        ))
    }

    /**
     * Updates onboarding when payment gateway is connected.
     */
    fun onPaymentGatewayConnected(organizationId: UUID): OnboardingProgress {
        return completeStep(organizationId, OnboardingStep.PAYMENT_GATEWAY_CONNECTED)
    }

    /**
     * Updates onboarding when first payment is received.
     */
    fun onFirstPaymentReceived(organizationId: UUID): OnboardingProgress {
        return completeStep(organizationId, OnboardingStep.FIRST_PAYMENT_RECEIVED)
    }

    /**
     * Updates onboarding when access control is configured.
     */
    fun onAccessControlConfigured(organizationId: UUID): OnboardingProgress {
        return completeStep(organizationId, OnboardingStep.ACCESS_CONTROL_CONFIGURED)
    }

    /**
     * Updates onboarding when first class is scheduled.
     */
    fun onFirstClassScheduled(organizationId: UUID): OnboardingProgress {
        return completeStep(organizationId, OnboardingStep.FIRST_CLASS_SCHEDULED)
    }

    /**
     * Updates onboarding when staff is invited.
     */
    fun onStaffInvited(organizationId: UUID): OnboardingProgress {
        return completeStep(organizationId, OnboardingStep.STAFF_INVITED)
    }

    /**
     * Updates onboarding when mobile app is configured.
     */
    fun onMobileAppConfigured(organizationId: UUID): OnboardingProgress {
        return completeStep(organizationId, OnboardingStep.MOBILE_APP_CONFIGURED)
    }
}

/**
 * Summary of onboarding progress for display.
 */
data class OnboardingSummary(
    val organizationId: UUID,
    val totalPoints: Int,
    val maxPoints: Int,
    val progressPercent: Int,
    val currentPhase: OnboardingPhase,
    val completedSteps: List<OnboardingStep>,
    val remainingSteps: List<OnboardingStep>,
    val isComplete: Boolean,
    val daysActive: Int,
    val unlockedFeatures: List<UnlockableFeature>,
    val isStalled: Boolean
)

/**
 * Onboarding statistics for platform dashboard.
 */
data class OnboardingStatistics(
    val total: Long,
    val complete: Long,
    val incomplete: Long,
    val gettingStarted: Long,
    val coreSetup: Long,
    val operations: Long
) {
    val completionRate: Double
        get() = if (total > 0) complete.toDouble() / total * 100 else 0.0
}
