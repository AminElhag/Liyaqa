package com.liyaqa.scheduling.domain.ports

import com.liyaqa.scheduling.domain.model.ClassSchedule
import com.liyaqa.scheduling.domain.model.DayOfWeek
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

/**
 * Repository interface for ClassSchedule entities.
 */
interface ClassScheduleRepository {
    fun save(schedule: ClassSchedule): ClassSchedule
    fun findById(id: UUID): Optional<ClassSchedule>
    fun findByGymClassId(gymClassId: UUID): List<ClassSchedule>
    fun findByGymClassIdAndIsActive(gymClassId: UUID, isActive: Boolean): List<ClassSchedule>
    fun findByDayOfWeek(dayOfWeek: DayOfWeek): List<ClassSchedule>
    fun findActiveSchedulesForDate(date: LocalDate): List<ClassSchedule>
    fun findByTrainerId(trainerId: UUID): List<ClassSchedule>
    fun findAll(pageable: Pageable): Page<ClassSchedule>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun deleteByGymClassId(gymClassId: UUID)
}
