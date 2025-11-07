package com.liyaqa.liyaqa_internal_app.navigation

/**
 * Sealed class representing all navigation destinations in the app.
 * Follows type-safe navigation pattern.
 */
sealed class Screen(val route: String) {
    // Auth screens
    data object Login : Screen("login")
    data object Register : Screen("register")

    // Main screens
    data object Home : Screen("home")
    data object Dashboard : Screen("dashboard")

    // Employee Management
    data object EmployeeList : Screen("employees")
    data object EmployeeCreate : Screen("employees/create")
    data object EmployeeEdit : Screen("employees/{id}/edit") {
        fun createRoute(id: String) = "employees/$id/edit"
    }
    data object EmployeeDetail : Screen("employees/{id}") {
        fun createRoute(id: String) = "employees/$id"
    }

    // Tenant Management
    data object TenantList : Screen("tenants")
    data object TenantCreate : Screen("tenants/create")
    data object TenantEdit : Screen("tenants/{id}/edit") {
        fun createRoute(id: String) = "tenants/$id/edit"
    }
    data object TenantDetail : Screen("tenants/{id}") {
        fun createRoute(id: String) = "tenants/$id"
    }

    // Facility Management
    data object FacilityList : Screen("facilities")
    data object FacilityCreate : Screen("facilities/create")
    data object FacilityEdit : Screen("facilities/{id}/edit") {
        fun createRoute(id: String) = "facilities/$id/edit"
    }
    data object FacilityDetail : Screen("facilities/{id}") {
        fun createRoute(id: String) = "facilities/$id"
    }

    // Audit Logs
    data object AuditLogs : Screen("audit-logs")

    // Settings
    data object Settings : Screen("settings")
    data object Profile : Screen("profile")
}

/**
 * Navigation graph routes for feature modules
 */
object NavGraphs {
    const val AUTH = "auth_graph"
    const val MAIN = "main_graph"
    const val SETTINGS = "settings_graph"
}
