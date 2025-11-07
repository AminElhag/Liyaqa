package com.liyaqa.liyaqa_internal_app.core.di

import com.liyaqa.liyaqa_internal_app.features.system.data.repository.SystemRepository
import com.liyaqa.liyaqa_internal_app.features.system.domain.usecase.EnsurePredefinedGroupsUseCase
import com.liyaqa.liyaqa_internal_app.features.system.domain.usecase.GetInitializationStatusUseCase
import com.liyaqa.liyaqa_internal_app.features.system.domain.usecase.InitializeSystemUseCase
import org.koin.dsl.module

/**
 * Koin module for system initialization feature.
 */
val systemModule = module {
    single { SystemRepository(get()) }
    factory { GetInitializationStatusUseCase(get()) }
    factory { InitializeSystemUseCase(get()) }
    factory { EnsurePredefinedGroupsUseCase(get()) }
}
