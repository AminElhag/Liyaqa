package com.liyaqa.billing.api

import com.liyaqa.billing.application.services.InvoiceService
import com.liyaqa.billing.domain.model.InvoiceStatus
import com.liyaqa.billing.infrastructure.pdf.InvoicePdfGenerator
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.organization.domain.ports.OrganizationRepository
import com.liyaqa.shared.domain.TenantContext
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api")
class InvoiceController(
    private val invoiceService: InvoiceService,
    private val invoicePdfGenerator: InvoicePdfGenerator,
    private val memberRepository: MemberRepository,
    private val organizationRepository: OrganizationRepository
) {
    /**
     * Creates a new invoice.
     */
    @PostMapping("/invoices")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun createInvoice(
        @Valid @RequestBody request: CreateInvoiceRequest
    ): ResponseEntity<InvoiceResponse> {
        val invoice = invoiceService.createInvoice(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(InvoiceResponse.from(invoice))
    }

    /**
     * Creates an invoice from a subscription.
     */
    @PostMapping("/subscriptions/{subscriptionId}/invoice")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun createSubscriptionInvoice(
        @PathVariable subscriptionId: UUID,
        @RequestBody(required = false) request: CreateSubscriptionInvoiceRequest?
    ): ResponseEntity<InvoiceResponse> {
        val command = (request ?: CreateSubscriptionInvoiceRequest()).toCommand(subscriptionId)
        val invoice = invoiceService.createInvoiceFromSubscription(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(InvoiceResponse.from(invoice))
    }

    /**
     * Gets an invoice by ID.
     */
    @GetMapping("/invoices/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun getInvoice(@PathVariable id: UUID): ResponseEntity<InvoiceResponse> {
        val invoice = invoiceService.getInvoice(id)
        return ResponseEntity.ok(InvoiceResponse.from(invoice))
    }

    /**
     * Gets an invoice by invoice number.
     */
    @GetMapping("/invoices/number/{invoiceNumber}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun getInvoiceByNumber(@PathVariable invoiceNumber: String): ResponseEntity<InvoiceResponse> {
        val invoice = invoiceService.getInvoiceByNumber(invoiceNumber)
        return ResponseEntity.ok(InvoiceResponse.from(invoice))
    }

    /**
     * Lists all invoices.
     */
    @GetMapping("/invoices")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun getAllInvoices(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<InvoicePageResponse> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)
        val invoicesPage = invoiceService.getAllInvoices(pageable)

        return ResponseEntity.ok(
            InvoicePageResponse(
                content = invoicesPage.content.map { InvoiceResponse.from(it) },
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
     * Gets invoices for a member.
     */
    @GetMapping("/members/{memberId}/invoices")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF') or @securityService.isSelf(#memberId)")
    fun getMemberInvoices(
        @PathVariable memberId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<InvoicePageResponse> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val invoicesPage = invoiceService.getInvoicesByMember(memberId, pageable)

        return ResponseEntity.ok(
            InvoicePageResponse(
                content = invoicesPage.content.map { InvoiceResponse.from(it) },
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
     * Gets invoices by status.
     */
    @GetMapping("/invoices/status/{status}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun getInvoicesByStatus(
        @PathVariable status: InvoiceStatus,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<InvoicePageResponse> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val invoicesPage = invoiceService.getInvoicesByStatus(status, pageable)

        return ResponseEntity.ok(
            InvoicePageResponse(
                content = invoicesPage.content.map { InvoiceResponse.from(it) },
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
     * Gets pending invoices.
     */
    @GetMapping("/invoices/pending")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun getPendingInvoices(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<InvoicePageResponse> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "dueDate"))
        val invoicesPage = invoiceService.getPendingInvoices(pageable)

        return ResponseEntity.ok(
            InvoicePageResponse(
                content = invoicesPage.content.map { InvoiceResponse.from(it) },
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
    @GetMapping("/invoices/overdue")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun getOverdueInvoices(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<InvoicePageResponse> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "dueDate"))
        val invoicesPage = invoiceService.getOverdueInvoices(pageable)

        return ResponseEntity.ok(
            InvoicePageResponse(
                content = invoicesPage.content.map { InvoiceResponse.from(it) },
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
     * Updates an invoice.
     */
    @PutMapping("/invoices/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun updateInvoice(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateInvoiceRequest
    ): ResponseEntity<InvoiceResponse> {
        val invoice = invoiceService.updateInvoice(id, request.toCommand())
        return ResponseEntity.ok(InvoiceResponse.from(invoice))
    }

    /**
     * Issues an invoice.
     */
    @PostMapping("/invoices/{id}/issue")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun issueInvoice(
        @PathVariable id: UUID,
        @RequestBody(required = false) request: IssueInvoiceRequest?
    ): ResponseEntity<InvoiceResponse> {
        val command = (request ?: IssueInvoiceRequest()).toCommand()
        val invoice = invoiceService.issueInvoice(id, command)
        return ResponseEntity.ok(InvoiceResponse.from(invoice))
    }

    /**
     * Records a payment on an invoice.
     */
    @PostMapping("/invoices/{id}/pay")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun recordPayment(
        @PathVariable id: UUID,
        @Valid @RequestBody request: RecordPaymentRequest
    ): ResponseEntity<InvoiceResponse> {
        val invoice = invoiceService.recordPayment(id, request.toCommand())
        return ResponseEntity.ok(InvoiceResponse.from(invoice))
    }

    /**
     * Cancels an invoice.
     */
    @PostMapping("/invoices/{id}/cancel")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN')")
    fun cancelInvoice(@PathVariable id: UUID): ResponseEntity<InvoiceResponse> {
        val invoice = invoiceService.cancelInvoice(id)
        return ResponseEntity.ok(InvoiceResponse.from(invoice))
    }

    /**
     * Gets invoice summary/stats.
     */
    @GetMapping("/invoices/summary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun getInvoiceSummary(): ResponseEntity<InvoiceSummaryResponse> {
        return ResponseEntity.ok(
            InvoiceSummaryResponse(
                totalInvoices = invoiceService.countByStatus(InvoiceStatus.ISSUED) +
                    invoiceService.countByStatus(InvoiceStatus.PAID) +
                    invoiceService.countByStatus(InvoiceStatus.OVERDUE),
                pendingCount = invoiceService.countByStatus(InvoiceStatus.ISSUED),
                overdueCount = invoiceService.countByStatus(InvoiceStatus.OVERDUE),
                paidCount = invoiceService.countByStatus(InvoiceStatus.PAID)
            )
        )
    }

    /**
     * Downloads an invoice as PDF.
     */
    @GetMapping("/invoices/{id}/pdf")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun downloadInvoicePdf(
        @PathVariable id: UUID,
        @RequestParam(defaultValue = "en") locale: String
    ): ResponseEntity<ByteArray> {
        val invoice = invoiceService.getInvoice(id)

        val member = memberRepository.findById(invoice.memberId)
            .orElseThrow { NoSuchElementException("Member not found: ${invoice.memberId}") }

        // Try to get organization for header
        val organization = TenantContext.getCurrentOrganizationOrNull()?.let { orgId ->
            organizationRepository.findById(orgId.value).orElse(null)
        }

        val pdfBytes = invoicePdfGenerator.generateInvoicePdf(
            invoice = invoice,
            member = member,
            organization = organization,
            locale = locale
        )

        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_PDF
        headers.setContentDispositionFormData("attachment", "${invoice.invoiceNumber}.pdf")
        headers.contentLength = pdfBytes.size.toLong()

        return ResponseEntity.ok()
            .headers(headers)
            .body(pdfBytes)
    }
}
