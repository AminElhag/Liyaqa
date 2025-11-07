package com.liyaqa.dashboard.core.di

import com.liyaqa.dashboard.features.member.data.repository.MemberRepository
import com.liyaqa.dashboard.features.member.domain.usecase.CreateMemberUseCase
import com.liyaqa.dashboard.features.member.domain.usecase.DeleteMemberUseCase
import com.liyaqa.dashboard.features.member.domain.usecase.GetMembersUseCase
import com.liyaqa.dashboard.features.member.domain.usecase.GetMembershipPlansUseCase
import com.liyaqa.dashboard.features.member.presentation.list.MemberListViewModel
import org.koin.compose.viewmodel.dsl.viewModel
import org.koin.dsl.module

/**
 * Koin module for member and membership management feature.
 */
val memberModule = module {
    // Repository
    single { MemberRepository(get()) }

    // Use Cases
    factory { GetMembersUseCase(get()) }
    factory { CreateMemberUseCase(get()) }
    factory { DeleteMemberUseCase(get()) }
    factory { GetMembershipPlansUseCase(get()) }

    // ViewModels
    viewModel { MemberListViewModel(get(), get()) }
}
