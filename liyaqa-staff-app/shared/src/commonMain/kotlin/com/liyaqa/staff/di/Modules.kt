package com.liyaqa.staff.di

import com.liyaqa.staff.data.local.InMemoryTokenStorage
import com.liyaqa.staff.data.local.TokenStorage
import com.liyaqa.staff.data.remote.api.HttpClientFactory
import com.liyaqa.staff.data.remote.api.StaffApi
import com.liyaqa.staff.data.remote.api.TokenProvider
import com.liyaqa.staff.data.repository.*
import com.liyaqa.staff.domain.repository.*
import com.liyaqa.staff.presentation.screens.checkin.CheckInScreenModel
import com.liyaqa.staff.presentation.screens.dashboard.DashboardScreenModel
import com.liyaqa.staff.presentation.screens.facilities.FacilitiesScreenModel
import com.liyaqa.staff.presentation.screens.login.LoginScreenModel
import com.liyaqa.staff.presentation.screens.profile.ProfileScreenModel
import com.liyaqa.staff.presentation.screens.sessions.SessionDetailScreenModel
import com.liyaqa.staff.presentation.screens.sessions.SessionsScreenModel
import org.koin.core.module.Module
import org.koin.core.module.dsl.factoryOf
import org.koin.core.module.dsl.singleOf
import org.koin.dsl.bind
import org.koin.dsl.module

/**
 * Common Koin modules for dependency injection
 */
val commonModule = module {
    // Token Storage
    single<TokenStorage> { InMemoryTokenStorage() }

    // HTTP Client
    single {
        HttpClientFactory(
            tokenProvider = get(),
            baseUrl = getProperty("API_BASE_URL"),
            isDebug = getProperty("IS_DEBUG", "false").toBoolean()
        )
    }

    single { get<HttpClientFactory>().create() }
    single { get<HttpClientFactory>().json }

    // API Client
    singleOf(::StaffApi)
}

val repositoryModule = module {
    singleOf(::AuthRepositoryImpl) bind AuthRepository::class
    single<TokenProvider> { get<AuthRepositoryImpl>() }
    singleOf(::DashboardRepositoryImpl) bind DashboardRepository::class
    singleOf(::MemberRepositoryImpl) bind MemberRepository::class
    singleOf(::AttendanceRepositoryImpl) bind AttendanceRepository::class
    singleOf(::SessionRepositoryImpl) bind SessionRepository::class
    singleOf(::FacilityBookingRepositoryImpl) bind FacilityBookingRepository::class
}

val screenModelModule = module {
    factoryOf(::LoginScreenModel)
    factoryOf(::DashboardScreenModel)
    factoryOf(::CheckInScreenModel)
    factoryOf(::SessionsScreenModel)
    factoryOf(::SessionDetailScreenModel)
    factoryOf(::FacilitiesScreenModel)
    factoryOf(::ProfileScreenModel)
}

/**
 * Returns all common modules
 */
fun getCommonModules(): List<Module> = listOf(
    commonModule,
    repositoryModule,
    screenModelModule
)
