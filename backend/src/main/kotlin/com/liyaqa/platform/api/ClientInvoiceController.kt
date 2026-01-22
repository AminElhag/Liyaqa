package com.liyaqa.platform.api

import com.liyaqa.platform.api.dto.ClientInvoiceResponse
import com.liyaqa.platform.api.dto.ClientInvoiceStatsResponse
import com.liyaqa.platform.api.dto.ClientInvoiceSummaryResponse
import com.liyaqa.platform.api.dto.CreateClientInvoiceRequest
import com.liyaqa.platform.api.dto.GenerateFromSubscriptionRequest
import com.liyaqa.platform.api.dto.IssueClientInvoiceRequest
import com.liyaqa.platform.api.dto.PageResponse
import com.liyaqa.platform.api.dto.RecordClientPaymentRequest
import com.liyaqa.platform.api.dto.UpdateClientInvoiceRequest
import com.liyaqa.platform.application.services.ClientInvoiceService
import com.liyaqa.platform.domain.model.ClientInvoiceStatus
import com.liyaqa.platform.infrastructure.pdf.ClientInvoicePdfGenerator
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate
import java.util.UUID

/**
 * Controller for managing client invoices (B2B billing).
 * Accessible by platform users (internal Liyaqa team) only.
 *
 * Endpoints:
 * - GET    /api/platform/invoices                         - List all invoices
 * - GET    /api/platform/invoices/stats                   - Get invoice statistics
 * - GET    /api/platform/invoices/{id}                    - Get invoice details
 * - GET    /api/platform/invoices/organization/{orgId}    - Get invoices by organization
 * - GET    /api/platform/invoices/subscription/{subId}    - Get invoices by subscription
 * - GET    /api/platform/invoices/overdue                 - Get overdue invoices
 * - POST   /api/platform/invoices                         - Create manual invoice
 * - POST   /api/platform/invoices/generate                - Generate from subscription
 * - PUT    /api/platform/invoices/{id}                    - Update invoice
 * - POST   /api/platform/invoices/{id}/issue              - Issue invoice
 * - POST   /api/platform/invoices/{id}/record-payment     - Record payment
 * - POST   /api/platform/invoices/{id}/cancel             - Cancel invoice
 * - DELETE /api/platform/invoices/{id}                    - Delete draft invoice
 * - GET    /api/platform/invoices/{id}/pdf                - Download PDF
 */
