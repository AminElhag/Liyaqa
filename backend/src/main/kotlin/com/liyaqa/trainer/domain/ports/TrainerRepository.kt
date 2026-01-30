package com.liyaqa.trainer.domain.ports

import com.liyaqa.trainer.domain.model.*
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

/**
 * Port (interface) for trainer persistence operations.
 * Implementations are in the infrastructure layer.
 */
interface TrainerRepository {
    fun save(trainer: Trainer): Trainer
    fun findById(id: UUID): Optional<Trainer>
    fun findByUserId(userId: UUID): Optional<Trainer>
    fun findByUserIdAndOrganizationId(userId: UUID, organizationId: UUID): Optional<Trainer>
    fun findAll(pageable: Pageable): Page<Trainer>
    fun existsById(id: UUID): Boolean
    fun existsByUserId(userId: UUID): Boolean
    fun existsByUserIdAndOrganizationId(userId: UUID, organizationId: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long

    /**
     * Search trainers with various filters.
     * @param search Search term for name (via user) or specializations
     * @param status Filter by trainer status
     * @param trainerType Filter by trainer type
     */
    fun search(
        search: String?,
        status: TrainerStatus?,
        trainerType: TrainerType?,
        pageable: Pageable
    ): Page<Trainer>

    /**
     * Find trainers by organization ID (for cross-club queries).
     */
    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<Trainer>

    /**
     * Find all trainers assigned to a specific club.
     */
    fun findByClubId(clubId: UUID, pageable: Pageable): Page<Trainer>

    /**
     * Find all active trainers who can teach classes.
     */
    fun findActiveGroupFitnessTrainers(pageable: Pageable): Page<Trainer>

    /**
     * Find all active trainers who can provide personal training.
     */
    fun findActivePersonalTrainers(pageable: Pageable): Page<Trainer>

    /**
     * Find all trainers by a list of IDs.
     */
    fun findAllByIds(ids: List<UUID>): List<Trainer>
}

/**
 * Port for trainer-club assignment persistence operations.
 */
interface TrainerClubAssignmentRepository {
    fun save(assignment: TrainerClubAssignment): TrainerClubAssignment
    fun findById(id: UUID): Optional<TrainerClubAssignment>
    fun findByTrainerId(trainerId: UUID): List<TrainerClubAssignment>
    fun findByTrainerIdAndClubId(trainerId: UUID, clubId: UUID): Optional<TrainerClubAssignment>
    fun findByClubId(clubId: UUID): List<TrainerClubAssignment>
    fun findActiveByTrainerId(trainerId: UUID): List<TrainerClubAssignment>
    fun findActiveByClubId(clubId: UUID): List<TrainerClubAssignment>
    fun findPrimaryByTrainerId(trainerId: UUID): Optional<TrainerClubAssignment>
    fun existsByTrainerIdAndClubId(trainerId: UUID, clubId: UUID): Boolean
    fun deleteById(id: UUID)
    fun deleteByTrainerId(trainerId: UUID)
}

/**
 * Port for personal training session persistence operations.
 */
interface PersonalTrainingSessionRepository {
    fun save(session: PersonalTrainingSession): PersonalTrainingSession
    fun findById(id: UUID): Optional<PersonalTrainingSession>
    fun findAll(pageable: Pageable): Page<PersonalTrainingSession>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long

    /**
     * Find sessions by trainer with pagination.
     */
    fun findByTrainerId(trainerId: UUID, pageable: Pageable): Page<PersonalTrainingSession>

    /**
     * Find sessions by member with pagination.
     */
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<PersonalTrainingSession>

    /**
     * Find sessions by trainer and status.
     */
    fun findByTrainerIdAndStatus(trainerId: UUID, status: PTSessionStatus, pageable: Pageable): Page<PersonalTrainingSession>

    /**
     * Find sessions by member and status.
     */
    fun findByMemberIdAndStatus(memberId: UUID, status: PTSessionStatus, pageable: Pageable): Page<PersonalTrainingSession>

    /**
     * Find sessions for a trainer on a specific date.
     */
    fun findByTrainerIdAndSessionDate(trainerId: UUID, sessionDate: LocalDate): List<PersonalTrainingSession>

