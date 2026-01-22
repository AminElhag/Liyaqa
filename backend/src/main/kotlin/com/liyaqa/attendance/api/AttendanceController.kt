package com.liyaqa.attendance.api

import com.liyaqa.attendance.application.services.AttendanceService
import com.liyaqa.auth.infrastructure.security.JwtUserPrincipal
import com.liyaqa.shared.api.BulkItemResult
import com.liyaqa.shared.api.BulkItemStatus
import com.liyaqa.shared.api.BulkOperationResponse
import com.liyaqa.shared.api.validateBulkSize
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate
import java.util.UUID

@RestController
@RequestMapping("/api")
class AttendanceController(
    private val attendanceService: AttendanceService
) {
    /**
     * Check in a member at a location.
     */
    @PostMapping("/members/{memberId}/check-in")
    @PreAuthorize("hasAuthority('attendance_checkin')")
    fun checkIn(
        @PathVariable memberId: UUID,
        @Valid @RequestBody request: CheckInRequest,
        @AuthenticationPrincipal principal: JwtUserPrincipal?
    ): ResponseEntity<AttendanceResponse> {
        val command = request.toCommand(memberId, principal?.userId)
        val record = attendanceService.checkIn(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(AttendanceResponse.from(record))
    }

    /**
     * Check out a member.
     */
    @PostMapping("/members/{memberId}/check-out")
    @PreAuthorize("hasAuthority('attendance_checkout')")
    fun checkOut(
        @PathVariable memberId: UUID,
        @RequestBody(required = false) request: CheckOutRequest?
    ): ResponseEntity<AttendanceResponse> {
        val command = (request ?: CheckOutRequest()).toCommand(memberId)
        val record = attendanceService.checkOut(command)
        return ResponseEntity.ok(AttendanceResponse.from(record))
    }

    /**
     * Get current check-in status for a member.
     */
    @GetMapping("/members/{memberId}/check-in/current")
    @PreAuthorize("hasAuthority('attendance_view') or @securityService.isSelf(#memberId)")
    fun getCurrentCheckIn(@PathVariable memberId: UUID): ResponseEntity<AttendanceResponse> {
        val record = attendanceService.getCurrentCheckIn(memberId)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(AttendanceResponse.from(record))
    }

    /**
     * Get attendance history for a member.
     */
    @GetMapping("/members/{memberId}/attendance")
    @PreAuthorize("hasAuthority('attendance_view') or @securityService.isSelf(#memberId)")
    fun getMemberAttendance(
        @PathVariable memberId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "checkInTime") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<AttendancePageResponse> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)
        val recordsPage = attendanceService.getAttendanceByMember(memberId, pageable)

        return ResponseEntity.ok(
            AttendancePageResponse(
                content = recordsPage.content.map { AttendanceResponse.from(it) },
                page = recordsPage.number,
                size = recordsPage.size,
                totalElements = recordsPage.totalElements,
                totalPages = recordsPage.totalPages,
                first = recordsPage.isFirst,
                last = recordsPage.isLast
            )
        )
    }

    /**
     * Get member attendance by date range.
     */
    @GetMapping("/members/{memberId}/attendance/range")
    @PreAuthorize("hasAuthority('attendance_view') or @securityService.isSelf(#memberId)")
    fun getMemberAttendanceByDateRange(
        @PathVariable memberId: UUID,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<AttendancePageResponse> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "checkInTime"))
        val recordsPage = attendanceService.getMemberAttendanceByDateRange(memberId, startDate, endDate, pageable)

        return ResponseEntity.ok(
            AttendancePageResponse(
                content = recordsPage.content.map { AttendanceResponse.from(it) },
                page = recordsPage.number,
                size = recordsPage.size,
                totalElements = recordsPage.totalElements,
                totalPages = recordsPage.totalPages,
                first = recordsPage.isFirst,
                last = recordsPage.isLast
            )
        )
    }

    /**
     * Get total visit count for a member.
     */
    @GetMapping("/members/{memberId}/attendance/count")
    @PreAuthorize("hasAuthority('attendance_view') or @securityService.isSelf(#memberId)")
    fun getMemberVisitCount(@PathVariable memberId: UUID): ResponseEntity<Map<String, Long>> {
        val count = attendanceService.getMemberTotalVisits(memberId)
        return ResponseEntity.ok(mapOf("totalVisits" to count))
    }

    /**
     * Get an attendance record by ID.
     */
    @GetMapping("/attendance/{id}")
    @PreAuthorize("hasAuthority('attendance_view')")
    fun getAttendanceRecord(@PathVariable id: UUID): ResponseEntity<AttendanceResponse> {
        val record = attendanceService.getAttendanceRecord(id)
        return ResponseEntity.ok(AttendanceResponse.from(record))
    }

    /**
     * List all attendance records.
     */
    @GetMapping("/attendance")
    @PreAuthorize("hasAuthority('attendance_view')")
    fun getAllAttendance(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "checkInTime") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<AttendancePageResponse> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)
        val recordsPage = attendanceService.getAllAttendanceRecords(pageable)

        return ResponseEntity.ok(
            AttendancePageResponse(
                content = recordsPage.content.map { AttendanceResponse.from(it) },
                page = recordsPage.number,
                size = recordsPage.size,
                totalElements = recordsPage.totalElements,
                totalPages = recordsPage.totalPages,
                first = recordsPage.isFirst,
                last = recordsPage.isLast
            )
        )
    }

    /**
     * Get today's attendance summary.
     */
    @GetMapping("/attendance/today")
    @PreAuthorize("hasAuthority('attendance_view')")
    fun getTodayAttendance(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "50") size: Int
    ): ResponseEntity<TodaySummaryResponse> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "checkInTime"))
        val recordsPage = attendanceService.getTodayAttendance(pageable)
        val totalCheckIns = attendanceService.getTodayCheckInCount()
        val currentlyCheckedIn = attendanceService.getCurrentlyCheckedInCount()

        return ResponseEntity.ok(
            TodaySummaryResponse(
                totalCheckIns = totalCheckIns,
                currentlyCheckedIn = currentlyCheckedIn,
                checkIns = recordsPage.content.map { AttendanceResponse.from(it) }
            )
        )
    }

    /**
     * Get currently checked-in members.
     */
    @GetMapping("/attendance/checked-in")
    @PreAuthorize("hasAuthority('attendance_view')")
    fun getCurrentlyCheckedIn(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "50") size: Int
    ): ResponseEntity<AttendancePageResponse> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "checkInTime"))
        val recordsPage = attendanceService.getCurrentlyCheckedIn(pageable)

        return ResponseEntity.ok(
            AttendancePageResponse(
                content = recordsPage.content.map { AttendanceResponse.from(it) },
                page = recordsPage.number,
                size = recordsPage.size,
                totalElements = recordsPage.totalElements,
                totalPages = recordsPage.totalPages,
                first = recordsPage.isFirst,
                last = recordsPage.isLast
            )
        )
    }

    /**
     * Get attendance by date range.
     */
    @GetMapping("/attendance/range")
    @PreAuthorize("hasAuthority('attendance_view')")
    fun getAttendanceByDateRange(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<AttendancePageResponse> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "checkInTime"))
        val recordsPage = attendanceService.getAttendanceByDateRange(startDate, endDate, pageable)

        return ResponseEntity.ok(
            AttendancePageResponse(
                content = recordsPage.content.map { AttendanceResponse.from(it) },
                page = recordsPage.number,
                size = recordsPage.size,
                totalElements = recordsPage.totalElements,
                totalPages = recordsPage.totalPages,
                first = recordsPage.isFirst,
                last = recordsPage.isLast
            )
        )
    }

    /**
     * Get attendance for a specific location.
     */
    @GetMapping("/locations/{locationId}/attendance")
    @PreAuthorize("hasAuthority('attendance_view')")
    fun getLocationAttendance(
        @PathVariable locationId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "checkInTime") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<AttendancePageResponse> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)
        val recordsPage = attendanceService.getAttendanceByLocation(locationId, pageable)

        return ResponseEntity.ok(
            AttendancePageResponse(
                content = recordsPage.content.map { AttendanceResponse.from(it) },
                page = recordsPage.number,
                size = recordsPage.size,
                totalElements = recordsPage.totalElements,
                totalPages = recordsPage.totalPages,
                first = recordsPage.isFirst,
                last = recordsPage.isLast
            )
        )
    }

    // ==================== BULK OPERATIONS ====================

    /**
     * Bulk check-in multiple members at a location.
     * Restricted to SUPER_ADMIN and CLUB_ADMIN roles.
     */
    @PostMapping("/attendance/bulk/check-in")
    @PreAuthorize("hasAuthority('attendance_checkin')")
    @Operation(summary = "Bulk check-in members", description = "Check in multiple members at a location at once")
    fun bulkCheckIn(
        @Valid @RequestBody request: BulkCheckInRequest,
        @AuthenticationPrincipal principal: JwtUserPrincipal?
    ): ResponseEntity<BulkOperationResponse> {
        validateBulkSize(request.memberIds, 100)
        val startTime = System.currentTimeMillis()

        val resultsMap = attendanceService.bulkCheckIn(
            request.memberIds,
            request.locationId,
            request.checkInMethod,
            request.notes,
            request.createdBy ?: principal?.userId
        )

        val results = resultsMap.map { (id, result) ->
            if (result.isSuccess) {
                BulkItemResult(
                    itemId = id,
                    status = BulkItemStatus.SUCCESS,
                    message = "Member checked in",
                    messageAr = "تم تسجيل حضور العضو"
                )
            } else {
                BulkItemResult(
                    itemId = id,
                    status = BulkItemStatus.FAILED,
                    message = result.exceptionOrNull()?.message ?: "Unknown error",
                    messageAr = "فشل في تسجيل الحضور"
                )
            }
        }

        return ResponseEntity.ok(BulkOperationResponse.from(results, startTime))
    }

    /**
     * Bulk check-out multiple members.
     * Restricted to SUPER_ADMIN and CLUB_ADMIN roles.
     */
    @PostMapping("/attendance/bulk/check-out")
    @PreAuthorize("hasAuthority('attendance_checkin')")
    @Operation(summary = "Bulk check-out members", description = "Check out multiple members at once")
    fun bulkCheckOut(
        @Valid @RequestBody request: BulkCheckOutRequest
    ): ResponseEntity<BulkOperationResponse> {
        validateBulkSize(request.memberIds, 100)
        val startTime = System.currentTimeMillis()

        val resultsMap = attendanceService.bulkCheckOut(
            request.memberIds,
            request.notes
        )

        val results = resultsMap.map { (id, result) ->
            if (result.isSuccess) {
                BulkItemResult(
                    itemId = id,
                    status = BulkItemStatus.SUCCESS,
                    message = "Member checked out",
                    messageAr = "تم تسجيل مغادرة العضو"
                )
            } else {
                BulkItemResult(
                    itemId = id,
                    status = BulkItemStatus.FAILED,
                    message = result.exceptionOrNull()?.message ?: "Unknown error",
                    messageAr = "فشل في تسجيل المغادرة"
                )
            }
        }

        return ResponseEntity.ok(BulkOperationResponse.from(results, startTime))
    }
}
