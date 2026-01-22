package com.liyaqa.member.presentation.viewmodel

import androidx.lifecycle.viewModelScope
import com.liyaqa.member.domain.model.QrCode
import com.liyaqa.member.domain.repository.QrCodeRepository
import com.liyaqa.member.presentation.base.LoadingState
import com.liyaqa.member.presentation.base.MviViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.datetime.Instant

/**
 * User intents for the QR Code screen.
 */
sealed interface QrCodeIntent {
    /** Load/generate a new QR code */
    data object LoadQrCode : QrCodeIntent

    /** Manually refresh the QR code */
    data object RefreshQrCode : QrCodeIntent
}

/**
 * UI state for the QR Code screen.
 */
data class QrCodeState(
    val loading: LoadingState = LoadingState.Idle,
    val qrCode: QrCode? = null,
    val memberName: String = "",
    val isRefreshing: Boolean = false
) {
    val hasQrCode: Boolean
        get() = qrCode != null

    val qrCodeData: String?
        get() = qrCode?.qrCodeData

    val expiresAt: Instant?
        get() = qrCode?.expiresAt

    val isExpired: Boolean
        get() = qrCode?.isExpired ?: true

    val isExpiringSoon: Boolean
        get() = qrCode?.isExpiringSoon ?: false
}

/**
 * One-time effects for the QR Code screen.
 */
sealed interface QrCodeEffect {
    /** Show error message */
    data class ShowError(val message: String) : QrCodeEffect

    /** QR code refreshed successfully */
    data object QrCodeRefreshed : QrCodeEffect
}

/**
 * ViewModel for the QR Code screen.
 *
 * Manages QR code generation and display with:
 * - Auto-refresh 5 minutes before expiry
 * - Manual refresh capability
 * - Countdown timer support
 *
 * The QR code contains a time-limited token for secure check-in.
 */
class QrCodeViewModel(
    private val qrCodeRepository: QrCodeRepository,
    private val memberName: String = "" // Injected from auth state
) : MviViewModel<QrCodeIntent, QrCodeState, QrCodeEffect>(
    QrCodeState(memberName = memberName)
) {

    companion object {
        private const val AUTO_REFRESH_THRESHOLD_SECONDS = 300L // 5 minutes
        private const val QR_CODE_SIZE = 300
        private const val CHECK_INTERVAL_MS = 10_000L // Check every 10 seconds
    }

    private var autoRefreshJob: Job? = null

    init {
        onIntent(QrCodeIntent.LoadQrCode)
    }

    override fun onIntent(intent: QrCodeIntent) {
        when (intent) {
            is QrCodeIntent.LoadQrCode -> loadQrCode()
            is QrCodeIntent.RefreshQrCode -> refreshQrCode()
        }
    }

    private fun loadQrCode() {
        if (currentState.loading is LoadingState.Loading) return

        launch {
            updateState { copy(loading = LoadingState.Loading()) }

            qrCodeRepository.getQrCode(QR_CODE_SIZE)
                .onSuccess { qrCode ->
                    updateState {
                        copy(
                            loading = LoadingState.Success,
                            qrCode = qrCode
                        )
                    }
                    startAutoRefreshMonitor()
                }
                .onFailure { error ->
                    updateState {
                        copy(loading = LoadingState.Error(error.message ?: "Failed to load QR code"))
                    }
                }
        }
    }

    private fun refreshQrCode() {
        launch {
            updateState { copy(isRefreshing = true) }

            qrCodeRepository.getQrCode(QR_CODE_SIZE)
                .onSuccess { qrCode ->
                    updateState {
                        copy(
                            isRefreshing = false,
                            loading = LoadingState.Success,
                            qrCode = qrCode
                        )
                    }
                    sendEffect(QrCodeEffect.QrCodeRefreshed)
                    // Restart auto-refresh monitor with new expiry
                    startAutoRefreshMonitor()
                }
                .onFailure { error ->
                    updateState { copy(isRefreshing = false) }
                    sendEffect(QrCodeEffect.ShowError(error.message ?: "Failed to refresh QR code"))
                }
        }
    }

    /**
     * Monitors the QR code expiry and auto-refreshes when approaching expiry.
     */
    private fun startAutoRefreshMonitor() {
        // Cancel any existing monitor
        autoRefreshJob?.cancel()

        autoRefreshJob = viewModelScope.launch {
            while (isActive) {
                delay(CHECK_INTERVAL_MS)

                val qrCode = currentState.qrCode ?: continue

                // Check if expired
                if (qrCode.isExpired) {
                    // Auto-refresh if expired
                    silentRefresh()
                    continue
                }

                // Check if expiring soon (within threshold)
                if (qrCode.remainingSeconds <= AUTO_REFRESH_THRESHOLD_SECONDS) {
                    // Auto-refresh before expiry
                    silentRefresh()
                }
            }
        }
    }

    /**
     * Silently refresh the QR code without showing loading state.
     * Used for auto-refresh to avoid UI disruption.
     */
    private suspend fun silentRefresh() {
        qrCodeRepository.getQrCode(QR_CODE_SIZE)
            .onSuccess { qrCode ->
                updateState { copy(qrCode = qrCode) }
            }
        // Silently ignore errors on auto-refresh
    }

    override fun onCleared() {
        super.onCleared()
        autoRefreshJob?.cancel()
    }
}
