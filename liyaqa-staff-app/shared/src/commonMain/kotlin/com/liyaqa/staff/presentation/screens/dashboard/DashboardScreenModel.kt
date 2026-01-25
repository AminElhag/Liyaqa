package com.liyaqa.staff.presentation.screens.dashboard

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.liyaqa.staff.domain.model.StaffDashboard
import com.liyaqa.staff.domain.repository.DashboardRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class DashboardUiState(
    val isLoading: Boolean = true,
    val dashboard: StaffDashboard? = null,
    val error: String? = null
)

class DashboardScreenModel(
    private val dashboardRepository: DashboardRepository
) : ScreenModel {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        loadDashboard()
    }

    fun loadDashboard() {
        screenModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)

            val result = dashboardRepository.getDashboard()

            _uiState.value = when {
                result.isSuccess -> _uiState.value.copy(
                    isLoading = false,
                    dashboard = result.getOrNull()
                )
                else -> _uiState.value.copy(
                    isLoading = false,
                    error = result.exceptionOrNull()?.message ?: "Failed to load dashboard"
                )
            }
        }
    }

    fun refresh() {
        loadDashboard()
    }
}
