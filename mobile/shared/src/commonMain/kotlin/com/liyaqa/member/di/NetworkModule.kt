package com.liyaqa.member.di

import com.liyaqa.member.data.api.ApiClient
import com.liyaqa.member.data.api.ApiClientConfig
import com.liyaqa.member.data.api.MemberApiService
import com.liyaqa.member.data.auth.AuthTokenProviderImpl
import kotlinx.serialization.json.Json
import org.koin.dsl.module

/**
 * Koin module providing network layer dependencies.
 *
 * Includes:
 * - JSON serialization configuration
 * - HTTP client configuration
 * - API client with token provider
 * - Member API service
 *
 * Note: Platform-specific modules override [ApiClientConfig] with
 * appropriate base URLs for Android emulator or iOS simulator.
 */
val networkModule = module {
    // JSON serialization configuration
    single {
        Json {
            ignoreUnknownKeys = true
            isLenient = true
            encodeDefaults = true
            prettyPrint = false
            coerceInputValues = true
        }
    }

    // Default API client configuration
    // This is overridden by platform-specific modules
    single {
        ApiClientConfig(
            baseUrl = ApiClient.DEFAULT_BASE_URL,
            enableLogging = true
        )
    }

    // API client with authentication support
    single {
        ApiClient(
            config = get(),
            tokenProvider = get<AuthTokenProviderImpl>()
        )
    }

    // Member API service for all member-facing endpoints
    single { MemberApiService(get()) }
}
