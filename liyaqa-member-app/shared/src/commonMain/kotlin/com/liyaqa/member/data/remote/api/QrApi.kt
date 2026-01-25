package com.liyaqa.member.data.remote.api

import com.liyaqa.member.domain.model.CheckInStatus
import com.liyaqa.member.domain.model.QrCheckInResult
import com.liyaqa.member.domain.model.QrCode
import com.liyaqa.member.domain.model.SelfCheckInRequest
import com.liyaqa.member.util.Result
import io.ktor.client.HttpClient
import io.ktor.util.reflect.typeInfo
import kotlinx.serialization.json.Json

class QrApi(
    client: HttpClient,
    json: Json
) : BaseApi(client, json) {

    suspend fun getPersonalQrCode(): Result<QrCode> =
        httpGet("/api/qr/me", typeInfo<QrCode>())

    suspend fun selfCheckIn(request: SelfCheckInRequest): Result<QrCheckInResult> =
        httpPost("/api/qr/self-check-in", typeInfo<QrCheckInResult>(), request)

    suspend fun getCheckInStatus(): Result<CheckInStatus> =
        httpGet("/api/prayer-times/check-in-status", typeInfo<CheckInStatus>())
}
