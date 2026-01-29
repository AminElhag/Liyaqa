package com.liyaqa.platform.domain.model

import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.CollectionTable
import jakarta.persistence.Column
import jakarta.persistence.ElementCollection
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.Table
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

/**
 * Tracks a client's onboarding progress through the platform setup process.
 * Used for gamified onboarding with points, phases, and feature unlocking.
 *
 * This is a platform-level entity that tracks B2B client onboarding.
 * Each organization has one OnboardingProgress record.
 */
@Entity
@Table(name = "onboarding_progress")
class OnboardingProgress(
    id: UUID = UUID.randomUUID(),

    /**
     * The organization (client) this progress belongs to.
     */
    @Column(name = "organization_id", nullable = false, unique = true)
    var organizationId: UUID,

    /**
     * The club this progress is specifically for (optional, for multi-club orgs).
     * Null means organization-level progress.
     */
    @Column(name = "club_id")
    var clubId: UUID? = null,

    /**
     * Set of completed onboarding steps.
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "onboarding_completed_steps",
        joinColumns = [JoinColumn(name = "onboarding_progress_id")]
    )
    @Column(name = "step")
    @Enumerated(EnumType.STRING)
    var completedSteps: MutableSet<OnboardingStep> = mutableSetOf(),

    /**
     * Current total points accumulated.
     */
    @Column(name = "total_points", nullable = false)
    var totalPoints: Int = 0,

    /**
     * Current progress percentage (0-100).
     */
    @Column(name = "progress_percent", nullable = false)
    var progressPercent: Int = 0,

    /**
     * Current onboarding phase.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "current_phase", nullable = false)
    var currentPhase: OnboardingPhase = OnboardingPhase.GETTING_STARTED,

    /**
     * When onboarding started.
     */
    @Column(name = "started_at", nullable = false)
    var startedAt: Instant = Instant.now(),

    /**
     * When onboarding was completed (null if not completed).
     */
    @Column(name = "completed_at")
    var completedAt: Instant? = null,

    /**
     * Number of days the client has been active in onboarding.
     */
    @Column(name = "days_active", nullable = false)
    var daysActive: Int = 1,

    /**
     * Last activity timestamp during onboarding.
     */
    @Column(name = "last_activity_at")
    var lastActivityAt: Instant? = null,

    /**
     * Whether marketing suite has been unlocked.
     */
    @Column(name = "marketing_unlocked", nullable = false)
    var marketingUnlocked: Boolean = false,

    /**
     * Whether advanced reports have been unlocked.
     */
    @Column(name = "reports_unlocked", nullable = false)
    var reportsUnlocked: Boolean = false,

    /**
     * Whether API access has been unlocked.
     */
    @Column(name = "api_unlocked", nullable = false)
    var apiUnlocked: Boolean = false

) : OrganizationLevelEntity(id) {

    companion object {
        /** Maximum possible points from all steps */
        val MAX_POINTS = OnboardingStep.entries.sumOf { it.points }

        /** Points threshold for completing core setup (unlocks marketing) */
        const val CORE_SETUP_THRESHOLD = 60

        /** Points threshold for completing operations (unlocks reports) */
        const val OPERATIONS_THRESHOLD = 90

        /**
         * Creates new onboarding progress for an organization.
         * Automatically marks ACCOUNT_CREATED as complete.
         */
        fun createForOrganization(
            organizationId: UUID,
            clubId: UUID? = null
        ): OnboardingProgress {
            val progress = OnboardingProgress(
                organizationId = organizationId,
                clubId = clubId,
                startedAt = Instant.now()
            )
            // Account created is automatically complete
            progress.completeStep(OnboardingStep.ACCOUNT_CREATED)
            return progress
        }
    }

    // ============================================
    // Domain Methods - Step Completion
    // ============================================

    /**
     * Marks a step as completed and updates progress.
     * Returns true if the step was newly completed, false if already done.
     */
    fun completeStep(step: OnboardingStep): Boolean {
        if (completedSteps.contains(step)) {
            return false
        }

        completedSteps.add(step)
        totalPoints += step.points
        lastActivityAt = Instant.now()

        // Update progress percentage
        progressPercent = ((totalPoints.toDouble() / MAX_POINTS) * 100).toInt()
            .coerceIn(0, 100)

        // Update phase
        updatePhase()

        // Check for feature unlocks
        checkFeatureUnlocks()

        // Check for completion
        if (progressPercent >= 100 && completedAt == null) {
            completedAt = Instant.now()
        }

        return true
    }

    /**
     * Marks multiple steps as completed at once.
     * Returns the number of newly completed steps.
     */
    fun completeSteps(steps: Collection<OnboardingStep>): Int {
        return steps.count { completeStep(it) }
    }

    /**
     * Removes a completed step (if requirements no longer met).
     */
    fun uncompleteStep(step: OnboardingStep): Boolean {
        if (!completedSteps.contains(step)) {
            return false
        }

        completedSteps.remove(step)
        totalPoints -= step.points
        totalPoints = totalPoints.coerceAtLeast(0)

        // Update progress percentage
        progressPercent = ((totalPoints.toDouble() / MAX_POINTS) * 100).toInt()
            .coerceIn(0, 100)

        // Update phase
        updatePhase()

        // Re-check unlocks (could lock features)
        checkFeatureUnlocks()

        // Clear completion if no longer complete
        if (progressPercent < 100) {
            completedAt = null
        }

        return true
    }

    // ============================================
    // Domain Methods - Phase Management
    // ============================================

    /**
     * Updates the current phase based on progress percentage.
     */
    private fun updatePhase() {
        currentPhase = when {
            progressPercent >= 100 -> OnboardingPhase.COMPLETE
            progressPercent >= 61 -> OnboardingPhase.OPERATIONS
            progressPercent >= 31 -> OnboardingPhase.CORE_SETUP
            else -> OnboardingPhase.GETTING_STARTED
        }
    }

    // ============================================
    // Domain Methods - Feature Unlocking
    // ============================================

    /**
     * Checks and updates feature unlock status based on progress.
     */
    private fun checkFeatureUnlocks() {
        // Marketing Suite unlocks at Core Setup completion (60+ points)
        if (totalPoints >= CORE_SETUP_THRESHOLD) {
            marketingUnlocked = true
        }

        // Advanced Reports unlock at Operations completion (90+ points)
        if (totalPoints >= OPERATIONS_THRESHOLD) {
            reportsUnlocked = true
        }

        // API Access unlocks at 100% completion
        if (progressPercent >= 100) {
            apiUnlocked = true
        }
    }

    /**
     * Manually unlocks a feature (admin override).
     */
    fun unlockFeature(feature: UnlockableFeature) {
        when (feature) {
            UnlockableFeature.MARKETING -> marketingUnlocked = true
            UnlockableFeature.REPORTS -> reportsUnlocked = true
            UnlockableFeature.API -> apiUnlocked = true
        }
    }

    // ============================================
    // Domain Methods - Queries
    // ============================================

    /**
     * Checks if a step has been completed.
     */
    fun isStepCompleted(step: OnboardingStep): Boolean =
        completedSteps.contains(step)

    /**
     * Checks if onboarding is complete.
     */
    fun isComplete(): Boolean = completedAt != null

    /**
     * Gets the remaining steps to complete.
     */
    fun getRemainingSteps(): Set<OnboardingStep> =
        OnboardingStep.entries.toSet() - completedSteps

    /**
     * Gets steps by category.
     */
    fun getStepsByCategory(category: OnboardingCategory): List<OnboardingStep> =
        OnboardingStep.entries.filter { it.category == category }

    /**
     * Gets completed steps by category.
     */
    fun getCompletedStepsByCategory(category: OnboardingCategory): Set<OnboardingStep> =
        completedSteps.filter { it.category == category }.toSet()

    /**
     * Gets progress percentage for a specific category.
     */
    fun getCategoryProgress(category: OnboardingCategory): Int {
        val categorySteps = getStepsByCategory(category)
        val completedCategorySteps = getCompletedStepsByCategory(category)
        if (categorySteps.isEmpty()) return 100
        return ((completedCategorySteps.size.toDouble() / categorySteps.size) * 100).toInt()
    }

    /**
     * Gets the number of days since onboarding started.
     */
    fun getDaysSinceStart(): Long =
        ChronoUnit.DAYS.between(startedAt, Instant.now())

    /**
     * Checks if onboarding is stalled (no activity in X days).
     */
    fun isStalled(inactiveDays: Int = 7): Boolean {
        if (isComplete()) return false
        val lastActivity = lastActivityAt ?: startedAt
        val daysSinceActivity = ChronoUnit.DAYS.between(lastActivity, Instant.now())
        return daysSinceActivity >= inactiveDays
    }

    /**
     * Updates the days active count.
     */
    fun updateDaysActive() {
        daysActive = getDaysSinceStart().toInt().coerceAtLeast(1)
    }

    /**
     * Gets a summary of unlocked features.
     */
    fun getUnlockedFeatures(): Set<UnlockableFeature> {
        val features = mutableSetOf<UnlockableFeature>()
        if (marketingUnlocked) features.add(UnlockableFeature.MARKETING)
        if (reportsUnlocked) features.add(UnlockableFeature.REPORTS)
        if (apiUnlocked) features.add(UnlockableFeature.API)
        return features
    }

}

/**
 * Features that can be unlocked through onboarding progress.
 */
enum class UnlockableFeature {
    MARKETING,
    REPORTS,
    API
}
