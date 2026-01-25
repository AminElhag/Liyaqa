package com.liyaqa.member.data.repository

import com.liyaqa.member.data.remote.api.MemberApi
import com.liyaqa.member.data.remote.api.PaymentApi
import com.liyaqa.member.domain.model.Invoice
import com.liyaqa.member.domain.model.InvoiceStatus
import com.liyaqa.member.domain.model.PagedResponse
import com.liyaqa.member.domain.model.PaymentInitiateResponse
import com.liyaqa.member.domain.model.PaymentVerifyResult
import com.liyaqa.member.domain.repository.InvoiceRepository
import com.liyaqa.member.util.Result
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

class InvoiceRepositoryImpl(
    private val memberApi: MemberApi,
    private val paymentApi: PaymentApi
) : InvoiceRepository {

    // Cache for invoices
    private var cachedInvoices: List<Invoice>? = null

    override fun getInvoices(
        status: InvoiceStatus?,
        page: Int,
        size: Int
    ): Flow<Result<PagedResponse<Invoice>>> = flow {
        // Emit cached data if available (first page only)
        if (page == 0) {
            cachedInvoices?.let { cached ->
                val filtered = if (status != null) {
                    cached.filter { it.status == status }
                } else {
                    cached
                }
                emit(Result.success(PagedResponse(
                    items = filtered.take(size),
                    itemCount = minOf(filtered.size, size),
                    hasMore = filtered.size > size,
                    totalCount = filtered.size
                )))
            }
        }

        // Fetch fresh data
        memberApi.getInvoices(status?.name, page, size)
            .onSuccess { response ->
                if (page == 0 && status == null) {
                    cachedInvoices = response.items
                }
                emit(Result.success(response))
            }
            .onError { error ->
                if (cachedInvoices == null || page > 0) {
                    emit(Result.error(
                        exception = error.exception,
                        message = error.message,
                        messageAr = error.messageAr
                    ))
                }
            }
    }

    override suspend fun getPendingInvoices(): Result<List<Invoice>> {
        return memberApi.getPendingInvoices().onSuccess { invoices ->
            // Update cache with pending invoices
            val currentCached = cachedInvoices?.toMutableList() ?: mutableListOf()
            invoices.forEach { invoice ->
                val index = currentCached.indexOfFirst { it.id == invoice.id }
                if (index >= 0) {
                    currentCached[index] = invoice
                } else {
                    currentCached.add(0, invoice)
                }
            }
            cachedInvoices = currentCached
        }
    }

    override suspend fun initiatePayment(invoiceId: String, returnUrl: String): Result<PaymentInitiateResponse> {
        return paymentApi.initiatePayment(invoiceId, returnUrl)
    }

    override suspend fun verifyPayment(paymentReference: String): Result<PaymentVerifyResult> {
        return paymentApi.verifyPayment(paymentReference).onSuccess { result ->
            // If payment was successful, refresh invoices to update status
            if (result.success) {
                refreshInvoices()
            }
        }
    }

    override suspend fun refreshInvoices(): Result<List<Invoice>> {
        return memberApi.getInvoices(null, 0, 50).map { response ->
            cachedInvoices = response.items
            response.items
        }
    }
}
