package com.liyaqa.staff.domain.repository

import com.liyaqa.staff.domain.model.LoginResponse
import com.liyaqa.staff.domain.model.StaffProfile
import com.liyaqa.staff.util.Result
import kotlinx.coroutines.flow.Flow

interface AuthRepository {
    suspend fun login(email: String, password: String, tenantId: String?): Result<LoginResponse>
    suspend fun logout()
    suspend fun refreshToken(): Result<Unit>
    fun isLoggedIn(): Flow<Boolean>
    fun getStaffProfile(): Flow<StaffProfile?>
    suspend fun getAccessToken(): String?
}
