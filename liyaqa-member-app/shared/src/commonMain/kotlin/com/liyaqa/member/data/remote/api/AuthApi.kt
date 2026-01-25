package com.liyaqa.member.data.remote.api

import com.liyaqa.member.domain.model.AuthResponse
import com.liyaqa.member.domain.model.ChangePasswordRequest
import com.liyaqa.member.domain.model.LoginRequest
import com.liyaqa.member.domain.model.RefreshTokenRequest
import com.liyaqa.member.domain.model.TenantInfo
import com.liyaqa.member.domain.model.User
import com.liyaqa.member.util.Result
import io.ktor.client.HttpClient
import io.ktor.client.request.parameter
import io.ktor.util.reflect.typeInfo
import kotlinx.serialization.json.Json

class AuthApi(
    client: HttpClient,
    json: Json
) : BaseApi(client, json) {

    suspend fun login(request: LoginRequest): Result<AuthResponse> =
        httpPost("/api/auth/login", typeInfo<AuthResponse>(), request)

    suspend fun getTenantInfo(subdomain: String? = null, tenantId: String? = null): Result<TenantInfo> =
        httpGet("/api/auth/tenant-info", typeInfo<TenantInfo>()) {
            subdomain?.let { parameter("subdomain", it) }
            tenantId?.let { parameter("tenantId", it) }
        }

    suspend fun refreshToken(request: RefreshTokenRequest): Result<AuthResponse> =
        httpPost("/api/auth/refresh", typeInfo<AuthResponse>(), request)

    suspend fun logout(): Result<Unit> =
        postUnit("/api/auth/logout")

    suspend fun logoutAll(): Result<Unit> =
        postUnit("/api/auth/logout-all")

    suspend fun getCurrentUser(): Result<User> =
        httpGet("/api/auth/me", typeInfo<User>())

    suspend fun changePassword(request: ChangePasswordRequest): Result<Unit> =
        postUnit("/api/auth/change-password", request)
}
