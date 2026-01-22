package com.liyaqa.member.data.api

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.ClientRequestException
import io.ktor.client.plugins.HttpTimeout
import io.ktor.client.plugins.ServerResponseException
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.defaultRequest
import io.ktor.client.plugins.logging.LogLevel
import io.ktor.client.plugins.logging.Logger
import io.ktor.client.plugins.logging.Logging
import io.ktor.client.request.HttpRequestBuilder
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.patch
import io.ktor.client.request.post
import io.ktor.client.request.put
import io.ktor.client.request.setBody
import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.contentType
import io.ktor.http.isSuccess
import io.ktor.serialization.kotlinx.json.json
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.serialization.json.Json

/**
 * Expect declaration for platform-specific HttpClient engine.
 * - Android: OkHttp engine
 * - iOS: Darwin engine
 */
expect fun createPlatformHttpClient(): HttpClient

/**
 * Configuration for the API client.
 */
data class ApiClientConfig(
    val baseUrl: String = "http://10.0.2.2:8080", // Android emulator localhost
    val connectTimeoutMs: Long = 30_000L,
    val requestTimeoutMs: Long = 60_000L,
    val socketTimeoutMs: Long = 60_000L,
    val enableLogging: Boolean = true
)

/**
 * Authentication token provider interface.
 * Implement this to provide access tokens for API requests.
 */
interface TokenProvider {
    /**
     * Returns the current access token, or null if not authenticated.
     */
    suspend fun getAccessToken(): String?

    /**
     * Returns the current tenant ID, or null if not set.
     */
    suspend fun getTenantId(): String?

    /**
     * Returns the current locale for Accept-Language header.
     */
    fun getLocale(): String

    /**
     * Called when an unauthorized (401) response is received.
     * Implementation should clear tokens and navigate to login.
     */
    suspend fun onUnauthorized()

    /**
     * Called when a forbidden (403) response is received.
     */
    suspend fun onForbidden()
}

/**
 * Event emitted when authentication state changes.
 */
sealed interface AuthEvent {
    object Unauthorized : AuthEvent
    object Forbidden : AuthEvent
    data class TokenRefreshed(val newToken: String) : AuthEvent
}

/**
 * Main API client factory and wrapper.
 * Provides configured HttpClient with authentication, error handling, and logging.
 */
