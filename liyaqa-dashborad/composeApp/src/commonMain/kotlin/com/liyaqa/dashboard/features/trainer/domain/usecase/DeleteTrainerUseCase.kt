package com.liyaqa.dashboard.features.trainer.domain.usecase

import com.liyaqa.dashboard.core.domain.BaseUseCase
import com.liyaqa.dashboard.core.domain.Result
import com.liyaqa.dashboard.features.trainer.data.repository.TrainerRepository

class DeleteTrainerUseCase(
    private val repository: TrainerRepository
) : BaseUseCase<DeleteTrainerUseCase.Params, Unit>() {

    data class Params(val id: String)

    override suspend fun execute(params: Params): Result<Unit> {
        if (params.id.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Trainer ID cannot be blank"),
                "Trainer ID cannot be blank"
            )
        }
        return repository.deleteTrainer(params.id)
    }
}
