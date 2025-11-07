package com.liyaqa.dashboard.core.di

import org.koin.core.module.Module

/**
 * All Koin modules for facility dashboard app
 */
object AppModules {
    fun getAll(): List<Module> = listOf(
        networkModule,
        authModule,
        employeeModule,
        memberModule,
        bookingModule,
        trainerModule
    )
}
