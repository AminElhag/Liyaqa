package com.liyaqa.member.presentation.invoices

import androidx.lifecycle.viewModelScope
import com.liyaqa.member.domain.model.Invoice
import com.liyaqa.member.domain.repository.InvoiceRepository
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.base.MviViewModel
import kotlinx.coroutines.launch

/**
 * User intents for the Invoice Detail screen.
 */
sealed interface InvoiceDetailIntent {
    /** Load invoice details. */
    data class LoadInvoice(val invoiceId: String) : InvoiceDetailIntent

    /** Initiate payment for the invoice. */
    data object InitiatePayment : InvoiceDetailIntent

    /** Download invoice as PDF. */
    data object DownloadPdf : InvoiceDetailIntent

    /** Refresh invoice data. */
    data object Refresh : InvoiceDetailIntent
}

/**
 * UI state for the Invoice Detail screen.
 */
data class InvoiceDetailState(
    /** Loading state for invoice. */
    val loading: LoadingState = LoadingState.Idle,

    /** Invoice ID being viewed. */
    val invoiceId: String = "",

    /** Invoice details. */
    val invoice: Invoice? = null,

    /** Whether payment is being initiated. */
    val paymentLoading: Boolean = false,

    /** Whether PDF is being downloaded. */
    val pdfLoading: Boolean = false
) {
    /** Whether invoice data is loaded. */
    val hasInvoice: Boolean get() = invoice != null

    /** Whether invoice is payable. */
    val isPayable: Boolean get() = invoice?.isPayable == true

    /** Formatted total amount. */
    val formattedTotal: String
        get() {
            val inv = invoice ?: return "0.00"
            return "${inv.currency} ${formatAmount(inv.totalAmount)}"
        }

    /** Formatted subtotal. */
    val formattedSubtotal: String?
        get() {
            val subtotal = invoice?.subtotal ?: return null
            return "${invoice?.currency} ${formatAmount(subtotal)}"
        }

    /** Formatted VAT amount. */
    val formattedVat: String?
        get() {
            val vat = invoice?.vatAmount ?: return null
            return "${invoice?.currency} ${formatAmount(vat)}"
        }

    /** Formatted discount. */
    val formattedDiscount: String?
        get() {
            val discount = invoice?.discount ?: return null
            return "${invoice?.currency} ${formatAmount(discount)}"
        }

    private fun formatAmount(amount: Double): String {
        val intPart = amount.toLong()
        val decPart = ((amount - intPart) * 100).toLong().let {
            if (it < 10) "0$it" else "$it"
        }
        return "$intPart.$decPart"
    }
}

/**
 * One-time effects from the Invoice Detail screen.
 */
sealed interface InvoiceDetailEffect {
    /** Navigate to payment screen with URL. */
    data class NavigateToPayment(val redirectUrl: String, val paymentId: String) : InvoiceDetailEffect

    /** PDF downloaded successfully. */
    data class PdfDownloaded(val data: ByteArray, val invoiceNumber: String) : InvoiceDetailEffect

    /** Show error message. */
    data class ShowError(val message: String) : InvoiceDetailEffect

    /** Navigate back. */
    data object NavigateBack : InvoiceDetailEffect
}

/**
 * ViewModel for the Invoice Detail screen.
 *
 * Features:
 * - Load invoice details with line items
 * - Initiate payment via PayTabs
 * - Download invoice as PDF
 * - Display invoice breakdown (subtotal, VAT, discount, total)
 */
class InvoiceDetailViewModel(
    private val invoiceRepository: InvoiceRepository
) : MviViewModel<InvoiceDetailIntent, InvoiceDetailState, InvoiceDetailEffect>(InvoiceDetailState()) {

    override fun onIntent(intent: InvoiceDetailIntent) {
        when (intent) {
            is InvoiceDetailIntent.LoadInvoice -> loadInvoice(intent.invoiceId)
            is InvoiceDetailIntent.InitiatePayment -> initiatePayment()
            is InvoiceDetailIntent.DownloadPdf -> downloadPdf()
            is InvoiceDetailIntent.Refresh -> refresh()
        }
    }

    private fun loadInvoice(invoiceId: String) {
        updateState { copy(loading = LoadingState.Loading(), invoiceId = invoiceId) }

        viewModelScope.launch {
            invoiceRepository.getInvoiceDetail(invoiceId)
                .onSuccess { invoice ->
                    updateState {
                        copy(
                            loading = LoadingState.Success,
                            invoice = invoice
                        )
                    }
                }
                .onFailure { error ->
                    updateState {
                        copy(loading = LoadingState.Error(
                            message = error.message ?: "Failed to load invoice",
                            throwable = error
                        ))
                    }
                }
        }
    }

    private fun initiatePayment() {
        val invoice = currentState.invoice
        if (invoice == null || !invoice.isPayable) {
            sendEffect(InvoiceDetailEffect.ShowError("Invoice is not payable"))
            return
        }

        updateState { copy(paymentLoading = true) }

        viewModelScope.launch {
            invoiceRepository.initiatePayment(
                invoiceId = invoice.id,
                returnUrl = null, // Will be handled by the app
                callbackUrl = null
            )
                .onSuccess { paymentInit ->
                    updateState { copy(paymentLoading = false) }
                    sendEffect(InvoiceDetailEffect.NavigateToPayment(
                        redirectUrl = paymentInit.redirectUrl,
                        paymentId = paymentInit.paymentId
                    ))
                }
                .onFailure { error ->
                    updateState { copy(paymentLoading = false) }
                    sendEffect(InvoiceDetailEffect.ShowError(
                        error.message ?: "Failed to initiate payment"
                    ))
                }
        }
    }

    private fun downloadPdf() {
        val invoice = currentState.invoice
        if (invoice == null) {
            sendEffect(InvoiceDetailEffect.ShowError("Invoice not loaded"))
            return
        }

        updateState { copy(pdfLoading = true) }

        viewModelScope.launch {
            invoiceRepository.downloadInvoicePdf(invoice.id)
                .onSuccess { pdfData ->
                    updateState { copy(pdfLoading = false) }
                    sendEffect(InvoiceDetailEffect.PdfDownloaded(
                        data = pdfData,
                        invoiceNumber = invoice.invoiceNumber
                    ))
                }
                .onFailure { error ->
                    updateState { copy(pdfLoading = false) }
                    sendEffect(InvoiceDetailEffect.ShowError(
                        error.message ?: "Failed to download PDF"
                    ))
                }
        }
    }

    private fun refresh() {
        if (currentState.invoiceId.isNotEmpty()) {
            loadInvoice(currentState.invoiceId)
        }
    }
}
