package com.liyaqa.dashboard.core.network

/**
 * Network configuration for facility/gym dashboard
 *
 * NOTE: Update BASE_URL to point to your backend server.
 * For Android emulator testing, use: http://10.0.2.2:8080/api/v1
 * For iOS simulator testing, use: http://localhost:8080/api/v1
 * For physical devices, use your machine's IP address
 */
object NetworkConfig {
    const val BASE_URL = "http://10.0.2.2:8080/api/v1" // Android emulator default
    const val CONNECT_TIMEOUT = 30_000L
    const val READ_TIMEOUT = 30_000L
    const val WRITE_TIMEOUT = 30_000L

    // API Endpoints for facility module
    object Endpoints {
        // Auth
        const val AUTH_LOGIN = "/facility/auth/login"
        const val AUTH_LOGOUT = "/facility/auth/logout"
        const val AUTH_ME = "/facility/auth/me"

        // Facility Employees
        const val FACILITY_EMPLOYEES = "/facility/employees"

        // Members
        const val MEMBERS = "/facility/members"
        const val MEMBERSHIPS = "/facility/memberships"

        // Bookings
        const val BOOKINGS = "/facility/bookings"

        // Trainers
        const val TRAINERS = "/facility/trainers"
        const val TRAINER_BOOKINGS = "/facility/trainer-bookings"
    }

    object Headers {
        const val AUTHORIZATION = "Authorization"
        const val CONTENT_TYPE = "Content-Type"
        const val ACCEPT = "Accept"
        const val FACILITY_ID = "X-Facility-Id"
    }
}
