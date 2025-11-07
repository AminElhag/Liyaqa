package com.liyaqa.dashboard.features.booking.domain.usecase

import com.liyaqa.dashboard.core.domain.BaseUseCase
import com.liyaqa.dashboard.core.domain.Result
import com.liyaqa.dashboard.features.booking.data.dto.CreateBookingRequest
import com.liyaqa.dashboard.features.booking.data.repository.BookingRepository
import com.liyaqa.dashboard.features.booking.domain.model.Booking

class CreateBookingUseCase(
    private val repository: BookingRepository
) : BaseUseCase<CreateBookingUseCase.Params, Booking>() {

    data class Params(
        val memberId: String,
        val resourceType: String,
        val resourceId: String,
        val startTime: String,
        val endTime: String,
        val notes: String? = null
    )

    override suspend fun execute(params: Params): Result<Booking> {
        // Validation
        if (params.memberId.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Member ID cannot be blank"),
                "Member ID cannot be blank"
            )
        }
        if (params.resourceId.isBlank()) {
            return Result.Error(
                IllegalArgumentException("Resource ID cannot be blank"),
                "Resource ID cannot be blank"
            )
        }

        val request = CreateBookingRequest(
            memberId = params.memberId,
            resourceType = params.resourceType,
            resourceId = params.resourceId,
            startTime = params.startTime,
            endTime = params.endTime,
            notes = params.notes
        )

        return repository.createBooking(request)
    }
}