    /**
     * Find sessions for a member on a specific date.
     */
    fun findByMemberIdAndSessionDate(memberId: UUID, sessionDate: LocalDate): List<PersonalTrainingSession>

    /**
     * Find sessions between two dates.
     */
    fun findBySessionDateBetween(startDate: LocalDate, endDate: LocalDate, pageable: Pageable): Page<PersonalTrainingSession>

    /**
     * Find sessions for a trainer between two dates.
     */
    fun findByTrainerIdAndSessionDateBetween(
        trainerId: UUID,
        startDate: LocalDate,
        endDate: LocalDate,
        pageable: Pageable
    ): Page<PersonalTrainingSession>

    /**
     * Find pending (REQUESTED) sessions for a trainer.
     */
    fun findPendingByTrainerId(trainerId: UUID, pageable: Pageable): Page<PersonalTrainingSession>

    /**
     * Find upcoming (CONFIRMED) sessions for a trainer.
     */
    fun findUpcomingByTrainerId(trainerId: UUID, fromDate: LocalDate, pageable: Pageable): Page<PersonalTrainingSession>

    /**
     * Find upcoming sessions for a member.
     */
    fun findUpcomingByMemberId(memberId: UUID, fromDate: LocalDate, pageable: Pageable): Page<PersonalTrainingSession>

    /**
     * Check if a time slot is available for a trainer.
     * Returns true if no CONFIRMED or IN_PROGRESS sessions overlap.
     */
    fun isTimeSlotAvailable(trainerId: UUID, sessionDate: LocalDate, startTime: java.time.LocalTime, endTime: java.time.LocalTime): Boolean

    /**
     * Find sessions by a list of IDs.
     */
    fun findAllByIds(ids: List<UUID>): List<PersonalTrainingSession>
}

/**
 * Port for trainer-client relationship persistence operations.
 */
interface TrainerClientRepository {
    fun save(client: TrainerClient): TrainerClient
    fun findById(id: UUID): Optional<TrainerClient>
    fun findAll(pageable: Pageable): Page<TrainerClient>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long

    /**
     * Find client relationship by trainer and member.
     */
    fun findByTrainerIdAndMemberId(trainerId: UUID, memberId: UUID): Optional<TrainerClient>

    /**
     * Find all clients for a trainer.
     */
    fun findByTrainerId(trainerId: UUID, pageable: Pageable): Page<TrainerClient>

    /**
     * Find all clients for a trainer with specific status.
     */
    fun findByTrainerIdAndStatus(trainerId: UUID, status: TrainerClientStatus, pageable: Pageable): Page<TrainerClient>

    /**
     * Find all active clients for a trainer.
     */
    fun findActiveByTrainerId(trainerId: UUID, pageable: Pageable): Page<TrainerClient>

    /**
     * Find client relationships by member ID.
     */
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<TrainerClient>

    /**
     * Find clients by a list of IDs.
     */
    fun findAllByIds(ids: List<UUID>): List<TrainerClient>

    /**
     * Check if a trainer-member relationship exists.
     */
    fun existsByTrainerIdAndMemberId(trainerId: UUID, memberId: UUID): Boolean
}

/**
 * Port for trainer earnings persistence operations.
 */
interface TrainerEarningsRepository {
    fun save(earnings: TrainerEarnings): TrainerEarnings
    fun findById(id: UUID): Optional<TrainerEarnings>
    fun findAll(pageable: Pageable): Page<TrainerEarnings>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long

    /**
     * Find all earnings for a trainer.
     */
    fun findByTrainerId(trainerId: UUID, pageable: Pageable): Page<TrainerEarnings>

    /**
     * Find earnings by trainer and status.
     */
    fun findByTrainerIdAndStatus(trainerId: UUID, status: EarningStatus, pageable: Pageable): Page<TrainerEarnings>

    /**
     * Find earnings by trainer and date range.
     */
    fun findByTrainerIdAndEarningDateBetween(
        trainerId: UUID,
        startDate: LocalDate,
        endDate: LocalDate,
        pageable: Pageable
    ): Page<TrainerEarnings>

    /**
     * Find earnings by trainer, status, and date range.
     */
    fun findByTrainerIdAndStatusAndEarningDateBetween(
        trainerId: UUID,
        status: EarningStatus,
        startDate: LocalDate,
        endDate: LocalDate,
        pageable: Pageable
    ): Page<TrainerEarnings>

