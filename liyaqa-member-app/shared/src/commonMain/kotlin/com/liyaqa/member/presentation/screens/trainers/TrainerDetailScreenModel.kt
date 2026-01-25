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

data class TrainerDetailState(
    val isLoading: Boolean = false,
    val trainer: Trainer? = null,
    val error: TrainerDetailError? = null
)

data class TrainerDetailError(
    val message: String,
    val messageAr: String? = null
)

class TrainerDetailScreenModel(
    private val trainerRepository: TrainerRepository
) : ScreenModel {

    private val _state = MutableStateFlow(TrainerDetailState())
    val state: StateFlow<TrainerDetailState> = _state.asStateFlow()

    fun loadTrainer(trainerId: String) {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            trainerRepository.getTrainer(trainerId)
                .onSuccess { trainer ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            trainer = trainer
                        )
                    }
                }
                .onError { error ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            error = TrainerDetailError(
                                message = error.message ?: "Failed to load trainer",
                                messageAr = error.messageAr
                            )
                        )
                    }
                }
        }
    }
}
