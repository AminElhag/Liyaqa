package com.liyaqa.member.presentation.viewmodel

import com.liyaqa.member.domain.model.Invoice
import com.liyaqa.member.domain.model.PaymentInitiation
import com.liyaqa.member.domain.repository.InvoiceRepository
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.base.MviViewModel

/**
 * User intents for the Invoice Detail screen.
 */
sealed interface InvoiceDetailIntent {
    /** Load invoice details */
    data class LoadInvoice(val invoiceId: String) : InvoiceDetailIntent

    /** Refresh invoice details */
    data object Refresh : InvoiceDetailIntent

    /** Initiate payment for the invoice */
    data object InitiatePayment : InvoiceDetailIntent

    /** Download invoice as PDF */
    data object DownloadPdf : InvoiceDetailIntent

    /** Navigate back */
    data object NavigateBack : InvoiceDetailIntent
}

/**
 * UI state for the Invoice Detail screen.
 */
data class InvoiceDetailState(
    val loading: LoadingState = LoadingState.Idle,
    val invoiceId: String = "",
    val invoice: Invoice? = null,
    val isRefreshing: Boolean = false,
    val isInitiatingPayment: Boolean = false,
    val isDownloadingPdf: Boolean = false
) {
    /**
     * Formatted subtotal with currency.
     */
    val formattedSubtotal: String?
        get() = invoice?.subtotal?.let { formatCurrency(it, invoice.currency) }

    /**
     * Formatted VAT amount with currency.
     */
    val formattedVatAmount: String?
        get() = invoice?.vatAmount?.let { formatCurrency(it, invoice.currency) }

    /**
     * Formatted discount with currency.
     */
    val formattedDiscount: String?
        get() = invoice?.discount?.let { formatCurrency(it, invoice.currency) }

    /**
     * Formatted total amount with currency.
     */
    val formattedTotal: String
        get() = invoice?.let { formatCurrency(it.totalAmount, it.currency) } ?: ""

    private fun formatCurrency(amount: Double, currency: String): String {
        val intPart = amount.toLong()
        val decPart = ((amount - intPart) * 100).toLong().let {
            if (it < 10) "0$it" else "$it"
        }
        return "$currency $intPart.$decPart"
    }
}

/**
 * One-time effects for the Invoice Detail screen.
 */
sealed interface InvoiceDetailEffect {
    /** Show error message */
    data class ShowError(val message: String) : InvoiceDetailEffect

    /** Navigate to payment screen with PayTabs redirect URL */
    data class NavigateToPayment(val payment: PaymentInitiation) : InvoiceDetailEffect

    /** PDF downloaded successfully */
    data class PdfDownloaded(val pdfData: ByteArray) : InvoiceDetailEffect

    /** Show success message */
    data class ShowSuccess(val message: String) : InvoiceDetailEffect

    /** Navigate back */
    data object NavigateBack : InvoiceDetailEffect
}

/**
 * ViewModel for the Invoice Detail screen.
 *
 * Manages:
 * - Loading invoice details with line items
 * - Payment initiation via PayTabs
 * - PDF download
 * - Error handling
 */
class InvoiceDetailViewModel(
    private val invoiceRepository: InvoiceRepository
) : MviViewModel<InvoiceDetailIntent, InvoiceDetailState, InvoiceDetailEffect>(InvoiceDetailState()) {

    override fun onIntent(intent: InvoiceDetailIntent) {
        when (intent) {
            is InvoiceDetailIntent.LoadInvoice -> loadInvoice(intent.invoiceId)
            is InvoiceDetailIntent.Refresh -> refresh()
            is InvoiceDetailIntent.InitiatePayment -> initiatePayment()
            is InvoiceDetailIntent.DownloadPdf -> downloadPdf()
            is InvoiceDetailIntent.NavigateBack -> sendEffect(InvoiceDetailEffect.NavigateBack)
        }
    }

    private fun loadInvoice(invoiceId: String) {
        if (currentState.loading is LoadingState.Loading) return

        launch {
            updateState { copy(loading = LoadingState.Loading(), invoiceId = invoiceId) }

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
                        copy(loading = LoadingState.Error(error.message ?: "Failed to load invoice"))
                    }
                }
        }
    }

    private fun refresh() {
        val invoiceId = currentState.invoiceId
        if (invoiceId.isEmpty()) return

        launch {
            updateState { copy(isRefreshing = true) }

            invoiceRepository.getInvoiceDetail(invoiceId)
                .onSuccess { invoice ->
                    updateState {
                        copy(
                            isRefreshing = false,
                            loading = LoadingState.Success,
                            invoice = invoice
                        )
                    }
                }
                .onFailure { error ->
                    updateState { copy(isRefreshing = false) }
                    sendEffect(InvoiceDetailEffect.ShowError(error.message ?: "Failed to refresh"))
                }
        }
    }

    private fun initiatePayment() {
        val invoice = currentState.invoice ?: return
        if (!invoice.isPayable) {
            sendEffect(InvoiceDetailEffect.ShowError("This invoice cannot be paid"))
            return
        }

        launch {
            updateState { copy(isInitiatingPayment = true) }

            invoiceRepository.initiatePayment(
                invoiceId = invoice.id,
                returnUrl = "liyaqa://payment/complete",
                callbackUrl = null
            )
                .onSuccess { payment ->
                    updateState { copy(isInitiatingPayment = false) }
                    sendEffect(InvoiceDetailEffect.NavigateToPayment(payment))
                }
                .onFailure { error ->
                    updateState { copy(isInitiatingPayment = false) }
                    sendEffect(InvoiceDetailEffect.ShowError(error.message ?: "Failed to initiate payment"))
                }
        }
    }

    private fun downloadPdf() {
        val invoiceId = currentState.invoiceId
        if (invoiceId.isEmpty()) return

        launch {
            updateState { copy(isDownloadingPdf = true) }

            invoiceRepository.downloadInvoicePdf(invoiceId)
                .onSuccess { pdfData ->
                    updateState { copy(isDownloadingPdf = false) }
                    sendEffect(InvoiceDetailEffect.PdfDownloaded(pdfData))
                    sendEffect(InvoiceDetailEffect.ShowSuccess("PDF downloaded successfully"))
                }
                .onFailure { error ->
                    updateState { copy(isDownloadingPdf = false) }
                    sendEffect(InvoiceDetailEffect.ShowError(error.message ?: "Failed to download PDF"))
                }
        }
    }
}
