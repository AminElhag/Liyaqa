package com.liyaqa.dashboard.core.di

import com.liyaqa.dashboard.features.trainer.data.repository.TrainerRepository
import com.liyaqa.dashboard.features.trainer.domain.usecase.DeleteTrainerUseCase
import com.liyaqa.dashboard.features.trainer.domain.usecase.GetTrainerBookingsUseCase
import com.liyaqa.dashboard.features.trainer.domain.usecase.GetTrainersUseCase
import com.liyaqa.dashboard.features.trainer.presentation.list.TrainerListViewModel
import org.koin.compose.viewmodel.dsl.viewModel
import org.koin.dsl.module

/**
 * Koin module for trainer management feature.
 */
val trainerModule = module {
    // Repository
    single { TrainerRepository(get()) }

    // Use Cases
    factory { GetTrainersUseCase(get()) }
    factory { DeleteTrainerUseCase(get()) }
    factory { GetTrainerBookingsUseCase(get()) }

    // ViewModels
    viewModel { TrainerListViewModel(get(), get()) }
}
