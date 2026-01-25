package com.liyaqa.member.presentation.screens.qr

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.liyaqa.member.domain.model.QrCode
import com.liyaqa.member.domain.repository.AttendanceRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class QrCheckInState(
    val isLoading: Boolean = false,
    val qrCode: QrCode? = null,
    val isBlocked: Boolean = false,
    val blockedUntil: String? = null,
    val checkInSuccess: Boolean = false,
    val error: QrError? = null
)

data class QrError(
    val message: String,
    val messageAr: String? = null
)

class QrCheckInScreenModel(
    private val attendanceRepository: AttendanceRepository
) : ScreenModel {

    private val _state = MutableStateFlow(QrCheckInState())
    val state: StateFlow<QrCheckInState> = _state.asStateFlow()

    fun loadQrCode() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            // First check if check-in is blocked
            attendanceRepository.getCheckInStatus().onSuccess { status ->
                if (status.isBlocked) {
                    _state.update {
                        it.copy(
                            isLoading = false,
                            isBlocked = true,
                            blockedUntil = status.blockedUntil
                        )
                    }
                    return@launch
                }
            }

            // Get QR code
            attendanceRepository.getQrCode().onSuccess { qrCode ->
                _state.update {
                    it.copy(
                        isLoading = false,
                        qrCode = qrCode,
                        isBlocked = false,
                        error = null
                    )
                }
            }.onError { error ->
                _state.update {
                    it.copy(
                        isLoading = false,
                        error = QrError(
                            message = error.message ?: "Failed to load QR code",
                            messageAr = error.messageAr
                        )
                    )
                }
            }
        }
    }

    fun selfCheckIn(locationId: String) {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            attendanceRepository.selfCheckIn(locationId).onSuccess { result ->
                _state.update {
                    it.copy(
                        isLoading = false,
                        checkInSuccess = result.success,
                        error = if (!result.success) {
                            QrError(
                                message = result.message ?: "Check-in failed",
                                messageAr = result.messageAr
                            )
                        } else null
                    )
                }
            }.onError { error ->
                _state.update {
                    it.copy(
                        isLoading = false,
                        error = QrError(
                            message = error.message ?: "Check-in failed",
                            messageAr = error.messageAr
                        )
                    )
                }
            }
        }
    }

    fun clearCheckInSuccess() {
        _state.update { it.copy(checkInSuccess = false) }
    }
}
