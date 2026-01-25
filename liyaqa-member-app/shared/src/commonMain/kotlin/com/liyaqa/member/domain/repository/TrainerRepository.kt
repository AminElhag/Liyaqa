package com.liyaqa.member.domain.repository

import com.liyaqa.member.domain.model.PTBookingRequest
import com.liyaqa.member.domain.model.PTSession
import com.liyaqa.member.domain.model.Trainer
import com.liyaqa.member.domain.model.TrainerAvailability
import com.liyaqa.member.util.Result
import kotlinx.coroutines.flow.Flow

/**
 * Repository for personal training operations
 */
interface TrainerRepository {
    /**
     * Get list of personal trainers
     */
    suspend fun getTrainers(): Result<List<Trainer>>

    /**
     * Get trainer details
     */
    suspend fun getTrainer(trainerId: String): Result<Trainer>

    /**
     * Get trainer availability
     */
    suspend fun getTrainerAvailability(
        trainerId: String,
        date: String
    ): Result<TrainerAvailability>

    /**
     * Book a PT session
     */
    suspend fun bookPTSession(request: PTBookingRequest): Result<PTSession>

    /**
     * Get upcoming PT sessions (offline-first)
     */
    fun getUpcomingPTSessions(): Flow<Result<List<PTSession>>>

    /**
     * Cancel a PT session
     */
    suspend fun cancelPTSession(sessionId: String): Result<Unit>
}
