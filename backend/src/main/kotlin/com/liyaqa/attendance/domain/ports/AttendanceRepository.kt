package com.liyaqa.attendance.domain.ports

import com.liyaqa.attendance.domain.model.AttendanceRecord
import com.liyaqa.attendance.domain.model.AttendanceStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.Optional
import java.util.UUID

/**
 * Repository port for AttendanceRecord entity.
 * Attendance records are tenant-scoped (belong to a club).
 */
interface AttendanceRepository {
    fun save(attendanceRecord: AttendanceRecord): AttendanceRecord
    fun findById(id: UUID): Optional<AttendanceRecord>
    fun findAll(pageable: Pageable): Page<AttendanceRecord>

    // Member-specific queries
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<AttendanceRecord>
    fun findCurrentCheckIn(memberId: UUID): Optional<AttendanceRecord>
    fun existsActiveCheckIn(memberId: UUID): Boolean

    // Location-specific queries
    fun findByLocationId(locationId: UUID, pageable: Pageable): Page<AttendanceRecord>
    fun findByLocationIdAndStatus(locationId: UUID, status: AttendanceStatus, pageable: Pageable): Page<AttendanceRecord>

    // Time-based queries
    fun findByCheckInTimeBetween(start: Instant, end: Instant, pageable: Pageable): Page<AttendanceRecord>
    fun findByMemberIdAndCheckInTimeBetween(memberId: UUID, start: Instant, end: Instant, pageable: Pageable): Page<AttendanceRecord>
    fun findByLocationIdAndCheckInTimeBetween(locationId: UUID, start: Instant, end: Instant, pageable: Pageable): Page<AttendanceRecord>

    // Status queries
    fun findByStatus(status: AttendanceStatus, pageable: Pageable): Page<AttendanceRecord>
    fun findAllCurrentlyCheckedIn(pageable: Pageable): Page<AttendanceRecord>

    // Count queries
    fun count(): Long
    fun countByMemberId(memberId: UUID): Long
    fun countByLocationId(locationId: UUID): Long
    fun countByCheckInTimeBetween(start: Instant, end: Instant): Long
    fun countCurrentlyCheckedIn(): Long

    // Delete
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
}
