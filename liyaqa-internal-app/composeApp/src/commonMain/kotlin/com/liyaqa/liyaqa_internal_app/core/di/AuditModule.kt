package com.liyaqa.liyaqa_internal_app.core.di

import com.liyaqa.liyaqa_internal_app.features.audit.data.repository.AuditRepository
import com.liyaqa.liyaqa_internal_app.features.audit.domain.usecase.GetAuditLogsUseCase
import com.liyaqa.liyaqa_internal_app.features.audit.presentation.list.AuditLogListViewModel
import org.koin.core.module.dsl.viewModel
import org.koin.dsl.module

val auditModule = module {
    single { AuditRepository(get()) }
    factory { GetAuditLogsUseCase(get()) }
    viewModel { AuditLogListViewModel(get()) }
}
