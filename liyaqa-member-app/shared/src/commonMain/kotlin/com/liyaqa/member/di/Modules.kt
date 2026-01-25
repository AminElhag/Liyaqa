package com.liyaqa.member.di

import com.liyaqa.member.data.local.LiyaqaMemberDatabase
import com.liyaqa.member.data.remote.api.AuthApi
import com.liyaqa.member.data.remote.api.HttpClientFactory
import com.liyaqa.member.data.remote.api.MemberApi
import com.liyaqa.member.data.remote.api.MobileApi
import com.liyaqa.member.data.remote.api.PaymentApi
import com.liyaqa.member.data.remote.api.PrayerTimeApi
import com.liyaqa.member.data.remote.api.QrApi
import com.liyaqa.member.data.remote.api.TokenProvider
import com.liyaqa.member.data.remote.api.TrainerApi
import com.liyaqa.member.data.repository.AttendanceRepositoryImpl
import com.liyaqa.member.data.repository.AuthRepositoryImpl
import com.liyaqa.member.data.repository.BookingRepositoryImpl
import com.liyaqa.member.data.repository.DashboardRepositoryImpl
import com.liyaqa.member.data.repository.InvoiceRepositoryImpl
import com.liyaqa.member.data.repository.MemberRepositoryImpl
import com.liyaqa.member.data.repository.NotificationRepositoryImpl
import com.liyaqa.member.data.repository.PrayerTimeRepositoryImpl
import com.liyaqa.member.data.repository.TrainerRepositoryImpl
import com.liyaqa.member.data.repository.WalletRepositoryImpl
import com.liyaqa.member.domain.repository.AttendanceRepository
import com.liyaqa.member.domain.repository.AuthRepository
import com.liyaqa.member.domain.repository.BookingRepository
import com.liyaqa.member.domain.repository.DashboardRepository
import com.liyaqa.member.domain.repository.InvoiceRepository
import com.liyaqa.member.domain.repository.MemberRepository
import com.liyaqa.member.domain.repository.NotificationRepository
import com.liyaqa.member.domain.repository.PrayerTimeRepository
import com.liyaqa.member.domain.repository.TrainerRepository
import com.liyaqa.member.domain.repository.WalletRepository
import com.liyaqa.member.presentation.screens.home.HomeScreenModel
import com.liyaqa.member.presentation.screens.login.LoginScreenModel
import com.liyaqa.member.presentation.screens.profile.ProfileScreenModel
import com.liyaqa.member.presentation.screens.profile.EditProfileScreenModel
import com.liyaqa.member.presentation.screens.profile.ChangePasswordScreenModel
import com.liyaqa.member.presentation.screens.schedule.ScheduleScreenModel
import com.liyaqa.member.presentation.screens.qr.QrCheckInScreenModel
import com.liyaqa.member.presentation.screens.settings.SettingsScreenModel
import com.liyaqa.member.presentation.screens.subscription.SubscriptionDetailScreenModel
import com.liyaqa.member.presentation.screens.invoices.InvoicesScreenModel
import com.liyaqa.member.presentation.screens.invoices.InvoiceDetailScreenModel
import com.liyaqa.member.presentation.screens.payment.PaymentWebViewScreenModel
import com.liyaqa.member.presentation.screens.wallet.WalletScreenModel
import com.liyaqa.member.presentation.screens.trainers.TrainersScreenModel
import com.liyaqa.member.presentation.screens.trainers.TrainerDetailScreenModel
import com.liyaqa.member.presentation.screens.trainers.PTBookingScreenModel
import com.liyaqa.member.presentation.screens.attendance.AttendanceScreenModel
import com.liyaqa.member.presentation.screens.attendance.AttendanceStatsScreenModel
import org.koin.core.module.Module
import org.koin.core.module.dsl.factoryOf
import org.koin.core.module.dsl.singleOf
import org.koin.dsl.bind
import org.koin.dsl.module

/**
 * Common Koin modules for dependency injection
 */
val commonModule = module {
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

    // API Clients
    singleOf(::AuthApi)
    singleOf(::MemberApi)
    singleOf(::MobileApi)
    singleOf(::QrApi)
    singleOf(::PaymentApi)
    singleOf(::TrainerApi)
    singleOf(::PrayerTimeApi)
}

val repositoryModule = module {
    singleOf(::AuthRepositoryImpl) bind AuthRepository::class
    singleOf(::MemberRepositoryImpl) bind MemberRepository::class
    singleOf(::BookingRepositoryImpl) bind BookingRepository::class
    singleOf(::DashboardRepositoryImpl) bind DashboardRepository::class
    singleOf(::InvoiceRepositoryImpl) bind InvoiceRepository::class
    singleOf(::WalletRepositoryImpl) bind WalletRepository::class
    singleOf(::TrainerRepositoryImpl) bind TrainerRepository::class
    singleOf(::AttendanceRepositoryImpl) bind AttendanceRepository::class
    singleOf(::PrayerTimeRepositoryImpl) bind PrayerTimeRepository::class
    singleOf(::NotificationRepositoryImpl) bind NotificationRepository::class
}

val screenModelModule = module {
    factoryOf(::LoginScreenModel)
    factoryOf(::HomeScreenModel)
    factoryOf(::ProfileScreenModel)
    factoryOf(::EditProfileScreenModel)
    factoryOf(::ChangePasswordScreenModel)
    factoryOf(::ScheduleScreenModel)
    factoryOf(::QrCheckInScreenModel)
    factoryOf(::SettingsScreenModel)
    factoryOf(::SubscriptionDetailScreenModel)
    factoryOf(::InvoicesScreenModel)
    factoryOf(::InvoiceDetailScreenModel)
    factoryOf(::PaymentWebViewScreenModel)
    factoryOf(::WalletScreenModel)
    factoryOf(::TrainersScreenModel)
    factoryOf(::TrainerDetailScreenModel)
    factoryOf(::PTBookingScreenModel)
    factoryOf(::AttendanceScreenModel)
    factoryOf(::AttendanceStatsScreenModel)
}

/**
 * Returns all common modules
 */
fun getCommonModules(): List<Module> = listOf(
    commonModule,
    repositoryModule,
    screenModelModule
)
