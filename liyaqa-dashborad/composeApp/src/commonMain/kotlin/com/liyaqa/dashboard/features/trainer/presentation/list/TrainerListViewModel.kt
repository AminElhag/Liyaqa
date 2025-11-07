package com.liyaqa.dashboard.features.trainer.presentation.list

import androidx.lifecycle.viewModelScope
import com.liyaqa.dashboard.core.domain.Result
import com.liyaqa.dashboard.core.presentation.BaseViewModel
import com.liyaqa.dashboard.core.presentation.UiEvent
import com.liyaqa.dashboard.core.presentation.UiState
import com.liyaqa.dashboard.features.trainer.data.dto.toDomain
import com.liyaqa.dashboard.features.trainer.domain.model.Trainer
import com.liyaqa.dashboard.features.trainer.domain.model.TrainerStatus
import com.liyaqa.dashboard.features.trainer.domain.usecase.DeleteTrainerUseCase
import com.liyaqa.dashboard.features.trainer.domain.usecase.GetTrainersUseCase
import kotlinx.coroutines.launch

data class TrainerListUiState(
    val trainers: List<Trainer> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val selectedStatus: TrainerStatus? = null,
    val currentPage: Int = 0,
    val totalPages: Int = 0,
    val hasMore: Boolean = false,
    val showDeleteDialog: Boolean = false,
    val trainerToDelete: Trainer? = null
) : UiState

sealed class TrainerListUiEvent : UiEvent {
    data class StatusFilterChanged(val status: TrainerStatus?) : TrainerListUiEvent()
    data object LoadMore : TrainerListUiEvent()
    data object Refresh : TrainerListUiEvent()
    data class ShowDeleteDialog(val trainer: Trainer) : TrainerListUiEvent()
    data object HideDeleteDialog : TrainerListUiEvent()
    data object ConfirmDelete : TrainerListUiEvent()
    data object ClearError : TrainerListUiEvent()
}

class TrainerListViewModel(
    private val getTrainersUseCase: GetTrainersUseCase,
    private val deleteTrainerUseCase: DeleteTrainerUseCase
) : BaseViewModel<TrainerListUiState, TrainerListUiEvent>() {

    init {
        loadTrainers()
    }

    override fun initialState() = TrainerListUiState()

    override fun onEvent(event: TrainerListUiEvent) {
        when (event) {
            is TrainerListUiEvent.StatusFilterChanged -> handleStatusFilterChanged(event.status)
            is TrainerListUiEvent.LoadMore -> loadMore()
            is TrainerListUiEvent.Refresh -> refresh()
            is TrainerListUiEvent.ShowDeleteDialog -> showDeleteDialog(event.trainer)
            is TrainerListUiEvent.HideDeleteDialog -> hideDeleteDialog()
            is TrainerListUiEvent.ConfirmDelete -> confirmDelete()
            is TrainerListUiEvent.ClearError -> clearError()
        }
    }

    private fun handleStatusFilterChanged(status: TrainerStatus?) {
        updateState { copy(selectedStatus = status) }
        loadTrainers(reset = true)
    }

    private fun loadMore() {
        val currentState = uiState.value
        if (!currentState.isLoading && currentState.hasMore) {
            loadTrainers(page = currentState.currentPage + 1)
        }
    }

    private fun refresh() {
        loadTrainers(reset = true)
    }

    private fun loadTrainers(page: Int = 0, reset: Boolean = false) {
        viewModelScope.launch {
            updateState { copy(isLoading = true, error = null) }

            val params = GetTrainersUseCase.Params(
                page = page,
                size = 20,
                status = uiState.value.selectedStatus?.name
            )

            when (val result = getTrainersUseCase(params)) {
                is Result.Success -> {
                    val data = result.data
                    updateState {
                        copy(
                            trainers = if (reset) data.content.map { it.toDomain() }
                            else trainers + data.content.map { it.toDomain() },
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
                            error = result.message ?: "Failed to load trainers"
                        )
                    }
                }
                is Result.Loading -> {
                    // Already handled above
                }
            }
        }
    }

    private fun showDeleteDialog(trainer: Trainer) {
        updateState {
            copy(showDeleteDialog = true, trainerToDelete = trainer)
        }
    }

    private fun hideDeleteDialog() {
        updateState {
            copy(showDeleteDialog = false, trainerToDelete = null)
        }
    }

    private fun confirmDelete() {
        val trainer = uiState.value.trainerToDelete ?: return

        viewModelScope.launch {
            hideDeleteDialog()
            updateState { copy(isLoading = true, error = null) }

            when (val result = deleteTrainerUseCase(DeleteTrainerUseCase.Params(trainer.id))) {
                is Result.Success -> {
                    updateState {
                        copy(
                            trainers = trainers.filter { it.id != trainer.id },
                            isLoading = false
                        )
                    }
                }
                is Result.Error -> {
                    updateState {
                        copy(
                            isLoading = false,
                            error = result.message ?: "Failed to delete trainer"
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
