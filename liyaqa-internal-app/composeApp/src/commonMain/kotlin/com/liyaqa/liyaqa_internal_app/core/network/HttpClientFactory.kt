package com.liyaqa.liyaqa_internal_app.core.network

import io.ktor.client.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.auth.*
import io.ktor.client.plugins.auth.providers.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.logging.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json

/**
 * Factory for creating configured HttpClient instances.
 * Follows backend's configuration pattern with JWT auth support.
 */
class HttpClientFactory {

    fun create(
        tokenProvider: () -> String? = { null }
    ): HttpClient {
        return HttpClient {
            // JSON serialization
            install(ContentNegotiation) {
                json(Json {
                    prettyPrint = true
                    isLenient = true
                    ignoreUnknownKeys = true
                    encodeDefaults = true
                })
            }

            // Logging
            install(Logging) {
                logger = Logger.DEFAULT
                level = LogLevel.INFO
                filter { request ->
                    request.url.host.contains("liyaqa")
                }
            }

            // Timeouts
            install(HttpTimeout) {
                requestTimeoutMillis = NetworkConfig.READ_TIMEOUT
                connectTimeoutMillis = NetworkConfig.CONNECT_TIMEOUT
                socketTimeoutMillis = NetworkConfig.READ_TIMEOUT
            }

            // Default request configuration
            install(DefaultRequest) {
                url(NetworkConfig.BASE_URL)
                headers.append(NetworkConfig.Headers.CONTENT_TYPE, "application/json")
                headers.append(NetworkConfig.Headers.ACCEPT, "application/json")
            }

            // Auth - JWT Bearer token
            install(Auth) {
                bearer {
                    loadTokens {
                        tokenProvider()?.let { token ->
                            BearerTokens(accessToken = token, refreshToken = "")
                        }
                    }

                    refreshTokens {
                        // TODO: Implement token refresh logic
                        null
                    }
                }
            }

            // Retry on failure
            install(HttpRequestRetry) {
                retryOnServerErrors(maxRetries = 3)
                exponentialDelay()
            }
        }
    }
}