class ApiClient(
    private val config: ApiClientConfig = ApiClientConfig(),
    private val tokenProvider: TokenProvider? = null
) {
    private val _authEvents = MutableSharedFlow<AuthEvent>()
    val authEvents: SharedFlow<AuthEvent> = _authEvents.asSharedFlow()

    /**
     * JSON configuration matching backend settings.
     */
    val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
        prettyPrint = false
        coerceInputValues = true
    }

    /**
     * Creates a configured HttpClient instance.
     */
    fun createHttpClient(): HttpClient {
        return createPlatformHttpClient().config {
            // JSON serialization
            install(ContentNegotiation) {
                json(json)
            }

            // Timeouts
            install(HttpTimeout) {
                connectTimeoutMillis = config.connectTimeoutMs
                requestTimeoutMillis = config.requestTimeoutMs
                socketTimeoutMillis = config.socketTimeoutMs
            }

            // Logging (only in debug builds)
            if (config.enableLogging) {
                install(Logging) {
                    logger = object : Logger {
                        override fun log(message: String) {
                            println("Ktor: $message")
                        }
                    }
                    level = LogLevel.INFO
                }
            }

            // Default request configuration
            defaultRequest {
                url(config.baseUrl)
                contentType(ContentType.Application.Json)
            }

            // Expect success to disable automatic exception throwing
            expectSuccess = false
        }
    }

    /**
     * Creates an HttpClient with authentication headers pre-configured.
     * Call this with pre-fetched tokens to avoid suspend calls in config block.
     */
    fun createAuthenticatedClient(
        accessToken: String?,
        tenantId: String?,
        locale: String
    ): HttpClient {
        return createPlatformHttpClient().config {
            // JSON serialization
            install(ContentNegotiation) {
                json(json)
            }

            // Timeouts
            install(HttpTimeout) {
                connectTimeoutMillis = config.connectTimeoutMs
                requestTimeoutMillis = config.requestTimeoutMs
                socketTimeoutMillis = config.socketTimeoutMs
            }

            // Logging (only in debug builds)
            if (config.enableLogging) {
                install(Logging) {
                    logger = object : Logger {
                        override fun log(message: String) {
                            println("Ktor: $message")
                        }
                    }
                    level = LogLevel.INFO
                }
            }

            // Default request configuration with auth headers
            defaultRequest {
                url(config.baseUrl)
                contentType(ContentType.Application.Json)

                // Add authorization header if token available
                accessToken?.let { token ->
                    header(HttpHeaders.Authorization, "Bearer $token")
                }

                // Add tenant header if available
                tenantId?.let { id ->
                    header("X-Tenant-ID", id)
                }

                // Add locale header
                header(HttpHeaders.AcceptLanguage, locale)
            }

            // Expect success to disable automatic exception throwing
            expectSuccess = false
        }
    }

    /**
     * Creates an authenticated HttpClient by fetching tokens from the provider.
     */
    suspend fun createAuthenticatedClient(): HttpClient {
        val accessToken = tokenProvider?.getAccessToken()
        val tenantId = tokenProvider?.getTenantId()
        val locale = tokenProvider?.getLocale() ?: "en"
        return createAuthenticatedClient(accessToken, tenantId, locale)
    }

    /**
     * Executes a GET request and returns ApiResult.
     */
    suspend inline fun <reified T> get(
        client: HttpClient,
        urlString: String,
        noinline block: HttpRequestBuilder.() -> Unit = {}
    ): ApiResult<T> = safeApiCall {
        client.get(urlString, block)
    }

    /**
     * Executes a POST request and returns ApiResult.
     */
    suspend inline fun <reified T> post(
        client: HttpClient,
        urlString: String,
        body: Any? = null,
        noinline block: HttpRequestBuilder.() -> Unit = {}
    ): ApiResult<T> = safeApiCall {
        client.post(urlString) {
            body?.let { setBody(it) }
            block()
        }
    }

    /**
     * Executes a PUT request and returns ApiResult.
     */
    suspend inline fun <reified T> put(
        client: HttpClient,
        urlString: String,
        body: Any? = null,
        noinline block: HttpRequestBuilder.() -> Unit = {}
    ): ApiResult<T> = safeApiCall {
        client.put(urlString) {
            body?.let { setBody(it) }
            block()
        }
    }

    /**
     * Executes a PATCH request and returns ApiResult.
     */
    suspend inline fun <reified T> patch(
        client: HttpClient,
        urlString: String,
        body: Any? = null,
        noinline block: HttpRequestBuilder.() -> Unit = {}
    ): ApiResult<T> = safeApiCall {
        client.patch(urlString) {
            body?.let { setBody(it) }
            block()
        }
    }

    /**
     * Executes a DELETE request and returns ApiResult.
     */
    suspend inline fun <reified T> delete(
        client: HttpClient,
        urlString: String,
        noinline block: HttpRequestBuilder.() -> Unit = {}
    ): ApiResult<T> = safeApiCall {
        client.delete(urlString, block)
    }

    /**
     * Wraps API calls with error handling.
     */
    suspend inline fun <reified T> safeApiCall(
        crossinline call: suspend () -> HttpResponse
    ): ApiResult<T> {
        return try {
            val response = call()
            handleResponse(response)
        } catch (e: ClientRequestException) {
            handleHttpError(e.response)
        } catch (e: ServerResponseException) {
            handleHttpError(e.response)
        } catch (e: Exception) {
            ApiResult.networkError(e)
        }
    }

    /**
     * Handles successful and error HTTP responses.
     */
    suspend inline fun <reified T> handleResponse(response: HttpResponse): ApiResult<T> {
        return when {
            response.status.isSuccess() -> {
                try {
                    val body: T = response.body()
                    ApiResult.success(body)
                } catch (e: Exception) {
                    ApiResult.error(
                        code = response.status.value,
                        message = "Failed to parse response: ${e.message}"
                    )
                }
            }
            else -> handleHttpError(response)
        }
    }

    /**
     * Handles HTTP error responses.
     */
    suspend fun <T> handleHttpError(response: HttpResponse): ApiResult<T> {
        val statusCode = response.status.value
        val errorBody = try {
            response.bodyAsText()
        } catch (e: Exception) {
            null
        }

        // Parse error message from response body if possible
        val errorMessage = try {
            errorBody?.let {
                json.decodeFromString<ApiErrorResponse>(it).message
            } ?: response.status.description
        } catch (e: Exception) {
            getDefaultErrorMessage(statusCode)
        }

        // Handle specific status codes
        when (statusCode) {
            HttpStatusCode.UNAUTHORIZED -> {
                tokenProvider?.onUnauthorized()
                _authEvents.tryEmit(AuthEvent.Unauthorized)
            }
            HttpStatusCode.FORBIDDEN -> {
                tokenProvider?.onForbidden()
                _authEvents.tryEmit(AuthEvent.Forbidden)
            }
        }

        return ApiResult.error(
            code = statusCode,
            message = errorMessage,
            errorBody = errorBody
        )
    }

    /**
     * Returns a default error message for common HTTP status codes.
     */
    fun getDefaultErrorMessage(statusCode: Int): String {
        return when (statusCode) {
            HttpStatusCode.BAD_REQUEST -> "Invalid request"
            HttpStatusCode.UNAUTHORIZED -> "Session expired. Please login again."
            HttpStatusCode.FORBIDDEN -> "You don't have permission for this action."
            HttpStatusCode.NOT_FOUND -> "Resource not found"
            HttpStatusCode.CONFLICT -> "Request conflicts with current state"
            HttpStatusCode.UNPROCESSABLE_ENTITY -> "Validation failed"
            HttpStatusCode.TOO_MANY_REQUESTS -> "Too many requests. Please try again later."
            HttpStatusCode.INTERNAL_SERVER_ERROR -> "Server error. Please try again later."
            HttpStatusCode.BAD_GATEWAY -> "Server temporarily unavailable"
            HttpStatusCode.SERVICE_UNAVAILABLE -> "Service unavailable. Please try again later."
            HttpStatusCode.GATEWAY_TIMEOUT -> "Request timed out"
            else -> "An error occurred (HTTP $statusCode)"
        }
    }

    companion object {
        /**
         * Default base URL (used when no platform override).
         * Set to Android emulator URL as fallback.
         */
        const val DEFAULT_BASE_URL = "http://10.0.2.2:8080"

        /**
         * Production base URL.
         */
        const val PRODUCTION_BASE_URL = "https://api.liyaqa.com"

        /**
         * Base URL for Android emulator (maps to host's localhost).
         */
        const val ANDROID_EMULATOR_BASE_URL = "http://10.0.2.2:8080"

        /**
         * Base URL for iOS simulator (localhost).
         */
        const val IOS_SIMULATOR_BASE_URL = "http://localhost:8080"
    }
}

