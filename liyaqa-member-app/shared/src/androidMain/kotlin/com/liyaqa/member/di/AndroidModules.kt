package com.liyaqa.member.di

import com.liyaqa.member.data.health.HealthDataManager
import com.liyaqa.member.data.local.DatabaseDriverFactory
import com.liyaqa.member.data.local.LiyaqaMemberDatabase
import com.liyaqa.member.data.local.TokenStorage
import org.koin.android.ext.koin.androidContext
import org.koin.core.module.Module
import org.koin.dsl.module

/**
 * Android-specific Koin modules
 */
val androidPlatformModule: Module = module {
    // Database
    single { DatabaseDriverFactory(androidContext()) }
    single { LiyaqaMemberDatabase(get<DatabaseDriverFactory>().createDriver()) }

    // Token Storage
    single { TokenStorage(androidContext()) }

    // Health Data Manager (Health Connect / Google Fit)
    single { HealthDataManager(androidContext()) }
}

/**
 * Returns all modules for Android
 */
fun getAndroidModules(): List<Module> = getCommonModules() + androidPlatformModule
