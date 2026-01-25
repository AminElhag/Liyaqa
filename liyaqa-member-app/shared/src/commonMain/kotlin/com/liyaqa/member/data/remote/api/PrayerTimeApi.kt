package com.liyaqa.member.data.remote.api

import com.liyaqa.member.domain.model.CheckInStatus
import com.liyaqa.member.domain.model.DailyPrayerTimes
import com.liyaqa.member.domain.model.NextPrayer
import com.liyaqa.member.util.Result
import io.ktor.client.HttpClient
import io.ktor.util.reflect.typeInfo
import kotlinx.serialization.json.Json

class PrayerTimeApi(
    client: HttpClient,
    json: Json
) : BaseApi(client, json) {

    suspend fun getTodayPrayerTimes(): Result<DailyPrayerTimes> =
        httpGet("/api/prayer-times/today", typeInfo<DailyPrayerTimes>())

    suspend fun getNextPrayer(): Result<NextPrayer> =
        httpGet("/api/prayer-times/next", typeInfo<NextPrayer>())

    suspend fun getCheckInStatus(): Result<CheckInStatus> =
        httpGet("/api/prayer-times/check-in-status", typeInfo<CheckInStatus>())
}
