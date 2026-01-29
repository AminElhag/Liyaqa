package com.liyaqa.membership.api

import com.liyaqa.membership.application.services.OnboardingStats
import com.liyaqa.membership.domain.model.MemberOnboarding
import com.liyaqa.membership.domain.model.OnboardingStep
import com.liyaqa.membership.domain.model.StepCompletionStatus
import com.liyaqa.membership.domain.model.StepStatus
import jakarta.validation.constraints.NotNull
import java.time.Instant
import java.util.UUID

data class CreateOnboardingRequest(
    @field:NotNull(message = "Member ID is required")
    val memberId: UUID,

    val assignedToUserId: UUID? = null
)

data class CompleteStepRequest(
    @field:NotNull(message = "Step is required")
    val step: OnboardingStep,

    val notes: String? = null
)

data class SkipStepRequest(
    @field:NotNull(message = "Step is required")
    val step: OnboardingStep,

    val reason: String? = null
)

data class AssignOnboardingRequest(
    @field:NotNull(message = "Assignee user ID is required")
    val assigneeUserId: UUID
)

data class UpdateOnboardingNotesRequest(
    val notes: String
)

data class OnboardingResponse(
    val id: UUID,
    val memberId: UUID,
    val memberName: String?,
    val steps: Map<OnboardingStep, StepStatusResponse>,
    val currentStep: OnboardingStep?,
    val startedAt: Instant,
    val completedAt: Instant?,
    val assignedToUserId: UUID?,
    val assignedToName: String?,
    val notes: String?,
    val isComplete: Boolean,
    val completionPercentage: Int,
    val daysSinceStart: Long,
    val isOverdue: Boolean,
    val pendingSteps: List<OnboardingStep>,
    val completedSteps: List<OnboardingStep>
) {
    companion object {
        fun from(
            onboarding: MemberOnboarding,
            memberName: String? = null,
            assignedToName: String? = null
        ): OnboardingResponse = OnboardingResponse(
            id = onboarding.id,
            memberId = onboarding.memberId,
            memberName = memberName,
            steps = onboarding.steps.mapValues { StepStatusResponse.from(it.value) },
            currentStep = onboarding.currentStep,
            startedAt = onboarding.startedAt,
            completedAt = onboarding.completedAt,
            assignedToUserId = onboarding.assignedToUserId,
            assignedToName = assignedToName,
            notes = onboarding.notes,
            isComplete = onboarding.isComplete(),
            completionPercentage = onboarding.getCompletionPercentage(),
            daysSinceStart = onboarding.getDaysSinceStart(),
            isOverdue = onboarding.isOverdue(),
            pendingSteps = onboarding.getPendingSteps(),
            completedSteps = onboarding.getCompletedSteps()
        )
    }
}

data class StepStatusResponse(
    val status: StepCompletionStatus,
    val completedAt: Instant?,
    val completedByUserId: UUID?,
    val notes: String?
) {
    companion object {
        fun from(stepStatus: StepStatus): StepStatusResponse = StepStatusResponse(
            status = stepStatus.status,
            completedAt = stepStatus.completedAt,
            completedByUserId = stepStatus.completedByUserId,
            notes = stepStatus.notes
        )
    }
}

data class OnboardingStatsResponse(
    val totalIncomplete: Long,
    val totalOverdue: Long,
    val myIncomplete: Long,
    val averageCompletionDays: Double
) {
    companion object {
        fun from(stats: OnboardingStats): OnboardingStatsResponse = OnboardingStatsResponse(
            totalIncomplete = stats.totalIncomplete,
            totalOverdue = stats.totalOverdue,
            myIncomplete = stats.myIncomplete,
            averageCompletionDays = stats.averageCompletionDays
        )
    }
}

data class OnboardingChecklistItem(
    val step: OnboardingStep,
    val title: String,
    val description: String,
    val dayRange: String,
    val status: StepCompletionStatus,
    val completedAt: Instant?
)

data class OnboardingChecklistResponse(
    val memberId: UUID,
    val memberName: String?,
    val startedAt: Instant,
    val completionPercentage: Int,
    val items: List<OnboardingChecklistItem>
) {
    companion object {
        fun from(onboarding: MemberOnboarding, memberName: String? = null): OnboardingChecklistResponse {
            val items = OnboardingStep.entries.map { step ->
                val stepStatus = onboarding.steps[step]
                OnboardingChecklistItem(
                    step = step,
                    title = getStepTitle(step),
                    description = getStepDescription(step),
                    dayRange = getStepDayRange(step),
                    status = stepStatus?.status ?: StepCompletionStatus.PENDING,
                    completedAt = stepStatus?.completedAt
                )
            }
            return OnboardingChecklistResponse(
                memberId = onboarding.memberId,
                memberName = memberName,
                startedAt = onboarding.startedAt,
                completionPercentage = onboarding.getCompletionPercentage(),
                items = items
            )
        }

        private fun getStepTitle(step: OnboardingStep): String = when (step) {
            OnboardingStep.WELCOME_EMAIL -> "Welcome Email Sent"
            OnboardingStep.FACILITY_TOUR -> "Facility Tour Completed"
            OnboardingStep.FITNESS_ASSESSMENT -> "Fitness Assessment Scheduled"
            OnboardingStep.FIRST_WORKOUT -> "First Workout Logged"
            OnboardingStep.APP_SETUP -> "App Downloaded & Set Up"
            OnboardingStep.PROFILE_PHOTO -> "Profile Photo Uploaded"
            OnboardingStep.DAY7_CHECKIN -> "Day 7 Check-in Call"
            OnboardingStep.DAY14_PROGRESS -> "Day 14 Progress Check"
            OnboardingStep.DAY30_REVIEW -> "Day 30 Onboarding Complete"
        }

        private fun getStepDescription(step: OnboardingStep): String = when (step) {
            OnboardingStep.WELCOME_EMAIL -> "Send welcome email with gym info and first steps"
            OnboardingStep.FACILITY_TOUR -> "Complete guided tour of all facilities"
            OnboardingStep.FITNESS_ASSESSMENT -> "Optional fitness assessment with trainer"
            OnboardingStep.FIRST_WORKOUT -> "Member completes their first workout"
            OnboardingStep.APP_SETUP -> "Help member set up mobile app and credentials"
            OnboardingStep.PROFILE_PHOTO -> "Member uploads their profile photo"
            OnboardingStep.DAY7_CHECKIN -> "Call to check how their first week went"
            OnboardingStep.DAY14_PROGRESS -> "Check on progress and answer questions"
            OnboardingStep.DAY30_REVIEW -> "Final review and graduation from onboarding"
        }

        private fun getStepDayRange(step: OnboardingStep): String = when (step) {
            OnboardingStep.WELCOME_EMAIL -> "Day 0"
            OnboardingStep.FACILITY_TOUR -> "Day 1-3"
            OnboardingStep.FITNESS_ASSESSMENT -> "Day 1-7"
            OnboardingStep.FIRST_WORKOUT -> "Day 1-7"
            OnboardingStep.APP_SETUP -> "Day 0-3"
            OnboardingStep.PROFILE_PHOTO -> "Day 0-7"
            OnboardingStep.DAY7_CHECKIN -> "Day 7"
            OnboardingStep.DAY14_PROGRESS -> "Day 14"
            OnboardingStep.DAY30_REVIEW -> "Day 30"
        }
    }
}
