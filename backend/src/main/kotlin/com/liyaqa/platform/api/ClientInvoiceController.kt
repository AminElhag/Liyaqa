package com.liyaqa.platform.api

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
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
import com.liyaqa.platform.domain.model.PlatformUserRole
import com.liyaqa.platform.infrastructure.security.PlatformSecured
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
@PlatformSecured
@Tag(name = "Client Management", description = "Manage client invoices and billing")
class ClientInvoiceController(
    private val invoiceService: ClientInvoiceService,
    private val pdfGenerator: ClientInvoicePdfGenerator
) {
    /**
     * Creates a new manual invoice with line items.
     * Only PLATFORM_ADMIN and SALES_REP can create invoices.
     */
    @Operation(
        summary = "Create a new invoice",
        description = "Creates a new manual client invoice with line items. Restricted to platform admins and account managers."
    )
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Invoice created successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions")
    )
    @PostMapping
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN, PlatformUserRole.ACCOUNT_MANAGER])
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
    @Operation(
        summary = "Generate invoice from subscription",
        description = "Automatically generates a client invoice based on an existing subscription's terms and pricing."
    )
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Invoice generated successfully from subscription"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Subscription not found")
    )
    @PostMapping("/generate")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN, PlatformUserRole.ACCOUNT_MANAGER])
    fun generateFromSubscription(
        @Valid @RequestBody request: GenerateFromSubscriptionRequest
    ): ResponseEntity<ClientInvoiceResponse> {
        val invoice = invoiceService.generateFromSubscription(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(ClientInvoiceResponse.from(invoice))
    }

    /**
     * Gets an invoice by ID.
     */
    @Operation(
        summary = "Get invoice by ID",
        description = "Retrieves the full details of a specific client invoice including line items and payment history."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Invoice retrieved successfully"),
        ApiResponse(responseCode = "404", description = "Invoice not found")
    )
    @GetMapping("/{id}")
    fun getInvoice(@PathVariable id: UUID): ResponseEntity<ClientInvoiceResponse> {
        val invoice = invoiceService.getInvoiceWithDetails(id)
        return ResponseEntity.ok(ClientInvoiceResponse.from(invoice))
    }

    /**
     * Lists all invoices with pagination and filtering.
     */
    @Operation(
        summary = "List all invoices",
        description = "Returns a paginated list of all client invoices with optional filtering by status, organization, date range, and search term."
    )
    @ApiResponse(responseCode = "200", description = "Invoices retrieved successfully")
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
    ): ResponseEntity<PageResponse<ClientInvoiceSummaryResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)

        val invoicesPage = invoiceService.searchInvoices(
            search, status, organizationId, dateFrom, dateTo, pageable
        )

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
     * Gets invoices for a specific organization.
     */
    @Operation(
        summary = "Get invoices by organization",
        description = "Returns a paginated list of invoices belonging to a specific client organization."
    )
    @ApiResponse(responseCode = "200", description = "Organization invoices retrieved successfully")
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
    @Operation(
        summary = "Get invoices by subscription",
        description = "Returns a paginated list of invoices associated with a specific client subscription."
    )
    @ApiResponse(responseCode = "200", description = "Subscription invoices retrieved successfully")
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
    @Operation(
        summary = "Get overdue invoices",
        description = "Returns a paginated list of invoices that are past their due date and still unpaid."
    )
    @ApiResponse(responseCode = "200", description = "Overdue invoices retrieved successfully")
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
    @Operation(
        summary = "Get invoice statistics",
        description = "Returns aggregate statistics for client invoices including totals, outstanding amounts, and status breakdowns."
    )
    @ApiResponse(responseCode = "200", description = "Invoice statistics retrieved successfully")
    @GetMapping("/stats")
    fun getInvoiceStats(): ResponseEntity<ClientInvoiceStatsResponse> {
        val stats = invoiceService.getInvoiceStats()
        return ResponseEntity.ok(ClientInvoiceStatsResponse.from(stats))
    }

    /**
     * Updates an invoice (notes only).
     * Only PLATFORM_ADMIN and SALES_REP can update invoices.
     */
    @Operation(
        summary = "Update an invoice",
        description = "Updates an existing client invoice. Only notes can be modified after creation."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Invoice updated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Invoice not found")
    )
    @PutMapping("/{id}")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN, PlatformUserRole.ACCOUNT_MANAGER])
    fun updateInvoice(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateClientInvoiceRequest
    ): ResponseEntity<ClientInvoiceResponse> {
        invoiceService.updateInvoice(id, request.toCommand())
        val invoice = invoiceService.getInvoiceWithDetails(id)
        return ResponseEntity.ok(ClientInvoiceResponse.from(invoice))
    }

    /**
     * Issues an invoice.
     * Only PLATFORM_ADMIN and SALES_REP can issue invoices.
     */
    @Operation(
        summary = "Issue an invoice",
        description = "Transitions a draft invoice to issued status, making it official and sendable to the client."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Invoice issued successfully"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Invoice not found"),
        ApiResponse(responseCode = "422", description = "Invoice cannot be issued in its current state")
    )
    @PostMapping("/{id}/issue")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN, PlatformUserRole.ACCOUNT_MANAGER])
    fun issueInvoice(
        @PathVariable id: UUID,
        @Valid @RequestBody request: IssueClientInvoiceRequest
    ): ResponseEntity<ClientInvoiceResponse> {
        invoiceService.issueInvoice(id, request.toCommand())
        val invoice = invoiceService.getInvoiceWithDetails(id)
        return ResponseEntity.ok(ClientInvoiceResponse.from(invoice))
    }

    /**
     * Records a payment on an invoice.
     * Only PLATFORM_ADMIN and SALES_REP can record payments.
     */
    @Operation(
        summary = "Record a payment",
        description = "Records a payment against an issued invoice. Partial payments are supported; the invoice is marked as paid when the total is met."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Payment recorded successfully"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Invoice not found"),
        ApiResponse(responseCode = "422", description = "Payment cannot be recorded in the current invoice state")
    )
    @PostMapping("/{id}/record-payment")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN, PlatformUserRole.ACCOUNT_MANAGER])
    fun recordPayment(
        @PathVariable id: UUID,
        @Valid @RequestBody request: RecordClientPaymentRequest
    ): ResponseEntity<ClientInvoiceResponse> {
        invoiceService.recordPayment(id, request.toCommand())
        val invoice = invoiceService.getInvoiceWithDetails(id)
        return ResponseEntity.ok(ClientInvoiceResponse.from(invoice))
    }

    /**
     * Cancels an invoice.
     * Only PLATFORM_ADMIN and SALES_REP can cancel invoices.
     */
    @Operation(
        summary = "Cancel an invoice",
        description = "Cancels an invoice. Only draft or issued invoices can be cancelled; paid invoices cannot be cancelled."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Invoice cancelled successfully"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Invoice not found"),
        ApiResponse(responseCode = "422", description = "Invoice cannot be cancelled in its current state")
    )
    @PostMapping("/{id}/cancel")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN, PlatformUserRole.ACCOUNT_MANAGER])
    fun cancelInvoice(@PathVariable id: UUID): ResponseEntity<ClientInvoiceResponse> {
        invoiceService.cancelInvoice(id)
        val invoice = invoiceService.getInvoiceWithDetails(id)
        return ResponseEntity.ok(ClientInvoiceResponse.from(invoice))
    }

    /**
     * Deletes a draft invoice.
     * Only PLATFORM_ADMIN and SALES_REP can delete invoices.
     */
    @Operation(
        summary = "Delete a draft invoice",
        description = "Permanently deletes a draft invoice. Only invoices in DRAFT status can be deleted."
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Invoice deleted successfully"),
        ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        ApiResponse(responseCode = "404", description = "Invoice not found")
    )
    @DeleteMapping("/{id}")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN, PlatformUserRole.ACCOUNT_MANAGER])
    fun deleteInvoice(@PathVariable id: UUID): ResponseEntity<Void> {
        invoiceService.deleteInvoice(id)
        return ResponseEntity.noContent().build()
    }

    /**
     * Downloads an invoice as PDF.
     */
    @Operation(
        summary = "Download invoice as PDF",
        description = "Generates and downloads a PDF version of the invoice, localized to the specified locale."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "PDF generated and returned successfully"),
        ApiResponse(responseCode = "404", description = "Invoice not found")
    )
    @GetMapping("/{id}/pdf")
    fun downloadPdf(
        @PathVariable id: UUID,
        @RequestParam(defaultValue = "en") locale: String
    ): ResponseEntity<ByteArray> {
        val invoice = invoiceService.getInvoiceWithDetails(id)
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
