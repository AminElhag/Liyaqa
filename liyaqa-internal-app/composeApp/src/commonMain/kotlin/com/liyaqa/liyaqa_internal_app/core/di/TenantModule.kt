package com.liyaqa.liyaqa_internal_app.core.di

import com.liyaqa.liyaqa_internal_app.features.tenant.data.repository.TenantRepository
import com.liyaqa.liyaqa_internal_app.features.tenant.domain.usecase.*
import com.liyaqa.liyaqa_internal_app.features.tenant.presentation.create.TenantFormViewModel
import com.liyaqa.liyaqa_internal_app.features.tenant.presentation.detail.TenantDetailViewModel
import com.liyaqa.liyaqa_internal_app.features.tenant.presentation.list.TenantListViewModel
import org.koin.core.module.dsl.viewModel
import org.koin.dsl.module

val tenantModule = module {
    single { TenantRepository(get()) }
    factory { GetTenantsUseCase(get()) }
    factory { GetTenantByIdUseCase(get()) }
    factory { CreateTenantUseCase(get()) }
    factory { UpdateTenantUseCase(get()) }
    factory { DeleteTenantUseCase(get()) }
    factory { SuspendTenantUseCase(get()) }
    factory { ReactivateTenantUseCase(get()) }
    factory { ChangeTenantPlanUseCase(get()) }
    factory { GetTenantAnalyticsUseCase(get()) }
    viewModel { TenantListViewModel(get(), get()) }
    viewModel { parameters -> TenantDetailViewModel(get(), get(), get(), get(), parameters.get()) }
    viewModel { parameters -> TenantFormViewModel(get(), get(), get(), parameters.getOrNull()) }
}
