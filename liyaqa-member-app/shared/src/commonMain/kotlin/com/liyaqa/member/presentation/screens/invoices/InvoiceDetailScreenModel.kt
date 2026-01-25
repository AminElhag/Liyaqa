package com.liyaqa.member.presentation.screens.invoices

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.liyaqa.member.domain.model.Invoice
import com.liyaqa.member.domain.repository.InvoiceRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class InvoiceDetailState(
    val isLoading: Boolean = false,
    val isInitiatingPayment: Boolean = false,
    val invoice: Invoice? = null,
    val paymentUrl: String? = null,
    val paymentReference: String? = null,
    val error: InvoiceDetailError? = null
)

data class InvoiceDetailError(
    val message: String,
    val messageAr: String? = null
)

class InvoiceDetailScreenModel(
    private val invoiceRepository: InvoiceRepository
) : ScreenModel {

    private val _state = MutableStateFlow(InvoiceDetailState())
    val state: StateFlow<InvoiceDetailState> = _state.asStateFlow()

    fun loadInvoice(invoiceId: String) {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            // Get invoice from list (cached)
            invoiceRepository.getInvoices(null, 0, 100).collect { result ->
                result.onSuccess { response ->
                    val invoice = response.items.find { it.id == invoiceId }
                    _state.update {
                        it.copy(
                            isLoading = false,
                            invoice = invoice,
                            error = if (invoice == null) {
                                InvoiceDetailError(
                                    message = "Invoice not found",
                                    messageAr = "الفاتورة غير موجودة"
                                )
                            } else null
                        )
                    }
                }.onError { error ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            error = InvoiceDetailError(
                                message = error.message ?: "Failed to load invoice",
                                messageAr = error.messageAr
                            )
                        )
                    }
                }
            }
        }
    }

    fun initiatePayment(invoiceId: String) {
        screenModelScope.launch {
            _state.update { it.copy(isInitiatingPayment = true) }

            val returnUrl = "liyaqa://payment/callback"

            invoiceRepository.initiatePayment(invoiceId, returnUrl)
                .onSuccess { response ->
                    _state.update {
                        it.copy(
                            isInitiatingPayment = false,
                            paymentUrl = response.paymentUrl,
                            paymentReference = response.paymentReference
                        )
                    }
                }
                .onError { error ->
                    _state.update {
                        it.copy(
                            isInitiatingPayment = false,
                            error = InvoiceDetailError(
                                message = error.message ?: "Failed to initiate payment",
                                messageAr = error.messageAr
                            )
                        )
                    }
                }
        }
    }

    fun clearPaymentUrl() {
        _state.update { it.copy(paymentUrl = null, paymentReference = null) }
    }
}
