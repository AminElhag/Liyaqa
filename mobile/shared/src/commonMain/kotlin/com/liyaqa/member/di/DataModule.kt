package com.liyaqa.member.di

import com.liyaqa.member.data.repository.AttendanceRepositoryImpl
import com.liyaqa.member.data.repository.BookingRepositoryImpl
import com.liyaqa.member.data.repository.DashboardRepositoryImpl
import com.liyaqa.member.data.repository.InvoiceRepositoryImpl
import com.liyaqa.member.data.repository.NotificationRepositoryImpl
import com.liyaqa.member.data.repository.ProfileRepositoryImpl
import com.liyaqa.member.data.repository.QrCodeRepositoryImpl
import com.liyaqa.member.data.repository.SubscriptionRepositoryImpl
import com.liyaqa.member.domain.repository.AttendanceRepository
import com.liyaqa.member.domain.repository.BookingRepository
import com.liyaqa.member.domain.repository.DashboardRepository
import com.liyaqa.member.domain.repository.InvoiceRepository
import com.liyaqa.member.domain.repository.NotificationRepository
import com.liyaqa.member.domain.repository.ProfileRepository
import com.liyaqa.member.domain.repository.QrCodeRepository
import com.liyaqa.member.domain.repository.SubscriptionRepository
import org.koin.dsl.module

/**
 * Koin module providing data layer dependencies.
 *
 * Contains all repository implementations that handle data operations
 * including API calls, caching, and data transformation.
 *
 * Repository Pattern:
 * - Interface (Port) defined in domain/repository/
 * - Implementation (Adapter) defined in data/repository/
 *
 * All repositories depend on [MemberApiService] from [networkModule].
 */
val dataModule = module {
    // Dashboard - home screen data aggregation
    single<DashboardRepository> { DashboardRepositoryImpl(get()) }

    // Profile - member personal information
    single<ProfileRepository> { ProfileRepositoryImpl(get()) }

    // QR Code - check-in QR generation
    single<QrCodeRepository> { QrCodeRepositoryImpl(get()) }

    // Subscription - membership plans and history
    single<SubscriptionRepository> { SubscriptionRepositoryImpl(get()) }

    // Booking - class sessions and reservations
    single<BookingRepository> { BookingRepositoryImpl(get()) }

    // Invoice - billing and payments
    single<InvoiceRepository> { InvoiceRepositoryImpl(get()) }

    // Attendance - check-in/out history
    single<AttendanceRepository> { AttendanceRepositoryImpl(get()) }

    // Notification - alerts and preferences
    single<NotificationRepository> { NotificationRepositoryImpl(get()) }
}
