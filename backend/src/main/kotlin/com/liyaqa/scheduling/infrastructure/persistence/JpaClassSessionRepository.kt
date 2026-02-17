package com.liyaqa.scheduling.infrastructure.persistence

import com.liyaqa.scheduling.domain.model.ClassSession
import com.liyaqa.scheduling.domain.model.ClassType
import com.liyaqa.scheduling.domain.model.SessionStatus
import com.liyaqa.scheduling.domain.ports.ClassSessionRepository
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

interface SpringDataClassSessionRepository : JpaRepository<ClassSession, UUID> {
    fun findByGymClassId(gymClassId: UUID, pageable: Pageable): Page<ClassSession>
    fun findByLocationId(locationId: UUID, pageable: Pageable): Page<ClassSession>
    fun findByTrainerId(trainerId: UUID, pageable: Pageable): Page<ClassSession>
    fun findBySessionDate(date: LocalDate, pageable: Pageable): Page<ClassSession>
    fun findBySessionDateBetween(startDate: LocalDate, endDate: LocalDate, pageable: Pageable): Page<ClassSession>
    fun findByStatus(status: SessionStatus, pageable: Pageable): Page<ClassSession>
    fun findByGymClassIdAndSessionDate(gymClassId: UUID, date: LocalDate): List<ClassSession>
    fun findByLocationIdAndSessionDate(locationId: UUID, date: LocalDate): List<ClassSession>
    fun findByScheduleIdAndSessionDate(scheduleId: UUID, date: LocalDate): Optional<ClassSession>
    fun existsByScheduleIdAndSessionDate(scheduleId: UUID, date: LocalDate): Boolean
    fun countByStatus(status: SessionStatus): Long
    fun countBySessionDate(date: LocalDate): Long

    @Query("""
        SELECT s FROM ClassSession s
        WHERE s.gymClassId = :gymClassId
        AND s.sessionDate >= :fromDate
        AND s.status != 'CANCELLED'
        ORDER BY s.sessionDate ASC, s.startTime ASC
    """)
    fun findUpcomingByGymClassId(
        @Param("gymClassId") gymClassId: UUID,
        @Param("fromDate") fromDate: LocalDate,
        pageable: Pageable
    ): Page<ClassSession>

    @Query("""
        SELECT s FROM ClassSession s
        WHERE s.locationId = :locationId
        AND s.sessionDate >= :fromDate
        AND s.status != 'CANCELLED'
        ORDER BY s.sessionDate ASC, s.startTime ASC
    """)
    fun findUpcomingByLocationId(
        @Param("locationId") locationId: UUID,
        @Param("fromDate") fromDate: LocalDate,
        pageable: Pageable
    ): Page<ClassSession>

    @Query("""
        SELECT s FROM ClassSession s
        JOIN GymClass g ON g.id = s.gymClassId
        WHERE s.sessionDate BETWEEN :startDate AND :endDate
        AND g.classType = :classType
        ORDER BY s.sessionDate ASC, s.startTime ASC
    """)
    fun findBySessionDateBetweenAndClassType(
        @Param("startDate") startDate: LocalDate,
        @Param("endDate") endDate: LocalDate,
        @Param("classType") classType: ClassType,
        pageable: Pageable
    ): Page<ClassSession>

    @Query("""
        SELECT s FROM ClassSession s
        JOIN GymClass g ON g.id = s.gymClassId
        WHERE s.trainerId = :trainerId
        AND g.classType = :classType
        ORDER BY s.sessionDate ASC, s.startTime ASC
    """)
    fun findByTrainerIdAndClassType(
        @Param("trainerId") trainerId: UUID,
        @Param("classType") classType: ClassType,
        pageable: Pageable
    ): Page<ClassSession>

    @Query("""
        SELECT s FROM ClassSession s
        WHERE s.trainerId = :trainerId
        AND s.sessionDate = :sessionDate
        AND s.status IN (com.liyaqa.scheduling.domain.model.SessionStatus.SCHEDULED, com.liyaqa.scheduling.domain.model.SessionStatus.IN_PROGRESS)
        AND s.startTime < :endTime AND :startTime < s.endTime
        AND (:excludeSessionId IS NULL OR s.id != :excludeSessionId)
    """)
    fun findConflictingSessionsByTrainer(
        @Param("trainerId") trainerId: UUID,
        @Param("sessionDate") sessionDate: LocalDate,
        @Param("startTime") startTime: LocalTime,
        @Param("endTime") endTime: LocalTime,
        @Param("excludeSessionId") excludeSessionId: UUID?
    ): List<ClassSession>

