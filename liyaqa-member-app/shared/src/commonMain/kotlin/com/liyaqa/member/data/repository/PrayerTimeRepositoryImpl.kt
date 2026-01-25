package com.liyaqa.member.data.repository

import com.liyaqa.member.data.remote.api.PrayerTimeApi
import com.liyaqa.member.domain.model.CheckInStatus
import com.liyaqa.member.domain.model.DailyPrayerTimes
import com.liyaqa.member.domain.model.NextPrayer
import com.liyaqa.member.domain.repository.PrayerTimeRepository
import com.liyaqa.member.util.Result
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

class PrayerTimeRepositoryImpl(
    private val prayerTimeApi: PrayerTimeApi
) : PrayerTimeRepository {

    // Cache for prayer times
    private var cachedPrayerTimes: DailyPrayerTimes? = null
    private var cachedNextPrayer: NextPrayer? = null

    override suspend fun getTodayPrayerTimes(): Result<DailyPrayerTimes> {
        // Return cached if available
        cachedPrayerTimes?.let {
            return Result.success(it)
        }

        return prayerTimeApi.getTodayPrayerTimes().onSuccess { times ->
            cachedPrayerTimes = times
        }
    }

    override fun getNextPrayer(): Flow<NextPrayer?> = flow {
        // Emit cached immediately
        cachedNextPrayer?.let { emit(it) }

        // Keep updating every minute
        while (true) {
            prayerTimeApi.getNextPrayer()
                .onSuccess { prayer ->
                    cachedNextPrayer = prayer
                    emit(prayer)
                }

            // Wait 1 minute before next update
            delay(60_000)
        }
    }

    override suspend fun getCheckInStatus(): Result<CheckInStatus> {
        return prayerTimeApi.getCheckInStatus()
    }
}
