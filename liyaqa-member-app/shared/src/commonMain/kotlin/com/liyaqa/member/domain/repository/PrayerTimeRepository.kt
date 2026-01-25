package com.liyaqa.member.domain.repository

import com.liyaqa.member.domain.model.CheckInStatus
import com.liyaqa.member.domain.model.DailyPrayerTimes
import com.liyaqa.member.domain.model.NextPrayer
import com.liyaqa.member.util.Result
import kotlinx.coroutines.flow.Flow

/**
 * Repository for prayer time operations
 */
interface PrayerTimeRepository {
    /**
     * Get today's prayer times
     */
    suspend fun getTodayPrayerTimes(): Result<DailyPrayerTimes>

    /**
     * Get next prayer time (auto-updating)
     */
    fun getNextPrayer(): Flow<NextPrayer?>

    /**
     * Get check-in status (blocked during prayer)
     */
    suspend fun getCheckInStatus(): Result<CheckInStatus>
}
