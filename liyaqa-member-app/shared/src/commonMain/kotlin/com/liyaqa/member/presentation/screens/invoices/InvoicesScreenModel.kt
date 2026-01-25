package com.liyaqa.member.presentation.screens.invoices

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.liyaqa.member.domain.model.Invoice
import com.liyaqa.member.domain.model.InvoiceStatus
import com.liyaqa.member.domain.repository.InvoiceRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class InvoicesState(
    val isLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    val invoices: List<Invoice> = emptyList(),
    val selectedFilter: InvoiceStatus? = null,
    val paymentUrl: String? = null,
    val paymentReference: String? = null,
    val error: InvoicesError? = null
)

data class InvoicesError(
    val message: String,
    val messageAr: String? = null
)

class InvoicesScreenModel(
    private val invoiceRepository: InvoiceRepository
) : ScreenModel {

    private val _state = MutableStateFlow(InvoicesState())
    val state: StateFlow<InvoicesState> = _state.asStateFlow()

    fun loadInvoices() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            invoiceRepository.getInvoices(
                status = _state.value.selectedFilter,
                page = 0,
                size = 50
            ).collect { result ->
                result.onSuccess { response ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            isRefreshing = false,
                            invoices = response.items
                        )
                    }
                }.onError { error ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            isRefreshing = false,
                            error = InvoicesError(
                                message = error.message ?: "Failed to load invoices",
                                messageAr = error.messageAr
                            )
                        )
                    }
                }
            }
        }
    }

    fun refresh() {
        screenModelScope.launch {
            _state.update { it.copy(isRefreshing = true) }

            invoiceRepository.refreshInvoices().onSuccess { invoices ->
                val filtered = if (_state.value.selectedFilter != null) {
                    invoices.filter { it.status == _state.value.selectedFilter }
                } else {
                    invoices
                }
                _state.update {
                    it.copy(
                        isRefreshing = false,
                        invoices = filtered
                    )
                }
            }.onError { error ->
                _state.update {
                    it.copy(
                        isRefreshing = false,
                        error = InvoicesError(
                            message = error.message ?: "Failed to refresh",
                            messageAr = error.messageAr
                        )
                    )
                }
            }
        }
    }

    fun setFilter(status: InvoiceStatus?) {
        _state.update { it.copy(selectedFilter = status) }
        loadInvoices()
    }

    fun initiatePayment(invoiceId: String) {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }

            // Use a deep link that the app can handle
            val returnUrl = "liyaqa://payment/callback"

            invoiceRepository.initiatePayment(invoiceId, returnUrl)
                .onSuccess { response ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            paymentUrl = response.paymentUrl,
                            paymentReference = response.paymentReference
                        )
                    }
                }
                .onError { error ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            error = InvoicesError(
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
