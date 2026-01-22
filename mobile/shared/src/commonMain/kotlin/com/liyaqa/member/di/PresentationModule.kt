package com.liyaqa.member.di

import com.liyaqa.member.presentation.attendance.AttendanceViewModel
import com.liyaqa.member.presentation.bookings.BookingsViewModel
import com.liyaqa.member.presentation.bookings.NewBookingViewModel
import com.liyaqa.member.presentation.dashboard.DashboardViewModel
import com.liyaqa.member.presentation.invoices.InvoiceDetailViewModel
import com.liyaqa.member.presentation.invoices.InvoicesViewModel
import com.liyaqa.member.presentation.notifications.NotificationSettingsViewModel
import com.liyaqa.member.presentation.notifications.NotificationsViewModel
import com.liyaqa.member.presentation.profile.ChangePasswordViewModel
import com.liyaqa.member.presentation.profile.EditProfileViewModel
import com.liyaqa.member.presentation.profile.ProfileViewModel
import com.liyaqa.member.presentation.qr.QrCodeViewModel
import com.liyaqa.member.presentation.subscriptions.SubscriptionsViewModel
import org.koin.core.module.dsl.viewModelOf
import org.koin.dsl.module

/**
 * Koin module providing presentation layer dependencies (ViewModels).
 *
 * All feature ViewModels follow the MVI (Model-View-Intent) pattern:
 * - Intent: User actions
 * - State: UI state as StateFlow
 * - Effect: One-time events as SharedFlow
 *
 * Usage in Composable:
 * ```kotlin
 * val viewModel: DashboardViewModel = koinViewModel()
 * val state by viewModel.state.collectAsState()
 *
 * LaunchedEffect(Unit) {
 *     viewModel.effect.collect { effect ->
 *         when (effect) { ... }
 *     }
 * }
 * ```
 *
 * Note: AuthViewModel is in [authModule] as it has special initialization order.
 */
val presentationModule = module {
    // =========================================
    // Dashboard Feature
    // =========================================
    viewModelOf(::DashboardViewModel)

    // =========================================
    // QR Code Feature
    // =========================================
    viewModelOf(::QrCodeViewModel)

    // =========================================
    // Bookings Feature
    // =========================================
    viewModelOf(::BookingsViewModel)
    viewModelOf(::NewBookingViewModel)

    // =========================================
    // Invoices Feature
    // =========================================
    viewModelOf(::InvoicesViewModel)
    viewModelOf(::InvoiceDetailViewModel)

    // =========================================
    // Profile Feature
    // =========================================
    viewModelOf(::ProfileViewModel)
    viewModelOf(::EditProfileViewModel)
    viewModelOf(::ChangePasswordViewModel)

    // =========================================
    // Notifications Feature
    // =========================================
    viewModelOf(::NotificationsViewModel)
    viewModelOf(::NotificationSettingsViewModel)

    // =========================================
    // Attendance Feature
    // =========================================
    viewModelOf(::AttendanceViewModel)

    // =========================================
    // Subscriptions Feature
    // =========================================
    viewModelOf(::SubscriptionsViewModel)
}
