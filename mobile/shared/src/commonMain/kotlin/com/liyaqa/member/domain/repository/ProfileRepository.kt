package com.liyaqa.member.domain.repository

import com.liyaqa.member.domain.model.Address
import com.liyaqa.member.domain.model.EmergencyContact
import com.liyaqa.member.domain.model.Member

/**
 * Repository for member profile operations.
 * Provides profile data with caching support.
 */
interface ProfileRepository {

    /**
     * Fetches the current member's profile.
     * Result is cached for subsequent calls.
     */
    suspend fun getProfile(): Result<Member>

    /**
     * Updates the current member's profile.
     * Cache is updated with the new data on success.
     */
    suspend fun updateProfile(
        firstName: String? = null,
        lastName: String? = null,
        phone: String? = null,
        dateOfBirth: String? = null,
        address: Address? = null,
        emergencyContact: EmergencyContact? = null
    ): Result<Member>

    /**
     * Changes the current member's password.
     */
    suspend fun changePassword(
        currentPassword: String,
        newPassword: String
    ): Result<Unit>

    /**
     * Returns the cached profile if available.
     */
    fun getCachedProfile(): Member?

    /**
     * Clears the profile cache.
     */
    suspend fun clearCache()
}
