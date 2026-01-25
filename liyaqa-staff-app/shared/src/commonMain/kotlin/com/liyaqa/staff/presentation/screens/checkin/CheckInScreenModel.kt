package com.liyaqa.staff.presentation.screens.checkin

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.liyaqa.staff.domain.model.CheckInSource
import com.liyaqa.staff.domain.model.MemberSummary
import com.liyaqa.staff.domain.repository.AttendanceRepository
import com.liyaqa.staff.domain.repository.MemberRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class CheckInUiState(
    val searchQuery: String = "",
    val isSearching: Boolean = false,
    val searchResults: List<MemberSummary> = emptyList(),
    val selectedMember: MemberSummary? = null,
    val isCheckingIn: Boolean = false,
    val checkInSuccess: Boolean = false,
    val checkInMessage: String? = null,
    val error: String? = null,
    val showScanner: Boolean = false
)

class CheckInScreenModel(
    private val memberRepository: MemberRepository,
    private val attendanceRepository: AttendanceRepository
) : ScreenModel {

    private val _uiState = MutableStateFlow(CheckInUiState())
    val uiState: StateFlow<CheckInUiState> = _uiState.asStateFlow()

    private var searchJob: Job? = null

    fun onSearchQueryChange(query: String) {
        _uiState.value = _uiState.value.copy(
            searchQuery = query,
            error = null,
            checkInSuccess = false,
            checkInMessage = null
        )

        searchJob?.cancel()
        if (query.length >= 2) {
            searchJob = screenModelScope.launch {
                delay(300) // Debounce
                searchMembers(query)
            }
        } else {
            _uiState.value = _uiState.value.copy(searchResults = emptyList())
        }
    }

    private suspend fun searchMembers(query: String) {
        _uiState.value = _uiState.value.copy(isSearching = true)

        val result = memberRepository.searchMembers(query)

        _uiState.value = when {
            result.isSuccess -> _uiState.value.copy(
                isSearching = false,
                searchResults = result.getOrNull()?.content ?: emptyList()
            )
            else -> _uiState.value.copy(
                isSearching = false,
                error = result.exceptionOrNull()?.message
            )
        }
    }

    fun selectMember(member: MemberSummary) {
        _uiState.value = _uiState.value.copy(
            selectedMember = member,
            searchResults = emptyList(),
            searchQuery = ""
        )
    }

    fun clearSelectedMember() {
        _uiState.value = _uiState.value.copy(
            selectedMember = null,
            checkInSuccess = false,
            checkInMessage = null
        )
    }

    fun checkInMember(memberId: String, source: CheckInSource = CheckInSource.MANUAL) {
        screenModelScope.launch {
            _uiState.value = _uiState.value.copy(isCheckingIn = true, error = null)

            val result = attendanceRepository.checkInMember(memberId, source)

            _uiState.value = when {
                result.isSuccess -> _uiState.value.copy(
                    isCheckingIn = false,
                    checkInSuccess = true,
                    checkInMessage = "Check-in successful"
                )
                else -> _uiState.value.copy(
                    isCheckingIn = false,
                    error = result.exceptionOrNull()?.message ?: "Check-in failed"
                )
            }
        }
    }

    fun onQrCodeScanned(qrCode: String) {
        screenModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isCheckingIn = true,
                showScanner = false,
                error = null
            )

            val result = attendanceRepository.checkInByQrCode(qrCode)

            _uiState.value = when {
                result.isSuccess -> _uiState.value.copy(
                    isCheckingIn = false,
                    checkInSuccess = true,
                    checkInMessage = "Check-in successful"
                )
                else -> _uiState.value.copy(
                    isCheckingIn = false,
                    error = result.exceptionOrNull()?.message ?: "Invalid QR code"
                )
            }
        }
    }

    fun toggleScanner() {
        _uiState.value = _uiState.value.copy(
            showScanner = !_uiState.value.showScanner,
            error = null
        )
    }

    fun clearMessages() {
        _uiState.value = _uiState.value.copy(
            error = null,
            checkInSuccess = false,
            checkInMessage = null
        )
    }
}
