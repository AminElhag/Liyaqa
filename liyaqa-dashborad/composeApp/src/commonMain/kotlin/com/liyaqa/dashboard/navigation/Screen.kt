package com.liyaqa.dashboard.navigation

/**
 * Type-safe navigation routes for all screens in the app
 */
sealed class Screen(val route: String) {
    // Home
    data object Home : Screen("home")

    // Employee Management
    data object EmployeeList : Screen("employees")
    data object EmployeeDetail : Screen("employees/{id}") {
        fun createRoute(id: String) = "employees/$id"
    }
    data object EmployeeCreate : Screen("employees/create")

    // Member Management
    data object MemberList : Screen("members")
    data object MemberDetail : Screen("members/{id}") {
        fun createRoute(id: String) = "members/$id"
    }
    data object MemberCreate : Screen("members/create")
    data object MembershipPlans : Screen("memberships")

    // Booking Management
    data object BookingList : Screen("bookings")
    data object BookingDetail : Screen("bookings/{id}") {
        fun createRoute(id: String) = "bookings/$id"
    }
    data object BookingCreate : Screen("bookings/create")
    data object BookingCalendar : Screen("bookings/calendar")

    // Trainer Management
    data object TrainerList : Screen("trainers")
    data object TrainerDetail : Screen("trainers/{id}") {
        fun createRoute(id: String) = "trainers/$id"
    }
    data object TrainerCreate : Screen("trainers/create")
    data object TrainerBookings : Screen("trainer-bookings")

    // Settings
    data object Settings : Screen("settings")
}
