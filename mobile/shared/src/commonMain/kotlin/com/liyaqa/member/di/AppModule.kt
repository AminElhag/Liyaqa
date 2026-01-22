package com.liyaqa.member.di

import org.koin.core.module.Module

/**
 * App module configuration combining all shared Koin modules.
 *
 * Module Dependency Order:
 * 1. [networkModule] - JSON, HTTP client, API services (no dependencies)
 * 2. [authModule] - Token provider, auth repository (depends on networkModule)
 * 3. [dataModule] - All repositories (depends on networkModule)
 * 4. [navigationModule] - Locale store (no dependencies)
 * 5. [presentationModule] - All ViewModels (depends on dataModule, authModule)
 *
 * Platform-specific modules (Android/iOS) provide:
 * - [TokenStorage] implementation
 * - [ApiClientConfig] override with platform-appropriate base URL
 *
 * Usage:
 * - Android: Use [appModules] from PlatformModule.android.kt
 * - iOS: Use [appModules] from PlatformModule.ios.kt
 */

/**
 * All shared modules for the Liyaqa Member app.
 *
 * These modules contain cross-platform implementations.
 * Platform-specific dependencies are provided by [platformModule].
 */
val sharedModules: List<Module> = listOf(
    // Core infrastructure
    networkModule,      // JSON, HTTP client, API services

    // Authentication layer
    authModule,         // Token provider, auth repository, auth ViewModel

    // Data layer
    dataModule,         // All repository implementations

    // Navigation & UI infrastructure
    navigationModule,   // Locale store

    // Presentation layer
    presentationModule  // All feature ViewModels
)

/**
 * Extension to combine shared modules with platform module.
 *
 * @param platformModule The platform-specific Koin module
 * @return Complete list of all modules for app initialization
 */
fun getAppModules(platformModule: Module): List<Module> {
    return sharedModules + platformModule
}
