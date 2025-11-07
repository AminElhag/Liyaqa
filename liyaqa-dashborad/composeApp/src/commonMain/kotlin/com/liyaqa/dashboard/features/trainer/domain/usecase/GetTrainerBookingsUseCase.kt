package com.liyaqa.dashboard.features.trainer.domain.usecase

import com.liyaqa.dashboard.core.domain.BaseUseCase
import com.liyaqa.dashboard.core.domain.Result
import com.liyaqa.dashboard.features.trainer.data.dto.TrainerBookingPageResponse
import com.liyaqa.dashboard.features.trainer.data.repository.TrainerRepository

class GetTrainerBookingsUseCase(
    private val repository: TrainerRepository
) : BaseUseCase<GetTrainerBookingsUseCase.Params, TrainerBookingPageResponse>() {

    data class Params(
        val page: Int = 0,
        val size: Int = 20,
        val trainerId: String? = null,
        val status: String? = null,
        val date: String? = null
    )

    override suspend fun execute(params: Params): Result<TrainerBookingPageResponse> {
        return repository.getTrainerBookings(
            page = params.page,
            size = params.size,
            trainerId = params.trainerId,
            status = params.status,
            date = params.date
        )
    }
}