/**
 * Extension function to execute requests with automatic authentication.
 */
suspend inline fun <reified T> ApiClient.authenticatedGet(
    urlString: String,
    noinline block: HttpRequestBuilder.() -> Unit = {}
): ApiResult<T> {
    val client = createAuthenticatedClient()
    return try {
        get(client, urlString, block)
    } finally {
        client.close()
    }
}

suspend inline fun <reified T> ApiClient.authenticatedPost(
    urlString: String,
    body: Any? = null,
    noinline block: HttpRequestBuilder.() -> Unit = {}
): ApiResult<T> {
    val client = createAuthenticatedClient()
    return try {
        post(client, urlString, body, block)
    } finally {
        client.close()
    }
}

suspend inline fun <reified T> ApiClient.authenticatedPut(
    urlString: String,
    body: Any? = null,
    noinline block: HttpRequestBuilder.() -> Unit = {}
): ApiResult<T> {
    val client = createAuthenticatedClient()
    return try {
        put(client, urlString, body, block)
    } finally {
        client.close()
    }
}

suspend inline fun <reified T> ApiClient.authenticatedPatch(
    urlString: String,
    body: Any? = null,
    noinline block: HttpRequestBuilder.() -> Unit = {}
): ApiResult<T> {
    val client = createAuthenticatedClient()
    return try {
        patch(client, urlString, body, block)
    } finally {
        client.close()
    }
}

suspend inline fun <reified T> ApiClient.authenticatedDelete(
    urlString: String,
    noinline block: HttpRequestBuilder.() -> Unit = {}
): ApiResult<T> {
    val client = createAuthenticatedClient()
    return try {
        delete(client, urlString, block)
    } finally {
        client.close()
    }
}
