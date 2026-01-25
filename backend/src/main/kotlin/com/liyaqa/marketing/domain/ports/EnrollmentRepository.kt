package com.liyaqa.marketing.domain.ports

import com.liyaqa.marketing.domain.model.CampaignEnrollment
import com.liyaqa.marketing.domain.model.EnrollmentStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.Optional
import java.util.UUID

/**
 * Port for campaign enrollment persistence operations.
 */
interface EnrollmentRepository {
    fun save(enrollment: CampaignEnrollment): CampaignEnrollment
    fun saveAll(enrollments: List<CampaignEnrollment>): List<CampaignEnrollment>
    fun findById(id: UUID): Optional<CampaignEnrollment>
    fun deleteById(id: UUID)
    fun existsById(id: UUID): Boolean

    /**
     * Find enrollments by campaign.
     */
    fun findByCampaignId(campaignId: UUID, pageable: Pageable): Page<CampaignEnrollment>

    /**
     * Find active enrollments by campaign.
     */
    fun findActiveByCampaignId(campaignId: UUID, pageable: Pageable): Page<CampaignEnrollment>

    /**
     * Find enrollments by member.
     */
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<CampaignEnrollment>

    /**
     * Find active enrollment for member in campaign.
     */
    fun findActiveByMemberIdAndCampaignId(memberId: UUID, campaignId: UUID): Optional<CampaignEnrollment>

    /**
     * Check if member is enrolled in campaign.
     */
    fun existsByMemberIdAndCampaignIdAndStatus(
        memberId: UUID,
        campaignId: UUID,
        status: EnrollmentStatus
    ): Boolean

    /**
     * Find enrollments with next step due.
     */
    fun findWithNextStepDueBefore(dueTime: Instant, pageable: Pageable): Page<CampaignEnrollment>

    /**
     * Find active enrollments with next step due.
     */
    fun findActiveWithNextStepDueBefore(dueTime: Instant, pageable: Pageable): Page<CampaignEnrollment>

    /**
     * Count enrollments by campaign and status.
     */
    fun countByCampaignIdAndStatus(campaignId: UUID, status: EnrollmentStatus): Long

    /**
     * Count total enrollments by campaign.
     */
    fun countByCampaignId(campaignId: UUID): Long

    /**
     * Find enrollments by status.
     */
    fun findByStatus(status: EnrollmentStatus, pageable: Pageable): Page<CampaignEnrollment>

    /**
     * Cancel all active enrollments for a campaign.
     */
    fun cancelAllByCampaignId(campaignId: UUID): Int
}
