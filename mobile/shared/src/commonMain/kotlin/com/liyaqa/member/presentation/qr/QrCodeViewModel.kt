package com.liyaqa.member.presentation.qr

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
    /** Load or reload the QR code. */
    data object LoadQr : QrCodeIntent

    /** Manually refresh the QR code. */
    data object RefreshQr : QrCodeIntent

    /** Start the countdown timer. */
    data object StartCountdown : QrCodeIntent

    /** Stop the countdown timer. */
    data object StopCountdown : QrCodeIntent
}

/**
 * UI state for the QR Code screen.
 */
data class QrCodeState(
    /** Loading state. */
    val loading: LoadingState = LoadingState.Idle,

    /** The QR code data. */
    val qrCode: QrCode? = null,

    /** Expiry timestamp. */
    val expiresAt: Instant? = null,

    /** Countdown in seconds until expiry. */
    val countdown: Long = 0,

    /** Whether the QR code is expired. */
    val isExpired: Boolean = false,

    /** Whether currently refreshing. */
    val isRefreshing: Boolean = false
) {
    /** Whether QR code data is available. */
    val hasQrCode: Boolean get() = qrCode != null && !isExpired

    /** Formatted countdown string (MM:SS). */
    val formattedCountdown: String
        get() {
            if (countdown <= 0) return "00:00"
            val minutes = (countdown / 60).toInt()
            val seconds = (countdown % 60).toInt()
            return "${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}"
        }

    /** Whether expiring soon (under 5 minutes). */
    val isExpiringSoon: Boolean get() = countdown in 1..300
}

/**
 * One-time effects from the QR Code screen.
 */
sealed interface QrCodeEffect {
    /** Show error message. */
    data class ShowError(val message: String) : QrCodeEffect
}

/**
 * ViewModel for the QR Code screen.
 *
 * Features:
 * - Loads QR code on init
 * - Live countdown timer
 * - Auto-refresh 5 minutes before expiry
 * - Manual refresh support
 */
class QrCodeViewModel(
    private val qrCodeRepository: QrCodeRepository
) : MviViewModel<QrCodeIntent, QrCodeState, QrCodeEffect>(QrCodeState()) {

    companion object {
        private const val QR_SIZE = 300
        private const val COUNTDOWN_INTERVAL_MS = 1000L
        private const val AUTO_REFRESH_THRESHOLD_SECONDS = 300L // 5 minutes
    }

    private var countdownJob: Job? = null

    init {
        onIntent(QrCodeIntent.LoadQr)
    }

    override fun onIntent(intent: QrCodeIntent) {
        when (intent) {
            is QrCodeIntent.LoadQr -> loadQrCode()
            is QrCodeIntent.RefreshQr -> refreshQrCode()
            is QrCodeIntent.StartCountdown -> startCountdown()
            is QrCodeIntent.StopCountdown -> stopCountdown()
        }
    }

    private fun loadQrCode() {
        updateState { copy(loading = LoadingState.Loading()) }

        viewModelScope.launch {
            qrCodeRepository.getQrCode(QR_SIZE)
                .onSuccess { qrCode ->
                    updateState {
                        copy(
                            loading = LoadingState.Success,
                            qrCode = qrCode,
                            expiresAt = qrCode.expiresAt,
                            countdown = qrCode.remainingSeconds,
                            isExpired = qrCode.isExpired
                        )
                    }
                    startCountdown()
                }
                .onFailure { error ->
                    updateState {
                        copy(
                            loading = LoadingState.Error(
                                message = error.message ?: "Failed to load QR code",
                                throwable = error
                            )
                        )
                    }
                    sendEffect(QrCodeEffect.ShowError(
                        error.message ?: "Failed to load QR code"
                    ))
                }
        }
    }

    private fun refreshQrCode() {
        updateState { copy(isRefreshing = true) }

        viewModelScope.launch {
            qrCodeRepository.getQrCode(QR_SIZE)
                .onSuccess { qrCode ->
                    updateState {
                        copy(
                            loading = LoadingState.Success,
                            qrCode = qrCode,
                            expiresAt = qrCode.expiresAt,
                            countdown = qrCode.remainingSeconds,
                            isExpired = qrCode.isExpired,
                            isRefreshing = false
                        )
                    }
                }
                .onFailure { error ->
                    updateState { copy(isRefreshing = false) }
                    sendEffect(QrCodeEffect.ShowError(
                        error.message ?: "Failed to refresh QR code"
                    ))
                }
        }
    }

    private fun startCountdown() {
        stopCountdown()

        countdownJob = viewModelScope.launch {
            while (isActive) {
                delay(COUNTDOWN_INTERVAL_MS)
                val qrCode = currentState.qrCode ?: break
                val remaining = qrCode.remainingSeconds

                updateState {
                    copy(
                        countdown = remaining,
                        isExpired = remaining <= 0
                    )
                }

                // Auto-refresh when expiring soon
                if (remaining in 1..AUTO_REFRESH_THRESHOLD_SECONDS && !currentState.isRefreshing) {
                    refreshQrCode()
                }

                // Stop countdown if expired
                if (remaining <= 0) break
            }
        }
    }

    private fun stopCountdown() {
        countdownJob?.cancel()
        countdownJob = null
    }

    override fun onCleared() {
        super.onCleared()
        stopCountdown()
    }
}
