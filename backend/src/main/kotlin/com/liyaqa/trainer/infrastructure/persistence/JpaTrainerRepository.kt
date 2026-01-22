package com.liyaqa.trainer.infrastructure.persistence

import com.liyaqa.trainer.domain.model.PTSessionStatus
import com.liyaqa.trainer.domain.model.PersonalTrainingSession
import com.liyaqa.trainer.domain.model.Trainer
import com.liyaqa.trainer.domain.model.TrainerClubAssignment
import com.liyaqa.trainer.domain.model.TrainerClubAssignmentStatus
import com.liyaqa.trainer.domain.model.TrainerStatus
import com.liyaqa.trainer.domain.model.TrainerType
import com.liyaqa.trainer.domain.ports.PersonalTrainingSessionRepository
import com.liyaqa.trainer.domain.ports.TrainerClubAssignmentRepository
import com.liyaqa.trainer.domain.ports.TrainerRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.time.LocalTime
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository for Trainer entity.
 */
interface SpringDataTrainerRepository : JpaRepository<Trainer, UUID> {
    fun findByUserId(userId: UUID): Optional<Trainer>

    fun findByUserIdAndOrganizationId(userId: UUID, organizationId: UUID): Optional<Trainer>

    fun existsByUserId(userId: UUID): Boolean

    fun existsByUserIdAndOrganizationId(userId: UUID, organizationId: UUID): Boolean

    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<Trainer>

    @Query("""
        SELECT t FROM Trainer t
        WHERE (:search IS NULL OR (
            LOWER(t.specializations) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(t.bio.en) LIKE LOWER(CONCAT('%', :search, '%'))
        ))
        AND (:status IS NULL OR t.status = :status)
        AND (:trainerType IS NULL OR t.trainerType = :trainerType)
    """)
    fun search(
        @Param("search") search: String?,
        @Param("status") status: TrainerStatus?,
        @Param("trainerType") trainerType: TrainerType?,
        pageable: Pageable
    ): Page<Trainer>

    @Query("""
        SELECT DISTINCT t FROM Trainer t
        JOIN TrainerClubAssignment tca ON tca.trainerId = t.id
        WHERE tca.clubId = :clubId
        AND tca.status = 'ACTIVE'
    """)
    fun findByClubId(@Param("clubId") clubId: UUID, pageable: Pageable): Page<Trainer>

    @Query("""
        SELECT t FROM Trainer t
        WHERE t.status = 'ACTIVE'
        AND (t.trainerType = 'GROUP_FITNESS' OR t.trainerType = 'HYBRID')
    """)
    fun findActiveGroupFitnessTrainers(pageable: Pageable): Page<Trainer>

    @Query("""
        SELECT t FROM Trainer t
        WHERE t.status = 'ACTIVE'
        AND (t.trainerType = 'PERSONAL_TRAINER' OR t.trainerType = 'HYBRID')
    """)
    fun findActivePersonalTrainers(pageable: Pageable): Page<Trainer>
}

/**
 * Adapter implementing TrainerRepository using Spring Data JPA.
 */
