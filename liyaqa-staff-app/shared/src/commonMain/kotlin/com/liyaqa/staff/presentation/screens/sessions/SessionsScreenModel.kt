package com.liyaqa.staff.presentation.screens.sessions

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.liyaqa.staff.domain.model.ClassSession
import com.liyaqa.staff.domain.model.TodaySessions
import com.liyaqa.staff.domain.repository.SessionRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class SessionsUiState(
    val isLoading: Boolean = true,
    val todaySessions: TodaySessions? = null,
    val sessions: List<ClassSession> = emptyList(),
    val error: String? = null
)

class SessionsScreenModel(
    private val sessionRepository: SessionRepository
) : ScreenModel {

    private val _uiState = MutableStateFlow(SessionsUiState())
    val uiState: StateFlow<SessionsUiState> = _uiState.asStateFlow()

    init {
        loadSessions()
    }

    fun loadSessions() {
        screenModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            val result = sessionRepository.getTodaySessions()

            _uiState.value = when {
                result.isSuccess -> {
                    val todaySessions = result.getOrNull()
                    _uiState.value.copy(
                        isLoading = false,
                        todaySessions = todaySessions,
                        sessions = todaySessions?.sessions ?: emptyList()
                    )
                }
                else -> _uiState.value.copy(
                    isLoading = false,
                    error = result.exceptionOrNull()?.message ?: "Failed to load sessions"
                )
            }
        }
    }

    fun refresh() {
        loadSessions()
    }
}
