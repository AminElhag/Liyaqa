package com.liyaqa.platform.domain.ports

import com.liyaqa.platform.domain.model.OnboardingPhase
import com.liyaqa.platform.domain.model.OnboardingProgress
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.Optional
import java.util.UUID

/**
 * Repository port for OnboardingProgress entity.
 * Tracks client onboarding journey through the platform.
 */
interface OnboardingProgressRepository {
    fun save(progress: OnboardingProgress): OnboardingProgress
    fun findById(id: UUID): Optional<OnboardingProgress>
    fun findByOrganizationId(organizationId: UUID): Optional<OnboardingProgress>
    fun findByClubId(clubId: UUID): Optional<OnboardingProgress>
    fun findAll(pageable: Pageable): Page<OnboardingProgress>
    fun findByCurrentPhase(phase: OnboardingPhase, pageable: Pageable): Page<OnboardingProgress>
    fun findIncomplete(pageable: Pageable): Page<OnboardingProgress>
    fun findComplete(pageable: Pageable): Page<OnboardingProgress>
    fun findStalled(stalledSince: Instant, pageable: Pageable): Page<OnboardingProgress>
    fun existsById(id: UUID): Boolean
    fun existsByOrganizationId(organizationId: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long
    fun countByCurrentPhase(phase: OnboardingPhase): Long
    fun countComplete(): Long
    fun countIncomplete(): Long
}
