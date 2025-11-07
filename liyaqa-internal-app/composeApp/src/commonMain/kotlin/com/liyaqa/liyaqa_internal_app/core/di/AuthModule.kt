package com.liyaqa.liyaqa_internal_app.core.di

import com.liyaqa.liyaqa_internal_app.features.auth.data.repository.AuthRepository
import com.liyaqa.liyaqa_internal_app.features.auth.domain.usecase.LoginUseCase
import com.liyaqa.liyaqa_internal_app.features.auth.presentation.login.LoginViewModel
import org.koin.core.module.dsl.viewModel
import org.koin.dsl.module

/**
 * Koin module for authentication feature.
 * Following feature-based module organization.
 */
val authModule = module {
    // Repository
    single { AuthRepository(get()) }

    // Use Cases
    factory { LoginUseCase(get()) }
    factory { com.liyaqa.liyaqa_internal_app.features.auth.domain.usecase.RefreshTokenUseCase(get()) }
    factory { com.liyaqa.liyaqa_internal_app.features.auth.domain.usecase.RequestPasswordResetUseCase(get()) }
    factory { com.liyaqa.liyaqa_internal_app.features.auth.domain.usecase.CompletePasswordResetUseCase(get()) }

    // ViewModels
    viewModel { LoginViewModel(get()) }
}
