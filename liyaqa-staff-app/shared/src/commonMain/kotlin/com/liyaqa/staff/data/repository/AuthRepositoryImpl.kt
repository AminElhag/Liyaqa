package com.liyaqa.staff.data.repository

import com.liyaqa.staff.data.local.TokenStorage
import com.liyaqa.staff.data.remote.api.StaffApi
import com.liyaqa.staff.data.remote.api.TokenProvider
import com.liyaqa.staff.domain.model.LoginRequest
import com.liyaqa.staff.domain.model.LoginResponse
import com.liyaqa.staff.domain.model.RefreshTokenRequest
import com.liyaqa.staff.domain.model.StaffProfile
import com.liyaqa.staff.domain.repository.AuthRepository
import com.liyaqa.staff.util.Result
import kotlinx.coroutines.flow.Flow

class AuthRepositoryImpl(
    private val api: StaffApi,
    private val tokenStorage: TokenStorage
) : AuthRepository, TokenProvider {

    override suspend fun login(email: String, password: String, tenantId: String?): Result<LoginResponse> {
        return try {
            val response = api.login(LoginRequest(email, password, tenantId))
            tokenStorage.saveTokens(
                accessToken = response.accessToken,
                refreshToken = response.refreshToken,
                expiresIn = response.expiresIn
            )
            tokenStorage.saveStaffProfile(response.staffProfile)
            Result.Success(response)
        } catch (e: Exception) {
            Result.Error(e)
        }
    }

    override suspend fun logout() {
        tokenStorage.clearTokens()
    }

    override suspend fun refreshToken(): Result<Unit> {
        return try {
            val refreshToken = tokenStorage.getRefreshToken()
                ?: return Result.Error(Exception("No refresh token"))

            val response = api.refreshToken(RefreshTokenRequest(refreshToken))
            tokenStorage.saveTokens(
                accessToken = response.accessToken,
                refreshToken = response.refreshToken,
                expiresIn = response.expiresIn
            )
            Result.Success(Unit)
        } catch (e: Exception) {
            tokenStorage.clearTokens()
            Result.Error(e)
        }
    }

    override fun isLoggedIn(): Flow<Boolean> = tokenStorage.isLoggedIn()

    override fun getStaffProfile(): Flow<StaffProfile?> = tokenStorage.observeStaffProfile()

    override suspend fun getAccessToken(): String? = tokenStorage.getAccessToken()

    // TokenProvider implementation
    override suspend fun refreshToken(): Boolean {
        return refreshToken().isSuccess
    }
}
