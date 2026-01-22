package com.liyaqa.scheduling.infrastructure.persistence

import com.liyaqa.scheduling.domain.model.ClassSchedule
import com.liyaqa.scheduling.domain.model.DayOfWeek
import com.liyaqa.scheduling.domain.ports.ClassScheduleRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

interface SpringDataClassScheduleRepository : JpaRepository<ClassSchedule, UUID> {
    fun findByGymClassId(gymClassId: UUID): List<ClassSchedule>
    fun findByGymClassIdAndIsActive(gymClassId: UUID, isActive: Boolean): List<ClassSchedule>
    fun findByDayOfWeek(dayOfWeek: DayOfWeek): List<ClassSchedule>
    fun findByTrainerId(trainerId: UUID): List<ClassSchedule>
    fun deleteByGymClassId(gymClassId: UUID)

    @Query("""
        SELECT s FROM ClassSchedule s
        WHERE s.isActive = true
        AND s.effectiveFrom <= :date
        AND (s.effectiveUntil IS NULL OR s.effectiveUntil >= :date)
        AND s.dayOfWeek = :dayOfWeek
    """)
    fun findActiveSchedulesForDayAndDate(
        @Param("dayOfWeek") dayOfWeek: DayOfWeek,
        @Param("date") date: LocalDate
    ): List<ClassSchedule>
}

@Repository
class JpaClassScheduleRepository(
    private val springDataRepository: SpringDataClassScheduleRepository
) : ClassScheduleRepository {

    override fun save(schedule: ClassSchedule): ClassSchedule =
        springDataRepository.save(schedule)

    override fun findById(id: UUID): Optional<ClassSchedule> =
        springDataRepository.findById(id)

    override fun findByGymClassId(gymClassId: UUID): List<ClassSchedule> =
        springDataRepository.findByGymClassId(gymClassId)

    override fun findByGymClassIdAndIsActive(gymClassId: UUID, isActive: Boolean): List<ClassSchedule> =
        springDataRepository.findByGymClassIdAndIsActive(gymClassId, isActive)

    override fun findByDayOfWeek(dayOfWeek: DayOfWeek): List<ClassSchedule> =
        springDataRepository.findByDayOfWeek(dayOfWeek)

    override fun findActiveSchedulesForDate(date: LocalDate): List<ClassSchedule> {
        val javaDayOfWeek = date.dayOfWeek
        val scheduleDayOfWeek = when (javaDayOfWeek) {
            java.time.DayOfWeek.MONDAY -> DayOfWeek.MONDAY
            java.time.DayOfWeek.TUESDAY -> DayOfWeek.TUESDAY
            java.time.DayOfWeek.WEDNESDAY -> DayOfWeek.WEDNESDAY
            java.time.DayOfWeek.THURSDAY -> DayOfWeek.THURSDAY
            java.time.DayOfWeek.FRIDAY -> DayOfWeek.FRIDAY
            java.time.DayOfWeek.SATURDAY -> DayOfWeek.SATURDAY
            java.time.DayOfWeek.SUNDAY -> DayOfWeek.SUNDAY
        }
        return springDataRepository.findActiveSchedulesForDayAndDate(scheduleDayOfWeek, date)
    }

    override fun findByTrainerId(trainerId: UUID): List<ClassSchedule> =
        springDataRepository.findByTrainerId(trainerId)

    override fun findAll(pageable: Pageable): Page<ClassSchedule> =
        springDataRepository.findAll(pageable)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun deleteByGymClassId(gymClassId: UUID) =
        springDataRepository.deleteByGymClassId(gymClassId)
}
