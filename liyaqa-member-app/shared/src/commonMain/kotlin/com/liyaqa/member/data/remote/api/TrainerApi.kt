package com.liyaqa.member.data.remote.api

import com.liyaqa.member.domain.model.PTBookingRequest
import com.liyaqa.member.domain.model.PTSession
import com.liyaqa.member.domain.model.Trainer
import com.liyaqa.member.domain.model.TrainerAvailability
import com.liyaqa.member.util.Result
import io.ktor.client.HttpClient
import io.ktor.client.request.parameter
import io.ktor.util.reflect.typeInfo
import kotlinx.serialization.json.Json

class TrainerApi(
    client: HttpClient,
    json: Json
) : BaseApi(client, json) {

    suspend fun getTrainers(): Result<List<Trainer>> =
        httpGet("/api/trainers/personal-trainers", typeInfo<List<Trainer>>())

    suspend fun getTrainer(trainerId: String): Result<Trainer> =
        httpGet("/api/trainers/$trainerId", typeInfo<Trainer>())

    suspend fun getTrainerAvailability(trainerId: String, date: String): Result<TrainerAvailability> =
        httpGet("/api/trainers/$trainerId/availability", typeInfo<TrainerAvailability>()) {
            parameter("date", date)
        }

    suspend fun bookPTSession(request: PTBookingRequest): Result<PTSession> =
        httpPost("/api/pt-sessions", typeInfo<PTSession>(), request)

    suspend fun getUpcomingPTSessions(): Result<List<PTSession>> =
        httpGet("/api/pt-sessions/member/upcoming", typeInfo<List<PTSession>>())

    suspend fun cancelPTSession(sessionId: String): Result<Unit> =
        postUnit("/api/pt-sessions/$sessionId/cancel")
}