@Repository
class JpaTrainerRepository(
    private val springDataRepository: SpringDataTrainerRepository
) : TrainerRepository {

    override fun save(trainer: Trainer): Trainer {
        return springDataRepository.save(trainer)
    }

    override fun findById(id: UUID): Optional<Trainer> {
        return springDataRepository.findById(id)
    }

    override fun findByUserId(userId: UUID): Optional<Trainer> {
        return springDataRepository.findByUserId(userId)
    }

    override fun findByUserIdAndOrganizationId(userId: UUID, organizationId: UUID): Optional<Trainer> {
        return springDataRepository.findByUserIdAndOrganizationId(userId, organizationId)
    }

    override fun findAll(pageable: Pageable): Page<Trainer> {
        return springDataRepository.findAll(pageable)
    }

    override fun existsById(id: UUID): Boolean {
        return springDataRepository.existsById(id)
    }

    override fun existsByUserId(userId: UUID): Boolean {
        return springDataRepository.existsByUserId(userId)
    }

    override fun existsByUserIdAndOrganizationId(userId: UUID, organizationId: UUID): Boolean {
        return springDataRepository.existsByUserIdAndOrganizationId(userId, organizationId)
    }

    override fun deleteById(id: UUID) {
        springDataRepository.deleteById(id)
    }

    override fun count(): Long {
        return springDataRepository.count()
    }

    override fun search(
        search: String?,
        status: TrainerStatus?,
        trainerType: TrainerType?,
        pageable: Pageable
    ): Page<Trainer> {
        return springDataRepository.search(
            search = search?.takeIf { it.isNotBlank() },
            status = status,
            trainerType = trainerType,
            pageable = pageable
        )
    }

    override fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<Trainer> {
        return springDataRepository.findByOrganizationId(organizationId, pageable)
    }

    override fun findByClubId(clubId: UUID, pageable: Pageable): Page<Trainer> {
        return springDataRepository.findByClubId(clubId, pageable)
    }

    override fun findActiveGroupFitnessTrainers(pageable: Pageable): Page<Trainer> {
        return springDataRepository.findActiveGroupFitnessTrainers(pageable)
    }

    override fun findActivePersonalTrainers(pageable: Pageable): Page<Trainer> {
        return springDataRepository.findActivePersonalTrainers(pageable)
    }

    override fun findAllByIds(ids: List<UUID>): List<Trainer> {
        return springDataRepository.findAllById(ids).toList()
    }
}

/**
 * Spring Data JPA repository for TrainerClubAssignment entity.
 */
interface SpringDataTrainerClubAssignmentRepository : JpaRepository<TrainerClubAssignment, UUID> {
    fun findByTrainerId(trainerId: UUID): List<TrainerClubAssignment>

    fun findByTrainerIdAndClubId(trainerId: UUID, clubId: UUID): Optional<TrainerClubAssignment>

    fun findByClubId(clubId: UUID): List<TrainerClubAssignment>

    @Query("SELECT tca FROM TrainerClubAssignment tca WHERE tca.trainerId = :trainerId AND tca.status = :status")
    fun findByTrainerIdAndStatus(
        @Param("trainerId") trainerId: UUID,
        @Param("status") status: TrainerClubAssignmentStatus
    ): List<TrainerClubAssignment>

    @Query("SELECT tca FROM TrainerClubAssignment tca WHERE tca.clubId = :clubId AND tca.status = :status")
    fun findByClubIdAndStatus(
        @Param("clubId") clubId: UUID,
        @Param("status") status: TrainerClubAssignmentStatus
    ): List<TrainerClubAssignment>

    @Query("SELECT tca FROM TrainerClubAssignment tca WHERE tca.trainerId = :trainerId AND tca.isPrimary = true")
    fun findPrimaryByTrainerId(@Param("trainerId") trainerId: UUID): Optional<TrainerClubAssignment>

    fun existsByTrainerIdAndClubId(trainerId: UUID, clubId: UUID): Boolean

    fun deleteByTrainerId(trainerId: UUID)
}

/**
 * Adapter implementing TrainerClubAssignmentRepository using Spring Data JPA.
 */
@Repository
class JpaTrainerClubAssignmentRepository(
    private val springDataRepository: SpringDataTrainerClubAssignmentRepository
) : TrainerClubAssignmentRepository {

    override fun save(assignment: TrainerClubAssignment): TrainerClubAssignment {
        return springDataRepository.save(assignment)
    }

    override fun findById(id: UUID): Optional<TrainerClubAssignment> {
        return springDataRepository.findById(id)
    }

    override fun findByTrainerId(trainerId: UUID): List<TrainerClubAssignment> {
        return springDataRepository.findByTrainerId(trainerId)
    }

    override fun findByTrainerIdAndClubId(trainerId: UUID, clubId: UUID): Optional<TrainerClubAssignment> {
        return springDataRepository.findByTrainerIdAndClubId(trainerId, clubId)
    }

    override fun findByClubId(clubId: UUID): List<TrainerClubAssignment> {
        return springDataRepository.findByClubId(clubId)
    }

    override fun findActiveByTrainerId(trainerId: UUID): List<TrainerClubAssignment> {
        return springDataRepository.findByTrainerIdAndStatus(trainerId, TrainerClubAssignmentStatus.ACTIVE)
    }

    override fun findActiveByClubId(clubId: UUID): List<TrainerClubAssignment> {
        return springDataRepository.findByClubIdAndStatus(clubId, TrainerClubAssignmentStatus.ACTIVE)
    }

    override fun findPrimaryByTrainerId(trainerId: UUID): Optional<TrainerClubAssignment> {
        return springDataRepository.findPrimaryByTrainerId(trainerId)
    }

    override fun existsByTrainerIdAndClubId(trainerId: UUID, clubId: UUID): Boolean {
        return springDataRepository.existsByTrainerIdAndClubId(trainerId, clubId)
    }

    override fun deleteById(id: UUID) {
        springDataRepository.deleteById(id)
    }

    override fun deleteByTrainerId(trainerId: UUID) {
        springDataRepository.deleteByTrainerId(trainerId)
    }
}

