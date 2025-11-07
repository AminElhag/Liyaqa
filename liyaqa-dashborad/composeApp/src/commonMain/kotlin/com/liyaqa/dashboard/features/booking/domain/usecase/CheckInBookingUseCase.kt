package com.liyaqa.dashboard.features.booking.domain.usecase

import com.liyaqa.dashboard.core.domain.BaseUseCase
import com.liyaqa.dashboard.core.domain.Result
import com.liyaqa.dashboard.features.booking.data.repository.BookingRepository
import com.liyaqa.dashboard.features.booking.domain.model.Booking

class CheckInBookingUseCase(
    private val repository: BookingRepository
) : BaseUseCase<CheckInBookingUseCase.Params, Booking>() {

    data class Params(val id: String)

    override suspend fun execute(params: Params): Result<Booking> {
        if (params.id.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Booking ID cannot be blank"),
                "Booking ID cannot be blank"
            )
        }
        return repository.checkIn(params.id)
    }
}
