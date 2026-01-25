package com.liyaqa.attendance.application.services

import com.liyaqa.attendance.application.commands.CheckInCommand
import com.liyaqa.attendance.application.commands.CheckOutCommand
import com.liyaqa.attendance.domain.model.AttendanceRecord
import com.liyaqa.attendance.domain.model.AttendanceStatus
import com.liyaqa.attendance.domain.ports.AttendanceRepository
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.organization.domain.ports.LocationRepository
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.webhook.application.services.WebhookEventPublisher
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.UUID

@Service
@Transactional
class AttendanceService(
    private val attendanceRepository: AttendanceRepository,
    private val memberRepository: MemberRepository,
    private val subscriptionRepository: SubscriptionRepository,
    private val locationRepository: LocationRepository,
    private val webhookPublisher: WebhookEventPublisher
) {
    private val logger = LoggerFactory.getLogger(AttendanceService::class.java)
    /**
     * Checks in a member at a location.
     * @throws NoSuchElementException if member or location not found
     * @throws IllegalStateException if member has no active subscription or is already checked in
     */
    fun checkIn(command: CheckInCommand): AttendanceRecord {
        // Validate member exists
        val member = memberRepository.findById(command.memberId)
            .orElseThrow { NoSuchElementException("Member not found: ${command.memberId}") }

        // Validate member is active
        if (member.status != com.liyaqa.membership.domain.model.MemberStatus.ACTIVE) {
            throw IllegalStateException("Member is not active: ${command.memberId}")
        }

        // Get location - use provided or get first active location from tenant
        val locationId = command.locationId ?: run {
            val tenantId = TenantContext.getCurrentTenant().value
            locationRepository.findByClubId(tenantId, PageRequest.of(0, 1))
                .content.firstOrNull()?.id
                ?: throw IllegalStateException("No locations found for this club")
        }

        // Validate location exists and is active
        val location = locationRepository.findById(locationId)
            .orElseThrow { NoSuchElementException("Location not found: $locationId") }

        if (location.status != com.liyaqa.organization.domain.model.LocationStatus.ACTIVE) {
            throw IllegalStateException("Location is not active: $locationId")
        }

        // Check if member has active subscription
        val subscription = subscriptionRepository.findActiveByMemberId(command.memberId)
            .orElseThrow { IllegalStateException("Member has no active subscription") }

        // Check if member is already checked in
        if (attendanceRepository.existsActiveCheckIn(command.memberId)) {
            throw IllegalStateException("Member is already checked in")
        }

        // Check if subscription has classes available (if limited)
        if (!subscription.hasClassesAvailable()) {
            throw IllegalStateException("No classes remaining in subscription")
        }

        // Deduct a class from the subscription if it's a limited plan
        if (subscription.classesRemaining != null) {
            subscription.useClass()
            subscriptionRepository.save(subscription)
        }

        // Create attendance record
        val attendanceRecord = AttendanceRecord(
            memberId = command.memberId,
            locationId = locationId,
            checkInMethod = command.checkInMethod,
            notes = command.notes,
            createdBy = command.createdBy
        )

        val savedRecord = attendanceRepository.save(attendanceRecord)

        // Publish webhook event
        try {
            webhookPublisher.publishAttendanceCheckIn(savedRecord)
        } catch (e: Exception) {
            logger.error("Failed to publish attendance check-in webhook: ${e.message}", e)
        }

        return savedRecord
    }

    /**
     * Checks out a member.
     * @throws NoSuchElementException if no active check-in found
     */
    fun checkOut(command: CheckOutCommand): AttendanceRecord {
        val attendanceRecord = attendanceRepository.findCurrentCheckIn(command.memberId)
            .orElseThrow { NoSuchElementException("No active check-in found for member: ${command.memberId}") }

        attendanceRecord.checkOut()
        command.notes?.let { attendanceRecord.notes = it }

        val savedRecord = attendanceRepository.save(attendanceRecord)

        // Publish webhook event
        try {
            webhookPublisher.publishAttendanceCheckOut(savedRecord)
        } catch (e: Exception) {
            logger.error("Failed to publish attendance check-out webhook: ${e.message}", e)
        }

        return savedRecord
    }

    /**
     * Gets an attendance record by ID.
     */
    @Transactional(readOnly = true)
    fun getAttendanceRecord(id: UUID): AttendanceRecord {
        return attendanceRepository.findById(id)
            .orElseThrow { NoSuchElementException("Attendance record not found: $id") }
    }

    /**
     * Gets all attendance records with pagination.
     */
    @Transactional(readOnly = true)
    fun getAllAttendanceRecords(pageable: Pageable): Page<AttendanceRecord> {
        return attendanceRepository.findAll(pageable)
    }

    /**
     * Gets attendance records for a specific member.
     */
    @Transactional(readOnly = true)
    fun getAttendanceByMember(memberId: UUID, pageable: Pageable): Page<AttendanceRecord> {
        return attendanceRepository.findByMemberId(memberId, pageable)
    }

    /**
     * Gets attendance records for a specific location.
     */
    @Transactional(readOnly = true)
    fun getAttendanceByLocation(locationId: UUID, pageable: Pageable): Page<AttendanceRecord> {
        return attendanceRepository.findByLocationId(locationId, pageable)
    }

    /**
     * Gets current check-in for a member if exists.
     */
    @Transactional(readOnly = true)
    fun getCurrentCheckIn(memberId: UUID): AttendanceRecord? {
        return attendanceRepository.findCurrentCheckIn(memberId).orElse(null)
    }

    /**
     * Gets all currently checked-in members.
     */
    @Transactional(readOnly = true)
    fun getCurrentlyCheckedIn(pageable: Pageable): Page<AttendanceRecord> {
        return attendanceRepository.findAllCurrentlyCheckedIn(pageable)
    }

    /**
     * Gets attendance records for today.
     */
    @Transactional(readOnly = true)
    fun getTodayAttendance(pageable: Pageable): Page<AttendanceRecord> {
        val today = LocalDate.now()
        val startOfDay = today.atStartOfDay(ZoneId.systemDefault()).toInstant()
        val endOfDay = today.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant()

        return attendanceRepository.findByCheckInTimeBetween(startOfDay, endOfDay, pageable)
    }

    /**
     * Gets attendance records for a date range.
     */
    @Transactional(readOnly = true)
    fun getAttendanceByDateRange(
        startDate: LocalDate,
        endDate: LocalDate,
        pageable: Pageable
    ): Page<AttendanceRecord> {
        val start = startDate.atStartOfDay(ZoneId.systemDefault()).toInstant()
        val end = endDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant()

        return attendanceRepository.findByCheckInTimeBetween(start, end, pageable)
    }

    /**
     * Gets attendance records for a member within a date range.
     */
    @Transactional(readOnly = true)
    fun getMemberAttendanceByDateRange(
        memberId: UUID,
        startDate: LocalDate,
        endDate: LocalDate,
        pageable: Pageable
    ): Page<AttendanceRecord> {
        val start = startDate.atStartOfDay(ZoneId.systemDefault()).toInstant()
        val end = endDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant()

        return attendanceRepository.findByMemberIdAndCheckInTimeBetween(memberId, start, end, pageable)
    }

    /**
     * Gets attendance count for today.
     */
    @Transactional(readOnly = true)
    fun getTodayCheckInCount(): Long {
        val today = LocalDate.now()
        val startOfDay = today.atStartOfDay(ZoneId.systemDefault()).toInstant()
        val endOfDay = today.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant()

        return attendanceRepository.countByCheckInTimeBetween(startOfDay, endOfDay)
    }

    /**
     * Gets count of currently checked-in members.
     */
    @Transactional(readOnly = true)
    fun getCurrentlyCheckedInCount(): Long {
        return attendanceRepository.countCurrentlyCheckedIn()
    }

    /**
     * Gets total visit count for a member.
     */
    @Transactional(readOnly = true)
    fun getMemberTotalVisits(memberId: UUID): Long {
        return attendanceRepository.countByMemberId(memberId)
    }

    /**
     * Auto-checkout all members who are still checked in from previous days.
     * This is typically called by a scheduled job at midnight.
     */
    fun autoCheckoutPreviousDayMembers(): Int {
        val yesterday = LocalDate.now().minusDays(1)
        val endOfYesterday = yesterday.atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant()

        var count = 0
        var pageable = Pageable.unpaged()
        val checkedInRecords = attendanceRepository.findByStatus(AttendanceStatus.CHECKED_IN, pageable)

        for (record in checkedInRecords) {
            if (record.checkInTime.isBefore(endOfYesterday)) {
                record.autoCheckOut(endOfYesterday)
                attendanceRepository.save(record)
                count++
            }
        }

        return count
    }

    // ==================== BULK OPERATIONS ====================

    /**
     * Bulk check-in members.
     * @return Map of member ID to success/failure status
     */
    fun bulkCheckIn(
        memberIds: List<UUID>,
        locationId: UUID,
        checkInMethod: com.liyaqa.attendance.domain.model.CheckInMethod,
        notes: String?,
        createdBy: UUID?
    ): Map<UUID, Result<AttendanceRecord>> {
        return memberIds.associateWith { memberId ->
            runCatching {
                checkIn(CheckInCommand(
                    memberId = memberId,
                    locationId = locationId,
                    checkInMethod = checkInMethod,
                    notes = notes,
                    createdBy = createdBy
                ))
            }
        }
    }

    /**
     * Bulk check-out members.
     * @return Map of member ID to success/failure status
     */
    fun bulkCheckOut(
        memberIds: List<UUID>,
        notes: String?
    ): Map<UUID, Result<AttendanceRecord>> {
        return memberIds.associateWith { memberId ->
            runCatching {
                checkOut(CheckOutCommand(
                    memberId = memberId,
                    notes = notes
                ))
            }
        }
    }
}
