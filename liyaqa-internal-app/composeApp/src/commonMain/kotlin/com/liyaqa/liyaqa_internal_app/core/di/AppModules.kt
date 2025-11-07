package com.liyaqa.liyaqa_internal_app.core.di

import org.koin.core.module.Module

/**
 * List of all Koin modules in the app.
 * Organized by feature following backend's pattern.
 */
object AppModules {
    /**
     * Get all modules for the application
     */
    fun getAll(): List<Module> = listOf(
        networkModule,
        authModule,
        employeeModule,
        tenantModule,
        facilityModule,
        auditModule,
        systemModule
    )
}