    /**
     * Find pending or approved earnings for a trainer (awaiting payment).
     */
    fun findPendingPaymentByTrainerId(trainerId: UUID, pageable: Pageable): Page<TrainerEarnings>

    /**
     * Find earnings by session ID.
     */
    fun findBySessionId(sessionId: UUID): Optional<TrainerEarnings>

    /**
     * Find all pending earnings (across all trainers) - for admin approval.
     */
    fun findByStatus(status: EarningStatus, pageable: Pageable): Page<TrainerEarnings>

    /**
     * Find earnings by organization ID (for admin reports).
     */
    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<TrainerEarnings>

    /**
     * Find earnings by a list of IDs.
     */
    fun findAllByIds(ids: List<UUID>): List<TrainerEarnings>

    /**
     * Calculate total earnings for a trainer (optionally filtered by status/date).
     */
    fun calculateTotalEarnings(trainerId: UUID, status: EarningStatus? = null): java.math.BigDecimal
}

/**
 * Port for trainer notification persistence operations.
 */
interface TrainerNotificationRepository {
    fun save(notification: TrainerNotification): TrainerNotification
    fun findById(id: UUID): Optional<TrainerNotification>
    fun findAll(pageable: Pageable): Page<TrainerNotification>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long

    /**
     * Find all notifications for a trainer.
     */
    fun findByTrainerId(trainerId: UUID, pageable: Pageable): Page<TrainerNotification>

    /**
     * Find unread notifications for a trainer.
     */
    fun findUnreadByTrainerId(trainerId: UUID, pageable: Pageable): Page<TrainerNotification>

    /**
     * Find notifications by trainer and type.
     */
    fun findByTrainerIdAndNotificationType(
        trainerId: UUID,
        type: NotificationType,
        pageable: Pageable
    ): Page<TrainerNotification>

    /**
     * Count unread notifications for a trainer.
     */
    fun countUnreadByTrainerId(trainerId: UUID): Long

    /**
     * Find notifications pending delivery (not yet sent).
     */
    fun findPendingDelivery(pageable: Pageable): Page<TrainerNotification>

    /**
     * Mark all notifications as read for a trainer.
     */
    fun markAllAsReadForTrainer(trainerId: UUID)

    /**
     * Delete old read notifications (for cleanup).
     */
    fun deleteOldReadNotifications(olderThan: java.time.Instant): Int

    /**
     * Find notifications by a list of IDs.
     */
    fun findAllByIds(ids: List<UUID>): List<TrainerNotification>
}

/**
 * Port for trainer certification persistence operations.
 */
interface TrainerCertificationRepository {
    fun save(certification: TrainerCertification): TrainerCertification
    fun findById(id: UUID): Optional<TrainerCertification>
    fun findAll(pageable: Pageable): Page<TrainerCertification>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long

    /**
     * Find all certifications for a trainer.
     */
    fun findByTrainerId(trainerId: UUID, pageable: Pageable): Page<TrainerCertification>

    /**
     * Find active certifications for a trainer.
     */
    fun findActiveByTrainerId(trainerId: UUID, pageable: Pageable): Page<TrainerCertification>

    /**
     * Find certifications by trainer and status.
     */
    fun findByTrainerIdAndStatus(
        trainerId: UUID,
        status: CertificationStatus,
        pageable: Pageable
    ): Page<TrainerCertification>

    /**
     * Find certifications expiring soon (within specified days).
     */
    fun findExpiringSoon(daysThreshold: Int, pageable: Pageable): Page<TrainerCertification>

    /**
     * Find certifications expiring soon for a specific trainer.
     */
    fun findExpiringSoonByTrainerId(trainerId: UUID, daysThreshold: Int): List<TrainerCertification>

    /**
     * Find unverified certifications (for admin verification queue).
     */
    fun findUnverified(pageable: Pageable): Page<TrainerCertification>

    /**
     * Find certifications by organization ID.
     */
    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<TrainerCertification>

    /**
     * Find certifications by a list of IDs.
     */
    fun findAllByIds(ids: List<UUID>): List<TrainerCertification>

    /**
     * Update expired certifications (set status to EXPIRED).
     */
    fun updateExpiredCertifications(): Int
}
