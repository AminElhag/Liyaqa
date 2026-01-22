package com.liyaqa.member.data.repository

import com.liyaqa.member.data.api.MemberApiService
import com.liyaqa.member.data.api.toResult
import com.liyaqa.member.data.dto.ChangePasswordRequestDto
import com.liyaqa.member.data.mapper.createUpdateProfileRequest
import com.liyaqa.member.data.mapper.toDomain
import com.liyaqa.member.domain.model.Address
import com.liyaqa.member.domain.model.EmergencyContact
import com.liyaqa.member.domain.model.Member
import com.liyaqa.member.domain.repository.ProfileRepository

/**
 * Implementation of ProfileRepository using MemberApiService.
 * Includes in-memory caching for profile data.
 */
class ProfileRepositoryImpl(
    private val api: MemberApiService
) : ProfileRepository {

    private var cachedProfile: Member? = null

    override suspend fun getProfile(): Result<Member> {
        return api.getProfile().toResult { dto ->
            dto.toDomain().also { cachedProfile = it }
        }
    }

    override suspend fun updateProfile(
        firstName: String?,
        lastName: String?,
        phone: String?,
        dateOfBirth: String?,
        address: Address?,
        emergencyContact: EmergencyContact?
    ): Result<Member> {
        val request = createUpdateProfileRequest(
            firstName = firstName,
            lastName = lastName,
            phone = phone,
            dateOfBirth = dateOfBirth,
            address = address,
            emergencyContact = emergencyContact
        )
        return api.updateProfile(request).toResult { dto ->
            dto.toDomain().also { cachedProfile = it }
        }
    }

    override suspend fun changePassword(
        currentPassword: String,
        newPassword: String
    ): Result<Unit> {
        return api.changePassword(
            ChangePasswordRequestDto(
                currentPassword = currentPassword,
                newPassword = newPassword
            )
        ).toResult { }
    }

    override fun getCachedProfile(): Member? = cachedProfile

    override suspend fun clearCache() {
        cachedProfile = null
    }
}