/**
 * Spring Data JPA repository for PersonalTrainingSession entity.
 */
interface SpringDataPersonalTrainingSessionRepository : JpaRepository<PersonalTrainingSession, UUID> {
    fun findByTrainerId(trainerId: UUID, pageable: Pageable): Page<PersonalTrainingSession>

    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<PersonalTrainingSession>

    fun findByTrainerIdAndStatus(trainerId: UUID, status: PTSessionStatus, pageable: Pageable): Page<PersonalTrainingSession>

    fun findByMemberIdAndStatus(memberId: UUID, status: PTSessionStatus, pageable: Pageable): Page<PersonalTrainingSession>

    fun findByTrainerIdAndSessionDate(trainerId: UUID, sessionDate: LocalDate): List<PersonalTrainingSession>

    fun findByMemberIdAndSessionDate(memberId: UUID, sessionDate: LocalDate): List<PersonalTrainingSession>

    fun findBySessionDateBetween(startDate: LocalDate, endDate: LocalDate, pageable: Pageable): Page<PersonalTrainingSession>

    fun findByTrainerIdAndSessionDateBetween(
        trainerId: UUID,
        startDate: LocalDate,
        endDate: LocalDate,
        pageable: Pageable
    ): Page<PersonalTrainingSession>

    @Query("""
        SELECT pts FROM PersonalTrainingSession pts
        WHERE pts.trainerId = :trainerId
        AND pts.status = 'REQUESTED'
        ORDER BY pts.sessionDate ASC, pts.startTime ASC
    """)
    fun findPendingByTrainerId(@Param("trainerId") trainerId: UUID, pageable: Pageable): Page<PersonalTrainingSession>

    @Query("""
        SELECT pts FROM PersonalTrainingSession pts
        WHERE pts.trainerId = :trainerId
        AND pts.status = 'CONFIRMED'
        AND pts.sessionDate >= :fromDate
        ORDER BY pts.sessionDate ASC, pts.startTime ASC
    """)
    fun findUpcomingByTrainerId(
        @Param("trainerId") trainerId: UUID,
        @Param("fromDate") fromDate: LocalDate,
        pageable: Pageable
    ): Page<PersonalTrainingSession>

    @Query("""
        SELECT pts FROM PersonalTrainingSession pts
        WHERE pts.memberId = :memberId
        AND pts.status = 'CONFIRMED'
        AND pts.sessionDate >= :fromDate
        ORDER BY pts.sessionDate ASC, pts.startTime ASC
    """)
    fun findUpcomingByMemberId(
        @Param("memberId") memberId: UUID,
        @Param("fromDate") fromDate: LocalDate,
        pageable: Pageable
    ): Page<PersonalTrainingSession>

    @Query("""
        SELECT COUNT(pts) FROM PersonalTrainingSession pts
        WHERE pts.trainerId = :trainerId
        AND pts.sessionDate = :sessionDate
        AND pts.status IN ('CONFIRMED', 'IN_PROGRESS')
        AND (
            (pts.startTime < :endTime AND pts.endTime > :startTime)
        )
    """)
    fun countOverlappingSessions(
        @Param("trainerId") trainerId: UUID,
        @Param("sessionDate") sessionDate: LocalDate,
        @Param("startTime") startTime: LocalTime,
        @Param("endTime") endTime: LocalTime
    ): Long
}

