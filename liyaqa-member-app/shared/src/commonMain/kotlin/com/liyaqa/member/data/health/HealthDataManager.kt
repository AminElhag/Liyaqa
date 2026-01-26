package com.liyaqa.member.data.health

import kotlinx.coroutines.flow.Flow

/**
 * Platform-specific health data manager
 *
 * - Android: Uses Health Connect (Google Fit successor)
 * - iOS: Uses HealthKit
 *
 * This is an expect class with actual implementations in androidMain and iosMain
 */
expect class HealthDataManager {
    /**
     * Check if the health platform is available on this device
     */
    fun isAvailable(): Boolean

    /**
     * Get the platform name (GOOGLE_FIT or APPLE_HEALTH)
     */
    fun getPlatformName(): String

    /**
     * Get the display name for the platform
     */
    fun getDisplayName(): String

    /**
     * Check if we have permissions to read health data
     */
    suspend fun hasPermissions(): Boolean

    /**
     * Request permissions to read health data
     * Returns the result of the permission request
     */
    suspend fun requestPermissions(): HealthPermissionResult

    /**
     * Open the device health app settings
     */
    fun openHealthSettings()

    /**
     * Get the platform status (availability and permissions)
     */
    suspend fun getPlatformStatus(): HealthPlatformStatus

    /**
     * Read daily activities for a date range
     * @param startDate Start date in YYYY-MM-DD format
     * @param endDate End date in YYYY-MM-DD format
     */
    suspend fun readDailyActivities(startDate: String, endDate: String): List<HealthDailyActivity>

    /**
     * Read workouts for a date range
     * @param startDate Start date in YYYY-MM-DD format
     * @param endDate End date in YYYY-MM-DD format
     */
    suspend fun readWorkouts(startDate: String, endDate: String): List<HealthWorkout>

    /**
     * Read today's step count
     */
    suspend fun readTodaySteps(): Int

    /**
     * Observe today's step count as a Flow
     * Updates every time new step data is recorded
     */
    fun observeTodaySteps(): Flow<Int>
}
