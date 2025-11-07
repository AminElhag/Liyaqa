package com.liyaqa.liyaqa_internal_app.core.di

import com.liyaqa.liyaqa_internal_app.features.employee.data.repository.EmployeeRepository
import com.liyaqa.liyaqa_internal_app.features.employee.domain.usecase.CreateEmployeeUseCase
import com.liyaqa.liyaqa_internal_app.features.employee.domain.usecase.DeleteEmployeeUseCase
import com.liyaqa.liyaqa_internal_app.features.employee.domain.usecase.GetEmployeeByIdUseCase
import com.liyaqa.liyaqa_internal_app.features.employee.domain.usecase.GetEmployeesUseCase
import com.liyaqa.liyaqa_internal_app.features.employee.domain.usecase.UpdateEmployeeUseCase
import com.liyaqa.liyaqa_internal_app.features.employee.presentation.create.EmployeeFormViewModel
import com.liyaqa.liyaqa_internal_app.features.employee.presentation.detail.EmployeeDetailViewModel
import com.liyaqa.liyaqa_internal_app.features.employee.presentation.list.EmployeeListViewModel
import org.koin.core.module.dsl.viewModel
import org.koin.dsl.module

/**
 * Koin module for employee feature.
 * Following feature-based module organization.
 */
val employeeModule = module {
    // Repository
    single { EmployeeRepository(get()) }

    // Use Cases
    factory { GetEmployeesUseCase(get()) }
    factory { GetEmployeeByIdUseCase(get()) }
    factory { CreateEmployeeUseCase(get()) }
    factory { UpdateEmployeeUseCase(get()) }
    factory { DeleteEmployeeUseCase(get()) }
    factory { com.liyaqa.liyaqa_internal_app.features.employee.domain.usecase.GetCurrentEmployeeUseCase(get()) }
    factory { com.liyaqa.liyaqa_internal_app.features.employee.domain.usecase.UpdateCurrentEmployeeUseCase(get()) }
    factory { com.liyaqa.liyaqa_internal_app.features.employee.domain.usecase.ChangePasswordUseCase(get()) }

    // ViewModels
    viewModel { EmployeeListViewModel(get(), get()) }
    viewModel { parameters -> EmployeeDetailViewModel(get(), parameters.get()) }
    viewModel { parameters -> EmployeeFormViewModel(get(), get(), get(), get(), parameters.getOrNull()) }
}
