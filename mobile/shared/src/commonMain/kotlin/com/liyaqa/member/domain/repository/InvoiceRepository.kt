package com.liyaqa.member.domain.repository

import com.liyaqa.member.domain.model.Invoice
import com.liyaqa.member.domain.model.PagedResult
import com.liyaqa.member.domain.model.PaymentInitiation

/**
 * Repository for invoice and payment operations.
 * Handles invoice listing, details, and payment initiation.
 */
interface InvoiceRepository {

    /**
     * Fetches invoices for the current member.
     *
     * @param status Optional filter by invoice status
     * @param page The page number (0-indexed)
     * @param size The number of items per page
     */
    suspend fun getInvoices(
        status: String? = null,
        page: Int = 0,
        size: Int = 20
    ): Result<PagedResult<Invoice>>

    /**
     * Fetches pending invoices for the current member.
     */
    suspend fun getPendingInvoices(): Result<List<Invoice>>

    /**
     * Fetches invoice details by ID.
     *
     * @param invoiceId The invoice ID
     */
    suspend fun getInvoiceDetail(invoiceId: String): Result<Invoice>

    /**
     * Downloads an invoice as PDF.
     *
     * @param invoiceId The invoice ID
     * @return The PDF content as ByteArray
     */
    suspend fun downloadInvoicePdf(invoiceId: String): Result<ByteArray>

    /**
     * Initiates a payment for an invoice.
     *
     * @param invoiceId The invoice ID
     * @param returnUrl Optional return URL after payment
     * @param callbackUrl Optional callback URL for payment status
     * @return Payment initiation details including redirect URL
     */
    suspend fun initiatePayment(
        invoiceId: String,
        returnUrl: String? = null,
        callbackUrl: String? = null
    ): Result<PaymentInitiation>
}
