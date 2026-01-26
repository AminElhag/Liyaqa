package com.liyaqa.member.di

import com.liyaqa.member.data.health.HealthDataManager
import com.liyaqa.member.data.local.DatabaseDriverFactory
import com.liyaqa.member.data.local.LiyaqaMemberDatabase
import com.liyaqa.member.data.local.TokenStorage
import org.koin.core.module.Module
import org.koin.dsl.module

/**
 * iOS-specific Koin modules
 */
val iosPlatformModule: Module = module {
    // Database
    single { DatabaseDriverFactory() }
    single { LiyaqaMemberDatabase(get<DatabaseDriverFactory>().createDriver()) }

    // Token Storage
    single { TokenStorage() }

    // Health Data Manager (HealthKit)
    single { HealthDataManager() }
}

/**
 * Returns all modules for iOS
 */
fun getIosModules(): List<Module> = getCommonModules() + iosPlatformModule
