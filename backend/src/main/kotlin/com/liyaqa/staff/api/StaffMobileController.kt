package com.liyaqa.staff.api

import com.liyaqa.attendance.application.services.AttendanceService
import com.liyaqa.classes.application.services.ClassBookingService
import com.liyaqa.classes.application.services.ClassSessionService
import com.liyaqa.facilities.application.services.FacilityBookingService
import com.liyaqa.membership.application.services.MemberService
import org.springframework.data.domain.PageRequest
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.util.*

@RestController
@RequestMapping("/api/staff-mobile")
class StaffMobileController(
    private val memberService: MemberService,
    private val attendanceService: AttendanceService,
    private val classSessionService: ClassSessionService,
    private val classBookingService: ClassBookingService,
    private val facilityBookingService: FacilityBookingService
) {

    @GetMapping("/dashboard")
    fun getDashboard(@AuthenticationPrincipal jwt: Jwt): ResponseEntity<StaffDashboardResponse> {
        val today = LocalDate.now()

        val todayCheckIns = attendanceService.countTodayCheckIns()
        val activeMembers = memberService.countActiveMembers()
        val todaySessions = classSessionService.countTodaySessions()
        val todayFacilityBookings = facilityBookingService.countTodayBookings()

        val upcomingSessions = classSessionService.getUpcomingSessions(today, 3).map { session ->
            SessionSummaryDto(
                id = session.id.toString(),
                className = LocalizedTextDto(
                    en = session.className.en,
                    ar = session.className.ar
                ),
                classType = session.classType.name,
                trainerName = session.trainerName ?: "TBD",
                startTime = session.startTime.toString(),
                endTime = session.endTime.toString(),
                roomName = session.roomName?.let { LocalizedTextDto(it.en, it.ar) },
                capacity = session.capacity,
                bookedCount = session.bookedCount,
                attendedCount = session.attendedCount,
                waitlistCount = session.waitlistCount
            )
        }

        val recentCheckIns = attendanceService.getRecentCheckIns(5).map { checkIn ->
            RecentCheckInDto(
                memberId = checkIn.memberId.toString(),
                memberName = checkIn.memberName,
                memberNumber = checkIn.memberNumber,
                checkedInAt = checkIn.checkInTime.toString(),
                source = checkIn.source.name
            )
        }

        return ResponseEntity.ok(
            StaffDashboardResponse(
                todayCheckIns = todayCheckIns,
                activeMembers = activeMembers,
                todaySessions = todaySessions,
                todayFacilityBookings = todayFacilityBookings,
                upcomingSessions = upcomingSessions,
                recentCheckIns = recentCheckIns
            )
        )
    }

    @GetMapping("/members")
    fun searchMembers(
        @RequestParam query: String,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<MemberSearchResponse> {
        val result = memberService.searchMembers(query, PageRequest.of(page, size))

        val members = result.content.map { member ->
            MemberSummaryDto(
                id = member.id.toString(),
                memberNumber = member.memberNumber,
                firstName = member.firstName,
                lastName = member.lastName,
                email = member.email,
                phone = member.phone,
                profileImageUrl = member.profileImageUrl,
                gender = member.gender?.name,
                membershipStatus = member.status.name,
                subscriptionName = member.activeSubscription?.plan?.name?.let {
                    LocalizedTextDto(it.en, it.ar)
                },
                subscriptionEndDate = member.activeSubscription?.endDate?.toString(),
                canCheckIn = member.canCheckIn(),
                checkInRestrictionReason = member.getCheckInRestriction()
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
        val member = memberService.getMember(id)
            ?: return ResponseEntity.notFound().build()

        return ResponseEntity.ok(
            MemberSummaryDto(
                id = member.id.toString(),
                memberNumber = member.memberNumber,
                firstName = member.firstName,
                lastName = member.lastName,
                email = member.email,
                phone = member.phone,
                profileImageUrl = member.profileImageUrl,
                gender = member.gender?.name,
                membershipStatus = member.status.name,
                subscriptionName = member.activeSubscription?.plan?.name?.let {
                    LocalizedTextDto(it.en, it.ar)
                },
                subscriptionEndDate = member.activeSubscription?.endDate?.toString(),
                canCheckIn = member.canCheckIn(),
                checkInRestrictionReason = member.getCheckInRestriction()
            )
        )
    }

    @GetMapping("/members/qr/{qrCode}")
    fun getMemberByQrCode(@PathVariable qrCode: String): ResponseEntity<MemberSummaryDto> {
        val member = memberService.getMemberByQrCode(qrCode)
            ?: return ResponseEntity.notFound().build()

        return ResponseEntity.ok(
            MemberSummaryDto(
                id = member.id.toString(),
                memberNumber = member.memberNumber,
                firstName = member.firstName,
                lastName = member.lastName,
                email = member.email,
                phone = member.phone,
                profileImageUrl = member.profileImageUrl,
                gender = member.gender?.name,
                membershipStatus = member.status.name,
                subscriptionName = member.activeSubscription?.plan?.name?.let {
                    LocalizedTextDto(it.en, it.ar)
                },
                subscriptionEndDate = member.activeSubscription?.endDate?.toString(),
                canCheckIn = member.canCheckIn(),
                checkInRestrictionReason = member.getCheckInRestriction()
            )
        )
    }

    @PostMapping("/attendance/check-in")
    fun checkInMember(
        @RequestBody request: CheckInRequest,
        @AuthenticationPrincipal jwt: Jwt
    ): ResponseEntity<RecentCheckInDto> {
        val staffId = UUID.fromString(jwt.subject)
        val checkIn = attendanceService.checkIn(
            memberId = UUID.fromString(request.memberId),
            source = request.source,
            staffId = staffId
        )

        return ResponseEntity.ok(
            RecentCheckInDto(
                memberId = checkIn.memberId.toString(),
                memberName = checkIn.memberName,
                memberNumber = checkIn.memberNumber,
                checkedInAt = checkIn.checkInTime.toString(),
                source = checkIn.source.name
            )
        )
    }

    @GetMapping("/attendance/recent")
    fun getRecentCheckIns(
        @RequestParam(defaultValue = "10") limit: Int
    ): ResponseEntity<List<RecentCheckInDto>> {
        val checkIns = attendanceService.getRecentCheckIns(limit).map { checkIn ->
            RecentCheckInDto(
                memberId = checkIn.memberId.toString(),
                memberName = checkIn.memberName,
                memberNumber = checkIn.memberNumber,
                checkedInAt = checkIn.checkInTime.toString(),
                source = checkIn.source.name
            )
        }

        return ResponseEntity.ok(checkIns)
    }

    @GetMapping("/sessions/today")
    fun getTodaySessions(): ResponseEntity<TodaySessionsResponse> {
        val today = LocalDate.now()
        val sessions = classSessionService.getSessionsByDate(today)

        val sessionDtos = sessions.map { session ->
            SessionSummaryDto(
                id = session.id.toString(),
                className = LocalizedTextDto(
                    en = session.className.en,
                    ar = session.className.ar
                ),
                classType = session.classType.name,
                trainerName = session.trainerName ?: "TBD",
                startTime = session.startTime.toString(),
                endTime = session.endTime.toString(),
                roomName = session.roomName?.let { LocalizedTextDto(it.en, it.ar) },
                capacity = session.capacity,
                bookedCount = session.bookedCount,
                attendedCount = session.attendedCount,
                waitlistCount = session.waitlistCount
            )
        }

        return ResponseEntity.ok(
            TodaySessionsResponse(
                sessions = sessionDtos,
                totalBookings = sessions.sumOf { it.bookedCount },
                totalAttended = sessions.sumOf { it.attendedCount }
            )
        )
    }

    @GetMapping("/sessions/{id}")
    fun getSessionById(@PathVariable id: UUID): ResponseEntity<SessionSummaryDto> {
        val session = classSessionService.getSession(id)
            ?: return ResponseEntity.notFound().build()

        return ResponseEntity.ok(
            SessionSummaryDto(
                id = session.id.toString(),
                className = LocalizedTextDto(
                    en = session.className.en,
                    ar = session.className.ar
                ),
                classType = session.classType.name,
                trainerName = session.trainerName ?: "TBD",
                startTime = session.startTime.toString(),
                endTime = session.endTime.toString(),
                roomName = session.roomName?.let { LocalizedTextDto(it.en, it.ar) },
                capacity = session.capacity,
                bookedCount = session.bookedCount,
                attendedCount = session.attendedCount,
                waitlistCount = session.waitlistCount
            )
        )
    }

    @GetMapping("/sessions/{sessionId}/bookings")
    fun getSessionBookings(@PathVariable sessionId: UUID): ResponseEntity<List<SessionBookingDto>> {
        val bookings = classBookingService.getBookingsBySession(sessionId).map { booking ->
            SessionBookingDto(
                id = booking.id.toString(),
                memberId = booking.memberId.toString(),
                memberName = booking.memberName,
                memberNumber = booking.memberNumber,
                memberPhone = booking.memberPhone,
                memberEmail = booking.memberEmail,
                status = booking.status.name,
                bookedAt = booking.bookedAt.toString(),
                checkedInAt = booking.checkedInAt?.toString()
            )
        }

        return ResponseEntity.ok(bookings)
    }

    @PostMapping("/bookings/{bookingId}/check-in")
    fun markBookingAttended(@PathVariable bookingId: UUID): ResponseEntity<SessionBookingDto> {
        val booking = classBookingService.markAttended(bookingId)

        return ResponseEntity.ok(
            SessionBookingDto(
                id = booking.id.toString(),
                memberId = booking.memberId.toString(),
                memberName = booking.memberName,
                memberNumber = booking.memberNumber,
                memberPhone = booking.memberPhone,
                memberEmail = booking.memberEmail,
                status = booking.status.name,
                bookedAt = booking.bookedAt.toString(),
                checkedInAt = booking.checkedInAt?.toString()
            )
        )
    }

    @PostMapping("/bookings/{bookingId}/no-show")
    fun markBookingNoShow(@PathVariable bookingId: UUID): ResponseEntity<SessionBookingDto> {
        val booking = classBookingService.markNoShow(bookingId)

        return ResponseEntity.ok(
            SessionBookingDto(
                id = booking.id.toString(),
                memberId = booking.memberId.toString(),
                memberName = booking.memberName,
                memberNumber = booking.memberNumber,
                memberPhone = booking.memberPhone,
                memberEmail = booking.memberEmail,
                status = booking.status.name,
                bookedAt = booking.bookedAt.toString(),
                checkedInAt = booking.checkedInAt?.toString()
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
                totalAttended = bookings.count { it.status.name == "ATTENDED" }
            )
        )
    }

    @PostMapping("/facility-bookings/{bookingId}/check-in")
    fun checkInFacilityBooking(@PathVariable bookingId: UUID): ResponseEntity<FacilityBookingDto> {
        val booking = facilityBookingService.checkIn(bookingId)

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
        val booking = facilityBookingService.cancel(bookingId)

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
