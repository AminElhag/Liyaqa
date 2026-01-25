package com.liyaqa.member.data.remote.api

import io.ktor.client.HttpClient
import io.ktor.client.plugins.HttpTimeout
import io.ktor.client.plugins.auth.Auth
import io.ktor.client.plugins.auth.providers.BearerTokens
import io.ktor.client.plugins.auth.providers.bearer
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.defaultRequest
import io.ktor.client.plugins.logging.LogLevel
import io.ktor.client.plugins.logging.Logger
import io.ktor.client.plugins.logging.Logging
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json

/**
 * Factory for creating configured HTTP clients
 */
class HttpClientFactory(
    private val tokenProvider: TokenProvider,
    private val baseUrl: String,
    private val isDebug: Boolean = false
) {
    val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
        prettyPrint = isDebug
        coerceInputValues = true
    }

    fun create(): HttpClient {
        return createPlatformHttpClient().config {
            // JSON Serialization
            install(ContentNegotiation) {
                json(json)
            }

            // Authentication with automatic token refresh
            install(Auth) {
                bearer {
                    loadTokens {
                        val accessToken = tokenProvider.getAccessToken()
                        val refreshToken = tokenProvider.getRefreshToken()
                        if (accessToken != null && refreshToken != null) {
                            BearerTokens(accessToken, refreshToken)
                        } else {
                            null
                        }
                    }

                    refreshTokens {
                        val result = tokenProvider.refreshTokens()
                        if (result != null) {
                            BearerTokens(result.accessToken, result.refreshToken)
                        } else {
                            null
                        }
                    }

                    sendWithoutRequest { request ->
                        // Don't send auth for login/register endpoints
                        !request.url.pathSegments.contains("login") &&
                        !request.url.pathSegments.contains("register") &&
                        !request.url.pathSegments.contains("refresh") &&
                        !request.url.pathSegments.contains("tenant-info")
                    }
                }
            }

            // Timeout configuration
            install(HttpTimeout) {
                requestTimeoutMillis = 30_000
                connectTimeoutMillis = 15_000
                socketTimeoutMillis = 30_000
            }

            // Logging in debug mode
            if (isDebug) {
                install(Logging) {
                    logger = object : Logger {
                        override fun log(message: String) {
                            println("HTTP: $message")
                        }
                    }
                    level = LogLevel.BODY
                }
            }

            // Default request configuration
            defaultRequest {
                url(baseUrl)
                contentType(ContentType.Application.Json)
            }
        }
    }
}

/**
 * Token provider interface for authentication
 */
interface TokenProvider {
    suspend fun getAccessToken(): String?
    suspend fun getRefreshToken(): String?
    suspend fun refreshTokens(): RefreshResult?
    suspend fun clearTokens()
}

/**
 * Result of token refresh
 */
data class RefreshResult(
    val accessToken: String,
    val refreshToken: String
)

/**
 * Platform-specific HTTP client creation
 */
expect fun createPlatformHttpClient(): HttpClient
