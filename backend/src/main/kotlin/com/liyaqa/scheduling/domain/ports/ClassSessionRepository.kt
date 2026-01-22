package com.liyaqa.scheduling.domain.ports

import com.liyaqa.scheduling.domain.model.ClassSession
import com.liyaqa.scheduling.domain.model.SessionStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

/**
 * Repository interface for ClassSession entities.
 */
interface ClassSessionRepository {
    fun save(session: ClassSession): ClassSession
    fun saveAll(sessions: List<ClassSession>): List<ClassSession>
    fun findById(id: UUID): Optional<ClassSession>
    fun findByGymClassId(gymClassId: UUID, pageable: Pageable): Page<ClassSession>
    fun findByLocationId(locationId: UUID, pageable: Pageable): Page<ClassSession>
    fun findByTrainerId(trainerId: UUID, pageable: Pageable): Page<ClassSession>
    fun findBySessionDate(date: LocalDate, pageable: Pageable): Page<ClassSession>
    fun findBySessionDateBetween(startDate: LocalDate, endDate: LocalDate, pageable: Pageable): Page<ClassSession>
    fun findByStatus(status: SessionStatus, pageable: Pageable): Page<ClassSession>
    fun findByGymClassIdAndSessionDate(gymClassId: UUID, date: LocalDate): List<ClassSession>
    fun findByLocationIdAndSessionDate(locationId: UUID, date: LocalDate): List<ClassSession>
    fun findByScheduleIdAndSessionDate(scheduleId: UUID, date: LocalDate): Optional<ClassSession>
    fun findUpcomingByGymClassId(gymClassId: UUID, fromDate: LocalDate, pageable: Pageable): Page<ClassSession>
    fun findUpcomingByLocationId(locationId: UUID, fromDate: LocalDate, pageable: Pageable): Page<ClassSession>
    fun findAll(pageable: Pageable): Page<ClassSession>
    fun existsById(id: UUID): Boolean
    fun existsByScheduleIdAndSessionDate(scheduleId: UUID, date: LocalDate): Boolean
    fun deleteById(id: UUID)
    fun count(): Long
    fun countByStatus(status: SessionStatus): Long
    fun countBySessionDate(date: LocalDate): Long
}
