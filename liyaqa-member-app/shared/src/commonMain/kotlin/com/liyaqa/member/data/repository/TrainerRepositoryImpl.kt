package com.liyaqa.member.data.repository

import com.liyaqa.member.data.remote.api.TrainerApi
import com.liyaqa.member.domain.model.PTBookingRequest
import com.liyaqa.member.domain.model.PTSession
import com.liyaqa.member.domain.model.Trainer
import com.liyaqa.member.domain.model.TrainerAvailability
import com.liyaqa.member.domain.repository.TrainerRepository
import com.liyaqa.member.util.Result
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

class TrainerRepositoryImpl(
    private val trainerApi: TrainerApi
) : TrainerRepository {

    // Cache for trainers list
    private var cachedTrainers: List<Trainer>? = null

    // Cache for upcoming PT sessions
    private var cachedSessions: List<PTSession>? = null

    override suspend fun getTrainers(): Result<List<Trainer>> {
        // Return cached if available
        cachedTrainers?.let {
            return Result.success(it)
        }

        return trainerApi.getTrainers().onSuccess { trainers ->
            cachedTrainers = trainers
        }
    }

    override suspend fun getTrainer(trainerId: String): Result<Trainer> {
        // Check cache first
        cachedTrainers?.find { it.id == trainerId }?.let {
            return Result.success(it)
        }

        return trainerApi.getTrainer(trainerId)
    }

    override suspend fun getTrainerAvailability(
        trainerId: String,
        date: String
    ): Result<TrainerAvailability> {
        return trainerApi.getTrainerAvailability(trainerId, date)
    }

    override suspend fun bookPTSession(request: PTBookingRequest): Result<PTSession> {
        return trainerApi.bookPTSession(request).onSuccess { session ->
            // Add to cached sessions
            val currentSessions = cachedSessions?.toMutableList() ?: mutableListOf()
            currentSessions.add(0, session)
            cachedSessions = currentSessions
        }
    }

    override fun getUpcomingPTSessions(): Flow<Result<List<PTSession>>> = flow {
        // Emit cached data if available
        cachedSessions?.let {
            emit(Result.success(it))
        }

        // Fetch fresh data
        trainerApi.getUpcomingPTSessions()
            .onSuccess { sessions ->
                cachedSessions = sessions
                emit(Result.success(sessions))
            }
            .onError { error ->
                if (cachedSessions == null) {
                    emit(Result.error(
                        exception = error.exception,
                        message = error.message,
                        messageAr = error.messageAr
                    ))
                }
            }
    }

    override suspend fun cancelPTSession(sessionId: String): Result<Unit> {
        return trainerApi.cancelPTSession(sessionId).onSuccess {
            // Remove from cached sessions
            cachedSessions = cachedSessions?.filter { it.id != sessionId }
        }
    }
}
