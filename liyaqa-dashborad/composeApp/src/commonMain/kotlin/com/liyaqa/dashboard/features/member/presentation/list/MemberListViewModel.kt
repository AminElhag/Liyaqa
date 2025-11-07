package com.liyaqa.dashboard.features.member.presentation.list

import androidx.lifecycle.viewModelScope
import com.liyaqa.dashboard.core.domain.Result
import com.liyaqa.dashboard.core.presentation.BaseViewModel
import com.liyaqa.dashboard.core.presentation.UiEvent
import com.liyaqa.dashboard.core.presentation.UiState
import com.liyaqa.dashboard.features.member.data.dto.toDomain
import com.liyaqa.dashboard.features.member.domain.model.Member
import com.liyaqa.dashboard.features.member.domain.model.MemberStatus
import com.liyaqa.dashboard.features.member.domain.usecase.DeleteMemberUseCase
import com.liyaqa.dashboard.features.member.domain.usecase.GetMembersUseCase
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

data class MemberListUiState(
    val members: List<Member> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val searchQuery: String = "",
    val selectedStatus: MemberStatus? = null,
    val currentPage: Int = 0,
    val totalPages: Int = 0,
    val hasMore: Boolean = false,
    val showDeleteDialog: Boolean = false,
    val memberToDelete: Member? = null
) : UiState

sealed class MemberListUiEvent : UiEvent {
    data class SearchQueryChanged(val query: String) : MemberListUiEvent()
    data class StatusFilterChanged(val status: MemberStatus?) : MemberListUiEvent()
    data object LoadMore : MemberListUiEvent()
    data object Refresh : MemberListUiEvent()
    data class ShowDeleteDialog(val member: Member) : MemberListUiEvent()
    data object HideDeleteDialog : MemberListUiEvent()
    data object ConfirmDelete : MemberListUiEvent()
    data object ClearError : MemberListUiEvent()
}

class MemberListViewModel(
    private val getMembersUseCase: GetMembersUseCase,
    private val deleteMemberUseCase: DeleteMemberUseCase
) : BaseViewModel<MemberListUiState, MemberListUiEvent>() {

    private var searchJob: Job? = null

    init {
        loadMembers()
    }

    override fun initialState() = MemberListUiState()

    override fun onEvent(event: MemberListUiEvent) {
        when (event) {
            is MemberListUiEvent.SearchQueryChanged -> handleSearchQueryChanged(event.query)
            is MemberListUiEvent.StatusFilterChanged -> handleStatusFilterChanged(event.status)
            is MemberListUiEvent.LoadMore -> loadMore()
            is MemberListUiEvent.Refresh -> refresh()
            is MemberListUiEvent.ShowDeleteDialog -> showDeleteDialog(event.member)
            is MemberListUiEvent.HideDeleteDialog -> hideDeleteDialog()
            is MemberListUiEvent.ConfirmDelete -> confirmDelete()
            is MemberListUiEvent.ClearError -> clearError()
        }
    }

    private fun handleSearchQueryChanged(query: String) {
        updateState { copy(searchQuery = query) }
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(300) // Debounce
            loadMembers(reset = true)
        }
    }

    private fun handleStatusFilterChanged(status: MemberStatus?) {
        updateState { copy(selectedStatus = status) }
        loadMembers(reset = true)
    }

    private fun loadMore() {
        val currentState = uiState.value
        if (!currentState.isLoading && currentState.hasMore) {
            loadMembers(page = currentState.currentPage + 1)
        }
    }

    private fun refresh() {
        loadMembers(reset = true)
    }

    private fun loadMembers(page: Int = 0, reset: Boolean = false) {
        viewModelScope.launch {
            updateState { copy(isLoading = true, error = null) }

            val params = GetMembersUseCase.Params(
                page = page,
                size = 20,
                search = uiState.value.searchQuery.ifBlank { null },
                status = uiState.value.selectedStatus?.name
            )

            when (val result = getMembersUseCase(params)) {
                is Result.Success -> {
                    val data = result.data
                    updateState {
                        copy(
                            members = if (reset) data.content.map { it.toDomain() }
                            else members + data.content.map { it.toDomain() },
                            currentPage = data.page,
                            totalPages = data.totalPages,
                            hasMore = data.page < data.totalPages - 1,
                            isLoading = false
                        )
                    }
                }
                is Result.Error -> {
                    updateState {
                        copy(
                            isLoading = false,
                            error = result.message ?: "Failed to load members"
                        )
                    }
                }
                is Result.Loading -> {
                    // Already handled above
                }
            }
        }
    }

    private fun showDeleteDialog(member: Member) {
        updateState {
            copy(showDeleteDialog = true, memberToDelete = member)
        }
    }

    private fun hideDeleteDialog() {
        updateState {
            copy(showDeleteDialog = false, memberToDelete = null)
        }
    }

    private fun confirmDelete() {
        val member = uiState.value.memberToDelete ?: return

        viewModelScope.launch {
            hideDeleteDialog()
            updateState { copy(isLoading = true, error = null) }

            when (val result = deleteMemberUseCase(DeleteMemberUseCase.Params(member.id))) {
                is Result.Success -> {
                    updateState {
                        copy(
                            members = members.filter { it.id != member.id },
                            isLoading = false
                        )
                    }
                }
                is Result.Error -> {
                    updateState {
                        copy(
                            isLoading = false,
                            error = result.message ?: "Failed to delete member"
                        )
                    }
                }
                is Result.Loading -> {
                    // Already handled above
                }
            }
        }
    }

    private fun clearError() {
        updateState { copy(error = null) }
    }
}
