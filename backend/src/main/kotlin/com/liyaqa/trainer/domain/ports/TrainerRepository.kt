package com.liyaqa.trainer.domain.ports

import com.liyaqa.trainer.domain.model.PTSessionStatus
import com.liyaqa.trainer.domain.model.PersonalTrainingSession
import com.liyaqa.trainer.domain.model.Trainer
import com.liyaqa.trainer.domain.model.TrainerClubAssignment
import com.liyaqa.trainer.domain.model.TrainerStatus
import com.liyaqa.trainer.domain.model.TrainerType
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
