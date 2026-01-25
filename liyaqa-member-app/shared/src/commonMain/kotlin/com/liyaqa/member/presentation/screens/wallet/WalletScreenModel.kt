package com.liyaqa.member.presentation.screens.wallet

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.liyaqa.member.domain.model.WalletBalance
import com.liyaqa.member.domain.model.WalletTransaction
import com.liyaqa.member.domain.repository.WalletRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class WalletState(
    val isLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    val balance: WalletBalance? = null,
    val transactions: List<WalletTransaction> = emptyList(),
    val error: WalletError? = null
)

data class WalletError(
    val message: String,
    val messageAr: String? = null
)

class WalletScreenModel(
    private val walletRepository: WalletRepository
) : ScreenModel {

    private val _state = MutableStateFlow(WalletState())
    val state: StateFlow<WalletState> = _state.asStateFlow()

    fun loadWallet() {
        loadBalance()
        loadTransactions()
    }

    private fun loadBalance() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            walletRepository.getBalance().collect { result ->
                result.onSuccess { balance ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            isRefreshing = false,
                            balance = balance
                        )
                    }
                }.onError { error ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            isRefreshing = false,
                            error = WalletError(
                                message = error.message ?: "Failed to load wallet",
                                messageAr = error.messageAr
                            )
                        )
                    }
                }
            }
        }
    }

    private fun loadTransactions() {
        screenModelScope.launch {
            walletRepository.getTransactions(null, 0, 50)
                .onSuccess { response ->
                    _state.update {
                        it.copy(transactions = response.items)
                    }
                }
        }
    }

    fun refresh() {
        screenModelScope.launch {
            _state.update { it.copy(isRefreshing = true) }

            walletRepository.refreshBalance().onSuccess { balance ->
                _state.update {
                    it.copy(
                        isRefreshing = false,
                        balance = balance
                    )
                }
            }.onError { error ->
                _state.update {
                    it.copy(
                        isRefreshing = false,
                        error = WalletError(
                            message = error.message ?: "Failed to refresh",
                            messageAr = error.messageAr
                        )
                    )
                }
            }

            // Also refresh transactions
            walletRepository.getTransactions(null, 0, 50)
                .onSuccess { response ->
                    _state.update {
                        it.copy(transactions = response.items)
                    }
                }
        }
    }
}
