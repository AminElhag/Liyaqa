package com.liyaqa.dashboard.features.trainer.data.repository

import com.liyaqa.dashboard.core.data.BaseRepository
import com.liyaqa.dashboard.core.domain.Result
import com.liyaqa.dashboard.core.domain.map
import com.liyaqa.dashboard.core.network.NetworkConfig
import com.liyaqa.dashboard.features.trainer.data.dto.*
import com.liyaqa.dashboard.features.trainer.domain.model.Trainer
import com.liyaqa.dashboard.features.trainer.domain.model.TrainerBooking
import io.ktor.client.HttpClient

/**
 * Repository for trainer operations
 */
class TrainerRepository(
    httpClient: HttpClient
) : BaseRepository(httpClient) {

    // Trainer Operations
    suspend fun getTrainers(
        page: Int = 0,
        size: Int = 20,
        status: String? = null,
        specialization: String? = null
    ): Result<TrainerPageResponse> {
        val params = buildMap {
            put("page", page.toString())
            put("size", size.toString())
            status?.let { put("status", it) }
            specialization?.let { put("specialization", it) }
        }
        return get(NetworkConfig.Endpoints.TRAINERS, params)
    }

    suspend fun getTrainerById(id: String): Result<Trainer> {
        return get<TrainerDto>("${NetworkConfig.Endpoints.TRAINERS}/$id")
            .map { it.toDomain() }
    }

    suspend fun createTrainer(request: CreateTrainerRequest): Result<Trainer> {
        return post<TrainerDto, CreateTrainerRequest>(
            NetworkConfig.Endpoints.TRAINERS,
            request
        ).map { it.toDomain() }
    }

    suspend fun deleteTrainer(id: String): Result<Unit> {
        return delete("${NetworkConfig.Endpoints.TRAINERS}/$id")
    }

    // Trainer Booking Operations
    suspend fun getTrainerBookings(
        page: Int = 0,
        size: Int = 20,
        trainerId: String? = null,
        status: String? = null,
        date: String? = null
    ): Result<TrainerBookingPageResponse> {
        val params = buildMap {
            put("page", page.toString())
            put("size", size.toString())
            trainerId?.let { put("trainerId", it) }
            status?.let { put("status", it) }
            date?.let { put("date", it) }
        }
        return get(NetworkConfig.Endpoints.TRAINER_BOOKINGS, params)
    }

    suspend fun createTrainerBooking(request: CreateTrainerBookingRequest): Result<TrainerBooking> {
        return post<TrainerBookingDto, CreateTrainerBookingRequest>(
            NetworkConfig.Endpoints.TRAINER_BOOKINGS,
            request
        ).map { it.toDomain() }
    }

    suspend fun cancelTrainerBooking(id: String): Result<TrainerBooking> {
        return post<TrainerBookingDto, Unit>(
            "${NetworkConfig.Endpoints.TRAINER_BOOKINGS}/$id/cancel",
            Unit
        ).map { it.toDomain() }
    }

    // Review Operations
    suspend fun getTrainerReviews(
        trainerId: String,
        page: Int = 0,
        size: Int = 20
    ): Result<TrainerReviewPageResponse> {
        val params = mapOf(
            "page" to page.toString(),
            "size" to size.toString()
        )
        return get("${NetworkConfig.Endpoints.TRAINERS}/$trainerId/reviews", params)
    }
}
