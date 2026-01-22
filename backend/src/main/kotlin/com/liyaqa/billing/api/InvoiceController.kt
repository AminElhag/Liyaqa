package com.liyaqa.billing.api

import com.liyaqa.billing.application.commands.RecordPaymentCommand
import com.liyaqa.billing.application.services.InvoiceService
import com.liyaqa.billing.domain.model.InvoiceStatus
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.billing.infrastructure.pdf.InvoicePdfGenerator
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.organization.domain.ports.OrganizationRepository
import com.liyaqa.shared.api.BulkItemResult
import com.liyaqa.shared.api.BulkItemStatus
import com.liyaqa.shared.api.BulkOperationResponse
import com.liyaqa.shared.api.validateBulkSize
import com.liyaqa.shared.domain.TenantContext
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.format.annotation.DateTimeFormat
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
    @PreAuthorize("hasAuthority('invoices_create')")
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
    @PreAuthorize("hasAuthority('invoices_create')")
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
    @PreAuthorize("hasAuthority('invoices_view')")
    fun getInvoice(@PathVariable id: UUID): ResponseEntity<InvoiceResponse> {
        val invoice = invoiceService.getInvoice(id)
        val member = memberRepository.findById(invoice.memberId).orElse(null)
        return ResponseEntity.ok(
            InvoiceResponse.from(
                invoice,
                memberName = member?.let { buildMemberName(it) },
                memberEmail = member?.email
            )
        )
    }

    /**
     * Gets an invoice by invoice number.
     */
    @GetMapping("/invoices/number/{invoiceNumber}")
    @PreAuthorize("hasAuthority('invoices_view')")
    fun getInvoiceByNumber(@PathVariable invoiceNumber: String): ResponseEntity<InvoiceResponse> {
        val invoice = invoiceService.getInvoiceByNumber(invoiceNumber)
        val member = memberRepository.findById(invoice.memberId).orElse(null)
        return ResponseEntity.ok(
            InvoiceResponse.from(
                invoice,
                memberName = member?.let { buildMemberName(it) },
                memberEmail = member?.email
            )
        )
    }

    /**
     * Lists all invoices with optional search and filtering.
     *
     * @param search Search term for invoice number (partial match)
     * @param status Filter by invoice status (DRAFT, ISSUED, PAID, PARTIALLY_PAID, OVERDUE, CANCELLED)
     * @param memberId Filter by member ID
     * @param dateFrom Filter invoices created on or after this date (ISO format: YYYY-MM-DD)
     * @param dateTo Filter invoices created on or before this date (ISO format: YYYY-MM-DD)
     */
    @GetMapping("/invoices")
    @PreAuthorize("hasAuthority('invoices_view')")
    fun getAllInvoices(
        @RequestParam(required = false) search: String?,
        @RequestParam(required = false) status: InvoiceStatus?,
        @RequestParam(required = false) memberId: UUID?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) dateFrom: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) dateTo: LocalDate?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<InvoicePageResponse> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)

        // Use search if any filter is provided, otherwise get all
        val invoicesPage = if (search != null || status != null || memberId != null || dateFrom != null || dateTo != null) {
            invoiceService.searchInvoices(search, status, memberId, dateFrom, dateTo, pageable)
        } else {
            invoiceService.getAllInvoices(pageable)
        }

        // Look up member info for all invoices in bulk
        val memberIds = invoicesPage.content.map { it.memberId }.distinct()
        val membersMap = memberRepository.findAllByIds(memberIds).associateBy { it.id }

        return ResponseEntity.ok(
            InvoicePageResponse(
                content = invoicesPage.content.map { invoice ->
                    val member = membersMap[invoice.memberId]
                    InvoiceResponse.from(
                        invoice,
                        memberName = member?.let { buildMemberName(it) },
                        memberEmail = member?.email
                    )
                },
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
    @PreAuthorize("hasAuthority('invoices_view') or @securityService.isSelf(#memberId)")
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
    @PreAuthorize("hasAuthority('invoices_view')")
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
    @PreAuthorize("hasAuthority('invoices_view')")
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
    @PreAuthorize("hasAuthority('invoices_view')")
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
    @PreAuthorize("hasAuthority('invoices_update')")
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
    @PreAuthorize("hasAuthority('invoices_issue')")
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
    @PreAuthorize("hasAuthority('invoices_pay')")
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
    @PreAuthorize("hasAuthority('invoices_update')")
    fun cancelInvoice(@PathVariable id: UUID): ResponseEntity<InvoiceResponse> {
        val invoice = invoiceService.cancelInvoice(id)
        return ResponseEntity.ok(InvoiceResponse.from(invoice))
    }

    /**
     * Gets invoice summary/stats.
     */
    @GetMapping("/invoices/summary")
    @PreAuthorize("hasAuthority('invoices_view')")
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
    @PreAuthorize("hasAuthority('invoices_view')")
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

    /**
     * Deletes an invoice.
     * Only DRAFT or CANCELLED invoices can be deleted.
     */
    @DeleteMapping("/invoices/{id}")
    @PreAuthorize("hasAuthority('invoices_delete')")
    fun deleteInvoice(@PathVariable id: UUID): ResponseEntity<Unit> {
        invoiceService.deleteInvoice(id)
        return ResponseEntity.noContent().build()
    }

    // ==================== BULK OPERATIONS ====================

    /**
     * Bulk update invoice status (issue or cancel).
     * Restricted to SUPER_ADMIN and CLUB_ADMIN roles.
     */
    @PostMapping("/invoices/bulk/status")
    @PreAuthorize("hasAuthority('invoices_update')")
    @Operation(summary = "Bulk update invoice status", description = "Issue or cancel multiple invoices at once")
    fun bulkUpdateStatus(
        @Valid @RequestBody request: BulkInvoiceStatusRequest
    ): ResponseEntity<BulkOperationResponse> {
        validateBulkSize(request.invoiceIds)
        val startTime = System.currentTimeMillis()

        val resultsMap = when (request.action) {
            BulkInvoiceAction.ISSUE -> invoiceService.bulkIssueInvoices(
                request.invoiceIds,
                request.issueDate,
                request.paymentDueDays
            )
            BulkInvoiceAction.CANCEL -> invoiceService.bulkCancelInvoices(request.invoiceIds)
        }

        val results = resultsMap.map { (id, result) ->
            if (result.isSuccess) {
                BulkItemResult(
                    itemId = id,
                    status = BulkItemStatus.SUCCESS,
                    message = "Invoice ${request.action.name.lowercase()}d",
                    messageAr = getArabicInvoiceStatusMessage(request.action)
                )
            } else {
                BulkItemResult(
                    itemId = id,
                    status = BulkItemStatus.FAILED,
                    message = result.exceptionOrNull()?.message ?: "Unknown error",
                    messageAr = "فشل في تحديث الفاتورة"
                )
            }
        }

        return ResponseEntity.ok(BulkOperationResponse.from(results, startTime))
    }

    /**
     * Bulk record payments on invoices.
     * Restricted to SUPER_ADMIN and CLUB_ADMIN roles.
     */
    @PostMapping("/invoices/bulk/pay")
    @PreAuthorize("hasAuthority('invoices_pay')")
    @Operation(summary = "Bulk record payments", description = "Record payments for multiple invoices at once")
    fun bulkRecordPayments(
        @Valid @RequestBody request: BulkRecordPaymentRequest
    ): ResponseEntity<BulkOperationResponse> {
        val invoiceIds = request.payments.map { it.invoiceId }
        validateBulkSize(invoiceIds)
        val startTime = System.currentTimeMillis()

        val payments = request.payments.map { payment ->
            Triple(
                payment.invoiceId,
                RecordPaymentCommand(
                    amount = payment.amount,
                    paymentMethod = payment.paymentMethod,
                    reference = payment.paymentReference
                ),
                Unit
            )
        }

        val resultsMap = invoiceService.bulkRecordPayments(payments)

        val results = resultsMap.map { (id, result) ->
            if (result.isSuccess) {
                BulkItemResult(
                    itemId = id,
                    status = BulkItemStatus.SUCCESS,
                    message = "Payment recorded",
                    messageAr = "تم تسجيل الدفعة"
                )
            } else {
                BulkItemResult(
                    itemId = id,
                    status = BulkItemStatus.FAILED,
                    message = result.exceptionOrNull()?.message ?: "Unknown error",
                    messageAr = "فشل في تسجيل الدفعة"
                )
            }
        }

        return ResponseEntity.ok(BulkOperationResponse.from(results, startTime))
    }

    /**
     * Bulk create invoices from subscriptions.
     * Restricted to SUPER_ADMIN and CLUB_ADMIN roles.
     */
    @PostMapping("/invoices/bulk/from-subscriptions")
    @PreAuthorize("hasAuthority('invoices_create')")
    @Operation(summary = "Bulk create invoices from subscriptions", description = "Create invoices for multiple subscriptions at once")
    fun bulkCreateFromSubscriptions(
        @Valid @RequestBody request: BulkCreateInvoicesFromSubscriptionsRequest
    ): ResponseEntity<BulkOperationResponse> {
        validateBulkSize(request.subscriptionIds)
        val startTime = System.currentTimeMillis()

        val resultsMap = invoiceService.bulkCreateInvoicesFromSubscriptions(
            request.subscriptionIds,
            request.notes
        )

        val results = resultsMap.map { (id, result) ->
            if (result.isSuccess) {
                BulkItemResult(
                    itemId = id,
                    status = BulkItemStatus.SUCCESS,
                    message = "Invoice created: ${result.getOrNull()?.invoiceNumber}",
                    messageAr = "تم إنشاء الفاتورة: ${result.getOrNull()?.invoiceNumber}"
                )
            } else {
                BulkItemResult(
                    itemId = id,
                    status = BulkItemStatus.FAILED,
                    message = result.exceptionOrNull()?.message ?: "Unknown error",
                    messageAr = "فشل في إنشاء الفاتورة"
                )
            }
        }

        return ResponseEntity.ok(BulkOperationResponse.from(results, startTime))
    }

    private fun getArabicInvoiceStatusMessage(action: BulkInvoiceAction): String {
        return when (action) {
            BulkInvoiceAction.ISSUE -> "تم إصدار الفاتورة"
            BulkInvoiceAction.CANCEL -> "تم إلغاء الفاتورة"
        }
    }

    /**
     * Builds a combined member name from firstName and lastName.
     */
    private fun buildMemberName(member: Member): LocalizedTextResponse {
        val nameEn = "${member.firstName.en} ${member.lastName.en}"
        val nameAr = if (member.firstName.ar != null || member.lastName.ar != null) {
            "${member.firstName.ar ?: member.firstName.en} ${member.lastName.ar ?: member.lastName.en}"
        } else {
            null
        }
        return LocalizedTextResponse(en = nameEn, ar = nameAr)
    }
}
