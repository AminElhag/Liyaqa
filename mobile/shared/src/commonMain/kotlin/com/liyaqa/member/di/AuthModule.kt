package com.liyaqa.member.di

import com.liyaqa.member.data.auth.AuthTokenProviderImpl
import com.liyaqa.member.data.auth.repository.AuthRepository
import com.liyaqa.member.data.auth.repository.AuthRepositoryImpl
import com.liyaqa.member.presentation.auth.AuthViewModel
import com.liyaqa.member.stores.LocaleStore
import org.koin.core.module.dsl.viewModelOf
import org.koin.dsl.module

/**
 * Koin module providing authentication-related dependencies.
 *
 * Includes:
 * - Token provider for API authentication
 * - Auth repository for login/logout/refresh operations
 * - Auth ViewModel for UI state management
 *
 * Note: [TokenStorage] is provided by platform-specific modules
 * (Android: EncryptedSharedPreferences, iOS: Keychain)
 */
val authModule = module {
    // Token provider - manages authentication tokens and refresh logic
    // Uses lazy injection for AuthRepository to avoid circular dependency
    single {
        AuthTokenProviderImpl(
            tokenStorage = get(),
            authRepositoryProvider = { get<AuthRepository>() },
            localeProvider = {
                // Get locale from LocaleStore if available
                getOrNull<LocaleStore>()?.locale?.value ?: "en"
            }
        )
    }

    // Auth repository for authentication operations
    single<AuthRepository> {
        AuthRepositoryImpl(
            apiClient = get(),
            tokenStorage = get(),
            json = get()
        )
    }

    // Auth ViewModel
    viewModelOf(::AuthViewModel)
}
