package com.liyaqa.member.data.repository

import com.liyaqa.member.data.api.MemberApiService
import com.liyaqa.member.data.api.toResult
import com.liyaqa.member.data.dto.InitiatePaymentRequestDto
import com.liyaqa.member.data.mapper.toDomain
import com.liyaqa.member.domain.model.Invoice
import com.liyaqa.member.domain.model.PagedResult
import com.liyaqa.member.domain.model.PaymentInitiation
import com.liyaqa.member.domain.repository.InvoiceRepository

/**
 * Implementation of InvoiceRepository using MemberApiService.
 */
class InvoiceRepositoryImpl(
    private val api: MemberApiService
) : InvoiceRepository {

    override suspend fun getInvoices(
        status: String?,
        page: Int,
        size: Int
    ): Result<PagedResult<Invoice>> {
        return api.getInvoices(status, page, size).toResult { response ->
            PagedResult(
                items = response.items.map { it.toDomain() },
                hasMore = response.hasMore,
                totalCount = response.totalCount
            )
        }
    }

    override suspend fun getPendingInvoices(): Result<List<Invoice>> {
        return api.getPendingInvoices().toResult { list ->
            list.map { it.toDomain() }
        }
    }

    override suspend fun getInvoiceDetail(invoiceId: String): Result<Invoice> {
        return api.getInvoiceDetail(invoiceId).toResult { it.toDomain() }
    }

    override suspend fun downloadInvoicePdf(invoiceId: String): Result<ByteArray> {
        return api.downloadInvoicePdf(invoiceId).toResult()
    }

    override suspend fun initiatePayment(
        invoiceId: String,
        returnUrl: String?,
        callbackUrl: String?
    ): Result<PaymentInitiation> {
        return api.initiatePayment(
            InitiatePaymentRequestDto(
                invoiceId = invoiceId,
                returnUrl = returnUrl,
                callbackUrl = callbackUrl
            )
        ).toResult { dto ->
            PaymentInitiation(
                paymentId = dto.paymentId,
                redirectUrl = dto.redirectUrl,
                transactionRef = dto.transactionRef,
                amount = dto.amount,
                currency = dto.currency
            )
        }
    }
}
