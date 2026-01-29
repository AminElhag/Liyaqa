package com.liyaqa.membership.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.annotations.ParamDef
import org.hibernate.type.SqlTypes
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

@Entity
@Table(name = "member_onboardings")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class MemberOnboarding(
    id: UUID = UUID.randomUUID(),

    @Column(name = "member_id", nullable = false, unique = true)
    val memberId: UUID,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "steps", columnDefinition = "jsonb", nullable = false)
    var steps: MutableMap<OnboardingStep, StepStatus> = mutableMapOf(),

    @Enumerated(EnumType.STRING)
    @Column(name = "current_step")
    var currentStep: OnboardingStep? = null,

    @Column(name = "started_at", nullable = false)
    val startedAt: Instant = Instant.now(),

    @Column(name = "completed_at")
    var completedAt: Instant? = null,

    @Column(name = "assigned_to_user_id")
    var assignedToUserId: UUID? = null,

    @Column(name = "notes", columnDefinition = "TEXT")
    var notes: String? = null

) : BaseEntity(id) {

    /**
     * Initializes the onboarding with all steps in PENDING status.
     */
    fun initialize() {
        OnboardingStep.entries.forEach { step ->
            steps[step] = StepStatus(status = StepCompletionStatus.PENDING)
        }
        currentStep = OnboardingStep.WELCOME_EMAIL
    }

    /**
     * Marks a step as completed.
     */
    fun completeStep(step: OnboardingStep, completedByUserId: UUID? = null, notes: String? = null) {
        steps[step] = StepStatus(
            status = StepCompletionStatus.COMPLETED,
            completedAt = Instant.now(),
            completedByUserId = completedByUserId,
            notes = notes
        )

        // Move to next step
        val nextStep = getNextIncompleteStep()
        currentStep = nextStep

        // Check if all steps are complete
        if (isComplete()) {
            completedAt = Instant.now()
        }
    }

    /**
     * Marks a step as skipped.
     */
    fun skipStep(step: OnboardingStep, reason: String? = null) {
        steps[step] = StepStatus(
            status = StepCompletionStatus.SKIPPED,
            completedAt = Instant.now(),
            notes = reason
        )

        // Move to next step
        val nextStep = getNextIncompleteStep()
        currentStep = nextStep

        // Check if all steps are complete
        if (isComplete()) {
            completedAt = Instant.now()
        }
    }

    /**
     * Checks if all steps are completed or skipped.
     */
    fun isComplete(): Boolean {
        return OnboardingStep.entries.all { step ->
            val status = steps[step]?.status
            status == StepCompletionStatus.COMPLETED || status == StepCompletionStatus.SKIPPED
        }
    }

    /**
     * Gets the next incomplete step.
     */
    fun getNextIncompleteStep(): OnboardingStep? {
        return OnboardingStep.entries.firstOrNull { step ->
            steps[step]?.status == StepCompletionStatus.PENDING || steps[step] == null
        }
    }

    /**
     * Gets the completion percentage.
     */
    fun getCompletionPercentage(): Int {
        val totalSteps = OnboardingStep.entries.size
        val completedSteps = steps.values.count {
            it.status == StepCompletionStatus.COMPLETED || it.status == StepCompletionStatus.SKIPPED
        }
        return if (totalSteps > 0) ((completedSteps.toDouble() / totalSteps) * 100).toInt() else 0
    }

    /**
     * Gets the number of days since onboarding started.
     */
    fun getDaysSinceStart(): Long {
        return ChronoUnit.DAYS.between(startedAt, Instant.now())
    }

    /**
     * Checks if onboarding is overdue (more than 30 days).
     */
    fun isOverdue(): Boolean {
        return !isComplete() && getDaysSinceStart() > 30
    }

    /**
     * Assigns a staff member to oversee this onboarding.
     */
    fun assignTo(userId: UUID) {
        this.assignedToUserId = userId
    }

    /**
     * Gets the status of a specific step.
     */
    fun getStepStatus(step: OnboardingStep): StepStatus? {
        return steps[step]
    }

    /**
     * Gets all completed steps.
     */
    fun getCompletedSteps(): List<OnboardingStep> {
        return steps.filter { it.value.status == StepCompletionStatus.COMPLETED }.keys.toList()
    }

    /**
     * Gets all pending steps.
     */
    fun getPendingSteps(): List<OnboardingStep> {
        return OnboardingStep.entries.filter { step ->
            steps[step]?.status == StepCompletionStatus.PENDING || steps[step] == null
        }
    }

    companion object {
        /**
         * Creates a new onboarding journey for a member.
         */
        fun createForMember(memberId: UUID, assignedToUserId: UUID? = null): MemberOnboarding {
            val onboarding = MemberOnboarding(
                memberId = memberId,
                assignedToUserId = assignedToUserId
            )
            onboarding.initialize()
            return onboarding
        }
    }
}

enum class OnboardingStep {
    WELCOME_EMAIL,       // Day 0: Send welcome email
    FACILITY_TOUR,       // Day 1-3: Complete facility tour
    FITNESS_ASSESSMENT,  // Day 1-7: Optional fitness assessment
    FIRST_WORKOUT,       // Day 1-7: Log first workout
    APP_SETUP,           // Day 0-3: Help set up mobile app
    PROFILE_PHOTO,       // Day 0-7: Upload profile photo
    DAY7_CHECKIN,        // Day 7: Check-in call
    DAY14_PROGRESS,      // Day 14: Progress check
    DAY30_REVIEW         // Day 30: Final onboarding review
}

enum class StepCompletionStatus {
    PENDING,
    IN_PROGRESS,
    COMPLETED,
    SKIPPED
}

data class StepStatus(
    val status: StepCompletionStatus = StepCompletionStatus.PENDING,
    val completedAt: Instant? = null,
    val completedByUserId: UUID? = null,
    val notes: String? = null
)
