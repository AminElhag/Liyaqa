package com.liyaqa.shared.api

import com.liyaqa.billing.domain.model.InvoiceStatus
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.scheduling.domain.model.BookingStatus
import com.liyaqa.shared.infrastructure.export.ExportService
import com.liyaqa.shared.infrastructure.export.ExportType
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate
import java.util.UUID

/**
 * REST controller for exporting reports to CSV.
 *
 * All exports are restricted to SUPER_ADMIN and CLUB_ADMIN roles.
 * Exports are rate-limited as they are resource-intensive operations.
 */
@RestController
@RequestMapping("/api/exports")
@Tag(name = "Exports", description = "CSV export endpoints for reports")
class ExportController(
    private val exportService: ExportService
) {

    companion object {
        private const val CSV_CONTENT_TYPE = "text/csv; charset=UTF-8"
    }

    // ==================== MEMBERS EXPORT ====================

    /**
     * Exports members to CSV.
     *
     * @param status Optional filter by member status
     * @param joinedAfter Optional filter for members joined after this date
     * @param joinedBefore Optional filter for members joined before this date
     */
    @GetMapping("/members")
    @PreAuthorize("hasAuthority('reports_export')")
    @Operation(summary = "Export members to CSV", description = "Exports all members with optional filters")
    fun exportMembers(
        @RequestParam(required = false) status: MemberStatus?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) joinedAfter: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) joinedBefore: LocalDate?
    ): ResponseEntity<ByteArray> {
        val csvData = exportService.exportMembers(status, joinedAfter, joinedBefore)
        val filename = exportService.generateFilename(ExportType.MEMBERS)
        return createCsvResponse(csvData, filename)
    }

    // ==================== SUBSCRIPTIONS EXPORT ====================

    /**
     * Exports subscriptions to CSV.
     *
     * @param status Optional filter by subscription status
     * @param planId Optional filter by plan ID
     * @param expiringBefore Optional filter for subscriptions expiring before this date
     */
    @GetMapping("/subscriptions")
    @PreAuthorize("hasAuthority('reports_export')")
    @Operation(summary = "Export subscriptions to CSV", description = "Exports all subscriptions with member and plan details")
    fun exportSubscriptions(
        @RequestParam(required = false) status: SubscriptionStatus?,
        @RequestParam(required = false) planId: UUID?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) expiringBefore: LocalDate?
    ): ResponseEntity<ByteArray> {
        val csvData = exportService.exportSubscriptions(status, planId, expiringBefore)
        val filename = exportService.generateFilename(ExportType.SUBSCRIPTIONS)
        return createCsvResponse(csvData, filename)
    }

    // ==================== INVOICES EXPORT ====================

    /**
     * Exports invoices to CSV.
     *
     * @param status Optional filter by invoice status
     * @param dateFrom Optional filter for invoices issued from this date
     * @param dateTo Optional filter for invoices issued until this date
     */
    @GetMapping("/invoices")
    @PreAuthorize("hasAuthority('reports_export')")
    @Operation(summary = "Export invoices to CSV", description = "Exports invoices with member details and amounts")
    fun exportInvoices(
        @RequestParam(required = false) status: InvoiceStatus?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) dateFrom: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) dateTo: LocalDate?
    ): ResponseEntity<ByteArray> {
        val csvData = exportService.exportInvoices(status, dateFrom, dateTo)
        val filename = exportService.generateFilename(ExportType.INVOICES)
        return createCsvResponse(csvData, filename)
    }

    // ==================== ATTENDANCE EXPORT ====================

    /**
     * Exports attendance records to CSV.
     *
     * @param locationId Optional filter by location
     * @param dateFrom Required start date for the export range
     * @param dateTo Required end date for the export range
     */
    @GetMapping("/attendance")
    @PreAuthorize("hasAuthority('reports_export')")
    @Operation(summary = "Export attendance to CSV", description = "Exports attendance records within a date range")
    fun exportAttendance(
        @RequestParam(required = false) locationId: UUID?,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) dateFrom: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) dateTo: LocalDate
    ): ResponseEntity<ByteArray> {
        validateDateRange(dateFrom, dateTo)
        val csvData = exportService.exportAttendance(locationId, dateFrom, dateTo)
        val filename = exportService.generateFilename(ExportType.ATTENDANCE)
        return createCsvResponse(csvData, filename)
    }

    // ==================== BOOKINGS EXPORT ====================

    /**
     * Exports class bookings to CSV.
     *
     * @param classId Optional filter by gym class
     * @param status Optional filter by booking status
     * @param dateFrom Required start date for the export range
     * @param dateTo Required end date for the export range
     */
    @GetMapping("/bookings")
    @PreAuthorize("hasAuthority('reports_export')")
    @Operation(summary = "Export bookings to CSV", description = "Exports class bookings within a date range")
    fun exportBookings(
        @RequestParam(required = false) classId: UUID?,
        @RequestParam(required = false) status: BookingStatus?,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) dateFrom: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) dateTo: LocalDate
    ): ResponseEntity<ByteArray> {
        validateDateRange(dateFrom, dateTo)
        val csvData = exportService.exportBookings(classId, status, dateFrom, dateTo)
        val filename = exportService.generateFilename(ExportType.BOOKINGS)
        return createCsvResponse(csvData, filename)
    }

    // ==================== HELPER METHODS ====================

    /**
     * Creates a ResponseEntity with proper headers for CSV download.
     */
    private fun createCsvResponse(data: ByteArray, filename: String): ResponseEntity<ByteArray> {
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"$filename\"")
            .header(HttpHeaders.CONTENT_TYPE, CSV_CONTENT_TYPE)
            .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
            .header(HttpHeaders.PRAGMA, "no-cache")
            .header(HttpHeaders.EXPIRES, "0")
            .contentLength(data.size.toLong())
            .body(data)
    }

    /**
     * Validates that dateFrom is not after dateTo.
     */
    private fun validateDateRange(dateFrom: LocalDate, dateTo: LocalDate) {
        require(!dateFrom.isAfter(dateTo)) {
            "dateFrom cannot be after dateTo"
        }
        require(dateTo.minusMonths(12).isBefore(dateFrom)) {
            "Date range cannot exceed 12 months"
        }
    }
}
