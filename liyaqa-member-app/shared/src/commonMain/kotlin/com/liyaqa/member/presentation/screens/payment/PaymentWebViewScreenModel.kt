package com.liyaqa.member.presentation.screens.payment

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.liyaqa.member.domain.repository.InvoiceRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class PaymentWebViewState(
    val isLoading: Boolean = false,
    val isVerifying: Boolean = false,
    val isSuccess: Boolean = false,
    val paymentReference: String = "",
    val successMessage: String? = null,
    val successMessageAr: String? = null,
    val error: PaymentError? = null
)

data class PaymentError(
    val message: String,
    val messageAr: String? = null
)

class PaymentWebViewScreenModel(
    private val invoiceRepository: InvoiceRepository
) : ScreenModel {

    private val _state = MutableStateFlow(PaymentWebViewState())
    val state: StateFlow<PaymentWebViewState> = _state.asStateFlow()

    fun setPaymentReference(reference: String) {
        _state.update { it.copy(paymentReference = reference) }
    }

    fun verifyPayment() {
        val reference = _state.value.paymentReference
        if (reference.isEmpty()) {
            _state.update {
                it.copy(error = PaymentError(
                    message = "Invalid payment reference",
                    messageAr = "مرجع الدفع غير صالح"
                ))
            }
            return
        }

        screenModelScope.launch {
            _state.update { it.copy(isVerifying = true, error = null) }

            invoiceRepository.verifyPayment(reference)
                .onSuccess { result ->
                    if (result.success) {
                        _state.update {
                            it.copy(
                                isVerifying = false,
                                isSuccess = true,
                                successMessage = result.message,
                                successMessageAr = result.messageAr
                            )
                        }
                    } else {
                        _state.update {
                            it.copy(
                                isVerifying = false,
                                error = PaymentError(
                                    message = result.message ?: "Payment verification failed",
                                    messageAr = result.messageAr
                                )
                            )
                        }
                    }
                }
                .onError { error ->
                    _state.update {
                        it.copy(
                            isVerifying = false,
                            error = PaymentError(
                                message = error.message ?: "Failed to verify payment",
                                messageAr = error.messageAr
                            )
                        )
                    }
                }
        }
    }

    fun openPaymentUrl(url: String) {
        // Platform-specific URL opening would be handled here
        // For now, this is a placeholder
        // In real implementation, use expect/actual pattern:
        // expect fun openUrl(url: String)
        // Android: context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
        // iOS: UIApplication.shared.open(URL(string: url)!)
    }

    fun retry() {
        _state.update { it.copy(error = null, isSuccess = false) }
    }
}
