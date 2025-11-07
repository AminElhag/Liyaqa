package com.liyaqa.dashboard.core.di

import com.liyaqa.dashboard.features.employee.data.repository.FacilityEmployeeRepository
import com.liyaqa.dashboard.features.employee.domain.usecase.CreateFacilityEmployeeUseCase
import com.liyaqa.dashboard.features.employee.domain.usecase.DeleteFacilityEmployeeUseCase
import com.liyaqa.dashboard.features.employee.domain.usecase.GetFacilityEmployeeByIdUseCase
import com.liyaqa.dashboard.features.employee.domain.usecase.GetFacilityEmployeesUseCase
import com.liyaqa.dashboard.features.employee.domain.usecase.UpdateFacilityEmployeeUseCase
import com.liyaqa.dashboard.features.employee.presentation.list.FacilityEmployeeListViewModel
import org.koin.compose.viewmodel.dsl.viewModel
import org.koin.dsl.module

/**
 * Koin module for facility employee feature.
 * Following feature-based module organization.
 */
val employeeModule = module {
    // Repository
    single { FacilityEmployeeRepository(get()) }

    // Use Cases
    factory { GetFacilityEmployeesUseCase(get()) }
    factory { GetFacilityEmployeeByIdUseCase(get()) }
    factory { CreateFacilityEmployeeUseCase(get()) }
    factory { UpdateFacilityEmployeeUseCase(get()) }
    factory { DeleteFacilityEmployeeUseCase(get()) }

    // ViewModels
    viewModel { FacilityEmployeeListViewModel(get(), get()) }
}
