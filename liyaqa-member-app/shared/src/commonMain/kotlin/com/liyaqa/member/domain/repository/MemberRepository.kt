package com.liyaqa.member.domain.repository

import com.liyaqa.member.domain.model.Member
import com.liyaqa.member.domain.model.MySubscriptionResponse
import com.liyaqa.member.domain.model.UpdateProfileRequest
import com.liyaqa.member.util.Result
import kotlinx.coroutines.flow.Flow

/**
 * Repository for member profile and subscription operations
 */
interface MemberRepository {
    /**
     * Get member profile (offline-first)
     */
    fun getProfile(): Flow<Result<Member>>

    /**
     * Update member profile
     */
    suspend fun updateProfile(request: UpdateProfileRequest): Result<Member>

    /**
     * Get subscription status (offline-first)
     */
    fun getSubscription(): Flow<Result<MySubscriptionResponse>>

    /**
     * Force refresh profile from server
     */
    suspend fun refreshProfile(): Result<Member>

    /**
     * Force refresh subscription from server
     */
    suspend fun refreshSubscription(): Result<MySubscriptionResponse>
}
