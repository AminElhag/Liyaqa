package com.liyaqa.staff.data.remote.api

import io.ktor.client.HttpClient
import io.ktor.client.plugins.HttpTimeout
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.defaultRequest
import io.ktor.client.plugins.logging.LogLevel
import io.ktor.client.plugins.logging.Logger
import io.ktor.client.plugins.logging.Logging
import io.ktor.client.request.header
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json

interface TokenProvider {
    suspend fun getAccessToken(): String?
    suspend fun refreshToken(): Boolean
}

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
    }

    fun create(): HttpClient = HttpClient {
        install(ContentNegotiation) {
            json(json)
        }

        install(HttpTimeout) {
            requestTimeoutMillis = 30_000
            connectTimeoutMillis = 15_000
            socketTimeoutMillis = 30_000
        }

        if (isDebug) {
            install(Logging) {
                level = LogLevel.ALL
                logger = object : Logger {
                    override fun log(message: String) {
                        println("HTTP: $message")
                    }
                }
            }
        }

        defaultRequest {
            url(baseUrl)
            contentType(ContentType.Application.Json)
        }
    }
}
