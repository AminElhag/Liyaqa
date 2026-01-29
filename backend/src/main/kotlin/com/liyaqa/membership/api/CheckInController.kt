package com.liyaqa.membership.api

import com.liyaqa.membership.application.services.CheckInService
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.shared.api.PageResponse
import jakarta.validation.Valid
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.web.PageableDefault
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
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
class CheckInController(
    private val checkInService: CheckInService,
    private val memberRepository: MemberRepository
) {

    /**
     * Check in a member by their ID.
     */
    @PostMapping("/admin/members/{memberId}/check-in")
    @PreAuthorize("hasAnyAuthority('members_manage', 'check_in_manage')")
    fun checkInMember(
        @PathVariable memberId: UUID,
        @Valid @RequestBody request: CheckInRequest,
        @AuthenticationPrincipal user: UserDetails?
    ): ResponseEntity<CheckInResponse> {
        val staffUserId = user?.let { UUID.fromString(it.username) }

        val result = checkInService.checkIn(
            memberId = memberId,
            method = request.method,
            deviceId = request.deviceId,
            location = request.location,
            staffUserId = staffUserId,
            notes = request.notes
        )

        return ResponseEntity.status(HttpStatus.CREATED).body(CheckInResponse.from(result))
    }

    /**
     * Check out a member by their member ID.
     */
    @PostMapping("/admin/members/{memberId}/check-out")
    @PreAuthorize("hasAnyAuthority('members_manage', 'check_in_manage')")
    fun checkOutMember(
        @PathVariable memberId: UUID
    ): ResponseEntity<CheckInHistoryResponse> {
        val checkIn = checkInService.checkOutByMemberId(memberId)
        return ResponseEntity.ok(CheckInHistoryResponse.from(checkIn))
    }

    /**
     * Check out by check-in ID.
     */
    @PostMapping("/check-ins/{checkInId}/check-out")
    @PreAuthorize("hasAnyAuthority('members_manage', 'check_in_manage')")
    fun checkOut(
        @PathVariable checkInId: UUID
    ): ResponseEntity<CheckInHistoryResponse> {
        val checkIn = checkInService.checkOut(checkInId)
        return ResponseEntity.ok(CheckInHistoryResponse.from(checkIn))
    }

    /**
     * Validate if a member can check in.
     */
    @GetMapping("/members/{memberId}/check-in/validate")
    @PreAuthorize("hasAnyAuthority('members_view', 'check_in_manage')")
    fun validateCheckIn(
        @PathVariable memberId: UUID
    ): ResponseEntity<CheckInValidationResponse> {
        val validation = checkInService.validateCheckIn(memberId)
        return ResponseEntity.ok(CheckInValidationResponse.from(validation))
    }

    /**
     * Get check-in history for a member.
     */
    @GetMapping("/members/{memberId}/check-ins")
    @PreAuthorize("hasAnyAuthority('members_view', 'check_in_view')")
    fun getCheckInHistory(
        @PathVariable memberId: UUID,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate?,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate?,
        @PageableDefault(size = 20, sort = ["checkInTime"], direction = Sort.Direction.DESC) pageable: Pageable
    ): ResponseEntity<PageResponse<CheckInHistoryResponse>> {
        val page = if (startDate != null && endDate != null) {
            checkInService.getCheckInHistory(memberId, startDate, endDate, pageable)
        } else {
            checkInService.getCheckInHistory(memberId, pageable)
        }

        return ResponseEntity.ok(
            PageResponse(
                content = page.content.map { CheckInHistoryResponse.from(it) },
                totalElements = page.totalElements,
                totalPages = page.totalPages,
                page = page.number,
                size = page.size
            )
        )
    }

    /**
     * Get visit statistics for a member.
     */
    @GetMapping("/members/{memberId}/visit-stats")
    @PreAuthorize("hasAnyAuthority('members_view', 'check_in_view')")
    fun getVisitStats(
        @PathVariable memberId: UUID
    ): ResponseEntity<VisitStatsResponse> {
        val stats = checkInService.getVisitStats(memberId)
        return ResponseEntity.ok(VisitStatsResponse.from(stats))
    }

    /**
     * Get a member's active check-in session.
     */
    @GetMapping("/members/{memberId}/active-check-in")
    @PreAuthorize("hasAnyAuthority('members_view', 'check_in_view')")
    fun getActiveCheckIn(
        @PathVariable memberId: UUID
    ): ResponseEntity<CheckInHistoryResponse> {
        val checkIn = checkInService.getActiveCheckIn(memberId)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(CheckInHistoryResponse.from(checkIn))
    }

    /**
     * Get today's check-ins for the dashboard.
     */
    @GetMapping("/check-ins/today")
    @PreAuthorize("hasAnyAuthority('dashboard_view', 'check_in_view')")
    fun getTodayCheckIns(
        @PageableDefault(size = 50, sort = ["checkInTime"], direction = Sort.Direction.DESC) pageable: Pageable
    ): ResponseEntity<TodayCheckInsResponse> {
        val totalCount = checkInService.getTodayCheckInCount()
        val checkInsPage = checkInService.getTodayCheckIns(pageable)

        val checkInItems = checkInsPage.content.map { checkIn ->
            val member = memberRepository.findById(checkIn.memberId).orElse(null)
            TodayCheckInItem(
                id = checkIn.id,
                memberId = checkIn.memberId,
                memberName = member?.fullName?.en ?: "Unknown",
                memberPhoto = null, // TODO: Add photo URL when available
                checkInTime = checkIn.checkInTime,
                checkOutTime = checkIn.checkOutTime,
                method = checkIn.method,
                isCheckedOut = checkIn.isCheckedOut(),
                duration = checkIn.getFormattedDuration()
            )
        }

        return ResponseEntity.ok(
            TodayCheckInsResponse(
                totalCheckIns = totalCount,
                checkIns = checkInItems
            )
        )
    }

    /**
     * Get check-ins for a specific date.
     */
    @GetMapping("/check-ins/by-date")
    @PreAuthorize("hasAnyAuthority('dashboard_view', 'check_in_view')")
    fun getCheckInsByDate(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) date: LocalDate,
        @PageableDefault(size = 50, sort = ["checkInTime"], direction = Sort.Direction.DESC) pageable: Pageable
    ): ResponseEntity<PageResponse<CheckInHistoryResponse>> {
        val page = checkInService.getCheckInsByDate(date, pageable)
        return ResponseEntity.ok(
            PageResponse(
                content = page.content.map { CheckInHistoryResponse.from(it) },
                totalElements = page.totalElements,
                totalPages = page.totalPages,
                page = page.number,
                size = page.size
            )
        )
    }

    /**
     * Get check-in heatmap data (hour and day distribution).
     */
    @GetMapping("/check-ins/heatmap")
    @PreAuthorize("hasAnyAuthority('analytics_view', 'dashboard_view')")
    fun getCheckInHeatmap(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate?,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate?
    ): ResponseEntity<CheckInHeatmapResponse> {
        val start = startDate ?: LocalDate.now().minusDays(30)
        val end = endDate ?: LocalDate.now()

        val hourDistribution = checkInService.getCheckInHourDistribution(start, end)
        val dayDistribution = checkInService.getCheckInDayDistribution(start, end)

        return ResponseEntity.ok(
            CheckInHeatmapResponse(
                hourDistribution = hourDistribution,
                dayDistribution = dayDistribution,
                startDate = start,
                endDate = end
            )
        )
    }
}
