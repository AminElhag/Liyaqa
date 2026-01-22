package com.liyaqa.scheduling.api

import com.liyaqa.scheduling.application.services.BookingService
import com.liyaqa.shared.api.BulkItemResult
import com.liyaqa.shared.api.BulkItemStatus
import com.liyaqa.shared.api.BulkOperationResponse
import com.liyaqa.shared.api.validateBulkSize
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/bookings")
class BookingController(
    private val bookingService: BookingService
) {
    /**
     * Creates a booking for a member in a class session.
     */
    @PostMapping
    @PreAuthorize("hasAuthority('bookings_view')")
    fun createBooking(
        @Valid @RequestBody request: CreateBookingRequest,
        @AuthenticationPrincipal user: UserDetails?
    ): ResponseEntity<ClassBookingResponse> {
        val bookedBy = user?.let { UUID.fromString(it.username) }
        val booking = bookingService.createBooking(request.toCommand(bookedBy))
        return ResponseEntity.status(HttpStatus.CREATED).body(ClassBookingResponse.from(booking))
    }

    /**
     * Gets a booking by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('bookings_view')")
    fun getBooking(@PathVariable id: UUID): ResponseEntity<ClassBookingResponse> {
        val booking = bookingService.getBooking(id)
        return ResponseEntity.ok(ClassBookingResponse.from(booking))
    }

    /**
     * Gets all bookings for a session.
     */
    @GetMapping("/session/{sessionId}")
    @PreAuthorize("hasAuthority('bookings_checkin')")
    fun getBookingsBySession(@PathVariable sessionId: UUID): ResponseEntity<List<ClassBookingResponse>> {
        val bookings = bookingService.getBookingsBySession(sessionId)
        return ResponseEntity.ok(bookings.map { ClassBookingResponse.from(it) })
    }

    /**
     * Gets confirmed bookings for a session.
     */
    @GetMapping("/session/{sessionId}/confirmed")
    @PreAuthorize("hasAuthority('bookings_checkin')")
    fun getConfirmedBookingsBySession(@PathVariable sessionId: UUID): ResponseEntity<List<ClassBookingResponse>> {
        val bookings = bookingService.getConfirmedBookingsBySession(sessionId)
        return ResponseEntity.ok(bookings.map { ClassBookingResponse.from(it) })
    }

    /**
     * Gets the waitlist for a session.
     */
    @GetMapping("/session/{sessionId}/waitlist")
    @PreAuthorize("hasAuthority('bookings_checkin')")
    fun getWaitlistBySession(@PathVariable sessionId: UUID): ResponseEntity<List<ClassBookingResponse>> {
        val bookings = bookingService.getWaitlistBySession(sessionId)
        return ResponseEntity.ok(bookings.map { ClassBookingResponse.from(it) })
    }

    /**
     * Gets all bookings for a member.
     */
    @GetMapping("/member/{memberId}")
    @PreAuthorize("hasAuthority('bookings_view')")
    fun getBookingsByMember(
        @PathVariable memberId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<ClassBookingResponse>> {
        val pageable = PageRequest.of(page, size)
        val bookingsPage = bookingService.getBookingsByMember(memberId, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = bookingsPage.content.map { ClassBookingResponse.from(it) },
                page = bookingsPage.number,
                size = bookingsPage.size,
                totalElements = bookingsPage.totalElements,
                totalPages = bookingsPage.totalPages,
                first = bookingsPage.isFirst,
                last = bookingsPage.isLast
            )
        )
    }

    /**
     * Gets upcoming bookings for a member.
     */
    @GetMapping("/member/{memberId}/upcoming")
    @PreAuthorize("hasAuthority('bookings_view')")
    fun getUpcomingBookingsByMember(
        @PathVariable memberId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<ClassBookingResponse>> {
        val pageable = PageRequest.of(page, size)
        val bookingsPage = bookingService.getUpcomingBookingsByMember(memberId, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = bookingsPage.content.map { ClassBookingResponse.from(it) },
                page = bookingsPage.number,
                size = bookingsPage.size,
                totalElements = bookingsPage.totalElements,
                totalPages = bookingsPage.totalPages,
                first = bookingsPage.isFirst,
                last = bookingsPage.isLast
            )
        )
    }

    /**
     * Gets past bookings for a member.
     */
    @GetMapping("/member/{memberId}/past")
    @PreAuthorize("hasAuthority('bookings_view')")
    fun getPastBookingsByMember(
        @PathVariable memberId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<ClassBookingResponse>> {
        val pageable = PageRequest.of(page, size)
        val bookingsPage = bookingService.getPastBookingsByMember(memberId, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = bookingsPage.content.map { ClassBookingResponse.from(it) },
                page = bookingsPage.number,
                size = bookingsPage.size,
                totalElements = bookingsPage.totalElements,
                totalPages = bookingsPage.totalPages,
                first = bookingsPage.isFirst,
                last = bookingsPage.isLast
            )
        )
    }

    /**
     * Cancels a booking.
     */
    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('bookings_view')")
    fun cancelBooking(
        @PathVariable id: UUID,
        @RequestBody(required = false) request: CancelBookingRequest?
    ): ResponseEntity<ClassBookingResponse> {
        val command = (request ?: CancelBookingRequest()).toCommand(id)
        val booking = bookingService.cancelBooking(command)
        return ResponseEntity.ok(ClassBookingResponse.from(booking))
    }

    /**
     * Checks in a member for their booked class.
     */
    @PostMapping("/{id}/check-in")
    @PreAuthorize("hasAuthority('bookings_checkin')")
    fun checkInBooking(@PathVariable id: UUID): ResponseEntity<ClassBookingResponse> {
        val booking = bookingService.checkInBooking(id)
        return ResponseEntity.ok(ClassBookingResponse.from(booking))
    }

    /**
     * Marks a booking as no-show.
     */
    @PostMapping("/{id}/no-show")
    @PreAuthorize("hasAuthority('bookings_checkin')")
    fun markNoShow(@PathVariable id: UUID): ResponseEntity<ClassBookingResponse> {
        val booking = bookingService.markNoShow(id)
        return ResponseEntity.ok(ClassBookingResponse.from(booking))
    }

    /**
     * Checks if a member has booked a session.
     */
    @GetMapping("/check")
    @PreAuthorize("hasAuthority('bookings_view')")
    fun checkMemberBookedSession(
        @RequestParam sessionId: UUID,
        @RequestParam memberId: UUID
    ): ResponseEntity<Map<String, Boolean>> {
        val hasBooked = bookingService.hasMemberBookedSession(sessionId, memberId)
        return ResponseEntity.ok(mapOf("hasBooked" to hasBooked))
    }

    /**
     * Gets booking statistics for a session.
     */
    @GetMapping("/session/{sessionId}/stats")
    @PreAuthorize("hasAuthority('bookings_checkin')")
    fun getSessionBookingStats(@PathVariable sessionId: UUID): ResponseEntity<Map<String, Long>> {
        return ResponseEntity.ok(
            mapOf(
                "totalBookings" to bookingService.getBookingCountForSession(sessionId),
                "confirmedBookings" to bookingService.getConfirmedCountForSession(sessionId),
                "waitlistCount" to bookingService.getWaitlistCountForSession(sessionId)
            )
        )
    }

    /**
     * Deletes a booking.
     * Only cancelled or no-show bookings can be deleted.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('bookings_create')")
    fun deleteBooking(@PathVariable id: UUID): ResponseEntity<Unit> {
        bookingService.deleteBooking(id)
        return ResponseEntity.noContent().build()
    }

    // ==================== BULK OPERATIONS ====================

    /**
     * Bulk create bookings for multiple members in a session.
     * Restricted to SUPER_ADMIN and CLUB_ADMIN roles.
     */
    @PostMapping("/bulk/create")
    @PreAuthorize("hasAuthority('bookings_create')")
    @Operation(summary = "Bulk create bookings", description = "Create bookings for multiple members in a session at once")
    fun bulkCreateBookings(
        @Valid @RequestBody request: BulkCreateBookingsRequest,
        @AuthenticationPrincipal user: UserDetails?
    ): ResponseEntity<BulkOperationResponse> {
        validateBulkSize(request.memberIds, 100)
        val startTime = System.currentTimeMillis()

        val bookedBy = request.bookedBy ?: user?.let { UUID.fromString(it.username) }
        val resultsMap = bookingService.bulkCreateBookings(
            request.sessionId,
            request.memberIds,
            request.notes,
            bookedBy
        )

        val results = resultsMap.map { (id, result) ->
            if (result.isSuccess) {
                BulkItemResult(
                    itemId = id,
                    status = BulkItemStatus.SUCCESS,
                    message = "Booking created",
                    messageAr = "تم إنشاء الحجز"
                )
            } else {
                BulkItemResult(
                    itemId = id,
                    status = BulkItemStatus.FAILED,
                    message = result.exceptionOrNull()?.message ?: "Unknown error",
                    messageAr = "فشل في إنشاء الحجز"
                )
            }
        }

        return ResponseEntity.ok(BulkOperationResponse.from(results, startTime))
    }

    /**
     * Bulk cancel bookings.
     * Restricted to SUPER_ADMIN and CLUB_ADMIN roles.
     */
    @PostMapping("/bulk/cancel")
    @PreAuthorize("hasAuthority('bookings_create')")
    @Operation(summary = "Bulk cancel bookings", description = "Cancel multiple bookings at once")
    fun bulkCancelBookings(
        @Valid @RequestBody request: BulkCancelBookingsRequest
    ): ResponseEntity<BulkOperationResponse> {
        validateBulkSize(request.bookingIds, 100)
        val startTime = System.currentTimeMillis()

        val resultsMap = bookingService.bulkCancelBookings(
            request.bookingIds,
            request.reason
        )

        val results = resultsMap.map { (id, result) ->
            if (result.isSuccess) {
                BulkItemResult(
                    itemId = id,
                    status = BulkItemStatus.SUCCESS,
                    message = "Booking cancelled",
                    messageAr = "تم إلغاء الحجز"
                )
            } else {
                BulkItemResult(
                    itemId = id,
                    status = BulkItemStatus.FAILED,
                    message = result.exceptionOrNull()?.message ?: "Unknown error",
                    messageAr = "فشل في إلغاء الحجز"
                )
            }
        }

        return ResponseEntity.ok(BulkOperationResponse.from(results, startTime))
    }

    /**
     * Bulk check-in bookings.
     * Restricted to SUPER_ADMIN and CLUB_ADMIN roles.
     */
    @PostMapping("/bulk/check-in")
    @PreAuthorize("hasAuthority('bookings_create')")
    @Operation(summary = "Bulk check-in bookings", description = "Check in multiple bookings at once")
    fun bulkCheckInBookings(
        @Valid @RequestBody request: BulkCheckInBookingsRequest
    ): ResponseEntity<BulkOperationResponse> {
        validateBulkSize(request.bookingIds, 100)
        val startTime = System.currentTimeMillis()

        val resultsMap = bookingService.bulkCheckInBookings(request.bookingIds)

        val results = resultsMap.map { (id, result) ->
            if (result.isSuccess) {
                BulkItemResult(
                    itemId = id,
                    status = BulkItemStatus.SUCCESS,
                    message = "Booking checked in",
                    messageAr = "تم تسجيل الحضور"
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
}
