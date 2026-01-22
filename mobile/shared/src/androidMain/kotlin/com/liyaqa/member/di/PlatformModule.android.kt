package com.liyaqa.member.di

import com.liyaqa.member.data.api.ApiClient
import com.liyaqa.member.data.api.ApiClientConfig
import com.liyaqa.member.data.auth.storage.TokenStorage
import org.koin.android.ext.koin.androidContext
import org.koin.dsl.module

/**
 * Android-specific Koin module providing platform dependencies.
 *
 * Provides:
 * - [TokenStorage] using Android's EncryptedSharedPreferences
 * - [ApiClientConfig] with Android emulator-friendly base URL (10.0.2.2)
 *
 * Note: 10.0.2.2 is the special IP address that routes to localhost
 * on the Android emulator's host machine.
 */
val platformModule = module {
    // Token storage using EncryptedSharedPreferences for secure credential storage
    single {
        TokenStorage(androidContext())
    }

    // Override API client config with Android emulator URL
    // 10.0.2.2 maps to localhost on the host machine
    single {
        ApiClientConfig(
            baseUrl = ApiClient.ANDROID_EMULATOR_BASE_URL,
            enableLogging = true
        )
    }
}

/**
 * All modules for Android app initialization.
 *
 * Combines shared modules with Android-specific platform module.
 * Use this in [Application.onCreate] with Koin's [startKoin].
 *
 * Usage:
 * ```kotlin
 * class MyApp : Application() {
 *     override fun onCreate() {
 *         super.onCreate()
 *         startKoin {
 *             androidLogger()
 *             androidContext(this@MyApp)
 *             modules(appModules)
 *         }
 *     }
 * }
 * ```
 */
val appModules = sharedModules + platformModule
