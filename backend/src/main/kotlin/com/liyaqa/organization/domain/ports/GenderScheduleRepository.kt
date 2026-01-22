package com.liyaqa.organization.domain.ports

import com.liyaqa.organization.domain.model.AccessGender
import com.liyaqa.organization.domain.model.GenderSchedule
import java.time.DayOfWeek
import java.util.Optional
import java.util.UUID

/**
 * Repository port for GenderSchedule entity.
 */
interface GenderScheduleRepository {
    fun save(schedule: GenderSchedule): GenderSchedule
    fun saveAll(schedules: List<GenderSchedule>): List<GenderSchedule>
    fun findById(id: UUID): Optional<GenderSchedule>
    fun findByLocationId(locationId: UUID): List<GenderSchedule>
    fun findByLocationIdAndDayOfWeek(locationId: UUID, dayOfWeek: DayOfWeek): List<GenderSchedule>
    fun deleteById(id: UUID)
    fun deleteAllByLocationId(locationId: UUID)
    fun existsById(id: UUID): Boolean
}
