package com.liyaqa.member.domain.repository

import com.liyaqa.member.domain.model.Invoice
import com.liyaqa.member.domain.model.InvoiceStatus
import com.liyaqa.member.domain.model.PagedResponse
import com.liyaqa.member.domain.model.PaymentInitiateResponse
import com.liyaqa.member.domain.model.PaymentVerifyResult
import com.liyaqa.member.util.Result
import kotlinx.coroutines.flow.Flow

/**
 * Repository for invoice and payment operations
 */
interface InvoiceRepository {
    /**
     * Get invoices (offline-first)
     */
    fun getInvoices(
        status: InvoiceStatus? = null,
        page: Int = 0,
        size: Int = 20
    ): Flow<Result<PagedResponse<Invoice>>>

    /**
     * Get pending invoices
     */
    suspend fun getPendingInvoices(): Result<List<Invoice>>

    /**
     * Initiate payment for an invoice
     */
    suspend fun initiatePayment(invoiceId: String, returnUrl: String): Result<PaymentInitiateResponse>

    /**
     * Verify payment after return from gateway
     */
    suspend fun verifyPayment(paymentReference: String): Result<PaymentVerifyResult>

    /**
     * Force refresh invoices from server
     */
    suspend fun refreshInvoices(): Result<List<Invoice>>
}
