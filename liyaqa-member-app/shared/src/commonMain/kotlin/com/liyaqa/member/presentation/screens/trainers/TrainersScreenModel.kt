package com.liyaqa.member.presentation.screens.trainers

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.liyaqa.member.domain.model.Trainer
import com.liyaqa.member.domain.repository.TrainerRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class TrainersState(
    val isLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    val trainers: List<Trainer> = emptyList(),
    val error: TrainersError? = null
)

data class TrainersError(
    val message: String,
    val messageAr: String? = null
)

class TrainersScreenModel(
    private val trainerRepository: TrainerRepository
) : ScreenModel {

    private val _state = MutableStateFlow(TrainersState())
    val state: StateFlow<TrainersState> = _state.asStateFlow()

    fun loadTrainers() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            trainerRepository.getTrainers()
                .onSuccess { trainers ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            isRefreshing = false,
                            trainers = trainers
                        )
                    }
                }
                .onError { error ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            isRefreshing = false,
                            error = TrainersError(
                                message = error.message ?: "Failed to load trainers",
                                messageAr = error.messageAr
                            )
                        )
                    }
                }
        }
    }

    fun refresh() {
        _state.update { it.copy(isRefreshing = true) }
        loadTrainers()
    }
}
