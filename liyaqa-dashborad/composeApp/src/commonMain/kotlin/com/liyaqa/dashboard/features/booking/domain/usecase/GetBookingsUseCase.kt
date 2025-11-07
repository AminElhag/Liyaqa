package com.liyaqa.dashboard.features.booking.domain.usecase

import com.liyaqa.dashboard.core.domain.BaseUseCase
import com.liyaqa.dashboard.core.domain.Result
import com.liyaqa.dashboard.features.booking.data.dto.BookingPageResponse
import com.liyaqa.dashboard.features.booking.data.repository.BookingRepository

class GetBookingsUseCase(
    private val repository: BookingRepository
) : BaseUseCase<GetBookingsUseCase.Params, BookingPageResponse>() {

    data class Params(
        val page: Int = 0,
        val size: Int = 20,
        val status: String? = null,
        val resourceType: String? = null,
        val date: String? = null
    )

    override suspend fun execute(params: Params): Result<BookingPageResponse> {
        return repository.getBookings(
            page = params.page,
            size = params.size,
            status = params.status,
            resourceType = params.resourceType,
            date = params.date
        )
    }
}
