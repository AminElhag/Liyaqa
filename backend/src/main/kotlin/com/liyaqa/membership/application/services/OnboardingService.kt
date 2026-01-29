package com.liyaqa.membership.application.services

import com.liyaqa.membership.domain.model.MemberOnboarding
import com.liyaqa.membership.domain.model.OnboardingStep
import com.liyaqa.membership.domain.ports.MemberOnboardingRepository
import com.liyaqa.membership.domain.ports.MemberRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

data class OnboardingStats(
    val totalIncomplete: Long,
    val totalOverdue: Long,
    val myIncomplete: Long,
    val averageCompletionDays: Double
)

@Service("memberOnboardingService")
@Transactional
class OnboardingService(
    private val onboardingRepository: MemberOnboardingRepository,
    private val memberRepository: MemberRepository
) {
    private val logger = LoggerFactory.getLogger(OnboardingService::class.java)

    /**
     * Creates an onboarding journey for a new member.
     */
    fun createOnboarding(memberId: UUID, assignedToUserId: UUID? = null): MemberOnboarding {
        // Check if onboarding already exists
        if (onboardingRepository.existsByMemberId(memberId)) {
            throw IllegalStateException("Onboarding already exists for member: $memberId")
        }

        // Verify member exists
        memberRepository.findById(memberId).orElseThrow {
            NoSuchElementException("Member not found: $memberId")
        }

        val onboarding = MemberOnboarding.createForMember(memberId, assignedToUserId)
        val saved = onboardingRepository.save(onboarding)

        logger.info("Created onboarding for member $memberId")
        return saved
    }

    /**
     * Creates an onboarding journey for a member if one doesn't exist.
     */
    fun createOnboardingIfNotExists(memberId: UUID, assignedToUserId: UUID? = null): MemberOnboarding {
        return onboardingRepository.findByMemberId(memberId).orElseGet {
            createOnboarding(memberId, assignedToUserId)
        }
    }

    /**
     * Gets the onboarding for a member.
     */
    @Transactional(readOnly = true)
    fun getOnboarding(memberId: UUID): MemberOnboarding? {
        return onboardingRepository.findByMemberId(memberId).orElse(null)
    }

    /**
     * Gets the onboarding by ID.
     */
    @Transactional(readOnly = true)
    fun getOnboardingById(id: UUID): MemberOnboarding {
        return onboardingRepository.findById(id).orElseThrow {
            NoSuchElementException("Onboarding not found: $id")
        }
    }

    /**
     * Completes an onboarding step.
     */
    fun completeStep(
        memberId: UUID,
        step: OnboardingStep,
        completedByUserId: UUID? = null,
        notes: String? = null
    ): MemberOnboarding {
        val onboarding = onboardingRepository.findByMemberId(memberId).orElseThrow {
            NoSuchElementException("Onboarding not found for member: $memberId")
        }

        onboarding.completeStep(step, completedByUserId, notes)
        val saved = onboardingRepository.save(onboarding)

        logger.info("Completed onboarding step $step for member $memberId")

        if (saved.isComplete()) {
            logger.info("Onboarding completed for member $memberId")
        }

        return saved
    }

    /**
     * Skips an onboarding step.
     */
    fun skipStep(memberId: UUID, step: OnboardingStep, reason: String? = null): MemberOnboarding {
        val onboarding = onboardingRepository.findByMemberId(memberId).orElseThrow {
            NoSuchElementException("Onboarding not found for member: $memberId")
        }

        onboarding.skipStep(step, reason)
        val saved = onboardingRepository.save(onboarding)

        logger.info("Skipped onboarding step $step for member $memberId")
        return saved
    }

    /**
     * Assigns an onboarding to a staff member.
     */
    fun assignOnboarding(memberId: UUID, assigneeUserId: UUID): MemberOnboarding {
        val onboarding = onboardingRepository.findByMemberId(memberId).orElseThrow {
            NoSuchElementException("Onboarding not found for member: $memberId")
        }

        onboarding.assignTo(assigneeUserId)
        val saved = onboardingRepository.save(onboarding)

        logger.info("Assigned onboarding for member $memberId to user $assigneeUserId")
        return saved
    }

    /**
     * Updates onboarding notes.
     */
    fun updateNotes(memberId: UUID, notes: String): MemberOnboarding {
        val onboarding = onboardingRepository.findByMemberId(memberId).orElseThrow {
            NoSuchElementException("Onboarding not found for member: $memberId")
        }

        onboarding.notes = notes
        return onboardingRepository.save(onboarding)
    }

    /**
     * Gets incomplete onboardings.
     */
    @Transactional(readOnly = true)
    fun getIncompleteOnboardings(pageable: Pageable): Page<MemberOnboarding> {
        return onboardingRepository.findIncomplete(pageable)
    }

    /**
     * Gets incomplete onboardings assigned to a user.
     */
    @Transactional(readOnly = true)
    fun getMyIncompleteOnboardings(userId: UUID, pageable: Pageable): Page<MemberOnboarding> {
        return onboardingRepository.findIncompleteByAssignee(userId, pageable)
    }

    /**
     * Gets overdue onboardings (more than 30 days).
     */
    @Transactional(readOnly = true)
    fun getOverdueOnboardings(pageable: Pageable): Page<MemberOnboarding> {
        return onboardingRepository.findOverdue(30, pageable)
    }

    /**
     * Gets recently started onboardings.
     */
    @Transactional(readOnly = true)
    fun getRecentOnboardings(days: Long, pageable: Pageable): Page<MemberOnboarding> {
        val since = Instant.now().minus(days, ChronoUnit.DAYS)
        return onboardingRepository.findRecentlyStarted(since, pageable)
    }

    /**
     * Gets onboarding statistics.
     */
    @Transactional(readOnly = true)
    fun getOnboardingStats(userId: UUID? = null): OnboardingStats {
        val totalIncomplete = onboardingRepository.countIncomplete()
        val totalOverdue = onboardingRepository.countOverdue(30)
        val myIncomplete = userId?.let { onboardingRepository.countIncompleteByAssignee(it) } ?: 0L

        return OnboardingStats(
            totalIncomplete = totalIncomplete,
            totalOverdue = totalOverdue,
            myIncomplete = myIncomplete,
            averageCompletionDays = 0.0 // Would need additional calculation
        )
    }

    /**
     * Checks if a member is in onboarding (first 30 days and not complete).
     */
    @Transactional(readOnly = true)
    fun isInOnboarding(memberId: UUID): Boolean {
        val onboarding = onboardingRepository.findByMemberId(memberId).orElse(null)
            ?: return false
        return !onboarding.isComplete() && onboarding.getDaysSinceStart() <= 30
    }
}
