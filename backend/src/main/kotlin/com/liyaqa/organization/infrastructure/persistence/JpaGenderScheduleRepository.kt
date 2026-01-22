package com.liyaqa.organization.infrastructure.persistence

import com.liyaqa.organization.domain.model.GenderSchedule
import com.liyaqa.organization.domain.ports.GenderScheduleRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.DayOfWeek
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA interface for GenderSchedule.
 */
interface SpringDataGenderScheduleRepository : JpaRepository<GenderSchedule, UUID> {
    fun findByLocationId(locationId: UUID): List<GenderSchedule>
    fun findByLocationIdAndDayOfWeek(locationId: UUID, dayOfWeek: DayOfWeek): List<GenderSchedule>

    @Modifying
    @Query("DELETE FROM GenderSchedule g WHERE g.locationId = :locationId")
    fun deleteAllByLocationId(locationId: UUID)
}

/**
 * JPA adapter implementing the GenderScheduleRepository port.
 */
@Repository
class JpaGenderScheduleRepository(
    private val springData: SpringDataGenderScheduleRepository
) : GenderScheduleRepository {

    override fun save(schedule: GenderSchedule): GenderSchedule = springData.save(schedule)

    override fun saveAll(schedules: List<GenderSchedule>): List<GenderSchedule> =
        springData.saveAll(schedules)

    override fun findById(id: UUID): Optional<GenderSchedule> = springData.findById(id)

    override fun findByLocationId(locationId: UUID): List<GenderSchedule> =
        springData.findByLocationId(locationId)

    override fun findByLocationIdAndDayOfWeek(locationId: UUID, dayOfWeek: DayOfWeek): List<GenderSchedule> =
        springData.findByLocationIdAndDayOfWeek(locationId, dayOfWeek)

    override fun deleteById(id: UUID) = springData.deleteById(id)

    override fun deleteAllByLocationId(locationId: UUID) = springData.deleteAllByLocationId(locationId)

    override fun existsById(id: UUID): Boolean = springData.existsById(id)
}
