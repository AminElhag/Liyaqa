package com.liyaqa.liyaqa_internal_app.features.audit.presentation.list

import androidx.lifecycle.viewModelScope
import com.liyaqa.liyaqa_internal_app.core.presentation.BaseViewModel
import com.liyaqa.liyaqa_internal_app.core.presentation.UiEvent
import com.liyaqa.liyaqa_internal_app.core.presentation.UiState
import com.liyaqa.liyaqa_internal_app.features.audit.data.dto.toDomain
import com.liyaqa.liyaqa_internal_app.features.audit.domain.model.AuditLog
import com.liyaqa.liyaqa_internal_app.features.audit.domain.usecase.GetAuditLogsUseCase
import kotlinx.coroutines.launch

class AuditLogListViewModel(
    private val getAuditLogsUseCase: GetAuditLogsUseCase
) : BaseViewModel<AuditLogListUiState, AuditLogListUiEvent>() {

    override fun initialState() = AuditLogListUiState()

    init {
        loadAuditLogs()
    }

    override fun onEvent(event: AuditLogListUiEvent) {
        when (event) {
            is AuditLogListUiEvent.Refresh -> loadAuditLogs()
            is AuditLogListUiEvent.LoadMore -> {
                if (!currentState.isLoadingMore && !currentState.isLastPage) {
                    loadAuditLogs(currentState.currentPage + 1, append = true)
                }
            }
            is AuditLogListUiEvent.ClearError -> setState { copy(error = null) }
        }
    }

    private fun loadAuditLogs(page: Int = 0, append: Boolean = false) {
        viewModelScope.launch {
            setState { copy(isLoading = !append, isLoadingMore = append, error = null) }

            val result = getAuditLogsUseCase(GetAuditLogsUseCase.Params(page = page, size = 20))

            handleResult(
                result = result,
                onSuccess = { response ->
                    val newLogs = response.content.map { it.toDomain() }
                    setState {
                        copy(
                            auditLogs = if (append) auditLogs + newLogs else newLogs,
                            isLoading = false,
                            isLoadingMore = false,
                            currentPage = response.number,
                            totalPages = response.totalPages,
                            totalElements = response.totalElements,
                            isLastPage = response.last
                        )
                    }
                },
                onError = { error ->
                    setState {
                        copy(
                            isLoading = false,
                            isLoadingMore = false,
                            error = error.message ?: "Failed to load audit logs"
                        )
                    }
                }
            )
        }
    }
}

data class AuditLogListUiState(
    val auditLogs: List<AuditLog> = emptyList(),
    val isLoading: Boolean = false,
    val isLoadingMore: Boolean = false,
    val currentPage: Int = 0,
    val totalPages: Int = 0,
    val totalElements: Long = 0,
    val isLastPage: Boolean = false,
    val error: String? = null
) : UiState

sealed class AuditLogListUiEvent : UiEvent {
    data object Refresh : AuditLogListUiEvent()
    data object LoadMore : AuditLogListUiEvent()
    data object ClearError : AuditLogListUiEvent()
}
