package com.liyaqa.member.data.remote.api

import com.liyaqa.member.domain.model.AppInit
import com.liyaqa.member.domain.model.DevicePlatform
import com.liyaqa.member.domain.model.DeviceTokenRequest
import com.liyaqa.member.domain.model.HomeDashboard
import com.liyaqa.member.domain.model.QuickStats
import com.liyaqa.member.domain.model.Session
import com.liyaqa.member.util.Result
import io.ktor.client.HttpClient
import io.ktor.client.request.parameter
import io.ktor.util.reflect.typeInfo
import kotlinx.serialization.json.Json

class MobileApi(
    client: HttpClient,
    json: Json
) : BaseApi(client, json) {

    suspend fun getHomeDashboard(): Result<HomeDashboard> =
        httpGet("/api/mobile/home", typeInfo<HomeDashboard>())

    suspend fun getQuickStats(): Result<QuickStats> =
        httpGet("/api/mobile/quick-stats", typeInfo<QuickStats>())

    suspend fun getAppInit(): Result<AppInit> =
        httpGet("/api/mobile/init", typeInfo<AppInit>())

    suspend fun getAvailableSessions(
        classId: String? = null,
        locationId: String? = null,
        days: Int = 7
    ): Result<List<Session>> =
        httpGet("/api/mobile/sessions/available", typeInfo<List<Session>>()) {
            classId?.let { parameter("classId", it) }
            locationId?.let { parameter("locationId", it) }
            parameter("days", days)
        }

    suspend fun registerDeviceToken(token: String, platform: DevicePlatform): Result<Unit> =
        postUnit("/api/mobile/device-tokens", DeviceTokenRequest(token, platform))

    suspend fun unregisterDeviceToken(token: String): Result<Unit> =
        deleteUnit("/api/mobile/device-tokens/$token")
}
