package com.liyaqa.dashboard.core.di

import com.liyaqa.dashboard.features.booking.data.repository.BookingRepository
import com.liyaqa.dashboard.features.booking.domain.usecase.CancelBookingUseCase
import com.liyaqa.dashboard.features.booking.domain.usecase.CheckInBookingUseCase
import com.liyaqa.dashboard.features.booking.domain.usecase.CreateBookingUseCase
import com.liyaqa.dashboard.features.booking.domain.usecase.GetBookingsUseCase
import com.liyaqa.dashboard.features.booking.presentation.list.BookingListViewModel
import org.koin.compose.viewmodel.dsl.viewModel
import org.koin.dsl.module

/**
 * Koin module for booking management feature.
 */
val bookingModule = module {
    // Repository
    single { BookingRepository(get()) }

    // Use Cases
    factory { GetBookingsUseCase(get()) }
    factory { CreateBookingUseCase(get()) }
    factory { CancelBookingUseCase(get()) }
    factory { CheckInBookingUseCase(get()) }

    // ViewModels
    viewModel { BookingListViewModel(get(), get(), get()) }
}