    @Query("""
        SELECT s FROM ClassSession s
        WHERE s.locationId = :locationId
        AND s.sessionDate = :sessionDate
        AND s.status IN (com.liyaqa.scheduling.domain.model.SessionStatus.SCHEDULED, com.liyaqa.scheduling.domain.model.SessionStatus.IN_PROGRESS)
        AND s.startTime < :endTime AND :startTime < s.endTime
        AND (:excludeSessionId IS NULL OR s.id != :excludeSessionId)
    """)
    fun findConflictingSessionsByLocation(
        @Param("locationId") locationId: UUID,
        @Param("sessionDate") sessionDate: LocalDate,
        @Param("startTime") startTime: LocalTime,
        @Param("endTime") endTime: LocalTime,
        @Param("excludeSessionId") excludeSessionId: UUID?
    ): List<ClassSession>
}

@Repository
class JpaClassSessionRepository(
    private val springDataRepository: SpringDataClassSessionRepository
) : ClassSessionRepository {

    override fun save(session: ClassSession): ClassSession =
        springDataRepository.save(session)

    override fun saveAll(sessions: List<ClassSession>): List<ClassSession> =
        springDataRepository.saveAll(sessions)

    override fun findById(id: UUID): Optional<ClassSession> =
        springDataRepository.findById(id)

    override fun findByGymClassId(gymClassId: UUID, pageable: Pageable): Page<ClassSession> =
        springDataRepository.findByGymClassId(gymClassId, pageable)

    override fun findByLocationId(locationId: UUID, pageable: Pageable): Page<ClassSession> =
        springDataRepository.findByLocationId(locationId, pageable)

    override fun findByTrainerId(trainerId: UUID, pageable: Pageable): Page<ClassSession> =
        springDataRepository.findByTrainerId(trainerId, pageable)

    override fun findBySessionDate(date: LocalDate, pageable: Pageable): Page<ClassSession> =
        springDataRepository.findBySessionDate(date, pageable)

    override fun findBySessionDateBetween(
        startDate: LocalDate,
        endDate: LocalDate,
        pageable: Pageable
    ): Page<ClassSession> =
        springDataRepository.findBySessionDateBetween(startDate, endDate, pageable)

    override fun findByStatus(status: SessionStatus, pageable: Pageable): Page<ClassSession> =
        springDataRepository.findByStatus(status, pageable)

    override fun findByGymClassIdAndSessionDate(gymClassId: UUID, date: LocalDate): List<ClassSession> =
        springDataRepository.findByGymClassIdAndSessionDate(gymClassId, date)

    override fun findByLocationIdAndSessionDate(locationId: UUID, date: LocalDate): List<ClassSession> =
        springDataRepository.findByLocationIdAndSessionDate(locationId, date)

    override fun findByScheduleIdAndSessionDate(scheduleId: UUID, date: LocalDate): Optional<ClassSession> =
        springDataRepository.findByScheduleIdAndSessionDate(scheduleId, date)

    override fun findUpcomingByGymClassId(
        gymClassId: UUID,
        fromDate: LocalDate,
        pageable: Pageable
    ): Page<ClassSession> =
        springDataRepository.findUpcomingByGymClassId(gymClassId, fromDate, pageable)

    override fun findUpcomingByLocationId(
        locationId: UUID,
        fromDate: LocalDate,
        pageable: Pageable
    ): Page<ClassSession> =
        springDataRepository.findUpcomingByLocationId(locationId, fromDate, pageable)

    override fun findAll(pageable: Pageable): Page<ClassSession> =
        springDataRepository.findAll(pageable)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun existsByScheduleIdAndSessionDate(scheduleId: UUID, date: LocalDate): Boolean =
        springDataRepository.existsByScheduleIdAndSessionDate(scheduleId, date)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()

    override fun countByStatus(status: SessionStatus): Long =
        springDataRepository.countByStatus(status)

    override fun countBySessionDate(date: LocalDate): Long =
        springDataRepository.countBySessionDate(date)

    override fun findBySessionDateBetweenAndClassType(
        startDate: LocalDate,
        endDate: LocalDate,
        classType: ClassType,
        pageable: Pageable
    ): Page<ClassSession> =
        springDataRepository.findBySessionDateBetweenAndClassType(startDate, endDate, classType, pageable)

    override fun findByTrainerIdAndClassType(
        trainerId: UUID,
        classType: ClassType,
        pageable: Pageable
    ): Page<ClassSession> =
        springDataRepository.findByTrainerIdAndClassType(trainerId, classType, pageable)

    override fun findConflictingSessionsByTrainer(
        trainerId: UUID,
        sessionDate: LocalDate,
        startTime: LocalTime,
        endTime: LocalTime,
        excludeSessionId: UUID?
    ): List<ClassSession> =
        springDataRepository.findConflictingSessionsByTrainer(trainerId, sessionDate, startTime, endTime, excludeSessionId)

    override fun findConflictingSessionsByLocation(
        locationId: UUID,
        sessionDate: LocalDate,
        startTime: LocalTime,
        endTime: LocalTime,
        excludeSessionId: UUID?
    ): List<ClassSession> =
        springDataRepository.findConflictingSessionsByLocation(locationId, sessionDate, startTime, endTime, excludeSessionId)
}
