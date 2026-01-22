package com.liyaqa.member.di

import com.liyaqa.member.data.api.ApiClient
import com.liyaqa.member.data.api.ApiClientConfig
import com.liyaqa.member.data.auth.storage.TokenStorage
import org.koin.core.context.startKoin
import org.koin.dsl.module

/**
 * iOS-specific Koin module providing platform dependencies.
 *
 * Provides:
 * - [TokenStorage] using iOS Keychain for secure credential storage
 * - [ApiClientConfig] with localhost base URL for iOS simulator
 */
val platformModule = module {
    // Token storage using iOS Keychain for secure credential storage
    single {
        TokenStorage()
    }

    // Override API client config with iOS simulator URL
    single {
        ApiClientConfig(
            baseUrl = ApiClient.IOS_SIMULATOR_BASE_URL,
            enableLogging = true
        )
    }
}

/**
 * All modules for iOS app initialization.
 *
 * Combines shared modules with iOS-specific platform module.
 */
val appModules = sharedModules + platformModule

/**
 * Initialize Koin for iOS.
 *
 * Call this from Swift during app initialization, typically in
 * the AppDelegate or SwiftUI App struct.
 *
 * Usage in Swift:
 * ```swift
 * import shared
 *
 * @main
 * struct MyApp: App {
 *     init() {
 *         PlatformModuleKt.initKoin()
 *     }
 *
 *     var body: some Scene {
 *         WindowGroup {
 *             ContentView()
 *         }
 *     }
 * }
 * ```
 *
 * Or in AppDelegate:
 * ```swift
 * func application(
 *     _ application: UIApplication,
 *     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
 * ) -> Bool {
 *     PlatformModuleKt.initKoin()
 *     return true
 * }
 * ```
 */
fun initKoin() {
    startKoin {
        modules(appModules)
    }
}