/**
 * Adapter implementing PersonalTrainingSessionRepository using Spring Data JPA.
 */
@Repository
class JpaPersonalTrainingSessionRepository(
    private val springDataRepository: SpringDataPersonalTrainingSessionRepository
) : PersonalTrainingSessionRepository {

    override fun save(session: PersonalTrainingSession): PersonalTrainingSession {
        return springDataRepository.save(session)
    }

    override fun findById(id: UUID): Optional<PersonalTrainingSession> {
        return springDataRepository.findById(id)
    }

    override fun findAll(pageable: Pageable): Page<PersonalTrainingSession> {
        return springDataRepository.findAll(pageable)
    }

    override fun existsById(id: UUID): Boolean {
        return springDataRepository.existsById(id)
    }

    override fun deleteById(id: UUID) {
        springDataRepository.deleteById(id)
    }

    override fun count(): Long {
        return springDataRepository.count()
    }

    override fun findByTrainerId(trainerId: UUID, pageable: Pageable): Page<PersonalTrainingSession> {
        return springDataRepository.findByTrainerId(trainerId, pageable)
    }

    override fun findByMemberId(memberId: UUID, pageable: Pageable): Page<PersonalTrainingSession> {
        return springDataRepository.findByMemberId(memberId, pageable)
    }

    override fun findByTrainerIdAndStatus(trainerId: UUID, status: PTSessionStatus, pageable: Pageable): Page<PersonalTrainingSession> {
        return springDataRepository.findByTrainerIdAndStatus(trainerId, status, pageable)
    }

    override fun findByMemberIdAndStatus(memberId: UUID, status: PTSessionStatus, pageable: Pageable): Page<PersonalTrainingSession> {
        return springDataRepository.findByMemberIdAndStatus(memberId, status, pageable)
    }

    override fun findByTrainerIdAndSessionDate(trainerId: UUID, sessionDate: LocalDate): List<PersonalTrainingSession> {
        return springDataRepository.findByTrainerIdAndSessionDate(trainerId, sessionDate)
    }

    override fun findByMemberIdAndSessionDate(memberId: UUID, sessionDate: LocalDate): List<PersonalTrainingSession> {
        return springDataRepository.findByMemberIdAndSessionDate(memberId, sessionDate)
    }

    override fun findBySessionDateBetween(startDate: LocalDate, endDate: LocalDate, pageable: Pageable): Page<PersonalTrainingSession> {
        return springDataRepository.findBySessionDateBetween(startDate, endDate, pageable)
    }

    override fun findByTrainerIdAndSessionDateBetween(
        trainerId: UUID,
        startDate: LocalDate,
        endDate: LocalDate,
        pageable: Pageable
    ): Page<PersonalTrainingSession> {
        return springDataRepository.findByTrainerIdAndSessionDateBetween(trainerId, startDate, endDate, pageable)
    }

    override fun findPendingByTrainerId(trainerId: UUID, pageable: Pageable): Page<PersonalTrainingSession> {
        return springDataRepository.findPendingByTrainerId(trainerId, pageable)
    }

    override fun findUpcomingByTrainerId(trainerId: UUID, fromDate: LocalDate, pageable: Pageable): Page<PersonalTrainingSession> {
        return springDataRepository.findUpcomingByTrainerId(trainerId, fromDate, pageable)
    }

    override fun findUpcomingByMemberId(memberId: UUID, fromDate: LocalDate, pageable: Pageable): Page<PersonalTrainingSession> {
        return springDataRepository.findUpcomingByMemberId(memberId, fromDate, pageable)
    }

    override fun isTimeSlotAvailable(trainerId: UUID, sessionDate: LocalDate, startTime: LocalTime, endTime: LocalTime): Boolean {
        return springDataRepository.countOverlappingSessions(trainerId, sessionDate, startTime, endTime) == 0L
    }

    override fun findAllByIds(ids: List<UUID>): List<PersonalTrainingSession> {
        return springDataRepository.findAllById(ids).toList()
    }
}
