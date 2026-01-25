package com.liyaqa.facilities.api

import com.liyaqa.facilities.application.commands.CreateBookingCommand
import com.liyaqa.facilities.application.services.FacilityBookingService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api")
@Tag(name = "Facility Bookings", description = "Facility booking management")
class FacilityBookingController(
    private val bookingService: FacilityBookingService
) {
    @PostMapping("/facilities/{facilityId}/bookings")
    @PreAuthorize("hasAuthority('facility_bookings_create')")
    @Operation(summary = "Create a facility booking")
    fun createBooking(
        @PathVariable facilityId: UUID,
        @Valid @RequestBody request: CreateBookingRequest
    ): ResponseEntity<FacilityBookingResponse> {
        val command = CreateBookingCommand(
            facilityId = facilityId,
            slotId = request.slotId,
            memberId = request.memberId,
            notes = request.notes
        )
        val booking = bookingService.createBooking(command)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(FacilityBookingResponse.from(booking))
    }

    @GetMapping("/facilities/{facilityId}/bookings")
    @PreAuthorize("hasAuthority('facility_bookings_view')")
    @Operation(summary = "Get bookings for a facility")
    fun getFacilityBookings(
        @PathVariable facilityId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<FacilityBookingResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "bookedAt"))
        val bookingsPage = bookingService.getFacilityBookings(facilityId, pageable)

        val response = PageResponse(
            content = bookingsPage.content.map { FacilityBookingResponse.from(it) },
            page = bookingsPage.number,
            size = bookingsPage.size,
            totalElements = bookingsPage.totalElements,
            totalPages = bookingsPage.totalPages,
            first = bookingsPage.isFirst,
            last = bookingsPage.isLast
        )
        return ResponseEntity.ok(response)
    }

    @GetMapping("/facility-bookings/{id}")
    @PreAuthorize("hasAuthority('facility_bookings_view')")
    @Operation(summary = "Get booking by ID")
    fun getBooking(@PathVariable id: UUID): ResponseEntity<FacilityBookingResponse> {
        val booking = bookingService.getBooking(id)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(FacilityBookingResponse.from(booking))
    }

    @GetMapping("/members/{memberId}/facility-bookings")
    @PreAuthorize("hasAuthority('facility_bookings_view')")
    @Operation(summary = "Get member's facility bookings")
    fun getMemberBookings(
        @PathVariable memberId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "false") upcomingOnly: Boolean
    ): ResponseEntity<PageResponse<FacilityBookingResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "bookedAt"))
        val bookingsPage = if (upcomingOnly) {
            bookingService.getMemberUpcomingBookings(memberId, pageable)
        } else {
            bookingService.getMemberBookings(memberId, pageable)
        }

        val response = PageResponse(
            content = bookingsPage.content.map { FacilityBookingResponse.from(it) },
            page = bookingsPage.number,
            size = bookingsPage.size,
            totalElements = bookingsPage.totalElements,
            totalPages = bookingsPage.totalPages,
            first = bookingsPage.isFirst,
            last = bookingsPage.isLast
        )
        return ResponseEntity.ok(response)
    }

    @PostMapping("/facility-bookings/{id}/check-in")
    @PreAuthorize("hasAuthority('facility_bookings_manage')")
    @Operation(summary = "Check in a booking")
    fun checkIn(@PathVariable id: UUID): ResponseEntity<FacilityBookingResponse> {
        val booking = bookingService.checkIn(id)
        return ResponseEntity.ok(FacilityBookingResponse.from(booking))
    }

    @PostMapping("/facility-bookings/{id}/complete")
    @PreAuthorize("hasAuthority('facility_bookings_manage')")
    @Operation(summary = "Complete a booking")
    fun complete(@PathVariable id: UUID): ResponseEntity<FacilityBookingResponse> {
        val booking = bookingService.complete(id)
        return ResponseEntity.ok(FacilityBookingResponse.from(booking))
    }

    @PostMapping("/facility-bookings/{id}/cancel")
    @PreAuthorize("hasAuthority('facility_bookings_manage')")
    @Operation(summary = "Cancel a booking")
    fun cancel(
        @PathVariable id: UUID,
        @RequestBody(required = false) request: CancelBookingRequest?
    ): ResponseEntity<FacilityBookingResponse> {
        val booking = bookingService.cancel(id, request?.reason)
        return ResponseEntity.ok(FacilityBookingResponse.from(booking))
    }

    @PostMapping("/facility-bookings/{id}/no-show")
    @PreAuthorize("hasAuthority('facility_bookings_manage')")
    @Operation(summary = "Mark booking as no-show")
    fun markNoShow(@PathVariable id: UUID): ResponseEntity<FacilityBookingResponse> {
        val booking = bookingService.markNoShow(id)
        return ResponseEntity.ok(FacilityBookingResponse.from(booking))
    }
}