@RestController
@RequestMapping("/api/platform/invoices")
@PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP', 'MARKETING', 'SUPPORT')")
class ClientInvoiceController(
    private val invoiceService: ClientInvoiceService,
    private val pdfGenerator: ClientInvoicePdfGenerator
) {
    /**
     * Creates a new manual invoice with line items.
     * Only PLATFORM_ADMIN and SALES_REP can create invoices.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP')")
    fun createInvoice(
        @Valid @RequestBody request: CreateClientInvoiceRequest
    ): ResponseEntity<ClientInvoiceResponse> {
        val invoice = invoiceService.createInvoice(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(ClientInvoiceResponse.from(invoice))
    }

    /**
     * Generates an invoice from a subscription.
     * Only PLATFORM_ADMIN and SALES_REP can generate invoices.
     */
    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP')")
    fun generateFromSubscription(
        @Valid @RequestBody request: GenerateFromSubscriptionRequest
    ): ResponseEntity<ClientInvoiceResponse> {
        val invoice = invoiceService.generateFromSubscription(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(ClientInvoiceResponse.from(invoice))
    }

    /**
     * Gets an invoice by ID.
     */
    @GetMapping("/{id}")
    fun getInvoice(@PathVariable id: UUID): ResponseEntity<ClientInvoiceResponse> {
        val invoice = invoiceService.getInvoice(id)
        return ResponseEntity.ok(ClientInvoiceResponse.from(invoice))
    }

    /**
     * Lists all invoices with pagination and filtering.
     */
    @GetMapping
    fun getAllInvoices(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String,
        @RequestParam(required = false) search: String?,
        @RequestParam(required = false) status: ClientInvoiceStatus?,
        @RequestParam(required = false) organizationId: UUID?,
        @RequestParam(required = false) dateFrom: LocalDate?,
        @RequestParam(required = false) dateTo: LocalDate?
    ): ResponseEntity<PageResponse<ClientInvoiceResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)

        val invoicesPage = invoiceService.searchInvoices(
            search, status, organizationId, dateFrom, dateTo, pageable
        )

        return ResponseEntity.ok(
            PageResponse(
                content = invoicesPage.content.map { ClientInvoiceResponse.from(it) },
                page = invoicesPage.number,
                size = invoicesPage.size,
                totalElements = invoicesPage.totalElements,
                totalPages = invoicesPage.totalPages,
                first = invoicesPage.isFirst,
                last = invoicesPage.isLast
            )
        )
    }

    /**
     * Gets invoices for a specific organization.
     */
    @GetMapping("/organization/{organizationId}")
    fun getInvoicesByOrganization(
        @PathVariable organizationId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<ClientInvoiceSummaryResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val invoicesPage = invoiceService.getInvoicesByOrganization(organizationId, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = invoicesPage.content.map { ClientInvoiceSummaryResponse.from(it) },
                page = invoicesPage.number,
                size = invoicesPage.size,
                totalElements = invoicesPage.totalElements,
                totalPages = invoicesPage.totalPages,
                first = invoicesPage.isFirst,
                last = invoicesPage.isLast
            )
        )
    }

    /**
     * Gets invoices for a specific subscription.
     */
    @GetMapping("/subscription/{subscriptionId}")
    fun getInvoicesBySubscription(
        @PathVariable subscriptionId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<ClientInvoiceSummaryResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val invoicesPage = invoiceService.getInvoicesBySubscription(subscriptionId, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = invoicesPage.content.map { ClientInvoiceSummaryResponse.from(it) },
                page = invoicesPage.number,
                size = invoicesPage.size,
                totalElements = invoicesPage.totalElements,
                totalPages = invoicesPage.totalPages,
                first = invoicesPage.isFirst,
                last = invoicesPage.isLast
            )
        )
    }

    /**
     * Gets overdue invoices.
     */
    @GetMapping("/overdue")
    fun getOverdueInvoices(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<ClientInvoiceSummaryResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "dueDate"))
        val invoicesPage = invoiceService.getOverdueInvoices(pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = invoicesPage.content.map { ClientInvoiceSummaryResponse.from(it) },
                page = invoicesPage.number,
                size = invoicesPage.size,
                totalElements = invoicesPage.totalElements,
                totalPages = invoicesPage.totalPages,
                first = invoicesPage.isFirst,
                last = invoicesPage.isLast
            )
        )
    }

    /**
     * Gets invoice statistics.
     */
    @GetMapping("/stats")
    fun getInvoiceStats(): ResponseEntity<ClientInvoiceStatsResponse> {
        val stats = invoiceService.getInvoiceStats()
        return ResponseEntity.ok(ClientInvoiceStatsResponse.from(stats))
    }

    /**
     * Updates an invoice (notes only).
     * Only PLATFORM_ADMIN and SALES_REP can update invoices.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP')")
    fun updateInvoice(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateClientInvoiceRequest
    ): ResponseEntity<ClientInvoiceResponse> {
        val invoice = invoiceService.updateInvoice(id, request.toCommand())
        return ResponseEntity.ok(ClientInvoiceResponse.from(invoice))
    }

    /**
     * Issues an invoice.
     * Only PLATFORM_ADMIN and SALES_REP can issue invoices.
     */
    @PostMapping("/{id}/issue")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP')")
    fun issueInvoice(
        @PathVariable id: UUID,
        @Valid @RequestBody request: IssueClientInvoiceRequest
    ): ResponseEntity<ClientInvoiceResponse> {
        val invoice = invoiceService.issueInvoice(id, request.toCommand())
        return ResponseEntity.ok(ClientInvoiceResponse.from(invoice))
    }

    /**
     * Records a payment on an invoice.
     * Only PLATFORM_ADMIN and SALES_REP can record payments.
     */
    @PostMapping("/{id}/record-payment")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP')")
    fun recordPayment(
        @PathVariable id: UUID,
        @Valid @RequestBody request: RecordClientPaymentRequest
    ): ResponseEntity<ClientInvoiceResponse> {
        val invoice = invoiceService.recordPayment(id, request.toCommand())
        return ResponseEntity.ok(ClientInvoiceResponse.from(invoice))
    }

    /**
     * Cancels an invoice.
     * Only PLATFORM_ADMIN and SALES_REP can cancel invoices.
     */
    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP')")
    fun cancelInvoice(@PathVariable id: UUID): ResponseEntity<ClientInvoiceResponse> {
        val invoice = invoiceService.cancelInvoice(id)
        return ResponseEntity.ok(ClientInvoiceResponse.from(invoice))
    }

    /**
     * Deletes a draft invoice.
     * Only PLATFORM_ADMIN and SALES_REP can delete invoices.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP')")
    fun deleteInvoice(@PathVariable id: UUID): ResponseEntity<Void> {
        invoiceService.deleteInvoice(id)
        return ResponseEntity.noContent().build()
    }

    /**
     * Downloads an invoice as PDF.
     */
    @GetMapping("/{id}/pdf")
    fun downloadPdf(
        @PathVariable id: UUID,
        @RequestParam(defaultValue = "en") locale: String
    ): ResponseEntity<ByteArray> {
        val invoice = invoiceService.getInvoice(id)
        val pdfBytes = pdfGenerator.generatePdf(invoice, locale)

        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(
                HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"invoice-${invoice.invoiceNumber}.pdf\""
            )
            .body(pdfBytes)
    }
}
