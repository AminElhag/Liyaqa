package com.liyaqa.dashboard.features.trainer.domain.usecase

import com.liyaqa.dashboard.core.domain.BaseUseCase
import com.liyaqa.dashboard.core.domain.Result
import com.liyaqa.dashboard.features.trainer.data.dto.TrainerPageResponse
import com.liyaqa.dashboard.features.trainer.data.repository.TrainerRepository

class GetTrainersUseCase(
    private val repository: TrainerRepository
) : BaseUseCase<GetTrainersUseCase.Params, TrainerPageResponse>() {

    data class Params(
        val page: Int = 0,
        val size: Int = 20,
        val status: String? = null,
        val specialization: String? = null
    )

    override suspend fun execute(params: Params): Result<TrainerPageResponse> {
        return repository.getTrainers(
            page = params.page,
            size = params.size,
            status = params.status,
            specialization = params.specialization
        )
    }
}
