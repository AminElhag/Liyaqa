package com.liyaqa.staff.api

import com.liyaqa.attendance.application.commands.CheckInCommand
import com.liyaqa.attendance.application.services.AttendanceService
import com.liyaqa.attendance.domain.model.CheckInMethod
import com.liyaqa.facilities.application.services.FacilityBookingService
import com.liyaqa.membership.application.services.MemberService
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.shared.infrastructure.security.CurrentUser
import org.springframework.data.domain.PageRequest
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.time.LocalDate
import java.util.*

@RestController
@RequestMapping("/api/staff-mobile")
class StaffMobileController(
    private val memberService: MemberService,
    private val attendanceService: AttendanceService,
    private val facilityBookingService: FacilityBookingService
) {

    @GetMapping("/dashboard")
    fun getDashboard(currentUser: CurrentUser): ResponseEntity<StaffDashboardResponse> {
        val todayCheckIns = attendanceService.getTodayCheckInCount().toInt()
        val activeMembers = memberService.countMembersByStatus(MemberStatus.ACTIVE).toInt()
        val todayFacilityBookings = facilityBookingService.countTodayBookings()

        return ResponseEntity.ok(
            StaffDashboardResponse(
                todayCheckIns = todayCheckIns,
                activeMembers = activeMembers.toInt(),
                todaySessions = 0, // TODO: implement when ClassSessionService is available
                todayFacilityBookings = todayFacilityBookings,
                upcomingSessions = emptyList(),
                recentCheckIns = emptyList()
            )
        )
    }

    @GetMapping("/members")
    fun searchMembers(
        @RequestParam query: String,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<MemberSearchResponse> {
        val result = memberService.searchMembers(
            search = query,
            status = null,
            joinedAfter = null,
            joinedBefore = null,
            pageable = PageRequest.of(page, size)
        )

        val members = result.content.map { member ->
            MemberSummaryDto(
                id = member.id.toString(),
                memberNumber = member.id.toString().take(8).uppercase(),
                firstName = member.firstName.en,
                lastName = member.lastName.en,
                email = member.email,
                phone = member.phone,
                profileImageUrl = null,
                gender = member.gender?.name,
                membershipStatus = member.status.name,
                subscriptionName = null,
                subscriptionEndDate = null,
                canCheckIn = member.status == MemberStatus.ACTIVE,
                checkInRestrictionReason = if (member.status != MemberStatus.ACTIVE) "Membership not active" else null
            )
        }

        return ResponseEntity.ok(
            MemberSearchResponse(
                content = members,
                totalElements = result.totalElements.toInt(),
                totalPages = result.totalPages,
                page = page,
                size = size
            )
        )
    }

    @GetMapping("/members/{id}")
    fun getMemberById(@PathVariable id: UUID): ResponseEntity<MemberSummaryDto> {
        val member = try {
            memberService.getMember(id)
        } catch (e: NoSuchElementException) {
            return ResponseEntity.notFound().build()
        }

        return ResponseEntity.ok(
            MemberSummaryDto(
                id = member.id.toString(),
                memberNumber = member.id.toString().take(8).uppercase(),
                firstName = member.firstName.en,
                lastName = member.lastName.en,
                email = member.email,
                phone = member.phone,
                profileImageUrl = null,
                gender = member.gender?.name,
                membershipStatus = member.status.name,
                subscriptionName = null,
                subscriptionEndDate = null,
                canCheckIn = member.status == MemberStatus.ACTIVE,
                checkInRestrictionReason = if (member.status != MemberStatus.ACTIVE) "Membership not active" else null
            )
        )
    }

    @PostMapping("/attendance/check-in")
    fun checkInMember(
        @RequestBody request: CheckInRequest,
        currentUser: CurrentUser
    ): ResponseEntity<RecentCheckInDto> {
        val memberId = UUID.fromString(request.memberId)
        val member = memberService.getMember(memberId)

        val checkInMethod = try {
            CheckInMethod.valueOf(request.source)
        } catch (e: IllegalArgumentException) {
            CheckInMethod.MANUAL
        }

        val command = CheckInCommand(
            memberId = memberId,
            checkInMethod = checkInMethod,
            createdBy = currentUser.id
        )

        val checkIn = attendanceService.checkIn(command)

        return ResponseEntity.ok(
            RecentCheckInDto(
                memberId = checkIn.memberId.toString(),
                memberName = "${member.firstName.en} ${member.lastName.en}",
                memberNumber = member.id.toString().take(8).uppercase(),
                checkedInAt = checkIn.checkInTime.toString(),
                source = checkIn.checkInMethod.name
            )
        )
    }

    @GetMapping("/facility-bookings/today")
    fun getTodayFacilityBookings(): ResponseEntity<TodayFacilityBookingsResponse> {
        val today = LocalDate.now()
        val bookings = facilityBookingService.getBookingsByDate(today)

        val bookingDtos = bookings.map { booking ->
            FacilityBookingDto(
                id = booking.id.toString(),
                facilityId = booking.facilityId.toString(),
                facilityName = LocalizedTextDto(
                    en = booking.facilityName.en,
                    ar = booking.facilityName.ar
                ),
                facilityType = booking.facilityType.name,
                memberId = booking.memberId.toString(),
                memberName = booking.memberName,
                memberNumber = booking.memberNumber,
                memberPhone = booking.memberPhone,
                slotDate = booking.slotDate.toString(),
                startTime = booking.startTime.toString(),
                endTime = booking.endTime.toString(),
                status = booking.status.name,
                checkedInAt = booking.checkedInAt?.toString()
            )
        }

        return ResponseEntity.ok(
            TodayFacilityBookingsResponse(
                bookings = bookingDtos,
                totalBookings = bookings.size,
                totalAttended = bookings.count { it.status.name == "COMPLETED" }
            )
        )
    }

    @PostMapping("/facility-bookings/{bookingId}/check-in")
    fun checkInFacilityBooking(@PathVariable bookingId: UUID): ResponseEntity<FacilityBookingDto> {
        val booking = facilityBookingService.checkInEnriched(bookingId)

        return ResponseEntity.ok(
            FacilityBookingDto(
                id = booking.id.toString(),
                facilityId = booking.facilityId.toString(),
                facilityName = LocalizedTextDto(
                    en = booking.facilityName.en,
                    ar = booking.facilityName.ar
                ),
                facilityType = booking.facilityType.name,
                memberId = booking.memberId.toString(),
                memberName = booking.memberName,
                memberNumber = booking.memberNumber,
                memberPhone = booking.memberPhone,
                slotDate = booking.slotDate.toString(),
                startTime = booking.startTime.toString(),
                endTime = booking.endTime.toString(),
                status = booking.status.name,
                checkedInAt = booking.checkedInAt?.toString()
            )
        )
    }

    @PostMapping("/facility-bookings/{bookingId}/cancel")
    fun cancelFacilityBooking(@PathVariable bookingId: UUID): ResponseEntity<FacilityBookingDto> {
        val booking = facilityBookingService.cancelEnriched(bookingId)

        return ResponseEntity.ok(
            FacilityBookingDto(
                id = booking.id.toString(),
                facilityId = booking.facilityId.toString(),
                facilityName = LocalizedTextDto(
                    en = booking.facilityName.en,
                    ar = booking.facilityName.ar
                ),
                facilityType = booking.facilityType.name,
                memberId = booking.memberId.toString(),
                memberName = booking.memberName,
                memberNumber = booking.memberNumber,
                memberPhone = booking.memberPhone,
                slotDate = booking.slotDate.toString(),
                startTime = booking.startTime.toString(),
                endTime = booking.endTime.toString(),
                status = booking.status.name,
                checkedInAt = booking.checkedInAt?.toString()
            )
        )
    }
}

// DTOs
data class LocalizedTextDto(val en: String, val ar: String?)

data class StaffDashboardResponse(
    val todayCheckIns: Int,
    val activeMembers: Int,
    val todaySessions: Int,
    val todayFacilityBookings: Int,
    val upcomingSessions: List<SessionSummaryDto>,
    val recentCheckIns: List<RecentCheckInDto>
)

data class MemberSummaryDto(
    val id: String,
    val memberNumber: String,
    val firstName: String,
    val lastName: String,
    val email: String?,
    val phone: String?,
    val profileImageUrl: String?,
    val gender: String?,
    val membershipStatus: String,
    val subscriptionName: LocalizedTextDto?,
    val subscriptionEndDate: String?,
    val canCheckIn: Boolean,
    val checkInRestrictionReason: String?
)

data class MemberSearchResponse(
    val content: List<MemberSummaryDto>,
    val totalElements: Int,
    val totalPages: Int,
    val page: Int,
    val size: Int
)

data class CheckInRequest(
    val memberId: String,
    val source: String = "MANUAL"
)

data class RecentCheckInDto(
    val memberId: String,
    val memberName: String,
    val memberNumber: String,
    val checkedInAt: String,
    val source: String
)

data class SessionSummaryDto(
    val id: String,
    val className: LocalizedTextDto,
    val classType: String,
    val trainerName: String,
    val startTime: String,
    val endTime: String,
    val roomName: LocalizedTextDto?,
    val capacity: Int,
    val bookedCount: Int,
    val attendedCount: Int,
    val waitlistCount: Int
)

data class TodaySessionsResponse(
    val sessions: List<SessionSummaryDto>,
    val totalBookings: Int,
    val totalAttended: Int
)

data class SessionBookingDto(
    val id: String,
    val memberId: String,
    val memberName: String,
    val memberNumber: String,
    val memberPhone: String?,
    val memberEmail: String?,
    val status: String,
    val bookedAt: String,
    val checkedInAt: String?
)

data class FacilityBookingDto(
    val id: String,
    val facilityId: String,
    val facilityName: LocalizedTextDto,
    val facilityType: String,
    val memberId: String,
    val memberName: String,
    val memberNumber: String,
    val memberPhone: String?,
    val slotDate: String,
    val startTime: String,
    val endTime: String,
    val status: String,
    val checkedInAt: String?
)

data class TodayFacilityBookingsResponse(
    val bookings: List<FacilityBookingDto>,
    val totalBookings: Int,
    val totalAttended: Int
)
