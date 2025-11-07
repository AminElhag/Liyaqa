package com.liyaqa.liyaqa_internal_app.core.di

import com.liyaqa.liyaqa_internal_app.features.facility.data.repository.FacilityRepository
import com.liyaqa.liyaqa_internal_app.features.facility.domain.usecase.*
import com.liyaqa.liyaqa_internal_app.features.facility.presentation.create.FacilityFormViewModel
import com.liyaqa.liyaqa_internal_app.features.facility.presentation.detail.FacilityDetailViewModel
import com.liyaqa.liyaqa_internal_app.features.facility.presentation.list.FacilityListViewModel
import org.koin.core.module.dsl.viewModel
import org.koin.dsl.module

val facilityModule = module {
    single { FacilityRepository(get()) }
    factory { GetFacilitiesUseCase(get()) }
    factory { GetFacilityByIdUseCase(get()) }
    factory { CreateFacilityUseCase(get()) }
    factory { UpdateFacilityUseCase(get()) }
    factory { DeleteFacilityUseCase(get()) }
    factory { GetBranchesUseCase(get()) }
    factory { GetBranchByIdUseCase(get()) }
    factory { CreateBranchUseCase(get()) }
    factory { UpdateBranchUseCase(get()) }
    factory { DeleteBranchUseCase(get()) }
    factory { GetFacilitiesByTenantUseCase(get()) }
    viewModel { FacilityListViewModel(get(), get()) }
    viewModel { parameters -> FacilityDetailViewModel(get(), parameters.get()) }
    viewModel { parameters -> FacilityFormViewModel(get(), get(), get(), parameters.getOrNull()) }
}
