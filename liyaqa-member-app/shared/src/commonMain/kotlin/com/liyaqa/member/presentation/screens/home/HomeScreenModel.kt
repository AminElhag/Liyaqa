package com.liyaqa.member.presentation.screens.home

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.liyaqa.member.domain.model.HomeDashboard
import com.liyaqa.member.domain.repository.DashboardRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class HomeState(
    val isLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    val dashboard: HomeDashboard? = null,
    val error: HomeError? = null
)

data class HomeError(
    val message: String,
    val messageAr: String? = null
)

class HomeScreenModel(
    private val dashboardRepository: DashboardRepository
) : ScreenModel {

    private val _state = MutableStateFlow(HomeState())
    val state: StateFlow<HomeState> = _state.asStateFlow()

    fun loadDashboard() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            dashboardRepository.getHomeDashboard().collect { result ->
                result.onSuccess { dashboard ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            isRefreshing = false,
                            dashboard = dashboard,
                            error = null
                        )
                    }
                }.onError { error ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            isRefreshing = false,
                            error = HomeError(
                                message = error.message ?: "Failed to load dashboard",
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

            dashboardRepository.refreshDashboard().onSuccess { dashboard ->
                _state.update {
                    it.copy(
                        isRefreshing = false,
                        dashboard = dashboard,
                        error = null
                    )
                }
            }.onError { error ->
                _state.update {
                    it.copy(
                        isRefreshing = false,
                        error = HomeError(
                            message = error.message ?: "Failed to refresh",
                            messageAr = error.messageAr
                        )
                    )
                }
            }
        }
    }
}
