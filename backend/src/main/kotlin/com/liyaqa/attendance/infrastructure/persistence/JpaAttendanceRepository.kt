package com.liyaqa.attendance.infrastructure.persistence

import com.liyaqa.attendance.domain.model.AttendanceRecord
import com.liyaqa.attendance.domain.model.AttendanceStatus
import com.liyaqa.attendance.domain.ports.AttendanceRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface SpringDataAttendanceRepository : JpaRepository<AttendanceRecord, UUID> {

    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<AttendanceRecord>

    @Query("SELECT a FROM AttendanceRecord a WHERE a.memberId = :memberId AND a.status = 'CHECKED_IN'")
    fun findCurrentCheckIn(@Param("memberId") memberId: UUID): Optional<AttendanceRecord>

    @Query("SELECT COUNT(a) > 0 FROM AttendanceRecord a WHERE a.memberId = :memberId AND a.status = 'CHECKED_IN'")
    fun existsActiveCheckIn(@Param("memberId") memberId: UUID): Boolean

    fun findByLocationId(locationId: UUID, pageable: Pageable): Page<AttendanceRecord>

    fun findByLocationIdAndStatus(locationId: UUID, status: AttendanceStatus, pageable: Pageable): Page<AttendanceRecord>

    fun findByCheckInTimeBetween(start: Instant, end: Instant, pageable: Pageable): Page<AttendanceRecord>

    fun findByMemberIdAndCheckInTimeBetween(memberId: UUID, start: Instant, end: Instant, pageable: Pageable): Page<AttendanceRecord>

    fun findByLocationIdAndCheckInTimeBetween(locationId: UUID, start: Instant, end: Instant, pageable: Pageable): Page<AttendanceRecord>

    fun findByStatus(status: AttendanceStatus, pageable: Pageable): Page<AttendanceRecord>

    @Query("SELECT a FROM AttendanceRecord a WHERE a.status = 'CHECKED_IN'")
    fun findAllCurrentlyCheckedIn(pageable: Pageable): Page<AttendanceRecord>

    fun countByMemberId(memberId: UUID): Long

    fun countByLocationId(locationId: UUID): Long

    fun countByCheckInTimeBetween(start: Instant, end: Instant): Long

    @Query("SELECT COUNT(a) FROM AttendanceRecord a WHERE a.status = 'CHECKED_IN'")
    fun countCurrentlyCheckedIn(): Long
}

@Repository
class JpaAttendanceRepository(
    private val springDataRepository: SpringDataAttendanceRepository
) : AttendanceRepository {

    override fun save(attendanceRecord: AttendanceRecord): AttendanceRecord =
        springDataRepository.save(attendanceRecord)

    override fun findById(id: UUID): Optional<AttendanceRecord> =
        springDataRepository.findById(id)

    override fun findAll(pageable: Pageable): Page<AttendanceRecord> =
        springDataRepository.findAll(pageable)

    override fun findByMemberId(memberId: UUID, pageable: Pageable): Page<AttendanceRecord> =
        springDataRepository.findByMemberId(memberId, pageable)

    override fun findCurrentCheckIn(memberId: UUID): Optional<AttendanceRecord> =
        springDataRepository.findCurrentCheckIn(memberId)

    override fun existsActiveCheckIn(memberId: UUID): Boolean =
        springDataRepository.existsActiveCheckIn(memberId)

    override fun findByLocationId(locationId: UUID, pageable: Pageable): Page<AttendanceRecord> =
        springDataRepository.findByLocationId(locationId, pageable)

    override fun findByLocationIdAndStatus(locationId: UUID, status: AttendanceStatus, pageable: Pageable): Page<AttendanceRecord> =
        springDataRepository.findByLocationIdAndStatus(locationId, status, pageable)

    override fun findByCheckInTimeBetween(start: Instant, end: Instant, pageable: Pageable): Page<AttendanceRecord> =
        springDataRepository.findByCheckInTimeBetween(start, end, pageable)

    override fun findByMemberIdAndCheckInTimeBetween(memberId: UUID, start: Instant, end: Instant, pageable: Pageable): Page<AttendanceRecord> =
        springDataRepository.findByMemberIdAndCheckInTimeBetween(memberId, start, end, pageable)

    override fun findByLocationIdAndCheckInTimeBetween(locationId: UUID, start: Instant, end: Instant, pageable: Pageable): Page<AttendanceRecord> =
        springDataRepository.findByLocationIdAndCheckInTimeBetween(locationId, start, end, pageable)

    override fun findByStatus(status: AttendanceStatus, pageable: Pageable): Page<AttendanceRecord> =
        springDataRepository.findByStatus(status, pageable)

    override fun findAllCurrentlyCheckedIn(pageable: Pageable): Page<AttendanceRecord> =
        springDataRepository.findAllCurrentlyCheckedIn(pageable)

    override fun count(): Long =
        springDataRepository.count()

    override fun countByMemberId(memberId: UUID): Long =
        springDataRepository.countByMemberId(memberId)

    override fun countByLocationId(locationId: UUID): Long =
        springDataRepository.countByLocationId(locationId)

    override fun countByCheckInTimeBetween(start: Instant, end: Instant): Long =
        springDataRepository.countByCheckInTimeBetween(start, end)

    override fun countCurrentlyCheckedIn(): Long =
        springDataRepository.countCurrentlyCheckedIn()

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)
}
